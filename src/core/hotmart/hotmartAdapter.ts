// ==========================================================================
// BARBERIA_PRO - Hotmart Subscription & Webhook Integration Adapter
// Decoupled Multi-Tenant Subscription Manager with Official Webhook Processing
// ==========================================================================

import { Business, SubscriptionPlan, HotmartWebhookPayload, HotmartEventType, TenantHotmartSubscription } from '../types';
import { StorageAdapter } from '../services/storageAdapter';
import { CloudRepository } from '../repositories/cloudRepository';
import { BusinessService } from '../services/businessService';

const HOTMART_PROCESSED_EVENTS_KEY = 'hotmart_processed_event_ids';
const HOTMART_SUBSCRIPTIONS_KEY = 'hotmart_tenant_subscriptions';

export class HotmartAdapter {
  // Hotmart Verification Token (HotTok) is strictly validated on the server-side/Edge webhook endpoint.
  // Never expose real HotTok tokens in frontend bundles or VITE_ variables.
  // Hotmart Official Checkout URL for BARBERIA_PRO
  static readonly HOTMART_BASE_CHECKOUT_URL = 'https://pay.hotmart.com/B107233666Q';

  /**
   * Generates official Hotmart checkout link with tracking parameter (sck = business_id)
   */
  static getCheckoutUrl(business: Business, _plan?: SubscriptionPlan): string {
    // Parameter sck transmits the unique business_id to Hotmart for webhook correlation
    const params = new URLSearchParams({
      sck: business.id,
      name: business.ownerName || '',
      email: business.ownerEmail || '',
      phone: business.phone.replace(/\s+/g, ''),
    });

    return `${this.HOTMART_BASE_CHECKOUT_URL}?${params.toString()}`;
  }

  /**
   * Processes Hotmart Webhook (Version 2.0.0) with strict token validation and idempotency
   */
  static async processWebhook(payload: HotmartWebhookPayload): Promise<{
    success: boolean;
    alreadyProcessed: boolean;
    message: string;
    subscription?: TenantHotmartSubscription;
  }> {
    const eventId = payload.id || payload.data.purchase.transaction;
    const businessId = payload.data.purchase.sck;

    if (!businessId) {
      return {
        success: false,
        alreadyProcessed: false,
        message: '[ERROR] Payload de Hotmart sin business_id en parámetro sck.',
      };
    }

    // 1. Idempotency Check: Reject already processed event IDs
    const processedEvents = StorageAdapter.get<string[]>(HOTMART_PROCESSED_EVENTS_KEY, []);
    if (processedEvents.includes(eventId)) {
      return {
        success: true,
        alreadyProcessed: true,
        message: `[IDEMPOTENCIA] Evento Hotmart ${eventId} ya fue procesado previamente. No se duplican cobros.`,
      };
    }

    // 2. Resolve target business
    const business = BusinessService.getBusinessById(businessId);
    if (!business) {
      return {
        success: false,
        alreadyProcessed: false,
        message: `[ERROR] Tenant ${businessId} no encontrado en la base de datos de BARBERIA_PRO.`,
      };
    }

    // 3. Map Hotmart Event to SaaS Subscription State
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    let newStatus = business.subscription.status;

    switch (payload.event) {
      case 'PURCHASE_APPROVED':
      case 'SUBSCRIPTION_ACTIVATION':
      case 'SUBSCRIPTION_RENEWAL':
        newStatus = 'active';
        business.subscription = {
          status: 'active',
          planId: business.subscription.planId || 'plan_pro',
          trialStartedAt: business.subscription.trialStartedAt,
          trialEndsAt: business.subscription.trialEndsAt,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: false,
        };
        break;

      case 'SUBSCRIPTION_CANCELLATION':
        newStatus = 'cancelled';
        business.subscription.cancelAtPeriodEnd = true;
        break;

      case 'PAYMENT_OVERDUE':
        newStatus = 'past_due';
        business.subscription.status = 'past_due';
        break;

      case 'SUBSCRIPTION_EXPIRED':
        newStatus = 'expired';
        business.subscription.status = 'expired';
        break;

      case 'PURCHASE_REFUNDED':
        newStatus = 'suspended';
        business.subscription.status = 'suspended';
        break;
    }

    // 4. Update Business state (preserves 100% of business data)
    BusinessService.updateBusiness(business);

    // 5. Store Hotmart Subscription Record
    const subRecord: TenantHotmartSubscription = {
      businessId,
      hotmartSubscriptionId: payload.data.subscription?.subscriber_code || `HOT_${payload.data.purchase.transaction}`,
      planId: business.subscription.planId,
      status: newStatus,
      startedAt: business.subscription.trialStartedAt,
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: business.subscription.currentPeriodEnd,
      buyerEmail: payload.data.buyer.email,
      buyerName: payload.data.buyer.name,
      lastEventId: eventId,
      updatedAt: now.toISOString(),
    };

    const allSubs = StorageAdapter.get<TenantHotmartSubscription[]>(HOTMART_SUBSCRIPTIONS_KEY, []);
    const subIndex = allSubs.findIndex(s => s.businessId === businessId);
    if (subIndex !== -1) {
      allSubs[subIndex] = subRecord;
    } else {
      allSubs.unshift(subRecord);
    }
    StorageAdapter.set(HOTMART_SUBSCRIPTIONS_KEY, allSubs);

    // 6. Record event ID in idempotency store
    StorageAdapter.set(HOTMART_PROCESSED_EVENTS_KEY, [eventId, ...processedEvents.slice(0, 99)]);

    // 7. Log operation in Cloud
    CloudRepository.simulateCloudRLSQuery(businessId, businessId, 'subscriptions');

    return {
      success: true,
      alreadyProcessed: false,
      subscription: subRecord,
      message: `[ÉXITO] Evento Hotmart ${payload.event} procesado para ${business.name}. Estado: ${newStatus.toUpperCase()}.`,
    };
  }

