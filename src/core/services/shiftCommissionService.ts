// ==========================================================================
// BARBERIA_PRO - Shift & Commission Settlement Service
// Multi-Tenant Real-Time Calculation of Barber Commission & Daily Shift Records
// ==========================================================================

export interface ShiftRecord {
  id: string;
  businessId: string;
  barberId: string;
  barberName: string;
  serviceName: string;
  priceCOP: number;
  commissionPercentage: number;
  barberEarningsCOP: number;
  shopEarningsCOP: number;
  clientName: string;
  paymentMethod: 'cash' | 'transfer' | 'card';
  isSettled: boolean;
  createdAt: string;
}

export interface BarberDailySummary {
  barberId: string;
  barberName: string;
  commissionPercentage: number;
  totalServicesCount: number;
  totalBilledCOP: number;
  barberEarningsCOP: number;
  shopEarningsCOP: number;
  pendingToPayCOP: number;
  records: ShiftRecord[];
}

const STORAGE_PREFIX = 'barberia_shift_records_';

export class ShiftCommissionService {
  public static getRecords(businessId: string): ShiftRecord[] {
    try {
      const data = localStorage.getItem(`${STORAGE_PREFIX}${businessId}`);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Error reading shift records', e);
    }
    return [];
  }

  public static recordService(data: {
    businessId: string;
    barberId: string;
    barberName: string;
    serviceName: string;
    priceCOP: number;
    commissionPercentage?: number;
    clientName: string;
    paymentMethod?: 'cash' | 'transfer' | 'card';
  }): ShiftRecord {
    const commissionPct = data.commissionPercentage ?? 50;
    const barberEarnings = Math.round((data.priceCOP * commissionPct) / 100);
    const shopEarnings = data.priceCOP - barberEarnings;

    const record: ShiftRecord = {
      id: `shift_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      businessId: data.businessId,
      barberId: data.barberId,
      barberName: data.barberName,
      serviceName: data.serviceName,
      priceCOP: data.priceCOP,
      commissionPercentage: commissionPct,
      barberEarningsCOP: barberEarnings,
      shopEarningsCOP: shopEarnings,
      clientName: data.clientName,
      paymentMethod: data.paymentMethod || 'cash',
      isSettled: false,
      createdAt: new Date().toISOString(),
    };

    const existing = this.getRecords(data.businessId);
    const updated = [record, ...existing];
    this.saveRecords(data.businessId, updated);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('barberia:shift_updated', { detail: record }));
    }

    return record;
  }

  public static settleBarberShift(businessId: string, barberId: string): void {
    const all = this.getRecords(businessId);
    const updated = all.map(r => 
      r.barberId === barberId && !r.isSettled ? { ...r, isSettled: true } : r
    );
    this.saveRecords(businessId, updated);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('barberia:shift_updated'));
    }
  }

  public static getBarberSummaryToday(businessId: string, barberId: string, commissionPct = 50): BarberDailySummary {
    const all = this.getRecords(businessId);
    const todayStr = new Date().toISOString().split('T')[0];

    const barberTodayRecords = all.filter(r => 
      r.barberId === barberId && r.createdAt.startsWith(todayStr)
    );

    const totalBilled = barberTodayRecords.reduce((acc, r) => acc + r.priceCOP, 0);
    const barberEarnings = barberTodayRecords.reduce((acc, r) => acc + r.barberEarningsCOP, 0);
    const shopEarnings = barberTodayRecords.reduce((acc, r) => acc + r.shopEarningsCOP, 0);
    const pendingToPay = barberTodayRecords.filter(r => !r.isSettled).reduce((acc, r) => acc + r.barberEarningsCOP, 0);

    return {
      barberId,
      barberName: barberTodayRecords[0]?.barberName || 'Barbero',
      commissionPercentage: commissionPct,
      totalServicesCount: barberTodayRecords.length,
      totalBilledCOP: totalBilled,
      barberEarningsCOP: barberEarnings,
      shopEarningsCOP: shopEarnings,
      pendingToPayCOP: pendingToPay,
      records: barberTodayRecords,
    };
  }

  public static getTeamShiftBreakdown(businessId: string, teamBarbers: { id: string; fullName: string; commissionPercentage?: number }[]): BarberDailySummary[] {
    return teamBarbers.map(barber => {
      const summary = this.getBarberSummaryToday(businessId, barber.id, barber.commissionPercentage ?? 50);
      return {
        ...summary,
        barberName: barber.fullName,
      };
    });
  }

  private static saveRecords(businessId: string, records: ShiftRecord[]): void {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${businessId}`, JSON.stringify(records));
    } catch (e) {
      console.warn('Error saving shift records', e);
    }
  }
}
