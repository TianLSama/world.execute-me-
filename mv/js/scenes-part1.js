/* ============================================================
 * scenes-part1.js —— 场景 1-6
 *   boot    (0.00 - 15.65)  开机自检：电源线、蓝图网格、终端日志
 *   awake   (15.65 - 29.71) 唤醒：“我”作为光点出现，节拍同心环
 *   math    (29.71 - 44.45) 数学定义：点集/圆/正弦/极限 几何动物园
 *   current (44.45 - 59.22) 电流：AC→DC、致盲、眩晕、时空、融合
 *   chorus  (59.22 - 74.04) 副歌爆发：粒子喷发、六边形环、线框球
 *   cute    (74.04 - 88.58) 荒诞温柔：茄子/番茄/花猫/神 线稿涂鸦
 * ============================================================ */
window.MV = window.MV || {};

(function () {
  'use strict';

  var MV = window.MV;
  var TAU = MV.TAU;

  /* ============================================================
   * 1. boot —— 开机
   * ============================================================ */
  MV.registerScene('boot', function (api) {
    var t0 = api.t0;
    var meta = { stars: 0, grid: 0 };
    var log = [];      /* 终端日志 {text, t, caps} */
    var noise = [];    /* CRT 噪点线 {y, a} */
    var pm = MV.partMap(0, 16);

    function onPart(s, i, part) {
      log.push({ text: part.en, t: MV.time(), caps: MV.isCaps(part.en) });
      if (log.length > 10) log.shift();
    }

    /* 右侧自检状态行（时间驱动） */
    var status = [
      { k: 'SYS', v: 'ONLINE', t: 1.2 },
      { k: 'POWER', v: 'OK', t: pm['Switch on the power line'] || 0.1 },
      { k: 'PROTECTION', v: 'ON', t: pm['PROTECTION'] || 2.9 },
      { k: 'OBJECT_CREATION', v: 'RUN', t: pm['OBJECT CREATION'] || 6.4 },
      { k: 'PARAMETERS', v: 'FILL', t: pm['Fill in my data parameters'] || 7.4 },
      { k: 'INITIALIZATION', v: 'DONE', t: pm['INITIALIZATION'] || 10.1 },
      { k: 'WORLD', v: 'SET', t: pm['Set up our new world'] || 11.1 },
      { k: 'SIMULATION', v: 'READY', t: pm['SIMULATION'] || 13.9 }
    ];

    /* ===== ENRICH:boot:data —— 预生成数据表（draw 内零分配） ===== */
    var COLX = [48, 1872];
    var COL_HEX = [], COL_CNT = [], COL_SPD = [];
    for (var ci0 = 0; ci0 < 64; ci0++) {
      COL_HEX.push(MV.hex(Math.floor(MV.hash(ci0 * 3.77 + 1.3) * 0xfffff), 5));
      COL_CNT.push('T-' + ('0000' + Math.floor(MV.hash(ci0 * 5.31 + 9.1) * 9999)).slice(-4));
      COL_SPD.push(0.5 + MV.hash(ci0 * 11.7 + 4.2) * 1.4);
    }
    var LED_ORDER = [];
    for (var lo0 = 0; lo0 < 24; lo0++) LED_ORDER.push(lo0);
    LED_ORDER.sort(function (a, b) { return MV.hash(a * 1.7 + 0.3) - MV.hash(b * 1.7 + 0.3); });
    var LIT_STR = [];
    for (var ls0 = 0; ls0 <= 24; ls0++) LIT_STR.push('LIT ' + ('00' + ls0).slice(-2) + '/24');
    var CUBE_V = [
      [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
      [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]
    ];
    var CUBE_E = [0, 1, 1, 2, 2, 3, 3, 0, 4, 5, 5, 6, 6, 7, 7, 4, 0, 4, 1, 5, 2, 6, 3, 7];
    var CUBE_PX = new Float32Array(8), CUBE_PY = new Float32Array(8);
    var LAD = [];
    for (var ld0 = 0; ld0 < 14; ld0++) {
      LAD.push({
        s: '0x' + MV.hex(Math.floor(MV.hash(ld0 * 9.13 + 3.3) * 0xffffff), 6),
        o: MV.hash(ld0 * 4.71 + 1.1) * 260,
        x: MV.CX + MV.hashS(ld0 * 6.07 + 8.8) * 96
      });
    }
    var YS = [];
    for (var ys0 = 0; ys0 <= 1080; ys0 += 4) YS.push('Y=' + ('0000' + ys0).slice(-4));

    return {
      meta: meta,
      enter: function () {
        log.length = 0;
        noise.length = 0;
        api.onPart(onPart);
      },
      exit: function () {},
      update: function (t, dt, env, beat) {
        var lt = t - t0;
        meta.stars = MV.clamp((lt - 0.8) / 3, 0, 1) * 0.7;
        meta.grid = MV.clamp((lt - 1.8) / 3, 0, 1) * (0.05 + env.low * 0.06);
        if (lt < 1.5 && Math.random() < 0.35) noise.push({ y: Math.random() * MV.H, a: 0.10 });
        for (var i = noise.length - 1; i >= 0; i--) {
          noise[i].a -= dt * 1.6;
          if (noise[i].a <= 0) noise.splice(i, 1);
        }
      },
      draw: function (ctx, t, env, beat) {
        var lt = t - t0;
        var i, k, x, y;

        /* --- CRT 开机亮线（0 ~ 0.6s） --- */
        if (lt < 0.7) {
          k = MV.clamp(lt / 0.6, 0, 1);
          var w = MV.easeOutQuint(k) * MV.W;
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          ctx.fillStyle = MV.rgba(MV.RGB.white, (1 - k) * 0.45);
          ctx.fillRect((MV.W - w) * 0.5, MV.CY - 1, w, 2);
          ctx.restore();
        }

        /* --- 电源线：左→右画出，之后化为 X 轴 --- */
        var pl = MV.clamp((lt - 0.35) / 1.15, 0, 1);
        if (pl > 0) {
          x = MV.easeOutCubic(pl) * MV.W;
          var settled = (pl >= 1);
          var la = settled ? 0.35 : 0.85;
          ctx.save();
          ctx.strokeStyle = MV.rgba(MV.RGB.cyan, la);
          ctx.lineWidth = settled ? 1.5 : 2.5;
          ctx.beginPath();
          ctx.moveTo(0, MV.CY);
          ctx.lineTo(x, MV.CY);
          ctx.stroke();
          if (!settled) {
            /* 推进头部亮点 */
            ctx.globalCompositeOperation = 'lighter';
            var g = ctx.createRadialGradient(x, MV.CY, 0, x, MV.CY, 42);
            g.addColorStop(0, MV.rgba(MV.RGB.white, 0.9));
            g.addColorStop(0.3, MV.rgba(MV.RGB.cyan, 0.4));
            g.addColorStop(1, MV.rgba(MV.RGB.cyan, 0));
            ctx.fillStyle = g;
            ctx.fillRect(x - 42, MV.CY - 42, 84, 84);
          }
          ctx.restore();
        }

        /* --- 坐标轴 + 刻度（1.8s 后淡入） --- */
        var ax = MV.clamp((lt - 1.8) / 2.2, 0, 1) * 0.5;
        if (ax > 0.01) {
          ctx.save();
          ctx.strokeStyle = MV.rgba(MV.RGB.cyan, ax);
          ctx.fillStyle = MV.rgba(MV.RGB.cyan, ax * 0.9);
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(0, MV.CY); ctx.lineTo(MV.W, MV.CY);
          ctx.moveTo(MV.CX, 0); ctx.lineTo(MV.CX, MV.H);
          ctx.stroke();
          ctx.font = '14px ' + MV.FONT_MONO;
          ctx.textAlign = 'center';
          for (i = -7; i <= 7; i++) {
            if (i === 0) continue;
            x = MV.CX + i * 120;
            ctx.beginPath(); ctx.moveTo(x, MV.CY - 5); ctx.lineTo(x, MV.CY + 5); ctx.stroke();
            ctx.fillText(String(i * 120), x, MV.CY + 20);
          }
          for (i = -4; i <= 4; i++) {
            if (i === 0) continue;
            y = MV.CY + i * 120;
            ctx.beginPath(); ctx.moveTo(MV.CX - 5, y); ctx.lineTo(MV.CX + 5, y); ctx.stroke();
          }
          ctx.textAlign = 'right';
          ctx.fillText('x', MV.W - 18, MV.CY - 16);
          ctx.fillText('y', MV.CX + 34, 22);
          ctx.restore();
        }

        /* --- 蓝图标注：1920 × 1080 尺寸线与角标（2.6s 后） --- */
        var bp = MV.clamp((lt - 2.6) / 1.5, 0, 1) * 0.22;
        if (bp > 0.01) {
          ctx.save();
          ctx.strokeStyle = MV.rgba(MV.RGB.cyan, bp);
          ctx.fillStyle = MV.rgba(MV.RGB.cyan, bp * 1.2);
          ctx.lineWidth = 1;
          /* 顶部尺寸线 */
          ctx.beginPath();
          ctx.moveTo(0, 64); ctx.lineTo(MV.W, 64);
          ctx.moveTo(0, 54); ctx.lineTo(0, 74);
          ctx.moveTo(MV.W, 54); ctx.lineTo(MV.W, 74);
          ctx.stroke();
          ctx.font = '15px ' + MV.FONT_MONO;
          ctx.textAlign = 'center';
          ctx.fillText('1920', MV.CX, 52);
          /* 左侧尺寸线 */
          ctx.beginPath();
          ctx.moveTo(64, 0); ctx.lineTo(64, MV.H);
          ctx.moveTo(54, 0); ctx.lineTo(74, 0);
          ctx.moveTo(54, MV.H); ctx.lineTo(74, MV.H);
          ctx.stroke();
          ctx.fillText('1080', 44, MV.CY);
          /* 四角角标 */
          var corners = [[40, 110], [MV.W - 40, 110], [40, MV.H - 40], [MV.W - 40, MV.H - 40]];
          for (i = 0; i < 4; i++) {
            var cx = corners[i][0], cy = corners[i][1];
            var sx = cx < MV.CX ? 1 : -1;
            var sy = cy < MV.CY ? 1 : -1;
            ctx.beginPath();
            ctx.moveTo(cx, cy + 26 * sy); ctx.lineTo(cx, cy); ctx.lineTo(cx + 26 * sx, cy);
            ctx.stroke();
          }
          ctx.restore();
        }

        /* --- 底部遥测示波线（3s 后） --- */
        var tl = MV.clamp((lt - 3) / 2, 0, 1);
        if (tl > 0.01) {
          ctx.save();
          ctx.strokeStyle = MV.rgba(MV.RGB.cyan, 0.35 * tl);
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          for (i = 0; i <= 180; i++) {
            x = 120 + i * (1680 / 180);
            var amp = 22 + env.mid * 46 + beat.pulse * 8;
            y = 920 - (Math.sin(x * 0.011 + t * 3.1) * 0.5 + 0.5) * amp;
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.stroke();
          ctx.strokeStyle = MV.rgba(MV.RGB.cyan, 0.18 * tl);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(120, 920); ctx.lineTo(1800, 920);
          ctx.stroke();
          ctx.font = '13px ' + MV.FONT_MONO;
          ctx.fillStyle = MV.rgba(MV.RGB.dim, 0.5 * tl);
          ctx.textAlign = 'left';
          ctx.fillText('TELEMETRY  L=' + env.low.toFixed(2) + '  M=' + env.mid.toFixed(2) +
            '  H=' + env.high.toFixed(2), 120, 902);
          ctx.restore();
        }

        /* --- 终端日志（左上角打字机） --- */
        ctx.save();
        ctx.font = '21px ' + MV.FONT_MONO;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        var ly = 132;
        for (i = 0; i < log.length; i++) {
          var e = log[i];
          var n = MV.typeCount(t, e.t, e.text.length, 30);
          var shown = e.text.slice(0, n);
          ctx.globalAlpha = 0.55;
          ctx.fillStyle = MV.rgba(MV.RGB.cyan, 0.55);
          ctx.fillText('>', 100, ly + i * 32);
          ctx.globalAlpha = e.caps ? 0.98 : 0.66;
          ctx.fillStyle = e.caps ? MV.C.cyan : MV.C.white;
          if (e.caps) { ctx.shadowColor = MV.C.cyan; ctx.shadowBlur = 10; }
          else { ctx.shadowBlur = 0; }
          ctx.fillText(shown, 124, ly + i * 32);
          ctx.shadowBlur = 0;
          /* 最后一行未打完时闪烁光标 */
          if (i === log.length - 1 && (t * 2) % 1 < 0.55) {
            var cw = ctx.measureText(shown).width;
            ctx.globalAlpha = 0.85;
            ctx.fillStyle = MV.C.cyan;
            ctx.fillRect(124 + cw + 4, ly + i * 32 - 10, 11, 20);
          }
        }
        ctx.restore();

        /* --- 右侧自检状态 --- */
        ctx.save();
        ctx.font = '16px ' + MV.FONT_MONO;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        for (i = 0; i < status.length; i++) {
          if (t < status[i].t) continue;
          y = 170 + i * 30;
          ctx.globalAlpha = 0.5;
          ctx.fillStyle = MV.C.dim;
          ctx.fillText(status[i].k, 1730, y);
          ctx.fillStyle = MV.C.cyan;
          ctx.globalAlpha = 0.75;
          ctx.fillText(status[i].v, 1800, y);
        }
        ctx.restore();

        /* --- CRT 噪点线 --- */
        if (noise.length) {
          ctx.save();
          ctx.fillStyle = MV.C.white;
          for (i = 0; i < noise.length; i++) {
            ctx.globalAlpha = noise[i].a;
            ctx.fillRect(0, noise[i].y, MV.W, 1.2);
          }
          ctx.restore();
        }

        /* --- 电源线完成后的小脉冲环 --- */
        if (pl > 0 && pl < 1) {
          MV.ring(ctx, MV.W - 4, MV.CY, 6 + (1 - pl) * 18, MV.C.cyan, 2, (1 - pl) * 0.5);
        }

        /* ============================================================
         * ENRICH:boot:hexcols —— 两侧十六进制滚动列（1.0s 起）
         * ============================================================ */
        var cg2 = MV.clamp((lt - 1.0) / 1.4, 0, 1);
        if (cg2 > 0.01) {
          var hDrift = (lt - 1.0) * 13 + env.high * 26;
          var rowH = 26;
          ctx.save();
          ctx.font = '13px ' + MV.FONT_MONO;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          for (var col = 0; col < 2; col++) {
            var colX = COLX[col];
            ctx.globalAlpha = 0.10 * cg2;
            for (var row = 0; row < 42; row++) {
              var yRow = row * rowH - (hDrift % rowH);
              var si = (row + Math.floor(hDrift / rowH) * (col ? 3 : 1) + col * 29) % 64;
              ctx.fillStyle = MV.hash(row * 2.3 + col * 11.1) < 0.22 ? MV.C.cyan : MV.C.dim;
              if (row % 2 === 0) ctx.fillText(COL_HEX[si], colX, yRow);
              else ctx.fillText(COL_CNT[(si + col * 7) % 64], colX, yRow);
              if (row % 4 === 1) ctx.fillRect(colX + (col ? 18 : -26), yRow - 1, 8, 1.2);
            }
          }
          ctx.restore();
        }

        /* ============================================================
         * ENRICH:boot:ledmatrix —— 右下 6x4 状态灯阵（1.0s 起）
         * ============================================================ */
        var lg2 = MV.clamp((lt - 1.0) / 1.5, 0, 1);
        if (lg2 > 0.01) {
          var litN = Math.floor(MV.clamp((lt - 1.0) / 13.5, 0, 1) * 24 + 0.001);
          var cellW = 22, cellH = 22, gap2 = 10;
          var gx2 = 1872 - 4 * cellW - 3 * gap2;
          var gy2 = 852;
          ctx.save();
          for (var r2 = 0; r2 < 6; r2++) {
            for (var c2 = 0; c2 < 4; c2++) {
              var cell = r2 * 4 + c2;
              var on = LED_ORDER[cell] < litN;
              var blink = MV.hash2(r2 * 7 + c2, beat.barIndex);
              var xx2 = gx2 + c2 * (cellW + gap2);
              var yy2 = gy2 + r2 * (cellH + gap2);
              if (on && blink < 0.72) {
                ctx.globalAlpha = (0.20 + beat.pulse * 0.28 + MV.hash(cell * 2.9) * 0.08) * lg2;
                ctx.fillStyle = blink < 0.16 ? MV.C.pink : MV.C.cyan;
                ctx.fillRect(xx2, yy2, cellW, cellH);
              } else {
                ctx.globalAlpha = 0.09 * lg2;
                ctx.strokeStyle = MV.C.dim;
                ctx.lineWidth = 1;
                ctx.strokeRect(xx2, yy2, cellW, cellH);
              }
            }
          }
          ctx.globalAlpha = 0.34 * lg2;
          ctx.fillStyle = MV.C.dim;
          ctx.font = '12px ' + MV.FONT_MONO;
          ctx.textAlign = 'right';
          ctx.textBaseline = 'middle';
          ctx.fillText('STATUS', gx2 - 14, gy2 + 8);
          ctx.fillText(LIT_STR[litN], gx2 - 14, gy2 + 30);
          ctx.restore();
        }

        /* ============================================================
         * ENRICH:boot:assembly —— 线框实体生长（6.38s）+ 线框行星（13.89s）
         * ============================================================ */
        var asA = MV.clamp((lt - 6.38) / 0.6, 0, 1);
        if (asA > 0.01) {
          var asX = 300, asY = 745, asS = 62;
          var asAy = 0, asAx = 0.42;
          var cubeOn = lt >= 9.2;
          if (cubeOn) asAy = (lt - 9.2) * 0.5;
          for (var j2 = 0; j2 < 8; j2++) {
            var vv = CUBE_V[j2];
            var cyaw = Math.cos(asAy), syaw = Math.sin(asAy);
            var vx1 = vv[0] * cyaw + vv[2] * syaw;
            var vz1 = -vv[0] * syaw + vv[2] * cyaw;
            var cpit = Math.cos(asAx), spit = Math.sin(asAx);
            var vy2 = vv[1] * cpit - vz1 * spit;
            var pers = 1 / (1 + (vv[1] * spit + vz1 * cpit) * 0.16);
            CUBE_PX[j2] = asX + vx1 * asS * pers;
            CUBE_PY[j2] = asY + vy2 * asS * pers;
          }
          ctx.save();
          ctx.lineWidth = 1.6;
          ctx.lineCap = 'round';
          ctx.strokeStyle = MV.C.cyan;
          if (lt < 7.08) {
            var pk = MV.easeOutBack(MV.clamp((lt - 6.38) / 0.5, 0, 1));
            ctx.globalAlpha = 0.5 * pk;
            ctx.fillStyle = MV.C.white;
            ctx.fillRect(asX - 2.5, asY - 2.5, 5, 5);
            MV.cross(ctx, asX, asY, 10 + 18 * pk, MV.C.cyan, 0.3 * pk, 1);
          } else if (lt < 7.78) {
            var lp = MV.clamp((lt - 7.08) / 0.7, 0, 1);
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.moveTo(CUBE_PX[0], CUBE_PY[0]);
            ctx.lineTo(MV.lerp(CUBE_PX[0], CUBE_PX[1], lp), MV.lerp(CUBE_PY[0], CUBE_PY[1], lp));
            ctx.stroke();
          } else if (lt < 8.48) {
            var tp = MV.clamp((lt - 7.78) / 0.7, 0, 1);
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            for (var j3 = 0; j3 < 3; j3++) {
              var e0 = j3, e1 = (j3 + 1) % 3;
              var ek = MV.clamp(tp * 3 - j3, 0, 1);
              ctx.moveTo(CUBE_PX[e0], CUBE_PY[e0]);
              ctx.lineTo(MV.lerp(CUBE_PX[e0], CUBE_PX[e1], ek), MV.lerp(CUBE_PY[e0], CUBE_PY[e1], ek));
            }
            ctx.stroke();
          } else {
            var cpr = MV.clamp((lt - 8.48) / 0.72, 0, 1);
            ctx.globalAlpha = cubeOn ? 0.26 : 0.5;
            ctx.beginPath();
            for (var j4 = 0; j4 < 12; j4++) {
              var a0 = CUBE_E[j4 * 2], b0 = CUBE_E[j4 * 2 + 1];
              var ek2 = cubeOn ? 1 : MV.clamp(cpr * 12 - j4, 0, 1);
              if (ek2 <= 0) continue;
              ctx.moveTo(CUBE_PX[a0], CUBE_PY[a0]);
              ctx.lineTo(MV.lerp(CUBE_PX[a0], CUBE_PX[b0], ek2), MV.lerp(CUBE_PY[a0], CUBE_PY[b0], ek2));
            }
            ctx.stroke();
            ctx.globalAlpha = 0.34;
            ctx.fillStyle = MV.C.cyan;
            for (var j5 = 0; j5 < 8; j5++) ctx.fillRect(CUBE_PX[j5] - 1.4, CUBE_PY[j5] - 1.4, 2.8, 2.8);
          }
          ctx.globalAlpha = 0.4 * asA;
          ctx.fillStyle = MV.C.dim;
          ctx.font = '14px ' + MV.FONT_MONO;
          ctx.textAlign = 'center';
          ctx.fillText(lt < 7.08 ? 'P 01/04 POINT' : lt < 7.78 ? 'P 02/04 LINE' : lt < 8.48 ? 'P 03/04 TRIANGLE' : 'P 04/04 CUBE', asX, asY + 132);
          ctx.restore();
        }
        var pn = MV.clamp((lt - 13.89) / 0.9, 0, 1);
        if (pn > 0.01) {
          var pnx = 1640, pny = 800, pnr = 78 * MV.easeOutBack(pn);
          ctx.save();
          ctx.strokeStyle = MV.C.cyan;
          ctx.lineWidth = 1.3;
          ctx.globalAlpha = 0.30 * pn;
          ctx.beginPath(); ctx.arc(pnx, pny, pnr, 0, TAU); ctx.stroke();
          ctx.globalAlpha = 0.20 * pn;
          for (var j6 = -2; j6 <= 2; j6++) {
            if (j6 === 0) continue;
            var latR = pnr * Math.sqrt(1 - (j6 / 3) * (j6 / 3));
            ctx.beginPath();
            ctx.ellipse(pnx, pny + j6 * pnr * 0.33, latR, pnr * 0.16, 0, 0, TAU);
            ctx.stroke();
          }
          ctx.globalAlpha = 0.22 * pn;
          for (var j7 = 0; j7 < 4; j7++) {
            var lonW = pnr * Math.cos(j7 * Math.PI / 4);
            ctx.beginPath();
            ctx.ellipse(pnx, pny, Math.abs(lonW), pnr, 0, 0, TAU);
            ctx.stroke();
          }
          ctx.globalAlpha = 0.26 * pn;
          ctx.beginPath();
          ctx.ellipse(pnx, pny, pnr * 1.75, pnr * 0.52, -0.42 + Math.sin(lt * 0.15) * 0.04, 0, TAU);
          ctx.stroke();
          ctx.globalAlpha = 0.4 * pn;
          ctx.fillStyle = MV.C.dim;
          ctx.font = '14px ' + MV.FONT_MONO;
          ctx.textAlign = 'center';
          ctx.fillText('PLANET U-04', pnx, pny + pnr + 40);
          ctx.restore();
        }

        /* ============================================================
         * ENRICH:boot:ladder —— 底部上升十六进制地址梯（10.5-15.65s）
         * ============================================================ */
        var lad = MV.clamp((lt - 10.5) / 0.8, 0, 1);
        if (lad > 0.01) {
          ctx.save();
          ctx.font = '14px ' + MV.FONT_MONO;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          for (var ldI = 0; ldI < 14; ldI++) {
            var it = LAD[ldI];
            var ly2 = 1040 - (((lt - 10.5) * 36 + it.o) % 300);
            var la2 = MV.clamp((ly2 - 740) / 300, 0, 1);
            if (la2 <= 0.01) continue;
            ctx.globalAlpha = 0.22 * lad * la2;
            ctx.fillStyle = ldI % 3 === 0 ? MV.C.cyan : MV.C.dim;
            ctx.fillText(it.s, it.x, ly2);
            ctx.fillRect(it.x - 60, ly2 + 8, 120 * la2, 1);
          }
          ctx.restore();
        }

        /* ============================================================
         * ENRICH:boot:sweep —— 蓝图扫描条读数 + 全屏 CRT 扫描线
         * ============================================================ */
        var sw = MV.clamp((lt - 4.5) / 0.9, 0, 1);
        if (sw > 0.01) {
          var swP = ((lt - 4.5) % 4) / 4;
          var swY = swP * MV.H;
          var swI = MV.clamp(Math.round(swY / 4), 0, 270);
          ctx.save();
          ctx.strokeStyle = MV.C.cyan;
          ctx.lineWidth = 1;
          ctx.globalAlpha = 0.15 * sw;
          ctx.beginPath(); ctx.moveTo(0, swY); ctx.lineTo(MV.W, swY); ctx.stroke();
          ctx.globalAlpha = 0.09 * sw;
          ctx.beginPath(); ctx.moveTo(0, swY - 6); ctx.lineTo(MV.W, swY - 6); ctx.stroke();
          ctx.font = '13px ' + MV.FONT_MONO;
          ctx.textAlign = 'right';
          ctx.textBaseline = 'middle';
          ctx.globalAlpha = 0.34 * sw;
          ctx.fillStyle = MV.C.cyan;
          ctx.fillText(YS[swI], MV.W - 96, swY - 14);
          ctx.restore();
        }
        var crt2 = MV.clamp((lt - 5.0) / 0.6, 0, 1);
        if (crt2 > 0.01) {
          var crtY = ((lt - 5.0) % 1.5) / 1.5 * MV.H;
          ctx.save();
          ctx.fillStyle = MV.C.white;
          ctx.globalAlpha = 0.06 * crt2;
          ctx.fillRect(0, crtY, MV.W, 1.5);
          ctx.globalAlpha = 0.025 * crt2;
          ctx.fillRect(0, crtY - 26, MV.W, 26);
          ctx.restore();
        }
      }
    };
  });

  /* ============================================================
   * 2. awake —— 唤醒
   * ============================================================ */
  MV.registerScene('awake', function (api) {
    var t0 = api.t0;
    var meta = { stars: 0.75, grid: 0.05 };
    var rings = [];
    var lastBeat = -1;

    /* ===== ENRICH:awake:data —— 预计算（draw 内零分配） ===== */
    var SPEC_N = 24;
    var SPEC_BAND = new Int8Array(SPEC_N);
    var SPEC_VAR = new Float32Array(SPEC_N);
    for (var sp0 = 0; sp0 < SPEC_N; sp0++) {
      SPEC_BAND[sp0] = sp0 < 8 ? 0 : (sp0 < 16 ? 1 : 2);
      SPEC_VAR[sp0] = 0.45 + MV.hash(sp0 * 3.31 + 0.9) * 0.55;
    }
    var SPK_N = 60;
    var SPK_Y = new Float32Array(SPK_N);
    for (var sk0 = 0; sk0 < SPK_N; sk0++) SPK_Y[sk0] = 170 + sk0 * 12.4;
    var CST_N = 40;
    var CNX = new Float32Array(CST_N), CNY = new Float32Array(CST_N);
    var CPH = new Float32Array(CST_N), CSR = new Float32Array(CST_N);
    for (var cn0 = 0; cn0 < CST_N; cn0++) {
      var caA = MV.hash(cn0 * 3.13 + 0.7) * TAU;
      var caR = 280 + MV.hash(cn0 * 7.91 + 2.2) * 560;
      CNX[cn0] = MV.CX + Math.cos(caA) * caR * 0.98;
      CNY[cn0] = MV.CY + Math.sin(caA) * caR * 0.60;
      CPH[cn0] = MV.hash(cn0 * 5.57 + 4.1) * TAU;
      CSR[cn0] = 2.0 + MV.hash(cn0 * 9.23 + 6.6) * 2.0;
    }
    var LINK_A = new Int16Array(CST_N), LINK_B = new Int16Array(CST_N);
    var linkN = 0;
    for (var ln0 = 0; ln0 < CST_N; ln0++) {
      var bestN = -1, bestD = 1e9;
      for (var ln1 = 0; ln1 < CST_N; ln1++) {
        if (ln1 === ln0) continue;
        var dxN = CNX[ln0] - CNX[ln1], dyN = CNY[ln0] - CNY[ln1];
        var dN = dxN * dxN + dyN * dyN;
        if (dN < bestD) { bestD = dN; bestN = ln1; }
      }
      if (bestN > ln0) { LINK_A[linkN] = ln0; LINK_B[linkN] = bestN; linkN++; }
    }
    var BLIP_N = 8;
    var BLIP_A = new Float32Array(BLIP_N), BLIP_R = new Float32Array(BLIP_N);
    for (var bl0 = 0; bl0 < BLIP_N; bl0++) {
      BLIP_A[bl0] = MV.hash(bl0 * 4.19 + 1.7) * TAU;
      BLIP_R[bl0] = 120 + MV.hash(bl0 * 8.53 + 3.9) * 360;
    }
    var EQ_N = 16;
    var ALOG = [
      { s: '> self :: boot', t: 16.2 },
      { s: '> model :: execute(world)', t: 18.4 },
      { s: '> binding signal', t: 21.0 },
      { s: '> kernel :: ready', t: 23.5 },
      { s: '> loop :: run(forever)', t: 26.0 },
      { s: '> heart :: 2.400 GHz', t: 28.4 }
    ];

    return {
      meta: meta,
      enter: function () { rings.length = 0; lastBeat = -1; },
      exit: function () {},
      update: function (t, dt, env, beat) {
        if (beat.idx !== lastBeat) {
          lastBeat = beat.idx;
          rings.push({ age: 0, power: 0.5 + env.mid * 0.7 });
        }
        for (var i = rings.length - 1; i >= 0; i--) {
          rings[i].age += dt;
          if (rings[i].age > 1.6) rings.splice(i, 1);
        }
      },
      draw: function (ctx, t, env, beat) {
        var lt = t - t0;
        var appear = MV.clamp(lt / 0.9, 0, 1);
        var i, p;

        /* ============================================================
         * ENRICH:awake:pulse —— 整屏节拍能量脉冲（首个 drop 冲击感）
         * ============================================================ */
        var puA = MV.clamp(lt / 0.6, 0, 1);
        if (puA > 0.01) {
          var eP = beat.pulse * 0.030 + beat.barPulse * 0.020;
          if (eP > 0.001) {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.fillStyle = MV.rgba(MV.RGB.cyan, eP * puA);
            ctx.fillRect(0, 0, MV.W, MV.H);
            ctx.restore();
          }
        }

        /* ============================================================
         * ENRICH:awake:constellation —— 漂移星座 + 最近邻连线（最底层）
         * ============================================================ */
        var cstA = MV.clamp(lt / 0.8, 0, 1) * 0.12;
        if (cstA > 0.005) {
          var jj, nX, nY;
          ctx.save();
          ctx.strokeStyle = MV.rgba(MV.RGB.cyan, 1);
          ctx.lineWidth = 1;
          ctx.globalAlpha = cstA * (0.35 + beat.pulse * 0.45);
          ctx.beginPath();
          for (jj = 0; jj < linkN; jj++) {
            var ia = LINK_A[jj], ib = LINK_B[jj];
            ctx.moveTo(CNX[ia] + Math.sin(t * 0.31 + CPH[ia]) * 16, CNY[ia] + Math.cos(t * 0.27 + CPH[ia]) * 12);
            ctx.lineTo(CNX[ib] + Math.sin(t * 0.31 + CPH[ib]) * 16, CNY[ib] + Math.cos(t * 0.27 + CPH[ib]) * 12);
          }
          ctx.stroke();
          ctx.fillStyle = MV.C.cyan;
          for (jj = 0; jj < CST_N; jj++) {
            nX = CNX[jj] + Math.sin(t * 0.31 + CPH[jj]) * 16;
            nY = CNY[jj] + Math.cos(t * 0.27 + CPH[jj]) * 12;
            ctx.globalAlpha = cstA * (0.5 + beat.pulse * 0.4) * (0.6 + 0.4 * Math.sin(t * 1.7 + CPH[jj]));
            var nsz = CSR[jj] * (0.7 + beat.pulse * 0.5);
            ctx.fillRect(nX - nsz * 0.5, nY - nsz * 0.5, nsz, nsz);
          }
          ctx.restore();
        }

        /* 雷达辐条（缓慢旋转） */
        ctx.save();
        ctx.strokeStyle = MV.rgba(MV.RGB.cyan, 0.05 + beat.pulse * 0.05);
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (i = 0; i < 8; i++) {
          var a = t * 0.12 + i * TAU / 8;
          ctx.moveTo(MV.CX + Math.cos(a) * 70, MV.CY + Math.sin(a) * 70);
          ctx.lineTo(MV.CX + Math.cos(a) * 520, MV.CY + Math.sin(a) * 520);
        }
        ctx.stroke();
        ctx.restore();

        /* 静态同心环 */
        for (i = 1; i <= 3; i++) {
          MV.ring(ctx, MV.CX, MV.CY, 80 + i * 62, MV.C.cyan, 1,
            0.05 + 0.03 * Math.sin(t * 0.7 + i) + beat.pulse * 0.04);
        }

        /* 节拍扩散环 */
        for (i = 0; i < rings.length; i++) {
          var r = rings[i];
          p = MV.clamp(r.age / 1.6, 0, 1);
          var rad = MV.easeOutCubic(p) * (300 + r.power * 260);
          MV.ring(ctx, MV.CX, MV.CY, rad, MV.C.cyan, 2, (1 - p) * 0.45);
        }

        /* “我”的光点 */
        var rr = (7 + env.low * 5 + beat.pulse * 4) * appear;
        MV.drawMe(ctx, MV.CX, MV.CY, rr, appear, { glow: 0.7 + env.mid * 0.8 });

        /* 创造者扫描线（右侧，缓慢上下） */
        var cy = 300 + Math.sin(t * 0.22) * 160;
        MV.drawCreator(ctx, 1560, cy, (0.08 + beat.pulse * 0.06) * appear, 620);

        /* 唤醒字幕小注记 */
        if (appear > 0.9) {
          MV.text(ctx, 'LISTENING :: ' + (beat.idx + 1), 1560, 940,
            { size: 15, color: MV.C.dim, alpha: 0.35 });
        }

        /* ============================================================
         * ENRICH:awake:spectrum —— 24 根频谱环（env + beat）
         * ============================================================ */
        var spA = MV.clamp(lt / 0.7, 0, 1) * 0.18;
        if (spA > 0.005) {
          for (i = 0; i < SPEC_N; i++) {
            var bd = SPEC_BAND[i];
            var ev = bd === 0 ? env.low : (bd === 1 ? env.mid : env.high);
            var lv = MV.clamp(ev * SPEC_VAR[i] + beat.pulse * 0.35, 0, 1);
            var ang = -Math.PI / 2 + i * TAU / SPEC_N;
            var r0 = 300, r1 = r0 + 18 + lv * 112;
            var ca = Math.cos(ang), sa = Math.sin(ang);
            ctx.save();
            ctx.strokeStyle = bd === 2 ? MV.C.blue : MV.C.cyan;
            ctx.lineWidth = 2.2;
            ctx.globalAlpha = spA * (0.5 + beat.pulse * 0.5);
            ctx.beginPath();
            ctx.moveTo(MV.CX + ca * r0, MV.CY + sa * r0);
            ctx.lineTo(MV.CX + ca * r1, MV.CY + sa * r1);
            ctx.stroke();
            ctx.fillStyle = MV.C.white;
            ctx.globalAlpha = spA * (0.4 + lv * 0.6);
            ctx.fillRect(MV.CX + ca * r1 - 1.5, MV.CY + sa * r1 - 1.5, 3, 3);
            ctx.restore();
          }
        }

        /* ============================================================
         * ENRICH:awake:radarsweep —— 旋转扫描扇 + 光点
         * ============================================================ */
        var swA2 = MV.clamp(lt / 0.7, 0, 1);
        if (swA2 > 0.005) {
          var sAng = t * 0.9 - Math.PI / 2;
          ctx.save();
          for (i = 0; i < 6; i++) {
            var aStart = sAng - 0.12 * (i + 1);
            ctx.globalAlpha = (0.16 - i * 0.022) * swA2;
            ctx.strokeStyle = MV.C.cyan;
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.arc(MV.CX, MV.CY, 520 - i * 10, aStart, aStart + 0.12);
            ctx.stroke();
          }
          ctx.globalAlpha = 0.22 * swA2;
          ctx.strokeStyle = MV.C.cyan;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(MV.CX + Math.cos(sAng) * 70, MV.CY + Math.sin(sAng) * 70);
          ctx.lineTo(MV.CX + Math.cos(sAng) * 520, MV.CY + Math.sin(sAng) * 520);
          ctx.stroke();
          ctx.fillStyle = MV.C.white;
          for (i = 0; i < BLIP_N; i++) {
            var dAng = ((sAng - BLIP_A[i]) % TAU + TAU) % TAU;
            var lit = Math.exp(-dAng * 2.0);
            if (lit < 0.02) continue;
            var bp3 = MV.CX + Math.cos(BLIP_A[i]) * BLIP_R[i];
            var bq3 = MV.CY + Math.sin(BLIP_A[i]) * BLIP_R[i];
            ctx.globalAlpha = (0.10 + lit * 0.28) * swA2;
            ctx.fillRect(bp3 - 2.4, bq3 - 2.4, 4.8, 4.8);
            if (lit > 0.35) {
              ctx.globalAlpha = (lit - 0.35) * 0.5 * swA2;
              ctx.strokeStyle = MV.C.white;
              ctx.lineWidth = 1;
              ctx.strokeRect(bp3 - 7, bq3 - 7, 14, 14);
            }
          }
          ctx.restore();
        }

        /* ============================================================
         * ENRICH:awake:speakers —— 两侧镜像波形墙
         * ============================================================ */
        var spkA = MV.clamp(lt / 0.8, 0, 1) * 0.12;
        if (spkA > 0.005) {
          ctx.save();
          ctx.strokeStyle = MV.C.cyan;
          ctx.lineWidth = 1.5;
          ctx.globalAlpha = spkA * (0.55 + beat.pulse * 0.45);
          var ampS = 16 + env.low * 34 + env.mid * 20 + beat.pulse * 10;
          ctx.beginPath();
          for (i = 0; i < SPK_N; i++) {
            var sy2 = SPK_Y[i];
            var ox2 = Math.sin(sy2 * 0.021 + t * 2.4) * ampS;
            if (i === 0) ctx.moveTo(60 + ox2, sy2); else ctx.lineTo(60 + ox2, sy2);
          }
          ctx.stroke();
          ctx.beginPath();
          for (i = 0; i < SPK_N; i++) {
            var sy3 = SPK_Y[i];
            var ox3 = Math.sin(sy3 * 0.021 + t * 2.4) * ampS;
            if (i === 0) ctx.moveTo(1860 - ox3, sy3); else ctx.lineTo(1860 - ox3, sy3);
          }
          ctx.stroke();
          ctx.globalAlpha = spkA * 0.5;
          ctx.beginPath();
          ctx.moveTo(60, 170); ctx.lineTo(60, 170 + (SPK_N - 1) * 12.4);
          ctx.moveTo(1860, 170); ctx.lineTo(1860, 170 + (SPK_N - 1) * 12.4);
          ctx.stroke();
          ctx.restore();
        }

        /* ============================================================
         * ENRICH:awake:eq —— 两侧 EQ 阶梯（每拍脉动）
         * ============================================================ */
        var eqA = MV.clamp(lt / 0.7, 0, 1) * 0.12;
        if (eqA > 0.005) {
          ctx.save();
          for (i = 0; i < EQ_N; i++) {
            var ey = 930 - i * 44;
            var eband = i < 6 ? env.high : (i < 11 ? env.mid : env.low);
            var ew = 22 + (eband * 70 + beat.pulse * 36 + MV.hash(i * 3.7 + 1.2) * 26) * (0.4 + 0.6 * MV.hash(i * 2.1 + 5.5));
            ctx.globalAlpha = eqA * (0.6 + beat.pulse * 0.4);
            ctx.fillStyle = i % 2 ? MV.C.cyan : MV.C.blue;
            ctx.fillRect(250 - ew, ey, ew, 6);
            ctx.fillRect(1670, ey, ew, 6);
          }
          ctx.restore();
        }

        /* ============================================================
         * ENRICH:awake:log —— 终端日志打字机（16.2s 起）
         * ============================================================ */
        var logA = MV.clamp(lt / 0.6, 0, 1) * 0.5;
        if (logA > 0.005) {
          ctx.save();
          ctx.font = '15px ' + MV.FONT_MONO;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          for (i = 0; i < ALOG.length; i++) {
            var el = ALOG[i];
            var nl = MV.typeCount(t, el.t, el.s.length, 26);
            if (nl <= 0) continue;
            var lyA = 150 + i * 27;
            ctx.fillStyle = MV.C.dim;
            ctx.globalAlpha = logA * 0.7;
            ctx.fillText('>', 140, lyA);
            ctx.fillStyle = i % 3 === 0 ? MV.C.cyan : MV.C.white;
            ctx.globalAlpha = logA;
            ctx.fillText(el.s.slice(0, nl), 162, lyA);
            if (i === ALOG.length - 1 && nl >= el.s.length && (t * 1.6) % 1 < 0.5) {
              ctx.fillStyle = MV.C.cyan;
              ctx.globalAlpha = logA * 0.9;
              ctx.fillRect(162 + ctx.measureText(el.s).width + 4, lyA - 8, 9, 16);
            }
          }
          ctx.restore();
        }
      }
    };
  });

  /* ============================================================
   * 3. math —— 数学定义（几何动物园）
   * ============================================================ */
  MV.registerScene('math', function (api) {
    var t0 = api.t0;
    var meta = { stars: 0.5, grid: 0.05 };
    var pm = MV.partMap(29.5, 44.46);
    var tPoints = pm["If I'm a set of points"] || 29.71;
    var tDim = pm['DIMENSION'] || 32.68;
    var tCircle = pm["If I'm a circle"] || 33.41;
    var tCirc = pm['CIRCUMFERENCE'] || 36.29;
    var tSine = pm["If I'm a sine wave"] || 37.07;
    var tTan = pm['TANGENTS'] || 40.05;
    var tInf = pm["If I approach infinity"] || 40.71;
    var tLim = pm['LIMITATIONS'] || 43.51;
    var CX = 820, CY = 540;
    var CR = 170;

    /* 点集：确定性散布 */
    var N = 46;
    var PX = new Float32Array(N), PY = new Float32Array(N);
    for (var i = 0; i < N; i++) {
      var ang = MV.hash(i * 3.3) * TAU;
      var rad = 90 + MV.hash(i * 7.1 + 2) * 300;
      PX[i] = CX + Math.cos(ang) * rad;
      PY[i] = CY + Math.sin(ang) * rad * 0.78;
    }

    /* 正弦曲线定义 */
    var SX0 = 240, SX1 = 1680;
    function sineY(x) { return CY + Math.sin((x - SX0) * 0.0085) * 110; }

    /* 双曲线（渐近线）分支采样 */
    var hypA = [], hypB = [];
    for (var hh = 0; hh < 80; hh++) {
      var yy = 140 + hh * 4.8;              /* 140 ~ 520 上支 */
      hypA.push([1380 + 9000 / (yy - 540), yy]);
      var yy2 = 560 + hh * 5.5;             /* 560 ~ 995 下支 */
      hypB.push([1380 + 9000 / (yy2 - 540), yy2]);
    }

    /* ENRICH:math:lattice — 方格纸网格坐标（工厂期预计算） */
    var gx = [], gy = [];
    for (i = 0; i <= 1920; i += 80) gx.push(i);
    for (i = 0; i <= 1080; i += 80) gy.push(i);
    /* ENRICH:math:twinkle — 46 点闪烁相位 / 速度表 */
    var twPh = new Float32Array(N), twSp = new Float32Array(N);
    for (i = 0; i < N; i++) {
      twPh[i] = MV.hash(i * 5.7) * TAU;
      twSp[i] = 1.1 + MV.hash(i * 2.9) * 1.8;
    }
    /* ENRICH:math:theta — 360 条预计算角度读数（仅 ASCII） */
    var THETA = [];
    for (i = 0; i < 360; i++) THETA.push('THETA ' + i + ' DEG');
    /* ENRICH:math:ghosts — 幽灵正弦相位表 */
    var ghostPh = [0, 2.1, 4.2];
    /* ENRICH:math:axis — 轴刻度静态字符串 */
    var XTICKV = ['0', '90', '180', '270', '360'];
    var YTICKV = ['+1', '0', '-1'];
    var dashPat = [10, 12];

    return {
      meta: meta,
      enter: function () {},
      exit: function () {},
      update: function (t, env, beat) {},
      draw: function (ctx, t, env, beat) {
        var i, p, k;

        /* ENRICH:math:lattice — 极淡方格纸全场景铺底（alpha<=0.05） */
        ctx.save();
        ctx.strokeStyle = MV.rgba(MV.RGB.cyan, 0.04);
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (i = 0; i < gx.length; i++) { ctx.moveTo(gx[i], 0); ctx.lineTo(gx[i], MV.H); }
        for (i = 0; i < gy.length; i++) { ctx.moveTo(0, gy[i]); ctx.lineTo(MV.W, gy[i]); }
        ctx.stroke();
        ctx.restore();

        /* ---------- ① 点集 / DIMENSION ---------- */
        var pSet = MV.clamp((t - tPoints) / 1.2, 0, 1);
        if (pSet > 0.01) {
          ctx.save();
          for (i = 0; i < N; i++) {
            var pi = MV.clamp((t - tPoints - i * 0.016) / 0.45, 0, 1);
            if (pi <= 0) continue;
            ctx.globalAlpha = 0.18 + 0.62 * pi;
            ctx.fillStyle = MV.C.cyan;
            ctx.fillRect(PX[i] - 2, PY[i] - 2, 4, 4);
          }
          ctx.restore();
          /* DIMENSION：连线成星座 */
          var pDim = MV.clamp((t - tDim) / 1.2, 0, 1);
          if (pDim > 0.01) {
            ctx.save();
            ctx.strokeStyle = MV.rgba(MV.RGB.cyan, 0.22 * pDim * (0.7 + beat.pulse * 0.3));
            ctx.lineWidth = 1;
            ctx.beginPath();
            var cnt = Math.floor(pDim * N);
            for (i = 0; i < cnt; i++) {
              var j = (i + 1) % N;
              ctx.moveTo(PX[i], PY[i]); ctx.lineTo(PX[j], PY[j]);
            }
            ctx.stroke();
            ctx.strokeStyle = MV.rgba(MV.RGB.blue, 0.14 * pDim);
            ctx.beginPath();
            for (i = 0; i < cnt; i += 3) {
              var j2 = (i + 11) % N;
              ctx.moveTo(PX[i], PY[i]); ctx.lineTo(PX[j2], PY[j2]);
            }
            ctx.stroke();
            ctx.restore();
            MV.text(ctx, 'P = { p₀ … p₄₅ }', CX, 190, { size: 16, color: MV.C.dim, alpha: 0.4 });
          }
        }

        /* ENRICH:math:twinkle — 46 点闪烁 + 垂直摆动叠加（不移动原点） */
        if (pSet > 0.01) {
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          ctx.lineWidth = 1;
          ctx.strokeStyle = MV.C.cyan;
          for (i = 0; i < N; i++) {
            var wk = 0.5 + 0.5 * Math.sin(t * twSp[i] + twPh[i]);
            if (wk < 0.28) continue;
            var wobY = Math.sin(t * 1.3 + i * 0.9) * 6 * pSet;
            ctx.globalAlpha = 0.20 * wk * pSet;
            ctx.beginPath();
            ctx.moveTo(PX[i] - 5, PY[i]);
            ctx.lineTo(PX[i] - 2, PY[i]);
            ctx.moveTo(PX[i] + 2, PY[i]);
            ctx.lineTo(PX[i] + 5, PY[i]);
            ctx.stroke();
            ctx.globalAlpha = 0.14 * wk * pSet;
            ctx.fillRect(PX[i] - 1, PY[i] + wobY - 1, 2, 2);
          }
          ctx.restore();
        }

        /* ---------- ② 圆 / CIRCUMFERENCE ---------- */
        var pC = MV.easeOutCubic(MV.clamp((t - tCircle) / 1.6, 0, 1));
        if (pC > 0.01) {
          var sweepA = -Math.PI / 2 + pC * TAU;
          ctx.save();
          ctx.strokeStyle = MV.rgba(MV.RGB.cyan, 0.55);
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(CX, CY, CR, -Math.PI / 2, sweepA);
          ctx.stroke();
          /* 生长中的半径线 */
          ctx.strokeStyle = MV.rgba(MV.RGB.white, 0.5 * (1 - pC) + 0.1);
          ctx.beginPath();
          ctx.moveTo(CX, CY);
          ctx.lineTo(CX + Math.cos(sweepA) * CR, CY + Math.sin(sweepA) * CR);
          ctx.stroke();
          ctx.restore();
          if (t > tCirc) {
            var beadA = -Math.PI / 2 + (t - tCirc) * 1.05;
            /* 直径辅助线 */
            MV.line(ctx, CX - Math.cos(beadA) * CR, CY - Math.sin(beadA) * CR,
              CX + Math.cos(beadA) * CR, CY + Math.sin(beadA) * CR, MV.C.cyan, 1, 0.16);
            /* 周长珠点 */
            ctx.save();
            ctx.fillStyle = MV.C.white;
            ctx.globalAlpha = 0.9;
            ctx.beginPath();
            ctx.arc(CX + Math.cos(beadA) * CR, CY + Math.sin(beadA) * CR, 5, 0, TAU);
            ctx.fill();
            ctx.restore();
            MV.text(ctx, 'C = 2πr', CX + 240, CY - 210, { size: 16, color: MV.C.dim, alpha: 0.4 });
          }

          /* ENRICH:math:radius-vector — 旋转半径向量 + ASCII 角度读数 + 行进圆周点 */
          if (t > tCirc - 0.15) {
            var ra2 = t * 0.9;
            var deg = ((Math.floor(ra2 * 180 / Math.PI) % 360) + 360) % 360;
            MV.line(ctx, CX, CY, CX + Math.cos(ra2) * CR, CY + Math.sin(ra2) * CR,
              MV.C.white, 1.2, 0.30);
            MV.text(ctx, THETA[deg], CX + 296, CY - 190,
              { size: 13, color: MV.C.dim, alpha: 0.5 });
            ctx.save();
            ctx.fillStyle = MV.C.cyan;
            for (i = 0; i < 48; i++) {
              var da2 = i * TAU / 48 + t * 0.35;
              ctx.globalAlpha = 0.10 + 0.12 * (0.5 + 0.5 * Math.sin(i * 1.7 + t * 2.2));
              ctx.fillRect(CX + Math.cos(da2) * CR - 1.4, CY + Math.sin(da2) * CR - 1.4, 2.8, 2.8);
            }
            ctx.restore();
          }
        }

        /* ---------- ③ 正弦波 / TANGENTS ---------- */
        var pS = MV.easeOutCubic(MV.clamp((t - tSine) / 1.8, 0, 1));
        if (pS > 0.01) {
          ctx.save();
          ctx.strokeStyle = MV.rgba(MV.RGB.cyan, 0.6);
          ctx.lineWidth = 2;
          ctx.beginPath();
          var steps = 240;
          var upto = Math.floor(pS * steps);
          for (i = 0; i <= upto; i++) {
            var xx = SX0 + (SX1 - SX0) * (i / steps);
            var yy = sineY(xx);
            if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
          }
          ctx.stroke();
          ctx.restore();
          if (pS >= 1) {
            /* 沿曲线滑动的点 + 切线 */
            var u = ((t - tSine) * 0.26) % 1;
            var xd = SX0 + u * (SX1 - SX0);
            var yd = sineY(xd);
            var slope = 110 * 0.0085 * Math.cos((xd - SX0) * 0.0085);
            var half = 95;
            var dxn = half / Math.sqrt(1 + slope * slope);
            MV.line(ctx, xd - dxn, yd - slope * dxn, xd + dxn, yd + slope * dxn,
              MV.C.white, 1.6, 0.65);
            ctx.save();
            ctx.fillStyle = MV.C.white;
            ctx.globalAlpha = 0.95;
            ctx.beginPath();
            ctx.arc(xd, yd, 6, 0, TAU);
            ctx.fill();
            ctx.restore();
            MV.text(ctx, 'd/dx', xd + 40, yd - 30, { size: 14, color: MV.C.dim, alpha: 0.55 });
            /* TANGENTS：固定切线闪现 */
            if (t > tTan) {
              var ta = MV.clamp((t - tTan) / 0.6, 0, 1) * 0.5;
              var xs = [520, 960, 1400];
              for (i = 0; i < 3; i++) {
                var xf = xs[i];
                var yf = sineY(xf);
                var sl = 110 * 0.0085 * Math.cos((xf - SX0) * 0.0085);
                var d2 = 110 / Math.sqrt(1 + sl * sl);
                MV.line(ctx, xf - d2, yf - sl * d2, xf + d2, yf + sl * d2, MV.C.cyan, 1.4, ta);
              }
            }
          }

          /* ENRICH:math:ghosts — 三条相位错开的幽灵正弦 + y 投影点/线 */
          if (t > tSine + 0.4) {
            ctx.save();
            ctx.strokeStyle = MV.rgba(MV.RGB.blue, 0.10);
            ctx.lineWidth = 1.2;
            for (k = 0; k < 3; k++) {
              ctx.beginPath();
              for (i = 0; i <= 120; i++) {
                var gx2 = SX0 + (SX1 - SX0) * (i / 120);
                var gy2 = CY + Math.sin((gx2 - SX0) * 0.0085 * (1 + k * 0.22) + ghostPh[k] + t * 0.6) * 110;
                if (i === 0) ctx.moveTo(gx2, gy2); else ctx.lineTo(gx2, gy2);
              }
              ctx.stroke();
            }
            ctx.restore();
            var pu = ((t - tSine) * 0.26) % 1;
            var px2 = SX0 + pu * (SX1 - SX0);
            var py2 = sineY(px2);
            MV.line(ctx, px2, py2, px2, CY, MV.C.dim, 1, 0.28);
            MV.line(ctx, px2, CY, SX0 - 30, CY, MV.C.dim, 1, 0.14);
            ctx.save();
            ctx.fillStyle = MV.C.white;
            ctx.globalAlpha = 0.5;
            ctx.fillRect(px2 - 2.5, CY - 2.5, 5, 5);
            ctx.restore();
          }
        }

        /* ---------- ④ 无穷 / LIMITATIONS ---------- */
        var pI = MV.clamp((t - tInf) / 1.6, 0, 1);
        if (pI > 0.01) {
          /* 渐近竖线（虚线） */
          ctx.save();
          ctx.setLineDash([10, 12]);
          ctx.strokeStyle = MV.rgba(MV.RGB.cyan, 0.28 * pI);
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(1380, 120); ctx.lineTo(1380, 960);
          ctx.stroke();
          ctx.restore();
          /* 双曲线两支 */
          ctx.save();
          ctx.strokeStyle = MV.rgba(MV.RGB.cyan, 0.5 * pI);
          ctx.lineWidth = 2;
          ctx.beginPath();
          var nA = Math.floor(pI * hypA.length);
          for (i = 0; i < nA; i++) {
            if (i === 0) ctx.moveTo(hypA[i][0], hypA[i][1]);
            else ctx.lineTo(hypA[i][0], hypA[i][1]);
          }
          var nB = Math.floor(pI * hypB.length);
          for (i = 0; i < nB; i++) {
            if (i === 0) ctx.moveTo(hypB[i][0], hypB[i][1]);
            else ctx.lineTo(hypB[i][0], hypB[i][1]);
          }
          ctx.stroke();
          ctx.restore();
          MV.text(ctx, 'x → a', 1420, 150, { size: 16, color: MV.C.dim, alpha: 0.45 });
          /* ENRICH:math:asymptote — 滚动渐近虚线 + 两支滑动点 */
          ctx.save();
          ctx.setLineDash(dashPat);
          ctx.lineDashOffset = -((t * 26) % 22);
          ctx.strokeStyle = MV.rgba(MV.RGB.cyan, 0.14 * pI);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(1380, 120); ctx.lineTo(1380, 960);
          ctx.stroke();
          ctx.restore();
          var suA = (t * 0.22) % 1;
          var suB = (t * 0.19 + 0.37) % 1;
          var ia = Math.min(hypA.length - 2, Math.floor(suA * (hypA.length - 1)));
          var ib = Math.min(hypB.length - 2, Math.floor(suB * (hypB.length - 1)));
          var fa = suA * (hypA.length - 1) - ia;
          var fb = suB * (hypB.length - 1) - ib;
          var ax2 = MV.lerp(hypA[ia][0], hypA[ia + 1][0], fa);
          var ay2 = MV.lerp(hypA[ia][1], hypA[ia + 1][1], fa);
          var bx2 = MV.lerp(hypB[ib][0], hypB[ib + 1][0], fb);
          var by2 = MV.lerp(hypB[ib][1], hypB[ib + 1][1], fb);
          ctx.save();
          ctx.fillStyle = MV.C.cyan;
          ctx.globalAlpha = 0.55 * pI;
          ctx.fillRect(ax2 - 3, ay2 - 3, 6, 6);
          ctx.fillRect(bx2 - 3, by2 - 3, 6, 6);
          ctx.restore();
          /* 微弱 ∞ 双纽线 */
          var lemA = MV.clamp((t - tInf - 0.5) / 1.2, 0, 1) * 0.12;
          if (lemA > 0.005) {
            ctx.save();
            ctx.strokeStyle = MV.rgba(MV.RGB.blue, lemA);
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            for (i = 0; i <= 60; i++) {
              var th = i / 60 * TAU;
              var s2 = Math.sin(th) * Math.sin(th);
              var lx = 820 + 250 * Math.cos(th) / (1 + s2);
              var ly = 540 + 250 * Math.sin(th) * Math.cos(th) / (1 + s2);
              if (i === 0) ctx.moveTo(lx, ly); else ctx.lineTo(lx, ly);
            }
            ctx.closePath();
            ctx.stroke();
            ctx.restore();
          }
          /* LIMITATIONS：极限探针逼近极限标记 */
          if (t > tLim) {
            var lp = MV.easeOutCubic(MV.clamp((t - tLim) / 2, 0, 1));
            var mx = 1358, my = 160;
            var pxp = MV.lerp(1150, mx, lp);
            var pyp = MV.lerp(330, my, lp);
            MV.cross(ctx, mx, my, 14, MV.C.cyan, 0.8, 1.4);
            ctx.save();
            ctx.strokeStyle = MV.rgba(MV.RGB.cyan, 0.35);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(pxp, pyp);
            ctx.lineTo(mx - 20, my + 20);
            ctx.stroke();
            ctx.fillStyle = MV.C.cyan;
            ctx.globalAlpha = 0.9;
            ctx.beginPath();
            ctx.arc(pxp, pyp, 5, 0, TAU);
            ctx.fill();
            ctx.restore();
            MV.text(ctx, 'lim', 1080, 300, { size: 15, color: MV.C.dim, alpha: 0.4 * (1 - lp) });
          }
        }

        /* ENRICH:math:labels — 角落函数标签 + 轴刻度数字（静态字符串） */
        if (t > tSine) {
          var lbA = MV.clamp((t - tSine) / 1.0, 0, 1);
          MV.text(ctx, 'f(x) = sin x', SX0 + 10, CY - 250,
            { size: 15, color: MV.C.dim, alpha: 0.4 * lbA });
          ctx.save();
          ctx.font = '12px ' + MV.FONT_MONO;
          ctx.fillStyle = MV.C.dim;
          ctx.textAlign = 'center';
          ctx.globalAlpha = 0.32 * lbA;
          for (i = 0; i < XTICKV.length; i++) {
            var txx = SX0 + (SX1 - SX0) * (i / (XTICKV.length - 1));
            MV.line(ctx, txx, CY - 5, txx, CY + 5, MV.C.dim, 1, 0.32 * lbA);
            ctx.fillText(XTICKV[i], txx, CY + 22);
          }
          for (i = 0; i < YTICKV.length; i++) {
            var tyy = CY + (i - 1) * 110;
            MV.line(ctx, SX0 - 5, tyy, SX0 + 5, tyy, MV.C.dim, 1, 0.32 * lbA);
            ctx.fillText(YTICKV[i], SX0 - 30, tyy + 4);
          }
          ctx.restore();
        }

        /* ---------- “我”的光点（中心左） ---------- */
        var rr = 7 + env.low * 5 + beat.pulse * 4;
        MV.drawMe(ctx, CX, CY, rr, 1, { glow: 0.8 });
        /* 创造者扫描线（极淡） */
        MV.drawCreator(ctx, 1560, 560 + Math.sin(t * 0.2) * 120, 0.06, 500);
      }
    };
  });

  /* ============================================================
   * 4. current —— 电流 / 眩晕
   * ============================================================ */
  MV.registerScene('current', function (api) {
    var t0 = api.t0;
    var meta = { stars: 0.5, grid: 0.06 };
    var pm = MV.partMap(44.4, 59.3);
    var tSwitch = pm['Switch my current'] || 44.45;
    var tACDC = pm['To AC to DC'] || 45.85;
    var tBlind = pm['And then blind my vision'] || 47.67;
    var tDizzy = pm['So dizzy so dizzy'] || 49.53;
    var tTravel = pm['Oh we can travel'] || 51.36;
    var tADBC = pm['To A.D to B.C'] || 53.23;
    var tUnite = pm['And we can unite'] || 55.08;
    var tDeep = pm['So deeply so deeply'] || 56.92;
    var merged = false;

    var W0 = 200, W1 = 1720;

    /* ENRICH:current:readouts — 预计算 0..100 的 ASCII 读数 */
    var RMSSTR = [], CHGSTR = [];
    for (var q = 0; q <= 100; q++) {
      var qs = (q < 10 ? '00' : (q < 100 ? '0' : '')) + q;
      RMSSTR.push('RMS ' + qs + '%');
      CHGSTR.push('CHARGE ' + qs + '%');
    }
    /* ENRICH:current:warp — 预分配确定性星场表（纯 t 函数） */
    var STN = 110;
    var stA = new Float32Array(STN), stR = new Float32Array(STN), stS = new Float32Array(STN);
    for (q = 0; q < STN; q++) {
      stA[q] = MV.hash(q * 3.7) * TAU;
      stR[q] = MV.hash(q * 7.9);
      stS[q] = 0.6 + MV.hash(q * 11.3) * 0.9;
    }
    var starCols = [MV.rgba(MV.RGB.white, 1), MV.rgba(MV.RGB.cyan, 1)];
    /* ENRICH:current:lissajous — 点阵尺寸常量 */
    var LNX = 13, LNY = 8;

    /* 致盲（整句 “And then blind my vision”）：0.35s 进入 → 保持至 ≈49.40s → 0.5s 恢复 */
    var BLIND_IN = 0.35;
    var BLIND_HOLD = tBlind + 1.73;
    var BLIND_OUT = 0.50;

    /* 红蓝对撞时序：加速 1.2s 后于中心碰撞 */
    var MERGE_START = tUnite - 0.15;
    var MERGE_DUR = 1.2;
    var tMerge = MERGE_START + MERGE_DUR;

    /* 时空穿梭流星粒子池（本场景私有，风格对齐 storm 场景） */
    var meteors = new MV.Particles(800);

    /* saturation 全屏合成性能自适应：明显慢于基线时退化为普通灰色叠加 */
    var satOK = true, baseAcc = 0, baseN = 0, perfAcc = 0, perfN = 0;

    /* 交流波形：纯正弦；幅度包络 amp 平滑归零后即为一条完美直线（直流） */
    function waveVal(x, t, amp) {
      return Math.sin((x - W0) * 0.012 + t * 4.2) * amp * 120;
    }

    /* 致盲包络：升 → 保持 → 降（恢复期与 “So dizzy” 起点重叠） */
    function blindAt(t) {
      return MV.clamp((t - tBlind) / BLIND_IN, 0, 1) *
        (1 - MV.smoothstep(MV.clamp((t - BLIND_HOLD) / BLIND_OUT, 0, 1)));
    }

    /* 主波形一笔（k 为亮度系数，眩晕回声重影复用） */
    function drawWave(ctx, t, env, amp, k) {
      ctx.save();
      ctx.strokeStyle = MV.rgba(MV.RGB.cyan, 0.85 * k);
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      var steps = 260;
      for (var i = 0; i <= steps; i++) {
        var x = W0 + (W1 - W0) * (i / steps);
        var y = MV.CY + waveVal(x, t, amp) * (0.75 + env.mid * 0.5);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      /* 柔光第二笔 */
      ctx.globalAlpha = 0.18 * k;
      ctx.lineWidth = 8;
      ctx.stroke();
      ctx.restore();
    }

    /* 眩晕辐条：整体转速随时间起伏 */
    function drawSpokes(ctx, t, env, k) {
      if (k <= 0.01) return;
      ctx.save();
      ctx.strokeStyle = MV.rgba(MV.RGB.cyan, (0.11 + env.mid * 0.08) * k);
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (var i = 0; i < 16; i++) {
        var a = i * TAU / 16 + t * (0.65 + 0.30 * Math.sin(t * 0.7));
        var r0 = 150 + Math.sin(t * 2.0 + i * 1.1) * 26;
        var r1 = 720 + Math.sin(t * 1.3 + i * 0.8) * 60;
        ctx.moveTo(MV.CX + Math.cos(a) * r0, MV.CY + Math.sin(a) * r0);
        ctx.lineTo(MV.CX + Math.cos(a) * r1, MV.CY + Math.sin(a) * r1);
      }
      ctx.stroke();
      ctx.restore();
    }

    /* 眩晕环 + 双螺旋臂：半径带行波抖动，扭曲向外传播 */
    function drawRings(ctx, t, k) {
      if (k <= 0.01) return;
      var i, j;
      for (i = 1; i <= 5; i++) {
        var base = 110 + i * 92;
        var wob = Math.sin(t * 2.4 - base * 0.0045 + i * 0.5) * (14 + i * 9);
        MV.ring(ctx, MV.CX, MV.CY, base + wob, i % 2 ? MV.C.cyan : MV.C.blue, 1.2, 0.10 * k);
      }
      ctx.save();
      ctx.strokeStyle = MV.rgba(MV.RGB.cyan, 0.10 * k);
      ctx.lineWidth = 1.4;
      for (j = 0; j < 2; j++) {
        ctx.beginPath();
        for (i = 0; i <= 48; i++) {
          var th = i * 0.28;
          var rr = 70 + th * 62;
          var aa = th + t * 0.7 + j * Math.PI;
          var px = MV.CX + Math.cos(aa) * rr;
          var py = MV.CY + Math.sin(aa) * rr;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
      ctx.restore();
    }

    /* 流星发射：与 storm 场景同款（顶/左侧入场，右下方向，加色拖尾） */
    function emitMeteors(n, speedMul, t) {
      for (var i = 0; i < n; i++) {
        var fromTop = MV.hash(i * 3.1 + Math.floor(t * 31) * 7.7) > 0.45;
        var px = fromTop ? MV.hash(i * 7.3 + t) * MV.W : -120;
        var py = fromTop ? -80 : MV.hash(i * 5.9 + t) * MV.H * 0.7;
        var sp = (600 + MV.hash(i * 9.7) * 900) * speedMul;
        meteors.spawn(px, py, sp, sp * 0.42,
          0.9 + MV.hash(i * 11.3) * 0.8, 2 + MV.hash(i * 13.1) * 3, i);
      }
    }

    /* 纠缠尾迹：沿圆形轨道向过去采样的一段螺旋弧线（k0..k1 为采样序号） */
    function trailArc(ctx, cx, cy, ang, r0, dAng, dR, wob, k0, k1, rgb, alpha, width) {
      ctx.beginPath();
      for (var k = k0; k <= k1; k++) {
        var aa = ang - k * dAng;
        var rr = r0 + k * dR + Math.sin(k * 0.55 + ang * 1.7) * wob * (k / k1);
        var px = cx + Math.cos(aa) * rr;
        var py = cy + Math.sin(aa) * rr * 0.94;
        if (k === k0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = MV.rgba(rgb, alpha);
      ctx.lineWidth = width;
      ctx.stroke();
    }

    /* 接近段速度拖尾：三段由长到短、由暗到亮（dir=-1 尾迹向左，+1 向右） */
    function streakSeg(ctx, x, y, dir, len, rgb, alpha) {
      var widths = [5.0, 3.0, 1.6], frac = [1, 0.55, 0.25], al = [0.10, 0.22, 0.45];
      for (var k = 0; k < 3; k++) {
        ctx.strokeStyle = MV.rgba(rgb, al[k] * alpha);
        ctx.lineWidth = widths[k];
        ctx.beginPath();
        ctx.moveTo(x + dir * len * frac[k], y);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    }

    return {
      meta: meta,
      enter: function () {
        merged = false;
        meteors.clear();
        baseAcc = 0; baseN = 0; perfAcc = 0; perfN = 0;
        satOK = true;
      },
      exit: function () { meteors.clear(); },
      update: function (t, dt, env, beat) {
        meta.grid = 0.06 + MV.clamp((t - tDizzy) / 2, 0, 1) * 0.05;

        /* 流星：仅在时空穿梭窗口内发射，密度随中/高频能量 */
        if (t > tTravel - 0.15 && t < 55.5 && dt > 0) {
          var isp = 0.7 + env.mid * 1.5 + env.high * 0.6;
          var tail = 1 - MV.clamp((t - 54.6) / 0.9, 0, 1);
          var rate = 300 * isp * tail;
          var n = Math.floor(rate * dt);
          if (Math.random() < rate * dt - n) n++;
          emitMeteors(n, isp, t);
        }
        if (dt > 0) meteors.step(dt, null);

        /* saturation 性能采样：致盲期帧时长明显劣于基线时永久退化 */
        if (dt > 0) {
          var bk = blindAt(t);
          if (satOK && bk > 0.5) {
            perfAcc += dt; perfN++;
            if (perfN >= 45) {
              var base = baseN > 20 ? baseAcc / baseN : 1 / 60;
              if (perfAcc / perfN > Math.max(base * 1.7, 1 / 42)) satOK = false;
              perfAcc = 0; perfN = 0;
            }
          } else if (bk <= 0.01 && baseN < 60) {
            baseAcc += dt; baseN++;
          }
        }
      },
      draw: function (ctx, t, env, beat) {
        var i, x, y;
        /* 交流→直流：'To AC to DC' 之后幅度平滑归零（约 0.45s）→ 完美直线，绝无方波 */
        var amp = 1 - MV.smoothstep(MV.clamp((t - tACDC) / 0.45, 0, 1));
        /* 眩晕强度：进入后保持，向 “Oh we can travel” 收尾时淡出 */
        var dizzyK = MV.clamp((t - tDizzy) / 0.45, 0, 1) *
          (1 - MV.smoothstep(MV.clamp((t - (tTravel - 0.55)) / 0.75, 0, 1)));

        /* 眩晕：明显更强的摇摆旋转（≈±4°）+ 1.9% 缩放抖动 */
        ctx.save();
        if (dizzyK > 0.01) {
          var ang = (Math.sin(t * 1.15) * 0.048 + Math.sin(t * 2.7 + 1.3) * 0.021) * dizzyK;
          var sc = 1 + (Math.sin(t * 1.4) * 0.013 + Math.sin(t * 3.1 + 0.7) * 0.006) * dizzyK;
          ctx.translate(MV.CX, MV.CY);
          ctx.rotate(ang);
          ctx.scale(sc, sc);
          ctx.translate(-MV.CX, -MV.CY);

          /* 运动模糊回声：沿角速度方向滞后的两层低透明重影 */
          var av = Math.cos(t * 1.15) * 1.15 * 0.048 + Math.cos(t * 2.7 + 1.3) * 2.7 * 0.021;
          var lag = MV.clamp(av * dizzyK * 0.42, -0.075, 0.075);
          for (var e = 1; e <= 2; e++) {
            ctx.save();
            ctx.translate(MV.CX, MV.CY);
            ctx.rotate(lag * e);
            var es = 1 - 0.009 * e * dizzyK;
            ctx.scale(es, es);
            ctx.translate(-MV.CX, -MV.CY);
            ctx.globalCompositeOperation = 'lighter';
            drawWave(ctx, t, env, amp, 0.30 / e);
            drawSpokes(ctx, t, env, dizzyK * 0.30 / e);
            drawRings(ctx, t, dizzyK * 0.75 / e);
            ctx.restore();
          }
        }

        /* ---------- 主波形 ---------- */
        drawWave(ctx, t, env, amp, 1);
        /* 基线 */
        MV.line(ctx, W0, MV.CY, W1, MV.CY, MV.C.cyan, 1, 0.18);
        /* 输入类型标签 */
        var isDC = t >= tACDC + 0.7;
        MV.text(ctx, isDC ? 'INPUT: DC' : 'INPUT: AC', W1 - 10, MV.CY - 170,
          { size: 20, color: isDC ? MV.C.cyan : MV.C.white, alpha: 0.65, align: 'right' });
        MV.text(ctx, 'ƒ = 129.2 Hz', W0 + 10, MV.CY - 170,
          { size: 16, color: MV.C.dim, alpha: 0.45, align: 'left' });

        /* ENRICH:current:harmonics — 2/3 次谐波幽灵 + RMS 表格表（44.45-46.3） */
        var hK = MV.clamp((t - tSwitch) / 0.4, 0, 1) *
          (1 - MV.clamp((t - 46.05) / 0.35, 0, 1));
        if (hK > 0.01) {
          ctx.save();
          ctx.strokeStyle = MV.rgba(MV.RGB.blue, 0.16 * hK);
          ctx.lineWidth = 1.2;
          for (var hm = 2; hm <= 3; hm++) {
            ctx.beginPath();
            for (i = 0; i <= 200; i++) {
              var hx = W0 + (W1 - W0) * (i / 200);
              var hy = MV.CY + Math.sin((hx - W0) * 0.012 * hm + t * 4.2 * hm) * amp * 120 * (0.55 / hm);
              if (i === 0) ctx.moveTo(hx, hy); else ctx.lineTo(hx, hy);
            }
            ctx.stroke();
          }
          ctx.restore();
          var rv = Math.sqrt((env.low * env.low + env.mid * env.mid + env.high * env.high) / 3);
          var ri = MV.clamp(Math.round(rv * 100), 0, 100);
          ctx.save();
          ctx.strokeStyle = MV.rgba(MV.RGB.cyan, 0.35 * hK);
          ctx.lineWidth = 1.4;
          ctx.strokeRect(W0 + 6, MV.CY - 208, 134, 14);
          ctx.fillStyle = MV.rgba(MV.RGB.cyan, 0.25 * hK);
          ctx.fillRect(W0 + 8, MV.CY - 206, 130 * rv, 10);
          ctx.restore();
          MV.text(ctx, RMSSTR[ri], W0 + 10, MV.CY - 228,
            { size: 13, color: MV.C.dim, alpha: 0.5 * hK, align: 'left' });
        }
        /* 直流段：一个匀速滑动的电流点，暗示恒定电流（仅在真正直流阶段出现） */
        var dotIn = MV.clamp((t - (tACDC + 0.45)) / 0.3, 0, 1);
        var dotOut = 1 - MV.clamp((t - (tBlind - 0.5)) / 0.5, 0, 1);
        if (amp < 0.05 && dotIn > 0.01 && dotOut > 0.01) {
          var dAlpha = 0.5 * dotIn * dotOut;
          var xd = W0 + ((t - (tACDC + 0.45)) * 430) % (W1 - W0);
          if (xd < W0) xd += (W1 - W0);
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          var cg = ctx.createRadialGradient(xd, MV.CY, 0, xd, MV.CY, 26);
          cg.addColorStop(0, MV.rgba(MV.RGB.cyan, 0.60 * dotIn * dotOut));
          cg.addColorStop(1, MV.rgba(MV.RGB.cyan, 0));
          ctx.fillStyle = cg;
          ctx.fillRect(xd - 26, MV.CY - 26, 52, 52);
          ctx.restore();
          ctx.save();
          ctx.globalAlpha = dAlpha;
          ctx.fillStyle = MV.C.cyan;
          ctx.beginPath();
          ctx.arc(xd, MV.CY, 5, 0, TAU);
          ctx.fill();
          ctx.restore();
        }

        /* ENRICH:current:charge — 直流轨充电标记 + CHARGE 读数（46.3-47.67） */
        var cK = MV.clamp((t - 46.3) / 0.25, 0, 1) *
          (1 - MV.clamp((t - (tBlind - 0.45)) / 0.45, 0, 1));
        if (cK > 0.01) {
          var cF = MV.clamp((t - 46.3) / 1.12, 0, 1);
          var ci = MV.clamp(Math.round(cF * 100), 0, 100);
          ctx.save();
          ctx.strokeStyle = MV.rgba(MV.RGB.cyan, 0.42 * cK);
          ctx.lineWidth = 1;
          ctx.beginPath();
          for (i = 0; i <= 24; i++) {
            var cxx = MV.lerp(W0, W1, i / 24);
            var lit = (i / 24) <= cF;
            ctx.moveTo(cxx, MV.CY + 30);
            ctx.lineTo(cxx, MV.CY + 30 + (lit ? 16 : 7));
          }
          ctx.stroke();
          ctx.fillStyle = MV.rgba(MV.RGB.cyan, 0.55 * cK);
          var cdot = MV.lerp(W0, W1, cF);
          ctx.fillRect(cdot - 2, MV.CY + 28, 4, 4);
          ctx.restore();
          MV.text(ctx, CHGSTR[ci], W0 + 10, MV.CY + 70,
            { size: 13, color: MV.C.dim, alpha: 0.55 * cK, align: 'left' });
          /* ENRICH:current:bus — 直流母线斜纹 + 右侧电平表（增强直流段画面密度） */
          ctx.save();
          ctx.strokeStyle = MV.rgba(MV.RGB.cyan, 0.16 * cK);
          ctx.lineWidth = 1;
          ctx.beginPath();
          for (i = 0; i <= 60; i++) {
            var bx2 = MV.lerp(W0, W1, i / 60);
            ctx.moveTo(bx2, MV.CY - 22);
            ctx.lineTo(bx2 + 10, MV.CY - 10);
          }
          ctx.stroke();
          ctx.strokeStyle = MV.rgba(MV.RGB.blue, 0.14 * cK);
          ctx.beginPath();
          for (i = 0; i <= 60; i++) {
            var bx3 = MV.lerp(W0, W1, i / 60);
            ctx.moveTo(bx3, MV.CY + 12);
            ctx.lineTo(bx3 + 10, MV.CY + 24);
          }
          ctx.stroke();
          var mlx = W1 - 74, mly = MV.CY - 150;
          ctx.strokeStyle = MV.rgba(MV.RGB.cyan, 0.40 * cK);
          ctx.strokeRect(mlx, mly, 26, 300);
          for (var lb = 0; lb < 12; lb++) {
            ctx.globalAlpha = cK * ((lb / 12) < cF ? 0.85 : 0.16);
            ctx.fillStyle = lb > 8 ? MV.C.red : MV.C.cyan;
            ctx.fillRect(mlx + 4, mly + 288 - lb * 23, 18, 16);
          }
          ctx.restore();
        }

        /* ENRICH:current:warp — 预分配确定性速度线星场（51.36-55.5） */
        var wpK = MV.clamp((t - tTravel) / 0.5, 0, 1) *
          (1 - MV.clamp((t - 55.0) / 0.5, 0, 1));
        if (wpK > 0.01) {
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          ctx.lineWidth = 1.2;
          for (i = 0; i < STN; i++) {
            var wr = (MV.hash(i * 17.7) * 0.8 + (t - tTravel) * 0.55 * stS[i]) % 1;
            var wr0 = 60 + wr * 860;
            var wr1 = wr0 + 30 + wr * 110 * wpK;
            ctx.globalAlpha = (1 - wr) * 0.22 * wpK;
            ctx.strokeStyle = starCols[stR[i] > 0.5 ? 1 : 0];
            ctx.beginPath();
            ctx.moveTo(MV.CX + Math.cos(stA[i]) * wr0, MV.CY + Math.sin(stA[i]) * wr0 * 0.72);
            ctx.lineTo(MV.CX + Math.cos(stA[i]) * wr1, MV.CY + Math.sin(stA[i]) * wr1 * 0.72);
            ctx.stroke();
          }
          ctx.restore();
        }

        /* ---------- 时空穿梭：流星雨（背景层，风格同 storm 场景） ---------- */
        if (meteors.n > 0) {
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          meteors.drawStreak(ctx, MV.mix(MV.RGB.white, MV.RGB.cyan, 0.55), 0.9, 0.028);
          ctx.restore();
        }

        /* ---------- 时空穿梭：坠落的年份柱（前景层，保持原样） ---------- */
        if (t > tTravel && t < tADBC + 2.5) {
          ctx.save();
          ctx.font = '38px ' + MV.FONT_MONO;
          ctx.textAlign = 'center';
          var idx0 = Math.max(0, Math.floor((t - tTravel) / 0.11) - 11);
          for (i = idx0; i <= Math.floor((t - tTravel) / 0.11); i++) {
            var st = tTravel + i * 0.11;
            var fall = (t - st) * 820;
            y = 120 + fall;
            if (y > MV.H + 60) continue;
            var yv = Math.floor(MV.hash(i * 13.7) * 4500) - 2500;
            var label = (yv < 0 ? (-yv) + ' BC' : yv + ' AD');
            x = 340 + MV.hashS(i * 3.3) * 520;
            ctx.globalAlpha = 0.5 * (1 - fall / (MV.H + 60));
            ctx.fillStyle = (yv < 0) ? MV.C.dim : MV.C.cyan;
            ctx.fillText(label, x, y);
          }
          ctx.restore();
        }

        /* ---------- 眩晕辐条 / 扭曲环（主层） ---------- */
        if (dizzyK > 0.01) {
          drawSpokes(ctx, t, env, dizzyK);
          drawRings(ctx, t, dizzyK);
        }

        /* ---------- 融合：红蓝对撞 → 纠缠旋转 ---------- */
        if (t > MERGE_START - 0.35) {
          var appear = MV.clamp((t - (MERGE_START - 0.35)) / 0.3, 0, 1);
          var ap = MV.clamp((t - MERGE_START) / MERGE_DUR, 0, 1);
          var apE = ap * ap;                       /* ease-in：越近中心越快 */
          var xr = MV.lerp(660, MV.CX, apE);
          var xb = MV.lerp(1260, MV.CX, apE);

          if (ap < 1) {
            /* 接近段：加色速度拖尾 + 红/蓝光点（同 “我” 的绘制规格） */
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.lineCap = 'round';
            var segK = 40 + 340 * ap;
            streakSeg(ctx, xr, MV.CY, -1, segK, MV.RGB.red, appear);
            streakSeg(ctx, xb, MV.CY, 1, segK, MV.RGB.blue, appear);
            ctx.restore();
            MV.drawMe(ctx, xr, MV.CY, 7, appear, { tint: MV.RGB.red, glow: 1.1 });
            MV.drawMe(ctx, xb, MV.CY, 7, appear, { tint: MV.RGB.blue, glow: 1.1 });
          } else {
            if (!merged) {
              merged = true;
              MV.FX.flash(MV.RGB.white, 0.45, 0.45);
              MV.FX.shake(5, 0.35);
              MV.FX.zoomPulse(0.035, 0.45);
            }
            var ct = t - tMerge;

            /* 碰撞冲击波：三圈先后向外扩散 */
            for (i = 0; i < 3; i++) {
              var cp = MV.clamp((ct - i * 0.09) / 0.85, 0, 1);
              if (cp > 0 && cp < 1) {
                MV.ring(ctx, MV.CX, MV.CY, MV.easeOutCubic(cp) * (560 + i * 130),
                  i === 0 ? MV.C.white : (i === 1 ? MV.C.cyan : MV.C.blue),
                  2.4 - i * 0.6, 0.5 * (1 - cp) * (1 - cp));
              }
            }

            /* 纠缠舞：半径收紧 + 角速度 ×2.2（“So deeply”） */
            var tight = MV.smoothstep(MV.clamp((t - tDeep) / 1.8, 0, 1));
            var rOrb = MV.lerp(90, 26, tight);
            var w0 = 2.4, w1 = w0 * 2.2, DUR = 1.8;
            var s = t - tDeep;
            var u = MV.clamp(s / DUR, 0, 1);
            /* smoothstep 速度剖面的解析积分：相位连续可导（预览跳转/截图安全） */
            var F = (s <= 0) ? 0 : (s >= DUR ? DUR * 0.5 : DUR * (u * u * u - u * u * u * u * 0.5));
            var ph = w0 * (t - tMerge) + (w1 - w0) * F;

            var rrR = rOrb * (1 + Math.sin(t * 1.6) * 0.05);
            var rrB = rOrb * (1 + Math.sin(t * 1.6 + 2.4) * 0.05);
            var ayR = ph, ayB = ph + Math.PI;
            var xr2 = MV.CX + Math.cos(ayR) * rrR;
            var yr2 = MV.CY + Math.sin(ayR) * rrR * 0.94;
            var xb2 = MV.CX + Math.cos(ayB) * rrB;
            var yb2 = MV.CY + Math.sin(ayB) * rrB * 0.94;

            /* 螺旋尾迹（加色发光，三层由淡到亮） */
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.lineCap = 'round';
            var dAng = 0.11 + 0.17 * tight;
            var dR = 1.5 + 0.6 * tight;
            var wob = 2 + 4 * tight;
            trailArc(ctx, MV.CX, MV.CY, ayR, rrR, dAng, dR, wob, 0, 40, MV.RGB.red, 0.10, 5.0);
            trailArc(ctx, MV.CX, MV.CY, ayR, rrR, dAng, dR, wob, 0, 22, MV.RGB.red, 0.20, 3.0);
            trailArc(ctx, MV.CX, MV.CY, ayR, rrR, dAng, dR, wob, 0, 11, MV.RGB.red, 0.42, 1.7);
            trailArc(ctx, MV.CX, MV.CY, ayB, rrB, dAng, dR, wob, 0, 40, MV.RGB.blue, 0.10, 5.0);
            trailArc(ctx, MV.CX, MV.CY, ayB, rrB, dAng, dR, wob, 0, 22, MV.RGB.blue, 0.20, 3.0);
            trailArc(ctx, MV.CX, MV.CY, ayB, rrB, dAng, dR, wob, 0, 11, MV.RGB.blue, 0.42, 1.7);
            ctx.restore();

            /* 纠缠细线（两粒子之间的牵连） */
            MV.line(ctx, xr2, yr2, xb2, yb2, MV.C.white, 1, 0.08 + 0.10 * tight);

            /* 深深入髓：缓慢外扩的红蓝深度环 */
            if (t > tDeep) {
              for (i = 0; i < 4; i++) {
                var dp = ((t - tDeep) * 150 + i * 96) % 430;
                MV.ring(ctx, MV.CX, MV.CY, dp, i % 2 ? MV.C.red : MV.C.blue, 1.2,
                  0.16 * (1 - dp / 430));
              }
            }

            /* ENRICH:current:entangle — Lissajous 点阵 + 解析切向火花 + 深度环（56.13-59.22） */
            var etK = 1 - MV.clamp((t - 58.7) / 0.5, 0, 1);
            if (t > 56.13 && etK > 0.01) {
              ctx.save();
              ctx.fillStyle = MV.C.cyan;
              for (i = 0; i < LNX; i++) {
                for (var jj = 0; jj < LNY; jj++) {
                  var lu = i / (LNX - 1), lv = jj / (LNY - 1);
                  var lxx = MV.CX + Math.sin(lu * 6.283 + t * 0.9) * 210 * stR[(i + jj * LNX) % STN];
                  var lyy = MV.CY + Math.sin(lv * 6.283 + t * 1.3 + 1.1) * 130 * stR[(i * 3 + jj) % STN];
                  ctx.globalAlpha = 0.10 * etK;
                  ctx.fillRect(lxx - 1, lyy - 1, 2, 2);
                }
              }
              ctx.restore();
              ctx.save();
              ctx.strokeStyle = MV.rgba(MV.RGB.white, 0.22 * etK);
              ctx.lineWidth = 1.2;
              ctx.beginPath();
              for (i = 0; i < 9; i++) {
                var sa2 = ph * 0.5 + i * TAU / 9;
                var sr2 = rOrb + 34 + 26 * Math.sin(i * 2.3 + t * 1.7);
                var tx0 = MV.CX + Math.cos(sa2) * sr2;
                var ty0 = MV.CY + Math.sin(sa2) * sr2 * 0.94;
                var tdx = -Math.sin(sa2) * 16, tdy = Math.cos(sa2) * 16 * 0.94;
                ctx.moveTo(tx0 - tdx, ty0 - tdy);
                ctx.lineTo(tx0 + tdx, ty0 + tdy);
              }
              ctx.stroke();
              ctx.restore();
              for (i = 0; i < 3; i++) {
                var dr2 = ((t - 56.13) * 130 + i * 140) % 420;
                MV.ring(ctx, MV.CX, MV.CY, dr2, MV.C.blue, 1, 0.10 * (1 - dr2 / 420) * etK);
              }
            }

            /* 粒子本体：红色的我 + 蓝色的你 */
            MV.drawMe(ctx, xr2, yr2, 6.5, 0.95, { tint: MV.RGB.red, glow: 1.2 });
            MV.drawMe(ctx, xb2, yb2, 6.5, 0.95, { tint: MV.RGB.blue, glow: 1.2 });

            /* 合并标签（低调） */
            MV.text(ctx, 'UNITED', MV.CX, MV.CY - 212,
              { size: 16, color: MV.C.white, alpha: 0.32 * MV.clamp(ct / 0.8, 0, 1) });
          }
        }

        /* ---------- “我”的光点：与红蓝粒子合体后淡出 ---------- */
        var meK = 1 - MV.smoothstep(MV.clamp((t - (tUnite + 0.25)) / 0.85, 0, 1));
        if (meK > 0.02) {
          var rr = (7 + env.low * 5 + beat.pulse * 4) * (0.35 + 0.65 * meK);
          MV.drawMe(ctx, MV.CX, MV.CY, rr, meK, { glow: 0.8 });
        }
        /* ENRICH:current:crosshair — 旋转目标准星（49.53-51.5） */
        var chK = MV.clamp((t - tDizzy) / 0.5, 0, 1) *
          (1 - MV.clamp((t - (tTravel - 0.1)) / 0.5, 0, 1));
        if (chK > 0.01) {
          var chR = 120 + 18 * Math.sin(t * 1.8);
          MV.ring(ctx, MV.CX, MV.CY, chR, MV.C.cyan, 1.2, 0.22 * chK);
          MV.cross(ctx, MV.CX, MV.CY, 46, MV.C.white, 0.20 * chK, 1);
          ctx.save();
          ctx.strokeStyle = MV.rgba(MV.RGB.cyan, 0.22 * chK);
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          for (i = 0; i < 12; i++) {
            var ca = i * TAU / 12 + t * 0.35;
            ctx.moveTo(MV.CX + Math.cos(ca) * (chR - 12), MV.CY + Math.sin(ca) * (chR - 12));
            ctx.lineTo(MV.CX + Math.cos(ca) * (chR + 12), MV.CY + Math.sin(ca) * (chR + 12));
          }
          ctx.stroke();
          ctx.restore();
        }
        ctx.restore(); /* 眩晕变换结束 */

        /* ---------- 致盲：整屏去饱和变灰 + 压暗（最后覆盖，贯穿整句歌词） ---------- */
        var blindK = blindAt(t);
        if (blindK > 0.01) {
          if (satOK) {
            try {
              ctx.save();
              ctx.globalCompositeOperation = 'saturation';
              ctx.globalAlpha = blindK;
              ctx.fillStyle = '#808080';       /* 零饱和色：抽走画面色彩 */
              ctx.fillRect(0, 0, MV.W, MV.H);
              ctx.restore();
            } catch (err) {
              satOK = false;                    /* 环境不支持合成模式则永久退化 */
            }
          }
          if (!satOK) {
            /* 退化方案：普通灰色叠加（仍是灰调，而非纯黑） */
            ctx.save();
            ctx.globalAlpha = 0.72 * blindK;
            ctx.fillStyle = '#6e8096';
            ctx.fillRect(0, 0, MV.W, MV.H);
            ctx.restore();
          }
          /* 灰雾薄纱：让“被蒙住”的感觉偏灰而非纯黑 */
          ctx.save();
          ctx.globalAlpha = 0.15 * blindK;
          ctx.fillStyle = '#8894a4';
          ctx.fillRect(0, 0, MV.W, MV.H);
          ctx.restore();
          /* 压暗层（两种方案通用） */
          ctx.save();
          ctx.globalAlpha = 0.55 * blindK;
          ctx.fillStyle = '#000';
          ctx.fillRect(0, 0, MV.W, MV.H);
          ctx.restore();
        }

        /* ENRICH:current:tunnel — 单色后退矩形隧道（致盲叠加之后绘制，47.67-49.4） */
        if (t > tBlind && t < tBlind + 1.73) {
          var tnK = MV.clamp((t - tBlind) / 0.4, 0, 1) *
            (1 - MV.clamp((t - (tBlind + 1.25)) / 0.45, 0, 1));
          if (tnK > 0.01) {
            ctx.save();
            ctx.strokeStyle = MV.C.dim;
            ctx.lineWidth = 1.5;
            for (i = 0; i < 8; i++) {
              var tp = ((t * 0.42) + i / 8) % 1;
              var tw = MV.lerp(1500, 90, MV.easeOutCubic(tp));
              ctx.globalAlpha = (1 - tp) * 0.22 * tnK;
              ctx.strokeRect(MV.CX - tw / 2, MV.CY - tw * 0.3, tw, tw * 0.6);
            }
            ctx.restore();
          }
        }
      }
    };
  });

  /* ============================================================
   * 5. chorus —— 副歌 1 爆发
   * ============================================================ */
  MV.registerScene('chorus', function (api) {
    var t0 = api.t0;
    var meta = { stars: 0.7, grid: 0.1 };
    var pm = MV.partMap(59.2, 74.05);
    var tStim = pm['STIMULATIONS'] || 61.96;
    var tExec = pm['EXECUTION'] || 69.26;
    var tSim = pm['SIMULATION'] || 73.17;
    var parts = new MV.Particles(900);
    var rings = [];       /* 六边形 / 冲击波环 */
    var lastBeat = -1;

    /* ENRICH:chorus:hex — 4 个反向旋转六边形的转向 / 半径表 */
    var hexDir = [1, -1, 1, -1];
    var hexR = [180, 300, 420, 540];
    /* ENRICH:chorus:timing — SATISFACTION 时间（全局查找，缺失时回退） */
    var tSat = pm['SATISFACTION'] || MV.findPart('SATISFACTION').t || 70.5;
    /* ENRICH:chorus:eq — 周边 EQ 条数量 */
    var EQN = 72;

    function onPart(s, i, part) {
      if (part.en === 'EXECUTION') {
        MV.FX.flash(MV.RGB.red, 0.5, 0.45);
        MV.FX.shake(20, 0.55);
        MV.FX.glitch(0.55, 0.3);
        rings.push({ age: 0, dur: 1.0, rMax: 900, kind: 'red' });
      } else if (part.en === 'STIMULATIONS') {
        MV.FX.flash(MV.RGB.cyan, 0.25, 0.4);
        rings.push({ age: 0, dur: 1.2, rMax: 1300, kind: 'shock' });
      }
    }

    return {
      meta: meta,
      enter: function () {
        parts.clear();
        rings.length = 0;
        lastBeat = -1;
        api.onPart(onPart);
      },
      exit: function () { parts.clear(); rings.length = 0; },
      update: function (t, dt, env, beat) {
        meta.grid = 0.08 + env.low * 0.13;
        if (beat.idx !== lastBeat) {
          lastBeat = beat.idx;
          /* 每拍径向粒子喷发 */
          var n = 30 + Math.round(env.high * 22);
          for (var i = 0; i < n; i++) {
            var a = MV.hash(i * 3.7 + beat.idx * 11.3) * TAU;
            var sp = 240 + MV.hash(i * 7.1 + beat.idx) * 540;
            parts.spawn(MV.CX, MV.CY,
              Math.cos(a) * sp, Math.sin(a) * sp,
              0.9 + MV.hash(i * 5.3) * 0.9,
              2.5 + MV.hash(i * 9.9) * 4, i);
          }
          /* 小节首拍：2-3 个六边形环，带延迟 */
          if (beat.isBar) {
            rings.push({ age: -0.0, dur: 1.2, rMax: 620, kind: 'hex' });
            rings.push({ age: -0.14, dur: 1.2, rMax: 700, kind: 'hex' });
            rings.push({ age: -0.28, dur: 1.2, rMax: 780, kind: 'hex' });
          }
        }
        for (var k = rings.length - 1; k >= 0; k--) {
          rings[k].age += dt;
          if (rings[k].age > rings[k].dur + 0.35) rings.splice(k, 1);
        }
        /* 粒子带阻尼 */
        parts.step(dt, function (ps, i, d) {
          var dr = 1.15 * d;
          ps.vx[i] -= ps.vx[i] * dr;
          ps.vy[i] -= ps.vy[i] * dr;
        });
      },
      draw: function (ctx, t, env, beat) {
        var i;

        /* ENRICH:chorus:hex — 4 个反向旋转六边形（alpha<=0.10） */
        for (i = 0; i < 4; i++) {
          ctx.save();
          ctx.strokeStyle = MV.rgba(i % 2 ? MV.RGB.blue : MV.RGB.cyan, 0.08);
          ctx.lineWidth = 1.2;
          MV.polyPath(ctx, MV.CX, MV.CY, hexR[i] * (1 + beat.pulse * 0.03), 6,
            t * hexDir[i] * (0.12 + i * 0.04) + i * 0.8);
          ctx.stroke();
          ctx.restore();
        }

        /* 环绕能量晶格：三个旋转的六边形，随低频能量增强 */
        var lat = 0.10 + env.low * 0.15;
        for (i = 0; i < 3; i++) {
          var lr = (250 + i * 95) * (1 + beat.pulse * 0.05);
          ctx.save();
          ctx.strokeStyle = MV.rgba(MV.RGB.cyan, lat * (1 - i * 0.22));
          ctx.lineWidth = 1.4;
          MV.polyPath(ctx, MV.CX, MV.CY, lr, 6, t * (0.25 + i * 0.12) + i * 0.7);
          ctx.stroke();
          ctx.restore();
        }
        /* 节拍脉冲射线 */
        var pr = beat.pulse;
        if (pr > 0.03) {
          ctx.save();
          ctx.strokeStyle = MV.rgba(MV.RGB.cyan, pr * 0.28);
          ctx.lineWidth = 2;
          ctx.beginPath();
          for (i = 0; i < 12; i++) {
            var ra = i * TAU / 12 + t * 0.2;
            ctx.moveTo(MV.CX + Math.cos(ra) * 120, MV.CY + Math.sin(ra) * 120);
            ctx.lineTo(MV.CX + Math.cos(ra) * (150 + pr * 200), MV.CY + Math.sin(ra) * (150 + pr * 200));
          }
          ctx.stroke();
          ctx.restore();
        }

        /* ENRICH:chorus:sparks — STIMULATIONS / SATISFACTION 解析径向火花 */
        var skK = 0;
        var skA = t - tStim, skB = t - tSat;
        if (skA > 0 && skA < 2.2) skK = Math.max(skK, (1 - skA / 2.2) * MV.clamp(skA / 0.25, 0, 1));
        if (skB > 0 && skB < 2.2) skK = Math.max(skK, (1 - skB / 2.2) * MV.clamp(skB / 0.25, 0, 1));
        if (skK > 0.01) {
          ctx.save();
          ctx.strokeStyle = MV.rgba(MV.RGB.white, 0.20 * skK);
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          for (i = 0; i < 28; i++) {
            var sa = MV.hash(i * 5.1) * TAU + t * 0.25;
            var r0 = 170 + MV.hash(i * 9.7) * 90;
            var r1 = r0 + 90 + MV.hash(i * 3.3) * 240 * skK;
            ctx.moveTo(MV.CX + Math.cos(sa) * r0, MV.CY + Math.sin(sa) * r0);
            ctx.lineTo(MV.CX + Math.cos(sa) * r1, MV.CY + Math.sin(sa) * r1);
          }
          ctx.stroke();
          ctx.restore();
        }

        /* ENRICH:chorus:eq — 周边 EQ 条（env.low/mid 驱动，alpha<=0.12） */
        ctx.save();
        ctx.strokeStyle = MV.rgba(MV.RGB.cyan, 0.12);
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (i = 0; i < EQN; i++) {
          var ea = i * TAU / EQN;
          var ev = 0.5 + 0.5 * Math.sin(i * 1.9 + t * (2.2 + env.mid * 3));
          var el = 10 + (env.low * 42 + env.mid * 26 + env.high * 14) * ev;
          var erx = MV.CX + Math.cos(ea) * 620;
          var ery = MV.CY + Math.sin(ea) * 620;
          ctx.moveTo(erx, ery);
          ctx.lineTo(erx + Math.cos(ea) * el, ery + Math.sin(ea) * el);
        }
        ctx.stroke();
        ctx.restore();

        /* 六边形 / 冲击波环 */
        for (i = 0; i < rings.length; i++) {
          var r = rings[i];
          if (r.age < 0) continue;
          var p = MV.clamp(r.age / r.dur, 0, 1);
          var rad = MV.easeOutCubic(p) * r.rMax;
          if (r.kind === 'hex') {
            ctx.save();
            ctx.strokeStyle = MV.rgba(MV.RGB.cyan, (1 - p) * 0.5);
            ctx.lineWidth = 2.4;
            MV.polyPath(ctx, MV.CX, MV.CY, Math.max(rad, 1), 6, r.age * 0.7);
            ctx.stroke();
            ctx.restore();
          } else if (r.kind === 'shock') {
            MV.ring(ctx, MV.CX, MV.CY, rad, MV.C.white, 4, (1 - p) * 0.6);
            MV.ring(ctx, MV.CX, MV.CY, rad * 0.92, MV.C.cyan, 10, (1 - p) * 0.2);
          } else if (r.kind === 'red') {
            MV.ring(ctx, MV.CX, MV.CY, rad, MV.C.red, 5, (1 - p) * 0.75);
            MV.ring(ctx, MV.CX, MV.CY, rad * 0.86, MV.C.red, 14, (1 - p) * 0.22);
          }
        }

        /* 线框球（SIMULATION） */
        if (t > tSim - 0.6) {
          var gp = MV.clamp((t - tSim) / 1.2, 0, 1) * 0.18;
          var R = 300;
          ctx.save();
          ctx.strokeStyle = MV.rgba(MV.RGB.cyan, gp);
          ctx.lineWidth = 1.2;
          /* 纬线 */
          for (i = -3; i <= 3; i++) {
            var h = i * R / 3.6;
            var rw = Math.sqrt(Math.max(R * R - h * h, 1));
            ctx.beginPath();
            ctx.ellipse(MV.CX, MV.CY + h * 0.4, rw, rw * 0.26, 0, 0, TAU);
            ctx.stroke();
          }
          /* 经线（旋转） */
          for (i = 0; i < 8; i++) {
            var ph = (t - tSim) * 0.45 + i * Math.PI / 8;
            var rx = Math.abs(Math.cos(ph)) * R;
            ctx.beginPath();
            ctx.ellipse(MV.CX, MV.CY, Math.max(rx, 0.5), R, 0, 0, TAU);
            ctx.stroke();
          }
          ctx.restore();
        }

        /* 粒子 */
        parts.drawRect(ctx, MV.RGB.cyan, 0.85);

        /* “我”的光点（能量核心） */
        var rr = 9 + env.low * 7 + beat.pulse * 5;
        MV.drawMe(ctx, MV.CX, MV.CY, rr, 1, { glow: 1.0 + env.mid * 0.7 });
        /* 核心十字标记 */
        MV.cross(ctx, MV.CX, MV.CY, 26 + beat.pulse * 14, MV.C.white, 0.25 + beat.pulse * 0.3, 1);

        /* 创造者扫描线（被能量淹没，仍隐约可见） */
        MV.drawCreator(ctx, 1560, 540 + Math.sin(t * 0.3) * 180, 0.05, 480);
      }
    };
  });

  /* ============================================================
   * 6. cute —— 荒诞温柔段（线稿生物）
   * ============================================================ */
  MV.registerScene('cute', function (api) {
    var t0 = api.t0;
    var meta = { stars: 0.55, grid: 0.05 };
    var pm = MV.partMap(74.03, 88.59);
    var warm = MV.mix(MV.RGB.cyan, MV.RGB.white, 0.45);
    var particles = new MV.Particles(300);

    /* 生物定义：出生时间 / 位置槽位 / 描画进度 */
    var defs = [
      { kind: 'eggplant', t: pm["If I'm an eggplant"] || 74.05, x: 600, y: 330 },
      { kind: 'tomato', t: pm["If I'm a tomato"] || 77.58, x: 840, y: 330 },
      { kind: 'cat', t: pm["If I'm a tabby cat"] || 81.35, x: 1080, y: 330 },
      { kind: 'god', t: pm["If I'm the only god"] || MV.findPart("If I'm the only god").t || 85.08, x: 1320, y: 330 }
    ];
    var tEnjoy = pm['ENJOYMENT'] || 84.27;
    var tExist = pm['EXISTENCE'] || 87.92;
    var tAnti = pm['ANTIOXIDANTS'] || 80.62;
    var LIFE = 3.2;     /* 停留秒数（描绘完成后） */
    var DISS = 0.7;     /* 溶解时长 */

    /* ENRICH:cute:garden — 花园基线预计算（草叶 x/高度） */
    var GRASS_N = 64;
    var grassX = new Float32Array(GRASS_N), grassH = new Float32Array(GRASS_N);
    for (var gi = 0; gi < GRASS_N; gi++) {
      grassX[gi] = 120 + MV.hash(gi * 3.7) * 1680;
      grassH[gi] = 8 + MV.hash(gi * 7.1) * 18;
    }

    function creaturePath(kind, p, ctx) {
      /* 每个子路径单独描画（虚线揭示） */
      var L, draw;
      if (kind === 'eggplant') {
        MV.reveal(ctx, function (c) { c.ellipse(0, 0, 44, 66, 0, 0, TAU); }, 350, p, MV.rgba(warm, 1), 2.2, 1);
        MV.reveal(ctx, function (c) { c.moveTo(0, -66); c.lineTo(5, -94); }, 32, MV.clamp(p * 1.4 - 0.4, 0, 1), MV.rgba(warm, 1), 2.2, 1);
        MV.reveal(ctx, function (c) { c.ellipse(16, -88, 16, 7, -0.5, 0, TAU); }, 60, MV.clamp(p * 1.4 - 0.7, 0, 1), MV.rgba(warm, 1), 1.8, 1);
        MV.reveal(ctx, function (c) { c.moveTo(-20, -10); c.quadraticCurveTo(20, 6, 26, 34); }, 70, MV.clamp(p * 1.5 - 0.5, 0, 1), MV.rgba(warm, 0.5), 1.2, 1);
      } else if (kind === 'tomato') {
        MV.reveal(ctx, function (c) { c.arc(0, 0, 52, 0, TAU); }, 330, p, MV.rgba(warm, 1), 2.2, 1);
        MV.reveal(ctx, function (c) { c.moveTo(-26, -44); c.lineTo(0, -60); c.lineTo(26, -44); }, 70, MV.clamp(p * 1.5 - 0.4, 0, 1), MV.rgba(warm, 1), 2, 1);
        MV.reveal(ctx, function (c) { c.moveTo(0, -58); c.lineTo(0, -76); }, 22, MV.clamp(p * 1.6 - 0.7, 0, 1), MV.rgba(warm, 1), 2, 1);
        MV.reveal(ctx, function (c) { c.moveTo(-24, -14); c.quadraticCurveTo(0, -4, 24, -18); }, 60, MV.clamp(p * 1.6 - 0.8, 0, 1), MV.rgba(MV.RGB.white, 0.6), 2, 1);
      } else if (kind === 'cat') {
        MV.reveal(ctx, function (c) { c.arc(0, 0, 48, 0, TAU); }, 305, p, MV.rgba(warm, 1), 2.2, 1);
        MV.reveal(ctx, function (c) { c.moveTo(-42, -22); c.lineTo(-30, -62); c.lineTo(-8, -40); }, 90, MV.clamp(p * 1.5 - 0.3, 0, 1), MV.rgba(warm, 1), 2, 1);
        MV.reveal(ctx, function (c) { c.moveTo(42, -22); c.lineTo(30, -62); c.lineTo(8, -40); }, 90, MV.clamp(p * 1.5 - 0.5, 0, 1), MV.rgba(warm, 1), 2, 1);
        var wp = MV.clamp(p * 1.6 - 0.6, 0, 1);
        MV.reveal(ctx, function (c) { c.moveTo(-46, 6); c.lineTo(-84, 0); c.moveTo(-46, 14); c.lineTo(-84, 16); c.moveTo(-44, 22); c.lineTo(-80, 32); }, 130, wp, MV.rgba(warm, 0.8), 1.4, 1);
        MV.reveal(ctx, function (c) { c.moveTo(46, 6); c.lineTo(84, 0); c.moveTo(46, 14); c.lineTo(84, 16); c.moveTo(44, 22); c.lineTo(80, 32); }, 130, wp, MV.rgba(warm, 0.8), 1.4, 1);
      } else { /* god */
        MV.reveal(ctx, function (c) { c.arc(0, 0, 40, 0, TAU); }, 260, p, MV.rgba(warm, 1), 2.2, 1);
        MV.reveal(ctx, function (c) { c.ellipse(0, -66, 38, 11, 0, 0, TAU); }, 170, MV.clamp(p * 1.5 - 0.35, 0, 1), MV.rgba(warm, 1), 2, 1);
        var rp2 = MV.clamp(p * 1.6 - 0.6, 0, 1);
        for (var ri = 0; ri < 8; ri++) {
          var ra = ri * TAU / 8 + Math.PI / 8;
          /* 射线用旋转角动态绘制，此处仅揭示长度 */
          MV.reveal(ctx, (function (a) {
            return function (c) {
              c.moveTo(Math.cos(a) * 52, Math.sin(a) * 52 - 40);
              c.lineTo(Math.cos(a) * 84, Math.sin(a) * 84 - 40);
            };
          })(ra), 40, rp2, MV.rgba(warm, 0.9), 1.8, 1);
        }
      }
    }

    /* ============================================================
     * 番茄红素（lycopene）结构式 —— 开链共轭多烯（照真实结构：两端均无环）
     * 局部坐标：原点 = 主链左起首顶点，+x 右、+y 下
     * 几何在工厂期一次性算好，绘制完全时间驱动（预览/寻址安全）
     * ============================================================ */
    var LYCO_X = 480, LYCO_Y = 585;      /* 原点世界坐标（主链左端顶点） */
    var LYCO_DX = 46, LYCO_AMP = 26, LYCO_N = 22;
    function lycoWP(px, py) { return [LYCO_X + px, LYCO_Y + py]; }
    /* 主链 22 个顶点：偶数下标 +26（下）、奇数下标 -26（上） */
    var lycoPts = (function () {
      var a = [];
      for (var i = 0; i < LYCO_N; i++) {
        a.push(lycoWP(i * LYCO_DX, (i % 2 === 0) ? LYCO_AMP : -LYCO_AMP));
      }
      return a;
    })();
    /* 左端统一节奏的折叠链（全单键）：V0→L1→L2→L3→L4→L5，\ | / | \ 形 */
    var lycoLeft = [
      lycoWP(-40, 62), lycoWP(-40, 126), lycoWP(-2, 178), lycoWP(-2, 226), lycoWP(-34, 252)
    ];
    var lycoBranch = lycoWP(-76, 126);         /* L2 向左的甲基支线（长 36） */
    var lycoR1 = lycoWP(1000, -62), lycoR2 = lycoWP(1000, -122);
    var lycoR3 = lycoWP(974, -160), lycoR4 = lycoWP(1026, -160);
    /* 主链甲基支线：顶点下标 + 方向（-1 上 / +1 下），长 32px */
    var lycoMethyls = [[2, -1], [6, -1], [10, 1], [14, 1], [18, -1]];
    /* 揭示主线：左端甲基末端 → 折链向上 → 主链向右 → 右端 R1/R2（整体左→右） */
    var lycoSpine = (function () {
      var p = [], k;
      for (k = lycoLeft.length - 1; k >= 0; k--) p.push(lycoLeft[k]);  /* L5…L1 */
      for (k = 0; k < LYCO_N; k++) p.push(lycoPts[k]);                 /* V0…V21 */
      p.push(lycoR1); p.push(lycoR2);                                  /* R1→R2 */
      return p;
    })();
    /* 主线累计弧长（支线/双键随笔头出现）；索引约定：0..4 = A5..A1，5..26 = V0..V21 */
    var lycoCum = (function () {
      var cum = [0], L = 0;
      for (var k = 1; k < lycoSpine.length; k++) {
        var dx = lycoSpine[k][0] - lycoSpine[k - 1][0];
        var dy = lycoSpine[k][1] - lycoSpine[k - 1][1];
        L += Math.sqrt(dx * dx + dy * dy);
        cum.push(L);
      }
      return cum;
    })();
    var LYCO_LEN = lycoCum[lycoCum.length - 1];

    /* ENRICH:cute:lyco-bond — 21 个主链键的预计算键级标签 */
    var LYCO_LAB = [];
    for (var bi = 0; bi < LYCO_N - 1; bi++) {
      LYCO_LAB.push('C' + (bi + 1) + (bi % 2 === 0 ? '=C' : '-C') + (bi + 2));
    }

    function lycoSpinePath(c) {
      c.moveTo(lycoSpine[0][0], lycoSpine[0][1]);
      for (var k = 1; k < lycoSpine.length; k++) c.lineTo(lycoSpine[k][0], lycoSpine[k][1]);
    }

    /* 单键短线段（甲基支线用） */
    function lycoSeg(ctx, A, B, alpha) {
      if (alpha <= 0.01) return;
      ctx.save();
      ctx.strokeStyle = MV.rgba(warm, alpha);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(A[0], A[1]);
      ctx.lineTo(B[0], B[1]);
      ctx.stroke();
      ctx.restore();
    }

    /* 主链双键：内侧平行短线（偏移 6px，两端各缩 12%） */
    function lycoDouble(ctx, A, B, alpha) {
      var dx = B[0] - A[0], dy = B[1] - A[1];
      var l = Math.sqrt(dx * dx + dy * dy);
      var ux = dx / l, uy = dy / l;
      var nx = -uy, ny = ux;
      if (ny < 0) { nx = -nx; ny = -ny; }     /* 一律落在链的内侧 */
      var t0 = 0.12, t1 = 0.88;
      ctx.save();
      ctx.strokeStyle = MV.rgba(warm, alpha);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(A[0] + nx * 6 + ux * l * t0, A[1] + ny * 6 + uy * l * t0);
      ctx.lineTo(A[0] + nx * 6 + ux * l * t1, A[1] + ny * 6 + uy * l * t1);
      ctx.stroke();
      ctx.restore();
    }

    return {
      meta: meta,
      enter: function () { particles.clear(); },
      exit: function () { particles.clear(); },
      update: function (t, dt, env, beat) {
        /* 溶解粒子：按帧连续发射，寻址后状态自然重建 */
        for (var i = 0; i < defs.length; i++) {
          var d = defs[i];
          var ds = d.t + LIFE;
          if (t >= ds && t < ds + DISS) {
            var n = Math.round(40 * dt);
            for (var j = 0; j < n; j++) {
              var a = MV.hash(i * 91 + j * 7 + Math.floor(t * 20)) * TAU;
              var sp = 30 + MV.hash(i * 17 + j * 3) * 90;
              particles.spawn(d.x + MV.hashS(j * 3.1) * 30, d.y + MV.hashS(j * 5.7) * 30,
                Math.cos(a) * sp, Math.sin(a) * sp - 20,
                0.6 + MV.hash(j * 2.3) * 0.5, 1.6 + MV.hash(j * 1.7) * 2, j);
            }
          }
        }
        particles.step(dt, function (ps, i, d2) { ps.vy[i] += 26 * d2; });
      },
      draw: function (ctx, t, env, beat) {
        var i;

        /* ENRICH:cute:garden — 线框花园基线（地平线 + 草叶刻度 + 漂浮花粉） */
        MV.line(ctx, 120, 860, 1800, 860, MV.C.dim, 1, 0.14);
        ctx.save();
        ctx.strokeStyle = MV.rgba(warm, 0.16);
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (i = 0; i < GRASS_N; i++) {
          var gsw = Math.sin(t * 1.1 + i * 0.7) * 3;
          ctx.moveTo(grassX[i], 860);
          ctx.lineTo(grassX[i] + gsw, 860 - grassH[i]);
        }
        ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = MV.rgba(warm, 0.5);
        for (i = 0; i < 40; i++) {
          var ppx = (MV.hash(i * 3.1) * MV.W + t * (6 + MV.hash(i * 7.7) * 10)) % MV.W;
          var ppy = 620 + Math.sin(t * 0.6 + i * 1.7) * 60 + MV.hash(i * 5.3) * 160;
          ctx.globalAlpha = 0.10 + 0.10 * (0.5 + 0.5 * Math.sin(i + t * 1.3));
          ctx.fillRect(ppx, ppy, 2, 2);
        }
        ctx.restore();

        /* 溶解粒子（先画，位于生物背后） */
        particles.drawRect(ctx, warm, 0.7);

        /* 生物逐个绘制（统一在局部坐标系内放大，细节随线稿一起缩放） */
        for (i = 0; i < defs.length; i++) {
          var d = defs[i];
          var age = t - d.t;
          if (age < 0 || age > LIFE + DISS) continue;
          var p = MV.clamp(age / 1.2, 0, 1);
          var fade = (age > LIFE) ? MV.clamp(1 - (age - LIFE) / DISS, 0, 1) : 1;
          var bob = Math.sin(t * 1.6 + i * 1.7) * 5 * (0.4 + beat.pulse * 0.6);
          ctx.save();
          ctx.translate(d.x, d.y + bob);
          ctx.scale(fade * 1.35, fade * 1.35);
          creaturePath(d.kind, p, ctx);

          /* 眼睛 / 面部细节（揭示完成后出现） */
          if (p > 0.95) {
            ctx.save();
            ctx.globalAlpha = 0.85;
            ctx.fillStyle = MV.C.white;
            if (d.kind === 'tomato') {
              ctx.beginPath();
              ctx.arc(-16, -6, 3, 0, TAU);
              ctx.arc(16, -6, 3, 0, TAU);
              ctx.fill();
            } else if (d.kind === 'cat') {
              ctx.beginPath();
              ctx.arc(-16, -4, 3.4, 0, TAU);
              ctx.arc(16, -4, 3.4, 0, TAU);
              ctx.fill();
            } else if (d.kind === 'god') {
              ctx.fillStyle = MV.C.cyan;
              ctx.beginPath();
              ctx.arc(0, -12, 4, 0, TAU);
              ctx.fill();
            }
            ctx.restore();
          }

          /* 猫的呼噜振动波（ENJOYMENT 之后） */
          if (d.kind === 'cat' && t > tEnjoy) {
            var pp = MV.clamp((t - tEnjoy) / 0.5, 0, 1);
            ctx.save();
            ctx.strokeStyle = MV.rgba(warm, 0.55);
            ctx.lineWidth = 1.6;
            for (var wv = 0; wv < 3; wv++) {
              var ox = 96 + wv * 26;
              var oy = -26 - wv * 12;
              var ph = (t * 6 + wv * 1.3) % 1;
              ctx.globalAlpha = (1 - ph) * 0.5 * pp;
              ctx.beginPath();
              ctx.moveTo(ox, oy + Math.sin(t * 22 + wv) * 2.5);
              ctx.quadraticCurveTo(ox + 9, oy - 8, ox + 16, oy);
              ctx.quadraticCurveTo(ox + 23, oy + 8, ox + 30, oy);
              ctx.stroke();
            }
            ctx.restore();
          }
          ctx.restore();

          /* 神的 EXISTENCE 辉光（世界坐标） */
          if (d.kind === 'god' && t > tExist) {
            var gp = MV.clamp((t - tExist) / 1.2, 0, 1);
            MV.ring(ctx, d.x, d.y - 54, 60 + gp * 160, MV.C.cyan, 2, (1 - gp) * 0.5);
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            var g = ctx.createRadialGradient(d.x, d.y - 54, 0, d.x, d.y - 54, 200);
            g.addColorStop(0, MV.rgba(MV.RGB.white, 0.25 * (1 - gp) * fade));
            g.addColorStop(1, MV.rgba(MV.RGB.cyan, 0));
            ctx.fillStyle = g;
            ctx.fillRect(d.x - 200, d.y - 254, 400, 400);
            ctx.restore();
          }
        }

        /* ENRICH:cute:legend — NUTRIENTS 图例 + 环绕原子的活性生物（77.95-81.35） */
        var lgK = MV.clamp((t - 77.95) / 0.5, 0, 1) *
          (1 - MV.clamp((t - 80.95) / 0.4, 0, 1));
        if (lgK > 0.01) {
          MV.text(ctx, 'NUTRIENTS -> ANTIOXIDANTS', 620, 150,
            { size: 16, color: MV.C.dim, alpha: 0.5 * lgK });
          for (i = 0; i < defs.length; i++) {
            var ad = defs[i];
            var aage = t - ad.t;
            if (aage < 0.6 || aage > LIFE + DISS) continue;
            var abob = Math.sin(t * 1.6 + i * 1.7) * 5 * (0.4 + beat.pulse * 0.6);
            ctx.save();
            ctx.strokeStyle = MV.rgba(warm, 0.20 * lgK);
            ctx.fillStyle = MV.rgba(warm, 0.45 * lgK);
            for (var ai = 0; ai < 3; ai++) {
              var aa2 = t * (0.9 + ai * 0.25) + ai * TAU / 3;
              var ar2 = 66 + ai * 16;
              var axx = ad.x + Math.cos(aa2) * ar2;
              var ayy = ad.y + abob - 40 + Math.sin(aa2) * ar2 * 0.6;
              ctx.beginPath();
              ctx.arc(axx, ayy, 2.6, 0, TAU);
              ctx.fill();
              MV.line(ctx, ad.x, ad.y + abob - 40, axx, ayy, MV.C.dim, 1, 0.10 * lgK);
            }
            ctx.restore();
            break;
          }
        }

        /* ENRICH:cute:purr — 呼噜波形 + 漂浮 z 刻度（81.48-84.27） */
        var puK = MV.clamp((t - 81.48) / 0.4, 0, 1) *
          (1 - MV.clamp((t - 83.9) / 0.37, 0, 1));
        if (puK > 0.01) {
          var catD = defs[2];
          ctx.save();
          ctx.strokeStyle = MV.rgba(warm, 0.30 * puK);
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          for (i = 0; i <= 90; i++) {
            var pwx = catD.x + 60 + (i / 90) * 220;
            var pwy = catD.y - 150 + Math.sin(i * 0.5 + t * 14) * 7 * (0.6 + 0.4 * Math.sin(t * 3));
            if (i === 0) ctx.moveTo(pwx, pwy); else ctx.lineTo(pwx, pwy);
          }
          ctx.stroke();
          ctx.restore();
          for (i = 0; i < 3; i++) {
            var zp = (t * 0.5 + i / 3) % 1;
            MV.text(ctx, 'z', catD.x + 120 + i * 34, catD.y - 190 - zp * 70,
              { size: 14 + i * 3, color: MV.C.dim, alpha: (1 - zp) * 0.45 * puK });
          }
        }

        /* ENRICH:cute:halo — 神的光环刻度 + 轨道卫星（85.25-87.92） */
        var hoK = MV.clamp((t - 85.25) / 0.5, 0, 1) *
          (1 - MV.clamp((t - 87.5) / 0.42, 0, 1));
        if (hoK > 0.01) {
          var gd = defs[3];
          ctx.save();
          ctx.strokeStyle = MV.rgba(MV.RGB.cyan, 0.18 * hoK);
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          for (i = 0; i < 36; i++) {
            var ha = i * TAU / 36 + t * 0.30;
            var hlen = 8 + 5 * Math.sin(i * 2.1);
            ctx.moveTo(gd.x + Math.cos(ha) * 104, gd.y - 54 + Math.sin(ha) * 104);
            ctx.lineTo(gd.x + Math.cos(ha) * (104 + hlen), gd.y - 54 + Math.sin(ha) * (104 + hlen));
          }
          ctx.stroke();
          ctx.restore();
          ctx.save();
          ctx.fillStyle = MV.C.white;
          for (i = 0; i < 3; i++) {
            var sa3 = t * (0.7 + i * 0.3) + i * TAU / 3;
            var sr3 = 140 + i * 34;
            ctx.globalAlpha = 0.5 * hoK;
            ctx.fillRect(gd.x + Math.cos(sa3) * sr3 - 2, gd.y + Math.sin(sa3) * sr3 * 0.5 - 2, 4, 4);
          }
          ctx.restore();
        }

        /* 字幕提示区（顶部一根细标尺，随内容亮起） */
        MV.line(ctx, 560, 96, 1360, 96, MV.C.cyan, 1, 0.12 + beat.pulse * 0.08);

        /* ---------- 番茄红素结构式：献给“番茄的抗氧化物” ---------- */
        var tLyco = tAnti - 0.5;                              /* 略提前起笔，贴住歌词节奏 */
        var lp = MV.clamp((t - tLyco) / 1.6, 0, 1);           /* 描绘进度：左端 → 主链 → 右端 */
        var lfade = MV.clamp(1 - (t - 85.0) / 0.7, 0, 1);     /* 保持至 85.0s，再 0.7s 淡出 */
        if (lp > 0 && lfade > 0.01) {
          var lalpha = 0.55 * lfade * (0.88 + 0.12 * beat.pulse);  /* 轻微随拍呼吸 */
          var lw = MV.rgba(warm, 1);
          /* 主线（左端折链 + 主链 + 右端上行段）随笔头一次性揭出 */
          MV.reveal(ctx, lycoSpinePath, LYCO_LEN + 20, lp, lw, 2, lalpha);
          /* 左端甲基支线：笔头经过 A2 后出现 */
          var bp = MV.clamp((lp - lycoCum[3] / LYCO_LEN) / 0.04, 0, 1);
          if (bp > 0.01) lycoSeg(ctx, lycoLeft[1], lycoBranch, lalpha * bp);
          /* 主链甲基支线（随笔头出现） */
          for (var mj = 0; mj < lycoMethyls.length; mj++) {
            var mi = lycoMethyls[mj][0], mdir = lycoMethyls[mj][1];
            var mp = MV.clamp((lp - lycoCum[5 + mi] / LYCO_LEN) / 0.04, 0, 1);
            if (mp > 0.01) {
              lycoSeg(ctx, lycoPts[mi], [lycoPts[mi][0], lycoPts[mi][1] + mdir * 32], lalpha * mp);
            }
          }
          /* 主链双键：偶数段内侧平行短线（共 11 条） */
          for (var si = 0; si < LYCO_N - 1; si += 2) {
            var sp = MV.clamp((lp - lycoCum[5 + si] / LYCO_LEN) / 0.04, 0, 1);
            if (sp > 0.01) lycoDouble(ctx, lycoPts[si], lycoPts[si + 1], lalpha * sp);
          }
          /* 右端：竖直双键的内侧平行线（偏移 6px、两端各缩 ~7.5%）+ Y 形短甲基 */
          var yp = MV.clamp((lp - 0.94) / 0.06, 0, 1);
          if (yp > 0.01) {
            var vy0 = 0.075, vy1 = 0.925;
            lycoSeg(ctx,
              [lycoR1[0] - 6, lycoR1[1] + (lycoR2[1] - lycoR1[1]) * vy0],
              [lycoR1[0] - 6, lycoR1[1] + (lycoR2[1] - lycoR1[1]) * vy1],
              lalpha * yp);
            lycoSeg(ctx, lycoR2, lycoR3, lalpha * yp);
            lycoSeg(ctx, lycoR2, lycoR4, lalpha * yp);
          }
          /* ENRICH:cute:lyco-bond — 沿共轭主链行进的亮点 + 预计算键级读数 */
          if (lp > 0.5) {
            var bdot = ((t - tLyco) * 0.42) % 1;
            var bpos = 5 + bdot * (LYCO_N - 1);
            var bseg = Math.min(lycoSpine.length - 2, Math.floor(bpos));
            var bfrac = bpos - bseg;
            var bxx = MV.lerp(lycoSpine[bseg][0], lycoSpine[bseg + 1][0], bfrac);
            var byy = MV.lerp(lycoSpine[bseg][1], lycoSpine[bseg + 1][1], bfrac);
            ctx.save();
            ctx.fillStyle = MV.rgba(MV.RGB.white, 0.85 * lfade * lalpha);
            ctx.beginPath();
            ctx.arc(bxx, byy, 4.5, 0, TAU);
            ctx.fill();
            ctx.restore();
            var lbx = MV.clamp(bseg - 5, 0, LYCO_LAB.length - 1);
            MV.text(ctx, LYCO_LAB[lbx], bxx, byy - 26,
              { size: 12, color: MV.C.dim, alpha: 0.45 * lfade });
          }

          /* 名称 / 分子式 */
          var capA = MV.clamp((lp - 0.85) / 0.15, 0, 1) * lfade;
          if (capA > 0.01) {
            MV.text(ctx, 'LYCOPENE', MV.CX, 776,
              { size: 16, color: MV.C.dim, alpha: 0.55 * capA });
            MV.text(ctx, 'C40H56', MV.CX, 800,
              { size: 13, color: MV.C.dim, alpha: 0.40 * capA });
          }
        }

        /* “我”的光点（被小家伙们围着） */
        var rr = 8 + env.low * 5 + beat.pulse * 4;
        MV.drawMe(ctx, MV.CX, MV.CY, rr, 1, { glow: 0.75 + env.mid * 0.5 });
      }
    };
  });
})();
