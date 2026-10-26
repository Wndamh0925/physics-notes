# -*- coding: utf-8 -*-
"""生成示例教材图片（占位图）。

产出：content/images/tu1-1.png ~ tu1-3.png
真实图片到位后，直接用同名文件覆盖即可，无需再运行本脚本。

几何 -> JSON 指令（逻辑坐标 y 向上，此处直接换算成 2x 屏幕坐标），
再由 tools/draw_gdi.ps1 用 System.Drawing 渲染（本机装不上 Pillow/matplotlib）。
"""
import json
import math
import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(BASE, 'content', 'images')
TMP = os.path.join(BASE, 'tools', '_tmp')
os.makedirs(OUT, exist_ok=True)
os.makedirs(TMP, exist_ok=True)

S = 2
FONT_CN = 'SimHei'
FONT_NUM = 'Times New Roman'


class Fig:
    def __init__(self, w, h):
        self.w, self.h = w, h
        self.lines, self.texts, self.dots = [], [], []

    def _p(self, x, y):
        return round(x * S, 2), round((self.h - y) * S, 2)

    def line(self, x1, y1, x2, y2, w=2.2):
        a, b = self._p(x1, y1), self._p(x2, y2)
        self.lines.append([a[0], a[1], b[0], b[1], round(w * S, 2)])

    def rect(self, x1, y1, x2, y2, w=2.2):
        self.line(x1, y1, x2, y1, w)
        self.line(x2, y1, x2, y2, w)
        self.line(x2, y2, x1, y2, w)
        self.line(x1, y2, x1, y1, w)

    def arc(self, cx, cy, r, a0, a1, w=2.2, step=2.0):
        n = max(2, int(abs(a1 - a0) / step))
        pts = []
        for i in range(n + 1):
            a = math.radians(a0 + (a1 - a0) * i / n)
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
        for i in range(len(pts) - 1):
            self.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], w)

    def arrow(self, x1, y1, x2, y2, w=2.2, size=10):
        self.line(x1, y1, x2, y2, w)
        ang = math.atan2(y2 - y1, x2 - x1)
        for sg in (+1, -1):
            a = ang + math.pi + sg * math.radians(22)
            self.line(x2, y2, x2 + size * math.cos(a), y2 + size * math.sin(a), w)

    def cross(self, x, y, s=7, w=1.8):
        self.line(x - s, y - s, x + s, y + s, w)
        self.line(x - s, y + s, x + s, y - s, w)

    def crosses(self, x0, y0, x1, y1, step=52, s=6, w=1.6):
        yy = y0
        while yy <= y1:
            xx = x0
            while xx <= x1:
                self.cross(xx, yy, s, w)
                xx += step
            yy += step

    def dot(self, x, y, r=4):
        px, py = self._p(x, y)
        self.dots.append([px, py, round(r * S, 2)])

    def text(self, x, y, s, size=20, font=FONT_CN):
        px, py = self._p(x, y)
        self.texts.append([px, py, s, round(size * S, 2), font, 'mm'])

    def save(self, name):
        p = os.path.join(TMP, name.replace('.png', '.json'))
        with open(p, 'w', encoding='utf-8') as f:
            json.dump(dict(w=self.w, h=self.h, s=S, lines=self.lines,
                           texts=self.texts, dots=self.dots), f, ensure_ascii=True)
        return p


# ---------- 图1-1 磁场对通电导线的作用力 ----------
f = Fig(900, 470)
f.rect(40, 40, 860, 430, 1.4)
f.text(450, 440, '图1-1  磁场对通电导线的作用力', 22)
# 导轨
f.line(150, 150, 620, 150, 3)
f.line(150, 90, 620, 90, 3)
# 竖直导体棒
f.line(380, 90, 380, 150, 5)
# 磁场叉号
f.crosses(180, 190, 600, 340, step=70)
# 电流箭头
f.arrow(380, 130, 380, 175, 2.6, 9)
f.text(408, 160, 'I', 21, FONT_NUM)
# 安培力箭头
f.arrow(380, 120, 540, 120, 2.6, 10)
f.text(570, 122, 'F', 21, FONT_NUM)
f.text(200, 372, 'B（垂直纸面向里）', 19)
f.save('tu1-1.png')

# ---------- 图1-2 洛伦兹力演示 ----------
f = Fig(900, 470)
f.rect(40, 40, 860, 430, 1.4)
f.text(450, 440, '图1-2  电子束在磁场中发生偏转', 22)
f.crosses(120, 110, 780, 360, step=62)
f.dot(120, 235, 5)
f.text(96, 265, 'S', 21, FONT_NUM)
f.arrow(130, 235, 300, 235, 2.4, 9)
f.arc(300, 235, 300, 0, 62, 3.0)
f.arrow(600, 260, 640, 300, 2.6, 9)
f.text(700, 330, 'v', 21, FONT_NUM)
f.text(200, 385, 'B（垂直纸面向里）', 19)
f.save('tu1-2.png')

# ---------- 图1-3 带电粒子在匀强磁场中的圆周运动 ----------
f = Fig(900, 470)
f.rect(40, 40, 860, 430, 1.4)
f.text(450, 440, '图1-3  带电粒子在匀强磁场中的圆周运动', 22)
f.crosses(120, 110, 780, 380, step=64)
f.arc(450, 240, 150, 0, 360, 3.0)
f.dot(450, 240, 4)
f.dot(600, 240, 5)
f.text(600, 205, 'O', 21, FONT_NUM)
f.text(455, 268, 'C', 21, FONT_NUM)
f.line(450, 240, 600, 240, 1.8)
f.text(525, 258, 'r', 20, FONT_NUM)
f.arrow(600, 240, 592, 340, 2.6, 9)
f.text(630, 360, 'v', 21, FONT_NUM)
f.save('tu1-3.png')

print('json ->', TMP)
print('图片应由 tools/draw_gdi.ps1 渲染后复制到', OUT)
