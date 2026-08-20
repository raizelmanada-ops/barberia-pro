import React, { useState, useEffect } from 'react';
import { useTenant } from '../core/tenant/TenantContext';
import { ServiceCatalogService } from '../core/services/serviceCatalogService';
import { TeamService } from '../core/services/teamService';
import { CloudRepository, CloudOperationLog } from '../core/repositories/cloudRepository';
import { Service, BarberProfile } from '../core/types';
import {
  Laptop,
  Tablet,
  Smartphone,
  CheckCircle2,
  RotateCcw,
  ShieldCheck,
  Zap,
  User,
  Scissors,
  Store,
  Layers,
  Camera
} from 'lucide-react';

export const MultiDeviceSimulator: React.FC = () => {
  const { currentBusiness } = useTenant();

  const [logs, setLogs] = useState<CloudOperationLog[]>(() => CloudRepository.getTelemetryLogs());
  const [services, setServices] = useState<Service[]>(() =>
    ServiceCatalogService.getServicesByBusiness(currentBusiness.id)
  );
  const [team, setTeam] = useState<BarberProfile[]>(() =>
    TeamService.getTeamByBusiness(currentBusiness.id)
  );

  // Test Step Tracker
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [servicePriceEdited, setServicePriceEdited] = useState<number>(38000);
  const [step1Completed, setStep1Completed] = useState(false);
  const [step2Completed, setStep2Completed] = useState(false);
  const [step3Completed, setStep3Completed] = useState(false);
  const [rlsResult, setRlsResult] = useState<{ isAllowed: boolean; message: string } | null>(null);

  useEffect(() => {
    const unsubscribe = CloudRepository.subscribeTelemetry((newLogs) => {
      setLogs([...newLogs]);
    });
    return () => unsubscribe();
  }, []);

  const refreshData = () => {
    setServices(ServiceCatalogService.getServicesByBusiness(currentBusiness.id));
    setTeam(TeamService.getTeamByBusiness(currentBusiness.id));
  };

  // STEP 1: Owner updates service on Desktop
  const handleOwnerUpdateService = () => {
    if (services.length > 0) {
      const target = { ...services[0], priceCOP: servicePriceEdited };
      ServiceCatalogService.updateService(target, `Owner (${currentBusiness.ownerName || 'Álvaro'})`);
      refreshData();
      setStep1Completed(true);
      setCurrentStep(2);
    }
  };

  // STEP 2: Barber on Tablet verifies updated service
  const handleBarberSync = () => {
    refreshData();
    CloudRepository.saveConsentRecord(
      { status: 'granted', version: 'v1.0-co-habeas-data', source: 'barber_chair', givenAt: new Date().toISOString() },
      currentBusiness.id,
      'client_arizshop_pedro',
      'Barbero en Sillón'
    );
    setStep2Completed(true);
    setCurrentStep(3);
  };

  // STEP 3: Client on Mobile books updated service
  const handleClientSync = () => {
    refreshData();
    setStep3Completed(true);
    setCurrentStep(4);
  };

  // STEP 4: PostgreSQL RLS Cross-Tenant Security Test
  const handleRunCloudRLSTest = async () => {
    const result = await CloudRepository.simulateCloudRLSQuery(
      currentBusiness.id,
      currentBusiness.id === 'biz_arizshop_01' ? 'biz_el_parche_01' : 'biz_arizshop_01',
      'services'
    );
    setRlsResult(result);
  };

  const handleResetSimulation = () => {
    ServiceCatalogService.resetToSeed();
    TeamService.resetToSeed();
    refreshData();
    setStep1Completed(false);
    setStep2Completed(false);
    setStep3Completed(false);
    setRlsResult(null);
    setCurrentStep(1);
  };

  const primaryColor = currentBusiness.theme.primary || '#eab308';

  return (
    <div className="space-y-6 text-xs animate-fade-in">
      {/* Header & Controls */}
      <div className="bg-zinc-900 border border-purple-500/30 p-5 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
              <Zap className="w-4 h-4" />
            </span>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-400">
              Simulador Multidispositivo & Telemetría Cloud
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-black text-white mt-1">
            Consistencia en Tiempo Real: Owner ➔ Cloud ➔ Barber ➔ Client
          </h2>
          <p className="text-zinc-400 mt-0.5 max-w-xl">
            Valida cómo los cambios realizados por el propietario en su computador se propagan a la tablet del barbero y al teléfono móvil del cliente bajo aislamiento por <code className="text-purple-300">business_id</code>.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleResetSimulation}
            className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold flex items-center gap-1.5 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Restablecer
          </button>
        </div>
      </div>

      {/* Interactive Flow Stepper */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
        <button
          onClick={handleOwnerUpdateService}
          className={`p-3.5 rounded-2xl border text-left transition ${
            currentStep === 1
              ? 'bg-purple-600/20 border-purple-500 shadow-lg text-white'
              : step1Completed
              ? 'bg-emerald-500/10 border-emerald-500/30 text-zinc-300'
              : 'bg-zinc-900 border-zinc-800 text-zinc-400'
          }`}
        >
          <div className="flex items-center justify-between font-bold mb-1">
            <span className="flex items-center gap-1.5">
              <Laptop className="w-3.5 h-3.5 text-purple-400" /> Paso 1: Owner
            </span>
            {step1Completed && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
          </div>
          <p className="text-[11px] text-zinc-400">
            Actualizar precio de "{services[0]?.name || 'Corte'}" a ${servicePriceEdited.toLocaleString('es-CO')}
          </p>
        </button>

        <button
          onClick={handleBarberSync}
          className={`p-3.5 rounded-2xl border text-left transition ${
            currentStep === 2
              ? 'bg-purple-600/20 border-purple-500 shadow-lg text-white'
              : step2Completed
              ? 'bg-emerald-500/10 border-emerald-500/30 text-zinc-300'
              : 'bg-zinc-900 border-zinc-800 text-zinc-400'
          }`}
        >
          <div className="flex items-center justify-between font-bold mb-1">
            <span className="flex items-center gap-1.5">
              <Tablet className="w-3.5 h-3.5 text-sky-400" /> Paso 2: Barber
            </span>
            {step2Completed && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
          </div>
          <p className="text-[11px] text-zinc-400">
            Sincronizar tablet en sillón & registrar consentimiento
          </p>
        </button>

        <button
          onClick={handleClientSync}
          className={`p-3.5 rounded-2xl border text-left transition ${
            currentStep === 3
              ? 'bg-purple-600/20 border-purple-500 shadow-lg text-white'
              : step3Completed
              ? 'bg-emerald-500/10 border-emerald-500/30 text-zinc-300'
              : 'bg-zinc-900 border-zinc-800 text-zinc-400'
          }`}
        >
          <div className="flex items-center justify-between font-bold mb-1">
            <span className="flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-amber-400" /> Paso 3: Client
            </span>
            {step3Completed && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
          </div>
          <p className="text-[11px] text-zinc-400">
            Cliente ve nuevo precio y repite estilo desde celular
          </p>
        </button>

        <button
          onClick={handleRunCloudRLSTest}
          className={`p-3.5 rounded-2xl border text-left transition ${
            currentStep === 4
              ? 'bg-purple-600/20 border-purple-500 shadow-lg text-white'
              : rlsResult
              ? 'bg-emerald-500/10 border-emerald-500/30 text-zinc-300'
              : 'bg-zinc-900 border-zinc-800 text-zinc-400'
          }`}
        >
          <div className="flex items-center justify-between font-bold mb-1">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Paso 4: RLS Test
            </span>
            {rlsResult && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
          </div>
          <p className="text-[11px] text-zinc-400">
            Comprobar bloqueo de acceso cruzado entre tenants
          </p>
        </button>
      </div>

      {/* THREE LIVE VIEWPORTS SIDE-BY-SIDE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* VIEWPORT 1: OWNER DESKTOP */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 space-y-3 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
              <div className="flex items-center gap-2 font-bold text-white">
                <Laptop className="w-4 h-4 text-purple-400" />
                <span>Dispositivo 1: Computador Owner</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono">
                {currentBusiness.ownerName || 'Álvaro'} • Owner
              </span>
            </div>

            <div className="mt-3 space-y-2.5">
              <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-1.5">
                <div className="font-bold text-white flex items-center justify-between">
                  <span>{currentBusiness.name}</span>
                  <span className="text-amber-400 font-bold">${services[0]?.priceCOP.toLocaleString('es-CO')}</span>
                </div>
                <div className="text-[11px] text-zinc-400">
                  Servicio principal: <strong>{services[0]?.name}</strong>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <input
                    type="number"
                    value={servicePriceEdited}
                    onChange={(e) => setServicePriceEdited(Number(e.target.value))}
                    className="w-24 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-white font-mono text-xs"
                  />
                  <button
                    onClick={handleOwnerUpdateService}
                    className="flex-1 py-1 px-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold transition"
                  >
                    Guardar en Cloud
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-zinc-400 space-y-1">
                <div>• Equipo activo: <strong>{team.length} barberos</strong></div>
                <div>• Servicios en catálogo: <strong>{services.length} servicios</strong></div>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-zinc-500 pt-2 border-t border-zinc-800 flex items-center gap-1">
            <Store className="w-3 h-3 text-purple-400" /> Conectado a Tenant ID: <code className="text-zinc-400">{currentBusiness.id}</code>
          </div>
        </div>

        {/* VIEWPORT 2: BARBER TABLET */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 space-y-3 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
              <div className="flex items-center gap-2 font-bold text-white">
                <Tablet className="w-4 h-4 text-sky-400" />
                <span>Dispositivo 2: Tablet Sillón</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-mono">
                Sillón #1 • Barber
              </span>
            </div>

            <div className="mt-3 space-y-2.5">
              <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Pedro Duarte (Cliente)</span>
                  <span className="text-[10px] text-emerald-400 font-bold px-1.5 py-0.2 rounded bg-emerald-500/20">Turno 16:00</span>
                </div>
                <div className="text-[11px] text-zinc-300">
                  Servicio: <strong className="text-white">{services[0]?.name}</strong> (
                  <span className="text-amber-400 font-bold">${services[0]?.priceCOP.toLocaleString('es-CO')} COP</span>)
                </div>
                <div className="text-[10px] text-zinc-400 bg-zinc-900 p-2 rounded-xl border border-zinc-800/80">
                  <span className="text-amber-400 font-bold">Fórmula Cloud:</span> Fade 1.5 a 3, tijera texturizada
                </div>
              </div>

              <button
                onClick={handleBarberSync}
                className="w-full py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold transition flex items-center justify-center gap-1.5"
              >
                <Camera className="w-3.5 h-3.5" /> Registrar Consentimiento & Foto
              </button>
            </div>
          </div>

          <div className="text-[10px] text-zinc-500 pt-2 border-t border-zinc-800 flex items-center gap-1">
            <Scissors className="w-3 h-3 text-sky-400" /> Sincronizado en tiempo real con Cloud
          </div>
        </div>

        {/* VIEWPORT 3: CLIENT MOBILE */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 space-y-3 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
              <div className="flex items-center gap-2 font-bold text-white">
                <Smartphone className="w-4 h-4 text-amber-400" />
                <span>Dispositivo 3: Móvil Cliente</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                Pedro Duarte • 375px
              </span>
            </div>

            <div className="mt-3 space-y-2.5">
              <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-1.5">
                <div className="flex items-center gap-2">
                  <img
                    src={currentBusiness.logoUrl}
                    alt=""
                    className="w-7 h-7 rounded-full object-cover border border-zinc-700 bg-zinc-900"
                  />
                  <div>
                    <div className="font-bold text-white">{currentBusiness.name}</div>
                    <div className="text-[10px] text-zinc-400">Hola, Pedro Duarte 👋</div>
                  </div>
                </div>

                <div className="p-2 bg-zinc-900 rounded-xl border border-zinc-800 text-[11px] flex justify-between items-center">
                  <span>{services[0]?.name}</span>
                  <strong className="text-amber-400 font-bold">${services[0]?.priceCOP.toLocaleString('es-CO')}</strong>
                </div>

                <button
                  onClick={handleClientSync}
                  className="w-full py-2 rounded-xl text-black font-black transition active:scale-95 text-xs shadow"
                  style={{ backgroundColor: primaryColor }}
                >
                  Repetir mi estilo ($ {services[0]?.priceCOP.toLocaleString('es-CO')})
                </button>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-zinc-500 pt-2 border-t border-zinc-800 flex items-center gap-1">
            <User className="w-3 h-3 text-amber-400" /> Acceso directo por QR en espejo
          </div>
        </div>
      </div>

      {/* RLS RESULT BANNER */}
      {rlsResult && (
        <div
          className={`p-4 rounded-2xl border flex items-center gap-3 animate-fade-in ${
            rlsResult.isAllowed
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}
        >
          <ShieldCheck className="w-5 h-5 shrink-0" />
          <div>
            <div className="font-bold text-white">Resultado de Evaluación PostgreSQL RLS:</div>
            <p className="text-xs font-mono mt-0.5">{rlsResult.message}</p>
          </div>
        </div>
      )}

      {/* LIVE CLOUD TELEMETRY FEED */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-3 shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
          <div className="font-bold text-white flex items-center gap-2 text-sm">
            <Layers className="w-4 h-4 text-purple-400" />
            <span>Registro de Consultas y Mutaciones Cloud (PostgreSQL / Supabase)</span>
          </div>
          <span className="text-[10px] bg-zinc-950 px-2 py-0.5 rounded-full text-zinc-400 border border-zinc-800 font-mono">
            {logs.length} eventos registrados
          </span>
        </div>

        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 font-mono text-[11px]">
          {logs.map((log) => (
            <div
              key={log.id}
              className="p-2 bg-zinc-950 rounded-xl border border-zinc-800/80 flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="text-zinc-500 text-[10px]">{log.timestamp}</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[9px] font-black ${
                    log.action === 'INSERT'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : log.action === 'UPDATE'
                      ? 'bg-sky-500/20 text-sky-300'
                      : log.action === 'RLS_EVALUATION'
                      ? 'bg-purple-500/20 text-purple-300'
                      : 'bg-zinc-800 text-zinc-300'
                  }`}
                >
                  {log.action}
                </span>
                <span className="text-purple-300 font-semibold">{log.table}</span>
                <span className="text-zinc-400 truncate">({log.payloadSummary})</span>
              </div>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded font-bold shrink-0 ${
                  log.status === 'SUCCESS'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : log.status === 'DENIED'
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-amber-500/20 text-amber-300'
                }`}
              >
                {log.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
