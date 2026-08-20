import React, { useState } from 'react';
import { useTenant } from '../core/tenant/TenantContext';
import { QrCode, Copy, Check, Download, X, Smartphone, Printer, Sparkles, Scissors } from 'lucide-react';

export const QRCodeModal: React.FC = () => {
  const { currentBusiness, isQRModalOpen, setIsQRModalOpen } = useTenant();
  const [copied, setCopied] = useState(false);

  if (!isQRModalOpen) return null;

  const currentUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/b/${currentBusiness.slug}`
    : `https://barberia-pro-prod.vercel.app/b/${currentBusiness.slug}`;

  // QR con corrección de errores nivel 'H' (30% de redundancia para soportar logo incrustado en el centro)
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(
    currentUrl
  )}&bgcolor=ffffff&color=000000&margin=2&ecc=H`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-md bg-zinc-900 border-2 border-amber-500/50 rounded-3xl p-6 space-y-5 shadow-2xl text-center relative overflow-hidden max-h-[95vh] overflow-y-auto">
        {/* Ambient Glow */}
        <div
          className="absolute -top-12 -right-12 w-44 h-44 rounded-full blur-3xl opacity-30 pointer-events-none"
          style={{ backgroundColor: 'var(--brand-primary)' }}
        />

        {/* Close Button */}
        <button
          onClick={() => setIsQRModalOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header con Nombre de la Barbería */}
        <div className="space-y-1 pt-1">
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider text-black mb-1 shadow"
            style={{ backgroundColor: 'var(--brand-primary)' }}
          >
            <QrCode className="w-3.5 h-3.5" /> Stand Oficial para Mostrador & Espejos
          </div>
          <h3 className="text-xl font-black text-white flex items-center justify-center gap-2">
            <Scissors className="w-4 h-4 text-amber-400" />
            <span>{currentBusiness.name}</span>
          </h3>
          <p className="text-xs text-zinc-400 max-w-xs mx-auto">
            {currentBusiness.slogan || 'Elegancia, precisión y estilo clásico.'}
          </p>
        </div>

        {/* QR Graphic Frame CON LOGO EN EL CENTRO EXACTO */}
        <div className="p-4 bg-white rounded-3xl shadow-2xl inline-block mx-auto border-4 border-amber-500 relative group">
          <div className="relative w-56 h-56 mx-auto flex items-center justify-center">
            {/* Imagen del Código QR */}
            <img
              src={qrApiUrl}
              alt={`Código QR ${currentBusiness.name}`}
              className="w-full h-full object-contain rounded-xl"
            />

            {/* LOGO DE LA EMPRESA INCRUSTADO EN EL CENTRO EXACTO */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-14 h-14 rounded-full bg-white p-1 shadow-2xl border-2 border-amber-500 flex items-center justify-center overflow-hidden">
                <img
                  src={currentBusiness.logoUrl}
                  alt={currentBusiness.name}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-zinc-200 text-center space-y-0.5">
            <span className="text-[11px] font-black text-zinc-950 uppercase tracking-wider block">
              {currentBusiness.name}
            </span>
            <div className="text-[10px] font-bold text-zinc-700 flex items-center justify-center gap-1">
              <Smartphone className="w-3.5 h-3.5 text-zinc-900" />
              <span>Escanea con la cámara de tu celular</span>
            </div>
          </div>
        </div>

        {/* Información de Acceso Directo */}
        <div className="space-y-2 text-xs">
          <div className="bg-zinc-950 p-2.5 rounded-2xl border border-zinc-800 flex items-center justify-between text-zinc-300">
            <span className="truncate font-mono text-[11px] text-amber-400 font-bold">
              {currentUrl}
            </span>
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold flex items-center gap-1.5 transition shrink-0 text-[11px] cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
            </button>
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-[11px] text-zinc-300 space-y-1">
            <div className="font-bold text-amber-400 flex items-center justify-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>¿Qué ven tus clientes al escanearlo?</span>
            </div>
            <p className="text-[10px] text-zinc-400 leading-relaxed">
              Catálogo visual de cortes, probador virtual, agendamiento sin filas y su tarjeta digital de sellos de fidelización.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
          <button
            onClick={handlePrint}
            type="button"
            className="py-3 px-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-black flex items-center justify-center gap-1.5 border border-zinc-700 transition cursor-pointer"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Imprimir Stand</span>
          </button>

          <a
            href={qrApiUrl}
            download={`QR-${currentBusiness.slug}.png`}
            target="_blank"
            rel="noreferrer"
            className="py-3 px-3 rounded-2xl font-black text-black flex items-center justify-center gap-1.5 shadow-xl transition cursor-pointer"
            style={{ backgroundColor: 'var(--brand-primary)' }}
          >
            <Download className="w-4 h-4" />
            <span>Descargar HD</span>
          </a>
        </div>
      </div>
    </div>
  );
};
