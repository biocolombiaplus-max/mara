#!/usr/bin/env python3
"""
MARA Originals · QR premium que lleva a la tarjeta de enlaces.
Genera: tarjeta vertical (imprimir / mostrar en tienda), historia de Instagram,
sticker cuadrado y el QR solo. Verifica que cada uno se lea con un lector real.

Uso: python3 tools/qr_premium.py img/qr
"""
import sys, segno
from PIL import Image, ImageDraw, ImageFont, ImageFilter

OUT = sys.argv[1] if len(sys.argv) > 1 else 'img/qr'
URL = 'https://mara-lovat.vercel.app/enlaces/'
F = '/usr/share/fonts/opentype/inter/'
NAVY = (13, 31, 92); NAVY2 = (22, 44, 120); GOLD = (214, 172, 92); GOLD_L = (244, 219, 154); GOLD_D = (168, 124, 52)
CREAM = (250, 246, 240); WHITE = (255, 255, 255)
LOGO = 'img/marca/logo-premium-fade.webp'
ICON = 'img/marca/icono.png'
f = lambda n, s: ImageFont.truetype(F + n, s)


def gold_fill(size, vertical=True):
    W, H = size; g = Image.new('RGB', size); d = ImageDraw.Draw(g)
    stops = [(0, GOLD_D), (.3, GOLD_L), (.55, GOLD), (.8, (233, 199, 126)), (1, GOLD_D)]
    n = H if vertical else W
    for i in range(n):
        t = i / max(1, n - 1)
        for (a, ca), (b, cb) in zip(stops, stops[1:]):
            if a <= t <= b:
                k = (t - a) / (b - a); c = tuple(int(x + (y - x) * k) for x, y in zip(ca, cb)); break
        (d.line([(0, i), (W, i)], fill=c) if vertical else d.line([(i, 0), (i, H)], fill=c))
    return g


def qr_art(px):
    """QR con puntos redondeados, esquinas doradas y emblema al centro."""
    q = segno.make(URL, error='h')
    m = [list(r) for r in q.matrix]; n = len(m); quiet = 4
    cell = px / (n + 2 * quiet); S = 4  # sobremuestreo para bordes suaves
    big = Image.new('RGB', (px * S, px * S), CREAM); d = ImageDraw.Draw(big)
    c = cell * S
    finders = [(0, 0), (n - 7, 0), (0, n - 7)]
    in_finder = lambda r, k: any(fr <= r < fr + 7 and fc <= k < fc + 7 for fc, fr in finders)
    ctr = n / 2; logo_r = n * 0.13
    for r in range(n):
        for k in range(n):
            if not m[r][k] or in_finder(r, k):
                continue
            if abs(r + .5 - ctr) < logo_r + 1 and abs(k + .5 - ctr) < logo_r + 1:
                continue  # espacio para el emblema (corrección de errores H lo permite)
            x = (k + quiet) * c; y = (r + quiet) * c; pad = c * 0.09
            d.rounded_rectangle((x + pad, y + pad, x + c - pad, y + c - pad), radius=c * 0.42, fill=NAVY)
    gold = gold_fill((px * S, px * S))
    for fc, fr in finders:
        x = (fc + quiet) * c; y = (fr + quiet) * c
        d.rounded_rectangle((x, y, x + 7 * c, y + 7 * c), radius=c * 2.1, fill=NAVY)
        d.rounded_rectangle((x + c, y + c, x + 6 * c, y + 6 * c), radius=c * 1.5, fill=CREAM)
        d.rounded_rectangle((x + 2 * c, y + 2 * c, x + 5 * c, y + 5 * c), radius=c * 0.9, fill=NAVY)
    # Emblema central
    R = (logo_r + .2) * c; cx = cy = (ctr + quiet) * c
    d.ellipse((cx - R - c * .5, cy - R - c * .5, cx + R + c * .5, cy + R + c * .5), fill=CREAM)
    ic = Image.open(ICON).convert('RGB').resize((int(2 * R), int(2 * R)), Image.LANCZOS)
    mk = Image.new('L', ic.size, 0); ImageDraw.Draw(mk).ellipse((0, 0, ic.width - 1, ic.height - 1), fill=255)
    big.paste(ic, (int(cx - R), int(cy - R)), mk)
    ring = Image.new('L', big.size, 0); ImageDraw.Draw(ring).ellipse((cx - R, cy - R, cx + R, cy + R), outline=255, width=int(c * .35))
    big.paste(gold, (0, 0), ring)
    return big.resize((px, px), Image.LANCZOS)


def text_c(d, y, txt, font, fill, W, spacing=0):
    widths = [d.textlength(ch, font=font) for ch in txt]
    total = sum(widths) + spacing * (len(txt) - 1); x = (W - total) / 2
    for ch, w in zip(txt, widths):
        d.text((x, y), ch, font=font, fill=fill); x += w + spacing


