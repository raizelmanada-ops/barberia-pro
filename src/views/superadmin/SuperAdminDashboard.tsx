import React, { useState } from 'react';
import { useTenant } from '../../core/tenant/TenantContext';
import { useAuth } from '../../core/auth/AuthContext';
import { Business, SubscriptionPlan } from '../../core/types';
import { BusinessService } from '../../core/services/businessService';
import { SubscriptionService } from '../../core/services/subscriptionService';
import { PlanService } from '../../core/services/planService';
import { SecurityIsolationVerifier, SecurityTestResult } from '../../core/services/securityTest';
import { WhatsAppSecurityVerifier } from '../../core/services/whatsappSecurityTest';
import { HotmartSecurityVerifier } from '../../core/services/hotmartSecurityTest';
import { HardeningSecurityVerifier } from '../../core/services/hardeningSecurityTest';
import { HotmartAdapter } from '../../core/hotmart/hotmartAdapter';
import { MultiDeviceSimulator } from '../../components/MultiDeviceSimulator';
import {
  ShieldCheck,
  Plus,
  CheckCircle2,
  Clock,
  Ban,
  Store,
  Sparkles,
  MapPin,
  Edit,
  RotateCcw,
  Sliders,
  DollarSign,
  Lock,
  Layers,
  ShieldAlert,
  Smartphone,
  Zap,
  CreditCard
} from 'lucide-react';

