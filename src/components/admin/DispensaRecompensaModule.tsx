import { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  ArrowLeft, Plus, Eye, Pencil, Trash2, X, Save,
  Search, Download, FileSpreadsheet, Printer, AlertCircle,
} from 'lucide-react';
import {
  dispensaCmdoDB, dispensaAnualDB, DispensaCmdo, DispensaAnual,
} from '../../data/dispensaRecompensa';
import { ModulePermission } from '../../types/rbac';
import { usePersistentState } from '../../hooks/usePersistentState';

// ── helpers ───────────────────────────────────────────────────────────────────

function nextId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// Reatribui ord = 1..N pela ordem atual (estável), eliminando duplicatas e furos.
function normalizeOrd<T extends { ord: number }>(list: T[]): T[] {
  return list
    .map((item, i) => ({ item, i }))
    .sort((a, b) => a.item.ord - b.item.ord || a.i - b.i)
    .map(({ item }, idx) => ({ ...item, ord: idx + 1 }));
}

function emptyDisp() {
  return Array.from({ length: 5 }, () => ({ data: '', dopm: '' }));
}

function hasCmdo(r: DispensaCmdo)  { return !!(r.periodo || r.dopm); }
function hasAnual(r: DispensaAnual) { return r.dispensas.some(d => d.data); }

// ── XLSX export ───────────────────────────────────────────────────────────────

const HDR_ROWS = [
  ['ESTADO DE GOIÁS'],
  ['SECRETARIA DE ESTADO DA SEGURANÇA PÚBLICA'],
  ['POLÍCIA MILITAR DO ESTADO DE GOIÁS'],
  ['3º COMANDO REGIONAL / 31ª CIPM-CPE - SEI nº 11849'],
  ['SEÇÃO ADMINISTRATIVA P/1'],
  [],
];

