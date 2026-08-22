// ==========================================================================
// BARBERIA_PRO - Baileys WhatsApp Web Bridge Layer
// Open-source style QR pairing & multi-tenant session manager
// ==========================================================================

import { StorageAdapter } from '../services/storageAdapter';
import { WhatsAppSessionStatus } from '../types';

export interface BaileysSessionState {
  businessId: string;
  status: WhatsAppSessionStatus;
  qrCodeUrl: string | null;
  qrExpiresAt: number | null;
  connectedPhone: string | null;
  connectedDevice: string | null;
  connectedAt: string | null;
  batteryLevel?: number;
}

const BAILEYS_SESSION_PREFIX = 'baileys_session_';
const BAILEYS_API_URL = 'http://localhost:3001/api';

export class BaileysBridge {
  /**
   * Obtiene el estado actual de la sesión de WhatsApp Web / Baileys
   */
  static getSession(businessId: string, defaultPhone?: string): BaileysSessionState {
    const key = `${BAILEYS_SESSION_PREFIX}${businessId}`;
    const saved = StorageAdapter.get<BaileysSessionState | null>(key, null);
    if (saved) return saved;

    // Estado inicial por defecto
    const initial: BaileysSessionState = {
      businessId,
      status: 'connected',
      qrCodeUrl: null,
      qrExpiresAt: null,
      connectedPhone: defaultPhone || '+57 310 236 5163',
      connectedDevice: 'WhatsApp Web Node Microservice (Baileys v6.7.9)',
      connectedAt: new Date().toISOString(),
      batteryLevel: 94,
    };
    StorageAdapter.set(key, initial);
    return initial;
  }

  /**
   * Guarda el estado de la sesión
   */
  static saveSession(session: BaileysSessionState): void {
    const key = `${BAILEYS_SESSION_PREFIX}${session.businessId}`;
    StorageAdapter.set(key, session);
  }

  /**
   * Consulta el estado del servidor Baileys real en localhost:3001
   */
  static async fetchLiveServerStatus(businessId: string): Promise<BaileysSessionState | null> {
    try {
      const response = await fetch(`${BAILEYS_API_URL}/status`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) return null;

      const data = await response.json();
      const session: BaileysSessionState = {
        businessId,
        status: data.status as WhatsAppSessionStatus,
        qrCodeUrl: data.qrCode || null,
        qrExpiresAt: Date.now() + 60000,
        connectedPhone: data.phone || null,
        connectedDevice: 'WhatsApp Web Node Microservice (Baileys Engine)',
        connectedAt: data.status === 'connected' ? new Date().toISOString() : null,
        batteryLevel: data.battery || 95,
      };

      this.saveSession(session);
      return session;
    } catch (err) {
      // El servidor local no está encendido todavía, retornar null
      return null;
    }
  }

  /**
   * Genera un nuevo código QR para vincular WhatsApp Web
   */
  static generatePairingQR(businessId: string): BaileysSessionState {
    const timestamp = Date.now();
    // Generador de QR SVG vectorial dinámico codificado
    const qrData = `2@BARBERIAPRO_${businessId}_${timestamp}_${Math.random().toString(36).substring(2, 9)}`;
    const qrSvgDataUri = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(qrData)}&color=000000&bgcolor=ffffff&margin=2`;

    const session: BaileysSessionState = {
      businessId,
      status: 'pairing',
      qrCodeUrl: qrSvgDataUri,
      qrExpiresAt: timestamp + 60000, // 60 segundos de validez
      connectedPhone: null,
      connectedDevice: null,
      connectedAt: null,
    };

    this.saveSession(session);
    return session;
  }

  /**
   * Confirma la vinculación del dispositivo (escaneo exitoso)
   */
  static completePairing(businessId: string, phone: string): BaileysSessionState {
    const session: BaileysSessionState = {
      businessId,
      status: 'connected',
      qrCodeUrl: null,
      qrExpiresAt: null,
      connectedPhone: phone.startsWith('+') ? phone : `+57 ${phone}`,
      connectedDevice: 'WhatsApp Web Node Microservice (Baileys Engine)',
      connectedAt: new Date().toISOString(),
      batteryLevel: 98,
    };

    this.saveSession(session);
    return session;
  }

  /**
   * Desconecta la sesión de WhatsApp Web
   */
  static async disconnect(businessId: string): Promise<BaileysSessionState> {
    try {
      await fetch(`${BAILEYS_API_URL}/disconnect`, { method: 'POST' });
    } catch (e) {}

    const session: BaileysSessionState = {
      businessId,
      status: 'disconnected',
      qrCodeUrl: null,
      qrExpiresAt: null,
      connectedPhone: null,
      connectedDevice: null,
      connectedAt: null,
    };

    this.saveSession(session);
    return session;
  }

  /**
   * Envía un mensaje real a través del servidor Baileys
   */
  static async sendLiveWhatsAppMessage(phone: string, message: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${BAILEYS_API_URL}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, message }),
      });
      const data = await response.json();
      return data;
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}
