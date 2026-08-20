// ==========================================================================
// BARBERIA_PRO - Feature Entitlements Service
// Multi-Tenant Feature Flag & Plan Limits Resolver
// ==========================================================================

import { Business, FeatureEntitlements } from '../types';
import { PlanService } from './planService';

export class EntitlementsService {
  /**
   * Resolves feature capabilities and usage limits for a business based on its subscription plan
   */
  static getEntitlements(business: Business): FeatureEntitlements {
    const planId = business.subscription.planId || 'plan_pro';
    const plan = PlanService.getPlanById(planId);

    // If on Trial, grant full Plan Pro capabilities for comprehensive evaluation
    if (business.subscription.status === 'trial_active') {
      return {
        maxBarbers: plan ? plan.maxBarbers : 5,
        maxServices: plan ? plan.maxServices : 25,
        hasVisualMemory: true,
        hasWhatsAppNotifications: true,
        hasStyleTryOn: true,
        hasQualitySensorAnalytics: true,
        hasCustomBranding: true,
      };
    }

    // Default tiered limits
    switch (planId) {
      case 'plan_starter':
        return {
          maxBarbers: 1,
          maxServices: 8,
          hasVisualMemory: false,
          hasWhatsAppNotifications: false,
          hasStyleTryOn: true,
          hasQualitySensorAnalytics: false,
          hasCustomBranding: false,
        };

      case 'plan_pro':
        return {
          maxBarbers: 5,
          maxServices: 25,
          hasVisualMemory: true,
          hasWhatsAppNotifications: true,
          hasStyleTryOn: true,
          hasQualitySensorAnalytics: true,
          hasCustomBranding: true,
        };

      case 'plan_enterprise':
      default:
        return {
          maxBarbers: 999,
          maxServices: 999,
          hasVisualMemory: true,
          hasWhatsAppNotifications: true,
          hasStyleTryOn: true,
          hasQualitySensorAnalytics: true,
          hasCustomBranding: true,
        };
    }
  }

  /**
   * Checks if a business can add a new barber without exceeding its plan limit
   */
  static canAddBarber(business: Business, currentBarbersCount: number): boolean {
    const entitlements = this.getEntitlements(business);
    return currentBarbersCount < entitlements.maxBarbers;
  }

  /**
   * Checks if a business can add a new service without exceeding its plan limit
   */
  static canAddService(business: Business, currentServicesCount: number): boolean {
    const entitlements = this.getEntitlements(business);
    return currentServicesCount < entitlements.maxServices;
  }
}
