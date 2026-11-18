import { isAdmin, hasBlob, saveImage, send } from './_lib.js';

// POST /api/generate → crea una foto con Gemini ("Nano Banana Pro") a partir de las fotos del producto.
// body: { mode: 'estudio' | 'modelo', shot, prenda, images: [{ type, data(base64) }] }
// Requiere la variable GEMINI_API_KEY en Vercel (clave de Google AI Studio con facturación activa).
export const config = { maxDuration: 300 };

const MODELS = (process.env.GEMINI_IMAGE_MODEL ? [process.env.GEMINI_IMAGE_MODEL] : []).concat(['gemini-3-pro-image', 'gemini-3-pro-image-preview']);

const FIDELIDAD = `REGLAS ESTRICTAS DE FIDELIDAD DEL PRODUCTO (lo más importante):
- El producto de las imágenes de referencia debe aparecer EXACTAMENTE igual: mismo color y tono, misma tela y brillo, mismo largo y proporciones,
  mismas costuras, mismo texto y tipografía, mismo logo en el mismo lugar y tamaño.
- No agregues, quites ni muevas logos, textos, bolsillos, cordones, estampados ni detalles. No cambies el corte.
- Si una parte del producto no se ve en las referencias (por ejemplo la espalda), NO la muestres.
- Sin texto, sin marcas de agua, sin bordes.`;

const SHOTS = {
  estudio: {
    frente: 'Foto de producto tipo catálogo de gran marca: el producto solo, extendido y planchado (flat lay) visto de frente desde arriba, centrado, ocupando el 80% del encuadre, sobre fondo de estudio liso color crema claro (#F7F2EF) con sombra suave y natural. Iluminación de estudio suave y uniforme, colores fieles, alta nitidez.',
    angulo: 'Foto de producto tipo catálogo: el producto solo, con una ligera rotación de 8 grados y leve volumen natural de la tela, sobre fondo de estudio liso color crema claro (#F7F2EF), sombra suave. Iluminación de estudio suave.',
    detalle: 'Macro fotografía de producto: acercamiento a la parte con logo o texto más importante del producto (por ejemplo la pretina), mostrando la textura de la tela, sobre fondo crema claro (#F7F2EF). Profundidad de campo suave.'
  },
  modelo: {
    frente: 'Foto de cuerpo entero, de frente, la modelo de pie con postura relajada y segura, fondo de estudio color crema claro (#F7F2EF) liso, sombra suave en el piso.',
    'tres-cuartos': 'Foto de 3/4 de perfil, la modelo caminando hacia la cámara, fondo de estudio crema claro (#F7F2EF), encuadre de la cabeza a las rodillas, mostrando bien el lado del logo.',
    detalle: 'Primer plano de la prenda puesta, encuadre ajustado a la zona del producto, fondo de estudio crema claro. Las manos no tapan textos ni logos.',
    gym: 'Foto lifestyle en un gimnasio moderno y luminoso con luz natural, la modelo entrenando (sentadilla con mancuerna o estiramiento), el producto claramente visible. Fondo desenfocado.',
    outdoor: 'Foto lifestyle al aire libre en un parque urbano de Bogotá en la mañana, la modelo trotando o caminando con energía, luz dorada suave, el producto claramente visible. Fondo desenfocado.'
  }
};
const MODELO = `MODELO: mujer latinoamericana adulta, atlética y natural, piel con textura real (sin efecto plástico), manos y anatomía correctas.
Prendas complementarias lisas y neutras (negro o blanco) SIN logos de ninguna marca. Fotografía de e-commerce de gran marca deportiva, lente 85 mm, luz suave.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Método no permitido' });
  if (!isAdmin(req)) return send(res, 401, { error: 'Clave incorrecta' });
  // Sin Vercel Blob la foto se devuelve directamente (en 1K para no superar el límite de respuesta de Vercel)
  const blob = hasBlob();
  const key = process.env.GEMINI_API_KEY;
  if (!key) return send(res, 503, { error: 'Falta la variable GEMINI_API_KEY en Vercel', code: 'NO_GEMINI' });
  const { mode = 'estudio', shot = 'frente', prenda = '', extra = '', images = [] } = req.body || {};
  const tpl = (SHOTS[mode] || {})[shot];
  if (!tpl) return send(res, 400, { error: 'Toma no válida' });
  if (!images.length) return send(res, 400, { error: 'Sube al menos una foto del producto' });

  const prompt = (mode === 'modelo'
    ? `Las imágenes adjuntas muestran el producto: ${prenda}. Crea una fotografía profesional de una modelo usando ESTE producto exacto.\n\nTOMA: ${tpl}\n\n${MODELO}`
    : `Las imágenes adjuntas son fotos caseras del producto: ${prenda}. Conviértelas en una foto de estudio profesional del MISMO producto.\n\nTOMA: ${tpl}`)
    + `\n\n${FIDELIDAD}` + (extra ? `\n\nINDICACIONES EXTRA: ${String(extra).slice(0, 400)}` : '');

  const parts = [{ text: prompt }].concat(images.slice(0, 6).map((im) => ({
    inline_data: { mime_type: im.type || 'image/jpeg', data: String(im.data).replace(/^data:[^,]+,/, '') }
  })));
  const body = { contents: [{ role: 'user', parts }], generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '1:1', imageSize: blob ? '2K' : '1K' } } };

  let lastErr = '';
  for (const model of MODELS) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, body: JSON.stringify(body)
    });
    const j = await r.json().catch(() => ({}));
    if (r.status === 404) { lastErr = `Modelo ${model} no disponible`; continue; }
    if (!r.ok) {
      const msg = ((j.error && j.error.message) || r.statusText || '').split('\n')[0];
      const friendly = r.status === 429
        ? (/free_tier|billing|plan/i.test(JSON.stringify(j)) ? 'Tu clave de Gemini está en el plan gratis, que no crea imágenes. Activa la facturación del proyecto en Google AI Studio.' : 'Gemini está ocupado o llegaste al límite por minuto. Espera un momento e intenta de nuevo.')
        : r.status === 400 && /API key/i.test(msg) ? 'La clave de Gemini no es válida. Revisa GEMINI_API_KEY en Vercel.'
        : r.status === 403 ? 'La clave de Gemini no tiene permiso para este modelo. Revisa el proyecto en Google AI Studio.'
        : `Gemini respondió: ${msg}`;
      return send(res, r.status, { error: friendly });
    }
    const img = (j.candidates || []).flatMap((c) => (c.content && c.content.parts) || []).find((p) => p.inlineData);
    if (!img) return send(res, 502, { error: 'Gemini no devolvió imagen. Intenta de nuevo o cambia la toma.' });
    const type = img.inlineData.mimeType || 'image/png';
    if (!blob) return send(res, 200, { dataUrl: `data:${type};base64,${img.inlineData.data}`, mode, shot, model });
    const url = await saveImage(`ia/${mode}-${shot}.${type.includes('png') ? 'png' : 'jpg'}`, Buffer.from(img.inlineData.data, 'base64'), type);
    return send(res, 200, { url, mode, shot, model });
  }
  send(res, 502, { error: lastErr || 'No se pudo generar la imagen' });
}