function exportXLSX(cmdo: DispensaCmdo[], anual: DispensaAnual[]) {
  const wb = XLSX.utils.book_new();

  // ── CMDO GERAL sheet
  const wsCmdo = XLSX.utils.aoa_to_sheet([
    ...HDR_ROWS,
    ['Dispensa Recompensa CMDO GERAL'],
    [],
    ['Ord', 'Posto/Grad.', 'RG', 'Nome', 'Período', 'DOPM', 'Nº SEI DO ITEM'],
    ...cmdo.map(r => [r.ord, r.posto, r.rg, r.nome, r.periodo, r.dopm, r.sei]),
  ]);
  wsCmdo['!cols'] = [
    { wch: 5 }, { wch: 12 }, { wch: 8 }, { wch: 36 },
    { wch: 16 }, { wch: 10 }, { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, wsCmdo, 'CMDO GERAL');

  // ── ANUAL 2026 sheet
  const wsAnual = XLSX.utils.aoa_to_sheet([
    ...HDR_ROWS,
    ['Dispensa Recompensa Ano 2026'],
    [],
    [
      'Ord', 'Posto/Grad.', 'RG', 'Nome',
      'DATA', 'DOPM', 'DATA', 'DOPM', 'DATA', 'DOPM', 'DATA', 'DOPM', 'DATA', 'DOPM',
    ],
    ...anual.map(r => [
      r.ord, r.posto, r.rg, r.nome,
      ...r.dispensas.flatMap(d => [d.data, d.dopm]),
    ]),
  ]);
  wsAnual['!cols'] = [
    { wch: 5 }, { wch: 12 }, { wch: 8 }, { wch: 36 },
    { wch: 8 }, { wch: 10 }, { wch: 8 }, { wch: 10 },
    { wch: 8 }, { wch: 10 }, { wch: 8 }, { wch: 10 },
    { wch: 8 }, { wch: 10 },
  ];
  XLSX.utils.book_append_sheet(wb, wsAnual, 'ANUAL 2026');

  XLSX.writeFile(wb, 'dispensa_recompensa.xlsx');
}

function exportPrint(cmdo: DispensaCmdo[], anual: DispensaAnual[]) {
  const cmdoRows = cmdo.map(r => `
    <tr>
      <td>${r.ord}</td><td>${r.posto}</td><td>${r.rg}</td><td>${r.nome}</td>
      <td>${r.periodo}</td><td>${r.dopm}</td><td>${r.sei}</td>
    </tr>`).join('');

  const anualRows = anual.map(r => `
    <tr>
      <td>${r.ord}</td><td>${r.posto}</td><td>${r.rg}</td><td>${r.nome}</td>
      ${r.dispensas.map(d => `<td>${d.data}</td><td>${d.dopm}</td>`).join('')}
    </tr>`).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <title>Dispensa Recompensa</title>
    <style>
      body{font-family:Arial;font-size:9px;margin:12px}
      h2{font-size:11px;margin:16px 0 6px}
      h3{font-size:10px;margin:12px 0 4px}
      table{border-collapse:collapse;width:100%;margin-bottom:16px}
      th,td{border:1px solid #bbb;padding:2px 5px}
      th{background:#2d2d2d;color:#fff;text-transform:uppercase;font-size:8px}
    </style></head><body>
    <h2>DISPENSA RECOMPENSA — CPE</h2>
    <h3>CMDO GERAL</h3>
    <table>
      <thead><tr>
        <th>Ord</th><th>Posto/Grad.</th><th>RG</th><th>Nome</th>
        <th>Período</th><th>DOPM</th><th>Nº SEI</th>
      </tr></thead>
      <tbody>${cmdoRows}</tbody>
    </table>
    <h3>ANUAL 2026</h3>
    <table>
      <thead><tr>
        <th>Ord</th><th>Posto/Grad.</th><th>RG</th><th>Nome</th>
        <th>Data</th><th>DOPM</th><th>Data</th><th>DOPM</th>
        <th>Data</th><th>DOPM</th><th>Data</th><th>DOPM</th>
        <th>Data</th><th>DOPM</th>
      </tr></thead>
      <tbody>${anualRows}</tbody>
    </table>
  </body></html>`;

  const w = window.open('', '_blank');
  if (w) { w.document.write(html); w.document.close(); w.print(); }
}

// ── types ─────────────────────────────────────────────────────────────────────

type Tab      = 'cmdo' | 'anual';
type ModalMode = 'view' | 'edit' | 'create';

interface CmdoForm {
  ord: number; posto: string; rg: string; nome: string;
  periodo: string; dopm: string; sei: string;
}

interface AnualForm {
  ord: number; posto: string; rg: string; nome: string;
  dispensas: { data: string; dopm: string }[];
}

interface Props {
  onBack: () => void;
  permissions?: ModulePermission;
}

// ── component ─────────────────────────────────────────────────────────────────

export default function DispensaRecompensaModule({ onBack, permissions }: Props) {
  const canCreate = !permissions || permissions.create;
  const canEdit   = !permissions || permissions.edit;
  const canDelete = !permissions || permissions.delete;

  const [cmdoData, setCmdoData]   = usePersistentState<DispensaCmdo[]>('cpe-site:dispensa-recompensa:cmdo:v1', dispensaCmdoDB);
  const [anualData, setAnualData] = usePersistentState<DispensaAnual[]>('cpe-site:dispensa-recompensa:anual:v1', dispensaAnualDB);

  // Auto-corrige dados já persistidos com Ord duplicado ou fora de sequência.
  useEffect(() => {
    const normalized = normalizeOrd(cmdoData);
    if (JSON.stringify(normalized) !== JSON.stringify(cmdoData)) setCmdoData(normalized);
  }, [cmdoData, setCmdoData]);

  useEffect(() => {
    const normalized = normalizeOrd(anualData);
    if (JSON.stringify(normalized) !== JSON.stringify(anualData)) setAnualData(normalized);
  }, [anualData, setAnualData]);
  const [tab, setTab]             = useState<Tab>('cmdo');
  const [search, setSearch]       = useState('');
  const [soComDispensa, setSoComDispensa] = useState(false);
  const [showExport, setShowExport]       = useState(false);

  // ── CMDO modal state
  const [cmdoModal, setCmdoModal]   = useState<{ mode: ModalMode; item: DispensaCmdo | null } | null>(null);
  const [cmdoForm, setCmdoForm]     = useState<CmdoForm>({ ord: 0, posto: '', rg: '', nome: '', periodo: '', dopm: '', sei: '' });
  const [cmdoErr,  setCmdoErr]      = useState<{ nome?: string }>({});
  const [delCmdo,  setDelCmdo]      = useState<DispensaCmdo | null>(null);

  // ── ANUAL modal state
  const [anualModal, setAnualModal] = useState<{ mode: ModalMode; item: DispensaAnual | null } | null>(null);
  const [anualForm, setAnualForm]   = useState<AnualForm>({ ord: 0, posto: '', rg: '', nome: '', dispensas: emptyDisp() });
  const [anualErr,  setAnualErr]    = useState<{ nome?: string }>({});
  const [delAnual,  setDelAnual]    = useState<DispensaAnual | null>(null);

  // ── filtered rows
  const filteredCmdo = useMemo(() => {
    const q = search.toLowerCase();
    return cmdoData.filter(r => {
      if (soComDispensa && !hasCmdo(r)) return false;
      if (!q) return true;
      return (
        r.nome.toLowerCase().includes(q) || r.posto.toLowerCase().includes(q) ||
        r.rg.includes(q) || r.periodo.toLowerCase().includes(q) ||
        r.dopm.toLowerCase().includes(q) || r.sei.includes(q)
      );
    });
  }, [cmdoData, search, soComDispensa]);

  const filteredAnual = useMemo(() => {
    const q = search.toLowerCase();
    return anualData.filter(r => {
      if (soComDispensa && !hasAnual(r)) return false;
      if (!q) return true;
      return (
        r.nome.toLowerCase().includes(q) || r.posto.toLowerCase().includes(q) ||
        r.rg.includes(q) ||
        r.dispensas.some(d => d.data.includes(q) || d.dopm.toLowerCase().includes(q))
      );
    });
  }, [anualData, search, soComDispensa]);

  // ── shared styles
  const fs  = { background: 'var(--adm-input)', color: 'var(--adm-text)', border: '1px solid var(--adm-border)' };
  const roS = { ...fs, opacity: 0.7 };
  const inputCls = (err?: string) =>
    `adm-input w-full rounded-lg px-3 py-2.5 text-sm border transition-colors ${err ? 'border-red-500/70' : ''}`;

  // ── CMDO GERAL handlers ──────────────────────────────────────────────────

  const openCmdoCreate = () => {
    const nextOrd = Math.max(0, ...cmdoData.map(r => r.ord)) + 1;
    setCmdoForm({ ord: nextOrd, posto: '', rg: '', nome: '', periodo: '', dopm: '', sei: '' });
    setCmdoErr({});
    setCmdoModal({ mode: 'create', item: null });
  };

  const openCmdoView = (r: DispensaCmdo) => {
    setCmdoForm(r);
    setCmdoErr({});
    setCmdoModal({ mode: 'view', item: r });
  };

  const openCmdoEdit = (r: DispensaCmdo) => {
    setCmdoForm(r);
    setCmdoErr({});
    setCmdoModal({ mode: 'edit', item: r });
  };

  const saveCmdo = () => {
    if (!cmdoForm.nome.trim()) { setCmdoErr({ nome: 'Nome obrigatório' }); return; }
    if (cmdoModal?.mode === 'create') {
      setCmdoData(d => normalizeOrd([...d, { ...cmdoForm, id: nextId() }]));
    } else if (cmdoModal?.mode === 'edit' && cmdoModal.item) {
      setCmdoData(d => normalizeOrd(d.map(r => r.id === cmdoModal.item!.id ? { ...cmdoForm, id: r.id } : r)));
    }
    setCmdoModal(null);
  };

  const deleteCmdo = () => {
    if (!delCmdo) return;
    setCmdoData(d => normalizeOrd(d.filter(r => r.id !== delCmdo.id)));
    setDelCmdo(null);
  };

  const changeCmdo = <K extends keyof CmdoForm>(k: K, v: CmdoForm[K]) => {
    setCmdoForm(f => ({ ...f, [k]: v }));
    if (k === 'nome') setCmdoErr({});
  };

  // ── ANUAL 2026 handlers ──────────────────────────────────────────────────

  const openAnualCreate = () => {
    const nextOrd = Math.max(0, ...anualData.map(r => r.ord)) + 1;
    setAnualForm({ ord: nextOrd, posto: '', rg: '', nome: '', dispensas: emptyDisp() });
    setAnualErr({});
    setAnualModal({ mode: 'create', item: null });
  };

  const openAnualView = (r: DispensaAnual) => {
    setAnualForm({ ...r, dispensas: r.dispensas.map(d => ({ ...d })) });
    setAnualErr({});
    setAnualModal({ mode: 'view', item: r });
  };

  const openAnualEdit = (r: DispensaAnual) => {
    setAnualForm({ ...r, dispensas: r.dispensas.map(d => ({ ...d })) });
    setAnualErr({});
    setAnualModal({ mode: 'edit', item: r });
  };

  const saveAnual = () => {
    if (!anualForm.nome.trim()) { setAnualErr({ nome: 'Nome obrigatório' }); return; }
    const cleaned = { ...anualForm, dispensas: anualForm.dispensas.map(d => ({ ...d })) };
    if (anualModal?.mode === 'create') {
      setAnualData(d => normalizeOrd([...d, { ...cleaned, id: nextId() }]));
    } else if (anualModal?.mode === 'edit' && anualModal.item) {
      setAnualData(d => normalizeOrd(d.map(r => r.id === anualModal.item!.id ? { ...cleaned, id: r.id } : r)));
    }
    setAnualModal(null);
  };

  const deleteAnual = () => {
    if (!delAnual) return;
    setAnualData(d => normalizeOrd(d.filter(r => r.id !== delAnual.id)));
    setDelAnual(null);
  };

  const changeAnualDisp = (i: number, field: 'data' | 'dopm', val: string) => {
    setAnualForm(f => {
      const dispensas = f.dispensas.map((d, idx) => idx === i ? { ...d, [field]: val } : d);
      return { ...f, dispensas };
    });
  };

  // ── tab badge counts
  const cmdoComCount  = useMemo(() => cmdoData.filter(hasCmdo).length,  [cmdoData]);
  const anualComCount = useMemo(() => anualData.filter(hasAnual).length, [anualData]);

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">

      {/* toolbar */}
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
          Dispensa Recompensa
        </h3>

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
              <button onClick={() => { exportXLSX(cmdoData, anualData); setShowExport(false); }}
                className="adm-drop-item flex items-center gap-3 w-full px-4 py-3 text-sm transition-colors"
                style={{ color: 'var(--adm-text)' }}>
                <FileSpreadsheet size={15} className="text-emerald-400" /> XLSX (todas as abas)
              </button>
              <button onClick={() => { exportPrint(filteredCmdo, filteredAnual); setShowExport(false); }}
                className="adm-drop-item flex items-center gap-3 w-full px-4 py-3 text-sm transition-colors"
                style={{ color: 'var(--adm-text)' }}>
                <Printer size={15} style={{ color: 'var(--adm-muted)' }} /> Imprimir / PDF
              </button>
            </div>
          )}
        </div>

        {canCreate && (
          <button onClick={tab === 'cmdo' ? openCmdoCreate : openAnualCreate}
            className="flex items-center gap-2 bg-cpe-red hover:bg-cpe-red/80 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
            <Plus size={15} /> Novo Registro
          </button>
        )}
      </div>

      {/* tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(['cmdo', 'anual'] as Tab[]).map(t => {
          const active = tab === t;
          const label  = t === 'cmdo' ? 'CMDO GERAL' : 'ANUAL 2026';
          const count  = t === 'cmdo' ? cmdoComCount  : anualComCount;
          return (
            <button key={t} onClick={() => setTab(t)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-colors"
              style={{
                borderColor: active ? 'var(--adm-accent)' : 'var(--adm-border)',
                color:       active ? 'var(--adm-accent)' : 'var(--adm-muted)',
                background:  active ? 'color-mix(in srgb, var(--adm-accent) 10%, transparent)' : 'var(--adm-input)',
              }}>
              {label}
              <span className="px-1.5 py-0.5 rounded text-xs font-bold"
                style={{ background: active ? 'var(--adm-accent)' : 'var(--adm-border)', color: active ? '#fff' : 'var(--adm-muted)' }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* search + filter */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--adm-muted)' }} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, posto, RG…"
            className="adm-input w-full rounded-xl pl-10 pr-10 py-3 text-sm border"
            style={{ background: 'var(--adm-input)', color: 'var(--adm-text)', border: '1px solid var(--adm-border)' }} />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--adm-muted)' }}><X size={15} /></button>
          )}
        </div>
        <button onClick={() => setSoComDispensa(v => !v)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-colors whitespace-nowrap"
          style={{
            borderColor: soComDispensa ? 'var(--adm-accent)' : 'var(--adm-border)',
            color:       soComDispensa ? 'var(--adm-accent)' : 'var(--adm-muted)',
            background:  soComDispensa ? 'color-mix(in srgb, var(--adm-accent) 10%, transparent)' : 'var(--adm-input)',
          }}>
          Só com dispensa
        </button>
      </div>

      {/* ── CMDO GERAL table ─────────────────────────────────────────────────── */}
      {tab === 'cmdo' && (
        <div className="flex-1 overflow-auto rounded-xl border" style={{ borderColor: 'var(--adm-border)' }}>
          <table className="w-full text-sm" style={{ minWidth: 820 }}>
            <thead className="sticky top-0 z-10" style={{ background: 'var(--adm-tbl-head)' }}>
              <tr className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--adm-muted)' }}>
                <th className="px-3 py-3.5 text-left w-10">Ord</th>
                <th className="px-3 py-3.5 text-left">Posto/Grad.</th>
                <th className="px-3 py-3.5 text-left">RG</th>
                <th className="px-3 py-3.5 text-left">Nome</th>
                <th className="px-3 py-3.5 text-left">Período</th>
                <th className="px-3 py-3.5 text-left">DOPM</th>
                <th className="px-3 py-3.5 text-left">Nº SEI</th>
                <th className="px-3 py-3.5 text-center w-28">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredCmdo.map((r, i) => (
                <tr key={r.id} className="adm-row border-t transition-colors"
                  style={{
                    borderColor: 'var(--adm-border)',
                    background: i % 2 === 0 ? 'var(--adm-row-even)' : 'transparent',
                  }}>
                  <td className="px-3 py-3 tabular-nums text-xs" style={{ color: 'var(--adm-subtle)' }}>{r.ord}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-xs font-medium" style={{ color: 'var(--adm-muted)' }}>{r.posto}</td>
                  <td className="px-3 py-3 tabular-nums text-xs" style={{ color: 'var(--adm-muted)' }}>{r.rg}</td>
                  <td className="px-3 py-3 font-semibold" style={{ color: 'var(--adm-text)' }}>{r.nome}</td>
                  <td className="px-3 py-3 whitespace-nowrap tabular-nums text-xs" style={{ color: r.periodo ? 'var(--adm-text)' : 'var(--adm-subtle)' }}>
                    {r.periodo || '—'}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    {r.dopm ? (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        r.dopm === 'CHOA'
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      }`}>{r.dopm}</span>
                    ) : <span style={{ color: 'var(--adm-subtle)' }}>—</span>}
                  </td>
                  <td className="px-3 py-3 tabular-nums text-xs" style={{ color: 'var(--adm-muted)' }}>
                    {r.sei || <span style={{ color: 'var(--adm-subtle)' }}>—</span>}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-center gap-0.5">
                      <button onClick={() => openCmdoView(r)} title="Visualizar"
                        className="p-1.5 rounded-lg hover:bg-blue-400/10 text-blue-400 opacity-70 hover:opacity-100 transition-colors">
                        <Eye size={15} />
                      </button>
                      {canEdit && (
                        <button onClick={() => openCmdoEdit(r)} title="Editar"
                          className="p-1.5 rounded-lg hover:bg-amber-400/10 text-amber-400 opacity-70 hover:opacity-100 transition-colors">
                          <Pencil size={15} />
                        </button>
                      )}
                      {canDelete && (
                        <button onClick={() => setDelCmdo(r)} title="Excluir"
                          className="p-1.5 rounded-lg hover:bg-cpe-red/10 text-cpe-red opacity-70 hover:opacity-100 transition-colors">
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCmdo.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-20 text-center text-base" style={{ color: 'var(--adm-subtle)' }}>
                    Nenhum registro encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── ANUAL 2026 table ──────────────────────────────────────────────────── */}
      {tab === 'anual' && (
        <div className="flex-1 overflow-auto rounded-xl border" style={{ borderColor: 'var(--adm-border)' }}>
          <table className="w-full text-sm" style={{ minWidth: 680 }}>
            <thead className="sticky top-0 z-10" style={{ background: 'var(--adm-tbl-head)' }}>
              <tr className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--adm-muted)' }}>
                <th className="px-3 py-3.5 text-left w-10">Ord</th>
                <th className="px-3 py-3.5 text-left">Posto/Grad.</th>
                <th className="px-3 py-3.5 text-left">RG</th>
                <th className="px-3 py-3.5 text-left">Nome</th>
                <th className="px-3 py-3.5 text-left">Dispensas (Data / DOPM)</th>
                <th className="px-3 py-3.5 text-center w-28">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredAnual.map((r, i) => {
                const filled = r.dispensas.filter(d => d.data);
                return (
                  <tr key={r.id} className="adm-row border-t transition-colors"
                    style={{
                      borderColor: 'var(--adm-border)',
                      background: i % 2 === 0 ? 'var(--adm-row-even)' : 'transparent',
                    }}>
                    <td className="px-3 py-3 tabular-nums text-xs" style={{ color: 'var(--adm-subtle)' }}>{r.ord}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-xs font-medium" style={{ color: 'var(--adm-muted)' }}>{r.posto}</td>
                    <td className="px-3 py-3 tabular-nums text-xs" style={{ color: 'var(--adm-muted)' }}>{r.rg}</td>
                    <td className="px-3 py-3 font-semibold" style={{ color: 'var(--adm-text)' }}>{r.nome}</td>
                    <td className="px-3 py-3">
                      {filled.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {filled.map((d, idx) => (
                            <span key={idx} className="text-xs px-2 py-0.5 rounded-full font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30 whitespace-nowrap">
                              {d.data} — {d.dopm}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs" style={{ color: 'var(--adm-subtle)' }}>—</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-center gap-0.5">
                        <button onClick={() => openAnualView(r)} title="Visualizar"
                          className="p-1.5 rounded-lg hover:bg-blue-400/10 text-blue-400 opacity-70 hover:opacity-100 transition-colors">
                          <Eye size={15} />
                        </button>
                        {canEdit && (
                          <button onClick={() => openAnualEdit(r)} title="Editar"
                            className="p-1.5 rounded-lg hover:bg-amber-400/10 text-amber-400 opacity-70 hover:opacity-100 transition-colors">
                            <Pencil size={15} />
                          </button>
                        )}
                        {canDelete && (
                          <button onClick={() => setDelAnual(r)} title="Excluir"
                            className="p-1.5 rounded-lg hover:bg-cpe-red/10 text-cpe-red opacity-70 hover:opacity-100 transition-colors">
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredAnual.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-20 text-center text-base" style={{ color: 'var(--adm-subtle)' }}>
                    Nenhum registro encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── CMDO GERAL modal ─────────────────────────────────────────────────── */}
      {cmdoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl shadow-2xl border"
            style={{ background: 'var(--adm-modal)', borderColor: 'var(--adm-border)' }}>

            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--adm-border)' }}>
              <h4 className="font-bold text-xl" style={{ color: 'var(--adm-text)' }}>
                {cmdoModal.mode === 'create' ? 'Novo Registro — CMDO GERAL'
                  : cmdoModal.mode === 'edit' ? 'Editar — CMDO GERAL'
                  : 'Visualizar — CMDO GERAL'}
              </h4>
              <button onClick={() => setCmdoModal(null)} style={{ color: 'var(--adm-muted)' }}><X size={22} /></button>
            </div>

            <div className="px-6 py-5 grid grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
              {/* Ord */}
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Ord</label>
                <input type="number" value={cmdoForm.ord}
                  onChange={e => changeCmdo('ord', +e.target.value)}
                  readOnly={cmdoModal.mode === 'view'}
                  className={inputCls()} style={cmdoModal.mode === 'view' ? roS : fs} />
              </div>
              {/* Posto */}
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Posto/Grad.</label>
                <input type="text" value={cmdoForm.posto}
                  onChange={e => changeCmdo('posto', e.target.value)}
                  readOnly={cmdoModal.mode === 'view'} placeholder="CAP PM"
                  className={inputCls()} style={cmdoModal.mode === 'view' ? roS : fs} />
              </div>
              {/* RG */}
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>RG</label>
                <input type="text" value={cmdoForm.rg}
                  onChange={e => changeCmdo('rg', e.target.value)}
                  readOnly={cmdoModal.mode === 'view'}
                  className={inputCls()} style={cmdoModal.mode === 'view' ? roS : fs} />
              </div>
              {/* Nome */}
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Nome</label>
                <input type="text" value={cmdoForm.nome}
                  onChange={e => changeCmdo('nome', e.target.value)}
                  readOnly={cmdoModal.mode === 'view'}
                  className={inputCls(cmdoErr.nome)}
                  style={cmdoModal.mode === 'view' ? roS : { ...fs, ...(cmdoErr.nome ? { borderColor: '#ef4444' } : {}) }} />
                {cmdoErr.nome && (
                  <p className="text-sm mt-1 text-red-400 flex items-center gap-1"><AlertCircle size={13} /> {cmdoErr.nome}</p>
                )}
              </div>
              {/* Período */}
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Período</label>
                <input type="text" value={cmdoForm.periodo}
                  onChange={e => changeCmdo('periodo', e.target.value)}
                  readOnly={cmdoModal.mode === 'view'} placeholder="DD/MM a DD/MM"
                  className={inputCls()} style={cmdoModal.mode === 'view' ? roS : fs} />
              </div>
              {/* DOPM */}
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>DOPM</label>
                <input type="text" value={cmdoForm.dopm}
                  onChange={e => changeCmdo('dopm', e.target.value)}
                  readOnly={cmdoModal.mode === 'view'} placeholder="67/2026 ou CHOA"
                  className={inputCls()} style={cmdoModal.mode === 'view' ? roS : fs} />
              </div>
              {/* SEI */}
              <div className="col-span-2">
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Nº SEI DO ITEM</label>
                <input type="text" value={cmdoForm.sei}
                  onChange={e => changeCmdo('sei', e.target.value)}
                  readOnly={cmdoModal.mode === 'view'} placeholder="202600002000000"
                  className={inputCls()} style={cmdoModal.mode === 'view' ? roS : fs} />
              </div>
            </div>

            {cmdoModal.mode !== 'view' && (
              <div className="flex justify-end gap-3 px-6 pb-5">
                <button onClick={() => setCmdoModal(null)}
                  className="px-5 py-2.5 text-base rounded-lg border transition-colors"
                  style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)', background: 'transparent' }}>
                  Cancelar
                </button>
                <button onClick={saveCmdo}
                  className="flex items-center gap-2 px-5 py-2.5 text-base font-semibold text-white bg-cpe-red hover:bg-cpe-red/80 rounded-lg transition-colors">
                  <Save size={16} /> Salvar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ANUAL 2026 modal ─────────────────────────────────────────────────── */}
      {anualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl shadow-2xl border"
            style={{ background: 'var(--adm-modal)', borderColor: 'var(--adm-border)' }}>

            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--adm-border)' }}>
              <h4 className="font-bold text-xl" style={{ color: 'var(--adm-text)' }}>
                {anualModal.mode === 'create' ? 'Novo Registro — ANUAL 2026'
                  : anualModal.mode === 'edit' ? 'Editar — ANUAL 2026'
                  : 'Visualizar — ANUAL 2026'}
              </h4>
              <button onClick={() => setAnualModal(null)} style={{ color: 'var(--adm-muted)' }}><X size={22} /></button>
            </div>

            <div className="px-6 py-5 max-h-[70vh] overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Ord</label>
                  <input type="number" value={anualForm.ord}
                    onChange={e => setAnualForm(f => ({ ...f, ord: +e.target.value }))}
                    readOnly={anualModal.mode === 'view'}
                    className={inputCls()} style={anualModal.mode === 'view' ? roS : fs} />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Posto/Grad.</label>
                  <input type="text" value={anualForm.posto}
                    onChange={e => setAnualForm(f => ({ ...f, posto: e.target.value }))}
                    readOnly={anualModal.mode === 'view'} placeholder="CB PM"
                    className={inputCls()} style={anualModal.mode === 'view' ? roS : fs} />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>RG</label>
                  <input type="text" value={anualForm.rg}
                    onChange={e => setAnualForm(f => ({ ...f, rg: e.target.value }))}
                    readOnly={anualModal.mode === 'view'}
                    className={inputCls()} style={anualModal.mode === 'view' ? roS : fs} />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Nome</label>
                  <input type="text" value={anualForm.nome}
                    onChange={e => { setAnualForm(f => ({ ...f, nome: e.target.value })); setAnualErr({}); }}
                    readOnly={anualModal.mode === 'view'}
                    className={inputCls(anualErr.nome)}
                    style={anualModal.mode === 'view' ? roS : { ...fs, ...(anualErr.nome ? { borderColor: '#ef4444' } : {}) }} />
                  {anualErr.nome && (
                    <p className="text-sm mt-1 text-red-400 flex items-center gap-1"><AlertCircle size={13} /> {anualErr.nome}</p>
                  )}
                </div>
              </div>

              {/* 5 DATA/DOPM pairs */}
              <div>
                <p className="text-sm font-semibold mb-2" style={{ color: 'var(--adm-muted)' }}>Dispensas (até 5)</p>
                <div className="space-y-2">
                  {anualForm.dispensas.map((d, idx) => (
                    <div key={idx} className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs mb-1" style={{ color: 'var(--adm-subtle)' }}>Data {idx + 1}</label>
                        <input type="text" value={d.data}
                          onChange={e => changeAnualDisp(idx, 'data', e.target.value)}
                          readOnly={anualModal.mode === 'view'} placeholder="DD/MM"
                          className={inputCls()} style={anualModal.mode === 'view' ? roS : fs} />
                      </div>
                      <div>
                        <label className="block text-xs mb-1" style={{ color: 'var(--adm-subtle)' }}>DOPM {idx + 1}</label>
                        <input type="text" value={d.dopm}
                          onChange={e => changeAnualDisp(idx, 'dopm', e.target.value)}
                          readOnly={anualModal.mode === 'view'} placeholder="31/2026"
                          className={inputCls()} style={anualModal.mode === 'view' ? roS : fs} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {anualModal.mode !== 'view' && (
              <div className="flex justify-end gap-3 px-6 pb-5">
                <button onClick={() => setAnualModal(null)}
                  className="px-5 py-2.5 text-base rounded-lg border transition-colors"
                  style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)', background: 'transparent' }}>
                  Cancelar
                </button>
                <button onClick={saveAnual}
                  className="flex items-center gap-2 px-5 py-2.5 text-base font-semibold text-white bg-cpe-red hover:bg-cpe-red/80 rounded-lg transition-colors">
                  <Save size={16} /> Salvar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── delete confirm — CMDO ─────────────────────────────────────────────── */}
      {delCmdo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl shadow-2xl border p-6"
            style={{ background: 'var(--adm-modal)', borderColor: 'var(--adm-border)' }}>
            <h4 className="font-bold text-xl mb-2" style={{ color: 'var(--adm-text)' }}>Confirmar exclusão</h4>
            <p className="text-base mb-6" style={{ color: 'var(--adm-muted)' }}>
              Excluir registro de{' '}
              <span className="font-semibold" style={{ color: 'var(--adm-text)' }}>{delCmdo.nome}</span>?
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDelCmdo(null)}
                className="px-5 py-2.5 text-base rounded-lg border transition-colors"
                style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)', background: 'transparent' }}>
                Cancelar
              </button>
              <button onClick={deleteCmdo}
                className="flex items-center gap-2 px-5 py-2.5 text-base font-semibold text-white bg-cpe-red hover:bg-cpe-red/80 rounded-lg transition-colors">
                <Trash2 size={16} /> Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── delete confirm — ANUAL ────────────────────────────────────────────── */}
      {delAnual && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl shadow-2xl border p-6"
            style={{ background: 'var(--adm-modal)', borderColor: 'var(--adm-border)' }}>
            <h4 className="font-bold text-xl mb-2" style={{ color: 'var(--adm-text)' }}>Confirmar exclusão</h4>
            <p className="text-base mb-6" style={{ color: 'var(--adm-muted)' }}>
              Excluir registro de{' '}
              <span className="font-semibold" style={{ color: 'var(--adm-text)' }}>{delAnual.nome}</span>?
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDelAnual(null)}
                className="px-5 py-2.5 text-base rounded-lg border transition-colors"
                style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)', background: 'transparent' }}>
                Cancelar
              </button>
              <button onClick={deleteAnual}
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
