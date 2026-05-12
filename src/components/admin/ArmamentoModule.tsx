import { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  AlertCircle, ArrowLeft, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Download, Eye, FileJson,
  FileSpreadsheet, FileText, Pencil, Plus, Printer, Save, Search, Trash2, X,
} from 'lucide-react';
import {
  armamentoDB, ArmamentoCategoria, ArmamentoItem, ARMAMENTO_CATEGORIAS,
} from '../../data/armamento';
import { ModulePermission } from '../../types/rbac';

type SortKey = keyof Pick<ArmamentoItem, 'categoria' | 'tombamento' | 'estado' | 'quantidade' | 'especificacao' | 'localizacao'>;
type SortDir = 'asc' | 'desc';
type ModalMode = 'view' | 'edit' | 'create';
type CategoriaFilter = 'Todas' | ArmamentoCategoria;

const PAGE_SIZES = [25, 50, 100, 200];

const emptyForm = (): Omit<ArmamentoItem, 'id'> => ({
  categoria: 'Material Bélico',
  tombamento: '',
  estado: 'NOVO',
  quantidade: 1,
  especificacao: '',
  valor: '0,00',
  localizacao: '',
});

function csvCell(value: string | number) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function html(value: string | number) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

interface Props {
  onBack: () => void;
  permissions?: ModulePermission;
}

