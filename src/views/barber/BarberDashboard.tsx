import React, { useState, useMemo, useEffect } from 'react';
import { useTenant } from '../../core/tenant/TenantContext';
import { useAuth } from '../../core/auth/AuthContext';
import { TeamService } from '../../core/services/teamService';
import { WalkInService, WalkInTicket } from '../../core/services/walkinService';
import { ShiftCommissionService, BarberDailySummary } from '../../core/services/shiftCommissionService';
import { StyleCatalogService } from '../../core/services/styleCatalogService';
import { BarberWorkItem } from '../../core/types';
import {
  Star,
  ThumbsUp,
  AlertCircle,
  Camera,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  Bell,
  Gift,
  Scissors,
  ArrowLeft,
  Wallet,
  Plus,
  Trash2,
  Calendar,
  Image as ImageIcon
} from 'lucide-react';


export const BarberDashboard: React.FC = () => {
  const { currentBusiness } = useTenant();
  const { setRole } = useAuth();

  // Filtrar estrictamente los barberos del tenant actual
  const tenantBarbers = useMemo(
    () => TeamService.getTeamByBusiness(currentBusiness.id),
    [currentBusiness.id]
  );

  const [selectedBarberId, setSelectedBarberId] = useState<string>(
    tenantBarbers[0]?.id || ''
  );

  const barber = tenantBarbers.find(b => b.id === selectedBarberId) || tenantBarbers[0];

  // Cola de clientes en tiempo real
  const [tickets, setTickets] = useState<WalkInTicket[]>(() =>
    WalkInService.getTickets(currentBusiness.id)
  );

  // Resumen de turno y comisiones del barbero
  const [shiftSummary, setShiftSummary] = useState<BarberDailySummary>(() =>
    ShiftCommissionService.getBarberSummaryToday(currentBusiness.id, barber?.id || '', barber?.commissionPercentage ?? 50)
  );

  useEffect(() => {
    const handleUpdate = () => {
      setTickets(WalkInService.getTickets(currentBusiness.id));
      if (barber) {
        setShiftSummary(
          ShiftCommissionService.getBarberSummaryToday(
            currentBusiness.id,
            barber.id,
            barber.commissionPercentage ?? 50
          )
        );
      }
    };

    window.addEventListener('barberia:walkin_update', handleUpdate);
    window.addEventListener('barberia:shift_updated', handleUpdate);
    return () => {
      window.removeEventListener('barberia:walkin_update', handleUpdate);
      window.removeEventListener('barberia:shift_updated', handleUpdate);
    };
  }, [currentBusiness.id, barber]);

  const [activeTicket, setActiveTicket] = useState<WalkInTicket | null>(() => {
    const list = WalkInService.getTickets(currentBusiness.id);
    return list.find(t => t.status === 'in_chair') || list.find(t => t.status === 'waiting') || null;
  });

  const [isPhotoCaptured, setIsPhotoCaptured] = useState(false);
  const [photoConsent, setPhotoConsent] = useState(true);
  const [clientStamps, setClientStamps] = useState(4); // Simulación real de la tarjeta del cliente
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [serviceCompleted, setServiceCompleted] = useState(false);

  // Portafolio "Mis Trabajos" del barbero
  const [barberWorks, setBarberWorks] = useState<BarberWorkItem[]>(() =>
    StyleCatalogService.getBarberWorks(currentBusiness.id, barber?.id)
  );
  const [isAddWorkModalOpen, setIsAddWorkModalOpen] = useState(false);
  const [newWorkStyle, setNewWorkStyle] = useState('Crop Texturizado Con Fade Bajo');
  const [newWorkNotes, setNewWorkNotes] = useState('');
  const [newWorkPhoto, setNewWorkPhoto] = useState('');

  useEffect(() => {
    const handleWorksUpdate = () => {
      if (barber) {
        setBarberWorks(StyleCatalogService.getBarberWorks(currentBusiness.id, barber.id));
      }
    };
    window.addEventListener('barberia:works_updated', handleWorksUpdate);
    return () => window.removeEventListener('barberia:works_updated', handleWorksUpdate);
  }, [currentBusiness.id, barber]);


  const handleAddStamp = (amount: number = 1) => {
    setClientStamps((prev) => {
      const next = Math.min(6, prev + amount);
      if (next >= 6) {
        setRewardClaimed(false);
      }
      return next;
    });
    WalkInService.playChime();
  };

  const handleClaimRewardAndReset = () => {
    setClientStamps(0);
    setRewardClaimed(true);
    WalkInService.playChime();
  };

  if (!barber) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 mx-auto text-amber-400" />
        <h3 className="text-sm font-bold text-white">No hay barberos registrados en {currentBusiness.name}</h3>
        <p className="text-xs text-zinc-400">El propietario debe dar de alta al equipo en el panel administrativo.</p>
      </div>
    );
  }

  const handleFinishService = () => {
    if (activeTicket) {
      WalkInService.updateStatus(currentBusiness.id, activeTicket.id, 'completed');
      ShiftCommissionService.recordService({
        businessId: currentBusiness.id,
        barberId: barber.id,
        barberName: barber.fullName,
        serviceName: activeTicket.styleName || 'Corte Clásico & Fade Pro',
        priceCOP: activeTicket.priceCOP || 38000,
        commissionPercentage: barber.commissionPercentage ?? 50,
        clientName: activeTicket.clientName || 'Cliente en Sillón',
      });
    }
    setServiceCompleted(true);
  };

  const handleSeatClient = (ticket: WalkInTicket) => {
    WalkInService.updateStatus(currentBusiness.id, ticket.id, 'in_chair');
    setActiveTicket(ticket);
    setServiceCompleted(false);
    setIsPhotoCaptured(false);
  };

  const waitingQueue = tickets.filter(t => t.status === 'waiting');

  return (
    <div className="max-w-3xl mx-auto px-4 py-5 space-y-6 pb-28 animate-fade-in">
      {/* Top Switcher & Role Navigation */}
      <div className="flex items-center justify-between gap-2 border-b border-zinc-800 pb-3">
        <button
          onClick={() => setRole('client')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-bold border border-zinc-800 text-xs transition cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Ver como Cliente</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-400 font-bold hidden sm:inline">Colaborador en Sillón:</span>
          <select
            value={barber.id}
            onChange={(e) => setSelectedBarberId(e.target.value)}
            className="bg-zinc-900 border border-amber-500/40 rounded-xl px-2.5 py-1 text-xs text-amber-400 font-black cursor-pointer focus:outline-none"
          >
            {tenantBarbers.map((b) => (
              <option key={b.id} value={b.id}>
                ✂️ {b.fullName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Barber Hero Header */}
      <div className="flex items-center justify-between bg-zinc-900/90 border border-zinc-800 p-4.5 rounded-3xl shadow-lg">
        <div className="flex items-center gap-3.5">
          <img
            src={barber.avatarUrl}
            alt={barber.fullName}
            className="w-13 h-13 rounded-full object-cover border-2 shadow bg-zinc-950 shrink-0"
            style={{ borderColor: 'var(--brand-primary)' }}
          />
          <div>
            <div className="text-xs text-zinc-400 flex items-center gap-1.5">
              <span>Sillón de Trabajo</span>
              <span className="text-zinc-600">•</span>
              <span className="text-amber-400 font-bold">{currentBusiness.name}</span>
            </div>
            <h2 className="text-lg font-black text-white">{barber.fullName}</h2>
            <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold mt-0.5">
              <span className="flex items-center gap-0.5">
                <Star className="w-3.5 h-3.5 fill-current" /> {barber.ratingAverage}
              </span>
              <span className="text-zinc-500">•</span>
              <span className="text-emerald-400">{barber.happyClientsPct}% Clientes Felices</span>
              <span className="text-zinc-500">•</span>
              <span className="text-zinc-400">{barber.totalCutsCompleted} Cortes</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => WalkInService.playChime()}
          className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition cursor-pointer"
          title="Probar timbre de llegada"
        >
          <Bell className="w-4 h-4" />
        </button>
      </div>

      {/* 💰 PANEL DE TURNO & LIQUIDACIÓN DE COMISIONES DEL BARBERO */}
      <section className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 border border-amber-500/30 rounded-3xl p-4.5 space-y-3.5 shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400">
              <Wallet className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-xs font-black text-white">Mi Turno de Hoy & Ganancias</h3>
              <span className="text-[10px] text-zinc-400">
                Comisión acordada: <strong className="text-amber-400">{barber.commissionPercentage ?? 50}%</strong> por servicio
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-bold border border-zinc-700">
            Hoy: {new Date().toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })}
          </span>
        </div>

        {/* 3 Métricas clave */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2.5 bg-zinc-900/80 rounded-2xl border border-zinc-800">
            <span className="text-[10px] text-zinc-400 block font-bold">Cortes Hoy</span>
            <span className="text-lg font-black text-white">{shiftSummary.totalServicesCount}</span>
          </div>

          <div className="p-2.5 bg-zinc-900/80 rounded-2xl border border-zinc-800">
            <span className="text-[10px] text-zinc-400 block font-bold">Venta Total</span>
            <span className="text-sm sm:text-base font-black text-zinc-300">
              ${shiftSummary.totalBilledCOP.toLocaleString('es-CO')}
            </span>
          </div>

          <div className="p-2.5 bg-emerald-500/10 rounded-2xl border border-emerald-500/30">
            <span className="text-[10px] text-emerald-400 block font-bold">Mi Comisión</span>
            <span className="text-sm sm:text-base font-black text-emerald-400">
              ${shiftSummary.barberEarningsCOP.toLocaleString('es-CO')}
            </span>
          </div>
        </div>

        {/* Desglose de servicios de hoy */}
        {shiftSummary.records.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
              Servicios registrados en mi turno:
            </span>
            <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
              {shiftSummary.records.map((rec) => (
                <div
                  key={rec.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px]"
                >
                  <div>
                    <span className="font-bold text-white block">{rec.clientName}</span>
                    <span className="text-[10px] text-zinc-400">{rec.serviceName}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-white block">${rec.priceCOP.toLocaleString('es-CO')}</span>
                    <span className="text-[10px] text-emerald-400 font-bold">
                      +${rec.barberEarningsCOP.toLocaleString('es-CO')} ({rec.commissionPercentage}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 🛎️ COLA EN VIVO DE CLIENTES EN SALA DE ESPERA & CITAS */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5 animate-bounce" />
            <span>Cola en Sala de Espera & Citas ({waitingQueue.length})</span>
          </h3>
          <span className="text-[10px] text-zinc-400 font-semibold">
            Actualización en vivo
          </span>
        </div>

        {waitingQueue.length === 0 ? (
          <div className="p-4 bg-zinc-900/60 rounded-2xl border border-zinc-800 text-center text-xs text-zinc-500">
            No hay clientes en espera en este momento.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {waitingQueue.map((t) => (
              <div
                key={t.id}
                className={`p-3.5 rounded-2xl border transition shadow-lg space-y-2.5 ${
                  t.type === 'walkin'
                    ? 'bg-zinc-900 border-amber-500/40'
                    : 'bg-zinc-900 border-sky-500/30'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={t.stylePhotoUrl || '/styles/el-siete-colombiano.jpg'}
                      alt=""
                      className="w-11 h-11 rounded-xl object-cover border border-zinc-800 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-black text-white text-xs">{t.clientName}</h4>
                        {t.type === 'walkin' ? (
                          <span className="text-[8px] font-black px-1.5 py-0.2 rounded bg-amber-500 text-black">
                            🛎️ SIN CITA
                          </span>
                        ) : (
                          <span className="text-[8px] font-black px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                            📅 CITA
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-amber-400 font-bold">{t.styleName}</div>
                      <div className="text-[10px] text-zinc-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {t.type === 'walkin' ? (
                          <span>En sala de espera</span>
                        ) : (
                          <span className="text-sky-300 font-semibold">{t.appointmentDate} • {t.appointmentTime}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {t.specialNote && (
                  <p className="text-[10px] text-zinc-300 bg-zinc-950/80 p-2 rounded-xl border border-zinc-800">
                    "{t.specialNote}"
                  </p>
                )}

                <button
                  onClick={() => handleSeatClient(t)}
                  className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center justify-center gap-1.5 shadow transition cursor-pointer"
                >
                  <Scissors className="w-3.5 h-3.5" />
                  <span>🪑 Sentar en Sillón de {barber.fullName.split(' ')[0]}</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 🪑 CLIENTE ACTUALMENTE EN EL SILLÓN DE TRABAJO */}
      {activeTicket && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Cliente en Atención en Sillón</span>
            </h3>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
              En Sillón Ahora
            </span>
          </div>

          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-5 space-y-4 shadow-xl">
            {/* Client Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 font-bold text-sm">
                  {activeTicket.clientName.charAt(0)}
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">{activeTicket.clientName}</h4>
                  <p className="text-xs text-zinc-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-zinc-500" /> Tel: {activeTicket.clientPhone}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-amber-400">{activeTicket.styleName}</div>
                <div className="text-[11px] text-zinc-400">
                  {activeTicket.type === 'walkin' ? 'Turno en vivo' : `${activeTicket.appointmentDate} ${activeTicket.appointmentTime}`}
                </div>
              </div>
            </div>

            {/* VISUAL MEMORY CARD FOR BARBER */}
            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800/80 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                <span>Ficha Técnica y Foto Solicitada</span>
                <span className="text-[10px] text-amber-400 font-semibold">"Tu barbería te conoce"</span>
              </div>

              <div className="grid sm:grid-cols-3 gap-3.5">
                <div className="rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 aspect-square">
                  <img
                    src={activeTicket.stylePhotoUrl || '/styles/el-siete-colombiano.jpg'}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="sm:col-span-2 space-y-2 text-xs">
                  <div className="bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800">
                    <div className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3" /> Preferencia a mantener:
                    </div>
                    <div className="text-zinc-200 mt-0.5 font-medium">
                      Degradado limpio a piel en laterales, navaja en contornos.
                    </div>
                  </div>

                  <div className="bg-zinc-900/80 p-2.5 rounded-xl border border-amber-500/30">
                    <div className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Instrucción / Ajuste pedido por el cliente:
                    </div>
                    <div className="text-zinc-200 mt-0.5 font-medium">
                      "{activeTicket.specialNote || 'Corte habitual con memoria de estilo activa.'}"
                    </div>
                  </div>

                  <div className="text-[11px] text-zinc-400 pt-1">
                    <strong>Fórmula técnica sugerida:</strong> Fade 0 a 2 en V, tijera arriba 4cm y textura mate.
                  </div>
                </div>
              </div>
            </div>

            {/* TARJETA INTERACTIVA DE SELLOS Y FIDELIZACIÓN PARA EL BARBERO */}
            <div className="bg-zinc-950 p-4 rounded-2xl border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-lg bg-amber-500/20 text-amber-400">
                    <Gift className="w-4 h-4" />
                  </span>
                  <div>
                    <span className="text-xs font-black text-white block">
                      Tarjeta de Fidelización del Cliente
                    </span>
                    <span className="text-[10px] text-amber-400 font-bold">
                      {currentBusiness.loyalty.stampsThreshold || 6} sellos = ¡1 CORTE DE CABELLO GRATIS! ✂️🎁
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-black text-amber-400">
                    {clientStamps} / {currentBusiness.loyalty.stampsThreshold || 6}
                  </span>
                  <span className="text-[10px] text-zinc-400 block">Sellos</span>
                </div>
              </div>

              {/* Visualización de los sellos */}
              <div className="grid grid-cols-6 gap-2">
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <div
                    key={num}
                    className={`h-10 rounded-xl border flex items-center justify-center font-bold text-xs transition-all ${
                      num <= clientStamps
                        ? 'bg-amber-500 text-black border-amber-400 shadow-md scale-105'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-600'
                    }`}
                  >
                    {num <= clientStamps ? '⭐' : num}
                  </div>
                ))}
              </div>

              {/* Alerta de premio completado o controles */}
              {clientStamps >= (currentBusiness.loyalty.stampsThreshold || 6) ? (
                <div className="p-3 bg-gradient-to-r from-emerald-500/20 via-amber-500/20 to-zinc-900 border border-emerald-500/40 rounded-xl space-y-2 text-center animate-fade-in">
                  <div className="text-xs font-black text-emerald-400 flex items-center justify-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>¡CORTE GRATIS DESBLOQUEADO (6 DE 6 SELLOS)!</span>
                  </div>
                  <p className="text-[11px] text-zinc-300">
                    {activeTicket.clientName} se ha ganado su corte gratis. Al terminar, presiona el botón para reiniciar su tarjeta a 0:
                  </p>
                  <button
                    type="button"
                    onClick={handleClaimRewardAndReset}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-black font-black text-xs shadow-lg hover:brightness-110 transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>🎉 Entregar Corte Gratis y Reiniciar Tarjeta a Cero (0)</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleAddStamp(1)}
                    className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs transition shadow cursor-pointer flex items-center justify-center gap-1"
                  >
                    <span>🎁 Estampar +1 Sello de Corte</span>
                  </button>
                </div>
              )}

              {rewardClaimed && (
                <div className="p-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-xl text-center text-[11px] font-bold">
                  ✓ ¡Corte gratis entregado con éxito! La tarjeta volvió a 0 sellos para un nuevo ciclo de fidelización.
                </div>
              )}
            </div>

            {/* Cierre de Servicio, Autorización y Captura de Foto */}
            {!serviceCompleted ? (
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-zinc-300 bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800 gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={photoConsent}
                      onChange={(e) => setPhotoConsent(e.target.checked)}
                      className="rounded border-zinc-700 text-amber-500 focus:ring-0"
                    />
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Cliente autoriza foto para su ficha privada</span>
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPhotoCaptured(true)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                      isPhotoCaptured
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : 'bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700'
                    }`}
                  >
                    <Camera className="w-4 h-4" />
                    <span>{isPhotoCaptured ? '✓ Foto Guardada' : '📸 Tomar Foto al Corte'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleFinishService}
                    className="py-2.5 px-4 rounded-xl text-xs font-black text-black shadow-lg transition active:scale-95 cursor-pointer"
                    style={{ backgroundColor: 'var(--brand-primary)' }}
                  >
                    Finalizar Servicio
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center text-xs text-emerald-400 font-bold space-y-1.5 animate-fade-in">
                <CheckCircle2 className="w-7 h-7 mx-auto" />
                <div className="text-sm">¡Servicio finalizado con éxito por {barber.fullName}!</div>
                <p className="text-[11px] font-normal text-zinc-300">
                  Se registró el corte para <strong>{activeTicket.clientName}</strong> y su tarjeta de sellos quedó actualizada en Cloud.
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ✂️ SECCIÓN "MIS TRABAJOS" - Portafolio Real del Barbero */}
      <section className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-4.5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Scissors className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-black text-white">MIS TRABAJOS</h3>
              <span className="text-[10px] text-zinc-400">
                Portafolio real de cortes y barbas realizados por {barber.fullName}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsAddWorkModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs transition cursor-pointer shadow"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Subir Trabajo</span>
          </button>
        </div>

        {barberWorks.length === 0 ? (
          <div className="text-center py-8 bg-zinc-950/40 rounded-2xl border border-zinc-850 p-4 space-y-2">
            <ImageIcon className="w-8 h-8 text-zinc-600 mx-auto stroke-[1.5]" />
            <p className="text-xs font-bold text-zinc-400">Aún no has registrado trabajos en tu portafolio.</p>
            <p className="text-[10px] text-zinc-500">Sube fotos de tus mejores cortes para mostrarlos a tus clientes.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {barberWorks.map((work) => (
              <div
                key={work.id}
                className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden group hover:border-amber-500/40 transition flex flex-col justify-between"
              >
                <div className="relative aspect-[4/3] w-full bg-zinc-900 overflow-hidden flex items-center justify-center">
                  {work.fotoUrl ? (
                    <img
                      src={work.fotoUrl}
                      alt={work.estiloUtilizado}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-zinc-900">
                      <Scissors className="w-5 h-5 text-amber-400 mb-1" />
                      <span className="text-[9px] text-zinc-400 font-bold">{work.estiloUtilizado}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => StyleCatalogService.deleteBarberWork(currentBusiness.id, work.id)}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/80 text-zinc-400 hover:text-rose-400 flex items-center justify-center transition opacity-0 group-hover:opacity-100"
                    title="Eliminar trabajo"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                <div className="p-2.5 space-y-1">
                  <div className="text-[11px] font-extrabold text-white line-clamp-1">{work.estiloUtilizado}</div>
                  <div className="flex items-center gap-1 text-[9px] text-zinc-500">
                    <Calendar className="w-2.5 h-2.5 text-amber-400" />
                    <span>{work.fecha}</span>
                  </div>
                  {work.notasOpcionales && (
                    <p className="text-[9px] text-zinc-400 line-clamp-1">{work.notasOpcionales}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modal: Subir Nuevo Trabajo */}
      {isAddWorkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-750 rounded-3xl p-5 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-amber-500/10 text-amber-400">
                  <Scissors className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-black text-white">Subir Trabajo al Portafolio</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddWorkModalOpen(false)}
                className="text-zinc-500 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newWorkStyle.trim()) return;
                StyleCatalogService.saveBarberWork(currentBusiness.id, {
                  id: `work_${Date.now()}`,
                  businessId: currentBusiness.id,
                  barberId: barber.id,
                  barberName: barber.fullName,
                  fotoUrl: newWorkPhoto,
                  estiloUtilizado: newWorkStyle.trim(),
                  fecha: new Date().toISOString().split('T')[0],
                  notasOpcionales: newWorkNotes.trim(),
                  createdAt: new Date().toISOString()
                });
                setIsAddWorkModalOpen(false);
                setNewWorkPhoto('');
                setNewWorkNotes('');
              }}
              className="space-y-3 text-xs"
            >
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-300">Estilo de Barba o Corte:</label>
                <input
                  type="text"
                  required
                  value={newWorkStyle}
                  onChange={(e) => setNewWorkStyle(e.target.value)}
                  placeholder="ej: Boxed Beard, Fade Bajo, Corte Clásico..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-zinc-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-300">Fotografía del Trabajo:</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setNewWorkPhoto(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2 text-zinc-400 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-amber-500 file:text-black hover:file:bg-amber-400 cursor-pointer"
                />
              </div>

              {newWorkPhoto && (
                <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950">
                  <img src={newWorkPhoto} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-300">Notas Opcionales:</label>
                <textarea
                  value={newWorkNotes}
                  onChange={(e) => setNewWorkNotes(e.target.value)}
                  placeholder="Detalles de la técnica, productos aplicados, etc..."
                  rows={2}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2 text-zinc-200 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddWorkModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black"
                >
                  Guardar Trabajo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

