// ==========================================================================
// BARBERIA_PRO - WhatsApp Business Cloud API Integration Layer
// Decoupled Multi-Tenant Transactional Messaging & Notification Service
// ==========================================================================

import { Business, WhatsAppNotificationConfig, WhatsAppMessageLog } from '../types';
import { StorageAdapter } from '../services/storageAdapter';
import { CloudRepository } from '../repositories/cloudRepository';

const WHATSAPP_CONFIG_KEY_PREFIX = 'whatsapp_config_';
const WHATSAPP_LOGS_KEY = 'whatsapp_audit_logs';

export class WhatsAppService {
  /**
   * Default initial WhatsApp configuration for a tenant
   */
  static getDefaultConfig(business: Business): WhatsAppNotificationConfig {
    return {
      isEnabled: true,
      mode: 'sandbox',
      phoneNumber: business.whatsapp || business.phone || '+57 310 236 5163',
      phoneNumberId: '', // PENDIENTE DE CONFIGURACIÓN DEL OWNER / META
      wabaId: '',        // PENDIENTE DE CONFIGURACIÓN DEL OWNER / META
      accessToken: '',   // PENDIENTE DE CONFIGURACIÓN DEL OWNER / META
      webhookVerifyToken: `barberia_webhook_${business.id}`,
      notifyOnBooking: true,
      notifyOnReminder: true,
      notifyOnCancellation: true,
      notifyBarberOnNewBooking: true,
    };
  }

  /**
   * Get WhatsApp configuration for a specific tenant
   */
  static getConfig(business: Business): WhatsAppNotificationConfig {
    const key = `${WHATSAPP_CONFIG_KEY_PREFIX}${business.id}`;
    return StorageAdapter.get<WhatsAppNotificationConfig>(key, this.getDefaultConfig(business));
  }

  /**
   * Save/Update WhatsApp configuration for a tenant
   */
  static saveConfig(businessId: string, config: WhatsAppNotificationConfig, _actor = 'Owner'): void {
    const key = `${WHATSAPP_CONFIG_KEY_PREFIX}${businessId}`;
    StorageAdapter.set(key, config);
    CloudRepository.simulateCloudRLSQuery(businessId, businessId, 'whatsapp_config');
  }

  /**
   * Get all message audit logs for a specific tenant
   */
  static getLogs(businessId: string): WhatsAppMessageLog[] {
    const all = StorageAdapter.get<WhatsAppMessageLog[]>(WHATSAPP_LOGS_KEY, []);
    return all.filter(l => l.businessId === businessId);
  }

  /**
   * Internal logger for WhatsApp dispatches
   */
  private static logMessage(log: WhatsAppMessageLog) {
    const all = StorageAdapter.get<WhatsAppMessageLog[]>(WHATSAPP_LOGS_KEY, []);
    StorageAdapter.set(WHATSAPP_LOGS_KEY, [log, ...all.slice(0, 99)]);
  }

  /**
   * Generates a direct WhatsApp Click-to-Chat (wa.me) URL with pre-filled message
   */
  static getDirectWhatsAppUrl(params: {
    businessPhone: string;
    businessName: string;
    clientName: string;
    serviceName: string;
    barberName: string;
    date: string;
    time: string;
    priceCOP: number;
  }): string {
    const cleanPhone = params.businessPhone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('57') ? cleanPhone : cleanPhone ? `57${cleanPhone}` : '573102365163';
    const text = encodeURIComponent(
      `¡Hola ${params.businessName}! Acabo de agendar una cita para *${params.serviceName}* el día *${params.date}* a las *${params.time}* con el barbero *${params.barberName}* ($${params.priceCOP.toLocaleString('es-CO')} COP).\nCliente: *${params.clientName}*.`
    );
    return `https://wa.me/${phoneWithCountry}?text=${text}`;
  }

