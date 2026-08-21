// ==========================================================================
// BARBERIA_PRO - Galería Oficial de Estilos de Barba
// Alto Rendimiento, Lazy Loading, Grilla Responsive & Navegación Modal
// ==========================================================================

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  OFFICIAL_BEARD_STYLES,
  BEARD_CATEGORIES,
  BeardStyle
} from '../../database/beardStylesData';
import {
  Search,
  ArrowLeft,
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  Calendar,
  Check,
  Eye,
  Scissors,
  Sparkles,
  SlidersHorizontal
} from 'lucide-react';

interface VisualStyleCatalogProps {
  onBack: () => void;
  onSelectStyle?: (style: BeardStyle) => void;
}

export const VisualStyleCatalog: React.FC<VisualStyleCatalogProps> = ({
  onBack,
  onSelectStyle
}) => {
  const [styles] = useState<BeardStyle[]>(OFFICIAL_BEARD_STYLES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  
  // Modal de visualización ampliada
  const [activeModalIndex, setActiveModalIndex] = useState<number | null>(null);
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null);

  // Filtrado de estilos
  const filteredStyles = useMemo(() => {
    return styles.filter((style) => {
      // Filtro por categoría
      if (selectedCategory !== 'todas' && style.categoryKey !== selectedCategory) {
        return false;
      }
      // Filtro por buscador
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = style.name.toLowerCase().includes(query);
        const matchesDesc = style.description.toLowerCase().includes(query);
        const matchesCat = style.category.toLowerCase().includes(query);
        if (!matchesName && !matchesDesc && !matchesCat) return false;
      }
      return true;
    });
  }, [styles, selectedCategory, searchQuery]);

  const activeStyle = activeModalIndex !== null ? filteredStyles[activeModalIndex] : null;

  // Navegación anterior / siguiente dentro del modal
  const handlePrevStyle = useCallback(() => {
    if (activeModalIndex === null) return;
    setActiveModalIndex((prev) => (prev! > 0 ? prev! - 1 : filteredStyles.length - 1));
  }, [activeModalIndex, filteredStyles.length]);

  const handleNextStyle = useCallback(() => {
    if (activeModalIndex === null) return;
    setActiveModalIndex((prev) => (prev! < filteredStyles.length - 1 ? prev! + 1 : 0));
  }, [activeModalIndex, filteredStyles.length]);

  const handleCloseModal = useCallback(() => {
    setActiveModalIndex(null);
  }, []);

  // Navegación con teclado (Flechas izq/der y Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeModalIndex === null) return;
      if (e.key === 'ArrowLeft') handlePrevStyle();
      if (e.key === 'ArrowRight') handleNextStyle();
      if (e.key === 'Escape') handleCloseModal();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModalIndex, handlePrevStyle, handleNextStyle, handleCloseModal]);

  const handleChooseStyle = (style: BeardStyle) => {
    setSelectedStyleId(style.id);
    handleCloseModal();
    if (onSelectStyle) {
      onSelectStyle(style);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 px-3 sm:px-6 py-4 max-w-7xl mx-auto space-y-6 animate-fade-in pb-28 text-xs select-none">
      
      {/* 1. Barra de Navegación Superior */}
      <div className="flex items-center justify-between border-b border-zinc-850 pb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 font-bold text-zinc-400 hover:text-white px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-amber-400" />
          <span>Regresar</span>
        </button>

        <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Galería Oficial</span>
        </div>
      </div>

      {/* 2. Encabezado de la Galería */}
      <div className="space-y-1">
        <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight">
          ESTILOS DE BARBA
        </h1>
        <p className="text-zinc-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
          Catálogo visual de referencias y diseños. Selecciona cualquier miniatura para inspeccionar las diferentes vistas del estilo.
        </p>
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
            placeholder="Buscar por estilo (ej: Boxed, Garibaldi, Fade, Van Dyke)..."
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
          {BEARD_CATEGORIES.map((cat) => (
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
                  {/* Imagen Real (si existe) */}
                  <img
                    src={style.thumbnail}
                    alt={style.name}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      // Ocultar imagen rota limpiamente para que quede visible el placeholder de lujo
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 z-0"
                  />

                  {/* Placeholder estético premium cuando la imagen aún no se ha subido */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-gradient-to-b from-zinc-900 to-zinc-950 pointer-events-none -z-0">
                    <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 mb-2 shadow-inner group-hover:scale-110 group-hover:border-amber-400 transition">
                      <Scissors className="w-5 h-5 stroke-[2]" />
                    </div>
                    <span className="text-[10px] font-black text-white uppercase tracking-wider line-clamp-1">{style.name}</span>
                    <span className="text-[9px] text-zinc-500 mt-0.5 font-semibold">Foto Oficial 4:3</span>
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
                      <Eye className="w-3 h-3" /> Ver detalles
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

                  <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                    <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      {style.duration}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveModalIndex(index);
                      }}
                      className="px-2.5 py-1 rounded-xl bg-zinc-800 group-hover:bg-amber-500 group-hover:text-black text-zinc-200 text-[10px] font-extrabold transition cursor-pointer flex items-center gap-1"
                    >
                      <span>Ver estilo</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Modal de Vista Ampliada con Navegación Anterior / Siguiente */}
      {activeStyle && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in"
          onClick={handleCloseModal}
        >
          {/* Contenedor del Modal (click inside no cierra) */}
          <div
            className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-750 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] my-auto"
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

            {/* Cuerpo del Modal con Fotografía en Alta Resolución y Navegadores */}
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

                {/* Placeholder de Lujo para Modal */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-zinc-900 via-zinc-950 to-zinc-950 -z-0 pointer-events-none">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3 shadow-lg">
                    <Scissors className="w-7 h-7 stroke-[2]" />
                  </div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">{activeStyle.name}</h3>
                  <span className="text-[10px] text-amber-400 font-bold uppercase mt-1">{activeStyle.category}</span>
                  <p className="text-[10px] text-zinc-500 max-w-xs mt-1">
                    Vistas oficiales (Frontal, Lateral y Posterior) listas para renderizar.
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

                {/* Indicador de posición (ej: 3 / 12) */}
                <div className="absolute bottom-2.5 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-zinc-300 border border-white/10">
                  {activeModalIndex! + 1} de {filteredStyles.length}
                </div>
              </div>

              {/* Ficha Técnica del Estilo */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-400" /> Tiempo estimado
                  </span>
                  <span className="text-xs font-black text-white block">
                    {activeStyle.duration}
                  </span>
                </div>

                <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-amber-400" /> Mantenimiento
                  </span>
                  <span className="text-xs font-black text-white block">
                    {activeStyle.maintenance}
                  </span>
                </div>
              </div>

              {/* Descripción */}
              <div className="p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-1 text-xs">
                <span className="text-[10px] font-extrabold uppercase text-amber-400 block tracking-wider">
                  Detalles del Estilo
                </span>
                <p className="text-zinc-300 leading-relaxed">
                  {activeStyle.description}
                </p>
              </div>
            </div>

            {/* Pie del Modal con Botón Principal */}
            <div className="p-4 pt-3 border-t border-zinc-800 bg-zinc-900/95 flex items-center gap-3">
              <button
                onClick={handleCloseModal}
                className="py-3 px-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition cursor-pointer border border-zinc-700"
              >
                Cerrar
              </button>

              <button
                onClick={() => handleChooseStyle(activeStyle)}
                className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Quiero este estilo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
