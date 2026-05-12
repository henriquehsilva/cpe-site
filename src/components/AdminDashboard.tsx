import { useState, useMemo } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import {
  Users, CalendarDays, Cake, PhoneCall, Scale,
  Award, Gift, BookOpen, LogOut, Shield, Palette,
  Settings, Camera, ArrowLeft,
} from 'lucide-react';
import EfetivoModule from './admin/EfetivoModule';
import MapaEfetivoModule from './admin/MapaEfetivoModule';
import AgendaAudienciasModule from './admin/AgendaAudienciasModule';
import DispensaRecompensaModule from './admin/DispensaRecompensaModule';
import AniversariantesModule from './admin/AniversariantesModule';
import PlanoChamadaModule from './admin/PlanoChamadaModule';
import SettingsModule from './admin/SettingsModule';
import FotosModule from './admin/FotosModule';
import ProfileModal from './admin/ProfileModal';
import { THEMES } from '../data/themes';
import { useRBAC } from '../contexts/RBACContext';
import { MODULE_ID_TO_KEY, ModulePermission } from '../types/rbac';

interface AdminDashboardProps {
  onClose: () => void;
}

const ALL_MODULES = [
  { id: 'efetivo',            label: 'Efetivo',             icon: Users },
  { id: 'plano-ferias',       label: 'Plano de Férias',     icon: CalendarDays },
  { id: 'aniversariantes',    label: 'Aniversariantes',     icon: Cake },
  { id: 'plano-chamada',      label: 'Plano de Chamada',    icon: PhoneCall },
  { id: 'agenda-audiencias',  label: 'Agenda Audiências',   icon: Scale },
  { id: 'medalhas',           label: 'Medalhas',            icon: Award },
  { id: 'dispenca-recompensa',label: 'Dispensa Recompensa', icon: Gift },
  { id: 'lesp',               label: 'LESP',                icon: BookOpen },
  { id: 'fotos',              label: 'Painel de Fotos',     icon: Camera },
  { id: 'mapa-efetivo',       label: 'Mapa do Efetivo',     icon: CalendarDays },
];

