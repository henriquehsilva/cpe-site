import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Search, Camera, Calendar, ImageOff } from 'lucide-react';
import { getPublicPhotos, Photo } from '../services/photosService';

interface GalleryProps {
  onClose: () => void;
}

const PAGE_SIZE = 12;

function formatDate(d: Date) {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Skeleton ──────────────────────────────────────────────
function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="aspect-square rounded-2xl bg-cpe-gray/25 animate-pulse"
          style={{ animationDelay: `${i * 60}ms` }}
        />
      ))}
    </div>
  );
}

// ── Photo Card ────────────────────────────────────────────
function PhotoCard({ photo, onClick }: { photo: Photo; onClick: () => void }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <button
      onClick={onClick}
      className="group relative aspect-square rounded-2xl overflow-hidden bg-cpe-gray/20 focus:outline-none focus:ring-2 focus:ring-cpe-gold transition-transform duration-300 hover:scale-[1.02] hover:shadow-2xl"
    >
      {!loaded && (
        <div className="absolute inset-0 bg-cpe-gray/25 animate-pulse" />
      )}
      <img
        src={photo.imageUrl}
        alt={photo.titulo || 'Foto CPE Anápolis'}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute bottom-0 left-0 right-0 p-3 text-left">
          {photo.titulo && (
            <p className="text-white text-sm font-semibold leading-tight line-clamp-2">{photo.titulo}</p>
          )}
          <p className="text-gray-300 text-xs mt-1 flex items-center gap-1">
            <Calendar size={10} />
            {formatDate(photo.createdAt)}
          </p>
        </div>
      </div>
    </button>
  );
}

// ── Lightbox ──────────────────────────────────────────────
interface LightboxProps {
  photos: Photo[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

function Lightbox({ photos, index, onClose, onNavigate }: LightboxProps) {
  const photo = photos[index];
  const hasPrev = index > 0;
  const hasNext = index < photos.length - 1;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasPrev) onNavigate(index - 1);
      if (e.key === 'ArrowRight' && hasNext) onNavigate(index + 1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [index, hasPrev, hasNext, onClose, onNavigate]);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/96"
      style={{ zIndex: 60 }}
      onClick={onClose}
    >
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4" style={{ zIndex: 61 }}>
        <span className="text-white/50 text-sm">{index + 1} / {photos.length}</span>
        <button
          onClick={onClose}
          className="text-white/60 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
        >
          <X size={24} />
        </button>
      </div>

      {/* Prev */}
      {hasPrev && (
        <button
          onClick={e => { e.stopPropagation(); onNavigate(index - 1); }}
          className="absolute left-4 text-white/60 hover:text-white transition-colors p-3 rounded-full hover:bg-white/10"
          style={{ zIndex: 61 }}
        >
          <ChevronLeft size={36} />
        </button>
      )}

      {/* Image container */}
      <div
        className="flex flex-col items-center gap-4 px-16 max-w-[90vw] max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <img
          src={photo.imageUrl}
          alt={photo.titulo || 'Foto CPE Anápolis'}
          className="max-h-[78vh] max-w-full object-contain rounded-xl shadow-2xl"
        />
        {(photo.titulo || photo.descricao) && (
          <div className="text-center max-w-lg">
            {photo.titulo && (
              <p className="text-white font-semibold text-base">{photo.titulo}</p>
            )}
            {photo.descricao && (
              <p className="text-gray-400 text-sm mt-1">{photo.descricao}</p>
            )}
            <p className="text-gray-600 text-xs mt-2 flex items-center justify-center gap-1">
              <Calendar size={10} /> {formatDate(photo.createdAt)}
            </p>
          </div>
        )}
      </div>

      {/* Next */}
      {hasNext && (
        <button
          onClick={e => { e.stopPropagation(); onNavigate(index + 1); }}
          className="absolute right-4 text-white/60 hover:text-white transition-colors p-3 rounded-full hover:bg-white/10"
          style={{ zIndex: 61 }}
        >
          <ChevronRight size={36} />
        </button>
      )}
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────
function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-28 text-center">
      <div className="w-20 h-20 rounded-full bg-cpe-gray/20 flex items-center justify-center mb-6">
        <ImageOff size={36} className="text-cpe-gray/60" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">
        {hasSearch ? 'Nenhuma foto encontrada' : 'Nenhuma foto publicada'}
      </h3>
      <p className="text-gray-500 text-sm max-w-xs">
        {hasSearch
          ? 'Tente buscar por outro termo.'
          : 'As fotos da galeria aparecerão aqui quando publicadas.'}
      </p>
    </div>
  );
}

// ── Gallery (main) ────────────────────────────────────────
export default function Gallery({ onClose }: GalleryProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    getPublicPhotos()
      .then(setPhotos)
      .catch(() => setError('Erro ao carregar fotos. Tente novamente.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = photos.filter(p =>
    !search || p.titulo.toLowerCase().includes(search.toLowerCase()),
  );
  const visible = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = visible.length < filtered.length;

  const openLightbox = useCallback((idx: number) => setLightboxIndex(idx), []);
  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  return (
    <div className="fixed inset-0 z-50 bg-cpe-dark flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-cpe-gray/30 bg-cpe-dark/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Camera size={22} className="text-cpe-gold" />
            <span className="text-white font-bold text-lg">Galeria de Fotos</span>
            {!loading && (
              <span className="text-gray-500 text-sm hidden sm:block">
                — {filtered.length} foto{filtered.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-cpe-gray/30"
            aria-label="Fechar galeria"
          >
            <X size={22} />
          </button>
        </div>
      </header>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Search */}
          <div className="relative mb-8 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar por título..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-cpe-gray/20 border border-cpe-gray/30 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-cpe-gold/60 transition-colors"
            />
          </div>

          {/* Content */}
          {loading ? (
            <SkeletonGrid />
          ) : error ? (
            <div className="text-center py-20 text-gray-500">{error}</div>
          ) : filtered.length === 0 ? (
            <EmptyState hasSearch={!!search} />
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {visible.map((photo, i) => (
                  <PhotoCard
                    key={photo.id}
                    photo={photo}
                    onClick={() => openLightbox(i)}
                  />
                ))}
              </div>

              {hasMore && (
                <div className="text-center mt-10">
                  <button
                    onClick={() => setPage(p => p + 1)}
                    className="px-8 py-3 border border-cpe-gold/30 text-cpe-gold hover:bg-cpe-gold/10 hover:border-cpe-gold/60 rounded-xl transition-colors text-sm font-medium"
                  >
                    Carregar mais ({filtered.length - visible.length} restantes)
                  </button>
                </div>
              )}
            </>
          )}

          <p className="text-center text-gray-700 text-xs mt-16 pb-4">
            CPE Anápolis · 31ª CIPM/CPE
          </p>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <Lightbox
          photos={visible}
          index={lightboxIndex}
          onClose={closeLightbox}
          onNavigate={setLightboxIndex}
        />
      )}
    </div>
  );
}
