/* ============================================================
 * scenes-part2.js —— 场景 7-12
 *   gender   ( 88.58 - 103.38) 字母变换/trance：F⇄M / AM⇄PM / S⇄M、紫色恍惚
 *   chorus2  (103.38 - 110.90) 副歌爆发 2：双倍粒子、反向数据丝带、涟漪、完成环
 *   left     (110.90 - 118.33) 被遗弃：“你”的扫描线加速离场，光点逐步熄灭
 *   fragments(118.33 - 125.70) 碎裂：光点炸成方块碎片坠落
 *   illegal  (125.70 - 133.70) 非法参数：红色警报、错误雨、巨大红 X
 *   storm    (133.70 - 147.66) 数据风暴：高速流线、网格涟漪、坍缩收束
 * ============================================================ */
window.MV = window.MV || {};

(function () {
  'use strict';

  var MV = window.MV;
  var TAU = MV.TAU;

  /* ============================================================
   * 7. gender —— 字母变换 / trance
   * ============================================================ */
  MV.registerScene('gender', function (api) {
    var t0 = api.t0;
    var meta = { stars: 0.4, grid: 0.04 };
    var pm = MV.partMap(88.5, 103.4);
    var pairs = [
      { a: '♀', b: '♂', ka: 'sym', kb: 'sym', t: pm['To F to M'] || 90.2 },
      { a: '', b: '', ka: 'sun', kb: 'moon', t: pm['From AM to PM'] || 93.95 },
      { a: 'S', b: 'M', ka: 'text', kb: 'text', t: pm['To S to M'] || 97.74 }
    ];
    var tTrance = pm['The trance the trance'] || 101.47;
    var P = MV.RGB.purple;
    /* “我”的轨迹（迹线/残影） */
    var HIST = 26;
    var hx = new Float32Array(HIST), hy = new Float32Array(HIST), hn = 0, hHead = 0;

    /* 符号字体栈：♀♂ΩΔ 等符号必须用带符号字形的字体，否则显示豆腐块 */
    var SYM_FONT = '110px "Segoe UI Symbol","Microsoft YaHei",sans-serif';
    /* 复刻 MV.text 的辉光/透明度行为，但使用自定义原始字体（MV.text 只接受 size+cjk 开关） */
    function symGlyph(ctx, str, x, y, alpha, glow) {
      if (alpha <= 0.005) return;
      ctx.save();
      ctx.font = SYM_FONT;
      ctx.fillStyle = MV.C.purple;
      ctx.globalAlpha = MV.clamp(alpha, 0, 1);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (glow) { ctx.shadowColor = MV.C.purple; ctx.shadowBlur = glow; }
      ctx.fillText(str, x, y);
      ctx.restore();
    }
    /* 线描太阳：圆 r=50 + 12 条放射刻度 */
    function drawSun(ctx, x, y, alpha, glow) {
      if (alpha <= 0.005) return;
      ctx.save();
      ctx.translate(x, y);
      ctx.globalAlpha = MV.clamp(alpha, 0, 1);
      if (glow) { ctx.shadowColor = MV.C.purple; ctx.shadowBlur = glow; }
      MV.ring(ctx, 0, 0, 50, MV.C.purple, 3.5, MV.clamp(alpha, 0, 1));
      ctx.strokeStyle = MV.C.purple;
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (var i = 0; i < 12; i++) {
        var a = i * TAU / 12;
        ctx.moveTo(Math.cos(a) * 58, Math.sin(a) * 58);
        ctx.lineTo(Math.cos(a) * 72, Math.sin(a) * 72);
      }
      ctx.stroke();
      ctx.restore();
    }
    /* 线描月牙：外圆 r=52 与偏移 +20 的“咬”圆 r=44 求交，两段弧相减 */
    var MOON_R1 = 52, MOON_R2 = 44, MOON_DX = 20;
    var MOON_IA = (MOON_DX * MOON_DX + MOON_R1 * MOON_R1 - MOON_R2 * MOON_R2) / (2 * MOON_DX);
    var MOON_IH = Math.sqrt(MOON_R1 * MOON_R1 - MOON_IA * MOON_IA);
    var MOON_A1 = Math.atan2(MOON_IH, MOON_IA);            /* 外圆交点角 */
    var MOON_A2 = Math.atan2(MOON_IH, MOON_IA - MOON_DX);  /* 咬圆交点角 */
    function drawMoon(ctx, x, y, alpha, glow) {
      if (alpha <= 0.005) return;
      ctx.save();
      ctx.translate(x, y);
      ctx.globalAlpha = MV.clamp(alpha, 0, 1);
      if (glow) { ctx.shadowColor = MV.C.purple; ctx.shadowBlur = glow; }
      ctx.strokeStyle = MV.C.purple;
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(0, 0, MOON_R1, -MOON_A1, MOON_A1, true);    /* 外圆沿左侧长弧 */
      ctx.arc(MOON_DX, 0, MOON_R2, MOON_A2, -MOON_A2, false); /* 咬圆内凹弧（经左侧回到起点） */
      ctx.closePath();
      ctx.stroke();
      /* 2 颗细小星芒 */
      var stx = [40, -62], sty = [-70, 58];
      for (var i = 0; i < 2; i++) {
        ctx.beginPath();
        ctx.moveTo(stx[i] - 7, sty[i]); ctx.lineTo(stx[i] + 7, sty[i]);
        ctx.moveTo(stx[i], sty[i] - 7); ctx.lineTo(stx[i], sty[i] + 7);
        ctx.stroke();
      }
      ctx.restore();
    }
    /* 按 side('a'|'b') 取该侧字形类型并绘制 */
    function sideGlyph(ctx, pr, side, x, y, alpha, glow) {
      var kind = (side === 'a') ? pr.ka : pr.kb;
      if (kind === 'sym') symGlyph(ctx, pr[side], x, y, alpha, glow);
      else if (kind === 'sun') drawSun(ctx, x, y, alpha, glow);
      else if (kind === 'moon') drawMoon(ctx, x, y, alpha, glow);
      else MV.text(ctx, pr[side], x, y,
        { size: 110, color: MV.C.purple, alpha: alpha, glow: glow });
    }

    function pushHist(x, y) {
      hx[hHead] = x; hy[hHead] = y;
      hHead = (hHead + 1) % HIST;
      if (hn < HIST) hn++;
    }

    return {
      meta: meta,
      enter: function () { hn = 0; hHead = 0; },
      exit: function () {},
      update: function (t, dt, env, beat) {
        meta.grid = 0.03 + MV.clamp((t - tTrance) / 3, 0, 1) * 0.04;
        /* 轨迹记录：光点做缓慢轨道运动 */
        var px = MV.CX + Math.cos(t * 0.42) * 74;
        var py = MV.CY + Math.sin(t * 0.34) * 52;
        pushHist(px, py);
      },
      draw: function (ctx, t, env, beat) {
        var i, k;
        var trance = MV.clamp((t - tTrance) / 2, 0, 1);
        /* 呼吸：整个画面 ±1.5% 缩放 */
        ctx.save();
        var breath = 1 + Math.sin(t * 0.5) * 0.015;
        ctx.translate(MV.CX, MV.CY);
        ctx.scale(breath, breath);
        ctx.translate(-MV.CX, -MV.CY);

        /* 背景漂浮字形（紫色，极淡）：改用符号字体栈以正确渲染 ♀♂ */
        ctx.save();
        ctx.font = '40px "Segoe UI Symbol","Microsoft YaHei",sans-serif';
        ctx.fillStyle = MV.rgba(P, 0.07);
        ctx.textAlign = 'center';
        for (i = 0; i < 12; i++) {
          var gx = 120 + i * 155 + Math.sin(t * 0.3 + i * 1.3) * 34;
          var gy = ((t * 26 + MV.hash(i * 7.7) * 1400) % 1400) - 120;
          var ch = '♀♂SΩΔ'[(i + Math.floor(t * 0.7)) % 5];
          ctx.fillText(ch, gx, gy);
        }
        ctx.restore();

        /* 三组字形对：滑动 + 镜像互换 */
        for (i = 0; i < pairs.length; i++) {
          var pr = pairs[i];
          var age = t - pr.t;
          if (age < -0.2) continue;
          var p = MV.clamp(age / 2.4, 0, 1);
          var x1 = MV.CX - 430 + p * 860;   /* 左字形向右 */
          var x2 = MV.CX + 430 - p * 860;   /* 右字形向左 */
          /* 交叉瞬间的镜像翻转系数：+1 → -1 */
          var flip = MV.clamp((p - 0.42) / 0.16, 0, 1);
          var sxf = 1 - 2 * flip;
          var aMain = (age < 0.6) ? age / 0.6 : MV.clamp(1 - (age - 2.6) / 1.2, 0, 1);
          if (aMain <= 0.01) {
            /* 余晖：极淡的静止字形 */
            continue;
          }
          /* 拖尾残影（同样按字形类型分派：符号 / 日 / 月 / 文字） */
          for (k = 1; k <= 3; k++) {
            var px1 = MV.lerp(x1, MV.CX - 430, k * 0.07);
            var px2 = MV.lerp(x2, MV.CX + 430, k * 0.07);
            sideGlyph(ctx, pr, p < 0.5 ? 'a' : 'b', px1, MV.CY, aMain * 0.10 / k, 0);
            sideGlyph(ctx, pr, p < 0.5 ? 'b' : 'a', px2, MV.CY, aMain * 0.10 / k, 0);
          }
          ctx.save();
          ctx.translate(x1, MV.CY);
          ctx.scale(sxf, 1);
          sideGlyph(ctx, pr, p < 0.5 ? 'a' : 'b', 0, 0, aMain * 0.95, 22);
          ctx.restore();
          ctx.save();
          ctx.translate(x2, MV.CY);
          ctx.scale(sxf, 1);
          sideGlyph(ctx, pr, p < 0.5 ? 'b' : 'a', 0, 0, aMain * 0.95, 22);
          ctx.restore();
          /* 交换中轴线 */
          if (Math.abs(p - 0.5) < 0.2) {
            MV.line(ctx, MV.CX, MV.CY - 150, MV.CX, MV.CY + 150, MV.C.purple, 1,
              (0.2 - Math.abs(p - 0.5)) * 3);
          }
        }

        /* trance：催眠同心环 + 缓慢旋转刻度 */
        if (trance > 0.01) {
          for (i = 0; i < 12; i++) {
            var rr = ((t - tTrance) * 46 + i * 74) % 880;
            MV.ring(ctx, MV.CX, MV.CY, rr, i % 2 ? MV.C.purple : MV.C.cyan, 1.4,
              0.20 * trance * (1 - rr / 880));
          }
          ctx.save();
          ctx.translate(MV.CX, MV.CY);
          ctx.rotate(t * 0.12);
          ctx.strokeStyle = MV.rgba(P, 0.25 * trance);
          ctx.lineWidth = 2;
          for (i = 0; i < 24; i++) {
            var aa = i * TAU / 24;
            ctx.beginPath();
            ctx.moveTo(Math.cos(aa) * 400, Math.sin(aa) * 400);
            ctx.lineTo(Math.cos(aa) * 430, Math.sin(aa) * 430);
            ctx.stroke();
          }
          ctx.restore();
        }

        /* 轨迹残影（trance 时最明显） */
        var hAlpha = 0.12 + trance * 0.5;
        for (i = 0; i < hn; i++) {
          var idx = (hHead - 1 - i + HIST * 2) % HIST;
          var fa = (1 - i / HIST) * hAlpha;
          MV.drawMe(ctx, hx[idx], hy[idx], 5 * (1 - i / HIST * 0.6), fa,
            { glow: 0.4, tint: MV.RGB.purple });
        }

        ctx.restore(); /* 呼吸结束 */

        /* “我”的光点（轨道上） */
        var px2 = MV.CX + Math.cos(t * 0.42) * 74;
        var py2 = MV.CY + Math.sin(t * 0.34) * 52;
        var rr2 = 7 + env.low * 5 + beat.pulse * 3;
        MV.drawMe(ctx, px2, py2, rr2, 1, { glow: 0.9 + env.mid * 0.5, tint: MV.RGB.purple });
      }
    };
  });

  /* ============================================================
   * 8. chorus2 —— 副歌爆发 2
   * ============================================================ */
  MV.registerScene('chorus2', function (api) {
    var t0 = api.t0;
    var meta = { stars: 0.7, grid: 0.1 };
    var pm = MV.partMap(103.4, 110.91);
    var tVib = pm['VIBRATIONS'] || 106.29;
    var tPre = pm['If I can feel your'] || 104.20;
    var tComp = pm['COMPLETION'] || 110.22;
    var parts = new MV.Particles(1200);
    var rings = [];
    var lastBeat = -1;
    var vibFired = false;    /* VIBRATIONS 震屏只触发一次 */
    var preFired = false;    /* 预震只触发一次 */
    var GLYPH = '01#@%&*+=<>/\\ABCDEF';

    function ribbon(ctx, t, ang, dir, color, seed) {
      var ca = Math.cos(ang), sa = Math.sin(ang);
      ctx.save();
      ctx.font = '20px ' + MV.FONT_MONO;
      ctx.fillStyle = MV.rgba(color, 0.42);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (var i = -26; i <= 26; i += 2) {
        var u = i * 40 * dir;
        var wob = Math.sin(u * 0.01 + t * 2.2 + seed) * 20;
        var x = MV.CX + ca * u - sa * wob;
        var y = MV.CY + sa * u + ca * wob;
        if (x < -40 || x > MV.W + 40 || y < -40 || y > MV.H + 40) continue;
        var gi = Math.abs(Math.floor(i * 7.31 + seed * 13 + t * 14 + u)) % GLYPH.length;
        ctx.fillText(GLYPH.charAt(gi), x, y);
      }
      ctx.restore();
    }

    return {
      meta: meta,
      enter: function () {
        parts.clear();
        rings.length = 0;
        lastBeat = -1;
        vibFired = false;
        preFired = false;
      },
      exit: function () { parts.clear(); rings.length = 0; },
      update: function (t, dt, env, beat) {
        /* VIBRATIONS 全屏震屏：跨过时刻只触发一次；时间回退超过 2.5s 时复位标志（支持回跳/预览） */
        if (t < tVib - 2.5) { vibFired = false; preFired = false; }
        if (!preFired && t >= tPre) { preFired = true; MV.FX.shake(12, 0.6); }
        if (!vibFired && t >= tVib) { vibFired = true; MV.FX.shake(30, 1.7); }
        meta.grid = 0.09 + env.low * 0.13;
        if (beat.idx !== lastBeat) {
          lastBeat = beat.idx;
          var n = 46 + Math.round(env.high * 30);
          for (var i = 0; i < n; i++) {
            var a = MV.hash(i * 3.7 + beat.idx * 19.7) * TAU;
            var sp = 260 + MV.hash(i * 7.1 + beat.idx * 3) * 620;
            parts.spawn(MV.CX, MV.CY,
              Math.cos(a) * sp, Math.sin(a) * sp,
              0.5 + MV.hash(i * 5.3) * 0.8,
              2 + MV.hash(i * 9.9) * 3, i);
          }
          if (beat.isBar) {
            rings.push({ age: 0, dur: 1.1, rMax: 720, kind: 'hex' });
            rings.push({ age: -0.12, dur: 1.1, rMax: 800, kind: 'hex' });
          }
        }
        for (var k = rings.length - 1; k >= 0; k--) {
          rings[k].age += dt;
          if (rings[k].age > rings[k].dur + 0.3) rings.splice(k, 1);
        }
        parts.step(dt, function (ps, i, d) {
          var dr = 1.5 * d;
          ps.vx[i] -= ps.vx[i] * dr;
          ps.vy[i] -= ps.vy[i] * dr;
        });
      },
      draw: function (ctx, t, env, beat) {
        var i;
        /* 反向旋转的两条数据丝带 */
        ribbon(ctx, t, t * 0.55, 1, MV.RGB.cyan, 3);
        ribbon(ctx, t, -t * 0.75 + 1.1, -1, MV.RGB.blue, 11);

        /* 六边形环 */
        for (i = 0; i < rings.length; i++) {
          var r = rings[i];
          if (r.age < 0) continue;
          var p = MV.clamp(r.age / r.dur, 0, 1);
          var rad = MV.easeOutCubic(p) * r.rMax;
          ctx.save();
          ctx.strokeStyle = MV.rgba(MV.RGB.cyan, (1 - p) * 0.45);
          ctx.lineWidth = 2.2;
          MV.polyPath(ctx, MV.CX, MV.CY, Math.max(rad, 1), 6, -r.age * 0.8);
          ctx.stroke();
          ctx.restore();
        }

        /* VIBRATIONS：涟漪扭曲环 */
        if (t > tVib) {
          for (i = 0; i < 6; i++) {
            var rp = ((t - tVib) * 0.6 + i / 6) % 1;
            var rv = rp * 760;
            ctx.save();
            ctx.strokeStyle = MV.rgba(MV.RGB.cyan, (1 - rp) * 0.35);
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (var s = 0; s <= 72; s++) {
              var th = s / 72 * TAU;
              var wob = Math.sin(th * 9 + t * 5 + i) * 9 * (1 - rp);
              var x = MV.CX + Math.cos(th) * (rv + wob);
              var y = MV.CY + Math.sin(th) * (rv + wob);
              if (s === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.stroke();
            ctx.restore();
          }
        }

        /* COMPLETION：闭合的圆环 */
        if (t > tComp - 0.6) {
          var cp = MV.easeOutCubic(MV.clamp((t - tComp) / 0.9, 0, 1));
          ctx.save();
          ctx.strokeStyle = MV.rgba(MV.RGB.white, 0.8);
          ctx.lineWidth = 3.4;
          ctx.beginPath();
          ctx.arc(MV.CX, MV.CY, 190, -Math.PI / 2, -Math.PI / 2 + cp * TAU);
          ctx.stroke();
          ctx.restore();
          if (cp >= 1) {
            MV.ring(ctx, MV.CX, MV.CY, 190 + beat.pulse * 10, MV.C.cyan, 2, 0.35 + beat.pulse * 0.3);
          }
        }

        /* 粒子 */
        parts.drawRect(ctx, MV.RGB.cyan, 0.85);

        /* “我”的光点 */
        var rr = 9 + env.low * 6 + beat.pulse * 5;
        MV.drawMe(ctx, MV.CX, MV.CY, rr, 1, { glow: 1.0 + env.mid * 0.8 });
        MV.cross(ctx, MV.CX, MV.CY, 24 + beat.pulse * 12, MV.C.white, 0.2 + beat.pulse * 0.3, 1);
      }
    };
  });

  /* ============================================================
   * 9. left —— 被遗弃
   * ============================================================ */
  MV.registerScene('left', function (api) {
    var t0 = api.t0;
    var meta = { stars: 0.45, grid: 0.03 };
    var pm = MV.partMap(110.9, 118.34);
    /* 5 个 “You have left” 时间点 + “You have left me in” */
    var leftParts = MV.partsIn(110.9, 116.0).filter(function (p) {
      return p.en.indexOf('You have left') === 0 || p.en === 'Though you have left';
    });
    var stepT = [];
    for (var si = 0; si < leftParts.length; si++) stepT.push(leftParts[si].t);
    var tIso = pm['ISOLATION'] || 117.27;
    var drift = new MV.Particles(320);

    function stepCount(t) {
      var c = 0;
      for (var i = 0; i < stepT.length; i++) if (t >= stepT[i]) c++;
      return c;
    }

    return {
      meta: meta,
      enter: function () { drift.clear(); },
      exit: function () { drift.clear(); },
      update: function (t, dt, env, beat) {
        var step = stepCount(t);
        var iso = MV.clamp((t - tIso) / 1.2, 0, 1);
        meta.stars = 0.45 * (1 - iso * 0.85);
        meta.grid = 0.03 * (1 - iso * 0.7);
        /* 粒子从光点飘离 */
        if (step > 0 && iso < 0.6) {
          var rate = (2 + step * 5) * (1 - iso);
          var n = rate * dt;
          var whole = Math.floor(n);
          if (Math.random() < n - whole) whole++;
          for (var i = 0; i < whole; i++) {
            var a = MV.hash(i * 7.1 + Math.floor(t * 13) * 3.7) * TAU;
            var sp = 18 + MV.hash(i * 3.3) * 46;
            drift.spawn(MV.CX, MV.CY, Math.cos(a) * sp, Math.sin(a) * sp,
              2.2 + MV.hash(i * 5.9) * 1.6, 2 + MV.hash(i * 9.1) * 2, i);
          }
        }
        drift.step(dt, null);
      },
      draw: function (ctx, t, env, beat) {
        var i;
        var step = stepCount(t);
        var iso = MV.clamp((t - tIso) / 1.2, 0, 1);
        var cold = MV.desat(MV.RGB.cyan, iso * 0.7);

        /* 收缩变暗的网格（场景自绘，替代全局网格） */
        var contract = MV.clamp((t - t0) / 7.5, 0, 1);
        var sp = 120 + contract * 170;
        var ext = 1750 - contract * 950;
        var ga = (0.10 - contract * 0.06) * (1 - iso * 0.8);
        if (ga > 0.004) {
          ctx.save();
          ctx.strokeStyle = MV.rgba(cold, ga);
          ctx.lineWidth = 1;
          ctx.beginPath();
          for (i = -7; i <= 7; i++) {
            var x = MV.CX + i * sp;
            ctx.moveTo(x, MV.CY - ext / 2 * 0.56); ctx.lineTo(x, MV.CY + ext / 2 * 0.56);
          }
          for (i = -4; i <= 4; i++) {
            var y = MV.CY + i * sp;
            ctx.moveTo(MV.CX - ext / 2, y); ctx.lineTo(MV.CX + ext / 2, y);
          }
          ctx.stroke();
          ctx.restore();
        }

        /* 各步收敛的环：每句 “You have left” 向内缩一圈 */
        for (i = 0; i < step; i++) {
          var age = t - stepT[i];
          if (age > 2.4) continue;
          var r = 420 - MV.easeOutCubic(MV.clamp(age / 2.0, 0, 1)) * 340;
          MV.ring(ctx, MV.CX, MV.CY, r, cold, 1.4, (1 - age / 2.4) * 0.3);
        }

        /* 漂离粒子 */
        drift.drawRect(ctx, cold, 0.5 * (1 - iso * 0.7));

        /* “我”的光点：每步变暗变小 */
        var scale = Math.max(0.26, 1 - 0.13 * step);
        var alpha = Math.max(0.30, 1 - 0.115 * step) * (1 - iso * 0.15);
        var rr = (8 + env.low * 4 + beat.pulse * 3) * scale;
        MV.drawMe(ctx, MV.CX, MV.CY, rr, alpha, { glow: (0.9 - step * 0.1) * (1 - iso * 0.6), tint: cold });

        /* 创造者的扫描线：加速上升并在 115.78s 前离场 */
        var rise = (t - t0) * 22 + Math.pow(Math.max(0, t - 113.5), 2) * 70;
        var cy = 300 - rise;
        if (cy > -80) {
          var calpha = 0.13 * MV.clamp(cy / 300, 0, 1);
          MV.drawCreator(ctx, 1560, cy, calpha, 620);
          /* 拖尾 */
          MV.line(ctx, 1560, cy + 10, 1560, cy + 120 + rise * 0.05, MV.C.white, 1, calpha * 0.5);
        }

        /* ISOLATION：近乎空白的冷寂 */
        if (iso > 0.01) {
          ctx.save();
          ctx.globalAlpha = iso * 0.42;
          ctx.fillStyle = '#03040a';
          ctx.fillRect(0, 0, MV.W, MV.H);
          ctx.restore();
          MV.text(ctx, 'ISOLATION', MV.CX, 250, { size: 20, color: cold, alpha: 0.4 * iso });
        }
      }
    };
  });

  /* ============================================================
   * 10. fragments —— 碎裂
   * ============================================================ */
  MV.registerScene('fragments', function (api) {
    var t0 = api.t0;
    var meta = { stars: 0.35, grid: 0.04 };
    var pm = MV.partMap(118.3, 125.71);
    var tFrag = pm['FRAGMENTS'] || 120.86;
    var tDis = pm['DISHEARTENED'] || 124.89;
    var N = 96;
    var fx = new Float32Array(N), fy = new Float32Array(N);
    var fvx = new Float32Array(N), fvy = new Float32Array(N);
    var fs = new Float32Array(N), fr = new Float32Array(N), fvr = new Float32Array(N);
    var fn = 0;

    function burst(count, power, up) {
      for (var i = 0; i < count && fn < N; i++) {
        var a = MV.hash(fn * 13.7 + t0) * TAU;
        var sp = (60 + MV.hash(fn * 7.3) * 300) * power;
        fx[fn] = MV.CX; fy[fn] = MV.CY;
        fvx[fn] = Math.cos(a) * sp;
        fvy[fn] = Math.sin(a) * sp - up;
        fs[fn] = 3 + MV.hash(fn * 3.1) * 6;
        fr[fn] = MV.hash(fn * 5.7) * TAU;
        fvr[fn] = MV.hashS(fn * 9.3) * 6;
        fn++;
      }
    }

    return {
      meta: meta,
      enter: function (t) {
        fn = 0;
        burst(64, 1, 30);   /* 入场：光点炸裂成 64 片 */
      },
      exit: function () {},
      update: function (t, dt, env, beat) {
        meta.grid = 0.04 * (1 - MV.clamp((t - tDis) / 1, 0, 1) * 0.6);
        /* “If I can erase...” 的口子：11 8.98~119.4 连续补喷 */
        if (t >= 118.98 && t < 119.45) {
          var n1 = Math.round(160 * dt);
          for (var a1 = 0; a1 < n1; a1++) burst(1, 0.45, 10);
        }
        /* FRAGMENTS：二次爆发 */
        if (t >= tFrag && t < tFrag + 0.45) {
          var n2 = Math.round(150 * dt);
          for (var a2 = 0; a2 < n2; a2++) burst(1, 1.15, -30);
        }
        /* 物理积分：重力 + 阻尼，DISHEARTENED 后重力骤增 */
        var g = 260 * (1 + MV.clamp((t - tDis) / 0.6, 0, 1) * 1.7);
        for (var i = 0; i < fn; i++) {
          fvy[i] += g * dt;
          fvx[i] -= fvx[i] * 0.5 * dt;
          fvx[i] *= (1 - 0.25 * dt);
          fvy[i] *= (1 - 0.25 * dt);
          fx[i] += fvx[i] * dt;
          fy[i] += fvy[i] * dt;
          fr[i] += fvr[i] * dt;
          if (fy[i] > MV.H + 30) { fy[i] = MV.H + 30; fvy[i] *= -0.12; }
        }
      },
      draw: function (ctx, t, env, beat) {
        var i;
        var dim = MV.clamp((t - tDis) / 1.0, 0, 1);
        var col = MV.desat(MV.RGB.cyan, dim * 0.55);
        var alpha = 1 - dim * 0.55;
        /* 中心残影（碎裂的“我”） */
        var ghost = (1 - MV.clamp((t - t0) / 6, 0, 1)) * 0.5;
        if (ghost > 0.01) {
          MV.drawMe(ctx, MV.CX, MV.CY, 4 + beat.pulse * 2, ghost * (0.4 + beat.pulse * 0.5),
            { glow: 0.5, tint: col });
        }
        /* 方块碎片 */
        ctx.save();
        ctx.fillStyle = MV.rgba(col, 1);
        for (i = 0; i < fn; i++) {
          ctx.globalAlpha = MV.clamp(alpha * (0.5 + 0.5 * MV.hash(i * 3.3 + 1)), 0, 1);
          ctx.fillRect(fx[i] - fs[i] / 2, fy[i] - fs[i] / 2, fs[i], fs[i]);
        }
        ctx.restore();
        /* 较大的碎片带旋转（轮廓） */
        ctx.save();
        ctx.strokeStyle = MV.rgba(MV.RGB.white, 0.5 * alpha);
        ctx.lineWidth = 1.2;
        for (i = 0; i < Math.min(fn, 16); i++) {
          ctx.save();
          ctx.translate(fx[i], fy[i]);
          ctx.rotate(fr[i]);
          var s = fs[i] * 1.9;
          ctx.strokeRect(-s / 2, -s / 2, s, s);
          ctx.restore();
        }
        ctx.restore();
        /* 顶部细提示线 */
        MV.line(ctx, 560, 96, 1360, 96, MV.C.cyan, 1, 0.10 + beat.pulse * 0.06);
      }
    };
  });

  /* ============================================================
   * 11. illegal —— 非法参数
   * ============================================================ */
  MV.registerScene('illegal', function (api) {
    var t0 = api.t0;
    var meta = { stars: 0.25, grid: 0 };
    var pm = MV.partMap(125.6, 133.71);
    var tIllegal = pm['ILLEGAL ARGUMENTS'] || 131.22;
    /* 生成确定性的十六进制错误码（注册时预生成，渲染期不做随机） */
    function errHex(seed) {
      var h = Math.floor(MV.hash(seed) * 0x10000).toString(16).toUpperCase();
      return 'ERROR 0x' + ('000' + h).slice(-4);
    }
    /* 'ERROR 0x____' 为占位符：组装时替换为逐槽位派生的唯一确定性十六进制 */
    var ERR = ['0xDEADBEEF', 'ERROR 0x____', 'ARGUMENT INVALID', 'PARAM OUT OF RANGE',
      'NaN DETECTED', 'ERROR 0x____', '0x7FFFFFFF', 'SEGMENTATION FAULT', 'ILLEGAL OPCODE', 'ERROR 0x____'];
    var bands = [];
    for (var b = 0; b < 9; b++) {
      var txt = '';
      for (var k = 0; k < 5; k++) {
        var pick = ERR[Math.floor(MV.hash(b * 31.7 + k * 7.3) * ERR.length)];
        txt += (pick === 'ERROR 0x____' ? errHex(b * 3.1 + k * 5.7 + 0.77) : pick) + '   ';
      }
      bands.push({
        y: 110 + b * 100,
        h: 64,
        speed: 40 + MV.hash(b * 17.3) * 130,
        phase: MV.hash(b * 23.1) * 2400,
        txt: txt,
        alpha: 0.16 + MV.hash(b * 5.5) * 0.2
      });
    }
    var xReveal1 = 0, xReveal2 = 0, xShaken = false;

    return {
      meta: meta,
      enter: function () { xReveal1 = 0; xReveal2 = 0; xShaken = false; },
      exit: function () {},
      update: function (t, dt, env, beat) {
        var rp = MV.clamp((t - tIllegal) / 0.8, 0, 1);
        xReveal1 = rp;
        xReveal2 = MV.clamp((rp - 0.3) / 0.7, 0, 1);
        if (rp >= 1 && !xShaken) {
          xShaken = true;
          MV.FX.shake(24, 0.7);
          MV.FX.flash(MV.RGB.red, 0.4, 0.5);
          MV.FX.glitch(0.6, 0.3);
        }
      },
      draw: function (ctx, t, env, beat) {
        var i;
        /* 红色网格（自绘，带故障偏移） */
        ctx.save();
        var jit = (MV.hash(Math.floor(t * 8) * 3.7) > 0.75) ? MV.hashS(Math.floor(t * 8) * 1.3) * 6 : 0;
        ctx.strokeStyle = MV.rgba(MV.RGB.red, 0.05 + beat.pulse * 0.05);
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (i = 1; i < 16; i++) {
          ctx.moveTo(i * 120 + jit, 80);
          ctx.lineTo(i * 120 + jit, MV.H - 80);
        }
        for (i = 1; i < 8; i++) {
          ctx.moveTo(80, i * 130);
          ctx.lineTo(MV.W - 80, i * 130);
        }
        ctx.stroke();
        ctx.restore();

        /* 错误雨：9 条横向滚动带 */
        ctx.save();
        ctx.font = '26px ' + MV.FONT_MONO;
        ctx.textBaseline = 'middle';
        for (i = 0; i < bands.length; i++) {
          var bd = bands[i];
          var bucket = Math.floor(t * 6);
          var glitch = MV.hash(bucket * 3.1 + i * 7.7);
          var jump = (glitch > 0.72) ? MV.hashS(bucket * 5.3 + i) * 26 : 0;
          var xoff = -((t * bd.speed + bd.phase) % 2400) + jump;
          var ba = bd.alpha * (0.7 + beat.pulse * 0.5) * (glitch > 0.9 ? 1.8 : 1);
          /* 带状底色 */
          ctx.globalAlpha = ba * 0.25;
          ctx.fillStyle = glitch > 0.9 ? 'rgba(255,59,78,0.20)' : 'rgba(255,59,78,0.06)';
          ctx.fillRect(0, bd.y - bd.h / 2, MV.W, bd.h);
          /* 文字 */
          ctx.globalAlpha = ba;
          ctx.fillStyle = (i % 3 === 0) ? MV.C.white : MV.C.red;
          for (var rep = 0; rep < 2; rep++) {
            ctx.fillText(bd.txt, xoff + rep * 2400, bd.y);
          }
        }
        ctx.restore();

        /* 顶端巨大的红色细圆环（神的环） */
        var rp2 = MV.clamp((t - t0) / 2.2, 0, 1);
        ctx.save();
        ctx.strokeStyle = MV.rgba(MV.RGB.red, 0.5 * rp2 * (0.75 + beat.pulse * 0.35));
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(MV.CX, 130, 330, -Math.PI / 2, -Math.PI / 2 + rp2 * TAU);
        ctx.stroke();
        ctx.strokeStyle = MV.rgba(MV.RGB.red, 0.18 * rp2);
        ctx.beginPath();
        ctx.arc(MV.CX, 130, 300, 0, TAU);
        ctx.stroke();
        /* 旋转刻度 */
        ctx.translate(MV.CX, 130);
        ctx.rotate(t * 0.3);
        for (var tick = 0; tick < 12; tick++) {
          var ta = tick * TAU / 12;
          ctx.beginPath();
          ctx.moveTo(Math.cos(ta) * 340, Math.sin(ta) * 340);
          ctx.lineTo(Math.cos(ta) * 360, Math.sin(ta) * 360);
          ctx.stroke();
        }
        ctx.restore();

        /* ILLEGAL ARGUMENTS：巨大红 X */
        if (xReveal1 > 0.01) {
          var x1 = MV.lerp(720, 1200, MV.easeOutCubic(xReveal1));
          var y1 = MV.lerp(330, 750, MV.easeOutCubic(xReveal1));
          ctx.save();
          ctx.lineCap = 'round';
          ctx.strokeStyle = MV.rgba(MV.RGB.red, 0.9);
          ctx.lineWidth = 26;
          ctx.shadowColor = MV.C.red;
          ctx.shadowBlur = 30;
          ctx.beginPath();
          ctx.moveTo(720, 330); ctx.lineTo(x1, y1);
          ctx.stroke();
          if (xReveal2 > 0.01) {
            var x2 = MV.lerp(1200, 720, MV.easeOutCubic(xReveal2));
            var y2 = MV.lerp(330, 750, MV.easeOutCubic(xReveal2));
            ctx.beginPath();
            ctx.moveTo(1200, 330); ctx.lineTo(x2, y2);
            ctx.stroke();
          }
          ctx.restore();
          if (xReveal2 >= 1) {
            MV.text(ctx, 'ILLEGAL ARGUMENTS', MV.CX, 810,
              { size: 40, color: MV.C.red, alpha: 0.85, glow: 26 });
          }
        }
        /* 角落小字 */
        MV.text(ctx, 'ERR 0x' + MV.hex(Math.floor(t * 733) & 0xffffff, 6), 120, MV.H - 70,
          { size: 16, color: MV.C.red, alpha: 0.4, align: 'left' });
      }
    };
  });

  /* ============================================================
   * 12. storm —— 数据风暴：级联错误弹窗 + 网格涟漪 + 坍缩收束
   * ============================================================ */
  MV.registerScene('storm', function (api) {
    var t0 = api.t0;
    var meta = { stars: 0.5, grid: 0 };
    var T1 = 147.66;              /* 场景结束（坍缩完成） */
    var DW = 400, DH = 220;       /* 弹窗尺寸 */

    /* ---------- 注册期：确定性文本池（渲染期零随机） ---------- */
    var TITLES = ['SYSTEM FAULT', 'EXECUTION ERROR'];
    var BODIES = ['ARGUMENT INVALID', 'SEGMENTATION FAULT', 'NaN DETECTED',
      'PARAM OUT OF RANGE', 'ILLEGAL OPCODE', 'DIV BY ZERO', '0xDEADBEEF', 'REFERENCE LOST'];

    function errTitle(k) {
      if (MV.hash(k * 13.7 + 2.2) < 0.55) {
        return 'ERROR 0x' + MV.hex(Math.floor(MV.hash(k * 7.31 + 0.77) * 0x10000), 4);
      }
      return TITLES[Math.floor(MV.hash(k * 5.11 + 9.4) * TITLES.length)];
    }
    function pickBody(k, n) {
      return BODIES[Math.floor(MV.hash(k * 3.17 + n * 11.9 + 4.4) * BODIES.length)];
    }

    /* 生成时刻表：场景起点起每拍一个；超过 60% 后每个半拍再补一个 */
    var spawnT = [];
    (function buildSchedule() {
      var beats = MV_DATA.beats;
      var beatDur = 60 / MV_DATA.bpm;
      var tAccel = t0 + 0.6 * (T1 - t0);
      for (var i = 0; i < beats.length; i++) {
        var b = beats[i];
        if (b < t0 - 0.001) continue;
        if (b > T1) break;
        spawnT.push(b);
        if (b >= tAccel) {
          var nb = (i + 1 < beats.length) ? beats[i + 1] : (b + beatDur);
          var half = (b + nb) * 0.5;
          if (half < T1) spawnT.push(half);
        }
      }
    })();

    /* 弹窗元数据：位置/旋转/配色/文本全部由序号 k 确定性派生 */
    function makeDialog(k, st) {
      var y = 90 + Math.floor(k / 4) * 270;
      if (y > MV.H - 250) y = MV.H - 250;   /* 溢出排堆叠在底部 */
      return {
        k: k,
        st: st,
        x: 70 + (k % 4) * 430 + MV.hashS(k * 7.7 + 1.3) * 34,
        y: y + MV.hashS(k * 3.9 + 5.1) * 22,
        rot: MV.hashS(k * 9.1 + 6.6) * (Math.PI / 180),   /* ±1° */
        cyan: MV.hash(k * 11.3 + 2.7) < 0.28,             /* ~28% 青色变体 */
        title: errTitle(k),
        b1: pickBody(k, 1),
        b2: pickBody(k, 2)
      };
    }

    /* 单个弹窗：线框窗口 + 弹入过冲 + 生成瞬间闪烁 + 末尾缩退汇向中心 */
    function drawDialog(ctx, d, t, driftCol) {
      var age = t - d.st;
      if (age < 0) return;
      var base = d.cyan ? MV.RGB.cyan : driftCol;

      var eb = MV.easeOutBack(MV.clamp(age / 0.22, 0, 1));
      var sc = 0.85 + 0.15 * eb;                  /* 0.85 → 1，含轻微过冲 */
      var alpha = MV.clamp(age / 0.06, 0, 1);
      if (age < 0.1) {                            /* 前 0.1s 确定性闪烁 */
        alpha *= (MV.hash(Math.floor(age * 45) * 17.3 + d.k * 5.7) > 0.45) ? 1 : 0.32;
      }
      /* 末尾 1.5s：按各自延迟缩退/淡出并向中心迁移（衔接 execute 坍缩） */
      var lag = MV.hash(d.k * 5.3 + 0.9) * 0.3;
      var ck = MV.clamp((t - (T1 - 1.5 - lag)) / (1.35 - lag), 0, 1);
      var ckE = MV.easeInCubic(ck);
      if (ck > 0) {
        sc *= (1 - 0.85 * ckE);
        alpha *= (1 - ck);
      }
      if (sc <= 0.02 || alpha <= 0.01) return;

      var cx = MV.lerp(d.x + DW * 0.5, MV.CX, ckE);
      var cy = MV.lerp(d.y + DH * 0.5, MV.CY, ckE);
      var hw = DW * 0.5, hh = DH * 0.5;

      /* ---- 窗口层：整体旋转 ±1°（仅线框/底色/关闭键，文本单独绘制） ---- */
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(d.rot);
      ctx.scale(sc, sc);
      ctx.globalAlpha = alpha;
      /* 窗底 */
      ctx.fillStyle = 'rgba(10,13,20,0.88)';
      ctx.fillRect(-hw, -hh, DW, DH);
      /* 边框 */
      ctx.strokeStyle = MV.rgba(base, 0.85);
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-hw, -hh, DW, DH);
      /* 标题栏分隔线 */
      ctx.beginPath();
      ctx.moveTo(-hw, -hh + 30);
      ctx.lineTo(hw, -hh + 30);
      ctx.strokeStyle = MV.rgba(base, 0.6);
      ctx.stroke();
      /* 关闭按钮 ×：两笔短划 */
      ctx.strokeStyle = MV.rgba(base, 0.8);
      ctx.beginPath();
      ctx.moveTo(hw - 24, -hh + 9); ctx.lineTo(hw - 12, -hh + 21);
      ctx.moveTo(hw - 12, -hh + 9); ctx.lineTo(hw - 24, -hh + 21);
      ctx.stroke();
      ctx.restore();

      /* ---- 文本层：同位置同缩放但不旋转（±1° 目视不可辨；旋转字形栅格化在软件渲染下极慢） ---- */
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(sc, sc);
      ctx.globalAlpha = alpha;
      ctx.font = '18px ' + MV.FONT_MONO;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = MV.rgba(base, 0.95);
      ctx.fillText(d.title, -hw + 14, -hh + 16);
      ctx.font = '19px ' + MV.FONT_MONO;
      ctx.fillStyle = MV.rgba(MV.RGB.white, 0.75);
      ctx.fillText(d.b1, -hw + 14, -hh + 78);
      ctx.font = '17px ' + MV.FONT_MONO;
      ctx.fillStyle = MV.rgba(MV.RGB.dim, 0.7);
      ctx.fillText(d.b2, -hw + 14, -hh + 114);
      ctx.restore();
    }

    var dialogs = [];
    var idx = 0;          /* spawnT 消费游标 */
    var lastBeat = -1;

    return {
      meta: meta,
      enter: function () { dialogs.length = 0; idx = 0; lastBeat = -1; },
      exit: function () { dialogs.length = 0; idx = 0; },
      update: function (t, dt, env, beat) {
        /* 回退守卫：时间跳到过去时清空并按需重建（弹窗完全由 k 决定，重建结果一致） */
        var lastSt = dialogs.length ? dialogs[dialogs.length - 1].st : -Infinity;
        if (t < lastSt - 0.001) { dialogs.length = 0; idx = 0; }
        while (idx < spawnT.length && t >= spawnT[idx]) {
          dialogs.push(makeDialog(idx, spawnT[idx]));
          idx++;
        }
        if (beat.idx !== lastBeat) {
          lastBeat = beat.idx;
          if (beat.isBar) {
            MV.FX.flash(MV.RGB.cyan, 0.06 + env.high * 0.08, 0.3);
          }
        }
      },
      draw: function (ctx, t, env, beat) {
        var i;
        var collapse = MV.clamp((t - (T1 - 1.5)) / 1.5, 0, 1);
        /* 红→紫→青 的色彩游移（经紫色中转，避免红青直接混合发灰） */
        var mk0 = 0.5 + 0.5 * Math.sin((t - t0) * TAU / 9);
        var mk = MV.clamp((mk0 - 0.22) / 0.56, 0, 1);
        var col = (mk < 0.5)
          ? MV.mix(MV.RGB.red, MV.RGB.purple, mk * 2)
          : MV.mix(MV.RGB.purple, MV.RGB.cyan, (mk - 0.5) * 2);

        /* 涟漪网格（自绘，行水波状）：整体压暗到原来的 0.6，让弹窗成为主体 */
        ctx.save();
        ctx.strokeStyle = MV.rgba(col, (0.06 + env.mid * 0.042) * (1 - collapse * 0.5));
        ctx.lineWidth = 1;
        ctx.beginPath();
        var gs = 110 * (1 - collapse * 0.55);
        for (i = 0; i <= 18; i++) {
          var gx = i * gs;
          ctx.moveTo(gx, 0);
          for (var seg = 1; seg <= 6; seg++) {
            var gy = seg * MV.H / 6;
            var wob = Math.sin(gx * 0.008 + gy * 0.01 + t * 3.2) * 14 * (0.4 + env.mid);
            ctx.lineTo(gx + wob, gy);
          }
        }
        for (i = 0; i <= 9; i++) {
          var gyy = i * gs;
          ctx.moveTo(0, gyy);
          for (var seg2 = 1; seg2 <= 8; seg2++) {
            var gxx = seg2 * MV.W / 8;
            var wob2 = Math.sin(gxx * 0.008 + gyy * 0.01 + t * 3.2) * 14 * (0.4 + env.mid);
            ctx.lineTo(gxx, gyy + wob2);
          }
        }
        ctx.stroke();
        ctx.restore();

        /* 级联错误弹窗：按生成顺序绘制（后生成的在最上层） */
        for (i = 0; i < dialogs.length; i++) drawDialog(ctx, dialogs[i], t, col);

        /* 节拍环 */
        if (t < T1 - 1.6) {
          var bp = beat.pulse;
          if (bp > 0.05) {
            MV.ring(ctx, MV.CX, MV.CY, 200 + (1 - bp) * 420, col, 2, bp * 0.2);
          }
        }

        /* 坍缩汇聚点 */
        if (collapse > 0.01) {
          var cr = MV.easeInCubic(collapse) * 70;
          MV.drawMe(ctx, MV.CX, MV.CY, 4 + cr * 0.25, 0.5 + collapse * 0.5,
            { glow: 0.6 + collapse });
          MV.ring(ctx, MV.CX, MV.CY, cr + 12, MV.C.white, 2, collapse * 0.6);
        }
      }
    };
  });
})();
