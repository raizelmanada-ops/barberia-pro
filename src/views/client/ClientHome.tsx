import React, { useState, useMemo, useEffect, useRef } from 'react';


import { useTenant } from '../../core/tenant/TenantContext';
import { useAuth } from '../../core/auth/AuthContext';
import { INITIAL_BARBERS, INITIAL_SERVICES, INITIAL_STYLE_MEMORIES } from '../../database/mockData';
import { Service, BarberProfile, StyleMemory } from '../../core/types';
import { BeardStyle } from '../../database/beardStylesData';
import { OFFICIAL_STYLES_LIBRARY } from '../../database/stylesLibraryData';

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
  Trash2,
  X,
  MapPin,
  MessageCircle,
  ExternalLink
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
  const { currentUser, setRole, loginAsClient } = useAuth();

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

  // Servicios activos con sincronización en tiempo real ante ediciones del barbero o dueño
  const [businessServices, setBusinessServices] = useState<Service[]>(() =>
    ServiceCatalogService.getServicesByBusiness(currentBusiness.id).filter(s => s.isActive)
  );

  useEffect(() => {
    setBusinessServices(ServiceCatalogService.getServicesByBusiness(currentBusiness.id).filter(s => s.isActive));
    const handleServicesUpdate = () => {
      setBusinessServices(ServiceCatalogService.getServicesByBusiness(currentBusiness.id).filter(s => s.isActive));
    };
    window.addEventListener('barberia:services_updated', handleServicesUpdate);
    return () => window.removeEventListener('barberia:services_updated', handleServicesUpdate);
  }, [currentBusiness.id]);

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

  // Estados para Dictado por Voz (Micrófono) con soporte para Detener y Borrar
  const [isListeningLiked, setIsListeningLiked] = useState(false);
  const [isListeningAdjustment, setIsListeningAdjustment] = useState(false);
  const [isListeningWalkIn, setIsListeningWalkIn] = useState(false);
  const activeRecognitionRef = useRef<any>(null);

  const stopVoiceDictation = () => {
    try {
      if (activeRecognitionRef.current) {
        activeRecognitionRef.current.stop();
        activeRecognitionRef.current = null;
      }
    } catch (e) {
      console.warn('Error stopping speech recognition', e);
    }
    setIsListeningLiked(false);
    setIsListeningAdjustment(false);
    setIsListeningWalkIn(false);
  };

  const startVoiceDictation = (target: 'liked' | 'adjustment' | 'walkin') => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Tu navegador no soporta reconocimiento de voz nativo. Puedes escribir directamente en el cuadro de texto.');
      return;
    }

    // Detener cualquier sesión previa activa
    stopVoiceDictation();

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-CO';
      recognition.continuous = false;
      recognition.interimResults = false;
      activeRecognitionRef.current = recognition;

      if (target === 'liked') {
        setIsListeningLiked(true);
        if (!isEditingLiked) {
          setDraftLiked(activeLiked);
          setIsEditingLiked(true);
        }
      } else if (target === 'adjustment') {
        setIsListeningAdjustment(true);
        if (!isEditingAdjustment) {
          setDraftAdjustment(activeAdjustment);
          setIsEditingAdjustment(true);
        }
      } else {
        setIsListeningWalkIn(true);
      }

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          if (target === 'liked') {
            setDraftLiked((prev) => (prev ? `${prev} ${transcript}` : transcript));
          } else if (target === 'adjustment') {
            setDraftAdjustment((prev) => (prev ? `${prev} ${transcript}` : transcript));
          } else {
            setWalkInNote((prev) => (prev ? `${prev} ${transcript}` : transcript));
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error', event.error);
        stopVoiceDictation();
      };

      recognition.onend = () => {
        stopVoiceDictation();
      };

      recognition.start();
    } catch (err) {
      console.warn('Error starting speech recognition', err);
      stopVoiceDictation();
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
  const primaryBarber = businessBarbers[0];
  const primaryBarberName = primaryBarber?.fullName || currentBusiness.ownerName || 'Tu Barbero';
  const primaryBarberFirstName = primaryBarberName.split(' ')[0];

  const [walkInBarber, setWalkInBarber] = useState(primaryBarberName);
  const [walkInSent, setWalkInSent] = useState(false);
  const [walkInNote, setWalkInNote] = useState('');
  const [walkInStyle, setWalkInStyle] = useState('Mi Estilo de Memoria (El Siete Colombiano)');
  const [walkInPhoto, setWalkInPhoto] = useState<string>(activePhoto);
  const [isStylePickerModalOpen, setIsStylePickerModalOpen] = useState(false);
  const [stylePickerDomain, setStylePickerDomain] = useState<'todos' | 'cabello' | 'barba' | 'combos'>('todos');
  const [stylePickerSearch, setStylePickerSearch] = useState('');

  const filteredPickerStyles = useMemo(() => {
    return OFFICIAL_STYLES_LIBRARY.filter(s => {
      const matchDomain = stylePickerDomain === 'todos' || s.domain === stylePickerDomain;
      const matchSearch = !stylePickerSearch.trim() ||
        s.name.toLowerCase().includes(stylePickerSearch.toLowerCase()) ||
        s.category.toLowerCase().includes(stylePickerSearch.toLowerCase());
      return matchDomain && matchSearch;
    });
  }, [stylePickerDomain, stylePickerSearch]);

  const handleRepeatStyle = () => {
    setBookingMode('repeat');
    if (businessServices.length > 0) setSelectedService(businessServices[0]);
    if (businessBarbers.length > 0) setSelectedBarber(businessBarbers[0]);
    setCustomStyleNote(`Mantener: ${activeLiked}. Ajuste indicado: ${activeAdjustment}`);
    setActiveTab('booking');
  };


  const [selectedBeardStyle, setSelectedBeardStyle] = useState<BeardStyle | null>(null);

  const handleSelectStyleFromCatalog = (style: any) => {
    setSelectedBeardStyle(style);
    setWalkInStyle(style.name);
    setWalkInPhoto(style.image || style.thumbnail || '/styles/hair_01.jpg');
    setCustomStyleNote(`Estilo Solicitado: ${style.name} (${style.category || style.domain || ''})`);
    if (businessServices.length > 0) setSelectedService(businessServices[0]);
    setActiveTab('home');
    setIsWalkInModalOpen(true);
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
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-6 pb-32 animate-fade-in">
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 transition hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>Biblioteca</span>
          </button>

          {/* Acceso para el Personal y Administrador */}
          <button
            onClick={() => setStaffTargetRole('owner')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-amber-400 border border-zinc-800 hover:border-amber-500/40 transition cursor-pointer shadow text-xs font-bold"
            title="Ingreso de Barberos y Administrador (PIN)"
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Equipo / Admin</span>
          </button>
        </div>
      </div>

      {/* 🛎️ ACCIÓN #1 DE ENTRADA: ¿LLEGASTE AL LOCAL? TOMA TU TURNO AL INSTANTE */}
      <section className="rounded-3xl p-4.5 sm:p-5 bg-gradient-to-r from-amber-500/20 via-zinc-900 to-zinc-950 border-2 border-amber-500/50 shadow-2xl relative overflow-hidden space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500 text-black font-black text-xs shadow flex items-center gap-1">
              <Bell className="w-4 h-4" />
              <span>SALA DE ESPERA EN VIVO</span>
            </span>
            <span className="text-xs text-zinc-300 font-bold hidden sm:inline-block">¿Llegaste a la barbería?</span>
          </div>
          <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> ATENDIENDO EN VIVO
          </span>
        </div>

        <div className="grid sm:grid-cols-2 gap-2.5 pt-0.5">
          <button
            onClick={() => {
              setWalkInSent(false);
              setIsWalkInModalOpen(true);
            }}
            className="w-full py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25 transition cursor-pointer hover:scale-102 active:scale-98"
          >
            <Bell className="w-4 h-4 stroke-[3]" />
            <span>🎟️ ¡TOMAR MI TURNO AHORA!</span>
          </button>

          <button
            onClick={() => {
              setBookingMode('standard');
              setActiveTab('booking');
            }}
            className="w-full py-3.5 px-4 rounded-2xl bg-zinc-850 hover:bg-zinc-800 text-amber-400 hover:text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-zinc-700 shadow transition cursor-pointer"
          >
            <Calendar className="w-4 h-4" />
            <span>📅 Agendar Cita para Otro Día</span>
          </button>
        </div>
      </section>

      {/* 🌟 2. BIBLIOTECA VISUAL OFICIAL — CATÁLOGO DE CORTES, BARBAS Y COMBOS */}
      <section
        onClick={() => setActiveTab('catalog')}
        className="rounded-3xl p-5 sm:p-6 bg-gradient-to-r from-amber-500/15 via-zinc-900 to-zinc-900 border border-zinc-800 shadow-xl relative overflow-hidden group cursor-pointer hover:border-amber-500/50 transition"
      >

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-black bg-amber-500 px-3 py-1 rounded-full shadow">
              <Sparkles className="w-3.5 h-3.5" /> Biblioteca Visual Oficial
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white group-hover:text-amber-400 transition">
              Catálogo de Cortes, Barbas y Combos
            </h3>
            <p className="text-xs sm:text-sm text-zinc-300 max-w-lg leading-relaxed">
              Explora más de 40 estilos profesionales con fotos reales en alta definición (Fades, Taper, Clásicos, Barbas perfiladas y Combos). Elige el tuyo y solicítalo en tu cita.
            </p>

            {/* Píldoras rápidas de categorías */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 flex items-center gap-1">
                <Scissors className="w-3 h-3 text-amber-400" /> Cortes & Fades
              </span>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" /> Barbas Perfiladas
              </span>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 flex items-center gap-1">
                <Gift className="w-3 h-3 text-amber-400" /> Combos & Rituales
              </span>
            </div>

            <div className="pt-2 flex items-center gap-2 text-xs sm:text-sm font-black text-amber-400 group-hover:translate-x-1 transition">
              <span>👉 Explorar Catálogo Completo y Elegir Estilo</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 shrink-0 sm:w-48">
            <div className="aspect-square rounded-2xl overflow-hidden border border-amber-500/30 shadow-md bg-zinc-950">
              <img
                src="/styles/hair_01.jpg"
                alt="Corte Taper"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              />
            </div>
            <div className="aspect-square rounded-2xl overflow-hidden border border-amber-500/30 shadow-md bg-zinc-950">
              <img
                src="/styles/beard_01.jpg"
                alt="Barba Perfilada"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 📅 2. SERVICIOS DISPONIBLES & RESERVAS DIRECTAS */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
            <Scissors className="w-4 h-4 text-amber-400" />
            <span>Servicios & Precios ({businessServices.length})</span>
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
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-black text-black transition shadow hover:scale-105 active:scale-95 cursor-pointer"
                style={{ backgroundColor: 'var(--brand-primary)' }}
              >
                Reservar
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 📸 3. TU MEMORIA DE ESTILO CAPILAR */}
      {clientMemory ? (
        <section id="memory-section" className="rounded-2xl p-4.5 bg-gradient-to-br from-zinc-900 to-zinc-900/70 border border-zinc-800 shadow-xl relative overflow-hidden">

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
              className="text-xs font-bold px-3 py-1.5 rounded-full bg-zinc-800 hover:bg-zinc-750 text-zinc-300 hover:text-white border border-zinc-700 flex items-center gap-1.5 transition shadow cursor-pointer"
            >
              <span>📅 Ver Última Visita</span>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
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
            <div className="sm:col-span-2 space-y-3 text-xs sm:text-sm">
              <div className="bg-zinc-950/70 p-3.5 rounded-2xl border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs sm:text-sm font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <ThumbsUp className="w-4 h-4" /> Lo que te gustó:
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startVoiceDictation('liked')}
                      className={`text-xs font-bold flex items-center gap-1.5 px-2.5 py-1 rounded-xl border transition cursor-pointer shadow-sm ${
                        isListeningLiked
                          ? 'bg-red-500 text-white border-red-400 animate-pulse'
                          : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border-emerald-500/40'
                      }`}
                      title="Hablar por micrófono para dictar lo que te gustó"
                    >
                      <Mic className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>{isListeningLiked ? 'Escuchando...' : 'Dictar por Voz'}</span>
                    </button>

                    {!isEditingLiked && (
                      <button
                        onClick={() => {
                          setDraftLiked(activeLiked);
                          setIsEditingLiked(true);
                        }}
                        className="text-xs text-zinc-300 hover:text-white font-medium flex items-center gap-1 px-2 py-1 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 transition cursor-pointer"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>Editar</span>
                      </button>
                    )}
                  </div>
                </div>

                {isListeningLiked && (
                  <div className="text-xs font-bold text-red-400 flex items-center gap-2 animate-pulse bg-red-500/10 p-2 rounded-xl border border-red-500/30">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0" />
                    <span>🎙️ Habla ahora: Estamos escuchando lo que te gusta de tu corte...</span>
                  </div>
                )}

                {isEditingLiked ? (
                  <div className="space-y-2 pt-1 animate-fade-in">
                    <textarea
                      rows={2}
                      value={draftLiked}
                      onChange={(e) => setDraftLiked(e.target.value)}
                      placeholder="Escribe o dicta lo que te encanta de tu corte..."
                      className="w-full bg-zinc-900 border border-emerald-500/50 rounded-xl p-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-400 shadow-inner"
                      autoFocus
                    />
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setIsEditingLiked(false)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-400 hover:text-white bg-zinc-800 transition cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleSaveLiked(draftLiked)}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-black text-black bg-emerald-500 hover:bg-emerald-400 flex items-center gap-1 transition shadow cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Guardar</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-zinc-200 font-medium leading-relaxed">
                    {activeLiked}
                  </div>
                )}
              </div>

              <div className="bg-zinc-950/70 p-3.5 rounded-2xl border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs sm:text-sm font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" /> Ajuste para la próxima:
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startVoiceDictation('adjustment')}
                      className={`text-xs font-bold flex items-center gap-1.5 px-2.5 py-1 rounded-xl border transition cursor-pointer shadow-sm ${
                        isListeningAdjustment
                          ? 'bg-red-500 text-white border-red-400 animate-pulse'
                          : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border-amber-500/40'
                      }`}
                      title="Hablar por micrófono para dictar el ajuste para tu barbero"
                    >
                      <Mic className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>{isListeningAdjustment ? 'Escuchando...' : 'Dictar por Voz'}</span>
                    </button>

                    {!isEditingAdjustment && (
                      <button
                        onClick={() => {
                          setDraftAdjustment(activeAdjustment);
                          setIsEditingAdjustment(true);
                        }}
                        className="text-xs text-zinc-300 hover:text-white font-medium flex items-center gap-1 px-2 py-1 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 transition cursor-pointer"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>Editar</span>
                      </button>
                    )}
                  </div>
                </div>

                {isListeningAdjustment && (
                  <div className="text-xs font-bold text-red-400 flex items-center gap-2 animate-pulse bg-red-500/10 p-2 rounded-xl border border-red-500/30">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0" />
                    <span>🎙️ Habla ahora: Cuéntanos el ajuste especial para {primaryBarberFirstName}...</span>
                  </div>
                )}

                {isEditingAdjustment ? (
                  <div className="space-y-2 pt-1 animate-fade-in">
                    <textarea
                      rows={2}
                      value={draftAdjustment}
                      onChange={(e) => setDraftAdjustment(e.target.value)}
                      placeholder={`Escribe o dicta tu ajuste especial para ${primaryBarberFirstName}...`}
                      className="w-full bg-zinc-900 border border-amber-500/50 rounded-xl p-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 shadow-inner"
                      autoFocus
                    />
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setIsEditingAdjustment(false)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-400 hover:text-white bg-zinc-800 transition cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleSaveAdjustment(draftAdjustment)}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-black text-black bg-amber-500 hover:bg-amber-400 flex items-center gap-1 transition shadow cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Guardar Ajuste</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-zinc-200 font-medium leading-relaxed">
                    "{activeAdjustment}"
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Acordeón colapsable: Ficha técnica para el barbero */}
          {clientMemory.technicalFormula && (
            <details className="group bg-zinc-950/60 rounded-2xl border border-zinc-800/80 p-3 mt-3">
              <summary className="text-xs font-bold text-amber-400 flex items-center justify-between cursor-pointer list-none select-none">
                <span className="flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5" />
                  <span>✂️ Ficha técnica para el barbero (Ver fórmula)</span>
                </span>
                <ChevronRight className="w-4 h-4 text-zinc-400 group-open:rotate-90 transition-transform" />
              </summary>
              <div className="pt-2 text-xs font-mono text-zinc-300 border-t border-zinc-800/60 mt-2 leading-relaxed">
                {clientMemory.technicalFormula}
              </div>
            </details>
          )}

          {/* CTA PRIMARIO: REPETIR MI ESTILO CON AJUSTES */}
          <div className="mt-3.5 pt-3.5 border-t border-zinc-800/80">
            <button
              onClick={handleRepeatStyle}
              className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 transition cursor-pointer active:scale-98"
            >
              <RotateCcw className="w-4 h-4 stroke-[3]" />
              <span>Repetir mi estilo con ajustes</span>
            </button>
          </div>
        </section>
      ) : (
        /* Empty State si el cliente aún no tiene memoria guardada */
        <section className="rounded-2xl p-4 bg-zinc-900/60 border border-zinc-800 text-center space-y-2">

          <div className="w-10 h-10 mx-auto rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
            <Scissors className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Tu Memoria de Estilo Capilar</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Aún no tienes un corte registrado en {currentBusiness.name}. Al finalizar tu cita con {primaryBarberName}, registraremos tu degradado, fórmula técnica y fotos para que puedas repetir tu estilo con un solo toque.
          </p>
        </section>
      )}

      {/* 🎁 4. CLUB DE FIDELIZACIÓN: 1 CORTE GRATIS */}
      <section
        onClick={() => {
          if (currentUser.id === 'guest' || currentUser.fullName === 'Cliente Invitado') {
            setIsLoyaltyRegisterModalOpen(true);
          } else {
            setIsLoyaltyModalOpen(true);
          }
        }}
        className="rounded-3xl p-5 bg-gradient-to-r from-amber-500/20 via-zinc-900 to-amber-950/30 border border-amber-500/40 shadow-xl relative overflow-hidden group cursor-pointer hover:border-amber-400 transition"
      >
        <div className="flex items-center justify-between gap-3.5">
          <div className="space-y-1.5 flex-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-black bg-amber-500 px-3 py-0.5 rounded-full shadow">
              <Gift className="w-3.5 h-3.5" /> Club de Fidelización
            </div>
            <h3 className="text-base sm:text-lg font-black text-white group-hover:text-amber-400 transition flex items-center gap-1.5">
              <span>¡Acumula {currentBusiness.loyalty.stampsThreshold || 6} sellos y llévate 1 CORTE GRATIS!</span>
              <span className="text-base">✂️🎁</span>
            </h3>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              Por cada visita y servicio, tu barbero estampa tu tarjeta digital en su panel. En tu visita #{currentBusiness.loyalty.stampsThreshold || 6} recibes tu premio sin costo.
            </p>
            <div className="pt-1 flex items-center gap-2 text-xs sm:text-sm font-black text-amber-400">
              <span>
                {currentUser.id !== 'guest' && currentUser.fullName !== 'Cliente Invitado'
                  ? '⭐ Ver Mi Tarjeta de Sellos Digital'
                  : '👉 Activar Mi Tarjeta de Sellos'}
              </span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </div>
          </div>

          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-amber-500/15 border-2 border-amber-500/50 flex flex-col items-center justify-center text-amber-400 shrink-0 shadow-xl group-hover:scale-105 transition">
            <Gift className="w-7 h-7 text-amber-400 animate-bounce" />
            <span className="text-[10px] sm:text-xs font-black text-white mt-1 uppercase">Gratis</span>
          </div>
        </div>
      </section>

      {/* 👥 6. EQUIPO DE COLABORADORES & CALIFICACIONES EN VIVO (CARRUSEL HORIZONTAL) */}
      <section className="space-y-3 pt-2">

        <div className="flex items-center justify-between">

          <div>
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
              <Scissors className="w-4 h-4 text-amber-400" />
              <span>Nuestros Barberos ({businessBarbers.length})</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Desliza para conocer a los profesionales de {currentBusiness.name}
            </p>
          </div>
          <span className="text-[11px] text-amber-400/80 font-bold hidden sm:inline-block">← Desliza lateralmente →</span>
        </div>

        <div className="flex gap-3.5 overflow-x-auto pb-3 pt-1 snap-x snap-mandatory scrollbar-none">
          {businessBarbers.map((barber) => (
            <div
              key={barber.id}
              className="w-72 shrink-0 snap-start p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:border-amber-500/40 transition shadow-lg space-y-3"
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
                        {barber.happyClientsPct}% Satisfechos
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
                  className="py-2 px-2 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-300 hover:text-white font-medium text-xs flex items-center justify-center gap-1 border border-zinc-700 transition cursor-pointer"
                >
                  <Star className="w-3.5 h-3.5 text-amber-400" />
                  <span>Calificar</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedBarber(barber);
                    if (businessServices.length > 0) setSelectedService(businessServices[0]);
                    setBookingMode('standard');
                    setActiveTab('booking');
                  }}
                  className="py-2 px-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-400 hover:text-black font-bold text-xs flex items-center justify-center gap-1.5 border border-amber-500/40 shadow-sm transition cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Agendar Cita</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>


      {/* 📍 7. VISÍTANOS / CONTACTO */}
      <section className="rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Store className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                <span>📍 Visítanos / Contacto</span>
              </h3>
              <p className="text-xs text-zinc-400">
                {currentBusiness.name} • {currentBusiness.slogan || 'Elegancia, precisión y estilo clásico.'}
              </p>
            </div>
          </div>
        </div>

        {/* 1. Ubicación y WhatsApp */}
        <div className="grid sm:grid-cols-2 gap-3 text-xs sm:text-sm">
          {/* 📍 Ubicación */}
          <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/90 flex items-start justify-between gap-3 shadow-inner">
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-black text-white">Ubicación:</div>
                <p className="text-zinc-300 mt-0.5 leading-relaxed">
                  {currentBusiness.address && currentBusiness.address !== 'Pendiente de configuración'
                    ? currentBusiness.address
                    : 'Bogotá, Colombia'}
                  {currentBusiness.neighborhood && currentBusiness.neighborhood !== 'Pendiente de configuración'
                    ? ` • ${currentBusiness.neighborhood}`
                    : ''}
                </p>
              </div>
            </div>
            <a
              href={
                currentBusiness.googleMapsUrl ||
                `https://maps.google.com/?q=${encodeURIComponent(`${currentBusiness.name} ${currentBusiness.address || 'Bogota'}`)}`
              }
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-amber-400 border border-amber-500/30 text-xs font-black shrink-0 flex items-center gap-1.5 transition shadow hover:scale-105"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Cómo llegar</span>
              <ExternalLink className="w-3 h-3 text-zinc-400" />
            </a>
          </div>

          {/* 💬 WhatsApp */}
          <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/90 flex items-start justify-between gap-3 shadow-inner">
            <div className="flex items-start gap-2.5">
              <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-black text-white">WhatsApp:</div>
                <p className="text-zinc-300 mt-0.5">{currentBusiness.whatsapp || currentBusiness.phone || '+57 310 236 5163'}</p>
              </div>
            </div>
            <a
              href={`https://wa.me/${(currentBusiness.whatsapp || currentBusiness.phone || '573102365163').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hola ${currentBusiness.name}, me gustaría consultar sobre los servicios y agendar una cita.`)}`}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black shrink-0 flex items-center gap-1.5 transition shadow hover:scale-105 active:scale-95"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Escribir por WhatsApp</span>
            </a>
          </div>
        </div>

        {/* 2. Redes Sociales & ⭐ Opiniones */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-zinc-800/70">
          {/* 📱 Redes Sociales */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-zinc-400 font-bold">Redes sociales:</span>
            {currentBusiness.instagramUrl ? (
              <a
                href={currentBusiness.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-pink-600/20 text-zinc-300 hover:text-pink-400 border border-zinc-700 hover:border-pink-500/30 text-xs font-bold flex items-center gap-1.5 transition"
              >
                <svg className="w-3.5 h-3.5 text-pink-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                </svg>
                <span>Instagram</span>
              </a>
            ) : null}
            {currentBusiness.tiktokUrl ? (
              <a
                href={currentBusiness.tiktokUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 text-xs font-bold flex items-center gap-1.5 transition"
              >
                <span>🎵 TikTok</span>
              </a>
            ) : null}
            {currentBusiness.facebookUrl ? (
              <a
                href={currentBusiness.facebookUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-blue-600/20 text-zinc-300 hover:text-blue-400 border border-zinc-700 hover:border-blue-500/30 text-xs font-bold flex items-center gap-1.5 transition"
              >
                <span>👥 Facebook</span>
              </a>
            ) : null}
          </div>

          {/* ⭐ Opiniones */}
          <div className="flex flex-wrap items-center gap-2">
            {currentBusiness.googleReviewUrl && (
              <a
                href={currentBusiness.googleReviewUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center gap-1.5 transition shadow hover:scale-105"
              >
                <Star className="w-3.5 h-3.5 fill-black text-black" />
                <span>Calificar en Google</span>
              </a>
            )}

            <button
              onClick={() => setActiveTab('feedback')}
              className="text-xs text-zinc-200 hover:text-white font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 transition cursor-pointer shadow hover:border-amber-500/40"
            >
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>Calificar mi experiencia</span>
            </button>
          </div>
        </div>
      </section>


      {/* 6. MODAL / TAB DE RESERVAS */}
      {activeTab === 'booking' && (

        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-start justify-center p-3 sm:p-4 pt-3 sm:pt-6 overflow-y-auto animate-fade-in">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-3xl p-5 space-y-4 shadow-2xl my-0">
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
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-start justify-center p-3 sm:p-4 pt-3 sm:pt-6 overflow-y-auto animate-fade-in">
          <div className="w-full sm:max-w-md bg-zinc-900 border border-zinc-700 rounded-3xl p-5 space-y-4 shadow-2xl my-0">
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
                  <span className="font-bold text-white">{primaryBarberName}</span>
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
                <span>Agendar Nueva Cita con {primaryBarberName}</span>
              </button>


            </div>
          </div>
        </div>
      )}

      {/* 9.5 MODAL DE REGISTRO RÁPIDO PARA ACTIVAR TARJETA DE SELLOS */}
      {isLoyaltyRegisterModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-start justify-center p-3 sm:p-4 pt-3 sm:pt-6 overflow-y-auto animate-fade-in">
          <div className="w-full sm:max-w-sm bg-zinc-900 border-2 border-amber-500/60 rounded-3xl p-5 space-y-4 shadow-2xl text-xs my-0">
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
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-start justify-center p-3 sm:p-4 pt-3 sm:pt-6 overflow-y-auto animate-fade-in">
          <div className="w-full sm:max-w-md bg-zinc-900 border border-zinc-700 rounded-3xl p-5 space-y-4 shadow-2xl my-0">


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
                  Por cada visita y servicio en {currentBusiness.name}, {primaryBarberName} sella tu tarjeta digital. En tu visita #{currentBusiness.loyalty.stampsThreshold || 8} recibes tu premio sin costo alguno.
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
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-start justify-center p-3 sm:p-4 pt-3 sm:pt-6 overflow-y-auto animate-fade-in">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-3xl p-5 space-y-4 shadow-2xl my-0">
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
                <h4 className="text-base font-black text-white">¡{walkInBarber && walkInBarber !== 'Primer barbero libre' ? walkInBarber.split(' ')[0] : primaryBarberFirstName} ya recibió tu alerta en vivo! 🛎️</h4>
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
              <div className="space-y-3.5 text-xs">
                <div className="p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-300 block">1. Estilo / Corte que deseas hoy:</span>
                    <span className="text-[10px] text-amber-400 font-black uppercase tracking-wider">
                      Foto & Fórmula
                    </span>
                  </div>

                  {/* Tarjeta Principal del Estilo Seleccionado */}
                  <div className="p-3 bg-zinc-900 border border-amber-500/50 rounded-2xl flex items-center gap-3.5 shadow-lg relative overflow-hidden">
                    <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-zinc-950 border border-amber-500/50 shrink-0 shadow-inner">
                      <img
                        src={walkInPhoto || activePhoto}
                        alt={walkInStyle}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/styles/hair_01.jpg'; }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="inline-flex items-center gap-1 text-[9px] font-black uppercase text-black bg-amber-500 px-2 py-0.5 rounded-md mb-1 shadow">
                        <Check className="w-3 h-3 stroke-[3]" /> Estilo Seleccionado
                      </div>
                      <h4 className="text-sm font-black text-white truncate">
                        {walkInStyle}
                      </h4>
                      <p className="text-[11px] text-zinc-300 line-clamp-2 mt-0.5 leading-relaxed">
                        {walkInStyle.includes('Memoria')
                          ? 'Fórmula: Fade 1.5 a 3 con tijera superior y patillas pulidas.'
                          : walkInStyle.includes('Mid Fade')
                          ? 'Fórmula: Degradado medio al ras con textura superior mate.'
                          : walkInStyle.includes('Taper')
                          ? 'Fórmula: Taper clásico ejecutivo en sienes y nuca.'
                          : walkInStyle.includes('Barba')
                          ? 'Fórmula: Perfilado con navaja, toalla caliente y bálsamo.'
                          : 'Fórmula profesional oficial de la barbería.'}
                      </p>
                    </div>
                  </div>

                  {/* Acciones de Selección: Galería de +44 Cortes o Repetir Memoria */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setIsStylePickerModalOpen(true)}
                      className="w-full py-2.5 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 transition cursor-pointer active:scale-98"
                    >
                      <Sparkles className="w-4 h-4 stroke-[2.5]" />
                      <span>Elegir de la Galería (+44 Cortes)</span>
                    </button>

                    {clientMemory && (
                      <button
                        type="button"
                        onClick={() => {
                          setWalkInStyle('Mi Memoria (' + (clientMemory.likedAspects?.[0] || 'Corte Personalizado') + ')');
                          setWalkInPhoto(activePhoto);
                        }}
                        className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          walkInStyle.includes('Memoria')
                            ? 'bg-zinc-800 border-amber-500 text-amber-400 font-black'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Usar Mi Último Corte</span>
                      </button>
                    )}
                  </div>
                </div>


                <div className="p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2">

                  <span className="font-bold text-zinc-300 block">2. Barbero de tu preferencia:</span>
                  <select
                    value={walkInBarber}
                    onChange={(e) => setWalkInBarber(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white font-bold text-xs focus:border-amber-400 outline-none cursor-pointer"
                  >
                    {businessBarbers.map((b) => (
                      <option key={b.id} value={b.fullName}>
                        {b.fullName}
                      </option>
                    ))}
                    <option value="Primer barbero libre">⚡ Primer barbero disponible</option>
                  </select>
                </div>

                <div className="p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-200 text-xs sm:text-sm">3. Instrucciones especiales para el barbero:</span>
                    <div className="flex items-center gap-1.5">
                      {walkInNote && (
                        <button
                          type="button"
                          onClick={() => setWalkInNote('')}
                          className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-300 hover:text-red-400 font-bold text-xs flex items-center gap-1 transition cursor-pointer border border-zinc-700 shadow"
                          title="Borrar texto para comenzar de nuevo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Borrar</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          if (isListeningWalkIn) {
                            stopVoiceDictation();
                          } else {
                            startVoiceDictation('walkin');
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md active:scale-95 ${
                          isListeningWalkIn
                            ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                            : 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20'
                        }`}
                      >
                        {isListeningWalkIn ? (
                          <>
                            <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                            <span>⏹️ Detener</span>
                          </>
                        ) : (
                          <>
                            <Mic className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Dictar por Voz</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {isListeningWalkIn && (
                    <div className="text-xs font-bold text-red-400 flex items-center justify-between animate-pulse bg-red-500/10 p-2.5 rounded-xl border border-red-500/30">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0" />
                        <span>🎙️ Escuchando... Habla claro a tu celular</span>
                      </div>
                      <button
                        type="button"
                        onClick={stopVoiceDictation}
                        className="px-2.5 py-0.5 rounded bg-red-500 hover:bg-red-400 text-white text-[10px] font-black cursor-pointer shadow"
                      >
                        Listo
                      </button>
                    </div>
                  )}

                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    💡 Toca <strong>Dictar por Voz</strong> para hablarle a tu celular o escribe notas para {walkInBarber && walkInBarber !== 'Primer barbero libre' ? walkInBarber.split(' ')[0] : primaryBarberFirstName}.
                  </p>

                  <div className="relative">
                    <input
                      type="text"
                      value={walkInNote}
                      onChange={(e) => setWalkInNote(e.target.value)}
                      placeholder="Ej: Degradado a la 1.5, desvanecido en V, no tocar patillas..."
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 pr-10 text-white text-xs sm:text-sm focus:border-amber-400 outline-none shadow-inner"
                    />
                    {walkInNote && (
                      <button
                        type="button"
                        onClick={() => setWalkInNote('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-red-400 p-1 cursor-pointer transition"
                        title="Borrar texto"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
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
                      stylePhotoUrl: walkInPhoto || activePhoto,
                      specialNote: walkInNote || activeAdjustment,
                      barberName: walkInBarber,
                    });
                    setWalkInSent(true);
                  }}
                  className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black flex items-center justify-center gap-2 shadow-2xl transition cursor-pointer text-xs sm:text-sm active:scale-98"
                >
                  <Bell className="w-4 h-4 stroke-[2.5]" />
                  <span>¡Avisar a {walkInBarber && walkInBarber !== 'Primer barbero libre' ? walkInBarber.split(' ')[0] : primaryBarberFirstName}: "Quiero este corte"!</span>
                </button>
              </div>



            )}
          </div>
        </div>
      )}

      {/* 🌟 MODAL SELECTOR VISUAL DE GALERÍA (+44 ESTILOS HD) */}
      {isStylePickerModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">

          <div className="w-full sm:max-w-2xl bg-zinc-900 border-t sm:border border-zinc-700 rounded-t-3xl sm:rounded-3xl p-4 sm:p-6 space-y-4 shadow-2xl max-h-[88vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white">Galería Visual Oficial de Cortes</h3>
                  <span className="text-[10px] text-amber-400 font-bold uppercase">{currentBusiness.name} • Elige tu estilo</span>
                </div>
              </div>
              <button
                onClick={() => setIsStylePickerModalOpen(false)}
                className="text-xs font-bold text-zinc-400 hover:text-white px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition cursor-pointer"
              >
                ✕ Cerrar
              </button>
            </div>

            {/* Buscador y Pestañas */}
            <div className="space-y-2.5 shrink-0">
              <input
                type="text"
                value={stylePickerSearch}
                onChange={(e) => setStylePickerSearch(e.target.value)}
                placeholder="🔍 Buscar estilo (ej: Low Fade, Taper, Stubble, Siete, Pompadour)..."
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-amber-400 outline-none"
              />
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {[
                  { key: 'todos', label: 'Todos (+44)' },
                  { key: 'cabello', label: '✂️ Cortes & Fades' },
                  { key: 'barba', label: '🧔 Barbas' },
                  { key: 'combos', label: '🔥 Combos' },
                ].map(tab => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setStylePickerDomain(tab.key as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                      stylePickerDomain === tab.key
                        ? 'bg-amber-500 text-black shadow-md'
                        : 'bg-zinc-800 text-zinc-300 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid Visual de Estilos */}
            <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-2.5 pr-1">
              {filteredPickerStyles.map((s) => {
                const isSelected = walkInStyle === s.name;
                return (
                  <div
                    key={s.id}
                    onClick={() => {
                      setWalkInStyle(s.name);
                      setWalkInPhoto(s.image || s.thumbnail || '/styles/hair_01.jpg');
                      setIsStylePickerModalOpen(false);
                    }}
                    className={`group rounded-2xl border p-2 text-left flex flex-col justify-between transition cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-500 ring-2 ring-amber-500/50 shadow-xl'
                        : 'bg-zinc-950 border-zinc-800 hover:border-amber-500/50 hover:bg-zinc-850'
                    }`}
                  >
                    <div className="aspect-[4/3] rounded-xl overflow-hidden bg-zinc-900 mb-2 relative">
                      <img
                        src={s.thumbnail || s.image}
                        alt={s.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/styles/hair_01.jpg'; }}
                      />
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 bg-amber-500 text-black px-1.5 py-0.5 rounded-lg shadow font-black text-[10px] flex items-center gap-0.5">
                          <Check className="w-3 h-3 stroke-[3]" />
                          <span>ELEGIDO</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-xs line-clamp-1 group-hover:text-amber-400 transition">
                        {s.name}
                      </h4>
                      <p className="text-[10px] text-amber-400 font-semibold truncate mt-0.5">
                        {s.category}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-zinc-800 text-center text-[11px] text-zinc-400 shrink-0">
              💡 Toca cualquier estilo para seleccionarlo y regresar a la confirmación de tu turno.
            </div>
          </div>
        </div>
      )}

      {/* 12. MODAL DE CONTROL DE ACCESO PRIVADO CON PIN DE SEGURIDAD */}
      {staffTargetRole && (

        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-start justify-center p-3 sm:p-4 pt-3 sm:pt-6 overflow-y-auto animate-fade-in">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-700 rounded-3xl p-5 space-y-4 shadow-2xl text-xs my-0">

            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Lock className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white">Acceso al Personal / Administración</h3>
                  <span className="text-[10px] text-zinc-400 font-medium">
                    Ingreso exclusivo para el equipo de {currentBusiness.name}
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

            {/* Selector de Rol: Barbero vs Administrador */}
            <div className="grid grid-cols-2 gap-2 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setStaffTargetRole('barber');
                  setStaffPinError('');
                }}
                className={`py-2 px-2.5 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  staffTargetRole === 'barber'
                    ? 'bg-amber-500 text-black shadow font-black'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>✂️ Soy Barbero</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStaffTargetRole('owner');
                  setStaffPinError('');
                }}
                className={`py-2 px-2.5 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  staffTargetRole === 'owner'
                    ? 'bg-amber-500 text-black shadow font-black'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>🔐 Soy Dueño</span>
              </button>
            </div>

            <form onSubmit={handleVerifyStaffPin} className="space-y-3">
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                {staffTargetRole === 'barber'
                  ? 'Acceso a la cola en vivo, sillón, cámara de fotos finales y comisiones del día.'
                  : 'Acceso a finanzas, catálogo de servicios, precios en COP, arqueo de caja y equipo.'}
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

      {/* Footer Público Limpio */}
      <div className="text-center pt-8 pb-4 text-xs text-zinc-400 space-y-2 border-t border-zinc-850 mt-8">
        <div className="flex items-center justify-center gap-2">
          <Store className="w-4 h-4 text-amber-400" />
          <span className="font-bold text-zinc-200">{currentBusiness.name}</span>
        </div>
        <p className="text-[11px] text-zinc-400 max-w-sm mx-auto">
          {currentBusiness.slogan || 'Elegancia, precisión y estilo clásico.'}
        </p>
        <div className="text-[10px] text-zinc-500 pt-1">
          © {new Date().getFullYear()} {currentBusiness.name} • Sistema Oficial de Reservas & Estilo
        </div>
      </div>

      {/* 📱 BARRA INFERIOR FIJA (STICKY BOTTOM NAVIGATION) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-lg border-t border-zinc-800/80 px-2 sm:px-4 py-2 sm:hidden flex items-center justify-around shadow-2xl">
        <button
          onClick={() => {
            setActiveTab('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold transition cursor-pointer p-1.5 ${
            activeTab === 'home' ? 'text-amber-400' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Inicio</span>
        </button>

        <button
          onClick={() => setActiveTab('catalog')}
          className="flex flex-col items-center gap-0.5 text-[10px] font-bold text-zinc-400 hover:text-amber-400 transition cursor-pointer p-1.5"
        >
          <Scissors className="w-4 h-4" />
          <span>Catálogo</span>
        </button>


        <button
          onClick={() => {
            setActiveTab('home');
            const el = document.getElementById('memory-section');
            if (el) {
              el.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          className="flex flex-col items-center gap-0.5 text-[10px] font-bold text-zinc-400 hover:text-white transition cursor-pointer p-1.5"
        >
          <Sparkles className="w-4 h-4" />
          <span>Mi Estilo</span>
        </button>

        <button
          onClick={() => {
            setWalkInSent(false);
            setIsWalkInModalOpen(true);
          }}
          className="flex flex-col items-center gap-0.5 text-[10px] font-black text-amber-400 transition cursor-pointer p-1.5"
        >
          <Bell className="w-4 h-4 animate-bounce" />
          <span>Turno en Vivo</span>
        </button>

        <button
          onClick={() => {
            if (currentUser.id === 'guest' || currentUser.fullName === 'Cliente Invitado') {
              setIsLoyaltyRegisterModalOpen(true);
            } else {
              setIsLoyaltyModalOpen(true);
            }
          }}
          className="flex flex-col items-center gap-0.5 text-[10px] font-bold text-zinc-400 hover:text-white transition cursor-pointer p-1.5"
        >
          <Gift className="w-4 h-4" />
          <span>Sellos</span>
        </button>
      </nav>
    </div>
  );
};

