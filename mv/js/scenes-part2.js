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

    /* ---------- 新增层：染色体刻度轨 / 轴心表盘 / 初段打字雨 / trance 预热 ---------- */
    var RAIL_PAIRS = [
      { x1: 250, x2: 315, seed: 1.7, tag: 'XX' },
      { x1: 1605, x2: 1670, seed: 5.3, tag: 'XY' }
    ];
    var RAIL_Y0 = 210, RAIL_Y1 = 870, RAIL_TICK = 26;
    var TYPE_STR = 'GENDER :: SWITCH';
    var tType = t0 + 0.05;
    var RAIN_N = 10;
    var RAIN_CH = 'FM01';
    var rainX = new Float32Array(RAIN_N);
    var rainPh = new Float32Array(RAIN_N);
    var rainSp = new Float32Array(RAIN_N);
    (function () {
      for (var i = 0; i < RAIN_N; i++) {
        rainX[i] = 160 + i * 175;
        rainPh[i] = MV.hash(i * 7.7 + 1.1) * 1500;
        rainSp[i] = 90 + MV.hash(i * 3.3 + 5) * 150;
      }
    })();
    var tBuild = 100.8;
    var RIP_CH = 'FM01S';

    /* 双 z 层背景字形：中层（更快更亮）+ 前景（超大极淡），制造纵深 */
    function drawGlyphDepth(ctx, t) {
      var i;
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '58px "Segoe UI Symbol","Microsoft YaHei",sans-serif';
      ctx.fillStyle = MV.rgba(P, 0.09);
      for (i = 0; i < 9; i++) {
        var gx = 90 + i * 215 + Math.sin(t * 0.45 + i * 2.1) * 46;
        var gy = ((t * 62 + MV.hash(i * 9.9 + 3) * 1600) % 1600) - 200;
        ctx.fillText('♀♂SΩΔ'.charAt((i * 2 + Math.floor(t * 0.9)) % 5), gx, gy);
      }
      ctx.font = '150px "Segoe UI Symbol","Microsoft YaHei",sans-serif';
      ctx.fillStyle = MV.rgba(P, 0.045);
      for (i = 0; i < 3; i++) {
        var fx2 = ((t * 26 + MV.hash(i * 5.5 + 7) * 2400) % 2400) - 240;
        ctx.fillText('♀♂Δ'.charAt(i), fx2, 250 + i * 310);
      }
      ctx.restore();
    }

    /* 染色体刻度轨：双轨线 + 带纹 + 双向滑动标记（全场景） */
    function drawChromRails(ctx, t, alpha) {
      if (alpha <= 0.01) return;
      var i;
      ctx.save();
      ctx.globalAlpha = MV.clamp(alpha, 0, 1);
      for (i = 0; i < RAIL_PAIRS.length; i++) {
        var rp = RAIL_PAIRS[i];
        ctx.strokeStyle = MV.rgba(P, 0.55);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(rp.x1, RAIL_Y0); ctx.lineTo(rp.x1, RAIL_Y1);
        ctx.moveTo(rp.x2, RAIL_Y0); ctx.lineTo(rp.x2, RAIL_Y1);
        ctx.stroke();
        /* 轨间染色体带纹：长度由确定性哈希决定 */
        ctx.beginPath();
        for (var y = RAIL_Y0; y <= RAIL_Y1; y += RAIL_TICK) {
          var w = (MV.hash(rp.seed * 13 + y * 0.37) > 0.5) ? (rp.x2 - rp.x1) : (rp.x2 - rp.x1) * 0.45;
          ctx.moveTo(rp.x1, y); ctx.lineTo(rp.x1 + w, y);
        }
        ctx.stroke();
        /* 双向滑动标记 */
        var span = RAIL_Y1 - RAIL_Y0;
        var my1 = RAIL_Y0 + ((t * 34 + rp.seed * 190) % span);
        var my2 = RAIL_Y0 + span - ((t * 21 + rp.seed * 137) % span);
        ctx.strokeStyle = MV.C.white;
        ctx.globalAlpha = MV.clamp(alpha * 0.9, 0, 1);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(rp.x1 - 9, my1); ctx.lineTo(rp.x2 + 9, my1);
        ctx.moveTo(rp.x1 - 9, my2); ctx.lineTo(rp.x2 + 9, my2);
        ctx.stroke();
        ctx.globalAlpha = MV.clamp(alpha, 0, 1);
        /* 顶部染色体标签（ASCII） */
        ctx.font = '18px ' + MV.FONT_MONO;
        ctx.fillStyle = MV.rgba(P, 0.8);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(rp.tag, (rp.x1 + rp.x2) / 2, RAIL_Y0 - 26);
      }
      ctx.restore();
    }

    /* 轴心表盘：夹在三组字形交换之间，缓慢反向旋转的轴针 + 刻度 */
    function drawAxisDial(ctx, t, alpha) {
      if (alpha <= 0.01) return;
      ctx.save();
      ctx.translate(MV.CX, MV.CY);
      ctx.globalAlpha = MV.clamp(alpha, 0, 1);
      ctx.strokeStyle = MV.rgba(P, 0.5);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, 238, 0, TAU);
      ctx.stroke();
      ctx.beginPath();
      for (var i = 0; i < 24; i++) {
        var a = i * TAU / 24;
        var r1 = (i % 3 === 0) ? 228 : 234;
        ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
        ctx.lineTo(Math.cos(a) * 246, Math.sin(a) * 246);
      }
      ctx.stroke();
      var a1 = t * 0.35, a2 = -t * 0.23 + 1.1;
      ctx.strokeStyle = MV.rgba(P, 0.9);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a1) * 238, Math.sin(a1) * 238);
      ctx.lineTo(-Math.cos(a1) * 238, -Math.sin(a1) * 238);
      ctx.moveTo(Math.cos(a2) * 178, Math.sin(a2) * 178);
      ctx.lineTo(-Math.cos(a2) * 178, -Math.sin(a2) * 178);
      ctx.stroke();
      ctx.restore();
    }

    /* 初段空档：打字标题 + F/M 二进制雨（88.58-90.2 的静默被填满） */
    function drawOpening(ctx, t) {
      var n = MV.typeCount(t, tType, TYPE_STR.length, 13);
      var ta = MV.clamp(1 - (t - 90.8) / 1.6, 0, 1) * 0.55;
      if (n > 0 && ta > 0.01) {
        var shown = (n < TYPE_STR.length)
          ? (TYPE_STR.slice(0, n) + ((Math.floor(t * 3) % 2 === 0) ? '_' : ' '))
          : TYPE_STR;
        MV.text(ctx, shown, MV.CX, 178, { size: 26, color: MV.C.purple, alpha: ta, glow: 10 });
      }
      var fade = MV.clamp(1 - (t - 90.6) / 1.4, 0, 1);
      if (fade <= 0.01) return;
      ctx.save();
      ctx.font = '22px ' + MV.FONT_MONO;
      ctx.fillStyle = MV.C.purple;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      var step = Math.floor(t * 7);
      for (var c = 0; c < RAIN_N; c++) {
        var head = ((t * rainSp[c] + rainPh[c]) % 1500) - 140;
        for (var row = 0; row < 6; row++) {
          var y = head - row * 54;
          if (y < -40 || y > MV.H + 40) continue;
          var ch = RAIN_CH.charAt(Math.floor(MV.hash(c * 13.7 + row * 3.1 + step) * 4));
          ctx.globalAlpha = MV.clamp((0.20 - row * 0.02) * fade, 0, 0.25);
          ctx.fillText(ch, rainX[c] + Math.sin(t * 0.6 + c) * 10, y);
        }
      }
      ctx.restore();
    }

    /* trance 预热：内旋加速螺旋 + 向外扩散的字母涟漪（100.8 → 101.47） */
    function drawBuildUp(ctx, t) {
      var bp = MV.clamp((t - tBuild) / 2.4, 0, 1);
      if (bp <= 0.001) return;
      var i;
      ctx.save();
      ctx.fillStyle = MV.C.purple;
      for (i = 0; i < 64; i++) {
        var ph = i / 64;
        var k = MV.clamp(bp * 1.35 - ph * 0.35, 0, 1);
        var a = ph * TAU * 2 + t * (0.8 + k * 5.5);
        var r = 60 + 820 * Math.pow(1 - k, 1.5);
        ctx.globalAlpha = 0.22 * Math.sin(Math.PI * k) * bp;
        ctx.fillRect(MV.CX + Math.cos(a) * r - 1.5, MV.CY + Math.sin(a) * r - 1.5, 3, 3);
      }
      ctx.restore();
      ctx.save();
      ctx.font = '18px ' + MV.FONT_MONO;
      ctx.fillStyle = MV.C.purple;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (var j = 0; j < 4; j++) {
        var rp = (t - tBuild) / 0.55 - j;
        if (rp <= 0 || rp >= 1) continue;
        var rr = 70 + MV.easeOutCubic(rp) * 430;
        ctx.globalAlpha = (1 - rp) * 0.20;
        for (var k2 = 0; k2 < 10; k2++) {
          var aa = k2 * TAU / 10 + rp * 0.8;
          ctx.fillText(RIP_CH.charAt((Math.floor(Math.abs(aa) * 3) + j) % RIP_CH.length),
            MV.CX + Math.cos(aa) * rr, MV.CY + Math.sin(aa) * rr);
        }
      }
      ctx.restore();
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

        /* 深层背景：中层 + 前景字形（z 纵深） */
        drawGlyphDepth(ctx, t);
        /* 染色体刻度轨（左右双轨 + 滑动标记） */
        drawChromRails(ctx, t, MV.clamp((t - t0) / 0.6, 0, 1) * 0.42);
        /* 轴心表盘：字形交换的中轴 */
        drawAxisDial(ctx, t, 0.4 * MV.clamp((t - t0) / 0.6, 0, 1));
        /* 初段空档：打字标题 + F/M 二进制雨 */
        drawOpening(ctx, t);

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

        /* trance 预热：螺旋收束 + 字母涟漪（让 101.47 之前也有运动） */
        drawBuildUp(ctx, t);

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

    function ribbon(ctx, t, ang, dir, color, seed, stride) {
      stride = stride || 2;
      var ca = Math.cos(ang), sa = Math.sin(ang);
      ctx.save();
      ctx.font = '20px ' + MV.FONT_MONO;
      ctx.fillStyle = MV.rgba(color, 0.42);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (var i = -26; i <= 26; i += stride) {
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

    /* ---------- 新增层：蓄能计量 / 六边脉冲 / COMPLETION 收尾 / 四边频谱 ---------- */
    /* 104.2 → VIBRATIONS：分段蓄能条 + 百分比读数 */
    function drawChargeMeter(ctx, t, beat) {
      var bp = MV.clamp((t - tPre) / (tVib - tPre), 0, 1);
      if (bp <= 0.001) return;
      var ease = MV.smoothstep(bp);
      var x0 = MV.CX - 430, y = 162, w = 860, h = 14;
      var segs = 36, inner = (w - 8) / segs;
      ctx.save();
      ctx.strokeStyle = MV.rgba(MV.RGB.cyan, 0.22 + beat.pulse * 0.08);
      ctx.lineWidth = 1;
      ctx.strokeRect(x0, y - h * 0.5, w, h);
      ctx.fillStyle = MV.C.cyan;
      var lit = ease * segs;
      for (var i = 0; i < segs; i++) {
        if (i >= lit) break;
        ctx.globalAlpha = MV.clamp(0.12 + 0.09 * MV.hash(i * 3.3 + 1.2) + beat.pulse * 0.05, 0, 0.25);
        ctx.fillRect(x0 + 4 + i * inner, y - h * 0.5 + 3, inner - 3, h - 6);
      }
      ctx.restore();
      MV.text(ctx, 'VIBRATION CHARGE', x0 - 14, y, { size: 16, color: MV.C.cyan, alpha: 0.45, align: 'right' });
      MV.text(ctx, ('00' + Math.floor(ease * 100)).slice(-3) + '%', x0 + w + 14, y,
        { size: 16, color: MV.C.cyan, alpha: 0.45, align: 'left' });
    }

    /* 蓄能期同心六边形脉冲（速度随蓄能进度提升） */
    function drawHexPulses(ctx, t) {
      var bp = MV.clamp((t - tPre) / (tVib - tPre), 0, 1);
      if (bp <= 0.001 || t > tVib + 0.7) return;
      var fade = MV.clamp(1 - (t - tVib) / 0.7, 0, 1);
      var speed = 0.5 + bp * 0.95;
      for (var i = 0; i < 5; i++) {
        var p = ((t - tPre) * speed + i * 0.2) % 1;
        var r = MV.easeOutCubic(p) * 700;
        if (r < 2) continue;
        ctx.save();
        ctx.strokeStyle = MV.rgba(MV.RGB.purple, (1 - p) * 0.22 * fade);
        ctx.lineWidth = 1.6;
        MV.polyPath(ctx, MV.CX, MV.CY, r, 6, p * 1.2 + i);
        ctx.stroke();
        ctx.restore();
      }
    }

    /* 109.6-110.9：闭合环段 + 汇聚轨道粒子 */
    function drawCompletion(ctx, t) {
      var win = MV.clamp((t - 109.6) / 1.3, 0, 1);
      if (win <= 0.001) return;
      var close = MV.easeOutCubic(MV.clamp((t - 109.7) / 1.1, 0, 1));
      var gap = (1 - close) * 0.6;
      ctx.save();
      ctx.strokeStyle = MV.rgba(MV.RGB.white, 0.32);
      ctx.lineWidth = 2.2;
      for (var s = 0; s < 4; s++) {
        var a0 = s * TAU / 4 + t * 0.35 + gap * 0.5;
        var a1 = a0 + TAU / 4 - gap;
        ctx.beginPath();
        ctx.arc(MV.CX, MV.CY, 252, a0, a1);
        ctx.stroke();
      }
      ctx.restore();
      ctx.save();
      ctx.fillStyle = MV.C.cyan;
      for (var i = 0; i < 40; i++) {
        var ph = i / 40;
        var k = MV.clamp(win * 1.15 - ph * 0.15, 0, 1);
        var r = MV.lerp(430, 192, MV.easeOutCubic(k));
        var a = ph * TAU + t * (0.6 + 1.6 * win);
        ctx.globalAlpha = MV.clamp(0.22 * win, 0, 0.25);
        ctx.fillRect(MV.CX + Math.cos(a) * r - 1.5, MV.CY + Math.sin(a) * r - 1.5, 3, 3);
      }
      ctx.restore();
    }

    /* 四边频谱条（高频走上下，中频走左右） */
    function drawPerimeter(ctx, t, env, beat) {
      var i, v, sz;
      ctx.save();
      ctx.fillStyle = MV.C.cyan;
      for (i = 0; i < 44; i++) {
        var bx = (i + 0.5) * (MV.W / 44);
        v = MV.hash(i * 3.1 + 0.4) * 0.5 + env.high * 0.5 + beat.barPulse * 0.3;
        sz = 6 + v * 26;
        ctx.globalAlpha = MV.clamp(0.08 + v * 0.10, 0, 0.25);
        ctx.fillRect(bx - 3, 0, 6, sz);
        ctx.fillRect(bx - 3, MV.H - sz, 6, sz);
      }
      for (i = 0; i < 20; i++) {
        var by = (i + 0.5) * (MV.H / 20);
        v = MV.hash(i * 5.7 + 9.1) * 0.5 + env.mid * 0.5 + beat.pulse * 0.25;
        sz = 5 + v * 22;
        ctx.globalAlpha = MV.clamp(0.06 + v * 0.09, 0, 0.25);
        ctx.fillRect(0, by - 3, sz, 6);
        ctx.fillRect(MV.W - sz, by - 3, sz, 6);
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
        /* 四边频谱条 */
        drawPerimeter(ctx, t, env, beat);
        /* 反向旋转的两条数据丝带 */
        ribbon(ctx, t, t * 0.55, 1, MV.RGB.cyan, 3);
        ribbon(ctx, t, -t * 0.75 + 1.1, -1, MV.RGB.blue, 11);
        /* 第二对反向丝带（低密度，紫/青） */
        ribbon(ctx, t, -t * 0.55 + 2.2, -1, MV.RGB.purple, 7, 4);
        ribbon(ctx, t, t * 0.75 + 3.3, 1, MV.RGB.cyan, 17, 4);
        /* 蓄能期同心六边形脉冲 */
        drawHexPulses(ctx, t);

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

        /* 蓄能计量条（104.2 冲向 VIBRATIONS） */
        drawChargeMeter(ctx, t, beat);

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

        /* COMPLETION 收尾：闭合环段 + 汇聚轨道粒子 */
        drawCompletion(ctx, t);

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

    /* ---------- 新增层：信号衰减条 / 断续链路 / ping 倒计时 ---------- */
    var SIG_N = 24, SIG_X = 150, SIG_Y = 196, SIG_W = 430, SIG_H = 14;
    var tLink = 115.5;
    var LINK_N = 56;
    var LINK_Y = 540, LINK_X0 = 1010, LINK_X1 = 1548;

    /* 衰减的信号强度条：随每句 “You have left” 掉格 */
    function drawSignalBar(ctx, t, step, iso) {
      var a0 = MV.clamp((t - t0) / 0.4, 0, 1) * (1 - iso * 0.85);
      if (a0 <= 0.01) return;
      var s = MV.clamp(1 - 0.115 * step - (t - t0) / 16, 0, 1);
      var lit = Math.round(s * SIG_N);
      ctx.save();
      ctx.strokeStyle = MV.rgba(MV.RGB.cyan, 0.22 * a0);
      ctx.lineWidth = 1;
      ctx.strokeRect(SIG_X, SIG_Y, SIG_W, SIG_H);
      ctx.fillStyle = MV.C.cyan;
      var sw = (SIG_W - 4) / SIG_N;
      for (var i = 0; i < lit; i++) {
        ctx.globalAlpha = MV.clamp((0.16 + MV.hash(i * 3.7 + 0.9) * 0.08) * a0, 0, 0.25);
        ctx.fillRect(SIG_X + 2 + i * sw, SIG_Y + 2, sw - 2, SIG_H - 4);
      }
      ctx.restore();
      MV.text(ctx, 'SIGNAL LINK', SIG_X, SIG_Y - 18, { size: 14, color: MV.C.cyan, alpha: 0.4 * a0, align: 'left' });
      MV.text(ctx, ('00' + Math.floor(s * 100)).slice(-3) + '%', SIG_X + SIG_W, SIG_Y - 18,
        { size: 14, color: MV.C.cyan, alpha: 0.4 * a0, align: 'right' });
    }

    /* 逐段断裂的点状链路（115.5 → ISOLATION 前完全断开） */
    function drawLink(ctx, t, iso) {
      if (t < tLink) return;
      var lp = MV.clamp((t - tLink) / (tIso - tLink), 0, 1);
      var alpha = 0.24 * (1 - iso * 0.8);
      if (alpha <= 0.01) return;
      var keep = 1 - lp;
      ctx.save();
      ctx.fillStyle = MV.C.cyan;
      for (var i = 0; i < LINK_N; i++) {
        if (MV.hash(i * 7.3 + 2.2) > keep + 0.06) continue;
        var x = MV.lerp(LINK_X0, LINK_X1, i / (LINK_N - 1));
        var tw = 0.6 + 0.4 * Math.sin(t * 5 + i * 0.9);
        ctx.globalAlpha = MV.clamp(alpha * tw, 0, 0.25);
        ctx.fillRect(x - 1.5, LINK_Y - 1.5, 3, 3);
      }
      ctx.restore();
    }

    /* hex 形式的 ping 超时倒计时（0xFF → 0x00） */
    function drawPing(ctx, t, iso) {
      var a0 = MV.clamp((t - t0 - 0.3) / 0.5, 0, 1) * (1 - iso * 0.9);
      if (a0 <= 0.01) return;
      var remain = MV.clamp((tIso - t) / (tIso - t0), 0, 1);
      var hv = Math.floor(remain * 255);
      var blink = (Math.floor(t * 8) % 4 === 0) ? 1 : 0.82;
      MV.text(ctx, 'PING TIMEOUT 0x' + MV.hex(hv, 2), MV.CX, 146,
        { size: 17, color: MV.C.cyan, alpha: MV.clamp(0.42 * a0 * blink, 0, 1) });
    }

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

        /* 信号强度衰减条 + hex ping 倒计时 */
        drawSignalBar(ctx, t, step, iso);
        drawPing(ctx, t, iso);

        /* 各步收敛的环：每句 “You have left” 向内缩一圈 */
        for (i = 0; i < step; i++) {
          var age = t - stepT[i];
          if (age > 2.4) continue;
          var r = 420 - MV.easeOutCubic(MV.clamp(age / 2.0, 0, 1)) * 340;
          MV.ring(ctx, MV.CX, MV.CY, r, cold, 1.4, (1 - age / 2.4) * 0.3);
        }

        /* 115.5+：逐步断裂的点状连接线 */
        drawLink(ctx, t, iso);

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
          /* ISOLATION：仅保留一颗极慢漂移的冷光点 */
          var isoDx = MV.CX + Math.sin(t * 0.07) * 170;
          var isoDy = MV.CY + Math.cos(t * 0.05) * 100;
          MV.drawMe(ctx, isoDx, isoDy, 2.2, 0.16 * iso, { glow: 0.35, tint: cold });
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

    /* ---------- 新增层：线框碎块 / 拖尾粒子 / hex 标签 / 引力井 ---------- */
    var trail = new MV.Particles(200);
    var SHARD_N = 11;
    var shA = new Float32Array(SHARD_N), shR = new Float32Array(SHARD_N);
    var shSp = new Float32Array(SHARD_N), shSz = new Float32Array(SHARD_N);
    var shRot = new Float32Array(SHARD_N), shSide = new Float32Array(SHARD_N);
    (function () {
      for (var i = 0; i < SHARD_N; i++) {
        shA[i] = MV.hash(i * 3.7 + 0.5) * TAU;
        shR[i] = 300 + MV.hash(i * 7.1 + 2.3) * 360;
        shSp[i] = 0.06 + MV.hash(i * 5.3 + 4.1) * 0.13;
        shSz[i] = 26 + MV.hash(i * 9.9 + 6.7) * 40;
        shRot[i] = MV.hash(i * 11.3 + 1.9) * TAU;
        shSide[i] = 3 + (i % 3);
      }
    })();
    var LAB_N = 8;
    var labX = new Float32Array(LAB_N), labY = new Float32Array(LAB_N);
    var labSp = new Float32Array(LAB_N), labPh = new Float32Array(LAB_N);
    var labTxt = [];
    (function () {
      for (var i = 0; i < LAB_N; i++) {
        labX[i] = 160 + MV.hash(i * 3.1 + 8.8) * 1600;
        labY[i] = MV.hash(i * 7.7 + 3.3) * 1200;
        labSp[i] = 14 + MV.hash(i * 5.9 + 2.2) * 26;
        labPh[i] = MV.hash(i * 9.3 + 6.1) * TAU;
        labTxt.push('0x' + MV.hex(Math.floor(MV.hash(i * 13.7 + 4.4) * 0x100000), 5));
      }
    })();
    var tWell = 121.31;

    /* 缓慢漂移/自转的线框碎块轮廓 */
    function drawShards(ctx, t, alpha) {
      if (alpha <= 0.01) return;
      ctx.save();
      ctx.strokeStyle = MV.rgba(MV.RGB.white, 0.22 * alpha);
      ctx.lineWidth = 1.2;
      for (var i = 0; i < SHARD_N; i++) {
        var a = shA[i] + t * shSp[i];
        var x = MV.CX + Math.cos(a) * shR[i];
        var y = MV.CY + Math.sin(a) * shR[i] * 0.62;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(shRot[i] + t * (0.16 + (i % 4) * 0.07));
        MV.polyPath(ctx, 0, 0, shSz[i], shSide[i], 0);
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    }

    /* hex 碎片标签缓慢上浮 */
    function drawLabels(ctx, t, alpha) {
      if (alpha <= 0.01) return;
      ctx.save();
      ctx.font = '15px ' + MV.FONT_MONO;
      ctx.fillStyle = MV.C.cyan;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      for (var i = 0; i < LAB_N; i++) {
        var y = ((labY[i] - t * labSp[i]) % 1300 + 1300) % 1300 - 110;
        ctx.globalAlpha = MV.clamp(0.20 * alpha * (0.6 + 0.4 * Math.sin(t * 1.4 + labPh[i])), 0, 0.25);
        ctx.fillText(labTxt[i], labX[i] + Math.sin(t * 0.5 + labPh[i]) * 18, y);
      }
      ctx.restore();
    }

    /* 121.31-124.89：引力井同心环 + 加速内落点流 */
    function drawWell(ctx, t) {
      var wp = MV.clamp((t - tWell) / (tDis - tWell), 0, 1);
      if (wp <= 0.001) return;
      var fade = 1 - MV.clamp((t - tDis) / 0.9, 0, 1);
      if (fade <= 0.01) return;
      var i;
      ctx.save();
      for (i = 0; i < 5; i++) {
        var r = (110 + i * 145 + Math.sin(t * 1.2 + i * 1.7) * 16) * (1 - 0.3 * wp);
        ctx.strokeStyle = MV.rgba(MV.RGB.cyan, 0.13 * fade * (1 - i * 0.12));
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(MV.CX, MV.CY, Math.max(r, 2), 0, TAU);
        ctx.stroke();
      }
      ctx.restore();
      ctx.save();
      ctx.fillStyle = MV.C.cyan;
      for (i = 0; i < 44; i++) {
        var ph = i / 44;
        var p = MV.clamp(wp * 1.35 - ph * 0.4, 0, 1);
        if (p <= 0) continue;
        var rr = (1 - p * p) * (520 + MV.hash(i * 3.9) * 240) + 24;
        var aa = ph * TAU + p * 2.4 + t * 0.4;
        ctx.globalAlpha = MV.clamp(0.20 * fade * (1 - p * 0.4), 0, 0.25);
        ctx.fillRect(MV.CX + Math.cos(aa) * rr - 1.5, MV.CY + Math.sin(aa) * rr - 1.5, 3, 3);
      }
      ctx.restore();
    }

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
        trail.clear();
        burst(64, 1, 30);   /* 入场：光点炸裂成 64 片 */
      },
      exit: function () { trail.clear(); },
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
        /* 碎屑拖尾粒子：从飞行碎片上采样其速度方向 */
        var tdim = MV.clamp((t - tDis) / 1.0, 0, 1);
        if (fn > 0 && tdim < 0.92) {
          var rate = 26 + env.high * 26;
          var tn = rate * dt;
          var whole = Math.floor(tn);
          if (Math.random() < tn - whole) whole++;
          for (var s = 0; s < whole; s++) {
            var di = Math.floor(MV.hash(Math.floor(t * 60) * 3.1 + s * 17.7) * fn) % fn;
            trail.spawn(fx[di], fy[di],
              fvx[di] * 0.22 + MV.hashS(di * 3.3 + s) * 10,
              fvy[di] * 0.22 + MV.hashS(di * 5.1 + s) * 10,
              0.3 + MV.hash(s * 7.7 + 1.1) * 0.4,
              1.5 + MV.hash(s * 9.9 + 2.2) * 2, di);
          }
        }
        trail.step(dt, null);
      },
      draw: function (ctx, t, env, beat) {
        var i;
        var dim = MV.clamp((t - tDis) / 1.0, 0, 1);
        var col = MV.desat(MV.RGB.cyan, dim * 0.55);
        var alpha = 1 - dim * 0.55;
        /* 引力井（121.31+，绘于碎片之下） */
        drawWell(ctx, t);
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
        /* 碎屑拖尾（速度方向短流线） */
        trail.drawStreak(ctx, col, 0.42 * alpha, 0.03);
        /* 旋转线框碎块 + 漂移 hex 标签 */
        drawShards(ctx, t, alpha);
        drawLabels(ctx, t, alpha);
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
    /* ---------- 新增层：非法解析树 / 沙箱计 / 警告三角 / 块损坏 / 角部虚线 ---------- */
    var NT = 13;
    var ndX = new Float32Array(NT), ndY = new Float32Array(NT);
    (function () {
      ndX[0] = MV.CX; ndY[0] = 246;
      ndX[1] = MV.CX - 190; ndY[1] = 402;
      ndX[2] = MV.CX + 190; ndY[2] = 402;
      ndX[3] = MV.CX - 330; ndY[3] = 566;
      ndX[4] = MV.CX - 110; ndY[4] = 566;
      ndX[5] = MV.CX + 110; ndY[5] = 566;
      ndX[6] = MV.CX + 330; ndY[6] = 566;
      ndX[7] = MV.CX - 400; ndY[7] = 742;
      ndX[8] = MV.CX - 240; ndY[8] = 742;
      ndX[9] = MV.CX - 80; ndY[9] = 742;
      ndX[10] = MV.CX + 80; ndY[10] = 742;
      ndX[11] = MV.CX + 240; ndY[11] = 742;
      ndX[12] = MV.CX + 400; ndY[12] = 742;
    })();
    var NE = 12;
    var edA = new Int16Array([0, 0, 1, 1, 2, 2, 3, 4, 4, 5, 6, 6]);
    var edB = new Int16Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    var ndLabel = [];
    (function () {
      for (var i = 0; i < NT; i++) {
        ndLabel.push((i === 0) ? 'ROOT' : ('0x' + MV.hex(Math.floor(MV.hash(i * 7.7 + 3.1) * 0xffff), 4)));
      }
    })();
    var DASH = [16, 10];
    var lastCorrupt = -1, corruptIdx = -1, corruptT = -10;
    var TRI = [
      { x: 300, y: 268, s: 92, sp: 0.42, dir: 1, big: true },
      { x: 1620, y: 812, s: 92, sp: -0.34, dir: 1, big: true },
      { x: 1648, y: 236, s: 46, sp: 0.7, dir: -1, big: false },
      { x: 272, y: 836, s: 46, sp: -0.6, dir: -1, big: false }
    ];

    /* 非法解析树：节点逐个生长（125.7 → 131.22） */
    function drawParseTree(ctx, t) {
      var p = MV.clamp((t - t0) / (tIllegal - t0), 0, 1);
      if (p <= 0.001) return;
      var i;
      ctx.save();
      ctx.strokeStyle = MV.rgba(MV.RGB.red, 0.38);
      ctx.lineWidth = 1.3;
      for (i = 0; i < NE; i++) {
        var ci = edB[i];
        var age = p - ci / (NT - 1);
        if (age <= 0) continue;
        var kk = MV.clamp(age * 9, 0, 1);
        ctx.beginPath();
        ctx.moveTo(ndX[edA[i]], ndY[edA[i]]);
        ctx.lineTo(MV.lerp(ndX[edA[i]], ndX[ci], kk), MV.lerp(ndY[edA[i]], ndY[ci], kk));
        ctx.stroke();
      }
      ctx.restore();
      var newest = Math.floor(p * (NT - 1) + 0.0001);
      for (i = 0; i < NT; i++) {
        var age2 = p - i / (NT - 1);
        if (age2 <= 0) continue;
        var pulse = (i === newest) ? (1 - MV.clamp(age2 * 4, 0, 1)) * 0.5 : 0;
        ctx.save();
        ctx.strokeStyle = MV.rgba(MV.RGB.red, 0.42 + pulse * 0.4);
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(ndX[i], ndY[i], (i === 0 ? 10 : 6) + pulse * 5, 0, TAU);
        ctx.stroke();
        ctx.restore();
        if (i % 4 === 0) {
          MV.text(ctx, ndLabel[i], ndX[i] + 16, ndY[i] + 4,
            { size: 12, color: MV.C.red, alpha: 0.38, align: 'left' });
        }
      }
    }

    /* SANDBOX VIOLATION 计量条（与解析树同步充能） */
    function drawSandbox(ctx, t, beat) {
      var p = MV.clamp((t - t0) / (tIllegal - t0), 0, 1);
      if (p <= 0.001) return;
      var x0 = 560, y = 950, w = 800, h = 14, segs = 32;
      var e = Math.pow(p, 1.5);
      ctx.save();
      ctx.strokeStyle = MV.rgba(MV.RGB.red, 0.3 + beat.pulse * 0.12);
      ctx.lineWidth = 1;
      ctx.strokeRect(x0, y - h * 0.5, w, h);
      ctx.fillStyle = MV.C.red;
      var lit = e * segs;
      var sw = (w - 4) / segs;
      for (var i = 0; i < segs; i++) {
        if (i >= lit) break;
        ctx.globalAlpha = MV.clamp(0.14 + 0.08 * MV.hash(i * 2.9 + 4.4) + beat.pulse * 0.05, 0, 0.25);
        ctx.fillRect(x0 + 2 + i * sw, y - h * 0.5 + 2, sw - 2, h - 4);
      }
      ctx.restore();
      MV.text(ctx, 'SANDBOX VIOLATION', x0, y - 18, { size: 14, color: MV.C.red, alpha: 0.45, align: 'left' });
      MV.text(ctx, ('00' + Math.floor(e * 100)).slice(-3) + '%', x0 + w, y - 18,
        { size: 14, color: MV.C.red, alpha: 0.45, align: 'right' });
    }

    /* 旋转警告三角（左右各一对，大小两档） */
    function drawWarnTri(ctx, t, alpha) {
      if (alpha <= 0.01) return;
      for (var i = 0; i < TRI.length; i++) {
        var tr = TRI[i];
        ctx.save();
        ctx.translate(tr.x, tr.y);
        ctx.rotate(t * tr.sp * tr.dir + i * 0.7);
        ctx.strokeStyle = MV.rgba(MV.RGB.red, (tr.big ? 0.28 : 0.22) * alpha);
        ctx.lineWidth = tr.big ? 2 : 1.3;
        MV.polyPath(ctx, 0, 0, tr.s, 3, -Math.PI / 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, -tr.s * 0.34);
        ctx.lineTo(0, tr.s * 0.06);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, tr.s * 0.26, tr.s * 0.055, 0, TAU);
        ctx.stroke();
        ctx.restore();
      }
    }

    /* 节拍驱动的内容损坏方块（按 beat.idx 确定性取位） */
    function drawCorruption(ctx, t) {
      var age = t - corruptT;
      if (age < 0 || age > 0.16) return;
      var fade = 1 - age / 0.16;
      ctx.save();
      ctx.fillStyle = MV.C.red;
      for (var j = 0; j < 6; j++) {
        var seed = corruptIdx * 11.7 + j * 7.9;
        ctx.globalAlpha = MV.clamp((0.10 + MV.hash(seed + 5.1) * 0.10) * fade, 0, 0.25);
        ctx.fillRect(MV.hash(seed) * MV.W, MV.hash(seed + 1.3) * MV.H,
          90 + MV.hash(seed + 2.7) * 320, 16 + MV.hash(seed + 3.9) * 70);
      }
      ctx.restore();
    }

    /* 四角红色虚线向巨 X 汇聚（131.22+） */
    function drawConverge(ctx, t) {
      var p = MV.clamp((t - tIllegal) / 0.8, 0, 1);
      if (p <= 0.001 || t > tIllegal + 1.6) return;
      var fade = 1 - MV.clamp((t - tIllegal - 1.0) / 0.6, 0, 1);
      if (fade <= 0.01) return;
      var e = MV.easeOutCubic(p);
      var cx = MV.lerp(0, MV.CX, e), cy0 = MV.lerp(0, MV.CY, e);
      var dx = MV.lerp(MV.W, MV.CX, e);
      var dy = MV.lerp(MV.H, MV.CY, e);
      ctx.save();
      ctx.setLineDash(DASH);
      ctx.strokeStyle = MV.rgba(MV.RGB.red, 0.4 * fade);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(cx, cy0);
      ctx.moveTo(MV.W, 0); ctx.lineTo(dx, cy0);
      ctx.moveTo(0, MV.H); ctx.lineTo(cx, dy);
      ctx.moveTo(MV.W, MV.H); ctx.lineTo(dx, dy);
      ctx.stroke();
      ctx.restore();
    }

    var xReveal1 = 0, xReveal2 = 0, xShaken = false;

    return {
      meta: meta,
      enter: function () { xReveal1 = 0; xReveal2 = 0; xShaken = false; lastCorrupt = -1; corruptT = -10; },
      exit: function () {},
      update: function (t, dt, env, beat) {
        var rp = MV.clamp((t - tIllegal) / 0.8, 0, 1);
        xReveal1 = rp;
        xReveal2 = MV.clamp((rp - 0.3) / 0.7, 0, 1);
        /* 每个节拍触发一次确定性块损坏 */
        if (beat.idx !== lastCorrupt) {
          lastCorrupt = beat.idx;
          corruptIdx = beat.idx;
          corruptT = t;
        }
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

        /* 旋转警告三角 + 非法解析树 + 沙箱计量 + 块损坏 */
        drawWarnTri(ctx, t, 1);
        drawParseTree(ctx, t);
        drawSandbox(ctx, t, beat);
        drawCorruption(ctx, t);

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
        /* 四角红色虚线向巨 X 汇聚 */
        drawConverge(ctx, t);
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

    /* ---------- 新增层：钢琴琶音阶梯 / 数据线场 / 小节闪电 / 坍缩漩涡 ---------- */
    var KEYS = 28, KEY_W = 20, KEY_GAP = 6;
    var ROW_A_Y = 268, ROW_B_Y = 812;
    var KEY_X0 = MV.CX - (KEYS * (KEY_W + KEY_GAP)) / 2;
    var KEY_SPAN = KEYS * (KEY_W + KEY_GAP);
    var PAT = new Int16Array([0, 2, 4, 7, 9, 12, 14, 16, 18, 21, 23, 25]);
    var keyAlpha = new Float32Array(KEYS);
    var keyLift = new Float32Array(KEYS);
    var COL_B = MV.mix(MV.RGB.blue, MV.RGB.cyan, 0.35);
    var DATA_N = 14;
    var dataY = new Float32Array(DATA_N), dataPh = new Float32Array(DATA_N), dataSp = new Float32Array(DATA_N);
    (function () {
      for (var i = 0; i < DATA_N; i++) {
        dataY[i] = 64 + i * 68;
        dataPh[i] = MV.hash(i * 7.1 + 2.4) * 2600;
        dataSp[i] = 60 + MV.hash(i * 3.7 + 5.9) * 140;
      }
    })();
    var boltIdx = -1, boltT = -10;

    /* 钢琴琶音阶梯：半拍游标推进，和弦音（0/4/7）依次点亮并上浮 */
    function drawPiano(ctx, t, beat, col) {
      var step = (beat.t1 - beat.t0) * 0.5;
      var c = (t - t0) / step;
      var base = Math.floor(c);
      var i, j, s, o, age, pv;
      keyAlpha.fill(0);
      keyLift.fill(0);
      for (s = base - 10; s <= base; s++) {
        if (s < 0) continue;
        age = (c - s) * step;
        if (age > 1.5) continue;
        var en = Math.exp(-age * 3.0);
        pv = PAT[((s % PAT.length) + PAT.length) % PAT.length];
        for (o = 0; o < 3; o++) {
          var off = (o === 0) ? 0 : (o === 1 ? 4 : 7);
          var ka = (pv + off) % KEYS;
          var kb = KEYS - 1 - ((pv + off) % KEYS);
          if (en > keyAlpha[ka]) { keyAlpha[ka] = en; keyLift[ka] = en; }
          if (en > keyAlpha[kb]) { keyAlpha[kb] = en; keyLift[kb] = en; }
        }
      }
      /* 键盘底线 + 分隔刻度 */
      ctx.save();
      ctx.strokeStyle = MV.rgba(col, 0.10);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(KEY_X0 - 16, ROW_A_Y - 20);
      ctx.lineTo(KEY_X0 + KEY_SPAN + 16, ROW_A_Y - 20);
      ctx.moveTo(KEY_X0 - 16, ROW_B_Y + 2);
      ctx.lineTo(KEY_X0 + KEY_SPAN + 16, ROW_B_Y + 2);
      for (j = 0; j <= KEYS; j++) {
        var tx = KEY_X0 + j * (KEY_W + KEY_GAP) - KEY_GAP * 0.5;
        ctx.moveTo(tx, ROW_A_Y - 25); ctx.lineTo(tx, ROW_A_Y - 15);
        ctx.moveTo(tx, ROW_B_Y - 3); ctx.lineTo(tx, ROW_B_Y + 7);
      }
      ctx.stroke();
      ctx.restore();
      /* 上行（左→右升）/ 下行（右→左降）两组琴键 */
      ctx.save();
      ctx.fillStyle = MV.C.cyan;
      for (j = 0; j < KEYS; j++) {
        ctx.globalAlpha = MV.clamp(0.03 + keyAlpha[j] * 0.17, 0, 0.20);
        ctx.fillRect(KEY_X0 + j * (KEY_W + KEY_GAP), ROW_A_Y - 20 - keyLift[j] * 12, KEY_W, 34);
      }
      ctx.fillStyle = MV.rgba(COL_B, 1);
      for (j = 0; j < KEYS; j++) {
        ctx.globalAlpha = MV.clamp(0.03 + keyAlpha[j] * 0.17, 0, 0.20);
        ctx.fillRect(KEY_X0 + (KEYS - 1 - j) * (KEY_W + KEY_GAP), ROW_B_Y - 32 - keyLift[j] * 12, KEY_W, 34);
      }
      ctx.restore();
    }

    /* 缓慢流动的水平数据线场（alpha<=0.08） */
    function drawDataLines(ctx, t, col) {
      ctx.save();
      ctx.lineWidth = 1;
      ctx.strokeStyle = MV.rgba(col, 0.05);
      ctx.beginPath();
      for (var i = 0; i < DATA_N; i++) {
        ctx.moveTo(0, dataY[i]);
        ctx.lineTo(MV.W, dataY[i]);
      }
      ctx.stroke();
      ctx.strokeStyle = MV.rgba(col, 0.08);
      ctx.beginPath();
      for (var j = 0; j < DATA_N; j++) {
        var hx = ((t * dataSp[j] + dataPh[j]) % (MV.W + 520)) - 260;
        ctx.moveTo(hx, dataY[j]);
        ctx.lineTo(hx + 170, dataY[j]);
      }
      ctx.stroke();
      ctx.restore();
    }

    /* 小节线确定性闪电折线 */
    function drawBolt(ctx, t) {
      var age = t - boltT;
      if (boltIdx < 0 || age < 0 || age > 0.24) return;
      var fade = 1 - age / 0.24;
      var x = MV.hash(boltIdx * 7.7 + 2.2) * (MV.W - 500) + 250;
      var y = 40;
      ctx.save();
      ctx.strokeStyle = MV.rgba(MV.RGB.white, 0.3 * fade);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (var k = 0; k < 9; k++) {
        x += MV.hashS(boltIdx * 13.1 + k * 5.7) * 95;
        y += 48 + MV.hash(boltIdx * 3.9 + k * 7.3) * 62;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    }

    /* 146.2-147.66：坍缩尾段的旋涡环与内吸流线（绘于弹窗之下） */
    function drawVortex(ctx, t, col) {
      var vp = MV.clamp((t - 146.2) / (T1 - 146.2), 0, 1);
      if (vp <= 0.001) return;
      var fade = 1 - MV.clamp((vp - 0.85) / 0.15, 0, 1);
      if (fade <= 0.01) return;
      var i;
      ctx.save();
      for (i = 0; i < 8; i++) {
        var p = MV.clamp(vp * 1.5 - i * 0.09, 0, 1);
        if (p <= 0) continue;
        var r = (1 - p) * (740 - i * 38) + 26;
        ctx.strokeStyle = MV.rgba(col, 0.16 * (1 - p * 0.6) * fade);
        ctx.lineWidth = 1.4;
        MV.polyPath(ctx, MV.CX, MV.CY, r, 6, -p * 3 + i * 0.5);
        ctx.stroke();
      }
      ctx.restore();
      ctx.save();
      ctx.strokeStyle = MV.rgba(MV.RGB.white, 0.10 * fade);
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (i = 0; i < 26; i++) {
        var ph = i / 26;
        var pp = MV.clamp(vp * 1.6 - ph * 0.5, 0, 1);
        var rr = (1 - pp * pp) * 900 + 30;
        var aa = ph * TAU + vp * 6;
        ctx.moveTo(MV.CX + Math.cos(aa) * rr, MV.CY + Math.sin(aa) * rr);
        ctx.lineTo(MV.CX + Math.cos(aa + 0.06) * (rr - 70 * pp - 20),
          MV.CY + Math.sin(aa + 0.06) * (rr - 70 * pp - 20));
      }
      ctx.stroke();
      ctx.restore();
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
      enter: function () { dialogs.length = 0; idx = 0; lastBeat = -1; boltIdx = -1; boltT = -10; },
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
            /* 小节线闪电：确定性折线闪 0.24s */
            boltIdx = beat.idx;
            boltT = t;
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

        /* 流动数据线场（背景，alpha<=0.08） */
        drawDataLines(ctx, t, col);
        /* 钢琴琶音阶梯（本段器乐突破的视觉签名，绘于弹窗之下） */
        /* ENRICH:storm:pianotop — 琶音绘制改到弹窗之上（见 drawDialog 循环之后） */
        /* 小节闪电折线 */
        drawBolt(ctx, t);
        /* 坍缩尾段漩涡环 */
        drawVortex(ctx, t, col);

        /* 级联错误弹窗：按生成顺序绘制（后生成的在最上层） */
        for (i = 0; i < dialogs.length; i++) drawDialog(ctx, dialogs[i], t, col);
        /* ENRICH:storm:pianotop — 钢琴琶音键盘置于弹窗之上，确保密集段也可见 */
        drawPiano(ctx, t, beat, col);

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
