import { useState, useMemo } from 'react';
import {
  ArrowLeft, Plus, Eye, Pencil, Trash2, X, Save, Search,
  Download, FileSpreadsheet, Printer, ChevronUp, ChevronDown,
} from 'lucide-react';
import { entradaSaidaFeriasDB, EntradaSaidaFerias } from '../../data/entradaSaidaFerias';
import { ModulePermission } from '../../types/rbac';
import { usePersistentState } from '../../hooks/usePersistentState';

const DEFAULT_SECTIONS = [
  { id: 'retornam-abril', label: 'Retornam de Abril/2026' },
  { id: 'entram-maio', label: 'Entram em Maio/2026' },
  { id: 'lesp', label: 'LESP 2º Trim/2026' },
] as const;

type SectionId = string;

type SortKey = keyof Pick<EntradaSaidaFerias, 'num' | 'graduacao' | 'rg' | 'nome' | 'funcao' | 'dias' | 'inicio' | 'fim' | 'dispCmdo' | 'pronto'>;
type SortDir = 'asc' | 'desc';
type ModalMode = 'view' | 'edit' | 'create';
type View = 'overview' | 'section';

function nextId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function clamp(value: number, max: number) {
  return Number.isFinite(value) && value > 0 ? Math.min(Math.floor(value), max) : max;
}

function compare(a: EntradaSaidaFerias, b: EntradaSaidaFerias, key: SortKey, dir: SortDir) {
  let cmp: number;
  if (key === 'num') cmp = a.num - b.num;
  else cmp = a[key].localeCompare(b[key], 'pt-BR');
  return dir === 'asc' ? cmp : -cmp;
}

function normalizeRows(rows: EntradaSaidaFerias[]) {
  const customSectionIds = Array.from(new Set(rows.map(r => r.secao))).filter(
    secao => !DEFAULT_SECTIONS.some(item => item.id === secao),
  );
  const sectionOrder = [...DEFAULT_SECTIONS.map(item => item.id), ...customSectionIds];
  return sectionOrder.flatMap(secao =>
    rows
      .filter(r => r.secao === secao)
      .sort((a, b) => a.num - b.num)
      .map((row, index) => ({ ...row, num: index + 1 } as EntradaSaidaFerias)),
  );
}

function upsertRow(rows: EntradaSaidaFerias[], item: EntradaSaidaFerias) {
  const sectionRows = rows
    .filter(r => r.secao === item.secao && r.id !== item.id)
    .sort((a, b) => a.num - b.num);
  const position = clamp(item.num, sectionRows.length + 1) - 1;
  const nextSection = [
    ...sectionRows.slice(0, position),
    { ...item, num: position + 1 },
    ...sectionRows.slice(position),
  ];
  return normalizeRows([
    ...rows.filter(r => r.secao !== item.secao && r.id !== item.id),
    ...nextSection,
  ]);
}

const emptyForm = (secao: EntradaSaidaFerias['secao']): Omit<EntradaSaidaFerias, 'id'> => ({
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
});

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

