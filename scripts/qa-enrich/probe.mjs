#!/usr/bin/env node
/* ============================================================
 * probe.mjs — world.execute(me); MV 视觉 QA 探针
 * ============================================================
 *
 * 复现命令（在仓库根目录执行；无需 npm install，不联网）：
 *
 *   # 1) 冒烟（live tree，仅 metrics，51 个采样点，要求平均 nonBg > 0.02）
 *   node scripts/qa-enrich/probe.mjs --label smoke --index mv/index.html --mode metrics --assert-min-nonbg 0.02
 *
 *   # 2) 基线（从 git HEAD 的 worktree 采样；跑完删除 worktree）
 *   git worktree add --detach mv/_qa_baseline HEAD
 *   node scripts/qa-enrich/probe.mjs --label baseline --index mv/_qa_baseline/mv/index.html --mode both
 *   git worktree remove --force mv/_qa_baseline
 *
 *   # 3) 增强版（由后续任务修改 live tree 后执行；mode both）
 *   node scripts/qa-enrich/probe.mjs --label enriched --index mv/index.html --mode both
 *
 *   # 4) 对比（阈值可用 CLI 覆盖，见 compare.mjs 头部）
 *   node scripts/qa-enrich/compare.mjs --baseline baseline --enriched enriched
 *
 * 输出：mv/_qa_enrich/<label>/{metrics.json, screenshots/*.png, fps.json, errors.json, run.log}
 * 浏览器：系统 Edge（channel: msedge），headless，1920x1080 @ dsf=1，--hide-scrollbars。
 * Playwright：只从本机 npx 缓存/已装 node_modules 解析（不执行 playwright install）。
 * URL：url.pathToFileURL + ?t=秒（MV 预览模式：虚拟时钟，无需音频）。
 * 指标：nonBg/edge/sat/richness 见页面内公式；motion = 2x 降采样 luma 网格上的平均绝对差，
 *      归一化到 0..1（luma 0..255 ÷ 255，与 compare 的 0.004 阈值同尺度），同时保留 motionRaw255。
 * 超时：每页 30s（默认，可 --timeout 覆盖）；整次运行 8min 看门狗（可 --max-run-min 覆盖）。
 * 重试：若 pageerror/console 指向 scenes-part*.js 的语法错误，等 60s 重试一次（并发编辑保护）。
 * 退出码：存在 console/pageerror、采样失败、nonBg 断言失败或未采满时 = 1，否则 0。
 * ============================================================ */
import { createRequire } from 'node:module';
import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import process from 'node:process';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '..', '..');
const RICHNESS_W = { nonBg: 0.40, edge: 0.35, sat: 0.25 };

/* ---------------- CLI ---------------- */
const USAGE = `用法: node scripts/qa-enrich/probe.mjs --label <name> [选项]
  --label <name>        输出标签（必填；目录 mv/_qa_enrich/<label>/，也是 Edge profile 名）
  --index <path>        MV 入口（相对仓库根；默认 mv/index.html）
  --mode <both|metrics|fps>  默认 both
  --samples <path>      采样表（默认 scripts/qa-enrich/samples.json）
  --out <dir>           输出根目录（默认 mv/_qa_enrich）
  --profile <dir>       Edge user-data-dir（默认 <out>/profiles/<label>）
  --timeout <ms>        每页超时（默认 30000）
  --fps-ms <ms>         每场景窗口测帧时长（默认 4500）
  --fps-warmup <ms>     场景载入后预热（默认 800）
  --motion-ms <ms>      两次取像间隔（默认 350）
  --retry-wait <ms>     场景语法错误重试等待（默认 60000）
  --max-run-min <min>   整次运行看门狗（默认 8）
  --assert-min-nonbg <x>  平均 nonBg 低于 x 则判失败（默认 0=不检查）
  --playwright <dir>    指定 playwright 包目录或其 node_modules 目录
  --headful             有头模式（调试用）
`;

