#!/usr/bin/env node
/* ============================================================
 * compare.mjs — world.execute(me); MV 视觉 QA 对比器
 * ============================================================
 *
 * 用法（在仓库根目录执行）：
 *   node scripts/qa-enrich/compare.mjs --baseline baseline --enriched enriched
 *
 * 默认阈值（全部可用 CLI 覆盖；--baseline/--enriched 可传标签名或目录路径）：
 *   --sparse-richness-ratio 1.10   sparse/interlude: Richness_enriched >= 1.10 * Richness_baseline
 *   --sparse-motion 0.004          sparse/interlude: motion_enriched >= 0.004
 *   --dense-richness-ratio 0.97    dense: Richness_enriched >= 0.97 * Richness_baseline
 *   --dense-edge-ratio 0.97        dense: edge_enriched >= 0.97 * edge_baseline
 *   --fps-slack 2                  fps: median_enriched >= median_baseline - 2
 *   --fps-floor 56                 fps: median_enriched >= 56
 *   --out mv/_qa_enrich            输出 report.json / report.md 的目录
 *
 * 额外条件：baseline 与 enriched 的 errors.json 计数都必须为 0。
 * 判定：全部采样点 + 全部 fps 窗口 + 错误检查通过 → overall PASS，否则 FAIL。
 * 退出码：PASS=0，FAIL=1，输入缺失/参数错误=2。
 * ============================================================ */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '..', '..');

const USAGE = `用法: node scripts/qa-enrich/compare.mjs [选项]
  --baseline <label|dir>         基线标签（默认 baseline）
  --enriched <label|dir>         增强标签（默认 enriched）
  --out <dir>                    输出根目录（默认 mv/_qa_enrich）
  --sparse-richness-ratio <r>    默认 1.10
  --sparse-motion <m>            默认 0.004
  --dense-richness-ratio <r>     默认 0.97
  --dense-edge-ratio <r>         默认 0.97
  --fps-slack <n>                默认 2
  --fps-floor <n>                默认 56
`;

function parseArgs(argv) {
  const o = {
    baseline: 'baseline',
    enriched: 'enriched',
    out: 'mv/_qa_enrich',
    sparseRichnessRatio: 1.10,
    sparseMotion: 0.004,
    denseRichnessRatio: 0.97,
    denseEdgeRatio: 0.97,
    fpsSlack: 2,
    fpsFloor: 56,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    const val = () => { i += 1; if (i >= argv.length) throw new Error('缺少参数值: ' + a); return argv[i]; };
    switch (a) {
      case '--baseline': o.baseline = val(); break;
      case '--enriched': o.enriched = val(); break;
      case '--out': o.out = val(); break;
      case '--sparse-richness-ratio': o.sparseRichnessRatio = Number(val()); break;
      case '--sparse-motion': o.sparseMotion = Number(val()); break;
      case '--dense-richness-ratio': o.denseRichnessRatio = Number(val()); break;
      case '--dense-edge-ratio': o.denseEdgeRatio = Number(val()); break;
      case '--fps-slack': o.fpsSlack = Number(val()); break;
      case '--fps-floor': o.fpsFloor = Number(val()); break;
      case '--help': case '-h': console.log(USAGE); process.exit(0); break;
      default: throw new Error('未知参数: ' + a);
    }
  }
  return o;
}

const readJsonOrNull = (p) => { try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return null; } };
const r6 = (x) => (x == null || !isFinite(x) ? x : Number(x.toFixed(6)));
const num = (x, d = 4) => (x == null || !isFinite(x) ? '—' : Number(x).toFixed(d));
const ratio = (e, b) => (b > 0 ? e / b : (e > 0 ? Infinity : 1));

function labelDir(labelOrPath, out) {
  const direct = resolve(REPO_ROOT, labelOrPath);
  if (existsSync(join(direct, 'metrics.json'))) return direct;
  return join(resolve(REPO_ROOT, out), labelOrPath);
}

