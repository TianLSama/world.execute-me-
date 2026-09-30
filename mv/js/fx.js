/* ============================================================
 * fx.js —— 全局特效系统（闪光 / 震屏 / 故障 / 缩放脉冲 + 后处理）
 * 使用方式：引擎每帧调用 FX.tick(dt)、FX.apply(ctx)（绘制前施加变换）、
 *           FX.post(ctx)（绘制后叠加故障切片、闪光、暗角、扫描线）
 * ============================================================ */
window.MV = window.MV || {};

(function () {
  'use strict';

  var MV = window.MV;
  var FX = MV.FX = {
    canvas: null,
    pw: 0, ph: 0, dpr: 1,

    /* 各特效：A=强度 / T=剩余时间 / D=总时长 */
    _flashCol: [255, 255, 255],
    _flashA: 0, _flashT: 0, _flashD: 1,
    _shakeA: 0, _shakeT: 0, _shakeD: 1,
    _glitchA: 0, _glitchT: 0, _glitchD: 1,
    _zoomA: 0, _zoomT: 0, _zoomD: 1,

    _vig: null,
    _scanPattern: null,
    _selfDrawOK: true,
    _frame: 0,

    init: function (canvas) {
      this.canvas = canvas;
      this._vig = null;
      this._scanPattern = null;
      this._makeScanPattern();
    },

    onResize: function (pw, ph, dpr) {
      this.pw = pw; this.ph = ph; this.dpr = dpr;
      this._vig = null; /* 暗角渐变按尺寸缓存，尺寸变化后重建 */
    },

    /* 全屏加色闪光。col 为 [r,g,b]，strength 0..1.5，dur 秒 */
    flash: function (col, strength, dur) {
      this._flashCol = col || MV.RGB.white;
      this._flashA = Math.max(this._flashA, MV.clamp(strength, 0, 1.5));
      this._flashD = Math.max(dur || 0.4, 0.05);
      this._flashT = this._flashD;
    },

    /* 震屏。strength 为逻辑像素最大偏移，dur 秒 */
    shake: function (strength, dur) {
      this._shakeA = Math.max(this._shakeA, strength || 8);
      this._shakeD = Math.max(dur || 0.4, 0.05);
      this._shakeT = this._shakeD;
    },

    /* 水平切片故障。amount 0..1，dur 秒（仅在短促爆发时启用） */
    glitch: function (amount, dur) {
      this._glitchA = Math.max(this._glitchA, MV.clamp(amount, 0, 1));
      this._glitchD = Math.max(dur || 0.25, 0.05);
      this._glitchT = this._glitchD;
    },

    /* 缩放脉冲（撞击感）。amount 如 0.03 表示放大 3% */
    zoomPulse: function (amount, dur) {
      this._zoomA = Math.max(this._zoomA, amount || 0.03);
      this._zoomD = Math.max(dur || 0.3, 0.05);
      this._zoomT = this._zoomD;
    },

    /* 每帧衰减（暂停时传入 dt=0，特效自动冻结） */
    tick: function (dt) {
      this._frame++;
      if (this._flashT > 0) this._flashT = Math.max(0, this._flashT - dt);
      if (this._shakeT > 0) this._shakeT = Math.max(0, this._shakeT - dt);
      if (this._glitchT > 0) this._glitchT = Math.max(0, this._glitchT - dt);
      if (this._zoomT > 0) this._zoomT = Math.max(0, this._zoomT - dt);
    },

    /* 场景绘制前施加：震屏偏移 + 缩放脉冲（在逻辑坐标系中调用） */
    apply: function (ctx, cx, cy) {
      if (this._shakeT > 0) {
        var k = this._shakeT / this._shakeD;
        var s = this._shakeA * k;
        /* 用帧号驱动随机，保证每帧都在抖动 */
        var rx = (MV.hash(this._frame * 1.7) * 2 - 1) * s;
        var ry = (MV.hash(this._frame * 2.3 + 9) * 2 - 1) * s;
        ctx.translate(rx, ry);
      }
      if (this._zoomT > 0) {
        var kz = this._zoomT / this._zoomD;
        var z = 1 + this._zoomA * kz;
        ctx.translate(cx, cy);
        ctx.scale(z, z);
        ctx.translate(-cx, -cy);
      }
    },

    _makeScanPattern: function () {
      /* 1x3 物理像素图案：每 3 行压暗 1 行（轻微 CRT 扫描线） */
      var c = document.createElement('canvas');
      c.width = 1; c.height = 3;
      var g = c.getContext('2d');
      g.clearRect(0, 0, 1, 3);
      g.fillStyle = 'rgba(0,0,0,0.05)';
      g.fillRect(0, 0, 1, 1);
      this._scanPattern = c;
    },

    /* 绘制后处理：故障切片 → 闪光 → 暗角 → 扫描线（物理像素空间） */
    post: function (ctx) {
      var pw = this.pw, ph = this.ph;
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      /* --- 故障：自绘切片位移 --- */
      if (this._glitchT > 0 && this._selfDrawOK) {
        var a = this._glitchA * (this._glitchT / this._glitchD);
        if (a > 0.01) {
          var n = 3 + Math.round(a * 13);
          try {
            for (var i = 0; i < n; i++) {
              var seed = i * 7.13 + this._frame * 3.77;
              var sy = Math.floor(MV.hash(seed) * ph);
              var sh = Math.floor((6 + MV.hash(seed + 1.3) * 54) * this.dpr);
              sh = Math.min(sh, ph - sy);
              if (sh <= 1) continue;
              var dx = (MV.hash(seed + 2.7) * 2 - 1) * a * 70 * this.dpr;
              ctx.drawImage(this.canvas, 0, sy, pw, sh, dx, sy, pw, sh);
            }
            /* 高亮残影带 */
            ctx.globalCompositeOperation = 'lighter';
            ctx.fillStyle = MV.rgba(MV.RGB.cyan, 0.05 * a);
            ctx.fillRect(0, (this._frame * 37 % 1) * ph, pw, 2 * this.dpr);
            ctx.globalCompositeOperation = 'source-over';
          } catch (e) {
            this._selfDrawOK = false; /* 某些环境自绘受限，直接关闭该特效 */
          }
        }
      }

      /* --- 闪光（加色） --- */
      if (this._flashT > 0) {
        var fa = this._flashA * (this._flashT / this._flashD);
        if (fa > 0.004) {
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          ctx.fillStyle = MV.rgba(this._flashCol, MV.clamp(fa, 0, 1));
          ctx.fillRect(0, 0, pw, ph);
          ctx.restore();
        }
      }

      /* --- 暗角 --- */
      if (!this._vig) {
        var cx = pw * 0.5, cy = ph * 0.5;
        var r0 = Math.min(pw, ph) * 0.36;
        var r1 = Math.max(pw, ph) * 0.78;
        var vg = ctx.createRadialGradient(cx, cy, r0, cx, cy, r1);
        vg.addColorStop(0, 'rgba(0,0,0,0)');
        vg.addColorStop(1, 'rgba(0,0,0,0.55)');
        this._vig = vg;
      }
      ctx.fillStyle = this._vig;
      ctx.fillRect(0, 0, pw, ph);

      /* --- CRT 扫描线 --- */
      if (this._scanPattern) {
        if (!this._scanPat) {
          this._scanPat = ctx.createPattern(this._scanPattern, 'repeat');
        }
        if (this._scanPat) {
          ctx.fillStyle = this._scanPat;
          ctx.fillRect(0, 0, pw, ph);
        }
      }
    }
  };
})();
