import { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  ArrowLeft, Plus, Pencil, Trash2, X, Save, Download,
  FileSpreadsheet, Printer, ChevronLeft, ChevronRight, AlertCircle, Phone, Search, MoveRight,
} from 'lucide-react';
import {
  caraterGeralDB, CaraterGeral, CaraterVeiculo, CaraterAlerta, CaraterUnidade,
} from '../../data/caraterGeral';
import {
  caraterVeiculosHistoricoDB, caraterAlertasHistoricoDB,
  CaraterVeiculoHistorico, CaraterAlertaHistorico,
} from '../../data/caraterGeralHistorico';
import {
  caraterRecuperadosDB,
  CaraterRecuperado,
} from '../../data/caraterGeralRecuperados';
import { ModulePermission } from '../../types/rbac';
import { usePersistentState } from '../../hooks/usePersistentState';

type SubModule = 'diario' | 'historico' | 'recuperados' | 'alertas';

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

function formatPlaca(raw: string): string {
  const v = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (v.length > 4) return v.slice(0, 4) + '-' + v.slice(4, 7);
  return v;
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
  const blankRow = `<tr><td class="placa">&nbsp;</td><td>&nbsp;</td></tr>`;
  const alRows = cg.alertas.map(a => `<tr><td class="placa">${a.placa}</td><td>${a.descricao}</td></tr>`).join('') + blankRow + blankRow;

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

  const body = `
    <h1>CARÁTER GERAL CPE — ${cg.data}</h1>
    <table>
      <thead><tr><th>Placa</th><th>Marca/Modelo</th><th>Cor/Milhar</th><th>Ano</th><th>Art</th><th>Data</th></tr></thead>
      <tbody>${vRows}</tbody>
    </table>
    <h2>ALERTAS</h2>
    <table style="width:100%">
      <thead><tr><th>Placa</th><th>Descrição</th></tr></thead>
      <tbody>${alRows}</tbody>
    </table>
    <h2>EFETIVO</h2>
    <table style="font-size:9px"><tbody>${efHtml}</tbody></table>`;

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <title>Caráter Geral ${cg.data}</title>
    <style>
      body{font-family:Arial;font-size:12px;margin:0;padding:0}
      h1{font-size:17px;text-align:center;margin:0 0 12px}
      h2{font-size:14px;margin:14px 0 5px}
      table{border-collapse:collapse;width:100%;margin-bottom:12px}
      th,td{border:1px solid #bbb;padding:3px 6px;white-space:nowrap}
      th{background:#2d2d2d;color:#fff;font-size:11px;text-transform:uppercase;-webkit-print-color-adjust:exact;print-color-adjust:exact}
      .placa{font-weight:700;font-size:14px}
    </style></head><body>
    <div style="padding:12px">${body}</div>
  </body></html>`;
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html; charset=utf-8' }));

  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;border:none;z-index:99999;background:#fff';
  document.body.appendChild(iframe);

  const cleanup = () => {
    if (document.body.contains(iframe)) {
      document.body.removeChild(iframe);
      URL.revokeObjectURL(url);
    }
  };

  iframe.addEventListener('load', () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch { /* iOS Safari não suporta print em iframe */ }
    window.addEventListener('focus', cleanup, { once: true });
    setTimeout(cleanup, 60_000);
  });

  iframe.src = url;
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

  const [subModule, setSubModule] = useState<SubModule>('diario');

  // diário
  const [data, setData]           = usePersistentState<CaraterGeral[]>('cpe-site:carater-geral:v2', caraterGeralDB);
  const [view, setView]           = useState<View>('list');
  const [selected, setSelected]   = useState<CaraterGeral | null>(null);
  const [editMode, setEditMode]   = useState(false);
  const [draft, setDraft]         = useState<CaraterGeral | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CaraterGeral | null>(null);
  const [showExport, setShowExport] = useState(false);

  // histórico de veículos
  const [veicHist, setVeicHist] = usePersistentState<CaraterVeiculoHistorico[]>(
    'cpe-site:carater-historico-veiculos:v1', caraterVeiculosHistoricoDB,
  );
  const [veicSearch, setVeicSearch] = useState('');
  const [veicSort, setVeicSort]     = useState<'asc' | 'desc'>('asc');
  const [veicPage, setVeicPage]     = useState(1);
  const [veicModal, setVeicModal] = useState<CaraterVeiculoHistorico | null | 'new'>(null);
  const [veicForm, setVeicForm]   = useState<Omit<CaraterVeiculoHistorico, 'id'>>({ placa: '', marcaModelo: '', corMilhar: '', ano: '', art: '', dataInfracao: '' });
  const [veicDel, setVeicDel]     = useState<CaraterVeiculoHistorico | null>(null);
  const [veiculosSort, setVeiculosSort] = useState<'asc' | 'desc'>('asc');

  // alertas históricos
  const [alertHist, setAlertHist] = usePersistentState<CaraterAlertaHistorico[]>(
    'cpe-site:carater-alertas-historico:v1', caraterAlertasHistoricoDB,
  );
  const [alertSearch, setAlertSearch] = useState('');
  const [alertSort, setAlertSort]     = useState<'asc' | 'desc'>('asc');
  const [alertPage, setAlertPage]     = useState(1);
  const [alertModal, setAlertModal]   = useState<CaraterAlertaHistorico | null | 'new'>(null);
  const [alertForm, setAlertForm]     = useState<Omit<CaraterAlertaHistorico, 'id'>>({ placa: '', descricao: '' });
  const [alertDel, setAlertDel]       = useState<CaraterAlertaHistorico | null>(null);

  const [recuperados, setRecuperados] = usePersistentState<CaraterRecuperado[]>(
    'cpe-site:carater-recuperados:v1', caraterRecuperadosDB,
  );
  const [recuperadoSearch, setRecuperadoSearch] = useState('');
  const [recuperadoSort, setRecuperadoSort] = useState<'asc' | 'desc'>('asc');
  const [recuperadoPage, setRecuperadoPage] = useState(1);
  const [recuperadoModal, setRecuperadoModal] = useState<CaraterRecuperado | null | 'new'>(null);
  const [recuperadoForm, setRecuperadoForm] = useState<Omit<CaraterRecuperado, 'id'>>({
    placa: '', marcaModelo: '', corMilhar: '', ano: '', art: '', dataInfracao: '', raiRecuperacao: '', dataRecuperacao: '',
  });
  const [recuperadoDel, setRecuperadoDel] = useState<CaraterRecuperado | null>(null);

  // migration — veículos
  const [migVeic, setMigVeic] = useState<CaraterVeiculo | CaraterVeiculoHistorico | null>(null);
  const [migDest, setMigDest] = useState<'historico' | 'recuperados'>('historico');
  const [migRai, setMigRai] = useState('');
  const [migDataRec, setMigDataRec] = useState('');

  // migration — alertas
  const [migAlerta, setMigAlerta] = useState<CaraterAlerta | null>(null);

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

  // ── shared tab bar ─────────────────────────────────────────────────────────
  const tabBar = (
    <div className="flex gap-1 mb-6 border-b" style={{ borderColor: 'var(--adm-border)' }}>
      {(['diario', 'historico', 'alertas', 'recuperados'] as SubModule[]).map(tab => {
        const labels: Record<SubModule, string> = {
          diario: 'Caráter',
          historico: 'Histórico Veículos',
          recuperados: 'Recuperados',
          alertas: 'Alertas Antigos',
        };
        const active = subModule === tab;
        return (
          <button key={tab} onClick={() => setSubModule(tab)}
            className="px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors"
            style={{
              borderColor: active ? 'var(--adm-accent)' : 'transparent',
              color: active ? 'var(--adm-accent)' : 'var(--adm-muted)',
            }}>
            {labels[tab]}
          </button>
        );
      })}
    </div>
  );

  // ── filtered lists (hooks must be before any early return) ──────────────────
  const veicFiltered = useMemo(() => {
    const q = veicSearch.trim().toLowerCase();
    const list = q
      ? veicHist.filter(v =>
          v.placa.toLowerCase().includes(q) ||
          v.marcaModelo.toLowerCase().includes(q) ||
          v.corMilhar.toLowerCase().includes(q)
        )
      : [...veicHist];
    return list.sort((a, b) =>
      veicSort === 'asc'
        ? a.placa.localeCompare(b.placa, 'pt-BR')
        : b.placa.localeCompare(a.placa, 'pt-BR')
    );
  }, [veicHist, veicSearch, veicSort]);

  const alertFiltered = useMemo(() => {
    const q = alertSearch.trim().toLowerCase();
    const list = q
      ? alertHist.filter(a =>
          a.placa.toLowerCase().includes(q) ||
          a.descricao.toLowerCase().includes(q)
        )
      : [...alertHist];
    return list.sort((a, b) =>
      alertSort === 'asc'
        ? a.placa.localeCompare(b.placa, 'pt-BR')
        : b.placa.localeCompare(a.placa, 'pt-BR')
    );
  }, [alertHist, alertSearch, alertSort]);

  const recuperadoFiltered = useMemo(() => {
    const q = recuperadoSearch.trim().toLowerCase();
    const list = q
      ? recuperados.filter(r =>
          r.placa.toLowerCase().includes(q) ||
          r.marcaModelo.toLowerCase().includes(q) ||
          r.corMilhar.toLowerCase().includes(q) ||
          r.raiRecuperacao.toLowerCase().includes(q) ||
          r.dataRecuperacao.toLowerCase().includes(q)
        )
      : [...recuperados];
    return list.sort((a, b) =>
      recuperadoSort === 'asc'
        ? a.placa.localeCompare(b.placa, 'pt-BR')
        : b.placa.localeCompare(a.placa, 'pt-BR')
    );
  }, [recuperados, recuperadoSearch, recuperadoSort]);

  // ── migration helpers ──────────────────────────────────────────────────────
  const openMigrate = (v: CaraterVeiculo | CaraterVeiculoHistorico, dest: 'historico' | 'recuperados') => {
    setMigVeic(v);
    setMigDest(dest);
    setMigRai('');
    setMigDataRec('');
  };

  const confirmMigrate = () => {
    if (!migVeic) return;
    const base = {
      placa: migVeic.placa,
      marcaModelo: migVeic.marcaModelo,
      corMilhar: migVeic.corMilhar,
      ano: migVeic.ano,
      art: migVeic.art,
      dataInfracao: migVeic.dataInfracao,
    };
    if (migDest === 'historico') {
      setVeicHist(d => [...d, { id: nextId(), ...base }]);
    } else {
      setRecuperados(d => [...d, { id: nextId(), ...base, raiRecuperacao: migRai, dataRecuperacao: migDataRec }]);
    }
    setMigVeic(null);
  };

  const migrateModal = migVeic !== null && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl shadow-2xl border p-6"
        style={{ background: 'var(--adm-modal)', borderColor: 'var(--adm-border)' }}>
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold text-xl" style={{ color: 'var(--adm-text)' }}>Migrar Veículo</h4>
          <button onClick={() => setMigVeic(null)} style={{ color: 'var(--adm-muted)' }}><X size={20} /></button>
        </div>
        <div className="mb-4 p-3 rounded-xl border" style={{ background: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
          <div className="font-bold text-base" style={{ color: 'var(--adm-accent)' }}>{migVeic.placa}</div>
          <div className="text-sm mt-0.5" style={{ color: 'var(--adm-text)' }}>{migVeic.marcaModelo}</div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--adm-muted)' }}>{migVeic.corMilhar} · {migVeic.ano} · Art. {migVeic.art}</div>
        </div>

        <p className="text-sm mb-3" style={{ color: 'var(--adm-muted)' }}>
          Destino:{' '}
          <span className="font-semibold" style={{ color: 'var(--adm-text)' }}>
            {migDest === 'historico' ? 'Histórico de Veículos' : 'Recuperados'}
          </span>
        </p>

        {migDest === 'historico' && veicHist.some(h => h.placa === migVeic.placa) && (
          <div className="flex items-center gap-2 p-3 rounded-lg text-xs mb-3"
            style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)', color: '#ca8a04' }}>
            <AlertCircle size={13} />
            Esta placa já existe no Histórico. Será adicionada como nova entrada.
          </div>
        )}

        {migDest === 'recuperados' && (
          <div className="space-y-3 mb-3">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--adm-muted)' }}>RAI Recuperação</label>
              <input value={migRai} onChange={e => setMigRai(e.target.value)}
                className="adm-input w-full rounded-lg px-3 py-2 text-sm border"
                style={{ background: 'var(--adm-input)', color: 'var(--adm-text)', borderColor: 'var(--adm-border)' }}
                placeholder="Ex: 47320517" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--adm-muted)' }}>Data Recuperação</label>
              <input value={migDataRec} onChange={e => setMigDataRec(e.target.value)}
                className="adm-input w-full rounded-lg px-3 py-2 text-sm border"
                style={{ background: 'var(--adm-input)', color: 'var(--adm-text)', borderColor: 'var(--adm-border)' }}
                placeholder="Ex: 01/06/2026" />
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-end mt-4">
          <button onClick={() => setMigVeic(null)}
            className="px-4 py-2 text-sm rounded-lg border"
            style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)', background: 'transparent' }}>Cancelar</button>
          <button onClick={confirmMigrate}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-cpe-red hover:bg-cpe-red/80 rounded-lg transition-colors">
            <MoveRight size={14} /> Confirmar Migração
          </button>
        </div>
      </div>
    </div>
  );

  const confirmMigrateAlerta = () => {
    if (!migAlerta) return;
    setAlertHist(d => [...d, { id: nextId(), placa: migAlerta.placa, descricao: migAlerta.descricao }]);
    setMigAlerta(null);
  };

  const migrateAlertaModal = migAlerta !== null && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl shadow-2xl border p-6"
        style={{ background: 'var(--adm-modal)', borderColor: 'var(--adm-border)' }}>
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold text-xl" style={{ color: 'var(--adm-text)' }}>Migrar Alerta</h4>
          <button onClick={() => setMigAlerta(null)} style={{ color: 'var(--adm-muted)' }}><X size={20} /></button>
        </div>
        <div className="mb-4 p-3 rounded-xl border" style={{ background: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
          <div className="font-bold text-base" style={{ color: 'var(--adm-accent)' }}>{migAlerta.placa}</div>
          <div className="text-sm mt-0.5" style={{ color: 'var(--adm-text)' }}>{migAlerta.descricao}</div>
        </div>
        <p className="text-sm mb-4" style={{ color: 'var(--adm-muted)' }}>
          Mover para: <span className="font-semibold" style={{ color: 'var(--adm-text)' }}>Alertas Antigos</span>
        </p>
        {alertHist.some(h => h.placa === migAlerta.placa) && (
          <div className="flex items-center gap-2 p-3 rounded-lg text-xs mb-4"
            style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)', color: '#ca8a04' }}>
            <AlertCircle size={13} />
            Esta placa já existe nos Alertas Antigos. Será adicionada como nova entrada.
          </div>
        )}
        <div className="flex gap-3 justify-end">
          <button onClick={() => setMigAlerta(null)}
            className="px-4 py-2 text-sm rounded-lg border"
            style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)', background: 'transparent' }}>Cancelar</button>
          <button onClick={confirmMigrateAlerta}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-cpe-red hover:bg-cpe-red/80 rounded-lg transition-colors">
            <MoveRight size={14} /> Confirmar Migração
          </button>
        </div>
      </div>
    </div>
  );

  // ── histórico de veículos view ─────────────────────────────────────────────
  if (subModule === 'historico' && view === 'list') {
    const saveVeic = () => {
      if (veicModal === 'new') {
        setVeicHist(d => [...d, { id: nextId(), ...veicForm }]);
      } else if (veicModal) {
        setVeicHist(d => d.map(v => v.id === veicModal.id ? { ...veicModal, ...veicForm } : v));
      }
      setVeicModal(null);
    };
    return (
      <div className="flex flex-col h-full">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <button onClick={onBack} className="flex items-center gap-1.5 transition-colors text-base font-medium"
            style={{ color: 'var(--adm-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--adm-text)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--adm-muted)')}>
            <ArrowLeft size={17} /> Módulos
          </button>
          <span style={{ color: 'var(--adm-border)' }} className="hidden sm:block">|</span>
          <h3 className="font-bold text-2xl flex-1" style={{ color: 'var(--adm-text)' }}>Caráter Geral</h3>
        </div>
        {tabBar}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-2 flex-1 min-w-[200px] rounded-lg border px-3 py-2"
            style={{ background: 'var(--adm-input)', borderColor: 'var(--adm-border)' }}>
            <Search size={15} style={{ color: 'var(--adm-muted)' }} />
            <input value={veicSearch} onChange={e => { setVeicSearch(e.target.value); setVeicPage(1); }}
              placeholder="Buscar placa, modelo, cor…"
              className="bg-transparent text-sm outline-none w-full"
              style={{ color: 'var(--adm-text)' }} />
          </div>
          {canCreate && (
            <button onClick={() => { setVeicForm({ placa: '', marcaModelo: '', corMilhar: '', ano: '', art: '', dataInfracao: '' }); setVeicModal('new'); }}
              className="flex items-center gap-2 bg-cpe-red hover:bg-cpe-red/80 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
              <Plus size={15} /> Novo
            </button>
          )}
        </div>
        <div className="overflow-auto rounded-xl border" style={{ borderColor: 'var(--adm-border)' }}>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ background: 'var(--adm-tbl-head)', color: 'var(--adm-text)' }}>
                <th
                  className="px-3 py-2 text-left font-semibold text-xs uppercase whitespace-nowrap cursor-pointer select-none"
                  onClick={() => { setVeicSort(s => s === 'asc' ? 'desc' : 'asc'); setVeicPage(1); }}
                >
                  Placa {veicSort === 'asc' ? '▲' : '▼'}
                </th>
                {['Marca/Modelo','Cor/Milhar','Ano','Art','Data',''].map(h => (
                  <th key={h} className="px-3 py-2 text-left font-semibold text-xs uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {veicFiltered.slice((veicPage - 1) * 50, veicPage * 50).map((v, i) => (
                <tr key={v.id} className="adm-row border-t" style={{ background: i % 2 === 0 ? 'var(--adm-surface)' : 'var(--adm-row-even)', borderColor: 'var(--adm-border)' }}>
                  <td className="px-3 py-1.5 font-bold whitespace-nowrap" style={{ color: 'var(--adm-text)' }}>{v.placa}</td>
                  <td className="px-3 py-1.5 whitespace-nowrap" style={{ color: 'var(--adm-text)' }}>{v.marcaModelo}</td>
                  <td className="px-3 py-1.5 whitespace-nowrap" style={{ color: 'var(--adm-muted)' }}>{v.corMilhar}</td>
                  <td className="px-3 py-1.5 whitespace-nowrap" style={{ color: 'var(--adm-muted)' }}>{v.ano}</td>
                  <td className="px-3 py-1.5 whitespace-nowrap" style={{ color: 'var(--adm-muted)' }}>{v.art}</td>
                  <td className="px-3 py-1.5 whitespace-nowrap" style={{ color: 'var(--adm-muted)' }}>{v.dataInfracao}</td>
                  <td className="px-3 py-1.5 whitespace-nowrap">
                    <div className="flex gap-2 items-center">
                      {canEdit && (
                        <button onClick={() => { setVeicForm({ placa: v.placa, marcaModelo: v.marcaModelo, corMilhar: v.corMilhar, ano: v.ano, art: v.art, dataInfracao: v.dataInfracao }); setVeicModal(v); }}
                          style={{ color: 'var(--adm-muted)' }}><Pencil size={14} /></button>
                      )}
                      {canDelete && (
                        <button onClick={() => setVeicDel(v)} style={{ color: '#ef4444' }}><Trash2 size={14} /></button>
                      )}
                      {canCreate && (
                        <button onClick={() => openMigrate(v, 'recuperados')}
                          title="Migrar para Recuperados"
                          className="flex items-center gap-1 px-2 py-0.5 text-xs rounded border transition-colors"
                          style={{ color: '#22c55e', borderColor: 'rgba(34,197,94,0.3)' }}>
                          <MoveRight size={11} /> Rec.
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {veicFiltered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-sm" style={{ color: 'var(--adm-muted)' }}>Nenhum veículo encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {/* paginação veículos */}
        {(() => {
          const total = veicFiltered.length;
          const pages = Math.ceil(total / 50);
          const start = (veicPage - 1) * 50 + 1;
          const end   = Math.min(veicPage * 50, total);
          return (
            <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
              <p className="text-xs" style={{ color: 'var(--adm-muted)' }}>
                {total === 0 ? '0 registros' : `${start}–${end} de ${total}`}
              </p>
              {pages > 1 && (
                <div className="flex items-center gap-1">
                  <button disabled={veicPage === 1} onClick={() => setVeicPage(1)}
                    className="px-2 py-1 text-xs rounded border disabled:opacity-30"
                    style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)', background: 'transparent' }}>«</button>
                  <button disabled={veicPage === 1} onClick={() => setVeicPage(p => p - 1)}
                    className="px-2 py-1 text-xs rounded border disabled:opacity-30"
                    style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)', background: 'transparent' }}>‹</button>
                  <span className="px-2 text-xs" style={{ color: 'var(--adm-text)' }}>{veicPage} / {pages}</span>
                  <button disabled={veicPage === pages} onClick={() => setVeicPage(p => p + 1)}
                    className="px-2 py-1 text-xs rounded border disabled:opacity-30"
                    style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)', background: 'transparent' }}>›</button>
                  <button disabled={veicPage === pages} onClick={() => setVeicPage(pages)}
                    className="px-2 py-1 text-xs rounded border disabled:opacity-30"
                    style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)', background: 'transparent' }}>»</button>
                </div>
              )}
            </div>
          );
        })()}

        {/* modal add/edit */}
        {veicModal !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-2xl shadow-2xl border p-6"
              style={{ background: 'var(--adm-modal)', borderColor: 'var(--adm-border)' }}>
              <div className="flex items-center justify-between mb-5">
                <h4 className="font-bold text-xl" style={{ color: 'var(--adm-text)' }}>
                  {veicModal === 'new' ? 'Novo Veículo' : 'Editar Veículo'}
                </h4>
                <button onClick={() => setVeicModal(null)} style={{ color: 'var(--adm-muted)' }}><X size={20} /></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {(['placa','marcaModelo','corMilhar','ano','art','dataInfracao'] as const).map(f => (
                  <div key={f} className={f === 'marcaModelo' ? 'col-span-2' : ''}>
                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--adm-muted)' }}>
                      {f === 'placa' ? 'Placa' : f === 'marcaModelo' ? 'Marca/Modelo' : f === 'corMilhar' ? 'Cor/Milhar' : f === 'ano' ? 'Ano' : f === 'art' ? 'Art' : 'Data Infração'}
                    </label>
                    <input value={veicForm[f]} onChange={e => setVeicForm(p => ({ ...p, [f]: f === 'placa' ? formatPlaca(e.target.value) : e.target.value }))}
                      className="adm-input w-full rounded-lg px-3 py-2 text-sm border"
                      style={{ background: 'var(--adm-input)', color: 'var(--adm-text)', borderColor: 'var(--adm-border)' }} />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 justify-end mt-5">
                <button onClick={() => setVeicModal(null)}
                  className="px-4 py-2 text-sm rounded-lg border"
                  style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)', background: 'transparent' }}>Cancelar</button>
                <button onClick={saveVeic}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-cpe-red hover:bg-cpe-red/80 rounded-lg transition-colors">
                  <Save size={14} /> Salvar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* delete confirm */}
        {veicDel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl shadow-2xl border p-6"
              style={{ background: 'var(--adm-modal)', borderColor: 'var(--adm-border)' }}>
              <h4 className="font-bold text-xl mb-2" style={{ color: 'var(--adm-text)' }}>Confirmar exclusão</h4>
              <p className="text-sm mb-5" style={{ color: 'var(--adm-muted)' }}>
                Excluir <span className="font-bold" style={{ color: 'var(--adm-text)' }}>{veicDel.placa}</span>?
              </p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setVeicDel(null)}
                  className="px-4 py-2 text-sm rounded-lg border"
                  style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)', background: 'transparent' }}>Cancelar</button>
                <button onClick={() => { setVeicHist(d => d.filter(v => v.id !== veicDel!.id)); setVeicDel(null); }}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-cpe-red hover:bg-cpe-red/80 rounded-lg transition-colors">
                  <Trash2 size={14} /> Excluir
                </button>
              </div>
            </div>
          </div>
        )}
        {migrateModal}
      </div>
    );
  }

  // ── recuperados view ───────────────────────────────────────────────────────
  if (subModule === 'recuperados' && view === 'list') {
    const saveRecuperado = () => {
      if (recuperadoModal === 'new') {
        setRecuperados(d => [...d, { id: nextId(), ...recuperadoForm }]);
      } else if (recuperadoModal) {
        setRecuperados(d => d.map(r => r.id === recuperadoModal.id ? { ...recuperadoModal, ...recuperadoForm } : r));
      }
      setRecuperadoModal(null);
    };

    return (
      <div className="flex flex-col h-full">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <button onClick={onBack} className="flex items-center gap-1.5 transition-colors text-base font-medium"
            style={{ color: 'var(--adm-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--adm-text)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--adm-muted)')}>
            <ArrowLeft size={17} /> Módulos
          </button>
          <span style={{ color: 'var(--adm-border)' }} className="hidden sm:block">|</span>
          <h3 className="font-bold text-2xl flex-1" style={{ color: 'var(--adm-text)' }}>Caráter Geral</h3>
        </div>
        {tabBar}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-2 flex-1 min-w-[200px] rounded-lg border px-3 py-2"
            style={{ background: 'var(--adm-input)', borderColor: 'var(--adm-border)' }}>
            <Search size={15} style={{ color: 'var(--adm-muted)' }} />
            <input value={recuperadoSearch} onChange={e => { setRecuperadoSearch(e.target.value); setRecuperadoPage(1); }}
              placeholder="Buscar placa, modelo, cor, RAI ou data…"
              className="bg-transparent text-sm outline-none w-full"
              style={{ color: 'var(--adm-text)' }} />
          </div>
          {canCreate && (
            <button onClick={() => {
              setRecuperadoForm({ placa: '', marcaModelo: '', corMilhar: '', ano: '', art: '', dataInfracao: '', raiRecuperacao: '', dataRecuperacao: '' });
              setRecuperadoModal('new');
            }}
              className="flex items-center gap-2 bg-cpe-red hover:bg-cpe-red/80 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
              <Plus size={15} /> Novo
            </button>
          )}
        </div>
        <div className="overflow-auto rounded-xl border" style={{ borderColor: 'var(--adm-border)' }}>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ background: 'var(--adm-tbl-head)', color: 'var(--adm-text)' }}>
                <th
                  className="px-3 py-2 text-left font-semibold text-xs uppercase whitespace-nowrap cursor-pointer select-none"
                  onClick={() => { setRecuperadoSort(s => s === 'asc' ? 'desc' : 'asc'); setRecuperadoPage(1); }}
                >
                  Placa {recuperadoSort === 'asc' ? '▲' : '▼'}
                </th>
                {['Marca/Modelo','Cor/Milhar','Ano','Art','Data','RAI Recuperação','Data Recup',''].map(h => (
                  <th key={h} className="px-3 py-2 text-left font-semibold text-xs uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recuperadoFiltered.slice((recuperadoPage - 1) * 50, recuperadoPage * 50).map((r, i) => (
                <tr key={r.id} className="adm-row border-t" style={{ background: i % 2 === 0 ? 'var(--adm-surface)' : 'var(--adm-row-even)', borderColor: 'var(--adm-border)' }}>
                  <td className="px-3 py-1.5 font-bold whitespace-nowrap" style={{ color: 'var(--adm-text)' }}>{r.placa}</td>
                  <td className="px-3 py-1.5 whitespace-nowrap" style={{ color: 'var(--adm-text)' }}>{r.marcaModelo}</td>
                  <td className="px-3 py-1.5 whitespace-nowrap" style={{ color: 'var(--adm-muted)' }}>{r.corMilhar}</td>
                  <td className="px-3 py-1.5 whitespace-nowrap" style={{ color: 'var(--adm-muted)' }}>{r.ano}</td>
                  <td className="px-3 py-1.5 whitespace-nowrap" style={{ color: 'var(--adm-muted)' }}>{r.art}</td>
                  <td className="px-3 py-1.5 whitespace-nowrap" style={{ color: 'var(--adm-muted)' }}>{r.dataInfracao}</td>
                  <td className="px-3 py-1.5 whitespace-nowrap" style={{ color: 'var(--adm-muted)' }}>{r.raiRecuperacao}</td>
                  <td className="px-3 py-1.5 whitespace-nowrap" style={{ color: 'var(--adm-muted)' }}>{r.dataRecuperacao}</td>
                  <td className="px-3 py-1.5 whitespace-nowrap">
                    <div className="flex gap-2">
                      {canEdit && (
                        <button onClick={() => { setRecuperadoForm({ placa: r.placa, marcaModelo: r.marcaModelo, corMilhar: r.corMilhar, ano: r.ano, art: r.art, dataInfracao: r.dataInfracao, raiRecuperacao: r.raiRecuperacao, dataRecuperacao: r.dataRecuperacao }); setRecuperadoModal(r); }}
                          style={{ color: 'var(--adm-muted)' }}><Pencil size={14} /></button>
                      )}
                      {canDelete && (
                        <button onClick={() => setRecuperadoDel(r)} style={{ color: '#ef4444' }}><Trash2 size={14} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {recuperadoFiltered.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-sm" style={{ color: 'var(--adm-muted)' }}>Nenhum registro encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {(() => {
          const total = recuperadoFiltered.length;
          const pages = Math.ceil(total / 50);
          const start = (recuperadoPage - 1) * 50 + 1;
          const end = Math.min(recuperadoPage * 50, total);
          return (
            <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
              <p className="text-xs" style={{ color: 'var(--adm-muted)' }}>
                {total === 0 ? '0 registros' : `${start}–${end} de ${total}`}
              </p>
              {pages > 1 && (
                <div className="flex items-center gap-1">
                  <button disabled={recuperadoPage === 1} onClick={() => setRecuperadoPage(1)}
                    className="px-2 py-1 text-xs rounded border disabled:opacity-30"
                    style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)', background: 'transparent' }}>«</button>
                  <button disabled={recuperadoPage === 1} onClick={() => setRecuperadoPage(p => p - 1)}
                    className="px-2 py-1 text-xs rounded border disabled:opacity-30"
                    style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)', background: 'transparent' }}>‹</button>
                  <span className="px-2 text-xs" style={{ color: 'var(--adm-text)' }}>{recuperadoPage} / {pages}</span>
                  <button disabled={recuperadoPage === pages} onClick={() => setRecuperadoPage(p => p + 1)}
                    className="px-2 py-1 text-xs rounded border disabled:opacity-30"
                    style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)', background: 'transparent' }}>›</button>
                  <button disabled={recuperadoPage === pages} onClick={() => setRecuperadoPage(pages)}
                    className="px-2 py-1 text-xs rounded border disabled:opacity-30"
                    style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)', background: 'transparent' }}>»</button>
                </div>
              )}
            </div>
          );
        })()}

        {recuperadoModal !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl rounded-2xl shadow-2xl border p-6"
              style={{ background: 'var(--adm-modal)', borderColor: 'var(--adm-border)' }}>
              <div className="flex items-center justify-between mb-5">
                <h4 className="font-bold text-xl" style={{ color: 'var(--adm-text)' }}>
                  {recuperadoModal === 'new' ? 'Novo Registro Recuperado' : 'Editar Registro Recuperado'}
                </h4>
                <button onClick={() => setRecuperadoModal(null)} style={{ color: 'var(--adm-muted)' }}><X size={20} /></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {(['placa','marcaModelo','corMilhar','ano','art','dataInfracao','raiRecuperacao','dataRecuperacao'] as const).map(f => (
                  <div key={f} className={f === 'marcaModelo' || f === 'raiRecuperacao' ? 'col-span-2' : ''}>
                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--adm-muted)' }}>
                      {f === 'placa' ? 'Placa' : f === 'marcaModelo' ? 'Marca/Modelo' : f === 'corMilhar' ? 'Cor/Milhar' : f === 'ano' ? 'Ano' : f === 'art' ? 'Art' : f === 'dataInfracao' ? 'Data' : f === 'raiRecuperacao' ? 'RAI Recuperação' : 'Data Recup'}
                    </label>
                    <input value={recuperadoForm[f]} onChange={e => setRecuperadoForm(p => ({ ...p, [f]: f === 'placa' ? formatPlaca(e.target.value) : e.target.value }))}
                      className="adm-input w-full rounded-lg px-3 py-2 text-sm border"
                      style={{ background: 'var(--adm-input)', color: 'var(--adm-text)', borderColor: 'var(--adm-border)' }} />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 justify-end mt-5">
                <button onClick={() => setRecuperadoModal(null)}
                  className="px-4 py-2 text-sm rounded-lg border"
                  style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)', background: 'transparent' }}>Cancelar</button>
                <button onClick={saveRecuperado}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-cpe-red hover:bg-cpe-red/80 rounded-lg transition-colors">
                  <Save size={14} /> Salvar
                </button>
              </div>
            </div>
          </div>
        )}

        {recuperadoDel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl shadow-2xl border p-6"
              style={{ background: 'var(--adm-modal)', borderColor: 'var(--adm-border)' }}>
              <h4 className="font-bold text-xl mb-2" style={{ color: 'var(--adm-text)' }}>Confirmar exclusão</h4>
              <p className="text-sm mb-5" style={{ color: 'var(--adm-muted)' }}>
                Excluir registro de <span className="font-bold" style={{ color: 'var(--adm-text)' }}>{recuperadoDel.placa}</span>?
              </p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setRecuperadoDel(null)}
                  className="px-4 py-2 text-sm rounded-lg border"
                  style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)', background: 'transparent' }}>Cancelar</button>
                <button onClick={() => { setRecuperados(d => d.filter(r => r.id !== recuperadoDel!.id)); setRecuperadoDel(null); }}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-cpe-red hover:bg-cpe-red/80 rounded-lg transition-colors">
                  <Trash2 size={14} /> Excluir
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── alertas históricos view ────────────────────────────────────────────────
  if (subModule === 'alertas' && view === 'list') {
    const saveAlert = () => {
      if (alertModal === 'new') {
        setAlertHist(d => [...d, { id: nextId(), ...alertForm }]);
      } else if (alertModal) {
        setAlertHist(d => d.map(a => a.id === alertModal.id ? { ...alertModal, ...alertForm } : a));
      }
      setAlertModal(null);
    };
    return (
      <div className="flex flex-col h-full">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <button onClick={onBack} className="flex items-center gap-1.5 transition-colors text-base font-medium"
            style={{ color: 'var(--adm-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--adm-text)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--adm-muted)')}>
            <ArrowLeft size={17} /> Módulos
          </button>
          <span style={{ color: 'var(--adm-border)' }} className="hidden sm:block">|</span>
          <h3 className="font-bold text-2xl flex-1" style={{ color: 'var(--adm-text)' }}>Caráter Geral</h3>
        </div>
        {tabBar}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-2 flex-1 min-w-[200px] rounded-lg border px-3 py-2"
            style={{ background: 'var(--adm-input)', borderColor: 'var(--adm-border)' }}>
            <Search size={15} style={{ color: 'var(--adm-muted)' }} />
            <input value={alertSearch} onChange={e => { setAlertSearch(e.target.value); setAlertPage(1); }}
              placeholder="Buscar placa ou descrição…"
              className="bg-transparent text-sm outline-none w-full"
              style={{ color: 'var(--adm-text)' }} />
          </div>
          {canCreate && (
            <button onClick={() => { setAlertForm({ placa: '', descricao: '' }); setAlertModal('new'); }}
              className="flex items-center gap-2 bg-cpe-red hover:bg-cpe-red/80 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
              <Plus size={15} /> Novo
            </button>
          )}
        </div>
        <div className="overflow-auto rounded-xl border" style={{ borderColor: 'var(--adm-border)' }}>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ background: 'var(--adm-tbl-head)', color: 'var(--adm-text)' }}>
                <th
                  className="px-3 py-2 text-left font-semibold text-xs uppercase whitespace-nowrap cursor-pointer select-none"
                  onClick={() => { setAlertSort(s => s === 'asc' ? 'desc' : 'asc'); setAlertPage(1); }}
                >
                  Placa {alertSort === 'asc' ? '▲' : '▼'}
                </th>
                {['Descrição',''].map(h => (
                  <th key={h} className="px-3 py-2 text-left font-semibold text-xs uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {alertFiltered.slice((alertPage - 1) * 50, alertPage * 50).map((a, i) => (
                <tr key={a.id} className="adm-row border-t" style={{ background: i % 2 === 0 ? 'var(--adm-surface)' : 'var(--adm-row-even)', borderColor: 'var(--adm-border)' }}>
                  <td className="px-3 py-1.5 font-bold whitespace-nowrap" style={{ color: 'var(--adm-text)' }}>{a.placa}</td>
                  <td className="px-3 py-1.5" style={{ color: 'var(--adm-text)' }}>{a.descricao}</td>
                  <td className="px-3 py-1.5 whitespace-nowrap">
                    <div className="flex gap-2">
                      {canEdit && (
                        <button onClick={() => { setAlertForm({ placa: a.placa, descricao: a.descricao }); setAlertModal(a); }}
                          style={{ color: 'var(--adm-muted)' }}><Pencil size={14} /></button>
                      )}
                      {canDelete && (
                        <button onClick={() => setAlertDel(a)} style={{ color: '#ef4444' }}><Trash2 size={14} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {alertFiltered.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-sm" style={{ color: 'var(--adm-muted)' }}>Nenhum alerta encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {/* paginação alertas */}
        {(() => {
          const total = alertFiltered.length;
          const pages = Math.ceil(total / 50);
          const start = (alertPage - 1) * 50 + 1;
          const end   = Math.min(alertPage * 50, total);
          return (
            <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
              <p className="text-xs" style={{ color: 'var(--adm-muted)' }}>
                {total === 0 ? '0 registros' : `${start}–${end} de ${total}`}
              </p>
              {pages > 1 && (
                <div className="flex items-center gap-1">
                  <button disabled={alertPage === 1} onClick={() => setAlertPage(1)}
                    className="px-2 py-1 text-xs rounded border disabled:opacity-30"
                    style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)', background: 'transparent' }}>«</button>
                  <button disabled={alertPage === 1} onClick={() => setAlertPage(p => p - 1)}
                    className="px-2 py-1 text-xs rounded border disabled:opacity-30"
                    style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)', background: 'transparent' }}>‹</button>
                  <span className="px-2 text-xs" style={{ color: 'var(--adm-text)' }}>{alertPage} / {pages}</span>
                  <button disabled={alertPage === pages} onClick={() => setAlertPage(p => p + 1)}
                    className="px-2 py-1 text-xs rounded border disabled:opacity-30"
                    style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)', background: 'transparent' }}>›</button>
                  <button disabled={alertPage === pages} onClick={() => setAlertPage(pages)}
                    className="px-2 py-1 text-xs rounded border disabled:opacity-30"
                    style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)', background: 'transparent' }}>»</button>
                </div>
              )}
            </div>
          );
        })()}

        {/* modal add/edit */}
        {alertModal !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-2xl shadow-2xl border p-6"
              style={{ background: 'var(--adm-modal)', borderColor: 'var(--adm-border)' }}>
              <div className="flex items-center justify-between mb-5">
                <h4 className="font-bold text-xl" style={{ color: 'var(--adm-text)' }}>
                  {alertModal === 'new' ? 'Novo Alerta' : 'Editar Alerta'}
                </h4>
                <button onClick={() => setAlertModal(null)} style={{ color: 'var(--adm-muted)' }}><X size={20} /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--adm-muted)' }}>Placa</label>
                  <input value={alertForm.placa} onChange={e => setAlertForm(p => ({ ...p, placa: formatPlaca(e.target.value) }))}
                    className="adm-input w-full rounded-lg px-3 py-2 text-sm border"
                    style={{ background: 'var(--adm-input)', color: 'var(--adm-text)', borderColor: 'var(--adm-border)' }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--adm-muted)' }}>Descrição</label>
                  <textarea rows={3} value={alertForm.descricao} onChange={e => setAlertForm(p => ({ ...p, descricao: e.target.value }))}
                    className="adm-input w-full rounded-lg px-3 py-2 text-sm border resize-none"
                    style={{ background: 'var(--adm-input)', color: 'var(--adm-text)', borderColor: 'var(--adm-border)' }} />
                </div>
              </div>
              <div className="flex gap-3 justify-end mt-5">
                <button onClick={() => setAlertModal(null)}
                  className="px-4 py-2 text-sm rounded-lg border"
                  style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)', background: 'transparent' }}>Cancelar</button>
                <button onClick={saveAlert}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-cpe-red hover:bg-cpe-red/80 rounded-lg transition-colors">
                  <Save size={14} /> Salvar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* delete confirm */}
        {alertDel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl shadow-2xl border p-6"
              style={{ background: 'var(--adm-modal)', borderColor: 'var(--adm-border)' }}>
              <h4 className="font-bold text-xl mb-2" style={{ color: 'var(--adm-text)' }}>Confirmar exclusão</h4>
              <p className="text-sm mb-5" style={{ color: 'var(--adm-muted)' }}>
                Excluir alerta da placa <span className="font-bold" style={{ color: 'var(--adm-text)' }}>{alertDel.placa}</span>?
              </p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setAlertDel(null)}
                  className="px-4 py-2 text-sm rounded-lg border"
                  style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)', background: 'transparent' }}>Cancelar</button>
                <button onClick={() => { setAlertHist(d => d.filter(a => a.id !== alertDel!.id)); setAlertDel(null); }}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-cpe-red hover:bg-cpe-red/80 rounded-lg transition-colors">
                  <Trash2 size={14} /> Excluir
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── list view ──────────────────────────────────────────────────────────────
  if (view === 'list') {
    return (
      <div className="flex flex-col h-full">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <button onClick={onBack} className="flex items-center gap-1.5 transition-colors text-base font-medium"
            style={{ color: 'var(--adm-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--adm-text)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--adm-muted)')}>
            <ArrowLeft size={17} /> Módulos
          </button>
          <span style={{ color: 'var(--adm-border)' }} className="hidden sm:block">|</span>
          <h3 className="font-bold text-2xl flex-1" style={{ color: 'var(--adm-text)' }}>Caráter Geral</h3>
        </div>
        {tabBar}

        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 rounded-2xl border"
            style={{ background: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
            <p className="text-lg font-semibold" style={{ color: 'var(--adm-text)' }}>Nenhum registro</p>
            <p className="text-sm mt-1" style={{ color: 'var(--adm-muted)' }}>Nenhum registro disponível no momento.</p>
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

      </div>
    );
  }

  // ── detail view ────────────────────────────────────────────────────────────
  const cg  = editMode && draft ? draft : selected!;
  const idx = sorted.findIndex(c => c.id === cg.id);
  const sortedVeiculos = [...cg.veiculos].sort((a, b) =>
    veiculosSort === 'asc'
      ? a.placa.localeCompare(b.placa, 'pt-BR')
      : b.placa.localeCompare(a.placa, 'pt-BR')
  );
  const displayedVeiculos = editMode ? cg.veiculos : sortedVeiculos;

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
                <th
                  className="px-3 py-2.5 text-left cursor-pointer select-none"
                  onClick={() => setVeiculosSort(s => s === 'asc' ? 'desc' : 'asc')}
                >
                  Placa {veiculosSort === 'asc' ? '▲' : '▼'}
                </th>
                <th className="px-3 py-2.5 text-left">Marca/Modelo</th>
                <th className="px-3 py-2.5 text-left">Cor/Milhar</th>
                <th className="px-3 py-2.5 text-left w-16">Ano</th>
                <th className="px-3 py-2.5 text-left w-14">Art</th>
                <th className="px-3 py-2.5 text-left w-16">Data</th>
                <th className="w-28"></th>
              </tr>
            </thead>
            <tbody>
              {displayedVeiculos.map((v, i) => (
                <tr key={v.id} className="adm-row border-t transition-colors"
                  style={{ borderColor: 'var(--adm-border)', background: i % 2 === 0 ? 'var(--adm-row-even)' : 'transparent' }}>
                  {editMode ? (
                    <>
                      <td className="px-2 py-1.5"><input value={v.placa} onChange={e => setVeiculo(i, 'placa', formatPlaca(e.target.value))} className={cls} style={fss} /></td>
                      <td className="px-2 py-1.5"><input value={v.marcaModelo} onChange={e => setVeiculo(i, 'marcaModelo', e.target.value)} className={cls} style={fss} /></td>
                      <td className="px-2 py-1.5"><input value={v.corMilhar} onChange={e => setVeiculo(i, 'corMilhar', e.target.value)} className={cls} style={fss} /></td>
                      <td className="px-2 py-1.5"><input value={v.ano} onChange={e => setVeiculo(i, 'ano', e.target.value)} className={cls} style={fss} /></td>
                      <td className="px-2 py-1.5"><input value={v.art} onChange={e => setVeiculo(i, 'art', e.target.value)} className={cls} style={fss} /></td>
                      <td className="px-2 py-1.5"><input value={v.dataInfracao} onChange={e => setVeiculo(i, 'dataInfracao', e.target.value)} className={cls} style={fss} /></td>
                      <td className="px-1 py-1.5 text-center" colSpan={2}>
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
                      <td className="px-2 py-1.5 whitespace-nowrap">
                        {canCreate && (
                          <div className="flex gap-1.5">
                            <button onClick={() => openMigrate(v, 'historico')}
                              title="Migrar para Histórico de Veículos"
                              className="flex items-center gap-1 px-2 py-0.5 text-xs rounded border transition-colors"
                              style={{ color: 'var(--adm-muted)', borderColor: 'var(--adm-border)' }}>
                              <MoveRight size={11} /> Hist.
                            </button>
                            <button onClick={() => openMigrate(v, 'recuperados')}
                              title="Migrar para Recuperados"
                              className="flex items-center gap-1 px-2 py-0.5 text-xs rounded border transition-colors"
                              style={{ color: '#22c55e', borderColor: 'rgba(34,197,94,0.3)' }}>
                              <MoveRight size={11} /> Rec.
                            </button>
                          </div>
                        )}
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {cg.veiculos.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-10 text-center" style={{ color: 'var(--adm-subtle)' }}>Nenhum veículo.</td></tr>
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
                <th className="w-20"></th>
              </tr>
            </thead>
            <tbody>
              {cg.alertas.map((a, i) => (
                <tr key={a.id} className="adm-row border-t transition-colors"
                  style={{ borderColor: 'var(--adm-border)', background: i % 2 === 0 ? 'var(--adm-row-even)' : 'transparent' }}>
                  {editMode ? (
                    <>
                      <td className="px-2 py-1.5 w-36"><input value={a.placa} onChange={e => setAlerta(i, 'placa', formatPlaca(e.target.value))} className={cls} style={fss} /></td>
                      <td className="px-2 py-1.5"><input value={a.descricao} onChange={e => setAlerta(i, 'descricao', e.target.value)} className={cls} style={fss} /></td>
                      <td className="px-1 py-1.5 text-center" colSpan={2}>
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
                      <td className="px-2 py-1.5 whitespace-nowrap">
                        {canCreate && (
                          <button onClick={() => setMigAlerta(a)}
                            title="Migrar para Alertas Antigos"
                            className="flex items-center gap-1 px-2 py-0.5 text-xs rounded border transition-colors"
                            style={{ color: 'var(--adm-muted)', borderColor: 'var(--adm-border)' }}>
                            <MoveRight size={11} /> Ant.
                          </button>
                        )}
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {cg.alertas.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center" style={{ color: 'var(--adm-subtle)' }}>Sem alertas.</td></tr>
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
      {migrateAlertaModal}
      {migrateModal}
    </div>
  );
}
