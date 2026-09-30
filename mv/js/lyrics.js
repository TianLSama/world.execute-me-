/* ============================================================
 * lyrics.js —— 歌词 DOM 叠加层
 * 类型处理：
 *   normal —— 底部歌词栏，部件渐进点亮（全大写词高亮青色）
 *   repeat —— 底部堆叠，新行把旧行顶起并漂散（falling）
 *   speech —— 屏幕中央打字机（带闪烁方块光标）
 *   chant  —— 每个部件触发红色巨词 + 全屏故障/闪红/震屏，不走歌词栏
 *   count  —— 中央逐个弹出数字词 + 白色圆环爆发
 *   final  —— 白色闪屏后红色巨词缓慢淡出至黑
 * 所有文字与弹出物均由音频时间驱动，天然支持暂停与寻址。
 * ============================================================ */
window.MV = window.MV || {};

(function () {
  'use strict';

  var MV = window.MV;

  var Lyrics = MV.Lyrics = {
    _sIdx: -1,
    _switchT: -100,
    _parts: [],        /* 普通歌词 {el, t} */
    _speech: null,     /* 打字机 {root, text, cursor} */
    _pops: {},         /* 中央弹出物 key -> {root, word, ring} */
    _repeatLines: [],  /* repeat 行 {el, t, idx} */
    _ready: false,

    init: function () {
      this.enEl = document.getElementById('lyric-en');
      this.zhEl = document.getElementById('lyric-zh');
      this.repeatEl = document.getElementById('repeat-layer');
      this.centerEl = document.getElementById('center-layer');
      this._ready = !!(this.enEl && this.zhEl && this.centerEl);
      var self = this;
      if (MV.Engine && MV.Engine.onPart) {
        MV.Engine.onPart(function (s, i, part, isNew) { self._onPart(s, i, part, isNew); });
      }
    },

    /* 部件事件：只负责“瞬时特效”，文字弹出由时间驱动（见 _updatePops） */
    _onPart: function (s, i, part, isNew) {
      if (s.type === 'chant') {
        MV.FX.glitch(0.65, 0.28);
        MV.FX.flash(MV.RGB.red, 0.38, 0.35);
        MV.FX.shake(16, 0.45);
      } else if (s.type === 'count') {
        if (part.en === 'EXECUTION') {
          MV.FX.flash(MV.RGB.white, 0.85, 0.5);
          MV.FX.shake(20, 0.5);
          MV.FX.glitch(0.5, 0.3);
        } else {
          MV.FX.flash(MV.RGB.white, 0.28, 0.28);
          MV.FX.shake(8, 0.3);
        }
      } else if (s.type === 'final') {
        MV.FX.flash(MV.RGB.white, 1.0, 0.9);
      }
    },

    /* 每帧更新（引擎调用），t 为音频时间 */
    update: function (t) {
      if (!this._ready) return;
      var S = MV_DATA.sentences;

      var si = -1;
      for (var i = S.length - 1; i >= 0; i--) {
        if (S[i].t <= t) { si = i; break; }
      }
      var s = (si >= 0) ? S[si] : null;

      if (si !== this._sIdx) {
        this._sIdx = si;
        this._switchT = t;
        this._build(s);
      }
      this._updatePops(t);
      if (!s) { this._hideBottom(); return; }

      /* 句子整体透明度：淡入 0.22s，结束后 0.12s 淡出 */
      var a = MV.clamp((t - this._switchT) / 0.22, 0, 1);
      var ended = t >= s.end;
      if (ended) a *= MV.clamp(1 - (t - s.end) / 0.12, 0, 1);
      if (s.type === 'final') a = 1; /* final 的文字在中央，由弹出物自行淡出 */

      this.enEl.style.opacity = a;
      this.zhEl.style.opacity = a;
      this.repeatEl.style.opacity = a;

      if (s.type === 'normal') this._updateNormal(t, s);
      else if (s.type === 'repeat') this._updateRepeat(t, s);
      else if (s.type === 'speech') this._updateSpeech(t, s);
    },

    /* ---------- 句子结构构建 ---------- */
    _build: function (s) {
      /* 清空底部区域与旧的中央打字机 */
      this.enEl.textContent = '';
      this.zhEl.textContent = '';
      this.repeatEl.textContent = '';
      this._parts = [];
      this._repeatLines = [];
      if (this._speech) {
        if (this._speech.root.parentNode) this._speech.root.parentNode.removeChild(this._speech.root);
        this._speech = null;
      }
      if (!s) return;

      if (s.type === 'normal') {
        for (var i = 0; i < s.parts.length; i++) {
          var p = s.parts[i];
          var d = document.createElement('div');
          d.className = 'lpart' + (MV.isCaps(p.en) ? ' caps' : '') +
            (p.en === 'EXECUTION' ? ' exec' : '') +
            (p.en === 'LO-O-OVE' ? ' love' : '');
          d.textContent = p.en;
          this.enEl.appendChild(d);
          this._parts.push({ el: d, t: p.t });
        }
        this.zhEl.textContent = s.zh;
      } else if (s.type === 'repeat') {
        this.zhEl.textContent = s.zh;
      } else if (s.type === 'speech') {
        var root = document.createElement('div');
        root.id = 'speech-line';
        var txt = document.createElement('span');
        txt.className = 'speech-text';
        var cur = document.createElement('span');
        cur.className = 'cursor-block';
        root.appendChild(txt);
        root.appendChild(cur);
        this.centerEl.appendChild(root);
        this._speech = { root: root, text: txt, cursor: cur };
      }
      /* chant / count / final：仅使用中央弹出物 */
    },

    _hideBottom: function () {
      this.enEl.style.opacity = 0;
      this.zhEl.style.opacity = 0;
      this.repeatEl.style.opacity = 0;
    },

    /* ---------- normal：部件渐进点亮 ---------- */
    _updateNormal: function (t, s) {
      var ps = this._parts;
      for (var i = 0; i < ps.length; i++) {
        var op = (ps[i].t <= t) ? '1' : '0.30';
        if (ps[i].el.style.opacity !== op) ps[i].el.style.opacity = op;
      }
    },

    /* ---------- repeat：堆叠 + 上推 + 漂散 ---------- */
    _updateRepeat: function (t, s) {
      /* 依据时间重建行列表（支持寻址） */
      var expected = 0;
      for (var i = 0; i < s.parts.length; i++) if (s.parts[i].t <= t) expected++;
      while (this._repeatLines.length > expected) {
        var last = this._repeatLines.pop();
        if (last.el.parentNode) last.el.parentNode.removeChild(last.el);
      }
      while (this._repeatLines.length < expected) {
        var idx = this._repeatLines.length;
        var el = document.createElement('div');
        el.className = 'rline';
        el.textContent = s.parts[idx].en;
        this.repeatEl.appendChild(el);
        this._repeatLines.push({ el: el, t: s.parts[idx].t, idx: idx });
      }
      /* 越新越靠下；旧行随年龄上浮、漂散、旋转、淡出 */
      var n = this._repeatLines.length;
      for (var k = 0; k < n; k++) {
        var L = this._repeatLines[k];
        var age = t - L.t;
        var up = (n - 1 - k) * 40;
        var dy = up + age * age * 5;
        var dx = MV.hashS(L.idx * 3.7 + 1.1) * age * 26;
        var rot = MV.hashS(L.idx * 5.3 + 4.2) * age * 2.4;
        var op = 1;
        if (age > 1.5) op = MV.clamp(1 - (age - 1.5) / 1.0, 0, 1);
        L.el.style.transform = 'translate(-50%,-' + (18 + dy).toFixed(1) + 'px) translateX(' +
          dx.toFixed(1) + 'px) rotate(' + rot.toFixed(2) + 'deg)';
        L.el.style.opacity = op.toFixed(3);
      }
    },

    /* ---------- speech：中央打字机（光标闪烁由 CSS 负责） ---------- */
    _updateSpeech: function (t, s) {
      if (!this._speech) return;
      var full = s.parts[0].en;
      var n = MV.typeCount(t, s.t, full.length, 12);
      var shown = full.slice(0, n);
      if (this._speech.text.textContent !== shown) this._speech.text.textContent = shown;
    },

    /* ---------- chant / count / final：中央弹出物 ---------- */
    _popWindow: function (type) {
      if (type === 'chant') return 1.35;
      if (type === 'count') return 1.15;
      return 5.4; /* final */
    },

    _updatePops: function (t) {
      var S = MV_DATA.sentences;
      var alive = {};
      for (var i = 0; i < S.length; i++) {
        var s = S[i];
        if (s.type !== 'chant' && s.type !== 'count' && s.type !== 'final') continue;
        var win = this._popWindow(s.type);
        for (var k = 0; k < s.parts.length; k++) {
          var p = s.parts[k];
          var age = t - p.t;
          if (age < 0 || age >= win) continue;
          var key = i + ':' + k;
          alive[key] = 1;
          var pop = this._pops[key] || this._createPop(key, s, p);
          this._stylePop(pop, s.type, age, i * 10 + k);
        }
      }
      /* 清扫过期弹出物 */
      for (var kk in this._pops) {
        if (!alive[kk]) {
          var el = this._pops[kk].root;
          if (el.parentNode) el.parentNode.removeChild(el);
          delete this._pops[kk];
        }
      }
    },

    _createPop: function (key, s, p) {
      var root = document.createElement('div');
      var word = document.createElement('div');
      var ring = null;
      if (s.type === 'chant') {
        root.className = 'pop pop-chant';
        word.textContent = p.en;
      } else if (s.type === 'count') {
        root.className = 'pop pop-count';
        word.textContent = p.en;
        ring = document.createElement('div');
        ring.className = 'pop-ring';
        root.appendChild(ring);
      } else {
        root.className = 'pop pop-final';
        word.textContent = p.en;
      }
      root.appendChild(word);
      this.centerEl.appendChild(root);
      var pop = { root: root, word: word, ring: ring };
      this._pops[key] = pop;
      return pop;
    },

    _stylePop: function (pop, type, age, seq) {
      var scale, alpha;
      var xoff = (MV.hash(seq * 3.1 + 7.7) - 0.5) * 140;
      var yoff = (MV.hash(seq * 5.9 + 2.3) - 0.5) * 70;
      if (type === 'count') {
        /* 计数词散得更开，避免相互叠压 */
        xoff = (MV.hash(seq * 3.1 + 7.7) - 0.5) * 520;
        yoff = (MV.hash(seq * 5.9 + 2.3) - 0.5) * 280;
      }
      if (type === 'chant') {
        var k = MV.clamp(age / 0.16, 0, 1);
        scale = 1.6 - 0.6 * MV.easeOutCubic(k);
        alpha = (age < 0.08) ? (age / 0.08) : ((age < 0.6) ? 1 : MV.clamp(1 - (age - 0.6) / 0.7, 0, 1));
      } else if (type === 'count') {
        var k2 = MV.clamp(age / 0.18, 0, 1);
        scale = 1.5 - 0.5 * MV.easeOutBack(k2);
        alpha = (age < 0.06) ? (age / 0.06) : ((age < 0.55) ? 1 : MV.clamp(1 - (age - 0.55) / 0.6, 0, 1));
        if (pop.ring) {
          var rp = MV.clamp(age / 0.62, 0, 1);
          var rs = 0.4 + MV.easeOutCubic(rp) * 2.6;
          pop.ring.style.transform = 'translate(-50%,-50%) scale(' + rs.toFixed(3) + ')';
          pop.ring.style.opacity = (rp >= 1) ? '0' : (0.85 * (1 - rp)).toFixed(3);
        }
      } else { /* final：缓慢放大并淡出至黑 */
        scale = 1.0 + age * 0.018;
        alpha = (age < 0.1) ? (age / 0.1) : ((age < 2.0) ? 1 : MV.clamp(1 - (age - 2.0) / 2.5, 0, 1));
      }
      pop.root.style.transform = 'translate(-50%,-50%) translate(' + xoff.toFixed(1) + 'px,' +
        yoff.toFixed(1) + 'px) scale(' + scale.toFixed(3) + ')';
      pop.root.style.opacity = MV.clamp(alpha, 0, 1).toFixed(3);
    }
  };
})();
