import { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  ArrowLeft, Plus, Eye, Pencil, Trash2, X, Save,
  Search, Download, FileSpreadsheet, Printer, AlertCircle,
} from 'lucide-react';
import {
  feriasMensalDB, feriasPendenteDB, feriasAbrilMaioDB,
  FeriasPessoa, FeriasPendente, FeriasAbrilMaio,
} from '../../data/planoFerias';
import { ModulePermission } from '../../types/rbac';

// ── constants ─────────────────────────────────────────────────────────────────

const MONTH_LABELS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const MONTH_FULL   = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const TAB_PENDENTES = 12;
const TAB_ABRMAIS   = 13;

const HDR = [
  ['ESTADO DE GOIÁS'],
  ['SECRETARIA DE ESTADO DA SEGURANÇA PÚBLICA E ADMINISTRAÇÃO PENITENCIÁRIA'],
  ['POLÍCIA MILITAR'],
  ['3º CRPM // 31ª CIPM-CPE'],
  ['Seção Administrativa'],
  ['PLANO DE FÉRIAS 2026 – Exercício 2025'],
  [],
];

// ── helpers ───────────────────────────────────────────────────────────────────

function nextId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

function emptyPessoa(mes: number): FeriasPessoa {
  return { id: '', mes, ord: 1, posto: '', rg: '', nome: '', funcao: '', dias: '', saida: '', retorno: '', observacao: '' };
}

function emptyPendente(): FeriasPendente {
  return {
    id: '', ord: 1, posto: '', rg: '', nome: '', inclusao: '',
    exercicios: Array.from({ length: 5 }, () => ({ dias: '', exercicio: '' })),
  };
}

function emptyAbrMai(secao: FeriasAbrilMaio['secao']): FeriasAbrilMaio {
  return { id: '', secao, num: 1, graduacao: '', rg: '', nome: '', funcao: '', dias: '', inicio: '', fim: '', dispCmdo: '', pronto: '', observacao: '' };
}

// ── XLSX export ───────────────────────────────────────────────────────────────

