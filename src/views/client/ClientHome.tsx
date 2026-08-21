import React, { useState, useMemo, useEffect } from 'react';

import { useTenant } from '../../core/tenant/TenantContext';
import { useAuth } from '../../core/auth/AuthContext';
import { INITIAL_BARBERS, INITIAL_SERVICES, INITIAL_STYLE_MEMORIES } from '../../database/mockData';
import { Service, BarberProfile, StyleMemory } from '../../core/types';
import { BeardStyle } from '../../database/beardStylesData';
import { AuthService } from '../../core/services/authService';
import { VisualStyleCatalog } from './VisualStyleCatalog';
import { CameraCaptureModal } from '../../components/CameraCaptureModal';

import {
  Sparkles,
  RotateCcw,
  Star,
  Clock,
  CheckCircle2,
  Gift,
  ChevronRight,
  Camera,
  ThumbsUp,
  AlertCircle,
  MessageSquare,
  Scissors,
  Calendar,
  Pencil,
  Check,
  ShieldCheck,
  Store,
  Mic,
  Bell,
  Lock,
  Trash2
} from 'lucide-react';



import { SubscriptionService } from '../../core/services/subscriptionService';
import { ServiceCatalogService } from '../../core/services/serviceCatalogService';
import { TeamService } from '../../core/services/teamService';
import { WhatsAppService } from '../../core/whatsapp/whatsappService';
import { WalkInService } from '../../core/services/walkinService';
import { ClientHistoryService } from '../../core/services/clientHistoryService';
import { ImageStorageService } from '../../core/services/imageStorageService';


