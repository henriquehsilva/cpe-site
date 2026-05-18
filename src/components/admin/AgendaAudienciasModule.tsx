import { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  ArrowLeft, Plus, Eye, Pencil, Trash2, X, Save, Search,
  Copy,
  Download, FileSpreadsheet, Printer, ChevronUp, ChevronDown, AlertCircle,
  CalendarPlus,
} from 'lucide-react';
import {
  agendaAudienciasDB, Audiencia, Modalidade, MODALIDADES,
  MESES_AUDIENCIA, audienciaOrd,
} from '../../data/agendaAudiencias';
import { ModulePermission } from '../../types/rbac';
import { usePersistentState } from '../../hooks/usePersistentState';

// ── helpers ──────────────────────────────────────────────────────────────

function nextId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function dayOf(data: string): number {
  return parseInt(data.split('/')[0] ?? '0', 10);
}

function horarioMin(h: string): number {
  const m = h.match(/(\d+)h(\d+)/);
  return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : 0;
}

// Unique month+year groups present in the dataset
function monthGroups(data: Audiencia[]): { mes: number; ano: number; label: string }[] {
  const seen = new Map<string, { mes: number; ano: number }>();
  for (const a of data) {
    const key = `${a.ano}-${a.mes}`;
    if (!seen.has(key)) seen.set(key, { mes: a.mes, ano: a.ano });
  }
  return [...seen.values()]
    .sort((a, b) => a.ano !== b.ano ? a.ano - b.ano : a.mes - b.mes)
    .map(g => ({ ...g, label: `${MESES_AUDIENCIA[g.mes - 1]} ${g.ano}` }));
}

// ── XLSX export ───────────────────────────────────────────────────────────

function buildSheet(rows: Audiencia[]): (string | number)[][] {
  const header = ['Data', 'Horário', 'Local', 'Posto/Grad.', 'Modalidade', 'SEI'];
  const data   = rows.map(a => [a.data, a.horario, a.local, a.postoGrad, a.modalidade, a.sei]);
  return [[], [], [], [], [], [], header, ...data];
}