function checkSamples(base, enr, T) {
  const eMap = new Map((enr.samples || []).map((s) => [String(Number(s.t)), s]));
  const rows = [];
  for (const b of base.samples || []) {
    const e = eMap.get(String(Number(b.t)));
    const kind = b.kind || (e && e.kind) || 'sparse';
    const row = {
      t: b.t,
      kind,
      baseline: b && !b.failed ? { richness: b.richness, edge: b.edge, nonBg: b.nonBg, sat: b.sat, motion: b.motion } : null,
      enriched: e && !e.failed ? { richness: e.richness, edge: e.edge, nonBg: e.nonBg, sat: e.sat, motion: e.motion } : null,
      checks: {},
      pass: false,
      reasons: [],
    };
    if (!b || b.failed) row.reasons.push('baseline 采样失败');
    if (!e) row.reasons.push('enriched 缺少该采样点');
    else if (e.failed) row.reasons.push('enriched 采样失败');
    if (row.reasons.length) { rows.push(row); continue; }

    const rr = r6(ratio(e.richness, b.richness));
    if (kind === 'dense') {
      const richOk = e.richness >= T.denseRichnessRatio * b.richness;
      const edgeOk = e.edge >= T.denseEdgeRatio * b.edge;
      row.checks = { richnessRatio: rr, richnessOk: richOk, edgeRatio: r6(ratio(e.edge, b.edge)), edgeOk };
      if (!richOk) row.reasons.push(`dense Richness ${num(e.richness)} < ${T.denseRichnessRatio}×${num(b.richness)}`);
      if (!edgeOk) row.reasons.push(`dense edge ${num(e.edge)} < ${T.denseEdgeRatio}×${num(b.edge)}`);
      row.pass = richOk && edgeOk;
    } else {
      const richOk = e.richness >= T.sparseRichnessRatio * b.richness;
      const motionOk = e.motion >= T.sparseMotion;
      row.checks = { richnessRatio: rr, richnessOk: richOk, motion: e.motion, motionOk };
      if (!richOk) row.reasons.push(`sparse Richness ${num(e.richness)} < ${T.sparseRichnessRatio}×${num(b.richness)}`);
      if (!motionOk) row.reasons.push(`motion ${num(e.motion)} < ${T.sparseMotion}`);
      row.pass = richOk && motionOk;
    }
    rows.push(row);
  }
  return rows;
}

function checkFps(base, enr, T) {
  if (!base || !enr) return { rows: [], missing: true };
  const eMap = new Map((enr.windows || []).map((w) => [w.scene, w]));
  const rows = [];
  for (const b of base.windows || []) {
    const e = eMap.get(b.scene);
    const row = {
      scene: b.scene,
      baseline: b && !b.failed ? { medianFps: b.medianFps, p95Fps: b.p95Fps, p95FrameMs: b.p95FrameMs, maxFrameMs: b.maxFrameMs } : null,
      enriched: e && !e.failed ? { medianFps: e.medianFps, p95Fps: e.p95Fps, p95FrameMs: e.p95FrameMs, maxFrameMs: e.maxFrameMs } : null,
      pass: false,
      reasons: [],
    };
    if (!b || b.failed) row.reasons.push('baseline fps 窗口失败');
    if (!e) row.reasons.push('enriched 缺少该 fps 窗口');
    else if (e.failed) row.reasons.push('enriched fps 窗口失败');
    if (!row.reasons.length) {
      const okSlack = e.medianFps >= b.medianFps - T.fpsSlack;
      const okFloor = e.medianFps >= T.fpsFloor;
      if (!okSlack) row.reasons.push(`median ${num(e.medianFps, 2)} < ${num(b.medianFps, 2)} - ${T.fpsSlack}`);
      if (!okFloor) row.reasons.push(`median ${num(e.medianFps, 2)} < floor ${T.fpsFloor}`);
      row.pass = okSlack && okFloor;
    }
    rows.push(row);
  }
  return { rows, missing: false };
}

function checkErrors(baseErr, enrErr) {
  const bc = baseErr ? baseErr.count : null;
  const ec = enrErr ? enrErr.count : null;
  const reasons = [];
  if (bc === null) reasons.push('baseline errors.json 缺失');
  else if (bc !== 0) reasons.push(`baseline 有 ${bc} 条错误`);
  if (ec === null) reasons.push('enriched errors.json 缺失');
  else if (ec !== 0) reasons.push(`enriched 有 ${ec} 条错误`);
  return { baseline: bc, enriched: ec, pass: reasons.length === 0, reasons };
}

