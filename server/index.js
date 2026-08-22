// ==========================================================================
// BARBERIA_PRO - Real WhatsApp Baileys Microservice (Open Source MIT)
// Real-time WhatsApp Web Socket Engine & AI Assistant Bridge
// ==========================================================================

import express from 'express';
import cors from 'cors';
import pino from 'pino';
import QRCode from 'qrcode';
import {
  default as makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion
} from '@whiskeysockets/baileys';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const AUTH_DIR = path.join(__dirname, 'auth_info_baileys');

if (!fs.existsSync(AUTH_DIR)) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
}

// Global WhatsApp Client State
let sock = null;
let currentQRCode = null;
let connectionStatus = 'disconnected'; // 'disconnected' | 'pairing' | 'connected'
let connectedPhone = null;
let latestMessages = [];

// Logger silencioso para Baileys
const logger = pino({ level: 'silent' });

async function initWhatsApp() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
      version,
      logger,
      printQRInTerminal: false,
      auth: state,
      browser: ['BARBERIA_PRO Agent', 'Chrome', '1.0.0'],
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        connectionStatus = 'pairing';
        try {
          currentQRCode = await QRCode.toDataURL(qr);
          console.log('[Baileys] Nuevo Código QR de WhatsApp generado.');
        } catch (err) {
          console.error('[Baileys] Error convirtiendo QR a imagen:', err);
        }
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        console.log(`[Baileys] Conexión cerrada. Razón: ${statusCode}. Reconectando: ${shouldReconnect}`);

        connectionStatus = 'disconnected';
        currentQRCode = null;
        connectedPhone = null;

        if (shouldReconnect) {
          setTimeout(initWhatsApp, 3000);
        } else {
          // Si cerró sesión, borrar credenciales
          try {
            fs.rmSync(AUTH_DIR, { recursive: true, force: true });
          } catch (e) {}
          setTimeout(initWhatsApp, 2000);
        }
      } else if (connection === 'open') {
        connectionStatus = 'connected';
        currentQRCode = null;
        connectedPhone = sock.user?.id ? sock.user.id.split(':')[0] : 'Conectado';
        console.log(`[Baileys] ¡WhatsApp vinculado exitosamente con el teléfono: ${connectedPhone}!`);
      }
    });

    // Escuchar mensajes entrantes en WhatsApp
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return;

      for (const msg of messages) {
        // Ignorar mensajes enviados por el propio bot
        if (msg.key.fromMe) continue;

        const senderJid = msg.key.remoteJid;
        // Ignorar grupos o estados
        if (senderJid.endsWith('@g.us') || senderJid === 'status@broadcast') continue;

        const senderPhone = senderJid.replace('@s.whatsapp.net', '');
        const clientName = msg.pushName || `Cliente ${senderPhone}`;
        const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';

        if (!text.trim()) continue;

        console.log(`[Baileys Mensaje Recibido] De: ${clientName} (${senderPhone}) | Texto: "${text}"`);

        latestMessages.unshift({
          id: msg.key.id,
          senderPhone,
          clientName,
          text,
          timestamp: new Date().toISOString(),
        });
        if (latestMessages.length > 50) latestMessages.pop();

        // Auto-respuesta con inteligencia de barbería
        try {
          const reply = await generateAutonomousReply(text, clientName);
          if (reply) {
            await sock.sendMessage(senderJid, { text: reply });
            console.log(`[Baileys Respuesta Enviada] A: ${senderPhone} | Respuesta: "${reply.slice(0, 60)}..."`);
          }
        } catch (err) {
          console.error('[Baileys] Error respondiendo mensaje:', err);
        }
      }
    });
  } catch (error) {
    console.error('[Baileys] Error iniciando socket:', error);
    setTimeout(initWhatsApp, 5000);
  }
}

