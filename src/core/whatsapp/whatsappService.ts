// ==========================================================================
// BARBERIA_PRO - WhatsApp Business Cloud API & AI Hub Integration Layer
// Decoupled Multi-Tenant Messaging, Baileys Bridge & AI Agent Engine
// ==========================================================================

import {
  Business,
  WhatsAppNotificationConfig,
  WhatsAppMessageLog,
  WhatsAppConversation,
  WhatsAppChatMessage,
  WhatsAppConversationStatus,
} from '../types';
import { StorageAdapter } from '../services/storageAdapter';
import { CloudRepository } from '../repositories/cloudRepository';
import { AgentService } from '../ai/agentService';

const WHATSAPP_CONFIG_KEY_PREFIX = 'whatsapp_config_';
const WHATSAPP_LOGS_KEY = 'whatsapp_audit_logs';
const WHATSAPP_CONVERSATIONS_KEY_PREFIX = 'whatsapp_convs_';

export class WhatsAppService {
  /**
   * Default initial WhatsApp configuration for a tenant
   */
  static getDefaultConfig(business: Business): WhatsAppNotificationConfig {
    return {
      isEnabled: true,
      mode: 'sandbox',
      connectionMode: 'baileys_qr',
      sessionStatus: 'connected',
      phoneNumber: business.whatsapp || business.phone || '+57 310 236 5163',
      phoneNumberId: '',
      wabaId: '',
      accessToken: '',
      webhookVerifyToken: `barberia_webhook_${business.id}`,
      notifyOnBooking: true,
      notifyOnReminder: true,
      notifyOnCancellation: true,
      notifyBarberOnNewBooking: true,
      agentConfig: AgentService.getDefaultAgentConfig(business.name),
    };
  }

