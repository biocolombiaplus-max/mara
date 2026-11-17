# MARA Sport · Tienda online de ropa deportiva femenina multimarca

Prototipo funcional de e-commerce premium para Colombia, **enfocado en la mujer**: leggings, tops y bras, conjuntos, bikers, faldas de pádel, chaquetas y tenis de mujer, con una línea complementaria de hombre. Es HTML, CSS y JavaScript puro: no necesita instalar nada.

## Cómo verla

```bash
python3 -m http.server 8080
```

Luego abre `http://localhost:8080`. También puedes subir la carpeta tal cual a Netlify, Vercel o GitHub Pages.

## Qué incluye

**Enfoque femenino**
- Menú centrado en mujer: Novedades, Mujer, Leggings, Tops, Conjuntos, Tenis, Actividad (Gym, Yoga, Running, Pilates, Pádel, Athleisure); Hombre queda como línea secundaria
- Filtro por tipo de prenda y actividad, tallas XS–XL y tenis 34–40
- Guía de tallas por busto, cintura y cadera + nivel de soporte de tops (bajo, medio, alto)
- Home con "Compra por prenda", promo de conjuntos (cupón `MARAFIT15`) y sección de asesoría de talla por WhatsApp
- Paleta rosa frambuesa, nude y lila

**Experiencia de compra**
- Barra de anuncios rotativa (envío gratis, Addi, cupón de bienvenida)
- Encabezado fijo con mega menú (Hombre, Mujer, Niños, Deportes, Marcas, Outlet) y menú lateral en móvil
- Buscador con sugerencias en vivo, navegación con teclado, búsquedas populares y productos vistos recientemente
- Home: hero en carrusel, accesos rápidos, barra de confianza, categorías, carrusel con pestañas, compra por deporte, banners, flash sale con cuenta regresiva, marcas, reseñas y banda del club
- Catálogo con filtros (género, categoría, deporte, marca, talla, color, precio, outlet, novedades), contadores, chips de filtros activos, 7 ordenamientos y panel de filtros en móvil
- Tarjeta de producto: cambio de color al pasar el mouse, segunda imagen, insignias (-%, Nuevo, Top ventas), favoritos, compra rápida, cuotas Addi
- Ficha de producto: galería con zoom, selector de color y talla (agotadas y últimas unidades), guía de tallas, fecha estimada de entrega por ciudad, recoger en tienda, asesoría por WhatsApp, ficha técnica, reseñas, "combínalo con", similares y barra fija de compra en móvil
- Carrito lateral: barra de progreso hacia el envío gratis, cantidades, ventas adicionales, cupones (`BIENVENIDO10`, `MARAFIT15`, `ENVIOGRATIS`) y ahorro total
- Checkout colombiano: tipo de documento, departamento y ciudad, envío estándar, express o recoger en tienda, y pago con tarjeta, PSE (bancos), Addi, Nequi, Daviplata, Efecty o contraentrega. Incluye validaciones y factura electrónica
- Confirmación del pedido, rastreo, favoritos, tiendas físicas, marcas y PQRS

**Confianza y cumplimiento legal en Colombia**
- Botón de arrepentimiento, derecho de retracto (Ley 1480, art. 47), reversión del pago (art. 51), PQRS, enlace a la SIC
- Autorización de tratamiento de datos (Ley 1581 de 2012), banner de cookies y garantía legal
- *Los textos legales son plantillas: revísalos con un abogado antes de publicar.*

**Marketing y SEO**
- Eventos de e-commerce de GA4 en `dataLayer`: `view_item`, `add_to_cart`, `add_to_wishlist`, `begin_checkout`, `add_payment_info`, `purchase`, `search` y `generate_lead`. Solo hay que pegar Google Tag Manager o el Pixel de Meta en `index.html`
- Datos estructurados schema.org (`Store` y `Product` con rating y precio), Open Graph y meta descripciones
- Popup de bienvenida con 10% OFF para captar correos, newsletter y botón flotante de WhatsApp

## Estructura

```
index.html        Estructura general, header, footer, drawers
css/styles.css    Diseño completo y responsive
js/data.js        Catálogo: marcas, productos, ciudades, tiendas, cupones
js/art.js         Ilustraciones SVG de producto (reemplazables por fotos)
js/app.js         Router, catálogo, ficha, carrito, checkout, búsqueda
```

## Personalizar

- **Productos:** edita `js/data.js`. Para usar fotos reales agrega `img: ['foto-lateral.webp', 'foto-2.webp', ...]` a cada color.
- **WhatsApp:** cambia `573000000000` en `index.html` y en `WHATSAPP` dentro de `js/app.js`.
- **Envío gratis y tarifas:** `FREE_SHIP`, `SHIP_STD` y `SHIP_EXP` en `js/app.js`.
- **Colores de marca:** variables `--accent`, `--ink` y `--volt` en `css/styles.css`.

## Llevarla a producción (vender de verdad)

Este front es un prototipo: el inventario, los pagos y los pedidos están simulados en el navegador. Para operar:

1. **Plataforma:** Shopify (la forma más rápida), VTEX (la que usan los grandes retailers) o WooCommerce. Este diseño se puede portar como tema.
2. **Pasarela de pago:** Wompi (Bancolombia), ePayco, Mercado Pago o PayU para tarjetas, PSE, Nequi y Efecty. Addi se integra como medio de pago adicional.
3. **Logística:** Servientrega, Coordinadora o Interrapidísimo, o agregadores como Mipaquete o Envía.
4. **Facturación electrónica DIAN:** Siigo, Alegra o el módulo de tu plataforma.
5. **Fotos:** fondo gris claro (#F4F4F1), producto de perfil lateral y 4 ángulos, en formato WebP.
