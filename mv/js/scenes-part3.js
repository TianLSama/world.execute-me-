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

    /* ===== ENRICH:execute:data — 工厂期预生成（draw 零分配） ===== */
    /* 局部十六进制格式化（仅工厂期调用，ASCII 输出） */
    function hx(v, len) {
      var s = Math.floor(Math.abs(v)).toString(16).toUpperCase();
      while (s.length < len) s = '0' + s;
      return s.slice(-len);
    }
    /* 待处决任务清单：12 条十六进制 id，随 chant 逐条勾选 */
    var tasks = [], tasksTodo = [], tasksDone = [];
    for (var ti = 0; ti < 12; ti++) {
      var taskId = 'EX-' + hx(MV.hash(ti * 3.7 + 1.3) * 65535, 4) + '-' + hx(MV.hash(ti * 9.1 + 4.4) * 255, 2);
      tasks.push(taskId);
      tasksTodo.push('[ ] ' + taskId);
      tasksDone.push('[x] ' + taskId);
    }
    var doneLabels = [];
    for (var di = 0; di <= 12; di++) doneLabels.push('DONE ' + (di < 10 ? '0' : '') + di + '/12');
    var cycles = [];
    for (var ci = 0; ci < 16; ci++) cycles.push('CYCLE ' + (ci < 10 ? '0' : '') + ci);
    /* 计数阶段 ASCII 数词 */
    var NUMS = ['EIN', 'ZWEI', 'DREI', 'VIER', 'FUNF', 'SECHS', 'SIEBEN', 'ACHT', 'NEUN', 'ZEHN', 'ELF', 'ZWOLF'];
    var LOOP = 2.0;         /* mantra 循环周期约 2s */
    var T_CUT = 162.5;      /* 硬切时刻 */
    var cutFired = false;

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
      enter: function () { rings.length = 0; cutFired = false; api.onPart(onPart); },
      exit: function () { rings.length = 0; },
      update: function (t, dt, env, beat) {
        /* 回跳/预览：硬切爆发重新武装 */
        if (t < T_CUT - 0.1) cutFired = false;
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

        /* ===== ENRICH:execute:dial — 反向内十二边形 + 冲击辐条 ===== */
        ctx.save();
        ctx.strokeStyle = MV.rgba(MV.RGB.cyan, 0.16 + beat.pulse * 0.05);
        ctx.lineWidth = 1.6;
        MV.polyPath(ctx, MV.CX, MV.CY, 332, 12, Math.PI / 12 - t * 0.07);
        ctx.stroke();
        ctx.strokeStyle = MV.rgba(MV.RGB.cyan, 0.05);
        ctx.lineWidth = 7;
        ctx.stroke();
        ctx.restore();
        for (i = 0; i < 12; i++) {
          var spA = -Math.PI / 2 + i * TAU / 12 - t * 0.07;
          /* 顶点小点 */
          ctx.fillStyle = MV.rgba(MV.RGB.cyan, 0.32);
          ctx.fillRect(MV.CX + Math.cos(spA) * 332 - 2.5, MV.CY + Math.sin(spA) * 332 - 2.5, 5, 5);
          /* 冲击辐条：第 i 次 EXECUTION 后 0.6s 内向外爆发 */
          var spP = 0;
          if (i < chant.length) {
            var spAge = t - chant[i].t;
            if (spAge >= 0 && spAge < 0.6) spP = 1 - spAge / 0.6;
          }
          if (spP > 0.01) {
            var s0 = 306, s1 = 306 + spP * 30;
            MV.line(ctx,
              MV.CX + Math.cos(spA) * s0, MV.CY + Math.sin(spA) * s0,
              MV.CX + Math.cos(spA) * s1, MV.CY + Math.sin(spA) * s1,
              MV.rgba(MV.mix(MV.RGB.red, MV.RGB.white, spP), 1), 3, spP * 0.55);
          }
        }

        /* ===== ENRICH:execute:queue — 处决任务清单 ===== */
        var qa = MV.clamp((t - (t0 + 0.6)) / 1.2, 0, 1) * MV.clamp((162.63 - t) / 0.3, 0, 1);
        if (qa > 0.01) {
          var litQ = litChant(t);
          MV.text(ctx, 'EXECUTION QUEUE', 150, 272, { size: 20, color: MV.C.cyan, alpha: qa * 0.8, align: 'left' });
          for (i = 0; i < tasks.length; i++) {
            var qy = 316 + i * 42;
            var qDone = i < litQ;
            MV.text(ctx, qDone ? tasksDone[i] : tasksTodo[i], 150, qy,
              { size: 19, color: qDone ? MV.C.cyan : MV.C.dim, alpha: qa * (qDone ? 0.75 : 0.3), align: 'left' });
            /* 处决瞬间：该行闪红划除 */
            if (i < chant.length) {
              var qAge = t - chant[i].t;
              if (qAge >= 0 && qAge < 0.5) {
                MV.line(ctx, 132, qy, 470, qy, MV.C.red, 1.2, (1 - qAge / 0.5) * 0.5 * qa);
              }
            }
          }
          MV.text(ctx, doneLabels[Math.min(litQ, 12)], 150, 836, { size: 18, color: MV.C.white, alpha: qa * 0.6, align: 'left' });
          MV.line(ctx, 150, 864, 150 + 320 * (litQ / 12), 864, MV.C.red, 3, qa * 0.6);
          MV.line(ctx, 150, 864, 470, 864, MV.C.dim, 1, qa * 0.2);
        }

        /* ===== ENRICH:execute:count — 旋转刻度环 + ASCII 计数标 ===== */
        if (t > 158.85 && t < 162.63) {
          var tkA = MV.clamp((t - 158.85) / 0.4, 0, 1) * MV.clamp((162.63 - t) / 0.22, 0, 1);
          var tkRot = t * 0.22;
          ctx.save();
          ctx.lineWidth = 1.4;
          ctx.strokeStyle = MV.rgba(MV.RGB.white, 0.22 * tkA);
          ctx.beginPath();
          for (i = 0; i < 60; i++) {
            var ta = tkRot + i * TAU / 60;
            var major = (i % 5 === 0);
            var tr0 = major ? 296 : 306;
            var tr1 = major ? 324 : 316;
            ctx.moveTo(MV.CX + Math.cos(ta) * tr0, MV.CY + Math.sin(ta) * tr0);
            ctx.lineTo(MV.CX + Math.cos(ta) * tr1, MV.CY + Math.sin(ta) * tr1);
          }
          ctx.stroke();
          ctx.restore();
          var lc2 = litCount(t);
          for (i = 0; i < count.length; i++) {
            var la = -Math.PI / 2 + i * TAU / count.length + Math.PI / count.length;
            var onNb = i < lc2;
            MV.text(ctx, NUMS[i % NUMS.length],
              MV.CX + Math.cos(la) * 356, MV.CY + Math.sin(la) * 356,
              { size: 22, color: onNb ? MV.C.white : MV.C.dim, alpha: tkA * (onNb ? 0.85 : 0.28) });
          }
        }

        /* ===== ENRICH:execute:loop — 循环指示器 + 硬切爆发 ===== */
        var loopPh = ((t - t0) % LOOP) / LOOP;
        var cyc = Math.min(cycles.length - 1, Math.floor(Math.max(t - t0, 0) / LOOP));
        var lx = 1660, ly = 150;
        ctx.save();
        ctx.strokeStyle = MV.rgba(MV.RGB.cyan, 0.3);
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        for (i = 0; i <= 48; i++) {
          var u = i / 48 * TAU;
          var den = 1 + Math.sin(u) * Math.sin(u);
          var ix = lx + Math.cos(u) / den * 42;
          var iy = ly + Math.sin(u) * Math.cos(u) / den * 42;
          if (i === 0) ctx.moveTo(ix, iy); else ctx.lineTo(ix, iy);
        }
        ctx.stroke();
        ctx.restore();
        /* 沿无穷符号运动的光点 */
        var du = t * 1.3;
        var dden = 1 + Math.sin(du) * Math.sin(du);
        MV.drawMe(ctx, lx + Math.cos(du) / dden * 42, ly + Math.sin(du) * Math.cos(du) / dden * 42, 3.4, 0.9, { glow: 0.7 });
        MV.text(ctx, 'MANTRA LOOP', lx, ly - 66, { size: 16, color: MV.C.cyan, alpha: 0.45 });
        MV.text(ctx, cycles[cyc], lx, ly + 74, { size: 18, color: MV.C.white, alpha: 0.55 });
        for (i = 0; i < 8; i++) {
          var onL = (i / 8) <= loopPh;
          ctx.fillStyle = onL ? MV.rgba(MV.RGB.cyan, 0.5) : MV.rgba(MV.RGB.dim, 0.18);
          ctx.fillRect(lx - 56 + i * 15, ly + 96, 11, 6);
        }
        /* 硬切：162.5s 一次性冲击爆发（仅追加，不改既有 FX） */
        if (t >= T_CUT && !cutFired) {
          cutFired = true;
          MV.FX.flash(MV.RGB.white, 0.3, 0.3);
          MV.FX.zoomPulse(0.035, 0.35);
        }
        var cutAge = t - T_CUT;
        if (cutAge >= 0 && cutAge < 0.32) {
          var ck = 1 - cutAge / 0.32;
          MV.ring(ctx, MV.CX, MV.CY, MV.easeOutCubic(1 - ck) * 620, MV.C.white, 2.5, ck * 0.5);
          MV.line(ctx, 0, MV.CY - 1, MV.W, MV.CY + 1, MV.C.white, 2, ck * 0.35);
          MV.text(ctx, 'CYCLE COMPLETE', MV.CX, MV.CY + 130, { size: 26, color: MV.C.white, alpha: ck * 0.8 });
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

    /* ===== ENRICH:finale:data — 工厂期布局（draw 零分配） ===== */
    var PK_A = 166.4, PK_B = 173.78;               /* 数据包窗口 */
    var motes = [];                                 /* 漂移尘埃：纯函数运动 */
    for (var mi = 0; mi < 46; mi++) {
      motes.push({
        x: MV.hash(mi * 3.1 + 7.7) * MV.W,
        y: MV.hash(mi * 5.3 + 2.2) * MV.H,
        sp: 10 + MV.hash(mi * 7.9 + 5.5) * 22,
        amp: 8 + MV.hash(mi * 11.3 + 9.1) * 26,
        ph: MV.hash(mi * 13.7 + 3.3) * TAU,
        sz: 1 + MV.hash(mi * 17.1 + 1.1) * 2
      });
    }
    /* 中央十六进制柱：预生成 18 行 × 8 字符 */
    var HEXCOL = [];
    for (var hi = 0; hi < 18; hi++) {
      var hstr = '';
      for (var hj = 0; hj < 8; hj++) {
        hstr += '0123456789ABCDEF'.charAt(Math.floor(MV.hash(hi * 31.7 + hj * 7.3 + 1.9) * 16) % 16);
      }
      HEXCOL.push(hstr);
    }

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

        /* ===== ENRICH:finale:grid — 全屏张力网格（随节拍颤动） ===== */
        var gk = Math.floor(t * 26);
        var gAmp = 1.6 + beat.pulse * 2.6;
        var gFade = (1 - cp * 0.7) * 0.07;
        ctx.save();
        ctx.lineWidth = 1;
        ctx.strokeStyle = MV.rgba(MV.RGB.dim, gFade);
        ctx.beginPath();
        for (i = 1; i < 16; i++) {
          var gx = i * 120 + MV.hashS(i * 3.7 + gk * 1.9) * gAmp;
          ctx.moveTo(gx, 0); ctx.lineTo(gx, MV.H);
        }
        for (i = 1; i < 9; i++) {
          var gy = i * 120 + MV.hashS(i * 7.1 + gk * 2.3) * gAmp;
          ctx.moveTo(0, gy); ctx.lineTo(MV.W, gy);
        }
        ctx.stroke();
        ctx.restore();

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

          /* ===== ENRICH:finale:packets — 数据包沿光束滑向中线 ===== */
          if (t > PK_A - 0.4 && t < PK_B + 0.4) {
            var pka = MV.clamp((t - PK_A) / 0.5, 0, 1) * MV.clamp((PK_B - t) / 0.5, 0, 1);
            if (pka > 0.01) {
              for (i = 0; i < 6; i++) {
                /* 位置由 beat.phase 纯函数决定 → 每拍推进一段、拍内平滑 */
                var pf = (beat.phase + i / 6) % 1;
                var psize = 7 + (i % 3) * 3;
                /* 左侧红包：屏幕左缘 → 右波前 */
                var pxl = MV.lerp(24, xL - 14, pf);
                ctx.fillStyle = MV.rgba(MV.RGB.red, pka * (0.26 + 0.4 * pf));
                ctx.fillRect(pxl - psize * 0.5, MV.CY - psize * 0.5, psize, psize);
                MV.line(ctx, pxl + psize, MV.CY, pxl + psize + 18 * pf, MV.CY, MV.C.red, 1, pka * 0.3 * pf);
                /* 右侧青包：镜像 */
                var pxr = MV.lerp(MV.W - 24, xR + 14, pf);
                ctx.fillStyle = MV.rgba(MV.RGB.cyan, pka * (0.26 + 0.4 * pf));
                ctx.fillRect(pxr - psize * 0.5, MV.CY - psize * 0.5, psize, psize);
                MV.line(ctx, pxr - psize, MV.CY, pxr - psize - 18 * pf, MV.CY, MV.C.cyan, 1, pka * 0.3 * pf);
              }
            }
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

        /* ===== ENRICH:finale:brackets — 笼角卡扣逐步咬合 + 末端锁定刻度 ===== */
        if (cp > 0.02) {
          var cageR = 160;
          var cageF = MV.lerp(760, cageR, MV.easeOutCubic(cp));
          for (i = 0; i < 4; i++) {
            var bpr = MV.clamp((cp - 0.08 - i * 0.09) / 0.22, 0, 1);
            if (bpr <= 0.01) continue;
            var bL = 34 + 30 * bpr;
            var bx = (i % 2 === 0) ? MV.CX - cageF : MV.CX + cageF;
            var by = (i < 2) ? MV.CY - cageF : MV.CY + cageF;
            var sx = (i % 2 === 0) ? 1 : -1;
            var sy = (i < 2) ? 1 : -1;
            ctx.save();
            ctx.strokeStyle = MV.rgba(MV.RGB.cyan, 0.35 * bpr + beat.pulse * 0.15);
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(bx + sx * bL, by);
            ctx.lineTo(bx, by);
            ctx.lineTo(bx, by + sy * bL);
            ctx.stroke();
            /* 内角防滑刻度 */
            ctx.strokeStyle = MV.rgba(MV.RGB.white, 0.25 * bpr);
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (var bk = 1; bk <= 3; bk++) {
              ctx.moveTo(bx + sx * (bL + bk * 9), by);
              ctx.lineTo(bx + sx * (bL + bk * 9), by + sy * 7);
              ctx.moveTo(bx, by + sy * (bL + bk * 9));
              ctx.lineTo(bx + sx * 7, by + sy * (bL + bk * 9));
            }
            ctx.stroke();
            ctx.restore();
          }
          /* 近末端：四边锁定刻度密排、随拍脉冲 */
          var lock = MV.clamp((cp - 0.72) / 0.28, 0, 1);
          if (lock > 0.01) {
            ctx.save();
            ctx.strokeStyle = MV.rgba(MV.RGB.red, 0.28 + beat.pulse * 0.3);
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            for (i = 0; i < 10; i++) {
              var lt = -cageR + 32 + i * (cageR * 2 - 64) / 9;
              var lh = 8 + lock * 8;
              ctx.moveTo(MV.CX + lt, MV.CY - cageR);
              ctx.lineTo(MV.CX + lt, MV.CY - cageR + lh);
              ctx.moveTo(MV.CX + lt, MV.CY + cageR);
              ctx.lineTo(MV.CX + lt, MV.CY + cageR - lh);
              ctx.moveTo(MV.CX - cageR, MV.CY + lt);
              ctx.lineTo(MV.CX - cageR + lh, MV.CY + lt);
              ctx.moveTo(MV.CX + cageR, MV.CY + lt);
              ctx.lineTo(MV.CX + cageR - lh, MV.CY + lt);
            }
            ctx.stroke();
            ctx.restore();
          }
        }

        /* ===== ENRICH:finale:column — 中央十六进制柱 + 漂移尘埃 ===== */
        var colA = 0.16 + beat.pulse * 0.1 + env.mid * 0.08;
        ctx.save();
        for (i = 0; i < 14; i++) {
          var row = (i + Math.floor(t * 7)) % HEXCOL.length;
          var ry = MV.CY - 236 + i * 34;
          var rowA = colA * (0.35 + 0.65 * (1 - Math.abs(i - 6.5) / 6.5));
          MV.text(ctx, HEXCOL[row], MV.CX, ry,
            { size: 22, color: (i % 4 === 0) ? MV.C.cyan : MV.C.dim, alpha: rowA });
        }
        ctx.strokeStyle = MV.rgba(MV.RGB.cyan, 0.2 + beat.pulse * 0.12);
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(MV.CX - 78, MV.CY - 250); ctx.lineTo(MV.CX - 94, MV.CY - 250);
        ctx.lineTo(MV.CX - 94, MV.CY + 250); ctx.lineTo(MV.CX - 78, MV.CY + 250);
        ctx.moveTo(MV.CX + 78, MV.CY - 250); ctx.lineTo(MV.CX + 94, MV.CY - 250);
        ctx.lineTo(MV.CX + 94, MV.CY + 250); ctx.lineTo(MV.CX + 78, MV.CY + 250);
        ctx.stroke();
        ctx.restore();
        /* 漂移尘埃：位置为 (t) 的纯函数 */
        ctx.save();
        ctx.fillStyle = MV.rgba(MV.RGB.white, 1);
        for (i = 0; i < motes.length; i++) {
          var mo = motes[i];
          var mx = mo.x + Math.sin(t * 0.35 + mo.ph) * mo.amp;
          var my = ((mo.y - t * mo.sp) % MV.H + MV.H) % MV.H;
          ctx.globalAlpha = (0.12 + 0.16 * (0.5 + 0.5 * Math.sin(t * 1.7 + mo.ph))) * (1 - cp * 0.6);
          ctx.fillRect(mx - mo.sz * 0.5, my - mo.sz * 0.5, mo.sz, mo.sz);
        }
        ctx.restore();

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

    /* ===== ENRICH:love:data — 工厂期预生成（draw 零分配） ===== */
    var tOutro = 192.24, tOutroEnd = 205.28;        /* 器乐尾奏窗口 */
    var tEcgStart = 201.4;                          /* 缓速心电图起点 */
    /* 迷你参数心：纯函数漂升 */
    var mini = [];
    for (var mi = 0; mi < 11; mi++) {
      mini.push({
        x: HEART_CX + (MV.hash(mi * 3.3 + 1.7) - 0.5) * 860,
        y0: MV.hash(mi * 5.9 + 4.1) * MV.H,
        sp: 16 + MV.hash(mi * 7.1 + 2.9) * 22,
        sw: 18 + MV.hash(mi * 11.7 + 6.3) * 26,
        ph: MV.hash(mi * 13.9 + 8.5) * TAU,
        sc: 0.16 + MV.hash(mi * 17.3 + 3.7) * 0.16,
        tint: (mi % 3 === 0) ? MV.RGB.cyan : MV.RGB.pink
      });
    }
    /* 代数公式雨：ASCII 文本池 */
    var RAIN = [
      'x = 16 sin^3 t', 'y = 13 cos t - 5 cos 2t', '- 2 cos 3t - cos 4t',
      'dy/dx = f(t) / g(t)', 'r = 1 - sin(theta)', '(x^2 + y^2 - 1)^3 - x^2 y^3 = 0',
      'x = sin(t) cos(t)', 'lim d/dt [P(t)]', 'f(x) = 1 / (1 + e^-x)',
      'a^2 + b^2 = c^2', 'sum 1/2^n = 1', 'e^(i*pi) + 1 = 0'
    ];
    var rainCols = [];
    for (var ri = 0; ri < 12; ri++) {
      rainCols.push({
        x: 90 + ri * 158 + MV.hashS(ri * 4.3) * 20,
        sp: 60 + MV.hash(ri * 6.7 + 2.5) * 90,
        off: MV.hash(ri * 9.1 + 5.5) * 900,
        txt: RAIN[ri % RAIN.length],
        tint: (ri % 2 === 0) ? MV.RGB.cyan : MV.RGB.pink
      });
    }
    /* 缓速心电图：工厂期折线顶点（尖峰间距递增 → 越跳越慢；末段拉平） */
    var ECG = [];
    (function () {
      var n = 220, T = 0, lastSpike = 0, period = 0.55, wave;
      for (var ei = 0; ei < n; ei++) {
        var u = ei / (n - 1);
        T += 0.021;
        if (T >= lastSpike + period && T < 3.4) {
          lastSpike = T;
          period *= 1.16;
        }
        var local = T - lastSpike;
        wave = 0;
        if (T < 3.4) {
          wave = 0.10 * Math.exp(-Math.pow((local - 0.10) / 0.05, 2))
            - 0.16 * Math.exp(-Math.pow((local - 0.17) / 0.022, 2))
            + 1.00 * Math.exp(-Math.pow((local - 0.205) / 0.018, 2))
            - 0.30 * Math.exp(-Math.pow((local - 0.245) / 0.030, 2))
            + 0.24 * Math.exp(-Math.pow((local - 0.36) / 0.07, 2));
        }
        ECG.push({ u: u, v: wave });
      }
    })();

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

        /* ===== ENRICH:love:rain — 代数公式雨（184.5-188.5） ===== */
        var rainA = MV.clamp((t - tAlg - 0.1) / 0.5, 0, 1) * MV.clamp((188.5 - t) / 0.6, 0, 1);
        if (rainA > 0.01) {
          ctx.save();
          for (i = 0; i < rainCols.length; i++) {
            var rc = rainCols[i];
            for (var rj = 0; rj < 2; rj++) {
              var rry = ((rc.off + rj * 430 + t * rc.sp) % (MV.H + 240)) - 60;
              MV.text(ctx, rc.txt, rc.x, rry, { size: 19, color: rc.tint, alpha: rainA * 0.22 });
            }
          }
          ctx.restore();
        }

        /* ===== ENRICH:love:radial — 心跳径向网格脉冲 ===== */
        if (hb > 0.02) {
          ctx.save();
          ctx.strokeStyle = MV.rgba(MV.RGB.pink, hb * 0.14);
          ctx.lineWidth = 1;
          ctx.beginPath();
          for (i = 0; i < 24; i++) {
            var ra = i * TAU / 24 + t * 0.05;
            ctx.moveTo(HEART_CX + Math.cos(ra) * 150, HEART_CY + Math.sin(ra) * 150);
            ctx.lineTo(HEART_CX + Math.cos(ra) * 520, HEART_CY + Math.sin(ra) * 520);
          }
          ctx.stroke();
          ctx.strokeStyle = MV.rgba(MV.RGB.cyan, hb * 0.18);
          ctx.beginPath();
          ctx.arc(HEART_CX, HEART_CY, 170 + hb * 90, 0, TAU);
          ctx.stroke();
          ctx.restore();
        }

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

        /* ===== ENRICH:love:tangent — 参数点 + 切线（沿已描出的心形运动） ===== */
        if (hp > 0.02) {
          var pu2 = ((t - t0) * 0.085) % 1;
          if (pu2 < hp) {
            var th2 = -pu2 * TAU;
            var q2 = heartXY(th2);
            var qx2 = HEART_CX + (q2[0] - HEART_CX) * hs;
            var qy2 = HEART_CY + (q2[1] - HEART_CY) * hs;
            /* 屏幕切线 = 参数导数（y 轴翻转） */
            var dx2 = 48 * Math.pow(Math.sin(th2), 2) * Math.cos(th2) * HEART_S * hs;
            var yp2 = -13 * Math.sin(th2) + 10 * Math.sin(2 * th2) + 6 * Math.sin(3 * th2) + 4 * Math.sin(4 * th2);
            var dy2 = -yp2 * HEART_S * hs;
            var dl2 = Math.sqrt(dx2 * dx2 + dy2 * dy2) || 1;
            var ux2 = dx2 / dl2, uy2 = dy2 / dl2;
            var TL2 = 88;
            MV.line(ctx, qx2 - ux2 * TL2, qy2 - uy2 * TL2, qx2 + ux2 * TL2, qy2 + uy2 * TL2, MV.C.cyan, 1.6, 0.6);
            MV.line(ctx, qx2 - ux2 * TL2 * 0.35, qy2 - uy2 * TL2 * 0.35, qx2 + ux2 * TL2 * 0.35, qy2 + uy2 * TL2 * 0.35, MV.C.white, 3, 0.35);
            /* 法向短刻度 + 参数点 */
            MV.line(ctx, qx2 - uy2 * 10, qy2 + ux2 * 10, qx2 + uy2 * 10, qy2 - ux2 * 10, MV.C.pink, 1.2, 0.55);
            MV.drawMe(ctx, qx2, qy2, 5.5, 0.95, { tint: MV.RGB.pink, glow: 0.9 });
          }
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

        /* ===== ENRICH:love:outro — 器乐尾奏升级：笼内能量脉冲 + 回声心 ===== */
        if (t >= tOutro && t <= tOutroEnd) {
          var oa = MV.clamp((t - tOutro) / 0.5, 0, 1) * MV.clamp((tOutroEnd - t) / 0.35, 0, 1);
          /* 每拍：心形内部方环脉冲（裁剪在心形内） */
          ctx.save();
          ctx.beginPath();
          heartPath(ctx, hs);
          ctx.clip();
          ctx.strokeStyle = MV.rgba(MV.RGB.cyan, oa * (0.16 + beat.pulse * 0.3));
          ctx.lineWidth = 1.6;
          ctx.strokeRect(HEART_CX - 250, HEART_CY - 250, 500, 500);
          ctx.strokeStyle = MV.rgba(MV.RGB.pink, oa * (0.1 + beat.pulse * 0.22));
          var osq = 120 + (1 - beat.phase) * 260;
          ctx.strokeRect(HEART_CX - osq, HEART_CY - osq, osq * 2, osq * 2);
          ctx.restore();
          /* 回声心：每拍自中心扩散 4 枚（纯函数于 beat.phase） */
          for (i = 0; i < 4; i++) {
            var ef = (beat.phase + i * 0.25) % 1;
            var esc = 0.35 + ef * 1.5;
            ctx.save();
            ctx.globalAlpha = oa * (1 - ef) * 0.3;
            ctx.beginPath();
            for (var ej = 0; ej <= 48; ej++) {
              var eth = -ej / 48 * TAU;
              var eq = heartXY(eth);
              var ex2 = HEART_CX + (eq[0] - HEART_CX) * esc;
              var ey2 = HEART_CY + (eq[1] - HEART_CY) * esc;
              if (ej === 0) ctx.moveTo(ex2, ey2); else ctx.lineTo(ex2, ey2);
            }
            ctx.strokeStyle = MV.rgba(MV.RGB.pink, 1);
            ctx.lineWidth = 1.6;
            ctx.stroke();
            ctx.restore();
          }
        }

        ctx.restore();

        /* ===== ENRICH:love:mini — 迷你参数心漂升 ===== */
        var mFade = (1 - cp * 0.55) * MV.clamp((t - t0) / 2, 0, 1);
        if (mFade > 0.01) {
          ctx.save();
          for (i = 0; i < mini.length; i++) {
            var mh = mini[i];
            var my2 = MV.H + 60 - ((mh.y0 + t * mh.sp) % (MV.H + 140));
            var mx2 = mh.x + Math.sin(t * 0.4 + mh.ph) * mh.sw;
            ctx.save();
            ctx.translate(mx2, my2);
            ctx.scale(mh.sc, mh.sc);
            ctx.beginPath();
            for (var mj = 0; mj <= 36; mj++) {
              var mth = -mj / 36 * TAU;
              var mq = heartXY(mth);
              var mqx = mq[0] - HEART_CX, mqy = mq[1] - HEART_CY;
              if (mj === 0) ctx.moveTo(mqx, mqy); else ctx.lineTo(mqx, mqy);
            }
            ctx.strokeStyle = MV.rgba(mh.tint, mFade * 0.3);
            ctx.lineWidth = 2.2;
            ctx.stroke();
            ctx.restore();
          }
          ctx.restore();
        }

        /* ===== ENRICH:love:ecg — 缓速心电图（引向黑场） ===== */
        var ecgR = MV.clamp((t - tEcgStart) / 3.2, 0, 1);
        if (ecgR > 0.01 && t < tOutroEnd + 0.3) {
          var ecgA = MV.clamp((t - tEcgStart) / 0.4, 0, 1) * MV.clamp((tOutroEnd + 0.2 - t) / 0.4, 0, 1);
          var upto = Math.max(2, Math.floor(ecgR * ECG.length));
          ctx.save();
          ctx.strokeStyle = MV.rgba(MV.RGB.dim, ecgA * 0.25);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(120, 946); ctx.lineTo(MV.W - 120, 946);
          ctx.stroke();
          ctx.strokeStyle = MV.rgba(MV.RGB.cyan, ecgA * 0.55);
          ctx.lineWidth = 2;
          ctx.beginPath();
          var lastX = 120, lastY = 946;
          for (i = 0; i < upto; i++) {
            var ep = ECG[i];
            lastX = 120 + ep.u * (MV.W - 240);
            lastY = 946 - ep.v * 92;
            if (i === 0) ctx.moveTo(lastX, lastY); else ctx.lineTo(lastX, lastY);
          }
          ctx.stroke();
          MV.drawMe(ctx, lastX, lastY, 4.5, ecgA, { tint: MV.RGB.pink, glow: 0.8 });
          ctx.restore();
        }
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
    /* ENRICH:blackout:pre — 工厂期预计算（零逐帧分配） */
    var bi, bSeed = 0x1a2b3c4d;
    function bRnd() {
      bSeed = (bSeed + 0x6d2b79f5) | 0;
      var x = Math.imul(bSeed ^ (bSeed >>> 15), 1 | bSeed);
      x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    }
    var bRings = [];
    for (bi = 0; bi < 7; bi++) {
      bRings.push({ r0: 110 + bi * 44, sp: 0.14 + bRnd() * 0.12, ph: bi * 0.13, a: 0.07 + bRnd() * 0.1 });
    }
    var bNoise = [];
    for (bi = 0; bi < 26; bi++) {
      bNoise.push({ x: bRnd() * MV.W, w: 36 + bRnd() * 240, ph: bRnd() * 900, sp: 22 + bRnd() * 64, a: 0.018 + bRnd() * 0.04, fl: 0.5 + bRnd() * 6 });
    }
    var bTerm = 'TERMINATING';
    var bTermPre = [];
    for (bi = 0; bi <= bTerm.length; bi++) bTermPre.push(bTerm.slice(0, bi));
    var bCdN = 26, bCdW = 312, bCd = [];
    for (bi = 0; bi < bCdN; bi++) bCd.push(MV.CX - bCdW / 2 + (bi + 0.5) * (bCdW / bCdN));
    var bFontTerm = '22px ' + MV.FONT_MONO;
    var bFontLabel = '13px ' + MV.FONT_MONO;

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
        /* ENRICH:blackout:rings — 向心塌缩同心环（绘制于中心光点之下） */
        var bCol = MV.easeOutCubic(MV.clamp((t - t0) / 4.6, 0, 1));
        for (var bri = 0; bri < bRings.length; bri++) {
          var BR = bRings[bri];
          var brp = MV.clamp(bCol * (1 + BR.sp) - BR.ph, 0, 1);
          var brr = BR.r0 * (1 - brp);
          if (brr > 3) {
            MV.ring(ctx, MV.CX, MV.CY, brr, MV.C.dim, 1, (1 - brp) * BR.a);
          }
        }
        /* ENRICH:blackout:noise — 上升的静态噪点扫描线（确定性） */
        for (var bni = 0; bni < bNoise.length; bni++) {
          var BN = bNoise[bni];
          var bny = MV.H + 40 - (((t - t0) * BN.sp + BN.ph) % (MV.H + 80) + (MV.H + 80)) % (MV.H + 80);
          var bna = BN.a * (0.55 + 0.45 * Math.sin(t * BN.fl + BN.ph));
          if (bna > 0.005) {
            MV.line(ctx, BN.x - BN.w * 0.5, bny, BN.x + BN.w * 0.5, bny, MV.C.white, 1, bna);
          }
        }
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
        /* ENRICH:blackout:term — TERMINATING 打字后擦除 */
        var bTw = Math.floor(MV.clamp(
          MV.typeCount(t, t0 + 0.35, bTerm.length, 6.5) - MV.typeCount(t, t0 + 2.25, bTerm.length, 8.5),
          0, bTerm.length
        ));
        if (bTw > 0) {
          ctx.save();
          ctx.font = bFontTerm;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.globalAlpha = 0.4 * (1 - bCol * 0.65);
          ctx.fillStyle = MV.C.white;
          ctx.fillText(bTermPre[bTw], MV.CX, MV.CY + 84);
          ctx.restore();
        }
        /* ENRICH:blackout:countdown — 点状 SHUTDOWN 倒计时条 */
        var bCdA = (0.15 + 0.85 * (1 - bCol)) * 0.5;
        if (bCdA > 0.01) {
          ctx.save();
          ctx.font = bFontLabel;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.globalAlpha = bCdA * 0.55;
          ctx.fillStyle = MV.C.dim;
          ctx.fillText('SHUTDOWN', MV.CX - bCdW / 2, MV.CY + 126);
          var bLit = Math.ceil((1 - bCol) * bCdN);
          for (var bci = 0; bci < bCdN; bci++) {
            var bOn = bci < bLit;
            ctx.globalAlpha = bOn ? bCdA : bCdA * 0.15;
            ctx.fillStyle = bOn ? MV.C.cyan : MV.C.dim;
            ctx.fillRect(bCd[bci] - 2.5, MV.CY + 144, bOn ? 5 : 3, bOn ? 5 : 3);
          }
          ctx.restore();
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
    /* ENRICH:shutdown:pre — 工厂期预计算（零逐帧分配） */
    var si, sSeed = 0x51f3c9a7;
    function sRnd() {
      sSeed = (sSeed + 0x6d2b79f5) | 0;
      var x = Math.imul(sSeed ^ (sSeed >>> 15), 1 | sSeed);
      x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    }
    var sHex = '0123456789ABCDEF';
    var sGlyphs = [];
    for (si = 0; si < 22; si++) {
      var sCol = { x: (si + 0.5) * (MV.W / 22), sp: 46 + sRnd() * 90, ph: sRnd() * 1400, chars: [] };
      for (var sj = 0; sj < 8; sj++) sCol.chars.push(sHex.charAt((sRnd() * 16) | 0));
      sGlyphs.push(sCol);
    }
    var sFontRain = '15px ' + MV.FONT_MONO;
    var sFontRead = '15px ' + MV.FONT_MONO;
    var sRead = ['0x00', '0x01', '0x00', '0x0F', '0x00', '0x7E', '0x00', '0x3C', '0x00', '0x11', '0x00', '0x00'];
    /* ENRICH:shutdown:dump — 内存转储面板文本（工厂期预生成，draw 内零分配） */
    var sDump = [];
    for (si = 0; si < 40; si++) {
      sDump.push('0x' + ('0000000' + Math.floor(sRnd() * 0xfffffff).toString(16).toUpperCase()).slice(-7) +
        '  ' + ('000' + ((sRnd() * 0xffff) | 0).toString(16).toUpperCase()).slice(-4) +
        '  ' + sHex.charAt((sRnd() * 16) | 0) + sHex.charAt((sRnd() * 16) | 0) +
        ' ' + sHex.charAt((sRnd() * 16) | 0) + sHex.charAt((sRnd() * 16) | 0));
    }
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
        /* ENRICH:shutdown:rain — 219.76~228 背景十六进制雨（alpha<=0.08） */
        var sRainA = 0.16 * MV.clamp((t - 219.76) / 1.4, 0, 1) * MV.clamp((228 - t) / 2.2, 0, 1);
        if (sRainA > 0.002) {
          ctx.save();
          ctx.font = sFontRain;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = MV.C.dim;
          for (var sri = 0; sri < sGlyphs.length; sri++) {
            var SC = sGlyphs[sri];
            var sHead = (((t - t0) * SC.sp + SC.ph) % (MV.H + 320)) - 160;
            for (var srj = 0; srj < SC.chars.length; srj++) {
              var sry = sHead - srj * 24;
              if (sry < -8 || sry > MV.H + 8) continue;
              ctx.globalAlpha = sRainA * (srj === 0 ? 1.4 : (1 - srj / SC.chars.length));
              ctx.fillText(SC.chars[srj], SC.x, sry);
            }
          }
          ctx.restore();
        }
        /* ENRICH:shutdown:spinner — 右上角微弱进度弧（整幕，228 后衰减） */
        var sSpinA = MV.clamp((t - t0) / 1.5, 0, 1) * MV.clamp((232 - t) / 4, 0, 1) * 0.12;
        if (sSpinA > 0.004) {
          var sProg = MV.clamp((t - t0) / (236.52 - t0), 0, 1);
          var sSx = MV.W - 78, sSy = 78, sSr = 20;
          var sRot = (t - t0) * 1.15;
          ctx.save();
          ctx.globalAlpha = sSpinA * 0.5;
          ctx.strokeStyle = MV.C.dim;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(sSx, sSy, sSr, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = sSpinA;
          ctx.strokeStyle = MV.C.cyan;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(sSx, sSy, sSr, sRot, sRot + 1.5 * (1 - sProg * 0.75));
          ctx.stroke();
          ctx.restore();
        }
        /* ENRICH:shutdown:dump — 内存转储双栏面板（219.76 起，滚动，alpha<=0.30） */
        var sDumpA = MV.clamp((t - 219.76) / 1.6, 0, 1) * MV.clamp((233.5 - t) / 2.0, 0, 1) * 0.30;
        if (sDumpA > 0.004) {
          ctx.save();
          ctx.font = '13px ' + MV.FONT_MONO;
          ctx.textBaseline = 'middle';
          for (var sp = 0; sp < 2; sp++) {
            var spx = sp ? MV.W - 580 : 150, spw = 430, spy0 = 300, sph0 = 460;
            ctx.globalAlpha = sDumpA * 0.6;
            ctx.strokeStyle = MV.C.dim;
            ctx.lineWidth = 1;
            ctx.strokeRect(spx, spy0, spw, sph0);
            ctx.globalAlpha = sDumpA;
            ctx.textAlign = 'left';
            ctx.fillStyle = MV.C.cyan;
            ctx.fillText(sp ? 'STACK TRACE' : 'MEMORY DUMP', spx + 10, spy0 + 16);
            ctx.fillStyle = MV.C.dim;
            var sBase = Math.floor(((t - 219.76) * 34 + (sp ? 500 : 0)) / 24);
            var sOff = ((t - 219.76) * 34 + (sp ? 500 : 0)) % 24;
            for (var r0 = 0; r0 < 15; r0++) {
              var ry0 = spy0 + 44 + r0 * 28 - sOff;
              if (ry0 < spy0 + 30 || ry0 > spy0 + sph0 - 10) continue;
              var idx0 = ((r0 + sBase) % sDump.length + sDump.length) % sDump.length;
              ctx.globalAlpha = sDumpA * (1 - (r0 / 15) * 0.5);
              ctx.fillText(sDump[idx0], spx + 12, ry0);
            }
          }
          ctx.restore();
        }
        var fade = MV.clamp((t - 228) / 4, 0, 1); /* 232s 时完全黑屏 */
        var a0 = (1 - fade) * 0.75;
        if (a0 > 0.005) {
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
        /* ENRICH:shutdown:afterglow — 232~236.52 余晖（呼吸点 + 0x00 读数，alpha<=0.06） */
        var sAgA = MV.clamp((t - 232) / 1.2, 0, 1);
        if (sAgA > 0.01) {
          var sBr = 0.5 + 0.5 * Math.sin((t - 232) * 1.05);
          MV.drawMe(ctx, MV.CX, MV.CY, 1.5 + sBr * 0.7, 0.08 * sAgA * (0.45 + 0.55 * sBr), { glow: 0.3 });
          /* ENRICH:shutdown:afterglow — CRT 收束余线（全宽 1px，alpha<=0.06） */
          ctx.save();
          ctx.globalAlpha = 0.05 * sAgA * (1 - sBr);
          ctx.fillStyle = MV.C.cyan;
          ctx.fillRect(MV.CX - 320 * sBr - 40, MV.CY, 80 + 640 * (1 - sBr), 1);
          ctx.restore();
          var sRi = Math.floor((t - 232) / 0.6) % sRead.length;
          ctx.save();
          ctx.font = sFontRead;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.globalAlpha = 0.08 * sAgA;
          ctx.fillStyle = MV.C.dim;
          ctx.fillText(sRead[sRi], MV.W - 150, MV.H - 64);
          ctx.restore();
        }
      }
    };
  });
})();
