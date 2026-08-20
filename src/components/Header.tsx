import React, { useState, useEffect } from 'react';
import { useTenant } from '../core/tenant/TenantContext';
import { useAuth } from '../core/auth/AuthContext';
import { UserRole } from '../core/types';
import { WalkInService, WalkInTicket } from '../core/services/walkinService';
import {
  Scissors,
  Store,
  ShieldCheck,
  User,
  Sparkles,
  SlidersHorizontal,
  QrCode,
  LogOut,
  Briefcase,
  Bell,
  Volume2,
  Check,
  Clock
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    currentBusiness,
    availableBusinesses,
    setCurrentBusinessBySlug,
    isDemoSwitchOpen,
    setIsDemoSwitchOpen,
    setIsQRModalOpen,
  } = useTenant();

  const { currentUser, currentRole, setRole, logout, setIsAuthModalOpen } = useAuth();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [walkinTickets, setWalkinTickets] = useState<WalkInTicket[]>(() =>
    WalkInService.getTickets(currentBusiness.id)
  );

  useEffect(() => {
    const handleUpdate = () => {
      setWalkinTickets(WalkInService.getTickets(currentBusiness.id));
    };
    window.addEventListener('barberia:walkin_update', handleUpdate);
    return () => window.removeEventListener('barberia:walkin_update', handleUpdate);
  }, [currentBusiness.id]);

  const waitingTickets = walkinTickets.filter(t => t.status === 'waiting');
  const isSuperAdmin = currentUser.role === 'superadmin' || currentRole === 'superadmin';

  return (
    <header className="sticky top-0 z-40 glass-panel border-b border-white/10 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <img
            src={currentBusiness.logoUrl}
            alt={currentBusiness.name}
            className="w-10 h-10 rounded-full object-cover border-2 shadow-md bg-zinc-950 shrink-0"
            style={{ borderColor: 'var(--brand-primary)' }}
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black leading-tight tracking-tight text-white truncate">
                {currentBusiness.name}
              </h1>
              {currentBusiness.isVerified && (
                <span
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full text-black shrink-0"
                  style={{ backgroundColor: 'var(--brand-primary)' }}
                >
                  <Sparkles className="w-2.5 h-2.5" /> Oficial
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 flex items-center gap-1">
              <span className="truncate">{currentBusiness.slogan || 'Elegancia y precisión en cada corte'}</span>
            </p>
          </div>
        </div>

        {/* Action Controls & Session Profile */}
        <div className="flex items-center gap-2">
          {/* Campanita de Notificaciones / Turnos en Sala de Espera (Walk-in) */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className={`relative p-2 rounded-xl border transition shadow-sm cursor-pointer flex items-center justify-center ${
                waitingTickets.length > 0
                  ? 'bg-amber-500/15 border-amber-500/50 text-amber-400 animate-pulse'
                  : 'bg-zinc-800/90 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
              }`}
              title="Notificaciones de Clientes en Sala de Espera"
            >
              <Bell className="w-4 h-4" />
              {waitingTickets.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center shadow">
                  {waitingTickets.length}
                </span>
              )}
            </button>

            {/* Dropdown de Notificaciones */}
            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-zinc-900 border border-zinc-700 shadow-2xl p-3 z-50 animate-fade-in text-xs space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-black text-white text-[11px] uppercase tracking-wider">
                      Notificaciones en Vivo ({waitingTickets.length})
                    </span>
                  </div>
                  <button
                    onClick={() => WalkInService.playChime()}
                    className="p-1 rounded-lg bg-zinc-800 text-amber-400 hover:text-white"
                    title="Probar timbre sonoro"
                  >
                    <Volume2 className="w-3 h-3" />
                  </button>
                </div>

                {waitingTickets.length === 0 ? (
                  <div className="text-center py-4 text-zinc-500 text-xs">
                    No hay citas pendientes ni clientes en espera en este momento.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-80 overflow-y-auto">
                    {waitingTickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className={`p-2.5 rounded-xl border space-y-2 ${
                          ticket.type === 'walkin'
                            ? 'bg-zinc-950 border-amber-500/40'
                            : 'bg-zinc-950 border-sky-500/30'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <img
                              src={ticket.stylePhotoUrl || '/styles/el-siete-colombiano.jpg'}
                              alt=""
                              className="w-10 h-10 rounded-xl object-cover border border-zinc-800 shrink-0"
                            />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-black text-white">{ticket.clientName}</span>
                                {ticket.type === 'walkin' ? (
                                  <span className="text-[8px] font-black px-1.5 py-0.2 rounded bg-amber-500 text-black">
                                    🛎️ SIN CITA
                                  </span>
                                ) : (
                                  <span className="text-[8px] font-black px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                                    📅 CITA AGENDADA
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-amber-400 font-bold">{ticket.styleName}</div>
                              <div className="text-[10px] text-zinc-400 flex items-center gap-1 mt-0.5">
                                <Clock className="w-2.5 h-2.5" />
                                {ticket.type === 'walkin' ? (
                                  <span>Llegó en sala de espera • Para: {ticket.barberName}</span>
                                ) : (
                                  <span className="text-zinc-300">
                                    <strong>{ticket.appointmentDate} a las {ticket.appointmentTime}</strong> • {ticket.barberName}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {ticket.specialNote && (
                          <p className="text-[10px] text-zinc-300 bg-zinc-900/80 p-1.5 rounded-lg border border-zinc-800">
                            "{ticket.specialNote}"
                          </p>
                        )}

                        <div className="flex items-center justify-end gap-1.5 pt-1">
                          <button
                            onClick={() => {
                              WalkInService.updateStatus(currentBusiness.id, ticket.id, 'in_chair');
                              setIsNotificationsOpen(false);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-black text-[10px] flex items-center gap-1 shadow cursor-pointer"
                          >
                            <span>{ticket.type === 'walkin' ? '🪑 Sentar en Sillón' : '✓ Confirmar / Atender'}</span>
                          </button>
                          <button
                            onClick={() => WalkInService.updateStatus(currentBusiness.id, ticket.id, 'completed')}
                            className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold cursor-pointer"
                            title="Marcar como atendido"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick QR Code Generator Button */}
          <button
            onClick={() => setIsQRModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 shadow-sm transition shrink-0"
            title="Ver Código QR de Acceso para Clientes"
          >
            <QrCode className="w-3.5 h-3.5" style={{ color: 'var(--brand-primary)' }} />
            <span className="hidden md:inline">QR Acceso</span>
          </button>

          {/* User Session Pill & Auth Trigger */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-1 text-xs">
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-zinc-800 text-zinc-200 transition"
              title="Identificarse con Nombre y WhatsApp"
            >
              <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 font-bold text-[10px]">
                {currentUser.id !== 'guest' ? currentUser.fullName.charAt(0) : <User className="w-3 h-3 text-amber-400" />}
              </div>
              <span className="font-bold max-w-[100px] sm:max-w-[130px] truncate">
                {currentUser.id !== 'guest' ? currentUser.fullName : 'Identificarme'}
              </span>
            </button>

            {currentUser.id !== 'guest' && (
              <button
                onClick={logout}
                className="p-1 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition"
                title="Cerrar sesión"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Multi-Tenant Switcher (Exclusivo SuperAdmin) */}
          {isSuperAdmin && (
            <div className="relative">
              <button
                onClick={() => setIsDemoSwitchOpen(!isDemoSwitchOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition"
                title="Selector de Tenants (SuperAdmin)"
              >
                <Store className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden lg:inline font-mono">{currentBusiness.slug}</span>
                <SlidersHorizontal className="w-3 h-3 text-zinc-400" />
              </button>

              {isDemoSwitchOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-zinc-900 border border-zinc-700 shadow-2xl p-2.5 z-50 animate-fade-in text-xs">
                  <div className="text-[11px] font-bold text-zinc-400 px-2 py-1 uppercase tracking-wider flex items-center justify-between">
                    <span>Tenants en la Plataforma</span>
                    <span className="text-[9px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400">
                      {availableBusinesses.length}
                    </span>
                  </div>
                  <div className="space-y-1 mt-1">
                    {availableBusinesses.map((b) => {
                      const isSelected = b.id === currentBusiness.id;
                      return (
                        <button
                          key={b.id}
                          onClick={() => {
                            setCurrentBusinessBySlug(b.slug);
                            setIsDemoSwitchOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center gap-2.5 transition ${
                            isSelected
                              ? 'bg-amber-500/20 text-white font-semibold border border-amber-500/30'
                              : 'hover:bg-zinc-800 text-zinc-300'
                          }`}
                        >
                          <img
                            src={b.logoUrl}
                            alt=""
                            className="w-7 h-7 rounded-full object-cover border border-zinc-700 bg-zinc-950 shrink-0"
                          />
                          <div className="flex-1 truncate">
                            <div className="truncate font-bold">{b.name}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick Role Navigator (Exclusivo SuperAdmin) */}
          {isSuperAdmin && (
            <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-0.5">
              {(['client', 'barber', 'owner', 'superadmin'] as UserRole[]).map((r) => {
                const labelMap: Record<UserRole, { label: string; icon: any }> = {
                  client: { label: 'Cliente', icon: User },
                  barber: { label: 'Barbero', icon: Scissors },
                  manager: { label: 'Manager', icon: Briefcase },
                  owner: { label: 'Dueño', icon: Store },
                  superadmin: { label: 'SaaS', icon: ShieldCheck },
                };
                const { label, icon: Icon } = labelMap[r];
                const isActive = currentRole === r;

                return (
                  <button
                    key={r}
                    onClick={() => setRole(r)}
                    className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition ${
                      isActive
                        ? 'shadow-sm font-black text-black'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                    style={isActive ? { backgroundColor: 'var(--brand-primary)', color: '#000' } : {}}
                  >
                    <Icon className="w-3 h-3" />
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
