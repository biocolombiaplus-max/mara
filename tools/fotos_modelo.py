#!/usr/bin/env python3
"""
MARA Sport · Generador de fotos con modelo (Gemini "Nano Banana Pro")

Toma las fotos de estudio de un producto y crea fotos profesionales de una
modelo usándolo, pidiéndole a Gemini que NO cambie ninguna característica
de la prenda. Las fotos quedan en <carpeta>/pendientes/ para revisión humana;
solo las que apruebes pasan a la tienda.

Uso:
  # 1) Generar (deja las fotos en img/productos/<slug>/pendientes/)
  python3 tools/fotos_modelo.py generar img/productos/nike-pro-short-3 \
      --prenda "short de compresión Nike Pro de 3 pulgadas, color rosa frambuesa"

  # 2) Aprobar las que te gustaron (las convierte a WebP + miniatura)
  python3 tools/fotos_modelo.py aprobar img/productos/nike-pro-short-3 pendientes/frente.png pendientes/gym.png

Clave: variable de entorno GEMINI_API_KEY (Google AI Studio). En Claude Code
en la nube la clave puede ir como "network secret" del entorno y no hace falta.
"""
import argparse, base64, json, os, ssl, sys, time, urllib.request, urllib.error
from pathlib import Path

API = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
MODELOS = ["gemini-3-pro-image", "gemini-3-pro-image-preview"]

REGLAS = """REGLAS ESTRICTAS DE FIDELIDAD DEL PRODUCTO (lo más importante):
- La prenda de las imágenes de referencia debe aparecer EXACTAMENTE igual: mismo color exacto, mismo tono, misma tela y brillo,
  mismo largo, mismo ancho de pretina, mismas costuras, mismo texto y tipografía en la pretina, mismo logo en el mismo lugar y tamaño.
- No agregues, quites ni muevas logos, textos, bolsillos, cordones, estampados, rayas ni detalles.
- No cambies el corte ni el largo. Si algo de la prenda no se ve en las referencias (por ejemplo la parte de atrás), NO lo muestres.
- La prenda debe ajustarse de forma natural al cuerpo, con arrugas y tensión realistas de una tela elástica.
ESTILO: fotografía de e-commerce de una gran marca deportiva, cámara full-frame, lente 85 mm, luz suave de estudio,
piel con textura real (sin efecto plástico), manos y anatomía correctas, colores fieles, nitidez alta, sin texto ni marcas de agua.
MODELO: mujer latinoamericana adulta, atlética y natural, expresión segura. Prendas complementarias lisas y neutras
(negro o blanco) SIN logos de ninguna marca, para que el protagonista sea el producto."""

TOMAS = {
    "frente": "Foto de cuerpo entero, de frente, la modelo de pie con postura relajada, fondo de estudio color crema claro (#F7F2EF) liso, sombra suave en el piso. Encuadre centrado de la cabeza a los pies.",
    "tres-cuartos": "Foto de 3/4 de perfil, la modelo caminando hacia la cámara, fondo de estudio color crema claro (#F7F2EF), encuadre desde la cabeza hasta las rodillas, mostrando bien el lado del logo.",
    "detalle": "Primer plano desde la cintura hasta la mitad del muslo, de frente, enfocado en la pretina y el logo de la prenda puesta, fondo de estudio crema claro. Las manos no tapan el texto de la pretina ni el logo.",
    "gym": "Foto lifestyle en un gimnasio moderno y luminoso con luz natural, la modelo haciendo una sentadilla con mancuerna o estirando, la prenda claramente visible de frente o de lado. Fondo ligeramente desenfocado.",
    "outdoor": "Foto lifestyle al aire libre en un parque urbano de Bogotá en la mañana, la modelo trotando o caminando con energía, luz dorada suave, la prenda claramente visible. Fondo desenfocado.",
}


def ssl_ctx():
    ca = os.environ.get("SSL_CERT_FILE") or os.environ.get("REQUESTS_CA_BUNDLE")
    if not ca and Path("/root/.ccr/ca-bundle.crt").exists():
        ca = "/root/.ccr/ca-bundle.crt"
    return ssl.create_default_context(cafile=ca) if ca else ssl.create_default_context()


def mime(p):
    return {".png": "image/png", ".webp": "image/webp"}.get(p.suffix.lower(), "image/jpeg")


def llamar(model, partes, aspecto, tamano, clave):
    body = {
        "contents": [{"role": "user", "parts": partes}],
        "generationConfig": {"responseModalities": ["IMAGE"], "imageConfig": {"aspectRatio": aspecto, "imageSize": tamano}},
    }
    req = urllib.request.Request(API.format(model=model), data=json.dumps(body).encode(), method="POST",
                                 headers={"Content-Type": "application/json", "x-goog-api-key": clave})
    with urllib.request.urlopen(req, context=ssl_ctx(), timeout=300) as r:
        return json.load(r)