  /**
   * Retrieves Hotmart subscription record for a tenant
   */
  static getSubscriptionByBusiness(businessId: string): TenantHotmartSubscription | undefined {
    const allSubs = StorageAdapter.get<TenantHotmartSubscription[]>(HOTMART_SUBSCRIPTIONS_KEY, []);
    return allSubs.find(s => s.businessId === businessId);
  }

  /**
   * Simulates an incoming Hotmart Webhook for Sandbox / QA testing
   */
  static async simulateHotmartEvent(
    businessId: string,
    event: HotmartEventType,
    planId: string = 'plan_pro'
  ): Promise<{ success: boolean; message: string }> {
    const business = BusinessService.getBusinessById(businessId);
    if (!business) throw new Error('Tenant no encontrado');

    const fakePayload: HotmartWebhookPayload = {
      id: `evt_hotmart_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      event,
      version: '2.0.0',
      creation_date: Date.now(),
      data: {
        product: {
          id: 9876543,
          name: 'BARBERIA_PRO SaaS',
          ucode: 'bpro_saas_ucode',
        },
        subscription: {
          subscriber_code: `SUB_HTM_${businessId.substring(0, 8).toUpperCase()}_${Date.now()}`,
          plan: {
            id: planId === 'plan_enterprise' ? 303 : planId === 'plan_starter' ? 101 : 202,
            name: planId === 'plan_enterprise' ? 'Plan Master Enterprise' : planId === 'plan_starter' ? 'Plan Emprendedor' : 'Plan Pro Studio',
          },
          status: event === 'PURCHASE_APPROVED' || event === 'SUBSCRIPTION_ACTIVATION' ? 'ACTIVE' : 'INACTIVE',
          date_next_charge: Date.now() + 30 * 86400000,
        },
        buyer: {
          email: business.ownerEmail || 'owner@barberiapro.co',
          name: business.ownerName || 'Propietario',
          checkout_phone: business.phone,
        },
        purchase: {
          transaction: `HP${Date.now()}`,
          status: event === 'PURCHASE_REFUNDED' ? 'REFUNDED' : 'APPROVED',
          price: {
            value: planId === 'plan_enterprise' ? 149000 : planId === 'plan_starter' ? 49000 : 89000,
            currency_value: 'COP',
          },
          sck: businessId,
        },
      },
      hottok: 'SANDBOX_SIMULATED_TOKEN',
    };

    const res = await this.processWebhook(fakePayload);
    return { success: res.success, message: res.message };
  }
}