  /**
   * Get WhatsApp configuration for a specific tenant
   */
  static getConfig(business: Business): WhatsAppNotificationConfig {
    const key = `${WHATSAPP_CONFIG_KEY_PREFIX}${business.id}`;
    const saved = StorageAdapter.get<Partial<WhatsAppNotificationConfig>>(key, {});
    const defaults = this.getDefaultConfig(business);

    return {
      ...defaults,
      ...saved,
      agentConfig: {
        ...defaults.agentConfig,
        ...(saved.agentConfig || {}),
      },
    };
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

  // ==========================================================================
  // CONVERSATIONS & INBOX (OPENLIVERY ARCHITECTURE)
  // ==========================================================================

  /**
   * Semillas iniciales de chats para demostración realista
   */
  private static getInitialConversations(business: Business): WhatsAppConversation[] {
    const now = Date.now();
    return [
      {
        id: `conv_${business.id}_1`,
        businessId: business.id,
        clientPhone: '+57 312 890 4421',
        clientName: 'Juan Carlos Mendoza',
        lastMessageText: '¡Listo, Juan Carlos! He confirmado tu cita para hoy a las 16:00.',
        lastMessageAt: new Date(now - 1000 * 60 * 12).toISOString(),
        unreadCount: 0,
        status: 'ai_active',
        messages: [
          {
            id: `msg_${now - 150000}`,
            conversationId: `conv_${business.id}_1`,
            sender: 'client',
            senderName: 'Juan Carlos Mendoza',
            text: 'Buenas tardes, ¿tienen disponibilidad para un corte degradado y arreglo de barba hoy a las 4pm?',
            timestamp: new Date(now - 1000 * 60 * 15).toISOString(),
            status: 'read',
          },
          {
            id: `msg_${now - 120000}`,
            conversationId: `conv_${business.id}_1`,
            sender: 'agent_ai',
            senderName: 'Andrés - Asistente Virtual',
            text: `¡Listo, Juan Carlos! 🎉 He confirmado tu cita en *${business.name}*:\n\n💈 *Servicio:* Combo Corte & Barba Clásica\n✂️ *Barbero:* Barbero de Turno\n📅 *Fecha:* Hoy\n⏰ *Hora:* 16:00\n💰 *Valor:* $45.000 COP\n\n📍 *Ubicación:* ${business.address}, ${business.city}.`,
            timestamp: new Date(now - 1000 * 60 * 12).toISOString(),
            status: 'delivered',
            toolCalls: [{ toolName: 'crear_reserva_automatica', input: { time: '16:00' }, output: { status: 'confirmed' } }],
          },
        ],
      },
      {
        id: `conv_${business.id}_2`,
        businessId: business.id,
        clientPhone: '+57 320 541 9982',
        clientName: 'Sebastián Ospina',
        lastMessageText: 'Hola, ¿a qué hora cierran hoy?',
        lastMessageAt: new Date(now - 1000 * 60 * 35).toISOString(),
        unreadCount: 1,
        status: 'ai_active',
        messages: [
          {
            id: `msg_${now - 350000}`,
            conversationId: `conv_${business.id}_2`,
            sender: 'client',
            senderName: 'Sebastián Ospina',
            text: 'Hola, ¿a qué hora cierran hoy y cuánto vale el corte clásico?',
            timestamp: new Date(now - 1000 * 60 * 35).toISOString(),
            status: 'delivered',
          },
          {
            id: `msg_${now - 340000}`,
            conversationId: `conv_${business.id}_2`,
            sender: 'agent_ai',
            senderName: 'Andrés - Asistente Virtual',
            text: `¡Hola Sebastián! 👋 En *${business.name}* atendemos hoy hasta las 20:00. El Corte Clásico tiene un valor de $35.000 COP e incluye asesoría de imagen y bebida. ¿Te gustaría apartar tu turno?`,
            timestamp: new Date(now - 1000 * 60 * 34).toISOString(),
            status: 'delivered',
          },
        ],
      },
      {
        id: `conv_${business.id}_3`,
        businessId: business.id,
        clientPhone: '+57 301 772 3110',
        clientName: 'Mateo Gómez',
        lastMessageText: 'Perfecto, ya te transfiero por Nequi.',
        lastMessageAt: new Date(now - 1000 * 60 * 120).toISOString(),
        unreadCount: 0,
        status: 'human_takeover',
        takeoverBy: 'Álvaro (Owner)',
        takeoverAt: new Date(now - 1000 * 60 * 130).toISOString(),
        messages: [
          {
            id: `msg_${now - 900000}`,
            conversationId: `conv_${business.id}_3`,
            sender: 'client',
            senderName: 'Mateo Gómez',
            text: 'Hola, tengo una pregunta sobre el tratamiento capilar y si puedo pagar por adelantado con Nequi.',
            timestamp: new Date(now - 1000 * 60 * 140).toISOString(),
            status: 'read',
          },
          {
            id: `msg_${now - 800000}`,
            conversationId: `conv_${business.id}_3`,
            sender: 'owner_takeover',
            senderName: 'Álvaro (Owner)',
            text: '¡Hola Mateo! Claro que sí, con mucho gusto. Nuestro Nequi es 310 236 5163. Me envías el comprobante por acá y te separamos el espacio VIP.',
            timestamp: new Date(now - 1000 * 60 * 130).toISOString(),
            status: 'read',
          },
          {
            id: `msg_${now - 700000}`,
            conversationId: `conv_${business.id}_3`,
            sender: 'client',
            senderName: 'Mateo Gómez',
            text: 'Perfecto, ya te transfiero por Nequi.',
            timestamp: new Date(now - 1000 * 60 * 120).toISOString(),
            status: 'read',
          },
        ],
      },
    ];
  }

  /**
   * Obtiene todas las conversaciones del Inbox para un tenant
   */
  static getConversations(business: Business): WhatsAppConversation[] {
    const key = `${WHATSAPP_CONVERSATIONS_KEY_PREFIX}${business.id}`;
    const saved = StorageAdapter.get<WhatsAppConversation[] | null>(key, null);
    if (saved && saved.length > 0) return saved;

    const initials = this.getInitialConversations(business);
    StorageAdapter.set(key, initials);
    return initials;
  }

  /**
   * Guarda las conversaciones de un tenant
   */
  static saveConversations(businessId: string, conversations: WhatsAppConversation[]): void {
    const key = `${WHATSAPP_CONVERSATIONS_KEY_PREFIX}${businessId}`;
    StorageAdapter.set(key, conversations);
  }

  /**
   * Procesa un mensaje entrante de un cliente (simulado o webhook real)
   */
  static async receiveIncomingMessage(params: {
    business: Business;
    conversationId?: string;
    clientPhone: string;
    clientName?: string;
    text: string;
  }): Promise<{ conversation: WhatsAppConversation; reply?: WhatsAppChatMessage }> {
    const { business, clientPhone, clientName = 'Cliente WhatsApp', text } = params;
    const conversations = this.getConversations(business);

    let conv = conversations.find(
      c => c.id === params.conversationId || c.clientPhone.replace(/\D/g, '') === clientPhone.replace(/\D/g, '')
    );

    if (!conv) {
      conv = {
        id: `conv_${business.id}_${Date.now()}`,
        businessId: business.id,
        clientPhone,
        clientName,
        lastMessageText: text,
        lastMessageAt: new Date().toISOString(),
        unreadCount: 1,
        status: 'ai_active',
        messages: [],
      };
      conversations.unshift(conv);
    } else {
      conv.lastMessageText = text;
      conv.lastMessageAt = new Date().toISOString();
      conv.unreadCount += 1;
    }

    const clientMsg: WhatsAppChatMessage = {
      id: `msg_${Date.now()}`,
      conversationId: conv.id,
      sender: 'client',
      senderName: conv.clientName,
      text,
      timestamp: new Date().toISOString(),
      status: 'delivered',
    };
    conv.messages.push(clientMsg);

    // Procesar con el Agente de IA si está en modo activo
    let agentReply: WhatsAppChatMessage | undefined;
    if (conv.status === 'ai_active') {
      const processResult = await AgentService.processCustomerMessage({
        business,
        conversation: conv,
        customerMessage: text,
      });

      if (processResult.shouldHumanTakeover) {
        conv.status = 'human_takeover';
        conv.takeoverAt = new Date().toISOString();
      }

      if (processResult.replyText) {
        agentReply = {
          id: `msg_${Date.now() + 1}`,
          conversationId: conv.id,
          sender: 'agent_ai',
          senderName: 'Andrés - Asistente Virtual',
          text: processResult.replyText,
          timestamp: new Date().toISOString(),
          status: 'delivered',
          appointmentCreatedId: processResult.appointmentCreated?.id,
          toolCalls: processResult.toolExecuted ? [{ toolName: processResult.toolExecuted, input: {}, output: {} }] : undefined,
        };
        conv.messages.push(agentReply);
        conv.lastMessageText = processResult.replyText;
        conv.lastMessageAt = new Date().toISOString();
      }
    }

    this.saveConversations(business.id, conversations);
    return { conversation: conv, reply: agentReply };
  }

  /**
   * Envía un mensaje manual como dueño/barbero (Human Takeover)
   */
  static sendManualMessage(params: {
    businessId: string;
    conversationId: string;
    text: string;
    actorName: string;
  }): { conversation: WhatsAppConversation; message: WhatsAppChatMessage } {
    const key = `${WHATSAPP_CONVERSATIONS_KEY_PREFIX}${params.businessId}`;
    const conversations = StorageAdapter.get<WhatsAppConversation[]>(key, []);
    const conv = conversations.find(c => c.id === params.conversationId);
    if (!conv) throw new Error('Conversación no encontrada');

    // Cambiar estado a human takeover
    conv.status = 'human_takeover';
    conv.takeoverBy = params.actorName;
    conv.takeoverAt = new Date().toISOString();
    conv.unreadCount = 0;

    const newMsg: WhatsAppChatMessage = {
      id: `msg_${Date.now()}`,
      conversationId: conv.id,
      sender: 'owner_takeover',
      senderName: params.actorName,
      text: params.text,
      timestamp: new Date().toISOString(),
      status: 'delivered',
    };

    conv.messages.push(newMsg);
    conv.lastMessageText = params.text;
    conv.lastMessageAt = new Date().toISOString();

    StorageAdapter.set(key, conversations);
    return { conversation: conv, message: newMsg };
  }

  /**
   * Alterna el control entre la IA y el Humano (Takeover)
   */
  static toggleTakeover(businessId: string, conversationId: string, status: WhatsAppConversationStatus, actorName = 'Owner'): WhatsAppConversation {
    const key = `${WHATSAPP_CONVERSATIONS_KEY_PREFIX}${businessId}`;
    const conversations = StorageAdapter.get<WhatsAppConversation[]>(key, []);
    const conv = conversations.find(c => c.id === conversationId);
    if (!conv) throw new Error('Conversación no encontrada');

    conv.status = status;
    if (status === 'human_takeover') {
      conv.takeoverBy = actorName;
      conv.takeoverAt = new Date().toISOString();
    } else {
      conv.takeoverBy = undefined;
      conv.takeoverAt = undefined;
    }

    StorageAdapter.set(key, conversations);
    return conv;
  }

  /**
   * Marca una conversación como leída
   */
  static markConversationAsRead(businessId: string, conversationId: string): void {
    const key = `${WHATSAPP_CONVERSATIONS_KEY_PREFIX}${businessId}`;
    const conversations = StorageAdapter.get<WhatsAppConversation[]>(key, []);
    const conv = conversations.find(c => c.id === conversationId);
    if (conv) {
      conv.unreadCount = 0;
      conv.messages.forEach(m => {
        if (m.status !== 'read') m.status = 'read';
      });
      StorageAdapter.set(key, conversations);
    }
  }

  // ==========================================================================
  // TRANSACTIONAL NOTIFICATIONS
  // ==========================================================================

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
    if (!config.isEnabled || !config.notifyOnBooking) return { success: false };

    const logEntry: WhatsAppMessageLog = {
      id: `wa_conf_${Date.now()}`,
      businessId: params.business.id,
      eventType: 'appointment_confirmation',
      recipientPhone: params.clientPhone,
      recipientName: params.clientName,
      templateName: 'arizshop_appointment_confirmation_v1',
      status: 'delivered',
      sentAt: new Date().toISOString(),
      deliveredAt: new Date().toISOString(),
      mode: config.mode,
      summary: `Confirmación enviada a ${params.clientName} para ${params.serviceName} el ${params.date} a las ${params.time}`,
    };

    this.logMessage(logEntry);
    return { success: true, messageId: logEntry.id };
  }

  /**
   * TRANSACTIONAL EVENT 2: Recordatorio de Cita
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
