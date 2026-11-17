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
    { id: 'underarmour', name: 'Under Armour' }
  ];

  const SPORTS = [
    { id: 'running', name: 'Running', bg: '#ff5a1f' },
    { id: 'training', name: 'Training / Gym', bg: '#1f6bff' },
    { id: 'lifestyle', name: 'Lifestyle', bg: '#111' },
    { id: 'futbol', name: 'Fútbol', bg: '#15a34a' },
    { id: 'basketball', name: 'Basketball', bg: '#c2410c' },
    { id: 'outdoor', name: 'Outdoor / Trail', bg: '#4d5b3a' }
  ];

  const CATS = [
    { id: 'tenis', name: 'Tenis' },
    { id: 'ropa', name: 'Ropa' },
    { id: 'accesorios', name: 'Accesorios' }
  ];

  const SHOE_SIZES = ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44'];
  const KID_SIZES = ['28', '29', '30', '31', '32', '33', '34', '35'];
  const APPAREL = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  // Paletas de colores (a: capellada, b: talón/refuerzo, c: acento, s: entresuela)
  const C = {
    negro:   { name: 'Negro',        hex: '#111111', a: '#1b1b1d', b: '#2c2c30', c: '#ff5a1f', s: '#f2f2f0', lace: '#eee' },
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
    cielo:   { name: 'Azul cielo',   hex: '#8ec5ff', a: '#9bcbff', b: '#6aa8f0', c: '#ff5a1f', s: '#ffffff', lace: '#fff' }
  };

  let n = 0;
  function P(o) {
    n++;
    const slug = (o.brandName + ' ' + o.name).toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const brand = BRANDS.find(b => b.id === o.brand);
    const sizes = o.sizes || (o.cat === 'tenis' ? (o.gender === 'ninos' ? KID_SIZES : SHOE_SIZES) : o.cat === 'ropa' ? APPAREL : ['Única']);
    // Disponibilidad simulada por talla (determinística)
    const stock = {};
    sizes.forEach((s, i) => { stock[s] = ((n * 7 + i * 13) % 11 === 0) ? 0 : ((n + i) % 5 === 0 ? 2 : 10); });
    return Object.assign({
      id: 'MS' + String(1000 + n),
      slug: slug + '-' + (1000 + n),
      brandName: brand.name,
      sizes, stock,
      rating: 4.3 + ((n * 37) % 7) / 10,
      reviews: 18 + (n * 53) % 420,
      createdAt: n
    }, o, { brandName: brand.name, colors: o.colors.map(k => Object.assign({ key: k }, C[k])) });
  }

  const T = (o) => P(Object.assign({ cat: 'tenis' }, o));

  const PRODUCTS = [
    // ------------------ TENIS · RUNNING ------------------
    T({ brand: 'nike', brandName: 'Nike', name: 'Pegasus 41', gender: 'hombre', sport: 'running', art: 'runner', price: 649950, colors: ['negro', 'azul', 'volt'], tags: ['bestseller'],
        desc: 'El caballo de batalla para tus kilómetros diarios. Espuma ReactX más reactiva y unidades de aire en antepié y talón para una pisada suave y explosiva.',
        specs: { Drop: '10 mm', Peso: '286 g (talla 42)', Pisada: 'Neutra', Uso: 'Entrenamiento diario' } }),
    T({ brand: 'adidas', brandName: 'adidas', name: 'Adizero Boston 13', gender: 'hombre', sport: 'running', art: 'runner', price: 799950, compareAt: 999950, colors: ['blanco', 'rojo', 'negro'], tags: ['sale'],
        desc: 'Diseñado para series y tiradas largas a ritmo. Lightstrike Pro + varillas EnergyRods para una transición rápida.',
        specs: { Drop: '6,5 mm', Peso: '265 g', Pisada: 'Neutra', Uso: 'Ritmo / Tempo' } }),
    T({ brand: 'asics', brandName: 'ASICS', name: 'Novablast 5', gender: 'hombre', sport: 'running', art: 'runner', price: 649950, colors: ['azul', 'naranja', 'gris'], tags: ['nuevo', 'bestseller'],
        desc: 'Rebote con cada zancada. Espuma FF Blast Max para un retorno de energía divertido y un ajuste cómodo.',
        specs: { Drop: '8 mm', Peso: '255 g', Pisada: 'Neutra', Uso: 'Diario / Ritmos' } }),
    T({ brand: 'on', brandName: 'On', name: 'Cloudmonster 2', gender: 'hombre', sport: 'running', art: 'runner', price: 899990, colors: ['verde', 'negro', 'lila', 'blanco'], tags: ['nuevo'],
        desc: 'Máxima amortiguación CloudTec® con sensación monstruosa. Speedboard para impulsar cada paso.',
        specs: { Drop: '6 mm', Peso: '275 g', Pisada: 'Neutra', Uso: 'Largas distancias' } }),
    T({ brand: 'newbalance', brandName: 'New Balance', name: 'FuelCell Rebel v4', gender: 'hombre', sport: 'running', art: 'runner', price: 739900, colors: ['amarillo', 'cielo', 'negro'], tags: ['bestseller'],
        desc: 'Ligero, rápido y divertido. Espuma FuelCell con base ancha para estabilidad a alta velocidad.',
        specs: { Drop: '6 mm', Peso: '212 g', Pisada: 'Neutra', Uso: 'Velocidad' } }),
    T({ brand: 'hoka', brandName: 'HOKA', name: 'Clifton 10', gender: 'mujer', sport: 'running', art: 'runner', price: 749900, colors: ['cielo', 'rosa', 'blanco'], tags: ['nuevo', 'bestseller'],
        desc: 'La amortiguación ligera que ama todo el mundo. Más espuma, menos peso y una transición balanceada.',
        specs: { Drop: '8 mm', Peso: '230 g (talla 37)', Pisada: 'Neutra', Uso: 'Diario' } }),
    T({ brand: 'nike', brandName: 'Nike', name: 'Vomero 18', gender: 'mujer', sport: 'running', art: 'runner', price: 759950, colors: ['rosa', 'blanco', 'lila'], tags: ['nuevo'],
        desc: 'La máxima amortiguación de Nike para tus recuperaciones. Doble capa de espuma ZoomX y ReactX.',
        specs: { Drop: '10 mm', Peso: '265 g', Pisada: 'Neutra', Uso: 'Recuperación' } }),
    T({ brand: 'asics', brandName: 'ASICS', name: 'Gel-Kayano 31', gender: 'mujer', sport: 'running', art: 'runner', price: 799900, compareAt: 919900, colors: ['lila', 'gris', 'negro'], tags: ['sale'],
        desc: 'Estabilidad que no se siente. Tecnología 4D Guidance System para pisadas pronadoras.',
        specs: { Drop: '10 mm', Peso: '250 g', Pisada: 'Pronadora', Uso: 'Estabilidad' } }),
    T({ brand: 'adidas', brandName: 'adidas', name: 'Ultraboost 5', gender: 'mujer', sport: 'running', art: 'runner', price: 899950, compareAt: 1049950, colors: ['blanco', 'rosa', 'negro'], tags: ['sale', 'bestseller'],
        desc: 'Retorno de energía icónico con Light BOOST y capellada Primeknit+ que se adapta a tu pie.',
        specs: { Drop: '10 mm', Peso: '295 g', Pisada: 'Neutra', Uso: 'Diario / Urbano' } }),
    T({ brand: 'puma', brandName: 'PUMA', name: 'Deviate Nitro 3', gender: 'mujer', sport: 'running', art: 'runner', price: 699900, compareAt: 829900, colors: ['naranja', 'cielo'], tags: ['sale'],
        desc: 'Placa PWRPLATE y espuma NITRO Elite para entrenar como si fuera día de carrera.',
        specs: { Drop: '10 mm', Peso: '248 g', Pisada: 'Neutra', Uso: 'Tempo / Competencia' } }),
    T({ brand: 'hoka', brandName: 'HOKA', name: 'Speedgoat 6', gender: 'hombre', sport: 'outdoor', art: 'runner', price: 819900, colors: ['oliva', 'naranja', 'negro'], tags: ['nuevo'],
        desc: 'El rey del trail. Suela Vibram® Megagrip con tacos de 5 mm para cualquier montaña.',
        specs: { Drop: '4 mm', Peso: '275 g', Terreno: 'Montaña técnica', Suela: 'Vibram® Megagrip' } }),
    T({ brand: 'underarmour', brandName: 'Under Armour', name: 'HOVR Infinite Pro', gender: 'hombre', sport: 'running', art: 'runner', price: 589900, compareAt: 699900, colors: ['gris', 'rojo'], tags: ['sale'],
        desc: 'Amortiguación UA HOVR™ que elimina el impacto y te devuelve energía en cada zancada.',
        specs: { Drop: '8 mm', Peso: '290 g', Pisada: 'Neutra', Uso: 'Diario' } }),

    // ------------------ TENIS · LIFESTYLE / TRAINING ------------------
    T({ brand: 'nike', brandName: 'Nike', name: 'Court Vision Low', gender: 'hombre', sport: 'lifestyle', art: 'court', price: 389950, colors: ['blanco', 'negro'], tags: ['bestseller'],
        desc: 'Estilo de cancha retro que va con todo. Cuero sintético premium y suela de goma de alta tracción.',
        specs: { Material: 'Cuero sintético', Suela: 'Goma', Uso: 'Diario / Urbano' } }),
    T({ brand: 'adidas', brandName: 'adidas', name: 'Samba OG', gender: 'mujer', sport: 'lifestyle', art: 'court', price: 549950, colors: ['blanco', 'negro', 'beige'], tags: ['bestseller', 'nuevo'],
        desc: 'Del campo a la calle. Un clásico atemporal con capellada de cuero suave y suela de goma natural.',
        specs: { Material: 'Cuero / Gamuza', Suela: 'Goma natural', Uso: 'Lifestyle' } }),
    T({ brand: 'newbalance', brandName: 'New Balance', name: '530', gender: 'mujer', sport: 'lifestyle', art: 'runner', price: 599900, colors: ['blanco', 'beige', 'cielo'], tags: ['bestseller'],
        desc: 'Estética running de los 2000 con amortiguación ABZORB. El sneaker que todos quieren.',
        specs: { Material: 'Malla / Sintético', Suela: 'Goma', Uso: 'Lifestyle' } }),
    T({ brand: 'puma', brandName: 'PUMA', name: 'Palermo', gender: 'hombre', sport: 'lifestyle', art: 'court', price: 459900, compareAt: 529900, colors: ['verde', 'rojo', 'beige'], tags: ['sale'],
        desc: 'Inspirado en la cultura de terraza. Gamuza suave y suela de goma tipo gum.',
        specs: { Material: 'Gamuza', Suela: 'Goma', Uso: 'Lifestyle' } }),
    T({ brand: 'nike', brandName: 'Nike', name: 'Metcon 10', gender: 'hombre', sport: 'training', art: 'court', price: 699950, colors: ['negro', 'gris', 'volt'], tags: ['nuevo'],
        desc: 'Estabilidad para levantar pesado y agilidad para tus WODs. Talón plano y ancho, tracción multidireccional.',
        specs: { Drop: '4 mm', Uso: 'Cross training / Pesas', Suela: 'Goma pegajosa' } }),
    T({ brand: 'underarmour', brandName: 'Under Armour', name: 'TriBase Reign 6', gender: 'mujer', sport: 'training', art: 'court', price: 549900, colors: ['rosa', 'negro'], tags: [],
        desc: 'Base TriBase™ que maximiza el contacto con el suelo para levantamientos estables.',
        specs: { Drop: '2 mm', Uso: 'Gimnasio', Suela: 'Goma' } }),
    T({ brand: 'nike', brandName: 'Nike', name: 'LeBron Witness 9', gender: 'hombre', sport: 'basketball', art: 'court', price: 599950, colors: ['rojo', 'negro', 'naranja'], tags: [],
        desc: 'Amortiguación Air Zoom de longitud completa y soporte lateral para dominar la pintura.',
        specs: { Corte: 'Medio', Uso: 'Cancha cubierta / exterior', Amortiguación: 'Air Zoom' } }),
    T({ brand: 'adidas', brandName: 'adidas', name: 'Predator League FG', gender: 'hombre', sport: 'futbol', art: 'cleat', price: 499950, colors: ['negro', 'rojo', 'blanco'], tags: ['bestseller'],
        desc: 'Control preciso del balón con zonas de agarre en la capellada. Suela para césped natural firme.',
        specs: { Superficie: 'Césped natural (FG)', Corte: 'Bajo', Material: 'Sintético' } }),
    T({ brand: 'puma', brandName: 'PUMA', name: 'Future 8 Match', gender: 'hombre', sport: 'futbol', art: 'cleat', price: 469900, compareAt: 559900, colors: ['volt', 'azul'], tags: ['sale'],
        desc: 'Ajuste FUZIONFIT360 para jugadores creativos. Guayo adaptable a césped natural y sintético.',
        specs: { Superficie: 'FG / AG', Corte: 'Medio', Material: 'Knit' } }),

    // ------------------ NIÑOS ------------------
    T({ brand: 'nike', brandName: 'Nike', name: 'Revolution 7 Niños', gender: 'ninos', sport: 'running', art: 'runner', price: 259950, colors: ['cielo', 'rosa', 'negro'], tags: ['bestseller'],
        desc: 'Comodidad y libertad para correr, saltar y jugar todo el día. Fácil de poner y quitar.',
        specs: { Cierre: 'Cordones elásticos', Uso: 'Colegio / Juego' } }),
    T({ brand: 'adidas', brandName: 'adidas', name: 'Grand Court Niños', gender: 'ninos', sport: 'lifestyle', art: 'court', price: 219950, compareAt: 269950, colors: ['blanco', 'lila'], tags: ['sale'],
        desc: 'Estilo de cancha con cierre de velcro para que se los pongan solos.',
        specs: { Cierre: 'Velcro', Uso: 'Diario' } }),

    // ------------------ ROPA ------------------
    P({ cat: 'ropa', brand: 'nike', brandName: 'Nike', name: 'Camiseta Dri-FIT Miler', gender: 'hombre', sport: 'running', art: 'tee', price: 149950, colors: ['negro', 'naranja', 'azul'], tags: ['bestseller'],
        desc: 'Tecnología Dri-FIT que aleja el sudor de tu piel para que te mantengas fresco y seco.', specs: { Material: '100% poliéster reciclado', Ajuste: 'Regular' } }),
    P({ cat: 'ropa', brand: 'adidas', brandName: 'adidas', name: 'Pantaloneta Own the Run', gender: 'hombre', sport: 'running', art: 'shorts', price: 139950, compareAt: 169950, colors: ['negro', 'azul'], tags: ['sale'],
        desc: 'Ligera y transpirable con licra interna y bolsillo para llaves.', specs: { Material: 'Poliéster', Largo: '5"' } }),
    P({ cat: 'ropa', brand: 'underarmour', brandName: 'Under Armour', name: 'Hoodie Rival Fleece', gender: 'hombre', sport: 'training', art: 'hoodie', price: 269900, colors: ['gris', 'negro', 'oliva'], tags: [],
        desc: 'Fleece suave y cálido con interior cepillado. Perfecto para antes y después del entreno.', specs: { Material: '80% algodón / 20% poliéster', Ajuste: 'Holgado' } }),
    P({ cat: 'ropa', brand: 'puma', brandName: 'PUMA', name: 'Chaqueta Rompevientos Run', gender: 'unisex', sport: 'running', art: 'jacket', price: 299900, compareAt: 359900, colors: ['volt', 'negro'], tags: ['sale', 'nuevo'],
        desc: 'Repele el agua y bloquea el viento. Detalles reflectivos para correr de noche.', specs: { Material: 'Poliéster ripstop', Ajuste: 'Regular' } }),
    P({ cat: 'ropa', brand: 'nike', brandName: 'Nike', name: 'Leggings One Tiro Alto', gender: 'mujer', sport: 'training', art: 'leggings', price: 219950, colors: ['negro', 'lila', 'oliva'], tags: ['bestseller'],
        desc: 'Suaves, elásticos y opacos. Tiro alto que se queda en su sitio mientras te mueves.', specs: { Material: 'Poliéster / elastano', Tiro: 'Alto' } }),
    P({ cat: 'ropa', brand: 'adidas', brandName: 'adidas', name: 'Top Deportivo Powerimpact', gender: 'mujer', sport: 'training', art: 'bra', price: 179950, colors: ['rosa', 'negro', 'cielo'], tags: ['nuevo'],
        desc: 'Soporte medio con tirantes acolchados y tecnología AEROREADY.', specs: { Soporte: 'Medio', Material: 'Poliéster reciclado' } }),
    P({ cat: 'ropa', brand: 'on', brandName: 'On', name: 'Camiseta Performance-T', gender: 'mujer', sport: 'running', art: 'tee', price: 229990, colors: ['blanco', 'verde'], tags: ['nuevo'],
        desc: 'Ultraligera y de secado rápido, con costuras planas para cero roce.', specs: { Material: 'Poliéster reciclado', Ajuste: 'Slim' } }),
    P({ cat: 'ropa', brand: 'newbalance', brandName: 'New Balance', name: 'Hoodie Essentials', gender: 'mujer', sport: 'lifestyle', art: 'hoodie', price: 289900, colors: ['beige', 'lila'], tags: [],
        desc: 'Ícono de comodidad diaria con logo bordado y capota ajustable.', specs: { Material: 'Algodón french terry', Ajuste: 'Oversize' } }),

    // ------------------ ACCESORIOS ------------------
    P({ cat: 'accesorios', brand: 'nike', brandName: 'Nike', name: 'Gorra Dri-FIT Club', gender: 'unisex', sport: 'running', art: 'cap', price: 119950, colors: ['negro', 'blanco', 'beige'], tags: ['bestseller'],
        desc: 'Visera curva y banda absorbente Dri-FIT. Ajuste trasero regulable.', specs: { Material: 'Poliéster', Ajuste: 'Regulable' } }),
    P({ cat: 'accesorios', brand: 'adidas', brandName: 'adidas', name: 'Maletín Duffel Essentials M', gender: 'unisex', sport: 'training', art: 'bag', price: 189950, compareAt: 229950, colors: ['negro', 'azul'], tags: ['sale'],
        desc: 'Compartimento para zapatos, correa acolchada y 39 L de capacidad.', specs: { Capacidad: '39 L', Material: 'Poliéster reciclado' } }),
    P({ cat: 'accesorios', brand: 'underarmour', brandName: 'Under Armour', name: 'Termo Playmaker 950 ml', gender: 'unisex', sport: 'training', art: 'bottle', price: 99900, colors: ['negro', 'rojo', 'cielo'], tags: [],
        desc: 'Acero inoxidable con doble pared: frío 24 h, caliente 12 h.', specs: { Capacidad: '950 ml', Material: 'Acero inoxidable' } }),
    P({ cat: 'accesorios', brand: 'asics', brandName: 'ASICS', name: 'Medias Run Pack x3', gender: 'unisex', sport: 'running', art: 'socks', price: 69900, colors: ['blanco', 'negro'], tags: [],
        desc: 'Acolchado en zonas de impacto y tejido que evita ampollas.', specs: { Contenido: '3 pares', Altura: 'Tobillera' } })
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
    RUNNER15: { type: 'pct', value: 15, label: '15% en running', min: 500000 },
    ENVIOGRATIS: { type: 'ship', value: 0, label: 'Envío gratis' }
  };

  window.MARA_DATA = { BRANDS, SPORTS, CATS, PRODUCTS, CITIES, STORES, COUPONS, PALETTE: C };
})();
