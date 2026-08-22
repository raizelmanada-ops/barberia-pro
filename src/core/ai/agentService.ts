// ==========================================================================
// BARBERIA_PRO - WhatsApp AI Agent Engine (OpenLivery Architecture)
// Autonomous Assistant with NLU, Function Calling & Multi-Tenant Knowledge
// ==========================================================================

import {
  Business,
  WhatsAppAgentConfig,
  WhatsAppConversation
} from '../types';
import { ServiceCatalogService } from '../services/serviceCatalogService';
import { TeamService } from '../services/teamService';
import { WalkInService } from '../services/walkinService';
import { WhatsAppService } from '../whatsapp/whatsappService';

export interface AgentProcessResult {
  replyText: string;
  toolExecuted?: string;
  appointmentCreated?: {
    id: string;
    clientName: string;
    serviceName: string;
    barberName: string;
    date: string;
    time: string;
    priceCOP: number;
  };
  shouldHumanTakeover?: boolean;
}

export class AgentService {
  /**
   * Configuración por defecto para el Agente de IA del tenant
   */
  static getDefaultAgentConfig(businessName: string): WhatsAppAgentConfig {
    return {
      isEnabled: true,
      agentName: 'Andrés - Asistente Virtual',
      personality: 'amable_profesional',
      llmProvider: 'smart_native',
      modelName: 'gpt-4o-mini',
      apiKey: '',
      autoBookingEnabled: true,
      systemPrompt: `Eres el asistente virtual oficial de ${businessName}. Tu objetivo es atender a los clientes por WhatsApp, responder dudas de servicios y precios en pesos colombianos ($ COP), informar horarios y ubicación, y ayudarles a agendar citas rápidamente de manera cordial y eficiente.`,
      knowledgeBase: `• Medios de pago: Aceptamos Efectivo, Nequi, Daviplata, Tarjetas Débito y Crédito.
• Parqueadero: Contamos con bahía de parqueo frente al local y convenio con parqueadero a 50 metros.
• Políticas: Se recomienda llegar con 5 minutos de anticipación. Cancelaciones con mínimo 1 hora de anticipación.
• Bebidas de cortesía: Café premium, agua y cerveza en servicios combo.`,
      takeoverTimeoutMinutes: 30,
    };
  }

  /**
   * Procesa un mensaje entrante de un cliente y genera una respuesta inteligente
   */
  static async processCustomerMessage(params: {
    business: Business;
    conversation: WhatsAppConversation;
    customerMessage: string;
  }): Promise<AgentProcessResult> {
    const { business, conversation, customerMessage } = params;
    const config = WhatsAppService.getConfig(business).agentConfig || this.getDefaultAgentConfig(business.name);

    // 1. Si la conversación está en Human Takeover, la IA no interviene
    if (conversation.status === 'human_takeover') {
      return {
        replyText: '',
        shouldHumanTakeover: true,
      };
    }

    // 2. Si el usuario solicita explícitamente hablar con una persona o dueño
    const lowerMsg = customerMessage.toLowerCase().trim();
    if (
      lowerMsg.includes('hablar con humano') ||
      lowerMsg.includes('hablar con una persona') ||
      lowerMsg.includes('hablar con el dueño') ||
      lowerMsg.includes('asesor humano') ||
      lowerMsg.includes('pásame a alguien') ||
      lowerMsg.includes('atención humana')
    ) {
      return {
        replyText: `¡Entendido! 👤 He pausado mis respuestas automáticas y le acabo de notificar a nuestro equipo en ${business.name}. En unos momentos un miembro del equipo te atenderá directamente por aquí.`,
        shouldHumanTakeover: true,
      };
    }

    // 3. Obtener catálogo y equipo de la barbería
    const services = ServiceCatalogService.getServicesByBusiness(business.id);
    const barbers = TeamService.getTeamByBusiness(business.id);

    // 4. Si tiene API Key de OpenAI configurada, intentar llamada con LLM
    if (config.apiKey && config.apiKey.trim().startsWith('sk-') && config.llmProvider === 'openai') {
      try {
        const aiResponse = await this.callOpenAIEngine({
          config,
          business,
          services,
          barbers,
          conversation,
          customerMessage,
        });
        if (aiResponse) return aiResponse;
      } catch (err) {
        console.warn('[AgentService] Fallback to native intelligence engine due to LLM error:', err);
      }
    }

    // 5. Motor de Inteligencia NLU Nativo (Zero-Cost & 100% Funcional sin API Key)
    return await this.executeNativeIntelligence({
      business,
      config,
      services,
      barbers,
      conversation,
      customerMessage,
    });
  }

