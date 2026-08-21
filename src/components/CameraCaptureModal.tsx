import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, Check, X, Image as ImageIcon, AlertCircle } from 'lucide-react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmPhoto: (dataUrl: string) => void;
  title?: string;
  subtitle?: string;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onConfirmPhoto,
  title = 'Captura de Foto de Estilo',
  subtitle = 'Toma una foto en vivo o selecciona una imagen desde la galería de tu dispositivo.',
}) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  // Detener la cámara y liberar recursos
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // Iniciar la cámara en vivo con permisos
  const startCamera = async (facing: 'user' | 'environment' = cameraFacing) => {
    setErrorMessage(null);
    setCapturedImage(null);
    stopCamera();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Tu navegador o dispositivo no soporta acceso directo a la cámara.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setCameraActive(true);

      // Detectar si hay más de una cámara (móvil frontal/trasera)
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === 'videoinput');
      setHasMultipleCameras(videoDevices.length > 1);
    } catch (err: unknown) {
      console.warn('Error al iniciar cámara:', err);
      const msg = err instanceof Error ? err.message : 'No se pudo acceder a la cámara.';
      setErrorMessage(
        msg.includes('NotAllowedError') || msg.includes('Permission')
          ? 'Permiso de cámara denegado. Puedes subir una foto desde tu galería.'
          : 'Cámara no disponible. Puedes seleccionar una foto desde tu galería.'
      );
      setCameraActive(false);
    }
  };

  // Alternar entre cámara frontal y trasera
  const handleToggleCamera = () => {
    const nextFacing = cameraFacing === 'user' ? 'environment' : 'user';
    setCameraFacing(nextFacing);
    startCamera(nextFacing);
  };

  // Tomar instantánea
  const handleCaptureSnapshot = () => {
    if (!videoRef.current) return;
    setIsCapturing(true);

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Efecto espejo si es cámara frontal
        if (cameraFacing === 'user') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(dataUrl);
        stopCamera();
      }
    } catch (err) {
      console.error('Error capturando imagen:', err);
      setErrorMessage('Error al capturar la imagen. Intenta de nuevo.');
    } finally {
      setIsCapturing(false);
    }
  };

  // Repetir fotografía
  const handleRetake = () => {
    setCapturedImage(null);
    startCamera(cameraFacing);
  };

  // Confirmar y enviar foto seleccionada/capturada
  const handleConfirm = () => {
    if (capturedImage) {
      onConfirmPhoto(capturedImage);
      handleClose();
    }
  };

  // Subir desde galería local
  const handleGalleryFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setCapturedImage(result);
        stopCamera();
      };
      reader.readAsDataURL(file);
    }
  };

  // Cerrar y limpiar
  const handleClose = () => {
    stopCamera();
    setCapturedImage(null);
    setErrorMessage(null);
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedImage(null);
      setErrorMessage(null);
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, stopCamera]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-3xl p-5 space-y-4 shadow-2xl animate-fade-in text-zinc-100">
        
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Camera className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-white">{title}</h3>
              <p className="text-[10px] text-zinc-400">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center text-xs font-bold transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mensaje de error si falla la cámara */}
        {errorMessage && (
          <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Visor de Cámara / Preview de Imagen / Opciones Iniciales */}
        <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-black border border-zinc-800 flex items-center justify-center shadow-inner">
          
          {/* 1. Vista de Foto Capturada (Revisión) */}
          {capturedImage ? (
            <div className="w-full h-full relative">
              <img src={capturedImage} alt="Captura" className="w-full h-full object-cover" />
              <div className="absolute top-2 left-2 bg-emerald-500 text-black px-2 py-0.5 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 shadow">
                <Check className="w-3 h-3 stroke-[3]" />
                <span>Foto Lista</span>
              </div>
            </div>
          ) : cameraActive ? (
            /* 2. Stream en vivo de la Cámara */
            <div className="w-full h-full relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${cameraFacing === 'user' ? 'scale-x-[-1]' : ''}`}
              />
              
              {/* Botón cambiar cámara si hay múltiple */}
              {hasMultipleCameras && (
                <button
                  onClick={handleToggleCamera}
                  className="absolute top-3 right-3 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 transition cursor-pointer shadow"
                  title="Cambiar cámara"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}

              {/* Guía visual para centrado */}
              <div className="absolute inset-4 border border-dashed border-amber-400/40 rounded-2xl pointer-events-none flex items-end justify-center pb-2">
                <span className="text-[10px] bg-black/60 px-2 py-0.5 rounded text-amber-300 font-semibold">
                  Centra el estilo en el encuadre
                </span>
              </div>
            </div>
          ) : (
            /* 3. Estado Inicial / Opciones */
            <div className="text-center p-6 space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-amber-400">
                <Camera className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Elige el método de captura</h4>
                <p className="text-[11px] text-zinc-400 max-w-xs mx-auto mt-1">
                  Usa la cámara en vivo para capturar tu corte al instante o selecciona una foto desde tu galería.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Acciones del Modal */}
        <div className="space-y-2 pt-1">
          {capturedImage ? (
            /* Acciones al tener una foto lista para guardar */
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleRetake}
                className="py-3 px-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold flex items-center justify-center gap-2 border border-zinc-700 transition cursor-pointer text-xs"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Repetir Foto</span>
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="py-3 px-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black flex items-center justify-center gap-2 transition shadow cursor-pointer text-xs"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Aceptar y Guardar</span>
              </button>
            </div>
          ) : cameraActive ? (
            /* Botón Disparador de Cámara */
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={stopCamera}
                className="py-3 px-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold transition cursor-pointer text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isCapturing}
                onClick={handleCaptureSnapshot}
                className="py-3 px-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black flex items-center justify-center gap-2 transition shadow cursor-pointer text-xs"
              >
                <Camera className="w-4 h-4 stroke-[2.5]" />
                <span>{isCapturing ? 'Capturando...' : 'Tomar Foto'}</span>
              </button>
            </div>
          ) : (
            /* Botones de Selección Inicial: Cámara o Galería */
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => startCamera('user')}
                className="w-full py-3 px-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black flex items-center justify-center gap-2 transition shadow cursor-pointer text-xs"
              >
                <Camera className="w-4 h-4 stroke-[2.5]" />
                <span>📸 Tomar Foto con la Cámara</span>
              </button>

              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="w-full py-3 px-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold flex items-center justify-center gap-2 border border-zinc-700 transition cursor-pointer text-xs"
              >
                <ImageIcon className="w-4 h-4 text-amber-400" />
                <span>🖼️ Elegir desde la Galería</span>
              </button>
            </div>
          )}
        </div>

        {/* Input oculto para galería */}
        <input
          type="file"
          ref={galleryInputRef}
          accept="image/*"
          onChange={handleGalleryFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
};