export const ClientHome: React.FC = () => {
  const { currentBusiness } = useTenant();
  const { currentUser, setIsAuthModalOpen, setRole, loginAsClient } = useAuth();
  const isOperational = SubscriptionService.isBusinessOperational(currentBusiness);
  const subStatus = SubscriptionService.getComputedStatus(currentBusiness);

  // Registro de Cliente para Tarjeta de Fidelización
  const [isLoyaltyRegisterModalOpen, setIsLoyaltyRegisterModalOpen] = useState(false);
  const [regClientName, setRegClientName] = useState('');
  const [regClientPhone, setRegClientPhone] = useState('');

  // Control de Acceso Privado y PIN de Seguridad para el Personal / Dueño
  const [staffTargetRole, setStaffTargetRole] = useState<'owner' | 'barber' | null>(null);
  const [staffPinInput, setStaffPinInput] = useState('');
  const [staffPinError, setStaffPinError] = useState('');

  const [staffPinLoading, setStaffPinLoading] = useState(false);

  const handleVerifyStaffPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffPinLoading(true);
    setStaffPinError('');

    const result = await AuthService.verifyStaffPinServer(
      currentBusiness.id,
      staffPinInput,
      staffTargetRole || 'owner'
    );

    setStaffPinLoading(false);

    if (result.success) {
      if (staffTargetRole) {
        setRole(staffTargetRole);
        setStaffTargetRole(null);
        setStaffPinInput('');
        setStaffPinError('');
      }
    } else {
      setStaffPinError(result.error || 'PIN de seguridad incorrecto. Acceso exclusivo para el personal autorizado.');
    }
  };

  // Filtrar estrictamente servicios activos y barberos por el Tenant activo desde la capa de persistencia
  const businessServices = useMemo(
    () => ServiceCatalogService.getServicesByBusiness(currentBusiness.id).filter(s => s.isActive),
    [currentBusiness.id]
  );
  const businessBarbers = useMemo(
    () => TeamService.getTeamByBusiness(currentBusiness.id).filter(b => b.isActive),
    [currentBusiness.id]
  );

  // Generador dinámico de los próximos 7 días a partir de la fecha actual
  const availableDays = useMemo(() => {
    const days = [];
    const today = new Date();
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const isToday = i === 0;
      const isTomorrow = i === 1;
      const label = isToday ? 'Hoy' : isTomorrow ? 'Mañana' : dayNames[d.getDay()];
      const formatted = `${label}, ${d.getDate()} ${monthNames[d.getMonth()]}`;
      days.push({
        id: formatted,
        dayName: label,
        dayNumber: d.getDate(),
        month: monthNames[d.getMonth()],
        fullLabel: formatted,
        isoDate: d.toISOString().split('T')[0]
      });
    }
    return days;
  }, []);

  const [activeTab, setActiveTab] = useState<'home' | 'catalog' | 'tryon' | 'feedback' | 'booking'>('home');
  const [selectedService, setSelectedService] = useState<Service>(() => businessServices[0] || INITIAL_SERVICES[0]);
  const [selectedBarber, setSelectedBarber] = useState<BarberProfile>(() => businessBarbers[0] || INITIAL_BARBERS[0]);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `Hoy, ${today.getDate()} ${monthNames[today.getMonth()]}`;
  });
  const [selectedTime, setSelectedTime] = useState('14:00');
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [bookingMode, setBookingMode] = useState<'repeat' | 'tryon' | 'style_catalog' | 'standard'>('standard');
  const [customStyleNote, setCustomStyleNote] = useState('');


  // Feedback State
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [ratingCut, setRatingCut] = useState(5);
  const [ratingAttention, setRatingAttention] = useState(5);
  const [ratingListening, setRatingListening] = useState(5);
  const [ratingWaitTime, setRatingWaitTime] = useState(5);
  const [likedComment, setLikedComment] = useState('Excelente servicio y puntualidad.');
  const [improveComment, setImproveComment] = useState('Todo excelente.');

  // Memoria visual aislada por Tenant y Cliente conectada a Supabase
  const [styleMemories, setStyleMemories] = useState<StyleMemory[]>(() =>
    ClientHistoryService.getStyleMemories(currentBusiness.id)
  );

  useEffect(() => {
    const handleMemoryUpdate = () => {
      setStyleMemories(ClientHistoryService.getStyleMemories(currentBusiness.id));
    };
    window.addEventListener('barberia:client_history_updated', handleMemoryUpdate);
    return () => window.removeEventListener('barberia:client_history_updated', handleMemoryUpdate);
  }, [currentBusiness.id]);

  const clientMemory: StyleMemory | undefined = useMemo(() => {
    if (!currentUser) return undefined;
    const clientIdClean = currentUser.phone?.replace(/\s+/g, '') || currentUser.id;
    return styleMemories.find(
      m => m.businessId === currentBusiness.id && (m.clientId.replace(/\s+/g, '') === clientIdClean || currentUser.id === 'guest')
    ) || styleMemories.find(m => m.businessId === currentBusiness.id) || INITIAL_STYLE_MEMORIES[0];
  }, [currentBusiness.id, currentUser, styleMemories]);


  // Edición interactiva de "Lo que te gustó y quieres mantener"
  const [isEditingLiked, setIsEditingLiked] = useState(false);
  const [customLikedText, setCustomLikedText] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(`barberia_liked_${currentBusiness.id}`);
      return saved || '';
    } catch {
      return '';
    }
  });
  const [draftLiked, setDraftLiked] = useState('');

  const activeLiked = customLikedText || clientMemory?.likedAspects.join(' • ') || 'Línea en V lateral a navaja • Fade limpio en patillas y nuca';

  const handleSaveLiked = (text: string) => {
    setCustomLikedText(text.trim());
    setIsEditingLiked(false);
    try {
      localStorage.setItem(`barberia_liked_${currentBusiness.id}`, text.trim());
    } catch (e) {
      console.warn('Error saving liked aspects to localStorage', e);
    }
  };

  // Edición interactiva de "Ajuste indicado para la próxima"
  const [isEditingAdjustment, setIsEditingAdjustment] = useState(false);
  const [customAdjustmentText, setCustomAdjustmentText] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(`barberia_adjustment_${currentBusiness.id}`);
      return saved || '';
    } catch {
      return '';
    }
  });
  const [draftAdjustment, setDraftAdjustment] = useState('');

  const activeAdjustment = customAdjustmentText || clientMemory?.changeAspects.join('. ') || 'Mantener degradado limpio y perfilado a navaja.';

  const handleSaveAdjustment = (text: string) => {
    setCustomAdjustmentText(text.trim());
    setIsEditingAdjustment(false);
    try {
      localStorage.setItem(`barberia_adjustment_${currentBusiness.id}`, text.trim());
    } catch (e) {
      console.warn('Error saving adjustment to localStorage', e);
    }
  };

  // Estados para Dictado por Voz (Micrófono)
  const [isListeningLiked, setIsListeningLiked] = useState(false);
  const [isListeningAdjustment, setIsListeningAdjustment] = useState(false);

  const startVoiceDictation = (target: 'liked' | 'adjustment') => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Tu navegador no soporta reconocimiento de voz nativo. Puedes escribir tu estilo directamente en el cuadro de texto.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-CO';
      recognition.continuous = false;
      recognition.interimResults = false;

      if (target === 'liked') {
        setIsListeningLiked(true);
        if (!isEditingLiked) {
          setDraftLiked(activeLiked);
          setIsEditingLiked(true);
        }
      } else {
        setIsListeningAdjustment(true);
        if (!isEditingAdjustment) {
          setDraftAdjustment(activeAdjustment);
          setIsEditingAdjustment(true);
        }
      }

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          if (target === 'liked') {
            setDraftLiked((prev) => (prev ? `${prev} ${transcript}` : transcript));
          } else {
            setDraftAdjustment((prev) => (prev ? `${prev} ${transcript}` : transcript));
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error', event.error);
        if (target === 'liked') setIsListeningLiked(false);
        else setIsListeningAdjustment(false);
      };

      recognition.onend = () => {
        if (target === 'liked') setIsListeningLiked(false);
        else setIsListeningAdjustment(false);
      };

      recognition.start();
    } catch (err) {
      console.warn('Error starting speech recognition', err);
      if (target === 'liked') setIsListeningLiked(false);
      else setIsListeningAdjustment(false);
    }
  };

  // Captura y actualización de foto de la memoria de estilo
  const [customPhotoUrl, setCustomPhotoUrl] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(`barberia_photo_${currentBusiness.id}`);
      return saved || '';
    } catch {
      return '';
    }
  });
  const [isMemoryPhotoModalOpen, setIsMemoryPhotoModalOpen] = useState(false);
  const activePhoto = customPhotoUrl || clientMemory?.photoUrl || '/styles/Men_showcasing_taper_fade_haircut_202608201950.jpeg';



  const handleConfirmStylePhoto = async (dataUrlOrFile: string) => {
    try {
      const publicUrl = await ImageStorageService.uploadImage(currentBusiness.id, dataUrlOrFile, 'memories');
      setCustomPhotoUrl(publicUrl);

      // Guardar en Supabase hair_style_memories aislado por business_id y client
      const clientId = currentUser.phone?.replace(/\s+/g, '') || currentUser.id || 'guest';
      ClientHistoryService.upsertStyleMemory(currentBusiness.id, {
        clientId,
        photoUrl: publicUrl,
        likedAspects: ['Degradado lateral limpio', 'Textura superior pulida'],
        keepAspects: ['Volumen superior'],
        changeAspects: ['Mantener corte regular'],
        technicalFormula: 'Fade 1.5 a 3 con tijera texturizada arriba',
        consentPhotoGranted: true,
      });

      setIsMemoryPhotoModalOpen(false);
    } catch (err) {
      console.error('Error guardando foto de memoria de estilo:', err);
    }
  };

  const handleDeleteStylePhoto = () => {
    setCustomPhotoUrl('');
    try {
      localStorage.removeItem(`barberia_photo_${currentBusiness.id}`);
    } catch {
      /* ignore */
    }

    const clientId = currentUser.phone?.replace(/\s+/g, '') || currentUser.id || 'guest';
    ClientHistoryService.upsertStyleMemory(currentBusiness.id, {
      clientId,
      photoUrl: '',
      likedAspects: ['Degradado lateral limpio', 'Textura superior pulida'],
      keepAspects: ['Volumen superior'],
      changeAspects: ['Mantener corte regular'],
      technicalFormula: 'Fade 1.5 a 3 con tijera texturizada arriba',
      consentPhotoGranted: true,
    });
  };





  const [isVisitDetailsModalOpen, setIsVisitDetailsModalOpen] = useState(false);
  const [isLoyaltyModalOpen, setIsLoyaltyModalOpen] = useState(false);
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);
  const [walkInSent, setWalkInSent] = useState(false);
  const [walkInBarber, setWalkInBarber] = useState(businessBarbers[0]?.fullName || 'Álvaro Ortiz');
  const [walkInNote, setWalkInNote] = useState('');
  const [walkInStyle, setWalkInStyle] = useState('Mi Estilo de Memoria (El Siete Colombiano)');

  const handleRepeatStyle = () => {
    setBookingMode('repeat');
    if (businessServices.length > 0) setSelectedService(businessServices[0]);
    if (businessBarbers.length > 0) setSelectedBarber(businessBarbers[0]);
    setCustomStyleNote(`Mantener: ${activeLiked}. Ajuste indicado: ${activeAdjustment}`);
    setActiveTab('booking');
  };

  const [selectedBeardStyle, setSelectedBeardStyle] = useState<BeardStyle | null>(null);

  const handleSelectStyleFromCatalog = (style: BeardStyle) => {
    setSelectedBeardStyle(style);
    setBookingMode('style_catalog');
    setCustomStyleNote(`Estilo Solicitado: ${style.name} (${style.category})`);
    if (businessServices.length > 0) setSelectedService(businessServices[0]);
    setActiveTab('booking');
  };

  const handleConfirmBooking = () => {

    setBookingConfirmed(true);

    const clientName = currentUser.fullName !== 'Cliente Invitado' ? currentUser.fullName : 'Pedro Duarte';
    const clientPhone = currentUser.phone || '+57 310 999 8877';
    const barberName = selectedBarber?.fullName || currentBusiness.ownerName || 'Álvaro Ortiz';
    const serviceName = selectedService?.name || 'Corte Clásico';
    const priceCOP = selectedService?.priceCOP || 38000;

    // 🛎️ Registrar en el sistema de notificaciones en tiempo real (dispara timbre y aparece en la campanita)
    WalkInService.createTicket({
      businessId: currentBusiness.id,
      type: 'appointment',
      clientName,
      clientPhone,
      styleName: `${serviceName} ($${priceCOP.toLocaleString('es-CO')} COP)`,
      stylePhotoUrl: activePhoto,
      specialNote: customStyleNote || `Cita para el ${selectedDate} a las ${selectedTime}`,
      barberName,
      appointmentDate: selectedDate,
      appointmentTime: selectedTime,
      priceCOP,
    });

    // Disparo desacoplado de confirmación transaccional por WhatsApp
    WhatsAppService.sendAppointmentConfirmation({
      business: currentBusiness,
      clientName,
      clientPhone,
      barberName,
      serviceName,
      priceCOP,
      date: selectedDate,
      time: selectedTime,
    });

    if (selectedBarber?.phone) {
      WhatsAppService.sendBarberNewBookingAlert({
        business: currentBusiness,
        barberName: selectedBarber.fullName,
        barberPhone: selectedBarber.phone,
        clientName,
        serviceName,
        date: selectedDate,
        time: selectedTime,
      });
    }
  };

  const handleRegisterLoyalty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regClientName.trim() || !regClientPhone.trim()) return;

    loginAsClient(regClientPhone.trim(), regClientName.trim());
    setIsLoyaltyRegisterModalOpen(false);
    setIsLoyaltyModalOpen(true);
  };

  // Screen for Suspended or Expired Trial
  if (!isOperational) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4 animate-fade-in">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
          <AlertCircle className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
            {subStatus === 'trial_expired' ? 'Período de Prueba Finalizado' : 'Servicio Temporalmente Inactivo'}
          </span>
          <h3 className="text-lg font-black text-white">{currentBusiness.name}</h3>
          <p className="text-xs text-zinc-400">
            {subStatus === 'trial_expired'
              ? 'El período de prueba de 7 días ha concluido. El propietario debe activar su suscripción comercial en el panel de control.'
              : 'El espacio de este negocio se encuentra pausado temporalmente por administración.'}
          </p>
        </div>
        <div className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-2xl text-xs text-zinc-400 space-y-1">
          <div className="font-bold text-zinc-200">Contacto directo con la barbería:</div>
          <div>WhatsApp: {currentBusiness.whatsapp || currentBusiness.phone}</div>
          {currentBusiness.address && <div>Dirección: {currentBusiness.address}</div>}
        </div>
      </div>
    );
  }

  if (activeTab === 'catalog') {
    return (
      <VisualStyleCatalog
        onBack={() => setActiveTab('home')}
        onSelectStyle={handleSelectStyleFromCatalog}
      />
    );
  }


  if (!isOperational) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center space-y-6 animate-fade-in">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center text-amber-400 shadow-xl">
          <Lock className="w-10 h-10 stroke-[2.5]" />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
            Periodo de Prueba Finalizado
          </span>
          <h2 className="text-2xl font-black text-white">{currentBusiness.name}</h2>
          <p className="text-zinc-400 text-xs leading-relaxed max-w-sm mx-auto">
            El agendamiento digital, catálogo interactivo y cola en vivo se encuentran temporalmente en pausa mientras el establecimiento renueva su suscripción oficial.
          </p>
        </div>

        {/* WhatsApp de Contacto Directo */}
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-2 text-xs">
          <p className="text-zinc-300">
            ¿Necesitas comunicarte con la barbería directamente?
          </p>
          <a
            href={`https://wa.me/${currentBusiness.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${currentBusiness.name}, deseo consultar sobre disponibilidad de citas.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Contactar a {currentBusiness.ownerName || 'la Barbería'} por WhatsApp</span>
          </a>
        </div>

        {/* Acceso para el Dueño */}
        <div className="pt-4 border-t border-zinc-800 space-y-2">
          <p className="text-[11px] text-zinc-500">¿Eres el propietario o administrador de {currentBusiness.name}?</p>
          <button
            onClick={() => setStaffTargetRole('owner')}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Lock className="w-4 h-4 stroke-[2.5]" />
            <span>🔐 Ingresar al Panel del Dueño para Activar Suscripción</span>
          </button>
        </div>

        {/* Modal de PIN del Dueño */}
        {staffTargetRole && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
            <div className="w-full sm:max-w-xs bg-zinc-900 border-t sm:border border-zinc-700 rounded-t-3xl sm:rounded-3xl p-5 space-y-4 shadow-2xl text-xs text-left">

              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="font-black text-white flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-amber-400" />
                  PIN de Acceso Privado
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setStaffTargetRole(null);
                    setStaffPinInput('');
                    setStaffPinError('');
                  }}
                  className="text-zinc-400 hover:text-white px-2 py-1 bg-zinc-800 rounded-lg cursor-pointer text-xs"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleVerifyStaffPin} className="space-y-3">
                <div>
                  <label className="text-[11px] text-zinc-300 font-bold block mb-1">
                    Ingresa el PIN de seguridad del propietario:
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    autoFocus
                    required
                    value={staffPinInput}
                    onChange={(e) => {
                      setStaffPinInput(e.target.value);
                      setStaffPinError('');
                    }}
                    placeholder="••••"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-center text-lg font-mono text-white tracking-widest focus:border-amber-400 outline-none"
                  />
                  {staffPinError && (
                    <p className="text-[11px] text-red-400 font-bold mt-1 text-center">
                      {staffPinError}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setStaffTargetRole(null);
                      setStaffPinInput('');
                      setStaffPinError('');
                    }}
                    className="flex-1 py-2 rounded-xl bg-zinc-800 text-zinc-300 font-bold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={staffPinLoading}
                    className={`flex-1 py-2 rounded-xl font-black shadow cursor-pointer ${staffPinLoading ? 'bg-zinc-600 text-zinc-400' : 'bg-amber-500 hover:bg-amber-400 text-black'}`}
                  >
                    {staffPinLoading ? 'Verificando...' : 'Desbloquear'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-6 pb-28 animate-fade-in">
      {/* 1. Welcome & Client Identity Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <span className="text-xs text-zinc-400 font-medium">{currentBusiness.name}</span>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            {currentUser.id !== 'guest' && currentUser.fullName !== 'Cliente Invitado'
              ? `¡Hola, ${currentUser.fullName}! 👋`
              : `¡Bienvenido! 👋`}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('catalog')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black text-black bg-amber-500 hover:bg-amber-400 border border-amber-400 shadow-lg shadow-amber-500/20 transition hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Scissors className="w-4 h-4" />
            <span>Biblioteca Visual</span>
          </button>
        </div>

      </div>



      {/* 🎁 BANNER DESTACADO DEL CLUB DE FIDELIZACIÓN: 1 CORTE GRATIS */}
      <section
        onClick={() => {
          if (currentUser.id === 'guest' || currentUser.fullName === 'Cliente Invitado') {
            setIsLoyaltyRegisterModalOpen(true);
          } else {
            setIsLoyaltyModalOpen(true);
          }
        }}
        className="rounded-3xl p-5 bg-gradient-to-r from-amber-500/25 via-zinc-900 to-amber-950/40 border-2 border-amber-500/60 shadow-2xl relative overflow-hidden group cursor-pointer hover:border-amber-400 transition"
      >
        <div className="flex items-center justify-between gap-3.5">
          <div className="space-y-2 flex-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-black bg-amber-500 px-3 py-0.5 rounded-full shadow">
              <Gift className="w-3.5 h-3.5" /> Promoción Oficial de la Barbería
            </div>
            <h3 className="text-base sm:text-lg font-black text-white group-hover:text-amber-400 transition flex items-center gap-1.5">
              <span>¡Acumula {currentBusiness.loyalty.stampsThreshold || 6} sellos y llévate 1 CORTE GRATIS!</span>
              <span className="text-base">✂️🎁</span>
            </h3>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              Registra tu nombre y teléfono, y pídele a tu barbero que te estampe tu sello digital cada vez que te cortes el cabello.
            </p>
            <div className="pt-1.5 flex items-center gap-2 text-xs sm:text-sm font-black text-amber-400">
              <span>
                {currentUser.id !== 'guest' && currentUser.fullName !== 'Cliente Invitado'
                  ? '⭐ Ver Mi Tarjeta de Sellos Digital'
                  : '👉 Registrar mi Nombre y Activar Mi Tarjeta de Sellos'}
              </span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </div>
          </div>

          <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-amber-500/15 border-2 border-amber-500/50 flex flex-col items-center justify-center text-amber-400 shrink-0 shadow-xl group-hover:scale-105 transition">
            <Gift className="w-8 h-8 text-amber-400 animate-bounce" />
            <span className="text-[10px] sm:text-xs font-black text-white mt-1 uppercase">Gratis</span>
          </div>
        </div>
      </section>


      {/* 💈 EXPLORADOR VISUAL DE CORTES, BARBAS & COMBOS */}
      <section
        onClick={() => setActiveTab('catalog')}
        className="rounded-3xl p-5 bg-gradient-to-r from-amber-500/15 via-zinc-900 to-zinc-900 border border-amber-500/30 shadow-xl relative overflow-hidden group cursor-pointer hover:border-amber-500 transition"
      >
        <div className="flex items-center justify-between gap-3.5">
          <div className="space-y-1.5 flex-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-3 py-0.5 rounded-full border border-amber-500/20">
              <Sparkles className="w-3.5 h-3.5" /> Biblioteca Visual Oficial
            </div>
            <h3 className="text-base sm:text-lg font-black text-white group-hover:text-amber-400 transition">
              Catálogo de Cortes, Barbas y Combos
            </h3>
            <p className="text-xs sm:text-sm text-zinc-300 max-w-md leading-relaxed">
              Explora más de 40 estilos profesionales con fotos reales (El Siete, Fades, Barbas y Diseños). Elige el tuyo y resérvalo directamente.
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs sm:text-sm font-bold text-amber-400">
              <span>Explorar Biblioteca Completa</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </div>
          </div>

          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border border-amber-500/30 shadow-lg shrink-0 hidden sm:block bg-zinc-950">
            <img
              src="/styles/hair_01.jpg"
              alt="Corte Taper Fade Pro"
              className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
            />
          </div>
        </div>
      </section>

      {/* 1.1 MODO SALA DE ESPERA / SIN CITA EN VIVO: "QUIERO ESTE CORTE" */}
      <section
        onClick={() => {
          setWalkInSent(false);
          setIsWalkInModalOpen(true);
        }}
        className="rounded-2xl p-4.5 bg-gradient-to-r from-amber-500/20 via-zinc-900 to-zinc-900 border border-amber-500/40 hover:border-amber-500 transition shadow-lg flex items-center justify-between cursor-pointer group"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 group-hover:scale-105 transition shrink-0">
            <Bell className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <div className="text-sm sm:text-base font-black text-white flex items-center gap-2">
              <span>¿Llegaste a la barbería sin cita?</span>
              <span className="text-[10px] sm:text-xs font-black px-2 py-0.5 rounded bg-amber-500 text-black">
                TURNO EN VIVO
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-300 mt-1">
              Toca aquí para avisar a Álvaro: <strong>"Ya llegué, quiero este corte"</strong>.
            </p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition shrink-0" />
      </section>


      {/* Guest Identification Prompt if not logged in */}
      {currentUser.fullName === 'Cliente Invitado' && (
        <section
          onClick={() => {}}
          className="rounded-2xl p-4 bg-zinc-900/90 border border-amber-500/30 flex items-center justify-between gap-3 shadow-lg"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">¿Es tu primera visita o ya nos conoces?</div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Identifícate con tu WhatsApp para recordar tu corte y tus beneficios.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-black shrink-0 shadow transition cursor-pointer"
            style={{ backgroundColor: 'var(--brand-primary)' }}
          >
            Identificarme
          </button>
        </section>
      )}

      {/* 2. CORE DIFFERENTIATOR: "TU BARBERÍA TE CONOCE" - VISUAL MEMORY CARD */}
      {clientMemory ? (
        <section className="rounded-2xl p-4.5 bg-gradient-to-br from-zinc-900 to-zinc-900/70 border border-zinc-800 shadow-xl relative overflow-hidden">
          {/* Subtle Accent Glow */}
          <div
            className="absolute -right-8 -top-8 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none"
            style={{ backgroundColor: 'var(--brand-primary)' }}
          />

          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <Sparkles className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wider">Tu Memoria de Estilo</h3>
                <p className="text-xs text-zinc-300">
                  {currentBusiness.name} recuerda cómo te gusta tu corte
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsVisitDetailsModalOpen(true)}
              className="text-xs font-bold px-3 py-1.5 rounded-full bg-zinc-800 hover:bg-zinc-750 text-amber-400 border border-amber-500/30 flex items-center gap-1.5 transition shadow cursor-pointer"
            >
              <span>📅 Ver Última Visita</span>
              <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
            </button>
          </div>

          <div className="grid sm:grid-cols-3 gap-3.5 mt-2">
            {/* Foto del último corte con botón de cámara interactivo */}
            <div className="relative rounded-2xl overflow-hidden aspect-square border border-zinc-800 bg-zinc-950 group shadow-inner">
              <img
                src={activePhoto}
                alt="Último corte"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              />
              <button
                onClick={() => setIsMemoryPhotoModalOpen(true)}
                className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 transition text-amber-400 font-black text-xs sm:text-sm cursor-pointer p-2 text-center"
              >
                <Camera className="w-7 h-7 text-amber-400" />
                <span>Tomar / Cambiar Foto</span>
              </button>
              <button
                onClick={() => setIsMemoryPhotoModalOpen(true)}
                className="absolute top-2 right-2 p-2 rounded-xl bg-black/85 backdrop-blur-md text-amber-400 border border-amber-500/30 flex sm:hidden items-center justify-center cursor-pointer shadow"
              >
                <Camera className="w-4 h-4" />
              </button>

              {customPhotoUrl && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteStylePhoto();
                  }}
                  className="absolute top-2 left-2 p-2 rounded-xl bg-red-600/90 hover:bg-red-500 text-white flex items-center justify-center cursor-pointer shadow-md transition hover:scale-105 active:scale-95 z-20 border border-red-400/30"
                  title="Eliminar esta foto de mi memoria"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              <div className="absolute bottom-2 left-2 bg-black/85 px-2.5 py-0.5 rounded-lg text-xs font-bold text-zinc-200">
                Foto del Corte
              </div>
            </div>

            {/* Preferencias aprendidas */}
            <div className="sm:col-span-2 space-y-2.5 text-xs sm:text-sm">
              <div className="bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <ThumbsUp className="w-3.5 h-3.5" /> Lo que te gustó y quieres mantener:
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => startVoiceDictation('liked')}
                      className={`text-xs font-bold flex items-center gap-1.5 px-2.5 py-1 rounded-xl border transition cursor-pointer ${
                        isListeningLiked
                          ? 'bg-red-500 text-white border-red-400 animate-pulse'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                      }`}
                      title="Hablar por micrófono para dictar lo que te gustó"
                    >
                      <Mic className="w-3 h-3" />
                      <span>{isListeningLiked ? 'Escuchando...' : '🎙️ Dictar'}</span>
                    </button>

                    {!isEditingLiked && (
                      <button
                        onClick={() => {
                          setDraftLiked(activeLiked);
                          setIsEditingLiked(true);
                        }}
                        className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 transition cursor-pointer"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>Editar</span>
                      </button>
                    )}
                  </div>
                </div>


                {isListeningLiked && (
                  <div className="text-[10px] font-bold text-red-400 flex items-center gap-1.5 animate-pulse bg-red-500/10 p-1.5 rounded-lg border border-red-500/20">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    <span>🎙️ Habla ahora: Estamos transcribiendo lo que te gusta de tu corte...</span>
                  </div>
                )}

                {isEditingLiked ? (
                  <div className="space-y-2 pt-1 animate-fade-in">
                    <textarea
                      rows={2}
                      value={draftLiked}
                      onChange={(e) => setDraftLiked(e.target.value)}
                      placeholder="Escribe o dicta lo que te encanta de tu corte (ej: El degradado a piel, la navaja en contornos, la textura superior...)"
                      className="w-full bg-zinc-900 border border-emerald-500/50 rounded-xl p-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-400 shadow-inner"
                      autoFocus
                    />
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setIsEditingLiked(false)}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-zinc-400 hover:text-white bg-zinc-800 transition cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleSaveLiked(draftLiked)}
                        className="px-3 py-1 rounded-lg text-[10px] font-black text-black bg-emerald-500 hover:bg-emerald-400 flex items-center gap-1 transition shadow cursor-pointer"
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>Guardar</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-zinc-200 font-medium">
                    {activeLiked}
                  </div>
                )}
              </div>

              <div className="bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Ajuste indicado para la próxima:
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => startVoiceDictation('adjustment')}
                      className={`text-[10px] font-bold flex items-center gap-1 px-2 py-0.5 rounded-lg border transition cursor-pointer ${
                        isListeningAdjustment
                          ? 'bg-red-500 text-white border-red-400 animate-pulse'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                      }`}
                      title="Hablar por micrófono para dictar el ajuste para Álvaro"
                    >
                      <Mic className="w-2.5 h-2.5" />
                      <span>{isListeningAdjustment ? 'Escuchando...' : '🎙️ Dictar'}</span>
                    </button>

                    {!isEditingAdjustment && (
                      <button
                        onClick={() => {
                          setDraftAdjustment(activeAdjustment);
                          setIsEditingAdjustment(true);
                        }}
                        className="text-[10px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 transition cursor-pointer"
                      >
                        <Pencil className="w-2.5 h-2.5" />
                        <span>Editar</span>
                      </button>
                    )}
                  </div>
                </div>

                {isListeningAdjustment && (
                  <div className="text-[10px] font-bold text-red-400 flex items-center gap-1.5 animate-pulse bg-red-500/10 p-1.5 rounded-lg border border-red-500/20">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    <span>🎙️ Habla ahora: Cuéntanos el ajuste especial que le indicaremos a Álvaro...</span>
                  </div>
                )}

                {isEditingAdjustment ? (
                  <div className="space-y-2 pt-1 animate-fade-in">
                    <textarea
                      rows={2}
                      value={draftAdjustment}
                      onChange={(e) => setDraftAdjustment(e.target.value)}
                      placeholder="Escribe o dicta tu ajuste especial para Álvaro (ej: Dejar más largo arriba, no tocar patillas, subir fade...)"
                      className="w-full bg-zinc-900 border border-amber-500/50 rounded-xl p-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 shadow-inner"
                      autoFocus
                    />
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setIsEditingAdjustment(false)}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-zinc-400 hover:text-white bg-zinc-800 transition cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleSaveAdjustment(draftAdjustment)}
                        className="px-3 py-1 rounded-lg text-[10px] font-black text-black bg-amber-500 hover:bg-amber-400 flex items-center gap-1 transition shadow cursor-pointer"
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>Guardar Ajuste</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-zinc-200 font-medium">
                    "{activeAdjustment}"
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick CTA: REPETIR MI ESTILO CON AJUSTES */}
          <div className="mt-4 pt-3 border-t border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs text-zinc-400">
              Fórmula técnica: <strong className="text-zinc-200">{clientMemory.technicalFormula}</strong>
            </span>
            <button
              onClick={handleRepeatStyle}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-black text-black flex items-center justify-center gap-2 shadow-lg transition active:scale-95"
              style={{ backgroundColor: 'var(--brand-primary)' }}
            >
              <RotateCcw className="w-4 h-4" />
              Repetir mi estilo con ajustes
            </button>
          </div>
        </section>
      ) : (
        <section className="rounded-2xl p-5 bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 text-center py-6 space-y-2.5 shadow-lg relative overflow-hidden">
          <div
            className="absolute -right-8 -top-8 w-32 h-32 rounded-full blur-3xl opacity-15 pointer-events-none"
            style={{ backgroundColor: 'var(--brand-primary)' }}
          />
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Tu Memoria de Estilo Capilar</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1 leading-relaxed">
              Aún no tienes un corte registrado en {currentBusiness.name}. Al finalizar tu cita con Álvaro Ortiz, registraremos tu degradado, fórmula técnica y fotos para que puedas repetir tu estilo con un solo toque.
            </p>
          </div>
        </section>
      )}

      {/* 3. FIDELIZACIÓN INTERACTIVA */}
      <section
        onClick={() => setIsLoyaltyModalOpen(true)}
        className="rounded-2xl p-4 bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 flex items-center justify-between transition cursor-pointer group shadow-md"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 group-hover:bg-amber-500/20 flex items-center justify-center text-amber-400 transition">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5 group-hover:text-amber-400 transition">
              <span>Club de Fidelización {currentBusiness.name}</span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                1 / {currentBusiness.loyalty.stampsThreshold || 8} Sellos
              </span>
            </div>
            <p className="text-[11px] text-amber-400 font-semibold mt-0.5">
              {currentBusiness.loyalty.rewardDescription}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {[...Array(currentBusiness.loyalty.stampsThreshold || 8)].map((_, idx) => (
              <div
                key={idx}
                className={`w-2.5 h-2.5 rounded-full ${idx < 1 ? 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-zinc-700'}`}
              />
            ))}
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition" />
        </div>
      </section>

      {/* 4. CATÁLOGO VISUAL DE ESTILOS DE BARBA BANNER */}
      <section
        onClick={() => setActiveTab('catalog')}
        className="rounded-2xl p-4 bg-gradient-to-r from-zinc-900 via-zinc-800/80 to-zinc-900 border border-zinc-700 cursor-pointer hover:border-amber-500/50 transition flex items-center justify-between group"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
            <Scissors className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-black text-white flex items-center gap-1.5">
              <span>Biblioteca Visual de Estilos</span>
              <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 uppercase">Cabello & Barba</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Explora nuestra colección oficial de cortes y barbas con referencias técnicas.
            </p>
          </div>

        </div>
        <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition" />
      </section>


      {/* 5. SERVICIOS & BARBEROS DISPONIBLES (AISLADOS POR TENANT) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-zinc-300">
            Servicios Disponibles ({businessServices.length})
          </h3>
          {currentBusiness.address && currentBusiness.address !== 'Pendiente de configuración' && (
            <span className="text-xs text-zinc-400">{currentBusiness.address}</span>
          )}
        </div>

        <div className="space-y-2.5">
          {businessServices.map((srv) => (
            <div
              key={srv.id}
              onClick={() => {
                setSelectedService(srv);
                setBookingMode('standard');
                setActiveTab('booking');
              }}
              className="p-4 rounded-2xl bg-zinc-900/80 hover:bg-zinc-850 border border-zinc-800 hover:border-amber-500/40 cursor-pointer transition flex items-center justify-between shadow-md"
            >
              <div className="space-y-1">
                <div className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <span>{srv.name}</span>
                  {srv.isPopular && (
                    <span className="text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      Popular
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-zinc-300 max-w-sm leading-relaxed">{srv.description}</p>
                <div className="flex items-center gap-3.5 text-xs text-zinc-400 pt-1">
                  <span className="flex items-center gap-1 font-semibold">
                    <Clock className="w-3.5 h-3.5 text-amber-400" /> {srv.durationMinutes} min
                  </span>
                  <span className="font-black text-amber-400 text-xs sm:text-sm">
                    ${srv.priceCOP.toLocaleString('es-CO')} COP
                  </span>
                </div>
              </div>
              <button
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-black text-black transition shadow hover:scale-105 active:scale-95"
                style={{ backgroundColor: 'var(--brand-primary)' }}
              >
                Reservar
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 5.1 EQUIPO DE COLABORADORES & CALIFICACIONES EN VIVO */}
      <section className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
              <Scissors className="w-4 h-4 text-amber-400" />
              <span>Nuestros Barberos & Colaboradores ({businessBarbers.length})</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Conoce a los profesionales de {currentBusiness.name} y califica su atención.
            </p>
          </div>
        </div>


        <div className="grid sm:grid-cols-2 gap-3">
          {businessBarbers.map((barber) => (
            <div
              key={barber.id}
              className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-amber-500/40 transition shadow-lg space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={barber.avatarUrl}
                    alt={barber.fullName}
                    className="w-12 h-12 rounded-2xl object-cover border border-amber-500/30 bg-zinc-950 shrink-0"
                  />
                  <div>
                    <div className="text-sm font-black text-white">{barber.fullName}</div>
                    <div className="text-[11px] text-zinc-400 line-clamp-1">{barber.specialties.join(' • ')}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                        <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" /> {barber.ratingAverage.toFixed(1)} / 5.0
                      </span>
                      <span className="text-[10px] text-emerald-400 font-semibold">
                        {barber.happyClientsPct}% Clientes Satisfechos
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-800/80">
                <button
                  onClick={() => {
                    setSelectedBarber(barber);
                    setActiveTab('feedback');
                  }}
                  className="py-2 px-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-200 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-zinc-700 transition cursor-pointer"
                >
                  <Star className="w-3.5 h-3.5 text-amber-400" />
                  <span>Calificar Barbero</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedBarber(barber);
                    if (businessServices.length > 0) setSelectedService(businessServices[0]);
                    setBookingMode('standard');
                    setActiveTab('booking');
                  }}
                  className="py-2 px-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center justify-center gap-1.5 shadow transition cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Agendar Cita</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. MODAL / TAB DE RESERVAS */}
      {activeTab === 'booking' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-t-3xl sm:rounded-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  {bookingMode === 'repeat'
                    ? 'Repitiendo tu Estilo'
                    : bookingMode === 'style_catalog'
                    ? `Estilo: ${selectedBeardStyle?.name || 'Catálogo de Barba'}`
                    : 'Agendar Cita'}
                </h3>

                <p className="text-xs text-zinc-400">
                  {selectedService?.name || 'Servicio'} • ${selectedService?.priceCOP.toLocaleString('es-CO')} COP
                </p>
              </div>
              <button
                onClick={() => {
                  setActiveTab('home');
                  setBookingConfirmed(false);
                }}
                className="text-xs text-zinc-400 hover:text-white px-2 py-1 bg-zinc-800 rounded-lg"
              >
                Cerrar
              </button>
            </div>

            {bookingConfirmed ? (
              <div className="text-center py-6 space-y-3 animate-fade-in">
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-white">¡Cita Confirmada con Éxito!</h4>
                <p className="text-xs text-zinc-300 max-w-xs mx-auto">
                  Te esperamos en <strong>{currentBusiness.name}</strong> ({currentBusiness.address}) el <strong>{selectedDate}</strong> a las <strong>{selectedTime}</strong> con <strong>{selectedBarber?.fullName || 'Profesional'}</strong>.
                </p>
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-left text-xs text-emerald-400 font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Notificación de confirmación enviada a tu WhatsApp ({currentUser.phone || '+57 310 999 8877'}).</span>
                </div>

                <div className="p-3 bg-zinc-950 rounded-xl text-left text-xs text-zinc-400 space-y-1">
                  <div className="font-bold text-zinc-200">Nota transmitida al barbero:</div>
                  <div>{customStyleNote || 'Corte habitual con memoria de estilo activa.'}</div>
                </div>

                {/* Botón Directo a WhatsApp del Negocio (wa.me) */}
                <a
                  href={WhatsAppService.getDirectWhatsAppUrl({
                    businessPhone: currentBusiness.whatsapp || currentBusiness.phone,
                    businessName: currentBusiness.name,
                    clientName: currentUser?.fullName || 'Cliente',
                    serviceName: selectedService.name,
                    barberName: selectedBarber?.fullName || 'Barbero asignado',
                    date: selectedDate,
                    time: selectedTime,
                    priceCOP: selectedService.priceCOP,
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition flex items-center justify-center gap-2 shadow-lg"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Contactar / Notificar a la Barbería por WhatsApp</span>
                </a>

                <button
                  onClick={() => {
                    setActiveTab('feedback');
                    setBookingConfirmed(false);
                  }}
                  className="w-full py-2.5 rounded-xl text-xs font-bold text-black"
                  style={{ backgroundColor: 'var(--brand-primary)' }}
                >
                  Simular Fin de Visita y Dar Feedback
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* Seleccionar Barbero del Tenant */}
                <div>
                  <label className="font-bold text-zinc-300 block mb-2">Selecciona tu Barbero en {currentBusiness.name}:</label>
                  <div className="grid grid-cols-2 gap-2">
                    {businessBarbers.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => setSelectedBarber(b)}
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition ${
                          selectedBarber?.id === b.id
                            ? 'border-amber-500 bg-amber-500/10'
                            : 'border-zinc-800 bg-zinc-950'
                        }`}
                      >
                        <img src={b.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                        <div>
                          <div className="font-bold text-white text-xs">{b.fullName}</div>
                          <div className="text-[10px] text-amber-400 flex items-center gap-0.5">
                            <Star className="w-2.5 h-2.5 fill-current" /> {b.ratingAverage} ({b.happyClientsPct}%)
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 1. Seleccionar Fecha / Día */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-bold text-zinc-300 flex items-center gap-1.5 text-xs">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      <span>Selecciona el Día:</span>
                    </label>
                    <span className="text-amber-400 font-extrabold text-[11px] bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                      {selectedDate}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {availableDays.map((day) => (
                      <button
                        key={day.id}
                        type="button"
                        onClick={() => setSelectedDate(day.fullLabel)}
                        className={`flex-1 min-w-[65px] py-2 px-1.5 rounded-xl text-center transition cursor-pointer border ${
                          selectedDate === day.fullLabel
                            ? 'bg-amber-500 text-black border-amber-400 font-black shadow-md'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                        }`}
                      >
                        <div className="text-[9px] uppercase font-extrabold leading-tight">{day.dayName}</div>
                        <div className="text-sm font-black my-0.5">{day.dayNumber}</div>
                        <div className="text-[8px] uppercase tracking-wider text-zinc-500">{day.month}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Seleccionar Horario */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-bold text-zinc-300 flex items-center gap-1.5 text-xs">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Horario Disponible:</span>
                    </label>
                    <span className="text-amber-400 font-extrabold text-[11px] bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                      {selectedTime}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00'].map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setSelectedTime(time)}
                        className={`py-2 rounded-xl font-bold text-xs text-center transition cursor-pointer border ${
                          selectedTime === time
                            ? 'bg-amber-500 text-black border-amber-400 font-black shadow-md'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notas de estilo */}
                <div>
                  <label className="font-bold text-zinc-300 block mb-1">Notas de Estilo para el Barbero:</label>
                  <textarea
                    rows={2}
                    value={customStyleNote}
                    onChange={(e) => setCustomStyleNote(e.target.value)}
                    placeholder="Indica cualquier preferencia especial..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-zinc-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <button
                  onClick={handleConfirmBooking}
                  className="w-full py-3 rounded-xl font-extrabold text-black text-sm shadow-xl transition active:scale-95"
                  style={{ backgroundColor: 'var(--brand-primary)' }}
                >
                  Confirmar Reserva en {currentBusiness.name}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 7. MODAL DE FEEDBACK MULTIDIMENSIONAL */}
      {activeTab === 'feedback' && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="w-full sm:max-w-lg bg-zinc-900 border-t sm:border border-zinc-700 rounded-t-3xl sm:rounded-3xl p-5 space-y-4 max-h-[92vh] overflow-y-auto shadow-2xl">

            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  Tu opinión mejora tu próxima visita
                </span>
                <h3 className="text-base font-bold text-white">¿Cómo estuvo tu experiencia en {currentBusiness.name}?</h3>
              </div>
              <button
                onClick={() => setActiveTab('home')}
                className="text-xs text-zinc-400 hover:text-white px-2 py-1 bg-zinc-800 rounded-lg"
              >
                Cerrar
              </button>
            </div>

            {feedbackSent ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="text-base font-bold text-white">¡Gracias por ayudarnos a conocerte mejor!</h4>
                <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                  Tus comentarios han sido registrados privadamente para que tu próxima visita sea aún más perfecta.
                </p>
                <button
                  onClick={() => {
                    setActiveTab('home');
                    setFeedbackSent(false);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-black"
                  style={{ backgroundColor: 'var(--brand-primary)' }}
                >
                  Volver al Inicio
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* Aspectos Multidimensionales */}
                <div className="space-y-3 bg-zinc-950 p-3.5 rounded-xl border border-zinc-800">
                  {/* Corte */}
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-zinc-300">1. ¿Cómo quedó el corte/servicio?</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((val) => (
                        <button
                          key={val}
                          onClick={() => setRatingCut(val)}
                          className={`w-6 h-6 rounded text-xs font-bold ${
                            val <= ratingCut ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Atención */}
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-zinc-300">2. ¿Te atendieron y recibieron bien?</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((val) => (
                        <button
                          key={val}
                          onClick={() => setRatingAttention(val)}
                          className={`w-6 h-6 rounded text-xs font-bold ${
                            val <= ratingAttention ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Escucha */}
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-zinc-300">3. ¿El barbero escuchó lo que querías?</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((val) => (
                        <button
                          key={val}
                          onClick={() => setRatingListening(val)}
                          className={`w-6 h-6 rounded text-xs font-bold ${
                            val <= ratingListening ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Espera */}
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-zinc-300">4. ¿Cómo fue el tiempo de espera?</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((val) => (
                        <button
                          key={val}
                          onClick={() => setRatingWaitTime(val)}
                          className={`w-6 h-6 rounded text-xs font-bold ${
                            val <= ratingWaitTime ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Preguntas abiertas constructivas */}
                <div>
                  <label className="font-bold text-zinc-300 block mb-1">¿Qué fue lo que más te gustó?</label>
                  <input
                    type="text"
                    value={likedComment}
                    onChange={(e) => setLikedComment(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-zinc-300 block mb-1">¿Qué te gustaría diferente la próxima vez?</label>
                  <input
                    type="text"
                    value={improveComment}
                    onChange={(e) => setImproveComment(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <button
                  onClick={() => setFeedbackSent(true)}
                  className="w-full py-3 rounded-xl font-bold text-black shadow-lg"
                  style={{ backgroundColor: 'var(--brand-primary)' }}
                >
                  Enviar Opinión Confidencial
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 8. MODAL INTERACTIVO DE CÁMARA & GALERÍA PARA MEMORIA DE ESTILO */}
      <CameraCaptureModal
        isOpen={isMemoryPhotoModalOpen}
        onClose={() => setIsMemoryPhotoModalOpen(false)}
        onConfirmPhoto={handleConfirmStylePhoto}
        onDeletePhoto={handleDeleteStylePhoto}
        hasExistingPhoto={!!customPhotoUrl}
        title="Tu Memoria de Estilo Capilar"
        subtitle="Toma una foto en vivo con la cámara o selecciona una imagen desde la galería."
      />



      {/* 9. MODAL DE DETALLES DE ÚLTIMA VISITA REGISTRADA */}
      {isVisitDetailsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="w-full sm:max-w-md bg-zinc-900 border-t sm:border border-zinc-700 rounded-t-3xl sm:rounded-3xl p-5 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto">

            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Calendar className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white">Ficha de tu Última Visita</h3>
                  <span className="text-[10px] text-zinc-400">15 de Agosto de 2026 • 14:30</span>
                </div>
              </div>
              <button
                onClick={() => setIsVisitDetailsModalOpen(false)}
                className="text-xs text-zinc-400 hover:text-white px-2 py-1 bg-zinc-800 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Resumen de la visita */}
              <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Barbero que te atendió:</span>
                  <span className="font-bold text-white">Álvaro Ortiz (Maestro Barbero)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Servicio Realizado:</span>
                  <span className="font-bold text-amber-400">Corte Clásico & Fade Pro ($38.000 COP)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Calificación otorgada:</span>
                  <span className="font-bold text-amber-400 flex items-center gap-0.5">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> 5.0 (Excelente)
                  </span>
                </div>
              </div>

              {/* Foto y Fórmula */}
              <div className="grid grid-cols-3 gap-2.5 items-center bg-zinc-950 p-3 rounded-2xl border border-zinc-800">
                <div className="aspect-square rounded-xl overflow-hidden border border-zinc-800">
                  <img src={activePhoto} alt="Corte realizado" className="w-full h-full object-cover" />
                </div>
                <div className="col-span-2 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">Fórmula de Sillón:</span>
                  <p className="text-[11px] text-zinc-300">
                    {clientMemory?.technicalFormula || 'Fade 0 a 2 en V, navaja en contornos y textura superior.'}
                  </p>
                </div>
              </div>

              {/* Lo que te gustó y ajuste */}
              <div className="space-y-2">
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-0.5">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase">Lo que mantendremos:</span>
                  <p className="text-[11px] text-zinc-200">{activeLiked}</p>
                </div>
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-0.5">
                  <span className="text-[10px] font-bold text-amber-400 uppercase">Ajuste para tu próxima cita:</span>
                  <p className="text-[11px] text-zinc-200">{activeAdjustment}</p>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsVisitDetailsModalOpen(false);
                  handleRepeatStyle();
                }}
                className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black flex items-center justify-center gap-2 shadow-xl transition cursor-pointer text-xs"
              >
                <Calendar className="w-4 h-4" />
                <span>Agendar Nueva Cita con Álvaro Ortiz</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9.5 MODAL DE REGISTRO RÁPIDO PARA ACTIVAR TARJETA DE SELLOS */}
      {isLoyaltyRegisterModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="w-full sm:max-w-sm bg-zinc-900 border-t sm:border-2 border-amber-500/60 rounded-t-3xl sm:rounded-3xl p-5 space-y-4 shadow-2xl text-xs max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-amber-500 text-black font-black">
                  <Gift className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-white">Activar Tarjeta de Fidelización</h3>
                  <span className="text-[10px] text-amber-400 font-bold uppercase">{currentBusiness.name}</span>
                </div>
              </div>
              <button
                onClick={() => setIsLoyaltyRegisterModalOpen(false)}
                className="text-xs text-zinc-400 hover:text-white px-2 py-1 bg-zinc-800 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-center space-y-1">
              <div className="text-amber-400 font-black text-xs flex items-center justify-center gap-1">
                <span>✂️ ¡1 CORTE DE CABELLO GRATIS!</span>
              </div>
              <p className="text-[11px] text-zinc-300">
                Regístrate con tu nombre y teléfono para que tu barbero pueda estampar tus sellos digitales en cada visita.
              </p>
            </div>

            <form onSubmit={handleRegisterLoyalty} className="space-y-3.5">
              <div>
                <label className="font-bold text-zinc-300 block mb-1">Tu Nombre Completo:</label>
                <input
                  type="text"
                  required
                  value={regClientName}
                  onChange={(e) => setRegClientName(e.target.value)}
                  placeholder="Ej: Pedro Duarte"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-white font-bold text-xs focus:border-amber-400 outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-zinc-300 block mb-1">Tu Teléfono / WhatsApp:</label>
                <input
                  type="tel"
                  required
                  value={regClientPhone}
                  onChange={(e) => setRegClientPhone(e.target.value)}
                  placeholder="Ej: +57 310 999 8877"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-white font-mono text-xs focus:border-amber-400 outline-none"
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  * Tus sellos se vincularán a este número para que nunca los pierdas.
                </span>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsLoyaltyRegisterModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black shadow-lg cursor-pointer"
                >
                  ⭐ Activar Mi Tarjeta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 10. MODAL DE TARJETA DIGITAL DE FIDELIZACIÓN & SELLOS */}
      {isLoyaltyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="w-full sm:max-w-md bg-zinc-900 border-t sm:border border-zinc-700 rounded-t-3xl sm:rounded-3xl p-5 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto">

            {/* Header del Modal */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Gift className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white">Tarjeta Digital de Fidelización</h3>
                  <span className="text-[10px] text-amber-400 font-bold uppercase">{currentBusiness.name}</span>
                </div>
              </div>
              <button
                onClick={() => setIsLoyaltyModalOpen(false)}
                className="text-xs text-zinc-400 hover:text-white px-2 py-1 bg-zinc-800 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Banner de Cliente Registrado */}
            <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 flex items-center justify-between gap-2 text-xs">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-bold block">Titular de la Tarjeta:</span>
                <span className="font-black text-white">{currentUser.fullName}</span>
                <span className="text-[10px] text-zinc-400 block font-mono">{currentUser.phone || '+57 310 999 8877'}</span>
              </div>
              <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                ✓ ACTIVA
              </span>
            </div>

            {/* Tarjeta Visual de Sellos */}
            <div className="p-4 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 rounded-2xl border border-amber-500/30 space-y-4 shadow-inner">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-extrabold text-amber-400 tracking-wider block">Progreso hacia tu Corte Gratis</span>
                  <div className="text-sm font-black text-white">4 de {currentBusiness.loyalty.stampsThreshold || 6} Sellos Acumulados</div>
                </div>
                <span className="text-xs font-black px-2.5 py-1 rounded-full bg-amber-500 text-black shadow">
                  66.6%
                </span>
              </div>

              {/* Grid de 8 Sellos */}
              <div className="grid grid-cols-4 gap-2.5">
                {[...Array(currentBusiness.loyalty.stampsThreshold || 8)].map((_, idx) => {
                  const isCompleted = idx === 0;
                  const isFinalPrize = idx === (currentBusiness.loyalty.stampsThreshold || 8) - 1;

                  return (
                    <div
                      key={idx}
                      className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center p-1.5 border transition ${
                        isCompleted
                          ? 'bg-amber-500/15 border-amber-500 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                          : isFinalPrize
                          ? 'bg-gradient-to-br from-amber-500 to-amber-600 border-amber-400 text-black font-black animate-pulse'
                          : 'bg-zinc-900/60 border-zinc-800 text-zinc-600 border-dashed'
                      }`}
                    >
                      {isCompleted ? (
                        <>
                          <Scissors className="w-5 h-5 text-amber-400" />
                          <span className="text-[9px] font-black text-amber-400 mt-1">✓ Sello 1</span>
                        </>
                      ) : isFinalPrize ? (
                        <>
                          <Gift className="w-5 h-5 text-black" />
                          <span className="text-[8px] font-black text-black leading-tight text-center mt-0.5">¡PREMIO!</span>
                        </>
                      ) : (
                        <>
                          <span className="text-sm font-extrabold text-zinc-600">#{idx + 1}</span>
                          <span className="text-[8px] text-zinc-600">Pendiente</span>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Barra de Progreso */}
              <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: '12.5%' }} />
              </div>
            </div>

            {/* Reglas y Explicación */}
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-1.5">
                <span className="font-bold text-white block flex items-center gap-1.5 text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Tu Recompensa Oficial:</span>
                </span>
                <p className="text-amber-400 font-extrabold text-xs">
                  {currentBusiness.loyalty.rewardDescription}
                </p>
                <p className="text-[11px] text-zinc-400 pt-1 border-t border-zinc-900 leading-relaxed">
                  Por cada visita y servicio en {currentBusiness.name}, Álvaro Ortiz sella tu tarjeta digital. En tu visita #{currentBusiness.loyalty.stampsThreshold || 8} recibes tu premio sin costo alguno.
                </p>
              </div>

              {/* Control de Seguridad Antifraude */}
              <div className="p-3 bg-zinc-950 rounded-2xl border border-emerald-500/30 space-y-1 text-[11px]">
                <div className="flex items-center gap-1.5 text-emerald-400 font-extrabold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Sellado Exclusivo por el Barbero:</span>
                </div>
                <p className="text-zinc-300 leading-relaxed text-[11px]">
                  <strong>El cliente tiene acceso de solo lectura y no puede modificarse los sellos.</strong> Cada sello digital es emitido y validado únicamente por el barbero (<strong>{currentBusiness.ownerName}</strong>) en su panel de administración al momento de cobrar el servicio en el sillón.
                </p>
              </div>

              {/* Nota sobre configuración del dueño */}
              <div className="p-2.5 bg-zinc-950/60 rounded-xl border border-zinc-800/80 text-[10px] text-zinc-400 space-y-1">
                <span className="font-bold text-zinc-300 block">⚙️ Personalización para el Dueño:</span>
                <p>
                  El propietario ({currentBusiness.ownerName}) puede modificar el número de visitas necesarias (ej: 5, 8 o 10 visitas) o cambiar el premio en cualquier momento desde su panel de administración.
                </p>
              </div>

              {/* Botón de Agendar */}
              <button
                onClick={() => {
                  setIsLoyaltyModalOpen(false);
                  if (businessServices.length > 0) setSelectedService(businessServices[0]);
                  setActiveTab('booking');
                }}
                className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black flex items-center justify-center gap-2 shadow-xl transition cursor-pointer text-xs"
              >
                <Calendar className="w-4 h-4" />
                <span>Agendar Cita para Sumar Sello #{2}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 11. MODAL DE TURNO EN VIVO / SALA DE ESPERA: "QUIERO ESTE CORTE" */}
      {isWalkInModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-3xl p-5 space-y-4 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Bell className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white">Anunciar Llegada en Sala de Espera</h3>
                  <span className="text-[10px] text-amber-400 font-bold uppercase">{currentBusiness.name} • Turno en Vivo</span>
                </div>
              </div>
              <button
                onClick={() => setIsWalkInModalOpen(false)}
                className="text-xs text-zinc-400 hover:text-white px-2 py-1 bg-zinc-800 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {walkInSent ? (
              <div className="p-5 text-center space-y-3 bg-zinc-950 rounded-2xl border border-emerald-500/30 animate-fade-in">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <h4 className="text-base font-black text-white">¡Álvaro ya recibió tu alerta en vivo! 🛎️</h4>
                <p className="text-xs text-zinc-300">
                  Tu barbero ya tiene en su pantalla la foto del corte que pediste (<strong>{walkInStyle}</strong>).
                </p>
                <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 text-[11px] text-amber-400 font-bold">
                  🪑 Por favor toma asiento en la sala de espera. Te llamaremos en breve por tu nombre ({currentUser.fullName !== 'Cliente Invitado' ? currentUser.fullName : 'Pedro Duarte'}).
                </div>
                <button
                  onClick={() => setIsWalkInModalOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition cursor-pointer"
                >
                  Entendido
                </button>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2">
                  <span className="font-bold text-zinc-300 block">1. Estilo / Corte que deseas hoy:</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setWalkInStyle('Mi Estilo de Memoria (El Siete Colombiano)')}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition ${
                        walkInStyle.includes('Memoria')
                          ? 'bg-amber-500/20 border-amber-500 text-white font-bold'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <img src={activePhoto} alt="" className="w-8 h-8 rounded-lg object-cover" />
                      <div className="truncate">
                        <div className="truncate text-[11px]">Mi Memoria</div>
                        <div className="text-[9px] text-amber-400 truncate">El Siete</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setWalkInStyle('Mid Fade Crop Texturizado')}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition ${
                        walkInStyle.includes('Mid Fade')
                          ? 'bg-amber-500/20 border-amber-500 text-white font-bold'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <img src="/styles/mid-fade-crop.jpg" alt="" className="w-8 h-8 rounded-lg object-cover" />
                      <div className="truncate">
                        <div className="truncate text-[11px]">Mid Fade</div>
                        <div className="text-[9px] text-amber-400 truncate">Crop Urbano</div>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2">
                  <span className="font-bold text-zinc-300 block">2. Barbero de tu preferencia:</span>
                  <select
                    value={walkInBarber}
                    onChange={(e) => setWalkInBarber(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-white font-bold"
                  >
                    {businessBarbers.map((b) => (
                      <option key={b.id} value={b.fullName}>
                        {b.fullName}
                      </option>
                    ))}
                    <option value="Primer barbero libre">⚡ Primer barbero disponible</option>
                  </select>
                </div>

                <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-300 block">3. Instrucción especial para el barbero:</span>
                    <button
                      type="button"
                      onClick={() => {
                        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                        if (!SpeechRecognition) {
                          alert('Reconocimiento de voz no disponible');
                          return;
                        }
                        const recognition = new SpeechRecognition();
                        recognition.lang = 'es-CO';
                        recognition.start();
                        recognition.onresult = (ev: any) => {
                          const t = ev.results[0][0].transcript;
                          if (t) setWalkInNote((prev) => (prev ? `${prev} ${t}` : t));
                        };
                      }}
                      className="text-[10px] text-amber-400 font-bold flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 cursor-pointer"
                    >
                      <Mic className="w-2.5 h-2.5" />
                      <span>🎙️ Dictar</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={walkInNote}
                    onChange={(e) => setWalkInNote(e.target.value)}
                    placeholder="Ej: Degradado a la 1.5 y mantener 2 dedos arriba"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-white"
                  />
                </div>

                <button
                  onClick={() => {
                    const clientName = currentUser.fullName !== 'Cliente Invitado' ? currentUser.fullName : 'Pedro Duarte';
                    const clientPhone = currentUser.phone || '+57 310 555 1234';
                    WalkInService.createTicket({
                      businessId: currentBusiness.id,
                      type: 'walkin',
                      clientName,
                      clientPhone,
                      styleName: walkInStyle,
                      stylePhotoUrl: activePhoto,
                      specialNote: walkInNote || activeAdjustment,
                      barberName: walkInBarber,
                    });
                    setWalkInSent(true);
                  }}
                  className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black flex items-center justify-center gap-2 shadow-2xl transition cursor-pointer text-xs"
                >
                  <Bell className="w-4 h-4 stroke-[2.5]" />
                  <span>🛎️ ¡Avisar a Álvaro: "Quiero este corte"!</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 12. MODAL DE CONTROL DE ACCESO PRIVADO CON PIN DE SEGURIDAD */}
      {staffTargetRole && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-700 rounded-3xl p-5 space-y-4 shadow-2xl animate-fade-in text-xs">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Lock className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white">Acceso Restringido para el Personal</h3>
                  <span className="text-[10px] text-amber-400 font-bold uppercase">
                    {staffTargetRole === 'owner' ? 'Panel del Propietario' : 'Panel de Barberos en Sillón'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setStaffTargetRole(null);
                  setStaffPinInput('');
                  setStaffPinError('');
                }}
                className="text-xs text-zinc-400 hover:text-white px-2 py-1 bg-zinc-800 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleVerifyStaffPin} className="space-y-3">
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Este panel contiene herramientas de gestión privada. Introduce el PIN de seguridad de <strong>{currentBusiness.name}</strong> para ingresar:
              </p>

              <div>
                <label className="font-bold text-zinc-300 block mb-1.5">PIN de Seguridad del Local:</label>
                <input
                  type="password"
                  required
                  autoFocus
                  maxLength={10}
                  value={staffPinInput}
                  onChange={(e) => {
                    setStaffPinInput(e.target.value);
                    setStaffPinError('');
                  }}
                  placeholder="Introduce tu PIN de seguridad"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-center text-white font-mono text-base tracking-widest focus:outline-none focus:border-amber-500"
                />
              </div>

              {staffPinError && (
                <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-[11px] font-semibold text-center animate-shake">
                  {staffPinError}
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setStaffTargetRole(null);
                    setStaffPinInput('');
                    setStaffPinError('');
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-300 font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={staffPinLoading}
                  className={`flex-1 py-2.5 rounded-xl font-black shadow-lg transition cursor-pointer ${staffPinLoading ? 'bg-zinc-600 text-zinc-400' : 'bg-amber-500 hover:bg-amber-400 text-black'}`}
                >
                  {staffPinLoading ? 'Verificando...' : 'Entrar al Panel'}
                </button>
              </div>

              <div className="text-center pt-1 text-[10px] text-zinc-500">
                <span>🔐 Acceso protegido por autenticación segura multi-tenant</span>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer B2B & Acceso Directo a los Paneles de Trabajo (Protegido por PIN) */}
      <div className="text-center pt-6 pb-2 text-xs text-zinc-500 space-y-3 border-t border-zinc-900 mt-6">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => setStaffTargetRole('barber')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-bold border border-zinc-800 hover:border-amber-500/40 transition shadow cursor-pointer text-[11px]"
          >
            <Scissors className="w-3.5 h-3.5 text-amber-400" />
            <span>✂️ App del Barbero / Colaborador (Sillón & Cola en Vivo)</span>
          </button>

          <button
            onClick={() => setStaffTargetRole('owner')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-amber-400 hover:text-amber-300 font-bold border border-zinc-800 hover:border-amber-500/40 transition shadow cursor-pointer text-[11px]"
          >
            <Store className="w-3.5 h-3.5" />
            <span>🔐 App del Dueño (Administración & Precios)</span>
          </button>
        </div>

        <div className="space-y-0.5 text-[10px]">
          <div>ARIZSHOP BARBER — Plataforma Oficial</div>
          <div className="text-zinc-600">Sistema Multi-Tenant y Reservas en Vivo</div>
        </div>
      </div>
    </div>
  );
};
