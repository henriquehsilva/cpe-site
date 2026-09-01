import { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  AlertCircle, ArrowLeft, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Download,
  Eye, FileJson, FileSpreadsheet, FileText, Pencil, Plus, Printer, Save, Search, Trash2, X,
} from 'lucide-react';
import { procedimentosDB, ProcedimentoItem, STATUS_PROCEDIMENTO, TIPO_PROCEDIMENTO } from '../../data/procedimentos';
import { ModulePermission } from '../../types/rbac';
import { usePersistentState } from '../../hooks/usePersistentState';

type SortKey = keyof Pick<ProcedimentoItem, 'sei' | 'tipo' | 'numero' | 'dataAbertura' | 'prazoDias' | 'status' | 'responsavelInterno' | 'sindicante'>;
type SortDir = 'asc' | 'desc';
type ModalMode = 'view' | 'edit' | 'create';

const PAGE_SIZES = [10, 25, 50, 100];

interface Derived {
  dataLimite: string;
  diasRestantes: number | null;
  situacao: string;
  qualidade: string;
}

function parseDataBR(value: string): Date | null {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec((value ?? '').trim());
  if (!m) return null;
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  return isNaN(d.getTime()) ? null : d;
}

function formatDataBR(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function derivar(item: ProcedimentoItem): Derived {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  if (!item.dataAbertura || !item.prazoDias) {
    return { dataLimite: '', diasRestantes: null, situacao: 'Sem prazo', qualidade: 'Abertura ausente' };
  }
  const a = parseDataBR(item.dataAbertura);
  if (!a) return { dataLimite: '', diasRestantes: null, situacao: 'Sem prazo', qualidade: 'Abertura ausente' };
  const limite = new Date(a);
  limite.setDate(limite.getDate() + Number(item.prazoDias));
  const diff = Math.round((limite.getTime() - hoje.getTime()) / 86400000);
  return {
    dataLimite: formatDataBR(limite),
    diasRestantes: diff,
    situacao: diff < 0 ? 'Vencido' : 'No prazo',
    qualidade: '',
  };
}

const emptyForm = (): Omit<ProcedimentoItem, 'id'> => ({
  sei: '',
  tipo: 'SINDICANCIA',
  numero: '',
  dataAbertura: '',
  prazoDias: 0,
  status: 'Não iniciado',
  responsavelInterno: '',
  sindicante: '',
  envolvidos: '',
  rai: '',
  portariaInicial: '',
  assunto: '',
  orgaoDestino: '',
  dataConclusao: '',
  observacoes: '',
  qtdPublicacoes: 0,
  qtdPortarias: 0,
  checklistPendente: false,
});

function csvCell(value: string | number | null) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function html(value: string | number | null) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

interface Props {
  onBack: () => void;
  permissions?: ModulePermission;
}

export default function ProcedimentosModule({ onBack, permissions }: Props) {
  const canCreate = !permissions || permissions.create;
  const canEdit = !permissions || permissions.edit;
  const canDelete = !permissions || permissions.delete;

  const [data, setData] = usePersistentState<ProcedimentoItem[]>('cpe-site:procedimentos:v4', procedimentosDB);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('sei');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [showExport, setShowExport] = useState(false);
  const [modal, setModal] = useState<{ mode: ModalMode; item: ProcedimentoItem | null } | null>(null);
  const [form, setForm] = useState<Omit<ProcedimentoItem, 'id'>>(emptyForm());
  const [errors, setErrors] = useState<{ sei?: string; tipo?: string; prazoDias?: string; status?: string }>({});
  const [deleteTarget, setDeleteTarget] = useState<ProcedimentoItem | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? data.filter(item => [
          item.sei, item.tipo, item.numero, item.dataAbertura, item.status,
          item.responsavelInterno, item.sindicante, item.envolvidos, item.rai,
          item.portariaInicial, item.assunto, item.orgaoDestino, item.observacoes,
        ].some(value => String(value).toLowerCase().includes(q)))
      : [...data];

    return list.sort((a, b) => {
      const av = a[sortKey] ?? '';
      const bv = b[sortKey] ?? '';
      const cmp = typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv), 'pt-BR', { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const pageEnd = Math.min(safePage * pageSize, filtered.length);
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const toggleSort = (key: SortKey) => {
    setPage(1);
    if (sortKey === key) setSortDir(dir => (dir === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const changeField = (key: keyof Omit<ProcedimentoItem, 'id'>, value: string) => {
    setForm(current => ({ ...current, [key]: value }));
    if (key in errors) setErrors(current => ({ ...current, [key]: undefined }));
  };

  const changeNumber = (key: 'prazoDias' | 'qtdPublicacoes' | 'qtdPortarias', value: string) => {
    setForm(current => ({ ...current, [key]: Math.max(0, Number(value) || 0) }));
  };

  const changeFlag = (key: 'checklistPendente', value: boolean) => {
    setForm(current => ({ ...current, [key]: value }));
  };

  const validate = () => {
    const next: typeof errors = {};
    if (!form.sei.trim()) next.sei = 'SEI obrigatório';
    if (!form.tipo.trim()) next.tipo = 'Tipo obrigatório';
    if (!form.prazoDias || form.prazoDias <= 0) next.prazoDias = 'Prazo (dias) obrigatório';
    if (!form.status.trim()) next.status = 'Status obrigatório';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const openCreate = () => {
    setForm(emptyForm());
    setErrors({});
    setModal({ mode: 'create', item: null });
  };

  const openView = (item: ProcedimentoItem) => {
    setForm(item);
    setErrors({});
    setModal({ mode: 'view', item });
  };

  const openEdit = (item: ProcedimentoItem) => {
    setForm(item);
    setErrors({});
    setModal({ mode: 'edit', item });
  };

  const handleSave = () => {
    if (!validate()) return;
    if (modal?.mode === 'create') {
      setData(current => [{ ...form, id: `proc-${Date.now()}` }, ...current]);
    } else if (modal?.mode === 'edit' && modal.item) {
      setData(current => current.map(item => (item.id === modal.item?.id ? { ...form, id: item.id } : item)));
    }
    setModal(null);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setData(current => current.filter(item => item.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const exportRows = filtered.map(item => {
    const d = derivar(item);
    return {
      SEI: item.sei,
      Tipo: item.tipo,
      'Nº procedimento': item.numero,
      'Data de abertura': item.dataAbertura,
      'Prazo (dias)': item.prazoDias,
      'Data limite': d.dataLimite,
      Status: item.status,
      'Responsável interno': item.responsavelInterno,
      'Sindicante / Encarregado': item.sindicante,
      Envolvidos: item.envolvidos,
      RAI: item.rai,
      'Portaria inicial': item.portariaInicial,
      'Assunto / Categoria': item.assunto,
      'Órgão / Destino': item.orgaoDestino,
      'Data de conclusão': item.dataConclusao,
      Observações: item.observacoes,
      'Dias restantes': d.diasRestantes ?? '',
      'Situação do prazo': d.situacao,
      'Qtd. publicações': item.qtdPublicacoes,
      'Qtd. portarias': item.qtdPortarias,
      'Checklist pendente': item.checklistPendente ? 'Sim' : 'Não',
      Qualidade: d.qualidade,
    };
  });

  const dl = (filename: string, type: string, content: string) => {
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([content], { type })),
      download: filename,
    });
    a.click();
    URL.revokeObjectURL(a.href);
    setShowExport(false);
  };

  const exportCSV = () => {
    const header = [
      'SEI', 'Tipo', 'Nº procedimento', 'Data de abertura', 'Prazo (dias)', 'Data limite', 'Status',
      'Responsável interno', 'Sindicante / Encarregado', 'Envolvidos', 'RAI', 'Portaria inicial',
      'Assunto / Categoria', 'Órgão / Destino', 'Data de conclusão', 'Observações', 'Dias restantes',
      'Situação do prazo', 'Qtd. publicações', 'Qtd. portarias', 'Checklist pendente', 'Qualidade',
    ].join(',');
    const rows = filtered.map(item => {
      const d = derivar(item);
      return [
        item.sei, item.tipo, item.numero, item.dataAbertura, item.prazoDias, d.dataLimite, item.status,
        item.responsavelInterno, item.sindicante, item.envolvidos, item.rai, item.portariaInicial,
        item.assunto, item.orgaoDestino, item.dataConclusao, item.observacoes, d.diasRestantes ?? '',
        d.situacao, item.qtdPublicacoes, item.qtdPortarias, item.checklistPendente ? 'Sim' : 'Não', d.qualidade,
      ].map(csvCell).join(',');
    });
    dl('procedimentos.csv', 'text/csv;charset=utf-8', `\uFEFF${header}\n${rows.join('\n')}`);
  };

  const exportJSON = () => dl('procedimentos.json', 'application/json', JSON.stringify(filtered, null, 2));

  const exportXLSX = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportRows);
    XLSX.utils.book_append_sheet(wb, ws, 'Procedimentos');
    XLSX.writeFile(wb, 'procedimentos.xlsx');
    setShowExport(false);
  };

  const exportPrint = () => {
    const head = ['SEI', 'Tipo', 'Nº', 'Abertura', 'Prazo', 'Limite', 'Status', 'Responsável', 'Sindicante', 'Situação'];
    const rows = filtered.map(item => {
      const d = derivar(item);
      return `<tr><td>${html(item.sei)}</td><td>${html(item.tipo)}</td><td>${html(item.numero)}</td><td>${html(item.dataAbertura)}</td><td>${html(item.prazoDias)}</td><td>${html(d.dataLimite)}</td><td>${html(item.status)}</td><td>${html(item.responsavelInterno)}</td><td>${html(item.sindicante)}</td><td>${html(d.situacao)}</td></tr>`;
    }).join('');
    const doc = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Procedimentos</title>
      <style>body{font-family:Arial,sans-serif;font-size:11px}table{width:100%;border-collapse:collapse}
      th,td{border:1px solid #ccc;padding:5px 7px;vertical-align:top}th{background:#333;color:#fff}
      h3{margin:0 0 10px}</style></head><body>
      <h3>Procedimentos — Cadastro Principal</h3>
      <table><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></body></html>`;
    const blob = new Blob([doc], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, '_blank');
    if (w) w.addEventListener('load', () => { w.print(); URL.revokeObjectURL(url); });
    setShowExport(false);
  };

  const SortIcon = ({ col }: { col: SortKey }) =>
    sortKey === col
      ? sortDir === 'asc'
        ? <ChevronUp size={13} className="inline ml-1" />
        : <ChevronDown size={13} className="inline ml-1" />
      : <ChevronUp size={13} className="inline ml-1 opacity-20" />;

  const isRO = modal?.mode === 'view';
  const fieldStyle = { background: 'var(--adm-input)', color: 'var(--adm-text)', border: '1px solid var(--adm-border)' };
  const roStyle = { ...fieldStyle, opacity: 0.65 };
  const inputCls = (err?: string) => `adm-input w-full rounded-lg px-3 py-2.5 text-base border transition-colors ${err ? 'border-cpe-red/70' : ''}`;

  const cellSelect = (value: string, options: string[], onChange: (v: string) => void, ro: boolean) =>
    ro
      ? <input value={value} readOnly className={inputCls()} style={roStyle} />
      : <select value={value} onChange={e => onChange(e.target.value)} className={inputCls()} style={fieldStyle}>{options.map(o => <option key={o} value={o}>{o}</option>)}</select>;

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <button onClick={onBack} className="flex items-center gap-1.5 transition-colors text-base font-medium" style={{ color: 'var(--adm-muted)' }}>
          <ArrowLeft size={17} /> Módulos
        </button>
        <span style={{ color: 'var(--adm-border)' }} className="hidden sm:block">|</span>
        <h3 className="font-bold text-2xl flex-1" style={{ color: 'var(--adm-text)' }}>Procedimentos — Cadastro Principal</h3>
        <span className="text-base" style={{ color: 'var(--adm-muted)' }}>{filtered.length} procedimentos</span>

        <div className="relative">
          <button onClick={() => setShowExport(v => !v)} className="flex items-center gap-2 border rounded-lg px-4 py-2 text-base font-medium transition-colors" style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)', background: 'var(--adm-input)' }}>
            <Download size={16} /> Exportar
          </button>
          {showExport && (
            <div className="absolute right-0 top-full mt-1 rounded-xl shadow-2xl z-20 w-52 py-1.5 overflow-hidden" style={{ background: 'var(--adm-dropdown)', border: '1px solid var(--adm-border)' }}>
              <button onClick={exportCSV} className="adm-drop-item flex items-center gap-3 w-full px-4 py-3 text-base transition-colors" style={{ color: 'var(--adm-text)' }}><FileText size={16} className="text-emerald-400" /> CSV</button>
              <button onClick={exportJSON} className="adm-drop-item flex items-center gap-3 w-full px-4 py-3 text-base transition-colors" style={{ color: 'var(--adm-text)' }}><FileJson size={16} className="text-blue-400" /> JSON</button>
              <button onClick={exportXLSX} className="adm-drop-item flex items-center gap-3 w-full px-4 py-3 text-base transition-colors" style={{ color: 'var(--adm-text)' }}><FileSpreadsheet size={16} className="text-emerald-500" /> Excel</button>
              <button onClick={exportPrint} className="adm-drop-item flex items-center gap-3 w-full px-4 py-3 text-base transition-colors" style={{ color: 'var(--adm-text)' }}><Printer size={16} style={{ color: 'var(--adm-muted)' }} /> Imprimir / PDF</button>
            </div>
          )}
        </div>

        {canCreate && (
          <button onClick={openCreate} className="flex items-center gap-2 bg-cpe-red hover:bg-cpe-red/80 text-white text-base font-semibold px-4 py-2 rounded-lg transition-colors">
            <Plus size={16} /> Novo Registro
          </button>
        )}
      </div>

      <div className="relative mb-4">
        <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--adm-muted)' }} />
        <input
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Buscar por SEI, tipo, número, status, responsável, sindicante..."
          className="adm-input w-full rounded-xl pl-10 pr-10 py-3 text-base border"
          style={fieldStyle}
        />
        {search && (
          <button onClick={() => { setSearch(''); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors" style={{ color: 'var(--adm-muted)' }}>
            <X size={16} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-auto rounded-xl border" style={{ borderColor: 'var(--adm-border)' }}>
        <table className="w-full min-w-[1180px]">
          <thead className="sticky top-0 z-10" style={{ background: 'var(--adm-tbl-head)' }}>
            <tr className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--adm-muted)' }}>
              <th className="px-4 py-3.5 text-left cursor-pointer select-none" onClick={() => toggleSort('sei')}>SEI <SortIcon col="sei" /></th>
              <th className="px-4 py-3.5 text-left cursor-pointer select-none" onClick={() => toggleSort('tipo')}>Tipo <SortIcon col="tipo" /></th>
              <th className="px-4 py-3.5 text-left cursor-pointer select-none" onClick={() => toggleSort('numero')}>Nº <SortIcon col="numero" /></th>
              <th className="px-4 py-3.5 text-left cursor-pointer select-none" onClick={() => toggleSort('dataAbertura')}>Abertura <SortIcon col="dataAbertura" /></th>
              <th className="px-4 py-3.5 text-right cursor-pointer select-none" onClick={() => toggleSort('prazoDias')}>Prazo <SortIcon col="prazoDias" /></th>
              <th className="px-4 py-3.5 text-left cursor-pointer select-none" onClick={() => toggleSort('status')}>Status <SortIcon col="status" /></th>
              <th className="px-4 py-3.5 text-left cursor-pointer select-none" onClick={() => toggleSort('responsavelInterno')}>Responsável <SortIcon col="responsavelInterno" /></th>
              <th className="px-4 py-3.5 text-left cursor-pointer select-none" onClick={() => toggleSort('sindicante')}>Sindicante <SortIcon col="sindicante" /></th>
              <th className="px-4 py-3.5 text-center w-32">Ações</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((item, i) => {
              const d = derivar(item);
              return (
                <tr key={item.id} className="adm-row border-t transition-colors" style={{ borderColor: 'var(--adm-border)', background: i % 2 === 0 ? 'var(--adm-row-even)' : 'transparent' }}>
                  <td className="px-4 py-3.5 text-base tabular-nums whitespace-nowrap font-semibold" style={{ color: 'var(--adm-text)' }}>{item.sei}</td>
                  <td className="px-4 py-3.5 text-base whitespace-nowrap" style={{ color: 'var(--adm-muted)' }}>{item.tipo}</td>
                  <td className="px-4 py-3.5 text-base whitespace-nowrap" style={{ color: 'var(--adm-subtle)' }}>{item.numero || '-'}</td>
                  <td className="px-4 py-3.5 text-base whitespace-nowrap tabular-nums" style={{ color: 'var(--adm-subtle)' }}>{item.dataAbertura || '-'}</td>
                  <td className="px-4 py-3.5 text-base text-right tabular-nums" style={{ color: 'var(--adm-text)' }}>{item.prazoDias}</td>
                  <td className="px-4 py-3.5 text-base whitespace-nowrap" style={{ color: 'var(--adm-muted)' }}>{item.status}</td>
                  <td className="px-4 py-3.5 text-base whitespace-nowrap" style={{ color: 'var(--adm-muted)' }}>{item.responsavelInterno}</td>
                  <td className="px-4 py-3.5 text-base whitespace-nowrap" style={{ color: 'var(--adm-muted)' }}>{item.sindicante}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openView(item)} title="Visualizar" className="p-2 rounded-lg transition-colors hover:bg-blue-400/10 text-blue-400 opacity-70 hover:opacity-100"><Eye size={17} /></button>
                      {canEdit && <button onClick={() => openEdit(item)} title="Editar" className="p-2 rounded-lg transition-colors hover:bg-amber-400/10 text-amber-400 opacity-70 hover:opacity-100"><Pencil size={17} /></button>}
                      {canDelete && <button onClick={() => setDeleteTarget(item)} title="Remover" className="p-2 rounded-lg transition-colors hover:bg-cpe-red/10 text-cpe-red opacity-70 hover:opacity-100"><Trash2 size={17} /></button>}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-20 text-center text-lg" style={{ color: 'var(--adm-subtle)' }}>Nenhum resultado encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border px-4 py-3" style={{ borderColor: 'var(--adm-border)', background: 'var(--adm-surface)' }}>
        <div className="text-sm" style={{ color: 'var(--adm-muted)' }}>
          Mostrando <span className="font-semibold" style={{ color: 'var(--adm-text)' }}>{pageStart}-{pageEnd}</span> de <span className="font-semibold" style={{ color: 'var(--adm-text)' }}>{filtered.length}</span> procedimentos
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--adm-muted)' }}>
            Por página
            <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }} className="adm-input rounded-lg px-2.5 py-2 text-sm border" style={fieldStyle}>
              {PAGE_SIZES.map(size => <option key={size} value={size}>{size}</option>)}
            </select>
          </label>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(current => Math.max(1, current - 1))} disabled={safePage <= 1} className="p-2 rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed" style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)', background: 'var(--adm-input)' }} title="Página anterior"><ChevronLeft size={17} /></button>
            <span className="min-w-[92px] text-center text-sm" style={{ color: 'var(--adm-muted)' }}>Página <span className="font-semibold" style={{ color: 'var(--adm-text)' }}>{safePage}</span> de {totalPages}</span>
            <button onClick={() => setPage(current => Math.min(totalPages, current + 1))} disabled={safePage >= totalPages} className="p-2 rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed" style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)', background: 'var(--adm-input)' }} title="Próxima página"><ChevronRight size={17} /></button>
          </div>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl rounded-2xl shadow-2xl border max-h-[90vh] flex flex-col overflow-hidden" style={{ background: 'var(--adm-modal)', borderColor: 'var(--adm-border)' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: 'var(--adm-border)' }}>
              <h4 className="font-bold text-xl" style={{ color: 'var(--adm-text)' }}>{modal.mode === 'create' ? 'Novo Procedimento' : modal.mode === 'edit' ? 'Editar Registro' : 'Visualizar Registro'}</h4>
              <button onClick={() => setModal(null)} className="transition-colors" style={{ color: 'var(--adm-muted)' }}><X size={22} /></button>
            </div>

            <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-3 gap-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>SEI *</label>
                <input value={form.sei} onChange={e => changeField('sei', e.target.value)} readOnly={isRO} className={inputCls(errors.sei)} style={isRO ? roStyle : { ...fieldStyle, ...(errors.sei ? { borderColor: '#ef4444' } : {}) }} />
                {errors.sei && <p className="text-sm mt-1 text-red-400 flex items-center gap-1"><AlertCircle size={13} /> {errors.sei}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Tipo *</label>
                {cellSelect(form.tipo, TIPO_PROCEDIMENTO, v => changeField('tipo', v), isRO)}
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Nº procedimento</label>
                <input value={form.numero} onChange={e => changeField('numero', e.target.value)} readOnly={isRO} className={inputCls()} style={isRO ? roStyle : fieldStyle} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Data de abertura</label>
                <input value={form.dataAbertura} onChange={e => changeField('dataAbertura', e.target.value)} readOnly={isRO} placeholder="dd/mm/aaaa" className={inputCls()} style={isRO ? roStyle : fieldStyle} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Prazo (dias) *</label>
                <input type="number" min={0} value={form.prazoDias} onChange={e => changeNumber('prazoDias', e.target.value)} readOnly={isRO} className={inputCls(errors.prazoDias)} style={isRO ? roStyle : { ...fieldStyle, ...(errors.prazoDias ? { borderColor: '#ef4444' } : {}) }} />
                {errors.prazoDias && <p className="text-sm mt-1 text-red-400 flex items-center gap-1"><AlertCircle size={13} /> {errors.prazoDias}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Status *</label>
                {cellSelect(form.status, STATUS_PROCEDIMENTO, v => changeField('status', v), isRO)}
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Responsável interno</label>
                <input value={form.responsavelInterno} onChange={e => changeField('responsavelInterno', e.target.value)} readOnly={isRO} className={inputCls()} style={isRO ? roStyle : fieldStyle} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Sindicante / Encarregado</label>
                <input value={form.sindicante} onChange={e => changeField('sindicante', e.target.value)} readOnly={isRO} className={inputCls()} style={isRO ? roStyle : fieldStyle} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Envolvidos</label>
                <input value={form.envolvidos} onChange={e => changeField('envolvidos', e.target.value)} readOnly={isRO} className={inputCls()} style={isRO ? roStyle : fieldStyle} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>RAI</label>
                <input value={form.rai} onChange={e => changeField('rai', e.target.value)} readOnly={isRO} className={inputCls()} style={isRO ? roStyle : fieldStyle} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Portaria inicial</label>
                <input value={form.portariaInicial} onChange={e => changeField('portariaInicial', e.target.value)} readOnly={isRO} className={inputCls()} style={isRO ? roStyle : fieldStyle} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Assunto / Categoria</label>
                <input value={form.assunto} onChange={e => changeField('assunto', e.target.value)} readOnly={isRO} className={inputCls()} style={isRO ? roStyle : fieldStyle} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Órgão / Destino</label>
                <input value={form.orgaoDestino} onChange={e => changeField('orgaoDestino', e.target.value)} readOnly={isRO} className={inputCls()} style={isRO ? roStyle : fieldStyle} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Data de conclusão</label>
                <input value={form.dataConclusao} onChange={e => changeField('dataConclusao', e.target.value)} readOnly={isRO} placeholder="dd/mm/aaaa" className={inputCls()} style={isRO ? roStyle : fieldStyle} />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Observações</label>
                <textarea value={form.observacoes} onChange={e => changeField('observacoes', e.target.value)} readOnly={isRO} rows={3} className="adm-input w-full rounded-lg px-3 py-2.5 text-base border resize-none" style={isRO ? roStyle : fieldStyle} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Qtd. publicações</label>
                <input type="number" min={0} value={form.qtdPublicacoes} onChange={e => changeNumber('qtdPublicacoes', e.target.value)} readOnly={isRO} className={inputCls()} style={isRO ? roStyle : fieldStyle} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Qtd. portarias</label>
                <input type="number" min={0} value={form.qtdPortarias} onChange={e => changeNumber('qtdPortarias', e.target.value)} readOnly={isRO} className={inputCls()} style={isRO ? roStyle : fieldStyle} />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-base" style={{ color: 'var(--adm-text)' }}>
                  <input type="checkbox" checked={form.checklistPendente} disabled={isRO} onChange={e => changeFlag('checklistPendente', e.target.checked)} style={{ accentColor: '#ef4444' }} /> Checklist pendente
                </label>
              </div>
              {!isRO && (
                (() => {
                  const d = derivar(form as ProcedimentoItem);
                  return (
                    <div className="sm:col-span-3 text-xs" style={{ color: 'var(--adm-muted)' }}>
                      Automático — Data limite: <span className="font-semibold" style={{ color: 'var(--adm-text)' }}>{d.dataLimite || '—'}</span> · Dias restantes: <span className="font-semibold" style={{ color: 'var(--adm-text)' }}>{d.diasRestantes ?? '—'}</span> · Situação: <span className="font-semibold" style={{ color: 'var(--adm-text)' }}>{d.situacao}</span>{d.qualidade ? ` · ${d.qualidade}` : ''}
                    </div>
                  );
                })()
              )}
            </div>

            {!isRO && (
              <div className="flex justify-end gap-3 px-6 pb-5 flex-shrink-0">
                <button onClick={() => setModal(null)} className="px-5 py-2.5 text-base rounded-lg border transition-colors" style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)', background: 'transparent' }}>Cancelar</button>
                <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 text-base font-semibold text-white bg-cpe-red hover:bg-cpe-red/80 rounded-lg transition-colors"><Save size={16} /> Salvar</button>
              </div>
            )}
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl shadow-2xl border p-6" style={{ background: 'var(--adm-modal)', borderColor: 'var(--adm-border)' }}>
            <h4 className="font-bold text-xl mb-2" style={{ color: 'var(--adm-text)' }}>Confirmar remoção</h4>
            <p className="text-base mb-6" style={{ color: 'var(--adm-muted)' }}>Deseja remover o procedimento <span className="font-semibold" style={{ color: 'var(--adm-text)' }}>{deleteTarget.sei}</span>?</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteTarget(null)} className="px-5 py-2.5 text-base rounded-lg border transition-colors" style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)', background: 'transparent' }}>Cancelar</button>
              <button onClick={handleDelete} className="flex items-center gap-2 px-5 py-2.5 text-base font-semibold text-white bg-cpe-red hover:bg-cpe-red/80 rounded-lg transition-colors"><Trash2 size={16} /> Remover</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
