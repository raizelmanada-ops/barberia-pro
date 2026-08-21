// ==========================================================================
// BARBERIA_PRO - Base de Datos Oficial de Estilos de Barba
// Arquitectura desacoplada y optimizada para carga ultra rápida y Lazy Loading
// ==========================================================================

export interface BeardStyle {
  id: string;
  name: string;
  category: string;
  categoryKey: 'todas' | 'cortas' | 'medias' | 'largas' | 'perfiladas';
  description: string;
  duration: string;
  maintenance: string;
  thumbnail: string; // Miniatura optimizada para grilla
  image: string;     // Imagen oficial en alta resolución para modal
}

export const BEARD_CATEGORIES = [
  { key: 'todas', label: 'Todas' },
  { key: 'cortas', label: 'Cortas & Stubble' },
  { key: 'medias', label: 'Medias & Boxed' },
  { key: 'largas', label: 'Largas & Garibaldi' },
  { key: 'perfiladas', label: 'Perfiladas & Navaja' },
] as const;

export const OFFICIAL_BEARD_STYLES: BeardStyle[] = [
  {
    id: 'boxed-beard',
    name: 'Barba Boxed',
    category: 'Medias & Boxed',
    categoryKey: 'medias',
    description: 'Estructura geométrica con líneas nítidas en mejillas y base cuadrada definida en la mandíbula.',
    duration: '30–40 min',
    maintenance: '1–2 semanas',
    thumbnail: '/styles/boxed-beard-thumb.webp',
    image: '/styles/boxed-beard.webp',
  },
  {
    id: 'barba-corta-fade',
    name: 'Barba Corta Degradada',
    category: 'Cortas & Stubble',
    categoryKey: 'cortas',
    description: 'Degradado milimétrico desde las patillas conectando suavemente con la densidad del mentón.',
    duration: '25–35 min',
    maintenance: '1 semana',
    thumbnail: '/styles/barba-corta-fade-thumb.webp',
    image: '/styles/barba-corta-fade.webp',
  },
  {
    id: 'barba-tres-dias',
    name: 'Barba de Tres Días',
    category: 'Cortas & Stubble',
    categoryKey: 'cortas',
    description: 'Longitud sutil de 2mm a 4mm con contornos limpios en cuello y pómulos. Aspecto natural y viril.',
    duration: '20–25 min',
    maintenance: '3–5 días',
    thumbnail: '/styles/barba-tres-dias-thumb.webp',
    image: '/styles/barba-tres-dias.webp',
  },
  {
    id: 'barba-perfilada-navaja',
    name: 'Barba Perfilada a Navaja',
    category: 'Perfiladas & Navaja',
    categoryKey: 'perfiladas',
    description: 'Contornos ultra definidos con navaja clásica, toalla caliente e hidratación con bálsamo.',
    duration: '30–40 min',
    maintenance: '1 semana',
    thumbnail: '/styles/barba-perfilada-thumb.webp',
    image: '/styles/barba-perfilada.webp',
  },
  {
    id: 'barba-completa',
    name: 'Barba Completa',
    category: 'Medias & Boxed',
    categoryKey: 'medias',
    description: 'Crecimiento uniforme y denso en toda la zona facial con peinado y volumen equilibrado.',
    duration: '35–45 min',
    maintenance: '2 semanas',
    thumbnail: '/styles/barba-completa-thumb.webp',
    image: '/styles/barba-completa.webp',
  },
  {
    id: 'barba-media-ejecutiva',
    name: 'Barba Media',
    category: 'Medias & Boxed',
    categoryKey: 'medias',
    description: 'Largo medio prolijo con corte a tijera sobre peine para mantener uniformidad en el perfil.',
    duration: '30–40 min',
    maintenance: '1–2 semanas',
    thumbnail: '/styles/barba-media-thumb.webp',
    image: '/styles/barba-media.webp',
  },
  {
    id: 'barba-larga-esculpida',
    name: 'Barba Larga',
    category: 'Largas & Garibaldi',
    categoryKey: 'largas',
    description: 'Longitud prominente con esculpido de puntas y alineación simétrica del mentón.',
    duration: '45–55 min',
    maintenance: '2–3 semanas',
    thumbnail: '/styles/barba-larga-thumb.webp',
    image: '/styles/barba-larga.webp',
  },
  {
    id: 'barba-garibaldi',
    name: 'Barba tipo Garibaldi',
    category: 'Largas & Garibaldi',
    categoryKey: 'largas',
    description: 'Base redondeada y ancha de hasta 15-20cm de largo, combinada con un bigote integrado y limpio.',
    duration: '40–50 min',
    maintenance: '3 semanas',
    thumbnail: '/styles/barba-garibaldi-thumb.webp',
    image: '/styles/barba-garibaldi.webp',
  },
  {
    id: 'barba-van-dyke',
    name: 'Barba tipo Van Dyke',
    category: 'Perfiladas & Navaja',
    categoryKey: 'perfiladas',
    description: 'Combinación clásica de perilla puntiaguda en el mentón y bigote desconectado, con mejillas rasuradas.',
    duration: '30–40 min',
    maintenance: '1 semana',
    thumbnail: '/styles/barba-van-dyke-thumb.webp',
    image: '/styles/barba-van-dyke.webp',
  },
  {
    id: 'barba-balbo',
    name: 'Barba tipo Balbo',
    category: 'Perfiladas & Navaja',
    categoryKey: 'perfiladas',
    description: 'Barba sin patillas con bigote estilizado y parche en el labio inferior conectado al mentón.',
    duration: '35–45 min',
    maintenance: '1–2 semanas',
    thumbnail: '/styles/barba-balbo-thumb.webp',
    image: '/styles/barba-balbo.webp',
  },
  {
    id: 'barba-bigote-marcado',
    name: 'Barba con Bigote Marcado',
    category: 'Perfiladas & Navaja',
    categoryKey: 'perfiladas',
    description: 'Protagonismo total en el bigote con cera estilizadora acompañado de barba corta o media texturizada.',
    duration: '35–45 min',
    maintenance: '1–2 semanas',
    thumbnail: '/styles/barba-bigote-marcado-thumb.webp',
    image: '/styles/barba-bigote-marcado.webp',
  },
  {
    id: 'crop-texturizado-fade-bajo',
    name: 'Crop Texturizado con Fade Bajo',
    category: 'Perfiladas & Navaja',
    categoryKey: 'perfiladas',
    description: 'Diseño integral con vistas frontal, lateral y posterior mostrando transición suave a barba pulida.',
    duration: '45–60 min',
    maintenance: '3–4 semanas',
    thumbnail: '/styles/crop-texturizado-fade-bajo-thumb.webp',
    image: '/styles/crop-texturizado-fade-bajo.webp',
  }
];