function exportXLSX(all: Audiencia[], months: { mes: number; ano: number; label: string }[]) {
  const wb = XLSX.utils.book_new();
  for (const g of months) {
    const rows = all
      .filter(a => a.mes === g.mes && a.ano === g.ano)
      .sort((a, b) => audienciaOrd(a) - audienciaOrd(b));
    const ws = XLSX.utils.aoa_to_sheet([
      [`${MESES_AUDIENCIA[g.mes - 1].toUpperCase()}/${g.ano}`],
      [],
      ...buildSheet(rows).slice(2),
    ]);
    ws['!cols'] = [{ wch: 8 }, { wch: 10 }, { wch: 44 }, { wch: 22 }, { wch: 18 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, ws, g.label);
  }
  XLSX.writeFile(wb, 'agenda_audiencias.xlsx');
}

function exportPrint(rows: Audiencia[], title: string) {
  const bodyRows = rows.map(a => `
    <tr>
      <td>${a.data}</td><td>${a.horario}</td><td>${a.local}</td>
      <td>${a.postoGrad}</td>
      <td class="${a.modalidade === 'PRESENCIALMENTE' ? 'pres' : 'vid'}">${a.modalidade}</td>
      <td>${a.sei}</td>
    </tr>`).join('');
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <title>${title}</title>
    <style>
      body{font-family:Arial;font-size:10px;margin:16px}
      h2{font-size:13px;margin-bottom:8px}
      table{border-collapse:collapse;width:100%}
      th,td{border:1px solid #bbb;padding:3px 6px;white-space:nowrap}
      th{background:#2d2d2d;color:#fff;font-size:9px;text-transform:uppercase}
      .vid{color:#1d6fcd;font-style:italic}.pres{color:#b45309;font-style:italic}
    </style></head><body>
    <h2>${title}</h2>
    <table>
      <thead><tr><th>Data</th><th>Horário</th><th>Local</th><th>Posto/Grad.</th><th>Modalidade</th><th>SEI</th></tr></thead>
      <tbody>${bodyRows}</tbody>
    </table></body></html>`;
  const w = window.open('', '_blank');
  if (w) { w.document.write(html); w.document.close(); w.print(); }
}

// ── empty form ────────────────────────────────────────────────────────────

function emptyForm(mes: number, ano: number): Omit<Audiencia, 'id'> {
  return { mes, ano, data: '', horario: '', local: '', postoGrad: '', modalidade: 'VIDEOCONFERÊNCIA', sei: '' };
}

// ── Google Calendar link ──────────────────────────────────────────────────

function buildGCalUrl(a: Audiencia): string {
  const [day, month] = a.data.split('/').map(Number);
  const hm   = a.horario.match(/(\d+)h(\d+)/);
  const hour = hm ? parseInt(hm[1], 10) : 9;
  const min  = hm ? parseInt(hm[2], 10) : 0;
  const pad  = (n: number) => String(n).padStart(2, '0');
  const base = `${a.ano}${pad(month)}${pad(day)}`;
  const start = `${base}T${pad(hour)}${pad(min)}00`;
  const end   = `${base}T${pad(hour + 1)}${pad(min)}00`;
  const details = [
    `Modalidade: ${a.modalidade}`,
    a.sei ? `SEI: ${a.sei}` : '',
  ].filter(Boolean).join('\n');
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text:   `Audiência — ${a.postoGrad}`,
    dates:  `${start}/${end}`,
    details,
    location: a.local,
    sf: 'true',
    output: 'xml',
  });
  return `https://www.google.com/calendar/render?${params}`;
}

// ── sort helpers ──────────────────────────────────────────────────────────

type SortKey = 'data' | 'horario' | 'local' | 'postoGrad' | 'modalidade' | 'sei';
type SortDir = 'asc' | 'desc';

function compare(a: Audiencia, b: Audiencia, key: SortKey, dir: SortDir): number {
  let cmp: number;
  if (key === 'data')    cmp = dayOf(a.data) - dayOf(b.data) || horarioMin(a.horario) - horarioMin(b.horario);
  else if (key === 'horario') cmp = horarioMin(a.horario) - horarioMin(b.horario);
  else                   cmp = a[key].localeCompare(b[key], 'pt-BR');
  return dir === 'asc' ? cmp : -cmp;
}

// ── component ─────────────────────────────────────────────────────────────

type ModalMode = 'view' | 'edit' | 'create';

interface FormErrors { data?: string; postoGrad?: string; local?: string; }

interface Props {
  onBack: () => void;
  permissions?: ModulePermission;
}

export default function AgendaAudienciasModule({ onBack, permissions }: Props) {
  const canCreate = !permissions || permissions.create;
  const canEdit   = !permissions || permissions.edit;
  const canDelete = !permissions || permissions.delete;

  const [data, setData]           = usePersistentState<Audiencia[]>('cpe-site:agenda-audiencias:v1', agendaAudienciasDB);
  const [search, setSearch]       = useState('');
  const [activeMes, setActiveMes] = useState<string>('all'); // "all" or "YYYY-M"
  const [sortKey, setSortKey]     = useState<SortKey>('data');
  const [sortDir, setSortDir]     = useState<SortDir>('asc');
  const [modal, setModal]         = useState<{ mode: ModalMode; item: Audiencia | null } | null>(null);
  const [form, setForm]           = useState<Omit<Audiencia, 'id'>>(emptyForm(5, 2026));
  const [errors, setErrors]       = useState<FormErrors>({});
  const [deleteTarget, setDeleteTarget] = useState<Audiencia | null>(null);
  const [showExport, setShowExport]     = useState(false);

  // derived month groups (from *all* data)
  const months = useMemo(() => monthGroups(data), [data]);

  // active month parsed
  const activeGroup = useMemo(() => {
    if (activeMes === 'all') return null;
    const [ano, mes] = activeMes.split('-').map(Number);
    return { ano, mes };
  }, [activeMes]);

  // filtered + sorted rows
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return data
      .filter(a => {
        if (activeGroup && (a.mes !== activeGroup.mes || a.ano !== activeGroup.ano)) return false;
        if (!q) return true;
        return (
          a.data.includes(q) || a.horario.includes(q) ||
          a.local.toLowerCase().includes(q) ||
          a.postoGrad.toLowerCase().includes(q) ||
          a.sei.includes(q) ||
          a.modalidade.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => compare(a, b, sortKey, sortDir));
  }, [data, search, activeGroup, sortKey, sortDir]);

  // toggle sort
  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const SortIcon = ({ col }: { col: SortKey }) =>
    sortKey === col
      ? sortDir === 'asc'
        ? <ChevronUp   size={12} className="inline ml-0.5" />
        : <ChevronDown size={12} className="inline ml-0.5" />
      : <ChevronUp size={12} className="inline ml-0.5 opacity-20" />;

  // ── form helpers ──────────────────────────────────────────────────────
  const changeField = <K extends keyof Omit<Audiencia, 'id'>>(key: K, val: Omit<Audiencia, 'id'>[K]) => {
    setForm(f => ({ ...f, [key]: val }));
    if (key in errors) setErrors(e => ({ ...e, [key]: undefined }));
  };

  const validate = (): boolean => {
    const errs: FormErrors = {};
    if (!form.data.trim())      errs.data      = 'Data obrigatória';
    if (!form.postoGrad.trim()) errs.postoGrad = 'Posto/Grad. obrigatório';
    if (!form.local.trim())     errs.local     = 'Local obrigatório';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── modal helpers ─────────────────────────────────────────────────────
  const defaultMonth = months.length ? months[months.length - 1] : { mes: 5, ano: 2026 };

  const openCreate = () => {
    const g = activeGroup ?? defaultMonth;
    setForm(emptyForm(g.mes, g.ano));
    setErrors({});
    setModal({ mode: 'create', item: null });
  };
  const openView  = (a: Audiencia) => { setForm(a); setErrors({}); setModal({ mode: 'view', item: a }); };
  const openEdit  = (a: Audiencia) => { setForm(a); setErrors({}); setModal({ mode: 'edit', item: a }); };
  const closeModal = () => setModal(null);

  const handleSave = () => {
    if (!validate()) return;
    if (modal?.mode === 'create') {
      setData(d => [...d, { ...form, id: nextId() }]);
    } else if (modal?.mode === 'edit' && modal.item) {
      setData(d => d.map(a => a.id === modal.item!.id ? { ...form, id: modal.item!.id } : a));
    }
    setSortKey('data');
    setSortDir('asc');
    closeModal();
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setData(d => d.filter(a => a.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  // ── styles ────────────────────────────────────────────────────────────
  const fs  = { background: 'var(--adm-input)', color: 'var(--adm-text)', border: '1px solid var(--adm-border)' };
  const isRO = modal?.mode === 'view';
  const roS  = { ...fs, opacity: 0.7 };
  const inputCls = (err?: string) =>
    `adm-input w-full rounded-lg px-3 py-2.5 text-base border transition-colors ${err ? 'border-red-500/70' : ''}`;

  const modalBadge = (m: Modalidade) =>
    m === 'PRESENCIALMENTE'
      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
      : 'bg-blue-500/15 text-blue-400 border border-blue-500/30';

  // export title for current view
  const printTitle = activeGroup
    ? `Agenda de Audiências — ${MESES_AUDIENCIA[activeGroup.mes - 1]} ${activeGroup.ano}`
    : 'Agenda de Audiências — Todos os Meses';

  return (
    <div className="flex flex-col h-full">

      {/* ── toolbar ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <button onClick={onBack}
          className="flex items-center gap-1.5 transition-colors text-base font-medium"
          style={{ color: 'var(--adm-muted)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--adm-text)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--adm-muted)')}>
          <ArrowLeft size={17} /> Módulos
        </button>
        <span style={{ color: 'var(--adm-border)' }} className="hidden sm:block">|</span>
        <h3 className="font-bold text-2xl flex-1" style={{ color: 'var(--adm-text)' }}>
          Agenda de Audiências
        </h3>
        <span className="text-sm" style={{ color: 'var(--adm-muted)' }}>
          {filtered.length} audiência{filtered.length !== 1 ? 's' : ''}
        </span>

        {/* export */}
        <div className="relative">
          <button onClick={() => setShowExport(v => !v)}
            className="flex items-center gap-2 border rounded-lg px-3 py-2 text-sm font-medium transition-colors"
            style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)', background: 'var(--adm-input)' }}>
            <Download size={15} /> Exportar
          </button>
          {showExport && (
            <div className="absolute right-0 top-full mt-1 rounded-xl shadow-2xl z-20 w-56 py-1.5 overflow-hidden"
              style={{ background: 'var(--adm-dropdown)', border: '1px solid var(--adm-border)' }}>
              <button onClick={() => { exportXLSX(data, months); setShowExport(false); }}
                className="adm-drop-item flex items-center gap-3 w-full px-4 py-3 text-sm transition-colors"
                style={{ color: 'var(--adm-text)' }}>
                <FileSpreadsheet size={15} className="text-emerald-400" /> XLSX (todas as abas)
              </button>
              {activeGroup && (
                <button onClick={() => { exportXLSX(data, months.filter(m => m.mes === activeGroup.mes && m.ano === activeGroup.ano)); setShowExport(false); }}
                  className="adm-drop-item flex items-center gap-3 w-full px-4 py-3 text-sm transition-colors"
                  style={{ color: 'var(--adm-text)' }}>
                  <FileSpreadsheet size={15} className="text-blue-400" /> XLSX (este mês)
                </button>
              )}
              <button onClick={() => { exportPrint(filtered, printTitle); setShowExport(false); }}
                className="adm-drop-item flex items-center gap-3 w-full px-4 py-3 text-sm transition-colors"
                style={{ color: 'var(--adm-text)' }}>
                <Printer size={15} style={{ color: 'var(--adm-muted)' }} /> Imprimir / PDF
              </button>
            </div>
          )}
        </div>

        {canCreate && (
          <button onClick={openCreate}
            className="flex items-center gap-2 bg-cpe-red hover:bg-cpe-red/80 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
            <Plus size={15} /> Nova Audiência
          </button>
        )}
      </div>

      {/* ── month tabs ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setActiveMes('all')}
          className="px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors"
          style={{
            borderColor: activeMes === 'all' ? 'var(--adm-accent)' : 'var(--adm-border)',
            color:       activeMes === 'all' ? 'var(--adm-accent)' : 'var(--adm-muted)',
            background:  activeMes === 'all' ? 'color-mix(in srgb, var(--adm-accent) 10%, transparent)' : 'var(--adm-input)',
          }}>
          Todos
        </button>
        {months.map(g => {
          const key = `${g.ano}-${g.mes}`;
          const active = activeMes === key;
          return (
            <button key={key} onClick={() => setActiveMes(key)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors"
              style={{
                borderColor: active ? 'var(--adm-accent)' : 'var(--adm-border)',
                color:       active ? 'var(--adm-accent)' : 'var(--adm-muted)',
                background:  active ? 'color-mix(in srgb, var(--adm-accent) 10%, transparent)' : 'var(--adm-input)',
              }}>
              {g.label}
            </button>
          );
        })}
      </div>

      {/* ── search ───────────────────────────────────────────────────── */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--adm-muted)' }} />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nome, local, data ou SEI…"
          className="adm-input w-full rounded-xl pl-10 pr-10 py-3 text-sm border"
          style={{ background: 'var(--adm-input)', color: 'var(--adm-text)', border: '1px solid var(--adm-border)' }} />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--adm-muted)' }}><X size={15} /></button>
        )}
      </div>

      {/* ── table ────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto rounded-xl border" style={{ borderColor: 'var(--adm-border)' }}>
        <table className="w-full text-sm" style={{ minWidth: 780 }}>
          <thead className="sticky top-0 z-10" style={{ background: 'var(--adm-tbl-head)' }}>
            <tr className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--adm-muted)' }}>
              {(
                [
                  ['data',       'Data'],
                  ['horario',    'Horário'],
                  ['local',      'Local'],
                  ['postoGrad',  'Posto / Grad.'],
                  ['modalidade', 'Modalidade'],
                  ['sei',        'SEI'],
                ] as [SortKey, string][]
              ).map(([key, label]) => (
                <th key={key} className="px-3 py-3.5 text-left cursor-pointer hover:opacity-100 opacity-80 select-none"
                  onClick={() => toggleSort(key)}>
                  {label} <SortIcon col={key} />
                </th>
              ))}
              <th className="px-3 py-3.5 text-center w-28">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a, i) => (
              <tr key={a.id} className="adm-row border-t transition-colors"
                style={{
                  borderColor: 'var(--adm-border)',
                  background: i % 2 === 0 ? 'var(--adm-row-even)' : 'transparent',
                }}>
                <td className="px-3 py-3 font-semibold tabular-nums whitespace-nowrap" style={{ color: 'var(--adm-text)' }}>
                  {a.data}
                </td>
                <td className="px-3 py-3 tabular-nums whitespace-nowrap" style={{ color: 'var(--adm-muted)' }}>
                  {a.horario}
                </td>
                <td className="px-3 py-3 max-w-xs" style={{ color: 'var(--adm-text)' }}>
                  <span className="line-clamp-1">{a.local}</span>
                </td>
                <td className="px-3 py-3 font-medium whitespace-nowrap" style={{ color: 'var(--adm-text)' }}>
                  {a.postoGrad}
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${modalBadge(a.modalidade)}`}>
                    {a.modalidade === 'VIDEOCONFERÊNCIA' ? 'VIDEO' : 'PRESENCIAL'}
                  </span>
                </td>
                <td className="px-3 py-3 tabular-nums text-xs" style={{ color: 'var(--adm-muted)' }}>
                  {a.sei}
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center justify-center gap-0.5">
                    <button onClick={() => openView(a)} title="Visualizar"
                      className="p-1.5 rounded-lg hover:bg-blue-400/10 text-blue-400 opacity-70 hover:opacity-100 transition-colors">
                      <Eye size={15} />
                    </button>
                    <a href={buildGCalUrl(a)} target="_blank" rel="noreferrer"
                      title="Adicionar ao Google Agenda"
                      className="p-1.5 rounded-lg hover:bg-emerald-400/10 text-emerald-400 opacity-70 hover:opacity-100 transition-colors">
                      <CalendarPlus size={15} />
                    </a>
                    {canEdit && (
                      <button onClick={() => openEdit(a)} title="Editar"
                        className="p-1.5 rounded-lg hover:bg-amber-400/10 text-amber-400 opacity-70 hover:opacity-100 transition-colors">
                        <Pencil size={15} />
                      </button>
                    )}
                    {canCreate && (
                      <button onClick={() => {
                        const { id: _, ...rest } = a as any;
                        setForm(rest);
                        setErrors({});
                        setModal({ mode: 'create', item: null });
                      }} title="Duplicar"
                        className="p-1.5 rounded-lg hover:bg-slate-400/10 text-slate-400 opacity-70 hover:opacity-100 transition-colors">
                        <Copy size={15} />
                      </button>
                    )}
                    {canDelete && (
                      <button onClick={() => setDeleteTarget(a)} title="Excluir"
                        className="p-1.5 rounded-lg hover:bg-cpe-red/10 text-cpe-red opacity-70 hover:opacity-100 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-20 text-center text-base" style={{ color: 'var(--adm-subtle)' }}>
                  Nenhuma audiência encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── view / edit / create modal ────────────────────────────────── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl shadow-2xl border"
            style={{ background: 'var(--adm-modal)', borderColor: 'var(--adm-border)' }}>

            {/* header */}
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--adm-border)' }}>
              <h4 className="font-bold text-xl" style={{ color: 'var(--adm-text)' }}>
                {modal.mode === 'create' ? 'Nova Audiência'
                  : modal.mode === 'edit' ? 'Editar Audiência'
                  : 'Visualizar Audiência'}
              </h4>
              <button onClick={closeModal} style={{ color: 'var(--adm-muted)' }}><X size={22} /></button>
            </div>

            {/* fields */}
            <div className="px-6 py-5 grid grid-cols-2 gap-4">

              {/* Mês / Ano */}
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Mês</label>
                {isRO ? (
                  <input readOnly value={MESES_AUDIENCIA[form.mes - 1]} className={inputCls()} style={roS} />
                ) : (
                  <select value={form.mes} onChange={e => changeField('mes', +e.target.value)}
                    className="adm-input w-full rounded-lg px-3 py-2.5 text-base border" style={fs}>
                    {MESES_AUDIENCIA.map((n, i) => <option key={i + 1} value={i + 1}>{n}</option>)}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Ano</label>
                <input type={isRO ? 'text' : 'number'} value={form.ano}
                  onChange={e => changeField('ano', +e.target.value)}
                  readOnly={isRO} className={inputCls()} style={isRO ? roS : fs} />
              </div>

              {/* Data */}
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Data</label>
                <input type="text" value={form.data}
                  onChange={e => changeField('data', e.target.value)}
                  readOnly={isRO} placeholder="DD/MM"
                  className={inputCls(errors.data)}
                  style={isRO ? roS : { ...fs, ...(errors.data ? { borderColor: '#ef4444' } : {}) }} />
                {errors.data && (
                  <p className="text-sm mt-1 text-red-400 flex items-center gap-1"><AlertCircle size={13} /> {errors.data}</p>
                )}
              </div>

              {/* Horário */}
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Horário</label>
                <input type="text" value={form.horario}
                  onChange={e => changeField('horario', e.target.value)}
                  readOnly={isRO} placeholder="14h00min"
                  className={inputCls()} style={isRO ? roS : fs} />
              </div>

              {/* Modalidade */}
              <div className="col-span-2">
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Modalidade</label>
                {isRO ? (
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold ${modalBadge(form.modalidade)}`}>
                    {form.modalidade}
                  </span>
                ) : (
                  <select value={form.modalidade} onChange={e => changeField('modalidade', e.target.value as Modalidade)}
                    className="adm-input w-full rounded-lg px-3 py-2.5 text-base border" style={fs}>
                    {MODALIDADES.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                )}
              </div>

              {/* Posto/Grad. */}
              <div className="col-span-2">
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Posto / Graduação</label>
                <input type="text" value={form.postoGrad}
                  onChange={e => changeField('postoGrad', e.target.value)}
                  readOnly={isRO}
                  className={inputCls(errors.postoGrad)}
                  style={isRO ? roS : { ...fs, ...(errors.postoGrad ? { borderColor: '#ef4444' } : {}) }} />
                {errors.postoGrad && (
                  <p className="text-sm mt-1 text-red-400 flex items-center gap-1"><AlertCircle size={13} /> {errors.postoGrad}</p>
                )}
              </div>

              {/* Local */}
              <div className="col-span-2">
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Local</label>
                <input type="text" value={form.local}
                  onChange={e => changeField('local', e.target.value)}
                  readOnly={isRO}
                  className={inputCls(errors.local)}
                  style={isRO ? roS : { ...fs, ...(errors.local ? { borderColor: '#ef4444' } : {}) }} />
                {errors.local && (
                  <p className="text-sm mt-1 text-red-400 flex items-center gap-1"><AlertCircle size={13} /> {errors.local}</p>
                )}
              </div>

              {/* SEI */}
              <div className="col-span-2">
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Número SEI</label>
                <input type="text" value={form.sei}
                  onChange={e => changeField('sei', e.target.value)}
                  readOnly={isRO} placeholder="202600002000000"
                  className={inputCls()} style={isRO ? roS : fs} />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 px-6 pb-5">
              <a href={buildGCalUrl({ ...form, id: modal?.item?.id ?? '' })}
                target="_blank" rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg border transition-colors"
                style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)', background: 'transparent' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--adm-text)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--adm-muted)')}>
                <CalendarPlus size={15} /> Google Agenda
              </a>
              {!isRO && (
                <div className="flex gap-3">
                  <button onClick={closeModal}
                    className="px-5 py-2.5 text-base rounded-lg border transition-colors"
                    style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)', background: 'transparent' }}>
                    Cancelar
                  </button>
                  <button onClick={handleSave}
                    className="flex items-center gap-2 px-5 py-2.5 text-base font-semibold text-white bg-cpe-red hover:bg-cpe-red/80 rounded-lg transition-colors">
                    <Save size={16} /> Salvar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── delete confirm ────────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl shadow-2xl border p-6"
            style={{ background: 'var(--adm-modal)', borderColor: 'var(--adm-border)' }}>
            <h4 className="font-bold text-xl mb-2" style={{ color: 'var(--adm-text)' }}>Confirmar exclusão</h4>
            <p className="text-base mb-1" style={{ color: 'var(--adm-muted)' }}>
              Deseja excluir a audiência de{' '}
              <span className="font-semibold" style={{ color: 'var(--adm-text)' }}>{deleteTarget.postoGrad}</span>
            </p>
            <p className="text-sm mb-6" style={{ color: 'var(--adm-subtle)' }}>
              {deleteTarget.data} às {deleteTarget.horario} — {deleteTarget.local}
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteTarget(null)}
                className="px-5 py-2.5 text-base rounded-lg border transition-colors"
                style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)', background: 'transparent' }}>
                Cancelar
              </button>
              <button onClick={handleDelete}
                className="flex items-center gap-2 px-5 py-2.5 text-base font-semibold text-white bg-cpe-red hover:bg-cpe-red/80 rounded-lg transition-colors">
                <Trash2 size={16} /> Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
