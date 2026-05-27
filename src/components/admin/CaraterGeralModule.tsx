import { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  ArrowLeft, Plus, Pencil, Trash2, X, Save, Download,
  FileSpreadsheet, Printer, ChevronLeft, ChevronRight, AlertCircle,
} from 'lucide-react';
import {
  caraterGeralDB, CaraterGeral, CaraterVeiculo, CaraterAlerta,
} from '../../data/caraterGeral';
import { ModulePermission } from '../../types/rbac';
import { usePersistentState } from '../../hooks/usePersistentState';

// ── helpers ───────────────────────────────────────────────────────────────────

function nextId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function emptyVeiculo(): CaraterVeiculo {
  return { id: nextId(), placa: '', marcaModelo: '', corMilhar: '', ano: '', art: '', dataInfracao: '', cpe90A: '', cpe90B: '' };
}

function emptyAlerta(): CaraterAlerta {
  return { id: nextId(), placa: '', descricao: '' };
}

function emptyCarater(data: string): Omit<CaraterGeral, 'id'> {
  return {
    data,
    cpe90NomeA: '', cpe90NomeB: '', cpe90NomeC: '',
    cpe20Nome: '', serNomeA: '', serNomeB: '',
    veiculos: [], cpe90C: [], cpe20A: [], cpe20B: [],
    serA: [], serB: [], alertas: [],
  };
}

// ── XLSX / print ──────────────────────────────────────────────────────────────

