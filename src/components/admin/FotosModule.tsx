import { useState, useEffect, useRef, useMemo, DragEvent } from 'react';
import {
  ArrowLeft, Plus, Trash2, Pencil, X, Save, Loader2, Search,
  Upload, ImageOff, AlertCircle, CheckSquare, Square, Camera,
  Eye, EyeOff, Calendar,
} from 'lucide-react';
import {
  Photo, UploadMeta, validateFile, uploadPhoto,
  getAllPhotos, updatePhoto, deletePhoto, deletePhotoBatch,
} from '../../services/photosService';
import { ModulePermission } from '../../types/rbac';
import { useRBAC } from '../../contexts/RBACContext';

interface FotosModuleProps {
  onBack: () => void;
  permissions?: ModulePermission;
}

function formatDate(d: Date) {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

const ACCEPTED = '.jpg,.jpeg,.png,.webp';

// ── Admin Photo Card ──────────────────────────────────────
interface CardProps {
  photo: Photo;
  selected: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
}

function AdminPhotoCard({ photo, selected, canEdit, canDelete, onSelect, onEdit, onDelete, onToggleStatus }: CardProps) {
  const [loaded, setLoaded] = useState(false);
  const isPub = photo.status === 'publicado';

  return (
    <div
      className="group relative rounded-2xl overflow-hidden border transition-all duration-200"
      style={{
        background: 'var(--adm-surface)',
        borderColor: selected ? 'var(--adm-accent)' : 'var(--adm-border)',
        boxShadow: selected ? '0 0 0 2px var(--adm-accent)' : 'none',
      }}
    >
      {/* Thumbnail */}
      <div className="relative aspect-square bg-cpe-gray/20 overflow-hidden">
        {!loaded && <div className="absolute inset-0 animate-pulse" style={{ background: 'var(--adm-input)' }} />}
        <img
          src={photo.imageUrl}
          alt={photo.titulo || 'Foto'}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />

        {/* Status badge */}
        <div className="absolute top-2 left-2">
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
            style={
              isPub
                ? { background: '#22c55e25', color: '#22c55e', border: '1px solid #22c55e50' }
                : { background: '#f59e0b25', color: '#f59e0b', border: '1px solid #f59e0b50' }
            }
          >
            {isPub ? <Eye size={9} /> : <EyeOff size={9} />}
            {isPub ? 'Publicado' : 'Oculto'}
          </span>
        </div>

        {/* Select checkbox */}
        {canDelete && (
          <button
            onClick={e => { e.stopPropagation(); onSelect(); }}
            className="absolute top-2 right-2 transition-opacity"
            style={{ opacity: selected ? 1 : 0 }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '1'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = selected ? '1' : '0'; }}
          >
            <div className="w-5 h-5 rounded border-2 flex items-center justify-center"
              style={{
                background: selected ? 'var(--adm-accent)' : 'rgba(0,0,0,0.6)',
                borderColor: selected ? 'var(--adm-accent)' : 'rgba(255,255,255,0.6)',
              }}
            >
              {selected && <span className="text-white text-[10px] leading-none font-bold">✓</span>}
            </div>
          </button>
        )}

        {/* Hover overlay with actions */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
          {canEdit && (
            <button
              onClick={e => { e.stopPropagation(); onToggleStatus(); }}
              title={isPub ? 'Ocultar' : 'Publicar'}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
            >
              {isPub ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
          {canEdit && (
            <button
              onClick={e => { e.stopPropagation(); onEdit(); }}
              title="Editar"
              className="p-2 rounded-lg bg-white/10 hover:bg-amber-400/30 transition-colors text-amber-300"
            >
              <Pencil size={16} />
            </button>
          )}
          {canDelete && (
            <button
              onClick={e => { e.stopPropagation(); onDelete(); }}
              title="Excluir"
              className="p-2 rounded-lg bg-white/10 hover:bg-red-500/30 transition-colors text-red-400"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Card info */}
      <div className="p-3">
        <p className="text-xs font-medium truncate" style={{ color: 'var(--adm-text)' }}>
          {photo.titulo || <span style={{ color: 'var(--adm-subtle)' }}>Sem título</span>}
        </p>
        <p className="text-[10px] mt-1 flex items-center gap-1" style={{ color: 'var(--adm-subtle)' }}>
          <Calendar size={9} /> {formatDate(photo.createdAt)}
        </p>
      </div>
    </div>
  );
}

// ── Upload Modal ──────────────────────────────────────────
interface UploadModalProps {
  onClose: () => void;
  onDone: () => void;
  createdBy: string;
}

function UploadModal({ onClose, onDone, createdBy }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [form, setForm] = useState<UploadMeta>({ titulo: '', descricao: '', status: 'publicado', createdBy });
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const pickFile = (f: File) => {
    const err = validateFile(f);
    if (err) { setError(err); return; }
    setError('');
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(f));
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) pickFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    setProgress(0);
    try {
      await uploadPhoto(file, { ...form, createdBy }, setProgress);
      URL.revokeObjectURL(preview);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro no upload. Tente novamente.');
    } finally {
      setUploading(false);
    }
  };

  const close = () => {
    if (uploading) return;
    if (preview) URL.revokeObjectURL(preview);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div className="w-full max-w-2xl rounded-2xl shadow-2xl" style={{ background: 'var(--adm-modal)', border: '1px solid var(--adm-border)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--adm-border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--adm-input)' }}>
              <Upload size={18} className="text-cpe-red" />
            </div>
            <h3 className="text-lg font-bold" style={{ color: 'var(--adm-text)' }}>Nova Foto</h3>
          </div>
          <button onClick={close} className="p-2 rounded-lg transition-colors" style={{ color: 'var(--adm-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-cpe-red/10 border border-cpe-red/30">
              <AlertCircle size={15} className="text-cpe-red flex-shrink-0" />
              <p className="text-sm text-cpe-red">{error}</p>
            </div>
          )}

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => !file && fileRef.current?.click()}
            className="relative rounded-2xl border-2 border-dashed transition-colors duration-200 overflow-hidden"
            style={{
              borderColor: isDragging ? 'var(--adm-accent)' : 'var(--adm-border)',
              background: isDragging ? 'var(--adm-accent)15' : 'var(--adm-input)',
              cursor: file ? 'default' : 'pointer',
              minHeight: preview ? 'auto' : '180px',
            }}
          >
            {preview ? (
              <div className="relative">
                <img src={preview} alt="Preview" className="w-full max-h-64 object-contain rounded-xl" />
                {!uploading && (
                  <button
                    onClick={e => { e.stopPropagation(); setFile(null); setPreview(''); URL.revokeObjectURL(preview); }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-44 gap-3">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'var(--adm-surface)' }}>
                  <Camera size={26} style={{ color: 'var(--adm-muted)' }} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium" style={{ color: 'var(--adm-text)' }}>
                    Arraste uma imagem ou <span style={{ color: 'var(--adm-accent)' }}>clique para selecionar</span>
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--adm-subtle)' }}>JPG, PNG ou WEBP · Máx. 10 MB</p>
                </div>
              </div>
            )}
          </div>

          {/* Progress bar */}
          {uploading && (
            <div>
              <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--adm-muted)' }}>
                <span>Enviando...</span><span>{progress}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--adm-input)' }}>
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress}%`, background: 'var(--adm-accent)' }}
                />
              </div>
            </div>
          )}

          {/* Metadata fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--adm-muted)' }}>
                Título
              </label>
              <input
                type="text"
                value={form.titulo}
                onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                placeholder="Ex: Formatura 2024"
                className="adm-input w-full px-3 py-2.5 text-sm rounded-lg border"
                style={{ background: 'var(--adm-input)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--adm-muted)' }}>
                Status
              </label>
              <select
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value as 'publicado' | 'oculto' }))}
                className="adm-input w-full px-3 py-2.5 text-sm rounded-lg border"
                style={{ background: 'var(--adm-input)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
              >
                <option value="publicado">Publicado</option>
                <option value="oculto">Oculto</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--adm-muted)' }}>
                Descrição
              </label>
              <textarea
                value={form.descricao}
                onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                placeholder="Descrição opcional..."
                rows={2}
                className="adm-input w-full px-3 py-2.5 text-sm rounded-lg border resize-none"
                style={{ background: 'var(--adm-input)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 justify-end px-6 py-4 border-t" style={{ borderColor: 'var(--adm-border)' }}>
          <button
            onClick={close}
            disabled={uploading}
            className="px-5 py-2.5 text-sm rounded-lg border disabled:opacity-50 transition-colors"
            style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)' }}
          >
            Cancelar
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-cpe-red hover:bg-cpe-red/80 rounded-lg transition-colors disabled:opacity-40"
          >
            {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
            {uploading ? `Enviando ${progress}%` : 'Fazer Upload'}
          </button>
        </div>
      </div>

      <input ref={fileRef} type="file" accept={ACCEPTED} className="hidden"
        onChange={e => e.target.files?.[0] && pickFile(e.target.files[0])} />
    </div>
  );
}

// ── Edit Modal ────────────────────────────────────────────
interface EditModalProps {
  photo: Photo;
  onSave: (data: Partial<Pick<Photo, 'titulo' | 'descricao' | 'status'>>) => Promise<void>;
  onClose: () => void;
}

function EditModal({ photo, onSave, onClose }: EditModalProps) {
  const [form, setForm] = useState({ titulo: photo.titulo, descricao: photo.descricao, status: photo.status });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setSaving(true);
    try { await onSave(form); } catch { setError('Erro ao salvar.'); setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div className="w-full max-w-md rounded-2xl shadow-2xl" style={{ background: 'var(--adm-modal)', border: '1px solid var(--adm-border)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--adm-border)' }}>
          <h3 className="font-bold text-base" style={{ color: 'var(--adm-text)' }}>Editar Foto</h3>
          <button onClick={onClose} style={{ color: 'var(--adm-muted)' }}><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          {error && <p className="text-sm text-cpe-red">{error}</p>}
          <img src={photo.imageUrl} alt="" className="w-full h-36 object-cover rounded-xl" />
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--adm-muted)' }}>Título</label>
            <input type="text" value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} className="adm-input w-full px-3 py-2.5 text-sm rounded-lg border" style={{ background: 'var(--adm-input)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--adm-muted)' }}>Descrição</label>
            <textarea value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} rows={2} className="adm-input w-full px-3 py-2.5 text-sm rounded-lg border resize-none" style={{ background: 'var(--adm-input)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--adm-muted)' }}>Status</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as 'publicado' | 'oculto' }))} className="adm-input w-full px-3 py-2.5 text-sm rounded-lg border" style={{ background: 'var(--adm-input)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}>
              <option value="publicado">Publicado</option>
              <option value="oculto">Oculto</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 justify-end px-6 py-4 border-t" style={{ borderColor: 'var(--adm-border)' }}>
          <button onClick={onClose} disabled={saving} className="px-5 py-2.5 text-sm rounded-lg border" style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)' }}>Cancelar</button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-cpe-red hover:bg-cpe-red/80 rounded-lg disabled:opacity-50">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── FotosModule (main) ────────────────────────────────────
export default function FotosModule({ onBack, permissions }: FotosModuleProps) {
  const { adminUser } = useRBAC();
  const canCreate = !permissions || permissions.create;
  const canEdit   = !permissions || permissions.edit;
  const canDelete = !permissions || permissions.delete;

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [showUpload, setShowUpload] = useState(false);
  const [editTarget, setEditTarget] = useState<Photo | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Photo | null>(null);
  const [deletingBatch, setDeletingBatch] = useState(false);
  const [showBatchConfirm, setShowBatchConfirm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'publicado' | 'oculto'>('all');

  const fetchPhotos = async () => {
    try { setPhotos(await getAllPhotos()); }
    catch { setError('Erro ao carregar fotos. Verifique as configurações do Firebase.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPhotos(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return photos.filter(p => {
      const matchSearch = !q || p.titulo.toLowerCase().includes(q) || p.descricao.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [photos, search, statusFilter]);

  const toggleSelect = (id: string) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const handleEdit = async (data: Partial<Pick<Photo, 'titulo' | 'descricao' | 'status'>>) => {
    await updatePhoto(editTarget!.id, data);
    setEditTarget(null);
    await fetchPhotos();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deletePhoto(deleteTarget.id, deleteTarget.storagePath);
      setDeleteTarget(null);
      fetchPhotos();
    } catch { setError('Erro ao excluir foto.'); }
  };

  const handleBatchDelete = async () => {
    setDeletingBatch(true);
    try {
      await deletePhotoBatch(photos.filter(p => selected.has(p.id)));
      setSelected(new Set());
      setShowBatchConfirm(false);
      fetchPhotos();
    } catch { setError('Erro ao excluir fotos.'); }
    finally { setDeletingBatch(false); }
  };

  const handleToggleStatus = async (photo: Photo) => {
    try {
      await updatePhoto(photo.id, { status: photo.status === 'publicado' ? 'oculto' : 'publicado' });
      fetchPhotos();
    } catch { setError('Erro ao alterar status.'); }
  };

  const pubCount = photos.filter(p => p.status === 'publicado').length;
  const hidCount = photos.filter(p => p.status === 'oculto').length;

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ color: 'var(--adm-muted)', background: 'var(--adm-surface)', border: '1px solid var(--adm-border)' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--adm-text)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--adm-muted)'}
        >
          <ArrowLeft size={16} /> Voltar
        </button>
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--adm-text)' }}>Painel de Fotos</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--adm-muted)' }}>Gerencie as imagens da galeria pública</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total', value: photos.length, color: 'var(--adm-accent)' },
          { label: 'Publicadas', value: pubCount, color: '#22c55e' },
          { label: 'Ocultas', value: hidCount, color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-3 p-4 rounded-xl border" style={{ background: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--adm-input)' }}>
              <Camera size={18} style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: 'var(--adm-muted)' }}>{s.label}</p>
              <p className="text-xl font-bold" style={{ color: 'var(--adm-text)' }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 mb-4 rounded-xl bg-cpe-red/10 border border-cpe-red/30">
          <AlertCircle size={15} className="text-cpe-red flex-shrink-0" />
          <p className="text-sm text-cpe-red flex-1">{error}</p>
          <button onClick={() => setError('')}><X size={14} className="text-cpe-red" /></button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--adm-muted)' }} />
          <input
            type="text"
            placeholder="Buscar por título ou descrição..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="adm-input w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border"
            style={{ background: 'var(--adm-input)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as 'all' | 'publicado' | 'oculto')}
          className="adm-input px-3 py-2.5 text-sm rounded-lg border"
          style={{ background: 'var(--adm-input)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
        >
          <option value="all">Todos</option>
          <option value="publicado">Publicadas</option>
          <option value="oculto">Ocultas</option>
        </select>
        {selected.size > 0 && canDelete && (
          <button
            onClick={() => setShowBatchConfirm(true)}
            className="flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-lg border border-cpe-red/30 text-cpe-red hover:bg-cpe-red/10 transition-colors"
          >
            <Trash2 size={14} /> Excluir ({selected.size})
          </button>
        )}
        {canCreate && (
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 bg-cpe-red hover:bg-cpe-red/80 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap"
          >
            <Plus size={15} /> Nova Foto
          </button>
        )}
      </div>

      {/* Selection toggle */}
      {canDelete && filtered.length > 0 && (
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => selected.size === filtered.length ? setSelected(new Set()) : setSelected(new Set(filtered.map(p => p.id)))}
            className="flex items-center gap-1.5 text-xs transition-opacity hover:opacity-70"
            style={{ color: 'var(--adm-muted)' }}
          >
            {selected.size === filtered.length ? <CheckSquare size={13} /> : <Square size={13} />}
            {selected.size === filtered.length ? 'Desmarcar todos' : 'Selecionar todos'}
          </button>
          {selected.size > 0 && (
            <span className="text-xs" style={{ color: 'var(--adm-subtle)' }}>
              {selected.size} selecionada{selected.size !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden border animate-pulse" style={{ background: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
              <div className="aspect-square" style={{ background: 'var(--adm-input)' }} />
              <div className="p-3 space-y-2">
                <div className="h-3 rounded" style={{ background: 'var(--adm-input)', width: '70%' }} />
                <div className="h-2 rounded" style={{ background: 'var(--adm-input)', width: '40%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border" style={{ background: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
          <ImageOff size={44} className="mb-4 opacity-20" style={{ color: 'var(--adm-muted)' }} />
          <p className="font-semibold" style={{ color: 'var(--adm-text)' }}>
            {search ? 'Nenhuma foto encontrada' : 'Nenhuma foto cadastrada'}
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--adm-muted)' }}>
            {search ? 'Tente outro termo.' : 'Clique em "Nova Foto" para começar.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(photo => (
            <AdminPhotoCard
              key={photo.id}
              photo={photo}
              selected={selected.has(photo.id)}
              canEdit={canEdit}
              canDelete={canDelete}
              onSelect={() => toggleSelect(photo.id)}
              onEdit={() => setEditTarget(photo)}
              onDelete={() => setDeleteTarget(photo)}
              onToggleStatus={() => handleToggleStatus(photo)}
            />
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <UploadModal
          createdBy={adminUser?.email ?? ''}
          onClose={() => setShowUpload(false)}
          onDone={() => { setShowUpload(false); fetchPhotos(); }}
        />
      )}

      {/* Edit Modal */}
      {editTarget && (
        <EditModal
          photo={editTarget}
          onSave={handleEdit}
          onClose={() => setEditTarget(null)}
        />
      )}

      {/* Delete single */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
          <div className="w-full max-w-sm rounded-2xl shadow-2xl p-6" style={{ background: 'var(--adm-modal)', border: '1px solid var(--adm-border)' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-cpe-red/10 flex items-center justify-center"><Trash2 size={18} className="text-cpe-red" /></div>
              <h3 className="font-bold" style={{ color: 'var(--adm-text)' }}>Excluir foto?</h3>
            </div>
            <img src={deleteTarget.imageUrl} alt="" className="w-full h-28 object-cover rounded-xl mb-4" />
            <p className="text-sm mb-5" style={{ color: 'var(--adm-muted)' }}>Esta ação é irreversível. A imagem será removida do servidor e da galeria.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm rounded-lg border" style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)' }}>Cancelar</button>
              <button onClick={handleDelete} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-cpe-red hover:bg-cpe-red/80 rounded-lg">
                <Trash2 size={13} /> Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch delete confirm */}
      {showBatchConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
          <div className="w-full max-w-sm rounded-2xl shadow-2xl p-6" style={{ background: 'var(--adm-modal)', border: '1px solid var(--adm-border)' }}>
            <h3 className="font-bold text-base mb-2" style={{ color: 'var(--adm-text)' }}>Excluir {selected.size} foto{selected.size !== 1 ? 's' : ''}?</h3>
            <p className="text-sm mb-5" style={{ color: 'var(--adm-muted)' }}>Todas as imagens selecionadas serão removidas permanentemente.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowBatchConfirm(false)} disabled={deletingBatch} className="px-4 py-2 text-sm rounded-lg border" style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)' }}>Cancelar</button>
              <button onClick={handleBatchDelete} disabled={deletingBatch} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-cpe-red hover:bg-cpe-red/80 rounded-lg disabled:opacity-50">
                {deletingBatch ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                {deletingBatch ? 'Excluindo...' : 'Excluir tudo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
