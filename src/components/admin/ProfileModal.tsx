import { useState, useRef } from 'react';
import {
  X, Camera, Lock, Loader2, CheckCircle, Eye, EyeOff, User,
} from 'lucide-react';
import {
  updatePassword, reauthenticateWithCredential, EmailAuthProvider,
} from 'firebase/auth';
import {
  collection, query, where, getDocs, updateDoc, addDoc, serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { AdminUserProfile } from '../../types/rbac';

const CLOUD_NAME    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string;

interface ProfileModalProps {
  profile: AdminUserProfile | null;
  email: string;
  onClose: () => void;
  onRefresh: () => Promise<void>;
}

async function compressAvatar(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const size = 400;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      const s = Math.min(img.naturalWidth, img.naturalHeight);
      const sx = (img.naturalWidth - s) / 2;
      const sy = (img.naturalHeight - s) / 2;
      ctx.drawImage(img, sx, sy, s, s, 0, 0, size, size);
      canvas.toBlob(
        b => b ? resolve(b) : reject(new Error('Compression failed')),
        'image/jpeg',
        0.92,
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Load failed')); };
    img.src = url;
  });
}

async function uploadAvatarToCloudinary(
  file: File,
  onProgress: (pct: number) => void,
): Promise<string> {
  const blob = await compressAvatar(file);
  return new Promise((resolve, reject) => {
    const fd = new FormData();
    fd.append('file', blob);
    fd.append('upload_preset', UPLOAD_PRESET);
    fd.append('folder', 'cpe_users');

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`);

    xhr.upload.onprogress = e => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText).secure_url);
      } else {
        try {
          const res = JSON.parse(xhr.responseText);
          reject(new Error(res.error?.message ?? `Erro Cloudinary (${xhr.status})`));
        } catch {
          reject(new Error(`Erro Cloudinary (${xhr.status})`));
        }
      }
    };

    xhr.onerror = () => reject(new Error('Erro de rede'));
    xhr.send(fd);
  });
}

async function saveAvatarUrl(email: string, avatarUrl: string): Promise<void> {
  const snap = await getDocs(query(collection(db, 'adminUsers'), where('email', '==', email)));
  if (!snap.empty) {
    await updateDoc(snap.docs[0].ref, { avatarUrl, updatedAt: serverTimestamp() });
  } else {
    await addDoc(collection(db, 'adminUsers'), {
      email,
      displayName: 'Super Admin',
      avatarUrl,
      status: 'active',
      permissions: {},
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}

function InitialsAvatar({ name, size = 88 }: { name: string; size?: number }) {
  const initial = (name || '?').charAt(0).toUpperCase();
  return (
    <div
      className="rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white bg-cpe-red select-none"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initial}
    </div>
  );
}

export default function ProfileModal({ profile, email, onClose, onRefresh }: ProfileModalProps) {
  const displayName = profile?.displayName || email.split('@')[0];

  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl || '');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [avatarSuccess, setAvatarSuccess] = useState(false);

  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [currentPwd, setCurrentPwd] = useState('');
  const [needsReauth, setNeedsReauth] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  const handleAvatarFile = async (file: File) => {
    if (!file.type.startsWith('image/')) { setAvatarError('Selecione uma imagem válida.'); return; }
    setAvatarError('');
    setAvatarSuccess(false);
    setUploading(true);
    setUploadProgress(0);
    try {
      const url = await uploadAvatarToCloudinary(file, setUploadProgress);
      await saveAvatarUrl(email, url);
      setAvatarUrl(url);
      setAvatarSuccess(true);
      await onRefresh();
    } catch (e) {
      setAvatarError(e instanceof Error ? e.message : 'Erro no upload.');
    } finally {
      setUploading(false);
    }
  };

  const handlePasswordSave = async () => {
    setPwdError('');
    setPwdSuccess(false);

    if (!newPwd) { setPwdError('Digite a nova senha.'); return; }
    if (newPwd.length < 6) { setPwdError('A senha deve ter pelo menos 6 caracteres.'); return; }
    if (newPwd !== confirmPwd) { setPwdError('As senhas não coincidem.'); return; }
    if (needsReauth && !currentPwd) { setPwdError('Digite a senha atual.'); return; }

    setSavingPwd(true);
    const user = auth.currentUser;
    if (!user) return;

    try {
      if (needsReauth) {
        const cred = EmailAuthProvider.credential(email, currentPwd);
        await reauthenticateWithCredential(user, cred);
      }
      await updatePassword(user, newPwd);
      setPwdSuccess(true);
      setNewPwd('');
      setConfirmPwd('');
      setCurrentPwd('');
      setNeedsReauth(false);
    } catch (e) {
      const code = (e as { code?: string })?.code;
      if (code === 'auth/requires-recent-login') {
        setNeedsReauth(true);
        setPwdError('Por segurança, confirme sua senha atual para continuar.');
      } else if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setPwdError('Senha atual incorreta.');
      } else {
        setPwdError(e instanceof Error ? e.message : 'Erro ao alterar senha.');
      }
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 overflow-y-auto"
      style={{ background: 'rgba(0,0,0,0.75)' }}
    >
      <div
        className="w-full max-w-md rounded-2xl shadow-2xl"
        style={{ background: 'var(--adm-modal)', border: '1px solid var(--adm-border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--adm-border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--adm-input)' }}>
              <User size={18} className="text-cpe-red" />
            </div>
            <h3 className="text-lg font-bold" style={{ color: 'var(--adm-text)' }}>Meu Perfil</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg transition-colors" style={{ color: 'var(--adm-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* ── Avatar ── */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="w-24 h-24 rounded-full object-cover ring-2"
                  style={{ ringColor: 'var(--adm-accent)' }}
                />
              ) : (
                <InitialsAvatar name={displayName} size={96} />
              )}

              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="absolute inset-0 rounded-full flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity disabled:cursor-not-allowed"
                title="Alterar foto"
              >
                <Camera size={22} className="text-white" />
              </button>
            </div>

            <div className="text-center">
              <p className="font-semibold text-base" style={{ color: 'var(--adm-text)' }}>{displayName}</p>
              <p className="text-sm" style={{ color: 'var(--adm-muted)' }}>{email}</p>
            </div>

            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg border transition-colors disabled:opacity-50"
              style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)' }}
            >
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
              {uploading ? `Enviando ${uploadProgress}%` : 'Alterar foto'}
            </button>

            {/* Avatar progress */}
            {uploading && (
              <div className="w-full">
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--adm-input)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%`, background: 'var(--adm-accent)' }}
                  />
                </div>
              </div>
            )}

            {avatarError && (
              <p className="text-sm text-cpe-red text-center">{avatarError}</p>
            )}
            {avatarSuccess && (
              <div className="flex items-center gap-2 text-sm text-green-500">
                <CheckCircle size={14} /> Foto atualizada com sucesso!
              </div>
            )}
          </div>

          <div className="border-t" style={{ borderColor: 'var(--adm-border)' }} />

          {/* ── Password ── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Lock size={15} style={{ color: 'var(--adm-muted)' }} />
              <span className="text-sm font-semibold" style={{ color: 'var(--adm-text)' }}>Alterar Senha</span>
            </div>

            {needsReauth && (
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--adm-muted)' }}>
                  Senha Atual
                </label>
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPwd}
                    onChange={e => setCurrentPwd(e.target.value)}
                    placeholder="••••••••"
                    className="adm-input w-full px-3 py-2.5 text-sm rounded-lg border pr-10"
                    style={{ background: 'var(--adm-input)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--adm-muted)' }}
                  >
                    {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--adm-muted)' }}>
                Nova Senha
              </label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPwd}
                  onChange={e => setNewPwd(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="adm-input w-full px-3 py-2.5 text-sm rounded-lg border pr-10"
                  style={{ background: 'var(--adm-input)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--adm-muted)' }}
                >
                  {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--adm-muted)' }}>
                Confirmar Senha
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPwd}
                  onChange={e => setConfirmPwd(e.target.value)}
                  placeholder="••••••••"
                  className="adm-input w-full px-3 py-2.5 text-sm rounded-lg border pr-10"
                  style={{ background: 'var(--adm-input)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--adm-muted)' }}
                >
                  {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {pwdError && (
              <p className="text-sm text-cpe-red">{pwdError}</p>
            )}
            {pwdSuccess && (
              <div className="flex items-center gap-2 text-sm text-green-500">
                <CheckCircle size={14} /> Senha alterada com sucesso!
              </div>
            )}

            <button
              onClick={handlePasswordSave}
              disabled={savingPwd || !newPwd}
              className="flex items-center gap-2 w-full justify-center px-4 py-2.5 text-sm font-semibold text-white bg-cpe-red hover:bg-cpe-red/80 rounded-lg transition-colors disabled:opacity-40"
            >
              {savingPwd ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
              {savingPwd ? 'Salvando...' : 'Salvar Nova Senha'}
            </button>
          </div>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={e => e.target.files?.[0] && handleAvatarFile(e.target.files[0])}
      />
    </div>
  );
}
