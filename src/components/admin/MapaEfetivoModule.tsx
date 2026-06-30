import { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  ArrowLeft, Plus, Pencil, Trash2, X, Save, Download,
  FileSpreadsheet, Printer, ChevronLeft, ChevronRight, AlertCircle, Copy, FileInput,
} from 'lucide-react';
import {
  mapaEfetivoDB, MapaEfetivo, MapaRow, MapaAfastamento,
  MapaContagem, MESES_NOME, TIPOS_AFASTAMENTO, TipoAfastamento,
  emptyLinhas, emptyContagens,
} from '../../data/mapaEfetivo';
import { ModulePermission } from '../../types/rbac';
import { usePersistentState } from '../../hooks/usePersistentState';

// ── helpers ──────────────────────────────────────────────────────────────

function nextId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function rowIsEmpty(r: MapaRow) {
  return !r.pelA && !r.pelB && !r.pelC && !r.pelD && !r.adminNome && !r.serNome;
}

// ── XLSX export ──────────────────────────────────────────────────────────

function buildSheetData(m: MapaEfetivo): (string | number)[][] {
  const title = `MAPA DO EFETIVO POR FUNÇÕES — ${MESES_NOME[m.mes - 1].toUpperCase()} / ${m.ano}`;
  const rows: (string | number)[][] = [
    [title],
    [],
    ['', 'Pelotão A', 'Pelotão B', 'Pelotão C', 'Pelotão D', 'ADMINISTRAÇÃO', '', '', 'S. E. R.', ''],
    ['Dias de serviço', m.diasServico.pelA, m.diasServico.pelB, m.diasServico.pelC, m.diasServico.pelD, 'Expediente', '', '', 'S. E. R.', ''],
  ];
  for (const l of m.linhas) {
    rows.push([
      l.label ?? '',
      l.pelA ?? '', l.pelB ?? '', l.pelC ?? '', l.pelD ?? '',
      l.adminNome ?? '', l.adminFuncao ?? '',
      '',
      l.serNome ?? '', l.serStatus ?? '',
    ]);
  }
  rows.push([]);

  // afastamentos + contagens side-by-side
  rows.push(['AFASTAMENTOS', '', 'Retorno em:', 'EFETIVO EM SERVIÇO', 'Pelotão A', m.contagens.pelA, m.contagens.pelA + m.contagens.pelB + m.contagens.pelC + m.contagens.pelD]);
  const af = m.afastamentos;
  const tipoGroups: Record<TipoAfastamento, MapaAfastamento[]> = { LESP: [], Férias: [], Curso: [], JCS: [], Outros: [] };
  for (const a of af) tipoGroups[a.tipo].push(a);

  const contRows: [string, number][] = [
    ['Pelotão B', m.contagens.pelB],
    ['Pelotão C', m.contagens.pelC],
    ['Pelotão D', m.contagens.pelD],
    ['Diagonal', m.contagens.diagonal],
    ['Dia a Reserva', m.contagens.diaReserva],
    ['Administração', m.contagens.administracao],
  ];
  const afRows: [string, string, string][] = [];
  for (const tipo of TIPOS_AFASTAMENTO) {
    const group = tipoGroups[tipo];
    if (group.length === 0) {
      afRows.push([tipo, '-', '-']);
    } else {
      group.forEach((a, i) => afRows.push([i === 0 ? tipo : '', a.nome, a.retorno]));
    }
  }

  const totalAfRows = afRows.length;
  for (let i = 0; i < Math.max(totalAfRows, contRows.length); i++) {
    const a = afRows[i] ?? ['', '', ''];
    const c = contRows[i] ?? ['', ''];
    rows.push([a[0], a[1], a[2], '', c[0], c[1]]);
  }
  rows.push(['', '', '', 'EFETIVO TOTAL', '', m.contagens.total, m.contagens.total]);
  return rows;
}