def gold_text(im, y, txt, font, spacing=0):
    W = im.width; mask = Image.new('L', im.size, 0); text_c(ImageDraw.Draw(mask), y, txt, font, 255, W, spacing)
    im.paste(gold_fill(im.size), (0, 0), mask)


def background(W, H):
    im = Image.new('RGB', (W, H), NAVY)
    glow = Image.new('L', (W, H), 0); gd = ImageDraw.Draw(glow)
    gd.ellipse((-W * .2, -H * .25, W * 1.2, H * .45), fill=110)
    im.paste(Image.new('RGB', (W, H), NAVY2), (0, 0), glow.filter(ImageFilter.GaussianBlur(W * .12)))
    warm = Image.new('L', (W, H), 0); ImageDraw.Draw(warm).ellipse((W * .15, -H * .12, W * .85, H * .22), fill=60)
    im.paste(Image.new('RGB', (W, H), (120, 96, 70)), (0, 0), warm.filter(ImageFilter.GaussianBlur(W * .1)))
    return im


def frame(im, inset, r):
    W, H = im.size; gold = gold_fill(im.size)
    mk = Image.new('L', im.size, 0); md = ImageDraw.Draw(mk)
    md.rounded_rectangle((inset, inset, W - inset, H - inset), radius=r, outline=255, width=4)
    md.rounded_rectangle((inset + 14, inset + 14, W - inset - 14, H - inset - 14), radius=r - 12, outline=255, width=1)
    im.paste(gold, (0, 0), mk)


def panel_qr(im, x, y, size):
    """Panel crema con borde dorado y el QR adentro."""
    pad = int(size * .07); W = size + 2 * pad
    sh = Image.new('L', im.size, 0); ImageDraw.Draw(sh).rounded_rectangle((x, y + 24, x + W, y + W + 24), radius=48, fill=150)
    im.paste((5, 12, 40), (0, 0), sh.filter(ImageFilter.GaussianBlur(30)))
    mk = Image.new('L', im.size, 0); ImageDraw.Draw(mk).rounded_rectangle((x - 6, y - 6, x + W + 6, y + W + 6), radius=54, fill=255)
    im.paste(gold_fill(im.size), (0, 0), mk)
    ImageDraw.Draw(im).rounded_rectangle((x, y, x + W, y + W), radius=48, fill=CREAM)
    im.paste(qr_art(size), (x + pad, y + pad))
    return y + W


def logo(im, y, width):
    lg = Image.open(LOGO).convert('RGBA'); lg = lg.resize((width, int(lg.height * width / lg.width)), Image.LANCZOS)
    im.paste(lg, ((im.width - width) // 2, y), lg); return y + lg.height


def card(W, H, name, logo_w, qr_px, title_size, top, gap):
    im = background(W, H); frame(im, int(W * .035), int(W * .05)); d = ImageDraw.Draw(im)
    y = logo(im, top, logo_w) + gap
    gold_text(im, y, 'ESCANEA Y CONÓCENOS', f('Inter-ExtraBold.otf', title_size), spacing=title_size * .18)
    y += int(title_size * 1.6)
    text_c(d, y, 'WhatsApp  ·  Instagram  ·  Asesoría de talla', f('Inter-Medium.otf', int(title_size * .55)), (205, 213, 240), W)
    y += int(title_size * 1.5)
    pw = qr_px + 2 * int(qr_px * .07)
    y = panel_qr(im, (W - pw) // 2, y, qr_px) + 64
    text_c(d, y, 'Moda y ropa deportiva para mujer · 100% original', f('Inter-SemiBold.otf', int(title_size * .55)), WHITE, W)
    y += int(title_size * 1.1)
    gold_text(im, y, '@mara_originals   ·   323 208 6370', f('Inter-Bold.otf', int(title_size * .62)))
    im.save(f'{OUT}/{name}.png', optimize=True)
    return im


def verify(path):
    import zxingcpp
    im = Image.open(path)
    for w in (im.width, im.width // 2, im.width // 4):
        sz = (w, int(im.height * w / im.width))
        r = zxingcpp.read_barcodes(im.resize(sz, Image.LANCZOS).convert('RGB'))
        if not r or r[0].text != URL:
            return f'FALLO a {sz}'
    return 'OK'


if __name__ == '__main__':
    card(1200, 1650, 'qr-tarjeta-premium', 760, 560, 46, 30, 6)       # vertical: imprimir / mostrador
    card(1080, 1920, 'qr-historia-instagram', 760, 620, 46, 150, 20)    # historia de Instagram / WhatsApp
    sq = Image.new('RGB', (1200, 1200), CREAM); sq.paste(qr_art(1100), (50, 50)); sq.save(f'{OUT}/qr-tarjeta-sticker.png', optimize=True)
    for n in ('qr-tarjeta-premium', 'qr-historia-instagram', 'qr-tarjeta-sticker'):
        print(n, verify(f'{OUT}/{n}.png'))
