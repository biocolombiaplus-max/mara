import io, sys, segno, cv2, numpy as np
from PIL import Image, ImageDraw, ImageFont

OUT = sys.argv[1]
F = '/usr/share/fonts/opentype/inter/'
NAVY = (13, 31, 92); GOLD = (196, 154, 74); CREAM = (250, 246, 240)

QRS = [
    ('instagram', 'https://www.instagram.com/mara_originals', 'SÍGUENOS EN INSTAGRAM', '@mara_originals'),
    ('whatsapp', 'https://wa.me/573232086370?text=' + 'Hola%20MARA%20Originals%2C%20quiero%20informaci%C3%B3n', 'ESCRÍBENOS POR WHATSAPP', '323 208 6370'),
    ('tiktok', 'https://www.tiktok.com/@maraoriginals', 'SÍGUENOS EN TIKTOK', '@maraoriginals'),
]

def font(name, size): return ImageFont.truetype(F + name, size)

def qr_img(url, px):
    q = segno.make(url, error='q', micro=False)
    buf = io.BytesIO(); q.save(buf, kind='png', scale=40, border=0, dark=NAVY, light=CREAM)
    return Image.open(buf).convert('RGB').resize((px, px), Image.NEAREST)

def text_c(d, y, txt, f, fill, W, spacing=0):
    if spacing:
        widths = [d.textlength(ch, font=f) for ch in txt]
        total = sum(widths) + spacing * (len(txt) - 1); x = (W - total) / 2
        for ch, w in zip(txt, widths): d.text((x, y), ch, font=f, fill=fill); x += w + spacing
    else:
        w = d.textlength(txt, font=f); d.text(((W - w) / 2, y), txt, font=f, fill=fill)

def card(name, url, title, handle):
    W, H = 1200, 1500
    im = Image.new('RGB', (W, H), NAVY); d = ImageDraw.Draw(im)
    # Marco dorado fino
    d.rounded_rectangle((40, 40, W - 40, H - 40), radius=48, outline=GOLD, width=4)
    lg = Image.open('/home/user/mara/img/marca/logo-oscuro.png').convert('RGBA'); lg = lg.resize((460, int(lg.height * 460 / lg.width)), Image.LANCZOS)
    im.paste(lg, ((W - lg.width) // 2, 95), lg)
    # Tarjeta clara con el QR
    box = (200, 400, W - 200, 400 + 800)
    d.rounded_rectangle(box, radius=40, fill=CREAM)
    q = qr_img(url, 680)
    im.paste(q, (W // 2 - 340, 460))
    text_c(d, 1250, title, font('Inter-Bold.otf', 46), GOLD, W, spacing=4)
    text_c(d, 1320, handle, font('Inter-ExtraBold.otf', 64), (255, 255, 255), W)
    im.save(f'{OUT}/qr-{name}.png', optimize=True)
    # QR solo (para imprimir en empaques, etiquetas, etc.)
    solo = Image.new('RGB', (1100, 1100), CREAM); solo.paste(qr_img(url, 1000), (50, 50)); solo.save(f'{OUT}/qr-{name}-solo.png', optimize=True)
    segno.make(url, error='q').save(f'{OUT}/qr-{name}.svg', scale=10, border=2, dark='#0D1F5C', light='#FAF6F0')
    return im

ims = [card(*q) for q in QRS]
# Verificación con un lector de QR
det = cv2.QRCodeDetector()
for (name, url, *_ ) in QRS:
    for suf in ('', '-solo'):
        img = cv2.imread(f'{OUT}/qr-{name}{suf}.png')
        val, *_ = det.detectAndDecode(img)
        print(f'qr-{name}{suf}.png ->', 'OK' if val == url else f'FALLO ({val!r})')
# Hoja con los 3 juntos
sheet = Image.new('RGB', (3 * 1200 + 4 * 60, 1500 + 120), (255, 255, 255))
for i, im in enumerate(ims): sheet.paste(im, (60 + i * 1260, 60))
sheet.save(f'{OUT}/qr-todos.png', optimize=True)