export const SuperAdminDashboard: React.FC = () => {
  const { availableBusinesses, setCurrentBusinessBySlug, refreshBusinesses } = useTenant();
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'tenants' | 'multidevice' | 'plans' | 'security' | 'system'>('tenants');
  const [plans, setPlans] = useState<SubscriptionPlan[]>(() => PlanService.getPlans());
  const [securityTestResults, setSecurityTestResults] = useState<SecurityTestResult[]>(() => [
    ...SecurityIsolationVerifier.runAllIsolationTests(),
    ...WhatsAppSecurityVerifier.runAllWhatsAppIsolationTests(),
    ...HotmartSecurityVerifier.runAllHotmartSecurityTests(),
    ...HardeningSecurityVerifier.runAllHardeningTests(),
  ]);
  const [webhookSimStatus, setWebhookSimStatus] = useState<string | null>(null);

  // Modal Create
  const [showNewModal, setShowNewModal] = useState(false);
  const [newBizName, setNewBizName] = useState('');
  const [newBizSlug, setNewBizSlug] = useState('');
  const [newBizSlogan, setNewBizSlogan] = useState('Elegancia, precisión y estilo.');
  const [newBizOwner, setNewBizOwner] = useState('');
  const [newBizPhone, setNewBizPhone] = useState('+57 310 000 0000');
  const [newBizAddress, setNewBizAddress] = useState('Bogotá, Colombia');
  const [newBizNeighborhood, setNewBizNeighborhood] = useState('Chapinero');
  const [newBizPrimaryColor, setNewBizPrimaryColor] = useState('#eab308');
  const [newBizPlan, setNewBizPlan] = useState('plan_pro');

  // Modal Edit
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);

  // Security Check: Role must be SuperAdmin
  if (currentUser.role !== 'superadmin') {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4 animate-fade-in">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20">
          <Lock className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-400">
            Seguridad y Frontera de Acceso (403 Forbidden)
          </span>
          <h3 className="text-lg font-black text-white">Acceso Restringido al Proveedor SaaS</h3>
          <p className="text-xs text-zinc-400">
            Tu usuario actual ({currentUser.fullName}) tiene el rol <strong>{currentUser.role}</strong>.
            Solo el <strong>SuperAdmin</strong> autorizado puede administrar tenants y suscripciones globales.
          </p>
        </div>
        <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-400 text-left space-y-1">
          <div className="font-bold text-zinc-200">Aislamiento Multi-Tenant:</div>
          <div>Los roles Client, Barber y Owner no tienen permisos de lectura ni escritura sobre la configuración de otros negocios.</div>
        </div>
      </div>
    );
  }

  // --- Handlers ---
  const handleCreateBusiness = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBizName) return;

    const created = BusinessService.createBusiness({
      name: newBizName,
      slug: newBizSlug || undefined,
      slogan: newBizSlogan,
      ownerName: newBizOwner,
      phone: newBizPhone,
      whatsapp: newBizPhone,
      address: newBizAddress,
      neighborhood: newBizNeighborhood,
      planId: newBizPlan,
      theme: {
        primary: newBizPrimaryColor,
        primaryHover: newBizPrimaryColor,
      }
    });

    refreshBusinesses();
    setShowNewModal(false);
    setNewBizName('');
    setNewBizSlug('');
    setNewBizOwner('');
    setCurrentBusinessBySlug(created.slug);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBusiness) return;

    BusinessService.updateBusiness(editingBusiness);
    refreshBusinesses();
    setEditingBusiness(null);
  };

  const handleToggleSuspend = (biz: Business) => {
    const nextStatus = biz.subscription.status === 'suspended' ? 'active' : 'suspended';
    BusinessService.setSubscriptionStatus(biz.id, nextStatus);
    refreshBusinesses();
  };

  const handleExtendTrial = (bizId: string) => {
    BusinessService.extendTrial(bizId, 7);
    refreshBusinesses();
  };

  const handleSimulateTrialExpired = (bizId: string) => {
    BusinessService.setSubscriptionStatus(bizId, 'trial_expired');
    refreshBusinesses();
  };

  const handleChangePlan = (bizId: string, planId: string) => {
    BusinessService.changePlan(bizId, planId);
    refreshBusinesses();
  };

  const handleUpdatePlanPrice = (planId: string, newPrice: number) => {
    const found = plans.find(p => p.id === planId);
    if (found) {
      const updated = { ...found, priceCOP: newPrice };
      PlanService.updatePlan(updated);
      setPlans(PlanService.getPlans());
    }
  };

  const handleResetFactory = () => {
    if (window.confirm('¿Deseas restablecer los datos de tenants a la configuración inicial con ARIZSHOP BARBER como piloto?')) {
      BusinessService.resetToSeed();
      refreshBusinesses();
    }
  };

  // Metrics
  const activeCount = availableBusinesses.filter(b => b.subscription.status === 'active').length;
  const trialCount = availableBusinesses.filter(b => b.subscription.status === 'trial_active').length;
  const suspendedCount = availableBusinesses.filter(b => b.subscription.status === 'suspended' || b.subscription.status === 'trial_expired').length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-5 space-y-6 pb-28 animate-fade-in">
      {/* SuperAdmin Banner */}
      <div className="bg-zinc-900 border border-purple-500/30 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-purple-500/20 text-purple-400">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
              Panel SuperAdmin (Centro de Control SaaS)
            </span>
          </div>
          <h2 className="text-xl font-black text-white mt-1">Gestión Centralizada de Tenants & Suscripciones</h2>
          <p className="text-xs text-zinc-400">
            Administración de barberías, planes de prueba de 7 días, persistencia desacoplada y control de acceso.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewModal(true)}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg transition"
          >
            <Plus className="w-4 h-4" />
            + Alta de Barbería
          </button>
        </div>
      </div>

      {/* Nav Tabs */}
      <div className="flex flex-wrap bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800 text-xs font-bold gap-1">
        <button
          onClick={() => setActiveTab('tenants')}
          className={`flex-1 py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition ${
            activeTab === 'tenants' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Store className="w-3.5 h-3.5" />
          <span>Tenants ({availableBusinesses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('multidevice')}
          className={`flex-1 py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition ${
            activeTab === 'multidevice' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Monitor Multidispositivo (Cloud)</span>
        </button>

        <button
          onClick={() => setActiveTab('plans')}
          className={`flex-1 py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition ${
            activeTab === 'plans' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Planes SaaS ({plans.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex-1 py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition ${
            activeTab === 'security' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Test RLS ({securityTestResults.filter(r => r.passed).length}/4 PASS)</span>
        </button>

        <button
          onClick={() => setActiveTab('system')}
          className={`flex-1 py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition ${
            activeTab === 'system' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Sistema</span>
        </button>
      </div>

      {/* TAB 1: TENANTS MANAGEMENT */}
      {activeTab === 'tenants' && (
        <div className="space-y-5 animate-fade-in">
          {/* SaaS Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-xl space-y-1">
              <div className="text-zinc-400">Total Tenants</div>
              <div className="text-2xl font-black text-white">{availableBusinesses.length}</div>
              <div className="text-[10px] text-purple-400 font-semibold">1 Piloto Real + 2 Dev</div>
            </div>

            <div className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-xl space-y-1">
              <div className="text-zinc-400">Pruebas Activas (7d)</div>
              <div className="text-2xl font-black text-amber-400">{trialCount}</div>
              <div className="text-[10px] text-amber-400 font-semibold">En período de prueba</div>
            </div>

            <div className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-xl space-y-1">
              <div className="text-zinc-400">Planes Activos</div>
              <div className="text-2xl font-black text-emerald-400">{activeCount}</div>
              <div className="text-[10px] text-emerald-400 font-semibold">Suscripción comercial</div>
            </div>

            <div className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-xl space-y-1">
              <div className="text-zinc-400">Suspendidos / Vencidos</div>
              <div className="text-2xl font-black text-red-400">{suspendedCount}</div>
              <div className="text-[10px] text-zinc-400">Acceso cliente pausado</div>
            </div>
          </div>

          {/* Tenants List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <h3 className="font-bold uppercase tracking-wider text-zinc-400">
                Lista de Negocios Registrados ({availableBusinesses.length})
              </h3>
              <span className="text-zinc-500">Persistencia local activa</span>
            </div>

            <div className="space-y-3">
              {availableBusinesses.map((b) => {
                const subStatus = SubscriptionService.getComputedStatus(b);
                const remainingDays = SubscriptionService.getRemainingTrialDays(b);
                const currentPlan = PlanService.getPlanById(b.subscription.planId);
                const isPilot = b.id === 'biz_arizshop_01';

                return (
                  <div
                    key={b.id}
                    className={`p-4 rounded-2xl border transition ${
                      isPilot
                        ? 'bg-zinc-900/90 border-amber-500/40 shadow-lg'
                        : 'bg-zinc-900 border-zinc-800'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs border-b border-zinc-800/80 pb-3">
                      {/* Logo & Info */}
                      <div className="flex items-center gap-3">
                        <img
                          src={b.logoUrl}
                          alt=""
                          className="w-11 h-11 rounded-full object-cover border-2 shadow bg-zinc-950"
                          style={{ borderColor: b.theme.primary }}
                        />
                        <div>
                          <div className="font-black text-white text-sm flex items-center gap-2">
                            <span>{b.name}</span>
                            {isPilot && (
                              <span className="text-[9px] px-2 py-0.5 rounded-full font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                ⭐ PILOTO OFICIAL
                              </span>
                            )}
                            <span className="text-[10px] px-2 py-0.2 rounded font-mono bg-zinc-800 text-zinc-400">
                              /b/{b.slug}
                            </span>
                          </div>
                          <div className="text-zinc-400 flex items-center gap-1.5 mt-0.5">
                            <MapPin className="w-3 h-3 text-zinc-500" /> {b.address}
                            {b.ownerName && (
                              <span className="text-zinc-500">• Propietario: {b.ownerName}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status Badges */}
                      <div className="flex items-center gap-2">
                        {subStatus === 'trial_active' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 font-bold text-[11px] border border-amber-500/30">
                            <Clock className="w-3 h-3" /> Prueba ({remainingDays}d restantes)
                          </span>
                        )}
                        {subStatus === 'trial_expired' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 font-bold text-[11px] border border-red-500/30">
                            <Clock className="w-3 h-3" /> Trial Vencido
                          </span>
                        )}
                        {subStatus === 'active' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold text-[11px] border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" /> Plan Activo
                          </span>
                        )}
                        {subStatus === 'suspended' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/20 text-red-400 font-bold text-[11px] border border-red-500/40">
                            <Ban className="w-3 h-3" /> Suspendido
                          </span>
                        )}

                        <span className="px-2 py-1 rounded-lg bg-zinc-800 text-zinc-300 font-semibold text-[11px]">
                          {currentPlan?.name || 'Plan Pro'}
                        </span>
                      </div>
                    </div>

                    {/* Controls Row */}
                    <div className="pt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                      {/* Subscription & Lifecycle Tools */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          onClick={() => handleExtendTrial(b.id)}
                          className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium transition"
                          title="Extiende 7 días más de prueba a este tenant"
                        >
                          +7 Días Trial
                        </button>

                        <button
                          onClick={() => handleSimulateTrialExpired(b.id)}
                          className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-amber-500/20 text-amber-300 font-medium transition"
                          title="Simula el vencimiento de la prueba para verificar bloqueo del cliente"
                        >
                          Simular Vencimiento
                        </button>

                        {/* Plan Selector */}
                        <select
                          value={b.subscription.planId}
                          onChange={(e) => handleChangePlan(b.id, e.target.value)}
                          className="bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-zinc-300 text-xs focus:outline-none"
                        >
                          {plans.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} (${p.priceCOP.toLocaleString('es-CO')})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* View, Edit, Suspend */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setEditingBusiness(b)}
                          className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold flex items-center gap-1 transition"
                        >
                          <Edit className="w-3 h-3" /> Editar
                        </button>

                        <button
                          onClick={() => setCurrentBusinessBySlug(b.slug)}
                          className="px-3 py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 font-bold transition"
                        >
                          Cargar Espacio
                        </button>

                        <button
                          onClick={() => handleToggleSuspend(b)}
                          className={`px-3 py-1 rounded-lg font-bold transition ${
                            subStatus === 'suspended'
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                              : 'bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-300'
                          }`}
                        >
                          {subStatus === 'suspended' ? 'Reactivar' : 'Suspender'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MULTI-DEVICE CLOUD MONITOR */}
      {activeTab === 'multidevice' && (
        <div className="space-y-4 animate-fade-in">
          <MultiDeviceSimulator />
        </div>
      )}

      {/* TAB 3: SAAS PLANS & HOTMART SUBSCRIPTIONS */}
      {activeTab === 'plans' && (
        <div className="space-y-5 text-xs animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900 border border-purple-500/30 p-4.5 rounded-2xl">
            <div>
              <div className="flex items-center gap-1.5 text-purple-400 font-bold text-[11px]">
                <CreditCard className="w-4 h-4" />
                <span>Gestión Comercial SaaS & Planes Hotmart</span>
              </div>
              <h3 className="text-sm font-black text-white mt-0.5">
                Planes Comerciales de BARBERIA_PRO (en Pesos Colombianos)
              </h3>
              <p className="text-zinc-400 mt-0.5">
                Precios y límites configurables. Las compras y renovaciones se procesan a través de Hotmart.
              </p>
            </div>

            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 shrink-0">
              PENDIENTE DE CONFIGURACIÓN EXTERNA — HOTMART
            </span>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {plans.map((p) => (
              <div
                key={p.id}
                className={`p-4 rounded-2xl bg-zinc-900 border space-y-3 ${
                  p.isPopular ? 'border-purple-500/50 shadow-xl' : 'border-zinc-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-white text-sm">{p.name}</span>
                  {p.isPopular && (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                      MÁS POPULAR
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-400">{p.tagline}</p>

                {/* Price Config */}
                <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                    Precio Mensual ($ COP):
                  </label>
                  <input
                    type="number"
                    value={p.priceCOP}
                    onChange={(e) => handleUpdatePlanPrice(p.id, Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-white font-bold"
                  />
                  <div className="text-[10px] text-zinc-500">
                    ${p.priceCOP.toLocaleString('es-CO')} COP / mes
                  </div>
                </div>

                {/* Limits */}
                <div className="text-[11px] space-y-1 text-zinc-300">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Límite de barberos:</span>
                    <span className="font-bold text-white">{p.maxBarbers === 999 ? 'Ilimitados' : p.maxBarbers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Límite de servicios:</span>
                    <span className="font-bold text-white">{p.maxServices}</span>
                  </div>
                </div>

                {/* Feature List */}
                <div className="pt-2 border-t border-zinc-800 space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    Funcionalidades:
                  </div>
                  {p.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[11px] text-zinc-300">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Hotmart Webhook & Event Simulator for SuperAdmin */}
          <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
              <h4 className="text-sm font-black text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Simulador de Webhooks de Hotmart (Sandbox QA & Idempotencia)
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-950 text-zinc-400 border border-zinc-800">
                Webhook Spec v2.0.0
              </span>
            </div>

            <p className="text-zinc-400 text-xs">
              Simula eventos enviados por Hotmart para validar la activación o suspensión automática del tenant sin recargar la página.
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={async () => {
                  const res = await HotmartAdapter.simulateHotmartEvent('biz_arizshop_01', 'SUBSCRIPTION_ACTIVATION', 'plan_pro');
                  setWebhookSimStatus(res.message);
                  refreshBusinesses();
                }}
                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center gap-1.5"
              >
                <span>Simular: SUBSCRIPTION_ACTIVATION (Arizshop ➔ Active)</span>
              </button>

              <button
                onClick={async () => {
                  const res = await HotmartAdapter.simulateHotmartEvent('biz_arizshop_01', 'SUBSCRIPTION_RENEWAL', 'plan_pro');
                  setWebhookSimStatus(res.message);
                  refreshBusinesses();
                }}
                className="px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold transition flex items-center gap-1.5"
              >
                <span>Simular: SUBSCRIPTION_RENEWAL (+30 días)</span>
              </button>

              <button
                onClick={async () => {
                  const res = await HotmartAdapter.simulateHotmartEvent('biz_arizshop_01', 'SUBSCRIPTION_CANCELLATION', 'plan_pro');
                  setWebhookSimStatus(res.message);
                  refreshBusinesses();
                }}
                className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition flex items-center gap-1.5"
              >
                <span>Simular: SUBSCRIPTION_CANCELLATION</span>
              </button>

              <button
                onClick={async () => {
                  const res = await HotmartAdapter.simulateHotmartEvent('biz_arizshop_01', 'PURCHASE_REFUNDED', 'plan_pro');
                  setWebhookSimStatus(res.message);
                  refreshBusinesses();
                }}
                className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition flex items-center gap-1.5"
              >
                <span>Simular: PURCHASE_REFUNDED (Suspender)</span>
              </button>
            </div>

            {webhookSimStatus && (
              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-emerald-400 font-mono text-[11px] animate-fade-in">
                {webhookSimStatus}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SECURITY & MULTI-TENANT ISOLATION TESTS */}
      {activeTab === 'security' && (
        <div className="space-y-4 text-xs animate-fade-in">
          <div className="p-5 bg-zinc-900 border border-purple-500/30 rounded-3xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-purple-400" />
                  Batería de Pruebas de Ataque y Aislamiento Multi-Tenant
                </h3>
                <p className="text-zinc-400 mt-0.5">
                  Verificación automatizada de frontera de seguridad: ningún tenant puede consultar ni modificar datos de otro.
                </p>
              </div>

              <button
                onClick={() => setSecurityTestResults(SecurityIsolationVerifier.runAllIsolationTests())}
                className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition flex items-center gap-1.5 shrink-0 shadow"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Re-ejecutar Pruebas
              </button>
            </div>

            <div className="space-y-2.5">
              {securityTestResults.map((test, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border ${
                    test.passed
                      ? 'bg-zinc-950 border-emerald-500/30'
                      : 'bg-red-500/10 border-red-500/40'
                  } space-y-2`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-white flex items-center gap-2 text-sm">
                      <span>{test.testName}</span>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-black text-[10px] uppercase ${
                        test.passed
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {test.passed ? '✓ PASSED (RECHAZO CORRECTO)' : '✗ FAILED'}
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-2 text-[11px] text-zinc-300">
                    <div>
                      <span className="text-zinc-500">Actor / Origen:</span>{' '}
                      <strong className="text-zinc-200">{test.actor}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500">Tenant Objetivo:</span>{' '}
                      <strong className="text-zinc-200">{test.targetTenant}</strong>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-zinc-500">Recurso Intentado:</span>{' '}
                      <code className="text-purple-300 font-mono text-[10px]">{test.resource}</code>
                    </div>
                  </div>

                  <p className="text-[11px] text-emerald-400 font-mono bg-emerald-500/5 p-2 rounded-xl border border-emerald-500/10">
                    {test.securityMessage}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SYSTEM & PERSISTENCE */}
      {activeTab === 'system' && (
        <div className="space-y-4 text-xs animate-fade-in">
          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-purple-400" /> Capa de Persistencia y Repositorios
            </h3>
            <p className="text-zinc-300">
              Actualmente los datos de tenants, temas y suscripciones se almacenan en el adaptador desacoplado{' '}
              <code className="px-1.5 py-0.5 bg-zinc-950 rounded text-purple-300">StorageAdapter</code> (localStorage en navegador).
              Cualquier cambio persiste entre recargas de página.
            </p>
            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-zinc-400 space-y-1">
              <div className="font-bold text-zinc-200">Preparación para Base de Datos de Producción:</div>
              <div>
                La arquitectura utiliza el patrón <code>BusinessService</code> y <code>SubscriptionService</code>, lo que
                permitirá conectar Supabase/PostgreSQL con Row Level Security (RLS) reemplazando únicamente el adaptador de datos.
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
              <div>
                <div className="font-bold text-white">Restablecer datos de fábrica</div>
                <div className="text-zinc-500 text-[11px]">Restaura la semilla inicial con ARIZSHOP BARBER como piloto.</div>
              </div>
              <button
                onClick={handleResetFactory}
                className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 font-bold transition flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Restablecer Semilla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ALTA NUEVO NEGOCIO */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-3xl p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-fade-in text-xs">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Store className="w-4 h-4 text-purple-400" /> Alta de Nueva Barbería / Tenant
              </h3>
              <button
                onClick={() => setShowNewModal(false)}
                className="text-zinc-400 hover:text-white px-2 py-1 bg-zinc-800 rounded-lg"
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={handleCreateBusiness} className="space-y-3.5">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-zinc-300 block mb-1">Nombre de la Barbería *</label>
                  <input
                    type="text"
                    required
                    value={newBizName}
                    onChange={(e) => {
                      setNewBizName(e.target.value);
                      if (!newBizSlug) {
                        setNewBizSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, ''));
                      }
                    }}
                    placeholder="Ej: Barbería Elite Bogotá"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-zinc-300 block mb-1">Slug URL (/b/slug) *</label>
                  <input
                    type="text"
                    required
                    value={newBizSlug}
                    onChange={(e) => setNewBizSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                    placeholder="ej: barberia-elite"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-zinc-300 block mb-1">Slogan del Negocio</label>
                <input
                  type="text"
                  value={newBizSlogan}
                  onChange={(e) => setNewBizSlogan(e.target.value)}
                  placeholder="Ej: Precisión, estilo y confort."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-zinc-300 block mb-1">Propietario / Contacto</label>
                  <input
                    type="text"
                    value={newBizOwner}
                    onChange={(e) => setNewBizOwner(e.target.value)}
                    placeholder="Ej: Álvaro Ortiz"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-zinc-300 block mb-1">Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    value={newBizPhone}
                    onChange={(e) => setNewBizPhone(e.target.value)}
                    placeholder="Ej: +57 310 000 0000"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-zinc-300 block mb-1">Dirección Física</label>
                  <input
                    type="text"
                    value={newBizAddress}
                    onChange={(e) => setNewBizAddress(e.target.value)}
                    placeholder="Ej: Calle 67 # 9-24"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-zinc-300 block mb-1">Barrio en Bogotá</label>
                  <input
                    type="text"
                    value={newBizNeighborhood}
                    onChange={(e) => setNewBizNeighborhood(e.target.value)}
                    placeholder="Ej: Chapinero, Usaquén, Cedritos..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-zinc-300 block mb-1">Color Primario de Marca</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newBizPrimaryColor}
                      onChange={(e) => setNewBizPrimaryColor(e.target.value)}
                      className="w-10 h-9 bg-zinc-950 rounded-lg cursor-pointer border border-zinc-800 p-1"
                    />
                    <input
                      type="text"
                      value={newBizPrimaryColor}
                      onChange={(e) => setNewBizPrimaryColor(e.target.value)}
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl p-2 text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-zinc-300 block mb-1">Plan Inicial</label>
                  <select
                    value={newBizPlan}
                    onChange={(e) => setNewBizPlan(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white focus:outline-none"
                  >
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (${p.priceCOP.toLocaleString('es-CO')})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-300 space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Activación Automática de Prueba (7 Días):
                </div>
                <p className="text-[11px] text-zinc-400">
                  Se generará automáticamente un período de prueba de 7 días, código QR de acceso y tema visual personalizado.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-xl transition"
              >
                Crear e Iniciar Período de Prueba
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR NEGOCIO */}
      {editingBusiness && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-3xl p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-fade-in text-xs">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Edit className="w-4 h-4 text-amber-400" /> Editar {editingBusiness.name}
              </h3>
              <button
                onClick={() => setEditingBusiness(null)}
                className="text-zinc-400 hover:text-white px-2 py-1 bg-zinc-800 rounded-lg"
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="font-bold text-zinc-300 block mb-1">Nombre Comercial</label>
                <input
                  type="text"
                  required
                  value={editingBusiness.name}
                  onChange={(e) => setEditingBusiness({ ...editingBusiness, name: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="font-bold text-zinc-300 block mb-1">Slogan</label>
                <input
                  type="text"
                  value={editingBusiness.slogan}
                  onChange={(e) => setEditingBusiness({ ...editingBusiness, slogan: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-zinc-300 block mb-1">Dirección</label>
                  <input
                    type="text"
                    value={editingBusiness.address}
                    onChange={(e) => setEditingBusiness({ ...editingBusiness, address: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-zinc-300 block mb-1">Barrio</label>
                  <input
                    type="text"
                    value={editingBusiness.neighborhood || ''}
                    onChange={(e) => setEditingBusiness({ ...editingBusiness, neighborhood: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-zinc-300 block mb-1">Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    value={editingBusiness.phone}
                    onChange={(e) => setEditingBusiness({ ...editingBusiness, phone: e.target.value, whatsapp: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-zinc-300 block mb-1">Color Primario Hex</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editingBusiness.theme.primary}
                      onChange={(e) => setEditingBusiness({
                        ...editingBusiness,
                        theme: {
                          ...editingBusiness.theme,
                          primary: e.target.value,
                          primaryHover: e.target.value,
                        }
                      })}
                      className="w-9 h-8 bg-zinc-950 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={editingBusiness.theme.primary}
                      onChange={(e) => setEditingBusiness({
                        ...editingBusiness,
                        theme: {
                          ...editingBusiness.theme,
                          primary: e.target.value,
                          primaryHover: e.target.value,
                        }
                      })}
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl p-2 text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-black shadow-xl transition"
              >
                Guardar Cambios del Tenant
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