function parseArgs(argv) {
  const o = {
    label: null,
    index: 'mv/index.html',
    mode: 'both',
    samples: 'scripts/qa-enrich/samples.json',
    out: 'mv/_qa_enrich',
    profile: null,
    timeout: 30000,
    fpsMs: 4500,
    fpsWarmup: 800,
    motionMs: 350,
    retryWait: 60000,
    maxRunMin: 8,
    assertMinNonBg: 0,
    playwright: process.env.QA_PLAYWRIGHT_DIR || null,
    headful: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    const val = () => { i += 1; if (i >= argv.length) throw new Error('缺少参数值: ' + a); return argv[i]; };
    switch (a) {
      case '--label': o.label = val(); break;
      case '--index': o.index = val(); break;
      case '--mode': o.mode = val(); break;
      case '--samples': o.samples = val(); break;
      case '--out': o.out = val(); break;
      case '--profile': o.profile = val(); break;
      case '--timeout': o.timeout = Number(val()); break;
      case '--fps-ms': o.fpsMs = Number(val()); break;
      case '--fps-warmup': o.fpsWarmup = Number(val()); break;
      case '--motion-ms': o.motionMs = Number(val()); break;
      case '--retry-wait': o.retryWait = Number(val()); break;
      case '--max-run-min': o.maxRunMin = Number(val()); break;
      case '--assert-min-nonbg': o.assertMinNonBg = Number(val()); break;
      case '--playwright': o.playwright = val(); break;
      case '--headful': o.headful = true; break;
      case '--help': case '-h': console.log(USAGE); process.exit(0); break;
      default: throw new Error('未知参数: ' + a);
    }
  }
  if (!o.label) throw new Error('必须提供 --label\n' + USAGE);
  if (!['both', 'metrics', 'fps'].includes(o.mode)) throw new Error('--mode 只能是 both|metrics|fps');
  return o;
}

/* ---------------- 小工具 ---------------- */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const r6 = (x) => (x == null || !isFinite(x) ? x : Number(x.toFixed(6)));
const fmt = (x) => (x == null || !isFinite(x) ? String(x) : x.toFixed(4));
const existsJson = (p) => existsSync(join(p, 'package.json'));

function withTimeout(promise, ms, what) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, rej) => { timer = setTimeout(() => rej(new Error(`操作超时(${ms}ms): ${what}`)), ms); }),
  ]).finally(() => clearTimeout(timer));
}

function writeJsonAtomic(file, obj) {
  const tmp = file + '.tmp';
  writeFileSync(tmp, JSON.stringify(obj, null, 1));
  renameSync(tmp, file);
}

function readJsonOrNull(file) {
  try { return JSON.parse(readFileSync(file, 'utf8')); } catch { return null; }
}

/* ---------------- Playwright 定位（零安装） ---------------- */
function candidateDirs(opts) {
  const list = [];
  const push = (dir) => {
    if (!dir) return;
    if (existsJson(join(dir, 'playwright'))) list.push(join(dir, 'playwright'));
    else if (existsJson(dir) && dir.replace(/[\\/]+$/, '').endsWith('playwright')) list.push(dir);
  };
  if (opts.playwright) {
    push(opts.playwright);
    push(join(opts.playwright, 'node_modules'));
  }
  const local = process.env.LOCALAPPDATA || '';
  const npxRoot = join(local, 'npm-cache', '_npx');
  if (existsSync(npxRoot)) {
    for (const d of readdirSync(npxRoot)) push(join(npxRoot, d, 'node_modules'));
  }
  for (const base of [join(local, 'npm-cache'), join(process.env.APPDATA || '', 'npm'), join(process.env.USERPROFILE || '', '.npm'), REPO_ROOT, SCRIPT_DIR]) {
    if (base) push(join(base, 'node_modules'));
  }
  return list;
}

function locatePlaywright(opts) {
  const found = [];
  for (const dir of candidateDirs(opts)) {
    const pkg = join(dir, 'package.json');
    if (!existsSync(pkg)) continue;
    let version = '?';
    try { version = JSON.parse(readFileSync(pkg, 'utf8')).version || '?'; } catch { /* ignore */ }
    if (!found.some((f) => f.dir === dir)) found.push({ dir, version });
  }
  if (!found.length) {
    throw new Error('未找到本机 playwright（未执行任何安装）。可设 QA_PLAYWRIGHT_DIR 或 --playwright <dir>。');
  }
  const preferred = found.find((f) => f.version === '1.63.0') || found[0];
  return { ...preferred, all: found };
}

