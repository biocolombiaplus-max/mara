/* =========================================================================
   MARA Sport · Catálogo
   Este archivo es el "inventario" de la tienda. Para cargar productos reales
   agrega objetos al arreglo PRODUCTS (o conéctalo a Shopify / WooCommerce /
   VTEX vía API). Cada color acepta `img: ['foto1.webp', ...]` para usar
   fotografías reales en vez de las ilustraciones SVG.
   ========================================================================= */
(function () {
  const BRANDS = [
    { id: 'nike', name: 'Nike' },
    { id: 'adidas', name: 'adidas' },
    { id: 'puma', name: 'PUMA' },
    { id: 'newbalance', name: 'New Balance' },
    { id: 'asics', name: 'ASICS' },
    { id: 'on', name: 'On' },
    { id: 'hoka', name: 'HOKA' },
    { id: 'underarmour', name: 'Under Armour' },
    { id: 'reebok', name: 'Reebok' }
  ];

  const SPORTS = [
    { id: 'training', name: 'Gym', bg: '#e23e7b' },
    { id: 'yoga', name: 'Yoga', bg: '#8b7ad8' },
    { id: 'running', name: 'Running', bg: '#ff6a4d' },
    { id: 'pilates', name: 'Pilates', bg: '#c9a48b' },
    { id: 'padel', name: 'Pádel & Tenis', bg: '#2f8f7a' },
    { id: 'lifestyle', name: 'Athleisure', bg: '#1b1b1d' }
  ];

  // Tipo de prenda (subcategoría)
  const SUBS = [
    { id: 'leggings', name: 'Leggings', cat: 'ropa' },
    { id: 'tops', name: 'Tops y bras', cat: 'ropa' },
    { id: 'conjuntos', name: 'Conjuntos', cat: 'ropa' },
    { id: 'shorts', name: 'Bikers y shorts', cat: 'ropa' },
    { id: 'faldas', name: 'Faldas y skorts', cat: 'ropa' },
    { id: 'camisetas', name: 'Camisetas y esqueletos', cat: 'ropa' },
    { id: 'chaquetas', name: 'Chaquetas y buzos', cat: 'ropa' },
    { id: 'tenis', name: 'Tenis', cat: 'tenis' },
    { id: 'accesorios', name: 'Accesorios', cat: 'accesorios' }
  ];

  const CATS = [
    { id: 'tenis', name: 'Tenis' },
    { id: 'ropa', name: 'Ropa' },
    { id: 'accesorios', name: 'Accesorios' }
  ];

  const SHOE_W = ['34', '35', '36', '37', '38', '39', '40'];
  const SHOE_M = ['38', '39', '40', '41', '42', '43', '44'];
  const APPAREL = ['XS', 'S', 'M', 'L', 'XL'];

  // Paletas de colores (a: capellada, b: talón/refuerzo, c: acento, s: entresuela)
  const C = {
    negro:   { name: 'Negro',        hex: '#111111', a: '#1b1b1d', b: '#2c2c30', c: '#e23e7b', s: '#f2f2f0', lace: '#eee' },
    blanco:  { name: 'Blanco',       hex: '#f4f4f2', a: '#f6f6f4', b: '#dcdcd8', c: '#111111', s: '#ffffff', lace: '#ddd', s2: '#bdbdb8' },
    azul:    { name: 'Azul noche',   hex: '#1c2a4a', a: '#1c2a4a', b: '#0f182c', c: '#3fe0d0', s: '#eef1f6' },
    verde:   { name: 'Verde menta',  hex: '#9fd8c3', a: '#a9d8c6', b: '#7cbba4', c: '#2bd36b', s: '#f3f6f2', lace: '#fff' },
    volt:    { name: 'Volt',         hex: '#d7ff3a', a: '#dcff4a', b: '#b6e01e', c: '#111111', s: '#ffffff', lace: '#111' },
    rosa:    { name: 'Rosa',         hex: '#f6b6c8', a: '#f7c1cf', b: '#ee98b0', c: '#7c3aed', s: '#ffffff' },
    gris:    { name: 'Gris',         hex: '#9a9ea6', a: '#a6aab2', b: '#7c8088', c: '#ff3b3b', s: '#f5f5f5' },
    rojo:    { name: 'Rojo',         hex: '#d7262e', a: '#d7262e', b: '#9e161c', c: '#ffffff', s: '#f6f6f6', lace: '#fff' },
    naranja: { name: 'Naranja',      hex: '#ff6a1f', a: '#ff6a1f', b: '#d24c0b', c: '#1b1b1d', s: '#f8f8f6' },
    beige:   { name: 'Beige',        hex: '#e5d6bd', a: '#e8dac2', b: '#c9b393', c: '#6b4f2e', s: '#f7f1e6', lace: '#fff', s2: '#b48b5c' },
    lila:    { name: 'Lila',         hex: '#b9a6f0', a: '#c2b1f3', b: '#9a84e3', c: '#ffffff', s: '#f7f5ff' },
    oliva:   { name: 'Oliva',        hex: '#5b6b3c', a: '#5b6b3c', b: '#3f4a29', c: '#ff8a3d', s: '#e9e4d6' },
    amarillo:{ name: 'Amarillo',     hex: '#f4e46a', a: '#f2e27c', b: '#d9c64a', c: '#1b1b1d', s: '#fffdf0', lace: '#fff' },
    cielo:   { name: 'Azul cielo',   hex: '#8ec5ff', a: '#9bcbff', b: '#6aa8f0', c: '#ff5a1f', s: '#ffffff', lace: '#fff' },
    vino:    { name: 'Vino',         hex: '#6e1e3a', a: '#6e1e3a', b: '#511329', c: '#f7b2c9', s: '#f6eef0' },
    nude:    { name: 'Nude',         hex: '#e6c3b3', a: '#e8c7b8', b: '#d4a995', c: '#8a4b3a', s: '#fff8f4', lace: '#fff' },
    salvia:  { name: 'Verde salvia', hex: '#a7b8a0', a: '#a9baa2', b: '#8a9d82', c: '#ffffff', s: '#f4f6f2', lace: '#fff' },
    fucsia:  { name: 'Fucsia',       hex: '#e23e7b', a: '#e5467f', b: '#c02a62', c: '#ffffff', s: '#fff5f8', lace: '#fff' },
    coral:   { name: 'Coral',        hex: '#ff8a73', a: '#ff8f79', b: '#ef6a52', c: '#ffffff', s: '#fffaf8', lace: '#fff' },
    frambuesa: { name: 'Rosa frambuesa', hex: '#e5455f', a: '#e5455f', b: '#f06b9a', c: '#ffffff', s: '#fff5f8',
      img: ['modelo-cuerpo-completo', 'modelo-de-cerca', 'modelo-frente', 'modelo-lado', 'modelo-espalda', 'modelo-pretina', 'modelo-detalle-espalda', 'modelo-logo', '01-frontal'].map((f) => `img/productos/nike-pro-short-3/${f}.webp`),
      thumb: ['modelo-cuerpo-completo', 'modelo-de-cerca', 'modelo-frente', 'modelo-lado', 'modelo-espalda', 'modelo-pretina', 'modelo-detalle-espalda', 'modelo-logo', '01-frontal'].map((f) => `img/productos/nike-pro-short-3/${f}-sm.webp`) },
    cacao:   { name: 'Cacao',        hex: '#6b4a3a', a: '#6b4a3a', b: '#52382b', c: '#e6c3b3', s: '#f3ebe5' }
  };

  let n = 0;
  const slugify = (t) => String(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const ART_BY_SUB = { leggings: 'leggings', tops: 'bra', conjuntos: 'set', shorts: 'biker', faldas: 'skort', camisetas: 'tee', chaquetas: 'hoodie', tenis: 'runner', accesorios: 'bag' };

  // Un color puede ser una clave de la paleta ('negro') o un objeto { name, hex, img: [], thumb: [] }
  function colorOf(k) {
    if (typeof k === 'string') return Object.assign({ key: k }, C[k]);
    const hex = k.hex || '#999999';
    const sh = (window.MaraArt && window.MaraArt.shade) || ((h) => h);
    return Object.assign({ key: slugify(k.name || hex), a: hex, b: sh(hex, -28), c: '#ffffff', s: '#f6f6f4', lace: '#fff' }, k);
  }

  function P(o) {
    n++;
    const brand = BRANDS.find(b => b.id === o.brand) || { name: o.brandName || o.brand || 'MARA' };
    const sizes = o.sizes || (o.cat === 'tenis' ? (o.gender === 'hombre' ? SHOE_M : SHOE_W) : o.cat === 'ropa' ? APPAREL : ['Única']);
    // Disponibilidad simulada por talla (determinística) para el catálogo de muestra
    const stock = {};
    sizes.forEach((s, i) => { stock[s] = ((n * 7 + i * 13) % 11 === 0) ? 0 : ((n + i) % 5 === 0 ? 2 : 10); });
    return Object.assign({
      id: 'MS' + String(1000 + n),
      slug: slugify(brand.name + ' ' + o.name) + '-' + (1000 + n),
      sizes, stock, tags: [], specs: {},
      art: ART_BY_SUB[o.sub] || 'runner',
      rating: 4.3 + ((n * 37) % 7) / 10,
      reviews: 18 + (n * 53) % 420,
      createdAt: n
    }, o, { brandName: brand.name, colors: (o.colors || []).map(colorOf) });
  }

    const W = (o) => P(Object.assign({ cat: 'ropa', gender: 'mujer' }, o));
  const WT = (o) => P(Object.assign({ cat: 'tenis', gender: 'mujer', sub: 'tenis' }, o));

  const PRODUCTS = [
    // ================== DESTACADO · FOTOS REALES ==================
    W({ sub: 'shorts', brand: 'nike', brandName: 'Nike', name: 'Short Pro 3" Mujer', sport: 'training', art: 'biker', price: 130000, colors: ['frambuesa'], tags: ['nuevo', 'bestseller'],
        stock: { XS: 0, S: 0, M: 0, L: 1, XL: 0 }, rating: 0, reviews: 0,
        desc: 'El clásico short de compresión Nike Pro, favorito para gym, crossfit, voleibol y running. Tela Dri-FIT elástica que aleja el sudor, pretina ancha con logo jacquard que se queda en su lugar y largo de 3" (7,5 cm) que no se sube al moverte. Producto original y nuevo.',
        specs: { Material: 'Poliéster / elastano · Dri-FIT', Largo: '3" (7,5 cm) de entrepierna', Ajuste: 'Ceñido · compresión', Tiro: 'Medio', Pretina: 'Elástica ancha con logo', Cuidado: 'Lavar en frío, no usar secadora' } }),

    // ================== MUJER · LEGGINGS ==================
    W({ sub: 'leggings', brand: 'nike', brandName: 'Nike', name: 'Leggings One Tiro Alto 7/8', sport: 'training', art: 'leggings', price: 219950, colors: ['negro', 'vino', 'salvia', 'lila'], tags: ['bestseller'],
        desc: 'Suaves, elásticos y 100% opacos. Tiro alto que se queda en su lugar mientras te mueves, con bolsillo oculto en la pretina.', specs: { Material: 'Poliéster / elastano', Tiro: 'Alto', Largo: '7/8', Compresión: 'Media' } }),
    W({ sub: 'leggings', brand: 'nike', brandName: 'Nike', name: 'Leggings Zenvy Sujeción Suave', sport: 'yoga', art: 'leggings', price: 279950, colors: ['nude', 'cacao', 'negro'], tags: ['nuevo', 'bestseller'],
        desc: 'Sensación de segunda piel, tan suaves que olvidarás que los tienes puestos. Ideales para yoga y pilates.', specs: { Material: 'Nylon / elastano', Tiro: 'Alto', Largo: 'Completo', Compresión: 'Suave' } }),
    W({ sub: 'leggings', brand: 'adidas', brandName: 'adidas', name: 'Leggings Optime Power 7/8', sport: 'training', art: 'leggings', price: 239950, compareAt: 289950, colors: ['negro', 'fucsia', 'azul'], tags: ['sale'],
        desc: 'Compresión firme que moldea y sostiene en entrenamientos de alta intensidad. Tecnología AEROREADY.', specs: { Material: 'Poliéster reciclado', Tiro: 'Alto', Largo: '7/8', Compresión: 'Alta' } }),
    W({ sub: 'leggings', brand: 'underarmour', brandName: 'Under Armour', name: 'Leggings Meridian Ultra High', sport: 'pilates', art: 'leggings', price: 259900, colors: ['salvia', 'negro', 'rosa'], tags: ['bestseller'],
        desc: 'Tela ultrasuave con elasticidad en 4 direcciones. Pretina ultra alta que no se enrolla.', specs: { Material: 'Nylon / elastano', Tiro: 'Ultra alto', Largo: 'Tobillo', Compresión: 'Media' } }),
    W({ sub: 'leggings', brand: 'puma', brandName: 'PUMA', name: 'Leggings Studio Foundation', sport: 'yoga', art: 'leggings', price: 169900, compareAt: 209900, colors: ['lila', 'negro', 'coral'], tags: ['sale'],
        desc: 'Comodidad para cada postura. Tejido transpirable dryCELL y pretina ancha.', specs: { Material: 'Poliéster / elastano', Tiro: 'Alto', Largo: '7/8' } }),
    W({ sub: 'leggings', brand: 'newbalance', brandName: 'New Balance', name: 'Leggings Sleek Pocket 25"', sport: 'running', art: 'leggings', price: 249900, colors: ['negro', 'vino'], tags: ['nuevo'],
        desc: 'Bolsillos laterales para tu celular y detalles reflectivos para correr de noche.', specs: { Material: 'Poliéster / elastano', Tiro: 'Alto', Bolsillos: '2 laterales + 1 trasero' } }),

    // ================== MUJER · TOPS Y BRAS ==================
    W({ sub: 'tops', brand: 'adidas', brandName: 'adidas', name: 'Top Powerimpact Soporte Medio', sport: 'training', art: 'bra', price: 179950, colors: ['rosa', 'negro', 'cielo'], tags: ['bestseller'],
        desc: 'Soporte medio con tirantes acolchados y almohadillas removibles. Ideal para gym y cardio.', specs: { Soporte: 'Medio', Material: 'Poliéster reciclado', Copas: 'Removibles' } }),
    W({ sub: 'tops', brand: 'nike', brandName: 'Nike', name: 'Top Swoosh Soporte Medio', sport: 'training', art: 'bra', price: 159950, colors: ['negro', 'fucsia', 'blanco', 'salvia'], tags: ['bestseller'],
        desc: 'El top favorito para entrenar. Banda inferior suave y espalda nadadora para libertad de movimiento.', specs: { Soporte: 'Medio', Material: 'Poliéster / elastano', Espalda: 'Nadadora' } }),
    W({ sub: 'tops', brand: 'underarmour', brandName: 'Under Armour', name: 'Top Infinity Soporte Alto', sport: 'running', art: 'bra', price: 229900, colors: ['negro', 'coral'], tags: ['nuevo'],
        desc: 'Máximo soporte para running y HIIT. Copas moldeadas de una pieza y tirantes ajustables.', specs: { Soporte: 'Alto', Material: 'Poliéster / elastano', Cierre: 'Gancho trasero' } }),
    W({ sub: 'tops', brand: 'puma', brandName: 'PUMA', name: 'Top 4Keeps Bajo Impacto', sport: 'yoga', art: 'bra', price: 119900, compareAt: 149900, colors: ['lila', 'nude', 'negro'], tags: ['sale'],
        desc: 'Soporte ligero y ultracómodo para yoga, pilates o tu día a día.', specs: { Soporte: 'Bajo', Material: 'Poliéster / elastano' } }),
    W({ sub: 'tops', brand: 'reebok', brandName: 'Reebok', name: 'Top Lux Strappy', sport: 'pilates', art: 'bra', price: 149900, colors: ['vino', 'salvia', 'negro'], tags: ['nuevo'],
        desc: 'Tiras cruzadas en la espalda que se ven increíbles dentro y fuera del estudio.', specs: { Soporte: 'Medio', Material: 'Nylon / elastano', Espalda: 'Tiras cruzadas' } }),

    // ================== MUJER · CONJUNTOS ==================
    W({ sub: 'conjuntos', brand: 'puma', brandName: 'PUMA', name: 'Conjunto Studio Seamless Top + Leggings', sport: 'yoga', art: 'set', price: 329900, compareAt: 389900, colors: ['lila', 'nude', 'negro'], tags: ['bestseller', 'sale'],
        desc: 'El conjunto que combina sin pensarlo. Tejido sin costuras que esculpe y acompaña cada movimiento.', specs: { Incluye: 'Top + leggings', Material: 'Nylon / elastano', Tecnología: 'Seamless' } }),
    W({ sub: 'conjuntos', brand: 'adidas', brandName: 'adidas', name: 'Conjunto Yoga Studio', sport: 'yoga', art: 'set', price: 389950, colors: ['salvia', 'cacao'], tags: ['nuevo'],
        desc: 'Top de soporte ligero y leggings de tiro alto en tonos tierra. Hecho con materiales reciclados.', specs: { Incluye: 'Top + leggings', Material: 'Poliéster reciclado' } }),
    W({ sub: 'conjuntos', brand: 'underarmour', brandName: 'Under Armour', name: 'Conjunto Meridian Gym', sport: 'training', art: 'set', price: 449900, colors: ['negro', 'vino', 'fucsia'], tags: ['nuevo', 'bestseller'],
        desc: 'Top de soporte medio y leggings Meridian. El uniforme oficial de tus entrenamientos.', specs: { Incluye: 'Top + leggings', Material: 'Nylon / elastano' } }),

    // ================== MUJER · BIKERS, SHORTS Y FALDAS ==================
    W({ sub: 'shorts', brand: 'nike', brandName: 'Nike', name: 'Biker One 8"', sport: 'training', art: 'biker', price: 149950, colors: ['negro', 'salvia', 'vino'], tags: ['bestseller'],
        desc: 'El biker que no se sube. Tiro alto y tela opaca para squats sin preocupaciones.', specs: { Material: 'Poliéster / elastano', Largo: '8"', Tiro: 'Alto' } }),
    W({ sub: 'shorts', brand: 'underarmour', brandName: 'Under Armour', name: 'Biker Meridian 7"', sport: 'pilates', art: 'biker', price: 139900, compareAt: 169900, colors: ['nude', 'negro'], tags: ['sale'],
        desc: 'Suavidad Meridian en versión biker. Perfecto para pilates y para el día a día.', specs: { Material: 'Nylon / elastano', Largo: '7"' } }),
    W({ sub: 'shorts', brand: 'adidas', brandName: 'adidas', name: 'Short Pacer Running', sport: 'running', art: 'shorts', price: 119950, colors: ['rosa', 'negro', 'cielo'], tags: [],
        desc: 'Ligero, con licra interna y bolsillo para llaves. Hecho para tus kilómetros.', specs: { Material: 'Poliéster reciclado', Largo: '3"' } }),
    W({ sub: 'faldas', brand: 'nike', brandName: 'Nike', name: 'Falda-short Court Dri-FIT', sport: 'padel', art: 'skort', price: 189950, colors: ['blanco', 'negro', 'fucsia'], tags: ['nuevo', 'bestseller'],
        desc: 'Falda plisada con short interno y bolsillo para la pelota. Lista para el pádel y el tenis.', specs: { Material: 'Poliéster Dri-FIT', Short: 'Interno con bolsillo' } }),
    W({ sub: 'faldas', brand: 'puma', brandName: 'PUMA', name: 'Falda Pádel Team', sport: 'padel', art: 'skort', price: 139900, compareAt: 169900, colors: ['cielo', 'blanco'], tags: ['sale'],
        desc: 'Ligera y fresca, con short integrado para moverte con libertad en la cancha.', specs: { Material: 'Poliéster dryCELL' } }),

    // ================== MUJER · CAMISETAS Y ESQUELETOS ==================
    W({ sub: 'camisetas', brand: 'nike', brandName: 'Nike', name: 'Esqueleto One Classic Dri-FIT', sport: 'training', art: 'tank', price: 129950, colors: ['blanco', 'negro', 'lila'], tags: ['bestseller'],
        desc: 'Esqueleto ajustado y suave que absorbe el sudor. Básico infaltable.', specs: { Material: 'Poliéster / elastano', Ajuste: 'Ajustado' } }),
    W({ sub: 'camisetas', brand: 'on', brandName: 'On', name: 'Camiseta Performance-T', sport: 'running', art: 'tee', price: 229990, colors: ['blanco', 'salvia', 'coral'], tags: ['nuevo'],
        desc: 'Ultraligera y de secado rápido, con costuras planas para cero roce.', specs: { Material: 'Poliéster reciclado', Ajuste: 'Slim' } }),
    W({ sub: 'camisetas', brand: 'adidas', brandName: 'adidas', name: 'Esqueleto Train Essentials', sport: 'training', art: 'tank', price: 99950, compareAt: 129950, colors: ['fucsia', 'negro'], tags: ['sale'],
        desc: 'Espalda abierta y tela AEROREADY para entrenar fresca.', specs: { Material: 'Poliéster reciclado', Ajuste: 'Regular' } }),

    // ================== MUJER · CHAQUETAS Y BUZOS ==================
    W({ sub: 'chaquetas', brand: 'nike', brandName: 'Nike', name: 'Chaqueta Swift Running', sport: 'running', art: 'jacket', price: 349950, colors: ['coral', 'negro'], tags: ['nuevo'],
        desc: 'Repele el agua, bloquea el viento y se guarda en su propio bolsillo. Detalles reflectivos.', specs: { Material: 'Poliéster ripstop', Ajuste: 'Regular' } }),
    W({ sub: 'chaquetas', brand: 'newbalance', brandName: 'New Balance', name: 'Buzo Hoodie Essentials', sport: 'lifestyle', art: 'hoodie', price: 289900, colors: ['nude', 'lila', 'salvia'], tags: ['bestseller'],
        desc: 'Ícono de comodidad diaria con logo bordado y capota ajustable. Corte oversize.', specs: { Material: 'Algodón french terry', Ajuste: 'Oversize' } }),
    W({ sub: 'chaquetas', brand: 'adidas', brandName: 'adidas', name: 'Chaqueta Z.N.E. Full-Zip', sport: 'lifestyle', art: 'jacket', price: 399950, compareAt: 469950, colors: ['cacao', 'negro'], tags: ['sale'],
        desc: 'Para antes y después del entreno. Doble capa suave y cremallera completa.', specs: { Material: 'Algodón / poliéster', Ajuste: 'Holgado' } }),

    // ================== MUJER · TENIS ==================
    WT({ brand: 'hoka', brandName: 'HOKA', name: 'Clifton 10', sport: 'running', art: 'runner', price: 749900, colors: ['cielo', 'rosa', 'blanco'], tags: ['nuevo', 'bestseller'],
        desc: 'La amortiguación ligera que ama todo el mundo. Más espuma, menos peso y una transición balanceada.', specs: { Drop: '8 mm', Peso: '230 g (talla 37)', Pisada: 'Neutra', Uso: 'Diario' } }),
    WT({ brand: 'nike', brandName: 'Nike', name: 'Vomero 18', sport: 'running', art: 'runner', price: 759950, colors: ['rosa', 'blanco', 'lila'], tags: ['nuevo'],
        desc: 'La máxima amortiguación de Nike para tus recuperaciones. Doble capa de espuma ZoomX y ReactX.', specs: { Drop: '10 mm', Peso: '265 g', Pisada: 'Neutra', Uso: 'Recuperación' } }),
    WT({ brand: 'asics', brandName: 'ASICS', name: 'Gel-Kayano 31', sport: 'running', art: 'runner', price: 799900, compareAt: 919900, colors: ['lila', 'gris', 'negro'], tags: ['sale'],
        desc: 'Estabilidad que no se siente. Tecnología 4D Guidance System para pisadas pronadoras.', specs: { Drop: '10 mm', Peso: '250 g', Pisada: 'Pronadora', Uso: 'Estabilidad' } }),
    WT({ brand: 'adidas', brandName: 'adidas', name: 'Ultraboost 5', sport: 'running', art: 'runner', price: 899950, compareAt: 1049950, colors: ['blanco', 'rosa', 'negro'], tags: ['sale', 'bestseller'],
        desc: 'Retorno de energía icónico con Light BOOST y capellada Primeknit+ que se adapta a tu pie.', specs: { Drop: '10 mm', Peso: '295 g', Pisada: 'Neutra', Uso: 'Diario / Urbano' } }),
    WT({ brand: 'nike', brandName: 'Nike', name: 'Metcon 10', sport: 'training', art: 'court', price: 699950, colors: ['rosa', 'blanco', 'negro'], tags: ['nuevo'],
        desc: 'Estabilidad para levantar y agilidad para tus clases funcionales. Talón plano y ancho.', specs: { Drop: '4 mm', Uso: 'Gym / Funcional', Suela: 'Goma pegajosa' } }),
    WT({ brand: 'newbalance', brandName: 'New Balance', name: '530', sport: 'lifestyle', art: 'runner', price: 599900, colors: ['blanco', 'nude', 'cielo'], tags: ['bestseller'],
        desc: 'Estética running de los 2000 con amortiguación ABZORB. El sneaker que todas quieren.', specs: { Material: 'Malla / Sintético', Suela: 'Goma', Uso: 'Athleisure' } }),
    WT({ brand: 'adidas', brandName: 'adidas', name: 'Samba OG', sport: 'lifestyle', art: 'court', price: 549950, colors: ['blanco', 'rosa', 'cacao'], tags: ['bestseller', 'nuevo'],
        desc: 'Del campo a la calle. Un clásico atemporal con capellada de cuero suave y suela de goma natural.', specs: { Material: 'Cuero / Gamuza', Suela: 'Goma natural', Uso: 'Athleisure' } }),
    WT({ brand: 'asics', brandName: 'ASICS', name: 'Gel-Resolution X Pádel', sport: 'padel', art: 'court', price: 629900, colors: ['blanco', 'coral'], tags: ['nuevo'],
        desc: 'Estabilidad lateral y suela espiga para canchas de pádel. Gel en talón para absorber impactos.', specs: { Superficie: 'Pádel / Arcilla', Suela: 'Espiga', Uso: 'Pádel' } }),

    // ================== ACCESORIOS ==================
    P({ cat: 'accesorios', sub: 'accesorios', brand: 'nike', brandName: 'Nike', name: 'Gorra Dri-FIT Club', gender: 'mujer', sport: 'running', art: 'cap', price: 119950, colors: ['blanco', 'nude', 'negro'], tags: ['bestseller'],
        desc: 'Visera curva y banda absorbente Dri-FIT. Ajuste trasero regulable.', specs: { Material: 'Poliéster', Ajuste: 'Regulable' } }),
    P({ cat: 'accesorios', sub: 'accesorios', brand: 'adidas', brandName: 'adidas', name: 'Maletín Gym Tote', gender: 'mujer', sport: 'training', art: 'bag', price: 189950, compareAt: 229950, colors: ['rosa', 'negro'], tags: ['sale'],
        desc: 'Compartimento para tenis, bolsillo húmedo y espacio para tu mat. Para el gym y la oficina.', specs: { Capacidad: '30 L', Material: 'Poliéster reciclado' } }),
    P({ cat: 'accesorios', sub: 'accesorios', brand: 'underarmour', brandName: 'Under Armour', name: 'Termo Playmaker 950 ml', gender: 'unisex', sport: 'training', art: 'bottle', price: 99900, colors: ['lila', 'negro', 'salvia'], tags: [],
        desc: 'Acero inoxidable con doble pared: frío 24 h, caliente 12 h.', specs: { Capacidad: '950 ml', Material: 'Acero inoxidable' } }),
    P({ cat: 'accesorios', sub: 'accesorios', brand: 'asics', brandName: 'ASICS', name: 'Medias Run Pack x3', gender: 'unisex', sport: 'running', art: 'socks', price: 69900, colors: ['blanco', 'rosa'], tags: [],
        desc: 'Acolchado en zonas de impacto y tejido que evita ampollas.', specs: { Contenido: '3 pares', Altura: 'Tobillera' } }),

    // ================== HOMBRE (línea complementaria) ==================
    P({ cat: 'tenis', sub: 'tenis', gender: 'hombre', brand: 'nike', brandName: 'Nike', name: 'Pegasus 41', sport: 'running', art: 'runner', price: 649950, colors: ['negro', 'azul'], tags: [],
        desc: 'El caballo de batalla para tus kilómetros diarios. Espuma ReactX y unidades Air.', specs: { Drop: '10 mm', Pisada: 'Neutra' } }),
    P({ cat: 'tenis', sub: 'tenis', gender: 'hombre', brand: 'asics', brandName: 'ASICS', name: 'Novablast 5', sport: 'running', art: 'runner', price: 649950, colors: ['azul', 'gris'], tags: [],
        desc: 'Rebote con cada zancada gracias a la espuma FF Blast Max.', specs: { Drop: '8 mm', Pisada: 'Neutra' } }),
    P({ cat: 'ropa', sub: 'camisetas', gender: 'hombre', brand: 'nike', brandName: 'Nike', name: 'Camiseta Dri-FIT Miler', sport: 'running', art: 'tee', price: 149950, colors: ['negro', 'azul'], tags: [],
        desc: 'Tecnología Dri-FIT que aleja el sudor de tu piel.', specs: { Material: 'Poliéster reciclado', Ajuste: 'Regular' } }),
    P({ cat: 'ropa', sub: 'shorts', gender: 'hombre', brand: 'adidas', brandName: 'adidas', name: 'Pantaloneta Own the Run', sport: 'running', art: 'shorts', price: 139950, compareAt: 169950, colors: ['negro', 'azul'], tags: ['sale'],
        desc: 'Ligera y transpirable con licra interna.', specs: { Material: 'Poliéster', Largo: '5"' } }),
    P({ cat: 'ropa', sub: 'chaquetas', gender: 'hombre', brand: 'underarmour', brandName: 'Under Armour', name: 'Hoodie Rival Fleece', sport: 'training', art: 'hoodie', price: 269900, colors: ['gris', 'negro'], tags: [],
        desc: 'Fleece suave y cálido con interior cepillado.', specs: { Material: '80% algodón / 20% poliéster', Ajuste: 'Holgado' } })
  ];

  const CITIES = {
    'Bogotá D.C.': ['Bogotá'],
    'Antioquia': ['Medellín', 'Envigado', 'Itagüí', 'Bello', 'Rionegro', 'Sabaneta'],
    'Valle del Cauca': ['Cali', 'Palmira', 'Tuluá', 'Buenaventura'],
    'Atlántico': ['Barranquilla', 'Soledad', 'Puerto Colombia'],
    'Bolívar': ['Cartagena', 'Magangué'],
    'Santander': ['Bucaramanga', 'Floridablanca', 'Girón'],
    'Cundinamarca': ['Chía', 'Soacha', 'Zipaquirá', 'Fusagasugá', 'Cajicá'],
    'Risaralda': ['Pereira', 'Dosquebradas'],
    'Caldas': ['Manizales'],
    'Quindío': ['Armenia'],
    'Tolima': ['Ibagué'],
    'Huila': ['Neiva'],
    'Meta': ['Villavicencio'],
    'Casanare': ['Yopal'],
    'Boyacá': ['Tunja', 'Duitama', 'Sogamoso'],
    'Norte de Santander': ['Cúcuta'],
    'Nariño': ['Pasto'],
    'Magdalena': ['Santa Marta'],
    'Córdoba': ['Montería'],
    'Cesar': ['Valledupar']
  };

  const STORES = [
    { city: 'Bogotá', name: 'MARA Andino', addr: 'Cra. 11 #82-71, Local 2-15', hours: 'Lun–Sáb 10:00–21:00 · Dom 11:00–19:00' },
    { city: 'Bogotá', name: 'MARA Santafé', addr: 'Calle 185 #45-03, Local 1-120', hours: 'Lun–Dom 10:00–21:00' },
    { city: 'Medellín', name: 'MARA El Tesoro', addr: 'Cra. 25A #1A Sur-45, Local 3410', hours: 'Lun–Dom 10:00–21:00' },
    { city: 'Cali', name: 'MARA Chipichape', addr: 'Calle 38 Norte #6N-35, Local 210', hours: 'Lun–Dom 10:00–21:00' },
    { city: 'Barranquilla', name: 'MARA Buenavista', addr: 'Calle 98 #52-115, Local 1-45', hours: 'Lun–Dom 10:00–21:00' }
  ];

  const COUPONS = {
    BIENVENIDO10: { type: 'pct', value: 10, label: '10% primera compra' },
    
    ENVIOGRATIS: { type: 'ship', value: 0, label: 'Envío gratis' },
    MARAFIT15: { type: 'pct', value: 15, label: '15% en conjuntos', min: 300000 }
  };

  // Copia del catálogo base (sin cambios del panel) y utilidades para el panel administrativo
  const BASE = JSON.parse(JSON.stringify(PRODUCTS));
  window.MARA_DATA = { BRANDS, SPORTS, SUBS, CATS, PRODUCTS, BASE, CITIES, STORES, COUPONS, PALETTE: C, makeProduct: P, colorOf, slugify, ART_BY_SUB, SIZESETS: { ropa: APPAREL, tenisMujer: SHOE_W, tenisHombre: SHOE_M, unica: ['Única'] } };
})();
