// ==========================================================================
// BARBERIA_PRO - Client CRM, Style Memory & Technical Card Repository
// Multi-Tenant — uses Supabase appointments + hair_style_memories
// localStorage fallback for offline / pre-migration data
// ==========================================================================

import { ClientVisitRecord, StyleMemory } from '../types';
import { INITIAL_STYLE_MEMORIES } from '../../database/mockData';
import { supabase, isSupabaseConfigured } from '../supabase/supabaseClient';

const VISITS_STORAGE_PREFIX = 'barberia_client_visits_';
const MEMORIES_STORAGE_PREFIX = 'barberia_style_memories_';

export interface ClientProfileDetail {
  phone: string;
  fullName: string;
  totalVisits: number;
  totalSpentCOP: number;
  lastVisitDate: string;
  lastBarberName: string;
  styleMemory?: StyleMemory;
  visits: ClientVisitRecord[];
}

// ---------------------------------------------------------------------------
// Local helpers
// ---------------------------------------------------------------------------
function localGetVisits(businessId: string): ClientVisitRecord[] {
  try {
    const data = localStorage.getItem(`${VISITS_STORAGE_PREFIX}${businessId}`);
    if (data) return JSON.parse(data);
  } catch { /* ignore */ }
  return [];
}

function localSaveVisits(businessId: string, visits: ClientVisitRecord[]): void {
  try { localStorage.setItem(`${VISITS_STORAGE_PREFIX}${businessId}`, JSON.stringify(visits)); } catch { /* ignore */ }
}

function localGetMemories(businessId: string): StyleMemory[] {
  try {
    const data = localStorage.getItem(`${MEMORIES_STORAGE_PREFIX}${businessId}`);
    if (data) return JSON.parse(data);
  } catch { /* ignore */ }
  return INITIAL_STYLE_MEMORIES.filter(m => m.businessId === businessId);
}

