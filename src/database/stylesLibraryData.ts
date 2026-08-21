// ==========================================================================
// BARBERIA_PRO - Biblioteca Visual de Estilos (Cabello & Barba)
// Datos estructurados para navegación rápida, lazy loading y sin datos de terceros
// ==========================================================================

export type StyleDomain = 'cabello' | 'barba';

export interface VisualStyleItem {
  id: string;
  domain: StyleDomain;
  name: string;
  category: string;
  categoryKey: string;
  description: string;
  duration: string;
  maintenance: string;
  thumbnail: string;
  image: string;
  technicalFormula?: string;
  faceShape?: string;
}

export const HAIR_CATEGORIES = [
  { key: 'todas', label: 'Todos los Cortes' },
  { key: 'fades', label: 'Fades & Degradados' },
  { key: 'clasicos', label: 'Clásicos & Tijera' },
  { key: 'urbanos', label: 'Urbanos & Textura' },
  { key: 'ninos', label: 'Niños & Escolar' },
] as const;

export const BEARD_CATEGORIES = [
  { key: 'todas', label: 'Todas las Barbas' },
  { key: 'cortas', label: 'Cortas & Stubble' },
  { key: 'medias', label: 'Medias & Boxed' },
  { key: 'largas', label: 'Largas & Garibaldi' },
  { key: 'perfiladas', label: 'Perfiladas & Navaja' },
] as const;