function exportXLSX(data: MapaEfetivo[]) {
  const wb = XLSX.utils.book_new();
  for (const m of data) {
    const ws = XLSX.utils.aoa_to_sheet(buildSheetData(m));
    ws['!cols'] = [{ wch: 16 }, { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 18 }, { wch: 2 }, { wch: 20 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, ws, `${MESES_NOME[m.mes - 1]} ${m.ano}`);
  }
  XLSX.writeFile(wb, 'mapa_efetivo.xlsx');
}

function exportPrint(m: MapaEfetivo) {
  const rowsHtml = m.linhas.map(l => `
    <tr>
      <td class="lbl">${l.label ?? ''}</td>
      <td>${l.pelA ?? ''}</td><td>${l.pelB ?? ''}</td>
      <td>${l.pelC ?? ''}</td><td>${l.pelD ?? ''}</td>
      <td>${l.adminNome ?? ''}</td><td class="fn">${l.adminFuncao ?? ''}</td>
      <td></td>
      <td>${l.serNome ?? ''}</td><td class="fn">${l.serStatus ?? ''}</td>
    </tr>`).join('');

  const afHtml = m.afastamentos.map(a =>
    `<tr><td>${a.tipo}</td><td>${a.nome}</td><td>${a.retorno}</td></tr>`).join('');

  const cntRows: [string, number][] = [
    ['Pelotão A',     m.contagens.pelA],
    ['Pelotão B',     m.contagens.pelB],
    ['Pelotão C',     m.contagens.pelC],
    ['Pelotão D',     m.contagens.pelD],
    ['Diagonal',      m.contagens.diagonal],
    ['Dia a Reserva', m.contagens.diaReserva],
    ['Administração', m.contagens.administracao],
    ['Afas. LESP',    m.contagens.lesp],
    ['Afas. Férias',  m.contagens.ferias],
    ['Afas. Curso',   m.contagens.curso],
    ['Afas. JCS',     m.contagens.jcs],
    ['Afas. Outros',  m.contagens.outros],
  ];
  const cntHtml = cntRows.map(([lbl, val]) =>
    `<tr><td>${lbl}</td><td class="num">${val}</td></tr>`).join('') +
    `<tr class="total"><td><b>TOTAL</b></td><td class="num"><b>${m.contagens.total}</b></td></tr>`;

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <title>Mapa ${MESES_NOME[m.mes - 1]} ${m.ano}</title>
    <style>
      body{font-family:Arial;font-size:10px;margin:16px}
      h2{font-size:13px;margin-bottom:8px}
      table{border-collapse:collapse;width:100%;margin-bottom:12px}
      th,td{border:1px solid #bbb;padding:3px 5px;white-space:nowrap}
      th{background:#2d2d2d;color:#fff;font-size:9px;text-transform:uppercase}
      .lbl{font-weight:bold;background:#f5f5f5;font-size:9px}
      .fn{font-size:9px;color:#555;font-style:italic}
      .dias td{background:#eef;font-size:9px}
      .bottom{display:flex;gap:24px;align-items:flex-start}
      .bottom table{width:auto;min-width:160px}
      .num{text-align:right;font-weight:600}
      .total td{background:#f0f0f0;border-top:2px solid #888}
    </style></head><body>
    <h2>MAPA DO EFETIVO — ${MESES_NOME[m.mes - 1].toUpperCase()} / ${m.ano}</h2>
    <table>
      <thead>
        <tr>
          <th></th><th>Pelotão A</th><th>Pelotão B</th><th>Pelotão C</th><th>Pelotão D</th>
          <th colspan="2">Administração</th><th></th><th colspan="2">S. E. R.</th>
        </tr>
        <tr class="dias">
          <td><b>Dias serviço</b></td>
          <td>${m.diasServico.pelA}</td><td>${m.diasServico.pelB}</td>
          <td>${m.diasServico.pelC}</td><td>${m.diasServico.pelD}</td>
          <td colspan="2">Expediente</td><td></td><td colspan="2"></td>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>
    <div class="bottom">
      <div>
        <h2>Afastamentos</h2>
        <table>
          <thead><tr><th>Tipo</th><th>Nome</th><th>Retorno</th></tr></thead>
          <tbody>${afHtml || '<tr><td colspan="3" style="color:#999">—</td></tr>'}</tbody>
        </table>
      </div>
      <div>
        <h2>Efetivo em Serviço</h2>
        <table>
          <thead><tr><th>Categoria</th><th>Qtd</th></tr></thead>
          <tbody>${cntHtml}</tbody>
        </table>
      </div>
    </div>
    </body></html>`;
  const w = window.open('', '_blank');
  if (w) { w.document.write(html); w.document.close(); w.print(); }
}

// ── empty form ────────────────────────────────────────────────────────────

function emptyMapa(mes: number, ano: number): Omit<MapaEfetivo, 'id'> {
  return {
    mes, ano,
    diasServico: { pelA: '', pelB: '', pelC: '', pelD: '' },
    linhas: emptyLinhas(),
    afastamentos: [],
    contagens: emptyContagens(),
  };
}

// ── component ─────────────────────────────────────────────────────────────

interface Props {
  onBack: () => void;
  permissions?: ModulePermission;
}

type View = 'list' | 'detail';

export default function MapaEfetivoModule({ onBack, permissions }: Props) {
  const canCreate = !permissions || permissions.create;
  const canEdit   = !permissions || permissions.edit;
  const canDelete = !permissions || permissions.delete;

  const [data, setData]             = usePersistentState<MapaEfetivo[]>('cpe-site:mapa-efetivo:v1', mapaEfetivoDB);
  const [view, setView]             = useState<View>('list');
  const [selected, setSelected]     = useState<MapaEfetivo | null>(null);
  const [editMode, setEditMode]     = useState(false);
  const [draft, setDraft]           = useState<MapaEfetivo | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newMes, setNewMes]         = useState(1);
  const [newAno, setNewAno]         = useState(new Date().getFullYear());
  const [dupSource, setDupSource]   = useState<MapaEfetivo | null>(null);
  const [dupMes, setDupMes]         = useState(1);
  const [dupAno, setDupAno]         = useState(new Date().getFullYear());
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFromId, setImportFromId]       = useState('');
  const [deleteTarget, setDeleteTarget] = useState<MapaEfetivo | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [afModal, setAfModal]       = useState<{ mode: 'create' | 'edit'; item: MapaAfastamento | null } | null>(null);
  const [afForm, setAfForm]         = useState<Omit<MapaAfastamento, 'id'>>({ tipo: 'LESP', nome: '', retorno: '' });
  const [afError, setAfError]       = useState('');
  const [inlineCell, setInlineCell] = useState<{ rowIdx: number; col: keyof MapaRow } | null>(null);
  const [inlineVal, setInlineVal]   = useState('');

  // sorted month list
  const sorted = useMemo(() =>
    [...data].sort((a, b) => a.ano !== b.ano ? a.ano - b.ano : a.mes - b.mes),
  [data]);

  // ── navigation ──────────────────────────────────────────────────────────
  const openDetail = (m: MapaEfetivo) => { setSelected(m); setEditMode(false); setView('detail'); };
  const goBack     = () => { setView('list'); setSelected(null); setEditMode(false); setDraft(null); };

  const navMonth = (dir: -1 | 1) => {
    if (!selected) return;
    const idx = sorted.findIndex(m => m.id === selected.id);
    const next = sorted[idx + dir];
    if (next) openDetail(next);
  };

  // ── edit mode ────────────────────────────────────────────────────────────
  const startEdit = () => {
    if (!selected) return;
    setDraft(JSON.parse(JSON.stringify(selected)));
    setEditMode(true);
  };

  const cancelEdit = () => { setDraft(null); setEditMode(false); };

  const saveEdit = () => {
    if (!draft) return;
    setData(d => d.map(m => m.id === draft.id ? draft : m));
    setSelected(draft);
    setEditMode(false);
    setDraft(null);
  };

  // draft helpers
  const setDraftField = <K extends keyof MapaEfetivo>(key: K, val: MapaEfetivo[K]) =>
    setDraft(d => d ? { ...d, [key]: val } : d);

  const setDraftRow = (i: number, field: keyof MapaRow, val: string) =>
    setDraft(d => {
      if (!d) return d;
      const linhas = d.linhas.map((r, idx) => idx === i ? { ...r, [field]: val } : r);
      return { ...d, linhas };
    });

  const addRow = () =>
    setDraft(d => d ? { ...d, linhas: [...d.linhas, { label: '', pelA: '', pelB: '', pelC: '', pelD: '' }] } : d);

  const removeRow = (i: number) =>
    setDraft(d => d ? { ...d, linhas: d.linhas.filter((_, idx) => idx !== i) } : d);

  const setDraftCount = (field: keyof MapaContagem, val: number) =>
    setDraft(d => d ? { ...d, contagens: { ...d.contagens, [field]: val } } : d);

  // ── new mapa ─────────────────────────────────────────────────────────────
  const handleCreate = () => {
    const exists = data.some(m => m.mes === newMes && m.ano === newAno);
    if (exists) return;
    const novo: MapaEfetivo = { id: nextId(), ...emptyMapa(newMes, newAno) };
    setData(d => [...d, novo]);
    setShowNewModal(false);
    openDetail(novo);
    setTimeout(() => startEdit(), 50);
  };

  // ── import from another month ────────────────────────────────────────────
  const openImportModal = () => {
    const others = sorted.filter(s => s.id !== (draft?.id ?? selected?.id));
    if (others.length > 0) setImportFromId(others[0].id);
    setShowImportModal(true);
  };

  const handleImport = () => {
    const src = data.find(s => s.id === importFromId);
    if (!src || !draft) return;
    setDraft(d => d ? {
      ...d,
      diasServico:  { ...src.diasServico },
      linhas:       JSON.parse(JSON.stringify(src.linhas)),
      afastamentos: JSON.parse(JSON.stringify(src.afastamentos)),
      contagens:    JSON.parse(JSON.stringify(src.contagens)),
    } : d);
    setShowImportModal(false);
  };

  // ── duplicate ────────────────────────────────────────────────────────────
  const openDup = (e: React.MouseEvent, m: MapaEfetivo) => {
    e.stopPropagation();
    const nextMes = m.mes === 12 ? 1 : m.mes + 1;
    const nextAno = m.mes === 12 ? m.ano + 1 : m.ano;
    setDupSource(m);
    setDupMes(nextMes);
    setDupAno(nextAno);
  };

  const handleDuplicate = () => {
    if (!dupSource) return;
    const novo: MapaEfetivo = {
      ...JSON.parse(JSON.stringify(dupSource)),
      id: nextId(),
      mes: dupMes,
      ano: dupAno,
    };
    setData(d => [...d, novo]);
    setDupSource(null);
    openDetail(novo);
  };

  // ── delete ───────────────────────────────────────────────────────────────
  const handleDelete = () => {
    if (!deleteTarget) return;
    setData(d => d.filter(m => m.id !== deleteTarget.id));
    setDeleteTarget(null);
    goBack();
  };

  // ── afastamentos CRUD ─────────────────────────────────────────────────────
  const openAfCreate = () => {
    setAfForm({ tipo: 'LESP', nome: '', retorno: '' });
    setAfError('');
    setAfModal({ mode: 'create', item: null });
  };
  const openAfEdit = (a: MapaAfastamento) => {
    setAfForm({ tipo: a.tipo, nome: a.nome, retorno: a.retorno });
    setAfError('');
    setAfModal({ mode: 'edit', item: a });
  };
  const saveAf = () => {
    if (!afForm.nome.trim()) { setAfError('Nome obrigatório'); return; }
    if (!draft) return;
    if (afModal?.mode === 'create') {
      const novo: MapaAfastamento = { id: nextId(), ...afForm };
      setDraft(d => d ? { ...d, afastamentos: [...d.afastamentos, novo] } : d);
    } else if (afModal?.mode === 'edit' && afModal.item) {
      const id = afModal.item.id;
      setDraft(d => d ? { ...d, afastamentos: d.afastamentos.map(a => a.id === id ? { ...a, ...afForm } : a) } : d);
    }
    setAfModal(null);
  };
  const deleteAf = (id: string) =>
    setDraft(d => d ? { ...d, afastamentos: d.afastamentos.filter(a => a.id !== id) } : d);

  // ── inline cell editing (view mode) ──────────────────────────────────────
  const startInline = (rowIdx: number, col: keyof MapaRow, currentVal: string) => {
    setInlineCell({ rowIdx, col });
    setInlineVal(currentVal);
  };

  const commitInline = () => {
    if (!inlineCell || !selected) return;
    const updated: MapaEfetivo = {
      ...selected,
      linhas: selected.linhas.map((r, i) =>
        i === inlineCell.rowIdx ? { ...r, [inlineCell.col]: inlineVal } : r
      ),
    };
    setData(d => d.map(m => m.id === selected.id ? updated : m));
    setSelected(updated);
    setInlineCell(null);
  };

  const cancelInline = () => setInlineCell(null);

  // ── styles ────────────────────────────────────────────────────────────────
  const fs  = { background: 'var(--adm-input)', color: 'var(--adm-text)',  border: '1px solid var(--adm-border)' };
  const fss = { background: 'var(--adm-input)', color: 'var(--adm-text)',  border: '1px solid var(--adm-border)', fontSize: 12 };
  const cls = 'adm-input rounded px-2 py-1 text-sm border w-full';

  const emptyBox = (
    <span className="inline-block w-24 h-[18px] rounded border border-dashed align-middle"
      style={{ borderColor: 'var(--adm-border)', opacity: 0.45 }} />
  );

  // ── render: list ─────────────────────────────────────────────────────────
  if (view === 'list') {
    return (
      <div className="flex flex-col h-full">
        {/* toolbar */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <button onClick={onBack} className="flex items-center gap-1.5 transition-colors text-base font-medium"
            style={{ color: 'var(--adm-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--adm-text)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--adm-muted)')}>
            <ArrowLeft size={17} /> Módulos
          </button>
          <span style={{ color: 'var(--adm-border)' }} className="hidden sm:block">|</span>
          <h3 className="font-bold text-2xl flex-1" style={{ color: 'var(--adm-text)' }}>Mapa do Efetivo</h3>

          {/* export all */}
          {canEdit && (
            <div className="relative">
              <button onClick={() => setShowExport(v => !v)}
                className="flex items-center gap-2 border rounded-lg px-4 py-2 text-base font-medium transition-colors"
                style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)', background: 'var(--adm-input)' }}>
                <Download size={16} /> Exportar
              </button>
              {showExport && (
                <div className="absolute right-0 top-full mt-1 rounded-xl shadow-2xl z-20 w-52 py-1.5 overflow-hidden"
                  style={{ background: 'var(--adm-dropdown)', border: '1px solid var(--adm-border)' }}>
                  <button onClick={() => { exportXLSX(sorted); setShowExport(false); }}
                    className="adm-drop-item flex items-center gap-3 w-full px-4 py-3 text-base transition-colors"
                    style={{ color: 'var(--adm-text)' }}>
                    <FileSpreadsheet size={16} className="text-emerald-400" /> XLSX (todas as abas)
                  </button>
                </div>
              )}
            </div>
          )}

          {canCreate && (
            <button onClick={() => setShowNewModal(true)}
              className="flex items-center gap-2 bg-cpe-red hover:bg-cpe-red/80 text-white text-base font-semibold px-4 py-2 rounded-lg transition-colors">
              <Plus size={16} /> Novo Mapa
            </button>
          )}
        </div>

        {/* month grid */}
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 rounded-2xl border"
            style={{ background: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
            <p className="text-lg font-semibold" style={{ color: 'var(--adm-text)' }}>Nenhum mapa cadastrado</p>
            <p className="text-sm mt-1" style={{ color: 'var(--adm-muted)' }}>Clique em "Novo Mapa" para começar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {sorted.map(m => {
              const total = m.contagens.pelA + m.contagens.pelB + m.contagens.pelC + m.contagens.pelD;
              return (
                <div key={m.id} className="relative group">
                  <button onClick={() => openDetail(m)}
                    className="adm-card flex flex-col gap-3 p-5 rounded-2xl transition-all duration-200 hover:scale-105 hover:shadow-2xl border text-left w-full"
                    style={{ background: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
                    <div className="text-2xl font-black" style={{ color: 'var(--adm-accent)' }}>
                      {MESES_NOME[m.mes - 1]}
                    </div>
                    <div className="text-sm font-medium" style={{ color: 'var(--adm-muted)' }}>{m.ano}</div>
                    <div className="mt-1 grid grid-cols-2 gap-1">
                      {[['A', m.contagens.pelA], ['B', m.contagens.pelB], ['C', m.contagens.pelC], ['D', m.contagens.pelD]].map(([lbl, cnt]) => (
                        <div key={lbl as string} className="flex items-center gap-1.5">
                          <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: 'var(--adm-input)', color: 'var(--adm-muted)' }}>Pel {lbl}</span>
                          <span className="text-xs font-semibold" style={{ color: 'var(--adm-text)' }}>{cnt}</span>
                        </div>
                      ))}
                    </div>
                    <div className="text-xs mt-1 pt-2 border-t flex justify-between" style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)' }}>
                      <span>Total em serviço: <b style={{ color: 'var(--adm-text)' }}>{total}</b></span>
                      <span>Total: <b style={{ color: 'var(--adm-text)' }}>{m.contagens.total}</b></span>
                    </div>
                  </button>
                  {canCreate && (
                    <button
                      onClick={e => openDup(e, m)}
                      title="Duplicar mapa"
                      className="absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10"
                      style={{ color: 'var(--adm-muted)' }}>
                      <Copy size={14} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* duplicate modal */}
        {dupSource && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl shadow-2xl border p-6"
              style={{ background: 'var(--adm-modal)', borderColor: 'var(--adm-border)' }}>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-xl" style={{ color: 'var(--adm-text)' }}>Duplicar Mapa</h4>
                <button onClick={() => setDupSource(null)} style={{ color: 'var(--adm-muted)' }}><X size={20} /></button>
              </div>
              <p className="text-sm mb-5" style={{ color: 'var(--adm-muted)' }}>
                Copiando dados de{' '}
                <span className="font-semibold" style={{ color: 'var(--adm-text)' }}>
                  {MESES_NOME[dupSource.mes - 1]} / {dupSource.ano}
                </span>
              </p>
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Mês destino</label>
                  <select value={dupMes} onChange={e => setDupMes(+e.target.value)}
                    className="adm-input w-full rounded-lg px-3 py-2.5 text-base border" style={fs}>
                    {MESES_NOME.map((n, i) => <option key={i + 1} value={i + 1}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Ano destino</label>
                  <input type="number" value={dupAno} onChange={e => setDupAno(+e.target.value)}
                    className="adm-input w-full rounded-lg px-3 py-2.5 text-base border" style={fs} />
                </div>
              </div>
              {data.some(m => m.mes === dupMes && m.ano === dupAno) && (
                <p className="text-sm text-red-400 flex items-center gap-1 mb-3">
                  <AlertCircle size={13} /> Já existe um mapa para este mês/ano.
                </p>
              )}
              <div className="flex gap-3 justify-end">
                <button onClick={() => setDupSource(null)}
                  className="px-5 py-2.5 text-base rounded-lg border transition-colors"
                  style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)', background: 'transparent' }}>Cancelar</button>
                <button onClick={handleDuplicate}
                  disabled={data.some(m => m.mes === dupMes && m.ano === dupAno)}
                  className="flex items-center gap-2 px-5 py-2.5 text-base font-semibold text-white bg-cpe-red hover:bg-cpe-red/80 rounded-lg transition-colors disabled:opacity-40">
                  <Copy size={16} /> Duplicar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* new mapa modal */}
        {showNewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl shadow-2xl border p-6"
              style={{ background: 'var(--adm-modal)', borderColor: 'var(--adm-border)' }}>
              <div className="flex items-center justify-between mb-5">
                <h4 className="font-bold text-xl" style={{ color: 'var(--adm-text)' }}>Novo Mapa</h4>
                <button onClick={() => setShowNewModal(false)} style={{ color: 'var(--adm-muted)' }}><X size={20} /></button>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Mês</label>
                  <select value={newMes} onChange={e => setNewMes(+e.target.value)}
                    className="adm-input w-full rounded-lg px-3 py-2.5 text-base border" style={fs}>
                    {MESES_NOME.map((n, i) => <option key={i + 1} value={i + 1}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Ano</label>
                  <input type="number" value={newAno} onChange={e => setNewAno(+e.target.value)}
                    className="adm-input w-full rounded-lg px-3 py-2.5 text-base border" style={fs} />
                </div>
              </div>
              {data.some(m => m.mes === newMes && m.ano === newAno) && (
                <p className="text-sm text-red-400 flex items-center gap-1 mb-3">
                  <AlertCircle size={13} /> Já existe um mapa para este mês/ano.
                </p>
              )}
              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowNewModal(false)}
                  className="px-5 py-2.5 text-base rounded-lg border transition-colors"
                  style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)', background: 'transparent' }}>Cancelar</button>
                <button onClick={handleCreate}
                  disabled={data.some(m => m.mes === newMes && m.ano === newAno)}
                  className="flex items-center gap-2 px-5 py-2.5 text-base font-semibold text-white bg-cpe-red hover:bg-cpe-red/80 rounded-lg transition-colors disabled:opacity-40">
                  <Plus size={16} /> Criar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── render: detail / edit ─────────────────────────────────────────────────
  const m  = editMode && draft ? draft : selected!;
  const idx = sorted.findIndex(s => s.id === m.id);

  return (
    <div className="flex flex-col h-full">

      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <button onClick={goBack}
          className="flex items-center gap-1.5 transition-colors text-base font-medium"
          style={{ color: 'var(--adm-muted)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--adm-text)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--adm-muted)')}>
          <ArrowLeft size={17} /> Mapas
        </button>
        <span style={{ color: 'var(--adm-border)' }} className="hidden sm:block">|</span>

        {/* month navigator */}
        <div className="flex items-center gap-1">
          <button onClick={() => navMonth(-1)} disabled={idx === 0}
            className="p-1.5 rounded-lg transition-colors disabled:opacity-30"
            style={{ color: 'var(--adm-muted)' }}><ChevronLeft size={18} /></button>
          <h3 className="font-bold text-xl px-1" style={{ color: 'var(--adm-text)' }}>
            {MESES_NOME[m.mes - 1]} / {m.ano}
            {editMode && <span className="ml-2 text-sm text-amber-400 font-normal">— editando</span>}
          </h3>
          <button onClick={() => navMonth(1)} disabled={idx === sorted.length - 1}
            className="p-1.5 rounded-lg transition-colors disabled:opacity-30"
            style={{ color: 'var(--adm-muted)' }}><ChevronRight size={18} /></button>
        </div>

        <div className="flex-1" />

        {!editMode && (
          <>
            {canEdit && (
              <div className="relative">
                <button onClick={() => setShowExport(v => !v)}
                  className="flex items-center gap-2 border rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                  style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)', background: 'var(--adm-input)' }}>
                  <Download size={15} /> Exportar
                </button>
                {showExport && (
                  <div className="absolute right-0 top-full mt-1 rounded-xl shadow-2xl z-20 w-52 py-1.5 overflow-hidden"
                    style={{ background: 'var(--adm-dropdown)', border: '1px solid var(--adm-border)' }}>
                    <button onClick={() => { exportXLSX([m]); setShowExport(false); }}
                      className="adm-drop-item flex items-center gap-3 w-full px-4 py-3 text-sm transition-colors"
                      style={{ color: 'var(--adm-text)' }}>
                      <FileSpreadsheet size={15} className="text-emerald-400" /> Este mês (XLSX)
                    </button>
                    <button onClick={() => { exportXLSX(sorted); setShowExport(false); }}
                      className="adm-drop-item flex items-center gap-3 w-full px-4 py-3 text-sm transition-colors"
                      style={{ color: 'var(--adm-text)' }}>
                      <FileSpreadsheet size={15} className="text-blue-400" /> Todos os meses (XLSX)
                    </button>
                    <button onClick={() => { exportPrint(m); setShowExport(false); }}
                      className="adm-drop-item flex items-center gap-3 w-full px-4 py-3 text-sm transition-colors"
                      style={{ color: 'var(--adm-text)' }}>
                      <Printer size={15} style={{ color: 'var(--adm-muted)' }} /> Imprimir / PDF
                    </button>
                  </div>
                )}
              </div>
            )}
            {canEdit && (
              <button onClick={startEdit}
                className="flex items-center gap-2 border rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)', background: 'var(--adm-input)' }}>
                <Pencil size={15} /> Editar
              </button>
            )}
            {canDelete && (
              <button onClick={() => setDeleteTarget(selected!)}
                className="flex items-center gap-2 border border-cpe-red/30 rounded-lg px-3 py-2 text-sm font-medium text-cpe-red hover:bg-cpe-red/10 transition-colors">
                <Trash2 size={15} /> Excluir
              </button>
            )}
          </>
        )}

        {editMode && (
          <>
            {sorted.filter(s => s.id !== draft?.id).length > 0 && (
              <button onClick={openImportModal}
                className="flex items-center gap-2 border rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)', background: 'var(--adm-input)' }}>
                <FileInput size={15} /> Importar de...
              </button>
            )}
            <button onClick={cancelEdit}
              className="px-4 py-2 text-sm rounded-lg border transition-colors"
              style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)', background: 'transparent' }}>
              Cancelar
            </button>
            <button onClick={saveEdit}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-cpe-red hover:bg-cpe-red/80 rounded-lg transition-colors">
              <Save size={14} /> Salvar
            </button>
          </>
        )}
      </div>

      {/* days of service row */}
      <div className="rounded-xl border p-3 mb-3 grid grid-cols-2 sm:grid-cols-4 gap-3"
        style={{ background: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
        {(['pelA', 'pelB', 'pelC', 'pelD'] as const).map((k, i) => (
          <div key={k}>
            <label className="block text-xs font-bold mb-1" style={{ color: 'var(--adm-muted)' }}>
              Pelotão {['A', 'B', 'C', 'D'][i]} — Dias de Serviço
            </label>
            {editMode ? (
              <input value={draft!.diasServico[k]}
                onChange={e => setDraftField('diasServico', { ...draft!.diasServico, [k]: e.target.value })}
                className={cls} style={fss} />
            ) : (
              <p className="text-xs" style={{ color: 'var(--adm-text)' }}>{m.diasServico[k]}</p>
            )}
          </div>
        ))}
      </div>

      {/* main table */}
      <div className="overflow-auto rounded-xl border mb-4 flex-1" style={{ borderColor: 'var(--adm-border)' }}>
        <table className="w-full text-xs" style={{ minWidth: 900 }}>
          <thead className="sticky top-0 z-10" style={{ background: 'var(--adm-tbl-head)' }}>
            <tr className="font-semibold uppercase tracking-wide" style={{ color: 'var(--adm-muted)' }}>
              <th className="px-3 py-2.5 text-left w-32">Viatura</th>
              <th className="px-3 py-2.5 text-left">Pelotão A</th>
              <th className="px-3 py-2.5 text-left">Pelotão B</th>
              <th className="px-3 py-2.5 text-left">Pelotão C</th>
              <th className="px-3 py-2.5 text-left">Pelotão D</th>
              <th className="px-3 py-2.5 text-left">Admin — Nome</th>
              <th className="px-3 py-2.5 text-left w-28">Função</th>
              <th className="px-3 py-2.5 text-left">S. E. R. — Nome</th>
              <th className="px-3 py-2.5 text-left w-24">Status</th>
              {editMode && <th className="px-3 py-2.5 text-center w-10"></th>}
            </tr>
          </thead>
          <tbody>
            {m.linhas.map((row, i) => {
              const isHeader = row.label === 'CPE CMD' || row.label === 'CPE 90' || row.label === 'CPE 20';
              const isReserva = row.label === 'Dia a Reserva';
              const bg = isHeader ? 'var(--adm-input)' : isReserva ? 'color-mix(in srgb, var(--adm-accent) 8%, transparent)' : i % 2 === 0 ? 'var(--adm-row-even)' : 'transparent';

              return (
                <tr key={i} className="adm-row border-t transition-colors"
                  style={{ borderColor: 'var(--adm-border)', background: bg }}>

                  {/* label */}
                  <td className="px-3 py-2 font-semibold" style={{ color: isHeader ? 'var(--adm-accent)' : 'var(--adm-muted)', fontSize: 11 }}>
                    {editMode
                      ? <input value={row.label} onChange={e => setDraftRow(i, 'label', e.target.value)} className={cls} style={fss} />
                      : row.label}
                  </td>

                  {/* pelotões */}
                  {(['pelA', 'pelB', 'pelC', 'pelD'] as const).map(col => (
                    <td key={col} className="px-3 py-2" style={{ color: row[col] === 'S. E. R.' ? 'var(--adm-subtle)' : 'var(--adm-text)' }}>
                      {editMode
                        ? <input value={row[col]} onChange={e => setDraftRow(i, col, e.target.value)} className={cls} style={fss} />
                        : canEdit && inlineCell?.rowIdx === i && inlineCell?.col === col
                          ? <input autoFocus value={inlineVal} onChange={e => setInlineVal(e.target.value)}
                              onBlur={commitInline}
                              onKeyDown={e => { if (e.key === 'Enter') commitInline(); if (e.key === 'Escape') cancelInline(); }}
                              className={cls} style={fss} />
                          : <span onClick={canEdit ? () => startInline(i, col, row[col]) : undefined}
                              className={canEdit ? 'cursor-pointer rounded px-1 -mx-1 hover:bg-white/5 transition-colors block' : 'block'}>
                              {row[col] || emptyBox}
                            </span>}
                    </td>
                  ))}

                  {/* admin nome */}
                  <td className="px-3 py-2" style={{ color: 'var(--adm-text)' }}>
                    {editMode
                      ? <input value={row.adminNome ?? ''} onChange={e => setDraftRow(i, 'adminNome', e.target.value)} className={cls} style={fss} />
                      : canEdit && inlineCell?.rowIdx === i && inlineCell?.col === 'adminNome'
                        ? <input autoFocus value={inlineVal} onChange={e => setInlineVal(e.target.value)}
                            onBlur={commitInline}
                            onKeyDown={e => { if (e.key === 'Enter') commitInline(); if (e.key === 'Escape') cancelInline(); }}
                            className={cls} style={fss} />
                        : <span onClick={canEdit ? () => startInline(i, 'adminNome', row.adminNome ?? '') : undefined}
                            className={canEdit ? 'cursor-pointer rounded px-1 -mx-1 hover:bg-white/5 transition-colors block' : 'block'}>
                            {row.adminNome || emptyBox}
                          </span>}
                  </td>

                  {/* admin funcao */}
                  <td className="px-3 py-2 italic" style={{ color: 'var(--adm-muted)', fontSize: 11 }}>
                    {editMode
                      ? <input value={row.adminFuncao ?? ''} onChange={e => setDraftRow(i, 'adminFuncao', e.target.value)} className={cls} style={fss} />
                      : canEdit && inlineCell?.rowIdx === i && inlineCell?.col === 'adminFuncao'
                        ? <input autoFocus value={inlineVal} onChange={e => setInlineVal(e.target.value)}
                            onBlur={commitInline}
                            onKeyDown={e => { if (e.key === 'Enter') commitInline(); if (e.key === 'Escape') cancelInline(); }}
                            className={cls} style={fss} />
                        : <span onClick={canEdit ? () => startInline(i, 'adminFuncao', row.adminFuncao ?? '') : undefined}
                            className={canEdit ? 'cursor-pointer rounded px-1 -mx-1 hover:bg-white/5 transition-colors block' : 'block'}>
                            {row.adminFuncao || emptyBox}
                          </span>}
                  </td>

                  {/* ser nome */}
                  <td className="px-3 py-2" style={{ color: 'var(--adm-text)' }}>
                    {editMode
                      ? <input value={row.serNome ?? ''} onChange={e => setDraftRow(i, 'serNome', e.target.value)} className={cls} style={fss} />
                      : canEdit && inlineCell?.rowIdx === i && inlineCell?.col === 'serNome'
                        ? <input autoFocus value={inlineVal} onChange={e => setInlineVal(e.target.value)}
                            onBlur={commitInline}
                            onKeyDown={e => { if (e.key === 'Enter') commitInline(); if (e.key === 'Escape') cancelInline(); }}
                            className={cls} style={fss} />
                        : <span onClick={canEdit ? () => startInline(i, 'serNome', row.serNome ?? '') : undefined}
                            className={canEdit ? 'cursor-pointer rounded px-1 -mx-1 hover:bg-white/5 transition-colors block' : 'block'}>
                            {row.serNome || emptyBox}
                          </span>}
                  </td>

                  {/* ser status */}
                  <td className="px-3 py-2 italic" style={{ color: 'var(--adm-muted)', fontSize: 11 }}>
                    {editMode
                      ? <input value={row.serStatus ?? ''} onChange={e => setDraftRow(i, 'serStatus', e.target.value)} className={cls} style={fss} />
                      : canEdit && inlineCell?.rowIdx === i && inlineCell?.col === 'serStatus'
                        ? <input autoFocus value={inlineVal} onChange={e => setInlineVal(e.target.value)}
                            onBlur={commitInline}
                            onKeyDown={e => { if (e.key === 'Enter') commitInline(); if (e.key === 'Escape') cancelInline(); }}
                            className={cls} style={fss} />
                        : <span onClick={canEdit ? () => startInline(i, 'serStatus', row.serStatus ?? '') : undefined}
                            className={canEdit ? 'cursor-pointer rounded px-1 -mx-1 hover:bg-white/5 transition-colors block' : 'block'}>
                            {row.serStatus || emptyBox}
                          </span>}
                  </td>

                  {/* delete row */}
                  {editMode && (
                    <td className="px-2 py-2 text-center">
                      <button onClick={() => removeRow(i)} title="Remover linha"
                        className="p-1 rounded transition-colors hover:bg-cpe-red/10 text-cpe-red opacity-60 hover:opacity-100">
                        <X size={14} />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}

            {/* empty state */}
            {m.linhas.length === 0 && (
              <tr><td colSpan={10} className="px-4 py-12 text-center" style={{ color: 'var(--adm-subtle)' }}>Nenhuma linha.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* add row button */}
      {editMode && (
        <div className="mb-4">
          <button onClick={addRow}
            className="flex items-center gap-2 border rounded-lg px-3 py-2 text-sm font-medium transition-colors"
            style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)', background: 'var(--adm-input)' }}>
            <Plus size={14} /> Adicionar linha
          </button>
        </div>
      )}

      {/* afastamentos + contagens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

        {/* afastamentos */}
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--adm-border)' }}>
          <div className="flex items-center justify-between px-4 py-3"
            style={{ background: 'var(--adm-tbl-head)', borderBottom: '1px solid var(--adm-border)' }}>
            <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--adm-muted)' }}>Afastamentos</span>
            {editMode && (
              <button onClick={openAfCreate}
                className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg bg-cpe-red text-white hover:bg-cpe-red/80 transition-colors">
                <Plus size={12} /> Incluir
              </button>
            )}
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: 'var(--adm-tbl-head)', color: 'var(--adm-muted)' }}>
                <th className="px-3 py-2 text-left font-semibold uppercase tracking-wide w-20">Tipo</th>
                <th className="px-3 py-2 text-left font-semibold uppercase tracking-wide">Nome</th>
                <th className="px-3 py-2 text-left font-semibold uppercase tracking-wide">Retorno</th>
                {editMode && <th className="w-14"></th>}
              </tr>
            </thead>
            <tbody>
              {m.afastamentos.map((a, i) => (
                <tr key={a.id} className="adm-row border-t transition-colors"
                  style={{ borderColor: 'var(--adm-border)', background: i % 2 === 0 ? 'var(--adm-row-even)' : 'transparent' }}>
                  <td className="px-3 py-2 font-semibold" style={{ color: 'var(--adm-accent)' }}>{a.tipo}</td>
                  <td className="px-3 py-2" style={{ color: 'var(--adm-text)' }}>{a.nome}</td>
                  <td className="px-3 py-2" style={{ color: 'var(--adm-muted)' }}>{a.retorno}</td>
                  {editMode && (
                    <td className="px-2 py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openAfEdit(a)} title="Editar"
                          className="p-1 rounded hover:bg-amber-400/10 text-amber-400 opacity-70 hover:opacity-100 transition-colors">
                          <Pencil size={12} />
                        </button>
                        <button onClick={() => deleteAf(a.id)} title="Remover"
                          className="p-1 rounded hover:bg-cpe-red/10 text-cpe-red opacity-70 hover:opacity-100 transition-colors">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {m.afastamentos.length === 0 && (
                <tr><td colSpan={4} className="px-3 py-6 text-center" style={{ color: 'var(--adm-subtle)' }}>Sem afastamentos.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* contagens */}
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--adm-border)' }}>
          <div className="px-4 py-3" style={{ background: 'var(--adm-tbl-head)', borderBottom: '1px solid var(--adm-border)' }}>
            <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--adm-muted)' }}>Efetivo em Serviço</span>
          </div>
          <div className="p-4 grid grid-cols-2 gap-2">
            {(
              [
                ['Pelotão A',       'pelA'],
                ['Pelotão B',       'pelB'],
                ['Pelotão C',       'pelC'],
                ['Pelotão D',       'pelD'],
                ['Diagonal',        'diagonal'],
                ['Dia a Reserva',   'diaReserva'],
                ['Administração',   'administracao'],
                ['Afas. LESP',      'lesp'],
                ['Afas. Férias',    'ferias'],
                ['Afas. Curso',     'curso'],
                ['Afas. JCS',       'jcs'],
                ['Afas. Outros',    'outros'],
              ] as [string, keyof MapaContagem][]
            ).map(([lbl, key]) => (
              <div key={key} className="flex items-center justify-between gap-2">
                <span className="text-xs" style={{ color: 'var(--adm-muted)' }}>{lbl}</span>
                {editMode ? (
                  <input type="number" min={0}
                    value={(draft!.contagens as Record<string, number>)[key]}
                    onChange={e => setDraftCount(key, +e.target.value)}
                    className="adm-input rounded px-2 py-1 text-xs border w-16 text-right"
                    style={fss} />
                ) : (
                  <span className="text-xs font-bold" style={{ color: 'var(--adm-text)' }}>
                    {(m.contagens as Record<string, number>)[key]}
                  </span>
                )}
              </div>
            ))}
            <div className="col-span-2 pt-2 mt-1 border-t flex items-center justify-between"
              style={{ borderColor: 'var(--adm-border)' }}>
              <span className="text-sm font-bold" style={{ color: 'var(--adm-text)' }}>TOTAL</span>
              {editMode ? (
                <input type="number" min={0} value={draft!.contagens.total}
                  onChange={e => setDraftCount('total', +e.target.value)}
                  className="adm-input rounded px-2 py-1 text-sm border w-20 text-right font-bold"
                  style={fss} />
              ) : (
                <span className="text-sm font-black" style={{ color: 'var(--adm-accent)' }}>{m.contagens.total}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── afastamento modal ─────────────────────────────────────────────── */}
      {afModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl shadow-2xl border"
            style={{ background: 'var(--adm-modal)', borderColor: 'var(--adm-border)' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--adm-border)' }}>
              <h4 className="font-bold text-lg" style={{ color: 'var(--adm-text)' }}>
                {afModal.mode === 'create' ? 'Novo Afastamento' : 'Editar Afastamento'}
              </h4>
              <button onClick={() => setAfModal(null)} style={{ color: 'var(--adm-muted)' }}><X size={20} /></button>
            </div>
            <div className="px-6 py-5 grid gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Tipo</label>
                <select value={afForm.tipo} onChange={e => setAfForm(f => ({ ...f, tipo: e.target.value as TipoAfastamento }))}
                  className="adm-input w-full rounded-lg px-3 py-2.5 text-base border" style={fs}>
                  {TIPOS_AFASTAMENTO.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Nome</label>
                <input value={afForm.nome} onChange={e => { setAfForm(f => ({ ...f, nome: e.target.value })); setAfError(''); }}
                  className="adm-input w-full rounded-lg px-3 py-2.5 text-base border" style={{ ...fs, ...(afError ? { borderColor: '#ef4444' } : {}) }} />
                {afError && <p className="text-sm mt-1 text-red-400 flex items-center gap-1"><AlertCircle size={13} /> {afError}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Retorno / Observação</label>
                <input value={afForm.retorno} onChange={e => setAfForm(f => ({ ...f, retorno: e.target.value }))}
                  placeholder="Ex: 15/06/2026 ou Lic. Maternidade"
                  className="adm-input w-full rounded-lg px-3 py-2.5 text-base border" style={fs} />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 pb-5">
              <button onClick={() => setAfModal(null)}
                className="px-5 py-2.5 text-base rounded-lg border transition-colors"
                style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)', background: 'transparent' }}>Cancelar</button>
              <button onClick={saveAf}
                className="flex items-center gap-2 px-5 py-2.5 text-base font-semibold text-white bg-cpe-red hover:bg-cpe-red/80 rounded-lg transition-colors">
                <Save size={16} /> Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── import from modal ────────────────────────────────────────────── */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl shadow-2xl border p-6"
            style={{ background: 'var(--adm-modal)', borderColor: 'var(--adm-border)' }}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-xl" style={{ color: 'var(--adm-text)' }}>Importar dados de...</h4>
              <button onClick={() => setShowImportModal(false)} style={{ color: 'var(--adm-muted)' }}><X size={20} /></button>
            </div>
            <p className="text-sm mb-4" style={{ color: 'var(--adm-muted)' }}>
              Todos os dados do mês selecionado (efetivo, afastamentos e contagens) serão copiados para{' '}
              <span className="font-semibold" style={{ color: 'var(--adm-text)' }}>
                {draft && `${MESES_NOME[draft.mes - 1]} / ${draft.ano}`}
              </span>.
            </p>
            <div className="mb-5">
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Mês de origem</label>
              <select value={importFromId} onChange={e => setImportFromId(e.target.value)}
                className="adm-input w-full rounded-lg px-3 py-2.5 text-base border" style={fs}>
                {sorted.filter(s => s.id !== draft?.id).map(s => (
                  <option key={s.id} value={s.id}>{MESES_NOME[s.mes - 1]} / {s.ano}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowImportModal(false)}
                className="px-5 py-2.5 text-base rounded-lg border transition-colors"
                style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)', background: 'transparent' }}>Cancelar</button>
              <button onClick={handleImport}
                className="flex items-center gap-2 px-5 py-2.5 text-base font-semibold text-white bg-cpe-red hover:bg-cpe-red/80 rounded-lg transition-colors">
                <FileInput size={16} /> Importar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── delete confirm ────────────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl shadow-2xl border p-6"
            style={{ background: 'var(--adm-modal)', borderColor: 'var(--adm-border)' }}>
            <h4 className="font-bold text-xl mb-2" style={{ color: 'var(--adm-text)' }}>Confirmar exclusão</h4>
            <p className="text-base mb-6" style={{ color: 'var(--adm-muted)' }}>
              Deseja excluir o mapa de{' '}
              <span className="font-semibold" style={{ color: 'var(--adm-text)' }}>
                {MESES_NOME[deleteTarget.mes - 1]} / {deleteTarget.ano}
              </span>? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteTarget(null)}
                className="px-5 py-2.5 text-base rounded-lg border transition-colors"
                style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)', background: 'transparent' }}>Cancelar</button>
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