export default function EntradaSaidaFeriasModule({ onBack, permissions }: Props) {
  const canCreate = !permissions || permissions.create;
  const canEdit = !permissions || permissions.edit;
  const canDelete = !permissions || permissions.delete;

  const [data, setData] = usePersistentState<EntradaSaidaFerias[]>('cpe-site:entrada-saida-ferias:v1', entradaSaidaFeriasDB);
  const [customSections, setCustomSections] = usePersistentState<string[]>('cpe-site:entrada-saida-ferias:sections:v1', []);
  const [search, setSearch] = useState('');
  const [section, setSection] = useState<SectionId>('all');
  const [view, setView] = useState<View>('overview');
  const [sortKey, setSortKey] = useState<SortKey>('num');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [modal, setModal] = useState<{ mode: ModalMode; item: EntradaSaidaFerias | null } | null>(null);
  const [form, setForm] = useState<Omit<EntradaSaidaFerias, 'id'>>(emptyForm('entram-maio'));
  const [errors, setErrors] = useState<FormErrors>({});
  const [deleteTarget, setDeleteTarget] = useState<EntradaSaidaFerias | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [sectionName, setSectionName] = useState('');
  const [sectionError, setSectionError] = useState('');

  const sections = useMemo(() => {
    const activeSectionIds = Array.from(new Set([
      ...DEFAULT_SECTIONS.map(item => item.id),
      ...customSections,
      ...data.map(item => item.secao),
    ]));
    return activeSectionIds.map(id => {
      const def = DEFAULT_SECTIONS.find(item => item.id === id);
      return { id, label: def ? def.label : id };
    });
  }, [customSections, data]);

  const sectionSummary = useMemo(() => {
    const counts = sections.map(s => ({
      id: s.id,
      label: s.label,
      count: data.filter(item => item.secao === s.id).length,
    }));
    return { counts, total: data.length };
  }, [sections, data]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return data
      .filter(item => (section === 'all' ? true : item.secao === section))
      .filter(item => {
        if (!q) return true;
        return [item.graduacao, item.rg, item.nome, item.funcao, item.dias, item.inicio, item.fim, item.dispCmdo, item.pronto, item.observacao]
          .some(value => value.toLowerCase().includes(q));
      })
      .sort((a, b) => compare(a, b, sortKey, sortDir));
  }, [data, search, section, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const SortIcon = ({ col }: { col: SortKey }) =>
    sortKey === col
      ? sortDir === 'asc'
        ? <ChevronUp size={12} className="inline ml-0.5" />
        : <ChevronDown size={12} className="inline ml-0.5" />
      : <ChevronUp size={12} className="inline ml-0.5 opacity-20" />;

  const changeField = <K extends keyof Omit<EntradaSaidaFerias, 'id'>>(key: K, value: Omit<EntradaSaidaFerias, 'id'>[K]) => {
    setForm(f => ({ ...f, [key]: value }));
    if (key in errors) setErrors(e => ({ ...e, [key]: undefined }));
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

  const defaultSection: string = section === 'all' ? sections[0]?.id ?? 'entram-maio' : section;

  const openCreate = () => {
    const sectionRows = data.filter(item => item.secao === defaultSection);
    setForm({ ...emptyForm(defaultSection), num: sectionRows.length + 1 });
    setErrors({});
    setModal({ mode: 'create', item: null });
    if (view === 'overview') setView('section');
  };

  const openNewSectionModal = () => {
    setSectionModalOpen(true);
    setSectionName('');
    setSectionError('');
  };

  const handleSaveSection = () => {
    const trimmed = sectionName.trim();
    if (!trimmed) {
      setSectionError('Título obrigatório');
      return;
    }
    const existing = sections.some(sec => sec.label.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      setSectionError('Submódulo já existe');
      return;
    }
    setCustomSections(cs => [...cs, trimmed]);
    setSection(trimmed);
    setSectionModalOpen(false);
  };

  const openView = (item: EntradaSaidaFerias) => { setForm(item); setErrors({}); setModal({ mode: 'view', item }); };
  const openEdit = (item: EntradaSaidaFerias) => { setForm(item); setErrors({}); setModal({ mode: 'edit', item }); };
  const closeModal = () => setModal(null);

  const openSection = (id: SectionId) => {
    setSection(id);
    setView('section');
  };

  const goToOverview = () => {
    setView('overview');
    setSection('all');
  };

  const handleSave = () => {
    if (!validate()) return;
    const item: EntradaSaidaFerias = {
      ...form,
      id: modal?.mode === 'create' ? nextId() : modal?.item?.id ?? nextId(),
      num: clamp(Number(form.num), 999),
    } as EntradaSaidaFerias;
    setData(rows => upsertRow(rows, item));
    closeModal();
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setData(rows => normalizeRows(rows.filter(item => item.id !== deleteTarget.id)));
    setDeleteTarget(null);
  };

  const exportCSV = () => {
    const rows = data.map(item => (
      `${item.secao},${item.num},"${item.graduacao}","${item.rg}","${item.nome}","${item.funcao}","${item.dias}","${item.inicio}","${item.fim}","${item.dispCmdo}","${item.pronto}","${item.observacao}"`
    ));
    const blob = new Blob([`Secao,Num,Graduacao,RG,Nome,Funcao,Dias,Inicio,Fim,DispCmdo,Pronto,Observacao\n${rows.join('\n')}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'entrada_saida_ferias.csv';
    a.click();
    URL.revokeObjectURL(url);
    setShowExport(false);
  };

  const exportPrint = () => {
    const rows = data.map(item =>
      `<tr><td>${item.secao}</td><td>${item.num}</td><td>${item.graduacao}</td><td>${item.rg}</td><td>${item.nome}</td><td>${item.funcao}</td><td>${item.dias}</td><td>${item.inicio}</td><td>${item.fim}</td><td>${item.dispCmdo}</td><td>${item.pronto}</td><td>${item.observacao}</td></tr>`
    ).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Entrada / Saída de Férias</title><style>body{font-family:Arial;font-size:12px;margin:16px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #bbb;padding:6px;text-align:left}th{background:#333;color:#fff}</style></head><body><h2>Entrada / Saída de Férias</h2><table><thead><tr><th>Seção</th><th>Nº</th><th>Graduação</th><th>RG</th><th>Nome</th><th>Função</th><th>Dias</th><th>Início</th><th>Fim</th><th>Disp. Cmdo</th><th>Pronto</th><th>Obs</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); w.print(); }
    setShowExport(false);
  };

  const fieldStyle = { background: 'var(--adm-input)', color: 'var(--adm-text)', border: '1px solid var(--adm-border)' };
  const roStyle = { ...fieldStyle, opacity: 0.7 };
  const inputClass = (err?: string) => `adm-input w-full rounded-lg px-3 py-2.5 text-base border transition-colors ${err ? 'border-red-500/70' : ''}`;
  const isView = modal?.mode === 'view';

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <button onClick={onBack}
          className="flex items-center gap-1.5 transition-colors text-base font-medium"
          style={{ color: 'var(--adm-muted)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--adm-text)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--adm-muted)')}>
          <ArrowLeft size={17} /> Módulos
        </button>
        <span style={{ color: 'var(--adm-border)' }} className="hidden sm:block">|</span>
        <h3 className="font-bold text-2xl flex-1" style={{ color: 'var(--adm-text)' }}>Entrada / Saída de Férias</h3>
        <span className="text-sm" style={{ color: 'var(--adm-muted)' }}>{filtered.length} registro{filtered.length !== 1 ? 's' : ''}</span>
        <div className="relative">
          <button onClick={() => setShowExport(v => !v)}
            className="flex items-center gap-2 border rounded-lg px-3 py-2 text-sm font-medium transition-colors"
            style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)', background: 'var(--adm-input)' }}>
            <Download size={15} /> Exportar
          </button>
          {showExport && (
            <div className="absolute right-0 top-full mt-1 rounded-xl shadow-2xl z-20 w-56 py-1.5 overflow-hidden"
              style={{ background: 'var(--adm-dropdown)', border: '1px solid var(--adm-border)' }}>
              <button onClick={exportCSV}
                className="adm-drop-item flex items-center gap-3 w-full px-4 py-3 text-sm transition-colors"
                style={{ color: 'var(--adm-text)' }}>
                <FileSpreadsheet size={15} className="text-emerald-400" /> CSV
              </button>
              <button onClick={exportPrint}
                className="adm-drop-item flex items-center gap-3 w-full px-4 py-3 text-sm transition-colors"
                style={{ color: 'var(--adm-text)' }}>
                <Printer size={15} style={{ color: 'var(--adm-muted)' }} /> Imprimir
              </button>
            </div>
          )}
        </div>
        {view === 'overview' ? (
        <> 
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--adm-text)' }}>Submódulos</p>
              <p className="text-sm" style={{ color: 'var(--adm-muted)' }}>Clique em um submódulo para ver seus registros e adicione novos submódulos quando precisar.</p>
            </div>
            {canCreate && (
              <button onClick={openNewSectionModal}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border font-semibold transition-colors"
                style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-text)', background: 'var(--adm-input)' }}>
                <Plus size={16} /> Novo submódulo
              </button>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 mb-6">
            <button onClick={() => openSection('all')}
              className="text-left rounded-2xl border p-5 transition-all duration-200 hover:shadow-2xl"
              style={{ background: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
              <p className="text-sm font-semibold" style={{ color: 'var(--adm-muted)' }}>Todos</p>
              <p className="text-4xl font-black mt-3" style={{ color: 'var(--adm-text)' }}>{sectionSummary.total}</p>
            </button>
            {sectionSummary.counts.map(card => (
              <button key={card.id} onClick={() => openSection(card.id)}
                className="text-left rounded-2xl border p-5 transition-all duration-200 hover:shadow-2xl"
                style={{ background: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
                <p className="text-sm font-semibold" style={{ color: 'var(--adm-muted)' }}>{card.label}</p>
                <p className="text-4xl font-black mt-3" style={{ color: 'var(--adm-text)' }}>{card.count}</p>
              </button>
            ))}
            {canCreate && (
              <button onClick={openNewSectionModal}
                className="text-left rounded-2xl border border-dashed p-5 transition-all duration-200 hover:border-cpe-red hover:text-cpe-red"
                style={{ background: 'var(--adm-surface)', borderColor: 'var(--adm-border)', color: 'var(--adm-muted)' }}>
                <p className="text-sm font-semibold">Adicionar</p>
                <p className="text-4xl font-black mt-3" style={{ color: 'var(--adm-text)' }}>+ Submódulo</p>
              </button>
            )}
          </div>
          <div className="rounded-2xl border p-6" style={{ background: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
            <p className="text-sm" style={{ color: 'var(--adm-muted)' }}>
              Clique em um submódulo para ver os registros de entrada/saída de férias. No modo de seção, você pode criar registros novos e organizar melhor cada submódulo.
            </p>
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <button onClick={goToOverview}
              className="px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors"
              style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)', background: 'var(--adm-input)' }}>
              Voltar às seções
            </button>
            <h4 className="text-lg font-semibold flex-1" style={{ color: 'var(--adm-text)' }}>
              {section === 'all' ? 'Todos os registros' : sections.find(s => s.id === section)?.label}
            </h4>
            <div className="relative min-w-[240px] flex-1 sm:flex-none">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar registro..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="adm-input w-full rounded-2xl pl-10 pr-4 py-3 text-sm"
                style={{ background: 'var(--adm-input)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
              />
            </div>
            {canCreate && (
              <button onClick={openCreate}
                className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-cpe-red text-white transition-colors hover:bg-cpe-red/90">
                <Plus size={14} /> Novo registro
              </button>
            )}
            <span className="text-sm" style={{ color: 'var(--adm-muted)' }}>{filtered.length} registro{filtered.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            <button
              onClick={() => setSection('all')}
              className="px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors"
              style={{
                borderColor: section === 'all' ? 'var(--adm-accent)' : 'var(--adm-border)',
                color: section === 'all' ? 'var(--adm-accent)' : 'var(--adm-muted)',
                background: section === 'all' ? 'color-mix(in srgb, var(--adm-accent) 10%, transparent)' : 'var(--adm-input)',
              }}>
              Todos
            </button>
            {sections.map(tab => {
              const active = section === tab.id;
              return (
                <button key={tab.id} onClick={() => setSection(tab.id)}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors"
                  style={{
                    borderColor: active ? 'var(--adm-accent)' : 'var(--adm-border)',
                    color: active ? 'var(--adm-accent)' : 'var(--adm-muted)',
                    background: active ? 'color-mix(in srgb, var(--adm-accent) 10%, transparent)' : 'var(--adm-input)',
                  }}>
                  {tab.label}
                </button>
              );
            })}
            {canCreate && (
              <>
                <button onClick={() => { setSectionModalOpen(true); setSectionName(''); setSectionError(''); }}
                  className="ml-auto px-3 py-1.5 rounded-lg text-sm font-semibold border border-dashed transition-colors"
                  style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-accent)', background: 'var(--adm-input)' }}>
                  + Nova seção
                </button>
              </>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {([
                    ['num', 'Nº'],
                    ['graduacao', 'Graduação'],
                    ['rg', 'RG'],
                    ['nome', 'Nome'],
                    ['funcao', 'Função'],
                    ['dias', 'Dias'],
                    ['inicio', 'Início'],
                    ['fim', 'Fim'],
                    ['dispCmdo', 'Disp. Cmdo'],
                    ['pronto', 'Pronto'],
              ] as [SortKey, string][]).map(([key, label]) => (
                <th key={key} className="px-3 py-3.5 text-left cursor-pointer hover:opacity-100 opacity-80 select-none"
                  onClick={() => toggleSort(key)}>
                  {label} <SortIcon col={key} />
                </th>
              ))}
              <th className="px-3 py-3.5 text-center w-28">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item, index) => (
              <tr key={item.id} className="adm-row border-t transition-colors"
                style={{ borderColor: 'var(--adm-border)', background: index % 2 === 0 ? 'var(--adm-row-even)' : 'transparent' }}>
                <td className="px-3 py-3 font-semibold tabular-nums whitespace-nowrap" style={{ color: 'var(--adm-text)' }}>{item.num}</td>
                <td className="px-3 py-3 uppercase font-medium whitespace-nowrap" style={{ color: 'var(--adm-text)' }}>{item.graduacao}</td>
                <td className="px-3 py-3 tabular-nums whitespace-nowrap" style={{ color: 'var(--adm-muted)' }}>{item.rg}</td>
                <td className="px-3 py-3 max-w-xs" style={{ color: 'var(--adm-text)' }}><span className="line-clamp-1">{item.nome}</span></td>
                <td className="px-3 py-3" style={{ color: 'var(--adm-muted)' }}>{item.funcao}</td>
                <td className="px-3 py-3 whitespace-nowrap" style={{ color: 'var(--adm-text)' }}>{item.dias}</td>
                <td className="px-3 py-3 whitespace-nowrap" style={{ color: 'var(--adm-text)' }}>{item.inicio}</td>
                <td className="px-3 py-3 whitespace-nowrap" style={{ color: 'var(--adm-text)' }}>{item.fim}</td>
                <td className="px-3 py-3 whitespace-nowrap" style={{ color: 'var(--adm-muted)' }}>{item.dispCmdo}</td>
                <td className="px-3 py-3 whitespace-nowrap" style={{ color: 'var(--adm-muted)' }}>{item.pronto}</td>
                <td className="px-3 py-3 max-w-xs" style={{ color: 'var(--adm-text)' }}><span className="line-clamp-1">{item.observacao}</span></td>
                <td className="px-3 py-3">
                  <div className="flex items-center justify-center gap-0.5">
                    <button onClick={() => openView(item)} title="Visualizar"
                      className="p-1.5 rounded-lg hover:bg-blue-400/10 text-blue-400 opacity-70 hover:opacity-100 transition-colors">
                      <Eye size={15} />
                    </button>
                    {canEdit && (
                      <button onClick={() => openEdit(item)} title="Editar"
                        className="p-1.5 rounded-lg hover:bg-amber-400/10 text-amber-400 opacity-70 hover:opacity-100 transition-colors">
                        <Pencil size={15} />
                      </button>
                    )}
                    {canDelete && (
                      <button onClick={() => setDeleteTarget(item)} title="Excluir"
                        className="p-1.5 rounded-lg hover:bg-cpe-red/10 text-cpe-red opacity-70 hover:opacity-100 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={12} className="px-4 py-20 text-center text-base" style={{ color: 'var(--adm-subtle)' }}>
                  Nenhum registro encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )}
      </div>

      {sectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl shadow-2xl border p-6"
            style={{ background: 'var(--adm-modal)', borderColor: 'var(--adm-border)' }}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-xl" style={{ color: 'var(--adm-text)' }}>Novo submódulo</h4>
              <button onClick={() => setSectionModalOpen(false)} style={{ color: 'var(--adm-muted)' }}><X size={22} /></button>
            </div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Título do submódulo</label>
            <input type="text" value={sectionName}
              onChange={e => { setSectionName(e.target.value); setSectionError(''); }}
              className="adm-input w-full rounded-lg px-3 py-2.5 text-base border"
              style={{ background: 'var(--adm-input)', color: 'var(--adm-text)', borderColor: sectionError ? '#ef4444' : 'var(--adm-border)' }} />
            {sectionError && <p className="text-sm mt-2 text-red-400">{sectionError}</p>}
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setSectionModalOpen(false)}
                className="px-4 py-2.5 rounded-lg border transition-colors"
                style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)', background: 'transparent' }}>
                Cancelar
              </button>
              <button onClick={handleSaveSection}
                className="px-4 py-2.5 rounded-lg bg-cpe-red text-white font-semibold hover:bg-cpe-red/80 transition-colors">
                Salvar submódulo
              </button>
            </div>
          </div>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl shadow-2xl border" style={{ background: 'var(--adm-modal)', borderColor: 'var(--adm-border)' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--adm-border)' }}>
              <h4 className="font-bold text-xl" style={{ color: 'var(--adm-text)' }}>
                {modal.mode === 'create' ? 'Novo registro' : modal.mode === 'edit' ? 'Editar registro' : 'Visualizar registro'}
              </h4>
              <button onClick={closeModal} style={{ color: 'var(--adm-muted)' }}><X size={22} /></button>
            </div>
            <div className="px-6 py-5 grid grid-cols-12 gap-4">
              <div className="col-span-12 sm:col-span-4">
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Seção</label>
                {isView ? (
                  <input readOnly value={sections.find(s => s.id === form.secao)?.label ?? form.secao} className={inputClass()} style={roStyle} />
                ) : (
                  <select value={form.secao} onChange={e => changeField('secao', e.target.value)}
                    className="adm-input w-full rounded-lg px-3 py-2.5 text-base border" style={fieldStyle}>
                    {sections.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                )}
              </div>
              <div className="col-span-12 sm:col-span-2">
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Nº</label>
                <input type="number" value={form.num}
                  onChange={e => changeField('num', Number(e.target.value))}
                  readOnly={isView} className={inputClass()} style={isView ? roStyle : fieldStyle} />
              </div>
              <div className="col-span-12 sm:col-span-6">
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Graduação</label>
                <input type="text" value={form.graduacao}
                  onChange={e => changeField('graduacao', e.target.value)}
                  readOnly={isView}
                  className={inputClass(errors.graduacao)}
                  style={isView ? roStyle : { ...fieldStyle, ...(errors.graduacao ? { borderColor: '#ef4444' } : {}) }} />
              </div>
              <div className="col-span-12 sm:col-span-4">
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>RG</label>
                <input type="text" value={form.rg}
                  onChange={e => changeField('rg', e.target.value)}
                  readOnly={isView}
                  className={inputClass(errors.rg)}
                  style={isView ? roStyle : { ...fieldStyle, ...(errors.rg ? { borderColor: '#ef4444' } : {}) }} />
              </div>
              <div className="col-span-12 sm:col-span-8">
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Nome</label>
                <input type="text" value={form.nome}
                  onChange={e => changeField('nome', e.target.value)}
                  readOnly={isView}
                  className={inputClass(errors.nome)}
                  style={isView ? roStyle : { ...fieldStyle, ...(errors.nome ? { borderColor: '#ef4444' } : {}) }} />
              </div>
              <div className="col-span-12 sm:col-span-6">
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Função</label>
                <input type="text" value={form.funcao}
                  onChange={e => changeField('funcao', e.target.value)}
                  readOnly={isView} className={inputClass()} style={isView ? roStyle : fieldStyle} />
              </div>
              <div className="col-span-12 sm:col-span-6">
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Dias</label>
                <input type="text" value={form.dias}
                  onChange={e => changeField('dias', e.target.value)}
                  readOnly={isView}
                  className={inputClass(errors.dias)}
                  style={isView ? roStyle : { ...fieldStyle, ...(errors.dias ? { borderColor: '#ef4444' } : {}) }} />
              </div>
              <div className="col-span-12 sm:col-span-4">
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Início</label>
                <input type="text" value={form.inicio}
                  onChange={e => changeField('inicio', e.target.value)}
                  readOnly={isView}
                  className={inputClass(errors.inicio)}
                  style={isView ? roStyle : { ...fieldStyle, ...(errors.inicio ? { borderColor: '#ef4444' } : {}) }} />
              </div>
              <div className="col-span-12 sm:col-span-4">
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Fim</label>
                <input type="text" value={form.fim}
                  onChange={e => changeField('fim', e.target.value)}
                  readOnly={isView}
                  className={inputClass(errors.fim)}
                  style={isView ? roStyle : { ...fieldStyle, ...(errors.fim ? { borderColor: '#ef4444' } : {}) }} />
              </div>
              <div className="col-span-12 sm:col-span-4">
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Disp. Cmdo</label>
                <input type="text" value={form.dispCmdo}
                  onChange={e => changeField('dispCmdo', e.target.value)}
                  readOnly={isView} className={inputClass()} style={isView ? roStyle : fieldStyle} />
              </div>
              <div className="col-span-12 sm:col-span-4">
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Pronto</label>
                <input type="text" value={form.pronto}
                  onChange={e => changeField('pronto', e.target.value)}
                  readOnly={isView} className={inputClass()} style={isView ? roStyle : fieldStyle} />
              </div>
              <div className="col-span-12 sm:col-span-8">
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Observação</label>
                <input type="text" value={form.observacao}
                  onChange={e => changeField('observacao', e.target.value)}
                  readOnly={isView} className={inputClass()} style={isView ? roStyle : fieldStyle} />
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 px-6 pb-5">
              {!isView && (
                <button onClick={closeModal}
                  className="px-5 py-2.5 text-base rounded-lg border transition-colors"
                  style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)', background: 'transparent' }}>
                  Cancelar
                </button>
              )}
              <div className="flex gap-3">
                {isView ? (
                  <button onClick={closeModal}
                    className="px-5 py-2.5 text-base rounded-lg border transition-colors"
                    style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)', background: 'transparent' }}>
                    Fechar
                  </button>
                ) : (
                  <button onClick={handleSave}
                    className="flex items-center gap-2 px-5 py-2.5 text-base font-semibold text-white bg-cpe-red hover:bg-cpe-red/80 rounded-lg transition-colors">
                    <Save size={16} /> Salvar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl shadow-2xl border p-6"
            style={{ background: 'var(--adm-modal)', borderColor: 'var(--adm-border)' }}>
            <h4 className="font-bold text-xl mb-2" style={{ color: 'var(--adm-text)' }}>Confirmar exclusão</h4>
            <p className="text-base mb-1" style={{ color: 'var(--adm-muted)' }}>
              Deseja excluir o registro de{' '}
              <span className="font-semibold" style={{ color: 'var(--adm-text)' }}>{deleteTarget.nome}</span>?
            </p>
            <p className="text-sm mb-6" style={{ color: 'var(--adm-subtle)' }}>
              {deleteTarget.secao.toUpperCase()} — {deleteTarget.graduacao} {deleteTarget.rg}
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteTarget(null)}
                className="px-5 py-2.5 text-base rounded-lg border transition-colors"
                style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)', background: 'transparent' }}>
                Cancelar
              </button>
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
