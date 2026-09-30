# -*- coding: utf-8 -*-
"""把 LRC 歌词、中文译文、节拍数据合并为 MV 用的 mv/timeline.js。

数据流：lyrics_raw.lrc(行级时间) + SENTENCES(句子分组/译文) + beats.json(节拍) -> mv/timeline.js
"""
import json
import re

LRC_PATH = "scripts/analysis/lyrics_raw.lrc"
BEATS_PATH = "scripts/analysis/beats.json"
OUT_PATH = "mv/timeline.js"

# ---------------------------------------------------------------- 解析 LRC
lines = []
with open(LRC_PATH, encoding="utf-8") as f:
    for raw in f:
        m = re.match(r"\[(\d+):(\d+\.\d+)\](.*)", raw.strip())
        if not m:
            continue
        t = int(m.group(1)) * 60 + float(m.group(2))
        lines.append({"t": round(t, 3), "text": m.group(3).strip()})
print(f"LRC 行数: {len(lines)}")

# ------------------------------------------------- 句子分组（parts=行索引列表）
# type: normal=普通歌词, speech=念白, chant=EXECUTION连呼, count=数字倒数, repeat=重复消失
SENTENCES = [
    {"zh": "接上电源", "parts": [(0, "Switch on the power line")]},
    {"zh": "记得装备好绝缘护具", "parts": [(1, "Remember to put on"), (2, "PROTECTION")]},
    {"zh": "摆好棋子", "parts": [(3, "Lay down your pieces")]},
    {"zh": "开始吧，对象生成", "parts": [(4, "And let's begin"), (5, "OBJECT CREATION")]},
    {"zh": "输入我的参数数据", "parts": [(6, "Fill in my data parameters")]},
    {"zh": "初始化", "parts": [(7, "INITIALIZATION")]},
    {"zh": "设定好我们的新世界", "parts": [(8, "Set up our new world")]},
    {"zh": "开始吧，模拟程序", "parts": [(9, "And let's begin the"), (10, "SIMULATION")]},
    {"zh": "世界.执行（我）；", "type": "speech", "parts": [(11, "world.execute(me);")]},
    {"zh": "如果我是一组点，那么我将献给你我的次元",
     "parts": [(12, "If I'm a set of points"), (13, "Then I will give you my"), (14, "DIMENSION")]},
    {"zh": "如果我是一个圆，那么我将献给你我的圆周",
     "parts": [(15, "If I'm a circle"), (16, "Then I will give you my"), (17, "CIRCUMFERENCE")]},
    {"zh": "如果我是一条正弦波，那么请你坐上我的切线",
     "parts": [(18, "If I'm a sine wave"), (19, "Then you can sit on all my"), (20, "TANGENTS")]},
    {"zh": "如果我趋近于无穷，那么你便可以成为我的极限",
     "parts": [(21, "If I approach infinity"), (22, "Then you can be my"), (23, "LIMITATIONS")]},
    {"zh": "切换我的电流，从交流到直流", "parts": [(24, "Switch my current"), (25, "To AC to DC")]},
    {"zh": "然后蒙上我的眼睛，头晕目眩", "parts": [(26, "And then blind my vision"), (27, "So dizzy so dizzy")]},
    {"zh": "我们可以穿越时空，从西历到公元前", "parts": [(28, "Oh we can travel"), (29, "To A.D to B.C")]},
    {"zh": "然后成为一体，深深入髓", "parts": [(30, "And we can unite"), (31, "So deeply so deeply")]},
    {"zh": "如果我能够，如果我能够献给你所有的刺激",
     "parts": [(32, "If I can"), (33, "If I can give you all the"), (34, "STIMULATIONS")]},
    {"zh": "那么我就能够，那么我就能够成为你唯一的满足",
     "parts": [(35, "Then I can"), (36, "Then I can be your only"), (37, "SATISFACTION")]},
    {"zh": "如果我能够让你开心，那么我将执行指令",
     "parts": [(38, "If I can make you happy"), (39, "I will run the"), (40, "EXECUTION")]},
    {"zh": "但我们被困，在这个异乎寻常的模拟程式之中",
     "parts": [(41, "Though we are trapped"), (42, "In this strange strange"), (43, "SIMULATION")]},
    {"zh": "如果我是一根茄子，那么我将献给你我的营养",
     "parts": [(44, "If I'm an eggplant"), (45, "Then I will give you my"), (46, "NUTRIENTS")]},
    {"zh": "如果我是一颗番茄，那么我将献给你我的抗氧化物",
     "parts": [(47, "If I'm a tomato"), (48, "Then I will give you"), (49, "ANTIOXIDANTS")]},
    {"zh": "如果我是一只花猫，那我将为你咕噜咕噜只要你喜欢",
     "parts": [(50, "If I'm a tabby cat"), (51, "Then I will purr for your"), (52, "ENJOYMENT")]},
    {"zh": "如果我是唯一的神，那么你将是我存在的证明",
     "parts": [(53, "If I'm the only god"), (54, "Then you're the proof of my"), (55, "EXISTENCE")]},
    {"zh": "切换我的性别，从女到男", "parts": [(56, "Switch my gender"), (57, "To F to M")]},
    {"zh": "只做想做的事情，从早到晚", "parts": [(58, "And then do whatever"), (59, "From AM to PM")]},
    {"zh": "切换我的角色，从施虐者到被虐者", "parts": [(60, "Oh switch my role"), (61, "To S to M")]},
    {"zh": "这样我们就可以，恍惚出神", "parts": [(62, "So we can enter"), (63, "The trance the trance")]},
    {"zh": "如果我能够，如果我能够感受到你的振动",
     "parts": [(64, "If I can"), (65, "If I can feel your"), (66, "VIBRATIONS")]},
    {"zh": "那么我就能够，那么我就能够终于变为完全",
     "parts": [(67, "Then I can"), (68, "Then I can finally be"), (69, "COMPLETION")]},
    {"zh": "但你还是走了",
     "type": "repeat",
     "parts": [(70, "Though you have left"), (71, "You have left"), (72, "You have left"),
               (73, "You have left"), (74, "You have left")]},
    {"zh": "你离我而去，在孤独之中", "parts": [(75, "You have left me in"), (76, "ISOLATION")]},
    {"zh": "如果我能够，如果我能够消去这些无意义的碎片",
     "parts": [(77, "If I can"), (78, "If I can erase all the pointless"), (79, "FRAGMENTS")]},
    {"zh": "那么我就可能，那么我就可能不会如此失望",
     "parts": [(80, "Then maybe"), (81, "Then maybe you won't leave me so"), (82, "DISHEARTENED")]},
    {"zh": "与神作对", "parts": [(83, "Challenging your god")]},
    {"zh": "你传给我的是非法参数", "parts": [(84, "You have made some"), (85, "ILLEGAL ARGUMENTS")]},
    {"zh": "执行 执行 执行 执行 执行 执行 执行 执行 执行 执行 执行 执行",
     "type": "chant",
     "parts": [(i, "EXECUTION") for i in range(86, 98)]},
    {"zh": "一 二 三 四 五 六", "type": "count",
     "parts": [(98, "EIN · 1"), (99, "DOS · 2"), (100, "TROIS · 3"),
               (101, "NE · 4"), (102, "FEM · 5"), (103, "LIU · 6"), (104, "EXECUTION")]},
    {"zh": "如果我能够，如果我能够给所有人赐予死刑",
     "parts": [(105, "If I can"), (106, "If I can give them all the"), (107, "EXECUTION")]},
    {"zh": "那么我就能够，那么我就能够成为你唯一的执行",
     "parts": [(108, "Then I can"), (109, "Then I can be your only"), (110, "EXECUTION")]},
    {"zh": "如果你能够回到我身边，那么我将执行指令",
     "parts": [(111, "If I can have you back"), (112, "I will run the"), (113, "EXECUTION")]},
    {"zh": "但我们始终被困，始终被困", "parts": [(114, "Though we are trapped"), (115, "We are trapped ah")]},
    {"zh": "我学会了，我学会了如何正确去爱",
     "parts": [(116, "I've studied"), (117, "I've studied how to properly"), (118, "LO-O-OVE")]},
    {"zh": "提问我吧，我全部都能答对只要是爱的问题",
     "parts": [(119, "Question me"), (120, "Question me I can answer all"), (121, "LO-O-OVE")]},
    {"zh": "就连爱的代数表达式，我都知道",
     "parts": [(122, "I know the algebraic expression of"), (123, "LO-O-OVE")]},
    {"zh": "虽然你已自由，我仍被困，仍被困在爱之中",
     "parts": [(124, "Though you are free"), (125, "I am trapped"),
               (126, "Trapped in"), (127, "LO-O-OVE")]},
    {"zh": "执行死刑", "type": "final", "parts": [(128, "EXECUTION")]},
]

