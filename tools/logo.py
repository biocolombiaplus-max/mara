#!/usr/bin/env python3
"""
MARA Originals · Generador del logo vectorial
Crea el logo (letras doradas metálicas + ala azul que se funde en dorado) en SVG y PNG.

Uso: python3 tools/logo.py img/marca
"""
import sys, os
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

OUT = sys.argv[1] if len(sys.argv) > 1 else 'img/marca'
os.makedirs(OUT, exist_ok=True)
FONTS = '/usr/share/fonts/opentype/inter/'


def text_path(font_file, text, size, x, y, stretch=1.0, tracking=0):
    """Convierte texto en un trazado SVG (no depende de fuentes instaladas)."""
    f = TTFont(FONTS + font_file)
    gs = f.getGlyphSet(); cmap = f.getBestCmap(); upm = f['head'].unitsPerEm
    s = size / upm
    d_all, cx = [], 0.0
    for ch in text:
        g = cmap[ord(ch)]
        pen = SVGPathPen(gs)
        tp = TransformPen(pen, (s * stretch, 0, 0, -s, x + cx, y))
        gs[g].draw(tp)
        d_all.append(pen.getCommands())
        cx += gs[g].width * s * stretch + tracking
    width = cx - tracking
    return ' '.join(d_all), width


def build(theme):
    W, H = 1200, 760
    # "MARA": Inter Display Black Italic, ensanchada para el aire deportivo del logo original
    mara_d, mara_w = text_path('InterDisplay-BlackItalic.otf', 'MARA', 300, 0, 0, stretch=1.22, tracking=-6)
    org_d, org_w = text_path('Inter-BoldItalic.otf', 'ORIGINALS', 100, 0, 0, stretch=1.12, tracking=20)
    mx = (W - mara_w) / 2; ox = (W - org_w) / 2
    wing_start = '#1C2B78' if theme == 'light' else '#5B78F0'
    shadow = '' if theme == 'dark' else '<feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#5a4320" flood-opacity=".22"/>'
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">
  <defs>
    <linearGradient id="oro" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#B98A3E"/><stop offset=".28" stop-color="#F4DB9A"/>
      <stop offset=".52" stop-color="#D2A65A"/><stop offset=".78" stop-color="#E9C77E"/><stop offset="1" stop-color="#9E742F"/>
    </linearGradient>
    <linearGradient id="oroH" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#C79A4E"/><stop offset=".5" stop-color="#F2D995"/><stop offset="1" stop-color="#B8893F"/>
    </linearGradient>
    <linearGradient id="ala" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0" stop-color="{wing_start}"/><stop offset=".55" stop-color="{wing_start}"/>
      <stop offset=".72" stop-color="#C9A055"/><stop offset=".88" stop-color="#F5DFA3"/><stop offset="1" stop-color="#B98A3E"/>
    </linearGradient>
    {('<filter id="sombra" x="-10%" y="-10%" width="120%" height="140%">' + shadow + '</filter>') if shadow else ''}
  </defs>
  <g{' filter="url(#sombra)"' if shadow else ''}>
    <path fill="url(#ala)" d="M392 318 C 470 222, 600 192, 742 170 C 820 158, 880 120, 912 52
      C 922 112, 900 168, 852 204 C 818 230, 770 246, 712 250 C 742 236, 768 222, 786 204
      C 700 214, 602 228, 520 252 C 466 268, 424 290, 392 318 Z"/>
    <path fill="url(#oro)" transform="translate({mx:.1f} 610)" d="{mara_d}"/>
    <path fill="url(#oroH)" transform="translate({ox:.1f} 744)" d="{org_d}"/>
  </g>
</svg>'''
    return svg


def main():
    import cairosvg
    from PIL import Image
    import io
    probe = build('light')
    im = Image.open(io.BytesIO(cairosvg.svg2png(bytestring=probe.encode(), output_width=1200))).getchannel('A')
    x0, y0, x1, y1 = im.getbbox(); pad = 14
    vb = f'{x0 - pad} {y0 - pad} {x1 - x0 + 2 * pad} {y1 - y0 + 2 * pad}'
    for theme in ('light', 'dark'):
        svg = build(theme).replace('viewBox="0 0 1200 760" width="1200" height="760"', f'viewBox="{vb}"')
        name = 'logo' if theme == 'light' else 'logo-oscuro'
        open(f'{OUT}/{name}.svg', 'w').write(svg)
        cairosvg.svg2png(bytestring=svg.encode(), write_to=f'{OUT}/{name}.png', output_width=1200)
    # Foto de perfil (cuadrada) en blanco y en azul marino
    for bg, src, nm in ((('#FFFFFF'), 'logo.png', 'perfil-blanco.png'), ('#0D1F5C', 'logo-oscuro.png', 'perfil-azul.png')):
        sq = Image.new('RGB', (1080, 1080), bg); lg = Image.open(f'{OUT}/{src}').convert('RGBA')
        lg = lg.resize((900, int(lg.height * 900 / lg.width)), Image.LANCZOS)
        sq.paste(lg, ((1080 - lg.width) // 2, (1080 - lg.height) // 2 + 20), lg); sq.save(f'{OUT}/{nm}', optimize=True)
    print('ok')


if __name__ == '__main__':
    main()
