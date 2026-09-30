# -*- coding: utf-8 -*-
"""对 world.execute(me);.mp3 做节拍/结构分析，输出 beats.json 供 MV 动画使用。"""
import json
import os
import numpy as np
import librosa

AUDIO = "scripts/analysis/audio22k.wav"
OUT_DIR = "scripts/analysis"
os.makedirs(OUT_DIR, exist_ok=True)

print("[1/4] 加载音频...")
y, sr = librosa.load(AUDIO, sr=22050, mono=True)
dur = float(librosa.get_duration(y=y, sr=sr))
print(f"    时长: {dur:.3f}s, 采样率: {sr}")

print("[2/4] 节拍跟踪 (beat tracking)...")
onset_env = librosa.onset.onset_strength(y=y, sr=sr)
# trim=False 保证覆盖整首，不从首个强拍开始
tempo, beats = librosa.beat.beat_track(onset_envelope=onset_env, sr=sr, trim=False)
tempo = float(np.atleast_1d(tempo)[0])
beat_times = librosa.frames_to_time(beats, sr=sr).tolist()
print(f"    检测 BPM: {tempo:.2f}, 拍数: {len(beat_times)}")
print(f"    首拍: {beat_times[0]:.3f}s, 末拍: {beat_times[-1]:.3f}s")
if len(beat_times) >= 2:
    ibi = np.diff(beat_times)
    print(f"    拍间隔中位数: {np.median(ibi)*1000:.2f} ms")

print("[3/4] onset / 能量包络...")
onset_frames = librosa.onset.onset_detect(
    onset_envelope=onset_env, sr=sr, backtrack=True, units="frames"
)
onset_times = librosa.frames_to_time(onset_frames, sr=sr).tolist()
print(f"    onset 数: {len(onset_times)}")

# 全局能量包络 (hop=512 -> ~43ms/帧)，输出每 0.25s 一个值
hop = 512
rms = librosa.feature.rms(y=y, frame_length=2048, hop_length=hop)[0]
t_frames = librosa.frames_to_time(np.arange(len(rms)), sr=sr, hop_length=hop)
step = max(1, int(round(0.25 * sr / hop)))
env_times = t_frames[::step].tolist()
env_val = rms[::step].tolist()

# 低频能量(鼓点)/中频(人声)分别输出，辅助段落归类
S = np.abs(librosa.stft(y, n_fft=2048, hop_length=hop))
freqs = librosa.fft_frequencies(sr=sr, n_fft=2048)
low = S[freqs < 200].mean(axis=0)
mid = S[(freqs >= 300) & (freqs < 4000)].mean(axis=0)
low_t = low[::step].tolist()
mid_t = mid[::step].tolist()

print("[4/4] 写入 JSON...")
data = {
    "duration": dur,
    "tempo": round(tempo, 4),
    "beat_times": [round(t, 4) for t in beat_times],
    "onset_times": [round(t, 4) for t in onset_times],
    "env_times": [round(t, 4) for t in env_times],
    "env_rms": [round(v, 6) for v in env_val],
    "env_low": [round(v, 6) for v in low_t],
    "env_mid": [round(v, 6) for v in mid_t],
}
with open(os.path.join(OUT_DIR, "beats.json"), "w", encoding="utf-8") as f:
    json.dump(data, f)

# 打印每 10 秒的平均能量，人工判断段落
print("\n=== 每 10s 平均能量(rms)与低频能量 ===")
block = int(10 / 0.25)
for i in range(0, len(env_val), block):
    seg = env_val[i : i + block]
    seg_low = low_t[i : i + block]
    t0 = i * 0.25
    print(f"  {t0:6.1f}s - {min(t0+10, dur):6.1f}s | rms={np.mean(seg):.5f} | low={np.mean(seg_low):.5f}")

print("\n完成: scripts/analysis/beats.json")
