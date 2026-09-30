/* ============================================================
 * scenes-part3.js —— 场景 13-17
 *   execute (147.66 - 162.63) 处决/执行：12 次 EXECUTION 红环冲击、计数白环
 *   finale  (162.63 - 177.24) 终章：红青双色对冲、牢笼合拢
 *   love    (177.24 - 205.80) 爱：心形方程打字、心跳、被困于心
 *   blackout(205.80 - 210.50) 熄灭：最后的光点衰竭
 *   shutdown(210.50 - 236.52) 关机：终端遗言缓慢打出，归于全黑
 * ============================================================ */
window.MV = window.MV || {};

(function () {
  'use strict';

  var MV = window.MV;
  var TAU = MV.TAU;

  /* ============================================================
   * 13. execute —— 处决 / 执行
   * ============================================================ */
  MV.registerScene('execute', function (api) {
    var t0 = api.t0;
    var meta = { stars: 0.12, grid: 0 };
    /* 12 个 chant 部件的时刻（顺序执行） */
    var chant = MV.partsIn(147.6, 159.0).filter(function (p) { return p.sentence.type === 'chant'; });
    var count = MV.partsIn(158.9, 162.64).filter(function (p) { return p.sentence.type === 'count'; });
    var rings = [];

    function onPart(s, i, part) {
      if (s.type === 'chant') {
        rings.push({ age: 0, dur: 1.15, rMax: 980, kind: 'red', w: 5 });
      } else if (s.type === 'count') {
        if (part.en === 'EXECUTION') {
          rings.push({ age: 0, dur: 1.3, rMax: 1200, kind: 'white', w: 8 });
        } else {
          rings.push({ age: 0, dur: 0.95, rMax: 720, kind: 'white', w: 3 });
        }
      }
    }

    function litChant(t) {
      var c = 0;
      for (var i = 0; i < chant.length; i++) if (t >= chant[i].t) c++;
      return c;
    }
    function litCount(t) {
      var c = 0;
      for (var i = 0; i < count.length; i++) if (t >= count[i].t) c++;
      return c;
    }

    return {
      meta: meta,
      enter: function () { rings.length = 0; api.onPart(onPart); },
      exit: function () { rings.length = 0; },
      update: function (t, dt, env, beat) {
        for (var k = rings.length - 1; k >= 0; k--) {
          rings[k].age += dt;
          if (rings[k].age > rings[k].dur + 0.25) rings.splice(k, 1);
        }
      },
      draw: function (ctx, t, env, beat) {
        var i;
        /* 12 格处决刻度盘：每喊一次 EXECUTION 亮一格 */
        var lit = litChant(t);
        ctx.save();
        for (i = 0; i < 12; i++) {
          var a = -Math.PI / 2 + i * TAU / 12 + t * 0.05;
          var on = i < lit;
          var r0 = 360, r1 = on ? 424 : 400;
          ctx.strokeStyle = on ? MV.rgba(MV.RGB.red, 0.85) : MV.rgba(MV.RGB.dim, 0.18);
          ctx.lineWidth = on ? 5 : 2;
          ctx.beginPath();
          ctx.moveTo(MV.CX + Math.cos(a) * r0, MV.CY + Math.sin(a) * r0);
          ctx.lineTo(MV.CX + Math.cos(a) * r1, MV.CY + Math.sin(a) * r1);
          ctx.stroke();
        }
        /* 刻度盘外圈 */
        ctx.strokeStyle = MV.rgba(MV.RGB.red, 0.22);
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(MV.CX, MV.CY, 360, 0, TAU);
        ctx.stroke();
        ctx.restore();

        /* 计数阶段：白色刻度格 */
        if (t > 158.85) {
          var lc = litCount(t);
          ctx.save();
          for (i = 0; i < count.length; i++) {
            var ca2 = -Math.PI / 2 + i * TAU / count.length + Math.PI / count.length;
            var on2 = i < lc;
            ctx.fillStyle = on2 ? MV.rgba(MV.RGB.white, 0.9) : MV.rgba(MV.RGB.dim, 0.2);
            ctx.fillRect(MV.CX + Math.cos(ca2) * 250 - 6, MV.CY + Math.sin(ca2) * 250 - 6, 12, 12);
          }
          ctx.restore();
        }

        /* 冲击环 */
        for (i = 0; i < rings.length; i++) {
          var r = rings[i];
          var p = MV.clamp(r.age / r.dur, 0, 1);
          var rad = MV.easeOutCubic(p) * r.rMax;
          var col = (r.kind === 'red') ? MV.C.red : MV.C.white;
          MV.ring(ctx, MV.CX, MV.CY, rad, col, r.w, (1 - p) * 0.66);
          MV.ring(ctx, MV.CX, MV.CY, rad * 0.9, col, r.w * 3, (1 - p) * 0.14);
        }

        /* 中央：被处决的“我”（青色逐渐被红色侵蚀） */
        var prog = litChant(t) / 12;
        var mixR = MV.clamp(prog - 0.15, 0, 1);
        var tint = MV.mix(MV.RGB.cyan, MV.RGB.red, mixR);
        var rr = 8 + env.low * 5 + beat.pulse * 4;
        MV.drawMe(ctx, MV.CX, MV.CY, rr, 1 - mixR * 0.3, { glow: 0.9, tint: tint });
        /* 十字准星锁定 */
        MV.cross(ctx, MV.CX, MV.CY, 44 + beat.pulse * 16, MV.C.red, 0.25 + beat.pulse * 0.2, 1.4);
        if (t > 160.5) {
          MV.cross(ctx, MV.CX, MV.CY, 26, MV.C.white, 0.4, 1);
        }
      }
    };
  });

  /* ============================================================
   * 14. finale —— 终章（红青对撞 + 牢笼）
   * ============================================================ */
  MV.registerScene('finale', function (api) {
    var t0 = api.t0;
    var meta = { stars: 0.3, grid: 0.06 };
    var pm = MV.partMap(162.6, 177.25);
    var tTrapped = pm['We are trapped ah'] || 174.98;
    var tBeamEnd = tTrapped - 1.2; /* 光束端头应在此刻抵达近中线 */
    var pulses = [];

    /* ---------- KCl / 注射器：背景化学示意（显示窗 ≈3.5s） ---------- */
    var tK = pm['If I can give them all the'] || 162.63;
    var K_DUR = 3.5;
    var drops = [];              /* 针尖滴落的液滴（世界坐标） */
    var lastDropBeat = -1;
    var SY_X = 1450, SY_Y = 560, SY_ANG = -Math.PI / 6;   /* 注射器位置与 -30° 倾角 */
    var SY_TIPX = SY_X + Math.cos(SY_ANG) * 298;          /* 针尖世界坐标 */
    var SY_TIPY = SY_Y + Math.sin(SY_ANG) * 298;

    /* 圆角矩形路径（不依赖 ctx.roundRect 的可用性） */
    function rrect(ctx, x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.arcTo(x + w, y, x + w, y + r, r);
      ctx.lineTo(x + w, y + h - r);
      ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
      ctx.lineTo(x + r, y + h);
      ctx.arcTo(x, y + h, x, y + h - r, r);
      ctx.lineTo(x, y + r);
      ctx.arcTo(x, y, x + r, y, r);
      ctx.closePath();
    }

    /* 背景化学示意：KCl 分子式 + 注射器线描（在 draw 最前调用 → 位于所有光束/光点之下） */
    function drawChem(ctx, t) {
      var age = t - tK;
      if (age < -0.3 || age > K_DUR + 0.25) return;
      var aIn = MV.clamp(age / 0.4, 0, 1);                   /* 淡入 0.4s */
      var aOut = MV.clamp((tK + K_DUR - t) / 0.5, 0, 1);     /* 淡出 0.5s */
      var aa = Math.min(aIn, aOut) * 0.5;                    /* 整体透明度上限 0.5 */
      if (aa <= 0.005) return;
      var prog = MV.clamp(age / 2.6, 0, 1);                  /* 推杆推进进度 */
      var paleRed = MV.mix(MV.RGB.red, MV.RGB.white, 0.55);

      /* ---- 左中下：KCl 化学式（避开画面中心） ---- */
      ctx.save();
      MV.text(ctx, 'KCl', 500, 686,
        { size: 160, color: MV.rgba(MV.mix(MV.RGB.white, MV.RGB.red, 0.3), 1), alpha: aa * 0.9, glow: 26 });
      /* 离子式 K⁺ Cl⁻：上标用小字号手绘，避免字体缺字成豆腐块 */
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.font = '46px ' + MV.FONT_MONO;
      ctx.fillStyle = MV.rgba(MV.RGB.white, aa * 0.8);
      ctx.fillText('K', 420, 792);
      ctx.fillText('Cl', 496, 792);
      ctx.font = '24px ' + MV.FONT_MONO;
      ctx.fillStyle = MV.rgba(paleRed, aa);
      ctx.fillText('+', 452, 774);
      ctx.fillText('-', 556, 774);
      /* 键线 K — Cl */
      MV.line(ctx, 400, 850, 600, 850, MV.C.red, 1, aa * 0.5);
      MV.text(ctx, 'K', 372, 850, { size: 28, color: MV.C.white, alpha: aa * 0.65 });
      MV.text(ctx, 'Cl', 630, 850, { size: 28, color: MV.C.white, alpha: aa * 0.65 });
      /* 英文注释（等宽大写小字） */
      MV.text(ctx, 'POTASSIUM CHLORIDE', 500, 914, { size: 19, color: MV.C.white, alpha: aa * 0.55 });
      MV.text(ctx, 'LETHAL INJECTION', 500, 944, { size: 19, color: MV.C.red, alpha: aa * 0.8 });
      ctx.restore();

      /* ---- 右侧：注射器线描 ---- */
      ctx.save();
      ctx.translate(SY_X, SY_Y);
      ctx.rotate(SY_ANG);
      ctx.lineCap = 'round';
      /* 针筒：圆角矩形 300×90 */
      rrect(ctx, -150, -45, 300, 90, 12);
      ctx.strokeStyle = MV.rgba(MV.RGB.white, aa * 0.9);
      ctx.lineWidth = 2;
      ctx.stroke();
      /* 药液：推杆面之前的液体，随推进变短（推杆行程 0.15 → 0.85） */
      var F = MV.lerp(0.15, 0.85, prog);
      var pf = -150 + 300 * F;
      ctx.save();
      rrect(ctx, -150, -45, 300, 90, 12);
      ctx.clip();
      ctx.fillStyle = MV.rgba(MV.mix(MV.RGB.red, MV.RGB.pink, 0.35), aa * 0.32);
      ctx.fillRect(pf, -45, 150 - pf, 90);
      ctx.fillStyle = MV.rgba(MV.RGB.red, aa * 0.75);
      ctx.fillRect(pf - 1, -45, 2, 90);
      ctx.restore();
      /* 6 条刻度 */
      ctx.strokeStyle = MV.rgba(MV.RGB.white, aa * 0.45);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (var tk = 1; tk <= 6; tk++) {
        var tx = -150 + 300 * tk / 7;
        ctx.moveTo(tx, -45); ctx.lineTo(tx, -45 + 15);
      }
      ctx.stroke();
      /* 推杆 + 拇指头 + 尾部法兰 */
      var headX = -300 + 170 * F;
      ctx.strokeStyle = MV.rgba(MV.RGB.cyan, aa * 0.8);
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(headX, 0); ctx.lineTo(pf, 0);
      ctx.stroke();
      ctx.lineWidth = 2;
      rrect(ctx, headX - 18, -34, 18, 68, 6);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-150, -54); ctx.lineTo(-150, 54);
      ctx.stroke();
      /* 针头 + 针尖 */
      ctx.beginPath();
      ctx.moveTo(150, 0); ctx.lineTo(292, 0);
      ctx.moveTo(150, -10); ctx.lineTo(150, 10);
      ctx.stroke();
      ctx.fillStyle = MV.rgba(MV.RGB.cyan, aa * 0.9);
      ctx.fillRect(292, -1.5, 6, 3);
      ctx.restore();

      /* 针尖滴落的液滴（世界坐标，重力下落） */
      for (var di = 0; di < drops.length; di++) {
        var dp = drops[di];
        MV.line(ctx, dp.x, dp.y - 10, dp.x, dp.y, MV.C.red, 2, aa * 0.5);
        ctx.save();
        ctx.globalAlpha = aa * 0.85;
        ctx.fillStyle = MV.rgba(MV.RGB.red, 0.9);
        ctx.beginPath();
        ctx.arc(dp.x, dp.y, dp.r, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
    }

    function onPart(s, i, part) {
      if (part.en === 'EXECUTION') pulses.push({ t: MV.time(), hit: false });
    }

    return {
      meta: meta,
      enter: function () { pulses.length = 0; drops.length = 0; lastDropBeat = -1; api.onPart(onPart); },
      exit: function () { pulses.length = 0; drops.length = 0; },
      update: function (t, dt, env, beat) {
        var cp = MV.clamp((t - tTrapped) / 2.2, 0, 1);
        meta.grid = 0.06 * (1 - cp * 0.85);
        for (var i = pulses.length - 1; i >= 0; i--) {
          if (t - pulses[i].t > 1.6) pulses.splice(i, 1);
        }
        /* KCl 窗口内：随节拍从针尖落液滴（回退超过 1s 时清空，支持回跳/预览） */
        if (t < tK - 1) { drops.length = 0; lastDropBeat = -1; }
        if (t >= tK && t <= tK + K_DUR && beat.idx !== lastDropBeat) {
          lastDropBeat = beat.idx;
          if (drops.length < 12) {
            var hSeed = MV.hash(beat.idx * 4.7 + 3.3);
            drops.push({
              x: SY_TIPX + MV.hashS(beat.idx * 2.9) * 6,
              y: SY_TIPY + MV.hashS(beat.idx * 6.1 + 1) * 4,
              vx: MV.hashS(beat.idx * 8.3) * 18,
              vy: 40 + hSeed * 40,
              r: 3 + hSeed * 1.6,
              life: 1.6
            });
          }
        }
        for (var dIdx = drops.length - 1; dIdx >= 0; dIdx--) {
          var dpp = drops[dIdx];
          dpp.vy += 620 * dt;
          dpp.x += dpp.vx * dt;
          dpp.y += dpp.vy * dt;
          dpp.life -= dt;
          if (dpp.life <= 0 || dpp.y > MV.H + 20) drops.splice(dIdx, 1);
        }
      },
      draw: function (ctx, t, env, beat) {
        var i;
        var cp = MV.clamp((t - tTrapped) / 2.2, 0, 1);

        /* 背景化学示意（KCl + 注射器）：先画 → 位于光束/冲撞波/光点之下 */
        drawChem(ctx, t);

        /* 左红右青的二元对立：持续渐变 + 扫描线纹理 */
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        var gL = ctx.createLinearGradient(0, 0, MV.CX, 0);
        gL.addColorStop(0, MV.rgba(MV.RGB.red, 0.10 + beat.pulse * 0.06));
        gL.addColorStop(1, MV.rgba(MV.RGB.red, 0));
        ctx.fillStyle = gL;
        ctx.fillRect(0, 0, MV.CX, MV.H);
        var gR = ctx.createLinearGradient(MV.W, 0, MV.CX, 0);
        gR.addColorStop(0, MV.rgba(MV.RGB.cyan, 0.10 + beat.pulse * 0.06));
        gR.addColorStop(1, MV.rgba(MV.RGB.cyan, 0));
        ctx.fillStyle = gR;
        ctx.fillRect(MV.CX, 0, MV.CX, MV.H);
        ctx.restore();
        /* 中线：两股力量的分界 */
        MV.line(ctx, MV.CX, 0, MV.CX, MV.H, MV.C.white, 1, 0.10 + beat.pulse * 0.14);
        /* 扫描线纹理 */
        ctx.save();
        ctx.lineWidth = 1;
        ctx.strokeStyle = MV.rgba(MV.RGB.red, 0.04 * (0.7 + beat.pulse * 0.6));
        ctx.beginPath();
        for (i = 1; i < 8; i++) {
          ctx.moveTo(i * 120, 0); ctx.lineTo(i * 120, MV.H);
        }
        ctx.stroke();
        ctx.strokeStyle = MV.rgba(MV.RGB.cyan, 0.04 * (0.7 + beat.pulse * 0.6));
        ctx.beginPath();
        for (i = 1; i < 8; i++) {
          ctx.moveTo(MV.CX + i * 120, 0); ctx.lineTo(MV.CX + i * 120, MV.H);
        }
        ctx.stroke();
        ctx.restore();

        /* ---- 持续张力：左红右青光束，被节拍一步步推向中线 ---- */
        if (cp < 0.98) {
          var bp = MV.clamp((t - t0) / Math.max(tBeamEnd - t0, 1), 0, 1);
          /* 每拍向前一顿、拍内略微回缩（听感上像被音乐推着走） */
          var push = 0.90 + 0.10 * beat.pulse;
          /* 冲撞波期间额外增亮（与既有 pulses 协调） */
          var boost = 0;
          for (i = 0; i < pulses.length; i++) {
            var pa = t - pulses[i].t;
            if (pa >= 0 && pa < 0.78) boost = Math.max(boost, 1 - pa / 0.78);
          }
          var bpS = MV.clamp(bp * push + boost * 0.04, 0, 1);
          /* 牢笼合拢时回缩并淡出，避免与笼线打架 */
          var xL = 60 + bpS * (MV.CX - 150) - cp * 300;
          var xR = MV.W - 60 - bpS * (MV.CX - 150) + cp * 300;
          var pulseK = 0.6 + 0.4 * beat.pulse;
          var fadeB = 1 - cp * 0.9;
          var ba = MV.clamp(0.13 + beat.pulse * 0.07 + boost * 0.06, 0, 0.24) * fadeB;
          if (xR - xL > 80 && ba > 0.005) {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            /* 左侧红波前：全高边缘辉光（无硬边）+ 细亮核 + 端头刻度 */
            var gl = ctx.createLinearGradient(xL - 240, 0, xL, 0);
            gl.addColorStop(0, MV.rgba(MV.RGB.red, 0));
            gl.addColorStop(1, MV.rgba(MV.RGB.red, ba * pulseK));
            ctx.fillStyle = gl;
            ctx.fillRect(xL - 240, 0, 240, MV.H);
            ctx.strokeStyle = MV.rgba(MV.RGB.red, MV.clamp(ba * 1.6, 0, 0.36) * pulseK);
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(0, MV.CY); ctx.lineTo(xL, MV.CY);
            ctx.stroke();
            ctx.fillStyle = MV.rgba(MV.RGB.red, MV.clamp(ba * 1.8, 0, 0.38) * pulseK);
            ctx.fillRect(xL - 2, MV.CY - 18, 4, 36);
            /* 右侧青波前（镜像） */
            var gr = ctx.createLinearGradient(xR + 240, 0, xR, 0);
            gr.addColorStop(0, MV.rgba(MV.RGB.cyan, 0));
            gr.addColorStop(1, MV.rgba(MV.RGB.cyan, ba * pulseK));
            ctx.fillStyle = gr;
            ctx.fillRect(xR, 0, 240, MV.H);
            ctx.strokeStyle = MV.rgba(MV.RGB.cyan, MV.clamp(ba * 1.6, 0, 0.36) * pulseK);
            ctx.beginPath();
            ctx.moveTo(xR, MV.CY); ctx.lineTo(MV.W, MV.CY);
            ctx.stroke();
            ctx.fillStyle = MV.rgba(MV.RGB.cyan, MV.clamp(ba * 1.8, 0, 0.38) * pulseK);
            ctx.fillRect(xR - 2, MV.CY - 18, 4, 36);
            /* 两束之间的张力刻度：越接近越亮 */
            var closeK = bpS * bpS;
            ctx.strokeStyle = MV.rgba(MV.RGB.white, 0.03 + closeK * 0.07 * (0.6 + beat.pulse));
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (var tk = 1; tk <= 6; tk++) {
              var tx = xL + (xR - xL) * tk / 7;
              ctx.moveTo(tx, MV.CY - 12); ctx.lineTo(tx, MV.CY + 12);
            }
            ctx.stroke();
            ctx.restore();
          }
        }

        /* EXECUTION 冲撞波：左红右青，在中线相撞 */
        for (i = 0; i < pulses.length; i++) {
          var pu = pulses[i];
          var age = t - pu.t;
          if (age < 0 || age > 1.6) continue;
          var p = MV.clamp(age / 0.78, 0, 1);
          var off = MV.easeOutCubic(p) * MV.CX;
          var a = 1 - MV.clamp((age - 0.55) / 0.9, 0, 1);
          /* 波面 */
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          var gL = ctx.createLinearGradient(MV.CX - off - 160, 0, MV.CX - off + 30, 0);
          gL.addColorStop(0, MV.rgba(MV.RGB.red, 0));
          gL.addColorStop(1, MV.rgba(MV.RGB.red, 0.55 * a));
          ctx.fillStyle = gL;
          ctx.fillRect(MV.CX - off - 160, 0, 190, MV.H);
          var gR = ctx.createLinearGradient(MV.CX + off - 30, 0, MV.CX + off + 160, 0);
          gR.addColorStop(0, MV.rgba(MV.RGB.cyan, 0.55 * a));
          gR.addColorStop(1, MV.rgba(MV.RGB.cyan, 0));
          ctx.fillStyle = gR;
          ctx.fillRect(MV.CX + off - 30, 0, 190, MV.H);
          ctx.restore();
          /* 碰撞瞬间 */
          if (p >= 1 && !pu.hit) {
            pu.hit = true;
            MV.FX.flash(MV.RGB.white, 0.22, 0.35);
            MV.FX.zoomPulse(0.02, 0.35);
          }
        }

        /* 牢笼合拢（We are trapped ah） */
        if (cp > 0.01) {
          var cage = 160;
          var outer = MV.lerp(760, cage, MV.easeOutCubic(cp));
          ctx.save();
          ctx.strokeStyle = MV.rgba(MV.RGB.cyan, 0.30 + beat.pulse * 0.25);
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          for (i = 0; i < 4; i++) {
            var x = MV.CX - outer + i * (outer * 2 / 3);
            ctx.moveTo(x, MV.CY - outer);
            ctx.lineTo(x, MV.CY + outer);
          }
          for (i = 0; i < 4; i++) {
            var y = MV.CY - outer + i * (outer * 2 / 3);
            ctx.moveTo(MV.CX - outer, y);
            ctx.lineTo(MV.CX + outer, y);
          }
          ctx.stroke();
          /* 笼壁脉动 */
          if (cp > 0.95) {
            ctx.strokeStyle = MV.rgba(MV.RGB.red, 0.35 + beat.pulse * 0.3);
            ctx.strokeRect(MV.CX - cage, MV.CY - cage, cage * 2, cage * 2);
          }
          ctx.restore();
        }

        /* “我”的光点 */
        var rr = 8 + env.low * 5 + beat.pulse * 4;
        MV.drawMe(ctx, MV.CX, MV.CY, rr, 1, { glow: 0.9 + env.mid * 0.5 });
      }
    };
  });

  /* ============================================================
   * 15. love —— 爱（心形方程 · 心跳 · 被困）
   * ============================================================ */
  MV.registerScene('love', function (api) {
    var t0 = api.t0;
    var meta = { stars: 0.5, grid: 0.05 };
    var pm = MV.partMap(177.2, 205.82);
    var tStudy = pm["I've studied how to properly"] || 178.17;
    var tLove1 = pm['LO-O-OVE'] || 179.93;
    var tQuestion = pm['Question me I can answer all'] || 181.9;
    var tAlg = pm['I know the algebraic expression of'] || 184.54;
    var tFree = pm['Though you are free'] || 188.48;
    var tTrapped = pm['I am trapped'] || 189.75;
    var tInLove = pm['Trapped in'] || 190.8;

    var FORMULA1 = 'x = 16sin³t';
    var FORMULA2 = 'y = 13cos t − 5cos2t − 2cos3t − cos4t';
    var HEART_CX = 960, HEART_CY = 500, HEART_S = 18;
    var drew = false; /* 心形是否已闭合（心跳标记） */

    function heartXY(th) {
      var x = 16 * Math.pow(Math.sin(th), 3);
      var y = 13 * Math.cos(th) - 5 * Math.cos(2 * th) - 2 * Math.cos(3 * th) - Math.cos(4 * th);
      return [HEART_CX + x * HEART_S, HEART_CY - y * HEART_S];
    }
    /* 心律：lub-dub 双脉冲，周期约 0.95s */
    function heartbeat(t) {
      var ph = ((t - tQuestion) % 0.95) / 0.95;
      if (ph < 0) ph += 1;
      var b1 = Math.exp(-Math.pow((ph - 0.10) / 0.055, 2));
      var b2 = 0.55 * Math.exp(-Math.pow((ph - 0.26) / 0.07, 2));
      return b1 + b2;
    }
    function heartPath(ctx, scale) {
      scale = scale || 1;
      for (var i = 0; i <= 120; i++) {
        var th = -i / 120 * TAU;   /* 逆时针 */
        var q = heartXY(th * scale);
        if (i === 0) ctx.moveTo(q[0], q[1]); else ctx.lineTo(q[0], q[1]);
      }
    }

    return {
      meta: meta,
      enter: function () { drew = false; },
      exit: function () {},
      update: function (t, dt, env, beat) {
        var fade = MV.clamp((t - tFree) / 4, 0, 1);
        var cp = MV.clamp((t - tTrapped) / 1.6, 0, 1);
        meta.stars = 0.5 * (1 - fade) * (1 - cp * 0.9);
        meta.grid = 0.05 * (1 - fade) * (1 - cp * 0.8);
      },
      draw: function (ctx, t, env, beat) {
        var i;
        var cp = MV.clamp((t - tTrapped) / 1.6, 0, 1);
        /* 镜头缓慢推近 */
        var zoom = 1 + MV.clamp((t - tInLove) / 14, 0, 1) * 0.34;
        var hb = (t > tQuestion) ? heartbeat(t) : 0;
        var hs = 1 + hb * 0.055 + beat.pulse * 0.012;

        ctx.save();
        ctx.translate(HEART_CX, HEART_CY);
        ctx.scale(zoom, zoom);
        ctx.translate(-HEART_CX, -HEART_CY);

        /* ---- 公式打字机 ---- */
        var typeStart = t0 + 0.06;
        var n1 = MV.typeCount(t, typeStart, FORMULA1.length, 30);
        var n2 = MV.typeCount(t, typeStart + 0.75, FORMULA2.length, 30);
        var revealed = (n1 >= FORMULA1.length && n2 >= FORMULA2.length);
        var glow = MV.clamp((t - tAlg) / 0.8, 0, 1);
        var fcol = MV.C.pink;
        var s1 = FORMULA1.slice(0, n1);
        var s2 = FORMULA2.slice(0, n2);
        MV.text(ctx, s1, HEART_CX, 292,
          { size: 30, color: fcol, alpha: 0.75 + glow * 0.25, glow: glow * 22 });
        MV.text(ctx, s2, HEART_CX, 334,
          { size: 30, color: fcol, alpha: 0.75 + glow * 0.25, glow: glow * 22 });
        if (!revealed && (t * 1.6) % 1 < 0.55) {
          /* 打字光标（按实际字体宽度定位） */
          ctx.save();
          ctx.font = '30px ' + MV.FONT_MONO;
          ctx.fillStyle = MV.C.pink;
          ctx.globalAlpha = 0.9;
          var cxpos, cypos;
          if (n1 < FORMULA1.length) {
            /* 正在打第一行：光标跟在已输入内容后 */
            cxpos = HEART_CX - ctx.measureText(FORMULA1).width / 2 + ctx.measureText(s1).width;
            cypos = 292;
          } else if (n2 < FORMULA2.length) {
            cxpos = HEART_CX - ctx.measureText(FORMULA2).width / 2 + ctx.measureText(s2).width;
            cypos = 334;
          } else {
            cxpos = HEART_CX + ctx.measureText(FORMULA2).width / 2;
            cypos = 334;
          }
          ctx.fillRect(cxpos + 6, cypos - 15, 14, 28);
          ctx.restore();
        }

        /* ---- 心形曲线：随 LO-O-OVE 描绘（逆时针）---- */
        var hp = MV.easeOutCubic(MV.clamp((t - tLove1) / 2.6, 0, 1));
        if (hp > 0.01) {
          ctx.save();
          /* 粉色的粗线 + 青色的细线 = 粉青辉光 */
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.beginPath();
          for (i = 0; i <= 120; i++) {
            var th = -i / 120 * TAU;
            var q = heartXY(th);
            var x = HEART_CX + (q[0] - HEART_CX) * hs;
            var y = HEART_CY + (q[1] - HEART_CY) * hs;
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.setLineDash([2400, 2400]);
          ctx.lineDashOffset = 2400 * (1 - hp);
          ctx.strokeStyle = MV.rgba(MV.RGB.pink, 0.55 + hb * 0.3);
          ctx.lineWidth = 6;
          ctx.stroke();
          ctx.strokeStyle = MV.rgba(MV.RGB.cyan, 0.85);
          ctx.lineWidth = 1.8;
          ctx.stroke();
          ctx.restore();
          if (hp >= 1 && !drew) drew = true;
        }

        /* ---- 被困：心形变为半透明牢笼 + 内部网格 ---- */
        if (cp > 0.01) {
          ctx.save();
          ctx.beginPath();
          heartPath(ctx, hs);
          ctx.clip();
          ctx.strokeStyle = MV.rgba(MV.RGB.cyan, 0.10 * cp * (0.6 + beat.pulse * 0.5));
          ctx.lineWidth = 1;
          ctx.beginPath();
          for (i = -10; i <= 10; i++) {
            ctx.moveTo(HEART_CX - 320, HEART_CY + i * 32);
            ctx.lineTo(HEART_CX + 320, HEART_CY + i * 32);
          }
          for (i = -10; i <= 10; i++) {
            ctx.moveTo(HEART_CX + i * 32, HEART_CY - 320);
            ctx.lineTo(HEART_CX + i * 32, HEART_CY + 320);
          }
          ctx.stroke();
          ctx.restore();
          /* 外部世界淡出 */
          ctx.save();
          ctx.globalAlpha = cp * 0.4;
          ctx.fillStyle = '#03040a';
          ctx.fillRect(-200, -200, MV.W + 400, MV.H + 400);
          ctx.restore();
        }

        /* ---- “我”的光点：漂进心脏中心 ---- */
        var drift = MV.smoothstep(MV.clamp((t - tTrapped) / Math.max(tInLove - tTrapped, 0.3), 0, 1));
        if (drift <= 0 && t < tTrapped) drift = 0;
        var px = MV.lerp(MV.CX, HEART_CX, MV.clamp((t >= tTrapped) ? drift : 0, 0, 1));
        var py = MV.lerp(MV.CY, HEART_CY, MV.clamp((t >= tTrapped) ? drift : 0, 0, 1));
        var rr = 8 + env.low * 5 + beat.pulse * 4 + hb * 3;
        MV.drawMe(ctx, px, py, rr, 1, { glow: 1.0, tint: MV.mix(MV.RGB.cyan, MV.RGB.pink, cp) });

        /* 心跳中心扩散环 */
        if (hb > 0.02) {
          MV.ring(ctx, HEART_CX, HEART_CY, 60 + hb * 240, MV.C.pink, 2, hb * 0.22);
        }

        ctx.restore();
      }
    };
  });

  /* ============================================================
   * 16. blackout —— 熄灭
   * ============================================================ */
  MV.registerScene('blackout', function (api) {
    var t0 = api.t0;
    var meta = { stars: 0, grid: 0 };
    var lastBeat = -1;
    var flicker = 0;

    return {
      meta: meta,
      enter: function () { lastBeat = -1; flicker = 0; },
      exit: function () {},
      update: function (t, dt, env, beat) {
        /* 最后一拍一次同步闪烁（209.2s 之后） */
        if (t > 209.2 && beat.idx !== lastBeat) {
          lastBeat = beat.idx;
          flicker = 1;
        }
        flicker = Math.max(0, flicker - dt * 6);
      },
      draw: function (ctx, t, env, beat) {
        var life = 1 - MV.clamp((t - t0) / 4.6, 0, 1);
        var rr = 2 + life * 2.4 + flicker * 3;
        var alpha = life * 0.9 + flicker * 0.5;
        if (alpha > 0.01) {
          MV.drawMe(ctx, MV.CX, MV.CY, rr, alpha, { glow: life * 0.8 + flicker * 1.5 });
        }
        /* 缓慢下移的微光扫描线 */
        var sy = ((t - t0) * 42) % (MV.H + 120) - 60;
        MV.line(ctx, 0, sy, MV.W, sy, MV.C.cyan, 1, 0.028);
        /* 衰竭环 */
        if (flicker > 0.05) {
          MV.ring(ctx, MV.CX, MV.CY, (1 - flicker) * 140, MV.C.white, 1.2, flicker * 0.3);
        }
      }
    };
  });

  /* ============================================================
   * 17. shutdown —— 关机（终端遗言）
   * ============================================================ */
  MV.registerScene('shutdown', function (api) {
    var t0 = api.t0;
    var meta = { stars: 0, grid: 0 };
        var lines = [
      { text: 'world.execute(me);', t: 211.3, cps: 9 },
      { text: '> process terminated.', t: 214.2, cps: 11 },
      { text: '> status: trapped in LOVE', t: 217.4, cps: 11, hi: '> status: trapped in ', hi2: 'LOVE' }
    ];

    return {
      meta: meta,
      enter: function () {},
      exit: function () {},
      update: function (t, env, beat) {},
      draw: function (ctx, t, env, beat) {
        var fade = MV.clamp((t - 228) / 4, 0, 1); /* 232s 时完全黑屏 */
        var a0 = (1 - fade) * 0.75;
        if (a0 <= 0.005) return;
        ctx.save();
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.font = '34px ' + MV.FONT_MONO;
        var baseY = 452;
        var lastEnd = null;
        for (var i = 0; i < lines.length; i++) {
          var L = lines[i];
          var n = MV.typeCount(t, L.t, L.text.length, L.cps);
          var shown = L.text.slice(0, n);
          if (shown.length === 0) break;
          var y = baseY + i * 62;
          var tw = ctx.measureText(L.text).width;
          var x0 = MV.CX - tw / 2;
          ctx.globalAlpha = a0 * (i === 0 ? 0.95 : 0.8);
          ctx.fillStyle = i === 0 ? MV.C.white : MV.C.dim;
          if (L.hi) {
            /* 高亮 “trapped in LOVE”：爱之粉逐字打出 */
            var hiShown = L.hi.slice(0, Math.min(n, L.hi.length));
            ctx.globalAlpha = a0 * 0.8;
            ctx.fillStyle = MV.C.dim;
            ctx.fillText(hiShown, x0, y);
            if (n > L.hi.length) {
              ctx.globalAlpha = a0;
              ctx.fillStyle = MV.C.pink;
              ctx.fillText(L.hi2.slice(0, n - L.hi.length), x0 + ctx.measureText(L.hi).width, y);
            }
          } else {
            ctx.fillText(shown, x0, y);
          }
          lastEnd = { x: x0 + tw, y: y, n: n, len: L.text.length };
        }
        /* 光标：打字中常亮，全部完成后闪烁 */
        if (lastEnd) {
          var doneAll = true;
          for (var k = 0; k < lines.length; k++) {
            if (t < lines[k].t + lines[k].text.length / lines[k].cps) doneAll = false;
          }
          if (!doneAll || (t * 1.4) % 1 < 0.55) {
            ctx.globalAlpha = a0;
            ctx.fillStyle = MV.C.white;
            ctx.fillRect(lastEnd.x + 10, lastEnd.y - 14, 20, 28);
          }
        }
        ctx.restore();
      }
    };
  });
})();