function main() {
  const opts = parseArgs(process.argv);
  const bDir = labelDir(opts.baseline, opts.out);
  const eDir = labelDir(opts.enriched, opts.out);
  const bm = readJsonOrNull(join(bDir, 'metrics.json'));
  const em = readJsonOrNull(join(eDir, 'metrics.json'));
  if (!bm) throw new Error('找不到/无法解析 baseline metrics.json: ' + join(bDir, 'metrics.json'));
  if (!em) throw new Error('找不到/无法解析 enriched metrics.json: ' + join(eDir, 'metrics.json'));

  const T = {
    sparseRichnessRatio: opts.sparseRichnessRatio,
    sparseMotion: opts.sparseMotion,
    denseRichnessRatio: opts.denseRichnessRatio,
    denseEdgeRatio: opts.denseEdgeRatio,
    fpsSlack: opts.fpsSlack,
    fpsFloor: opts.fpsFloor,
  };
  const samples = checkSamples(bm, em, T);
  const fps = checkFps(readJsonOrNull(join(bDir, 'fps.json')), readJsonOrNull(join(eDir, 'fps.json')), T);
  const errors = checkErrors(readJsonOrNull(join(bDir, 'errors.json')), readJsonOrNull(join(eDir, 'errors.json')));

  const samplesPass = samples.length > 0 && samples.every((s) => s.pass);
  const fpsPass = !fps.missing && fps.rows.length > 0 && fps.rows.every((s) => s.pass);
  const overallPass = samplesPass && fpsPass && errors.pass;

  const report = {
    generatedAt: new Date().toISOString(),
    baseline: { label: opts.baseline, dir: bDir, samples: samples.length, expected: bm.expected ?? null },
    enriched: { label: opts.enriched, dir: eDir, samples: samples.length, expected: em.expected ?? null },
    thresholds: T,
    counts: {
      samples: samples.length,
      samplesPass: samples.filter((s) => s.pass).length,
      fpsWindows: fps.rows.length,
      fpsPass: fps.rows.filter((s) => s.pass).length,
    },
    errors,
    samples,
    fps: fps.rows,
    overallPass,
  };
  const outDir = resolve(REPO_ROOT, opts.out);
  const jsonPath = join(outDir, 'report.json');
  const mdPath = join(outDir, 'report.md');
  writeFileSync(jsonPath, JSON.stringify(report, null, 1));

  /* ---- Markdown ---- */
  const md = [];
  md.push(`# MV 视觉 QA 对比报告`);
  md.push('');
  md.push(`- 生成时间: ${report.generatedAt}`);
  md.push(`- baseline: \`${opts.baseline}\` (${bDir})`);
  md.push(`- enriched: \`${opts.enriched}\` (${eDir})`);
  md.push(`- 阈值: sparse Richness ≥ ${T.sparseRichnessRatio}× 且 motion ≥ ${T.sparseMotion}；dense Richness ≥ ${T.denseRichnessRatio}× 且 edge ≥ ${T.denseEdgeRatio}×；fps median ≥ baseline-${T.fpsSlack} 且 ≥ ${T.fpsFloor}；双方 errors = 0`);
  md.push('');
  md.push(`## 总判定: ${overallPass ? '**PASS**' : '**FAIL**'}`);
  md.push('');
  md.push(`- 采样点: ${report.counts.samplesPass}/${report.counts.samples} 通过`);
  md.push(`- FPS 窗口: ${report.counts.fpsPass}/${report.counts.fpsWindows} 通过`);
  md.push(`- 错误: baseline=${errors.baseline ?? '缺失'}, enriched=${errors.enriched ?? '缺失'}${errors.pass ? '' : ' — ' + errors.reasons.join('; ')}`);
  md.push('');
  md.push(`## 采样点（per-sample）`);
  md.push('');
  md.push('| t | kind | Rich(B) | Rich(E) | ratio | Edge(B) | Edge(E) | sat(E) | motion(E) | pass | 原因 |');
  md.push('|---|------|---------|---------|-------|---------|---------|--------|-----------|------|------|');
  for (const s of samples) {
    const b = s.baseline || {};
    const e = s.enriched || {};
    md.push(`| ${s.t} | ${s.kind} | ${num(b.richness)} | ${num(e.richness)} | ${num(s.checks.richnessRatio)} | ${num(b.edge)} | ${num(e.edge)} | ${num(e.sat)} | ${num(e.motion)} | ${s.pass ? '✅' : '❌'} | ${s.reasons.join('; ') || ''} |`);
  }
  md.push('');
  md.push(`## FPS（17 场景窗口）`);
  md.push('');
  if (fps.missing) {
    md.push('fps.json 缺失（baseline 或 enriched 未跑 fps 模式）。');
  } else {
    md.push('| scene | medFps(B) | medFps(E) | p95Fps(B) | p95Fps(E) | p95ms(B) | p95ms(E) | pass | 原因 |');
    md.push('|-------|-----------|-----------|-----------|-----------|----------|----------|------|------|');
    for (const s of fps.rows) {
      const b = s.baseline || {};
      const e = s.enriched || {};
      md.push(`| ${s.scene} | ${num(b.medianFps, 2)} | ${num(e.medianFps, 2)} | ${num(b.p95Fps, 2)} | ${num(e.p95Fps, 2)} | ${num(b.p95FrameMs, 2)} | ${num(e.p95FrameMs, 2)} | ${s.pass ? '✅' : '❌'} | ${s.reasons.join('; ') || ''} |`);
    }
  }
  md.push('');
  writeFileSync(mdPath, md.join('\n'));

  console.log(`report: ${jsonPath}`);
  console.log(`report: ${mdPath}`);
  console.log(`overall: ${overallPass ? 'PASS' : 'FAIL'} (samples ${report.counts.samplesPass}/${report.counts.samples}, fps ${report.counts.fpsPass}/${report.counts.fpsWindows}, errors baseline=${errors.baseline ?? '?'} enriched=${errors.enriched ?? '?'})`);
  if (!overallPass) process.exitCode = 1;
}

try {
  main();
} catch (e) {
  console.error('[compare] 错误:', (e && e.stack) || e);
  process.exitCode = 2;
}