  /**
   * Motor de Inteligencia NLU y Reglas Semánticas Nativas
   */
  private static async executeNativeIntelligence(params: {
    business: Business;
    config: WhatsAppAgentConfig;
    services: any[];
    barbers: any[];
    conversation: WhatsAppConversation;
    customerMessage: string;
  }): Promise<AgentProcessResult> {
    const { business, config, services, barbers, conversation, customerMessage } = params;
    const msg = customerMessage.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // A. Detectar intención de agendamiento / reserva
    const isBookingIntent =
      msg.includes('agendar') ||
      msg.includes('cita') ||
      msg.includes('turno') ||
      msg.includes('reservar') ||
      msg.includes('apartar') ||
      msg.includes('espacio') ||
      msg.includes('hora') ||
      msg.includes('para hoy') ||
      msg.includes('para manana') ||
      msg.includes('cortarme');

    if (isBookingIntent && config.autoBookingEnabled) {
      // Identificar servicio mencionado
      const matchedService = services.find(s => {
        const sName = s.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return msg.includes(sName) || (sName.includes('corte') && msg.includes('corte')) || (sName.includes('barba') && msg.includes('barba'));
      }) || services[0] || { name: 'Corte Clásico', priceCOP: 35000 };

      // Identificar barbero mencionado
      const matchedBarber = barbers.find(b => {
        const bName = b.fullName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const firstName = bName.split(' ')[0];
        return msg.includes(bName) || msg.includes(firstName);
      }) || barbers[0] || { fullName: 'Barbero de Turno', phone: business.phone };

      // Extraer hora si se menciona
      const timeMatch = msg.match(/(\d{1,2})(:(\d{2}))?\s*(am|pm|de la tarde|de la manana)?/);
      let selectedTime = '16:00';
      if (timeMatch) {
        let hour = parseInt(timeMatch[1], 10);
        const modifier = (timeMatch[4] || '').toLowerCase();
        if ((modifier.includes('pm') || modifier.includes('tarde')) && hour < 12) {
          hour += 12;
        }
        selectedTime = `${hour.toString().padStart(2, '0')}:00`;
      }

      // Extraer fecha (hoy o mañana)
      const now = new Date();
      if (msg.includes('manana')) {
        now.setDate(now.getDate() + 1);
      }
      const selectedDate = now.toISOString().split('T')[0];

      // Si el cliente pide confirmación directa o dio detalles suficientes, creamos la cita
      const hasSpecificTime = Boolean(timeMatch) || msg.includes('hoy') || msg.includes('manana') || msg.includes('confirmar');

      if (hasSpecificTime) {
        // Crear el ticket en tiempo real en la base de datos de BARBERIA_PRO
        const clientName = conversation.clientName && conversation.clientName !== 'Cliente WhatsApp' 
          ? conversation.clientName 
          : 'Cliente WhatsApp';

        const ticket = await WalkInService.createTicket({
          businessId: business.id,
          type: 'appointment',
          clientName: clientName,
          clientPhone: conversation.clientPhone,
          styleName: `${matchedService.name} ($${matchedService.priceCOP.toLocaleString('es-CO')} COP)`,
          stylePhotoUrl: '/styles/el-siete-colombiano.jpg',
          specialNote: `Agendado automáticamente por el Agente IA de WhatsApp`,
          barberName: matchedBarber.fullName,
          appointmentDate: selectedDate,
          appointmentTime: selectedTime,
          priceCOP: matchedService.priceCOP,
        });

        // Disparo de notificaciones
        WhatsAppService.sendAppointmentConfirmation({
          business,
          clientName: clientName,
          clientPhone: conversation.clientPhone,
          barberName: matchedBarber.fullName,
          serviceName: matchedService.name,
          priceCOP: matchedService.priceCOP,
          date: selectedDate,
          time: selectedTime,
          appointmentId: ticket.id,
        });

        return {
          replyText: `¡Listo, ${clientName}! 🎉 He confirmado tu cita en *${business.name}*:\n\n` +
            `💈 *Servicio:* ${matchedService.name}\n` +
            `✂️ *Barbero:* ${matchedBarber.fullName}\n` +
            `📅 *Fecha:* ${selectedDate}\n` +
            `⏰ *Hora:* ${selectedTime}\n` +
            `💰 *Valor:* $${matchedService.priceCOP.toLocaleString('es-CO')} COP\n\n` +
            `📍 *Ubicación:* ${business.address}, ${business.city}.\n\n` +
            `¡Te esperamos con gusto! Si necesitas modificarla o cancelar, solo escríbeme por aquí.`,
          toolExecuted: 'crear_reserva_automatica',
          appointmentCreated: {
            id: ticket.id,
            clientName: clientName,
            serviceName: matchedService.name,
            barberName: matchedBarber.fullName,
            date: selectedDate,
            time: selectedTime,
            priceCOP: matchedService.priceCOP,
          },
        };
      }

      // Si pide agendar pero no dio hora precisa, le damos las opciones
      const barberListStr = barbers.slice(0, 3).map(b => `• ${b.fullName}`).join('\n');
      return {
        replyText: `¡Con mucho gusto te ayudo a agendar tu cita en *${business.name}*! 💈\n\n` +
          `Tenemos disponibilidad para hoy y mañana con nuestros barberos:\n${barberListStr}\n\n` +
          `¿Para qué fecha, a qué hora y con qué barbero te gustaría tu turno? (Ej: *"Mañana a las 4pm con ${barbers[0]?.fullName || 'Carlos'} para corte y barba"*).`,
        toolExecuted: 'consultar_disponibilidad',
      };
    }

    // B. Consulta de Precios / Servicios
    if (msg.includes('precio') || msg.includes('cuanto vale') || msg.includes('cuanto cuesta') || msg.includes('servicios') || msg.includes('catalogo') || msg.includes('corte')) {
      const topServices = services.slice(0, 5);
      const serviceListText = topServices
        .map(s => `💈 *${s.name}*: $${s.priceCOP.toLocaleString('es-CO')} COP (${s.durationMin || 30} min)`)
        .join('\n');

      return {
        replyText: `¡Hola! Aquí tienes nuestros servicios y precios en *${business.name}*:\n\n${serviceListText}\n\n` +
          `✨ *Todos nuestros combos incluyen asesoría de imagen y bebida de cortesía.*\n\n` +
          `¿Te gustaría agendar una cita para alguno de estos servicios?`,
        toolExecuted: 'consultar_servicios_y_precios',
      };
    }

    // C. Consulta de Horarios / Ubicación / Dirección
    if (msg.includes('donde') || msg.includes('direccion') || msg.includes('ubicacion') || msg.includes('queda') || msg.includes('abren') || msg.includes('horario') || msg.includes('cierran')) {
      const scheduleSummary = business.schedules && business.schedules.length > 0
        ? `Lunes a Sábado de ${business.schedules[0].openTime} a ${business.schedules[0].closeTime}`
        : 'Lunes a Sábado de 08:00 AM a 08:00 PM';

      return {
        replyText: `📍 *Ubicación de ${business.name}:*\n` +
          `Dirección: ${business.address || 'Calle principal'}, ${business.city}.\n` +
          (business.neighborhood ? `Barrio: ${business.neighborhood}\n` : '') +
          `🕒 *Horario de Atención:* ${scheduleSummary}.\n\n` +
          `🚗 Contamos con bahía de parqueo para clientes.\n\n` +
          `¿Deseas que te reservemos un turno?`,
        toolExecuted: 'consultar_horarios_y_ubicacion',
      };
    }

    // D. Medios de pago / FAQ
    if (msg.includes('pago') || msg.includes('tarjeta') || msg.includes('nequi') || msg.includes('daviplata') || msg.includes('transferencia')) {
      return {
        replyText: `💳 En *${business.name}* recibimos:\n` +
          `• Efectivo\n` +
          `• Nequi y Daviplata\n` +
          `• Tarjetas Débito y Crédito (todas las franquicias)\n` +
          `• Transferencia Bancolombia\n\n` +
          `¿En qué más te puedo colaborar hoy?`,
        toolExecuted: 'consultar_medios_pago',
      };
    }

    // E. Saludo General por Defecto
    const greeting = config.personality === 'urbana_juvenil'
      ? `¡Qué tal, bro! 💈 Bienvenido a *${business.name}*. Soy ${config.agentName}.`
      : `¡Hola! 👋 Bienvenido a *${business.name}*. Soy ${config.agentName}.`;

    return {
      replyText: `${greeting}\n\n` +
        `¿En qué te puedo colaborar hoy?\n` +
        `1️⃣ Agendar una cita\n` +
        `2️⃣ Consultar servicios y precios\n` +
        `3️⃣ Ver barberos disponibles\n` +
        `4️⃣ Ubicación y horarios\n\n` +
        `Solo dime qué necesitas y con gusto te ayudo.`,
      toolExecuted: 'saludo_general',
    };
  }

