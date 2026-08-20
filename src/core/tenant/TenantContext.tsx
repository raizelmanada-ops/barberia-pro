import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Business, BusinessSubscription } from '../types';
import { BusinessService } from '../services/businessService';

interface TenantContextType {
  currentBusiness: Business;
  setCurrentBusinessBySlug: (slug: string) => boolean;
  availableBusinesses: Business[];
  isDemoSwitchOpen: boolean;
  setIsDemoSwitchOpen: (open: boolean) => void;
  isQRModalOpen: boolean;
  setIsQRModalOpen: (open: boolean) => void;
  refreshBusinesses: () => void;
  updateBusiness: (business: Business) => boolean;
  setSubscriptionStatus: (businessId: string, status: BusinessSubscription['status']) => boolean;
  extendTrial: (businessId: string, days?: number) => boolean;
  changePlan: (businessId: string, planId: string) => boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [businesses, setBusinesses] = useState<Business[]>(() => BusinessService.getAllBusinesses());
  
  // Resolve initial tenant from URL slug (e.g. /b/arizshop-barber) or default to the first business ('arizshop-barber')
  const [currentBusiness, setCurrentBusiness] = useState<Business>(() => {
    const all = BusinessService.getAllBusinesses();
    const path = window.location.pathname;
    const match = path.match(/\/b\/([^/]+)/);
    if (match && match[1]) {
      const found = all.find(b => b.slug.toLowerCase() === match[1].toLowerCase());
      if (found) return found;
    }
    return all[0];
  });

  const [isDemoSwitchOpen, setIsDemoSwitchOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  const refreshBusinesses = useCallback(() => {
    const all = BusinessService.getAllBusinesses();
    setBusinesses(all);
    // Refresh current business reference
    const currentUpdated = all.find(b => b.id === currentBusiness.id) || all[0];
    setCurrentBusiness(currentUpdated);
  }, [currentBusiness.id]);

  // Inyectar dinámicamente variables CSS en :root según la barbería activa
  useEffect(() => {
    const root = document.documentElement;
    const theme = currentBusiness.theme;

    root.style.setProperty('--brand-primary', theme.primary);
    root.style.setProperty('--brand-primary-hover', theme.primaryHover);
    root.style.setProperty('--brand-primary-light', theme.primaryLight);
    root.style.setProperty('--brand-accent', theme.accent);
    root.style.setProperty('--brand-surface', theme.surface);
    root.style.setProperty('--brand-surface-card', theme.surfaceCard);
    root.style.setProperty('--brand-border', theme.border);
    root.style.setProperty('--brand-radius', theme.radius);

    // Update page title & dynamic meta
    document.title = `${currentBusiness.name} | Tu barbería te conoce`;
  }, [currentBusiness]);

  const setCurrentBusinessBySlug = (slug: string): boolean => {
    const all = BusinessService.getAllBusinesses();
    const found = all.find(b => b.slug.toLowerCase() === slug.toLowerCase());
    if (found) {
      setCurrentBusiness(found);
      // Softly update browser URL without page reload
      try {
        window.history.pushState(null, '', `/b/${found.slug}`);
      } catch {
        // Safe fallback in restricted iframe/environment
      }
      return true;
    }
    return false;
  };

  const updateBusiness = (business: Business): boolean => {
    const ok = BusinessService.updateBusiness(business);
    if (ok) refreshBusinesses();
    return ok;
  };

  const setSubscriptionStatus = (businessId: string, status: BusinessSubscription['status']): boolean => {
    const ok = BusinessService.setSubscriptionStatus(businessId, status);
    if (ok) refreshBusinesses();
    return ok;
  };

  const extendTrial = (businessId: string, days: number = 7): boolean => {
    const ok = BusinessService.extendTrial(businessId, days);
    if (ok) refreshBusinesses();
    return ok;
  };

  const changePlan = (businessId: string, planId: string): boolean => {
    const ok = BusinessService.changePlan(businessId, planId);
    if (ok) refreshBusinesses();
    return ok;
  };

  return (
    <TenantContext.Provider
      value={{
        currentBusiness,
        setCurrentBusinessBySlug,
        availableBusinesses: businesses,
        isDemoSwitchOpen,
        setIsDemoSwitchOpen,
        isQRModalOpen,
        setIsQRModalOpen,
        refreshBusinesses,
        updateBusiness,
        setSubscriptionStatus,
        extendTrial,
        changePlan,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = (): TenantContextType => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};
