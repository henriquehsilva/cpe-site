import { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft, Plus, Pencil, Trash2, Search, X, Save,
  AlertCircle, Users, ShieldCheck, CheckCircle2, XCircle,
  Loader2, RefreshCw, Eye, EyeOff, Lock,
} from 'lucide-react';
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp, query, orderBy,
} from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { db, firebaseConfig } from '../../firebase';
import {
  AdminUserProfile,
  ModuleKey,
  UserPermissions,
  DEFAULT_PERMISSIONS,
  MODULE_LABELS,
  SUPER_ADMIN_EMAIL,
} from '../../types/rbac';

const MODULE_KEYS = Object.keys(MODULE_LABELS) as ModuleKey[];

interface SettingsModuleProps {
  onBack: () => void;
}

type ModalMode = 'create' | 'edit';

const emptyForm = (): Omit<AdminUserProfile, 'id' | 'createdAt' | 'updatedAt'> => ({
  email: '',
  displayName: '',
  avatarUrl: '',
  status: 'active',
  permissions: JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS)),
});

function buildPermGrid(
  perms: Partial<UserPermissions>
): UserPermissions {
  const base = JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS)) as UserPermissions;
  for (const key of MODULE_KEYS) {
    if (perms[key]) base[key] = { ...base[key], ...perms[key] };
  }
  return base;
}

