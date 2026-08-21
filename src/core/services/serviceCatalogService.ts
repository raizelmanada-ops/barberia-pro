// ==========================================================================
// BARBERIA_PRO - Service Catalog Repository Service
// Multi-Tenant Service Management with Isolated Cloud Persistence
// ==========================================================================

import { Service } from '../types';
import { StorageAdapter } from './storageAdapter';
import { INITIAL_SERVICES } from '../../database/mockData';
import { CloudRepository } from '../repositories/cloudRepository';

const SERVICES_STORAGE_KEY = 'tenant_services_catalog';

export class ServiceCatalogService {
  private static getAllServices(): Service[] {
    return StorageAdapter.get<Service[]>(SERVICES_STORAGE_KEY, INITIAL_SERVICES);
  }

  /**
   * Get all active services for a specific tenant
   */
  static getServicesByBusiness(businessId: string): Service[] {
    const all = this.getAllServices();
    const filtered = all.filter(s => s.businessId === businessId);
    return filtered;
  }

  private static notifyUpdate(businessId: string): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('barberia:services_updated', { detail: { businessId } }));
    }
  }

  /**
   * Add a new service to a tenant's catalog
   */
  static addService(service: Omit<Service, 'id'>, actor = 'Owner'): Service {
    const all = this.getAllServices();
    const newService: Service = {
      ...service,
      id: `srv_${service.businessId}_${Date.now()}`,
    };
    StorageAdapter.set(SERVICES_STORAGE_KEY, [newService, ...all]);
    CloudRepository.saveService(newService, actor);
    this.notifyUpdate(service.businessId);
    return newService;
  }

  /**
   * Update an existing service
   */
  static updateService(service: Service, actor = 'Owner'): void {
    const all = this.getAllServices();
    const index = all.findIndex(s => s.id === service.id && s.businessId === service.businessId);
    if (index !== -1) {
      all[index] = service;
      StorageAdapter.set(SERVICES_STORAGE_KEY, all);
      CloudRepository.saveService(service, actor);
      this.notifyUpdate(service.businessId);
    }
  }

  /**
   * Toggle service active/inactive status
   */
  static toggleServiceActive(businessId: string, serviceId: string, actor = 'Owner'): void {
    const all = this.getAllServices();
    const index = all.findIndex(s => s.id === serviceId && s.businessId === businessId);
    if (index !== -1) {
      all[index].isActive = !all[index].isActive;
      StorageAdapter.set(SERVICES_STORAGE_KEY, all);
      CloudRepository.saveService(all[index], actor);
      this.notifyUpdate(businessId);
    }
  }

  /**
   * Delete a service from tenant's catalog
   */
  static deleteService(businessId: string, serviceId: string, _actor = 'Owner'): void {
    const all = this.getAllServices();
    const filtered = all.filter(s => !(s.id === serviceId && s.businessId === businessId));
    StorageAdapter.set(SERVICES_STORAGE_KEY, filtered);
    this.notifyUpdate(businessId);
  }


  /**
   * Reset services to seed
   */
  static resetToSeed(): void {
    StorageAdapter.set(SERVICES_STORAGE_KEY, INITIAL_SERVICES);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('barberia:services_updated'));
    }
  }
}

