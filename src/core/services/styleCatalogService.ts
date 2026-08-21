// ==========================================================================
// BARBERIA_PRO - Catálogo Visual de Estilos & Portafolio "Mis Trabajos"
// Manejo estructurado de Estilos Oficiales y Trabajos Reales del Barbero
// ==========================================================================

import { BeardStyleItem, BarberWorkItem, StyleCatalogItem } from '../types';

const BEARD_STYLES_STORAGE_PREFIX = 'barberia_beard_styles_';
const BARBER_WORKS_STORAGE_PREFIX = 'barberia_barber_works_';

// ---------------------------------------------------------------------------
// CATÁLOGO OFICIAL DE ESTILOS DE BARBA Y CORTE (Estructura Dinámica)
// Listo para recibir las imágenes oficiales 4:3 en alta definición
// ---------------------------------------------------------------------------
export const INITIAL_BEARD_STYLES: BeardStyleItem[] = [
  {
    id: 'crop-texturizado-fade-bajo',
    nombre: 'CROP TEXTURIZADO CON FADE BAJO',
    tipo: 'Crop Texturizado & Barba Alineada',
    duracion: '45–60 min',
    mantenimiento: '3–4 semanas',
    descripcion: 'Textura superior desfilada con caída natural hacia adelante, degradado bajo milimétrico en patillas y nuca con perfilado de barba preciso a navaja.',
    imagen: '', // Lista para recibir la imagen oficial 4:3
    activo: true,
  },
  {
    id: 'boxed-beard',
    nombre: 'BOXED BEARD',
    tipo: 'Barba Completa Estructurada',
    duracion: '30–40 min',
    mantenimiento: '1–2 semanas',
    descripcion: 'Diseño geométrico limpio con líneas rectas en mejillas y base cuadrada definida. Ideal para acentuar la mandíbula y proyectar elegancia ejecutiva.',
    imagen: '',
    activo: true,
  },
  {
    id: 'short-beard-fade',
    nombre: 'SHORT BEARD CON FADE LATERAL',
    tipo: 'Barba Corta Degradada',
    duracion: '25–35 min',
    mantenimiento: '1–2 semanas',
    descripcion: 'Transición suave desde el fade del cabello hacia la barba, manteniendo densidad en mentón y bigote. Estilo moderno, pulido y de fácil cuidado.',
    imagen: '',
    activo: true,
  },
  {
    id: 'perfilado-italiano-navaja',
    nombre: 'PERFILADO ITALIANO A NAVAJA',
    tipo: 'Perfilado & Ritual Toalla Caliente',
    duracion: '35–45 min',
    mantenimiento: '1 semana',
    descripcion: 'Limpieza total de contornos con navaja clásica, hidratación con aceites esenciales y toalla caliente para una definición impecable sin irritación.',
    imagen: '',
    activo: true,
  },
  {
    id: 'full-beard-sculpted',
    nombre: 'BARBA LARGA ESCULPIDA',
    tipo: 'Barba Larga de Alta Densidad',
    duracion: '45–55 min',
    mantenimiento: '2–3 semanas',
    descripcion: 'Esculpido volumétrico a tijera y máquina para lograr simetría perfecta en barbas largas, eliminando puntas abiertas y ordenando el crecimiento.',
    imagen: '',
    activo: true,
  }
];

// ---------------------------------------------------------------------------
// PORTAFOLIO "MIS TRABAJOS" (Barbero) - Trabajos Reales Realizados
// ---------------------------------------------------------------------------
export const INITIAL_BARBER_WORKS: BarberWorkItem[] = [
  {
    id: 'work_01',
    businessId: 'biz_arizshop_01',
    barberId: 'barber_arizshop_alvaro',
    barberName: 'Álvaro Ortiz',
    fotoUrl: '',
    estiloUtilizado: 'Crop Texturizado Con Fade Bajo',
    fecha: '2026-08-18',
    notasOpcionales: 'Perfilado a navaja con toalla tibia y aceite de argán.',
    createdAt: '2026-08-18T16:00:00Z',
  }
];

export class StyleCatalogService {
  // -------------------------------------------------------------------------
  // 1. ESTILOS DE BARBA (Catálogo Visual Dinámico)
  // -------------------------------------------------------------------------
  public static getBeardStyles(businessId: string): BeardStyleItem[] {
    try {
      const data = localStorage.getItem(`${BEARD_STYLES_STORAGE_PREFIX}${businessId}`);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Error leyendo estilos de barba de storage', e);
    }
    return INITIAL_BEARD_STYLES;
  }

  public static saveBeardStyle(businessId: string, item: BeardStyleItem): void {
    const list = this.getBeardStyles(businessId);
    const index = list.findIndex(s => s.id === item.id);
    let updated: BeardStyleItem[];
    if (index !== -1) {
      updated = [...list];
      updated[index] = item;
    } else {
      updated = [item, ...list];
    }
    this.saveBeardStylesToStorage(businessId, updated);
  }

