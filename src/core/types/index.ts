// ==========================================================================
// BARBERIA_PRO - Core Domain Types & Data Contracts
// Multi-Tenant Architecture & Modular Business Models
// ==========================================================================

export type UserRole = 'superadmin' | 'owner' | 'manager' | 'barber' | 'client';

export type Permission =
  | 'manage:business'
  | 'manage:team'
  | 'manage:services'
  | 'manage:subscription'
  | 'view:metrics'
  | 'view:chair_schedule'
  | 'manage:style_memory'
  | 'book:appointment'
  | 'give:feedback';

export interface TenantMembership {
  businessId: string;
  roles: UserRole[];
  permissions: Permission[];
  isPrimary?: boolean;
}

export type BusinessType = 'barbershop' | 'salon' | 'unisex' | 'studio' | 'spa';

export type SubscriptionStatus = 'trial_active' | 'trial_expired' | 'active' | 'past_due' | 'suspended' | 'cancelled' | 'expired';

// --------------------------------------------------------------------------
// 1. Branding & Dynamic Theme
// --------------------------------------------------------------------------
export interface ThemeConfig {
  primary: string;           // Hex or HSL (e.g. #eab308)
  primaryHover: string;      // Darker shade for buttons
  primaryLight: string;      // Low-opacity tint for active states / chips
  accent: string;           // Contrast color (e.g. #38bdf8 or #fbbf24)
  surface: string;          // Main background color (e.g. #09090b)
  surfaceCard: string;      // Card background (e.g. #18181b)
  border: string;           // Subtle border (e.g. #27272a)
  radius: string;           // e.g. '14px' or '8px'
  fontHeading: string;      // 'Outfit' | 'Inter' | 'Montserrat'
  fontBody: string;         // 'Plus Jakarta Sans' | 'Inter'
}

// --------------------------------------------------------------------------
// 2. Business / Tenant Model
// --------------------------------------------------------------------------
export interface BusinessSchedule {
  dayOfWeek: number;        // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  openTime: string;         // '09:00'
  closeTime: string;        // '20:00'
  isOpen: boolean;
}

export interface LoyaltyConfig {
  type: 'stamps' | 'points';
  stampsThreshold: number;   // e.g., 8 or 10 visits
  rewardDescription: string; // e.g., "1 Corte de cortesía"
  pointsPerPeso: number;     // e.g., 1 pt per $1,000 COP
  birthdayDiscountPercent: number; // e.g., 20%
}

export interface BusinessSubscription {
  status: SubscriptionStatus;
  planId: string;
  trialStartedAt: string;    // ISO Date
  trialEndsAt: string;       // ISO Date (trialStartedAt + 7 days)
  currentPeriodEnd: string;
  cancelAtPeriodEnd?: boolean;
}

export interface Business {
  id: string;
  slug: string;              // Unique URL identifier (e.g. 'arizshop-barber')
  name: string;
  slogan: string;
  logoUrl: string;
  bannerUrl?: string;
  businessType: BusinessType;
  enabledCategories: string[]; // ['Corte Clásico', 'Barba & Perfilado', 'Combos']
  address: string;
  city: string;              // 'Bogotá'
  neighborhood?: string;
  phone: string;
  whatsapp: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  facebookUrl?: string;
  googleMapsUrl?: string;
  googleReviewUrl?: string;
  ownerName?: string;

  ownerEmail?: string;
  ownerPhone?: string;
  theme: ThemeConfig;
  schedules: BusinessSchedule[];
  loyalty: LoyaltyConfig;
  subscription: BusinessSubscription;
  isVerified: boolean;
  createdAt: string;
}

// --------------------------------------------------------------------------
// 3. User, Sessions & Profiles
// --------------------------------------------------------------------------
export interface User {
  id: string;
  businessId: string;        // Primary tenant ID (or 'global' for superadmin)
  role: UserRole;            // Current active role
  roles?: UserRole[];        // All roles for this user in the tenant (e.g. ['owner', 'barber'])
  fullName: string;
  phone: string;             // WhatsApp number
  email?: string;
  avatarUrl?: string;
  memberships?: TenantMembership[];
  createdAt: string;
}

export interface UserSession {
  token: string;
  user: User;
  activeBusinessId: string;
  activeRole: UserRole;
  expiresAt: string;
  createdAt: string;
}