function exportXLSX(cg: CaraterGeral) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Veículos
  const wsV = XLSX.utils.aoa_to_sheet([
    [`CARÁTER GERAL — ${cg.data}`],
    [],
    ['PLACA', 'MARCA/MODELO', 'COR/MILHAR', 'ANO', 'ART', 'DATA', cg.cpe90NomeA, cg.cpe90NomeB],
    ...cg.veiculos.map(v => [v.placa, v.marcaModelo, v.corMilhar, v.ano, v.art, v.dataInfracao, v.cpe90A, v.cpe90B]),
    [],
    [cg.cpe90NomeC],
    ...cg.cpe90C.map(n => [n]),
  ]);
  wsV['!cols'] = [{ wch: 20 }, { wch: 26 }, { wch: 12 }, { wch: 7 }, { wch: 5 }, { wch: 7 }, { wch: 22 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(wb, wsV, 'Veículos');

  // Sheet 2: Efetivo
  const maxRows = Math.max(cg.cpe20A.length, cg.cpe20B.length, cg.serA.length, cg.serB.length, cg.cpe90C.length);
  const efRows: string[][] = [[cg.cpe90NomeC, '', cg.cpe20Nome, '', cg.serNomeA, cg.serNomeB]];
  for (let i = 0; i < maxRows; i++) {
    efRows.push([
      cg.cpe90C[i] ?? '', '',
      cg.cpe20A[i] ?? '', cg.cpe20B[i] ?? '',
      cg.serA[i] ?? '', cg.serB[i] ?? '',
    ]);
  }
  const wsE = XLSX.utils.aoa_to_sheet(efRows);
  wsE['!cols'] = [{ wch: 22 }, { wch: 2 }, { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(wb, wsE, 'Efetivo');

  // Sheet 3: Alertas
  const wsA = XLSX.utils.aoa_to_sheet([
    ['ALERTAS'],
    ['PLACA', 'DESCRIÇÃO'],
    ...cg.alertas.map(a => [a.placa, a.descricao]),
  ]);
  wsA['!cols'] = [{ wch: 16 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, wsA, 'Alertas');

  XLSX.writeFile(wb, `carater_geral_${cg.data.replace(/\//g, '-')}.xlsx`);
}

function exportPrint(cg: CaraterGeral) {
  const vRows = cg.veiculos.map(v => `
    <tr>
      <td>${v.placa}</td><td>${v.marcaModelo}</td><td>${v.corMilhar}</td>
      <td>${v.ano}</td><td>${v.art}</td><td>${v.dataInfracao}</td>
      <td>${v.cpe90A}</td><td>${v.cpe90B}</td>
    </tr>`).join('');

  const maxEf = Math.max(cg.cpe90C.length, cg.cpe20A.length, cg.cpe20B.length, cg.serA.length, cg.serB.length);
  let efRows = '';
  for (let i = 0; i < maxEf; i++) {
    efRows += `<tr>
      <td>${cg.cpe90C[i] ?? ''}</td>
      <td>${cg.cpe20A[i] ?? ''}</td><td>${cg.cpe20B[i] ?? ''}</td>
      <td>${cg.serA[i] ?? ''}</td><td>${cg.serB[i] ?? ''}</td>
    </tr>`;
  }

  const alRows = cg.alertas.map(a => `<tr><td>${a.placa}</td><td>${a.descricao}</td></tr>`).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <title>Caráter Geral ${cg.data}</title>
    <style>
      body{font-family:Arial;font-size:9px;margin:12px}
      h2{font-size:12px;margin:14px 0 5px}
      table{border-collapse:collapse;width:100%;margin-bottom:12px}
      th,td{border:1px solid #bbb;padding:2px 5px;white-space:nowrap}
      th{background:#2d2d2d;color:#fff;font-size:8px;text-transform:uppercase}
    </style></head><body>
    <h2>CARÁTER GERAL CPE — ${cg.data}</h2>
    <h2>VEÍCULOS EM ACOMPANHAMENTO</h2>
    <table>
      <thead><tr>
        <th>Placa</th><th>Marca/Modelo</th><th>Cor/Milhar</th><th>Ano</th><th>Art</th><th>Data</th>
        <th>${cg.cpe90NomeA}</th><th>${cg.cpe90NomeB}</th>
      </tr></thead>
      <tbody>${vRows}</tbody>
    </table>
    <h2>EFETIVO</h2>
    <table>
      <thead><tr>
        <th>${cg.cpe90NomeC}</th>
        <th colspan="2">${cg.cpe20Nome}</th>
        <th>${cg.serNomeA}</th><th>${cg.serNomeB}</th>
      </tr></thead>
      <tbody>${efRows}</tbody>
    </table>
    <h2>ALERTAS</h2>
    <table>
      <thead><tr><th>Placa</th><th>Descrição</th></tr></thead>
      <tbody>${alRows}</tbody>
    </table>
  </body></html>`;
  const w = window.open('', '_blank');
  if (w) { w.document.write(html); w.document.close(); w.print(); }
}

// ── types ─────────────────────────────────────────────────────────────────────

type View = 'list' | 'detail';

interface Props {
  onBack: () => void;
  permissions?: ModulePermission;
}

// ── component ─────────────────────────────────────────────────────────────────

export default function CaraterGeralModule({ onBack, permissions }: Props) {
  const canCreate = !permissions || permissions.create;
  const canEdit   = !permissions || permissions.edit;
  const canDelete = !permissions || permissions.delete;

  const [data, setData]           = usePersistentState<CaraterGeral[]>('cpe-site:carater-geral:v1', caraterGeralDB);
  const [view, setView]           = useState<View>('list');
  const [selected, setSelected]   = useState<CaraterGeral | null>(null);
  const [editMode, setEditMode]   = useState(false);
  const [draft, setDraft]         = useState<CaraterGeral | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newData, setNewData]     = useState('');
  const [newDataErr, setNewDataErr] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<CaraterGeral | null>(null);
  const [showExport, setShowExport] = useState(false);

  const sorted = useMemo(() =>
    [...data].sort((a, b) => {
      const parse = (s: string) => {
        const [d, m, y] = s.split('/');
        return new Date(+y, +m - 1, +d).getTime();
      };
      return parse(b.data) - parse(a.data);
    }),
  [data]);

  // ── navigation ────────────────────────────────────────────────────────────
  const openDetail = (cg: CaraterGeral) => { setSelected(cg); setEditMode(false); setDraft(null); setView('detail'); };
  const goBack = () => { setView('list'); setSelected(null); setEditMode(false); setDraft(null); };

  const navDay = (dir: -1 | 1) => {
    if (!selected) return;
    const idx = sorted.findIndex(c => c.id === selected.id);
    const next = sorted[idx + dir];
    if (next) openDetail(next);
  };

  // ── edit mode ──────────────────────────────────────────────────────────────
  const startEdit = () => {
    if (!selected) return;
    setDraft(JSON.parse(JSON.stringify(selected)));
    setEditMode(true);
  };
  const cancelEdit = () => { setDraft(null); setEditMode(false); };
  const saveEdit = () => {
    if (!draft) return;
    setData(d => d.map(c => c.id === draft.id ? draft : c));
    setSelected(draft);
    setEditMode(false);
    setDraft(null);
  };

  // ── draft field helpers ────────────────────────────────────────────────────
  const setDF = <K extends keyof CaraterGeral>(k: K, v: CaraterGeral[K]) =>
    setDraft(d => d ? { ...d, [k]: v } : d);

  // vehicles
  const setVeiculo = (i: number, f: keyof CaraterVeiculo, v: string) =>
    setDraft(d => {
      if (!d) return d;
      const veiculos = d.veiculos.map((r, idx) => idx === i ? { ...r, [f]: v } : r);
      return { ...d, veiculos };
    });
  const addVeiculo = () => setDraft(d => d ? { ...d, veiculos: [...d.veiculos, emptyVeiculo()] } : d);
  const removeVeiculo = (i: number) =>
    setDraft(d => d ? { ...d, veiculos: d.veiculos.filter((_, idx) => idx !== i) } : d);

  // personnel lists
  type PessoaField = 'cpe90C' | 'cpe20A' | 'cpe20B' | 'serA' | 'serB';
  const setPessoa = (field: PessoaField, i: number, v: string) =>
    setDraft(d => {
      if (!d) return d;
      const list = d[field].map((n, idx) => idx === i ? v : n);
      return { ...d, [field]: list };
    });
  const addPessoa = (field: PessoaField) =>
    setDraft(d => d ? { ...d, [field]: [...d[field], ''] } : d);
  const removePessoa = (field: PessoaField, i: number) =>
    setDraft(d => d ? { ...d, [field]: d[field].filter((_, idx) => idx !== i) } : d);

  // alertas
  const setAlerta = (i: number, f: keyof CaraterAlerta, v: string) =>
    setDraft(d => {
      if (!d) return d;
      const alertas = d.alertas.map((r, idx) => idx === i ? { ...r, [f]: v } : r);
      return { ...d, alertas };
    });
  const addAlerta = () => setDraft(d => d ? { ...d, alertas: [...d.alertas, emptyAlerta()] } : d);
  const removeAlerta = (i: number) =>
    setDraft(d => d ? { ...d, alertas: d.alertas.filter((_, idx) => idx !== i) } : d);

  // ── create ─────────────────────────────────────────────────────────────────
  const handleCreate = () => {
    if (!newData.trim()) { setNewDataErr('Data obrigatória'); return; }
    if (data.some(c => c.data === newData.trim())) { setNewDataErr('Já existe registro para esta data'); return; }
    const novo: CaraterGeral = { id: nextId(), ...emptyCarater(newData.trim()) };
    setData(d => [...d, novo]);
    setShowNewModal(false);
    setNewData('');
    openDetail(novo);
    setTimeout(() => startEdit(), 50);
  };

  // ── delete ─────────────────────────────────────────────────────────────────
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

  // ── render: list ───────────────────────────────────────────────────────────
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
            <button onClick={() => { setNewData(''); setNewDataErr(''); setShowNewModal(true); }}
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
                  <div>{(cg.cpe90C.length + cg.cpe20A.length + cg.cpe20B.length + cg.serA.length + cg.serB.length)} efetivo</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* new modal */}
        {showNewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl shadow-2xl border p-6"
              style={{ background: 'var(--adm-modal)', borderColor: 'var(--adm-border)' }}>
              <div className="flex items-center justify-between mb-5">
                <h4 className="font-bold text-xl" style={{ color: 'var(--adm-text)' }}>Nova Data</h4>
                <button onClick={() => setShowNewModal(false)} style={{ color: 'var(--adm-muted)' }}><X size={20} /></button>
              </div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Data (DD/MM/AAAA)</label>
              <input value={newData} onChange={e => { setNewData(e.target.value); setNewDataErr(''); }}
                placeholder="27/05/2026"
                className="adm-input w-full rounded-lg px-3 py-2.5 text-base border mb-1"
                style={{ ...fs, ...(newDataErr ? { borderColor: '#ef4444' } : {}) }} />
              {newDataErr && <p className="text-sm text-red-400 flex items-center gap-1 mb-3"><AlertCircle size={13} /> {newDataErr}</p>}
              <div className="flex gap-3 justify-end mt-4">
                <button onClick={() => setShowNewModal(false)}
                  className="px-5 py-2.5 text-base rounded-lg border transition-colors"
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

  // ── render: detail ─────────────────────────────────────────────────────────
  const cg  = editMode && draft ? draft : selected!;
  const idx = sorted.findIndex(c => c.id === cg.id);

  const UnitBox = ({
    nome, nomeField, pessoas, field,
  }: {
    nome: string;
    nomeField: keyof CaraterGeral;
    pessoas: string[];
    field: PessoaField;
  }) => (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--adm-border)' }}>
      <div className="px-3 py-2 border-b" style={{ background: 'var(--adm-tbl-head)', borderColor: 'var(--adm-border)' }}>
        {editMode
          ? <input value={nome} onChange={e => setDF(nomeField, e.target.value as CaraterGeral[typeof nomeField])}
              className={cls} style={{ ...fss, fontWeight: 600 }} />
          : <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--adm-accent)' }}>{nome || '—'}</span>}
      </div>
      <div className="p-2 space-y-1">
        {pessoas.map((p, i) => (
          <div key={i} className="flex items-center gap-1">
            {editMode
              ? <>
                  <input value={p} onChange={e => setPessoa(field, i, e.target.value)}
                    className={cls} style={fss} />
                  <button onClick={() => removePessoa(field, i)}
                    className="p-1 rounded hover:bg-cpe-red/10 text-cpe-red opacity-60 hover:opacity-100 transition-colors flex-shrink-0">
                    <X size={13} />
                  </button>
                </>
              : <span className="text-xs px-1" style={{ color: 'var(--adm-text)' }}>{p}</span>}
          </div>
        ))}
        {pessoas.length === 0 && !editMode && (
          <span className="text-xs" style={{ color: 'var(--adm-subtle)' }}>—</span>
        )}
        {editMode && (
          <button onClick={() => addPessoa(field)}
            className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded mt-1 transition-colors"
            style={{ color: 'var(--adm-muted)', background: 'var(--adm-input)', border: '1px dashed var(--adm-border)' }}>
            <Plus size={11} /> Adicionar
          </button>
        )}
      </div>
    </div>
  );

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
            {cg.data}
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

      {/* data field in edit mode */}
      {editMode && (
        <div className="mb-3 flex items-center gap-3">
          <label className="text-sm font-semibold" style={{ color: 'var(--adm-muted)' }}>Data:</label>
          <input value={draft!.data} onChange={e => setDF('data', e.target.value)}
            className="adm-input rounded-lg px-3 py-2 text-sm border w-40"
            style={fs} placeholder="DD/MM/AAAA" />
        </div>
      )}

      {/* ── unit name headers (edit) */}
      {editMode && (
        <div className="rounded-xl border p-3 mb-3 grid grid-cols-2 lg:grid-cols-3 gap-3"
          style={{ background: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
          {([
            ['CPE 90 A (col. veículos)', 'cpe90NomeA'],
            ['CPE 90 B (col. veículos)', 'cpe90NomeB'],
            ['CPE 90 C (efetivo)', 'cpe90NomeC'],
            ['CPE 20', 'cpe20Nome'],
            ['S.E.R. A', 'serNomeA'],
            ['S.E.R. B', 'serNomeB'],
          ] as [string, keyof CaraterGeral][]).map(([lbl, k]) => (
            <div key={k}>
              <label className="block text-xs font-bold mb-1" style={{ color: 'var(--adm-muted)' }}>{lbl}</label>
              <input value={cg[k] as string} onChange={e => setDF(k, e.target.value as CaraterGeral[typeof k])}
                className={cls} style={fss} />
            </div>
          ))}
        </div>
      )}

      {/* ── vehicles table ─────────────────────────────────────────────────── */}
      <div className="mb-3">
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
          <table className="w-full text-xs" style={{ minWidth: 860 }}>
            <thead className="sticky top-0 z-10" style={{ background: 'var(--adm-tbl-head)' }}>
              <tr className="font-semibold uppercase tracking-wide" style={{ color: 'var(--adm-muted)' }}>
                <th className="px-3 py-2.5 text-left">Placa</th>
                <th className="px-3 py-2.5 text-left">Marca/Modelo</th>
                <th className="px-3 py-2.5 text-left">Cor/Milhar</th>
                <th className="px-3 py-2.5 text-left w-16">Ano</th>
                <th className="px-3 py-2.5 text-left w-14">Art</th>
                <th className="px-3 py-2.5 text-left w-16">Data</th>
                <th className="px-3 py-2.5 text-left">{editMode ? 'CPE 90 A' : (cg.cpe90NomeA || 'CPE 90 A')}</th>
                <th className="px-3 py-2.5 text-left">{editMode ? 'CPE 90 B' : (cg.cpe90NomeB || 'CPE 90 B')}</th>
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
                      <td className="px-2 py-1.5"><input value={v.cpe90A} onChange={e => setVeiculo(i, 'cpe90A', e.target.value)} className={cls} style={fss} /></td>
                      <td className="px-2 py-1.5"><input value={v.cpe90B} onChange={e => setVeiculo(i, 'cpe90B', e.target.value)} className={cls} style={fss} /></td>
                      <td className="px-1 py-1.5 text-center">
                        <button onClick={() => removeVeiculo(i)}
                          className="p-1 rounded hover:bg-cpe-red/10 text-cpe-red opacity-60 hover:opacity-100 transition-colors">
                          <X size={13} />
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-3 py-2 font-semibold" style={{ color: 'var(--adm-text)', whiteSpace: 'nowrap' }}>{v.placa}</td>
                      <td className="px-3 py-2" style={{ color: 'var(--adm-text)' }}>{v.marcaModelo}</td>
                      <td className="px-3 py-2" style={{ color: 'var(--adm-muted)' }}>{v.corMilhar}</td>
                      <td className="px-3 py-2 tabular-nums" style={{ color: 'var(--adm-muted)' }}>{v.ano}</td>
                      <td className="px-3 py-2" style={{ color: 'var(--adm-muted)' }}>{v.art}</td>
                      <td className="px-3 py-2 tabular-nums" style={{ color: 'var(--adm-muted)' }}>{v.dataInfracao}</td>
                      <td className="px-3 py-2 font-medium" style={{ color: v.cpe90A ? 'var(--adm-text)' : 'var(--adm-subtle)' }}>{v.cpe90A || '—'}</td>
                      <td className="px-3 py-2 font-medium" style={{ color: v.cpe90B ? 'var(--adm-text)' : 'var(--adm-subtle)' }}>{v.cpe90B || '—'}</td>
                    </>
                  )}
                </tr>
              ))}
              {cg.veiculos.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-10 text-center" style={{ color: 'var(--adm-subtle)' }}>Nenhum veículo.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── efetivo ────────────────────────────────────────────────────────── */}
      <div className="mb-3">
        <h4 className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--adm-muted)' }}>
          Efetivo
        </h4>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <UnitBox nome={cg.cpe90NomeC} nomeField="cpe90NomeC" pessoas={cg.cpe90C} field="cpe90C" />
          <UnitBox nome={cg.cpe20Nome + ' (A)'} nomeField="cpe20Nome" pessoas={cg.cpe20A} field="cpe20A" />
          <UnitBox nome={cg.cpe20Nome + ' (B)'} nomeField="cpe20Nome" pessoas={cg.cpe20B} field="cpe20B" />
          <UnitBox nome={cg.serNomeA} nomeField="serNomeA" pessoas={cg.serA} field="serA" />
          <UnitBox nome={cg.serNomeB} nomeField="serNomeB" pessoas={cg.serB} field="serB" />
        </div>
      </div>

      {/* ── alertas ────────────────────────────────────────────────────────── */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--adm-muted)' }}>
            Alertas
          </h4>
          {editMode && (
            <button onClick={addAlerta}
              className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg bg-cpe-red text-white hover:bg-cpe-red/80 transition-colors">
              <Plus size={12} /> Adicionar
            </button>
          )}
        </div>
        <div className="overflow-auto rounded-xl border" style={{ borderColor: 'var(--adm-border)' }}>
          <table className="w-full text-xs" style={{ minWidth: 500 }}>
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
                      <td className="px-3 py-2 font-semibold" style={{ color: 'var(--adm-accent)', whiteSpace: 'nowrap' }}>{a.placa}</td>
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

      {/* ── delete confirm ─────────────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl shadow-2xl border p-6"
            style={{ background: 'var(--adm-modal)', borderColor: 'var(--adm-border)' }}>
            <h4 className="font-bold text-xl mb-2" style={{ color: 'var(--adm-text)' }}>Confirmar exclusão</h4>
            <p className="text-base mb-6" style={{ color: 'var(--adm-muted)' }}>
              Excluir o Caráter Geral de{' '}
              <span className="font-semibold" style={{ color: 'var(--adm-text)' }}>{deleteTarget.data}</span>?
              Esta ação não pode ser desfeita.
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