/* ---------------- 页面内测量函数（会被序列化进浏览器执行） ---------------- */
async function measureStaticFn({ forceT }) {
  const MV = window.MV;
  const canvas = document.getElementById('stage');
  MV.forceTime = forceT;
  MV.Engine._vT = 0;
  await new Promise(function (r) { requestAnimationFrame(function () { requestAnimationFrame(r); }); });
  const tRec = MV.time();

  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const d = ctx.getImageData(0, 0, w, h).data;
  const gw = w >> 1, gh = h >> 1;
  const grid = new Float32Array(gw * gh);
  let nonBg = 0, sat = 0;
  for (let y = 0; y < h; y++) {
    const rowOff = y * w;
    const evenY = (y & 1) === 0;
    for (let x = 0; x < w; x++) {
      const i = (rowOff + x) * 4;
      const r = d[i], g = d[i + 1], b = d[i + 2];
      /* 与背景 [5,7,13] 的最大通道距离 > 18 */
      const dr = r - 5, dg = g - 7, db = b - 13;
      const m = Math.max(dr < 0 ? -dr : dr, dg < 0 ? -dg : dg, db < 0 ? -db : db);
      if (m > 18) nonBg++;
      /* 饱和度：max-min 通道差 > 24 */
      const mx = r > g ? (r > b ? r : b) : (g > b ? g : b);
      const mn = r < g ? (r < b ? r : b) : (g < b ? g : b);
      if (mx - mn > 24) sat++;
      if (evenY && (x & 1) === 0) grid[(y >> 1) * gw + (x >> 1)] = 0.299 * r + 0.587 * g + 0.114 * b;
    }
  }
  /* 2x 降采样 luma 网格上的 Sobel 梯度 */
  let edgeN = 0;
  const iw = gw - 2, ih = gh - 2;
  for (let y = 1; y <= ih; y++) {
    const r0 = (y - 1) * gw, r1 = y * gw, r2 = (y + 1) * gw;
    for (let x = 1; x <= iw; x++) {
      const gx = -grid[r0 + x - 1] - 2 * grid[r1 + x - 1] - grid[r2 + x - 1]
        + grid[r0 + x + 1] + 2 * grid[r1 + x + 1] + grid[r2 + x + 1];
      const gy = -grid[r0 + x - 1] - 2 * grid[r0 + x] - grid[r0 + x + 1]
        + grid[r2 + x - 1] + 2 * grid[r2 + x] + grid[r2 + x + 1];
      if (gx * gx + gy * gy > 1600) edgeN++;
    }
  }
  window.__qaGridA = grid;
  window.__qaT0 = performance.now();
  return {
    tRec,
    canvasW: w,
    canvasH: h,
    nonBg: nonBg / (w * h),
    sat: sat / (w * h),
    edge: edgeN / (iw * ih),
  };
}

async function motionFn({ motionMs }) {
  const remain = Math.max(0, motionMs - (performance.now() - window.__qaT0));
  if (remain > 0) await new Promise(function (r) { setTimeout(r, remain); });
  const canvas = document.getElementById('stage');
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const d = ctx.getImageData(0, 0, w, h).data;
  const gw = w >> 1, gh = h >> 1;
  const b = new Float32Array(gw * gh);
  for (let y = 0; y < gh; y++) {
    const rowOff = (y * 2) * w;
    for (let x = 0; x < gw; x++) {
      const i = (rowOff + x * 2) * 4;
      b[y * gw + x] = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    }
  }
  const a = window.__qaGridA;
  const n = Math.min(a.length, b.length);
  let sum = 0;
  for (let i = 0; i < n; i++) sum += Math.abs(b[i] - a[i]);
  /* motion 归一化到 0..1（luma 0..255 → ÷255），与 compare 阈值 0.004 同尺度 */
  const mad255 = n ? sum / n : 0;
  return { motion: mad255 / 255, motionRaw255: mad255, gridCells: n, gapMs: performance.now() - window.__qaT0 };
}

function rafPatchFn() {
  const raf = window.requestAnimationFrame.bind(window);
  let last = 0;
  window.__qaFrames = [];
  window.requestAnimationFrame = function (cb) {
    return raf(function (ts) {
      if (last && ts > last) window.__qaFrames.push(ts - last);
      last = ts;
      cb(ts);
    });
  };
}

