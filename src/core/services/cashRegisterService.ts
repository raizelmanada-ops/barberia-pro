// ==========================================================================
// BARBERIA_PRO - Daily Cash Register & Shift Closing Service (POS)
// Multi-Tenant Real-Time Cash Flow, Payment Methods & Shift Settlement
// Supabase-backed with localStorage fallback
// ==========================================================================

import { CashRegisterShift, CashTransaction, CashShiftSummary, PaymentMethod } from '../types';
import { supabase, isSupabaseConfigured } from '../supabase/supabaseClient';

const SHIFTS_STORAGE_PREFIX = 'barberia_cash_shifts_';
const TRANSACTIONS_STORAGE_PREFIX = 'barberia_cash_transactions_';

// ---------------------------------------------------------------------------
// Local storage helpers (fallback)
// ---------------------------------------------------------------------------
function localGetShifts(businessId: string): CashRegisterShift[] {
  try {
    const data = localStorage.getItem(`${SHIFTS_STORAGE_PREFIX}${businessId}`);
    if (data) return JSON.parse(data);
  } catch { /* ignore */ }
  return [];
}

function localSaveShifts(businessId: string, shifts: CashRegisterShift[]): void {
  try { localStorage.setItem(`${SHIFTS_STORAGE_PREFIX}${businessId}`, JSON.stringify(shifts)); } catch { /* ignore */ }
}

function localGetTransactions(businessId: string): CashTransaction[] {
  try {
    const data = localStorage.getItem(`${TRANSACTIONS_STORAGE_PREFIX}${businessId}`);
    if (data) return JSON.parse(data);
  } catch { /* ignore */ }
  return [];
}