export interface BarberProfile extends User {
  role: 'barber';
  commissionPercentage?: number; // e.g. 50 (50% barbero / 50% barbería)
  specialties: string[];     // ['Fade clásico', 'Barba esculpida', 'Tijera']
  bio?: string;
  ratingAverage: number;     // e.g. 4.9
  happyClientsPct: number;   // e.g. 97
  totalCutsCompleted: number;
  isActive: boolean;
}

export interface ClientProfile extends User {
  role: 'client';
  birthday?: string;
  notes?: string;
  loyaltyStatus: {
    stampsCount: number;
    points: number;
    rewardsAvailable: number;
  };
}

// --------------------------------------------------------------------------
// 4. Catalog & Services
// --------------------------------------------------------------------------
export interface Service {
  id: string;
  businessId: string;
  name: string;
  description: string;
  category: string;          // 'Caballero', 'Barba', 'Combo', 'Spa'
  priceCOP: number;          // in Colombian Pesos (e.g. 35000)
  durationMinutes: number;   // e.g. 30, 45, 60
  imageUrl?: string;
  isPopular?: boolean;
  isActive: boolean;
}

// --------------------------------------------------------------------------
// 5. Visual Memory ("Tu barbería te conoce")
// --------------------------------------------------------------------------
export type ConsentStatus = 'granted' | 'not_granted' | 'revoked';

export interface PhotoConsentRecord {
  status: ConsentStatus;
  givenAt: string;           // ISO Date
  version: string;           // e.g. 'v1.0-co-habeas-data'
  source: 'client_app' | 'barber_chair';
}

export interface StyleMemory {
  id: string;
  businessId: string;
  clientId: string;
  barberId: string;
  appointmentId: string;
  photoUrl: string;          // Private compressed WebP photo
  photoAngle?: 'front' | 'side' | 'back';
  likedAspects: string[];    // e.g. ["Degradado medio", "Forma de la barba"]
  keepAspects: string[];     // e.g. ["Volumen superior"]
  changeAspects: string[];   // e.g. ["Dejar más largo atrás", "No subir los laterales"]
  technicalFormula: string;  // e.g. "Fade 1.5 a 3, tijera texturizada arriba, barba con navaja"
  customerRemarks?: string;  // e.g. "El cliente prefiere peinado hacia la derecha"
  consentPhotoGranted: boolean;
  consentRecord?: PhotoConsentRecord;
  createdAt: string;
}

// --------------------------------------------------------------------------
// 6. Probador Personal de Estilo Visual (Personal Style Try-On)
// --------------------------------------------------------------------------
export interface StyleAngleViews {
  front?: string;
  side?: string;
  back?: string;
}

export interface BeardStyleItem {
  id: string;
  nombre: string;
  tipo: string;
  duracion: string;
  mantenimiento: string;
  descripcion: string;
  imagen: string;
  activo: boolean;
}

export interface BarberWorkItem {
  id: string;
  businessId: string;
  barberId: string;
  barberName: string;
  fotoUrl: string;
  estiloUtilizado: string;
  fecha: string;
  notasOpcionales?: string;
  createdAt: string;
}

export interface LookbookItem {
  id: string;
  name: string;
  category: string;
  targetAudience?: 'adultos' | 'ninos' | 'todos' | string;
  imageUrl: string;
  tags?: string[];
  description: string;
}


export interface StyleCatalogItem {

  id: string;
  name: string;
  category: 'corte' | 'ninos' | 'disenos' | 'barba' | 'combo';
  targetAudience?: 'adultos' | 'ninos' | 'todos';
  description: string;
  tags: string[];            // ['Fade', 'Moderno', 'Clásico', 'Texturizado', 'Largo', 'Niños']
  previewOverlayUrl: string; // Reference visual style / 3D model asset
  difficultyLevel: 'simple' | 'medio' | 'avanzado';
  hairType?: 'liso' | 'ondulado' | 'afro' | 'todos';
  angles?: StyleAngleViews;
  faceShape?: string;
  technicalFormula?: string;
  duracion?: string;
  mantenimiento?: string;
  tipo?: string;
}


export interface StyleTryOnRecord {
  id: string;
  businessId: string;
  clientId: string;
  userPhotoUrl: string;      // Private photo of client
  selectedStyleId: string;
  styleName: string;
  styleCategory: string;
  visualResultUrl: string;   // Image showing the user with projected style
  isSharedWithBarber: boolean; // Explicit client consent to show during chair consultation
  isSavedInProfile: boolean;
  notesForBarber?: string;   // e.g. "Quiero este degradado pero con mi largo natural arriba"
  consentCameraAccepted: boolean;
  createdAt: string;
}