// Generador de respuestas inteligentes integrado en el servidor
async function generateAutonomousReply(customerText, clientName) {
  const msg = customerText.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (msg.includes('precio') || msg.includes('cuanto vale') || msg.includes('servicios') || msg.includes('corte')) {
    return `¡Hola ${clientName}! 💈 Aquí tienes nuestros servicios y precios:\n\n` +
      `• *Corte Clásico:* $35.000 COP (30 min)\n` +
      `• *Arreglo de Barba & Perfilado:* $25.000 COP (25 min)\n` +
      `• *Combo Corte + Barba VIP:* $50.000 COP (50 min)\n\n` +
      `✨ Todos nuestros combos incluyen bebida de cortesía.\n¿Te gustaría apartar un turno para hoy?`;
  }

  if (msg.includes('agendar') || msg.includes('cita') || msg.includes('turno') || msg.includes('hoy') || msg.includes('manana')) {
    return `¡Con gusto, ${clientName}! 📅 Para agendar tu turno, indícame por favor:\n` +
      `1. ¿Qué servicio deseas?\n` +
      `2. ¿Para qué fecha y hora te gustaría?\n` +
      `3. ¿Tienes algún barbero de preferencia (o el de turno)?`;
  }

  if (msg.includes('donde') || msg.includes('direccion') || msg.includes('ubicacion') || msg.includes('horario')) {
    return `📍 *Ubicación de la Barbería:*\n` +
      `Atendemos de Lunes a Sábado de 08:00 AM a 08:00 PM.\n` +
      `Contamos con bahía de parqueo frente al local.\n\n` +
      `¿Deseas que te reservemos un espacio?`;
  }

  if (msg.includes('nequi') || msg.includes('daviplata') || msg.includes('pago') || msg.includes('tarjeta')) {
    return `💳 Recibimos Efectivo, Nequi, Daviplata y todas las tarjetas Débito/Crédito.\n¿En qué más te colaboramos?`;
  }

  return `¡Hola ${clientName}! 👋 Bienvenido a nuestra Barbería. Soy el Asistente Virtual.\n\n` +
    `¿En qué te puedo colaborar hoy?\n` +
    `1️⃣ Agendar una cita\n` +
    `2️⃣ Consultar precios y servicios\n` +
    `3️⃣ Horarios y ubicación\n\n` +
    `Solo dime qué necesitas y con gusto te ayudo.`;
}

// --------------------------------------------------------------------------
// REST API ENDPOINTS
// --------------------------------------------------------------------------

// 1. Estado de conexión
app.get('/api/status', (req, res) => {
  res.json({
    status: connectionStatus,
    phone: connectedPhone,
    hasQR: Boolean(currentQRCode),
    qrCode: currentQRCode,
    battery: 96,
  });
});

// 2. Obtener QR code activo
app.get('/api/qr', (req, res) => {
  res.json({
    status: connectionStatus,
    qrCode: currentQRCode,
  });
});

// 3. Enviar mensaje de WhatsApp a cualquier número
app.post('/api/send', async (req, res) => {
  const { phone, message } = req.body;
  if (!sock || connectionStatus !== 'connected') {
    return res.status(400).json({ success: false, error: 'WhatsApp no está conectado todavía.' });
  }

  try {
    const cleanPhone = phone.replace(/\D/g, '');
    const jid = `${cleanPhone}@s.whatsapp.net`;
    await sock.sendMessage(jid, { text: message });
    res.json({ success: true, message: 'Mensaje enviado exitosamente por WhatsApp real' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. Desconectar WhatsApp / Cerrar sesión
app.post('/api/disconnect', async (req, res) => {
  try {
    if (sock) {
      await sock.logout();
    }
    fs.rmSync(AUTH_DIR, { recursive: true, force: true });
    connectionStatus = 'disconnected';
    currentQRCode = null;
    connectedPhone = null;
    setTimeout(initWhatsApp, 1500);
    res.json({ success: true, message: 'Sesión cerrada correctamente' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. Últimos mensajes recibidos
app.get('/api/messages', (req, res) => {
  res.json({ messages: latestMessages });
});

// Iniciar Servidor
app.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`🚀 Microservicio Baileys WhatsApp corriendo en http://localhost:${PORT}`);
  console.log(`==================================================\n`);
  initWhatsApp();
});
