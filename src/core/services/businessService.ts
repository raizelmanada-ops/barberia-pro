// ==========================================================================
// BARBERIA_PRO - Business / Tenant Management Service
// Full Multi-Tenant CRUD and Persistence Service
// ==========================================================================

import { Business, BusinessSubscription, ThemeConfig } from '../types';
import { INITIAL_BUSINESSES } from '../../database/mockData';
import { StorageAdapter } from './storageAdapter';
import { SubscriptionService } from './subscriptionService';
import { CloudRepository } from '../repositories/cloudRepository';

const STORAGE_KEY = 'tenants_data';

export class BusinessService {
  /**
   * Retrieves all businesses from persistent storage (with fallback seed)
   */
  static getAllBusinesses(): Business[] {
    const stored = StorageAdapter.get<Business[]>(STORAGE_KEY, INITIAL_BUSINESSES);
    
    // Ensure all stored businesses have valid computed subscription dates
    return stored.map(b => {
      // Re-evaluate computed live status
      const liveStatus = SubscriptionService.getComputedStatus(b);
      return {
        ...b,
        subscription: {
          ...b.subscription,
          status: liveStatus,
        }
      };
    });
  }

  /**
   * Finds a business by its unique URL slug
   */
  static getBusinessBySlug(slug: string): Business | undefined {
    const businesses = this.getAllBusinesses();
    return businesses.find(b => b.slug.toLowerCase() === slug.toLowerCase());
  }

  /**
   * Finds a business by its ID
   */
  static getBusinessById(id: string): Business | undefined {
    const businesses = this.getAllBusinesses();
    return businesses.find(b => b.id === id);
  }

  /**
   * Creates a new business tenant with full isolation and initial 7-day trial
   */
  static createBusiness(data: {
    name: string;
    slug?: string;
    slogan?: string;
    logoUrl?: string;
    bannerUrl?: string;
    businessType?: Business['businessType'];
    enabledCategories?: string[];
    address?: string;
    city?: string;
    neighborhood?: string;
    phone?: string;
    whatsapp?: string;
    instagramUrl?: string;
    ownerName?: string;
    ownerEmail?: string;
    ownerPhone?: string;
    theme?: Partial<ThemeConfig>;
    planId?: string;
  }): Business {
    const businesses = this.getAllBusinesses();
    
    const slug = data.slug || data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    const id = `biz_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const defaultTheme: ThemeConfig = {
      primary: '#eab308',
      primaryHover: '#ca8a04',
      primaryLight: 'rgba(234, 179, 8, 0.15)',
      accent: '#fbbf24',
      surface: '#09090b',
      surfaceCard: '#18181b',
      border: '#27272a',
      radius: '14px',
      fontHeading: 'Outfit',
      fontBody: 'Plus Jakarta Sans',
      ...data.theme,
    };

    const initialSubscription: BusinessSubscription = SubscriptionService.createInitialTrialSubscription(
      data.planId || 'plan_pro'
    );

    const newBusiness: Business = {
      id,
      slug,
      name: data.name,
      slogan: data.slogan || 'Elegancia, precisión y estilo.',
      logoUrl: data.logoUrl || '/logos/arizshop-logo.svg',
      bannerUrl: data.bannerUrl || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&h=400&q=80',
      businessType: data.businessType || 'barbershop',
      enabledCategories: data.enabledCategories || ['Corte Clásico', 'Barba & Perfilado', 'Combos'],
      address: data.address || 'Bogotá, Colombia',
      city: data.city || 'Bogotá',
      neighborhood: data.neighborhood || 'Bogotá',
      phone: data.phone || '+57 300 000 0000',
      whatsapp: data.whatsapp || '+57 300 000 0000',
      instagramUrl: data.instagramUrl || '',
      ownerName: data.ownerName || 'Propietario',
      ownerEmail: data.ownerEmail || '',
      ownerPhone: data.ownerPhone || data.phone || '',
      theme: defaultTheme,
      schedules: [
        { dayOfWeek: 1, openTime: '08:00', closeTime: '20:00', isOpen: true },
        { dayOfWeek: 2, openTime: '08:00', closeTime: '20:00', isOpen: true },
        { dayOfWeek: 3, openTime: '08:00', closeTime: '20:00', isOpen: true },
        { dayOfWeek: 4, openTime: '08:00', closeTime: '20:00', isOpen: true },
        { dayOfWeek: 5, openTime: '08:00', closeTime: '21:00', isOpen: true },
        { dayOfWeek: 6, openTime: '08:00', closeTime: '21:00', isOpen: true },
        { dayOfWeek: 0, openTime: '09:00', closeTime: '18:00', isOpen: true },
      ],
      loyalty: {
        type: 'stamps',
        stampsThreshold: 8,
        rewardDescription: '1 Servicio de cortesía',
        pointsPerPeso: 0,
        birthdayDiscountPercent: 20,
      },
      subscription: initialSubscription,
      isVerified: true,
      createdAt: new Date().toISOString(),
    };

    const updated = [newBusiness, ...businesses];
    StorageAdapter.set(STORAGE_KEY, updated);
    return newBusiness;
  }

  /**
   * Updates an existing business
   */
  static updateBusiness(updatedBusiness: Business): boolean {
    const businesses = this.getAllBusinesses();
    const index = businesses.findIndex(b => b.id === updatedBusiness.id);
    if (index >= 0) {
      businesses[index] = updatedBusiness;
      StorageAdapter.set(STORAGE_KEY, businesses);
      CloudRepository.updateBusiness(updatedBusiness);
      return true;
    }
    return false;
  }

  /**
   * Toggles or changes subscription status (e.g. suspend, activate, expire)
   */
  static setSubscriptionStatus(businessId: string, status: BusinessSubscription['status']): boolean {
    const business = this.getBusinessById(businessId);
    if (!business) return false;

    business.subscription.status = status;
    return this.updateBusiness(business);
  }

  /**
   * Extends the trial by a given number of days
   */
  static extendTrial(businessId: string, daysToAdd: number = 7): boolean {
    const business = this.getBusinessById(businessId);
    if (!business) return false;

    const currentEnds = new Date(business.subscription.trialEndsAt).getTime();
    const baseTime = currentEnds > Date.now() ? currentEnds : Date.now();
    const newEnds = new Date(baseTime + daysToAdd * 24 * 60 * 60 * 1000);

    business.subscription.trialEndsAt = newEnds.toISOString();
    business.subscription.currentPeriodEnd = newEnds.toISOString();
    business.subscription.status = 'trial_active';

    return this.updateBusiness(business);
  }

  /**
   * Changes the subscription plan
   */
  static changePlan(businessId: string, planId: string): boolean {
    const business = this.getBusinessById(businessId);
    if (!business) return false;

    business.subscription.planId = planId;
    return this.updateBusiness(business);
  }

  /**
   * Resets data to initial factory seeds (useful for QA / fresh testing)
   */
  static resetToSeed(): void {
    StorageAdapter.set(STORAGE_KEY, INITIAL_BUSINESSES);
  }
}
