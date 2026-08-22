import React, { useState, useEffect, useRef } from 'react';
import {
  Business,
  WhatsAppNotificationConfig,
  WhatsAppConversation,
  WhatsAppChatMessage,
  WhatsAppAgentConfig
} from '../core/types';
import { WhatsAppService } from '../core/whatsapp/whatsappService';
import { BaileysBridge, BaileysSessionState } from '../core/whatsapp/baileysBridge';
import { AgentService } from '../core/ai/agentService';
import {
  Smartphone,
  Bot,
  MessageSquare,
  QrCode,
  Sliders,
  Play,
  Send,
  UserCheck,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Zap,
  Clock,
  Check,
  Key,
  Flame,
  Power
} from 'lucide-react';

interface WhatsAppAgentHubProps {
  business: Business;
  onBusinessUpdate?: (updated: Business) => void;
}

export const WhatsAppAgentHub: React.FC<WhatsAppAgentHubProps> = ({ business }) => {
  // Sub-tabs
  const [subTab, setSubTab] = useState<'inbox' | 'qr_connect' | 'ai_config' | 'playground' | 'logs'>('inbox');

  // WhatsApp & Baileys State
  const [config, setConfig] = useState<WhatsAppNotificationConfig>(() => WhatsAppService.getConfig(business));
  const [session, setSession] = useState<BaileysSessionState>(() => BaileysBridge.getSession(business.id, business.whatsapp || business.phone));
  const [conversations, setConversations] = useState<WhatsAppConversation[]>(() => WhatsAppService.getConversations(business));
  const [selectedConvId, setSelectedConvId] = useState<string>(() => conversations[0]?.id || '');
  const [filterMode, setFilterMode] = useState<'all' | 'ai_active' | 'human_takeover'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Inbox Chat Input
  const [manualText, setManualText] = useState('');
  const [isSimulatingClient, setIsSimulatingClient] = useState(false);
  const [simulatedClientText, setSimulatedClientText] = useState('');
  const [isProcessingAI, setIsProcessingAI] = useState(false);

  // Playground State
  const [playgroundMessages, setPlaygroundMessages] = useState<WhatsAppChatMessage[]>([
    {
      id: 'pg_1',
      conversationId: 'playground',
      sender: 'agent_ai',
      senderName: config.agentConfig?.agentName || 'Andrés - Asistente Virtual',
      text: `¡Hola! 👋 Soy el Asistente Virtual de ${business.name}. Puedes preguntarme por servicios, precios, disponibilidad o pedirme que te agende una cita. ¿Cómo te ayudo?`,
      timestamp: new Date().toISOString(),
      status: 'delivered',
    },
  ]);
  const [playgroundInput, setPlaygroundInput] = useState('');
  const [playgroundLoading, setPlaygroundLoading] = useState(false);

  // Config Form State
  const [agentForm, setAgentForm] = useState<WhatsAppAgentConfig>(() => config.agentConfig || AgentService.getDefaultAgentConfig(business.name));
  const [configSavedToast, setConfigSavedToast] = useState(false);

  // Auto-scroll chat ref
  const chatEndRef = useRef<HTMLDivElement>(null);
  const playgroundEndRef = useRef<HTMLDivElement>(null);

  // Active selected conversation
  const activeConversation = conversations.find(c => c.id === selectedConvId) || conversations[0];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages, isProcessingAI]);

  useEffect(() => {
    playgroundEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [playgroundMessages, playgroundLoading]);

  // Polling automático del microservicio Baileys en vivo (http://localhost:3001)
  useEffect(() => {
    const checkLiveServer = async () => {
      const liveSession = await BaileysBridge.fetchLiveServerStatus(business.id);
      if (liveSession) {
        setSession(liveSession);
      }
    };

    checkLiveServer();
    const interval = setInterval(checkLiveServer, 4000);
    return () => clearInterval(interval);
  }, [business.id]);

  // Handle Save Agent Config
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedConfig: WhatsAppNotificationConfig = {
      ...config,
      agentConfig: agentForm,
    };
    WhatsAppService.saveConfig(business.id, updatedConfig);
    setConfig(updatedConfig);
    setConfigSavedToast(true);
    setTimeout(() => setConfigSavedToast(false), 3000);
  };

  // Handle Baileys QR Generation
  const handleGenerateQR = () => {
    const newSession = BaileysBridge.generatePairingQR(business.id);
    setSession(newSession);
  };

  // Handle Baileys Pairing Simulation (Scan QR)
  const handleSimulateScan = () => {
    const newSession = BaileysBridge.completePairing(business.id, business.whatsapp || business.phone || '3102365163');
    setSession(newSession);
    const updatedConfig: WhatsAppNotificationConfig = {
      ...config,
      sessionStatus: 'connected',
    };
    WhatsAppService.saveConfig(business.id, updatedConfig);
    setConfig(updatedConfig);
  };

  // Handle Baileys Disconnect
  const handleDisconnect = async () => {
    const newSession = await BaileysBridge.disconnect(business.id);
    setSession(newSession);
    const updatedConfig: WhatsAppNotificationConfig = {
      ...config,
      sessionStatus: 'disconnected',
    };
    WhatsAppService.saveConfig(business.id, updatedConfig);
    setConfig(updatedConfig);
  };

  // Send Manual Message (Owner Takeover)
  const handleSendManualMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!manualText.trim() || !activeConversation) return;

    WhatsAppService.sendManualMessage({
      businessId: business.id,
      conversationId: activeConversation.id,
      text: manualText.trim(),
      actorName: business.ownerName || 'Álvaro (Owner)',
    });

    setConversations(WhatsAppService.getConversations(business));
    setManualText('');
  };

  // Toggle Human Takeover
  const handleToggleTakeover = () => {
    if (!activeConversation) return;
    const nextStatus = activeConversation.status === 'ai_active' ? 'human_takeover' : 'ai_active';
    WhatsAppService.toggleTakeover(
      business.id,
      activeConversation.id,
      nextStatus,
      business.ownerName || 'Álvaro (Owner)'
    );
    setConversations(WhatsAppService.getConversations(business));
  };

  // Simulate Incoming Client Message to test AI in real conversation
  const handleSimulateIncomingClientMessage = async (customText?: string) => {
    const textToSend = customText || simulatedClientText;
    if (!textToSend.trim() || !activeConversation) return;

    setIsProcessingAI(true);
    setSimulatedClientText('');

    // Process through WhatsAppService which invokes AgentService
    await WhatsAppService.receiveIncomingMessage({
      business,
      conversationId: activeConversation.id,
      clientPhone: activeConversation.clientPhone,
      clientName: activeConversation.clientName,
      text: textToSend.trim(),
    });

    setConversations(WhatsAppService.getConversations(business));
    setIsProcessingAI(false);
    setIsSimulatingClient(false);
  };

  // Quick Action Buttons
  const handleQuickAction = (text: string) => {
    setManualText(text);
  };

  // Playground Message Sender
  const handleSendPlayground = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playgroundInput.trim() || playgroundLoading) return;

    const userText = playgroundInput.trim();
    setPlaygroundInput('');

    const newMsg: WhatsAppChatMessage = {
      id: `pg_user_${Date.now()}`,
      conversationId: 'playground',
      sender: 'client',
      senderName: 'Tú (Cliente Prueba)',
      text: userText,
      timestamp: new Date().toISOString(),
      status: 'delivered',
    };

    setPlaygroundMessages(prev => [...prev, newMsg]);
    setPlaygroundLoading(true);

    try {
      // Create mock conversation container for agent
      const mockConv: WhatsAppConversation = {
        id: 'playground',
        businessId: business.id,
        clientPhone: '+57 300 000 0000',
        clientName: 'Cliente de Prueba',
        lastMessageText: userText,
        lastMessageAt: new Date().toISOString(),
        unreadCount: 0,
        status: 'ai_active',
        messages: [...playgroundMessages, newMsg],
      };

      const result = await AgentService.processCustomerMessage({
        business,
        conversation: mockConv,
        customerMessage: userText,
      });

      const aiReply: WhatsAppChatMessage = {
        id: `pg_ai_${Date.now()}`,
        conversationId: 'playground',
        sender: 'agent_ai',
        senderName: agentForm.agentName || 'Andrés - Asistente Virtual',
        text: result.replyText || 'He procesado tu solicitud con éxito.',
        timestamp: new Date().toISOString(),
        status: 'delivered',
        toolCalls: result.toolExecuted ? [{ toolName: result.toolExecuted, input: {}, output: {} }] : undefined,
        appointmentCreatedId: result.appointmentCreated?.id,
      };

      setPlaygroundMessages(prev => [...prev, aiReply]);
    } catch (err) {
      console.error(err);
    } finally {
      setPlaygroundLoading(false);
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter(c => {
    if (filterMode === 'ai_active' && c.status !== 'ai_active') return false;
    if (filterMode === 'human_takeover' && c.status !== 'human_takeover') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.clientName.toLowerCase().includes(q) ||
        c.clientPhone.includes(q) ||
        c.lastMessageText.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 text-xs text-zinc-300 animate-fade-in">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-emerald-950/40 border border-emerald-500/30 p-5 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-2xl shrink-0">
            <Bot className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Arquitectura OpenLivery
              </span>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                <Flame className="w-3 h-3" /> Auto-Agendamiento 24/7
              </span>
            </div>
            <h2 className="text-xl font-black text-white mt-1">
              Agente IA de WhatsApp & Inbox en Vivo
            </h2>
            <p className="text-zinc-400 text-xs mt-0.5 max-w-xl">
              Atención inteligente, respuestas de precios y agendamiento autónomo en tiempo real con puente Baileys (QR) y toma de control manual (Human Takeover).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center gap-2 text-[11px]">
            <span className={`w-2.5 h-2.5 rounded-full ${session.status === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <div>
              <div className="font-bold text-white">
                {session.status === 'connected' ? 'WhatsApp Conectado' : 'Esperando Vinculación QR'}
              </div>
              <div className="text-[10px] text-zinc-500 font-mono">
                {session.connectedPhone || config.phoneNumber}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* NAVIGATION SUB-TABS */}
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 pb-3">
        <button
          onClick={() => setSubTab('inbox')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-bold transition-all text-xs ${
            subTab === 'inbox'
              ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
              : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Inbox en Vivo</span>
          {conversations.some(c => c.unreadCount > 0) && (
            <span className="px-1.5 py-0.2 bg-red-500 text-white rounded-full text-[9px] font-black">
              {conversations.reduce((acc, c) => acc + c.unreadCount, 0)}
            </span>
          )}
        </button>

        <button
          onClick={() => setSubTab('qr_connect')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-bold transition-all text-xs ${
            subTab === 'qr_connect'
              ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
              : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Conexión QR (Baileys)</span>
        </button>

        <button
          onClick={() => setSubTab('ai_config')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-bold transition-all text-xs ${
            subTab === 'ai_config'
              ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
              : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Configuración IA & Conocimiento</span>
        </button>

        <button
          onClick={() => setSubTab('playground')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-bold transition-all text-xs ${
            subTab === 'playground'
              ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
              : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300'
          }`}
        >
          <Play className="w-4 h-4" />
          <span>Playground de Pruebas</span>
        </button>

        <button
          onClick={() => setSubTab('logs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-bold transition-all text-xs ${
            subTab === 'logs'
              ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
              : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Notificaciones & Logs</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUBTAB 1: LIVE INBOX & HUMAN TAKEOVER                                    */}
      {/* ========================================================================= */}
      {subTab === 'inbox' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[650px]">
          {/* CONVERSATION LIST (4 cols) */}
          <div className="lg:col-span-4 bg-zinc-900 border border-zinc-800 rounded-3xl p-4 flex flex-col h-full overflow-hidden shadow-xl">
            {/* Search & Filter */}
            <div className="space-y-2.5 pb-3 border-b border-zinc-800">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar por cliente o teléfono..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-1.5 text-[10px]">
                <button
                  onClick={() => setFilterMode('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    filterMode === 'all' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Todos ({conversations.length})
                </button>
                <button
                  onClick={() => setFilterMode('ai_active')}
                  className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${
                    filterMode === 'ai_active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Bot className="w-3 h-3" /> IA ({conversations.filter(c => c.status === 'ai_active').length})
                </button>
                <button
                  onClick={() => setFilterMode('human_takeover')}
                  className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${
                    filterMode === 'human_takeover' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <UserCheck className="w-3 h-3" /> Humano ({conversations.filter(c => c.status === 'human_takeover').length})
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-2 mt-3 pr-1">
              {filteredConversations.length === 0 ? (
                <div className="text-center py-12 text-zinc-500">
                  <MessageSquare className="w-8 h-8 mx-auto opacity-40 mb-2" />
                  <p>No hay conversaciones con este filtro</p>
                </div>
              ) : (
                filteredConversations.map(conv => {
                  const isSelected = conv.id === activeConversation?.id;
                  return (
                    <div
                      key={conv.id}
                      onClick={() => {
                        setSelectedConvId(conv.id);
                        WhatsAppService.markConversationAsRead(business.id, conv.id);
                        setConversations(WhatsAppService.getConversations(business));
                      }}
                      className={`p-3 rounded-2xl cursor-pointer transition-all border ${
                        isSelected
                          ? 'bg-zinc-800/90 border-emerald-500/50 shadow-md'
                          : 'bg-zinc-950/60 border-zinc-800/80 hover:bg-zinc-800/50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-bold text-white truncate text-xs">
                          {conv.clientName}
                        </span>
                        <span className="text-[10px] text-zinc-500 shrink-0">
                          {new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="text-[11px] text-zinc-400 truncate mb-2">
                        {conv.lastMessageText}
                      </div>

                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-mono text-zinc-500">{conv.clientPhone}</span>
                        <div className="flex items-center gap-1.5">
                          {conv.status === 'ai_active' ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold flex items-center gap-1">
                              <Bot className="w-2.5 h-2.5" /> IA
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold flex items-center gap-1">
                              <UserCheck className="w-2.5 h-2.5" /> Humano
                            </span>
                          )}

                          {conv.unreadCount > 0 && (
                            <span className="w-4 h-4 rounded-full bg-emerald-500 text-black font-black flex items-center justify-center text-[9px]">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ACTIVE CHAT WINDOW (8 cols) */}
          <div className="lg:col-span-8 bg-zinc-900 border border-zinc-800 rounded-3xl flex flex-col h-full overflow-hidden shadow-xl">
            {activeConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-sm">
                      {activeConversation.clientName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{activeConversation.clientName}</span>
                        <span className="text-zinc-500 font-mono text-[11px]">({activeConversation.clientPhone})</span>
                      </div>
                      <div className="text-[10px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
                        <span>Estado:</span>
                        {activeConversation.status === 'ai_active' ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <Bot className="w-3 h-3" /> Agente IA respondiendo automáticamente
                          </span>
                        ) : (
                          <span className="text-amber-400 font-bold flex items-center gap-1">
                            <UserCheck className="w-3 h-3" /> Control Manual por {activeConversation.takeoverBy || 'Owner'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Takeover Toggle & Simulate Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleToggleTakeover}
                      className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all text-xs ${
                        activeConversation.status === 'ai_active'
                          ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30'
                          : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
                      }`}
                    >
                      {activeConversation.status === 'ai_active' ? (
                        <>
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Tomar Control Manual</span>
                        </>
                      ) : (
                        <>
                          <Bot className="w-3.5 h-3.5" />
                          <span>Devolver a la IA</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setIsSimulatingClient(!isSimulatingClient)}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-bold flex items-center gap-1.5 text-xs border border-zinc-700"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Simular Cliente</span>
                    </button>
                  </div>
                </div>

                {/* Simulate Client Prompt Box (Collapsible) */}
                {isSimulatingClient && (
                  <div className="p-3 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2">
                    <span className="text-amber-400 font-bold shrink-0 text-[11px]">💬 Mensaje de prueba del cliente:</span>
                    <input
                      type="text"
                      placeholder="Ej: Hola, quiero una cita hoy a las 5pm para corte y barba..."
                      value={simulatedClientText}
                      onChange={e => setSimulatedClientText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSimulateIncomingClientMessage()}
                      className="flex-1 bg-zinc-950 border border-amber-500/30 rounded-xl px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none"
                    />
                    <button
                      onClick={() => handleSimulateIncomingClientMessage()}
                      disabled={isProcessingAI || !simulatedClientText.trim()}
                      className="px-3 py-1.5 bg-amber-500 text-black font-bold rounded-xl disabled:opacity-50 flex items-center gap-1 text-xs"
                    >
                      <span>Enviar</span>
                    </button>
                  </div>
                )}

                {/* Message Stream */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-950/40">
                  {activeConversation.messages.map((msg, index) => {
                    const isClient = msg.sender === 'client';
                    const isAI = msg.sender === 'agent_ai';
                    const isOwner = msg.sender === 'owner_takeover';

                    return (
                      <div
                        key={msg.id || index}
                        className={`flex flex-col ${isClient ? 'items-start' : 'items-end'}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px]">
                          {isClient && <span className="font-bold text-zinc-400">{msg.senderName}</span>}
                          {isAI && (
                            <span className="font-bold text-emerald-400 flex items-center gap-1">
                              <Bot className="w-3 h-3" /> {msg.senderName}
                            </span>
                          )}
                          {isOwner && (
                            <span className="font-bold text-amber-400 flex items-center gap-1">
                              <UserCheck className="w-3 h-3" /> {msg.senderName} (Takeover)
                            </span>
                          )}
                          <span className="text-zinc-600">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs whitespace-pre-line leading-relaxed shadow-md ${
                            isClient
                              ? 'bg-zinc-800 text-white rounded-tl-sm border border-zinc-700/50'
                              : isAI
                              ? 'bg-emerald-950/80 text-emerald-100 rounded-tr-sm border border-emerald-500/40'
                              : 'bg-amber-950/80 text-amber-100 rounded-tr-sm border border-amber-500/40'
                          }`}
                        >
                          {msg.text}

                          {/* Tool call badge */}
                          {msg.toolCalls && msg.toolCalls.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-emerald-500/20 flex items-center gap-1.5 text-[10px] text-emerald-300 font-mono">
                              <Zap className="w-3 h-3 text-emerald-400 shrink-0" />
                              <span>Ejecutó: {msg.toolCalls[0].toolName}</span>
                            </div>
                          )}

                          {msg.appointmentCreatedId && (
                            <div className="mt-2 p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-[10px] text-emerald-300 font-bold">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              <span>Cita registrada con éxito en el sistema</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {isProcessingAI && (
                    <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs w-fit animate-pulse">
                      <Bot className="w-4 h-4 animate-spin" />
                      <span>El Agente de IA está pensando la respuesta...</span>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>

                {/* Quick Action Chips */}
                <div className="px-4 py-2 bg-zinc-950/80 border-t border-zinc-800 flex items-center gap-2 overflow-x-auto text-[11px]">
                  <span className="text-zinc-500 text-[10px] font-bold uppercase shrink-0">Respuestas rápidas:</span>
                  <button
                    onClick={() => handleQuickAction('¡Hola! Claro que sí, con gusto te colaboramos. ¿Para qué hora te gustaría tu turno hoy?')}
                    className="px-2.5 py-1 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 shrink-0"
                  >
                    📅 Ofrecer Cita Hoy
                  </button>
                  <button
                    onClick={() => handleQuickAction(`¡Hola! En ${business.name} ofrecemos Corte Clásico ($35.000), Barba Premium ($25.000) y Combos VIP. ¿Deseas ver más detalles?`)}
                    className="px-2.5 py-1 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 shrink-0"
                  >
                    💈 Enviar Precios
                  </button>
                  <button
                    onClick={() => handleQuickAction(`Estamos ubicados en ${business.address}, ${business.city}. Contamos con parqueadero para clientes.`)}
                    className="px-2.5 py-1 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 shrink-0"
                  >
                    📍 Enviar Ubicación
                  </button>
                  <button
                    onClick={() => handleQuickAction('Recibimos Nequi, Daviplata, Efectivo y Tarjetas Débito/Crédito.')}
                    className="px-2.5 py-1 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 shrink-0"
                  >
                    💳 Medios de Pago
                  </button>
                </div>

                {/* Chat Input */}
                <form onSubmit={handleSendManualMessage} className="p-3 bg-zinc-950 border-t border-zinc-800 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={
                      activeConversation.status === 'ai_active'
                        ? 'Escribe un mensaje para responder manualmente (tomará el control)...'
                        : 'Escribe tu mensaje como barbero/owner...'
                    }
                    value={manualText}
                    onChange={e => setManualText(e.target.value)}
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    disabled={!manualText.trim()}
                    className="px-4 py-2.5 bg-emerald-500 text-black font-black rounded-2xl hover:bg-emerald-400 disabled:opacity-40 transition-all flex items-center gap-1.5 text-xs shrink-0"
                  >
                    <Send className="w-4 h-4" />
                    <span>Enviar</span>
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-zinc-500 text-center">
                <MessageSquare className="w-12 h-12 mb-3 opacity-30" />
                <h4 className="text-white font-bold text-sm">Ninguna conversación seleccionada</h4>
                <p className="text-xs text-zinc-400 mt-1 max-w-sm">
                  Selecciona una conversación del listado lateral para ver el historial y responder.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 2: QR CONNECTION (BAILEYS / WHATSAPP WEB)                        */}
      {/* ========================================================================= */}
      {subTab === 'qr_connect' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-fade-in">
          {/* QR Scan Area (7 cols) */}
          <div className="md:col-span-7 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-emerald-400" />
                  Vincular WhatsApp de {business.name}
                </h3>
                <p className="text-zinc-400 text-xs mt-0.5">
                  Conexión directa mediante microservicio Baileys (WhatsApp Web Multi-Dispositivo).
                </p>
              </div>

              <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${
                session.status === 'connected'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              }`}>
                {session.status === 'connected' ? '🟢 CONECTADO' : '🟡 ESPERANDO ESCANEO'}
              </span>
            </div>

            {/* QR Card Container */}
            <div className="flex flex-col items-center justify-center py-6 px-4 bg-zinc-950 rounded-2xl border border-zinc-800/80 text-center space-y-4">
              {session.status === 'connected' ? (
                <div className="space-y-4 py-4">
                  <div className="w-20 h-20 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <div>
                    <h4 className="text-white font-black text-base">¡WhatsApp Vinculado y Activo!</h4>
                    <p className="text-zinc-400 text-xs mt-1 max-w-sm mx-auto">
                      El número <strong className="text-emerald-400">{session.connectedPhone || config.phoneNumber}</strong> está listo para recibir mensajes y auto-agendar citas.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      onClick={handleGenerateQR}
                      className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl flex items-center gap-2 text-xs"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Re-vincular Dispositivo</span>
                    </button>
                    <button
                      onClick={handleDisconnect}
                      className="px-4 py-2 bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 text-red-300 font-bold rounded-xl flex items-center gap-2 text-xs"
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>Desconectar</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {session.qrCodeUrl ? (
                    <div className="p-3 bg-white rounded-2xl shadow-2xl inline-block border-4 border-emerald-500/40 animate-pulse">
                      <img
                        src={session.qrCodeUrl}
                        alt="Código QR de WhatsApp"
                        className="w-56 h-56 object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-56 h-56 bg-zinc-900 rounded-2xl border border-zinc-800 flex items-center justify-center mx-auto text-zinc-600">
                      <QrCode className="w-16 h-16" />
                    </div>
                  )}

                  <div className="space-y-1">
                    <h4 className="text-white font-bold text-sm">Escanea este código con WhatsApp</h4>
                    <p className="text-zinc-400 text-xs max-w-xs mx-auto">
                      Abre WhatsApp en tu teléfono &gt; Ajustes &gt; Dispositivos vinculados &gt; Vincular un dispositivo.
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      onClick={handleSimulateScan}
                      className="px-4 py-2 bg-emerald-500 text-black font-black rounded-xl hover:bg-emerald-400 transition-all flex items-center gap-1.5 text-xs shadow-lg shadow-emerald-500/20"
                    >
                      <Check className="w-4 h-4" />
                      <span>Confirmar Escaneo (Simular)</span>
                    </button>
                    <button
                      onClick={handleGenerateQR}
                      className="px-3 py-2 bg-zinc-800 text-zinc-300 font-bold rounded-xl hover:bg-zinc-700 flex items-center gap-1.5 text-xs"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Generar Nuevo QR</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Connection Specs & Details (5 cols) */}
          <div className="md:col-span-5 space-y-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-4 shadow-xl">
              <h4 className="text-sm font-black text-white flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                Detalles del Dispositivo
              </h4>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 flex justify-between items-center">
                  <span className="text-zinc-400">Motor de Conexión:</span>
                  <span className="font-bold text-white">Baileys WebSocket Bridge</span>
                </div>
                <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 flex justify-between items-center">
                  <span className="text-zinc-400">Teléfono Registrado:</span>
                  <span className="font-mono font-bold text-emerald-400">{session.connectedPhone || config.phoneNumber}</span>
                </div>
                <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 flex justify-between items-center">
                  <span className="text-zinc-400">Batería del Teléfono:</span>
                  <span className="font-bold text-white">{session.batteryLevel || 95}% 🔋</span>
                </div>
                <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 flex justify-between items-center">
                  <span className="text-zinc-400">Licencia de Software:</span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-black text-[10px]">
                    MIT Open Source
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-5 space-y-3">
              <h4 className="text-sm font-black text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Ventajas de Baileys en BARBERIA_PRO
              </h4>
              <ul className="space-y-2 text-zinc-400 text-xs leading-relaxed">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Cero burocracia:</strong> No requieres verificación de empresa ni tarjeta de crédito con Meta.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Multi-número:</strong> Cada barbero o dueño puede conectar su propia línea al instante.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Historial sincronizado:</strong> Todas las conversaciones se reflejan en el WhatsApp del celular y en la app.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 3: AI CONFIGURATION & KNOWLEDGE BASE                             */}
      {/* ========================================================================= */}
      {subTab === 'ai_config' && (
        <form onSubmit={handleSaveConfig} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-6 shadow-xl animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Bot className="w-5 h-5 text-emerald-400" />
                Personalidad & Motor de Inteligencia Artificial
              </h3>
              <p className="text-zinc-400 text-xs mt-0.5">
                Configura cómo responde el asistente virtual de {business.name}, su tono y base de conocimiento.
              </p>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-500 text-black font-black rounded-2xl hover:bg-emerald-400 transition-all flex items-center gap-2 text-xs shadow-lg shadow-emerald-500/20"
            >
              <Check className="w-4 h-4" />
              <span>Guardar Configuración</span>
            </button>
          </div>

          {configSavedToast && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-300 font-bold flex items-center gap-2 text-xs animate-bounce">
              <CheckCircle2 className="w-4 h-4" />
              <span>¡Configuración del Agente IA guardada exitosamente!</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-zinc-400 font-bold uppercase text-[10px] mb-1">
                  Nombre del Asistente Virtual:
                </label>
                <input
                  type="text"
                  value={agentForm.agentName}
                  onChange={e => setAgentForm({ ...agentForm, agentName: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-bold"
                  placeholder="Ej: Andrés - Asistente Virtual"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-bold uppercase text-[10px] mb-1">
                  Tono & Personalidad:
                </label>
                <select
                  value={agentForm.personality}
                  onChange={e => setAgentForm({ ...agentForm, personality: e.target.value as any })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="amable_profesional">🎩 Amable & Profesional (Recomendado)</option>
                  <option value="urbana_juvenil">🔥 Urbana & Juvenil (Estilo Barbershop)</option>
                  <option value="elegante_vip">💎 Elegante VIP & Exclusivo</option>
                  <option value="directa_rapida">⚡ Directa & Rápida</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 font-bold uppercase text-[10px] mb-1">
                  Proveedor de IA / Motor de Inferencia:
                </label>
                <select
                  value={agentForm.llmProvider}
                  onChange={e => setAgentForm({ ...agentForm, llmProvider: e.target.value as any })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="smart_native">🚀 Motor Inteligente Nativo (Sin costo / Integrado)</option>
                  <option value="openai">🤖 OpenAI (GPT-4o Mini / GPT-4o)</option>
                  <option value="deepseek">⚡ DeepSeek AI (deepseek-chat)</option>
                  <option value="anthropic">🧠 Anthropic (Claude 3.5 Sonnet)</option>
                </select>
              </div>

              {agentForm.llmProvider === 'openai' && (
                <div>
                  <label className="block text-zinc-400 font-bold uppercase text-[10px] mb-1 flex items-center justify-between">
                    <span>OpenAI API Key:</span>
                    <span className="text-zinc-500 font-mono">sk-proj-...</span>
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={agentForm.apiKey || ''}
                      onChange={e => setAgentForm({ ...agentForm, apiKey: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                      placeholder="sk-proj-..."
                    />
                    <Key className="w-4 h-4 text-zinc-600 absolute right-3 top-3" />
                  </div>
                  <span className="text-[10px] text-zinc-500 mt-1 block">
                    Se almacena cifrada localmente para las solicitudes del tenant.
                  </span>
                </div>
              )}

              <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white text-xs">Auto-Agendamiento Autónomo</div>
                  <div className="text-[11px] text-zinc-500">
                    Permite al bot registrar citas directamente en la base de datos de la barbería.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={agentForm.autoBookingEnabled}
                  onChange={e => setAgentForm({ ...agentForm, autoBookingEnabled: e.target.checked })}
                  className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                />
              </div>
            </div>

            {/* Right Column: Knowledge Base */}
            <div className="space-y-4">
              <div>
                <label className="block text-zinc-400 font-bold uppercase text-[10px] mb-1">
                  Base de Conocimiento RAG (Políticas, Medios de Pago, FAQ):
                </label>
                <textarea
                  rows={6}
                  value={agentForm.knowledgeBase}
                  onChange={e => setAgentForm({ ...agentForm, knowledgeBase: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500 leading-relaxed font-mono"
                  placeholder="Escribe aquí datos clave que el bot debe saber (parqueadero, Nequi, etc.)..."
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-bold uppercase text-[10px] mb-1">
                  Prompt del Sistema (System Prompt):
                </label>
                <textarea
                  rows={4}
                  value={agentForm.systemPrompt}
                  onChange={e => setAgentForm({ ...agentForm, systemPrompt: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500 leading-relaxed font-mono"
                  placeholder="Instrucciones maestras para la IA..."
                />
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 4: PLAYGROUND DE PRUEBAS                                         */}
      {/* ========================================================================= */}
      {subTab === 'playground' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-xl animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Play className="w-5 h-5 text-emerald-400" />
                Playground de Pruebas en Vivo
              </h3>
              <p className="text-zinc-400 text-xs">
                Chatea con el agente tal como lo haría un cliente de WhatsApp para verificar sus respuestas.
              </p>
            </div>

            <button
              onClick={() => {
                setPlaygroundMessages([
                  {
                    id: 'pg_1',
                    conversationId: 'playground',
                    sender: 'agent_ai',
                    senderName: agentForm.agentName || 'Andrés - Asistente Virtual',
                    text: `¡Hola! 👋 Soy el Asistente Virtual de ${business.name}. ¿En qué te colaboro hoy?`,
                    timestamp: new Date().toISOString(),
                    status: 'delivered',
                  },
                ]);
              }}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl text-xs flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reiniciar Chat</span>
            </button>
          </div>

          {/* Test suggestions */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-[11px]">
            <span className="text-zinc-500 font-bold uppercase text-[10px] shrink-0">Pruebas sugeridas:</span>
            <button
              onClick={() => setPlaygroundInput('¿Cuánto cuesta el corte clásico y qué incluye?')}
              className="px-2.5 py-1 bg-zinc-950 border border-zinc-800 hover:border-emerald-500/50 rounded-xl text-zinc-300 shrink-0"
            >
              💈 Consultar Precios
            </button>
            <button
              onClick={() => setPlaygroundInput('¿Tienen espacio para hoy a las 5pm con el barbero Carlos?')}
              className="px-2.5 py-1 bg-zinc-950 border border-zinc-800 hover:border-emerald-500/50 rounded-xl text-zinc-300 shrink-0"
            >
              📅 Agendar Cita
            </button>
            <button
              onClick={() => setPlaygroundInput('¿Dónde están ubicados y qué medios de pago reciben?')}
              className="px-2.5 py-1 bg-zinc-950 border border-zinc-800 hover:border-emerald-500/50 rounded-xl text-zinc-300 shrink-0"
            >
              📍 Ubicación & Nequi
            </button>
          </div>

          {/* Playground Stream */}
          <div className="h-96 bg-zinc-950 rounded-2xl border border-zinc-800/80 p-4 overflow-y-auto space-y-3">
            {playgroundMessages.map((msg, idx) => {
              const isUser = msg.sender === 'client';
              return (
                <div key={idx} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                  <span className="text-[10px] text-zinc-500 mb-1 px-1">{msg.senderName}</span>
                  <div
                    className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-xs whitespace-pre-line leading-relaxed ${
                      isUser
                        ? 'bg-zinc-800 text-white rounded-tr-sm'
                        : 'bg-emerald-950/80 text-emerald-100 border border-emerald-500/30 rounded-tl-sm'
                    }`}
                  >
                    {msg.text}

                    {msg.toolCalls && (
                      <div className="mt-2 pt-2 border-t border-emerald-500/20 text-[10px] text-emerald-300 font-mono flex items-center gap-1">
                        <Zap className="w-3 h-3 text-emerald-400" />
                        <span>Ejecutó: {msg.toolCalls[0].toolName}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {playgroundLoading && (
              <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-500/10 text-emerald-300 text-xs w-fit animate-pulse">
                <Bot className="w-4 h-4 animate-spin" />
                <span>Generando respuesta inteligente...</span>
              </div>
            )}
            <div ref={playgroundEndRef} />
          </div>

          {/* Playground Input */}
          <form onSubmit={handleSendPlayground} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Escribe un mensaje de prueba..."
              value={playgroundInput}
              onChange={e => setPlaygroundInput(e.target.value)}
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={!playgroundInput.trim() || playgroundLoading}
              className="px-5 py-2.5 bg-emerald-500 text-black font-black rounded-2xl hover:bg-emerald-400 disabled:opacity-50 transition-all flex items-center gap-1.5 text-xs"
            >
              <Send className="w-4 h-4" />
              <span>Probar</span>
            </button>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 5: NOTIFICATIONS & AUDIT LOGS                                    */}
      {/* ========================================================================= */}
      {subTab === 'logs' && (
        <div className="space-y-5 animate-fade-in">
          {/* Notification toggles */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-4 shadow-xl">
            <h4 className="text-sm font-black text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Eventos de Notificación Automática
            </h4>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white text-xs">Confirmación de Cita</div>
                  <div className="text-[10px] text-zinc-500">Enviar mensaje al cliente al agendar</div>
                </div>
                <input
                  type="checkbox"
                  checked={config.notifyOnBooking}
                  onChange={e => {
                    const upd = { ...config, notifyOnBooking: e.target.checked };
                    WhatsAppService.saveConfig(business.id, upd);
                    setConfig(upd);
                  }}
                  className="w-5 h-5 accent-emerald-500 cursor-pointer"
                />
              </div>

              <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white text-xs">Alerta al Barbero en Turno</div>
                  <div className="text-[10px] text-zinc-500">Notificar al barbero cuando tenga una nueva cita</div>
                </div>
                <input
                  type="checkbox"
                  checked={config.notifyBarberOnNewBooking}
                  onChange={e => {
                    const upd = { ...config, notifyBarberOnNewBooking: e.target.checked };
                    WhatsAppService.saveConfig(business.id, upd);
                    setConfig(upd);
                  }}
                  className="w-5 h-5 accent-emerald-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-4 shadow-xl">
            <h4 className="text-sm font-black text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              Registro de Auditoría de Envíos
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-[10px] text-zinc-400 uppercase">
                    <th className="pb-2">Fecha y Hora</th>
                    <th className="pb-2">Destinatario</th>
                    <th className="pb-2">Evento</th>
                    <th className="pb-2">Estado</th>
                    <th className="pb-2">Resumen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {WhatsAppService.getLogs(business.id).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-zinc-500">
                        No hay registros de envíos todavía.
                      </td>
                    </tr>
                  ) : (
                    WhatsAppService.getLogs(business.id).map(log => (
                      <tr key={log.id} className="text-zinc-300">
                        <td className="py-3 font-mono text-[11px] text-zinc-400">
                          {new Date(log.sentAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td className="py-3 font-bold text-white">
                          {log.recipientName} <span className="text-zinc-500 font-mono text-[10px]">({log.recipientPhone})</span>
                        </td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-[10px] font-mono">
                            {log.eventType}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                            {log.status}
                          </span>
                        </td>
                        <td className="py-3 text-zinc-400 max-w-xs truncate">
                          {log.summary}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