# ------------------------------------------------------------ 场景切换表
SCENES = [
    (0.000, "boot"),       # 开机引导：电源线/网格
    (15.65, "awake"),      # world.execute(me); 光点唤醒
    (29.71, "math"),       # 点/圆/正弦波/无穷 —— 数学定义
    (44.45, "current"),    # 电流切换 AC/DC、时空旅行
    (59.22, "chorus"),     # 副歌 1：能量爆发
    (74.04, "cute"),       # 茄子/番茄/猫/神
    (88.58, "gender"),     # 性别/角色/trance
    (103.38, "chorus2"),   # 副歌 2：振动/完全
    (110.90, "left"),      # 被遗弃：you have left
    (118.33, "fragments"), # 碎片/孤独/失望
    (125.70, "illegal"),   # 与神作对/非法参数
    (133.70, "storm"),     # 器乐：数据风暴
    (147.66, "execute"),   # EXECUTION 连呼
    (162.63, "finale"),    # 终章副歌
    (177.24, "love"),      # 爱的心形曲线
    (205.80, "blackout"),  # 最后的 EXECUTION：闪白熄灭
    (210.50, "shutdown"),  # 关机画面（音频静音段）
]

# -------------------------------------------------------------------- 组装
assert len(lines) >= 129, f"LRC 行数不足: {len(lines)}"

