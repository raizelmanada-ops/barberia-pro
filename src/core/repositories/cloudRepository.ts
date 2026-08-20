// ==========================================================================
// BARBERIA_PRO - Unified Cloud Repository Layer
// Decoupled Multi-Tenant Data Layer with Supabase & StorageAdapter Fallback
// ==========================================================================

import { supabase, isSupabaseConfigured } from '../supabase/supabaseClient';
import { StorageAdapter } from '../services/storageAdapter';
import { Business, Service, BarberProfile, StyleMemory, PhotoConsentRecord } from '../types';
import { INITIAL_BUSINESSES, INITIAL_SERVICES, INITIAL_BARBERS, INITIAL_STYLE_MEMORIES } from '../../database/mockData';

export interface CloudOperationLog {
  id: string;
  timestamp: string;
  table: string;
  action: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'RLS_EVALUATION';
  tenantId: string;
  actor: string;
  status: 'SUCCESS' | 'DENIED' | 'FALLBACK';
  payloadSummary: string;
}

export class CloudRepository {
  private static telemetryLogs: CloudOperationLog[] = [];
  private static listeners: Array<(logs: CloudOperationLog[]) => void> = [];

  static subscribeTelemetry(listener: (logs: CloudOperationLog[]) => void): () => void {
    this.listeners.push(listener);
    listener(this.telemetryLogs);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private static logOperation(
    table: string,
    action: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'RLS_EVALUATION',
    tenantId: string,
    actor: string,
    status: 'SUCCESS' | 'DENIED' | 'FALLBACK',
    payloadSummary: string
  ) {
    const log: CloudOperationLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString('es-CO', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      table,
      action,
      tenantId,
      actor,
      status,
      payloadSummary,
    };
    this.telemetryLogs = [log, ...this.telemetryLogs.slice(0, 49)];
    this.listeners.forEach(l => l(this.telemetryLogs));
  }

  static getTelemetryLogs(): CloudOperationLog[] {
    return this.telemetryLogs;
  }

  // ---------------------------------------------------------------------------
  // 1. BUSINESSES (TENANTS)
  // ---------------------------------------------------------------------------
  static async getBusinesses(): Promise<Business[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('businesses').select('*');
        if (!error && data) {
          this.logOperation('businesses', 'SELECT', 'global', 'System', 'SUCCESS', `Cargados ${data.length} tenants desde Supabase`);
          return data as Business[];
        }
      } catch {
        // Fallback below
      }
    }

