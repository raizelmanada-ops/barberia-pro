// ==========================================================================
// BARBERIA_PRO - Subscription & 7-Day Trial Lifecycle Service
// Real Trial Computations and Business Status Verification
// ==========================================================================

import { Business, SubscriptionStatus, BusinessSubscription } from '../types';

export class SubscriptionService {
  /**
   * Generates initial 7-day trial subscription metadata for a new business
   */
  static createInitialTrialSubscription(planId: string = 'plan_pro'): BusinessSubscription {
    const now = new Date();
    const trialEnds = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return {
      status: 'trial_active',
      planId: planId,
      trialStartedAt: now.toISOString(),
      trialEndsAt: trialEnds.toISOString(),
      currentPeriodEnd: trialEnds.toISOString(),
      cancelAtPeriodEnd: false,
    };
  }

  /**
   * Calculates the exact, live subscription status based on current date & trial math
   */
  static getComputedStatus(business: Business): SubscriptionStatus {
    const sub = business.subscription;
    if (!sub) return 'trial_active';

    // Manual override statuses
    if (sub.status === 'suspended') return 'suspended';
    if (sub.status === 'cancelled') return 'cancelled';
    if (sub.status === 'active') return 'active';
    if (sub.status === 'past_due') return 'past_due';

    // Trial time computation
    if (sub.status === 'trial_active' || sub.status === 'trial_expired') {
      const now = new Date().getTime();
      const trialEnds = new Date(sub.trialEndsAt).getTime();

      if (now > trialEnds) {
        return 'trial_expired';
      }
      return 'trial_active';
    }

    return sub.status;
  }

  /**
   * Returns remaining days in 7-day trial (or 0 if expired)
   */
  static getRemainingTrialDays(business: Business): number {
    const sub = business.subscription;
    if (!sub || !sub.trialEndsAt) return 0;

    const now = new Date().getTime();
    const ends = new Date(sub.trialEndsAt).getTime();
    const diffMs = ends - now;

    if (diffMs <= 0) return 0;
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Checks whether the business is operational for public/client use
   */
  static isBusinessOperational(business: Business): boolean {
    const status = this.getComputedStatus(business);
    return status === 'active' || status === 'trial_active';
  }
}
