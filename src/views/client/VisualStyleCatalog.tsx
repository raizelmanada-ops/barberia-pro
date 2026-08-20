import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useTenant } from '../../core/tenant/TenantContext';
import { StyleCatalogService } from '../../core/services/styleCatalogService';
import { StyleCatalogItem } from '../../core/types';
import {
  Scissors,
  Heart,
  Search,
  Check,
  Calendar,
  Camera,
  ArrowLeft,
  SlidersHorizontal,
  Flame,
  UserCheck,
  Rotate3d,
  Sparkles,
  Play,
  Pause,
  Smile,
  Zap
} from 'lucide-react';

interface VisualStyleCatalogProps {
  onBack: () => void;
  onSelectStyle: (style: StyleCatalogItem) => void;
  onTryOnStyle: (style: StyleCatalogItem) => void;
}

export const VisualStyleCatalog: React.FC<VisualStyleCatalogProps> = ({
  onBack,
  onSelectStyle,
  onTryOnStyle
}) => {
  const { currentBusiness } = useTenant();
  const favoritesStorageKey = `barberia_favs_${currentBusiness.id}`;

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

  const [activeCategory, setActiveCategory] = useState<'all' | 'ninos' | 'corte' | 'disenos' | 'barba' | 'combo'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [hairTypeFilter, setHairTypeFilter] = useState<'todos' | 'liso' | 'ondulado' | 'afro'>('todos');
  const [selectedStyleDetail, setSelectedStyleDetail] = useState<StyleCatalogItem | null>(null);
  const [activeAngle, setActiveAngle] = useState<'front' | 'side' | 'back' | '3d'>('3d');
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(false);
  const autoRotateIntervalRef = useRef<any>(null);

  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(favoritesStorageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(favoritesStorageKey, JSON.stringify(favorites));
    } catch (e) {
      console.warn('Error saving favorites to localStorage', e);
    }
  }, [favorites, favoritesStorageKey]);

  // Auto-rotation effect in 3D mode
  useEffect(() => {
    if (isAutoRotating && activeAngle === '3d') {
      autoRotateIntervalRef.current = setInterval(() => {
        setRotationAngle(prev => (prev >= 360 ? 0 : prev + 2));
      }, 50);
    } else {
      if (autoRotateIntervalRef.current) {
        clearInterval(autoRotateIntervalRef.current);
      }
    }
    return () => {
      if (autoRotateIntervalRef.current) clearInterval(autoRotateIntervalRef.current);
    };
  }, [isAutoRotating, activeAngle]);

  const toggleFavorite = (e: React.MouseEvent, styleId: string) => {
    e.stopPropagation();
    setFavorites(prev =>
      prev.includes(styleId) ? prev.filter(id => id !== styleId) : [...prev, styleId]
    );
  };

  const filteredStyles = useMemo(() => {
    return catalogStyles.filter(style => {
      if (activeCategory !== 'all') {
        if (activeCategory === 'ninos') {
          const isForKids = style.tags.some(t => ['niños', 'kids', 'escolar'].includes(t.toLowerCase())) || style.targetAudience === 'ninos';
          if (!isForKids) return false;
        } else if (activeCategory === 'disenos') {
          const hasDesign = style.tags.some(t => ['diseño', 'líneas', 'freestyle'].includes(t.toLowerCase()));
          if (!hasDesign) return false;
        } else if (style.category !== activeCategory) {
          return false;
        }
      }
      if (showOnlyFavorites && !favorites.includes(style.id)) {
        return false;
      }
      if (hairTypeFilter !== 'todos') {
        const matchesTag = style.tags.some(tag =>
          tag.toLowerCase().includes(hairTypeFilter.toLowerCase())
        );
        const matchesDesc = style.description.toLowerCase().includes(hairTypeFilter.toLowerCase());
        const matchesHairType = style.hairType === hairTypeFilter || style.hairType === 'todos';
        if (!matchesTag && !matchesDesc && !matchesHairType) {
          return false;
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = style.name.toLowerCase().includes(q);
        const matchesDesc = style.description.toLowerCase().includes(q);
        const matchesTags = style.tags.some(t => t.toLowerCase().includes(q));
        if (!matchesName && !matchesDesc && !matchesTags) {
          return false;
        }
      }
      return true;
    });
  }, [activeCategory, showOnlyFavorites, favorites, hairTypeFilter, searchQuery]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 space-y-5 animate-fade-in pb-28 text-xs">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 font-semibold text-zinc-400 hover:text-white px-2.5 py-1.5 rounded-xl bg-zinc-800/60 border border-zinc-700 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Mi Barbería
        </button>

        <button
          onClick={() => setShowOnlyFavorites(prev => !prev)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold border transition cursor-pointer ${
            showOnlyFavorites
              ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
              : 'bg-zinc-800/60 text-zinc-400 border-zinc-700 hover:text-white'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${showOnlyFavorites ? 'fill-rose-500 text-rose-500' : ''}`} />
          <span>Favoritos ({favorites.length})</span>
        </button>
      </div>

      {/* Hero Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 font-bold uppercase tracking-wider text-amber-400">
          <Rotate3d className="w-3.5 h-3.5" /> Biblioteca Oficial de Cortes de Barbería & Visor 3D
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
          Cortes Reales en Sillón de Barbería
        </h2>
        <p className="text-zinc-400 mt-1">
          Fotografías 100% de barbería profesional. Toca cualquier estilo para inspeccionarlo en 360°, ver el visagismo y reservarlo con Álvaro Ortiz.
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar cortes, fades, niños, barbas (ej: El Siete, Burst Fade, Crop)..."
          className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-10 pr-4 py-3 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition text-xs shadow-inner"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs font-bold cursor-pointer"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Category Tabs: TODOS / NIÑOS / CORTES / DISEÑOS / BARBAS / COMBOS */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {[
          { id: 'all', label: `Todos (${catalogStyles.length})`, icon: null },
          { id: 'ninos', label: '👦 Niños & Kids', icon: Smile },
          { id: 'corte', label: '✂️ Fades & Cortes', icon: Scissors },
          { id: 'disenos', label: '⚡ Diseños & Líneas', icon: Zap },
          { id: 'barba', label: '🧔 Barbas', icon: UserCheck },
          { id: 'combo', label: '👑 Combos', icon: Flame }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveCategory(tab.id as any); setShowOnlyFavorites(false); }}
            className={`py-2 px-3 rounded-xl font-bold whitespace-nowrap flex items-center gap-1.5 transition cursor-pointer ${
              activeCategory === tab.id && !showOnlyFavorites
                ? 'bg-amber-500 text-black shadow-lg'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            {tab.icon && <tab.icon className="w-3.5 h-3.5" />}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Hair Type Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-[11px] font-bold text-zinc-500 shrink-0 flex items-center gap-1">
          <SlidersHorizontal className="w-3 h-3" /> Tipo de Cabello:
        </span>
        {[
          { id: 'todos', label: 'Todos' },
          { id: 'liso', label: 'Liso / Fino' },
          { id: 'ondulado', label: 'Ondulado' },
          { id: 'afro', label: 'Rizado / Afro' }
        ].map(filter => (
          <button
            key={filter.id}
            onClick={() => setHairTypeFilter(filter.id as any)}
            className={`px-3 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition cursor-pointer ${
              hairTypeFilter === filter.id
                ? 'bg-zinc-700 text-amber-400 border border-amber-500/30'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Style Grid Results (Only Pure Professional Barbershop Photos) */}
      {filteredStyles.length === 0 ? (
        <div className="text-center py-12 bg-zinc-900/40 rounded-3xl border border-zinc-800 space-y-3">
          <Scissors className="w-8 h-8 text-zinc-600 mx-auto" />
          <p className="text-zinc-400 font-bold">No se encontraron estilos con los filtros seleccionados.</p>
          <button
            onClick={() => { setActiveCategory('all'); setSearchQuery(''); setHairTypeFilter('todos'); setShowOnlyFavorites(false); }}
            className="px-4 py-2 rounded-xl bg-zinc-800 text-amber-400 font-bold hover:bg-zinc-700 transition cursor-pointer"
          >
            Restablecer Filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filteredStyles.map(style => {
            const isFav = favorites.includes(style.id);
            return (
              <div
                key={style.id}
                onClick={() => {
                  setSelectedStyleDetail(style);
                  setActiveAngle('3d');
                  setRotationAngle(0);
                  setIsAutoRotating(false);
                }}
                className="group relative bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg hover:border-amber-500/50 transition cursor-pointer flex flex-col justify-between"
              >
                <div className="relative aspect-square w-full overflow-hidden bg-zinc-950">
                  <img
                    src={style.previewOverlayUrl}
                    alt={style.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    loading="lazy"
                  />
                  <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-lg text-[9px] font-bold text-amber-400 border border-amber-500/20 uppercase flex items-center gap-1">
                    <Rotate3d className="w-2.5 h-2.5" />
                    <span>360° 3D</span>
                  </div>

                  <button
                    onClick={(e) => toggleFavorite(e, style.id)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 backdrop-blur-md flex items-center justify-center text-zinc-400 hover:text-rose-500 transition cursor-pointer border border-white/10"
                  >
                    <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                  </button>
                </div>

                <div className="p-3 space-y-1.5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-extrabold text-white text-xs leading-tight group-hover:text-amber-400 transition">
                      {style.name}
                    </h3>
                    <p className="text-[10px] text-zinc-400 line-clamp-2 mt-0.5">
                      {style.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-zinc-800/80 flex items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectStyle(style);
                      }}
                      className="flex-1 py-1.5 px-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-[11px] flex items-center justify-center gap-1 transition shadow cursor-pointer"
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                      <span>Quiero este</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onTryOnStyle(style);
                      }}
                      title="Probar con mi foto"
                      className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5 text-amber-400" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Style Detail & Interactive 3D / 360° Viewer Modal */}
      {selectedStyleDetail && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-end sm:items-center justify-center p-3 animate-fade-in overflow-y-auto">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-3xl overflow-hidden shadow-2xl space-y-4 my-auto">
            {/* Top Bar of Modal */}
            <div className="p-4 pb-0 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Rotate3d className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-white">{selectedStyleDetail.name}</h3>
                  <span className="text-[10px] text-amber-400 font-bold uppercase">{selectedStyleDetail.category}</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedStyleDetail(null)}
                className="w-7 h-7 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center text-xs font-bold transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* 3D / 360° Interactive Canvas */}
            <div className="relative aspect-square w-full bg-zinc-950 flex items-center justify-center overflow-hidden perspective-[1000px] border-y border-zinc-800">
              <div
                className="relative w-full h-full flex items-center justify-center transition-transform duration-100 ease-out"
                style={{
                  transform:
                    activeAngle === '3d'
                      ? `rotateY(${rotationAngle}deg) rotateX(${Math.sin((rotationAngle * Math.PI) / 180) * 8}deg) scale(0.95)`
                      : 'none',
                  transformStyle: 'preserve-3d'
                }}
              >
                <img
                  src={selectedStyleDetail.previewOverlayUrl}
                  alt={selectedStyleDetail.name}
                  className="w-full h-full object-cover rounded-2xl shadow-2xl"
                  style={{
                    filter: `brightness(${1 + Math.cos((rotationAngle * Math.PI) / 180) * 0.15})`
                  }}
                />

                {activeAngle === '3d' && (
                  <div className="absolute inset-0 border-2 border-amber-500/30 rounded-2xl pointer-events-none shadow-[inset_0_0_30px_rgba(245,158,11,0.2)] flex items-center justify-center">
                    <div className="absolute bottom-3 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-amber-400 border border-amber-500/40">
                      Giro: {Math.round(rotationAngle)}° / 360°
                    </div>
                  </div>
                )}
              </div>

              <div className="absolute top-3 right-3 flex items-center gap-2">
                <button
                  onClick={() => setIsAutoRotating(prev => !prev)}
                  className="px-2.5 py-1 rounded-xl bg-black/80 backdrop-blur-md text-zinc-200 hover:text-white border border-white/20 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition shadow"
                >
                  {isAutoRotating ? <Pause className="w-3 h-3 text-amber-400" /> : <Play className="w-3 h-3 text-amber-400" />}
                  <span>{isAutoRotating ? 'Pausar' : 'Giro Auto'}</span>
                </button>
              </div>
            </div>

            {/* 3D Rotation Slider Control */}
            <div className="px-5 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-zinc-400">
                <span className="flex items-center gap-1 text-amber-400">
                  <Rotate3d className="w-3.5 h-3.5" />
                  Control de Rotación 360° (Desliza para girar):
                </span>
                <span>{Math.round(rotationAngle)}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                value={rotationAngle}
                onChange={(e) => {
                  setRotationAngle(Number(e.target.value));
                  setIsAutoRotating(false);
                }}
                className="w-full accent-amber-500 h-2 bg-zinc-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Modal Technical Details & Visagism */}
            <div className="px-5 space-y-3">
              <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2 text-[11px]">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">Asesoría de Visagismo:</span>
                    <span className="text-zinc-400">{selectedStyleDetail.faceShape || selectedStyleDetail.description}</span>
                  </div>
                </div>

                {selectedStyleDetail.technicalFormula && (
                  <div className="flex items-start gap-2 pt-1 border-t border-zinc-900">
                    <Scissors className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white block">Fórmula de Sillón para Álvaro:</span>
                      <span className="text-zinc-400">{selectedStyleDetail.technicalFormula}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {selectedStyleDetail.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-lg bg-zinc-800 text-zinc-400 text-[10px] font-semibold"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-2 pb-1">
                <button
                  onClick={() => {
                    const style = selectedStyleDetail;
                    setSelectedStyleDetail(null);
                    onTryOnStyle(style);
                  }}
                  className="py-3 px-3 rounded-2xl bg-zinc-800 hover:bg-zinc-750 text-white font-bold flex items-center justify-center gap-1.5 border border-zinc-700 transition cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-amber-400" />
                  <span>Probar en Mi Foto</span>
                </button>

                <button
                  onClick={() => {
                    const style = selectedStyleDetail;
                    setSelectedStyleDetail(null);
                    onSelectStyle(style);
                  }}
                  className="py-3 px-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-black flex items-center justify-center gap-1.5 shadow-xl transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Quiero este (Reservar)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