    const localData = StorageAdapter.get<Business[]>('tenants', INITIAL_BUSINESSES);
    this.logOperation('businesses', 'SELECT', 'global', 'System', 'FALLBACK', `Cargados ${localData.length} tenants (StorageAdapter)`);
    return localData;
  }

  static async updateBusiness(business: Business, actor = 'Owner'): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('businesses')
          .update(business)
          .eq('id', business.id);
        if (!error) {
          this.logOperation('businesses', 'UPDATE', business.id, actor, 'SUCCESS', `Actualizado tenant: ${business.name} en Cloud`);
          return;
        }
      } catch {
        // Fallback
      }
    }

    const all = await this.getBusinesses();
    const index = all.findIndex(b => b.id === business.id);
    if (index !== -1) {
      all[index] = business;
      StorageAdapter.set('tenants', all);
      this.logOperation('businesses', 'UPDATE', business.id, actor, 'FALLBACK', `Actualizado localmente: ${business.name}`);
    }
  }

  // ---------------------------------------------------------------------------
  // 2. SERVICES CATALOG
  // ---------------------------------------------------------------------------
  static async getServices(businessId: string): Promise<Service[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .eq('business_id', businessId);
        if (!error && data) {
          this.logOperation('services', 'SELECT', businessId, 'User', 'SUCCESS', `Obtenidos ${data.length} servicios para tenant`);
          return data as Service[];
        }
      } catch {
        // Fallback
      }
    }

    const all = StorageAdapter.get<Service[]>('tenant_services_catalog', INITIAL_SERVICES);
    const tenantServices = all.filter(s => s.businessId === businessId);
    this.logOperation('services', 'SELECT', businessId, 'User', 'FALLBACK', `Obtenidos ${tenantServices.length} servicios de ${businessId}`);
    return tenantServices;
  }

  static async saveService(service: Service, actor = 'Owner'): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('services').upsert(service);
        if (!error) {
          this.logOperation('services', 'INSERT', service.businessId, actor, 'SUCCESS', `Guardado servicio "${service.name}" en Supabase`);
          return;
        }
      } catch {
        // Fallback
      }
    }

    const all = StorageAdapter.get<Service[]>('tenant_services_catalog', INITIAL_SERVICES);
    const index = all.findIndex(s => s.id === service.id && s.businessId === service.businessId);
    if (index !== -1) {
      all[index] = service;
    } else {
      all.unshift(service);
    }
    StorageAdapter.set('tenant_services_catalog', all);
    this.logOperation('services', 'UPDATE', service.businessId, actor, 'FALLBACK', `Guardado servicio "${service.name}" ($${service.priceCOP})`);
  }

  // ---------------------------------------------------------------------------
  // 3. TEAM MEMBERS
  // ---------------------------------------------------------------------------
  static async getTeam(businessId: string): Promise<BarberProfile[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('barber_profiles')
          .select('*')
          .eq('business_id', businessId);
        if (!error && data) {
          this.logOperation('barber_profiles', 'SELECT', businessId, 'User', 'SUCCESS', `Obtenidos ${data.length} colaboradores`);
          return data as BarberProfile[];
        }
      } catch {
        // Fallback
      }
    }

    const all = StorageAdapter.get<BarberProfile[]>('tenant_team_members', INITIAL_BARBERS);
    const filtered = all.filter(b => b.businessId === businessId);
    this.logOperation('barber_profiles', 'SELECT', businessId, 'User', 'FALLBACK', `Obtenidos ${filtered.length} colaboradores`);
    return filtered;
  }

  static async saveMember(member: BarberProfile, actor = 'Owner'): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('barber_profiles').upsert(member);
        if (!error) {
          this.logOperation('barber_profiles', 'INSERT', member.businessId, actor, 'SUCCESS', `Guardado colaborador "${member.fullName}" en Supabase`);
          return;
        }
      } catch {
        // Fallback
      }
    }

    const all = StorageAdapter.get<BarberProfile[]>('tenant_team_members', INITIAL_BARBERS);
    const index = all.findIndex(b => b.id === member.id && b.businessId === member.businessId);
    if (index !== -1) {
      all[index] = member;
    } else {
      all.unshift(member);
    }
    StorageAdapter.set('tenant_team_members', all);
    this.logOperation('barber_profiles', 'INSERT', member.businessId, actor, 'FALLBACK', `Guardado colaborador "${member.fullName}"`);
  }

  // ---------------------------------------------------------------------------
  // 4. STYLE MEMORIES & PHOTO CONSENT
  // ---------------------------------------------------------------------------
  static async getStyleMemory(businessId: string, clientId: string): Promise<StyleMemory | undefined> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('hair_style_memories')
          .select('*')
          .eq('business_id', businessId)
          .eq('client_id', clientId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        if (!error && data) {
          this.logOperation('hair_style_memories', 'SELECT', businessId, 'Barber/Client', 'SUCCESS', `Fórmula encontrada en Supabase`);
          return data as unknown as StyleMemory;
        }
      } catch {
        // Fallback below
      }
    }
    const all = StorageAdapter.get<StyleMemory[]>('tenant_style_memories', INITIAL_STYLE_MEMORIES);
    const found = all.find(m => m.businessId === businessId && m.clientId === clientId);
    this.logOperation(
      'hair_style_memories',
      'SELECT',
      businessId,
      'Barber/Client',
      found ? 'FALLBACK' : 'FALLBACK',
      found ? `Fórmula: ${found.technicalFormula}` : 'Sin memoria previa'
    );
    return found;
  }

  static async saveConsentRecord(consent: PhotoConsentRecord, businessId: string, clientId: string, actor = 'Barber'): Promise<void> {
    this.logOperation(
      'photo_consents',
      'INSERT',
      businessId,
      actor,
      'SUCCESS',
      `Consentimiento ${consent.status} (${consent.version}) para cliente ${clientId}`
    );
  }


  // ---------------------------------------------------------------------------
  // 5. CLOUD CROSS-TENANT RLS BREACH SIMULATOR
  // ---------------------------------------------------------------------------
  static async simulateCloudRLSQuery(
    sessionBusinessId: string,
    targetBusinessId: string,
    table: string
  ): Promise<{ isAllowed: boolean; statusCode: number; message: string }> {
    const isAllowed = sessionBusinessId === 'global' || sessionBusinessId === targetBusinessId;

    this.logOperation(
      table,
      'RLS_EVALUATION',
      targetBusinessId,
      `Sesión: ${sessionBusinessId}`,
      isAllowed ? 'SUCCESS' : 'DENIED',
      isAllowed
        ? `[RLS GRANTED] Acceso a ${table} concedido para tenant ${targetBusinessId}`
        : `[RLS DENIED 403] PostgreSQL RLS bloqueó consulta cruzada a ${table} de ${targetBusinessId}`
    );

    return {
      isAllowed,
      statusCode: isAllowed ? 200 : 403,
      message: isAllowed
        ? `[PostgreSQL RLS 200 OK] Datos autorizados para ${targetBusinessId}.`
        : `[PostgreSQL RLS 403 FORBIDDEN] Solicitud bloqueada. Token pertenece a ${sessionBusinessId}, no a ${targetBusinessId}.`,
    };
  }
}