// --------------------------------------------------------------------------
// 7. Appointments & Booking Engine
// --------------------------------------------------------------------------
export type AppointmentStatus = 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
export type BookingMode = 'repeat_style' | 'try_on_reference' | 'new_service';

export interface Appointment {
  id: string;
  businessId: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  barberId: string;
  barberName: string;
  serviceId: string;
  serviceName: string;
  priceCOP: number;
  date: string;              // 'YYYY-MM-DD'
  startTime: string;         // '14:00'
  endTime: string;           // '14:45'
  status: AppointmentStatus;
  bookingMode: BookingMode;
  styleMemoryId?: string;    // If "Repetir mi estilo" was chosen
  styleTryOnId?: string;     // If booked from the Personal Style Try-On
  clientNotes?: string;
  createdAt: string;
}

// --------------------------------------------------------------------------
// 8. Multidimensional Experience & Feedback (Sensor de Calidad)
// --------------------------------------------------------------------------
export interface MultidimensionalFeedback {
  id: string;
  businessId: string;
  appointmentId: string;
  clientId: string;
  barberId: string;
  ratingCut: number;         // 1 to 5 (Calidad del corte / servicio)
  ratingAttention: number;   // 1 to 5 (Trato, bienvenida y cordialidad)
  ratingListening: number;   // 1 to 5 (¿El barbero entendió lo que querías?)
  ratingWaitTime: number;    // 1 to 5 (Puntualidad y tiempo de espera)
  ratingOverall: number;     // 1 to 5 (Experiencia general)
  likedMostComment?: string; // "¿Qué fue lo que más te gustó?"
  improveNextTimeComment?: string; // "¿Qué te gustaría diferente la próxima vez?"
  isPrivate: boolean;        // Always true by default for confidential improvement
  createdAt: string;
}

// --------------------------------------------------------------------------
// 9. SuperAdmin & Commercial B2B State
// --------------------------------------------------------------------------
export interface SubscriptionPlan {
  id: string;
  name: string;              // 'Plan Emprendedor', 'Plan Pro Studio', 'Plan Master Enterprise'
  tagline: string;
  priceCOP: number;          // in Colombian Pesos (e.g. 49000, 89000, 149000)
  billingPeriod: 'monthly' | 'annual';
  maxBarbers: number;        // e.g. 1, 5, 999
  maxServices: number;
  features: string[];
  isPopular?: boolean;
  isActive: boolean;
}

// --------------------------------------------------------------------------
// 10. WhatsApp Business Cloud API Integration
// --------------------------------------------------------------------------
export type WhatsAppEventType =
  | 'appointment_confirmation'
  | 'appointment_reminder'
  | 'appointment_cancellation'
  | 'barber_new_booking'
  | 'test_ping';

export type WhatsAppMessageStatus = 'queued' | 'sent' | 'delivered' | 'read' | 'failed';

export interface WhatsAppNotificationConfig {
  isEnabled: boolean;
  mode: 'sandbox' | 'production';
  phoneNumber: string;            // Official phone e.g. '+57 310 236 5163'
  phoneNumberId?: string;         // Meta Cloud API Phone Number ID
  wabaId?: string;                // WhatsApp Business Account ID
  accessToken?: string;           // System User Access Token (Bearer)
  webhookVerifyToken?: string;
  notifyOnBooking: boolean;
  notifyOnReminder: boolean;
  notifyOnCancellation: boolean;
  notifyBarberOnNewBooking: boolean;
}

export interface WhatsAppMessageLog {
  id: string;
  businessId: string;
  eventType: WhatsAppEventType;
  recipientPhone: string;
  recipientName: string;
  templateName: string;
  status: WhatsAppMessageStatus;
  sentAt: string;
  deliveredAt?: string;
  errorMessage?: string;
  mode: 'sandbox' | 'production';
  summary: string;
}