export default function ArmamentoModule({ onBack, permissions }: Props) {
  const canCreate = !permissions || permissions.create;
  const canEdit = !permissions || permissions.edit;
  const canDelete = !permissions || permissions.delete;

  const [data, setData] = useState<ArmamentoItem[]>(armamentoDB);
  const [search, setSearch] = useState('');
  const [categoria, setCategoria] = useState<CategoriaFilter>('Todas');
  const [sortKey, setSortKey] = useState<SortKey>('categoria');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [showExport, setShowExport] = useState(false);
  const [modal, setModal] = useState<{ mode: ModalMode; item: ArmamentoItem | null } | null>(null);
  const [form, setForm] = useState<Omit<ArmamentoItem, 'id'>>(emptyForm());
  const [errors, setErrors] = useState<{ especificacao?: string; quantidade?: string }>({});
  const [deleteTarget, setDeleteTarget] = useState<ArmamentoItem | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = data.filter(item => {
      const matchCategoria = categoria === 'Todas' || item.categoria === categoria;
      const matchSearch = !q || [
        item.categoria,
        item.tombamento,
        item.estado,
        item.especificacao,
        item.valor,
        item.localizacao,
      ].some(value => value.toLowerCase().includes(q));
      return matchCategoria && matchSearch;
    });

    return list.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp = typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv), 'pt-BR', { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, search, categoria, sortKey, sortDir]);

  const totalQuantidade = filtered.reduce((sum, item) => sum + item.quantidade, 0);
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

  const changeField = (key: keyof Omit<ArmamentoItem, 'id'>, value: string) => {
    setForm(current => ({
      ...current,
      [key]: key === 'quantidade' ? Math.max(0, Number(value) || 0) : value,
    }));
    if (key === 'especificacao' || key === 'quantidade') {
      setErrors(current => ({ ...current, [key]: undefined }));
    }
  };

  const validate = () => {
    const next: typeof errors = {};
    if (!form.especificacao.trim()) next.especificacao = 'Especificação obrigatória';
    if (form.quantidade <= 0) next.quantidade = 'Quantidade deve ser maior que zero';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const openCreate = () => {
    setForm(emptyForm());
    setErrors({});
    setModal({ mode: 'create', item: null });
  };

  const openView = (item: ArmamentoItem) => {
    setForm(item);
    setErrors({});
    setModal({ mode: 'view', item });
  };

  const openEdit = (item: ArmamentoItem) => {
    setForm(item);
    setErrors({});
    setModal({ mode: 'edit', item });
  };

  const handleSave = () => {
    if (!validate()) return;
    if (modal?.mode === 'create') {
      setData(current => [{ ...form, id: `armamento-${Date.now()}` }, ...current]);
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
    Categoria: item.categoria,
    Tombamento: item.tombamento,
    'Estado de Conservação': item.estado,
    Quantidade: item.quantidade,
    Especificação: item.especificacao,
    Valor: item.valor,
    Localização: item.localizacao,
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
    const header = 'Categoria,Tombamento,Estado de Conservação,Quantidade,Especificação,Valor,Localização';
    const rows = filtered.map(item => [
      item.categoria,
      item.tombamento,
      item.estado,
      item.quantidade,
      item.especificacao,
      item.valor,
      item.localizacao,
    ].map(csvCell).join(','));
    dl('armamento.csv', 'text/csv;charset=utf-8', `\uFEFF${header}\n${rows.join('\n')}`);
  };

  const exportJSON = () => dl('armamento.json', 'application/json', JSON.stringify(filtered, null, 2));

  const exportXLSX = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportRows);
    ws['!cols'] = [{ wch: 18 }, { wch: 16 }, { wch: 22 }, { wch: 12 }, { wch: 72 }, { wch: 12 }, { wch: 28 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Armamento');
    XLSX.writeFile(wb, 'armamento.xlsx');
    setShowExport(false);
  };

  const exportPrint = () => {
    const rows = filtered.map(item => `
      <tr>
        <td>${html(item.categoria)}</td>
        <td>${html(item.tombamento)}</td>
        <td>${html(item.estado)}</td>
        <td>${html(item.quantidade)}</td>
        <td>${html(item.especificacao)}</td>
        <td>${html(item.valor)}</td>
        <td>${html(item.localizacao)}</td>
      </tr>
    `).join('');
    const doc = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Armamento 31ª CIPM-CPE</title>
      <style>body{font-family:Arial,sans-serif;font-size:11px}table{width:100%;border-collapse:collapse}
      th,td{border:1px solid #ccc;padding:5px 7px;vertical-align:top}th{background:#333;color:#fff}
      h3{margin:0 0 10px}.meta{margin-bottom:12px;color:#555}</style></head><body>
      <h3>Armamento - 31ª CIPM-CPE</h3><div class="meta">${filtered.length} registros | Quantidade total: ${totalQuantidade}</div>
      <table><thead><tr><th>Categoria</th><th>Tombamento</th><th>Estado</th><th>Qtd.</th><th>Especificação</th><th>Valor</th><th>Localização</th></tr></thead>
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

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 transition-colors text-base font-medium"
          style={{ color: 'var(--adm-muted)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--adm-text)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--adm-muted)')}
        >
          <ArrowLeft size={17} /> Módulos
        </button>
        <span style={{ color: 'var(--adm-border)' }} className="hidden sm:block">|</span>
        <h3 className="font-bold text-2xl flex-1" style={{ color: 'var(--adm-text)' }}>Armamento</h3>
        <span className="text-base" style={{ color: 'var(--adm-muted)' }}>
          {filtered.length} registros | {totalQuantidade} itens
        </span>

        <div className="relative">
          <button
            onClick={() => setShowExport(v => !v)}
            className="flex items-center gap-2 border rounded-lg px-4 py-2 text-base font-medium transition-colors"
            style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)', background: 'var(--adm-input)' }}
          >
            <Download size={16} /> Exportar
          </button>
          {showExport && (
            <div
              className="absolute right-0 top-full mt-1 rounded-xl shadow-2xl z-20 w-52 py-1.5 overflow-hidden"
              style={{ background: 'var(--adm-dropdown)', border: '1px solid var(--adm-border)' }}
            >
              <button onClick={exportCSV} className="adm-drop-item flex items-center gap-3 w-full px-4 py-3 text-base transition-colors" style={{ color: 'var(--adm-text)' }}>
                <FileText size={16} className="text-emerald-400" /> CSV
              </button>
              <button onClick={exportJSON} className="adm-drop-item flex items-center gap-3 w-full px-4 py-3 text-base transition-colors" style={{ color: 'var(--adm-text)' }}>
                <FileJson size={16} className="text-blue-400" /> JSON
              </button>
              <button onClick={exportXLSX} className="adm-drop-item flex items-center gap-3 w-full px-4 py-3 text-base transition-colors" style={{ color: 'var(--adm-text)' }}>
                <FileSpreadsheet size={16} className="text-emerald-500" /> Excel
              </button>
              <button onClick={exportPrint} className="adm-drop-item flex items-center gap-3 w-full px-4 py-3 text-base transition-colors" style={{ color: 'var(--adm-text)' }}>
                <Printer size={16} style={{ color: 'var(--adm-muted)' }} /> Imprimir / PDF
              </button>
            </div>
          )}
        </div>

        {canCreate && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-cpe-red hover:bg-cpe-red/80 text-white text-base font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={16} /> Novo Registro
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[220px_1fr] gap-3 mb-4">
        <select
          value={categoria}
          onChange={e => {
            setCategoria(e.target.value as CategoriaFilter);
            setPage(1);
          }}
          className="adm-input rounded-xl px-3 py-3 text-base border"
          style={fieldStyle}
        >
          <option value="Todas">Todas as categorias</option>
          {ARMAMENTO_CATEGORIAS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>

        <div className="relative">
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--adm-muted)' }} />
          <input
            type="text"
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar por tombamento, especificação, estado, valor ou localização..."
            className="adm-input w-full rounded-xl pl-10 pr-10 py-3 text-base border"
            style={fieldStyle}
          />
          {search && (
            <button onClick={() => { setSearch(''); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors" style={{ color: 'var(--adm-muted)' }}>
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto rounded-xl border" style={{ borderColor: 'var(--adm-border)' }}>
        <table className="w-full min-w-[980px]">
          <thead className="sticky top-0 z-10" style={{ background: 'var(--adm-tbl-head)' }}>
            <tr className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--adm-muted)' }}>
              <th className="px-4 py-3.5 text-left cursor-pointer select-none" onClick={() => toggleSort('categoria')}>Categoria <SortIcon col="categoria" /></th>
              <th className="px-4 py-3.5 text-left cursor-pointer select-none" onClick={() => toggleSort('tombamento')}>Tombamento <SortIcon col="tombamento" /></th>
              <th className="px-4 py-3.5 text-left cursor-pointer select-none" onClick={() => toggleSort('estado')}>Estado <SortIcon col="estado" /></th>
              <th className="px-4 py-3.5 text-right cursor-pointer select-none" onClick={() => toggleSort('quantidade')}>Qtd. <SortIcon col="quantidade" /></th>
              <th className="px-4 py-3.5 text-left cursor-pointer select-none" onClick={() => toggleSort('especificacao')}>Especificação <SortIcon col="especificacao" /></th>
              <th className="px-4 py-3.5 text-left cursor-pointer select-none" onClick={() => toggleSort('localizacao')}>Localização <SortIcon col="localizacao" /></th>
              <th className="px-4 py-3.5 text-center w-32">Ações</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((item, i) => (
              <tr
                key={item.id}
                className="adm-row border-t transition-colors"
                style={{ borderColor: 'var(--adm-border)', background: i % 2 === 0 ? 'var(--adm-row-even)' : 'transparent' }}
              >
                <td className="px-4 py-3.5 text-base font-medium whitespace-nowrap" style={{ color: 'var(--adm-muted)' }}>{item.categoria}</td>
                <td className="px-4 py-3.5 text-base tabular-nums whitespace-nowrap" style={{ color: 'var(--adm-subtle)' }}>{item.tombamento}</td>
                <td className="px-4 py-3.5 text-base whitespace-nowrap" style={{ color: 'var(--adm-muted)' }}>{item.estado}</td>
                <td className="px-4 py-3.5 text-base text-right tabular-nums" style={{ color: 'var(--adm-text)' }}>{item.quantidade}</td>
                <td className="px-4 py-3.5 text-base font-semibold min-w-[360px]" style={{ color: 'var(--adm-text)' }}>{item.especificacao}</td>
                <td className="px-4 py-3.5 text-base min-w-[180px]" style={{ color: 'var(--adm-muted)' }}>{item.localizacao}</td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => openView(item)} title="Visualizar" className="p-2 rounded-lg transition-colors hover:bg-blue-400/10 text-blue-400 opacity-70 hover:opacity-100">
                      <Eye size={17} />
                    </button>
                    {canEdit && (
                      <button onClick={() => openEdit(item)} title="Editar" className="p-2 rounded-lg transition-colors hover:bg-amber-400/10 text-amber-400 opacity-70 hover:opacity-100">
                        <Pencil size={17} />
                      </button>
                    )}
                    {canDelete && (
                      <button onClick={() => setDeleteTarget(item)} title="Remover" className="p-2 rounded-lg transition-colors hover:bg-cpe-red/10 text-cpe-red opacity-70 hover:opacity-100">
                        <Trash2 size={17} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-20 text-center text-lg" style={{ color: 'var(--adm-subtle)' }}>
                  Nenhum resultado encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div
        className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border px-4 py-3"
        style={{ borderColor: 'var(--adm-border)', background: 'var(--adm-surface)' }}
      >
        <div className="text-sm" style={{ color: 'var(--adm-muted)' }}>
          Mostrando <span className="font-semibold" style={{ color: 'var(--adm-text)' }}>{pageStart}-{pageEnd}</span> de{' '}
          <span className="font-semibold" style={{ color: 'var(--adm-text)' }}>{filtered.length}</span> registros
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--adm-muted)' }}>
            Por página
            <select
              value={pageSize}
              onChange={e => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="adm-input rounded-lg px-2.5 py-2 text-sm border"
              style={fieldStyle}
            >
              {PAGE_SIZES.map(size => <option key={size} value={size}>{size}</option>)}
            </select>
          </label>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(current => Math.max(1, current - 1))}
              disabled={safePage <= 1}
              className="p-2 rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)', background: 'var(--adm-input)' }}
              title="Página anterior"
            >
              <ChevronLeft size={17} />
            </button>
            <span className="min-w-[92px] text-center text-sm" style={{ color: 'var(--adm-muted)' }}>
              Página <span className="font-semibold" style={{ color: 'var(--adm-text)' }}>{safePage}</span> de {totalPages}
            </span>
            <button
              onClick={() => setPage(current => Math.min(totalPages, current + 1))}
              disabled={safePage >= totalPages}
              className="p-2 rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)', background: 'var(--adm-input)' }}
              title="Próxima página"
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl rounded-2xl shadow-2xl border" style={{ background: 'var(--adm-modal)', borderColor: 'var(--adm-border)' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--adm-border)' }}>
              <h4 className="font-bold text-xl" style={{ color: 'var(--adm-text)' }}>
                {modal.mode === 'create' ? 'Novo Armamento' : modal.mode === 'edit' ? 'Editar Registro' : 'Visualizar Registro'}
              </h4>
              <button onClick={() => setModal(null)} className="transition-colors" style={{ color: 'var(--adm-muted)' }}>
                <X size={22} />
              </button>
            </div>

            <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Categoria</label>
                {isRO ? (
                  <input readOnly value={form.categoria} className={inputCls()} style={roStyle} />
                ) : (
                  <select value={form.categoria} onChange={e => changeField('categoria', e.target.value)} className={inputCls()} style={fieldStyle}>
                    {ARMAMENTO_CATEGORIAS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Tombamento</label>
                <input value={form.tombamento} onChange={e => changeField('tombamento', e.target.value)} readOnly={isRO} className={inputCls()} style={isRO ? roStyle : fieldStyle} />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Estado de Conservação</label>
                <input value={form.estado} onChange={e => changeField('estado', e.target.value)} readOnly={isRO} className={inputCls()} style={isRO ? roStyle : fieldStyle} />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Quantidade</label>
                <input
                  type="number"
                  min={1}
                  value={form.quantidade}
                  onChange={e => changeField('quantidade', e.target.value)}
                  readOnly={isRO}
                  className={inputCls(errors.quantidade)}
                  style={isRO ? roStyle : { ...fieldStyle, ...(errors.quantidade ? { borderColor: '#ef4444' } : {}) }}
                />
                {errors.quantidade && <p className="text-sm mt-1 text-red-400 flex items-center gap-1"><AlertCircle size={13} /> {errors.quantidade}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Valor</label>
                <input value={form.valor} onChange={e => changeField('valor', e.target.value)} readOnly={isRO} className={inputCls()} style={isRO ? roStyle : fieldStyle} />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Localização</label>
                <input value={form.localizacao} onChange={e => changeField('localizacao', e.target.value)} readOnly={isRO} className={inputCls()} style={isRO ? roStyle : fieldStyle} />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Especificação</label>
                <textarea
                  value={form.especificacao}
                  onChange={e => changeField('especificacao', e.target.value)}
                  readOnly={isRO}
                  rows={4}
                  className="adm-input w-full rounded-lg px-3 py-2.5 text-base border resize-none"
                  style={isRO ? roStyle : { ...fieldStyle, ...(errors.especificacao ? { borderColor: '#ef4444' } : {}) }}
                />
                {errors.especificacao && <p className="text-sm mt-1 text-red-400 flex items-center gap-1"><AlertCircle size={13} /> {errors.especificacao}</p>}
              </div>
            </div>

            {!isRO && (
              <div className="flex justify-end gap-3 px-6 pb-5">
                <button onClick={() => setModal(null)} className="px-5 py-2.5 text-base rounded-lg border transition-colors" style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)', background: 'transparent' }}>
                  Cancelar
                </button>
                <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 text-base font-semibold text-white bg-cpe-red hover:bg-cpe-red/80 rounded-lg transition-colors">
                  <Save size={16} /> Salvar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl shadow-2xl border p-6" style={{ background: 'var(--adm-modal)', borderColor: 'var(--adm-border)' }}>
            <h4 className="font-bold text-xl mb-2" style={{ color: 'var(--adm-text)' }}>Confirmar remoção</h4>
            <p className="text-base mb-6" style={{ color: 'var(--adm-muted)' }}>
              Deseja remover <span className="font-semibold" style={{ color: 'var(--adm-text)' }}>{deleteTarget.especificacao}</span>?
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteTarget(null)} className="px-5 py-2.5 text-base rounded-lg border transition-colors" style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)', background: 'transparent' }}>
                Cancelar
              </button>
              <button onClick={handleDelete} className="flex items-center gap-2 px-5 py-2.5 text-base font-semibold text-white bg-cpe-red hover:bg-cpe-red/80 rounded-lg transition-colors">
                <Trash2 size={16} /> Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
