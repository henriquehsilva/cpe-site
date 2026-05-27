import { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  ArrowLeft, Plus, Pencil, Trash2, X, Save, Download,
  FileSpreadsheet, Printer, ChevronLeft, ChevronRight, AlertCircle, Phone,
} from 'lucide-react';
import {
  caraterGeralDB, CaraterGeral, CaraterVeiculo, CaraterAlerta, CaraterUnidade,
} from '../../data/caraterGeral';
import { ModulePermission } from '../../types/rbac';
import { usePersistentState } from '../../hooks/usePersistentState';

// ── helpers ───────────────────────────────────────────────────────────────────

function nextId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function emptyVeiculo(): CaraterVeiculo {
  return { id: nextId(), placa: '', marcaModelo: '', corMilhar: '', ano: '', art: '', dataInfracao: '' };
}

function emptyAlerta(): CaraterAlerta {
  return { id: nextId(), placa: '', descricao: '' };
}

function emptyUnidade(): CaraterUnidade {
  return { id: nextId(), nome: '', telefone: '', integrantes: [] };
}

function emptyCarater(data: string): Omit<CaraterGeral, 'id'> {
  return { data, veiculos: [], alertas: [], unidades: [] };
}

// ── XLSX export ───────────────────────────────────────────────────────────────

function exportXLSX(cg: CaraterGeral) {
  const wb = XLSX.utils.book_new();

  // Sheet: Veículos
  const wsV = XLSX.utils.aoa_to_sheet([
    [`CARÁTER GERAL — ${cg.data}`],
    [],
    ['PLACA', 'MARCA/MODELO', 'COR/MILHAR', 'ANO', 'ART', 'DATA'],
    ...cg.veiculos.map(v => [v.placa, v.marcaModelo, v.corMilhar, v.ano, v.art, v.dataInfracao]),
    [],
    ['ALERTA'],
    ['PLACA', 'DESCRIÇÃO'],
    ...cg.alertas.map(a => [a.placa, a.descricao]),
  ]);
  wsV['!cols'] = [{ wch: 22 }, { wch: 28 }, { wch: 13 }, { wch: 7 }, { wch: 5 }, { wch: 7 }];
  XLSX.utils.book_append_sheet(wb, wsV, 'Veículos');

  // Sheet: Efetivo — 5 units per row
  const cols5 = Math.ceil(cg.unidades.length / 5) * 5;
  const rows: (string)[][] = [];
  for (let row = 0; row < Math.ceil(cg.unidades.length / 5); row++) {
    const slice = cg.unidades.slice(row * 5, row * 5 + 5);
    // header row (nome, telefone alternated)
    const hdr: string[] = [];
    slice.forEach(u => hdr.push(u.nome, u.telefone));
    rows.push(hdr);
    // member rows
    const maxM = Math.max(0, ...slice.map(u => u.integrantes.length));
    for (let m = 0; m < maxM; m++) {
      const mRow: string[] = [];
      slice.forEach(u => mRow.push(u.integrantes[m] ?? '', ''));
      rows.push(mRow);
    }
    rows.push(Array(cols5 * 2).fill(''));
  }
  const wsE = XLSX.utils.aoa_to_sheet(rows);
  wsE['!cols'] = Array(10).fill({ wch: 20 });
  XLSX.utils.book_append_sheet(wb, wsE, 'Efetivo');

  XLSX.writeFile(wb, `carater_geral_${cg.data.replace(/\//g, '-')}.xlsx`);
}