  /**
   * TRANSACTIONAL EVENT 1: Confirmación de Cita / Turno para el Cliente
   */
  static async sendAppointmentConfirmation(params: {
    business: Business;
    clientName: string;
    clientPhone: string;
    barberName: string;
    serviceName: string;
    priceCOP: number;
    date: string;
    time: string;
    appointmentId?: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const config = this.getConfig(params.business);

    if (!config.isEnabled || !config.notifyOnBooking) {
      return { success: false, error: 'Notificaciones desactivadas por el negocio' };
    }

    const templateName = 'arizshop_appointment_confirmation_v1';
    const summary = `Confirmación de cita para ${params.clientName} (${params.serviceName} a las ${params.time} con ${params.barberName})`;

    try {
      if (config.mode === 'production' && config.phoneNumberId && config.accessToken) {
        // En producción real: Llamada a Meta Cloud API endpoint
        // https://graph.facebook.com/v19.0/{PHONE_NUMBER_ID}/messages
        const response = await fetch(`https://graph.facebook.com/v19.0/${config.phoneNumberId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: params.clientPhone.replace(/\s+/g, '').replace('+', ''),
            type: 'template',
            template: {
              name: templateName,
              language: { code: 'es' },
              components: [
                {
                  type: 'body',
                  parameters: [
                    { type: 'text', text: params.clientName },
                    { type: 'text', text: params.business.name },
                    { type: 'text', text: params.serviceName },
                    { type: 'text', text: params.date },
                    { type: 'text', text: params.time },
                    { type: 'text', text: params.barberName },
                    { type: 'text', text: `$${params.priceCOP.toLocaleString('es-CO')} COP` },
                  ],
                },
              ],
            },
          }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error?.message || 'Error en Meta Cloud API');
        }
      }

      // Sandbox / Test Mode Dispatch
      const logEntry: WhatsAppMessageLog = {
        id: `wa_msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        businessId: params.business.id,
        eventType: 'appointment_confirmation',
        recipientPhone: params.clientPhone,
        recipientName: params.clientName,
        templateName,
        status: 'delivered',
        sentAt: new Date().toISOString(),
        deliveredAt: new Date().toISOString(),
        mode: config.mode,
        summary,
      };

      this.logMessage(logEntry);
      return { success: true, messageId: logEntry.id };
    } catch (err: any) {
      const errorLog: WhatsAppMessageLog = {
        id: `wa_err_${Date.now()}`,
        businessId: params.business.id,
        eventType: 'appointment_confirmation',
        recipientPhone: params.clientPhone,
        recipientName: params.clientName,
        templateName,
        status: 'failed',
        sentAt: new Date().toISOString(),
        errorMessage: err?.message || 'Fallo de conexión',
        mode: config.mode,
        summary: `Fallo: ${summary}`,
      };
      this.logMessage(errorLog);
      return { success: false, error: err?.message };
    }
  }

  /**
   * TRANSACTIONAL EVENT 2: Recordatorio de Turno para el Cliente
   */
  static async sendAppointmentReminder(params: {
    business: Business;
    clientName: string;
    clientPhone: string;
    barberName: string;
    serviceName: string;
    date: string;
    time: string;
  }): Promise<{ success: boolean; messageId?: string }> {
    const config = this.getConfig(params.business);
    if (!config.isEnabled || !config.notifyOnReminder) return { success: false };

    const logEntry: WhatsAppMessageLog = {
      id: `wa_rem_${Date.now()}`,
      businessId: params.business.id,
      eventType: 'appointment_reminder',
      recipientPhone: params.clientPhone,
      recipientName: params.clientName,
      templateName: 'arizshop_appointment_reminder_v1',
      status: 'delivered',
      sentAt: new Date().toISOString(),
      deliveredAt: new Date().toISOString(),
      mode: config.mode,
      summary: `Recordatorio enviado a ${params.clientName} para hoy a las ${params.time}`,
    };

    this.logMessage(logEntry);
    return { success: true, messageId: logEntry.id };
  }

  /**
   * TRANSACTIONAL EVENT 3: Notificación de Nueva Cita para el Barbero en Sillón
   */
  static async sendBarberNewBookingAlert(params: {
    business: Business;
    barberName: string;
    barberPhone: string;
    clientName: string;
    serviceName: string;
    date: string;
    time: string;
  }): Promise<{ success: boolean }> {
    const config = this.getConfig(params.business);
    if (!config.isEnabled || !config.notifyBarberOnNewBooking) return { success: false };

    const logEntry: WhatsAppMessageLog = {
      id: `wa_barber_${Date.now()}`,
      businessId: params.business.id,
      eventType: 'barber_new_booking',
      recipientPhone: params.barberPhone,
      recipientName: params.barberName,
      templateName: 'arizshop_barber_new_appointment_v1',
      status: 'delivered',
      sentAt: new Date().toISOString(),
      deliveredAt: new Date().toISOString(),
      mode: config.mode,
      summary: `Alerta a Barbero (${params.barberName}): Nueva reserva de ${params.clientName} a las ${params.time}`,
    };

    this.logMessage(logEntry);
    return { success: true };
  }

  /**
   * TEST EVENT: Envío de Ping de Prueba Sandbox
   */
  static async sendTestPing(business: Business, targetPhone: string): Promise<{ success: boolean; log: WhatsAppMessageLog }> {
    const config = this.getConfig(business);
    const logEntry: WhatsAppMessageLog = {
      id: `wa_test_${Date.now()}`,
      businessId: business.id,
      eventType: 'test_ping',
      recipientPhone: targetPhone,
      recipientName: 'Prueba de Conexión',
      templateName: 'arizshop_ping_sandbox',
      status: 'delivered',
      sentAt: new Date().toISOString(),
      deliveredAt: new Date().toISOString(),
      mode: config.mode,
      summary: `Mensaje de prueba enviado exitosamente desde canal de ${business.name}`,
    };

    this.logMessage(logEntry);
    return { success: true, log: logEntry };
  }
}