function exportXLSX(
  mensal: FeriasPessoa[],
  pendentes: FeriasPendente[],
  abrMai: FeriasAbrilMaio[],
) {
  const wb = XLSX.utils.book_new();

  // Monthly sheets
  for (let m = 1; m <= 12; m++) {
    const rows = mensal.filter(r => r.mes === m);
    const ws = XLSX.utils.aoa_to_sheet([
      ...HDR,
      [MONTH_FULL[m - 1].toUpperCase()],
      [],
      ['Ord', 'Posto/Grad.', 'RG', 'Nome', 'Função', 'Dias', 'Saída', 'Retorno', 'Observação'],
      ...rows.map(r => [r.ord, r.posto, r.rg, r.nome, r.funcao, r.dias, r.saida, r.retorno, r.observacao]),
    ]);
    ws['!cols'] = [
      { wch: 4 }, { wch: 12 }, { wch: 8 }, { wch: 36 },
      { wch: 14 }, { wch: 6 }, { wch: 8 }, { wch: 8 }, { wch: 32 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, MONTH_LABELS[m - 1]);
  }

  // Férias Pendentes sheet
  const wsPend = XLSX.utils.aoa_to_sheet([
    ...HDR,
    ['POLICIAIS COM FÉRIAS EM HAVER – EXERCÍCIOS (ATUALIZADO 30/04/2026 – SGT CHAGAS)'],
    [],
    ['Ord', 'Posto/Grad.', 'RG', 'Nome', 'Inclusão',
     'Dias', 'Exercício', 'Dias', 'Exercício', 'Dias', 'Exercício', 'Dias', 'Exercício', 'Dias', 'Exercício'],
    ...pendentes.map(r => [
      r.ord, r.posto, r.rg, r.nome, r.inclusao,
      ...r.exercicios.flatMap(e => [e.dias, e.exercicio]),
    ]),
  ]);
  wsPend['!cols'] = [
    { wch: 4 }, { wch: 12 }, { wch: 8 }, { wch: 36 }, { wch: 12 },
    ...Array(10).fill({ wch: 8 }),
  ];
  XLSX.utils.book_append_sheet(wb, wsPend, 'Pendentes');

  // Abr/Mai 2026 sheet
  const wsAm = XLSX.utils.aoa_to_sheet([
    ...HDR,
    ['RETORNAM DE FÉRIAS DE ABRIL / ENTRAM DE FÉRIAS EM MAIO / LESP 2026'],
    [],
    ['Seção', 'Nº', 'Graduação', 'RG', 'Nome', 'Função', 'Dias', 'Início', 'Fim', 'Disp. Cmdo Geral', 'Pronto', 'Observação'],
    ...abrMai.map(r => [r.secao, r.num, r.graduacao, r.rg, r.nome, r.funcao, r.dias, r.inicio, r.fim, r.dispCmdo, r.pronto, r.observacao]),
  ]);
  wsAm['!cols'] = [
    { wch: 14 }, { wch: 4 }, { wch: 12 }, { wch: 8 }, { wch: 36 },
    { wch: 14 }, { wch: 6 }, { wch: 8 }, { wch: 8 }, { wch: 16 }, { wch: 8 }, { wch: 24 },
  ];
  XLSX.utils.book_append_sheet(wb, wsAm, 'Abr-Mai-2026');

  XLSX.writeFile(wb, 'plano_ferias_2026.xlsx');
}

// ── print helper ──────────────────────────────────────────────────────────────

function exportPrint(mensal: FeriasPessoa[], pendentes: FeriasPendente[], abrMai: FeriasAbrilMaio[]) {
  const monthBlocks = MONTH_FULL.map((label, i) => {
    const mes = i + 1;
    const rows = mensal.filter(r => r.mes === mes);
    if (!rows.length) return '';
    const trs = rows.map(r => `<tr><td>${r.ord}</td><td>${r.posto}</td><td>${r.rg}</td><td>${r.nome}</td><td>${r.funcao}</td><td>${r.dias}</td><td>${r.saida}</td><td>${r.retorno}</td><td>${r.observacao}</td></tr>`).join('');
    return `<h3>${label.toUpperCase()}</h3><table><thead><tr><th>Ord</th><th>Posto/Grad</th><th>RG</th><th>Nome</th><th>Função</th><th>Dias</th><th>Saída</th><th>Retorno</th><th>Obs</th></tr></thead><tbody>${trs}</tbody></table>`;
  }).join('');

  const pendTrs = pendentes.map(r =>
    `<tr><td>${r.ord}</td><td>${r.posto}</td><td>${r.rg}</td><td>${r.nome}</td><td>${r.inclusao}</td>${r.exercicios.map(e => `<td>${e.dias}</td><td>${e.exercicio}</td>`).join('')}</tr>`
  ).join('');

  const amTrs = abrMai.map(r =>
    `<tr><td>${r.secao}</td><td>${r.num}</td><td>${r.graduacao}</td><td>${r.rg}</td><td>${r.nome}</td><td>${r.funcao}</td><td>${r.dias}</td><td>${r.inicio}</td><td>${r.fim}</td><td>${r.dispCmdo}</td><td>${r.pronto}</td><td>${r.observacao}</td></tr>`
  ).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Plano de Férias 2026</title>
    <style>body{font-family:Arial;font-size:8.5px;margin:12px}h2{font-size:11px;margin:12px 0 4px}h3{font-size:9.5px;margin:14px 0 3px}table{border-collapse:collapse;width:100%;margin-bottom:12px}th,td{border:1px solid #bbb;padding:2px 4px}th{background:#2d2d2d;color:#fff;text-transform:uppercase;font-size:7.5px}</style>
    </head><body>
    <h2>PLANO DE FÉRIAS 2026 — 31ª CIPM/CPE</h2>
    ${monthBlocks}
    <h3>FÉRIAS PENDENTES</h3>
    <table><thead><tr><th>Ord</th><th>Posto/Grad</th><th>RG</th><th>Nome</th><th>Inclusão</th><th>Dias</th><th>Exerc.</th><th>Dias</th><th>Exerc.</th><th>Dias</th><th>Exerc.</th><th>Dias</th><th>Exerc.</th><th>Dias</th><th>Exerc.</th></tr></thead><tbody>${pendTrs}</tbody></table>
    <h3>ABR/MAI 2026</h3>
    <table><thead><tr><th>Seção</th><th>Nº</th><th>Graduação</th><th>RG</th><th>Nome</th><th>Função</th><th>Dias</th><th>Início</th><th>Fim</th><th>Disp. Cmdo</th><th>Pronto</th><th>Obs</th></tr></thead><tbody>${amTrs}</tbody></table>
    </body></html>`;

  const w = window.open('', '_blank');
  if (w) { w.document.write(html); w.document.close(); w.print(); }
}

// ── types ─────────────────────────────────────────────────────────────────────

type ModalMode = 'view' | 'edit' | 'create';

interface PessoaModal  { item: FeriasPessoa  | null; mode: ModalMode; }
interface PendenteModal{ item: FeriasPendente| null; mode: ModalMode; }
interface AbrMaiModal  { item: FeriasAbrilMaio|null; mode: ModalMode; secao: FeriasAbrilMaio['secao']; }

interface Props {
  onBack: () => void;
  permissions?: ModulePermission;
}

// ── component ─────────────────────────────────────────────────────────────────

export default function PlanoFeriasModule({ onBack, permissions }: Props) {
  const canCreate = !permissions || permissions.create;
  const canEdit   = !permissions || permissions.edit;
  const canDelete = !permissions || permissions.delete;

  const [mensalData,   setMensalData]   = useState<FeriasPessoa[]>(feriasMensalDB);
  const [pendenteData, setPendenteData] = useState<FeriasPendente[]>(feriasPendenteDB);
  const [abrMaiData,   setAbrMaiData]   = useState<FeriasAbrilMaio[]>(feriasAbrilMaioDB);

  const [activeTab, setActiveTab]     = useState(4); // Maio by default
  const [search, setSearch]           = useState('');
  const [showExport, setShowExport]   = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Modals
  const [pessoaModal,  setPessoaModal]  = useState<PessoaModal | null>(null);
  const [pendenteModal,setPendenteModal]= useState<PendenteModal | null>(null);
  const [abrMaiModal,  setAbrMaiModal]  = useState<AbrMaiModal | null>(null);

  // Form state for each modal type
  const [pessoaForm,   setPessoaForm]   = useState<FeriasPessoa>(emptyPessoa(1));
  const [pendenteForm, setPendenteForm] = useState<FeriasPendente>(emptyPendente());
  const [abrMaiForm,   setAbrMaiForm]   = useState<FeriasAbrilMaio>(emptyAbrMai('retornam-abril'));

  // ── derived data ──────────────────────────────────────────────────────────

  const q = search.toLowerCase();

  const monthRows = useMemo(() => {
    const mes = activeTab + 1;
    return mensalData
      .filter(r => r.mes === mes)
      .filter(r => !q || r.nome.toLowerCase().includes(q) || r.posto.toLowerCase().includes(q) || r.rg.includes(q));
  }, [mensalData, activeTab, q]);

  const pendenteRows = useMemo(() =>
    pendenteData.filter(r => !q || r.nome.toLowerCase().includes(q) || r.posto.toLowerCase().includes(q) || r.rg.includes(q)),
    [pendenteData, q],
  );

  const abrMaiRows = useMemo(() =>
    abrMaiData.filter(r => !q || r.nome.toLowerCase().includes(q) || r.graduacao.toLowerCase().includes(q) || r.rg.includes(q)),
    [abrMaiData, q],
  );

  // ── handlers – Pessoa (monthly) ──────────────────────────────────────────

  function openPessoa(item: FeriasPessoa, mode: ModalMode) {
    setPessoaForm({ ...item });
    setPessoaModal({ item, mode });
  }

  function openCreatePessoa() {
    const mes = activeTab + 1;
    const nextOrd = (mensalData.filter(r => r.mes === mes).reduce((m, r) => Math.max(m, r.ord), 0)) + 1;
    const blank = { ...emptyPessoa(mes), ord: nextOrd };
    setPessoaForm(blank);
    setPessoaModal({ item: null, mode: 'create' });
  }

  function savePessoa() {
    if (pessoaModal?.mode === 'create') {
      setMensalData(d => [...d, { ...pessoaForm, id: nextId() }]);
    } else {
      setMensalData(d => d.map(r => r.id === pessoaForm.id ? pessoaForm : r));
    }
    setPessoaModal(null);
  }

  function deletePessoa(id: string) {
    setMensalData(d => d.filter(r => r.id !== id));
    setDeleteConfirm(null);
  }

  // ── handlers – Pendente ───────────────────────────────────────────────────

  function openPendente(item: FeriasPendente, mode: ModalMode) {
    const ex = [...item.exercicios];
    while (ex.length < 5) ex.push({ dias: '', exercicio: '' });
    setPendenteForm({ ...item, exercicios: ex });
    setPendenteModal({ item, mode });
  }

  function openCreatePendente() {
    const nextOrd = (pendenteData.reduce((m, r) => Math.max(m, r.ord), 0)) + 1;
    setPendenteForm({ ...emptyPendente(), ord: nextOrd });
    setPendenteModal({ item: null, mode: 'create' });
  }

  function savePendente() {
    if (pendenteModal?.mode === 'create') {
      setPendenteData(d => [...d, { ...pendenteForm, id: nextId() }]);
    } else {
      setPendenteData(d => d.map(r => r.id === pendenteForm.id ? pendenteForm : r));
    }
    setPendenteModal(null);
  }

  function deletePendente(id: string) {
    setPendenteData(d => d.filter(r => r.id !== id));
    setDeleteConfirm(null);
  }

  // ── handlers – AbrMai ─────────────────────────────────────────────────────

  function openAbrMai(item: FeriasAbrilMaio, mode: ModalMode) {
    setAbrMaiForm({ ...item });
    setAbrMaiModal({ item, mode, secao: item.secao });
  }

  function openCreateAbrMai(secao: FeriasAbrilMaio['secao']) {
    const nextNum = (abrMaiData.filter(r => r.secao === secao).reduce((m, r) => Math.max(m, r.num), 0)) + 1;
    setAbrMaiForm({ ...emptyAbrMai(secao), num: nextNum });
    setAbrMaiModal({ item: null, mode: 'create', secao });
  }

  function saveAbrMai() {
    if (abrMaiModal?.mode === 'create') {
      setAbrMaiData(d => [...d, { ...abrMaiForm, id: nextId() }]);
    } else {
      setAbrMaiData(d => d.map(r => r.id === abrMaiForm.id ? abrMaiForm : r));
    }
    setAbrMaiModal(null);
  }

  function deleteAbrMai(id: string) {
    setAbrMaiData(d => d.filter(r => r.id !== id));
    setDeleteConfirm(null);
  }

  // ── render ────────────────────────────────────────────────────────────────

  const isMonthTab   = activeTab >= 0 && activeTab <= 11;
  const isPendTab    = activeTab === TAB_PENDENTES;
  const isAbrMaiTab  = activeTab === TAB_ABRMAIS;

  const SECAO_LABELS: Record<FeriasAbrilMaio['secao'], string> = {
    'retornam-abril': 'Retornam Abr',
    'entram-maio':    'Entram Mai',
    'lesp':           'LESP',
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-70"
            style={{ color: 'var(--adm-muted)' }}
          >
            <ArrowLeft size={16} /> Voltar
          </button>
          <span style={{ color: 'var(--adm-border)' }}>/</span>
          <h1 className="text-lg font-bold" style={{ color: 'var(--adm-text)' }}>
            Plano de Férias 2026
          </h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* search */}
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--adm-muted)' }} />
            <input
              className="adm-input pl-8 pr-3 py-1.5 text-sm rounded-lg border w-48"
              style={{ background: 'var(--adm-input)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
              placeholder="Buscar…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* export dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExport(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors"
              style={{ background: 'var(--adm-input)', borderColor: 'var(--adm-border)', color: 'var(--adm-muted)' }}
            >
              <Download size={14} /> Exportar
            </button>
            {showExport && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowExport(false)} />
                <div className="absolute right-0 mt-1 w-44 rounded-lg border shadow-lg z-20"
                  style={{ background: 'var(--adm-dropdown)', borderColor: 'var(--adm-border)' }}>
                  <button
                    onClick={() => { exportXLSX(mensalData, pendenteData, abrMaiData); setShowExport(false); }}
                    className="adm-drop-item flex items-center gap-2 w-full px-4 py-2.5 text-sm"
                    style={{ color: 'var(--adm-text)' }}
                  >
                    <FileSpreadsheet size={14} className="text-emerald-500" /> Excel (.xlsx)
                  </button>
                  <button
                    onClick={() => { exportPrint(mensalData, pendenteData, abrMaiData); setShowExport(false); }}
                    className="adm-drop-item flex items-center gap-2 w-full px-4 py-2.5 text-sm"
                    style={{ color: 'var(--adm-text)' }}
                  >
                    <Printer size={14} className="text-sky-500" /> Imprimir / PDF
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
        {MONTH_LABELS.map((label, i) => {
          const count = mensalData.filter(r => r.mes === i + 1).length;
          return (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              className="flex-shrink-0 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
              style={{
                background: activeTab === i ? 'var(--adm-accent)' : 'var(--adm-input)',
                color: activeTab === i ? '#fff' : 'var(--adm-muted)',
              }}
            >
              {label}
              <span className={`text-[10px] px-1 py-0.5 rounded-full ${activeTab === i ? 'bg-white/30' : 'bg-white/10'}`}>
                {count}
              </span>
            </button>
          );
        })}
        <div className="flex-shrink-0 w-px mx-1 self-stretch" style={{ background: 'var(--adm-border)' }} />
        <button
          onClick={() => setActiveTab(TAB_PENDENTES)}
          className="flex-shrink-0 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
          style={{
            background: activeTab === TAB_PENDENTES ? 'var(--adm-accent)' : 'var(--adm-input)',
            color: activeTab === TAB_PENDENTES ? '#fff' : 'var(--adm-muted)',
          }}
        >
          Pendentes
          <span className={`text-[10px] px-1 py-0.5 rounded-full ${activeTab === TAB_PENDENTES ? 'bg-white/30' : 'bg-white/10'}`}>
            {pendenteData.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab(TAB_ABRMAIS)}
          className="flex-shrink-0 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
          style={{
            background: activeTab === TAB_ABRMAIS ? 'var(--adm-accent)' : 'var(--adm-input)',
            color: activeTab === TAB_ABRMAIS ? '#fff' : 'var(--adm-muted)',
          }}
        >
          Abr/Mai 2026
          <span className={`text-[10px] px-1 py-0.5 rounded-full ${activeTab === TAB_ABRMAIS ? 'bg-white/30' : 'bg-white/10'}`}>
            {abrMaiData.length}
          </span>
        </button>
      </div>

      {/* ── Month table ── */}
      {isMonthTab && (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--adm-border)' }}>
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ background: 'var(--adm-tbl-head)', borderColor: 'var(--adm-border)' }}>
            <span className="text-sm font-semibold" style={{ color: 'var(--adm-text)' }}>
              {MONTH_FULL[activeTab]} — {monthRows.length} policial(is)
            </span>
            {canCreate && (
              <button
                onClick={openCreatePessoa}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-cpe-red text-white hover:opacity-80 transition-opacity"
              >
                <Plus size={13} /> Novo
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--adm-tbl-head)' }}>
                  {['Ord','Posto/Grad.','RG','Nome','Função','Dias','Saída','Retorno','Obs',''].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap" style={{ color: 'var(--adm-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthRows.map((r, idx) => (
                  <tr key={r.id} className="adm-row border-t transition-colors"
                    style={{ background: idx % 2 === 0 ? 'var(--adm-surface)' : 'var(--adm-row-even)', borderColor: 'var(--adm-border)' }}>
                    <td className="px-3 py-2 text-xs" style={{ color: 'var(--adm-muted)' }}>{r.ord}</td>
                    <td className="px-3 py-2 text-xs font-medium" style={{ color: 'var(--adm-text)' }}>{r.posto}</td>
                    <td className="px-3 py-2 text-xs" style={{ color: 'var(--adm-muted)' }}>{r.rg}</td>
                    <td className="px-3 py-2 text-sm font-medium whitespace-nowrap" style={{ color: 'var(--adm-text)' }}>{r.nome}</td>
                    <td className="px-3 py-2 text-xs" style={{ color: 'var(--adm-muted)' }}>{r.funcao}</td>
                    <td className="px-3 py-2 text-xs text-center">{r.dias ? <span className="px-1.5 py-0.5 rounded-full text-xs font-bold bg-sky-500/20 text-sky-400">{r.dias}</span> : ''}</td>
                    <td className="px-3 py-2 text-xs" style={{ color: 'var(--adm-muted)' }}>{r.saida}</td>
                    <td className="px-3 py-2 text-xs" style={{ color: 'var(--adm-muted)' }}>{r.retorno}</td>
                    <td className="px-3 py-2 text-xs max-w-[160px] truncate" style={{ color: 'var(--adm-muted)' }} title={r.observacao}>{r.observacao}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openPessoa(r, 'view')} className="p-1 rounded hover:opacity-70 transition-opacity" style={{ color: 'var(--adm-muted)' }}><Eye size={13} /></button>
                        {canEdit && <button onClick={() => openPessoa(r, 'edit')} className="p-1 rounded hover:opacity-70 transition-opacity" style={{ color: 'var(--adm-muted)' }}><Pencil size={13} /></button>}
                        {canDelete && <button onClick={() => setDeleteConfirm(r.id)} className="p-1 rounded hover:opacity-70 transition-opacity text-red-400"><Trash2 size={13} /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
                {monthRows.length === 0 && (
                  <tr><td colSpan={10} className="py-10 text-center text-sm" style={{ color: 'var(--adm-muted)' }}>Nenhum registro encontrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Férias Pendentes table ── */}
      {isPendTab && (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--adm-border)' }}>
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ background: 'var(--adm-tbl-head)', borderColor: 'var(--adm-border)' }}>
            <span className="text-sm font-semibold" style={{ color: 'var(--adm-text)' }}>
              Férias Pendentes — {pendenteRows.length} policial(is)
            </span>
            {canCreate && (
              <button
                onClick={openCreatePendente}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-cpe-red text-white hover:opacity-80 transition-opacity"
              >
                <Plus size={13} /> Novo
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--adm-tbl-head)' }}>
                  {['Ord','Posto/Grad.','RG','Nome','Inclusão','Exercícios em haver',''].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap" style={{ color: 'var(--adm-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pendenteRows.map((r, idx) => {
                  const filled = r.exercicios.filter(e => e.dias || e.exercicio);
                  return (
                    <tr key={r.id} className="adm-row border-t transition-colors"
                      style={{ background: idx % 2 === 0 ? 'var(--adm-surface)' : 'var(--adm-row-even)', borderColor: 'var(--adm-border)' }}>
                      <td className="px-3 py-2 text-xs" style={{ color: 'var(--adm-muted)' }}>{r.ord}</td>
                      <td className="px-3 py-2 text-xs font-medium" style={{ color: 'var(--adm-text)' }}>{r.posto}</td>
                      <td className="px-3 py-2 text-xs" style={{ color: 'var(--adm-muted)' }}>{r.rg}</td>
                      <td className="px-3 py-2 text-sm font-medium whitespace-nowrap" style={{ color: 'var(--adm-text)' }}>{r.nome}</td>
                      <td className="px-3 py-2 text-xs" style={{ color: 'var(--adm-muted)' }}>{r.inclusao}</td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1">
                          {filled.length === 0
                            ? <span className="text-xs" style={{ color: 'var(--adm-muted)' }}>—</span>
                            : filled.map((e, i) => (
                                <span key={i} className="px-1.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400 whitespace-nowrap">
                                  {e.dias ? `${e.dias}d` : ''}{e.exercicio ? ` / ${e.exercicio}` : ''}
                                </span>
                              ))
                          }
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openPendente(r, 'view')} className="p-1 rounded hover:opacity-70" style={{ color: 'var(--adm-muted)' }}><Eye size={13} /></button>
                          {canEdit && <button onClick={() => openPendente(r, 'edit')} className="p-1 rounded hover:opacity-70" style={{ color: 'var(--adm-muted)' }}><Pencil size={13} /></button>}
                          {canDelete && <button onClick={() => setDeleteConfirm(r.id)} className="p-1 rounded hover:opacity-70 text-red-400"><Trash2 size={13} /></button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {pendenteRows.length === 0 && (
                  <tr><td colSpan={7} className="py-10 text-center text-sm" style={{ color: 'var(--adm-muted)' }}>Nenhum registro encontrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Abr/Mai 2026 ── */}
      {isAbrMaiTab && (
        <div className="space-y-4">
          {(['retornam-abril', 'entram-maio', 'lesp'] as const).map(secao => {
            const rows = abrMaiRows.filter(r => r.secao === secao);
            const secaoTitle: Record<FeriasAbrilMaio['secao'], string> = {
              'retornam-abril': 'Retornam de Férias de Abril/2026',
              'entram-maio':    'Entram de Férias em Maio/2026',
              'lesp':           'LESP 2º Trim/2026 (Abr/Mai/Jun)',
            };
            return (
              <div key={secao} className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--adm-border)' }}>
                <div className="flex items-center justify-between px-4 py-3 border-b" style={{ background: 'var(--adm-tbl-head)', borderColor: 'var(--adm-border)' }}>
                  <span className="text-sm font-semibold" style={{ color: 'var(--adm-text)' }}>
                    {secaoTitle[secao]} — {rows.length} policial(is)
                  </span>
                  {canCreate && (
                    <button
                      onClick={() => openCreateAbrMai(secao)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-cpe-red text-white hover:opacity-80 transition-opacity"
                    >
                      <Plus size={13} /> Novo
                    </button>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: 'var(--adm-tbl-head)' }}>
                        {['Nº','Graduação','RG','Nome','Função','Dias','Início','Fim','Disp. Cmdo','Pronto','Obs',''].map(h => (
                          <th key={h} className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap" style={{ color: 'var(--adm-muted)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r, idx) => (
                        <tr key={r.id} className="adm-row border-t transition-colors"
                          style={{ background: idx % 2 === 0 ? 'var(--adm-surface)' : 'var(--adm-row-even)', borderColor: 'var(--adm-border)' }}>
                          <td className="px-3 py-2 text-xs" style={{ color: 'var(--adm-muted)' }}>{r.num}</td>
                          <td className="px-3 py-2 text-xs font-medium" style={{ color: 'var(--adm-text)' }}>{r.graduacao}</td>
                          <td className="px-3 py-2 text-xs" style={{ color: 'var(--adm-muted)' }}>{r.rg}</td>
                          <td className="px-3 py-2 text-sm font-medium whitespace-nowrap" style={{ color: 'var(--adm-text)' }}>{r.nome}</td>
                          <td className="px-3 py-2 text-xs" style={{ color: 'var(--adm-muted)' }}>{r.funcao}</td>
                          <td className="px-3 py-2 text-center"><span className="px-1.5 py-0.5 rounded-full text-xs font-bold bg-sky-500/20 text-sky-400">{r.dias}</span></td>
                          <td className="px-3 py-2 text-xs" style={{ color: 'var(--adm-muted)' }}>{r.inicio}</td>
                          <td className="px-3 py-2 text-xs" style={{ color: 'var(--adm-muted)' }}>{r.fim}</td>
                          <td className="px-3 py-2 text-xs" style={{ color: 'var(--adm-muted)' }}>{r.dispCmdo}</td>
                          <td className="px-3 py-2 text-xs" style={{ color: 'var(--adm-muted)' }}>{r.pronto}</td>
                          <td className="px-3 py-2 text-xs max-w-[140px] truncate" style={{ color: 'var(--adm-muted)' }} title={r.observacao}>{r.observacao}</td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1">
                              <button onClick={() => openAbrMai(r, 'view')} className="p-1 rounded hover:opacity-70" style={{ color: 'var(--adm-muted)' }}><Eye size={13} /></button>
                              {canEdit && <button onClick={() => openAbrMai(r, 'edit')} className="p-1 rounded hover:opacity-70" style={{ color: 'var(--adm-muted)' }}><Pencil size={13} /></button>}
                              {canDelete && <button onClick={() => setDeleteConfirm(r.id)} className="p-1 rounded hover:opacity-70 text-red-400"><Trash2 size={13} /></button>}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {rows.length === 0 && (
                        <tr><td colSpan={12} className="py-8 text-center text-sm" style={{ color: 'var(--adm-muted)' }}>Nenhum registro encontrado.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Delete confirm ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="rounded-2xl border shadow-2xl p-6 max-w-sm w-full mx-4" style={{ background: 'var(--adm-modal)', borderColor: 'var(--adm-border)' }}>
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
              <p className="text-sm font-medium" style={{ color: 'var(--adm-text)' }}>Confirmar exclusão</p>
            </div>
            <p className="text-sm mb-6" style={{ color: 'var(--adm-muted)' }}>Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm rounded-lg border" style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)' }}>Cancelar</button>
              <button
                onClick={() => {
                  if (isMonthTab)  deletePessoa(deleteConfirm);
                  if (isPendTab)   deletePendente(deleteConfirm);
                  if (isAbrMaiTab) deleteAbrMai(deleteConfirm);
                }}
                className="px-4 py-2 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Pessoa modal (monthly) ── */}
      {pessoaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="rounded-2xl border shadow-2xl w-full max-w-xl" style={{ background: 'var(--adm-modal)', borderColor: 'var(--adm-border)' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--adm-border)' }}>
              <h2 className="text-base font-semibold" style={{ color: 'var(--adm-text)' }}>
                {pessoaModal.mode === 'create' ? 'Novo Registro' : pessoaModal.mode === 'edit' ? 'Editar Registro' : 'Detalhes'} — {MONTH_FULL[pessoaForm.mes - 1]}
              </h2>
              <button onClick={() => setPessoaModal(null)} style={{ color: 'var(--adm-muted)' }}><X size={18} /></button>
            </div>
            <div className="px-6 py-5 grid grid-cols-2 gap-4">
              {[
                { label: 'Ord', key: 'ord', type: 'number', span: 1 },
                { label: 'RG', key: 'rg', type: 'text', span: 1 },
                { label: 'Posto/Grad.', key: 'posto', type: 'text', span: 2 },
                { label: 'Nome', key: 'nome', type: 'text', span: 2 },
                { label: 'Função', key: 'funcao', type: 'text', span: 2 },
                { label: 'Dias', key: 'dias', type: 'text', span: 1 },
                { label: 'Saída (DD/MM)', key: 'saida', type: 'text', span: 1 },
                { label: 'Retorno (DD/MM)', key: 'retorno', type: 'text', span: 1 },
                { label: 'Observação', key: 'observacao', type: 'text', span: 2 },
              ].map(f => (
                <div key={f.key} className={f.span === 2 ? 'col-span-2' : ''}>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--adm-muted)' }}>{f.label}</label>
                  <input
                    type={f.type}
                    readOnly={pessoaModal.mode === 'view'}
                    className="adm-input w-full px-3 py-2 rounded-lg border text-sm"
                    style={{ background: 'var(--adm-input)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                    value={(pessoaForm as Record<string,unknown>)[f.key] as string}
                    onChange={e => pessoaModal.mode !== 'view' && setPessoaForm(p => ({ ...p, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value }))}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 px-6 pb-5">
              <button onClick={() => setPessoaModal(null)} className="px-4 py-2 text-sm rounded-lg border" style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)' }}>
                {pessoaModal.mode === 'view' ? 'Fechar' : 'Cancelar'}
              </button>
              {pessoaModal.mode !== 'view' && (
                <button onClick={savePessoa} className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-cpe-red text-white hover:opacity-80 transition-opacity">
                  <Save size={14} /> Salvar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Pendente modal ── */}
      {pendenteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="rounded-2xl border shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto" style={{ background: 'var(--adm-modal)', borderColor: 'var(--adm-border)' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 z-10" style={{ background: 'var(--adm-modal)', borderColor: 'var(--adm-border)' }}>
              <h2 className="text-base font-semibold" style={{ color: 'var(--adm-text)' }}>
                {pendenteModal.mode === 'create' ? 'Novo' : pendenteModal.mode === 'edit' ? 'Editar' : 'Detalhes'} — Férias Pendente
              </h2>
              <button onClick={() => setPendenteModal(null)} style={{ color: 'var(--adm-muted)' }}><X size={18} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Ord', key: 'ord', type: 'number' },
                  { label: 'RG', key: 'rg', type: 'text' },
                  { label: 'Posto/Grad.', key: 'posto', type: 'text', span: 2 },
                  { label: 'Nome', key: 'nome', type: 'text', span: 2 },
                  { label: 'Data Inclusão', key: 'inclusao', type: 'text', span: 2 },
                ].map(f => (
                  <div key={f.key} className={(f as Record<string,unknown>).span === 2 ? 'col-span-2' : ''}>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--adm-muted)' }}>{f.label}</label>
                    <input
                      type={f.type}
                      readOnly={pendenteModal.mode === 'view'}
                      className="adm-input w-full px-3 py-2 rounded-lg border text-sm"
                      style={{ background: 'var(--adm-input)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                      value={(pendenteForm as Record<string,unknown>)[f.key] as string}
                      onChange={e => pendenteModal.mode !== 'view' && setPendenteForm(p => ({ ...p, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value }))}
                    />
                  </div>
                ))}
              </div>
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--adm-muted)' }}>Exercícios em Haver</p>
                <div className="space-y-2">
                  {pendenteForm.exercicios.map((ex, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <span className="text-xs w-4 text-center" style={{ color: 'var(--adm-muted)' }}>{i + 1}</span>
                      <input
                        type="text"
                        placeholder="Dias"
                        readOnly={pendenteModal.mode === 'view'}
                        className="adm-input w-20 px-2 py-1.5 rounded-lg border text-xs"
                        style={{ background: 'var(--adm-input)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                        value={ex.dias}
                        onChange={e => {
                          if (pendenteModal.mode === 'view') return;
                          setPendenteForm(p => {
                            const exs = [...p.exercicios];
                            exs[i] = { ...exs[i], dias: e.target.value };
                            return { ...p, exercicios: exs };
                          });
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Exercício"
                        readOnly={pendenteModal.mode === 'view'}
                        className="adm-input flex-1 px-2 py-1.5 rounded-lg border text-xs"
                        style={{ background: 'var(--adm-input)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                        value={ex.exercicio}
                        onChange={e => {
                          if (pendenteModal.mode === 'view') return;
                          setPendenteForm(p => {
                            const exs = [...p.exercicios];
                            exs[i] = { ...exs[i], exercicio: e.target.value };
                            return { ...p, exercicios: exs };
                          });
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 pb-5">
              <button onClick={() => setPendenteModal(null)} className="px-4 py-2 text-sm rounded-lg border" style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)' }}>
                {pendenteModal.mode === 'view' ? 'Fechar' : 'Cancelar'}
              </button>
              {pendenteModal.mode !== 'view' && (
                <button onClick={savePendente} className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-cpe-red text-white hover:opacity-80 transition-opacity">
                  <Save size={14} /> Salvar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── AbrMai modal ── */}
      {abrMaiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="rounded-2xl border shadow-2xl w-full max-w-xl" style={{ background: 'var(--adm-modal)', borderColor: 'var(--adm-border)' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--adm-border)' }}>
              <h2 className="text-base font-semibold" style={{ color: 'var(--adm-text)' }}>
                {abrMaiModal.mode === 'create' ? 'Novo' : abrMaiModal.mode === 'edit' ? 'Editar' : 'Detalhes'} — {SECAO_LABELS[abrMaiModal.secao]}
              </h2>
              <button onClick={() => setAbrMaiModal(null)} style={{ color: 'var(--adm-muted)' }}><X size={18} /></button>
            </div>
            <div className="px-6 py-5 grid grid-cols-2 gap-4">
              {[
                { label: 'Nº', key: 'num', type: 'number', span: 1 },
                { label: 'RG', key: 'rg', type: 'text', span: 1 },
                { label: 'Graduação', key: 'graduacao', type: 'text', span: 2 },
                { label: 'Nome', key: 'nome', type: 'text', span: 2 },
                { label: 'Função', key: 'funcao', type: 'text', span: 2 },
                { label: 'Dias', key: 'dias', type: 'text', span: 1 },
                { label: 'Início', key: 'inicio', type: 'text', span: 1 },
                { label: 'Fim', key: 'fim', type: 'text', span: 1 },
                { label: 'Pronto', key: 'pronto', type: 'text', span: 1 },
                { label: 'Disp. Cmdo Geral', key: 'dispCmdo', type: 'text', span: 2 },
                { label: 'Observação', key: 'observacao', type: 'text', span: 2 },
              ].map(f => (
                <div key={f.key} className={f.span === 2 ? 'col-span-2' : ''}>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--adm-muted)' }}>{f.label}</label>
                  <input
                    type={f.type}
                    readOnly={abrMaiModal.mode === 'view'}
                    className="adm-input w-full px-3 py-2 rounded-lg border text-sm"
                    style={{ background: 'var(--adm-input)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                    value={(abrMaiForm as Record<string,unknown>)[f.key] as string}
                    onChange={e => abrMaiModal.mode !== 'view' && setAbrMaiForm(p => ({ ...p, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value }))}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 px-6 pb-5">
              <button onClick={() => setAbrMaiModal(null)} className="px-4 py-2 text-sm rounded-lg border" style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)' }}>
                {abrMaiModal.mode === 'view' ? 'Fechar' : 'Cancelar'}
              </button>
              {abrMaiModal.mode !== 'view' && (
                <button onClick={saveAbrMai} className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-cpe-red text-white hover:opacity-80 transition-opacity">
                  <Save size={14} /> Salvar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const SECAO_LABELS: Record<FeriasAbrilMaio['secao'], string> = {
  'retornam-abril': 'Retornam Abr/2026',
  'entram-maio':    'Entram Mai/2026',
  'lesp':           'LESP 2º Trim/2026',
};