  public static deleteBeardStyle(businessId: string, styleId: string): void {
    const list = this.getBeardStyles(businessId);
    const updated = list.filter(s => s.id !== styleId);
    this.saveBeardStylesToStorage(businessId, updated);
  }

  public static toggleBeardStyleActive(businessId: string, styleId: string): void {
    const list = this.getBeardStyles(businessId);
    const updated = list.map(s => s.id === styleId ? { ...s, activo: !s.activo } : s);
    this.saveBeardStylesToStorage(businessId, updated);
  }

  public static updateBeardStyleImage(businessId: string, styleId: string, imageUrl: string): void {
    const list = this.getBeardStyles(businessId);
    const updated = list.map(s => s.id === styleId ? { ...s, imagen: imageUrl } : s);
    this.saveBeardStylesToStorage(businessId, updated);
  }

  private static saveBeardStylesToStorage(businessId: string, items: BeardStyleItem[]): void {
    try {
      localStorage.setItem(`${BEARD_STYLES_STORAGE_PREFIX}${businessId}`, JSON.stringify(items));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('barberia:catalog_updated'));
      }
    } catch (e) {
      console.warn('Error guardando estilos de barba en storage', e);
    }
  }

  // -------------------------------------------------------------------------
  // 2. MIS TRABAJOS (Portafolio del Barbero)
  // -------------------------------------------------------------------------
  public static getBarberWorks(businessId: string, barberId?: string): BarberWorkItem[] {
    try {
      const data = localStorage.getItem(`${BARBER_WORKS_STORAGE_PREFIX}${businessId}`);
      let list: BarberWorkItem[] = data ? JSON.parse(data) : INITIAL_BARBER_WORKS;
      if (barberId) {
        list = list.filter(w => w.barberId === barberId);
      }
      return list;
    } catch {
      return INITIAL_BARBER_WORKS;
    }
  }

  public static saveBarberWork(businessId: string, item: BarberWorkItem): void {
    const list = this.getBarberWorks(businessId);
    const index = list.findIndex(w => w.id === item.id);
    let updated: BarberWorkItem[];
    if (index !== -1) {
      updated = [...list];
      updated[index] = item;
    } else {
      updated = [item, ...list];
    }
    try {
      localStorage.setItem(`${BARBER_WORKS_STORAGE_PREFIX}${businessId}`, JSON.stringify(updated));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('barberia:works_updated'));
      }
    } catch (e) {
      console.warn('Error guardando trabajo de barbero en storage', e);
    }
  }

  public static deleteBarberWork(businessId: string, workId: string): void {
    const list = this.getBarberWorks(businessId);
    const updated = list.filter(w => w.id !== workId);
    try {
      localStorage.setItem(`${BARBER_WORKS_STORAGE_PREFIX}${businessId}`, JSON.stringify(updated));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('barberia:works_updated'));
      }
    } catch (e) {
      console.warn('Error eliminando trabajo de barbero en storage', e);
    }
  }

  // -------------------------------------------------------------------------
  // 3. COMPATIBILIDAD CON VISTAS EXISTENTES (Legacy StyleCatalogItem Adapter)
  // -------------------------------------------------------------------------
  public static getStyles(businessId: string): StyleCatalogItem[] {
    const beardStyles = this.getBeardStyles(businessId);
    return beardStyles.map(b => ({
      id: b.id,
      name: b.nombre,
      category: 'barba',
      description: b.descripcion,
      tags: [b.tipo, 'Barba', 'Diseño Oficial'],
      previewOverlayUrl: b.imagen,
      difficultyLevel: 'medio',
      duracion: b.duracion,
      mantenimiento: b.mantenimiento,
      tipo: b.tipo,
    }));
  }

  public static saveStyle(businessId: string, item: StyleCatalogItem): void {
    this.saveBeardStyle(businessId, {
      id: item.id,
      nombre: item.name,
      tipo: item.tipo || item.category || 'Barba & Corte',
      duracion: item.duracion || '30–45 min',
      mantenimiento: item.mantenimiento || '2–3 semanas',
      descripcion: item.description,
      imagen: item.previewOverlayUrl || '',
      activo: true,
    });
  }

  public static updateStylePhoto(businessId: string, styleId: string, photoUrl: string): void {
    this.updateBeardStyleImage(businessId, styleId, photoUrl);
  }

  public static deleteStyle(businessId: string, styleId: string): void {
    this.deleteBeardStyle(businessId, styleId);
  }

  public static resetToDefault(businessId: string): void {
    try {
      localStorage.removeItem(`${BEARD_STYLES_STORAGE_PREFIX}${businessId}`);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('barberia:catalog_updated'));
      }
    } catch (e) {
      console.warn('Error resetting style catalog', e);
    }
  }
}