export const OFFICIAL_STYLES_LIBRARY: VisualStyleItem[] = [
  // -------------------------------------------------------------------------
  // ✂️ ESTILOS DE CABELLO
  // -------------------------------------------------------------------------
  {
    id: 'el-siete-colombiano',
    domain: 'cabello',
    name: 'El Siete Colombiano (Corte Siete)',
    category: 'Fades & Degradados',
    categoryKey: 'fades',
    description: 'Fade lateral en V icónico con contorno limpio a navaja y textura superior desfilada.',
    duration: '40–50 min',
    maintenance: '2–3 semanas',
    thumbnail: '/styles/el-siete-colombiano.jpg',
    image: '/styles/el-siete-colombiano.jpg',
    technicalFormula: 'Laterales en V desde guía 0.5 a 2.5 • Navaja en patilla • Tijera texturizada 3cm arriba',
    faceShape: 'Ideal para rostros ovalados y cuadrados. Estiliza el perfil.',
  },
  {
    id: 'burst-fade-mohicano',
    domain: 'cabello',
    name: 'Burst Fade / Mohicano Moderno',
    category: 'Fades & Degradados',
    categoryKey: 'fades',
    description: 'Degradado semicircular alrededor de la oreja con cresta texturizada desde la coronilla hasta la nuca.',
    duration: '45–55 min',
    maintenance: '2–3 semanas',
    thumbnail: '/styles/burst-fade.jpg',
    image: '/styles/burst-fade.jpg',
    technicalFormula: 'Guías 0 a 1.5 en media luna alrededor de la oreja • Tijera texturizada al centro',
    faceShape: 'Favorece perfiles deportivos y facciones angulares.',
  },
  {
    id: 'crop-texturizado-fade-bajo',
    domain: 'cabello',
    name: 'Crop Texturizado con Fade Bajo',
    category: 'Urbanos & Textura',
    categoryKey: 'urbanos',
    description: 'Flequillo corto desfilado hacia adelante con degradado bajo suave en patillas y nuca.',
    duration: '45–60 min',
    maintenance: '3–4 semanas',
    thumbnail: '/styles/crop-texturizado.jpg',
    image: '/styles/crop-texturizado.jpg',
    technicalFormula: 'Fade bajo 0.5 a 2 • Texturizado de puntas con tijera de entresacar',
    faceShape: 'Excelente para frentes amplias y rostros alargados.',
  },
  {
    id: 'pompadour-clasico-ejecutivo',
    domain: 'cabello',
    name: 'Pompadour Clásico Ejecutivo',
    category: 'Clásicos & Tijera',
    categoryKey: 'clasicos',
    description: 'Peinado con volumen superior peinado hacia atrás con laterales pulidos a tijera sobre peine.',
    duration: '40–50 min',
    maintenance: '3 semanas',
    thumbnail: '/styles/pompadour-clasico.jpg',
    image: '/styles/pompadour-clasico.jpg',
    technicalFormula: 'Tijera sobre peine en laterales • 6 a 8cm en cúspide con secado volumétrico',
    faceShape: 'Aporta altura y estiliza rostros redondos.',
  },
  {
    id: 'taper-fade-natural',
    domain: 'cabello',
    name: 'Taper Fade Natural',
    category: 'Fades & Degradados',
    categoryKey: 'fades',
    description: 'Desvanecido sutil únicamente en patillas y nacimiento de la nuca, conservando la longitud natural.',
    duration: '35–45 min',
    maintenance: '2–3 semanas',
    thumbnail: '/styles/taper-fade.jpg',
    image: '/styles/taper-fade.jpg',
    technicalFormula: 'Taper 0 a 1 en patillas y nuca baja • Conexión a tijera en coronilla',
    faceShape: 'Universal, recomendado para todo tipo de textura y rostro.',
  },
  {
    id: 'skin-fade-raya',
    domain: 'cabello',
    name: 'Skin Fade Pulido con Raya',
    category: 'Fades & Degradados',
    categoryKey: 'fades',
    description: 'Degradado a ras de piel con navaja y trazado de línea divisoria lateral bien definida.',
    duration: '45–55 min',
    maintenance: '1–2 semanas',
    thumbnail: '/styles/skin-fade.jpg',
    image: '/styles/skin-fade.jpg',
    technicalFormula: 'Afeitado a navaja en base 0 • Transición milimétrica a 1.5 • Trazado con trimmer',
    faceShape: 'Acentúa mandíbula y define rasgos fuertes.',
  },
  {
    id: 'corte-infantil-deportivo',
    domain: 'cabello',
    name: 'Corte Infantil Deportivo / Escolar',
    category: 'Niños & Escolar',
    categoryKey: 'ninos',
    description: 'Corte cómodo y fresco con laterales limpios y peinado fácil para niños y jóvenes.',
    duration: '30–40 min',
    maintenance: '3–4 semanas',
    thumbnail: '/styles/corte-ninos.jpg',
    image: '/styles/corte-ninos.jpg',
    technicalFormula: 'Laterales 1.5 a 3 • Tijera arriba para peinado natural con o sin cera',
    faceShape: 'Ideal para normas escolares y vida deportiva.',
  },
  {
    id: 'afro-taper-textura',
    domain: 'cabello',
    name: 'Afro Taper con Esponja',
    category: 'Urbanos & Textura',
    categoryKey: 'urbanos',
    description: 'Rizos afro definidos con técnica de esponja y contornos desvanecidos con navaja en patillas.',
    duration: '40–50 min',
    maintenance: '2–3 semanas',
    thumbnail: '/styles/afro-taper.jpg',
    image: '/styles/afro-taper.jpg',
    technicalFormula: 'Taper fade en sienes y nuca • Definición con crema hidratante y esponja twist',
    faceShape: 'Realza texturas rizadas y facciones marcadas.',
  },

  // -------------------------------------------------------------------------
  // 🧔 ESTILOS DE BARBA
  // -------------------------------------------------------------------------
  {
    id: 'boxed-beard',
    domain: 'barba',
    name: 'Barba Boxed',
    category: 'Medias & Boxed',
    categoryKey: 'medias',
    description: 'Estructura geométrica con líneas nítidas en mejillas y base cuadrada definida en la mandíbula.',
    duration: '30–40 min',
    maintenance: '1–2 semanas',
    thumbnail: '/styles/boxed-beard.jpg',
    image: '/styles/boxed-beard.jpg',
    technicalFormula: 'Contornos a navaja con gel transparente • Esculpido a máquina para base recta',
    faceShape: 'Especialmente recomendada para rostros redondos y ovalados.',
  },
  {
    id: 'barba-corta-fade',
    domain: 'barba',
    name: 'Barba Corta Degradada',
    category: 'Cortas & Stubble',
    categoryKey: 'cortas',
    description: 'Degradado milimétrico desde las patillas conectando suavemente con la densidad del mentón.',
    duration: '25–35 min',
    maintenance: '1 semana',
    thumbnail: '/styles/barba-corta-fade.jpg',
    image: '/styles/barba-corta-fade.jpg',
    technicalFormula: 'Fade 0.5 a 2 en conexión con patilla • Navaja en cuello a 2 dedos de la nuez',
    faceShape: 'Alinea el rostro y brinda un aspecto pulcro y moderno.',
  },
  {
    id: 'barba-tres-dias',
    domain: 'barba',
    name: 'Barba de Tres Días',
    category: 'Cortas & Stubble',
    categoryKey: 'cortas',
    description: 'Longitud sutil de 2mm a 4mm con contornos limpios en cuello y pómulos. Aspecto natural y viril.',
    duration: '20–25 min',
    maintenance: '3–5 días',
    thumbnail: '/styles/barba-tres-dias.jpg',
    image: '/styles/barba-tres-dias.jpg',
    technicalFormula: 'Guía 1 a 1.5 uniforme • Limpieza de contornos superiores con navaja',
    faceShape: 'Sienta bien a todo tipo de rostro.',
  },
  {
    id: 'barba-perfilada-navaja',
    domain: 'barba',
    name: 'Barba Perfilada a Navaja',
    category: 'Perfiladas & Navaja',
    categoryKey: 'perfiladas',
    description: 'Contornos ultra definidos con navaja clásica, toalla caliente e hidratación con bálsamo.',
    duration: '30–40 min',
    maintenance: '1 semana',
    thumbnail: '/styles/barba-perfilada.jpg',
    image: '/styles/barba-perfilada.jpg',
    technicalFormula: 'Ritual toalla caliente • Aceite preafeitado • Navaja en ángulo de 30°',
    faceShape: 'Resalta líneas faciales y elegancia en contornos.',
  },
  {
    id: 'barba-completa',
    domain: 'barba',
    name: 'Barba Completa',
    category: 'Medias & Boxed',
    categoryKey: 'medias',
    description: 'Crecimiento uniforme y denso en toda la zona facial con peinado y volumen equilibrado.',
    duration: '35–45 min',
    maintenance: '2 semanas',
    thumbnail: '/styles/barba-completa.jpg',
    image: '/styles/barba-completa.jpg',
    technicalFormula: 'Peinado con cepillo de cerdas • Recorte de puntas a tijera • Bálsamo estilizador',
    faceShape: 'Ideal para proyectar presencia y densidad.',
  },
  {
    id: 'barba-media-ejecutiva',
    domain: 'barba',
    name: 'Barba Media Ejecutiva',
    category: 'Medias & Boxed',
    categoryKey: 'medias',
    description: 'Largo medio prolijo con corte a tijera sobre peine para mantener uniformidad en el perfil.',
    duration: '30–40 min',
    maintenance: '1–2 semanas',
    thumbnail: '/styles/barba-media.jpg',
    image: '/styles/barba-media.jpg',
    technicalFormula: 'Tijera sobre peine en laterales • Recorte de bigote sobre la línea del labio',
    faceShape: 'Perfecta para ambientes corporativos y formales.',
  },
  {
    id: 'barba-larga-esculpida',
    domain: 'barba',
    name: 'Barba Larga Esculpida',
    category: 'Largas & Garibaldi',
    categoryKey: 'largas',
    description: 'Longitud prominente con esculpido de puntas y alineación simétrica del mentón.',
    duration: '45–55 min',
    maintenance: '2–3 semanas',
    thumbnail: '/styles/barba-larga.jpg',
    image: '/styles/barba-larga.jpg',
    technicalFormula: 'Secado direccionado • Tijera para simetría vertical y horizontal',
    faceShape: 'Añade volumen en mandíbulas estrechas.',
  },
  {
    id: 'barba-garibaldi',
    domain: 'barba',
    name: 'Barba tipo Garibaldi',
    category: 'Largas & Garibaldi',
    categoryKey: 'largas',
    description: 'Base redondeada y ancha de hasta 15-20cm de largo, combinada con un bigote integrado y limpio.',
    duration: '40–50 min',
    maintenance: '3 semanas',
    thumbnail: '/styles/barba-garibaldi.jpg',
    image: '/styles/barba-garibaldi.jpg',
    technicalFormula: 'Base redonda con tijera • Integración natural del bigote',
    faceShape: 'Brinda solidez y estilo rústico pulido.',
  },
  {
    id: 'barba-van-dyke',
    domain: 'barba',
    name: 'Barba tipo Van Dyke',
    category: 'Perfiladas & Navaja',
    categoryKey: 'perfiladas',
    description: 'Combinación clásica de perilla puntiaguda en el mentón y bigote desconectado, con mejillas rasuradas.',
    duration: '30–40 min',
    maintenance: '1 semana',
    thumbnail: '/styles/barba-van-dyke.jpg',
    image: '/styles/barba-van-dyke.jpg',
    technicalFormula: 'Rasurado total en mejillas • Definición en punta con navaja en mentón',
    faceShape: 'Alarga rostros redondos y resalta el mentón.',
  },
  {
    id: 'barba-balbo',
    domain: 'barba',
    name: 'Barba tipo Balbo',
    category: 'Perfiladas & Navaja',
    categoryKey: 'perfiladas',
    description: 'Barba sin patillas con bigote estilizado y parche en el labio inferior conectado al mentón.',
    duration: '35–45 min',
    maintenance: '1–2 semanas',
    thumbnail: '/styles/barba-balbo.jpg',
    image: '/styles/barba-balbo.jpg',
    technicalFormula: 'Afeitado de patillas • Conexión de perilla y bigote recortado',
    faceShape: 'Acentúa mandíbulas definidas y perfiles elegantes.',
  }
];

// Alias para compatibilidad con código existente
export type BeardStyle = VisualStyleItem;
export const OFFICIAL_BEARD_STYLES = OFFICIAL_STYLES_LIBRARY.filter(s => s.domain === 'barba');
export const OFFICIAL_HAIR_STYLES = OFFICIAL_STYLES_LIBRARY.filter(s => s.domain === 'cabello');
