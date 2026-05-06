import { useState, useMemo } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import {
  Users, CalendarDays, Cake, PhoneCall, Scale,
  Award, Gift, BookOpen, LogOut, Shield, Palette,
} from 'lucide-react';
import EfetivoModule from './admin/EfetivoModule';
import AniversariantesModule from './admin/AniversariantesModule';
import { THEMES } from '../data/themes';

interface AdminDashboardProps {
  onClose: () => void;
}

const modules = [
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

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto flex flex-col"
      style={{ ...cssVars, background: 'var(--adm-bg)' }}
    >
      {/* inject dynamic hover/focus rules */}
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
                onClick={onClose}
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
        {activeModule === 'efetivo' ? (
          <EfetivoModule onBack={() => setActiveModule(null)} />
        ) : activeModule === 'aniversariantes' ? (
          <AniversariantesModule onBack={() => setActiveModule(null)} />
        ) : (
          <>
            <div className="mb-10">
              <h2 className="text-3xl font-bold" style={{ color: 'var(--adm-text)' }}>Módulos</h2>
              <p className="mt-1 text-base" style={{ color: 'var(--adm-muted)' }}>Selecione um módulo para gerenciar</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {modules.map(mod => {
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
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