function localSaveTransactions(businessId: string, txs: CashTransaction[]): void {
  try { localStorage.setItem(`${TRANSACTIONS_STORAGE_PREFIX}${businessId}`, JSON.stringify(txs)); } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
// Supabase → TS type mappers
// ---------------------------------------------------------------------------
function mapShiftFromDb(row: any): CashRegisterShift {
  return {
    id: row.id,
    businessId: row.business_id,
    openedBy: row.opened_by,
    openedAt: row.opened_at,
    closedAt: row.closed_at,
    closedBy: row.closed_by,
    initialCashCOP: row.initial_cash_cop,
    status: row.status,
    notes: row.notes,
    closedSummary: row.summary && Object.keys(row.summary).length ? row.summary : undefined,
    auditLogs: row.audit_logs || [],
  };
}

function mapTxFromDb(row: any): CashTransaction {
  return {
    id: row.id,
    businessId: row.business_id,
    shiftId: row.shift_id,
    ticketId: row.ticket_id,
    serviceId: row.service_id,
    serviceName: row.service_name,
    barberId: row.barber_id,
    barberName: row.barber_name,
    clientName: row.client_name,
    clientPhone: row.client_phone,
    amountCOP: row.amount_cop,
    barberCommissionCOP: row.barber_commission_cop,
    businessNetCOP: row.business_net_cop,
    paymentMethod: row.payment_method as PaymentMethod,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

export class CashRegisterService {
  // -------------------------------------------------------------------------
  // GET ALL SHIFTS
  // -------------------------------------------------------------------------
  public static async getShiftsAsync(businessId: string): Promise<CashRegisterShift[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('cash_shifts')
          .select('*')
          .eq('business_id', businessId)
          .order('opened_at', { ascending: false });
        if (!error && data) {
          const shifts = data.map(mapShiftFromDb);
          localSaveShifts(businessId, shifts); // sync to local cache
          return shifts;
        }
      } catch { /* fallback */ }
    }
    return localGetShifts(businessId);
  }

  public static getShifts(businessId: string): CashRegisterShift[] {
    return localGetShifts(businessId);
  }

  public static getCurrentShift(businessId: string): CashRegisterShift | null {
    const shifts = localGetShifts(businessId);
    return shifts.find(s => s.status === 'open') || null;
  }

  // -------------------------------------------------------------------------
  // OPEN SHIFT (sync version for UI compatibility — saves locally immediately,
  // fires Supabase async in background)
  // -------------------------------------------------------------------------
  public static openShift(
    businessId: string,
    openedBy: string,
    initialCashCOP: number = 50000,
    notes?: string
  ): CashRegisterShift {
    const current = this.getCurrentShift(businessId);
    if (current) return current;

    const newShift: CashRegisterShift = {
      id: `shift_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      businessId,
      openedBy: openedBy || 'Álvaro Ortiz',
      openedAt: new Date().toISOString(),
      initialCashCOP: initialCashCOP || 0,
      status: 'open',
      notes: notes || 'Apertura de turno de caja',
      auditLogs: [
        {
          action: 'SHIFT_OPENED',
          timestamp: new Date().toISOString(),
          actor: openedBy || 'Propietario',
          reason: `Apertura con base de $${initialCashCOP.toLocaleString('es-CO')} COP`
        }
      ]
    };

    // Save locally immediately
    const shifts = localGetShifts(businessId);
    localSaveShifts(businessId, [newShift, ...shifts]);
    this.notifyUpdate(businessId);

    // Fire Supabase async in background
    if (isSupabaseConfigured()) {
      void supabase.from('cash_shifts').insert({
        id: newShift.id,
        business_id: businessId,
        opened_by: newShift.openedBy,
        opened_at: newShift.openedAt,
        initial_cash_cop: newShift.initialCashCOP,
        status: 'open',
        notes: newShift.notes,
        summary: {},
      });
    }

    return newShift;
  }


  // -------------------------------------------------------------------------
  // GET ALL TRANSACTIONS
  // -------------------------------------------------------------------------
  public static async getTransactionsAsync(businessId: string): Promise<CashTransaction[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('cash_transactions')
          .select('*')
          .eq('business_id', businessId)
          .order('created_at', { ascending: false });
        if (!error && data) {
          const txs = data.map(mapTxFromDb);
          localSaveTransactions(businessId, txs);
          return txs;
        }
      } catch { /* fallback */ }
    }
    return localGetTransactions(businessId);
  }

  public static getTransactions(businessId: string): CashTransaction[] {
    return localGetTransactions(businessId);
  }

  public static getShiftTransactions(businessId: string, shiftId: string): CashTransaction[] {
    return localGetTransactions(businessId).filter(t => t.shiftId === shiftId);
  }

  // -------------------------------------------------------------------------
  // RECORD TRANSACTION (sync — saves locally immediately, Supabase async in background)
  // -------------------------------------------------------------------------
  public static recordTransaction(
    businessId: string,
    data: {
      ticketId?: string;
      serviceId?: string;
      serviceName: string;
      barberId: string;
      barberName: string;
      clientName: string;
      clientPhone?: string;
      amountCOP: number;
      commissionPercentage?: number;
      paymentMethod: PaymentMethod;
      notes?: string;
    }
  ): CashTransaction {
    let currentShift = this.getCurrentShift(businessId);
    if (!currentShift) {
      currentShift = this.openShift(businessId, data.barberName || 'Álvaro Ortiz', 50000);
    }

    const commissionPct = data.commissionPercentage ?? 50;
    const barberCommission = Math.round((data.amountCOP * commissionPct) / 100);
    const businessNet = data.amountCOP - barberCommission;

    const transaction: CashTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      businessId,
      shiftId: currentShift.id,
      ticketId: data.ticketId,
      serviceId: data.serviceId,
      serviceName: data.serviceName,
      barberId: data.barberId,
      barberName: data.barberName,
      clientName: data.clientName || 'Cliente en Sillón',
      clientPhone: data.clientPhone,
      amountCOP: data.amountCOP,
      barberCommissionCOP: barberCommission,
      businessNetCOP: businessNet,
      paymentMethod: data.paymentMethod || 'cash',
      notes: data.notes,
      createdAt: new Date().toISOString()
    };

    const allTx = localGetTransactions(businessId);
    localSaveTransactions(businessId, [transaction, ...allTx]);
    this.notifyUpdate(businessId);

    // Supabase async in background
    if (isSupabaseConfigured()) {
      void supabase.from('cash_transactions').insert({
        id: transaction.id,
        business_id: businessId,
        shift_id: transaction.shiftId,
        ticket_id: transaction.ticketId,
        service_id: transaction.serviceId,
        client_name: transaction.clientName,
        client_phone: transaction.clientPhone,
        service_name: transaction.serviceName,
        barber_name: transaction.barberName,
        barber_id: transaction.barberId,
        amount_cop: transaction.amountCOP,
        payment_method: transaction.paymentMethod,
        barber_commission_pct: commissionPct,
        barber_commission_cop: transaction.barberCommissionCOP,
        business_net_cop: transaction.businessNetCOP,
        notes: transaction.notes,
      });
    }

    return transaction;
  }


  // -------------------------------------------------------------------------
  // SHIFT SUMMARY
  // -------------------------------------------------------------------------
  public static getShiftSummary(businessId: string, shiftId: string): CashShiftSummary {
    const shift = localGetShifts(businessId).find(s => s.id === shiftId);
    const transactions = this.getShiftTransactions(businessId, shiftId);
    const initialCash = shift?.initialCashCOP || 0;

    let totalSales = 0, cashSales = 0, nequiSales = 0, daviplataSales = 0,
        cardSales = 0, transferSales = 0, totalBarberCommissions = 0, totalBusinessNet = 0;

    for (const tx of transactions) {
      totalSales += tx.amountCOP;
      totalBarberCommissions += tx.barberCommissionCOP;
      totalBusinessNet += tx.businessNetCOP;
      if (tx.paymentMethod === 'cash') cashSales += tx.amountCOP;
      else if (tx.paymentMethod === 'nequi') nequiSales += tx.amountCOP;
      else if (tx.paymentMethod === 'daviplata') daviplataSales += tx.amountCOP;
      else if (tx.paymentMethod === 'card') cardSales += tx.amountCOP;
      else transferSales += tx.amountCOP;
    }

    return {
      totalSalesCOP: totalSales,
      cashSalesCOP: cashSales,
      nequiSalesCOP: nequiSales,
      daviplataSalesCOP: daviplataSales,
      cardSalesCOP: cardSales,
      transferSalesCOP: transferSales,
      totalBarberCommissionsCOP: totalBarberCommissions,
      totalBusinessNetCOP: totalBusinessNet,
      serviceCount: transactions.length,
      initialCashCOP: initialCash,
      finalCashInDrawerCOP: initialCash + cashSales
    };
  }

  // -------------------------------------------------------------------------
  // CLOSE SHIFT (sync — saves locally immediately, Supabase async in background)
  // -------------------------------------------------------------------------
  public static closeShift(
    businessId: string,
    shiftId: string,
    closedBy: string,
    notes?: string
  ): CashRegisterShift {
    const shifts = localGetShifts(businessId);
    const index = shifts.findIndex(s => s.id === shiftId);
    if (index === -1) throw new Error('Turno de caja no encontrado');

    const summary = this.getShiftSummary(businessId, shiftId);
    const current = shifts[index];
    const closedAt = new Date().toISOString();

    const closedShift: CashRegisterShift = {
      ...current,
      status: 'closed',
      closedAt,
      closedBy: closedBy || 'Álvaro Ortiz',
      notes: notes || current.notes,
      closedSummary: summary,
      auditLogs: [
        ...(current.auditLogs || []),
        {
          action: 'SHIFT_CLOSED',
          timestamp: closedAt,
          actor: closedBy || 'Propietario',
          reason: `Cierre: $${summary.totalSalesCOP.toLocaleString('es-CO')} COP (${summary.serviceCount} servicios)`
        }
      ]
    };

    shifts[index] = closedShift;
    localSaveShifts(businessId, shifts);
    this.notifyUpdate(businessId);

    // Supabase async in background
    if (isSupabaseConfigured()) {
      void supabase.from('cash_shifts').update({
        status: 'closed',
        closed_at: closedAt,
        closed_by: closedShift.closedBy,
        summary: summary,
        notes: closedShift.notes,
      }).eq('id', shiftId);
    }

    return closedShift;
  }


  // -------------------------------------------------------------------------
  // AUDIT LOG
  // -------------------------------------------------------------------------
  public static auditAdjustShift(businessId: string, shiftId: string, reason: string, actor: string): void {
    const shifts = localGetShifts(businessId);
    const index = shifts.findIndex(s => s.id === shiftId);
    if (index === -1) return;

    shifts[index] = {
      ...shifts[index],
      auditLogs: [
        ...(shifts[index].auditLogs || []),
        { action: 'AUDIT_CORRECTION', timestamp: new Date().toISOString(), actor, reason }
      ]
    };
    localSaveShifts(businessId, shifts);
    this.notifyUpdate(businessId);
  }

  private static notifyUpdate(businessId: string): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('barberia:cash_updated', { detail: { businessId } }));
    }
  }
}
