/* ============================================================
 * util.js —— MV 通用工具库（数学 / 数据采样 / 绘图 / 粒子）
 * 全部挂在 window.MV 命名空间下，供引擎与各场景复用。
 * 依赖：timeline.js（MV_DATA）、env.js（MV_ENV）
 * ============================================================ */
window.MV = window.MV || {};

(function () {
  'use strict';

  var MV = window.MV;
  var TAU = Math.PI * 2;

  /* ---------- 设计空间常量（逻辑分辨率 1920x1080） ---------- */
  MV.W = 1920;
  MV.H = 1080;
  MV.CX = 960;
  MV.CY = 540;
  MV.TAU = TAU;

  /* ---------- 数学工具 ---------- */
  MV.clamp = function (v, a, b) { return v < a ? a : (v > b ? b : v); };
  MV.lerp = function (a, b, k) { return a + (b - a) * k; };
  MV.smoothstep = function (x) { x = MV.clamp(x, 0, 1); return x * x * (3 - 2 * x); };
  MV.easeOutCubic = function (x) { x = MV.clamp(x, 0, 1); return 1 - Math.pow(1 - x, 3); };
  MV.easeInCubic = function (x) { x = MV.clamp(x, 0, 1); return x * x * x; };
  MV.easeOutQuint = function (x) { x = MV.clamp(x, 0, 1); return 1 - Math.pow(1 - x, 5); };
  MV.easeOutBack = function (x) {
    x = MV.clamp(x, 0, 1);
    var c = 1.70158;
    return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2);
  };

  /* 确定性伪随机：同一 seed 永远得到同一结果（用于场景布局，避免每次刷新跳变） */
  MV.hash = function (n) {
    var s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return s - Math.floor(s);
  };
  MV.hash2 = function (x, y) {
    var s = Math.sin(x * 127.1 + y * 311.7 + 74.7) * 43758.5453;
    return s - Math.floor(s);
  };
  /* 双极性随机 [-1,1] */
  MV.hashS = function (n) { return MV.hash(n) * 2 - 1; };

  /* ---------- 颜色 ---------- */
  MV.C = {
    bg: '#05070d',
    cyan: '#57e8ff',
    blue: '#2a6cff',
    white: '#e8f4ff',
    dim: '#8ba5c0',
    red: '#ff3b4e',
    pink: '#ff7ac8',
    purple: '#a06bff'
  };
  MV.RGB = {
    cyan: [87, 232, 255],
    blue: [42, 108, 255],
    white: [232, 244, 255],
    dim: [139, 165, 192],
    red: [255, 59, 78],
    pink: [255, 122, 200],
    purple: [160, 107, 255],
    gray: [110, 128, 150]
  };
  /* 数组色 -> rgba 字符串 */
  MV.rgba = function (c, a) {
    return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';
  };
  /* 两色线性混合 */
  MV.mix = function (c1, c2, k) {
    k = MV.clamp(k, 0, 1);
    return [
      Math.round(c1[0] + (c2[0] - c1[0]) * k),
      Math.round(c1[1] + (c2[1] - c1[1]) * k),
      Math.round(c1[2] + (c2[2] - c1[2]) * k)
    ];
  };
  /* 颜色变暗/去饱和 */
  MV.desat = function (c, k) {
    var g = c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11;
    return MV.mix(c, [g, g, g], k);
  };

  /* ---------- 时间格式化 ---------- */
  MV.fmtTime = function (s) {
    if (!isFinite(s) || s < 0) s = 0;
    var m = Math.floor(s / 60);
    var sec = s - m * 60;
    var whole = Math.floor(sec);
    var tenth = Math.floor((sec - whole) * 10);
    var pad = whole < 10 ? '0' : '';
    return m + ':' + pad + whole + '.' + tenth;
  };
  /* 内存地址风格读数（左上角 HUD 用） */
  MV.hexAddr = function (t) {
    var v = Math.floor(t * 997.3) % 0xffffff;
    var s = v.toString(16).toUpperCase();
    while (s.length < 6) s = '0' + s;
    return '0x' + s;
  };
  MV.hex = function (v, len) {
    var s = (v >>> 0).toString(16).toUpperCase();
    while (s.length < len) s = '0' + s;
    return s;
  };
  /* 打字机进度：start 起、每字符 1/cps 秒，返回已显示字符数 */
  MV.typeCount = function (t, start, total, cps) {
    if (t < start) return 0;
    return Math.min(total, Math.floor((t - start) * cps));
  };
  /* 文本是否为全大写“重词”（PROTECTION / DIMENSION / EXECUTION ...） */
  MV.isCaps = function (s) {
    return /[A-Z]/.test(s) && s === s.toUpperCase();
  };

  /* ---------- 数据采样：节拍 ---------- */
  MV._bIdx = 0;
  MV.beatAt = function (t) {
    var beats = MV_DATA.beats;
    var n = beats.length;
    var i = MV._bIdx | 0;
    if (i < 0) i = 0;
    if (i > n - 1) i = n - 1;
    /* 局部线性推进 + 回退，避免每帧完整二分查找 */
    while (i < n - 1 && beats[i + 1] <= t) i++;
    while (i > 0 && beats[i] > t) i--;
    MV._bIdx = i;
    var t0 = beats[i];
    var t1 = (i < n - 1) ? beats[i + 1] : (t0 + 60 / MV_DATA.bpm);
    var dur = Math.max(t1 - t0, 1e-6);
    var phase = MV.clamp((t - t0) / dur, 0, 1);
    var pulse = Math.exp(-phase * 5);
    var isBar = (i % 4) === 0;
    return {
      idx: i,
      t0: t0,
      t1: t1,
      phase: phase,          /* 0..1 小节内相位 */
      pulse: pulse,          /* 指数衰减脉冲 */
      isBar: isBar,          /* 是否小节第一拍 */
      barPulse: isBar ? pulse : 0,
      barIndex: (i / 4) | 0
    };
  };

  /* ---------- 数据采样：频段能量（线性插值） ---------- */
  MV.envAt = function (t) {
    var E = MV_ENV;
    var dt = E.dt || 0.1;
    var len = E.low.length;
    var f = t / dt;
    var i = Math.floor(f);
    if (i < 0) i = 0;
    if (i > len - 2) i = len - 2;
    var k = MV.clamp(f - i, 0, 1);
    return {
      low: MV.lerp(E.low[i], E.low[i + 1], k),
      mid: MV.lerp(E.mid[i], E.mid[i + 1], k),
      high: MV.lerp(E.high[i], E.high[i + 1], k)
    };
  };

  /* ---------- 歌词数据检索 ---------- */
  /* 在 [a,b) 时间窗内的句子 */
  MV.sentencesIn = function (a, b) {
    var out = [];
    var S = MV_DATA.sentences;
    for (var i = 0; i < S.length; i++) {
      if (S[i].t >= a - 0.001 && S[i].t < b) out.push(S[i]);
    }
    return out;
  };
  /* 在 [a,b) 时间窗内匹配英文的部件列表（附句子引用） */
  MV.partsIn = function (a, b, en) {
    var out = [];
    var S = MV_DATA.sentences;
    for (var i = 0; i < S.length; i++) {
      var s = S[i];
      if (s.t < a - 0.001 || s.t >= b) continue;
      for (var j = 0; j < s.parts.length; j++) {
        var p = s.parts[j];
        if (!en || p.en === en) {
          out.push({ t: p.t, en: p.en, sentence: s, index: j });
        }
      }
    }
    return out;
  };
  /* 全局查找某句英文首次（或第 nth 次）出现的时间 */
  MV.findPart = function (en, nth) {
    nth = nth || 0;
    var S = MV_DATA.sentences;
    var c = 0;
    for (var i = 0; i < S.length; i++) {
      for (var j = 0; j < S[i].parts.length; j++) {
        if (S[i].parts[j].en === en) {
          if (c === nth) return { t: S[i].parts[j].t, sentence: S[i], index: j };
          c++;
        }
      }
    }
    return { t: 0, sentence: null, index: 0 };
  };
  /* 时间窗内的 {英文: 首次出现时间} 映射（场景布局常用） */
  MV.partMap = function (a, b) {
    var m = {};
    var arr = MV.partsIn(a, b);
    for (var i = 0; i < arr.length; i++) {
      if (!(arr[i].en in m)) m[arr[i].en] = arr[i].t;
    }
    return m;
  };

  /* ---------- 字体 ---------- */
  MV.FONT_MONO = "'Cascadia Mono','Consolas','Courier New',monospace";
  MV.FONT_CJK = "'Microsoft YaHei','PingFang SC','Noto Sans SC',system-ui,sans-serif";
  MV.font = function (size, cjk) {
    return size + 'px ' + (cjk ? MV.FONT_CJK : MV.FONT_MONO);
  };

  /* ---------- 绘图基元 ---------- */
  MV.text = function (ctx, str, x, y, o) {
    o = o || {};
    ctx.save();
    ctx.font = (o.size || 24) + 'px ' + (o.cjk ? MV.FONT_CJK : MV.FONT_MONO);
    ctx.fillStyle = o.color || MV.C.white;
    ctx.globalAlpha = (o.alpha == null) ? 1 : o.alpha;
    ctx.textAlign = o.align || 'center';
    ctx.textBaseline = o.baseline || 'middle';
    if (o.glow) {
      ctx.shadowColor = o.color || MV.C.white;
      ctx.shadowBlur = o.glow;
    }
    ctx.fillText(str, x, y);
    ctx.restore();
  };

  MV.line = function (ctx, x1, y1, x2, y2, color, width, alpha) {
    ctx.save();
    ctx.strokeStyle = color || MV.C.cyan;
    ctx.lineWidth = width || 1;
    ctx.globalAlpha = (alpha == null) ? 1 : alpha;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  };

  /* 描边圆环 */
  MV.ring = function (ctx, x, y, r, color, width, alpha) {
    ctx.save();
    ctx.strokeStyle = color || MV.C.cyan;
    ctx.lineWidth = width || 1;
    ctx.globalAlpha = (alpha == null) ? 1 : alpha;
    ctx.beginPath();
    ctx.arc(x, y, Math.max(r, 0.01), 0, TAU);
    ctx.stroke();
    ctx.restore();
  };

  /* 正多边形路径 */
  MV.polyPath = function (ctx, x, y, r, sides, rot) {
    ctx.beginPath();
    for (var i = 0; i < sides; i++) {
      var a = rot + i * TAU / sides;
      var px = x + Math.cos(a) * r;
      var py = y + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
  };

  /* 十字准星 */
  MV.cross = function (ctx, x, y, r, color, alpha, width) {
    MV.line(ctx, x - r, y, x + r, y, color, width || 1, alpha);
    MV.line(ctx, x, y - r, x, y + r, color, width || 1, alpha);
  };

  /* 路径“描画”动画：L 为路径总长度近似值，p 为 0..1 进度 */
  MV.reveal = function (ctx, drawPath, L, p, color, width, alpha) {
    p = MV.clamp(p, 0, 1);
    ctx.save();
    ctx.strokeStyle = color || MV.C.cyan;
    ctx.lineWidth = width || 2;
    ctx.globalAlpha = (alpha == null) ? 1 : alpha;
    ctx.lineCap = 'round';
    ctx.setLineDash([L, L]);
    ctx.lineDashOffset = L * (1 - p);
    ctx.beginPath();
    drawPath(ctx);
    ctx.stroke();
    ctx.restore();
  };

  /* ---------- “我”的身份标识：青白色光点 ---------- */
  /* x,y 逻辑坐标；r 核心半径；alpha 透明度；opts.tint 颜色、opts.glow 光晕强度 */
  MV.drawMe = function (ctx, x, y, r, alpha, opts) {
    opts = opts || {};
    var tint = opts.tint || MV.RGB.cyan;
    var glow = (opts.glow == null) ? 1 : opts.glow;
    if (glow > 0.01) {
      var gr = r * 6;
      var g = ctx.createRadialGradient(x, y, 0, x, y, gr);
      g.addColorStop(0, MV.rgba(tint, 0.55 * alpha * glow));
      g.addColorStop(0.28, MV.rgba(tint, 0.16 * alpha * glow));
      g.addColorStop(1, MV.rgba(tint, 0));
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = g;
      ctx.fillRect(x - gr, y - gr, gr * 2, gr * 2);
      ctx.restore();
    }
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,' + MV.clamp(alpha, 0, 1) + ')';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
    ctx.restore();
  };

  /* ---------- 创造者扫描线（“你”的暗示） ---------- */
  /* 屏幕右侧一条竖直细线 + 小方块光标 */
  MV.drawCreator = function (ctx, x, y, alpha, len) {
    if (alpha <= 0.005) return;
    len = len || 620;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = MV.C.white;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y - len * 0.5);
    ctx.lineTo(x, y + len * 0.5);
    ctx.stroke();
    /* 柔光：宽而淡的第二笔 */
    ctx.globalAlpha = alpha * 0.25;
    ctx.lineWidth = 7;
    ctx.stroke();
    /* 端部刻度 */
    ctx.globalAlpha = alpha * 0.8;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - 7, y - len * 0.5); ctx.lineTo(x + 7, y - len * 0.5);
    ctx.moveTo(x - 7, y + len * 0.5); ctx.lineTo(x + 7, y + len * 0.5);
    ctx.stroke();
    /* 光标方块 */
    ctx.fillStyle = MV.C.white;
    ctx.fillRect(x - 3, y - 3, 6, 6);
    ctx.restore();
  };

  /* ---------- 通用网格（引擎全局层使用） ---------- */
  /* 单次批量描边，性能友好；axes 为坐标轴 */
  MV.drawGrid = function (ctx, t, env, beat, alpha, step) {
    if (alpha <= 0.002) return;
    step = step || 120;
    var pulse = 0.55 + 0.45 * beat.pulse;
    var a = alpha * pulse;
    var i, x, y;
    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = MV.rgba(MV.RGB.cyan, a);
    ctx.beginPath();
    for (i = 1; i < MV.W / step; i++) {
      x = i * step;
      ctx.moveTo(x, 0); ctx.lineTo(x, MV.H);
    }
    for (i = 1; i < MV.H / step; i++) {
      y = i * step;
      ctx.moveTo(0, y); ctx.lineTo(MV.W, y);
    }
    ctx.stroke();
    /* 坐标轴更亮 */
    ctx.strokeStyle = MV.rgba(MV.RGB.cyan, a * 2.2);
    ctx.beginPath();
    ctx.moveTo(MV.CX, 0); ctx.lineTo(MV.CX, MV.H);
    ctx.moveTo(0, MV.CY); ctx.lineTo(MV.W, MV.CY);
    ctx.stroke();
    ctx.restore();
  };

  /* ============================================================
   * 粒子系统：SoA 结构 + 交换删除，零 GC 抖动
   * 字段：x,y,vx,vy,life,lifeMax,size,seed
   * ============================================================ */
  MV.Particles = function (max) {
    this.max = max;
    this.n = 0;
    this.x = new Float32Array(max);
    this.y = new Float32Array(max);
    this.vx = new Float32Array(max);
    this.vy = new Float32Array(max);
    this.life = new Float32Array(max);
    this.lifeMax = new Float32Array(max);
    this.size = new Float32Array(max);
    this.seed = new Float32Array(max);
  };
  MV.Particles.prototype.spawn = function (x, y, vx, vy, life, size, seed) {
    if (this.n >= this.max) return -1;
    var i = this.n++;
    this.x[i] = x; this.y[i] = y; this.vx[i] = vx; this.vy[i] = vy;
    this.life[i] = life; this.lifeMax[i] = life;
    this.size[i] = size; this.seed[i] = seed || 0;
    return i;
  };
  MV.Particles.prototype.clear = function () { this.n = 0; };
  /* 通用步进；cb(p, i, dt) 可选，用于自定义运动（重力/吸引等） */
  MV.Particles.prototype.step = function (dt, cb) {
    var i = 0;
    while (i < this.n) {
      this.life[i] -= dt;
      if (this.life[i] <= 0) {
        var last = --this.n;
        if (i !== last) {
          this.x[i] = this.x[last]; this.y[i] = this.y[last];
          this.vx[i] = this.vx[last]; this.vy[i] = this.vy[last];
          this.life[i] = this.life[last]; this.lifeMax[i] = this.lifeMax[last];
          this.size[i] = this.size[last]; this.seed[i] = this.seed[last];
        }
        continue;
      }
      this.x[i] += this.vx[i] * dt;
      this.y[i] += this.vy[i] * dt;
      if (cb) cb(this, i, dt);
      i++;
    }
  };
  /* 以方块绘制（快） */
  MV.Particles.prototype.drawRect = function (ctx, color, alphaScale) {
    var a0 = (alphaScale == null) ? 1 : alphaScale;
    ctx.save();
    ctx.fillStyle = MV.rgba(color, 1);
    for (var i = 0; i < this.n; i++) {
      ctx.globalAlpha = MV.clamp(a0 * (this.life[i] / this.lifeMax[i]), 0, 1);
      var s = this.size[i];
      ctx.fillRect(this.x[i] - s * 0.5, this.y[i] - s * 0.5, s, s);
    }
    ctx.restore();
  };
  /* 以圆点绘制（较慢，数量需少） */
  MV.Particles.prototype.drawDot = function (ctx, color, alphaScale) {
    var a0 = (alphaScale == null) ? 1 : alphaScale;
    ctx.save();
    ctx.fillStyle = MV.rgba(color, 1);
    for (var i = 0; i < this.n; i++) {
      ctx.globalAlpha = MV.clamp(a0 * (this.life[i] / this.lifeMax[i]), 0, 1);
      ctx.beginPath();
      ctx.arc(this.x[i], this.y[i], this.size[i] * 0.5, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  };
  /* 以短线段绘制（速度方向拖尾，风暴场景用） */
  MV.Particles.prototype.drawStreak = function (ctx, color, alphaScale, k) {
    var a0 = (alphaScale == null) ? 1 : alphaScale;
    k = k || 0.022;
    ctx.save();
    ctx.strokeStyle = MV.rgba(color, 1);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (var i = 0; i < this.n; i++) {
      var a = MV.clamp(a0 * (this.life[i] / this.lifeMax[i]), 0, 1);
      if (a < 0.02) continue;
      ctx.globalAlpha = a;
      ctx.beginPath();
      ctx.moveTo(this.x[i], this.y[i]);
      ctx.lineTo(this.x[i] - this.vx[i] * k, this.y[i] - this.vy[i] * k);
      ctx.stroke();
    }
    ctx.restore();
  };

  /* ============================================================
   * 全局星尘（缓慢漂移的尘埃粒子，随能量增亮）
   * ============================================================ */
  MV.Stars = function (n) {
    this.n = n;
    this.x = new Float32Array(n);
    this.y = new Float32Array(n);
    this.z = new Float32Array(n);
    this.ph = new Float32Array(n);
    for (var i = 0; i < n; i++) {
      this.x[i] = MV.hash(i * 3.1) * MV.W;
      this.y[i] = MV.hash(i * 7.7 + 5) * MV.H;
      this.z[i] = MV.hash(i * 13.3 + 11);
      this.ph[i] = MV.hash(i * 17.9 + 23) * TAU;
    }
  };
  MV.Stars.prototype.update = function (dt, env, beat) {
    var sp = 0.5 + env.high * 2.2;
    for (var i = 0; i < this.n; i++) {
      this.y[i] += (4 + this.z[i] * 16) * sp * dt;
      this.x[i] += (this.z[i] - 0.5) * 6 * dt;
      if (this.y[i] > MV.H + 4) { this.y[i] = -4; this.x[i] = MV.hash(i * 31.7 + this.y[i]) * MV.W; }
      if (this.x[i] < -4) this.x[i] = MV.W + 4;
      if (this.x[i] > MV.W + 4) this.x[i] = -4;
    }
  };
  MV.Stars.prototype.draw = function (ctx, t, env, beat, alphaMul) {
    if (alphaMul <= 0.005) return;
    ctx.save();
    ctx.fillStyle = MV.rgba(MV.RGB.white, 1);
    for (var i = 0; i < this.n; i++) {
      var tw = 0.5 + 0.5 * Math.sin(t * (0.6 + this.z[i] * 1.8) + this.ph[i]);
      var a = (0.10 + 0.42 * tw) * alphaMul * (0.45 + env.high * 0.9) * (0.6 + this.z[i] * 0.7);
      ctx.globalAlpha = MV.clamp(a, 0, 1);
      var s = 1 + this.z[i] * 2.2;
      ctx.fillRect(this.x[i], this.y[i], s, s);
    }
    ctx.restore();
  };
})();
