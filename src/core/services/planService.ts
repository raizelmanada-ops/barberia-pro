// ==========================================================================
// BARBERIA_PRO - SaaS Subscription Plans Service
// Dynamic SaaS Commercial Configuration (No hardcoded prices in UI)
// ==========================================================================

import { SubscriptionPlan } from '../types';
import { StorageAdapter } from './storageAdapter';

export const INITIAL_PLANS: SubscriptionPlan[] = [
  {
    id: 'plan_emprendedor',
    name: 'Plan Emprendedor',
    tagline: 'Ideal para barberos independientes y estudios unipersonales.',
    priceCOP: 49000,
    billingPeriod: 'monthly',
    maxBarbers: 1,
    maxServices: 10,
    features: [
      'Acceso por código QR propio',
      'Catálogo digital de servicios',
      'Agendamiento sin solapamientos',
      'Ficha básica de clientes',
      'Soporte por WhatsApp'
    ],
    isPopular: false,
    isActive: true,
  },
  {
    id: 'plan_pro',
    name: 'Plan Pro Studio',
    tagline: 'Diseñado para barberías en crecimiento que buscan fidelizar y retener.',
    priceCOP: 89000,
    billingPeriod: 'monthly',
    maxBarbers: 5,
    maxServices: 25,
    features: [
      'Todo lo del Plan Emprendedor',
      'Memoria de Estilo Visual ("Tu barbería te conoce")',
      'Probador Personal de Estilo 2D',
      'Sensor Multidimensional de Experiencia (Calidad, Espera, Escucha)',
      'Club de Fidelización (Sellos y Puntos)',
      'Panel de Diagnóstico para el Propietario'
    ],
    isPopular: true,
    isActive: true,
  },
  {
    id: 'plan_enterprise',
    name: 'Plan Master Enterprise',
    tagline: 'Para barberías consolidadas, múltiples sedes y alto volumen.',
    priceCOP: 149000,
    billingPeriod: 'monthly',
    maxBarbers: 999,
    maxServices: 100,
    features: [
      'Todo lo del Plan Pro Studio',
      'Barberos y profesionales ilimitados',
      'Múltiples categorías (Caballero, Damas, Spa, Barba)',
      'Analítica avanzada de retención y retorno',
      'Soporte técnico prioritario 24/7',
      'Acceso temprano a probador 3D/IA'
    ],
    isPopular: false,
    isActive: true,
  }
];

const STORAGE_KEY = 'saas_plans';

export class PlanService {
  static getPlans(): SubscriptionPlan[] {
    return StorageAdapter.get<SubscriptionPlan[]>(STORAGE_KEY, INITIAL_PLANS);
  }

  static getPlanById(planId: string): SubscriptionPlan | undefined {
    const plans = this.getPlans();
    return plans.find(p => p.id === planId);
  }

  static updatePlan(updatedPlan: SubscriptionPlan): boolean {
    const plans = this.getPlans();
    const index = plans.findIndex(p => p.id === updatedPlan.id);
    if (index >= 0) {
      plans[index] = updatedPlan;
      return StorageAdapter.set(STORAGE_KEY, plans);
    }
    return false;
  }

  static savePlans(plans: SubscriptionPlan[]): boolean {
    return StorageAdapter.set(STORAGE_KEY, plans);
  }
}
