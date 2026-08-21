import React, { useState } from 'react';
import { useTenant } from '../core/tenant/TenantContext';
import { useAuth } from '../core/auth/AuthContext';
import { User, Phone, X, ArrowRight, ShieldCheck } from 'lucide-react';

export const ClientAuthModal: React.FC = () => {
  const { currentBusiness } = useTenant();
  const { isAuthModalOpen, setIsAuthModalOpen, loginAsClient, currentUser } = useAuth();

  const [fullName, setFullName] = useState(currentUser.fullName !== 'Cliente Invitado' ? currentUser.fullName : '');
  const [phone, setPhone] = useState(currentUser.phone || '');

  if (!isAuthModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) return;
    loginAsClient(phone, fullName);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="w-full sm:max-w-sm bg-zinc-900 border-t sm:border border-zinc-700 rounded-t-3xl sm:rounded-3xl p-6 space-y-5 shadow-2xl relative overflow-hidden text-xs max-h-[92vh] overflow-y-auto">

        {/* Subtle Ambient Glow */}
        <div
          className="absolute -top-12 -right-12 w-36 h-36 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: 'var(--brand-primary)' }}
        />

        {/* Close Button */}
        <button
          onClick={() => setIsAuthModalOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2 pt-1">
          <img
            src={currentBusiness.logoUrl}
            alt={currentBusiness.name}
            className="w-14 h-14 mx-auto rounded-full object-cover border-2 shadow-lg bg-zinc-950"
            style={{ borderColor: 'var(--brand-primary)' }}
          />
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
              Identificación Rápida
            </span>
            <h3 className="text-base font-black text-white">{currentBusiness.name}</h3>
            <p className="text-[11px] text-zinc-400 max-w-xs mx-auto">
              Ingresa tu nombre y WhatsApp para que tu barbería recuerde tu estilo y preferencias.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="font-bold text-zinc-300 block mb-1">Tu Nombre Completo:</label>
            <div className="relative">
              <User className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ej: Pedro Duarte"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-zinc-300 block mb-1">Tu Teléfono / WhatsApp:</label>
            <div className="relative">
              <Phone className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ej: 310 555 1234"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Caja explicativa de beneficios */}
          <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800/90 space-y-2 text-[11px]">
            <span className="font-extrabold text-amber-400 block flex items-center gap-1 text-[10px] uppercase tracking-wider">
              ✨ ¿Por qué identificarte?
            </span>
            <ul className="space-y-1 text-zinc-300">
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-400 font-bold">✓</span>
                <span><strong>Tu memoria de estilo:</strong> Recuerda tus degradados, fotos y preferencias.</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-amber-400 font-bold">✓</span>
                <span><strong>Tus sellos digitales:</strong> Suma visitas para reclamar tu corte gratis.</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-sky-400 font-bold">✓</span>
                <span><strong>Reservas sin esperas:</strong> Agendas tu turno en segundos por WhatsApp.</span>
              </li>
            </ul>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 pt-0.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Tus datos son 100% privados y exclusivos de {currentBusiness.name}.</span>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl font-black text-black shadow-lg flex items-center justify-center gap-1.5 transition active:scale-95 text-xs"
            style={{ backgroundColor: 'var(--brand-primary)' }}
          >
            <span>Entrar y Cargar Mi Estilo</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