// --------------------------------------------------------------------------
// 11. Commercial SaaS & Hotmart Subscriptions Integration
// --------------------------------------------------------------------------
export type HotmartEventType =
  | 'PURCHASE_APPROVED'
  | 'SUBSCRIPTION_ACTIVATION'
  | 'SUBSCRIPTION_RENEWAL'
  | 'PURCHASE_REFUNDED'
  | 'SUBSCRIPTION_CANCELLATION'
  | 'PAYMENT_OVERDUE'
  | 'SUBSCRIPTION_EXPIRED';

export interface HotmartWebhookPayload {
  id: string;
  event: HotmartEventType;
  version: '2.0.0';
  creation_date: number;
  data: {
    product: {
      id: number;
      name: string;
      ucode: string;
    };
    subscription?: {
      subscriber_code: string;
      plan: {
        id: number;
        name: string;
      };
      status: 'ACTIVE' | 'INACTIVE' | 'DELAYED' | 'CANCELLED_BY_CUSTOMER' | 'CANCELLED_BY_SELLER' | 'EXPIRED';
      date_next_charge?: number;
    };
    buyer: {
      email: string;
      name: string;
      checkout_phone?: string;
    };
    purchase: {
      transaction: string;
      status: 'APPROVED' | 'COMPLETE' | 'REFUNDED' | 'CHARGEBACK' | 'BLOCKED' | 'EXPIRED';
      price: {
        value: number;
        currency_value: 'COP';
      };
      recurrency_number?: number;
      sck?: string; // Tracking parameter containing business_id
    };
  };
  hottok: string; // Hotmart verification token
}

export interface TenantHotmartSubscription {
  businessId: string;
  hotmartSubscriptionId: string; // Subscriber code from Hotmart
  planId: string;
  status: SubscriptionStatus;
  startedAt: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelledAt?: string;
  buyerEmail: string;
  buyerName: string;
  lastEventId: string;
  updatedAt: string;
}

// --------------------------------------------------------------------------
// 12. Cash Register, Daily Shift Closing & POS Transactions
// --------------------------------------------------------------------------
export type PaymentMethod = 'cash' | 'nequi' | 'daviplata' | 'card' | 'transfer' | 'other';

export interface CashTransaction {
  id: string;
  businessId: string;
  shiftId: string;           // ID of the open cash register session
  ticketId?: string;          // Connected to walk-in or appointment
  serviceId?: string;
  serviceName: string;
  barberId: string;
  barberName: string;
  clientName: string;
  clientPhone?: string;
  amountCOP: number;
  barberCommissionCOP: number; // e.g. 50%
  businessNetCOP: number;      // e.g. 50%
  paymentMethod: PaymentMethod;
  notes?: string;
  createdAt: string;
}

export type CashRegisterStatus = 'open' | 'closed';

export interface CashShiftSummary {
  totalSalesCOP: number;
  cashSalesCOP: number;
  nequiSalesCOP: number;
  daviplataSalesCOP: number;
  cardSalesCOP: number;
  transferSalesCOP: number;
  totalBarberCommissionsCOP: number;
  totalBusinessNetCOP: number;
  serviceCount: number;
  initialCashCOP: number;
  finalCashInDrawerCOP: number;
}

export interface ShiftAuditLog {
  action: string;
  timestamp: string;
  actor: string;
  reason?: string;
}

export interface CashRegisterShift {
  id: string;
  businessId: string;
  openedBy: string;          // e.g. "Álvaro Ortiz"
  openedAt: string;
  closedAt?: string;
  closedBy?: string;
  initialCashCOP: number;    // Base en caja al iniciar
  status: CashRegisterStatus;
  notes?: string;
  closedSummary?: CashShiftSummary;
  auditLogs?: ShiftAuditLog[];
}

// --------------------------------------------------------------------------
// 13. Client History & Technical Styling Profile (CRM)
// --------------------------------------------------------------------------
export interface ClientVisitRecord {
  id: string;
  businessId: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  date: string;
  serviceName: string;
  priceCOP: number;
  paymentMethod: PaymentMethod;
  barberName: string;
  styleName?: string;
  stylePhotoUrl?: string;
  likedAspects?: string[];
  adjustmentNextTime?: string;
  technicalNotes?: string;
  ticketId?: string;
  createdAt: string;
}

export interface FeatureEntitlements {
  maxBarbers: number;
  maxServices: number;
  hasVisualMemory: boolean;
  hasWhatsAppNotifications: boolean;
  hasStyleTryOn: boolean;
  hasQualitySensorAnalytics: boolean;
  hasCustomBranding: boolean;
}
