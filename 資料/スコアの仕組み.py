# -*- coding: utf-8 -*-
"""確定版の検証：EMA(経過日数で係数可変) + 時間減衰 + 最高0.7/平均0.3"""

def coef(days):
    if days is None: return 1.0
    if days <= 7:  return 0.2
    if days <= 30: return 0.35
    return 0.5

def decay(days):
    if days <= 90:  return 1.0
    if days <= 180: return 0.9
    if days <= 365: return 0.8
    return 0.65

class Tag:
    def __init__(s,n): s.name=n; s.score=None; s.last=None
    def update(s,v,d):
        gap = None if s.last is None else d-s.last
        c = coef(gap)
        s.score = v if s.score is None else s.score*(1-c)+v*c
        s.last = d

class Topic:
    def __init__(s,n): s.name=n; s.tags={}
    def rec(s,tag,v,d):
        s.tags.setdefault(tag,Tag(tag)).update(v,d)
    def score(s,today):
        vals=[t.score*decay(today-t.last) for t in s.tags.values() if t.score is not None]
        if not vals: return None
        return max(vals)*0.7 + sum(vals)/len(vals)*0.3

def run(title,evs,note=""):
    t=Topic("x"); print("="*56); print(title)
    if note: print("  "+note)
    print("-"*56)
    for d,tag,v in evs:
        t.rec(tag,v,d)
        print(f"{d:>4}日 {tag:<8}{v:>4} → {t.score(d):>5.1f}")
    print()

run("【1】大谷は当たり、イチローは滑る",
    [(0,"大谷翔平",90),(60,"イチロー",40),(120,"大谷翔平",90),(180,"イチロー",40),(240,"大谷翔平",88)],
    "大谷を振り続ける限り、話題は上位に残るか")

run("【2】何を振っても滑る",
    [(0,"大谷翔平",40),(60,"イチロー",35),(120,"甲子園",45),(180,"大谷翔平",30)],
    "ちゃんと沈むか")

run("【3】旬が過ぎる",
    [(0,"大谷翔平",90),(60,"大谷翔平",85),(120,"大谷翔平",40),(180,"大谷翔平",35)])

run("【4】当たりを出したきり放置",
    [(0,"大谷翔平",90),(60,"イチロー",40),(180,"イチロー",35),(300,"甲子園",42),(420,"イチロー",38)],
    "古い当たりが薄れるか")

run("【5】常連・週1来店",
    [(0,"大谷翔平",80),(7,"大谷翔平",85),(14,"大谷翔平",75),(21,"大谷翔平",90),(28,"大谷翔平",70)])

run("【6】タグが5個に増える",
    [(0,"大谷翔平",90),(60,"イチロー",40),(120,"甲子園",50),(180,"阪神",85),(240,"WBC",45)],
    "平準化せず上位が守られるか")

# --- バブル10個の順位が2年でどう動くか ---
print("="*56); print("【7】バブル順位の推移（1人の顧客・2年分）"); print("-"*56)
T={}
def add(n,evs):
    tp=Topic(n)
    for d,tag,v in evs: tp.rec(tag,v,d)
    T[n]=tp

add("天気",   [(d,"天気",v) for d,v in zip(range(0,721,60),[35,40,30,38,35,40,32,36,34,38,30,35,37])])
add("家族",   [(d,"お子さん",v) for d,v in zip(range(0,721,60),[60,65,55,70,60,65,62,68,60,64,66,60,63])])
add("スポーツ",[(0,"大谷翔平",90),(120,"大谷翔平",88),(240,"阪神",85),(360,"大谷翔平",92),(480,"大谷翔平",90),(600,"阪神",86),(720,"大谷翔平",89)])
add("旅行",   [(60,"沖縄",75),(180,"沖縄",80),(300,"京都",70),(540,"沖縄",78)])
add("ペット", [(120,"ミケ",82),(240,"ミケ",85),(420,"ミケ",80),(660,"ミケ",84)])
add("仕事",   [(0,"転職",50),(120,"転職",45),(240,"転職",55),(480,"転職",48)])
add("食",     [(180,"カレー",68),(360,"カレー",72),(600,"ラーメン",65)])
add("暮らし", [(60,"引っ越し",55),(300,"通勤",52),(540,"引っ越し",58)])
add("車",     [(240,"買い替え",45),(600,"買い替え",47)])
add("地元",   [(360,"実家",58)])

for today in (180,360,540,720):
    r=sorted(((n,tp.score(today)) for n,tp in T.items() if tp.score(today)),key=lambda x:-x[1])
    print(f"  {today//30:>2}ヶ月時点: "+" / ".join(f"{n}{s:.0f}" for n,s in r[:6]))
