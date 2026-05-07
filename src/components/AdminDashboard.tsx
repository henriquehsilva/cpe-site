import { useState, useMemo } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import {
  Users, CalendarDays, Cake, PhoneCall, Scale,
  Award, Gift, BookOpen, LogOut, Shield, Palette, Settings,
} from 'lucide-react';
import EfetivoModule from './admin/EfetivoModule';
import AniversariantesModule from './admin/AniversariantesModule';
import PlanoChamadaModule from './admin/PlanoChamadaModule';
import SettingsModule from './admin/SettingsModule';
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
  { id: 'dispenca-recompensa',label: 'Dispença Recompensa', icon: Gift },
  { id: 'lesp',               label: 'LESP',                icon: BookOpen },
];

const AdminDashboard = ({ onClose }: AdminDashboardProps) => {
  const { isSuperAdmin, permissions } = useRBAC();
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [themeId, setThemeId] = useState('caverna');
  const [showThemes, setShowThemes] = useState(false);

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
    const perm = permissions[key];
    return perm ?? undefined;
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

      {/* Header */}
      <div
        className="sticky top-0 z-10 border-b backdrop-blur-sm"
        style={{ background: 'var(--adm-header)', borderColor: 'var(--adm-border)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Shield size={24} className="text-cpe-red" />
              <span className="font-bold text-lg" style={{ color: 'var(--adm-text)' }}>
                Painel Administrativo
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Gear icon — only for super admin */}
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
                  onMouseEnter={e => {
                    if (activeModule !== 'settings') {
                      e.currentTarget.style.color = 'var(--adm-text)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (activeModule !== 'settings') {
                      e.currentTarget.style.color = 'var(--adm-muted)';
                    }
                  }}
                >
                  <Settings size={16} />
                  <span className="hidden sm:inline">Configurações</span>
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
                  <span className="hidden sm:inline">{theme.name}</span>
                </button>

                {showThemes && (
                  <div
                    className="absolute right-0 top-full mt-1 rounded-xl shadow-2xl z-30 overflow-hidden py-2 min-w-[160px]"
                    style={{ background: 'var(--adm-dropdown)', border: '1px solid var(--adm-border)' }}
                  >
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
                            outline: themeId === t.id ? `2px solid var(--adm-accent)` : '2px solid transparent',
                            outlineOffset: '2px',
                          }}
                        />
                        {t.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => { setActiveModule(null); onClose(); }}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                style={{ color: 'var(--adm-muted)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--adm-text)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--adm-muted)')}
              >
                Voltar ao Site
              </button>

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

      {/* Content */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {activeModule === 'settings' && isSuperAdmin ? (
          <SettingsModule onBack={() => setActiveModule(null)} />
        ) : activeModule === 'efetivo' ? (
          <EfetivoModule onBack={() => setActiveModule(null)} permissions={getModulePermissions('efetivo')} />
        ) : activeModule === 'aniversariantes' ? (
          <AniversariantesModule onBack={() => setActiveModule(null)} permissions={getModulePermissions('aniversariantes')} />
        ) : activeModule === 'plano-chamada' ? (
          <PlanoChamadaModule onBack={() => setActiveModule(null)} permissions={getModulePermissions('plano-chamada')} />
        ) : (
          <>
            <div className="mb-10">
              <h2 className="text-3xl font-bold" style={{ color: 'var(--adm-text)' }}>Módulos</h2>
              <p className="mt-1 text-base" style={{ color: 'var(--adm-muted)' }}>Selecione um módulo para gerenciar</p>
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
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                {visibleModules.map(mod => {
                  const Icon = mod.icon;
                  return (
                    <button
                      key={mod.id}
                      onClick={() => setActiveModule(mod.id)}
                      className="adm-card group flex flex-col items-center justify-center gap-6 p-10 rounded-2xl transition-all duration-200 hover:scale-105 hover:shadow-2xl cursor-pointer min-h-[200px] border"
                      style={{ background: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}
                      aria-label={mod.label}
                    >
                      <div
                        className="w-24 h-24 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200"
                        style={{ background: 'var(--adm-input)' }}
                      >
                        <Icon size={52} style={{ color: 'var(--adm-muted)' }} />
                      </div>
                      <span className="font-semibold text-base text-center leading-snug" style={{ color: 'var(--adm-text)' }}>
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
    </div>
  );
};

export default AdminDashboard;
