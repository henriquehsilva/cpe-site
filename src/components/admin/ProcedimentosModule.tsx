import { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  AlertCircle, ArrowLeft, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Download,
  Eye, FileJson, FileSpreadsheet, FileText, Pencil, Plus, Printer, Save, Search, Trash2, X,
} from 'lucide-react';
import { procedimentosDB, ProcedimentoItem, STATUS_PROCEDIMENTO } from '../../data/procedimentos';
import { ModulePermission } from '../../types/rbac';
import { usePersistentState } from '../../hooks/usePersistentState';

type SortKey = keyof Pick<ProcedimentoItem, 'numero' | 'assunto' | 'interessado' | 'status' | 'entrada' | 'prazo'>;
type SortDir = 'asc' | 'desc';
type ModalMode = 'view' | 'edit' | 'create';

const PAGE_SIZES = [10, 25, 50, 100];

const emptyForm = (): Omit<ProcedimentoItem, 'id'> => ({
  numero: '',
  assunto: '',
  interessado: '',
  status: 'Não iniciado',
  entrada: '',
  prazo: '',
  observacoes: '',
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

function parseDataBR(value: string): Date | null {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value.trim());
  if (!m) return null;
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  return isNaN(d.getTime()) ? null : d;
}

interface Props {
  onBack: () => void;
  permissions?: ModulePermission;
}

export default function ProcedimentosModule({ onBack, permissions }: Props) {
  const canCreate = !permissions || permissions.create;
  const canEdit = !permissions || permissions.edit;
  const canDelete = !permissions || permissions.delete;

  const [data, setData] = usePersistentState<ProcedimentoItem[]>('cpe-site:procedimentos:v1', procedimentosDB);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('numero');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [showExport, setShowExport] = useState(false);
  const [modal, setModal] = useState<{ mode: ModalMode; item: ProcedimentoItem | null } | null>(null);
  const [form, setForm] = useState<Omit<ProcedimentoItem, 'id'>>(emptyForm());
  const [errors, setErrors] = useState<{ numero?: string; assunto?: string }>({});
  const [deleteTarget, setDeleteTarget] = useState<ProcedimentoItem | null>(null);

  const indicadores = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const emAndamento = data.filter(d => d.status === 'Em andamento').length;
    const prazosVencidos = data.filter(d =>
      d.prazo && d.status !== 'Concluído' && d.status !== 'Arquivado' && (() => {
        const dt = parseDataBR(d.prazo);
        return dt !== null && dt.getTime() < hoje.getTime();
      })(),
    ).length;
    const aRevisar = data.filter(d => d.status === 'Não iniciado' || d.status === 'Aguardando despacho').length;
    return { total: data.length, emAndamento, prazosVencidos, aRevisar };
  }, [data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? data.filter(item => [
          item.numero,
          item.assunto,
          item.interessado,
          item.status,
          item.entrada,
          item.prazo,
          item.observacoes,
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
    if (key === 'numero' || key === 'assunto') {
      setErrors(current => ({ ...current, [key]: undefined }));
    }
  };

  const validate = () => {
    const next: typeof errors = {};
    if (!form.numero.trim()) next.numero = 'Número obrigatório';
    if (!form.assunto.trim()) next.assunto = 'Assunto obrigatório';
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

  const exportRows = filtered.map(item => ({
    Número: item.numero,
    Assunto: item.assunto,
    Interessado: item.interessado,
    Status: item.status,
    Entrada: item.entrada,
    Prazo: item.prazo,
    Observações: item.observacoes,
  }));

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
    const header = 'Número,Assunto,Interessado,Status,Entrada,Prazo,Observações';
    const rows = filtered.map(item => [
      item.numero,
      item.assunto,
      item.interessado,
      item.status,
      item.entrada,
      item.prazo,
      item.observacoes,
    ].map(csvCell).join(','));
    dl('procedimentos.csv', 'text/csv;charset=utf-8', `\uFEFF${header}\n${rows.join('\n')}`);
  };

  const exportJSON = () => dl('procedimentos.json', 'application/json', JSON.stringify(filtered, null, 2));

  const exportXLSX = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportRows);
    ws['!cols'] = [{ wch: 16 }, { wch: 48 }, { wch: 24 }, { wch: 18 }, { wch: 12 }, { wch: 12 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Procedimentos');
    XLSX.writeFile(wb, 'procedimentos.xlsx');
    setShowExport(false);
  };

  const exportPrint = () => {
    const rows = filtered.map(item => `
      <tr>
        <td>${html(item.numero)}</td><td>${html(item.assunto)}</td><td>${html(item.interessado)}</td>
        <td>${html(item.status)}</td><td>${html(item.entrada)}</td><td>${html(item.prazo)}</td><td>${html(item.observacoes)}</td>
      </tr>
    `).join('');
    const doc = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Controle de Procedimentos</title>
      <style>body{font-family:Arial,sans-serif;font-size:11px}table{width:100%;border-collapse:collapse}
      th,td{border:1px solid #ccc;padding:5px 7px;vertical-align:top}th{background:#333;color:#fff}
      h3{margin:0 0 10px}.meta{margin-bottom:12px;color:#555}</style></head><body>
      <h3>Controle de Procedimentos — 31ª CIPM-CPE</h3><div class="meta">${filtered.length} registros | Em andamento: ${indicadores.emAndamento} | Prazos vencidos: ${indicadores.prazosVencidos} | A revisar: ${indicadores.aRevisar}</div>
      <table><thead><tr><th>Número</th><th>Assunto</th><th>Interessado</th><th>Status</th><th>Entrada</th><th>Prazo</th><th>Observações</th></tr></thead>
      <tbody>${rows}</tbody></table></body></html>`;
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

  const IndicatorCard = ({ label, value }: { label: string; value: number }) => (
    <div className="flex-1 min-w-[130px] rounded-xl border px-4 py-3" style={{ borderColor: 'var(--adm-border)', background: 'var(--adm-surface)' }}>
      <div className="text-2xl font-bold tabular-nums" style={{ color: 'var(--adm-text)' }}>{value}</div>
      <div className="text-xs uppercase tracking-wide mt-0.5" style={{ color: 'var(--adm-muted)' }}>{label}</div>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <button onClick={onBack} className="flex items-center gap-1.5 transition-colors text-base font-medium" style={{ color: 'var(--adm-muted)' }}>
          <ArrowLeft size={17} /> Módulos
        </button>
        <span style={{ color: 'var(--adm-border)' }} className="hidden sm:block">|</span>
        <h3 className="font-bold text-2xl flex-1" style={{ color: 'var(--adm-text)' }}>Controle de Procedimentos</h3>
        <span className="text-base" style={{ color: 'var(--adm-muted)' }}>{filtered.length} registros</span>

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

      <div className="flex flex-wrap gap-3 mb-4">
        <IndicatorCard label="Procedimentos" value={indicadores.total} />
        <IndicatorCard label="Em andamento" value={indicadores.emAndamento} />
        <IndicatorCard label="Prazos vencidos" value={indicadores.prazosVencidos} />
        <IndicatorCard label="A revisar" value={indicadores.aRevisar} />
      </div>

      <div className="relative mb-4">
        <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--adm-muted)' }} />
        <input
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Buscar por número, assunto, interessado, status, datas ou observações..."
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
        <table className="w-full min-w-[980px]">
          <thead className="sticky top-0 z-10" style={{ background: 'var(--adm-tbl-head)' }}>
            <tr className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--adm-muted)' }}>
              <th className="px-4 py-3.5 text-left cursor-pointer select-none" onClick={() => toggleSort('numero')}>Número <SortIcon col="numero" /></th>
              <th className="px-4 py-3.5 text-left cursor-pointer select-none" onClick={() => toggleSort('assunto')}>Assunto <SortIcon col="assunto" /></th>
              <th className="px-4 py-3.5 text-left cursor-pointer select-none" onClick={() => toggleSort('interessado')}>Interessado <SortIcon col="interessado" /></th>
              <th className="px-4 py-3.5 text-left cursor-pointer select-none" onClick={() => toggleSort('status')}>Status <SortIcon col="status" /></th>
              <th className="px-4 py-3.5 text-left cursor-pointer select-none" onClick={() => toggleSort('entrada')}>Entrada <SortIcon col="entrada" /></th>
              <th className="px-4 py-3.5 text-left cursor-pointer select-none" onClick={() => toggleSort('prazo')}>Prazo <SortIcon col="prazo" /></th>
              <th className="px-4 py-3.5 text-center w-32">Ações</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((item, i) => (
              <tr key={item.id} className="adm-row border-t transition-colors" style={{ borderColor: 'var(--adm-border)', background: i % 2 === 0 ? 'var(--adm-row-even)' : 'transparent' }}>
                <td className="px-4 py-3.5 text-base tabular-nums whitespace-nowrap font-semibold" style={{ color: 'var(--adm-text)' }}>{item.numero}</td>
                <td className="px-4 py-3.5 text-base min-w-[320px]" style={{ color: 'var(--adm-text)' }}>{item.assunto}</td>
                <td className="px-4 py-3.5 text-base whitespace-nowrap" style={{ color: 'var(--adm-muted)' }}>{item.interessado}</td>
                <td className="px-4 py-3.5 text-base whitespace-nowrap" style={{ color: 'var(--adm-muted)' }}>{item.status}</td>
                <td className="px-4 py-3.5 text-base whitespace-nowrap tabular-nums" style={{ color: 'var(--adm-subtle)' }}>{item.entrada || '-'}</td>
                <td className="px-4 py-3.5 text-base whitespace-nowrap tabular-nums" style={{ color: item.prazo ? 'var(--adm-subtle)' : 'var(--adm-subtle)' }}>{item.prazo || '-'}</td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => openView(item)} title="Visualizar" className="p-2 rounded-lg transition-colors hover:bg-blue-400/10 text-blue-400 opacity-70 hover:opacity-100"><Eye size={17} /></button>
                    {canEdit && <button onClick={() => openEdit(item)} title="Editar" className="p-2 rounded-lg transition-colors hover:bg-amber-400/10 text-amber-400 opacity-70 hover:opacity-100"><Pencil size={17} /></button>}
                    {canDelete && <button onClick={() => setDeleteTarget(item)} title="Remover" className="p-2 rounded-lg transition-colors hover:bg-cpe-red/10 text-cpe-red opacity-70 hover:opacity-100"><Trash2 size={17} /></button>}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-20 text-center text-lg" style={{ color: 'var(--adm-subtle)' }}>Nenhum resultado encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border px-4 py-3" style={{ borderColor: 'var(--adm-border)', background: 'var(--adm-surface)' }}>
        <div className="text-sm" style={{ color: 'var(--adm-muted)' }}>
          Mostrando <span className="font-semibold" style={{ color: 'var(--adm-text)' }}>{pageStart}-{pageEnd}</span> de <span className="font-semibold" style={{ color: 'var(--adm-text)' }}>{filtered.length}</span> registros
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
          <div className="w-full max-w-3xl rounded-2xl shadow-2xl border" style={{ background: 'var(--adm-modal)', borderColor: 'var(--adm-border)' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--adm-border)' }}>
              <h4 className="font-bold text-xl" style={{ color: 'var(--adm-text)' }}>{modal.mode === 'create' ? 'Novo Procedimento' : modal.mode === 'edit' ? 'Editar Registro' : 'Visualizar Registro'}</h4>
              <button onClick={() => setModal(null)} className="transition-colors" style={{ color: 'var(--adm-muted)' }}><X size={22} /></button>
            </div>

            <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Número</label>
                <input value={form.numero} onChange={e => changeField('numero', e.target.value)} readOnly={isRO} className={inputCls(errors.numero)} style={isRO ? roStyle : { ...fieldStyle, ...(errors.numero ? { borderColor: '#ef4444' } : {}) }} />
                {errors.numero && <p className="text-sm mt-1 text-red-400 flex items-center gap-1"><AlertCircle size={13} /> {errors.numero}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Status</label>
                {isRO ? (
                  <input value={form.status} readOnly className={inputCls()} style={roStyle} />
                ) : (
                  <select value={form.status} onChange={e => changeField('status', e.target.value)} className={inputCls()} style={fieldStyle}>
                    {STATUS_PROCEDIMENTO.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                )}
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Assunto</label>
                <input value={form.assunto} onChange={e => changeField('assunto', e.target.value)} readOnly={isRO} className={inputCls(errors.assunto)} style={isRO ? roStyle : { ...fieldStyle, ...(errors.assunto ? { borderColor: '#ef4444' } : {}) }} />
                {errors.assunto && <p className="text-sm mt-1 text-red-400 flex items-center gap-1"><AlertCircle size={13} /> {errors.assunto}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Interessado</label>
                <input value={form.interessado} onChange={e => changeField('interessado', e.target.value)} readOnly={isRO} className={inputCls()} style={isRO ? roStyle : fieldStyle} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Entrada</label>
                <input value={form.entrada} onChange={e => changeField('entrada', e.target.value)} readOnly={isRO} placeholder="dd/mm/aaaa" className={inputCls()} style={isRO ? roStyle : fieldStyle} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Prazo</label>
                <input value={form.prazo} onChange={e => changeField('prazo', e.target.value)} readOnly={isRO} placeholder="dd/mm/aaaa" className={inputCls()} style={isRO ? roStyle : fieldStyle} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Observações</label>
                <textarea value={form.observacoes} onChange={e => changeField('observacoes', e.target.value)} readOnly={isRO} rows={4} className="adm-input w-full rounded-lg px-3 py-2.5 text-base border resize-none" style={isRO ? roStyle : fieldStyle} />
              </div>
            </div>

            {!isRO && (
              <div className="flex justify-end gap-3 px-6 pb-5">
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
            <p className="text-base mb-6" style={{ color: 'var(--adm-muted)' }}>Deseja remover o procedimento <span className="font-semibold" style={{ color: 'var(--adm-text)' }}>{deleteTarget.numero}</span>?</p>
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