const AdminDashboard = ({ onClose }: AdminDashboardProps) => {
  const { isSuperAdmin, permissions, adminUser, userProfile, refreshProfile } = useRBAC();
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [themeId, setThemeId] = useState('caverna');
  const [showThemes, setShowThemes] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const theme = useMemo(() => THEMES.find(t => t.id === themeId) ?? THEMES[0], [themeId]);

  const cssVars = {
    '--adm-bg':          theme.bg,
    '--adm-surface':     theme.surface,
    '--adm-border':      theme.border,
    '--adm-border-hov':  theme.borderHover,
    '--adm-text':        theme.text,
    '--adm-muted':       theme.muted,
    '--adm-subtle':      theme.subtle,
    '--adm-input':       theme.input,
    '--adm-header':      theme.header,
    '--adm-tbl-head':    theme.tableHead,
    '--adm-row-even':    theme.rowEven,
    '--adm-row-hover':   theme.rowHover,
    '--adm-modal':       theme.modal,
    '--adm-dropdown':    theme.dropdown,
    '--adm-accent':      theme.accent,
  } as React.CSSProperties;

  const handleSignOut = async () => {
    await signOut(auth);
    onClose();
  };

  const getModulePermissions = (moduleId: string): ModulePermission | undefined => {
    if (isSuperAdmin) return undefined;
    const key = MODULE_ID_TO_KEY[moduleId];
    if (!key || !permissions) return undefined;
    return permissions[key] ?? undefined;
  };

  const visibleModules = useMemo(() => {
    if (isSuperAdmin) return ALL_MODULES;
    if (!permissions) return ALL_MODULES;
    return ALL_MODULES.filter(mod => {
      const key = MODULE_ID_TO_KEY[mod.id];
      if (!key) return false;
      return permissions[key]?.view === true;
    });
  }, [isSuperAdmin, permissions]);

  const avatarInitial = (userProfile?.displayName || adminUser?.email || '?').charAt(0).toUpperCase();
  const displayName   = userProfile?.displayName || adminUser?.email?.split('@')[0] || '';

  const AvatarBubble = ({ size = 28 }: { size?: number }) =>
    userProfile?.avatarUrl ? (
      <img
        src={userProfile.avatarUrl}
        alt="Avatar"
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
      />
    ) : (
      <div
        className="rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white bg-cpe-red"
        style={{ width: size, height: size, fontSize: size * 0.38 }}
      >
        {avatarInitial}
      </div>
    );

  const ThemeList = () => (
    <>
      {THEMES.map(t => (
        <button
          key={t.id}
          onClick={() => { setThemeId(t.id); setShowThemes(false); }}
          className="adm-drop-item flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors"
          style={{ color: 'var(--adm-text)' }}
        >
          <span
            className="w-4 h-4 rounded-full flex-shrink-0"
            style={{
              background: t.swatch,
              outline: themeId === t.id ? '2px solid var(--adm-accent)' : '2px solid transparent',
              outlineOffset: '2px',
            }}
          />
          {t.name}
        </button>
      ))}
    </>
  );

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto flex flex-col"
      style={{ ...cssVars, background: 'var(--adm-bg)' }}
    >
      <style>{`
        .adm-row:hover { background: var(--adm-row-hover) !important; }
        .adm-input:focus { outline: none; border-color: var(--adm-accent) !important; }
        .adm-card:hover { border-color: var(--adm-border-hov) !important; }
        .adm-drop-item:hover { background: var(--adm-row-hover) !important; }
      `}</style>

      {/* ── Desktop/Tablet Top Header ─────────────────────────── */}
      <div
        className="sticky top-0 z-10 border-b backdrop-blur-sm"
        style={{ background: 'var(--adm-header)', borderColor: 'var(--adm-border)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <div className="flex items-center gap-3">
              <Shield size={24} className="text-cpe-red" />
              <span className="font-bold text-lg" style={{ color: 'var(--adm-text)' }}>
                Painel Administrativo
              </span>
            </div>

            {/* Desktop actions (hidden on mobile) */}
            <div className="hidden sm:flex items-center gap-2">

              {/* Settings — super admin only */}
              {isSuperAdmin && (
                <button
                  onClick={() => setActiveModule(activeModule === 'settings' ? null : 'settings')}
                  title="Configurações"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors text-sm font-medium"
                  style={{
                    borderColor: activeModule === 'settings' ? 'var(--adm-accent)' : 'var(--adm-border)',
                    color: activeModule === 'settings' ? 'var(--adm-accent)' : 'var(--adm-muted)',
                    background: 'transparent',
                  }}
                  onMouseEnter={e => { if (activeModule !== 'settings') e.currentTarget.style.color = 'var(--adm-text)'; }}
                  onMouseLeave={e => { if (activeModule !== 'settings') e.currentTarget.style.color = 'var(--adm-muted)'; }}
                >
                  <Settings size={16} />
                  <span className="hidden lg:inline">Configurações</span>
                </button>
              )}

              {/* Theme picker */}
              <div className="relative">
                <button
                  onClick={() => setShowThemes(v => !v)}
                  title="Escolher tema"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors text-sm font-medium"
                  style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)', background: 'transparent' }}
                >
                  <Palette size={16} />
                  <span className="hidden lg:inline">{theme.name}</span>
                </button>

                {showThemes && (
                  <div
                    className="absolute right-0 top-full mt-1 rounded-xl shadow-2xl z-30 overflow-hidden py-2 min-w-[160px]"
                    style={{ background: 'var(--adm-dropdown)', border: '1px solid var(--adm-border)' }}
                  >
                    <ThemeList />
                  </div>
                )}
              </div>

              {/* Profile */}
              <button
                onClick={() => setShowProfile(true)}
                title="Meu Perfil"
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-colors"
                style={{ borderColor: 'var(--adm-border)', background: 'transparent' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--adm-border-hov)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--adm-border)')}
              >
                <AvatarBubble size={28} />
                <span
                  className="hidden lg:inline text-sm font-medium max-w-[100px] truncate"
                  style={{ color: 'var(--adm-text)' }}
                >
                  {displayName}
                </span>
              </button>

              {/* Back to site */}
              <button
                onClick={() => { setActiveModule(null); onClose(); }}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                style={{ color: 'var(--adm-muted)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--adm-text)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--adm-muted)')}
              >
                Voltar ao Site
              </button>

              {/* Logout */}
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg border border-cpe-red/30 text-cpe-red hover:bg-cpe-red/10 transition-colors"
              >
                <LogOut size={16} /> Sair
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────── */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 pb-28 sm:pb-10">
        {activeModule === 'settings' && isSuperAdmin ? (
          <SettingsModule onBack={() => setActiveModule(null)} />
        ) : activeModule === 'efetivo' ? (
          <EfetivoModule onBack={() => setActiveModule(null)} permissions={getModulePermissions('efetivo')} />
        ) : activeModule === 'aniversariantes' ? (
          <AniversariantesModule onBack={() => setActiveModule(null)} permissions={getModulePermissions('aniversariantes')} />
        ) : activeModule === 'plano-chamada' ? (
          <PlanoChamadaModule onBack={() => setActiveModule(null)} permissions={getModulePermissions('plano-chamada')} />
        ) : activeModule === 'fotos' ? (
          <FotosModule onBack={() => setActiveModule(null)} permissions={getModulePermissions('fotos')} />
        ) : activeModule === 'mapa-efetivo' ? (
          <MapaEfetivoModule onBack={() => setActiveModule(null)} permissions={getModulePermissions('mapa-efetivo')} />
        ) : activeModule === 'agenda-audiencias' ? (
          <AgendaAudienciasModule onBack={() => setActiveModule(null)} permissions={getModulePermissions('agenda-audiencias')} />
        ) : activeModule === 'dispenca-recompensa' ? (
          <DispensaRecompensaModule onBack={() => setActiveModule(null)} permissions={getModulePermissions('dispenca-recompensa')} />
        ) : (
          <>
            <div className="mb-8 sm:mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--adm-text)' }}>Módulos</h2>
              <p className="mt-1 text-sm sm:text-base" style={{ color: 'var(--adm-muted)' }}>Selecione um módulo para gerenciar</p>
            </div>

            {visibleModules.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-20 rounded-2xl border"
                style={{ background: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}
              >
                <Shield size={48} className="mb-4 opacity-30" style={{ color: 'var(--adm-muted)' }} />
                <p className="text-lg font-semibold" style={{ color: 'var(--adm-text)' }}>Sem acesso a módulos</p>
                <p className="text-sm mt-1" style={{ color: 'var(--adm-muted)' }}>
                  Você não possui permissão para acessar nenhum módulo. Contate o administrador.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {visibleModules.map(mod => {
                  const Icon = mod.icon;
                  return (
                    <button
                      key={mod.id}
                      onClick={() => setActiveModule(mod.id)}
                      className="adm-card group flex flex-col items-center justify-center gap-4 sm:gap-6 p-6 sm:p-10 rounded-2xl transition-all duration-200 hover:scale-105 hover:shadow-2xl cursor-pointer min-h-[150px] sm:min-h-[200px] border"
                      style={{ background: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}
                      aria-label={mod.label}
                    >
                      <div
                        className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200"
                        style={{ background: 'var(--adm-input)' }}
                      >
                        <Icon size={36} className="sm:hidden" style={{ color: 'var(--adm-muted)' }} />
                        <Icon size={52} className="hidden sm:block" style={{ color: 'var(--adm-muted)' }} />
                      </div>
                      <span className="font-semibold text-sm sm:text-base text-center leading-snug" style={{ color: 'var(--adm-text)' }}>
                        {mod.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Mobile Bottom Tab Bar (iOS style) ────────────────── */}
      <div
        className="sm:hidden fixed bottom-0 left-0 right-0 z-20 border-t backdrop-blur-sm"
        style={{
          background: 'var(--adm-header)',
          borderColor: 'var(--adm-border)',
          paddingBottom: 'env(safe-area-inset-bottom, 8px)',
        }}
      >
        <div className="flex items-stretch justify-around px-1 pt-1 pb-1">

          {/* Profile */}
          <button
            onClick={() => setShowProfile(true)}
            className="flex flex-col items-center gap-0.5 flex-1 py-2 px-1 rounded-xl transition-colors"
            style={{ color: 'var(--adm-muted)' }}
          >
            <AvatarBubble size={26} />
            <span className="text-[10px] font-medium mt-0.5">Perfil</span>
          </button>

          {/* Theme */}
          <button
            onClick={() => setShowThemes(v => !v)}
            className="flex flex-col items-center gap-0.5 flex-1 py-2 px-1 rounded-xl transition-colors"
            style={{ color: showThemes ? 'var(--adm-accent)' : 'var(--adm-muted)' }}
          >
            <Palette size={22} />
            <span className="text-[10px] font-medium">Tema</span>
          </button>

          {/* Settings — super admin only */}
          {isSuperAdmin && (
            <button
              onClick={() => setActiveModule(activeModule === 'settings' ? null : 'settings')}
              className="flex flex-col items-center gap-0.5 flex-1 py-2 px-1 rounded-xl transition-colors"
              style={{ color: activeModule === 'settings' ? 'var(--adm-accent)' : 'var(--adm-muted)' }}
            >
              <Settings size={22} />
              <span className="text-[10px] font-medium">Config.</span>
            </button>
          )}

          {/* Back to site */}
          <button
            onClick={() => { setActiveModule(null); onClose(); }}
            className="flex flex-col items-center gap-0.5 flex-1 py-2 px-1 rounded-xl transition-colors"
            style={{ color: 'var(--adm-muted)' }}
          >
            <ArrowLeft size={22} />
            <span className="text-[10px] font-medium">Site</span>
          </button>

          {/* Logout */}
          <button
            onClick={handleSignOut}
            className="flex flex-col items-center gap-0.5 flex-1 py-2 px-1 rounded-xl transition-colors text-cpe-red"
          >
            <LogOut size={22} />
            <span className="text-[10px] font-medium">Sair</span>
          </button>
        </div>
      </div>

      {/* Mobile theme sheet — renders above bottom tab bar */}
      {showThemes && (
        <>
          <div className="sm:hidden fixed inset-0 z-20" onClick={() => setShowThemes(false)} />
          <div
            className="sm:hidden fixed inset-x-4 z-30 rounded-2xl shadow-2xl overflow-hidden py-2"
            style={{
              bottom: 'calc(env(safe-area-inset-bottom, 8px) + 66px)',
              background: 'var(--adm-dropdown)',
              border: '1px solid var(--adm-border)',
            }}
          >
            <ThemeList />
          </div>
        </>
      )}

      {/* Profile Modal */}
      {showProfile && (
        <ProfileModal
          profile={userProfile}
          email={adminUser?.email ?? ''}
          onClose={() => setShowProfile(false)}
          onRefresh={refreshProfile}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
