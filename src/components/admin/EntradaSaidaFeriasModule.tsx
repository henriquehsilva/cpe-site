import { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  ArrowLeft, Plus, Pencil, Trash2, X, Save, Download,
  FileSpreadsheet, Search,
} from 'lucide-react';
import {
  ENTRADA_SAIDA_SECTIONS,
  entradaSaidaFeriasDB,
  EntradaSaidaFerias,
} from '../../data/entradaSaidaFerias';
import { ModulePermission } from '../../types/rbac';
import { usePersistentState } from '../../hooks/usePersistentState';

function nextId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function clamp(value: number, max: number) {
  return Number.isFinite(value) && value > 0 ? Math.min(Math.floor(value), max) : max;
}

function normalizeRows(rows: EntradaSaidaFerias[]) {
  const sectionOrder = ENTRADA_SAIDA_SECTIONS.map((section) => section.id);
  return sectionOrder.flatMap((secao) =>
    rows
      .filter((row) => row.secao === secao)
      .sort((a, b) => a.num - b.num)
      .map((row, index) => ({ ...row, num: index + 1 } as EntradaSaidaFerias)),
  );
}

function upsertRow(rows: EntradaSaidaFerias[], item: EntradaSaidaFerias) {
  const sectionRows = rows
    .filter((row) => row.secao === item.secao && row.id !== item.id)
    .sort((a, b) => a.num - b.num);
  const position = clamp(item.num, sectionRows.length + 1) - 1;
  const inserted = [
    ...sectionRows.slice(0, position),
    { ...item, num: position + 1 },
    ...sectionRows.slice(position),
  ];
  return normalizeRows([
    ...rows.filter((row) => row.secao !== item.secao && row.id !== item.id),
    ...inserted,
  ]);
}

function buildSheetData(rows: EntradaSaidaFerias[]) {
  const sheet: (string | number)[][] = [
    ['Entrada / Saída de Férias'],
    [],
    ['Seção', 'Nº', 'Graduação', 'RG', 'Nome', 'Função', 'Dias', 'Início', 'Fim', 'Disp. Cmdo', 'Pronto', 'Observação'],
  ];

  for (const row of rows) {
    sheet.push([
      ENTRADA_SAIDA_SECTIONS.find((s) => s.id === row.secao)?.label ?? row.secao,
      row.num,
      row.graduacao,
      row.rg,
      row.nome,
      row.funcao,
      row.dias,
      row.inicio,
      row.fim,
      row.dispCmdo,
      row.pronto,
      row.observacao,
    ]);
  }

  return sheet;
}

function exportXLSX(rows: EntradaSaidaFerias[]) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(buildSheetData(rows));
  ws['!cols'] = Array(12).fill({ wch: 18 });
  XLSX.utils.book_append_sheet(wb, ws, 'Entrada Saida Férias');
  XLSX.writeFile(wb, 'entrada_saida_ferias.xlsx');
}

function emptyForm(secao: string): Omit<EntradaSaidaFerias, 'id'> {
  return {
    secao,
    num: 1,
    graduacao: '',
    rg: '',
    nome: '',
    funcao: '',
    dias: '',
    inicio: '',
    fim: '',
    dispCmdo: '',
    pronto: '',
    observacao: '',
  };
}

interface FormErrors {
  graduacao?: string;
  rg?: string;
  nome?: string;
  dias?: string;
  inicio?: string;
  fim?: string;
}

interface Props {
  onBack: () => void;
  permissions?: ModulePermission;
}

type View = 'list' | 'section';
type ModalMode = 'create' | 'edit';

