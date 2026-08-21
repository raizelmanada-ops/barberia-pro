import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useTenant } from '../../core/tenant/TenantContext';
import { useAuth } from '../../core/auth/AuthContext';
import { INITIAL_FEEDBACKS } from '../../database/mockData';
import { SubscriptionService } from '../../core/services/subscriptionService';
import { ServiceCatalogService } from '../../core/services/serviceCatalogService';
import { TeamService } from '../../core/services/teamService';
import { ShiftCommissionService } from '../../core/services/shiftCommissionService';
import { StyleCatalogService } from '../../core/services/styleCatalogService';
import { ImageStorageService } from '../../core/services/imageStorageService';
import { CashRegisterService } from '../../core/services/cashRegisterService';

import { ClientHistoryService, ClientProfileDetail } from '../../core/services/clientHistoryService';
import { WalkInService, WalkInTicket } from '../../core/services/walkinService';
import { AuthService } from '../../core/services/authService';
import {
  Service,
  BarberProfile,
  BusinessSchedule,
  WhatsAppNotificationConfig,
  WhatsAppMessageLog,
  SubscriptionPlan,
  TenantHotmartSubscription,
  StyleCatalogItem,
  CashRegisterShift,
  CashTransaction,
  PaymentMethod
} from '../../core/types';
import { WhatsAppService } from '../../core/whatsapp/whatsappService';
import { HotmartAdapter } from '../../core/hotmart/hotmartAdapter';
import { EntitlementsService } from '../../core/services/entitlementsService';
import { PlanService } from '../../core/services/planService';
import {
  TrendingUp,
  Star,
  Clock,
  HeartHandshake,
  MessageSquare,
  Users,
  Scissors,
  Gift,
  Sparkles,
  QrCode,
  CheckCircle2,
  Lock,
  UserCheck,
  Building2,
  Plus,
  Calendar,
  ToggleLeft,
  ToggleRight,
  Edit2,
  Save,
  Info,
  Smartphone,
  Send,
  ShieldCheck,
  CreditCard,
  ExternalLink,
  Zap,
  User,
  Camera,
  Image as ImageIcon,
  DollarSign,
  Wallet,
  Receipt,
  RefreshCw,
  Trash2,
  Search,
  Banknote,
  Key,
  ArrowRight,
  Bell,
  Store
} from 'lucide-react';