function localSaveMemories(businessId: string, memories: StyleMemory[]): void {
  try { localStorage.setItem(`${MEMORIES_STORAGE_PREFIX}${businessId}`, JSON.stringify(memories)); } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
// Supabase row → StyleMemory mapper
// ---------------------------------------------------------------------------
function mapMemoryFromDb(row: any): StyleMemory {
  return {
    id: row.id,
    businessId: row.business_id,
    clientId: row.client_id,
    barberId: row.barber_id,
    appointmentId: row.appointment_id,
    photoUrl: row.photo_url,
    likedAspects: row.liked_aspects || [],
    keepAspects: row.keep_aspects || [],
    changeAspects: row.change_aspects || [],
    technicalFormula: row.technical_formula,
    consentPhotoGranted: row.consent_photo_granted,
    createdAt: row.created_at,
  };
}

export class ClientHistoryService {
  // -------------------------------------------------------------------------
  // GET VISITS (sync local + async Supabase appointments)
  // -------------------------------------------------------------------------
  public static getVisits(businessId: string): ClientVisitRecord[] {
    return localGetVisits(businessId);
  }

  public static async getVisitsAsync(businessId: string): Promise<ClientVisitRecord[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select('*')
          .eq('business_id', businessId)
          .eq('status', 'completed')
          .order('date', { ascending: false });
        if (!error && data) {
          // Map appointments → ClientVisitRecord shape
          const visits: ClientVisitRecord[] = data.map((row: any) => ({
            id: row.id,
            businessId: row.business_id,
            clientId: row.client_id,
            clientName: row.client_name,
            clientPhone: row.client_phone,
            barberName: row.barber_name,
            date: row.date,
            serviceName: row.service_name,
            styleName: row.service_name,
            priceCOP: row.price_cop,
            paymentMethod: 'cash' as const,
            ticketId: row.id,
            createdAt: row.created_at,
          }));

          // Merge with local (local may have walk-ins not in appointments)
          const local = localGetVisits(businessId);
          const cloudIds = new Set(visits.map(v => v.id));
          const localOnly = local.filter(v => !cloudIds.has(v.id));
          const merged = [...visits, ...localOnly];
          localSaveVisits(businessId, merged);
          return merged;
        }
      } catch { /* fallback */ }
    }
    return localGetVisits(businessId);
  }

  // -------------------------------------------------------------------------
  // GET STYLE MEMORIES
  // -------------------------------------------------------------------------
  public static getStyleMemories(businessId: string): StyleMemory[] {
    return localGetMemories(businessId);
  }

  public static async getStyleMemoriesAsync(businessId: string): Promise<StyleMemory[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('hair_style_memories')
          .select('*')
          .eq('business_id', businessId)
          .order('created_at', { ascending: false });
        if (!error && data) {
          const memories = data.map(mapMemoryFromDb);
          localSaveMemories(businessId, memories);
          return memories;
        }
      } catch { /* fallback */ }
    }
    return localGetMemories(businessId);
  }

  // -------------------------------------------------------------------------
  // RECORD VISIT
  // -------------------------------------------------------------------------
  public static recordVisit(
    businessId: string,
    visit: Omit<ClientVisitRecord, 'id' | 'createdAt'>
  ): ClientVisitRecord {
    const newVisit: ClientVisitRecord = {
      ...visit,
      id: `visit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString()
    };

    const visits = localGetVisits(businessId);
    localSaveVisits(businessId, [newVisit, ...visits]);

    if (visit.styleName || visit.technicalNotes || visit.likedAspects || visit.adjustmentNextTime) {
      this.upsertStyleMemory(businessId, {
        clientId: visit.clientId || visit.clientPhone,
        barberId: 'barber_arizshop_alvaro',
        appointmentId: visit.ticketId || newVisit.id,
        photoUrl: visit.stylePhotoUrl || '/styles/el-siete-colombiano.jpg',
        likedAspects: visit.likedAspects || ['Degradado lateral limpio'],
        keepAspects: ['Volumen superior'],
        changeAspects: visit.adjustmentNextTime ? [visit.adjustmentNextTime] : ['Mantener corte regular'],
        technicalFormula: visit.technicalNotes || 'Degradado progresivo con guía 0 a 2 y tijera arriba',
        consentPhotoGranted: true
      });
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('barberia:client_history_updated', { detail: { businessId } }));
    }

    return newVisit;
  }

  // -------------------------------------------------------------------------
  // UPSERT STYLE MEMORY
  // -------------------------------------------------------------------------
  public static upsertStyleMemory(
    businessId: string,
    memoryData: Partial<StyleMemory> & { clientId: string }
  ): StyleMemory {
    const memories = localGetMemories(businessId);
    const cleanId = memoryData.clientId.trim().replace(/\s+/g, '');
    const index = memories.findIndex(m => m.clientId.trim().replace(/\s+/g, '') === cleanId);

    let result: StyleMemory;

    if (index !== -1) {
      result = { ...memories[index], ...memoryData, createdAt: new Date().toISOString() };
      memories[index] = result;
    } else {
      result = {
        id: `mem_${Date.now()}`,
        businessId,
        barberId: memoryData.barberId || 'barber_arizshop_alvaro',
        appointmentId: memoryData.appointmentId || `app_${Date.now()}`,
        photoUrl: memoryData.photoUrl || '/styles/el-siete-colombiano.jpg',
        likedAspects: memoryData.likedAspects || [],
        keepAspects: memoryData.keepAspects || [],
        changeAspects: memoryData.changeAspects || [],
        technicalFormula: memoryData.technicalFormula || 'Fade 1.5 a 3, tijera texturizada arriba',
        consentPhotoGranted: true,
        createdAt: new Date().toISOString(),
        ...memoryData,
        clientId: cleanId
      };
      memories.unshift(result);
    }

    localSaveMemories(businessId, memories);

    // Async save to Supabase hair_style_memories
    if (isSupabaseConfigured()) {
      void supabase.from('hair_style_memories').upsert({
        id: result.id,
        business_id: businessId,
        client_id: result.clientId,
        barber_id: result.barberId,
        appointment_id: result.appointmentId,
        photo_url: result.photoUrl,
        liked_aspects: result.likedAspects,
        keep_aspects: result.keepAspects,
        change_aspects: result.changeAspects,
        technical_formula: result.technicalFormula,
        consent_photo_granted: result.consentPhotoGranted,
      });
    }


    return result;
  }

  // -------------------------------------------------------------------------
  // GET ALL CLIENT PROFILES
  // -------------------------------------------------------------------------
  public static getAllClients(businessId: string): ClientProfileDetail[] {
    const visits = localGetVisits(businessId);
    const memories = localGetMemories(businessId);
    const clientMap = new Map<string, ClientProfileDetail>();

    for (const v of visits) {
      const key = v.clientPhone.replace(/\s+/g, '') || v.clientName.toLowerCase();
      const existing = clientMap.get(key);
      if (existing) {
        existing.totalVisits += 1;
        existing.totalSpentCOP += v.priceCOP;
        if (new Date(v.date) > new Date(existing.lastVisitDate)) {
          existing.lastVisitDate = v.date;
          existing.lastBarberName = v.barberName;
        }
        existing.visits.push(v);
      } else {
        clientMap.set(key, {
          phone: v.clientPhone,
          fullName: v.clientName,
          totalVisits: 1,
          totalSpentCOP: v.priceCOP,
          lastVisitDate: v.date,
          lastBarberName: v.barberName,
          visits: [v]
        });
      }
    }

    for (const m of memories) {
      const key = m.clientId.replace(/\s+/g, '');
      const client = clientMap.get(key);
      if (client) {
        client.styleMemory = m;
      } else if (m.clientId !== 'guest') {
        clientMap.set(key, {
          phone: m.clientId.startsWith('+') ? m.clientId : '+57 310 555 1234',
          fullName: 'Cliente Registrado',
          totalVisits: 1,
          totalSpentCOP: 38000,
          lastVisitDate: m.createdAt.split('T')[0],
          lastBarberName: 'Álvaro Ortiz',
          styleMemory: m,
          visits: []
        });
      }
    }

    return Array.from(clientMap.values()).sort((a, b) => b.totalVisits - a.totalVisits);
  }

  public static searchClients(businessId: string, query: string): ClientProfileDetail[] {
    const all = this.getAllClients(businessId);
    if (!query.trim()) return all;
    const q = query.toLowerCase().trim();
    return all.filter(c => c.fullName.toLowerCase().includes(q) || c.phone.includes(q));
  }
}