  /**
   * Llamada al motor de OpenAI si el usuario tiene API Key
   */
  private static async callOpenAIEngine(params: {
    config: WhatsAppAgentConfig;
    business: Business;
    services: any[];
    barbers: any[];
    conversation: WhatsAppConversation;
    customerMessage: string;
  }): Promise<AgentProcessResult | null> {
    const { config, business, services, barbers, conversation, customerMessage } = params;

    const catalogContext = services.map(s => `- ${s.name}: $${s.priceCOP} COP (${s.durationMin || 30} min)`).join('\n');
    const teamContext = barbers.map(b => `- ${b.fullName} (${b.specialties?.join(', ') || 'Barbero profesional'})`).join('\n');

    const systemPrompt = `${config.systemPrompt}
Negocio: ${business.name}
Ciudad: ${business.city}, Dirección: ${business.address}
Teléfono: ${business.phone}

CATÁLOGO DE SERVICIOS Y PRECIOS:
${catalogContext}

EQUIPO DE BARBEROS:
${teamContext}

BASE DE CONOCIMIENTO:
${config.knowledgeBase}

INSTRUCCIONES:
1. Responde de forma muy concisa, cordial y directa como si fueras un mensaje de WhatsApp.
2. Si el cliente quiere agendar, recopila: Servicio, Barbero (o cualquiera), Fecha y Hora.
3. Utiliza emojis con moderación para mantener un estilo moderno.
4. Siempre da precios en pesos colombianos ($ COP).`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversation.messages.slice(-6).map(m => ({
        role: m.sender === 'client' ? 'user' : 'assistant',
        content: m.text,
      })),
      { role: 'user', content: customerMessage },
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.modelName || 'gpt-4o-mini',
        messages,
        temperature: 0.7,
        max_tokens: 350,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    const replyText = data.choices?.[0]?.message?.content || '';

    return {
      replyText,
      toolExecuted: 'openai_chat_completion',
    };
  }
}
