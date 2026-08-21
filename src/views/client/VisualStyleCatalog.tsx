import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Search,
  SlidersHorizontal,
  Scissors,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Eye,
  ShieldCheck,
  HelpCircle,
  Layers,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import {
  VisualStyleItem,
  StyleDomain,
  HAIR_CATEGORIES,
  BEARD_CATEGORIES,
  OFFICIAL_STYLES_LIBRARY
} from '../../database/stylesLibraryData';

interface VisualStyleCatalogProps {
  onBack?: () => void;
  onSelectStyle?: (style: VisualStyleItem) => void;
  selectedStyleId?: string | null;
  defaultDomain?: StyleDomain;
}

// Componente de Imagen con carga reactiva y z-index garantizado
const LazyStyleImage: React.FC<{
  src: string;
  alt: string;
  name: string;
  category: string;
  isModal?: boolean;
  isZoomed?: boolean;
  onToggleZoom?: () => void;
}> = ({ src, alt, name, category, isModal = false, isZoomed = false, onToggleZoom }) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Resetear estados al cambiar de estilo
  useEffect(() => {
    setHasError(false);
    setIsLoaded(false);
  }, [src]);

  return (
    <div
      onClick={isModal ? onToggleZoom : undefined}
      className={`relative aspect-[4/3] w-full overflow-hidden bg-zinc-950 flex items-center justify-center ${
        isModal ? 'cursor-zoom-in' : 'border-b border-zinc-800/60'
      }`}
    >
      {/* 1. Placeholder que solo se muestra si hay error o mientras carga */}
      {(!isLoaded || hasError) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-gradient-to-b from-zinc-900 to-zinc-950 z-0">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 mb-2 shadow-inner">
            <Scissors className="w-6 h-6 stroke-[2]" />
          </div>
          <span className="text-xs font-black text-white uppercase tracking-wider line-clamp-1">{name}</span>
          <span className="text-[11px] text-amber-400 font-bold uppercase mt-0.5">{category}</span>
        </div>
      )}

      {/* 2. Imagen Real en Z-INDEX 10 con soporte de Zoom */}
      {!hasError && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={`w-full h-full ${
            isModal
              ? isZoomed
                ? 'scale-150 cursor-zoom-out object-contain'
                : 'object-contain cursor-zoom-in'
              : 'object-cover group-hover:scale-105'
          } transition-all duration-500 relative z-10 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      {isModal && isLoaded && (
        <div className="absolute top-2.5 right-2.5 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-xl text-[10px] sm:text-xs font-bold text-zinc-200 border border-white/10 z-20 flex items-center gap-1 pointer-events-none shadow-lg">
          {isZoomed ? <ZoomOut className="w-3.5 h-3.5 text-amber-400" /> : <ZoomIn className="w-3.5 h-3.5 text-amber-400" />}
          <span>{isZoomed ? 'Alejar' : 'Toca para Zoom'}</span>
        </div>
      )}
    </div>
  );
};

export const VisualStyleCatalog: React.FC<VisualStyleCatalogProps> = ({
  onBack,
  onSelectStyle,
  selectedStyleId,
  defaultDomain = 'cabello',
}) => {
  const [activeDomain, setActiveDomain] = useState<StyleDomain>(defaultDomain);
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModalIndex, setActiveModalIndex] = useState<number | null>(null);
  const [isModalZoomed, setIsModalZoomed] = useState(false);

  // Garantizar que al abrir la galería siempre inicie en la parte superior absoluta
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  // Resetear categoría al cambiar de pestaña entre Cabello y Barba
  const handleDomainChange = (domain: StyleDomain) => {
    setActiveDomain(domain);
    setSelectedCategory('todas');
    setActiveModalIndex(null);
    setIsModalZoomed(false);
  };

  const categories = activeDomain === 'cabello' ? HAIR_CATEGORIES : BEARD_CATEGORIES;

  // Filtrado reactivo por dominio, categoría y búsqueda
  const filteredStyles = useMemo(() => {
    return OFFICIAL_STYLES_LIBRARY.filter((style) => {
      // 1. Filtro por dominio (Cabello o Barba)
      if (style.domain !== activeDomain) return false;

      // 2. Filtro por categoría seleccionada
      if (selectedCategory !== 'todas' && style.categoryKey !== selectedCategory) {
        return false;
      }

      // 3. Filtro por buscador (nombre, descripción, categoría)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = style.name.toLowerCase().includes(query);
        const matchesDesc = style.description.toLowerCase().includes(query);
        const matchesCat = style.category.toLowerCase().includes(query);
        return matchesName || matchesDesc || matchesCat;
      }

      return true;
    });
  }, [activeDomain, selectedCategory, searchQuery]);

  const activeStyle = activeModalIndex !== null ? filteredStyles[activeModalIndex] : null;

  // Navegación dentro del modal
  const handlePrevStyle = useCallback(() => {
    if (activeModalIndex !== null && filteredStyles.length > 0) {
      setIsModalZoomed(false);
      setActiveModalIndex((prev) => (prev! > 0 ? prev! - 1 : filteredStyles.length - 1));
    }
  }, [activeModalIndex, filteredStyles.length]);

  const handleNextStyle = useCallback(() => {
    if (activeModalIndex !== null && filteredStyles.length > 0) {
      setIsModalZoomed(false);
      setActiveModalIndex((prev) => (prev! < filteredStyles.length - 1 ? prev! + 1 : 0));
    }
  }, [activeModalIndex, filteredStyles.length]);

  const handleCloseModal = () => {
    setActiveModalIndex(null);
    setIsModalZoomed(false);
  };

  // Controles de teclado para el visor
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeModalIndex === null) return;
      if (e.key === 'ArrowLeft') handlePrevStyle();
      if (e.key === 'ArrowRight') handleNextStyle();
      if (e.key === 'Escape') handleCloseModal();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModalIndex, handlePrevStyle, handleNextStyle]);

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2 sm:py-5 space-y-3.5 animate-fade-in text-zinc-100 pb-24">
      
      {/* 1. Cabecera Compacta Móvil */}
      <div className="flex items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-inner shrink-0">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
          </span>
          <div>
            <h1 className="text-base sm:text-xl font-black text-white tracking-tight uppercase leading-tight">
              Biblioteca de Estilos
            </h1>
            <span className="text-[11px] text-zinc-400 font-medium hidden sm:inline-block">
              Selecciona tu diseño para solicitarlo en tu cita
            </span>
          </div>
        </div>

        {onBack && (
          <button
            onClick={onBack}
            className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-bold text-xs sm:text-sm flex items-center gap-1 transition cursor-pointer border border-zinc-700 shadow shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Volver</span>
          </button>
        )}
      </div>

      {/* 2. Pestañas Principales: Cabello vs Barba */}
      <div className="flex p-1 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-lg">
        <button
          onClick={() => handleDomainChange('cabello')}
          className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer ${
            activeDomain === 'cabello'
              ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
          }`}
        >
          <Scissors className="w-4 h-4" />
          <span>Estilos de Cabello</span>
        </button>
        <button
          onClick={() => handleDomainChange('barba')}
          className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer ${
            activeDomain === 'barba'
              ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Estilos de Barba</span>
        </button>
      </div>

      {/* 3. Buscador y Filtros por Categoría */}
      <div className="space-y-2.5">
        {/* Buscador */}
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Buscar en ${activeDomain === 'cabello' ? 'cortes (ej: Taper, Fade, High Top, Curtains)' : 'barbas (ej: Balbo, Van Dyke, Stubble, Groomed)'}...`}
            className="w-full bg-zinc-900/90 border border-zinc-800 rounded-2xl pl-10 pr-4 py-2.5 sm:py-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 transition text-xs sm:text-sm shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-xs font-bold p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Píldoras de Categoría */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] sm:text-xs font-bold text-zinc-400 shrink-0 mr-0.5 flex items-center gap-1">
            <SlidersHorizontal className="w-3 h-3 text-amber-400" />
            Filtrar:
          </span>
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap text-xs transition cursor-pointer border ${
                selectedCategory === cat.key
                  ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border-zinc-800 hover:border-zinc-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Cuadrícula Responsive de Miniaturas */}
      {filteredStyles.length === 0 ? (
        <div className="text-center py-12 bg-zinc-900/30 rounded-3xl border border-zinc-800/60 p-6 space-y-3">
          <Scissors className="w-10 h-10 text-zinc-600 mx-auto" />
          <h3 className="text-sm sm:text-base font-bold text-zinc-200">No se encontraron estilos</h3>
          <p className="text-zinc-400 text-xs">Prueba con otro término de búsqueda o selecciona otra categoría.</p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedCategory('todas'); }}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-amber-400 font-bold rounded-xl transition cursor-pointer text-xs"
          >
            Ver todos los estilos
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 pt-1">
          {filteredStyles.map((style, index) => {
            const isSelected = selectedStyleId === style.id;
            return (
              <div
                key={style.id}
                onClick={() => setActiveModalIndex(index)}
                className={`group relative bg-zinc-900/90 border rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl hover:border-amber-500/50 transition-all duration-300 flex flex-col justify-between cursor-pointer ${
                  isSelected ? 'border-amber-500 ring-2 ring-amber-500/40' : 'border-zinc-800'
                }`}
              >
                {/* Imagen del estilo */}
                <div className="relative">
                  <LazyStyleImage
                    src={style.thumbnail}
                    alt={style.name}
                    name={style.name}
                    category={style.category}
                  />

                  {/* Badge de Categoría */}
                  <div className="absolute top-2 left-2 bg-black/85 backdrop-blur-md px-2 py-0.5 rounded-lg text-[9px] sm:text-[10px] font-extrabold text-amber-400 border border-amber-500/30 uppercase tracking-wider z-20 shadow">
                    {style.category}
                  </div>

                  {isSelected && (
                    <div className="absolute top-2 right-2 bg-amber-500 text-black px-2 py-0.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase flex items-center gap-1 shadow-lg z-20">
                      <Check className="w-3 h-3 stroke-[3]" />
                      <span>Elegido</span>
                    </div>
                  )}

                  {/* Overlay al pasar cursor */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2 sm:p-3 z-20 pointer-events-none">
                    <span className="text-[11px] sm:text-xs font-extrabold text-amber-300 flex items-center gap-1">
                      <Eye className="w-3 h-3" /> Ver estilo
                    </span>
                  </div>
                </div>

                {/* Información de la Tarjeta */}
                <div className="p-2.5 sm:p-3.5 space-y-1.5 sm:space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-black text-white text-xs sm:text-sm group-hover:text-amber-400 transition leading-snug">
                      {style.name}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-zinc-300 line-clamp-2 mt-0.5 leading-relaxed">
                      {style.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1.5 border-t border-zinc-800/80 text-[10px] sm:text-xs text-zinc-400">
                    <div className="flex items-center gap-1 text-zinc-300 font-semibold">
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span>{style.duration}</span>
                    </div>
                    <span className="font-bold text-amber-400 group-hover:translate-x-0.5 transition flex items-center gap-0.5">
                      Ver <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. VISOR DE ESTILO EN PANTALLA COMPLETA NATIVA (100% FULLSCREEN SIN ESPACIO OSCURO ARRIBA) */}
      {activeStyle && (
        <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col w-full h-[100dvh] overflow-hidden animate-fade-in text-zinc-100">
          
          {/* Cabecera Superior Fija */}
          <div className="p-3 sm:p-4 flex items-center justify-between border-b border-zinc-800 bg-zinc-900/95 sticky top-0 z-30 shrink-0">
            <button
              onClick={handleCloseModal}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white flex items-center gap-1 text-xs font-bold transition cursor-pointer border border-zinc-700 shadow"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Volver</span>
            </button>

            <div className="text-center px-2">
              <h2 className="text-sm sm:text-base font-black text-white tracking-wide leading-tight line-clamp-1">
                {activeStyle.name}
              </h2>
              <span className="text-[10px] sm:text-xs text-amber-400 font-bold uppercase">
                {activeStyle.category}
              </span>
            </div>

            <button
              onClick={handleCloseModal}
              className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center text-xs font-bold transition cursor-pointer border border-zinc-700"
              title="Cerrar (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Cuerpo Desplazable de Pantalla Completa con la Foto Gigante en Primer Plano */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3.5 max-w-2xl mx-auto w-full">
            
            {/* Contenedor Principal de la Imagen (Grande, Ocupa todo el ancho sin márgenes oscuros) */}
            <div className="relative group w-full rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 bg-zinc-900">
              <LazyStyleImage
                src={activeStyle.image}
                alt={activeStyle.name}
                name={activeStyle.name}
                category={activeStyle.category}
                isModal={true}
                isZoomed={isModalZoomed}
                onToggleZoom={() => setIsModalZoomed((prev) => !prev)}
              />

              {/* Botón Anterior */}
              <button
                onClick={handlePrevStyle}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/80 hover:bg-amber-500 hover:text-black text-white border border-white/20 hover:border-amber-400 flex items-center justify-center transition shadow-2xl cursor-pointer z-30"
                title="Estilo anterior (Flecha Izquierda)"
              >
                <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
              </button>

              {/* Botón Siguiente */}
              <button
                onClick={handleNextStyle}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/80 hover:bg-amber-500 hover:text-black text-white border border-white/20 hover:border-amber-400 flex items-center justify-center transition shadow-2xl cursor-pointer z-30"
                title="Estilo siguiente (Flecha Derecha)"
              >
                <ChevronRight className="w-5 h-5 stroke-[2.5]" />
              </button>

              {/* Indicador de posición */}
              <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-zinc-200 border border-white/10 z-30 shadow">
                {activeModalIndex! + 1} de {filteredStyles.length}
              </div>
            </div>

            {/* Ficha Técnica y Especificaciones del Estilo */}
            <div className="space-y-2.5 pb-4">
              <div className="bg-zinc-900/90 p-3.5 rounded-2xl border border-zinc-800 space-y-1 shadow">
                <h4 className="text-xs sm:text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Descripción del Estilo
                </h4>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  {activeStyle.description}
                </p>
              </div>

              {activeStyle.technicalFormula && (
                <div className="bg-zinc-900/90 p-3.5 rounded-2xl border border-zinc-800 space-y-1 shadow">
                  <h4 className="text-xs sm:text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    Fórmula Técnica del Barbero
                  </h4>
                  <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-mono">
                    {activeStyle.technicalFormula}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                <div className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-800 flex items-center gap-2.5 shadow">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block uppercase font-bold">Tiempo en Sillón</span>
                    <span className="font-bold text-white text-xs sm:text-sm">{activeStyle.duration}</span>
                  </div>
                </div>

                <div className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-800 flex items-center gap-2.5 shadow">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block uppercase font-bold">Mantenimiento</span>
                    <span className="font-bold text-white text-xs sm:text-sm">{activeStyle.maintenance}</span>
                  </div>
                </div>
              </div>

              {activeStyle.faceShape && (
                <div className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-800 flex items-center gap-2 text-xs sm:text-sm text-zinc-300 shadow">
                  <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Visagismo: <strong className="text-white">{activeStyle.faceShape}</strong></span>
                </div>
              )}
            </div>
          </div>

          {/* Pie Fijo con Botón Gigante "QUIERO ESTE ESTILO" */}
          <div className="p-3 sm:p-4 border-t border-zinc-800 bg-zinc-900/95 sticky bottom-0 z-30 shrink-0">
            <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
              <button
                onClick={handleCloseModal}
                className="px-4 py-3 rounded-xl text-xs sm:text-sm font-bold text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-750 transition cursor-pointer"
              >
                Cerrar
              </button>

              <button
                onClick={() => {
                  if (onSelectStyle) {
                    onSelectStyle(activeStyle);
                  }
                  handleCloseModal();
                }}
                className="flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-black text-black bg-amber-500 hover:bg-amber-400 shadow-xl shadow-amber-500/25 transition cursor-pointer flex items-center justify-center gap-2 active:scale-98"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>QUIERO ESTE ESTILO</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
