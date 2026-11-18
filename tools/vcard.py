#!/usr/bin/env python3
"""Genera el contacto de MARA Originals (vCard 3.0) con la foto del logo.
Uso: python3 tools/vcard.py <foto.jpg> enlaces/mara-originals.vcf"""
import base64, sys

photo, out = sys.argv[1], sys.argv[2]
b64 = base64.b64encode(open(photo, 'rb').read()).decode()


def fold(line):
    # Las líneas de vCard se doblan a 75 caracteres (RFC 2425): continuación con un espacio al inicio
    out, first = [], True
    while len(line) > (75 if first else 74):
        n = 75 if first else 74
        out.append(line[:n]); line = line[n:]; first = False
    out.append(line)
    return '\r\n '.join(out)


lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    'N:Originals;MARA;;;',
    'FN:MARA Originals',
    'ORG:MARA Originals',
    'TITLE:Moda y ropa deportiva original para mujer',
    'TEL;TYPE=CELL,VOICE,pref:+57 323 208 6370',
    'URL;TYPE=Instagram:https://www.instagram.com/mara_originals',
    'URL;TYPE=Tarjeta:https://mara-lovat.vercel.app/enlaces/',
    'X-SOCIALPROFILE;TYPE=instagram:https://www.instagram.com/mara_originals',
    'ADR;TYPE=WORK:;;;;;;Colombia',
    'NOTE:Nike · Adidas · Zara · Stradivarius · Jeans. Ropa 100% original para mujer. Envíos a toda Colombia. Escríbenos por WhatsApp.',
    'PHOTO;ENCODING=b;TYPE=JPEG:' + b64,
    'END:VCARD',
]
open(out, 'w', encoding='utf-8', newline='').write('\r\n'.join(fold(l) for l in lines) + '\r\n')
print('ok', len(b64))