def generar(args):
    carpeta = Path(args.carpeta)
    refs = [carpeta / r for r in args.referencias] if args.referencias else sorted(
        p for p in carpeta.glob("0*.webp") if not p.stem.endswith("-sm") and "campana" not in p.stem)
    refs = [r for r in refs if r.exists()][:6]
    if not refs:
        sys.exit(f"No encontré fotos de referencia en {carpeta}")
    clave = os.environ.get("GEMINI_API_KEY", "inyectada-por-el-proxy")
    out = carpeta / "pendientes"; out.mkdir(exist_ok=True)
    ref_parts = [{"inline_data": {"mime_type": mime(r), "data": base64.b64encode(r.read_bytes()).decode()}} for r in refs]
    print(f"Referencias: {', '.join(r.name for r in refs)}")
    modelos = [args.modelo] if args.modelo else MODELOS
    for toma in args.tomas:
        for n in range(args.variantes):
            prompt = (f"Las imágenes adjuntas muestran el producto: {args.prenda}. Crea una fotografía profesional de una modelo "
                      f"usando ESTE producto exacto.\n\nTOMA: {TOMAS[toma]}\n\n{REGLAS}"
                      + (f"\n\nINDICACIONES EXTRA: {args.extra}" if args.extra else ""))
            ok = False
            for m in modelos:
                try:
                    res = llamar(m, [{"text": prompt}] + ref_parts, args.aspecto, args.tamano, clave)
                except urllib.error.HTTPError as e:
                    msg = e.read().decode(errors="ignore")[:400]
                    if e.code == 404 and m != modelos[-1]:
                        continue
                    print(f"  ✗ {toma}: error {e.code} con {m}: {msg}"); break
                imgs = [p["inlineData"] for c in res.get("candidates", []) for p in c.get("content", {}).get("parts", []) if "inlineData" in p]
                if not imgs:
                    print(f"  ✗ {toma}: Gemini no devolvió imagen ({json.dumps(res)[:300]})"); break
                ext = ".png" if "png" in imgs[0].get("mimeType", "") else ".jpg"
                dest = out / f"modelo-{toma}{'-' + str(n + 1) if args.variantes > 1 else ''}{ext}"
                dest.write_bytes(base64.b64decode(imgs[0]["data"]))
                print(f"  ✓ {dest}  ({m})"); ok = True; break
            if not ok:
                time.sleep(1)
    print(f"\nRevisa las fotos en {out}/ y aprueba solo las que respeten el producto al 100%.")


def aprobar(args):
    from PIL import Image
    carpeta = Path(args.carpeta)
    for f in args.fotos:
        src = carpeta / f if not Path(f).is_absolute() else Path(f)
        im = Image.open(src).convert("RGB")
        lado = min(im.size); x = (im.width - lado) // 2; y = (im.height - lado) // 2
        im = im.crop((x, y, x + lado, y + lado))  # cuadrado, igual que la galería
        nombre = src.stem.replace("-1", "")
        im.resize((1600, 1600), Image.LANCZOS).save(carpeta / f"{nombre}.webp", "WEBP", quality=88, method=6)
        im.resize((600, 600), Image.LANCZOS).save(carpeta / f"{nombre}-sm.webp", "WEBP", quality=84)
        print(f"  ✓ aprobada: {carpeta / (nombre + '.webp')}")
    print("\nAgrega los nombres (sin .webp) a la lista de fotos del color en js/data.js. "
          "Las fotos 'modelo-*' muestran automáticamente el aviso 'Imagen referencial creada con IA'.")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    g = sub.add_parser("generar"); g.add_argument("carpeta"); g.add_argument("--prenda", required=True)
    g.add_argument("--tomas", nargs="+", default=["frente", "tres-cuartos", "detalle", "gym"], choices=list(TOMAS))
    g.add_argument("--referencias", nargs="*"); g.add_argument("--variantes", type=int, default=1)
    g.add_argument("--aspecto", default="1:1"); g.add_argument("--tamano", default="2K", choices=["1K", "2K", "4K"])
    g.add_argument("--modelo"); g.add_argument("--extra")
    a = sub.add_parser("aprobar"); a.add_argument("carpeta"); a.add_argument("fotos", nargs="+")
    args = ap.parse_args()
    generar(args) if args.cmd == "generar" else aprobar(args)


if __name__ == "__main__":
    main()