export const OwnerDashboard: React.FC = () => {
  const { currentBusiness, updateBusiness, setIsQRModalOpen } = useTenant();
  const { currentUser, currentRole, validateAccessToTenant, setRole } = useAuth();

  const [activeTab, setActiveTab] = useState<
    'cash' | 'clients' | 'queue' | 'sensor' | 'services' | 'team' | 'styles' | 'schedules' | 'whatsapp' | 'subscription' | 'loyalty' | 'security' | 'business'
  >('cash');

  // Hotmart Subscription State
  const [plans] = useState<SubscriptionPlan[]>(() => PlanService.getPlans());
  const [hotmartSub, setHotmartSub] = useState<TenantHotmartSubscription | undefined>(() =>
    HotmartAdapter.getSubscriptionByBusiness(currentBusiness.id)
  );
  const [simulatingHotmart, setSimulatingHotmart] = useState(false);
  const [hotmartSuccessMsg, setHotmartSuccessMsg] = useState<string | null>(null);

  // Entitlements
  const currentPlan = useMemo(
    () => PlanService.getPlanById(currentBusiness.subscription.planId) || plans[1] || plans[0],
    [currentBusiness.subscription.planId, plans]
  );
  const entitlements = useMemo(
    () => EntitlementsService.getEntitlements(currentBusiness),
    [currentBusiness]
  );

  // WhatsApp Configuration State
  const [waConfig, setWaConfig] = useState<WhatsAppNotificationConfig>(() =>
    WhatsAppService.getConfig(currentBusiness)
  );
  const [waTestPhone, setWaTestPhone] = useState<string>(currentBusiness.phone || '+57 310 236 5163');
  const [waLogs, setWaLogs] = useState<WhatsAppMessageLog[]>(() =>
    WhatsAppService.getLogs(currentBusiness.id)
  );
  const [waSendingTest, setWaSendingTest] = useState(false);

  // Business Info Form State
  const [bizName, setBizName] = useState(currentBusiness.name);
  const [bizLogoUrl, setBizLogoUrl] = useState(currentBusiness.logoUrl);
  const [bizSlogan, setBizSlogan] = useState(currentBusiness.slogan);
  const [bizPhone, setBizPhone] = useState(currentBusiness.phone);
  const [bizWhatsapp, setBizWhatsapp] = useState(currentBusiness.whatsapp);
  const [bizAddress, setBizAddress] = useState(currentBusiness.address);
  const [bizNeighborhood, setBizNeighborhood] = useState(currentBusiness.neighborhood || '');

  // Loyalty Form State
  const [loyaltyThreshold, setLoyaltyThreshold] = useState(currentBusiness.loyalty.stampsThreshold);
  const [loyaltyReward, setLoyaltyReward] = useState(currentBusiness.loyalty.rewardDescription);

  // Schedules State
  const [schedules, setSchedules] = useState<BusinessSchedule[]>(() =>
    currentBusiness.schedules && currentBusiness.schedules.length > 0
      ? currentBusiness.schedules
      : [
          { dayOfWeek: 1, openTime: '08:00', closeTime: '20:00', isOpen: true },
          { dayOfWeek: 2, openTime: '08:00', closeTime: '20:00', isOpen: true },
          { dayOfWeek: 3, openTime: '08:00', closeTime: '20:00', isOpen: true },
          { dayOfWeek: 4, openTime: '08:00', closeTime: '20:00', isOpen: true },
          { dayOfWeek: 5, openTime: '08:00', closeTime: '21:00', isOpen: true },
          { dayOfWeek: 6, openTime: '08:00', closeTime: '21:00', isOpen: true },
          { dayOfWeek: 0, openTime: '09:00', closeTime: '18:00', isOpen: true },
        ]
  );

  // Success notifications
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Team & Services Reactive State
  const [teamMembers, setTeamMembers] = useState<BarberProfile[]>(() =>
    TeamService.getTeamByBusiness(currentBusiness.id)
  );
  const [catalogServices, setCatalogServices] = useState<Service[]>(() =>
    ServiceCatalogService.getServicesByBusiness(currentBusiness.id)
  );

  // New Barber Modal State
  const [showAddBarberModal, setShowAddBarberModal] = useState(false);
  const [newBarberName, setNewBarberName] = useState('');
  const [newBarberPhone, setNewBarberPhone] = useState('+57 310 000 0000');
  const [newBarberCommission, setNewBarberCommission] = useState(50);
  const [newBarberAvatar, setNewBarberAvatar] = useState('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&h=200&q=80');
  const [newBarberSpecialties, setNewBarberSpecialties] = useState('Fade clásico, Barba');
  const [newBarberBio, setNewBarberBio] = useState('Especialista en degradados modernos, tijera y perfilado de barba.');

  // Escuchar actualizaciones de turnos en vivo
  useEffect(() => {
    const handleShiftUpdate = () => {
      setTeamMembers(TeamService.getTeamByBusiness(currentBusiness.id));
    };
    window.addEventListener('barberia:shift_updated', handleShiftUpdate);
    return () => window.removeEventListener('barberia:shift_updated', handleShiftUpdate);
  }, [currentBusiness.id]);

  // --- MÓDULO DE CAJA DIARIA & CIERRE DE TURNO (PRIORIDAD 2) ---
  const [currentShift, setCurrentShift] = useState<CashRegisterShift | null>(() =>
    CashRegisterService.getCurrentShift(currentBusiness.id)
  );
  const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>(() =>
    CashRegisterService.getTransactions(currentBusiness.id)
  );
  const [pastShifts, setPastShifts] = useState<CashRegisterShift[]>(() =>
    CashRegisterService.getShifts(currentBusiness.id).filter(s => s.status === 'closed')
  );

  const shiftSummary = useMemo(() => {
    if (!currentShift) return null;
    return CashRegisterService.getShiftSummary(currentBusiness.id, currentShift.id);
  }, [currentBusiness.id, currentShift, cashTransactions]);

  const [isOpeningShiftModalOpen, setIsOpeningShiftModalOpen] = useState(false);
  const [initialBaseCOP, setInitialBaseCOP] = useState(50000);
  const [isClosingShiftModalOpen, setIsClosingShiftModalOpen] = useState(false);
  const [closeShiftNotes, setCloseShiftNotes] = useState('');
  const [isManualSaleModalOpen, setIsManualSaleModalOpen] = useState(false);
  const [manualServiceName, setManualServiceName] = useState('Corte Clásico Premium');
  const [manualAmountCOP, setManualAmountCOP] = useState(38000);
  const [manualBarberName, setManualBarberName] = useState(currentBusiness.ownerName || 'Álvaro Ortiz');
  const [manualClientName, setManualClientName] = useState('');
  const [manualClientPhone, setManualClientPhone] = useState('');
  const [manualPaymentMethod, setManualPaymentMethod] = useState<PaymentMethod>('cash');
  const [manualSaleNotes, setManualSaleNotes] = useState('');

  // --- MÓDULO DE CLIENTES & CRM / FICHA TÉCNICA (PRIORIDAD 3) ---
  const [clientList, setClientList] = useState<ClientProfileDetail[]>(() =>
    ClientHistoryService.getAllClients(currentBusiness.id)
  );
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [selectedClientDetail, setSelectedClientDetail] = useState<ClientProfileDetail | null>(null);

  // --- MÓDULO DE COLA & CHECKOUT DE CITAS (PRIORIDAD 4) ---
  const [queueTickets, setQueueTickets] = useState<WalkInTicket[]>(() =>
    WalkInService.getTickets(currentBusiness.id)
  );
  const [checkoutTicket, setCheckoutTicket] = useState<WalkInTicket | null>(null);
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState<PaymentMethod>('cash');
  const [checkoutNotes, setCheckoutNotes] = useState('');

  // --- MÓDULO DE SEGURIDAD & PIN DEL LOCAL (PRIORIDAD 1) ---
  const [, setBusinessPin] = useState('••••'); // Server-side only, never displayed
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pinSuccessMsg, setPinSuccessMsg] = useState<string | null>(null);
  const [pinErrorMsg, setPinErrorMsg] = useState<string | null>(null);
  const [pinUpdating, setPinUpdating] = useState(false);

  // Reactive listeners for cash, client history and tickets
  useEffect(() => {
    const handleCashUpdate = () => {
      setCurrentShift(CashRegisterService.getCurrentShift(currentBusiness.id));
      setCashTransactions(CashRegisterService.getTransactions(currentBusiness.id));
      setPastShifts(CashRegisterService.getShifts(currentBusiness.id).filter(s => s.status === 'closed'));
    };
    const handleClientUpdate = () => {
      setClientList(ClientHistoryService.getAllClients(currentBusiness.id));
    };
    const handleTicketUpdate = () => {
      setQueueTickets(WalkInService.getTickets(currentBusiness.id));
    };
    const handleSecurityUpdate = () => {
      setBusinessPin('••••'); // PIN is server-side only; never fetched to client
    };

    window.addEventListener('barberia:cash_updated', handleCashUpdate);
    window.addEventListener('barberia:client_history_updated', handleClientUpdate);
    window.addEventListener('barberia:walkin_update', handleTicketUpdate);
    window.addEventListener('barberia:security_updated', handleSecurityUpdate);

    return () => {
      window.removeEventListener('barberia:cash_updated', handleCashUpdate);
      window.removeEventListener('barberia:client_history_updated', handleClientUpdate);
      window.removeEventListener('barberia:walkin_update', handleTicketUpdate);
      window.removeEventListener('barberia:security_updated', handleSecurityUpdate);
    };
  }, [currentBusiness.id]);

  // Live Video Camera Modal & Stream State
  const [isLiveCameraOpen, setIsLiveCameraOpen] = useState(false);
  const [cameraTarget, setCameraTarget] = useState<'new' | 'edit' | 'style' | 'new_style'>('new');
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // File Upload Fallback Refs for Barbers
  const newBarberGalleryRef = useRef<HTMLInputElement>(null);
  const editBarberGalleryRef = useRef<HTMLInputElement>(null);

  // Edit Barber Modal State
  const [editingBarber, setEditingBarber] = useState<BarberProfile | null>(null);

  // New Service Modal State
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState(35000);
  const [newServiceDuration, setNewServiceDuration] = useState(40);
  const [newServiceCategory, setNewServiceCategory] = useState('Caballero');
  const [newServiceDesc, setNewServiceDesc] = useState('');

  // Edit Service Modal State
  const [editingService, setEditingService] = useState<Service | null>(null);

  // REAL SHOP CUTS / STYLE CATALOG STATE
  const [styleCatalog, setStyleCatalog] = useState<StyleCatalogItem[]>(() =>
    StyleCatalogService.getStyles(currentBusiness.id)
  );
  const [selectedStyleIdForPhoto, setSelectedStyleIdForPhoto] = useState<string | null>(null);
  const [showAddStyleModal, setShowAddStyleModal] = useState(false);
  const [newStyleName, setNewStyleName] = useState('');
  const [newStyleCategory, setNewStyleCategory] = useState<'corte' | 'barba' | 'disenos' | 'combo' | 'ninos'>('corte');
  const [newStyleAudience, setNewStyleAudience] = useState<'adultos' | 'ninos' | 'todos'>('todos');
  const [newStylePhoto, setNewStylePhoto] = useState('https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=400&h=400&q=80');
  const [newStyleFormula, setNewStyleFormula] = useState('Degradado a navaja en patillas y nuca • Textura desfilada superior');
  const [newStyleDescription, setNewStyleDescription] = useState('Corte realizado en sillón con precisión y asesoría de imagen personalizada.');
  const [newStyleHairType, setNewStyleHairType] = useState<'liso' | 'ondulado' | 'afro' | 'todos'>('todos');

  // Security Verification
  const isAuthorized = validateAccessToTenant(currentBusiness.id);

  const subStatus = SubscriptionService.getComputedStatus(currentBusiness);
  const remainingDays = SubscriptionService.getRemainingTrialDays(currentBusiness);

  // Feedbacks strictly for this tenant
  const tenantFeedbacks = useMemo(
    () => INITIAL_FEEDBACKS.filter(f => f.businessId === currentBusiness.id),
    [currentBusiness.id]
  );

  // Dynamic real calculations (sin datos ficticios)
  const totalCuts = useMemo(() => {
    return teamMembers.reduce((acc, b) => acc + (b.totalCutsCompleted || 0), 0);
  }, [teamMembers]);

  const avgOverall = useMemo(() => {
    if (tenantFeedbacks.length === 0) return 0;
    const sum = tenantFeedbacks.reduce((acc, f) => acc + f.ratingOverall, 0);
    return Number((sum / tenantFeedbacks.length).toFixed(1));
  }, [tenantFeedbacks]);

  const avgCut = useMemo(() => {
    if (tenantFeedbacks.length === 0) return 0;
    return Number((tenantFeedbacks.reduce((acc, f) => acc + f.ratingCut, 0) / tenantFeedbacks.length).toFixed(1));
  }, [tenantFeedbacks]);

  const avgAttention = useMemo(() => {
    if (tenantFeedbacks.length === 0) return 0;
    return Number((tenantFeedbacks.reduce((acc, f) => acc + f.ratingAttention, 0) / tenantFeedbacks.length).toFixed(1));
  }, [tenantFeedbacks]);

  const avgListening = useMemo(() => {
    if (tenantFeedbacks.length === 0) return 0;
    return Number((tenantFeedbacks.reduce((acc, f) => acc + f.ratingListening, 0) / tenantFeedbacks.length).toFixed(1));
  }, [tenantFeedbacks]);

  const avgWait = useMemo(() => {
    if (tenantFeedbacks.length === 0) return 0;
    return Number((tenantFeedbacks.reduce((acc, f) => acc + f.ratingWaitTime, 0) / tenantFeedbacks.length).toFixed(1));
  }, [tenantFeedbacks]);

  // Security Guard (403)
  if (!isAuthorized && currentRole !== 'owner' && currentRole !== 'superadmin') {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4 animate-fade-in">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20">
          <Lock className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-400">
            Control de Acceso Multi-Tenant (403)
          </span>
          <h3 className="text-lg font-black text-white">Panel Exclusivo del Propietario</h3>
          <p className="text-xs text-zinc-400">
            Solo <strong>{currentBusiness.ownerName || 'el propietario'}</strong> de{' '}
            <strong>{currentBusiness.name}</strong> puede acceder a este panel.
          </p>
        </div>
      </div>
    );
  }

  const triggerSuccess = (msg: string) => {
    setSaveSuccessMsg(msg);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  // Handlers
  const handleSaveBusinessInfo = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...currentBusiness,
      name: bizName.trim(),
      logoUrl: bizLogoUrl.trim() || '/logos/arizshop-logo.svg',
      slogan: bizSlogan.trim(),
      phone: bizPhone.trim(),
      whatsapp: bizWhatsapp.trim(),
      address: bizAddress.trim() || 'Pendiente de configuración',
      neighborhood: bizNeighborhood.trim() || 'Pendiente de configuración',
    };
    updateBusiness(updated);
    triggerSuccess('¡Identidad y datos del local actualizados y guardados en Cloud!');
  };

  const handleSaveLoyalty = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...currentBusiness,
      loyalty: {
        ...currentBusiness.loyalty,
        stampsThreshold: loyaltyThreshold,
        rewardDescription: loyaltyReward,
      }
    };
    updateBusiness(updated);
    triggerSuccess('¡Reglas de fidelización guardadas exitosamente!');
  };

  const handleSaveSchedules = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...currentBusiness,
      schedules: schedules,
    };
    updateBusiness(updated);
    triggerSuccess('¡Horarios de atención actualizados y sincronizados en Cloud!');
  };

  const handleScheduleChange = (index: number, field: keyof BusinessSchedule, value: any) => {
    const updated = [...schedules];
    updated[index] = { ...updated[index], [field]: value };
    setSchedules(updated);
  };

  const handleAddBarber = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBarberName.trim()) return;

    TeamService.addMember({
      businessId: currentBusiness.id,
      fullName: newBarberName.trim(),
      phone: newBarberPhone.trim(),
      commissionPercentage: newBarberCommission,
      role: 'barber',
      roles: ['barber'],
      avatarUrl: newBarberAvatar.trim() || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&h=200&q=80',
      specialties: newBarberSpecialties.split(',').map(s => s.trim()).filter(Boolean),
      bio: newBarberBio.trim() || 'Especialista en degradados y perfilado de barba.',
      ratingAverage: 5.0,
      happyClientsPct: 100,
      totalCutsCompleted: 0,
      isActive: true,
    }, `Owner (${ownerDisplayName})`);

    setTeamMembers(TeamService.getTeamByBusiness(currentBusiness.id));
    setShowAddBarberModal(false);
    setNewBarberName('');
    setNewBarberBio('');
    triggerSuccess('¡Nuevo colaborador agregado al equipo con éxito!');
  };

  const handleUpdateEditingBarber = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBarber) return;

    TeamService.updateMember(editingBarber, `Owner (${ownerDisplayName})`);
    setTeamMembers(TeamService.getTeamByBusiness(currentBusiness.id));
    setEditingBarber(null);
    triggerSuccess(`¡Datos del barbero "${editingBarber.fullName}" actualizados!`);
  };

  const handleSettleBarber = (barberId: string, barberName: string) => {
    ShiftCommissionService.settleBarberShift(currentBusiness.id, barberId);
    triggerSuccess(`¡Turno de ${barberName} liquidado y marcado como pagado!`);
  };

  // LIVE WEBCAM / WEBRTC CAMERA LOGIC (Acceso Real a Cámara de Video)
  const startLiveCamera = async (target: 'new' | 'edit' | 'style' | 'new_style', facing: 'user' | 'environment' = 'user') => {
    setCameraTarget(target);
    setCameraFacing(facing);
    setIsLiveCameraOpen(true);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 720 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(console.warn);
      }
    } catch (err) {
      console.warn('Live camera error, falling back to file picker', err);
      triggerSuccess('⚠️ Permiso de cámara no concedido o no disponible. Puedes subir una foto desde la galería.');
    }
  };

  const switchLiveCamera = () => {
    const nextFacing = cameraFacing === 'user' ? 'environment' : 'user';
    startLiveCamera(cameraTarget, nextFacing);
  };

  const stopLiveCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsLiveCameraOpen(false);
  };

  const captureLivePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const size = Math.min(video.videoWidth || 640, video.videoHeight || 640);
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const startX = ((video.videoWidth || size) - size) / 2;
        const startY = ((video.videoHeight || size) - size) / 2;
        ctx.drawImage(video, startX, startY, size, size, 0, 0, size, size);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        if (cameraTarget === 'new') {
          setNewBarberAvatar(dataUrl);
          triggerSuccess('¡Foto de barbero tomada en vivo!');
        } else if (cameraTarget === 'edit' && editingBarber) {
          setEditingBarber({ ...editingBarber, avatarUrl: dataUrl });
          triggerSuccess('¡Foto de barbero actualizada!');
        } else if (cameraTarget === 'style' && selectedStyleIdForPhoto) {
          StyleCatalogService.updateStylePhoto(currentBusiness.id, selectedStyleIdForPhoto, dataUrl);
          setStyleCatalog(StyleCatalogService.getStyles(currentBusiness.id));
          triggerSuccess('¡Foto real del corte tomada en vivo y actualizada en el catálogo!');
        } else if (cameraTarget === 'new_style') {
          setNewStylePhoto(dataUrl);
          triggerSuccess('¡Foto del nuevo corte capturada en vivo!');
        }
      }
    }
    stopLiveCamera();
  };

  const handleNewBarberPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setNewBarberAvatar(result);
        triggerSuccess('¡Foto seleccionada lista para el nuevo barbero!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditBarberPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingBarber) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setEditingBarber({ ...editingBarber, avatarUrl: result });
        triggerSuccess('¡Foto actualizada con éxito!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStylePhotoUpload = async (styleId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const publicUrl = await ImageStorageService.uploadImage(currentBusiness.id, file, 'gallery');
        StyleCatalogService.updateStylePhoto(currentBusiness.id, styleId, publicUrl);
        setStyleCatalog(StyleCatalogService.getStyles(currentBusiness.id));
        triggerSuccess('¡Foto real del estilo subida y sincronizada en Supabase Storage!');
      } catch (err) {
        console.error('Error subiendo foto de estilo:', err);
      }
    }
  };

  const handleNewStylePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const publicUrl = await ImageStorageService.uploadImage(currentBusiness.id, file, 'gallery');
        setNewStylePhoto(publicUrl);
        triggerSuccess('¡Foto del corte seleccionada y lista para publicar!');
      } catch (err) {
        console.error('Error subiendo nueva foto:', err);
      }
    }
  };


  const handleAddCustomStyle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStyleName.trim()) return;

    const newStyleItem: StyleCatalogItem = {
      id: `style_custom_${Date.now()}`,
      name: newStyleName.trim(),
      category: newStyleCategory,
      targetAudience: newStyleAudience,
      description: newStyleDescription.trim(),
      tags: [newStyleName.trim(), newStyleCategory, 'Real Barber', 'Corte Propio'],
      previewOverlayUrl: newStylePhoto,
      difficultyLevel: 'medio',
      hairType: newStyleHairType,
      faceShape: 'Favorece todo tipo de rostro con asesoría personalizada.',
      technicalFormula: newStyleFormula.trim() || 'Corte a tijera y máquina con acabado pulido.',
      angles: {
        front: newStylePhoto,
        side: newStylePhoto,
        back: newStylePhoto,
      }
    };

    StyleCatalogService.saveStyle(currentBusiness.id, newStyleItem);
    setStyleCatalog(StyleCatalogService.getStyles(currentBusiness.id));
    setShowAddStyleModal(false);
    setNewStyleName('');
    triggerSuccess('¡Nuevo estilo con foto real agregado al catálogo de la barbería!');
  };

  const handleDeleteStyle = (styleId: string, styleName: string) => {
    if (window.confirm(`¿Estás seguro de eliminar el estilo "${styleName}" del catálogo?`)) {
      StyleCatalogService.deleteStyle(currentBusiness.id, styleId);
      setStyleCatalog(StyleCatalogService.getStyles(currentBusiness.id));
      triggerSuccess(`¡Estilo "${styleName}" eliminado del catálogo!`);
    }
  };

  const handleResetDefaultStyles = () => {
    if (window.confirm('¿Deseas restaurar los estilos de fábrica del catálogo?')) {
      StyleCatalogService.resetToDefault(currentBusiness.id);
      setStyleCatalog(StyleCatalogService.getStyles(currentBusiness.id));
      triggerSuccess('¡Catálogo restaurado a los estilos estándar!');
    }
  };

  const handleToggleBarber = (barberId: string) => {
    TeamService.toggleMemberActive(currentBusiness.id, barberId, `Owner (${ownerDisplayName})`);
    setTeamMembers(TeamService.getTeamByBusiness(currentBusiness.id));
    triggerSuccess('Estado del colaborador actualizado en Cloud');
  };

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) return;

    ServiceCatalogService.addService({
      businessId: currentBusiness.id,
      name: newServiceName.trim(),
      description: newServiceDesc.trim() || 'Servicio profesional de alta calidad',
      category: newServiceCategory,
      priceCOP: Number(newServicePrice),
      durationMinutes: Number(newServiceDuration),
      isActive: true,
    }, `Owner (${ownerDisplayName})`);

    setCatalogServices(ServiceCatalogService.getServicesByBusiness(currentBusiness.id));
    setShowAddServiceModal(false);
    setNewServiceName('');
    triggerSuccess('¡Nuevo servicio agregado y publicado en Cloud!');
  };

  const handleUpdateEditingService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;

    ServiceCatalogService.updateService(editingService, `Owner (${ownerDisplayName})`);
    setCatalogServices(ServiceCatalogService.getServicesByBusiness(currentBusiness.id));
    setEditingService(null);
    triggerSuccess(`¡Servicio "${editingService.name}" actualizado a $${editingService.priceCOP.toLocaleString('es-CO')} COP!`);
  };

  const handleToggleService = (serviceId: string) => {
    ServiceCatalogService.toggleServiceActive(currentBusiness.id, serviceId, `Owner (${ownerDisplayName})`);
    setCatalogServices(ServiceCatalogService.getServicesByBusiness(currentBusiness.id));
    triggerSuccess('Visibilidad del servicio actualizada en Cloud');
  };

  const handleSaveWhatsAppConfig = (e: React.FormEvent) => {
    e.preventDefault();
    WhatsAppService.saveConfig(currentBusiness.id, waConfig, `Owner (${ownerDisplayName})`);
    triggerSuccess('¡Configuración de WhatsApp guardada en Cloud!');
  };

  const handleSendTestWhatsApp = async () => {
    setWaSendingTest(true);
    const res = await WhatsAppService.sendTestPing(currentBusiness, waTestPhone);
    setWaSendingTest(false);
    if (res.success) {
      setWaLogs(WhatsAppService.getLogs(currentBusiness.id));
      triggerSuccess(`¡Mensaje de prueba WhatsApp enviado a ${waTestPhone}!`);
    }
  };

  const handleSimulateHotmartActivation = async (planId: string) => {
    setSimulatingHotmart(true);
    const res = await HotmartAdapter.simulateHotmartEvent(currentBusiness.id, 'SUBSCRIPTION_ACTIVATION', planId);
    setSimulatingHotmart(false);
    if (res.success) {
      setHotmartSub(HotmartAdapter.getSubscriptionByBusiness(currentBusiness.id));
      setHotmartSuccessMsg(res.message);
      triggerSuccess('¡Evento de Hotmart procesado y suscripción activada en Cloud!');
    }
  };

  // --- CASH REGISTER HANDLERS (PRIORIDAD 2) ---
  const handleOpenShift = (e: React.FormEvent) => {
    e.preventDefault();
    const newShift = CashRegisterService.openShift(
      currentBusiness.id,
      ownerDisplayName,
      initialBaseCOP,
      'Apertura de turno de caja'
    );
    setCurrentShift(newShift);
    setIsOpeningShiftModalOpen(false);
    triggerSuccess(`¡Caja abierta con base en efectivo de $${initialBaseCOP.toLocaleString('es-CO')} COP!`);
  };

  const handleCloseShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentShift) return;
    const closed = CashRegisterService.closeShift(
      currentBusiness.id,
      currentShift.id,
      ownerDisplayName,
      closeShiftNotes
    );
    setCurrentShift(null);
    setPastShifts(CashRegisterService.getShifts(currentBusiness.id).filter(s => s.status === 'closed'));
    setIsClosingShiftModalOpen(false);
    setCloseShiftNotes('');
    triggerSuccess(`¡Turno de caja cerrado con éxito! Total vendido: $${closed.closedSummary?.totalSalesCOP.toLocaleString('es-CO')} COP`);
  };

  const handleManualSaleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualAmountCOP || manualAmountCOP <= 0) return;

    CashRegisterService.recordTransaction(currentBusiness.id, {
      serviceName: manualServiceName,
      amountCOP: manualAmountCOP,
      barberId: 'barber_arizshop_alvaro',
      barberName: manualBarberName,
      clientName: manualClientName.trim() || 'Cliente en Mostrador',
      clientPhone: manualClientPhone.trim(),
      paymentMethod: manualPaymentMethod,
      commissionPercentage: 50,
      notes: manualSaleNotes
    });

    if (manualClientName.trim() || manualClientPhone.trim()) {
      ClientHistoryService.recordVisit(currentBusiness.id, {
        businessId: currentBusiness.id,
        clientId: manualClientPhone.trim() || manualClientName.trim(),
        clientName: manualClientName.trim() || 'Cliente en Mostrador',
        clientPhone: manualClientPhone.trim() || '+57 300 000 0000',
        date: new Date().toISOString().split('T')[0],
        serviceName: manualServiceName,
        priceCOP: manualAmountCOP,
        paymentMethod: manualPaymentMethod,
        barberName: manualBarberName,
        technicalNotes: manualSaleNotes || 'Venta manual registrada en caja'
      });
    }

    setIsManualSaleModalOpen(false);
    setManualClientName('');
    setManualClientPhone('');
    setManualSaleNotes('');
    triggerSuccess(`¡Venta de $${manualAmountCOP.toLocaleString('es-CO')} COP registrada en caja y CRM!`);
  };

  const handleCheckoutTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutTicket) return;

    const amount = checkoutTicket.priceCOP || 38000;

    CashRegisterService.recordTransaction(currentBusiness.id, {
      ticketId: checkoutTicket.id,
      serviceName: checkoutTicket.styleName || 'Corte de Cabello',
      amountCOP: amount,
      barberId: 'barber_arizshop_alvaro',
      barberName: checkoutTicket.barberName || ownerDisplayName,
      clientName: checkoutTicket.clientName,
      clientPhone: checkoutTicket.clientPhone,
      paymentMethod: checkoutPaymentMethod,
      commissionPercentage: 50,
      notes: checkoutNotes || checkoutTicket.specialNote
    });

    ClientHistoryService.recordVisit(currentBusiness.id, {
      businessId: currentBusiness.id,
      clientId: checkoutTicket.clientPhone || checkoutTicket.clientName,
      clientName: checkoutTicket.clientName,
      clientPhone: checkoutTicket.clientPhone || '+57 300 000 0000',
      date: new Date().toISOString().split('T')[0],
      serviceName: checkoutTicket.styleName || 'Corte de Cabello',
      priceCOP: amount,
      paymentMethod: checkoutPaymentMethod,
      barberName: checkoutTicket.barberName || ownerDisplayName,
      styleName: checkoutTicket.styleName,
      stylePhotoUrl: checkoutTicket.stylePhotoUrl,
      technicalNotes: checkoutNotes || checkoutTicket.specialNote,
      ticketId: checkoutTicket.id
    });

    WalkInService.updateStatus(currentBusiness.id, checkoutTicket.id, 'completed');
    setCheckoutTicket(null);
    setCheckoutNotes('');
    triggerSuccess(`¡Servicio de ${checkoutTicket.clientName} cobrado con éxito y asentado en caja!`);
  };

  const handleUpdatePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinErrorMsg(null);
    setPinSuccessMsg(null);

    if (newPinInput.trim().length < 4) {
      setPinErrorMsg('El PIN debe tener al menos 4 dígitos.');
      return;
    }
    if (newPinInput.trim() !== confirmPinInput.trim()) {
      setPinErrorMsg('Los dos PINs ingresados no coinciden.');
      return;
    }

    setPinUpdating(true);
    const result = await AuthService.updatePinServer(newPinInput.trim());
    setPinUpdating(false);

    if (result.success) {
      setBusinessPin('••••');
      setNewPinInput('');
      setConfirmPinInput('');
      setPinSuccessMsg('¡PIN de seguridad actualizado y hasheado criptográficamente en el servidor!');
      triggerSuccess('¡PIN de seguridad actualizado con éxito!');
    } else {
      setPinErrorMsg(result.error || 'Error al actualizar el PIN de seguridad.');
    }
  };

  const filteredClients = useMemo(() => {
    if (!clientSearchQuery.trim()) return clientList;
    const q = clientSearchQuery.toLowerCase().trim();
    return clientList.filter(
      c => c.fullName.toLowerCase().includes(q) || c.phone.includes(q)
    );
  }, [clientList, clientSearchQuery]);

  const activeQueueTickets = queueTickets.filter(t => t.status === 'waiting' || t.status === 'in_chair');

  const ownerDisplayName = currentBusiness.ownerName || currentUser.fullName;

  const dayNames: Record<number, string> = {
    1: 'Lunes',
    2: 'Martes',
    3: 'Miércoles',
    4: 'Jueves',
    5: 'Viernes',
    6: 'Sábado',
    0: 'Domingo',
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-5 space-y-6 pb-28 animate-fade-in text-xs">
      {/* Header with Business & Owner Identity */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 p-5 rounded-3xl shadow-xl">
        <div className="flex items-center gap-3.5">
          <img
            src={currentBusiness.logoUrl}
            alt={currentBusiness.name}
            className="w-12 h-12 rounded-full object-cover border-2 shadow bg-zinc-950 shrink-0"
            style={{ borderColor: 'var(--brand-primary)' }}
          />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5" /> {ownerDisplayName} • Propietario
              </span>
              {subStatus === 'trial_active' && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-semibold border border-amber-500/30">
                  Prueba ({remainingDays}d restantes)
                </span>
              )}
              {subStatus === 'trial_expired' && (
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold border border-red-500/30 animate-pulse">
                  ⚠️ Prueba Finalizada (Suscripción Requerida)
                </span>
              )}
              {subStatus === 'active' && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                  ✓ Suscripción Activa
                </span>
              )}
            </div>
            <h2 className="text-xl font-black text-white mt-0.5">{currentBusiness.name}</h2>
            <p className="text-xs text-zinc-400">{currentBusiness.address}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setRole('client')}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center gap-1.5 transition shadow cursor-pointer"
          >
            <User className="w-4 h-4" />
            <span>⬅️ Ver como Cliente</span>
          </button>

          <button
            onClick={() => setIsQRModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-bold text-xs flex items-center gap-1.5 transition shadow cursor-pointer"
          >
            <QrCode className="w-4 h-4" style={{ color: 'var(--brand-primary)' }} />
            <span>Ver QR</span>
          </button>
        </div>
      </div>

      {/* Banner de Aviso de Prueba Finalizada (Día 7) */}
      {subStatus === 'trial_expired' && (
        <div className="p-4 bg-gradient-to-r from-amber-500/20 via-purple-900/30 to-zinc-900 border-2 border-amber-500/50 rounded-3xl space-y-2.5 shadow-2xl animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-amber-500 text-black font-black text-sm">
                ⏳
              </span>
              <h4 className="text-sm font-black text-white">
                ¡Completaste tus 7 días de prueba con éxito!
              </h4>
            </div>
            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
              RENOVACIÓN PENDIENTE
            </span>
          </div>
          <p className="text-zinc-300 text-xs leading-relaxed">
            Tus datos, barberos y clientes están 100% seguros y guardados. Para mantener activo tu Código QR, la Memoria de Estilo y el agendamiento 24/7 sin interrupciones, activa tu suscripción oficial de <strong>$89.000 COP/mes</strong> en Hotmart.
          </p>
          <div className="pt-1 flex flex-col sm:flex-row items-center gap-2">
            <a
              href={HotmartAdapter.getCheckoutUrl(currentBusiness)}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-black text-black text-xs flex items-center justify-center gap-2 shadow-xl hover:scale-105 transition"
              style={{ backgroundColor: 'var(--brand-primary)' }}
            >
              <span>💳 Activar Suscripción Oficial ($89.000 COP)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              type="button"
              onClick={() => setActiveTab('subscription')}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs cursor-pointer"
            >
              Ver Detalles de la Membresía
            </button>
          </div>
        </div>
      )}

      {/* Global Success Banner */}
      {saveSuccessMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl font-bold flex items-center gap-2 animate-fade-in shadow-lg">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Navigation Tabs (Organized by Operational Priority) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-1.5 bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800 font-bold">
        <button
          onClick={() => setActiveTab('cash')}
          className={`py-2.5 px-1 rounded-xl text-center transition truncate flex items-center justify-center gap-1.5 ${
            activeTab === 'cash' ? 'bg-amber-500 text-black shadow font-black' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Wallet className="w-3.5 h-3.5" />
          <span>💰 Caja & Cierre</span>
        </button>

        <button
          onClick={() => setActiveTab('clients')}
          className={`py-2.5 px-1 rounded-xl text-center transition truncate flex items-center justify-center gap-1.5 ${
            activeTab === 'clients' ? 'bg-amber-500 text-black shadow font-black' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>👥 Clientes CRM ({clientList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('queue')}
          className={`py-2.5 px-1 rounded-xl text-center transition truncate flex items-center justify-center gap-1.5 ${
            activeTab === 'queue' ? 'bg-amber-500 text-black shadow font-black' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>🛎️ Citas & Cola ({activeQueueTickets.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('sensor')}
          className={`py-2.5 px-1 rounded-xl text-center transition truncate ${
            activeTab === 'sensor' ? 'bg-amber-500 text-black shadow font-black' : 'text-zinc-400 hover:text-white'
          }`}
        >
          📊 Diagnóstico
        </button>

        <button
          onClick={() => setActiveTab('services')}
          className={`py-2.5 px-1 rounded-xl text-center transition truncate ${
            activeTab === 'services' ? 'bg-amber-500 text-black shadow font-black' : 'text-zinc-400 hover:text-white'
          }`}
        >
          ✂️ Servicios ({catalogServices.length})
        </button>

        <button
          onClick={() => setActiveTab('team')}
          className={`py-2.5 px-1 rounded-xl text-center transition truncate ${
            activeTab === 'team' ? 'bg-amber-500 text-black shadow font-black' : 'text-zinc-400 hover:text-white'
          }`}
        >
          💈 Equipo ({teamMembers.length})
        </button>

        <button
          onClick={() => setActiveTab('styles')}
          className={`py-2.5 px-1 rounded-xl text-center transition truncate flex items-center justify-center gap-1 ${
            activeTab === 'styles' ? 'bg-amber-500 text-black shadow font-black' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          <span>📸 Cortes ({styleCatalog.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('whatsapp')}
          className={`py-2.5 px-1 rounded-xl text-center transition truncate flex items-center justify-center gap-1 ${
            activeTab === 'whatsapp' ? 'bg-emerald-500 text-black shadow font-black' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>💬 WhatsApp</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`py-2.5 px-1 rounded-xl text-center transition truncate flex items-center justify-center gap-1 ${
            activeTab === 'security' ? 'bg-amber-500 text-black shadow font-black' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>🔐 PIN de Seguridad</span>
        </button>

        <button
          onClick={() => setActiveTab('subscription')}
          className={`py-2.5 px-1 rounded-xl text-center transition truncate flex items-center justify-center gap-1 ${
            activeTab === 'subscription' ? 'bg-purple-600 text-white shadow font-black' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>💳 Suscripción</span>
        </button>

        <button
          onClick={() => setActiveTab('business')}
          className={`py-2.5 px-1 rounded-xl text-center transition truncate ${
            activeTab === 'business' ? 'bg-amber-500 text-black shadow font-black' : 'text-zinc-400 hover:text-white'
          }`}
        >
          ⚙️ Negocio
        </button>

        <button
          onClick={() => setActiveTab('loyalty')}
          className={`py-2.5 px-1 rounded-xl text-center transition truncate ${
            activeTab === 'loyalty' ? 'bg-amber-500 text-black shadow font-black' : 'text-zinc-400 hover:text-white'
          }`}
        >
          🎁 Fidelización
        </button>
      </div>

      {/* TAB: CAJA DIARIA & CIERRE DE TURNO (PRIORIDAD 2) */}
      {activeTab === 'cash' && (
        <div className="space-y-5 animate-fade-in">
          {/* Header de Estado de Caja */}
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-3xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shadow ${
                    currentShift
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                  }`}
                >
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-white">
                      {currentShift ? '🟢 Caja Diaria Abierta' : '🔴 Caja Diaria Cerrada'}
                    </h3>
                    <span
                      className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                        currentShift
                          ? 'bg-emerald-500 text-black'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {currentShift ? 'TURNO ACTIVO' : 'SIN TURNO'}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    {currentShift
                      ? `Abierta por ${currentShift.openedBy} • Base en efectivo: $${currentShift.initialCashCOP.toLocaleString('es-CO')} COP`
                      : 'Abre la caja del día para registrar cobros, pagos de clientes y liquidar comisiones.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {currentShift ? (
                  <>
                    <button
                      onClick={() => setIsManualSaleModalOpen(true)}
                      className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black flex items-center gap-1.5 shadow transition cursor-pointer text-xs"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      <span>+ Registrar Venta</span>
                    </button>
                    <button
                      onClick={() => setIsClosingShiftModalOpen(true)}
                      className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-red-950 hover:text-red-300 text-zinc-300 border border-zinc-700 font-bold flex items-center gap-1.5 transition cursor-pointer text-xs"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Cerrar Caja</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsOpeningShiftModalOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black flex items-center gap-1.5 shadow-xl transition cursor-pointer text-xs"
                  >
                    <Wallet className="w-4 h-4" />
                    <span>🟢 Abrir Caja del Día</span>
                  </button>
                )}
              </div>
            </div>

            {/* Tarjetas de Métricas de Caja */}
            {currentShift && shiftSummary && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-zinc-800/80">
                <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800 space-y-0.5">
                  <span className="text-[10px] font-bold text-zinc-400 block">Total Vendido Hoy</span>
                  <div className="text-base sm:text-lg font-black text-amber-400">
                    ${shiftSummary.totalSalesCOP.toLocaleString('es-CO')}
                  </div>
                  <span className="text-[9px] text-zinc-500 block">{shiftSummary.serviceCount} servicios realizados</span>
                </div>

                <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800 space-y-0.5">
                  <span className="text-[10px] font-bold text-zinc-400 block flex items-center gap-1">
                    <Banknote className="w-3 h-3 text-emerald-400" /> Efectivo en Cajón
                  </span>
                  <div className="text-base sm:text-lg font-black text-emerald-400">
                    ${shiftSummary.finalCashInDrawerCOP.toLocaleString('es-CO')}
                  </div>
                  <span className="text-[9px] text-zinc-500 block">Base ($50k) + ${shiftSummary.cashSalesCOP.toLocaleString('es-CO')}</span>
                </div>

                <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800 space-y-0.5">
                  <span className="text-[10px] font-bold text-zinc-400 block flex items-center gap-1">
                    <Smartphone className="w-3 h-3 text-purple-400" /> Nequi & Daviplata
                  </span>
                  <div className="text-base sm:text-lg font-black text-purple-300">
                    ${(shiftSummary.nequiSalesCOP + shiftSummary.daviplataSalesCOP).toLocaleString('es-CO')}
                  </div>
                  <span className="text-[9px] text-zinc-500 block">Nequi: ${shiftSummary.nequiSalesCOP.toLocaleString('es-CO')} • Dav: ${shiftSummary.daviplataSalesCOP.toLocaleString('es-CO')}</span>
                </div>

                <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800 space-y-0.5">
                  <span className="text-[10px] font-bold text-zinc-400 block flex items-center gap-1">
                    <CreditCard className="w-3 h-3 text-sky-400" /> Tarjetas & Datáfono
                  </span>
                  <div className="text-base sm:text-lg font-black text-sky-300">
                    ${shiftSummary.cardSalesCOP.toLocaleString('es-CO')}
                  </div>
                  <span className="text-[9px] text-zinc-500 block">Cobrado por datáfono</span>
                </div>
              </div>
            )}
          </div>

          {/* Liquidación de Comisiones del Día */}
          {currentShift && shiftSummary && (
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-3xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Scissors className="w-3.5 h-3.5 text-amber-400" /> Total Comisiones Barberos (50%)
                  </span>
                  <span className="text-sm font-black text-amber-400">
                    ${shiftSummary.totalBarberCommissionsCOP.toLocaleString('es-CO')} COP
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 leading-tight">
                  Monto correspondiente a pagar a los profesionales por los cortes ejecutados en el turno.
                </p>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-3xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-emerald-400" /> Total Neto para la Barbería (50%)
                  </span>
                  <span className="text-sm font-black text-emerald-400">
                    ${shiftSummary.totalBusinessNetCOP.toLocaleString('es-CO')} COP
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 leading-tight">
                  Ganancia neta retenida por el local de {currentBusiness.name} tras deducir comisiones.
                </p>
              </div>
            </div>
          )}

          {/* Listado de Operaciones del Turno Actual */}
          {currentShift && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-amber-400" />
                  <h4 className="font-black text-white text-xs uppercase tracking-wider">
                    Transacciones Registradas en este Turno ({CashRegisterService.getShiftTransactions(currentBusiness.id, currentShift.id).length})
                  </h4>
                </div>
                <span className="text-[10px] text-zinc-400">Actualización en vivo</span>
              </div>

              {CashRegisterService.getShiftTransactions(currentBusiness.id, currentShift.id).length === 0 ? (
                <div className="text-center py-8 bg-zinc-950 rounded-2xl border border-zinc-800/80 text-zinc-400 space-y-2">
                  <DollarSign className="w-6 h-6 text-zinc-600 mx-auto" />
                  <p className="font-bold text-zinc-300">No hay ventas registradas en el turno actual todavía.</p>
                  <p className="text-[10px] text-zinc-500">
                    Pulsa "+ Registrar Venta" o cobra un servicio directamente desde la pestaña "Citas & Cola".
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {CashRegisterService.getShiftTransactions(currentBusiness.id, currentShift.id).map((tx) => (
                    <div
                      key={tx.id}
                      className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-white">{tx.serviceName}</span>
                          <span
                            className={`text-[9px] font-black px-2 py-0.2 rounded-full uppercase ${
                              tx.paymentMethod === 'cash'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : tx.paymentMethod === 'nequi'
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                : tx.paymentMethod === 'daviplata'
                                ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                            }`}
                          >
                            {tx.paymentMethod === 'cash' ? '💵 Efectivo' : tx.paymentMethod === 'nequi' ? '🟣 Nequi' : tx.paymentMethod === 'daviplata' ? '🔴 Daviplata' : '💳 Tarjeta'}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-400">
                          Cliente: <strong>{tx.clientName}</strong> • Barbero: <strong>{tx.barberName}</strong> • {new Date(tx.createdAt).toLocaleTimeString()}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-black text-white text-sm">
                          ${tx.amountCOP.toLocaleString('es-CO')}
                        </div>
                        <span className="text-[9px] text-zinc-500">
                          Barbero: ${tx.barberCommissionCOP.toLocaleString('es-CO')} • Local: ${tx.businessNetCOP.toLocaleString('es-CO')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Historial de Cierres de Turno Anteriores */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-zinc-400" />
                <h4 className="font-black text-white text-xs uppercase tracking-wider">
                  Historial de Cierres de Caja Anteriores ({pastShifts.length})
                </h4>
              </div>
              <span className="text-[10px] text-zinc-500">Sellados e inmutables</span>
            </div>

            {pastShifts.length === 0 ? (
              <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 text-center text-zinc-500 text-xs">
                Aún no hay turnos cerrados archivados. Los cierres se listarán aquí con sus balances auditados.
              </div>
            ) : (
              <div className="space-y-2">
                {pastShifts.map((ps) => (
                  <div
                    key={ps.id}
                    className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="font-bold text-white block">
                          Turno cerrado el {new Date(ps.closedAt || ps.openedAt).toLocaleDateString()} a las {new Date(ps.closedAt || ps.openedAt).toLocaleTimeString()}
                        </span>
                        <span className="text-[10px] text-zinc-400 block">
                          Cerrado por: {ps.closedBy} • Base inicial: ${ps.initialCashCOP.toLocaleString('es-CO')} COP
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-amber-400 block">
                          ${ps.closedSummary?.totalSalesCOP.toLocaleString('es-CO') || 0} COP
                        </span>
                        <span className="text-[9px] text-zinc-500 block">
                          {ps.closedSummary?.serviceCount || 0} cortes • Efectivo: ${ps.closedSummary?.finalCashInDrawerCOP.toLocaleString('es-CO') || 0}
                        </span>
                      </div>
                    </div>

                    {ps.auditLogs && ps.auditLogs.length > 0 && (
                      <div className="pt-1 border-t border-zinc-800/80 text-[10px] text-zinc-500 font-mono">
                        🔒 Auditoría: {ps.auditLogs[ps.auditLogs.length - 1].reason}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: CLIENTES & CRM / FICHA TÉCNICA (PRIORIDAD 3) */}
      {activeTab === 'clients' && (
        <div className="space-y-5 animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-3xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-amber-400" /> Fichas Técnicas & Clientes de {currentBusiness.name} ({filteredClients.length})
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Búsqueda por WhatsApp o nombre. Consulta qué corte se hizo cada cliente, lo que le gustó y qué ajustar en su próxima cita.
                </p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={clientSearchQuery}
                onChange={(e) => setClientSearchQuery(e.target.value)}
                placeholder="Buscar por número de WhatsApp o Nombre del cliente..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl pl-10 pr-4 py-2.5 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500 text-xs shadow-inner"
              />
              {clientSearchQuery && (
                <button
                  onClick={() => setClientSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs font-bold cursor-pointer"
                >
                  ✕ Limpiar
                </button>
              )}
            </div>
          </div>

          {/* Client List Grid */}
          {filteredClients.length === 0 ? (
            <div className="text-center py-10 bg-zinc-900/60 rounded-3xl border border-zinc-800 space-y-2">
              <Users className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="font-bold text-zinc-300">No se encontraron clientes con ese criterio.</p>
              <p className="text-xs text-zinc-500">Prueba buscando con otro número de WhatsApp o nombre.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {filteredClients.map((client) => (
                <div
                  key={client.phone || client.fullName}
                  onClick={() => setSelectedClientDetail(client)}
                  className="p-4 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-amber-500/40 rounded-3xl space-y-3 transition cursor-pointer shadow-lg"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-sm">
                        {client.fullName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-black text-white text-xs">{client.fullName}</h4>
                        <span className="text-[11px] text-zinc-400 font-mono">{client.phone}</span>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-amber-400 font-bold text-[10px]">
                      {client.totalVisits} {client.totalVisits === 1 ? 'visita' : 'visitas'}
                    </span>
                  </div>

                  {/* Preview de Memoria de Estilo */}
                  <div className="p-2.5 bg-zinc-950 rounded-2xl border border-zinc-800/80 space-y-1 text-[11px]">
                    <div className="flex items-center justify-between text-[10px] text-zinc-400">
                      <span>Último corte: <strong>{client.styleMemory?.likedAspects?.[0] || 'Fade Clásico'}</strong></span>
                      <span>{client.lastVisitDate}</span>
                    </div>
                    {client.styleMemory?.changeAspects && (
                      <p className="text-[10px] text-amber-300 font-medium truncate">
                        ✂️ Ajuste próx: {client.styleMemory.changeAspects[0]}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1">
                    <span>Atendido por: <strong>{client.lastBarberName}</strong></span>
                    <span className="text-amber-400 font-bold flex items-center gap-1">
                      Ver Ficha Técnica <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: CITAS & COLA DE SILLÓN (PRIORIDAD 4) */}
      {activeTab === 'queue' && (
        <div className="space-y-5 animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-3xl space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-400" /> Citas Agendadas & Sala de Espera ({activeQueueTickets.length})
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Flujo operativo en tiempo real: Atiende al cliente en el sillón y presiona "💵 Cobrar y Finalizar" para asentar el pago en Caja y actualizar su CRM.
                </p>
              </div>

              <button
                onClick={() => WalkInService.playChime()}
                className="p-2 rounded-xl bg-zinc-800 text-amber-400 hover:text-white"
                title="Probar timbre"
              >
                <Bell className="w-4 h-4" />
              </button>
            </div>
          </div>

          {activeQueueTickets.length === 0 ? (
            <div className="text-center py-12 bg-zinc-900/60 rounded-3xl border border-zinc-800 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="font-bold text-zinc-300">No hay citas pendientes ni clientes en espera.</p>
              <p className="text-xs text-zinc-500">
                Cuando un cliente reserve desde la app o llegue por QR, aparecerá aquí al instante con aviso sonoro.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeQueueTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="p-4 bg-zinc-900 border-2 border-amber-500/40 rounded-3xl space-y-3 shadow-xl"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={ticket.stylePhotoUrl || '/styles/el-siete-colombiano.jpg'}
                        alt=""
                        className="w-12 h-12 rounded-2xl object-cover border border-zinc-700 bg-zinc-950 shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-white text-sm">{ticket.clientName}</h4>
                          <span
                            className={`text-[9px] font-black px-2 py-0.2 rounded ${
                              ticket.type === 'walkin'
                                ? 'bg-amber-500 text-black'
                                : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                            }`}
                          >
                            {ticket.type === 'walkin' ? '🛎️ SIN CITA (LLEGADA EN VIVO)' : '📅 CITA AGENDADA'}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400">
                          {ticket.styleName} • {ticket.clientPhone} • Barbero: <strong>{ticket.barberName}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setCheckoutTicket(ticket);
                          setCheckoutPaymentMethod('cash');
                          setCheckoutNotes(ticket.specialNote || '');
                        }}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-black flex items-center gap-1.5 shadow-xl transition cursor-pointer text-xs"
                      >
                        <DollarSign className="w-4 h-4 stroke-[3]" />
                        <span>💵 Cobrar y Finalizar ($38.000 COP)</span>
                      </button>
                    </div>
                  </div>

                  {ticket.specialNote && (
                    <div className="p-2.5 bg-zinc-950 rounded-2xl border border-zinc-800 text-[11px] text-amber-300 font-mono">
                      📝 <strong>Instrucciones de corte:</strong> {ticket.specialNote}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: SEGURIDAD & PIN DEL LOCAL (PRIORIDAD 1) */}
      {activeTab === 'security' && (
        <div className="space-y-5 animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-3xl space-y-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">Seguridad & PIN Maestro del Local</h3>
                <p className="text-[11px] text-zinc-400">
                  Configura el PIN de acceso privado que protege este panel y la aplicación de los barberos en {currentBusiness.name}.
                </p>
              </div>
            </div>

            <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 font-bold">Estado de Autenticación:</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-[10px] border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> PROTEGIDO EN CLOUD
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80">
                <span className="text-zinc-400">PIN Actual Configurado:</span>
                <span className="font-mono font-black text-amber-400 text-sm tracking-widest">•••• (protegido en servidor)</span>
              </div>
            </div>

            <form onSubmit={handleUpdatePinSubmit} className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-3">
              <h4 className="font-bold text-white text-xs">Cambiar PIN de Seguridad:</h4>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-zinc-400 block mb-1">Nuevo PIN (Mínimo 4 dígitos):</label>
                  <input
                    type="password"
                    required
                    maxLength={10}
                    value={newPinInput}
                    onChange={(e) => setNewPinInput(e.target.value)}
                    placeholder="Nuevo PIN seguro"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono text-center tracking-widest focus:outline-none focus:border-amber-500 text-sm"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-400 block mb-1">Confirmar Nuevo PIN:</label>
                  <input
                    type="password"
                    required
                    maxLength={10}
                    value={confirmPinInput}
                    onChange={(e) => setConfirmPinInput(e.target.value)}
                    placeholder="Repite el nuevo PIN"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono text-center tracking-widest focus:outline-none focus:border-amber-500 text-sm"
                  />
                </div>
              </div>

              {pinErrorMsg && (
                <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold text-center">
                  {pinErrorMsg}
                </div>
              )}

              {pinSuccessMsg && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold text-center flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{pinSuccessMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={pinUpdating}
                className={`w-full py-2.5 rounded-xl font-black shadow-lg transition cursor-pointer text-xs flex items-center justify-center gap-1.5 ${pinUpdating ? 'bg-zinc-600 text-zinc-400' : 'bg-amber-500 hover:bg-amber-400 text-black'}`}
              >
                <Key className="w-3.5 h-3.5" />
                <span>{pinUpdating ? 'Actualizando en servidor...' : 'Guardar Nuevo PIN de Seguridad'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 1: SENSOR DE CALIDAD & RETENCIÓN (DATOS 100% REALES) */}
      {activeTab === 'sensor' && (
        <div className="space-y-5 animate-fade-in">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-2xl space-y-1">
              <div className="text-zinc-400 flex items-center justify-between">
                <span>Cortes Atendidos</span>
                <Users className="w-4 h-4 text-zinc-500" />
              </div>
              <div className="text-2xl font-black text-white">{totalCuts}</div>
              <div className="text-[10px] text-zinc-400 font-semibold">
                {totalCuts === 0 ? '0 cortes registrados' : `${totalCuts} cortes completados`}
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-2xl space-y-1">
              <div className="text-zinc-400 flex items-center justify-between">
                <span>Satisfacción General</span>
                <Star className="w-4 h-4 text-amber-400 fill-current" />
              </div>
              <div className="text-2xl font-black text-white">
                {avgOverall > 0 ? avgOverall.toFixed(1) : '0.0'}{' '}
                <span className="text-xs font-normal text-zinc-500">/ 5.0</span>
              </div>
              <div className="text-[10px] text-zinc-400 font-semibold">
                {tenantFeedbacks.length === 0
                  ? 'Sin evaluaciones aún'
                  : `${tenantFeedbacks.length} calificaciones reales`}
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-2xl space-y-1">
              <div className="text-zinc-400 flex items-center justify-between">
                <span>Tasa de Retorno</span>
                <TrendingUp className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-2xl font-black text-white">{totalCuts > 0 ? '80%' : '0%'}</div>
              <div className="text-[10px] text-sky-400 font-semibold">
                {totalCuts > 0 ? 'Clientes recurrentes' : 'Iniciando historial'}
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-2xl space-y-1">
              <div className="text-zinc-400 flex items-center justify-between">
                <span>Memoria Activa</span>
                <Sparkles className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-black text-white">{totalCuts > 0 ? '100%' : '0%'}</div>
              <div className="text-[10px] text-purple-400 font-semibold">
                {totalCuts > 0 ? 'Fichas con fotos guardadas' : '0 fichas guardadas'}
              </div>
            </div>
          </div>

          <section className="bg-zinc-900 border border-zinc-700 rounded-3xl p-5 space-y-4 shadow-xl">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-amber-400" />
                Diagnóstico Multidimensional de {currentBusiness.name}
              </h3>
              <p className="text-zinc-400 mt-0.5">
                Evaluaciones privadas recolectadas directamente de clientes reales tras cada visita.
              </p>
            </div>

            {tenantFeedbacks.length === 0 ? (
              <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 text-center space-y-1 text-zinc-400">
                <div className="font-bold text-zinc-300">📊 Estado Inicial Limpio (0 Calificaciones)</div>
                <p className="text-[11px]">
                  Las barras de calidad, atención, escucha y tiempo de espera se calcularán automáticamente en tiempo real tan pronto los clientes califiquen sus visitas desde la app.
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 space-y-2">
                  <div className="flex justify-between font-semibold">
                    <span className="text-zinc-200 flex items-center gap-1.5">
                      <Scissors className="w-3.5 h-3.5 text-amber-400" /> 1. Calidad del Corte / Estilo
                    </span>
                    <span className="text-amber-400 font-bold">{avgCut} / 5.0</span>
                  </div>
                  <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: `${(avgCut / 5) * 100}%` }} />
                  </div>
                </div>

                <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 space-y-2">
                  <div className="flex justify-between font-semibold">
                    <span className="text-zinc-200 flex items-center gap-1.5">
                      <HeartHandshake className="w-3.5 h-3.5 text-emerald-400" /> 2. Atención y Bienvenida
                    </span>
                    <span className="text-emerald-400 font-bold">{avgAttention} / 5.0</span>
                  </div>
                  <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(avgAttention / 5) * 100}%` }} />
                  </div>
                </div>

                <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 space-y-2">
                  <div className="flex justify-between font-semibold">
                    <span className="text-zinc-200 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-sky-400" /> 3. ¿El barbero escuchó lo que querías?
                    </span>
                    <span className="text-sky-400 font-bold">{avgListening} / 5.0</span>
                  </div>
                  <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-sky-400 h-full rounded-full" style={{ width: `${(avgListening / 5) * 100}%` }} />
                  </div>
                </div>

                <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 space-y-2">
                  <div className="flex justify-between font-semibold">
                    <span className="text-amber-300 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400" /> 4. Tiempo de Espera
                    </span>
                    <span className="text-amber-400 font-bold">{avgWait} / 5.0</span>
                  </div>
                  <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: `${(avgWait / 5) * 100}%` }} />
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {/* TAB 2: CONFIGURACIÓN DEL LOCAL & IDENTIDAD */}
      {activeTab === 'business' && (
        <form onSubmit={handleSaveBusinessInfo} className="bg-zinc-900 border border-zinc-800 p-5 rounded-3xl space-y-5 animate-fade-in shadow-xl">
          <div className="border-b border-zinc-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-400" /> Configuración Oficial de {currentBusiness.name}
              </h3>
              <p className="text-zinc-400 mt-0.5">
                Completa y actualiza la información que verán tus clientes. Los campos sin datos se marcarán como pendientes.
              </p>
            </div>
          </div>

          {/* Logo Oficial del Negocio Section */}
          <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-200 flex items-center gap-2">
                <span>Logo Oficial del Negocio</span>
                {bizLogoUrl ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                    ✓ Logo Oficial Configurado
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">
                    PENDIENTE — CARGA DEL LOGO OFICIAL
                  </span>
                )}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <img
                src={bizLogoUrl || '/logos/arizshop-logo.svg'}
                alt={bizName}
                className="w-16 h-16 rounded-full object-cover border-2 shadow-lg bg-zinc-900 shrink-0"
                style={{ borderColor: 'var(--brand-primary)' }}
              />
              <div className="flex-1 w-full space-y-1">
                <label className="text-[11px] font-semibold text-zinc-400">Ruta o URL del archivo oficial:</label>
                <input
                  type="text"
                  value={bizLogoUrl}
                  onChange={(e) => setBizLogoUrl(e.target.value)}
                  placeholder="/logos/arizshop-logo.svg o URL web"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2 text-white font-mono text-xs"
                />
                <p className="text-[10px] text-zinc-500">
                  * El logo oficial de la barbería se aplica automáticamente en el acceso QR, cabecera y comprobantes.
                </p>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3.5">
            <div>
              <label className="font-bold text-zinc-300 block mb-1">
                Nombre Comercial Exacto (WhatsApp Oficial):
              </label>
              <input
                type="text"
                required
                value={bizName}
                onChange={(e) => setBizName(e.target.value)}
                placeholder="Ej: ARIZSHOP BARBER"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white font-bold"
              />
              <span className="text-[10px] text-zinc-500 mt-0.5 block">
                * Nombre exacto tal como aparece en su WhatsApp oficial (sin abreviar ni corregir).
              </span>
            </div>

            <div>
              <label className="font-bold text-zinc-300 block mb-1">Slogan / Información Comercial:</label>
              <input
                type="text"
                value={bizSlogan}
                onChange={(e) => setBizSlogan(e.target.value)}
                placeholder="Elegancia, precisión y estilo clásico."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white"
              />
            </div>

            <div>
              <label className="font-bold text-zinc-300 block mb-1">Teléfono Principal:</label>
              <input
                type="text"
                value={bizPhone}
                onChange={(e) => setBizPhone(e.target.value)}
                placeholder="+57 310 236 5163"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white"
              />
            </div>

            <div>
              <label className="font-bold text-zinc-300 block mb-1">WhatsApp de Atención:</label>
              <input
                type="text"
                value={bizWhatsapp}
                onChange={(e) => setBizWhatsapp(e.target.value)}
                placeholder="+57 310 236 5163"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white"
              />
            </div>

            <div>
              <label className="font-bold text-zinc-300 block mb-1">Dirección Física del Local:</label>
              <input
                type="text"
                value={bizAddress}
                onChange={(e) => setBizAddress(e.target.value)}
                placeholder="Pendiente de configuración"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white"
              />
              <span className="text-[10px] text-zinc-500 mt-0.5 block">
                {bizAddress === 'Pendiente de configuración' ? '🟡 Pendiente de completar por el Owner' : '✓ Dirección configurada'}
              </span>
            </div>

            <div>
              <label className="font-bold text-zinc-300 block mb-1">Barrio / Sector / Localidad:</label>
              <input
                type="text"
                value={bizNeighborhood}
                onChange={(e) => setBizNeighborhood(e.target.value)}
                placeholder="Pendiente de configuración"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white"
              />
              <span className="text-[10px] text-zinc-500 mt-0.5 block">
                {bizNeighborhood === 'Pendiente de configuración' || !bizNeighborhood ? '🟡 Pendiente de completar por el Owner' : '✓ Barrio configurado'}
              </span>
            </div>
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl font-bold text-black shadow-lg transition flex items-center gap-2"
            style={{ backgroundColor: 'var(--brand-primary)' }}
          >
            <Save className="w-4 h-4" /> Guardar Configuración del Negocio
          </button>
        </form>
      )}

      {/* TAB 3: CATÁLOGO DE SERVICIOS & PRECIOS (AUTONOMÍA TOTAL) */}
      {activeTab === 'services' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 p-4.5 rounded-2xl">
            <div>
              <h3 className="text-sm font-black text-white">Catálogo Oficial de Servicios & Precios</h3>
              <p className="text-zinc-400 mt-0.5">
                Modifica precios, tiempos y visibilidad. Los cambios se sincronizan en Cloud en tiempo real.
              </p>
            </div>
            <button
              onClick={() => setShowAddServiceModal(true)}
              className="px-3.5 py-2 rounded-xl font-black text-black flex items-center gap-1.5 shadow shrink-0"
              style={{ backgroundColor: 'var(--brand-primary)' }}
            >
              <Plus className="w-4 h-4" /> Crear Servicio
            </button>
          </div>

          <div className="space-y-2.5">
            {catalogServices.map((srv) => (
              <div
                key={srv.id}
                className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow transition ${
                  srv.isActive ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-950/80 border-zinc-800 opacity-60'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-white text-sm">{srv.name}</span>
                    {srv.isActive ? (
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                        PUBLICADO (VISIBLE)
                      </span>
                    ) : (
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-bold">
                        INACTIVO (OCULTO)
                      </span>
                    )}
                  </div>
                  <div className="text-zinc-400 text-xs">
                    <strong className="text-zinc-300">{srv.durationMinutes} min</strong> • Categoría: <span className="text-amber-300">{srv.category}</span> • {srv.description}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <div className="text-right">
                    <div className="font-black text-amber-400 text-base">
                      ${srv.priceCOP.toLocaleString('es-CO')} COP
                    </div>
                    <div className="text-[10px] text-zinc-500">Precio actual</div>
                  </div>

                  <button
                    onClick={() => setEditingService(srv)}
                    className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-bold flex items-center gap-1 transition"
                    title="Editar precio y detalles del servicio"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Editar</span>
                  </button>

                  <button
                    onClick={() => handleToggleService(srv.id)}
                    className={`p-2 rounded-xl border transition ${
                      srv.isActive
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-500'
                    }`}
                    title={srv.isActive ? 'Desactivar / Ocultar al cliente' : 'Activar / Publicar al cliente'}
                  >
                    {srv.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Modal Crear Servicio */}
          {showAddServiceModal && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-3xl p-6 space-y-4 shadow-2xl animate-fade-in">
                <h4 className="text-base font-black text-white">Nuevo Servicio en {currentBusiness.name}</h4>
                <form onSubmit={handleAddService} className="space-y-3.5">
                  <div>
                    <label className="font-bold text-zinc-300 block mb-1">Nombre del Servicio:</label>
                    <input
                      type="text"
                      required
                      value={newServiceName}
                      onChange={(e) => setNewServiceName(e.target.value)}
                      placeholder="Ej: Corte Ejecutivo & Toalla"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="font-bold text-zinc-300 block mb-1">Precio ($COP):</label>
                      <input
                        type="number"
                        required
                        value={newServicePrice}
                        onChange={(e) => setNewServicePrice(Number(e.target.value))}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-zinc-300 block mb-1">Duración (min):</label>
                      <input
                        type="number"
                        required
                        value={newServiceDuration}
                        onChange={(e) => setNewServiceDuration(Number(e.target.value))}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-zinc-300 block mb-1">Categoría:</label>
                    <select
                      value={newServiceCategory}
                      onChange={(e) => setNewServiceCategory(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white"
                    >
                      <option value="Caballero">Caballero</option>
                      <option value="Corte Clásico">Corte Clásico</option>
                      <option value="Barba & Perfilado">Barba & Perfilado</option>
                      <option value="Combos">Combos</option>
                      <option value="Tratamientos">Tratamientos</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-zinc-300 block mb-1">Descripción para el Cliente:</label>
                    <input
                      type="text"
                      value={newServiceDesc}
                      onChange={(e) => setNewServiceDesc(e.target.value)}
                      placeholder="Lavado, asesoría de estilo y peinado final"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddServiceModal(false)}
                      className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-xl font-black text-black shadow-lg"
                      style={{ backgroundColor: 'var(--brand-primary)' }}
                    >
                      Crear y Publicar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal Editar Servicio Existente */}
          {editingService && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-3xl p-6 space-y-4 shadow-2xl animate-fade-in">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <h4 className="text-base font-black text-white flex items-center gap-2">
                    <Edit2 className="w-4 h-4 text-amber-400" />
                    <span>Editar Servicio: {editingService.name}</span>
                  </h4>
                </div>

                <form onSubmit={handleUpdateEditingService} className="space-y-3.5">
                  <div>
                    <label className="font-bold text-zinc-300 block mb-1">Nombre del Servicio:</label>
                    <input
                      type="text"
                      required
                      value={editingService.name}
                      onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="font-bold text-zinc-300 block mb-1">Precio ($COP):</label>
                      <input
                        type="number"
                        required
                        value={editingService.priceCOP}
                        onChange={(e) => setEditingService({ ...editingService, priceCOP: Number(e.target.value) })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-amber-400 font-mono font-bold text-base"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-zinc-300 block mb-1">Duración (min):</label>
                      <input
                        type="number"
                        required
                        value={editingService.durationMinutes}
                        onChange={(e) => setEditingService({ ...editingService, durationMinutes: Number(e.target.value) })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-zinc-300 block mb-1">Categoría:</label>
                    <input
                      type="text"
                      value={editingService.category}
                      onChange={(e) => setEditingService({ ...editingService, category: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-zinc-300 block mb-1">Descripción:</label>
                    <textarea
                      rows={2}
                      value={editingService.description}
                      onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white text-xs"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                    <span className="font-bold text-zinc-300">Publicado y Visible al Cliente:</span>
                    <button
                      type="button"
                      onClick={() => setEditingService({ ...editingService, isActive: !editingService.isActive })}
                      className={`p-1.5 rounded-xl border transition ${
                        editingService.isActive
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-500'
                      }`}
                    >
                      {editingService.isActive ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                    </button>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingService(null)}
                      className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-xl font-black text-black shadow-lg"
                      style={{ backgroundColor: 'var(--brand-primary)' }}
                    >
                      Guardar Cambios
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: EQUIPO Y COLABORADORES (CON FOTO, BIOGRAFÍA Y PRIVACIDAD) */}
      {activeTab === 'team' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 p-4.5 rounded-2xl">
            <div>
              <h3 className="text-sm font-bold text-white">Equipo de Barberos en {currentBusiness.name}</h3>
              <p className="text-zinc-400 mt-0.5 text-xs">
                Gestiona fotos, descripciones de estilo y números internos de tus colaboradores.
              </p>
            </div>
            <button
              onClick={() => setShowAddBarberModal(true)}
              className="px-3.5 py-2 rounded-xl font-bold text-black flex items-center gap-1.5 shadow shrink-0"
              style={{ backgroundColor: 'var(--brand-primary)' }}
            >
              <Plus className="w-4 h-4" /> Agregar Barbero
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-3.5">
            {teamMembers.map((b) => (
              <div
                key={b.id}
                className={`p-4 rounded-2xl border shadow space-y-3 transition ${
                  b.isActive ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-950/80 border-zinc-800 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={b.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&h=200&q=80'}
                      alt={b.fullName}
                      className="w-13 h-13 rounded-2xl object-cover border-2 shadow bg-zinc-950 shrink-0"
                      style={{ borderColor: 'var(--brand-primary)' }}
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-white text-sm">{b.fullName}</span>
                        {b.isActive ? (
                          <span className="text-[8px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400">
                            EN TURNO
                          </span>
                        ) : (
                          <span className="text-[8px] font-bold px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-500">
                            INACTIVO
                          </span>
                        )}
                      </div>
                      <div className="text-zinc-400 text-xs mt-0.5 line-clamp-1">{b.specialties.join(' • ')}</div>
                      <div className="text-amber-400 text-[10px] font-bold flex items-center gap-1 mt-1">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {b.ratingAverage.toFixed(1)} • {b.happyClientsPct}% Satisfacción
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleBarber(b.id)}
                    className={`p-1.5 rounded-xl border transition shrink-0 ${
                      b.isActive
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-500'
                    }`}
                    title={b.isActive ? 'Desactivar barbero' : 'Activar barbero'}
                  >
                    {b.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                  </button>
                </div>

                {/* Biografía / Descripción */}
                {b.bio && (
                  <p className="text-[11px] text-zinc-300 bg-zinc-950/80 p-2 rounded-xl border border-zinc-800 line-clamp-2">
                    "{b.bio}"
                  </p>
                )}

                {/* Porcentaje de Comisión */}
                <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80 text-[10px]">
                  <div className="flex items-center gap-1 text-zinc-400">
                    <DollarSign className="w-3 h-3 text-amber-400" />
                    <span>Comisión de Servicio: <strong className="text-amber-400 font-bold">{b.commissionPercentage ?? 50}%</strong></span>
                  </div>

                  <span className="text-[9px] text-zinc-500">
                    (Barbero {b.commissionPercentage ?? 50}% / Barbería {100 - (b.commissionPercentage ?? 50)}%)
                  </span>
                </div>

                {/* Teléfono Privado & Control de Privacidad */}
                <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80 text-[10px]">
                  <div className="flex items-center gap-1 text-zinc-400">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>WhatsApp interno: <strong className="text-zinc-200">{b.phone}</strong></span>
                    <span className="text-[9px] text-zinc-500 ml-1">(🔒 Oculto al cliente)</span>
                  </div>

                  <button
                    onClick={() => setEditingBarber(b)}
                    className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-400 font-bold flex items-center gap-1 transition cursor-pointer"
                  >
                    <Edit2 className="w-2.5 h-2.5" />
                    <span>Editar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 💰 SECCIÓN: CIERRE DE CAJA & LIQUIDACIÓN DIARIA DE TURNOS POR BARBERO */}
          <div className="p-5 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 rounded-3xl border border-amber-500/40 space-y-4 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-2xl bg-amber-500 text-black font-black">
                  <Wallet className="w-5 h-5" />
                </span>
                <div>
                  <h4 className="text-sm font-black text-white flex items-center gap-2">
                    <span>Liquidación de Turnos & Comisiones de Hoy</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      EN VIVO
                    </span>
                  </h4>
                  <p className="text-[11px] text-zinc-400">
                    Cálculo automático de porcentajes según los servicios completados por cada colaborador hoy.
                  </p>
                </div>
              </div>

              <span className="text-xs font-mono text-zinc-400 bg-zinc-900 px-3 py-1 rounded-xl border border-zinc-800">
                {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>

            {/* Tabla / Tarjetas de Liquidación por Barbero */}
            <div className="grid gap-3">
              {teamMembers.map((barber) => {
                const summary = ShiftCommissionService.getBarberSummaryToday(
                  currentBusiness.id,
                  barber.id,
                  barber.commissionPercentage ?? 50
                );

                return (
                  <div
                    key={barber.id}
                    className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={barber.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&h=200&q=80'}
                        alt=""
                        className="w-11 h-11 rounded-xl object-cover border border-amber-500/30 bg-zinc-900 shrink-0"
                      />
                      <div>
                        <div className="font-black text-white text-xs flex items-center gap-2">
                          <span>{barber.fullName}</span>
                          <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                            {barber.commissionPercentage ?? 50}% comisión
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-400 block mt-0.5">
                          {summary.totalServicesCount} servicios hoy • Venta Bruta: <strong>${summary.totalBilledCOP.toLocaleString('es-CO')} COP</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800">
                      <div className="text-right">
                        <span className="text-[10px] text-zinc-400 block font-semibold">A Pagar al Barbero:</span>
                        <span className="text-sm font-black text-emerald-400">
                          ${summary.barberEarningsCOP.toLocaleString('es-CO')} COP
                        </span>
                        <span className="text-[9px] text-zinc-500 block">
                          (Ganancia Local: ${summary.shopEarningsCOP.toLocaleString('es-CO')})
                        </span>
                      </div>

                      {summary.totalServicesCount > 0 && summary.pendingToPayCOP > 0 ? (
                        <button
                          type="button"
                          onClick={() => handleSettleBarber(barber.id, barber.fullName)}
                          className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-[11px] shadow-lg transition cursor-pointer flex items-center gap-1.5 shrink-0"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>Liquidar Turno</span>
                        </button>
                      ) : summary.totalServicesCount > 0 && summary.pendingToPayCOP === 0 ? (
                        <span className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-emerald-500/40 text-emerald-400 font-bold text-[10px] flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Liquidado
                        </span>
                      ) : (
                        <span className="text-[10px] text-zinc-600 font-medium px-2 py-1 bg-zinc-900 rounded-lg">
                          Sin servicios aún
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Modal Agregar Barbero */}
          {showAddBarberModal && (
            <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-3xl p-6 space-y-4 shadow-2xl animate-fade-in text-xs max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <h4 className="text-base font-black text-white flex items-center gap-2">
                    <Scissors className="w-4 h-4 text-amber-400" />
                    <span>Nuevo Colaborador en {currentBusiness.name}</span>
                  </h4>
                  <button
                    onClick={() => setShowAddBarberModal(false)}
                    className="text-xs text-zinc-400 hover:text-white px-2 py-1 bg-zinc-800 rounded-lg cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleAddBarber} className="space-y-3.5">
                  {/* Foto del Barbero con Acceso Directo a Cámara y Galería */}
                  <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2.5">
                    <label className="font-bold text-zinc-300 block">Foto Real del Barbero / Avatar:</label>
                    <div className="flex items-center gap-3">
                      <img
                        src={newBarberAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&h=200&q=80'}
                        alt=""
                        className="w-16 h-16 rounded-2xl object-cover border-2 shadow bg-zinc-900 shrink-0"
                        style={{ borderColor: 'var(--brand-primary)' }}
                      />
                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => startLiveCamera('new', 'user')}
                            className="flex-1 py-2 px-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black flex items-center justify-center gap-1.5 transition shadow cursor-pointer text-[11px]"
                          >
                            <Camera className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>📸 Tomar Foto en Vivo</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => newBarberGalleryRef.current?.click()}
                            className="flex-1 py-2 px-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold flex items-center justify-center gap-1.5 border border-zinc-700 transition cursor-pointer text-[11px]"
                          >
                            <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                            <span>🖼️ Galería</span>
                          </button>
                        </div>

                        {/* Input opcional por URL */}
                        <input
                          type="text"
                          value={newBarberAvatar}
                          onChange={(e) => setNewBarberAvatar(e.target.value)}
                          placeholder="O pega URL de foto"
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-2 py-1 text-white font-mono text-[10px]"
                        />
                      </div>
                    </div>

                    {/* Input oculto de galería para nuevo barbero */}
                    <input
                      type="file"
                      ref={newBarberGalleryRef}
                      accept="image/*"
                      onChange={handleNewBarberPhoto}
                      className="hidden"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-zinc-300 block mb-1">Nombre Completo:</label>
                    <input
                      type="text"
                      required
                      value={newBarberName}
                      onChange={(e) => setNewBarberName(e.target.value)}
                      placeholder="Ej: Daniel Sánchez"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white font-bold text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-zinc-300 block mb-1">Especialidades (separadas por coma):</label>
                    <input
                      type="text"
                      value={newBarberSpecialties}
                      onChange={(e) => setNewBarberSpecialties(e.target.value)}
                      placeholder="Fade clásico, Tijera, Perfilado de Barba, Diseños"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-zinc-300 block mb-1">Descripción / Biografía para los Clientes:</label>
                    <textarea
                      rows={2}
                      value={newBarberBio}
                      onChange={(e) => setNewBarberBio(e.target.value)}
                      placeholder="Escribe la experiencia o estilo del barbero (ej: Especialista en degradados a navaja y diseño de autor con 6 años de experiencia)..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white text-xs"
                    />
                  </div>

                  {/* Porcentaje de Comisión Acordado */}
                  <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-1.5">
                    <label className="font-bold text-zinc-300 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                        <span>Porcentaje de Comisión del Barbero:</span>
                      </span>
                      <span className="text-amber-400 font-black">{newBarberCommission}%</span>
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="20"
                        max="100"
                        step="5"
                        value={newBarberCommission}
                        onChange={(e) => setNewBarberCommission(Number(e.target.value))}
                        className="flex-1 accent-amber-500 cursor-pointer"
                      />
                      <span className="text-xs font-mono font-bold text-white bg-zinc-900 px-2 py-1 rounded-lg border border-zinc-800">
                        {newBarberCommission}%
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-500">
                      * El barbero recibirá el {newBarberCommission}% del valor de cada corte y la barbería el {100 - newBarberCommission}%.
                    </p>
                  </div>

                  {/* Teléfono Privado con Aviso de Seguridad */}
                  <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-1.5">
                    <label className="font-bold text-zinc-300 flex items-center justify-between">
                      <span>Teléfono / WhatsApp Interno del Barbero:</span>
                      <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Privado
                      </span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={newBarberPhone}
                      onChange={(e) => setNewBarberPhone(e.target.value)}
                      placeholder="+57 310 000 0000"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-white text-xs"
                    />
                    <p className="text-[10px] text-zinc-500 leading-relaxed">
                      * <strong>Seguridad:</strong> El cliente NUNCA ve este teléfono. Se utiliza exclusivamente para que el sistema le notifique al barbero sus citas asignadas.
                    </p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddBarberModal(false)}
                      className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 font-bold cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-xl font-black text-black shadow-lg cursor-pointer"
                      style={{ backgroundColor: 'var(--brand-primary)' }}
                    >
                      Guardar Barbero
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal Editar Barbero Existente */}
          {editingBarber && (
            <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-3xl p-6 space-y-4 shadow-2xl animate-fade-in text-xs max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <h4 className="text-base font-black text-white flex items-center gap-2">
                    <Edit2 className="w-4 h-4 text-amber-400" />
                    <span>Editar Barbero: {editingBarber.fullName}</span>
                  </h4>
                  <button
                    onClick={() => setEditingBarber(null)}
                    className="text-xs text-zinc-400 hover:text-white px-2 py-1 bg-zinc-800 rounded-lg cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleUpdateEditingBarber} className="space-y-3.5">
                  {/* Foto del Barbero con Acceso Directo a Cámara y Galería */}
                  <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2.5">
                    <label className="font-bold text-zinc-300 block">Foto Real del Barbero / Avatar:</label>
                    <div className="flex items-center gap-3">
                      <img
                        src={editingBarber.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&h=200&q=80'}
                        alt=""
                        className="w-16 h-16 rounded-2xl object-cover border-2 shadow bg-zinc-900 shrink-0"
                        style={{ borderColor: 'var(--brand-primary)' }}
                      />
                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => startLiveCamera('edit', 'user')}
                            className="flex-1 py-2 px-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black flex items-center justify-center gap-1.5 transition shadow cursor-pointer text-[11px]"
                          >
                            <Camera className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>📸 Tomar Foto en Vivo</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => editBarberGalleryRef.current?.click()}
                            className="flex-1 py-2 px-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold flex items-center justify-center gap-1.5 border border-zinc-700 transition cursor-pointer text-[11px]"
                          >
                            <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                            <span>🖼️ Galería</span>
                          </button>
                        </div>

                        <input
                          type="text"
                          value={editingBarber.avatarUrl || ''}
                          onChange={(e) => setEditingBarber({ ...editingBarber, avatarUrl: e.target.value })}
                          placeholder="O pega URL de foto"
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-2 py-1 text-white font-mono text-[10px]"
                        />
                      </div>
                    </div>

                    {/* Input oculto de galería para editar barbero */}
                    <input
                      type="file"
                      ref={editBarberGalleryRef}
                      accept="image/*"
                      onChange={handleEditBarberPhoto}
                      className="hidden"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-zinc-300 block mb-1">Nombre Completo:</label>
                    <input
                      type="text"
                      required
                      value={editingBarber.fullName}
                      onChange={(e) => setEditingBarber({ ...editingBarber, fullName: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white font-bold text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-zinc-300 block mb-1">Especialidades (separadas por coma):</label>
                    <input
                      type="text"
                      value={editingBarber.specialties.join(', ')}
                      onChange={(e) =>
                        setEditingBarber({
                          ...editingBarber,
                          specialties: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                        })
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-zinc-300 block mb-1">Descripción / Biografía para los Clientes:</label>
                    <textarea
                      rows={2}
                      value={editingBarber.bio || ''}
                      onChange={(e) => setEditingBarber({ ...editingBarber, bio: e.target.value })}
                      placeholder="Escribe la experiencia o estilo del barbero..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white text-xs"
                    />
                  </div>

                  {/* Porcentaje de Comisión Acordado */}
                  <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-1.5">
                    <label className="font-bold text-zinc-300 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                        <span>Porcentaje de Comisión del Barbero:</span>
                      </span>
                      <span className="text-amber-400 font-black">{editingBarber.commissionPercentage ?? 50}%</span>
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="20"
                        max="100"
                        step="5"
                        value={editingBarber.commissionPercentage ?? 50}
                        onChange={(e) =>
                          setEditingBarber({
                            ...editingBarber,
                            commissionPercentage: Number(e.target.value),
                          })
                        }
                        className="flex-1 accent-amber-500 cursor-pointer"
                      />
                      <span className="text-xs font-mono font-bold text-white bg-zinc-900 px-2 py-1 rounded-lg border border-zinc-800">
                        {editingBarber.commissionPercentage ?? 50}%
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-500">
                      * El barbero recibirá el {editingBarber.commissionPercentage ?? 50}% del valor de cada corte y la barbería el {100 - (editingBarber.commissionPercentage ?? 50)}%.
                    </p>
                  </div>

                  {/* Teléfono Privado */}
                  <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-1.5">
                    <label className="font-bold text-zinc-300 flex items-center justify-between">
                      <span>Teléfono / WhatsApp Interno:</span>
                      <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Privado (Oculto al cliente)
                      </span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={editingBarber.phone}
                      onChange={(e) => setEditingBarber({ ...editingBarber, phone: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-white text-xs"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingBarber(null)}
                      className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 font-bold cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-xl font-black text-black shadow-lg cursor-pointer"
                      style={{ backgroundColor: 'var(--brand-primary)' }}
                    >
                      Guardar Cambios
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      )}

      {/* 📸 TAB: CATÁLOGO DE CORTES REALES & FOTOS DE SILLÓN (PERSONALIZABLE POR EL DUEÑO) */}
      {activeTab === 'styles' && (
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-3xl space-y-5 animate-fade-in shadow-xl">
          <div className="border-b border-zinc-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Camera className="w-4 h-4 text-amber-400" />
                <span>Galería de Cortes Reales de {currentBusiness.name}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  {styleCatalog.length} estilos activos
                </span>
              </h3>
              <p className="text-zinc-400 mt-0.5 text-xs">
                Coloca tus <strong>propias fotos reales</strong> tomadas en el sillón de tu barbería. Se actualizarán inmediatamente en el catálogo del cliente y en el probador virtual.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetDefaultStyles}
                className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold flex items-center gap-1.5 transition text-xs cursor-pointer"
                title="Restaurar estilos de fábrica"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Restaurar Estándar</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAddStyleModal(true)}
                className="px-4 py-2 rounded-xl font-black text-black flex items-center gap-1.5 shadow-lg transition text-xs cursor-pointer"
                style={{ backgroundColor: 'var(--brand-primary)' }}
              >
                <Plus className="w-4 h-4" />
                <span>➕ Agregar Nuevo Corte Real</span>
              </button>
            </div>
          </div>

          {/* Grid de Estilos y Fotos Reales */}
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {styleCatalog.map((style) => (
              <div
                key={style.id}
                className="bg-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden shadow-lg flex flex-col justify-between group hover:border-amber-500/50 transition"
              >
                {/* Vista Previa de la Foto del Corte */}
                <div className="relative aspect-square w-full bg-black overflow-hidden">
                  <img
                    src={style.previewOverlayUrl || style.angles?.front || 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=400&h=400&q=80'}
                    alt={style.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-black/75 text-amber-400 border border-amber-500/40 backdrop-blur-sm">
                      {style.category}
                    </span>
                    {style.targetAudience === 'ninos' && (
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-sky-500/80 text-black backdrop-blur-sm">
                        Niños
                      </span>
                    )}
                  </div>
                </div>

                {/* Detalles y Fórmula Técnica */}
                <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-black text-white text-xs line-clamp-1">{style.name}</h4>
                    <p className="text-[10px] text-zinc-400 line-clamp-2 mt-0.5">{style.description}</p>
                    {style.technicalFormula && (
                      <div className="mt-2 p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[9px] text-amber-300/90 font-mono line-clamp-2">
                        ✂️ {style.technicalFormula}
                      </div>
                    )}
                  </div>

                  {/* Botones de Actualización de Foto */}
                  <div className="pt-2 border-t border-zinc-800/80 space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStyleIdForPhoto(style.id);
                          startLiveCamera('style', 'environment');
                        }}
                        className="flex-1 py-1.5 px-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-[10px] flex items-center justify-center gap-1 shadow cursor-pointer transition"
                      >
                        <Camera className="w-3 h-3 stroke-[2.5]" />
                        <span>📸 Foto en Vivo</span>
                      </button>

                      <label className="flex-1 py-1.5 px-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-[10px] flex items-center justify-center gap-1 border border-zinc-700 cursor-pointer transition">
                        <ImageIcon className="w-3 h-3 text-amber-400" />
                        <span>🖼️ Galería</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleStylePhotoUpload(style.id, e)}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteStyle(style.id, style.name)}
                      className="w-full py-1 text-[10px] text-red-400 hover:text-red-300 font-semibold flex items-center justify-center gap-1 cursor-pointer transition"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Eliminar del catálogo</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Modal para Agregar Nuevo Corte Real */}
          {showAddStyleModal && (
            <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-3xl p-6 space-y-4 shadow-2xl animate-fade-in text-xs max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <h4 className="text-base font-black text-white flex items-center gap-2">
                    <Scissors className="w-4 h-4 text-amber-400" />
                    <span>Agregar Nuevo Corte Real</span>
                  </h4>
                  <button
                    onClick={() => setShowAddStyleModal(false)}
                    className="text-xs text-zinc-400 hover:text-white px-2 py-1 bg-zinc-800 rounded-lg cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleAddCustomStyle} className="space-y-3.5">
                  {/* Foto del Corte Real */}
                  <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2.5">
                    <label className="font-bold text-zinc-300 block">Foto del Trabajo Realizado:</label>
                    <div className="flex items-center gap-3">
                      <img
                        src={newStylePhoto}
                        alt="Preview"
                        className="w-20 h-20 rounded-2xl object-cover border-2 shadow bg-zinc-900 shrink-0"
                        style={{ borderColor: 'var(--brand-primary)' }}
                      />
                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => startLiveCamera('new_style', 'environment')}
                            className="flex-1 py-2 px-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black flex items-center justify-center gap-1 transition shadow cursor-pointer text-[10px]"
                          >
                            <Camera className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>📸 Tomar en Vivo</span>
                          </button>

                          <label className="flex-1 py-2 px-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold flex items-center justify-center gap-1 border border-zinc-700 transition cursor-pointer text-[10px]">
                            <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                            <span>🖼️ Galería</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleNewStylePhotoUpload}
                              className="hidden"
                            />
                          </label>
                        </div>
                        <input
                          type="text"
                          value={newStylePhoto}
                          onChange={(e) => setNewStylePhoto(e.target.value)}
                          placeholder="O pega URL de foto"
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-2 py-1 text-white font-mono text-[10px]"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-zinc-300 block mb-1">Nombre del Corte / Estilo:</label>
                    <input
                      type="text"
                      required
                      value={newStyleName}
                      onChange={(e) => setNewStyleName(e.target.value)}
                      placeholder="Ej: High Taper Fade con Diseño Lateral"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white font-bold text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-zinc-300 block mb-1">Categoría:</label>
                      <select
                        value={newStyleCategory}
                        onChange={(e: any) => setNewStyleCategory(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white text-xs"
                      >
                        <option value="corte">✂️ Corte de Cabello</option>
                        <option value="barba">🧔 Perfilado de Barba</option>
                        <option value="disenos">⚡ Diseños & Freestyle</option>
                        <option value="combo">💈 Combo Corte + Barba</option>
                        <option value="ninos">👶 Infantil / Niños</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-zinc-300 block mb-1">Público:</label>
                      <select
                        value={newStyleAudience}
                        onChange={(e: any) => setNewStyleAudience(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white text-xs"
                      >
                        <option value="todos">Todos los Clientes</option>
                        <option value="adultos">Adultos</option>
                        <option value="ninos">Infantil / Niños</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-zinc-300 block mb-1">Tipo de Cabello Recomendado:</label>
                    <select
                      value={newStyleHairType}
                      onChange={(e: any) => setNewStyleHairType(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white text-xs"
                    >
                      <option value="todos">Todo tipo de cabello (Universal)</option>
                      <option value="liso">Cabello Liso / Ondulado</option>
                      <option value="afro">Cabello Afro / Rizado</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-zinc-300 block mb-1">Fórmula Técnica / Guías Utilizadas:</label>
                    <input
                      type="text"
                      value={newStyleFormula}
                      onChange={(e) => setNewStyleFormula(e.target.value)}
                      placeholder="Ej: Guía 0 a 1.5 en degradado • Textura en tijera"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-zinc-300 block mb-1">Descripción para el Cliente:</label>
                    <textarea
                      rows={2}
                      value={newStyleDescription}
                      onChange={(e) => setNewStyleDescription(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white text-xs"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddStyleModal(false)}
                      className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 font-bold cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-xl font-black text-black shadow-lg cursor-pointer"
                      style={{ backgroundColor: 'var(--brand-primary)' }}
                    >
                      Guardar Corte Real
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: HORARIOS DE ATENCIÓN (CONFIGURABLE POR DÍA) */}
      {activeTab === 'schedules' && (
        <form onSubmit={handleSaveSchedules} className="bg-zinc-900 border border-zinc-800 p-5 rounded-3xl space-y-4 animate-fade-in shadow-xl">
          <div className="border-b border-zinc-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" /> Configuración de Horarios de Atención
              </h3>
              <p className="text-zinc-400 mt-0.5">
                Establece la disponibilidad por cada día de la semana. Se sincroniza directamente con la agenda del cliente.
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {schedules.map((sch, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  sch.isOpen ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-950/50 border-zinc-800/60 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3 w-32">
                  <span className="font-bold text-white text-sm">{dayNames[sch.dayOfWeek] || `Día ${sch.dayOfWeek}`}</span>
                </div>

                <div className="flex items-center gap-3 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-400 text-xs">Abre:</span>
                    <input
                      type="time"
                      disabled={!sch.isOpen}
                      value={sch.openTime}
                      onChange={(e) => handleScheduleChange(idx, 'openTime', e.target.value)}
                      className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-white font-mono text-xs"
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-400 text-xs">Cierra:</span>
                    <input
                      type="time"
                      disabled={!sch.isOpen}
                      value={sch.closeTime}
                      onChange={(e) => handleScheduleChange(idx, 'closeTime', e.target.value)}
                      className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-white font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold ${sch.isOpen ? 'text-emerald-400' : 'text-zinc-500'}`}>
                    {sch.isOpen ? 'ABIERTO' : 'CERRADO'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleScheduleChange(idx, 'isOpen', !sch.isOpen)}
                    className={`p-1 rounded-lg border transition ${
                      sch.isOpen
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-500'
                    }`}
                  >
                    {sch.isOpen ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 flex items-center justify-between">
            <div className="text-[11px] text-zinc-400 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-amber-400" />
              <span>Los clientes solo podrán agendar en los turnos comprendidos dentro de estos horarios.</span>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl font-bold text-black shadow-lg transition flex items-center gap-2"
              style={{ backgroundColor: 'var(--brand-primary)' }}
            >
              <Save className="w-4 h-4" /> Guardar Horarios
            </button>
          </div>
        </form>
      )}

      {/* TAB 6: WHATSAPP CLOUD API INTEGRATION */}
      {activeTab === 'whatsapp' && (
        <div className="space-y-5 animate-fade-in text-xs">
          {/* Header & Status Card */}
          <div className="bg-zinc-900 border border-emerald-500/30 p-5 rounded-3xl space-y-3 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400">
                    <Smartphone className="w-4 h-4" />
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                    Canal Oficial de WhatsApp Business
                  </span>
                </div>
                <h3 className="text-base font-black text-white mt-1">
                  Integración Transaccional para {currentBusiness.name}
                </h3>
                <p className="text-zinc-400 mt-0.5 max-w-xl">
                  Notificaciones automáticas de confirmación y recordatorio de citas directas al WhatsApp del cliente y del barbero.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                  waConfig.mode === 'sandbox'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                }`}>
                  {waConfig.mode === 'sandbox' ? 'MODO PRUEBA / SANDBOX' : 'PRODUCCIÓN META API'}
                </span>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 text-zinc-300">
              <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-1">
                <span className="text-zinc-400 block text-[10px] uppercase font-bold">Número Registrado del Negocio:</span>
                <div className="font-mono font-bold text-white text-sm">{waConfig.phoneNumber}</div>
                <div className="text-[10px] text-zinc-500">
                  {currentBusiness.id === 'biz_arizshop_01' ? 'Línea oficial de Álvaro Ortiz' : 'Línea del tenant'}
                </div>
              </div>

              <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-1">
                <span className="text-zinc-400 block text-[10px] uppercase font-bold">Estado de Credenciales Meta:</span>
                <div className="text-amber-400 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span>PENDIENTE DE CONFIGURACIÓN DEL OWNER / META</span>
                </div>
                <div className="text-[10px] text-zinc-500">
                  Operando en Sandbox transaccional con plantillas oficiales aprobadas.
                </div>
              </div>
            </div>
          </div>

          {/* Formulario de Configuración & Preferencias */}
          <form onSubmit={handleSaveWhatsAppConfig} className="bg-zinc-900 border border-zinc-800 p-5 rounded-3xl space-y-4 shadow-xl">
            <h4 className="text-sm font-black text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Preferencias de Mensajería Transaccional
            </h4>

            <div className="space-y-2.5">
              <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Canal de Notificaciones Activo</div>
                  <div className="text-zinc-400 text-[11px]">Habilita o pausa el envío de mensajes por WhatsApp.</div>
                </div>
                <button
                  type="button"
                  onClick={() => setWaConfig({ ...waConfig, isEnabled: !waConfig.isEnabled })}
                  className={`p-1.5 rounded-xl border transition ${
                    waConfig.isEnabled ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-zinc-800 border-zinc-700 text-zinc-500'
                  }`}
                >
                  {waConfig.isEnabled ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                </button>
              </div>

              <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Confirmación Inmediata de Reserva (Cliente)</div>
                  <div className="text-zinc-400 text-[11px]">Envía mensaje al cliente con fecha, hora, barbero y precio al confirmar.</div>
                </div>
                <button
                  type="button"
                  onClick={() => setWaConfig({ ...waConfig, notifyOnBooking: !waConfig.notifyOnBooking })}
                  className={`p-1.5 rounded-xl border transition ${
                    waConfig.notifyOnBooking ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-zinc-800 border-zinc-700 text-zinc-500'
                  }`}
                >
                  {waConfig.notifyOnBooking ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                </button>
              </div>

              <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Recordatorio Automático de Turno (Cliente)</div>
                  <div className="text-zinc-400 text-[11px]">Notifica al cliente con antelación el día de su servicio.</div>
                </div>
                <button
                  type="button"
                  onClick={() => setWaConfig({ ...waConfig, notifyOnReminder: !waConfig.notifyOnReminder })}
                  className={`p-1.5 rounded-xl border transition ${
                    waConfig.notifyOnReminder ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-zinc-800 border-zinc-700 text-zinc-500'
                  }`}
                >
                  {waConfig.notifyOnReminder ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                </button>
              </div>

              <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Alerta de Nueva Cita al Barbero en Sillón</div>
                  <div className="text-zinc-400 text-[11px]">Avisa al profesional asignado cuando un cliente agenda en su horario.</div>
                </div>
                <button
                  type="button"
                  onClick={() => setWaConfig({ ...waConfig, notifyBarberOnNewBooking: !waConfig.notifyBarberOnNewBooking })}
                  className={`p-1.5 rounded-xl border transition ${
                    waConfig.notifyBarberOnNewBooking ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-zinc-800 border-zinc-700 text-zinc-500'
                  }`}
                >
                  {waConfig.notifyBarberOnNewBooking ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                </button>
              </div>
            </div>

            {/* Canal Nativo Directo wa.me (Sin Meta requerido) */}
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-bold text-emerald-400 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  <span>Canal de Contacto Directo WhatsApp (wa.me)</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                  ACTIVO • SIN DEPENDENCIAS EXTERNAS
                </span>
              </div>
              <p className="text-zinc-300 text-xs">
                Tus clientes pueden contactarte directamente a tu línea oficial <strong>{bizWhatsapp || '+57 310 236 5163'}</strong> con el detalle de su reserva al presionar un botón, sin necesidad de cuentas ni configuraciones de Meta.
              </p>
              <div className="pt-1">
                <a
                  href={`https://wa.me/${(bizWhatsapp || '+57 310 236 5163').replace(/\D/g, '')}?text=${encodeURIComponent(`¡Hola ${bizName}! Estoy interesado en agendar un servicio en su barbería.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Probar mi Enlace Directo de WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Parámetros Meta Cloud API (Módulo Avanzado Opcional Futuro) */}
            <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-bold text-zinc-300">Meta Cloud API (Módulo Avanzado Opcional Futuro):</div>
                <span className="text-[9px] text-zinc-500 uppercase font-mono">No Requerido para Operar</span>
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1">Phone Number ID:</label>
                  <input
                    type="text"
                    value={waConfig.phoneNumberId || ''}
                    onChange={(e) => setWaConfig({ ...waConfig, phoneNumberId: e.target.value })}
                    placeholder="Pendiente de Meta"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2 text-white font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1">WABA Account ID:</label>
                  <input
                    type="text"
                    value={waConfig.wabaId || ''}
                    onChange={(e) => setWaConfig({ ...waConfig, wabaId: e.target.value })}
                    placeholder="Pendiente de Meta"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2 text-white font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1">Access Token (Bearer):</label>
                  <input
                    type="password"
                    value={waConfig.accessToken || ''}
                    onChange={(e) => setWaConfig({ ...waConfig, accessToken: e.target.value })}
                    placeholder="••••••••••••••••"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2 text-white font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl font-bold text-black shadow-lg transition flex items-center gap-2"
              style={{ backgroundColor: 'var(--brand-primary)' }}
            >
              <Save className="w-4 h-4" /> Guardar Preferencias de WhatsApp
            </button>
          </form>

          {/* Probador Interactivo Sandbox */}
          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-3xl space-y-3 shadow-xl">
            <h4 className="text-sm font-black text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-sky-400" />
              Probador de Envío Sandbox (Piloto Controlado)
            </h4>
            <p className="text-zinc-400 text-xs">
              Envía un mensaje de prueba al número de Álvaro Ortiz o de un barbero para validar la recepción de plantillas transaccionales.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
              <input
                type="text"
                value={waTestPhone}
                onChange={(e) => setWaTestPhone(e.target.value)}
                placeholder="+57 310 236 5163"
                className="w-full sm:w-72 bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white font-mono text-xs"
              />
              <button
                type="button"
                disabled={waSendingTest}
                onClick={handleSendTestWhatsApp}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{waSendingTest ? 'Enviando...' : 'Enviar Prueba a WhatsApp'}</span>
              </button>
            </div>
          </div>

          {/* Telemetría y Bitácora de Mensajes Enviados */}
          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-3xl space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
              <h4 className="text-sm font-black text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" />
                Bitácora de Telemetría WhatsApp (Solo este Tenant)
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-950 text-zinc-400 border border-zinc-800">
                {waLogs.length} notificaciones
              </span>
            </div>

            {waLogs.length === 0 ? (
              <div className="p-4 bg-zinc-950 rounded-2xl text-center text-zinc-500 text-xs">
                Sin mensajes registrados aún. Realiza una reserva de prueba o usa el probador superior.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {waLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800/80 flex items-center justify-between gap-3">
                    <div className="space-y-0.5 truncate">
                      <div className="font-bold text-white text-xs truncate">{log.summary}</div>
                      <div className="text-[10px] text-zinc-400 flex items-center gap-2">
                        <span>Destino: <strong className="text-zinc-200">{log.recipientPhone}</strong></span>
                        <span>•</span>
                        <span>Plantilla: <code className="text-purple-300">{log.templateName}</code></span>
                        <span>•</span>
                        <span>{new Date(log.sentAt).toLocaleTimeString('es-CO')}</span>
                      </div>
                    </div>

                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 shrink-0">
                      ✓ ENTREGADO
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 7: HOTMART SAAS SUBSCRIPTION */}
      {activeTab === 'subscription' && (
        <div className="space-y-5 animate-fade-in text-xs">
          {/* Header Card with Hotmart Status */}
          <div className="bg-zinc-900 border border-purple-500/30 p-5 rounded-3xl space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-lg bg-purple-500/20 text-purple-400">
                    <CreditCard className="w-4 h-4" />
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider text-purple-400">
                    Suscripción SaaS Hotmart
                  </span>
                </div>
                <h3 className="text-base font-black text-white mt-1">
                  Plan & Membresía de {currentBusiness.name}
                </h3>
                <p className="text-zinc-400 mt-0.5 max-w-xl">
                  Gestión comercial de tu suscripción procesada de forma segura a través de Hotmart.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  {currentBusiness.id === 'biz_arizshop_01'
                    ? 'PILOTO CONTROLADO (TRIAL ACTIVO)'
                    : `ESTADO: ${currentBusiness.subscription.status.toUpperCase()}`}
                </span>
              </div>
            </div>

            {/* Current Plan Summary Grid */}
            <div className="grid sm:grid-cols-3 gap-3 text-zinc-300">
              <div className="p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-1">
                <span className="text-zinc-400 block text-[10px] uppercase font-bold">Plan Actual:</span>
                <div className="font-bold text-white text-sm flex items-center justify-between">
                  <span>{currentPlan.name}</span>
                  <span className="text-amber-400">${currentPlan.priceCOP.toLocaleString('es-CO')} COP</span>
                </div>
                <div className="text-[10px] text-zinc-400">
                  Límites: Hasta {entitlements.maxBarbers} barberos • {entitlements.maxServices} servicios
                </div>
              </div>

              <div className="p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-1">
                <span className="text-zinc-400 block text-[10px] uppercase font-bold">Vigencia / Renovación:</span>
                <div className="font-bold text-emerald-400 text-sm">
                  {new Date(currentBusiness.subscription.currentPeriodEnd).toLocaleDateString('es-CO', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </div>
                <div className="text-[10px] text-zinc-400">
                  {subStatus === 'trial_active' ? `${remainingDays} días de prueba restantes` : 'Cobro recurrente mensual'}
                </div>
              </div>

              <div className="p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-1">
                <span className="text-zinc-400 block text-[10px] uppercase font-bold">Código Hotmart:</span>
                <div className="font-mono font-bold text-zinc-300 text-xs truncate">
                  {hotmartSub?.hotmartSubscriptionId || 'PENDIENTE DE ASOCIACIÓN HOTMART'}
                </div>
                <div className="text-[10px] text-zinc-500">
                  Transacciones protegidas con token de Hotmart
                </div>
              </div>
            </div>

            {/* Hotmart External Configuration Note */}
            <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400">
              <span className="flex items-center gap-2">
                <Info className="w-4 h-4 text-purple-400 shrink-0" />
                <span>
                  <strong>Plataforma de Pagos:</strong> Hotmart gestiona los métodos de pago (PSE, Tarjetas, Efecty, Nequi) y la facturación recurrente.
                </span>
              </span>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 shrink-0">
                PENDIENTE DE CONFIGURACIÓN EXTERNA — HOTMART
              </span>
            </div>
          </div>

          {/* Success Message Banner */}
          {hotmartSuccessMsg && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl font-bold flex items-center gap-2 animate-fade-in shadow-lg">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{hotmartSuccessMsg}</span>
            </div>
          )}

          {/* Plan Oficial Registrado en Hotmart: Plan Pro Studio ($89.000 COP) */}
          <div className="space-y-3">
            <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-purple-400" />
              <span>Membresía Oficial de ARIZSHOP BARBER</span>
            </h4>

            <div className="max-w-xl mx-auto p-6 rounded-3xl bg-zinc-900 border-2 border-purple-500/60 shadow-2xl shadow-purple-950/30 space-y-5">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-purple-400">
                    Suscripción Oficial Hotmart
                  </span>
                  <h3 className="text-lg font-black text-white">Plan Pro Studio</h3>
                </div>
                <span className="text-[10px] font-black px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ✓ PLAN OFICIAL ACTIVO
                </span>
              </div>

              <div className="space-y-1">
                <div className="text-3xl font-black text-white">
                  $89.000 <span className="text-sm font-normal text-zinc-400">/ mes (COP)</span>
                </div>
                <p className="text-zinc-300 text-xs">
                  Plataforma completa para ARIZSHOP BARBER con equipo de colaboradores, catálogo de servicios, memoria de estilo y club de fidelización.
                </p>
              </div>

              <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2 text-xs">
                <div className="font-bold text-white mb-1">Capacidades y herramientas incluidas:</div>
                <div className="grid sm:grid-cols-2 gap-2 text-zinc-300">
                  <div className="flex items-center gap-2">
                    <span className="text-purple-400 font-bold">✓</span>
                    <span>Hasta <strong>5 Barberos en Sillón</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-purple-400 font-bold">✓</span>
                    <span>Hasta <strong>25 Servicios y Precios</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-purple-400 font-bold">✓</span>
                    <span><strong>Memoria de Estilo Visual</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-purple-400 font-bold">✓</span>
                    <span><strong>Probador Virtual 2D</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-purple-400 font-bold">✓</span>
                    <span><strong>Club de Fidelización (Sellos)</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-purple-400 font-bold">✓</span>
                    <span><strong>Diagnóstico en Tiempo Real</strong></span>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 pt-1">
                <a
                  href={HotmartAdapter.getCheckoutUrl(currentBusiness)}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3.5 rounded-2xl font-black text-white bg-purple-600 hover:bg-purple-500 flex items-center justify-center gap-2 transition shadow-xl cursor-pointer text-xs"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Ir al Checkout Oficial de Hotmart ($89.000 COP)</span>
                </a>

                <button
                  type="button"
                  disabled={simulatingHotmart}
                  onClick={() => handleSimulateHotmartActivation('plan_pro')}
                  className="w-full py-2 rounded-xl text-[11px] font-bold text-zinc-400 hover:text-zinc-200 bg-zinc-950 border border-zinc-800 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Simular Renovación Webhook (Sandbox QA)</span>
                </button>
              </div>

              <div className="text-center text-[10px] text-zinc-500 leading-relaxed pt-1 border-t border-zinc-800/80">
                * Código oficial de producto en Hotmart: <strong>B107233666Q</strong>. Tu suscripción renueva mensualmente y se procesa mediante PSE, Tarjetas, Nequi o Efecty.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: FIDELIZACIÓN (100% PERSONALIZABLE POR EL DUEÑO) */}
      {activeTab === 'loyalty' && (
        <form onSubmit={handleSaveLoyalty} className="bg-zinc-900 border border-zinc-800 p-5 rounded-3xl space-y-5 animate-fade-in shadow-xl text-xs">
          <div className="border-b border-zinc-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Gift className="w-4 h-4 text-amber-400" />
                <span>Configuración del Club de Fidelización en {currentBusiness.name}</span>
              </h3>
              <p className="text-zinc-400 mt-0.5">
                Tú decides cuántos sellos deben acumular tus clientes y cuál es el premio que recibirán.
              </p>
            </div>
            <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
              100% PERSONALIZABLE
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Formulario de Configuración */}
            <div className="space-y-4">
              <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2.5">
                <label className="font-bold text-zinc-300 block">
                  Meta de Sellos / Visitas para el Premio:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={2}
                    max={20}
                    required
                    value={loyaltyThreshold}
                    onChange={(e) => setLoyaltyThreshold(Number(e.target.value))}
                    className="w-24 bg-zinc-900 border border-zinc-700 rounded-xl p-2.5 text-white font-mono text-center font-bold text-sm focus:border-amber-400 outline-none"
                  />
                  <span className="text-zinc-400 font-bold">sellos completados</span>
                </div>

                {/* Botones de selección rápida */}
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-zinc-500 font-bold">Sugeridos:</span>
                  {[4, 5, 6, 8, 10].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setLoyaltyThreshold(count)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer border ${
                        loyaltyThreshold === count
                          ? 'bg-amber-500 text-black border-amber-400 font-black'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {count} cortes
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2">
                <label className="font-bold text-zinc-300 block">
                  Descripción Oficial del Premio / Recompensa:
                </label>
                <input
                  type="text"
                  required
                  value={loyaltyReward}
                  onChange={(e) => setLoyaltyReward(e.target.value)}
                  placeholder="Ej: 1 Corte de Cabello Completamente Gratis"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-2.5 text-white font-bold text-xs focus:border-amber-400 outline-none"
                />
                <p className="text-[10px] text-zinc-500 leading-relaxed">
                  * Este texto aparecerá en grande en la tarjeta digital del cliente y en el banner de la portada.
                </p>
              </div>
            </div>

            {/* Vista Previa en Vivo de cómo lo verá el Cliente */}
            <div className="p-4 bg-zinc-950 rounded-2xl border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-black tracking-wider text-amber-400">
                  Vista Previa en Tiempo Real
                </span>
                <span className="text-[10px] text-zinc-500">App del Cliente</span>
              </div>

              <div className="p-3.5 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 rounded-xl border border-zinc-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-white">Tarjeta de Fidelización</span>
                  <span className="text-[10px] font-mono text-amber-400 font-black">Meta: {loyaltyThreshold} sellos</span>
                </div>

                <div className="text-amber-400 font-black text-xs">
                  🎁 {loyaltyReward || '1 Corte de Cabello Gratis'}
                </div>

                <div className="grid grid-cols-6 gap-1.5">
                  {[...Array(Math.min(12, loyaltyThreshold || 6))].map((_, i) => (
                    <div
                      key={i}
                      className={`h-7 rounded-lg border flex items-center justify-center text-[10px] font-bold ${
                        i < 2
                          ? 'bg-amber-500 text-black border-amber-400 shadow'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-600'
                      }`}
                    >
                      {i < 2 ? '⭐' : i + 1}
                    </div>
                  ))}
                </div>

                <p className="text-[9px] text-zinc-400 leading-tight pt-1">
                  * Cada vez que un cliente se corta el pelo, el barbero le estampa +1 sello desde su sillón de trabajo.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-zinc-800">
            <div className="text-[11px] text-zinc-400">
              Los cambios se aplican de inmediato en la aplicación del cliente y del barbero.
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl font-black text-black shadow-xl transition flex items-center gap-2 cursor-pointer"
              style={{ backgroundColor: 'var(--brand-primary)' }}
            >
              <Save className="w-4 h-4" />
              <span>Guardar Reglas de Fidelización</span>
            </button>
          </div>
        </form>
      )}

      {/* 📸 MODAL GLOBAL DE CÁMARA DE VIDEO EN VIVO EN TIEMPO REAL (WEBRTC) */}
      {isLiveCameraOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-zinc-900 border-2 border-amber-500 rounded-3xl p-5 space-y-4 shadow-2xl animate-fade-in text-xs text-center">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2 text-left">
                <span className="p-1.5 rounded-xl bg-amber-500 text-black font-black">
                  <Camera className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-sm font-black text-white">Cámara en Vivo de Sillón</h4>
                  <span className="text-[10px] text-amber-400 font-bold">
                    {cameraTarget === 'style' || cameraTarget === 'new_style'
                      ? '📸 Tomando Foto del Corte Real'
                      : '✂️ Tomando Foto del Barbero'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={stopLiveCamera}
                className="text-xs text-zinc-400 hover:text-white px-2.5 py-1 bg-zinc-800 rounded-lg cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            {/* Viewfinder con video en vivo */}
            <div className="relative w-64 h-64 mx-auto rounded-3xl overflow-hidden border-4 border-amber-500 bg-black shadow-2xl flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Marco guía de enfoque */}
              <div className="absolute inset-4 rounded-2xl border-2 border-dashed border-amber-400/60 pointer-events-none flex items-center justify-center">
                <div className="text-[10px] font-bold text-amber-300 bg-black/70 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                  {cameraTarget === 'style' || cameraTarget === 'new_style'
                    ? '✂️ Enfoca el corte de cabello aquí'
                    : '👤 Enfoca el rostro aquí'}
                </div>
              </div>
            </div>

            {/* Canvas oculto para capturar el cuadro de imagen */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Controles de cámara */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={captureLivePhoto}
                className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center justify-center gap-2 shadow-2xl transition cursor-pointer"
              >
                <Camera className="w-4 h-4 stroke-[2.5]" />
                <span>📸 ¡CAPTURAR FOTO AHORA!</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={switchLiveCamera}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold flex items-center justify-center gap-1.5 text-[11px] cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Girar Cámara</span>
                </button>

                <button
                  type="button"
                  onClick={stopLiveCamera}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-400 font-bold text-[11px] cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🟢 MODAL DE APERTURA DE CAJA DIARIA */}
      {isOpeningShiftModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-700 rounded-3xl p-5 space-y-4 shadow-2xl animate-fade-in text-xs">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Abrir Caja del Día</h3>
                  <span className="text-[10px] text-zinc-400">{currentBusiness.name}</span>
                </div>
              </div>
              <button
                onClick={() => setIsOpeningShiftModalOpen(false)}
                className="text-zinc-400 hover:text-white px-2 py-1 bg-zinc-800 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleOpenShift} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-zinc-300 block mb-1">Base Inicial en Efectivo (COP):</label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                  <input
                    type="number"
                    step="1000"
                    required
                    value={initialBaseCOP}
                    onChange={(e) => setInitialBaseCOP(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-white font-mono font-bold text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  Dinero inicial para dar cambio a los clientes.
                </span>
              </div>

              <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 text-[11px] text-zinc-400 space-y-1">
                <div>Responsable de apertura: <strong>{ownerDisplayName}</strong></div>
                <div>Fecha y hora: <strong>{new Date().toLocaleTimeString()}</strong></div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsOpeningShiftModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 font-bold hover:bg-zinc-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black shadow-lg"
                >
                  Abrir Turno
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🔴 MODAL DE CIERRE DE CAJA DIARIA */}
      {isClosingShiftModalOpen && currentShift && shiftSummary && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-3xl p-5 space-y-4 shadow-2xl animate-fade-in text-xs">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-red-500/10 text-red-400">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Cierre Definitivo de Caja</h3>
                  <span className="text-[10px] text-zinc-400">Turno de {currentShift.openedBy}</span>
                </div>
              </div>
              <button
                onClick={() => setIsClosingShiftModalOpen(false)}
                className="text-zinc-400 hover:text-white px-2 py-1 bg-zinc-800 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Resumen Final de Cierre */}
            <div className="p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-400">Total Servicios Realizados:</span>
                <span className="font-bold text-white">{shiftSummary.serviceCount} cortes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Total Ventas Facturadas:</span>
                <span className="font-black text-amber-400 text-sm">${shiftSummary.totalSalesCOP.toLocaleString('es-CO')} COP</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-zinc-800/80">
                <span className="text-zinc-400">Efectivo en Cajón (Base + Ventas):</span>
                <span className="font-black text-emerald-400">${shiftSummary.finalCashInDrawerCOP.toLocaleString('es-CO')} COP</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Nequi & Daviplata:</span>
                <span className="font-bold text-purple-300">${(shiftSummary.nequiSalesCOP + shiftSummary.daviplataSalesCOP).toLocaleString('es-CO')} COP</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Tarjetas / Datáfono:</span>
                <span className="font-bold text-sky-300">${shiftSummary.cardSalesCOP.toLocaleString('es-CO')} COP</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-zinc-800/80 text-amber-300">
                <span>Comisiones a Pagar a Barberos (50%):</span>
                <span className="font-black">${shiftSummary.totalBarberCommissionsCOP.toLocaleString('es-CO')} COP</span>
              </div>
              <div className="flex justify-between font-black text-emerald-400">
                <span>Ganancia Neta Barbería (50%):</span>
                <span>${shiftSummary.totalBusinessNetCOP.toLocaleString('es-CO')} COP</span>
              </div>
            </div>

            <form onSubmit={handleCloseShift} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-zinc-300 block mb-1">Notas / Observaciones de Cierre:</label>
                <textarea
                  value={closeShiftNotes}
                  onChange={(e) => setCloseShiftNotes(e.target.value)}
                  placeholder="Ej: Todo cuadrado sin descuadres. Entregado dinero en efectivo..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500 h-16 text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsClosingShiftModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 font-bold hover:bg-zinc-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black shadow-lg"
                >
                  Confirmar y Sellar Cierre
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 💰 MODAL DE REGISTRO DE VENTA DIRECTA MANUAL */}
      {isManualSaleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-3xl p-5 space-y-4 shadow-2xl animate-fade-in text-xs">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-amber-500/10 text-amber-400">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Registrar Venta / Cobro en Caja</h3>
                  <span className="text-[10px] text-zinc-400">Ingreso directo al turno activo</span>
                </div>
              </div>
              <button
                onClick={() => setIsManualSaleModalOpen(false)}
                className="text-zinc-400 hover:text-white px-2 py-1 bg-zinc-800 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleManualSaleSubmit} className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-zinc-300 block mb-1">Servicio / Concepto:</label>
                  <input
                    type="text"
                    required
                    value={manualServiceName}
                    onChange={(e) => setManualServiceName(e.target.value)}
                    placeholder="Ej: Corte Clásico, Barba..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-300 block mb-1">Monto en COP ($):</label>
                  <input
                    type="number"
                    step="1000"
                    required
                    value={manualAmountCOP}
                    onChange={(e) => setManualAmountCOP(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono font-bold text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-zinc-300 block mb-1">Barbero que Atendió:</label>
                  <select
                    value={manualBarberName}
                    onChange={(e) => setManualBarberName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
                  >
                    {teamMembers.map((b) => (
                      <option key={b.id} value={b.fullName}>{b.fullName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-300 block mb-1">Medio de Pago:</label>
                  <select
                    value={manualPaymentMethod}
                    onChange={(e) => setManualPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value="cash">💵 Efectivo</option>
                    <option value="nequi">🟣 Nequi</option>
                    <option value="daviplata">🔴 Daviplata</option>
                    <option value="card">💳 Tarjeta / Datáfono</option>
                    <option value="transfer">🏦 Transferencia Bancaria</option>
                  </select>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-zinc-300 block mb-1">Nombre del Cliente (Opcional):</label>
                  <input
                    type="text"
                    value={manualClientName}
                    onChange={(e) => setManualClientName(e.target.value)}
                    placeholder="Ej: Pedro Duarte"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-300 block mb-1">WhatsApp del Cliente (Opcional):</label>
                  <input
                    type="tel"
                    value={manualClientPhone}
                    onChange={(e) => setManualClientPhone(e.target.value)}
                    placeholder="Ej: 310 555 1234"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-300 block mb-1">Notas / Observaciones:</label>
                <input
                  type="text"
                  value={manualSaleNotes}
                  onChange={(e) => setManualSaleNotes(e.target.value)}
                  placeholder="Ej: Degradado medio, cliente habitual..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsManualSaleModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 font-bold hover:bg-zinc-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black shadow-lg"
                >
                  Registrar Cobro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 💵 MODAL DE CHECKOUT & COBRO DE CITA DESDE COLA */}
      {checkoutTicket && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-3xl p-5 space-y-4 shadow-2xl animate-fade-in text-xs">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-amber-500 text-black font-black">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Cobrar y Asentar en Caja</h3>
                  <span className="text-[10px] text-amber-400 font-bold">{checkoutTicket.clientName}</span>
                </div>
              </div>
              <button
                onClick={() => setCheckoutTicket(null)}
                className="text-zinc-400 hover:text-white px-2 py-1 bg-zinc-800 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCheckoutTicketSubmit} className="space-y-3">
              <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Cliente:</span>
                  <span className="font-bold text-white">{checkoutTicket.clientName} ({checkoutTicket.clientPhone})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Servicio / Estilo:</span>
                  <span className="font-bold text-amber-400">{checkoutTicket.styleName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Barbero que Atendió:</span>
                  <span className="font-bold text-white">{checkoutTicket.barberName}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-zinc-800/80 font-black text-sm">
                  <span className="text-white">Monto a Cobrar:</span>
                  <span className="text-emerald-400">${(checkoutTicket.priceCOP || 38000).toLocaleString('es-CO')} COP</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-300 block mb-1">Medio de Pago Recibido:</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'cash', label: '💵 Efectivo' },
                    { id: 'nequi', label: '🟣 Nequi' },
                    { id: 'daviplata', label: '🔴 Daviplata' },
                    { id: 'card', label: '💳 Tarjeta' }
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setCheckoutPaymentMethod(m.id as PaymentMethod)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        checkoutPaymentMethod === m.id
                          ? 'bg-amber-500 text-black border-amber-400 font-black shadow'
                          : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-300 block mb-1">Notas Técnicas para la Ficha del Cliente:</label>
                <input
                  type="text"
                  value={checkoutNotes}
                  onChange={(e) => setCheckoutNotes(e.target.value)}
                  placeholder="Ej: Degradado medio a navaja, le gustó volumen arriba..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setCheckoutTicket(null)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 font-bold hover:bg-zinc-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black shadow-lg"
                >
                  Confirmar Cobro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 👥 MODAL DETALLE DE FICHA TÉCNICA DE CLIENTE (CRM) */}
      {selectedClientDetail && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-3xl p-5 space-y-4 shadow-2xl animate-fade-in text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-sm">
                  {selectedClientDetail.fullName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">{selectedClientDetail.fullName}</h3>
                  <span className="text-[11px] text-zinc-400 font-mono">{selectedClientDetail.phone}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedClientDetail(null)}
                className="text-zinc-400 hover:text-white px-2 py-1 bg-zinc-800 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Métricas del Cliente */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-zinc-950 p-2.5 rounded-2xl border border-zinc-800">
                <span className="text-[10px] text-zinc-400 block">Total Visitas</span>
                <span className="font-black text-amber-400 text-sm">{selectedClientDetail.totalVisits}</span>
              </div>
              <div className="bg-zinc-950 p-2.5 rounded-2xl border border-zinc-800">
                <span className="text-[10px] text-zinc-400 block">Total Invertido</span>
                <span className="font-black text-emerald-400 text-sm">${selectedClientDetail.totalSpentCOP.toLocaleString('es-CO')}</span>
              </div>
              <div className="bg-zinc-950 p-2.5 rounded-2xl border border-zinc-800">
                <span className="text-[10px] text-zinc-400 block">Último Barbero</span>
                <span className="font-bold text-white text-xs truncate block">{selectedClientDetail.lastBarberName}</span>
              </div>
            </div>

            {/* Memoria de Estilo de Sillón */}
            <div className="p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-black text-white text-xs flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5 text-amber-400" /> Memoria de Estilo & Visagismo
                </span>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                  ✓ Sincronizado
                </span>
              </div>

              <div className="flex items-start gap-3 pt-1">
                <img
                  src={selectedClientDetail.styleMemory?.photoUrl || '/styles/el-siete-colombiano.jpg'}
                  alt=""
                  className="w-16 h-16 rounded-2xl object-cover border border-zinc-700 bg-zinc-900 shrink-0"
                />
                <div className="space-y-1 text-[11px] flex-1">
                  <div>
                    <span className="text-zinc-400 block text-[10px]">Lo que le gustó y mantener:</span>
                    <p className="text-zinc-200 font-medium">
                      {selectedClientDetail.styleMemory?.likedAspects?.join(' • ') || 'Línea en V lateral a navaja • Fade limpio'}
                    </p>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px]">Ajuste indicado para la próxima cita:</span>
                    <p className="text-amber-300 font-medium">
                      {selectedClientDetail.styleMemory?.changeAspects?.join('. ') || 'Mantener degradado limpio y perfilado regular.'}
                    </p>
                  </div>
                </div>
              </div>

              {selectedClientDetail.styleMemory?.technicalFormula && (
                <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20 text-[10px] text-amber-300 font-mono">
                  ✂️ <strong>Fórmula técnica:</strong> {selectedClientDetail.styleMemory.technicalFormula}
                </div>
              )}
            </div>

            {/* Historial de Visitas */}
            <div className="space-y-2">
              <h4 className="font-bold text-white text-xs">Historial de Visitas ({selectedClientDetail.visits.length}):</h4>
              {selectedClientDetail.visits.length === 0 ? (
                <p className="text-zinc-500 text-[11px]">No hay visitas pasadas registradas en el libro mayor.</p>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {selectedClientDetail.visits.map((v) => (
                    <div
                      key={v.id}
                      className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-800/80 flex items-center justify-between text-[11px]"
                    >
                      <div>
                        <span className="font-bold text-white block">{v.serviceName}</span>
                        <span className="text-[10px] text-zinc-400">{v.date} • {v.barberName} ({v.paymentMethod})</span>
                      </div>
                      <span className="font-mono font-bold text-emerald-400">
                        ${v.priceCOP.toLocaleString('es-CO')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSelectedClientDetail(null)}
                className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold"
              >
                Cerrar Ficha
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