/* ---------------- 统计 ---------------- */
function statsFromDeltas(deltas) {
  const ds = Array.from(deltas).filter((d) => typeof d === 'number' && isFinite(d) && d > 0).sort((a, b) => a - b);
  if (!ds.length) return { frames: 0 };
  const at = (arr, p) => arr[Math.min(arr.length - 1, Math.max(0, Math.ceil(p * arr.length) - 1))];
  return {
    frames: ds.length,
    medianFps: 1000 / at(ds, 0.5),
    p95Fps: 1000 / at(ds, 0.95),
    maxFps: 1000 / ds[0],
    medianFrameMs: at(ds, 0.5),
    p95FrameMs: at(ds, 0.95),
    maxFrameMs: ds[ds.length - 1],
  };
}

const isSceneSyntaxError = (e) => /scenes-part\d+\.js/i.test(`${(e && e.text) || ''}\n${(e && e.stack) || ''}\n${(e && e.url) || ''}`);

/* ---------------- 主流程 ---------------- */
async function main() {
  const opts = parseArgs(process.argv);
  const indexAbs = resolve(REPO_ROOT, opts.index);
  if (!existsSync(indexAbs)) throw new Error('找不到 --index: ' + indexAbs);
  const samplesAbs = resolve(REPO_ROOT, opts.samples);
  const outRoot = resolve(REPO_ROOT, opts.out);
  const labelDir = join(outRoot, opts.label);
  const shotsDir = join(labelDir, 'screenshots');
  const profileDir = opts.profile ? resolve(REPO_ROOT, opts.profile) : join(outRoot, 'profiles', opts.label);
  mkdirSync(shotsDir, { recursive: true });
  mkdirSync(profileDir, { recursive: true });

  const logPath = join(labelDir, 'run.log');
  writeFileSync(logPath, '');
  const log = (msg) => {
    const line = `[${new Date().toISOString().slice(11, 19)}] ${msg}`;
    console.log(line);
    appendFileSync(logPath, line + '\n');
  };

  const raw = readJsonOrNull(samplesAbs);
  if (!raw) throw new Error('采样表读取失败: ' + samplesAbs);
  const sampleList = [
    ...(raw.sparse || []).map((t) => ({ t, kind: 'sparse' })),
    ...(raw.dense || []).map((t) => ({ t, kind: 'dense' })),
  ];
  const fpsWindows = raw.fpsWindows || [];
  if (!sampleList.length) throw new Error('采样表为空');

  const pw = locatePlaywright(opts);
  log(`probe start: label=${opts.label} mode=${opts.mode} index=${indexAbs}`);
  log(`playwright=${pw.version} @ ${pw.dir}（候选: ${pw.all.map((f) => f.version + ' @ ' + f.dir).join(' | ')}）`);
  log(`samples: sparse+dense=${sampleList.length}, fpsWindows=${fpsWindows.length}`);
  if (opts.assertMinNonBg > 0) log(`assert: avg nonBg > ${opts.assertMinNonBg}`);
  log(`profile=${profileDir}`);

  const req = createRequire(pw.dir + sep);
  const { chromium } = req('playwright');
  const deadline = Date.now() + opts.maxRunMin * 60000;
  const deadlineExceeded = () => Date.now() > deadline;

  const urlFor = (t) => {
    const u = pathToFileURL(indexAbs);
    u.searchParams.set('t', String(t));
    return u.href;
  };

  const allErrors = [];
  let metricsRows = [];
  let fpsRows = [];
  const retries = [];
  const startedAt = new Date().toISOString();
  const t0 = Date.now();
  const started = { metrics: false, fps: false };

  const baseMeta = {
    label: opts.label,
    index: indexAbs,
    indexUrl: urlFor(0),
    playwright: pw.version,
    playwrightDir: pw.dir,
    node: process.version,
    platform: process.platform,
    startedAt,
    mode: opts.mode,
  };

  const writeMetrics = () => {
    const rows = metricsRows;
    const ok = rows.filter((r) => !r.failed);
    const avg = (k) => (ok.length ? ok.reduce((s, r) => s + (r[k] || 0), 0) / ok.length : null);
    writeJsonAtomic(join(labelDir, 'metrics.json'), {
      ...baseMeta,
      finishedAt: new Date().toISOString(),
      durationMs: Date.now() - t0,
      expected: sampleList.length,
      count: rows.length,
      complete: rows.length === sampleList.length,
      summary: {
        avgNonBg: r6(avg('nonBg')),
        minNonBg: ok.length ? r6(Math.min(...ok.map((r) => r.nonBg))) : null,
        avgRichness: r6(avg('richness')),
        avgEdge: r6(avg('edge')),
        avgSat: r6(avg('sat')),
        avgMotion: r6(avg('motion')),
        failed: rows.length - ok.length,
        sampleErrors: rows.reduce((s, r) => s + (r.errors ? r.errors.length : 0), 0),
      },
      retries: retries.filter((r) => r.mode === 'metrics'),
      samples: rows,
    });
  };
  const writeFps = () => {
    const ok = fpsRows.filter((r) => !r.failed && r.frames > 0);
    writeJsonAtomic(join(labelDir, 'fps.json'), {
      ...baseMeta,
      finishedAt: new Date().toISOString(),
      durationMs: Date.now() - t0,
      expected: fpsWindows.length,
      count: fpsRows.length,
      complete: fpsRows.length === fpsWindows.length,
      summary: {
        medianOfMedians: r6(ok.length ? ok.reduce((s, r) => s + r.medianFps, 0) / ok.length : null),
        minMedianFps: ok.length ? r6(Math.min(...ok.map((r) => r.medianFps))) : null,
        worstP95FrameMs: ok.length ? r6(Math.max(...ok.map((r) => r.p95FrameMs))) : null,
        failed: fpsRows.length - ok.length,
        windowErrors: fpsRows.reduce((s, r) => s + (r.errors ? r.errors.length : 0), 0),
      },
      windows: fpsRows,
    });
  };
  const writeErrors = () => {
    const byMode = {};
    for (const e of allErrors) byMode[e.mode] = (byMode[e.mode] || 0) + 1;
    writeJsonAtomic(join(labelDir, 'errors.json'), {
      ...baseMeta,
      finishedAt: new Date().toISOString(),
      count: allErrors.length,
      byMode,
      entries: allErrors,
    });
  };

  const sink = { entries: [] };
  const targetRef = { value: '' };
  const attach = (page, mode) => {
    page.on('console', (m) => {
      if (m.type() !== 'error') return;
      const loc = m.location();
      sink.entries.push({ mode, target: targetRef.value, type: 'console', text: m.text(), url: loc && loc.url, line: loc && loc.lineNumber });
    });
    page.on('pageerror', (err) => {
      sink.entries.push({ mode, target: targetRef.value, type: 'pageerror', text: String((err && err.message) || err), stack: (err && err.stack) || '' });
    });
  };
  const snapshotErrors = () => {
    const e = sink.entries.slice();
    sink.entries.length = 0;
    return e;
  };

  let context = null;
  try {
    context = await chromium.launchPersistentContext(profileDir, {
      channel: 'msedge',
      headless: !opts.headful,
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1,
      args: ['--hide-scrollbars', '--no-first-run', '--no-default-browser-check'],
      timeout: opts.timeout,
    });
    const newPage = async () => {
      const page = await context.newPage();
      page.setDefaultTimeout(opts.timeout);
      page.setDefaultNavigationTimeout(opts.timeout);
      return page;
    };

    /* ---- metrics 阶段 ---- */
    if (opts.mode === 'both' || opts.mode === 'metrics') {
      started.metrics = true;
      const page = await newPage();
      attach(page, 'metrics');
      log(`[metrics] 开始 ${sampleList.length} 个采样点`);
      for (let i = 0; i < sampleList.length; i++) {
        if (deadlineExceeded()) { log(`[metrics] 看门狗超时（${opts.maxRunMin}min），提前停止于第 ${i} 个`); break; }
        const { t, kind } = sampleList[i];
        targetRef.value = `metrics:t=${t}(${kind})`;
        let row = null;
        for (let attempt = 1; attempt <= 2; attempt++) {
          sink.entries.length = 0;
          try {
            await page.goto(urlFor(t), { waitUntil: 'load', timeout: opts.timeout });
            await page.waitForFunction(() => !!(window.MV && document.getElementById('stage')), null, { timeout: opts.timeout });
            await page.waitForTimeout(150);
            const syn = sink.entries.find(isSceneSyntaxError);
            if (syn && attempt === 1) {
              retries.push({ mode: 'metrics', target: targetRef.value, attempt, reason: syn.text });
              log(`[RETRY] ${targetRef.value}: 场景文件语法错误 → ${opts.retryWait / 1000}s 后重试一次：${syn.text}`);
              await sleep(opts.retryWait);
              continue;
            }
            const first = await withTimeout(page.evaluate(measureStaticFn, { forceT: t }), opts.timeout + 15000, `measure@t=${t}`);
            const shotName = `t${String(t).replace('.', '_')}.png`;
            await withTimeout(page.screenshot({ path: join(shotsDir, shotName), timeout: opts.timeout }), opts.timeout + 15000, `screenshot@t=${t}`);
            const second = await withTimeout(page.evaluate(motionFn, { motionMs: opts.motionMs }), opts.timeout + 15000, `motion@t=${t}`);
            const richness = RICHNESS_W.nonBg * first.nonBg + RICHNESS_W.edge * first.edge + RICHNESS_W.sat * first.sat;
            row = {
              t, kind,
              time: r6(first.tRec),
              nonBg: r6(first.nonBg),
              edge: r6(first.edge),
              sat: r6(first.sat),
              richness: r6(richness),
              motion: r6(second.motion),
              motionRaw255: r6(second.motionRaw255),
              motionGapMs: Math.round(second.gapMs),
              canvas: `${first.canvasW}x${first.canvasH}`,
              screenshot: `screenshots/${shotName}`,
              errors: snapshotErrors(),
            };
            break;
          } catch (e) {
            const msg = String((e && e.message) || e);
            if (attempt === 1 && isSceneSyntaxError({ text: msg, stack: e && e.stack })) {
              retries.push({ mode: 'metrics', target: targetRef.value, attempt, reason: msg });
              log(`[RETRY] ${targetRef.value}: 语法错误（异常路径）→ ${opts.retryWait / 1000}s 后重试一次`);
              await sleep(opts.retryWait);
              continue;
            }
            row = { t, kind, failed: true, error: msg, errors: snapshotErrors() };
            break;
          }
        }
        if (!row) row = { t, kind, failed: true, error: '重试后仍未成功', errors: [] };
        metricsRows.push(row);
        allErrors.push(...(row.errors || []));
        writeMetrics();
        writeErrors();
        log(`[metrics ${i + 1}/${sampleList.length}] t=${t} ${kind} nonBg=${fmt(row.nonBg)} edge=${fmt(row.edge)} sat=${fmt(row.sat)} rich=${fmt(row.richness)} motion=${fmt(row.motion)}${row.failed ? ' FAILED ' + row.error : ''}`);
      }
      await page.close();
    }

    /* ---- fps 阶段 ---- */
    if (opts.mode === 'both' || opts.mode === 'fps') {
      started.fps = true;
      const page = await newPage();
      attach(page, 'fps');
      await page.addInitScript(rafPatchFn);
      log(`[fps] 开始 ${fpsWindows.length} 个场景窗口，每窗口预热 ${opts.fpsWarmup}ms + 测量 ${opts.fpsMs}ms`);
      for (let i = 0; i < fpsWindows.length; i++) {
        if (deadlineExceeded()) { log(`[fps] 看门狗超时（${opts.maxRunMin}min），提前停止于第 ${i} 个`); break; }
        const w = fpsWindows[i];
        const mid = r6((w.t0 + w.t1) / 2);
        targetRef.value = `fps:${w.scene}@${mid}`;
        let row = null;
        for (let attempt = 1; attempt <= 2; attempt++) {
          sink.entries.length = 0;
          try {
            await page.goto(urlFor(mid), { waitUntil: 'load', timeout: opts.timeout });
            await page.waitForFunction(() => !!(window.MV && document.getElementById('stage')), null, { timeout: opts.timeout });
            await page.waitForTimeout(opts.fpsWarmup);
            const syn = sink.entries.find(isSceneSyntaxError);
            if (syn && attempt === 1) {
              retries.push({ mode: 'fps', target: targetRef.value, attempt, reason: syn.text });
              log(`[RETRY] ${targetRef.value}: 场景文件语法错误 → ${opts.retryWait / 1000}s 后重试一次：${syn.text}`);
              await sleep(opts.retryWait);
              continue;
            }
            await page.evaluate(() => { window.__qaFrames = []; });
            await page.waitForTimeout(opts.fpsMs);
            const deltas = await withTimeout(page.evaluate(() => window.__qaFrames.slice()), opts.timeout, `frames@${w.scene}`);
            const st = statsFromDeltas(deltas);
            row = {
              scene: w.scene, t0: w.t0, t1: w.t1, t: mid,
              ...st,
              errors: snapshotErrors(),
            };
            break;
          } catch (e) {
            const msg = String((e && e.message) || e);
            if (attempt === 1 && isSceneSyntaxError({ text: msg, stack: e && e.stack })) {
              retries.push({ mode: 'fps', target: targetRef.value, attempt, reason: msg });
              log(`[RETRY] ${targetRef.value}: 语法错误（异常路径）→ ${opts.retryWait / 1000}s 后重试一次`);
              await sleep(opts.retryWait);
              continue;
            }
            row = { scene: w.scene, t0: w.t0, t1: w.t1, t: mid, failed: true, error: msg, errors: snapshotErrors() };
            break;
          }
        }
        if (!row) row = { scene: w.scene, t0: w.t0, t1: w.t1, t: mid, failed: true, error: '重试后仍未成功', errors: [] };
        fpsRows.push(row);
        allErrors.push(...(row.errors || []));
        writeFps();
        writeErrors();
        log(`[fps ${i + 1}/${fpsWindows.length}] ${w.scene}@${mid} frames=${row.frames || 0} median=${fmt(row.medianFps)}fps p95=${fmt(row.p95Fps)}fps max=${fmt(row.maxFps)}fps p95ms=${fmt(row.p95FrameMs)} maxms=${fmt(row.maxFrameMs)}${row.failed ? ' FAILED ' + row.error : ''}`);
      }
      await page.close();
    }
  } finally {
    if (context) await context.close().catch(() => {});
  }

  writeErrors();
  if (started.metrics) writeMetrics();
  if (started.fps) writeFps();

  /* ---- 判定/摘要 ---- */
  const okRows = metricsRows.filter((r) => !r.failed);
  const avgNonBg = okRows.length ? okRows.reduce((s, r) => s + r.nonBg, 0) / okRows.length : 0;
  const failedRows = metricsRows.filter((r) => r.failed).length + fpsRows.filter((r) => r.failed).length;
  const incomplete = (started.metrics && metricsRows.length !== sampleList.length) || (started.fps && fpsRows.length !== fpsWindows.length);
  const nonBgFail = opts.assertMinNonBg > 0 && started.metrics && avgNonBg <= opts.assertMinNonBg;
  const durationSec = ((Date.now() - t0) / 1000).toFixed(1);
  log(`probe done in ${durationSec}s: metrics=${metricsRows.length}/${sampleList.length} fps=${fpsRows.length}/${fpsWindows.length} errors=${allErrors.length} failedSamples=${failedRows} retries=${retries.length} avgNonBg=${fmt(avgNonBg)}`);
  if (allErrors.length) log(`!!! ${allErrors.length} 条 console/pageerror，详见 errors.json`);
  if (retries.length) log(`retries: ${JSON.stringify(retries)}`);
  if (nonBgFail) log(`!!! nonBg 断言失败：avg ${fmt(avgNonBg)} <= ${opts.assertMinNonBg}`);
  if (incomplete) log('!!! 采样不完整（看门狗或失败中断）');
  const ok = allErrors.length === 0 && failedRows === 0 && !nonBgFail && !incomplete;
  log(ok ? 'RUN OK' : 'RUN FAILED');
  if (!ok) process.exitCode = 1;
}

main().catch((e) => {
  console.error('[probe] 致命错误:', e && e.stack ? e.stack : e);
  process.exitCode = 2;
});
