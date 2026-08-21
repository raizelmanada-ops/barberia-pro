// ==========================================================================
// BARBERIA_PRO - Real-Time Appointments & Walk-In Queue Service
// Supabase queue_tickets + Realtime for multi-device sync
// localStorage fallback when Supabase is unavailable
// ==========================================================================

import { supabase, isSupabaseConfigured } from '../supabase/supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface WalkInTicket {
  id: string;
  businessId: string;
  type: 'walkin' | 'appointment';
  clientName: string;
  clientPhone: string;
  styleName: string;
  stylePhotoUrl: string;
  specialNote: string;
  barberName: string;
  appointmentDate?: string;
  appointmentTime?: string;
  priceCOP?: number;
  status: 'waiting' | 'in_chair' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: string;
}

const STORAGE_KEY_PREFIX = 'barberia_notifications_';
let realtimeChannel: RealtimeChannel | null = null;

// ---------------------------------------------------------------------------
// Local helpers
// ---------------------------------------------------------------------------
function localGetTickets(businessId: string): WalkInTicket[] {
  try {
    const data = localStorage.getItem(`${STORAGE_KEY_PREFIX}${businessId}`);
    if (data) return JSON.parse(data);
  } catch { /* ignore */ }
  return [];
}

function localSaveTickets(businessId: string, tickets: WalkInTicket[]): void {
  try { localStorage.setItem(`${STORAGE_KEY_PREFIX}${businessId}`, JSON.stringify(tickets)); } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
// DB row → TS mapper
// ---------------------------------------------------------------------------
function mapTicketFromDb(row: any): WalkInTicket {
  return {
    id: row.id,
    businessId: row.business_id,
    type: row.type === 'appointment' ? 'appointment' : 'walkin',
    clientName: row.client_name,
    clientPhone: row.client_phone || '',
    styleName: row.service_name || '',
    stylePhotoUrl: row.style_reference || '/styles/el-siete-colombiano.jpg',
    specialNote: row.notes || '',
    barberName: row.barber_name || '',
    status: row.status as WalkInTicket['status'],
    createdAt: row.created_at,
  };
}

export class WalkInService {
  // -------------------------------------------------------------------------
  // GET TICKETS (sync local, async Supabase)
  // -------------------------------------------------------------------------
  public static getTickets(businessId: string): WalkInTicket[] {
    return localGetTickets(businessId);
  }

  public static async getTicketsAsync(businessId: string): Promise<WalkInTicket[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('queue_tickets')
          .select('*')
          .eq('business_id', businessId)
          .in('status', ['waiting', 'in_chair', 'confirmed'])
          .order('queued_at', { ascending: true });
        if (!error && data) {
          const tickets = data.map(mapTicketFromDb);
          localSaveTickets(businessId, tickets);
          return tickets;
        }
      } catch { /* fallback */ }
    }
    return localGetTickets(businessId);
  }

  // -------------------------------------------------------------------------
  // CREATE TICKET
  // -------------------------------------------------------------------------
  public static async createTicket(
    ticket: Omit<WalkInTicket, 'id' | 'createdAt' | 'status'> & { status?: WalkInTicket['status'] }
  ): Promise<WalkInTicket> {
    const newTicket: WalkInTicket = {
      ...ticket,
      id: `${ticket.type}_${Date.now()}`,
      status: ticket.status || 'waiting',
      createdAt: new Date().toISOString(),
    };

    // Save to Supabase
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('queue_tickets').insert({
          id: newTicket.id,
          business_id: newTicket.businessId,
          client_name: newTicket.clientName,
          client_phone: newTicket.clientPhone,
          barber_name: newTicket.barberName,
          service_name: newTicket.styleName,
          type: newTicket.type === 'walkin' ? 'walk-in' : 'appointment',
          status: newTicket.status,
          style_reference: newTicket.stylePhotoUrl,
          notes: newTicket.specialNote,
          queued_at: newTicket.createdAt,
        });
      } catch (e) {
        console.warn('[WalkIn] Supabase insert ticket failed, using local:', e);
      }
    }

    // Save locally
    const tickets = localGetTickets(newTicket.businessId);
    localSaveTickets(newTicket.businessId, [newTicket, ...tickets]);
    this.playChime();
    this.notifyUpdate(newTicket.businessId);
    return newTicket;
  }

  // -------------------------------------------------------------------------
  // UPDATE TICKET STATUS
  // -------------------------------------------------------------------------
  public static async updateTicketStatus(
    businessId: string,
    ticketId: string,
    status: WalkInTicket['status']
  ): Promise<void> {
    const now = new Date().toISOString();

    // Update in Supabase
    if (isSupabaseConfigured()) {
      try {
        const update: any = { status };
        if (status === 'in_chair') update.seated_at = now;
        if (status === 'completed' || status === 'cancelled') update.completed_at = now;
        await supabase.from('queue_tickets').update(update).eq('id', ticketId);
      } catch (e) {
        console.warn('[WalkIn] Supabase update ticket failed, using local:', e);
      }
    }

    // Update locally
    const tickets = localGetTickets(businessId);
    const updated = tickets.map(t => t.id === ticketId ? { ...t, status } : t);
    localSaveTickets(businessId, updated);
    this.notifyUpdate(businessId);
  }

  // -------------------------------------------------------------------------
  // SUPABASE REALTIME — replace CustomEvent for multi-device sync
  // -------------------------------------------------------------------------
  public static subscribeRealtime(
    businessId: string,
    onUpdate: (tickets: WalkInTicket[]) => void
  ): () => void {
    if (!isSupabaseConfigured()) {
      // Fallback: listen to local CustomEvent (same tab only)
      const handler = () => onUpdate(localGetTickets(businessId));
      window.addEventListener('barberia:walkin_update', handler);
      return () => window.removeEventListener('barberia:walkin_update', handler);
    }

    // Clean up any existing channel
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel);
      realtimeChannel = null;
    }

    realtimeChannel = supabase
      .channel(`queue_${businessId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'queue_tickets',
          filter: `business_id=eq.${businessId}`,
        },
        async () => {
          // Re-fetch on any change
          const tickets = await WalkInService.getTicketsAsync(businessId);
          onUpdate(tickets);
        }
      )
      .subscribe();

    // Return unsubscribe function
    return () => {
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
        realtimeChannel = null;
      }
    };
  }

  // -------------------------------------------------------------------------
  // LEGACY SYNC METHODS (kept for backward compatibility with existing UI)
  // -------------------------------------------------------------------------
  public static updateTicket(businessId: string, ticketId: string, updates: Partial<WalkInTicket>): WalkInTicket | null {
    const tickets = localGetTickets(businessId);
    const index = tickets.findIndex(t => t.id === ticketId);
    if (index === -1) return null;
    tickets[index] = { ...tickets[index], ...updates };
    localSaveTickets(businessId, tickets);
    // Fire async Supabase update
    if (updates.status) {
      void this.updateTicketStatus(businessId, ticketId, updates.status);
    }
    this.notifyUpdate(businessId);
    return tickets[index];
  }

  /** Alias kept for backward compatibility with existing UI components */
  public static updateStatus(businessId: string, ticketId: string, status: WalkInTicket['status']): void {
    void this.updateTicketStatus(businessId, ticketId, status);
    const tickets = localGetTickets(businessId);
    const updated = tickets.map(t => t.id === ticketId ? { ...t, status } : t);
    localSaveTickets(businessId, updated);
    this.notifyUpdate(businessId);
  }

  public static deleteTicket(businessId: string, ticketId: string): void {
    if (isSupabaseConfigured()) {
      void supabase.from('queue_tickets').delete().eq('id', ticketId);
    }
    const tickets = localGetTickets(businessId);
    localSaveTickets(businessId, tickets.filter(t => t.id !== ticketId));
    this.notifyUpdate(businessId);
  }

  public static clearCompleted(businessId: string): void {
    const tickets = localGetTickets(businessId);
    const active = tickets.filter(t => !['completed', 'cancelled'].includes(t.status));
    localSaveTickets(businessId, active);
    this.notifyUpdate(businessId);
  }

  private static notifyUpdate(businessId: string): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('barberia:walkin_update', { detail: { businessId } }));
    }
  }

  private static audioCtx: AudioContext | null = null;

  /**
   * Desbloquea el AudioContext en el primer toque o login del barbero para evitar bloqueos de autoplay
   */
  public static unlockAudio(): void {
    if (typeof window === 'undefined') return;
    try {
      if (!this.audioCtx) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        this.audioCtx = new AudioCtx();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
    } catch { /* Audio not supported */ }
  }

  /**
   * Sintetizador puro a 880 Hz (A5) con decaimiento natural para notificaciones en vivo
   */
  public static playChime(): void {
    if (typeof window === 'undefined') return;
    try {
      this.unlockAudio();
      if (!this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, this.audioCtx.currentTime); // 880 Hz (Nota La5)

      gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 1.2);
    } catch { /* Audio not available */ }
  }
}

