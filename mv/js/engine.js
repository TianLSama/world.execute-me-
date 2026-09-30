/* ============================================================
 * engine.js —— MV 引擎
 * 职责：画布与设计空间映射、rAF 主循环、音频时钟、场景调度、
 *       节拍/频段采样、歌词部件事件分发、全局后处理、HUD 与控件同步。
 * 场景通过 MV.registerScene(id, factory) 自注册，永不直接接触 audio。
 * ============================================================ */
window.MV = window.MV || {};

(function () {
  'use strict';

  var MV = window.MV;

  var Engine = MV.Engine = {
    canvas: null,
    ctx: null,
    audio: null,

    /* 画布与映射 */
    dpr: 1, pw: 0, ph: 0, scale: 1, ox: 0, oy: 0,

    /* 场景注册表 */
    _factories: {},
    _instances: {},
    _unsubs: {},
    _curIdx: -1,
    _curId: null,
    _curScene: null,

    /* 循环与时间 */
    _running: false,
    _raf: 0,
    _last: 0,
    _time: 0,
    _prevT: -1,
    _vT: 0,          /* 预览模式下的虚拟时钟增量 */

    /* 歌词部件事件 */
    _listeners: [],
    _partSIdx: -1,
    _partCursor: 0,

    _stars: null,
    _idleMs: 0,
    _errLogged: {},
    _uiTC: '',

    /* ---------------- 初始化 ---------------- */
    init: function (canvas, audio) {
      var self = this;
      this.canvas = canvas;
      this.audio = audio || null;
      this.ctx = canvas.getContext('2d', { alpha: false });
      this._boundFrame = this._frame.bind(this);

      /* 预览模式：URL 中带 ?t=12.3 或 #t=12.3 时使用虚拟时钟（无音频截图/调试用） */
      var m = /[?&#]t=([\d.]+)/.exec(location.search + location.hash);
      if (m) MV.forceTime = parseFloat(m[1]) || 0;

      this._stars = new MV.Stars(150);
      MV.FX.init(canvas);

      window.addEventListener('resize', function () { self._resize(); });
      this._resize();

      document.addEventListener('mousemove', function () {
        self._idleMs = 0;
        if (document.body) document.body.classList.remove('idle');
      });
      return this;
    },

    _resize: function () {
      var w = window.innerWidth || 1920;
      var h = window.innerHeight || 1080;
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.pw = Math.max(2, Math.round(w * this.dpr));
      this.ph = Math.max(2, Math.round(h * this.dpr));
      this.canvas.width = this.pw;
      this.canvas.height = this.ph;
      this.canvas.style.width = w + 'px';
      this.canvas.style.height = h + 'px';
      this.scale = Math.min(this.pw / MV.W, this.ph / MV.H);
      this.ox = (this.pw - MV.W * this.scale) * 0.5;
      this.oy = (this.ph - MV.H * this.scale) * 0.5;
      MV.FX.onResize(this.pw, this.ph, this.dpr);
    },

    /* ---------------- 对外 API ---------------- */
    registerScene: function (id, factory) {
      this._factories[id] = factory;
    },

    /* 订阅歌词部件事件；cb(sentence, partIndex, part, isNewSentence)，返回取消函数 */
    onPart: function (cb) {
      this._listeners.push(cb);
      var ls = this._listeners;
      return function () {
        var i = ls.indexOf(cb);
        if (i >= 0) ls.splice(i, 1);
      };
    },

    /* 唯一时间源：音频当前时间（预览模式下为虚拟时钟） */
    time: function () {
      if (MV.forceTime != null) return MV.forceTime + this._vT;
      return this.audio ? (this.audio.currentTime || 0) : 0;
    },

    paused: function () {
      if (MV.forceTime != null) return false;
      return this.audio ? this.audio.paused : true;
    },

    start: function () {
      if (this._running) return;
      this._running = true;
      this._last = (window.performance && performance.now) ? performance.now() : Date.now();
      this._raf = requestAnimationFrame(this._boundFrame);
    },

    toggle: function () {
      if (MV.forceTime != null || !this.audio) return;
      if (this.audio.paused) {
        var p = this.audio.play();
        if (p && p.catch) p.catch(function () {});
      } else {
        this.audio.pause();
      }
    },

    seek: function (t) {
      t = MV.clamp(t, 0, MV_DATA.duration - 0.02);
      if (MV.forceTime != null) {
        MV.forceTime = t;
        this._vT = 0;
      } else if (this.audio) {
        /* 部分静态服务器（如 python -m http.server）不支持 Range，
           媒体会变为不可寻址；此时忽略寻址，避免播放位置被重置到 0。 */
        var ok = true;
        try {
          var sk = this.audio.seekable;
          if (t > 0.05 && (!sk || sk.length === 0 || sk.end(0) < t - 0.5)) ok = false;
        } catch (e) { ok = false; }
        if (ok) {
          try { this.audio.currentTime = t; } catch (e2) { /* 忽略未就绪的寻址 */ }
        }
      }
      this._prevT = -1;
      this._partSIdx = -1; /* 寻址后重同步：已越过的部件不补发 */
    },

    /* ---------------- 场景调度 ---------------- */
    _updateScene: function (t) {
      var scenes = MV_DATA.scenes;
      var lo = 0, hi = scenes.length - 1, idx = 0;
      while (lo <= hi) {
        var mid = (lo + hi) >> 1;
        if (scenes[mid].t <= t) { idx = mid; lo = mid + 1; } else { hi = mid - 1; }
      }
      if (idx !== this._curIdx) this._setScene(idx, t);
    },

    _setScene: function (idx, t) {
      /* 退出旧场景并清理其部件监听 */
      if (this._curScene && this._curScene.exit) {
        try { this._curScene.exit(); } catch (e) { this._sceneError(e); }
      }
      if (this._curId && this._unsubs[this._curId]) {
        var us = this._unsubs[this._curId];
        for (var i = 0; i < us.length; i++) us[i]();
        us.length = 0;
      }

      this._curIdx = idx;
      var def = MV_DATA.scenes[idx];
      this._curId = def.id;

      var inst = this._instances[def.id];
      if (!inst) {
        var factory = this._factories[def.id];
        if (factory) {
          var self = this;
          var api = {
            id: def.id,
            t0: def.t,
            W: MV.W, H: MV.H, CX: MV.CX, CY: MV.CY,
            /* 场景专用订阅：退出时自动清理 */
            onPart: function (cb) {
              var u = self.onPart(cb);
              if (!self._unsubs[def.id]) self._unsubs[def.id] = [];
              self._unsubs[def.id].push(u);
              return u;
            }
          };
          try {
            inst = factory(api) || null;
          } catch (e) {
            inst = null;
            this._sceneError(e);
          }
          this._instances[def.id] = inst;
        }
      }
      this._curScene = inst;
      if (inst && inst.enter) {
        try { inst.enter(t); } catch (e) { this._sceneError(e); }
      }
      this._partSIdx = -1; /* 切场景时重同步部件游标 */
    },

    _sceneError: function (e) {
      var key = this._curId || 'unknown';
      if (!this._errLogged[key]) {
        this._errLogged[key] = 1;
        if (window.console && console.error) console.error('[MV] 场景 "' + key + '" 异常：', e);
      }
    },

    /* ---------------- 歌词部件事件 ---------------- */
    _processParts: function (t) {
      var S = MV_DATA.sentences;
      var si = -1;
      for (var i = S.length - 1; i >= 0; i--) {
        if (S[i].t <= t) { si = i; break; }
      }
      if (si < 0) return;
      var s = S[si];

      /* 跳转检测：首帧 / 向后跳 / 向前大幅跳 → 只重同步，不补发 */
      var seek = (this._prevT < 0) || (t < this._prevT - 0.05) || (t - this._prevT > 0.6);

      if (si !== this._partSIdx) {
        this._partSIdx = si;
        /* 以“上一帧时间”为界跳过已过期部件；跳转时以当前时间为界 */
        var ref = seek ? t : Math.min(this._prevT, t);
        var c = 0;
        while (c < s.parts.length && s.parts[c].t <= ref) c++;
        this._partCursor = c;
        if (seek) return;
      }
      var c2 = this._partCursor;
      while (c2 < s.parts.length && s.parts[c2].t <= t) {
        this._emit(s, c2, s.parts[c2], c2 === 0);
        c2++;
      }
      this._partCursor = c2;
    },

    _emit: function (s, i, part, isNew) {
      var ls = this._listeners;
      for (var k = 0; k < ls.length; k++) {
        try { ls[k](s, i, part, isNew); } catch (e) { this._sceneError(e); }
      }
    },

    /* ---------------- 主循环 ---------------- */
    _frame: function (ts) {
      if (!this._running) return;
      this._raf = requestAnimationFrame(this._boundFrame);

      var dt = (ts - this._last) / 1000;
      this._last = ts;
      if (!isFinite(dt) || dt < 0) dt = 0;
      if (dt > 0.1) dt = 0.1; /* 切后台恢复时避免大跳 */

      var force = (MV.forceTime != null);
      if (force) this._vT += dt;
      var t = this.time();
      this._time = t;

      var paused = this.paused();
      var adt = paused ? 0 : dt; /* 暂停时冻结一切积分 */

      var env = MV.envAt(t);
      var beat = MV.beatAt(t);

      try {
        /* 先切场景（让新场景的部件监听及时生效），再派发部件事件 */
        this._updateScene(t);
        if (!paused) this._processParts(t);

        this._stars.update(adt, env, beat);
        MV.FX.tick(adt);
        /* 歌词 DOM 层（时间驱动，寻址安全） */
        if (MV.Lyrics && MV.Lyrics.update) {
          try { MV.Lyrics.update(t); } catch (e) { this._sceneError(e); }
        }
        if (this._curScene && this._curScene.update) {
          try { this._curScene.update(t, adt, env, beat); } catch (e) { this._sceneError(e); }
        }

        /* ---- 绘制 ---- */
        var ctx = this.ctx;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = MV.C.bg;
        ctx.fillRect(0, 0, this.pw, this.ph);

        ctx.setTransform(this.scale, 0, 0, this.scale, this.ox, this.oy);
        ctx.save();
        MV.FX.apply(ctx, MV.CX, MV.CY);

        var meta = this._metaOf();
        this._stars.draw(ctx, t, env, beat, meta.stars);
        MV.drawGrid(ctx, t, env, beat, meta.grid);

        if (this._curScene && this._curScene.draw) {
          try { this._curScene.draw(ctx, t, env, beat); } catch (e) { this._sceneError(e); }
        }
        ctx.restore();

        MV.FX.post(ctx);
        this._drawTransition(ctx);
        this._drawHUD(ctx);
      } catch (e) {
        /* 顶层兜底：任何异常都不允许杀死循环 */
        this._sceneError(e);
      }

      this._prevT = t;
      this._updateUI(t, dt);
    },

    _metaOf: function () {
      var m = this._curScene && this._curScene.meta;
      return {
        stars: (m && m.stars != null) ? m.stars : 1,
        grid: (m && m.grid != null) ? m.grid : 0.08
      };
    },

    /* 场景切换黑场：进入 0.15s 淡入，切出前 0.12s 渐黑 */
    _drawTransition: function (ctx) {
      if (this._curIdx < 0) return;
      var scenes = MV_DATA.scenes;
      var st = scenes[this._curIdx].t;
      var nt = (this._curIdx + 1 < scenes.length) ? scenes[this._curIdx + 1].t : Infinity;
      var t = this._time;
      var aIn = MV.clamp((t - st) / 0.15, 0, 1);
      var aOut = (nt === Infinity) ? 1 : MV.clamp((nt - t) / 0.12, 0, 1);
      var a = 1 - Math.min(aIn, aOut);
      if (a > 0.004) {
        ctx.setTransform(this.scale, 0, 0, this.scale, this.ox, this.oy);
        ctx.save();
        ctx.globalAlpha = a;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, MV.W, MV.H);
        ctx.restore();
      }
    },

    /* 左上角“内存地址”风格读数（低调装饰） */
    _drawHUD: function (ctx) {
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.font = '22px ' + MV.FONT_MONO;
      ctx.fillStyle = MV.C.dim;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(MV.hexAddr(this._time), 24, 18);
      ctx.restore();
    },

    /* 底部控件同步（进度条 / 时间码 / 播放按钮） */
    _updateUI: function (t, dt) {
      var el = document.getElementById('progress-fill');
      if (el) {
        var k = MV.clamp(t / MV_DATA.duration, 0, 1);
        el.style.transform = 'scaleX(' + k.toFixed(4) + ')';
      }
      var tc = document.getElementById('timecode');
      if (tc) {
        var str = MV.fmtTime(t) + ' / ' + MV.fmtTime(MV_DATA.duration);
        if (str !== this._uiTC) { this._uiTC = str; tc.textContent = str; }
      }
      var btn = document.getElementById('btn-play');
      if (btn) {
        var ch = this.paused() ? '▶' : '❚❚';
        if (btn.textContent !== ch) btn.textContent = ch;
      }
      /* 鼠标静止 3 秒隐藏光标与控件 */
      this._idleMs += dt * 1000;
      if (this._idleMs > 3000 && document.body) document.body.classList.add('idle');
    }
  };

  /* 全局时间接口（场景统一使用） */
  MV.time = function () { return Engine._time; };

  /* 全局场景注册与部件订阅入口（场景脚本统一通过 MV.* 调用） */
  MV.registerScene = function (id, factory) { Engine.registerScene(id, factory); };
  MV.onPart = function (cb) { return Engine.onPart(cb); };

  /* 空闲时重置计时器（供 main.js 调用） */
  Engine.wake = function () { this._idleMs = 0; if (document.body) document.body.classList.remove('idle'); };
})();
