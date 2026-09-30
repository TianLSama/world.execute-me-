/* ============================================================
 * main.js —— 启动与交互绑定
 * 职责：初始化引擎与歌词层、启动遮罩交互、空格暂停、进度条寻址、
 *       结束重播、以及 ?t=秒数 强制时间预览模式（供截图/调试）。
 * ============================================================ */
(function () {
  'use strict';

  var MV = window.MV;

  function $(id) { return document.getElementById(id); }

  var canvas = $('stage');
  var audio = $('audio');
  var Engine = MV.Engine;

  Engine.init(canvas, audio);
  MV.Lyrics.init();

  var startOv = $('overlay-start');
  var doneOv = $('overlay-done');
  var forceMode = (MV.forceTime != null);

  /* ---------- 开始执行 ---------- */
  function execute() {
    startOv.classList.add('hidden');
    var p = audio.play();
    if (p && p.catch) p.catch(function () { /* 用户手势内一般不会失败 */ });
    Engine.start();
  }
  $('btn-exec').addEventListener('click', function () {
    this.blur(); /* 防止空格再次触发按钮 */
    execute();
  });

  if (forceMode) {
    /* 预览模式：跳过开始遮罩，直接用虚拟时钟渲染 */
    startOv.classList.add('hidden');
  }

  /* ---------- 暂停 / 继续 ---------- */
  $('btn-play').addEventListener('click', function () {
    this.blur();
    Engine.toggle();
  });
  window.addEventListener('keydown', function (e) {
    if (e.code === 'Space' || e.key === ' ') {
      e.preventDefault();
      Engine.wake();
      Engine.toggle();
    }
  });

  /* ---------- 进度条寻址 ---------- */
  var prog = $('progress');
  prog.addEventListener('click', function (e) {
    var r = prog.getBoundingClientRect();
    var k = MV.clamp((e.clientX - r.left) / Math.max(r.width, 1), 0, 1);
    Engine.seek(k * MV_DATA.duration);
    doneOv.classList.add('hidden');
  });

  /* ---------- 播放结束与重播 ---------- */
  audio.addEventListener('ended', function () {
    doneOv.classList.remove('hidden');
  });
  $('btn-replay').addEventListener('click', function () {
    this.blur();
    doneOv.classList.add('hidden');
    Engine.seek(0);
    var p = audio.play();
    if (p && p.catch) p.catch(function () {});
  });

  /* 引擎先跑起来（音频未播放时画面静止在起始帧） */
  Engine.start();
})();
