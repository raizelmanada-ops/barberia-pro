import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, Check, X, Image as ImageIcon, AlertCircle, Trash2, ChevronLeft } from 'lucide-react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmPhoto: (dataUrl: string) => void;
  onDeletePhoto?: () => void;
  hasExistingPhoto?: boolean;
  title?: string;
  subtitle?: string;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onConfirmPhoto,
  onDeletePhoto,
  hasExistingPhoto = false,
  title = 'Foto de Memoria de Estilo',
  subtitle = 'Toma una foto en vivo o selecciona una imagen desde tu galería.',
}) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  // Detener la cámara y liberar hardware
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  // Iniciar la cámara en vivo asegurando montaje del video
  const startCamera = async (facing: 'user' | 'environment' = cameraFacing) => {
    setErrorMessage(null);
    setCapturedImage(null);
    stopCamera();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        nativeCameraInputRef.current?.click();
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1280, min: 640 },
          height: { ideal: 960, min: 480 },
        },
        audio: false,
      });

      streamRef.current = stream;
      setCameraActive(true);

      setTimeout(() => {
        if (videoRef.current && streamRef.current) {
          videoRef.current.srcObject = streamRef.current;
          videoRef.current.play().catch((err) => {
            console.warn('Error al reproducir video stream:', err);
          });
        }
      }, 50);

      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((d) => d.kind === 'videoinput');
        setHasMultipleCameras(videoDevices.length > 1);
      } catch {
        /* ignore */
      }
    } catch (err: unknown) {
      console.warn('Error al iniciar cámara web directa:', err);
      setErrorMessage('Abriendo cámara de tu dispositivo...');
      setTimeout(() => {
        nativeCameraInputRef.current?.click();
      }, 300);
    }
  };

  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraActive]);

  const handleToggleCamera = () => {
    const nextFacing = cameraFacing === 'user' ? 'environment' : 'user';
    setCameraFacing(nextFacing);
    startCamera(nextFacing);
  };

  const handleCaptureSnapshot = () => {
    if (!videoRef.current) return;
    setIsCapturing(true);

    try {
      const video = videoRef.current;
      const width = video.videoWidth || video.clientWidth || 640;
      const height = video.videoHeight || video.clientHeight || 480;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (cameraFacing === 'user') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        setCapturedImage(dataUrl);
        stopCamera();
      }
    } catch (err) {
      console.error('Error capturando imagen:', err);
      setErrorMessage('Error al procesar la instantánea. Usa la cámara de tu dispositivo.');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera(cameraFacing);
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onConfirmPhoto(capturedImage);
      handleClose();
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col w-full h-[100dvh] overflow-hidden animate-fade-in text-zinc-100 sm:bg-black/85 sm:backdrop-blur-md sm:flex sm:items-center sm:justify-center sm:p-4">
      <div className="w-full h-full sm:h-auto sm:max-w-md bg-zinc-900 sm:border sm:border-zinc-700 sm:rounded-3xl flex flex-col justify-between p-4 sm:p-5 shadow-2xl overflow-y-auto">
        
        {/* Cabecera Superior Fija */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 sm:hidden flex items-center justify-center cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Camera className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white leading-tight">{title}</h3>
              <p className="text-xs text-zinc-400">{subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center text-xs font-bold transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mensaje de aviso */}
        {errorMessage && (
          <div className="my-2 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Visor de Cámara / Preview de Imagen (Grande y sin espacios muertos) */}
        <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-black border border-zinc-800 flex items-center justify-center shadow-inner my-auto shrink-0">
          
          {/* 1. Vista de Foto Capturada */}
          {capturedImage ? (
            <div className="w-full h-full relative">
              <img src={capturedImage} alt="Captura" className="w-full h-full object-cover" />
              <div className="absolute top-2.5 left-2.5 bg-emerald-500 text-black px-2.5 py-1 rounded-lg text-xs font-black uppercase flex items-center gap-1 shadow">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Foto Capturada</span>
              </div>
            </div>
          ) : cameraActive ? (
            /* 2. Stream en vivo */
            <div className="w-full h-full relative bg-zinc-950 flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                onLoadedMetadata={(e) => {
                  (e.target as HTMLVideoElement).play().catch(() => {});
                }}
                className={`w-full h-full object-cover ${cameraFacing === 'user' ? 'scale-x-[-1]' : ''}`}
              />
              
              {hasMultipleCameras && (
                <button
                  type="button"
                  onClick={handleToggleCamera}
                  className="absolute top-3 right-3 p-2.5 rounded-full bg-black/75 hover:bg-black text-white border border-white/20 transition cursor-pointer shadow z-20"
                  title="Cambiar cámara"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}

              <div className="absolute inset-4 border border-dashed border-amber-400/40 rounded-2xl pointer-events-none flex items-end justify-center pb-2 z-10">
                <span className="text-xs bg-black/75 px-3 py-1 rounded-full text-amber-300 font-semibold shadow">
                  Centra el corte en el encuadre
                </span>
              </div>
            </div>
          ) : (
            /* 3. Estado Inicial */
            <div className="text-center p-6 space-y-3">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-amber-400 shadow-xl">
                <Camera className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white uppercase tracking-wider">Tu Foto de Estilo</h4>
                <p className="text-xs text-zinc-300 max-w-xs mx-auto mt-1 leading-relaxed">
                  Toma una foto en vivo para registrar tu corte o sube una imagen de referencia desde tu galería.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Acciones Inferiores */}
        <div className="space-y-2 pt-3 shrink-0">
          {capturedImage ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleRetake}
                  className="py-3.5 px-3 rounded-2xl bg-zinc-800 hover:bg-zinc-750 text-zinc-200 font-bold flex items-center justify-center gap-2 border border-zinc-700 transition cursor-pointer text-xs sm:text-sm shadow"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Repetir Foto</span>
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="py-3.5 px-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black flex items-center justify-center gap-2 transition shadow-lg cursor-pointer text-xs sm:text-sm"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Aceptar y Guardar</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setCapturedImage(null)}
                className="w-full py-2.5 px-3 rounded-2xl bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-red-400 font-bold flex items-center justify-center gap-2 border border-zinc-800 transition cursor-pointer text-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Descartar esta captura</span>
              </button>
            </div>
          ) : cameraActive ? (
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={stopCamera}
                className="py-3.5 px-3 rounded-2xl bg-zinc-800 hover:bg-zinc-750 text-zinc-300 font-bold transition cursor-pointer text-xs sm:text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isCapturing}
                onClick={handleCaptureSnapshot}
                className="py-3.5 px-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black flex items-center justify-center gap-2 transition shadow-lg cursor-pointer text-xs sm:text-sm"
              >
                <Camera className="w-4 h-4 stroke-[2.5]" />
                <span>{isCapturing ? 'Capturando...' : 'Tomar Foto'}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => startCamera('user')}
                className="w-full py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black flex items-center justify-center gap-2 transition shadow-xl cursor-pointer text-xs sm:text-sm"
              >
                <Camera className="w-4 h-4 stroke-[2.5]" />
                <span>📸 Tomar Foto en Vivo</span>
              </button>

              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="w-full py-3.5 px-4 rounded-2xl bg-zinc-800 hover:bg-zinc-750 text-white font-bold flex items-center justify-center gap-2 border border-zinc-700 transition cursor-pointer text-xs sm:text-sm shadow"
              >
                <ImageIcon className="w-4 h-4 text-amber-400" />
                <span>🖼️ Elegir desde la Galería</span>
              </button>

              {hasExistingPhoto && onDeletePhoto && (
                <button
                  type="button"
                  onClick={() => {
                    onDeletePhoto();
                    handleClose();
                  }}
                  className="w-full py-2.5 px-3 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 font-bold flex items-center justify-center gap-2 border border-red-500/30 transition cursor-pointer text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar Foto Guardada de mi Memoria</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Inputs ocultos */}
        <input
          type="file"
          ref={nativeCameraInputRef}
          accept="image/*"
          capture="user"
          onChange={handleFileInputChange}
          className="hidden"
        />
        <input
          type="file"
          ref={galleryInputRef}
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>
    </div>
  );
};
