import sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter
OUT = sys.argv[1]
F = '/usr/share/fonts/opentype/inter/'
NAVY = (13, 31, 92); GOLD = (214, 172, 92); GOLD2 = (168, 124, 52); WHITE = (255, 255, 255)
f = lambda n, s: ImageFont.truetype(F + n, s)

def gold_text(img, xy, txt, font):
    # Texto con degradado dorado metálico
    W, H = img.size
    mask = Image.new('L', (W, H), 0); ImageDraw.Draw(mask).text(xy, txt, font=font, fill=255)
    grad = Image.new('RGB', (W, H)); g = ImageDraw.Draw(grad)
    x0, y0, x1, y1 = ImageDraw.Draw(mask).textbbox(xy, txt, font=font)
    for y in range(H):
        t = min(1, max(0, (y - y0) / max(1, (y1 - y0))))
        c = tuple(int(a + (b - a) * (0.5 - abs(t - 0.45))) for a, b in zip(GOLD2, (250, 220, 150)))
        g.line([(0, y), (W, y)], fill=c)
    img.paste(grad, (0, 0), mask)

def runner(d, ox, oy, s, fill):
    # Silueta minimalista de mujer corriendo (cabeza, cola de caballo, torso, brazos y piernas)
    L = lambda pts, w: d.line([(ox + x * s, oy + y * s) for x, y in pts], fill=fill, width=int(w * s), joint='curve')
    d.ellipse((ox + 52 * s, oy + 0 * s, ox + 74 * s, oy + 22 * s), fill=fill)
    L([(54, 8), (40, 6), (30, 12)], 7)            # cola de caballo
    L([(60, 24), (50, 62)], 12)                    # torso
    L([(58, 30), (76, 44), (88, 36)], 7)           # brazo adelante
    L([(56, 32), (40, 44), (30, 40)], 7)           # brazo atrás
    L([(50, 62), (68, 80), (64, 104)], 9)          # pierna adelante
    L([(50, 62), (34, 82), (14, 86)], 9)           # pierna atrás

def og():
    W, H = 1200, 630
    im = Image.new('RGB', (W, H), NAVY); d = ImageDraw.Draw(im)
    glow = Image.new('L', (W, H), 0); ImageDraw.Draw(glow).ellipse((700, -200, 1400, 500), fill=90)
    im.paste(Image.new('RGB', (W, H), (40, 64, 150)), (0, 0), glow.filter(ImageFilter.GaussianBlur(120)))
    d = ImageDraw.Draw(im)

    lg = Image.open('/home/user/mara/img/marca/logo-oscuro.png').convert('RGBA'); lg = lg.resize((470, int(lg.height * 470 / lg.width)), Image.LANCZOS)
    im.paste(lg, (80, 60), lg)
    d.text((88, 400), 'Moda y ropa deportiva para mujer · 100% original', font=f('Inter-Medium.otf', 30), fill=(210, 216, 235))
    d.rounded_rectangle((88, 470, 560, 548), radius=39, fill=(37, 211, 102))
    d.text((124, 490), 'Escríbenos por WhatsApp', font=f('Inter-Bold.otf', 30), fill=WHITE)
    d.text((600, 492), '@mara_originals', font=f('Inter-Bold.otf', 30), fill=GOLD)
    im.save(f'{OUT}/og.png', optimize=True)

def icon():
    S = 512
    im = Image.new('RGB', (S, S), NAVY)
    gold_text(im, (70, 150), 'M', f('InterDisplay-BlackItalic.otf', 300))
    im.save(f'{OUT}/icono.png', optimize=True)

og(); icon(); print('ok')