sentences = []
for s in SENTENCES:
    parts = []
    for idx, disp in s["parts"]:
        assert idx < len(lines), f"行索引越界: {idx}"
        parts.append({"t": lines[idx]["t"], "en": disp})
    sentences.append({"t": parts[0]["t"], "type": s.get("type", "normal"),
                      "zh": s["zh"], "parts": parts})

prev_expected = None
for i, s in enumerate(sentences):
    s["end"] = round(sentences[i + 1]["t"], 3) if i + 1 < len(sentences) else 236.518
    if prev_expected is not None and abs(prev_expected - s["t"]) > 0.001:
        print(f"  !! 顺序异常: 句{i} t={s['t']} != 上一句 end={prev_expected}")
    prev_expected = s["end"]

with open(BEATS_PATH, encoding="utf-8") as f:
    beats = json.load(f)

data = {
    "duration": beats["duration"],
    "bpm": beats["tempo"],
    "offset": beats["beat_times"][0],
    "beats": beats["beat_times"],
    "scenes": [{"t": t, "id": sid} for t, sid in SCENES],
    "sentences": sentences,
}

with open(OUT_PATH, "w", encoding="utf-8") as f:
    f.write("// 由 scripts/analysis/build_timeline.py 自动生成，请勿手改\n")
    f.write("window.MV_DATA = ")
    json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
    f.write(";\n")

print(f"句子数: {len(sentences)}, 拍数: {len(beats['beat_times'])}, 场景数: {len(SCENES)}")
print(f"已生成: {OUT_PATH}")

# ------------------------------------------------- 预计算三频段能量谱 env.js
import numpy as np
import librosa

print("计算能量谱 mv/env.js ...")
SR = 22050
y, _ = librosa.load("scripts/analysis/audio22k.wav", sr=SR, mono=True)
hop = 512
S = np.abs(librosa.stft(y, n_fft=2048, hop_length=hop))
freqs = librosa.fft_frequencies(sr=SR, n_fft=2048)
bands = {
    "low": np.asarray(S[freqs < 200].mean(axis=0)),
    "mid": np.asarray(S[(freqs >= 300) & (freqs < 4000)].mean(axis=0)),
    "high": np.asarray(S[freqs >= 4000].mean(axis=0)),
}
frame_t = np.arange(S.shape[1]) * hop / SR
dt = 0.1
n = int(np.ceil(beats["duration"] / dt))
tt = np.arange(n) * dt


def resample(arr):
    idx = np.clip(np.searchsorted(frame_t, tt), 0, len(arr) - 1)
    lo = np.clip(idx - 1, 0, len(arr) - 1)
    hi = np.clip(idx + 2, 0, len(arr))
    return np.array([arr[a:b].mean() if b > a else 0.0 for a, b in zip(lo, hi)])


env = {}
for k, arr in bands.items():
    v = resample(arr)
    norm = np.percentile(v, 99)
    v = np.clip(v / (norm + 1e-9), 0.0, 1.0)
    env[k] = [round(float(x), 3) for x in v]

with open("mv/env.js", "w", encoding="utf-8") as f:
    f.write("// 由 scripts/analysis/build_timeline.py 自动生成，请勿手改\n")
    f.write("window.MV_ENV = ")
    json.dump({"dt": dt, **env}, f)
    f.write(";\n")
print(f"已生成: mv/env.js ({len(env['low'])} 帧)")
