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
  Layers
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

  // Resetear categoría al cambiar de pestaña entre Cabello y Barba
  const handleDomainChange = (domain: StyleDomain) => {
    setActiveDomain(domain);
    setSelectedCategory('todas');
    setActiveModalIndex(null);
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
      setActiveModalIndex((prev) => (prev! > 0 ? prev! - 1 : filteredStyles.length - 1));
    }
  }, [activeModalIndex, filteredStyles.length]);

  const handleNextStyle = useCallback(() => {
    if (activeModalIndex !== null && filteredStyles.length > 0) {
      setActiveModalIndex((prev) => (prev! < filteredStyles.length - 1 ? prev! + 1 : 0));
    }
  }, [activeModalIndex, filteredStyles.length]);

  const handleCloseModal = () => {
    setActiveModalIndex(null);
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
    <div className="space-y-6 animate-fade-in text-zinc-100">
      
      {/* 1. Cabecera Principal */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-inner">
              <Sparkles className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
              Biblioteca Visual de Estilos
            </h1>
          </div>
          {onBack && (
            <button
              onClick={onBack}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-bold text-xs flex items-center gap-1 transition cursor-pointer border border-zinc-700"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Volver</span>
            </button>
          )}
        </div>
        <p className="text-zinc-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
          Catálogo visual de referencias de corte y barbería. Selecciona cualquier diseño para inspeccionar sus características y solicitarlo en tu cita.
        </p>
      </div>


      {/* 2. Pestañas Principales: Estilos de Cabello vs Estilos de Barba */}
      <div className="flex p-1 bg-zinc-900/90 border border-zinc-800 rounded-2xl max-w-md shadow-lg">
        <button
          onClick={() => handleDomainChange('cabello')}
          className={`flex-1 py-2.5 px-4 rounded-xl font-black text-xs transition flex items-center justify-center gap-2 cursor-pointer ${
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
          className={`flex-1 py-2.5 px-4 rounded-xl font-black text-xs transition flex items-center justify-center gap-2 cursor-pointer ${
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
      <div className="space-y-3">
        {/* Buscador */}
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Buscar en ${activeDomain === 'cabello' ? 'cortes (ej: Siete, Fade, Crop, Pompadour)' : 'barbas (ej: Boxed, Garibaldi, Van Dyke)'}...`}
            className="w-full bg-zinc-900/90 border border-zinc-800 rounded-2xl pl-10 pr-4 py-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 transition text-xs shadow-inner"
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
          <span className="text-[11px] font-bold text-zinc-500 shrink-0 mr-1 flex items-center gap-1">
            <SlidersHorizontal className="w-3 h-3 text-amber-400" />
            Filtrar:
          </span>
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap text-[11px] transition cursor-pointer border ${
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

      {/* 4. Cuadrícula Responsive de Miniaturas (Móvil: 2 cols, Tablet: 3 cols, Escritorio: 4 cols) */}
      {filteredStyles.length === 0 ? (
        <div className="text-center py-16 bg-zinc-900/30 rounded-3xl border border-zinc-800/60 p-6 space-y-3">
          <Scissors className="w-10 h-10 text-zinc-600 mx-auto" />
          <h3 className="text-sm font-bold text-zinc-300">No se encontraron estilos</h3>
          <p className="text-zinc-500 text-xs">Prueba con otro término de búsqueda o selecciona otra categoría.</p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedCategory('todas'); }}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-amber-400 font-bold rounded-xl transition cursor-pointer text-xs"
          >
            Ver todos los estilos
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {filteredStyles.map((style, index) => {
            const isSelected = selectedStyleId === style.id;
            return (
              <div
                key={style.id}
                onClick={() => setActiveModalIndex(index)}
                className={`group relative bg-zinc-900/90 border rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl hover:border-amber-500/50 transition-all duration-300 flex flex-col justify-between cursor-pointer ${
                  isSelected ? 'border-amber-500 ring-1 ring-amber-500/40' : 'border-zinc-800'
                }`}
              >
                {/* Contenedor de Miniatura con Dimensiones Definidas y Lazy Loading */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-950 flex items-center justify-center border-b border-zinc-800/60">
                  {/* Imagen Real con Lazy Loading */}
                  <img
                    src={style.thumbnail}
                    alt={style.name}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 z-0"
                  />

                  {/* Placeholder elegante cuando la foto está en preparación */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center bg-gradient-to-b from-zinc-900 to-zinc-950 pointer-events-none -z-0">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 mb-1.5 shadow-inner group-hover:scale-110 group-hover:border-amber-400 transition">
                      <Scissors className="w-5 h-5 stroke-[2]" />
                    </div>
                    <span className="text-[10px] font-black text-white uppercase tracking-wider line-clamp-1">{style.name}</span>
                    <span className="text-[8px] text-amber-400/80 font-bold uppercase mt-0.5">{style.category}</span>
                  </div>

                  {/* Badge de Categoría */}
                  <div className="absolute top-2.5 left-2.5 bg-black/85 backdrop-blur-md px-2.5 py-1 rounded-xl text-[9px] font-extrabold text-amber-400 border border-amber-500/30 uppercase tracking-wider z-10 shadow">
                    {style.category}
                  </div>

                  {isSelected && (
                    <div className="absolute top-2.5 right-2.5 bg-amber-500 text-black px-2.5 py-1 rounded-xl text-[9px] font-black uppercase flex items-center gap-1 shadow-lg z-10">
                      <Check className="w-3 h-3 stroke-[3]" />
                      <span>Elegido</span>
                    </div>
                  )}

                  {/* Overlay sutil al pasar cursor */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5 sm:p-3 z-10 pointer-events-none">
                    <span className="text-[10px] font-extrabold text-amber-300 flex items-center gap-1">
                      <Eye className="w-3 h-3" /> Ver estilo
                    </span>
                  </div>
                </div>

                {/* Información de la Tarjeta */}
                <div className="p-3 sm:p-4 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-extrabold text-white text-xs sm:text-sm group-hover:text-amber-400 transition leading-snug">
                      {style.name}
                    </h3>
                    <p className="text-[10px] sm:text-[11px] text-zinc-400 line-clamp-2 mt-0.5 leading-relaxed">
                      {style.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-[10px] text-zinc-400">
                    <div className="flex items-center gap-1 text-zinc-400 font-semibold">
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span>{style.duration}</span>
                    </div>
                    <span className="font-bold text-amber-400 group-hover:translate-x-0.5 transition flex items-center gap-0.5">
                      Ver estilo <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Modal de Vista Ampliada e Inspección de Estilo */}
      {activeStyle && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div
            className="w-full max-w-2xl bg-zinc-900 border border-zinc-700/80 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera del Modal */}
            <div className="p-4 flex items-center justify-between border-b border-zinc-800 bg-zinc-900/95 sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Scissors className="w-4 h-4" />
                </span>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-white tracking-wide">
                    {activeStyle.name}
                  </h2>
                  <span className="text-[10px] text-amber-400 font-bold uppercase">
                    {activeStyle.category}
                  </span>
                </div>
              </div>

              {/* Botón Cerrar */}
              <button
                onClick={handleCloseModal}
                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center text-xs font-bold transition cursor-pointer border border-zinc-700"
                title="Cerrar (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cuerpo del Modal con Fotografía y Navegadores */}
            <div className="overflow-y-auto p-4 sm:p-5 space-y-4 flex-1">
              
              {/* Contenedor Principal de la Imagen */}
              <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 flex items-center justify-center shadow-inner group">
                <img
                  src={activeStyle.image}
                  alt={activeStyle.name}
                  decoding="async"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                  className="w-full h-full object-contain z-0"
                />

                {/* Placeholder de Respaldo si no hay imagen física */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-zinc-900 via-zinc-950 to-zinc-950 -z-0 pointer-events-none">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3 shadow-lg">
                    <Scissors className="w-7 h-7 stroke-[2]" />
                  </div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">{activeStyle.name}</h3>
                  <span className="text-[10px] text-amber-400 font-bold uppercase mt-1">{activeStyle.category}</span>
                  <p className="text-[10px] text-zinc-500 max-w-xs mt-1">
                    Referencia técnica para tu cita de corte o barbería.
                  </p>
                </div>

                {/* Botón Anterior */}
                <button
                  onClick={handlePrevStyle}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/75 hover:bg-amber-500 hover:text-black text-white border border-white/20 hover:border-amber-400 flex items-center justify-center transition shadow-xl cursor-pointer"
                  title="Estilo anterior (Flecha Izquierda)"
                >
                  <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
                </button>

                {/* Botón Siguiente */}
                <button
                  onClick={handleNextStyle}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/75 hover:bg-amber-500 hover:text-black text-white border border-white/20 hover:border-amber-400 flex items-center justify-center transition shadow-xl cursor-pointer"
                  title="Estilo siguiente (Flecha Derecha)"
                >
                  <ChevronRight className="w-5 h-5 stroke-[2.5]" />
                </button>

                {/* Indicador de posición */}
                <div className="absolute bottom-2.5 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-zinc-300 border border-white/10">
                  {activeModalIndex! + 1} de {filteredStyles.length}
                </div>
              </div>

              {/* Ficha Técnica y Especificaciones del Estilo */}
              <div className="space-y-3">
                <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800/80 space-y-1.5">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Descripción del Estilo
                  </h4>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {activeStyle.description}
                  </p>
                </div>

                {activeStyle.technicalFormula && (
                  <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800/80 space-y-1.5">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-amber-400" />
                      Fórmula Técnica del Barbero
                    </h4>
                    <p className="text-xs text-zinc-300 leading-relaxed font-mono">
                      {activeStyle.technicalFormula}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80 flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block uppercase font-bold">Tiempo en Sillón</span>
                      <span className="font-bold text-white text-xs">{activeStyle.duration}</span>
                    </div>
                  </div>

                  <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80 flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block uppercase font-bold">Mantenimiento</span>
                      <span className="font-bold text-white text-xs">{activeStyle.maintenance}</span>
                    </div>
                  </div>
                </div>

                {activeStyle.faceShape && (
                  <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80 flex items-center gap-2 text-xs text-zinc-400">
                    <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Visagismo: <strong>{activeStyle.faceShape}</strong></span>
                  </div>
                )}
              </div>
            </div>

            {/* Pie del Modal con Acción de Selección */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-900/95 flex items-center justify-between gap-3">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-750 transition cursor-pointer"
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
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-black text-black bg-amber-500 hover:bg-amber-400 shadow-lg shadow-amber-500/25 transition cursor-pointer flex items-center justify-center gap-1.5"
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
