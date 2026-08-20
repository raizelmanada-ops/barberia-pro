// ==========================================================================
// BARBERIA_PRO - Style Catalog & Real Shop Cuts Repository Service
// Allows owners to upload real photos of their cuts, manage styles & customize catalog
// ==========================================================================

import { StyleCatalogItem } from '../types';
import { STYLE_CATALOG_ITEMS } from '../../database/mockData';

const STYLE_STORAGE_PREFIX = 'barberia_style_catalog_';

export class StyleCatalogService {
  /**
   * Get all style items for a business
   */
  public static getStyles(businessId: string): StyleCatalogItem[] {
    try {
      const data = localStorage.getItem(`${STYLE_STORAGE_PREFIX}${businessId}`);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Error reading style catalog from storage', e);
    }
    return STYLE_CATALOG_ITEMS;
  }

  /**
   * Save or update a style item
   */
  public static saveStyle(businessId: string, item: StyleCatalogItem): void {
    const list = this.getStyles(businessId);
    const index = list.findIndex(s => s.id === item.id);
    let updated: StyleCatalogItem[];
    if (index !== -1) {
      updated = [...list];
      updated[index] = item;
    } else {
      updated = [item, ...list];
    }
    this.saveToStorage(businessId, updated);
  }

  /**
   * Update photo of an existing style
   */
  public static updateStylePhoto(businessId: string, styleId: string, photoUrl: string): void {
    const list = this.getStyles(businessId);
    const updated = list.map(s => {
      if (s.id === styleId) {
        return {
          ...s,
          previewOverlayUrl: photoUrl,
          angles: {
            front: photoUrl,
            side: photoUrl,
            back: photoUrl,
          }
        };
      }
      return s;
    });
    this.saveToStorage(businessId, updated);
  }

  /**
   * Delete a style
   */
  public static deleteStyle(businessId: string, styleId: string): void {
    const list = this.getStyles(businessId);
    const updated = list.filter(s => s.id !== styleId);
    this.saveToStorage(businessId, updated);
  }

  /**
   * Reset to initial defaults
   */
  public static resetToDefault(businessId: string): void {
    try {
      localStorage.removeItem(`${STYLE_STORAGE_PREFIX}${businessId}`);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('barberia:catalog_updated'));
      }
    } catch (e) {
      console.warn('Error resetting style catalog', e);
    }
  }

  private static saveToStorage(businessId: string, items: StyleCatalogItem[]): void {
    try {
      localStorage.setItem(`${STYLE_STORAGE_PREFIX}${businessId}`, JSON.stringify(items));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('barberia:catalog_updated'));
      }
    } catch (e) {
      console.warn('Error saving style catalog to storage', e);
    }
  }
}
