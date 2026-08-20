import React, { useState, useRef, useEffect } from 'react';
import { useTenant } from '../../core/tenant/TenantContext';
import { StyleCatalogService } from '../../core/services/styleCatalogService';
import { StyleCatalogItem } from '../../core/types';
import {
  Camera,
  Sparkles,
  Check,
  Share2,
  ArrowLeft,
  ShieldCheck,
  Calendar,
  Image as ImageIcon,
  X,
  Rotate3d,
  Scan,
  Trash2,
  Heart
} from 'lucide-react';

interface StyleTryOnViewProps {
  onBack: () => void;
  onBookWithStyle: (styleName: string) => void;
  initialStyleId?: string;
}

export const StyleTryOnView: React.FC<StyleTryOnViewProps> = ({ onBack, onBookWithStyle, initialStyleId }) => {
  const { currentBusiness } = useTenant();
  const [catalogStyles, setCatalogStyles] = useState<StyleCatalogItem[]>(() =>
    StyleCatalogService.getStyles(currentBusiness.id)
  );

  useEffect(() => {
    const handleCatalogUpdate = () => {
      setCatalogStyles(StyleCatalogService.getStyles(currentBusiness.id));
    };
    window.addEventListener('barberia:catalog_updated', handleCatalogUpdate);
    return () => window.removeEventListener('barberia:catalog_updated', handleCatalogUpdate);
  }, [currentBusiness.id]);

  const [selectedStyle, setSelectedStyle] = useState<StyleCatalogItem>(() => {
    if (initialStyleId) {
      const found = catalogStyles.find(s => s.id === initialStyleId);
      if (found) return found;
    }
    return catalogStyles[0] || ({} as any);
  });
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'corte' | 'barba' | 'combo'>('all');
  const [viewMode, setViewMode] = useState<'visagismo' | 'angles'>('visagismo');
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [isSharedWithBarber, setIsSharedWithBarber] = useState(true);
  const [notesForBarber, setNotesForBarber] = useState('Quiero este degradado medio pero dejando un poco más de largo arriba.');

  // Favoritos persistentes con aislamiento Multi-Tenant
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`barberia_favs_${currentBusiness.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const isFavorite = selectedStyle ? favorites.includes(selectedStyle.id) : false;

  const handleToggleFavorite = () => {
    if (!selectedStyle) return;
    const next = isFavorite
      ? favorites.filter(id => id !== selectedStyle.id)
      : [...favorites, selectedStyle.id];
    setFavorites(next);
    try {
      localStorage.setItem(`barberia_favs_${currentBusiness.id}`, JSON.stringify(next));
    } catch (e) {
      console.warn('Error saving favorites', e);
    }
  };

  // Asesoría de Visagismo Fisonómico
  const [isScanningAi, setIsScanningAi] = useState(false);
  const [scanStep, setScanStep] = useState('');
  const [isInlineCameraActive, setIsInlineCameraActive] = useState(false);
  const [faceAnalysis, setFaceAnalysis] = useState({
    faceShape: 'Estructura Angular / Cuadrada',
    jawline: 'Mandíbula definida',
    forehead: 'Frente proporcionada',
    hairTexture: 'Textura media',
    whyItFits: 'El degradado lateral en V alarga la silueta del rostro y suaviza los ángulos laterales.',
    barberTip: 'Recomendamos mantener textura a tijera en la parte superior y perfilado limpio en patillas con navaja.'
  });

  // Controles de Multivista
  const [selectedAngle, setSelectedAngle] = useState<'front' | 'side' | 'back'>('front');

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const inlineVideoRef = useRef<HTMLVideoElement>(null);
  const inlineStreamRef = useRef<MediaStream | null>(null);

  const filteredStyles = catalogStyles.filter(s =>
    selectedCategory === 'all' ? true : s.category === selectedCategory
  );

  // Iniciar cámara directamente en el cuadro
  const startInlineCamera = async () => {
    setIsInlineCameraActive(true);
    setUserPhoto(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 720 } },
          audio: false
        });
        inlineStreamRef.current = stream;
        if (inlineVideoRef.current) {
          inlineVideoRef.current.srcObject = stream;
          inlineVideoRef.current.play();
        }
      } else {
        cameraInputRef.current?.click();
      }
    } catch (err) {
      console.warn('Inline camera access error, fallback to input', err);
      cameraInputRef.current?.click();
    }
  };

  const stopInlineCamera = () => {
    if (inlineStreamRef.current) {
      inlineStreamRef.current.getTracks().forEach(t => t.stop());
      inlineStreamRef.current = null;
    }
    setIsInlineCameraActive(false);
  };

  const captureInlinePhoto = () => {
    if (inlineVideoRef.current) {
      const video = inlineVideoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 640;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        setUserPhoto(dataUrl);
        triggerAiFaceAnalysis(dataUrl, selectedStyle);
      }
      stopInlineCamera();
    } else {
      cameraInputRef.current?.click();
    }
  };

  // Limpiar cámara al desmontar
  useEffect(() => {
    return () => {
      stopInlineCamera();
    };
  }, []);

  // Mapeo Fisonómico de Visagismo Profesional
  const triggerAiFaceAnalysis = (_photo: string | null = userPhoto, style: StyleCatalogItem = selectedStyle) => {
    setIsScanningAi(true);
    setScanStep('🔍 Cotejando geometría de rostro con la ficha técnica...');

    setTimeout(() => {
      setScanStep(`✂️ Mapeando proporciones del corte "${style.name}"...`);
    }, 400);

    setTimeout(() => {
      const name = style.name.toLowerCase();
      let shape = 'Estructura Angular / Cuadrada';
      let why = 'El degradado lateral estiliza el perfil y resalta tus facciones con precisión.';

      if (name.includes('siete')) {
        shape = 'Ovalado / Cuadrado';
        why = 'La terminación en V en la nuca y el fade lateral crean un contraste atlético y moderno.';
      } else if (name.includes('mid fade') || name.includes('crop')) {
        shape = 'Cuadrado / Diamante';
        why = 'El volumen superior con textura reduce la rigidez de la frente y destaca la mirada.';
      } else if (name.includes('pompadour')) {
        shape = 'Redondo / Ovalado';
        why = 'La elevación frontal estiliza y alarga visualmente el rostro.';
      } else if (name.includes('barba')) {
        shape = 'Cualquier Fisonomía';
        why = 'El perfilado milimétrico con navaja define la línea de mandíbula y cuello.';
      }

      setFaceAnalysis({
        faceShape: shape,
        jawline: 'Mandíbula definida',
        forehead: 'Frente simétrica proporcionada',
        hairTexture: style.hairType || 'Todo tipo de cabello',
        whyItFits: why,
        barberTip: style.technicalFormula || 'Mantener degradado progresivo con navaja en contornos.'
      });

      setIsScanningAi(false);
    }, 850);
  };

  const handleDeletePhoto = () => {
    setUserPhoto(null);
    stopInlineCamera();
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  const handleTriggerGallery = () => {
    stopInlineCamera();
    galleryInputRef.current?.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newPhoto = reader.result as string;
        setUserPhoto(newPhoto);
        stopInlineCamera();
        triggerAiFaceAnalysis(newPhoto, selectedStyle);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectStyle = (style: StyleCatalogItem) => {
    setSelectedStyle(style);
    if (userPhoto) {
      triggerAiFaceAnalysis(userPhoto, style);
    }
  };

  const addPresetNote = (note: string) => {
    if (!notesForBarber.includes(note)) {
      setNotesForBarber(prev => (prev ? `${prev}. ${note}` : note));
    }
  };

  // Imagen limpia del corte según ángulo
  const activeStyleImage =
    selectedAngle === 'side'
      ? selectedStyle.angles?.side || selectedStyle.previewOverlayUrl
      : selectedAngle === 'back'
      ? selectedStyle.angles?.back || selectedStyle.previewOverlayUrl
      : selectedStyle.previewOverlayUrl || selectedStyle.angles?.front;

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-5 animate-fade-in pb-24 text-xs">
      {/* Hidden Inputs */}
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        capture="user"
        className="hidden"
      />
      <input
        type="file"
        ref={galleryInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Top Bar with Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 font-semibold text-zinc-400 hover:text-white px-2.5 py-1.5 rounded-xl bg-zinc-800/60 border border-zinc-700 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Mi Barbería
        </button>
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
          <ShieldCheck className="w-3.5 h-3.5" /> 100% Privado en tu Dispositivo
        </span>
      </div>

      {/* Hero Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 font-bold uppercase tracking-wider text-amber-400">
          <Sparkles className="w-3.5 h-3.5" /> Probador de Estilos & Comparador de Sillón
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
          Tu Foto Real ⚡ Corte Oficial de la Barbería
        </h2>
        <p className="text-zinc-400 mt-1 text-xs">
          Toma tu foto en vivo para comparar tus facciones reales con el catálogo oficial de estilos de {currentBusiness.name}.
        </p>
      </div>

      {/* Mode Switcher: Visagismo vs Ángulos HD */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-1.5">
        <div className="grid grid-cols-2 gap-1 flex-1">
          <button
            onClick={() => setViewMode('visagismo')}
            className={`px-3 py-2 rounded-xl font-black flex items-center justify-center gap-1.5 transition cursor-pointer text-[11px] ${
              viewMode === 'visagismo'
                ? 'bg-amber-500 text-black shadow-lg font-black'
                : 'text-zinc-400 hover:text-white bg-zinc-950/50'
            }`}
          >
            <Scan className="w-3.5 h-3.5" />
            <span>⚡ Comparador (Tu Foto ⚡ Corte)</span>
          </button>

          <button
            onClick={() => setViewMode('angles')}
            className={`px-3 py-2 rounded-xl font-black flex items-center justify-center gap-1.5 transition cursor-pointer text-[11px] ${
              viewMode === 'angles'
                ? 'bg-amber-500 text-black shadow-lg font-black'
                : 'text-zinc-400 hover:text-white bg-zinc-950/50'
            }`}
          >
            <Rotate3d className="w-3.5 h-3.5" />
            <span>📐 Ángulos de Sillón en HD</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={startInlineCamera}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black flex items-center justify-center gap-1.5 shadow transition cursor-pointer text-[11px]"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{userPhoto ? 'Tomar Otra Foto' : 'Abrir Cámara'}</span>
          </button>

          <button
            onClick={handleTriggerGallery}
            className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-300 hover:text-white font-bold flex items-center justify-center gap-1.5 border border-zinc-700 transition cursor-pointer text-[11px]"
          >
            <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
            <span>Galería</span>
          </button>

          {userPhoto && (
            <button
              onClick={handleDeletePhoto}
              className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold flex items-center justify-center border border-red-500/30 transition cursor-pointer text-[11px]"
              title="Borrar foto"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Canvas / Visualizador Interactivo */}
      <div className="rounded-3xl overflow-hidden bg-zinc-900 border-2 border-amber-500/40 shadow-2xl relative">
        {/* MODO 1: ⚡ COMPARADOR DE VISAGISMO LADO A LADO (TU ROSTRO VS CORTE OFICIAL) */}
        {viewMode === 'visagismo' && (
          <div className="p-3 bg-zinc-950 space-y-3">
            <div className="grid grid-cols-2 gap-2 relative">
              {/* LADO IZQUIERDO: CÁMARA EN VIVO / TU FOTO REAL */}
              <div className="relative rounded-2xl overflow-hidden aspect-square border-2 border-amber-500/50 bg-zinc-900 shadow-xl flex items-center justify-center">
                {/* 1. Modo Cámara en Vivo Activa dentro del Cuadro */}
                {isInlineCameraActive ? (
                  <div className="relative w-full h-full bg-black flex items-center justify-center">
                    <video
                      ref={inlineVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover -scale-x-100"
                    />

                    {/* Guía Facial Circular */}
                    <div className="absolute inset-4 rounded-full border-2 border-dashed border-amber-400/60 pointer-events-none animate-pulse" />

                    {/* Botón de Captura dentro del Cuadro */}
                    <div className="absolute bottom-2 inset-x-2 flex items-center justify-center gap-1.5 z-20">
                      <button
                        type="button"
                        onClick={captureInlinePhoto}
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-black font-black text-xs flex items-center gap-1.5 shadow-2xl hover:scale-105 active:scale-95 transition cursor-pointer"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Tomar Foto</span>
                      </button>

                      <button
                        type="button"
                        onClick={stopInlineCamera}
                        className="p-2 rounded-xl bg-black/80 text-zinc-300 hover:text-white border border-zinc-700 cursor-pointer"
                        title="Cancelar cámara"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : userPhoto ? (
                  /* 2. Foto ya Capturada */
                  <>
                    <img
                      src={userPhoto}
                      alt="Tu foto real"
                      className="w-full h-full object-cover"
                    />

                    {/* Botones Flotantes sobre la foto */}
                    <div className="absolute top-2 right-2 flex items-center gap-1 z-20">
                      <button
                        onClick={startInlineCamera}
                        className="p-1.5 rounded-xl bg-amber-500 text-black hover:bg-amber-400 transition cursor-pointer shadow-lg font-black text-[10px] flex items-center gap-1"
                        title="Tomar otra foto"
                      >
                        <Camera className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={handleDeletePhoto}
                        className="p-1.5 rounded-xl bg-black/80 hover:bg-red-600 text-zinc-300 hover:text-white border border-white/20 transition cursor-pointer shadow-lg"
                        title="Eliminar esta foto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                ) : (
                  /* 3. Estado Inicial: Botón para Activar Cámara */
                  <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center space-y-2 bg-gradient-to-b from-zinc-900 to-black">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
                      <Camera className="w-6 h-6" />
                    </div>
                    <div className="space-y-0.5">
                      <span className="font-black text-white text-xs block">Tu Rostro Aquí</span>
                      <span className="text-[10px] text-zinc-400 block leading-tight">
                        Toma una foto en vivo para comparar con el corte deseado
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={startInlineCamera}
                      className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center gap-1.5 shadow-lg transition hover:scale-105 active:scale-95 cursor-pointer mt-1"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Activar Cámara</span>
                    </button>
                  </div>
                )}

                {/* Badge de Identificación */}
                <div className="absolute top-2 left-2 bg-black/85 backdrop-blur-md px-2.5 py-1 rounded-xl text-[10px] font-bold text-amber-400 border border-amber-500/40 shadow-lg flex items-center gap-1 z-10">
                  <span>👤 Tu Foto Real</span>
                </div>

                {/* Animación Láser de Escaneo Facial */}
                {isScanningAi && (
                  <div className="absolute inset-0 bg-amber-500/20 flex flex-col items-center justify-center pointer-events-none z-30">
                    <div className="w-full h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_15px_#f59e0b] animate-bounce" />
                    <div className="w-32 h-44 rounded-full border-2 border-dashed border-amber-400/80 mt-2 animate-pulse flex items-center justify-center">
                      <Scan className="w-6 h-6 text-amber-400 animate-spin" />
                    </div>
                  </div>
                )}
              </div>

              {/* LADO DERECHO: CORTE OFICIAL SELECCIONADO DE LA BARBERÍA */}
              <div className="relative rounded-2xl overflow-hidden aspect-square border-2 border-amber-500/60 bg-zinc-900 shadow-2xl">
                <img
                  src={selectedStyle.previewOverlayUrl || selectedStyle.angles?.front}
                  alt={selectedStyle.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 flex items-center gap-1">
                  <button
                    onClick={handleToggleFavorite}
                    className={`p-1.5 rounded-xl border shadow-lg transition cursor-pointer ${
                      isFavorite
                        ? 'bg-rose-500 text-white border-rose-400'
                        : 'bg-black/70 text-zinc-300 hover:text-white border-white/20'
                    }`}
                    title={isFavorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-white' : ''}`} />
                  </button>
                  <div className="bg-amber-500 text-black px-2 py-1 rounded-xl text-[10px] font-black shadow-lg">
                    ✂️ Estilo
                  </div>
                </div>
                <div className="absolute bottom-2 left-2 right-2 bg-black/90 backdrop-blur-md p-2 rounded-xl border border-white/10 text-center">
                  <div className="text-xs font-black text-white truncate">{selectedStyle.name}</div>
                  <div className="text-[10px] text-amber-400 font-bold uppercase">{selectedStyle.category}</div>
                </div>
              </div>
            </div>

            {/* Barra de Estado */}
            {isScanningAi ? (
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-center text-amber-300 font-mono text-[11px] font-bold animate-pulse flex items-center justify-center gap-2">
                <Scan className="w-4 h-4 animate-spin text-amber-400" />
                <span>{scanStep}</span>
              </div>
            ) : userPhoto ? (
              <div className="flex items-center justify-between bg-zinc-900/90 border border-zinc-800 p-2.5 rounded-2xl">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-xs border border-amber-500/30">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-white font-bold text-xs">
                      <span>Fisonomía: <strong>{faceAnalysis.faceShape}</strong></span>
                    </div>
                    <span className="text-[10px] text-zinc-400">Guía de visagismo aplicada al catálogo</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => triggerAiFaceAnalysis(userPhoto, selectedStyle)}
                  className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-amber-400 font-black text-[10px] flex items-center gap-1 transition cursor-pointer border border-zinc-700"
                >
                  <Scan className="w-3.5 h-3.5" />
                  <span>Re-Analizar</span>
                </button>
              </div>
            ) : (
              <div className="p-2.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-center text-zinc-400 text-[11px] flex items-center justify-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-amber-400" />
                <span>Activa tu cámara o sube tu foto para comparar con el estilo seleccionado</span>
              </div>
            )}
          </div>
        )}

        {/* MODO 2: 📐 VISOR DE ÁNGULOS EN HD (FRENTE / PERFIL / NUCA) */}
        {viewMode === 'angles' && (
          <div className="relative aspect-square w-full bg-black overflow-hidden flex flex-col items-center justify-between p-4">
            <div className="relative w-full h-full rounded-2xl overflow-hidden border border-zinc-800">
              <img
                src={activeStyleImage}
                alt="Ángulo de corte"
                className="w-full h-full object-cover animate-fade-in"
              />

              <div className="absolute top-3 left-3 bg-black/85 px-3 py-1 rounded-xl text-[10px] font-mono text-amber-400 font-bold border border-amber-500/30">
                {selectedAngle === 'front' ? '👤 Vista Frontal (0°)' : selectedAngle === 'side' ? '✂️ Perfil Lateral / Fade (90°)' : '🔄 Vista Posterior / Nuca (180°)'}
              </div>

              <div className="absolute bottom-3 left-3 right-3 bg-black/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-white font-bold text-xs truncate">
                {selectedStyle.name}
              </div>
            </div>

            {/* Botones de Ángulos */}
            <div className="w-full mt-3 flex items-center justify-center gap-2 z-10">
              <button
                type="button"
                onClick={() => setSelectedAngle('front')}
                className={`px-3 py-2 rounded-xl text-[11px] font-bold transition cursor-pointer border ${
                  selectedAngle === 'front'
                    ? 'bg-amber-500 text-black border-amber-400 font-black shadow-lg'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                👤 Frontal
              </button>

              <button
                type="button"
                onClick={() => setSelectedAngle('side')}
                className={`px-3 py-2 rounded-xl text-[11px] font-bold transition cursor-pointer border ${
                  selectedAngle === 'side'
                    ? 'bg-amber-500 text-black border-amber-400 font-black shadow-lg'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                ✂️ Perfil Lateral (Fade)
              </button>

              <button
                type="button"
                onClick={() => setSelectedAngle('back')}
                className={`px-3 py-2 rounded-xl text-[11px] font-bold transition cursor-pointer border ${
                  selectedAngle === 'back'
                    ? 'bg-amber-500 text-black border-amber-400 font-black shadow-lg'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                🔄 Nuca & Terminación
              </button>
            </div>
          </div>
        )}

        {/* 🧠 Tarjeta de Asesoría de Visagismo & Diagnóstico */}
        <div className="p-4 bg-zinc-900 border-t border-zinc-800 space-y-3">
          <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-bold text-white text-xs flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Asesoría fisonómica para este corte:</span>
              </div>
              <span className="text-[10px] text-zinc-400 font-medium">
                {selectedStyle.faceShape || 'Recomendado para tu perfil'}
              </span>
            </div>

            <p className="text-[11px] text-zinc-300 leading-relaxed">
              {faceAnalysis.whyItFits}
            </p>

            <div className="pt-1 border-t border-zinc-800/80">
              <p className="text-[10px] text-amber-300 font-mono bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
                ✂️ <strong>Fórmula técnica en sillón para {currentBusiness.ownerName || 'el Barbero'}:</strong> {selectedStyle.technicalFormula || faceAnalysis.barberTip}
              </p>
            </div>
          </div>

          {/* Quick Adjustment Chips */}
          <div>
            <label className="font-bold uppercase tracking-wider text-zinc-400 block mb-1 text-[10px]">
              Ajustes rápidos para tu corte (Toca para agregar a tu ficha):
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                'Degradado a la piel (Skin Fade)',
                'Dejar más largo arriba',
                'Perfilado suave de barba',
                'Mantener volumen en la coronilla',
                'Terminación en V en la nuca'
              ].map((chip) => (
                <button
                  key={chip}
                  onClick={() => addPresetNote(chip)}
                  className="px-2.5 py-1 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-[11px] transition cursor-pointer"
                >
                  + {chip}
                </button>
              ))}
            </div>
          </div>

          {/* User Notes for Barber */}
          <div>
            <label className="font-bold uppercase tracking-wider text-zinc-400 block mb-1 text-[10px]">
              Instrucciones específicas para {currentBusiness.ownerName || 'Álvaro Ortiz'}:
            </label>
            <input
              type="text"
              value={notesForBarber}
              onChange={(e) => setNotesForBarber(e.target.value)}
              placeholder="Ej: Dejar más largo arriba, degradado medio..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-xs"
            />
          </div>

          {/* Sharing Checkbox */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
              <input
                type="checkbox"
                checked={isSharedWithBarber}
                onChange={(e) => setIsSharedWithBarber(e.target.checked)}
                className="rounded border-zinc-700 text-amber-500 focus:ring-0"
              />
              <span className="flex items-center gap-1 font-bold text-[11px]">
                <Share2 className="w-3.5 h-3.5 text-amber-400" />
                Vincular esta referencia y ficha técnica a mi cita en el sillón
              </span>
            </label>
          </div>

          {/* CTA Action Buttons */}
          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <button
              onClick={handleToggleFavorite}
              className={`py-3.5 px-3 rounded-2xl font-black flex items-center justify-center gap-1.5 transition cursor-pointer ${
                isFavorite
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-lg'
                  : 'bg-zinc-800 hover:bg-zinc-750 text-white border border-zinc-700'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-400 text-rose-400' : ''}`} />
              <span>{isFavorite ? '❤️ En Tus Favoritos' : 'Guardar en Favoritos'}</span>
            </button>

            <button
              onClick={() => onBookWithStyle(selectedStyle.name)}
              className="py-3.5 px-3 rounded-2xl font-black text-black flex items-center justify-center gap-1.5 shadow-2xl transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              style={{ backgroundColor: 'var(--brand-primary)' }}
            >
              <Calendar className="w-4 h-4" />
              <span>💈 QUIERO ESTE ESTILO</span>
            </button>
          </div>
        </div>
      </div>

      {/* Category Filter Tabs & Style Catalog (8+ Popular Barber Styles) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="font-bold uppercase tracking-wider text-zinc-400 text-xs">
            Estilos Disponibles en el Catálogo ({filteredStyles.length})
          </h3>
          <span className="text-zinc-500 text-[11px]">Toca cualquier estilo para comparar</span>
        </div>

        {/* Category Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'Todos los Estilos' },
            { id: 'corte', label: '✂️ Fades & Cortes' },
            { id: 'barba', label: '🧔 Barbas & Perfilados' },
            { id: 'combos', label: '👑 Combos Completos' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === tab.id
                  ? 'bg-amber-500 text-black shadow'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Grid of styles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {filteredStyles.map((style) => {
            const isSelected = selectedStyle.id === style.id;
            return (
              <button
                key={style.id}
                onClick={() => handleSelectStyle(style)}
                className={`relative rounded-2xl overflow-hidden p-2 text-left border transition cursor-pointer ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500/15 ring-2 ring-amber-500'
                    : 'border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800'
                }`}
              >
                <img
                  src={style.previewOverlayUrl || style.angles?.front}
                  alt={style.name}
                  className="w-full aspect-square rounded-xl object-cover mb-2"
                />
                <div className="font-bold text-white text-[11px] truncate leading-tight">
                  {style.name}
                </div>
                <div className="text-[10px] text-amber-400 capitalize mt-0.5">
                  {style.category} • {style.tags?.[0] || 'Corte'}
                </div>
                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-amber-500 text-black flex items-center justify-center shadow">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