export default function SettingsModule({ onBack }: SettingsModuleProps) {
  const [users, setUsers] = useState<AdminUserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const [modal, setModal] = useState<{ mode: ModalMode; user: AdminUserProfile | null } | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [permGrid, setPermGrid] = useState<UserPermissions>(JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS)));
  const [formErrors, setFormErrors] = useState<{ email?: string; displayName?: string; password?: string }>({});
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminUserProfile | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'adminUsers'), orderBy('displayName'));
      const snap = await getDocs(q);
      setUsers(
        snap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            email: data.email ?? '',
            displayName: data.displayName ?? '',
            avatarUrl: data.avatarUrl ?? '',
            status: data.status ?? 'inactive',
            createdAt: data.createdAt?.toDate() ?? new Date(),
            updatedAt: data.updatedAt?.toDate() ?? new Date(),
            permissions: data.permissions ?? {},
          };
        })
      );
    } catch (err) {
      console.error('[SettingsModule] fetchUsers error:', err);
      setError('Erro ao carregar usuários. Verifique se o Firestore está ativado e as regras de segurança estão configuradas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter(u => {
      const matchSearch = !q || u.displayName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || u.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [users, search, statusFilter]);

  const openCreate = () => {
    setForm(emptyForm());
    setPermGrid(JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS)));
    setFormErrors({});
    setPassword('');
    setShowPassword(false);
    setModal({ mode: 'create', user: null });
  };

  const openEdit = (user: AdminUserProfile) => {
    setForm({ email: user.email, displayName: user.displayName, avatarUrl: user.avatarUrl ?? '', status: user.status, permissions: user.permissions });
    setPermGrid(buildPermGrid(user.permissions));
    setFormErrors({});
    setModal({ mode: 'edit', user });
  };

  const closeModal = () => {
    setModal(null);
    setFormErrors({});
    setError('');
  };

  const validateForm = () => {
    const errs: { email?: string; displayName?: string; password?: string } = {};
    if (!form.displayName.trim()) errs.displayName = 'Nome é obrigatório';
    if (!form.email.trim()) {
      errs.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Email inválido';
    } else if (form.email.toLowerCase() === SUPER_ADMIN_EMAIL) {
      errs.email = 'Este email é reservado para o super administrador';
    }
    if (modal?.mode === 'create') {
      if (!password) errs.password = 'Senha é obrigatória';
      else if (password.length < 6) errs.password = 'Mínimo 6 caracteres';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);
    setError('');
    try {
      const email = form.email.toLowerCase().trim();
      const payload = {
        email,
        displayName: form.displayName.trim(),
        status: form.status,
        permissions: permGrid,
        updatedAt: serverTimestamp(),
      };

      if (modal?.mode === 'create') {
        // Cria o usuário no Firebase Auth usando app temporário (sem deslogar o admin atual)
        const tempApp = initializeApp(firebaseConfig, `create-user-${Date.now()}`);
        const tempAuth = getAuth(tempApp);
        try {
          await createUserWithEmailAndPassword(tempAuth, email, password);
        } catch (authErr: unknown) {
          const code = (authErr as { code?: string }).code;
          if (code === 'auth/email-already-in-use') {
            setFormErrors(e => ({ ...e, email: 'Este email já possui uma conta. Verifique se o usuário já existe.' }));
          } else if (code === 'auth/weak-password') {
            setFormErrors(e => ({ ...e, password: 'Senha muito fraca. Use ao menos 6 caracteres.' }));
          } else {
            setError('Erro ao criar conta de acesso. Tente novamente.');
          }
          setSaving(false);
          return;
        } finally {
          await deleteApp(tempApp);
        }
        await addDoc(collection(db, 'adminUsers'), { ...payload, createdAt: serverTimestamp() });
      } else if (modal?.mode === 'edit' && modal.user) {
        await updateDoc(doc(db, 'adminUsers', modal.user.id), payload);
      }

      closeModal();
      fetchUsers();
    } catch (err) {
      console.error('[SettingsModule] handleSave error:', err);
      setError('Erro ao salvar. Verifique as regras de segurança do Firestore no Firebase Console.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await deleteDoc(doc(db, 'adminUsers', deleteTarget.id));
      setDeleteTarget(null);
      fetchUsers();
    } catch (err) {
      console.error('[SettingsModule] handleDelete error:', err);
      setError('Erro ao excluir usuário.');
    } finally {
      setSaving(false);
    }
  };

  const togglePerm = (mod: ModuleKey, action: keyof UserPermissions[ModuleKey]) => {
    setPermGrid(prev => {
      const next = { ...prev, [mod]: { ...prev[mod] } };
      if (action === 'view' && next[mod].view) {
        next[mod] = { view: false, create: false, edit: false, delete: false };
      } else {
        next[mod][action] = !next[mod][action];
        if (action !== 'view' && next[mod][action]) next[mod].view = true;
      }
      return next;
    });
  };

  const toggleAllForModule = (mod: ModuleKey) => {
    setPermGrid(prev => {
      const all = Object.values(prev[mod]).every(Boolean);
      const val = !all;
      return { ...prev, [mod]: { view: val, create: val, edit: val, delete: val } };
    });
  };

  const toggleAllForAction = (action: keyof UserPermissions[ModuleKey]) => {
    setPermGrid(prev => {
      const allOn = MODULE_KEYS.every(k => prev[k][action]);
      const next = { ...prev };
      for (const k of MODULE_KEYS) {
        next[k] = { ...next[k], [action]: !allOn };
        if (action !== 'view' && !allOn) next[k].view = true;
        if (action === 'view' && allOn) next[k] = { view: false, create: false, edit: false, delete: false };
      }
      return next;
    });
  };

  const activeCount = users.filter(u => u.status === 'active').length;
  const inactiveCount = users.filter(u => u.status === 'inactive').length;

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium"
          style={{ color: 'var(--adm-muted)', background: 'var(--adm-surface)', border: '1px solid var(--adm-border)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--adm-text)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--adm-muted)')}
        >
          <ArrowLeft size={16} /> Voltar
        </button>
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--adm-text)' }}>
            Configurações
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--adm-muted)' }}>
            Gerencie usuários e permissões de acesso
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total', value: users.length, icon: Users, color: 'var(--adm-accent)' },
          { label: 'Ativos', value: activeCount, icon: CheckCircle2, color: '#22c55e' },
          { label: 'Inativos', value: inactiveCount, icon: XCircle, color: '#ef4444' },
        ].map(s => (
          <div
            key={s.label}
            className="flex items-center gap-3 p-4 rounded-xl border"
            style={{ background: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}
          >
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--adm-input)' }}>
              <s.icon size={20} style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: 'var(--adm-muted)' }}>{s.label}</p>
              <p className="text-xl font-bold" style={{ color: 'var(--adm-text)' }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Error banner */}
      {error && !modal && (
        <div className="flex items-start gap-3 p-4 mb-4 rounded-xl bg-cpe-red/10 border border-cpe-red/30">
          <AlertCircle size={18} className="text-cpe-red flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-cpe-red font-medium">{error}</p>
            <p className="text-xs text-cpe-red/70 mt-1">
              Acesse o Firebase Console → Firestore Database → Regras de segurança e configure as permissões.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => { setError(''); fetchUsers(); }}
              className="flex items-center gap-1 text-xs text-cpe-red underline"
            >
              <RefreshCw size={12} /> Tentar novamente
            </button>
            <button onClick={() => setError('')}><X size={16} className="text-cpe-red" /></button>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--adm-muted)' }} />
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="adm-input w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border"
            style={{ background: 'var(--adm-input)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
          className="adm-input px-3 py-2.5 text-sm rounded-lg border"
          style={{ background: 'var(--adm-input)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
        >
          <option value="all">Todos os status</option>
          <option value="active">Ativos</option>
          <option value="inactive">Inativos</option>
        </select>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-cpe-red hover:bg-cpe-red/80 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap"
        >
          <Plus size={16} /> Novo Usuário
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--adm-border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--adm-tbl-head)' }}>
                {['Nome', 'Email', 'Status', 'Permissões', 'Ações'].map(h => (
                  <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--adm-muted)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center">
                    <Loader2 size={28} className="animate-spin mx-auto" style={{ color: 'var(--adm-muted)' }} />
                    <p className="mt-2 text-sm" style={{ color: 'var(--adm-muted)' }}>Carregando usuários...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center">
                    <Users size={36} className="mx-auto mb-3 opacity-30" style={{ color: 'var(--adm-muted)' }} />
                    <p className="text-sm" style={{ color: 'var(--adm-muted)' }}>
                      {search || statusFilter !== 'all' ? 'Nenhum usuário encontrado.' : 'Nenhum usuário cadastrado.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((user, i) => {
                  const permCount = MODULE_KEYS.filter(k => user.permissions[k]?.view).length;
                  return (
                    <tr
                      key={user.id}
                      className="adm-row border-t transition-colors"
                      style={{
                        background: i % 2 === 0 ? 'transparent' : 'var(--adm-row-even)',
                        borderColor: 'var(--adm-border)',
                      }}
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                            style={{ background: 'var(--adm-accent)', color: '#fff' }}
                          >
                            {user.displayName.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium" style={{ color: 'var(--adm-text)' }}>{user.displayName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5" style={{ color: 'var(--adm-muted)' }}>{user.email}</td>
                      <td className="px-4 py-3.5">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={
                            user.status === 'active'
                              ? { background: '#22c55e20', color: '#22c55e' }
                              : { background: '#ef444420', color: '#ef4444' }
                          }
                        >
                          {user.status === 'active' ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                          {user.status === 'active' ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--adm-muted)' }}>
                          <ShieldCheck size={13} style={{ color: 'var(--adm-accent)' }} />
                          {permCount}/{MODULE_KEYS.length} módulos
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEdit(user)}
                            title="Editar"
                            className="p-2 rounded-lg transition-colors hover:bg-amber-400/10 text-amber-400 opacity-70 hover:opacity-100"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(user)}
                            title="Excluir"
                            className="p-2 rounded-lg transition-colors hover:bg-cpe-red/10 text-cpe-red opacity-70 hover:opacity-100"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div
            className="w-full max-w-3xl rounded-2xl shadow-2xl"
            style={{ background: 'var(--adm-modal)', border: '1px solid var(--adm-border)' }}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--adm-border)' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--adm-input)' }}>
                  {modal.mode === 'create' ? <Plus size={18} className="text-cpe-red" /> : <Pencil size={18} style={{ color: 'var(--adm-accent)' }} />}
                </div>
                <h3 className="text-lg font-bold" style={{ color: 'var(--adm-text)' }}>
                  {modal.mode === 'create' ? 'Novo Usuário' : 'Editar Usuário'}
                </h3>
              </div>
              <button onClick={closeModal} className="p-2 rounded-lg transition-colors" style={{ color: 'var(--adm-muted)' }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--adm-text)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--adm-muted)')}>
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Error */}
              {error && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-cpe-red/10 border border-cpe-red/30">
                  <AlertCircle size={16} className="text-cpe-red flex-shrink-0" />
                  <p className="text-sm text-cpe-red">{error}</p>
                </div>
              )}

              {/* Basic fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--adm-muted)' }}>
                    Nome *
                  </label>
                  <input
                    type="text"
                    value={form.displayName}
                    onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
                    placeholder="Nome completo"
                    className="adm-input w-full px-3 py-2.5 text-sm rounded-lg border"
                    style={{ background: 'var(--adm-input)', borderColor: formErrors.displayName ? '#ef4444' : 'var(--adm-border)', color: 'var(--adm-text)' }}
                  />
                  {formErrors.displayName && <p className="text-xs text-red-400 mt-1">{formErrors.displayName}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--adm-muted)' }}>
                    Email *
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="email@exemplo.com"
                    className="adm-input w-full px-3 py-2.5 text-sm rounded-lg border"
                    style={{ background: 'var(--adm-input)', borderColor: formErrors.email ? '#ef4444' : 'var(--adm-border)', color: 'var(--adm-text)' }}
                  />
                  {formErrors.email && <p className="text-xs text-red-400 mt-1">{formErrors.email}</p>}
                  {modal.mode === 'edit' && (
                    <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: '#ca8a04' }}>
                      <AlertCircle size={11} />
                      Atualiza apenas o registro. O email de login no Firebase Auth não é alterado automaticamente.
                    </p>
                  )}
                </div>
                {modal.mode === 'create' && (
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--adm-muted)' }}>
                      Senha *
                    </label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--adm-muted)' }} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="adm-input w-full pl-9 pr-10 py-2.5 text-sm rounded-lg border"
                        style={{ background: 'var(--adm-input)', borderColor: formErrors.password ? '#ef4444' : 'var(--adm-border)', color: 'var(--adm-text)' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity opacity-50 hover:opacity-100"
                        style={{ color: 'var(--adm-muted)' }}
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {formErrors.password && <p className="text-xs text-red-400 mt-1">{formErrors.password}</p>}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--adm-muted)' }}>
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value as 'active' | 'inactive' }))}
                    className="adm-input w-full px-3 py-2.5 text-sm rounded-lg border"
                    style={{ background: 'var(--adm-input)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                  >
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                  </select>
                </div>
              </div>

              {/* Permissions grid */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck size={16} style={{ color: 'var(--adm-accent)' }} />
                  <h4 className="text-sm font-bold" style={{ color: 'var(--adm-text)' }}>Permissões por Módulo</h4>
                </div>

                <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--adm-border)' }}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: 'var(--adm-tbl-head)' }}>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--adm-muted)' }}>
                          Módulo
                        </th>
                        {(['view', 'create', 'edit', 'delete'] as const).map(action => (
                          <th key={action} className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--adm-muted)' }}>
                            <button
                              onClick={() => toggleAllForAction(action)}
                              title={`Alternar todos: ${action}`}
                              className="flex flex-col items-center gap-0.5 mx-auto transition-opacity hover:opacity-70"
                            >
                              <span>{action === 'view' ? 'Ver' : action === 'create' ? 'Criar' : action === 'edit' ? 'Editar' : 'Deletar'}</span>
                              <span className="text-[9px] opacity-60">(todos)</span>
                            </button>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {MODULE_KEYS.map((key, i) => {
                        const p = permGrid[key];
                        const allOn = Object.values(p).every(Boolean);
                        return (
                          <tr
                            key={key}
                            className="adm-row border-t transition-colors"
                            style={{
                              background: i % 2 === 0 ? 'transparent' : 'var(--adm-row-even)',
                              borderColor: 'var(--adm-border)',
                            }}
                          >
                            <td className="px-4 py-2.5">
                              <button
                                onClick={() => toggleAllForModule(key)}
                                title="Alternar todas as permissões deste módulo"
                                className="flex items-center gap-2 transition-opacity hover:opacity-70"
                              >
                                <span
                                  className="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors"
                                  style={{
                                    background: allOn ? 'var(--adm-accent)' : 'transparent',
                                    borderColor: allOn ? 'var(--adm-accent)' : 'var(--adm-border)',
                                  }}
                                >
                                  {allOn && <span className="text-white text-[10px] leading-none">✓</span>}
                                </span>
                                <span className="text-xs font-medium" style={{ color: 'var(--adm-text)' }}>
                                  {MODULE_LABELS[key]}
                                </span>
                              </button>
                            </td>
                            {(['view', 'create', 'edit', 'delete'] as const).map(action => (
                              <td key={action} className="px-4 py-2.5 text-center">
                                <button
                                  onClick={() => togglePerm(key, action)}
                                  className="w-5 h-5 rounded border mx-auto flex items-center justify-center transition-colors"
                                  style={{
                                    background: p[action] ? 'var(--adm-accent)' : 'transparent',
                                    borderColor: p[action] ? 'var(--adm-accent)' : 'var(--adm-border)',
                                  }}
                                >
                                  {p[action] && <span className="text-white text-[10px] leading-none">✓</span>}
                                </button>
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs mt-2" style={{ color: 'var(--adm-subtle)' }}>
                  Clique nos cabeçalhos de coluna para alternar todos. Desmarcar "Ver" remove todas as permissões do módulo.
                </p>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex gap-3 justify-end px-6 py-4 border-t" style={{ borderColor: 'var(--adm-border)' }}>
              <button
                onClick={closeModal}
                disabled={saving}
                className="px-5 py-2.5 text-sm rounded-lg border transition-colors disabled:opacity-50"
                style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)', background: 'transparent' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-cpe-red hover:bg-cpe-red/80 rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div
            className="w-full max-w-md rounded-2xl shadow-2xl p-6"
            style={{ background: 'var(--adm-modal)', border: '1px solid var(--adm-border)' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-cpe-red/10 flex items-center justify-center flex-shrink-0">
                <Trash2 size={20} className="text-cpe-red" />
              </div>
              <div>
                <h3 className="font-bold" style={{ color: 'var(--adm-text)' }}>Excluir Usuário</h3>
                <p className="text-sm" style={{ color: 'var(--adm-muted)' }}>{deleteTarget.displayName}</p>
              </div>
            </div>
            <p className="text-sm mb-6" style={{ color: 'var(--adm-muted)' }}>
              Tem certeza que deseja excluir este usuário? Suas permissões serão removidas permanentemente.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={saving}
                className="px-5 py-2.5 text-sm rounded-lg border transition-colors disabled:opacity-50"
                style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)', background: 'transparent' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-cpe-red hover:bg-cpe-red/80 rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                {saving ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

