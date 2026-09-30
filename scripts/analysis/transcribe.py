# -*- coding: utf-8 -*-
"""用 faster-whisper 转录 world.execute(me);.mp3，获取词级时间戳，输出 transcript.json。"""
import json
import os
from faster_whisper import WhisperModel

AUDIO = "world.execute(me);.mp3"
OUT = "scripts/analysis/transcript.json"

print("加载 whisper small.en 模型 (首次运行需下载 ~460MB)...", flush=True)
model = WhisperModel("small.en", device="cpu", compute_type="int8")
print("模型就绪，开始转录...", flush=True)

segments, info = model.transcribe(
    AUDIO, language="en", word_timestamps=True, beam_size=5, vad_filter=False
)

out = {"language": info.language, "duration": info.duration, "segments": []}
for s in segments:
    words = []
    if s.words:
        words = [
            {"w": w.word, "s": round(w.start, 3), "e": round(w.end, 3)}
            for w in s.words
        ]
    out["segments"].append(
        {
            "start": round(s.start, 3),
            "end": round(s.end, 3),
            "text": s.text.strip(),
            "words": words,
        }
    )
    print(f"[{s.start:7.2f} - {s.end:7.2f}] {s.text.strip()}", flush=True)

with open(OUT, "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=1)
print("已保存:", OUT, flush=True)
