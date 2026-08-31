#!/usr/bin/env python3
"""Generate ZENITH PRO app icons (maskable + rounded) with PIL."""
import math
from PIL import Image, ImageDraw

SIZES = [192, 512, 180]  # 180 = apple-touch-icon

def draw_icon(size):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # Background: rounded square with vertical emerald->cyan gradient
    radius = int(size * 0.22)
    # gradient
    top = (10, 20, 25)
    bot = (5, 8, 14)
    for y in range(size):
        t = y / size
        r = int(top[0] + (bot[0] - top[0]) * t)
        g = int(top[1] + (bot[1] - top[1]) * t)
        b = int(top[2] + (bot[2] - top[2]) * t)
        d.line([(0, y), (size, y)], fill=(r, g, b, 255))
    # rounded mask
    mask = Image.new("L", (size, size), 0)
    md = ImageDraw.Draw(mask)
    md.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=255)
    img.putalpha(mask)

    # outer ring glow
    ring = int(size * 0.035)
    d.rounded_rectangle([ring, ring, size - 1 - ring, size - 1 - ring],
                        radius=int(radius * 0.9), outline=(52, 211, 153, 90), width=ring)

    # lightning bolt (ZENITH zap) centered
    cx, cy = size * 0.5, size * 0.54
    w = size * 0.34
    h = size * 0.52
    pts = [
        (cx + w * 0.18, cy - h * 0.55),
        (cx - w * 0.42, cy + h * 0.12),
        (cx - w * 0.02, cy + h * 0.12),
        (cx - w * 0.18, cy + h * 0.55),
        (cx + w * 0.42, cy - h * 0.12),
        (cx + w * 0.02, cy - h * 0.12),
    ]
    d.polygon(pts, fill=(244, 251, 255, 255))
    # highlight stripe on bolt
    stripe = [
        (pts[0][0] - size * 0.02, pts[0][1] + size * 0.02),
        (cx - w * 0.30, cy - h * 0.02),
        (cx - w * 0.05, cy - h * 0.02),
        (pts[0][0] + size * 0.03, pts[0][1] + size * 0.09),
    ]
    d.polygon(stripe, fill=(130, 235, 190, 255))
    return img

for s in SIZES:
    draw_icon(s).save(f"assets/icon-{s}.png")
    print(f"assets/icon-{s}.png")

# Favicon (compact 64 with transparent bg kept small)
draw_icon(64).save("assets/favicon.png")
print("assets/favicon.png")
print("done")