export default function EntradaSaidaFeriasModule({ onBack, permissions }: Props) {
  const canCreate = !permissions || permissions.create;
  const canEdit = !permissions || permissions.edit;
  const canDelete = !permissions || permissions.delete;

  const [data, setData] = usePersistentState<EntradaSaidaFerias[]>(
    'cpe-site:entrada-saida-ferias:v2',
    entradaSaidaFeriasDB,
  );
  const [view, setView] = useState<View>('list');
  const [selectedSection, setSelectedSection] = useState<string>(ENTRADA_SAIDA_SECTIONS[0].id);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('create');
  const [form, setForm] = useState<Omit<EntradaSaidaFerias, 'id'>>(emptyForm(selectedSection));
  const [errors, setErrors] = useState<FormErrors>({});
  const [editItem, setEditItem] = useState<EntradaSaidaFerias | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EntradaSaidaFerias | null>(null);
  const [showExport, setShowExport] = useState(false);

  const sections = useMemo(
    () => ENTRADA_SAIDA_SECTIONS.map((section) => ({
      ...section,
      count: data.filter((row) => row.secao === section.id).length,
    })),
    [data],
  );

  const selectedRows = useMemo(
    () => data.filter((row) => row.secao === selectedSection).sort((a, b) => a.num - b.num),
    [data, selectedSection],
  );

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return selectedRows;
    return selectedRows.filter((row) =>
      [row.graduacao, row.rg, row.nome, row.funcao, row.dias, row.inicio, row.fim, row.dispCmdo, row.pronto, row.observacao]
        .some((value) => value.toLowerCase().includes(q)),
    );
  }, [selectedRows, search]);

  const sectionLabel = ENTRADA_SAIDA_SECTIONS.find((s) => s.id === selectedSection)?.label ?? selectedSection;

  const openSection = (id: string) => {
    setSelectedSection(id);
    setSearch('');
    setView('section');
  };

  const goBack = () => {
    setView('list');
    setSearch('');
  };

  const openCreate = () => {
    setModalMode('create');
    setEditItem(null);
    setForm(emptyForm(selectedSection));
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (item: EntradaSaidaFerias) => {
    setModalMode('edit');
    setEditItem(item);
    setForm(item);
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const errs: FormErrors = {};
    if (!form.graduacao.trim()) errs.graduacao = 'Graduação obrigatória';
    if (!form.rg.trim()) errs.rg = 'RG obrigatório';
    if (!form.nome.trim()) errs.nome = 'Nome obrigatório';
    if (!form.dias.trim()) errs.dias = 'Dias obrigatórios';
    if (!form.inicio.trim()) errs.inicio = 'Início obrigatório';
    if (!form.fim.trim()) errs.fim = 'Fim obrigatório';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    const item: EntradaSaidaFerias = {
      ...(editItem ?? { id: nextId() }),
      ...form,
      num: clamp(Number(form.num), selectedRows.length + (modalMode === 'create' ? 1 : 0)),
    } as EntradaSaidaFerias;

    setData((rows) => upsertRow(rows, item));
    setModalOpen(false);
    setEditItem(null);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setData((rows) => normalizeRows(rows.filter((row) => row.id !== deleteTarget.id)));
    setDeleteTarget(null);
  };

  const exportAll = () => {
    exportXLSX(data);
    setShowExport(false);
  };

  const exportCsv = () => {
    const rows = data.map((row) =>
      [
        ENTRADA_SAIDA_SECTIONS.find((s) => s.id === row.secao)?.label ?? row.secao,
        row.num,
        row.graduacao,
        row.rg,
        row.nome,
        row.funcao,
        row.dias,
        row.inicio,
        row.fim,
        row.dispCmdo,
        row.pronto,
        row.observacao,
      ]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(','),
    );

    const csv = [
      'Seção,Nº,Graduação,RG,Nome,Função,Dias,Início,Fim,Disp. Cmdo,Pronto,Observação',
      ...rows,
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'entrada_saida_ferias.csv';
    a.click();
    URL.revokeObjectURL(url);
    setShowExport(false);
  };

  const sectionCards = (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
      <button
        type="button"
        onClick={() => openSection(ENTRADA_SAIDA_SECTIONS[0].id)}
        className="adm-card group rounded-2xl border p-6 transition-all duration-200 hover:shadow-2xl"
        style={{ background: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}
      >
        <p className="text-sm font-semibold" style={{ color: 'var(--adm-muted)' }}>Seções</p>
        <p className="text-4xl font-black mt-4" style={{ color: 'var(--adm-text)' }}>{data.length}</p>
        <p className="text-sm mt-1" style={{ color: 'var(--adm-muted)' }}>Registros totais</p>
      </button>
      {sections.map((section) => (
        <button
          key={section.id}
          type="button"
          onClick={() => openSection(section.id)}
          className="adm-card group rounded-2xl border p-6 transition-all duration-200 hover:shadow-2xl text-left"
          style={{ background: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}
        >
          <p className="text-sm font-semibold" style={{ color: 'var(--adm-muted)' }}>{section.label}</p>
          <p className="text-4xl font-black mt-4" style={{ color: 'var(--adm-text)' }}>{section.count}</p>
          <p className="text-sm mt-1" style={{ color: 'var(--adm-muted)' }}>Registros</p>
        </button>
      ))}
    </div>
  );

  const modal = modalOpen ? (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-3xl border bg-white p-6 shadow-2xl" style={{ borderColor: 'var(--adm-border)' }}>
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold" style={{ color: 'var(--adm-text)' }}>
              {modalMode === 'create' ? 'Novo registro' : 'Editar registro'}
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--adm-muted)' }}>
              Preencha os dados do registro de férias para a seção selecionada.
            </p>
          </div>
          <button type="button" onClick={() => setModalOpen(false)} className="rounded-full p-2 transition-colors" style={{ color: 'var(--adm-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm text-slate-600">
            Número
            <input
              type="number"
              value={form.num}
              onChange={(e) => setForm((f) => ({ ...f, num: Number(e.target.value) }))}
              className="adm-input w-full rounded-lg px-3 py-2"
              style={{ background: 'var(--adm-input)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
            />
          </label>
          <label className="space-y-2 text-sm text-slate-600">
            Graduação
            <input
              type="text"
              value={form.graduacao}
              onChange={(e) => setForm((f) => ({ ...f, graduacao: e.target.value }))}
              className="adm-input w-full rounded-lg px-3 py-2"
              style={{ background: 'var(--adm-input)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
            />
            {errors.graduacao && <p className="text-xs text-red-500">{errors.graduacao}</p>}
          </label>
          <label className="space-y-2 text-sm text-slate-600">
            RG
            <input
              type="text"
              value={form.rg}
              onChange={(e) => setForm((f) => ({ ...f, rg: e.target.value }))}
              className="adm-input w-full rounded-lg px-3 py-2"
              style={{ background: 'var(--adm-input)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
            />
            {errors.rg && <p className="text-xs text-red-500">{errors.rg}</p>}
          </label>
          <label className="space-y-2 text-sm text-slate-600 sm:col-span-2">
            Nome
            <input
              type="text"
              value={form.nome}
              onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              className="adm-input w-full rounded-lg px-3 py-2"
              style={{ background: 'var(--adm-input)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
            />
            {errors.nome && <p className="text-xs text-red-500">{errors.nome}</p>}
          </label>
          <label className="space-y-2 text-sm text-slate-600">
            Função
            <input
              type="text"
              value={form.funcao}
              onChange={(e) => setForm((f) => ({ ...f, funcao: e.target.value }))}
              className="adm-input w-full rounded-lg px-3 py-2"
              style={{ background: 'var(--adm-input)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
            />
          </label>
          <label className="space-y-2 text-sm text-slate-600">
            Dias
            <input
              type="text"
              value={form.dias}
              onChange={(e) => setForm((f) => ({ ...f, dias: e.target.value }))}
              className="adm-input w-full rounded-lg px-3 py-2"
              style={{ background: 'var(--adm-input)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
            />
            {errors.dias && <p className="text-xs text-red-500">{errors.dias}</p>}
          </label>
          <label className="space-y-2 text-sm text-slate-600">
            Início
            <input
              type="text"
              value={form.inicio}
              onChange={(e) => setForm((f) => ({ ...f, inicio: e.target.value }))}
              className="adm-input w-full rounded-lg px-3 py-2"
              style={{ background: 'var(--adm-input)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
            />
            {errors.inicio && <p className="text-xs text-red-500">{errors.inicio}</p>}
          </label>
          <label className="space-y-2 text-sm text-slate-600">
            Fim
            <input
              type="text"
              value={form.fim}
              onChange={(e) => setForm((f) => ({ ...f, fim: e.target.value }))}
              className="adm-input w-full rounded-lg px-3 py-2"
              style={{ background: 'var(--adm-input)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
            />
            {errors.fim && <p className="text-xs text-red-500">{errors.fim}</p>}
          </label>
          <label className="space-y-2 text-sm text-slate-600">
            Disp. Cmdo
            <input
              type="text"
              value={form.dispCmdo}
              onChange={(e) => setForm((f) => ({ ...f, dispCmdo: e.target.value }))}
              className="adm-input w-full rounded-lg px-3 py-2"
              style={{ background: 'var(--adm-input)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
            />
          </label>
          <label className="space-y-2 text-sm text-slate-600">
            Pronto
            <input
              type="text"
              value={form.pronto}
              onChange={(e) => setForm((f) => ({ ...f, pronto: e.target.value }))}
              className="adm-input w-full rounded-lg px-3 py-2"
              style={{ background: 'var(--adm-input)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
            />
          </label>
          <label className="space-y-2 text-sm text-slate-600 sm:col-span-2">
            Observação
            <textarea
              value={form.observacao}
              onChange={(e) => setForm((f) => ({ ...f, observacao: e.target.value }))}
              className="adm-input w-full min-h-[100px] rounded-lg px-3 py-2"
              style={{ background: 'var(--adm-input)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
            />
          </label>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 justify-end">
          <button
            type="button"
            onClick={() => setModalOpen(false)}
            className="px-4 py-2 rounded-lg border transition-colors"
            style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-text)', background: 'var(--adm-input)' }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cpe-red text-white font-semibold transition-colors hover:bg-cpe-red/90"
          >
            <Save size={16} /> Salvar
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 transition-colors text-base font-medium"
          style={{ color: 'var(--adm-muted)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--adm-text)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--adm-muted)')}
        >
          <ArrowLeft size={17} /> Módulos
        </button>
        <span style={{ color: 'var(--adm-border)' }} className="hidden sm:block">|</span>
        <h3 className="font-bold text-2xl flex-1" style={{ color: 'var(--adm-text)' }}>
          Entrada / Saída de Férias
        </h3>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowExport((prev) => !prev)}
            className="flex items-center gap-2 border rounded-lg px-4 py-2 text-base font-medium transition-colors"
            style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)', background: 'var(--adm-input)' }}
          >
            <Download size={16} /> Exportar
          </button>
          {showExport && (
            <div className="absolute right-0 top-full mt-1 rounded-xl shadow-2xl z-20 w-60 py-1.5 overflow-hidden"
              style={{ background: 'var(--adm-dropdown)', border: '1px solid var(--adm-border)' }}>
              <button
                type="button"
                onClick={exportAll}
                className="adm-drop-item flex items-center gap-3 w-full px-4 py-3 text-sm"
                style={{ color: 'var(--adm-text)' }}
              >
                <FileSpreadsheet size={16} className="text-emerald-400" /> XLSX (todos)
              </button>
              <button
                type="button"
                onClick={exportCsv}
                className="adm-drop-item flex items-center gap-3 w-full px-4 py-3 text-sm"
                style={{ color: 'var(--adm-text)' }}
              >
                <FileSpreadsheet size={16} className="text-cpe-gold" /> CSV
              </button>
            </div>
          )}
        </div>
        {view === 'section' && canCreate && (
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 bg-cpe-red text-white text-base font-semibold px-4 py-2 rounded-lg transition-colors hover:bg-cpe-red/90"
          >
            <Plus size={16} /> Novo registro
          </button>
        )}
      </div>

      {view === 'list' ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--adm-text)' }}>
                Selecione uma seção para visualizar os registros.
              </p>
              <p className="text-sm" style={{ color: 'var(--adm-muted)' }}>
                Os dados são carregados do CSV anexado e podem ser editados no módulo.
              </p>
            </div>
          </div>
          {sectionCards}
        </>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={goBack}
              className="px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors"
              style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)', background: 'var(--adm-input)' }}
            >
              Voltar às seções
            </button>
            <h4 className="text-lg font-semibold flex-1" style={{ color: 'var(--adm-text)' }}>
              {sectionLabel}
            </h4>
            <div className="relative min-w-[220px] flex-1 sm:flex-none">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar registro..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="adm-input w-full rounded-2xl pl-10 pr-4 py-3 text-sm"
                style={{ background: 'var(--adm-input)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
              />
            </div>
            {canCreate && (
              <button
                type="button"
                onClick={openCreate}
                className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-cpe-red text-white transition-colors hover:bg-cpe-red/90"
              >
                <Plus size={14} /> Novo registro
              </button>
            )}
          </div>

          <div className="overflow-x-auto rounded-3xl border" style={{ borderColor: 'var(--adm-border)' }}>
            <table className="min-w-full border-separate border-spacing-0 text-sm" style={{ borderCollapse: 'separate' }}>
              <thead>
                <tr className="bg-cpe-dark">
                  {['Nº', 'Graduação', 'RG', 'Nome', 'Função', 'Dias', 'Início', 'Fim', 'Disp. Cmdo', 'Pronto', 'Observação', 'Ações'].map((label) => (
                    <th key={label} className="px-4 py-3 text-left font-semibold text-white text-xs uppercase tracking-wide">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="px-4 py-8 text-center text-sm" style={{ color: 'var(--adm-muted)' }}>
                      Nenhum registro encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => (
                    <tr key={row.id} className="border-t" style={{ borderColor: 'var(--adm-border)' }}>
                      <td className="px-4 py-3 text-sm text-slate-900">{row.num}</td>
                      <td className="px-4 py-3 text-sm">{row.graduacao}</td>
                      <td className="px-4 py-3 text-sm">{row.rg}</td>
                      <td className="px-4 py-3 text-sm">{row.nome}</td>
                      <td className="px-4 py-3 text-sm">{row.funcao}</td>
                      <td className="px-4 py-3 text-sm">{row.dias}</td>
                      <td className="px-4 py-3 text-sm">{row.inicio}</td>
                      <td className="px-4 py-3 text-sm">{row.fim}</td>
                      <td className="px-4 py-3 text-sm">{row.dispCmdo}</td>
                      <td className="px-4 py-3 text-sm">{row.pronto}</td>
                      <td className="px-4 py-3 text-sm">{row.observacao}</td>
                      <td className="px-4 py-3 text-sm space-x-1">
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => openEdit(row)}
                            className="rounded-lg border px-2 py-1 text-xs transition-colors"
                            style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                          >
                            <Pencil size={14} />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(row)}
                            className="rounded-lg border px-2 py-1 text-xs transition-colors text-red-600"
                            style={{ borderColor: 'var(--adm-border)' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal}

      {deleteTarget && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-3xl border bg-white p-6 shadow-2xl" style={{ borderColor: 'var(--adm-border)' }}>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--adm-text)' }}>
              Excluir registro
            </h3>
            <p className="mt-3 text-sm" style={{ color: 'var(--adm-muted)' }}>
              Tem certeza que deseja excluir este registro de férias?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-lg border"
                style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-text)', background: 'var(--adm-input)' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg bg-red-600 text-white"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