function exportPrint(cg: CaraterGeral) {
  const vRows = cg.veiculos.map(v => `
    <tr>
      <td class="placa">${v.placa}</td><td>${v.marcaModelo}</td><td>${v.corMilhar}</td>
      <td>${v.ano}</td><td>${v.art}</td><td>${v.dataInfracao}</td>
    </tr>`).join('');
  const alRows = cg.alertas.map(a => `<tr><td class="placa">${a.placa}</td><td>${a.descricao}</td></tr>`).join('');

  // efetivo grid: 5 per row
  let efHtml = '';
  for (let row = 0; row < Math.ceil(cg.unidades.length / 5); row++) {
    const slice = cg.unidades.slice(row * 5, row * 5 + 5);
    efHtml += '<tr>' + slice.map(u => `<th>${u.nome}<br/><small>${u.telefone}</small></th>`).join('') + '</tr>';
    const maxM = Math.max(0, ...slice.map(u => u.integrantes.length));
    for (let m = 0; m < maxM; m++) {
      efHtml += '<tr>' + slice.map(u => `<td>${u.integrantes[m] ?? ''}</td>`).join('') + '</tr>';
    }
    efHtml += '<tr><td colspan="5" style="height:10px;border:none"></td></tr>';
  }

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <title>Caráter Geral ${cg.data}</title>
    <style>
      body{font-family:Arial;font-size:9px;margin:12px}
      h1{font-size:14px;text-align:center;margin:0 0 12px}
      h2{font-size:12px;margin:14px 0 5px}
      table{border-collapse:collapse;width:100%;margin-bottom:12px}
      th,td{border:1px solid #bbb;padding:2px 5px;white-space:nowrap}
      th{background:#2d2d2d;color:#fff;font-size:8px;text-transform:uppercase}
      .placa{font-weight:700;font-size:13px}
    </style></head><body>
    <h1>CARÁTER GERAL CPE — ${cg.data}</h1>
    <table>
      <thead><tr><th>Placa</th><th>Marca/Modelo</th><th>Cor/Milhar</th><th>Ano</th><th>Art</th><th>Data</th></tr></thead>
      <tbody>${vRows}</tbody>
    </table>
    <h2>ALERTAS</h2>
    <table style="width:auto">
      <thead><tr><th>Placa</th><th>Descrição</th></tr></thead>
      <tbody>${alRows}</tbody>
    </table>
    <h2>EFETIVO</h2>
    <table><tbody>${efHtml}</tbody></table>
  </body></html>`;
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  const w = window.open(url, '_blank');
  if (w) w.onload = () => { w.print(); URL.revokeObjectURL(url); };
}

// ── component ─────────────────────────────────────────────────────────────────

type View = 'list' | 'detail';

interface Props {
  onBack: () => void;
  permissions?: ModulePermission;
}

export default function CaraterGeralModule({ onBack, permissions }: Props) {
  const canCreate = !permissions || permissions.create;
  const canEdit   = !permissions || permissions.edit;
  const canDelete = !permissions || permissions.delete;

  const [data, setData]           = usePersistentState<CaraterGeral[]>('cpe-site:carater-geral:v2', caraterGeralDB);
  const [view, setView]           = useState<View>('list');
  const [selected, setSelected]   = useState<CaraterGeral | null>(null);
  const [editMode, setEditMode]   = useState(false);
  const [draft, setDraft]         = useState<CaraterGeral | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newDataStr, setNewDataStr] = useState('');
  const [newDataErr, setNewDataErr] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<CaraterGeral | null>(null);
  const [showExport, setShowExport] = useState(false);

  const sorted = useMemo(() =>
    [...data].sort((a, b) => {
      const p = (s: string) => { const [d, m, y] = s.split('/'); return new Date(+y, +m - 1, +d).getTime(); };
      return p(b.data) - p(a.data);
    }),
  [data]);

  // ── navigation ────────────────────────────────────────────────────────────
  const openDetail = (cg: CaraterGeral) => { setSelected(cg); setEditMode(false); setDraft(null); setView('detail'); };
  const goBack = () => { setView('list'); setSelected(null); setEditMode(false); setDraft(null); };
  const navDay = (dir: -1 | 1) => {
    if (!selected) return;
    const i = sorted.findIndex(c => c.id === selected.id);
    const next = sorted[i + dir];
    if (next) openDetail(next);
  };

  // ── edit mode ──────────────────────────────────────────────────────────────
  const startEdit = () => { if (!selected) return; setDraft(JSON.parse(JSON.stringify(selected))); setEditMode(true); };
  const cancelEdit = () => { setDraft(null); setEditMode(false); };
  const saveEdit = () => {
    if (!draft) return;
    setData(d => d.map(c => c.id === draft.id ? draft : c));
    setSelected(draft);
    setEditMode(false);
    setDraft(null);
  };

  // ── draft helpers ──────────────────────────────────────────────────────────
  const setDF = <K extends keyof CaraterGeral>(k: K, v: CaraterGeral[K]) =>
    setDraft(d => d ? { ...d, [k]: v } : d);

  // vehicles
  const setVeiculo = (i: number, f: keyof CaraterVeiculo, v: string) =>
    setDraft(d => { if (!d) return d; return { ...d, veiculos: d.veiculos.map((r, idx) => idx === i ? { ...r, [f]: v } : r) }; });
  const addVeiculo    = () => setDraft(d => d ? { ...d, veiculos: [...d.veiculos, emptyVeiculo()] } : d);
  const removeVeiculo = (i: number) => setDraft(d => d ? { ...d, veiculos: d.veiculos.filter((_, idx) => idx !== i) } : d);

  // alertas
  const setAlerta = (i: number, f: keyof CaraterAlerta, v: string) =>
    setDraft(d => { if (!d) return d; return { ...d, alertas: d.alertas.map((r, idx) => idx === i ? { ...r, [f]: v } : r) }; });
  const addAlerta    = () => setDraft(d => d ? { ...d, alertas: [...d.alertas, emptyAlerta()] } : d);
  const removeAlerta = (i: number) => setDraft(d => d ? { ...d, alertas: d.alertas.filter((_, idx) => idx !== i) } : d);

  // unidades
  const setUnidade = (i: number, f: keyof CaraterUnidade, v: string) =>
    setDraft(d => { if (!d) return d; return { ...d, unidades: d.unidades.map((u, idx) => idx === i ? { ...u, [f]: v } : u) }; });
  const addUnidade    = () => setDraft(d => d ? { ...d, unidades: [...d.unidades, emptyUnidade()] } : d);
  const removeUnidade = (i: number) => setDraft(d => d ? { ...d, unidades: d.unidades.filter((_, idx) => idx !== i) } : d);
  const setIntegrante = (ui: number, mi: number, v: string) =>
    setDraft(d => {
      if (!d) return d;
      const unidades = d.unidades.map((u, idx) => {
        if (idx !== ui) return u;
        const integrantes = u.integrantes.map((n, jdx) => jdx === mi ? v : n);
        return { ...u, integrantes };
      });
      return { ...d, unidades };
    });
  const addIntegrante = (ui: number) =>
    setDraft(d => {
      if (!d) return d;
      const unidades = d.unidades.map((u, idx) =>
        idx === ui ? { ...u, integrantes: [...u.integrantes, ''] } : u
      );
      return { ...d, unidades };
    });
  const removeIntegrante = (ui: number, mi: number) =>
    setDraft(d => {
      if (!d) return d;
      const unidades = d.unidades.map((u, idx) =>
        idx === ui ? { ...u, integrantes: u.integrantes.filter((_, jdx) => jdx !== mi) } : u
      );
      return { ...d, unidades };
    });

  // ── create ─────────────────────────────────────────────────────────────────
  const handleCreate = () => {
    if (!newDataStr.trim()) { setNewDataErr('Data obrigatória'); return; }
    if (data.some(c => c.data === newDataStr.trim())) { setNewDataErr('Já existe registro para esta data'); return; }
    const novo: CaraterGeral = { id: nextId(), ...emptyCarater(newDataStr.trim()) };
    setData(d => [...d, novo]);
    setShowNewModal(false);
    setNewDataStr('');
    openDetail(novo);
    setTimeout(() => startEdit(), 50);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setData(d => d.filter(c => c.id !== deleteTarget.id));
    setDeleteTarget(null);
    goBack();
  };

  // ── styles ─────────────────────────────────────────────────────────────────
  const fs  = { background: 'var(--adm-input)', color: 'var(--adm-text)', border: '1px solid var(--adm-border)' };
  const fss = { background: 'var(--adm-input)', color: 'var(--adm-text)', border: '1px solid var(--adm-border)', fontSize: 12 };
  const cls = 'adm-input rounded px-2 py-1 text-sm border w-full';

  // ── list view ──────────────────────────────────────────────────────────────
  if (view === 'list') {
    return (
      <div className="flex flex-col h-full">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <button onClick={onBack} className="flex items-center gap-1.5 transition-colors text-base font-medium"
            style={{ color: 'var(--adm-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--adm-text)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--adm-muted)')}>
            <ArrowLeft size={17} /> Módulos
          </button>
          <span style={{ color: 'var(--adm-border)' }} className="hidden sm:block">|</span>
          <h3 className="font-bold text-2xl flex-1" style={{ color: 'var(--adm-text)' }}>Caráter Geral</h3>
          {canCreate && (
            <button onClick={() => { setNewDataStr(''); setNewDataErr(''); setShowNewModal(true); }}
              className="flex items-center gap-2 bg-cpe-red hover:bg-cpe-red/80 text-white text-base font-semibold px-4 py-2 rounded-lg transition-colors">
              <Plus size={16} /> Nova Data
            </button>
          )}
        </div>

        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 rounded-2xl border"
            style={{ background: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
            <p className="text-lg font-semibold" style={{ color: 'var(--adm-text)' }}>Nenhum registro</p>
            <p className="text-sm mt-1" style={{ color: 'var(--adm-muted)' }}>Clique em "Nova Data" para começar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {sorted.map(cg => (
              <button key={cg.id} onClick={() => openDetail(cg)}
                className="adm-card group flex flex-col gap-3 p-5 rounded-2xl transition-all duration-200 hover:scale-105 hover:shadow-2xl border text-left"
                style={{ background: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
                <div className="text-xl font-black" style={{ color: 'var(--adm-accent)' }}>{cg.data}</div>
                <div className="space-y-1 text-xs" style={{ color: 'var(--adm-muted)' }}>
                  <div>{cg.veiculos.length} veículo{cg.veiculos.length !== 1 ? 's' : ''}</div>
                  <div>{cg.alertas.length} alerta{cg.alertas.length !== 1 ? 's' : ''}</div>
                  <div>{cg.unidades.length} unidade{cg.unidades.length !== 1 ? 's' : ''}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {showNewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl shadow-2xl border p-6"
              style={{ background: 'var(--adm-modal)', borderColor: 'var(--adm-border)' }}>
              <div className="flex items-center justify-between mb-5">
                <h4 className="font-bold text-xl" style={{ color: 'var(--adm-text)' }}>Nova Data</h4>
                <button onClick={() => setShowNewModal(false)} style={{ color: 'var(--adm-muted)' }}><X size={20} /></button>
              </div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Data (DD/MM/AAAA)</label>
              <input value={newDataStr} onChange={e => { setNewDataStr(e.target.value); setNewDataErr(''); }}
                placeholder="27/05/2026"
                className="adm-input w-full rounded-lg px-3 py-2.5 text-base border mb-1"
                style={{ ...fs, ...(newDataErr ? { borderColor: '#ef4444' } : {}) }} />
              {newDataErr && <p className="text-sm text-red-400 flex items-center gap-1 mb-3"><AlertCircle size={13} /> {newDataErr}</p>}
              <div className="flex gap-3 justify-end mt-4">
                <button onClick={() => setShowNewModal(false)}
                  className="px-5 py-2.5 text-base rounded-lg border"
                  style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)', background: 'transparent' }}>Cancelar</button>
                <button onClick={handleCreate}
                  className="flex items-center gap-2 px-5 py-2.5 text-base font-semibold text-white bg-cpe-red hover:bg-cpe-red/80 rounded-lg transition-colors">
                  <Plus size={16} /> Criar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── detail view ────────────────────────────────────────────────────────────
  const cg  = editMode && draft ? draft : selected!;
  const idx = sorted.findIndex(c => c.id === cg.id);

  return (
    <div className="flex flex-col h-full">

      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <button onClick={goBack} className="flex items-center gap-1.5 transition-colors text-base font-medium"
          style={{ color: 'var(--adm-muted)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--adm-text)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--adm-muted)')}>
          <ArrowLeft size={17} /> Caráter Geral
        </button>
        <span style={{ color: 'var(--adm-border)' }} className="hidden sm:block">|</span>

        <div className="flex items-center gap-1">
          <button onClick={() => navDay(1)} disabled={idx === 0}
            className="p-1.5 rounded-lg transition-colors disabled:opacity-30"
            style={{ color: 'var(--adm-muted)' }}><ChevronLeft size={18} /></button>
          <h3 className="font-bold text-xl px-1" style={{ color: 'var(--adm-text)' }}>
            {editMode
              ? <input value={draft!.data} onChange={e => setDF('data', e.target.value)}
                  className="adm-input rounded-lg px-3 py-1 text-xl font-bold border w-36"
                  style={fs} />
              : cg.data}
            {editMode && <span className="ml-2 text-sm text-amber-400 font-normal">— editando</span>}
          </h3>
          <button onClick={() => navDay(-1)} disabled={idx === sorted.length - 1}
            className="p-1.5 rounded-lg transition-colors disabled:opacity-30"
            style={{ color: 'var(--adm-muted)' }}><ChevronRight size={18} /></button>
        </div>

        <div className="flex-1" />

        {!editMode && (
          <>
            <div className="relative">
              <button onClick={() => setShowExport(v => !v)}
                className="flex items-center gap-2 border rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)', background: 'var(--adm-input)' }}>
                <Download size={15} /> Exportar
              </button>
              {showExport && (
                <div className="absolute right-0 top-full mt-1 rounded-xl shadow-2xl z-20 w-48 py-1.5 overflow-hidden"
                  style={{ background: 'var(--adm-dropdown)', border: '1px solid var(--adm-border)' }}>
                  <button onClick={() => { exportXLSX(selected!); setShowExport(false); }}
                    className="adm-drop-item flex items-center gap-3 w-full px-4 py-3 text-sm transition-colors"
                    style={{ color: 'var(--adm-text)' }}>
                    <FileSpreadsheet size={15} className="text-emerald-400" /> XLSX
                  </button>
                  <button onClick={() => { exportPrint(selected!); setShowExport(false); }}
                    className="adm-drop-item flex items-center gap-3 w-full px-4 py-3 text-sm transition-colors"
                    style={{ color: 'var(--adm-text)' }}>
                    <Printer size={15} style={{ color: 'var(--adm-muted)' }} /> Imprimir / PDF
                  </button>
                </div>
              )}
            </div>
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
            <button onClick={cancelEdit}
              className="px-4 py-2 text-sm rounded-lg border"
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

      {/* ── vehicles ──────────────────────────────────────────────────────── */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--adm-muted)' }}>
            Veículos em Acompanhamento
          </h4>
          {editMode && (
            <button onClick={addVeiculo}
              className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg bg-cpe-red text-white hover:bg-cpe-red/80 transition-colors">
              <Plus size={12} /> Adicionar
            </button>
          )}
        </div>
        <div className="overflow-auto rounded-xl border" style={{ borderColor: 'var(--adm-border)' }}>
          <table className="w-full text-xs" style={{ minWidth: 700 }}>
            <thead className="sticky top-0 z-10" style={{ background: 'var(--adm-tbl-head)' }}>
              <tr className="font-semibold uppercase tracking-wide" style={{ color: 'var(--adm-muted)' }}>
                <th className="px-3 py-2.5 text-left">Placa</th>
                <th className="px-3 py-2.5 text-left">Marca/Modelo</th>
                <th className="px-3 py-2.5 text-left">Cor/Milhar</th>
                <th className="px-3 py-2.5 text-left w-16">Ano</th>
                <th className="px-3 py-2.5 text-left w-14">Art</th>
                <th className="px-3 py-2.5 text-left w-16">Data</th>
                {editMode && <th className="w-8"></th>}
              </tr>
            </thead>
            <tbody>
              {cg.veiculos.map((v, i) => (
                <tr key={v.id} className="adm-row border-t transition-colors"
                  style={{ borderColor: 'var(--adm-border)', background: i % 2 === 0 ? 'var(--adm-row-even)' : 'transparent' }}>
                  {editMode ? (
                    <>
                      <td className="px-2 py-1.5"><input value={v.placa} onChange={e => setVeiculo(i, 'placa', e.target.value)} className={cls} style={fss} /></td>
                      <td className="px-2 py-1.5"><input value={v.marcaModelo} onChange={e => setVeiculo(i, 'marcaModelo', e.target.value)} className={cls} style={fss} /></td>
                      <td className="px-2 py-1.5"><input value={v.corMilhar} onChange={e => setVeiculo(i, 'corMilhar', e.target.value)} className={cls} style={fss} /></td>
                      <td className="px-2 py-1.5"><input value={v.ano} onChange={e => setVeiculo(i, 'ano', e.target.value)} className={cls} style={fss} /></td>
                      <td className="px-2 py-1.5"><input value={v.art} onChange={e => setVeiculo(i, 'art', e.target.value)} className={cls} style={fss} /></td>
                      <td className="px-2 py-1.5"><input value={v.dataInfracao} onChange={e => setVeiculo(i, 'dataInfracao', e.target.value)} className={cls} style={fss} /></td>
                      <td className="px-1 py-1.5 text-center">
                        <button onClick={() => removeVeiculo(i)}
                          className="p-1 rounded hover:bg-cpe-red/10 text-cpe-red opacity-60 hover:opacity-100 transition-colors">
                          <X size={13} />
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-3 py-2 font-semibold whitespace-nowrap text-sm" style={{ color: 'var(--adm-text)' }}>{v.placa}</td>
                      <td className="px-3 py-2" style={{ color: 'var(--adm-text)' }}>{v.marcaModelo}</td>
                      <td className="px-3 py-2" style={{ color: 'var(--adm-muted)' }}>{v.corMilhar}</td>
                      <td className="px-3 py-2 tabular-nums" style={{ color: 'var(--adm-muted)' }}>{v.ano}</td>
                      <td className="px-3 py-2" style={{ color: 'var(--adm-muted)' }}>{v.art}</td>
                      <td className="px-3 py-2 tabular-nums" style={{ color: 'var(--adm-muted)' }}>{v.dataInfracao}</td>
                    </>
                  )}
                </tr>
              ))}
              {cg.veiculos.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center" style={{ color: 'var(--adm-subtle)' }}>Nenhum veículo.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── alertas ───────────────────────────────────────────────────────── */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--adm-muted)' }}>Alertas</h4>
          {editMode && (
            <button onClick={addAlerta}
              className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg bg-cpe-red text-white hover:bg-cpe-red/80 transition-colors">
              <Plus size={12} /> Adicionar
            </button>
          )}
        </div>
        <div className="overflow-auto rounded-xl border" style={{ borderColor: 'var(--adm-border)' }}>
          <table className="w-full text-xs" style={{ minWidth: 480 }}>
            <thead style={{ background: 'var(--adm-tbl-head)' }}>
              <tr className="font-semibold uppercase tracking-wide" style={{ color: 'var(--adm-muted)' }}>
                <th className="px-3 py-2.5 text-left w-36">Placa</th>
                <th className="px-3 py-2.5 text-left">Descrição</th>
                {editMode && <th className="w-8"></th>}
              </tr>
            </thead>
            <tbody>
              {cg.alertas.map((a, i) => (
                <tr key={a.id} className="adm-row border-t transition-colors"
                  style={{ borderColor: 'var(--adm-border)', background: i % 2 === 0 ? 'var(--adm-row-even)' : 'transparent' }}>
                  {editMode ? (
                    <>
                      <td className="px-2 py-1.5 w-36"><input value={a.placa} onChange={e => setAlerta(i, 'placa', e.target.value)} className={cls} style={fss} /></td>
                      <td className="px-2 py-1.5"><input value={a.descricao} onChange={e => setAlerta(i, 'descricao', e.target.value)} className={cls} style={fss} /></td>
                      <td className="px-1 py-1.5 text-center">
                        <button onClick={() => removeAlerta(i)}
                          className="p-1 rounded hover:bg-cpe-red/10 text-cpe-red opacity-60 hover:opacity-100 transition-colors">
                          <X size={13} />
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-3 py-2 font-semibold whitespace-nowrap" style={{ color: 'var(--adm-accent)' }}>{a.placa}</td>
                      <td className="px-3 py-2" style={{ color: 'var(--adm-text)' }}>{a.descricao}</td>
                    </>
                  )}
                </tr>
              ))}
              {cg.alertas.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-8 text-center" style={{ color: 'var(--adm-subtle)' }}>Sem alertas.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── efetivo ───────────────────────────────────────────────────────── */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--adm-muted)' }}>Efetivo</h4>
          {editMode && (
            <button onClick={addUnidade}
              className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg bg-cpe-red text-white hover:bg-cpe-red/80 transition-colors">
              <Plus size={12} /> Unidade
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {cg.unidades.map((u, ui) => (
            <div key={u.id} className="rounded-xl border overflow-hidden"
              style={{ borderColor: 'var(--adm-border)' }}>
              {/* unit header */}
              <div className="px-3 py-2 border-b" style={{ background: 'var(--adm-tbl-head)', borderColor: 'var(--adm-border)' }}>
                {editMode ? (
                  <div className="space-y-1">
                    <input value={u.nome} onChange={e => setUnidade(ui, 'nome', e.target.value)}
                      placeholder="Nome da unidade"
                      className={cls} style={{ ...fss, fontWeight: 700 }} />
                    <div className="flex items-center gap-1">
                      <Phone size={10} style={{ color: 'var(--adm-subtle)', flexShrink: 0 }} />
                      <input value={u.telefone} onChange={e => setUnidade(ui, 'telefone', e.target.value)}
                        placeholder="Telefone"
                        className={cls} style={fss} />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-xs font-bold uppercase tracking-wide truncate text-center" style={{ color: 'var(--adm-accent)' }}>{u.nome || '—'}</div>
                    {u.telefone && (
                      <div className="flex items-center justify-center gap-1 mt-0.5">
                        <Phone size={10} style={{ color: 'var(--adm-subtle)' }} />
                        <span className="text-xs tabular-nums" style={{ color: 'var(--adm-muted)' }}>{u.telefone}</span>
                      </div>
                    )}
                  </>
                )}
                {editMode && (
                  <button onClick={() => removeUnidade(ui)}
                    className="mt-1 flex items-center gap-1 text-xs text-cpe-red opacity-60 hover:opacity-100 transition-colors">
                    <Trash2 size={11} /> remover unidade
                  </button>
                )}
              </div>
              {/* members */}
              <div className="p-2 space-y-1">
                {u.integrantes.map((n, mi) => (
                  <div key={mi} className="flex items-center gap-1">
                    {editMode ? (
                      <>
                        <input value={n} onChange={e => setIntegrante(ui, mi, e.target.value)}
                          className={cls} style={fss} />
                        <button onClick={() => removeIntegrante(ui, mi)}
                          className="p-1 rounded hover:bg-cpe-red/10 text-cpe-red opacity-60 hover:opacity-100 transition-colors flex-shrink-0">
                          <X size={12} />
                        </button>
                      </>
                    ) : (
                      <span className="text-xs px-1 py-0.5" style={{ color: 'var(--adm-text)' }}>{n}</span>
                    )}
                  </div>
                ))}
                {u.integrantes.length === 0 && !editMode && (
                  <span className="text-xs" style={{ color: 'var(--adm-subtle)' }}>—</span>
                )}
                {editMode && (
                  <button onClick={() => addIntegrante(ui)}
                    className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded mt-1 w-full transition-colors"
                    style={{ color: 'var(--adm-muted)', background: 'var(--adm-input)', border: '1px dashed var(--adm-border)' }}>
                    <Plus size={11} /> Adicionar
                  </button>
                )}
              </div>
            </div>
          ))}
          {cg.unidades.length === 0 && !editMode && (
            <div className="col-span-5 text-center py-8 text-xs" style={{ color: 'var(--adm-subtle)' }}>
              Sem unidades cadastradas.
            </div>
          )}
        </div>
      </div>

      {/* ── delete confirm ─────────────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl shadow-2xl border p-6"
            style={{ background: 'var(--adm-modal)', borderColor: 'var(--adm-border)' }}>
            <h4 className="font-bold text-xl mb-2" style={{ color: 'var(--adm-text)' }}>Confirmar exclusão</h4>
            <p className="text-base mb-6" style={{ color: 'var(--adm-muted)' }}>
              Excluir o Caráter Geral de{' '}
              <span className="font-semibold" style={{ color: 'var(--adm-text)' }}>{deleteTarget.data}</span>?
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteTarget(null)}
                className="px-5 py-2.5 text-base rounded-lg border"
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
