import { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  ArrowLeft, ChevronLeft, ChevronRight, Download, Eye, FilterX, Pencil, Plus,
  Printer, Save, Search, Trash2, X,
} from 'lucide-react';
import {
  DIAS_SEMANA_QTS, qts50CptDB, QtsRegistro, TIPOS_ATIVIDADE_QTS, TipoAtividadeQts,
} from '../../data/qts50Cpt';
import { usePersistentState } from '../../hooks/usePersistentState';
import { ModulePermission } from '../../types/rbac';

type ModalMode = 'view' | 'edit' | 'create';

interface Props {
  onBack: () => void;
  permissions?: ModulePermission;
}

const PAGE_SIZE = 20;

const emptyForm = (): Omit<QtsRegistro, 'id'> => ({
  periodo: '',
  diaSemana: 'Segunda-feira',
  data: '',
  aula: '',
  horario: '',
  disciplina: '',
  instrutor: '',
  turma: '',
  tipo: 'Aula',
});

function dayOrder(day: string): number {
  const index = DIAS_SEMANA_QTS.indexOf(day as (typeof DIAS_SEMANA_QTS)[number]);
  return index === -1 ? 99 : index;
}

function typeColor(tipo: TipoAtividadeQts): string {
  if (tipo === 'Aula') return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
  if (tipo === 'Formatura') return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
  if (tipo === 'Intervalo') return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
  if (tipo === 'Almoço') return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
  return 'bg-slate-500/15 text-slate-400 border-slate-500/30';
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
}

export default function Qts50CptModule({ onBack, permissions }: Props) {
  const canCreate = !permissions || permissions.create;
  const canEdit = !permissions || permissions.edit;
  const canDelete = !permissions || permissions.delete;
  const [registros, setRegistros] = usePersistentState<QtsRegistro[]>('cpe-site:qts-50-cpt:v2', qts50CptDB);
  const [search, setSearch] = useState('');
  const [diaFiltro, setDiaFiltro] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('');
  const [periodoFiltro, setPeriodoFiltro] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<{ mode: ModalMode; item: QtsRegistro | null } | null>(null);
  const [form, setForm] = useState<Omit<QtsRegistro, 'id'>>(emptyForm());
  const [errors, setErrors] = useState<{ diaSemana?: string; horario?: string; disciplina?: string }>({});
  const [deleteTarget, setDeleteTarget] = useState<QtsRegistro | null>(null);

  const periodos = useMemo(() => Array.from(new Set(registros.map(item => item.periodo.trim()).filter(Boolean))).sort(), [registros]);

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('pt-BR');
    return registros
      .filter(item => !query || [
        item.periodo, item.diaSemana, item.data, item.aula, item.horario,
        item.disciplina, item.instrutor, item.turma, item.tipo,
      ].some(value => value.toLocaleLowerCase('pt-BR').includes(query)))
      .filter(item => !diaFiltro || item.diaSemana === diaFiltro)
      .filter(item => !tipoFiltro || item.tipo === tipoFiltro)
      .filter(item => !periodoFiltro || item.periodo === periodoFiltro)
      .sort((a, b) =>
        dayOrder(a.diaSemana) - dayOrder(b.diaSemana)
        || a.data.localeCompare(b.data)
        || a.horario.localeCompare(b.horario, 'pt-BR', { numeric: true }),
      );
  }, [registros, search, diaFiltro, tipoFiltro, periodoFiltro]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const start = filtered.length ? (safePage - 1) * PAGE_SIZE + 1 : 0;
  const end = Math.min(safePage * PAGE_SIZE, filtered.length);

  const resetPage = () => setPage(1);
  const clearFilters = () => {
    setSearch('');
    setDiaFiltro('');
    setTipoFiltro('');
    setPeriodoFiltro('');
    setPage(1);
  };

  const openCreate = () => {
    setForm(emptyForm());
    setErrors({});
    setModal({ mode: 'create', item: null });
  };
  const openView = (item: QtsRegistro) => {
    setForm(item);
    setErrors({});
    setModal({ mode: 'view', item });
  };
  const openEdit = (item: QtsRegistro) => {
    setForm(item);
    setErrors({});
    setModal({ mode: 'edit', item });
  };
  const changeField = (key: keyof Omit<QtsRegistro, 'id'>, value: string) => {
    setForm(current => ({ ...current, [key]: value }));
    if (key in errors) setErrors(current => ({ ...current, [key]: undefined }));
  };
  const validate = () => {
    const next: typeof errors = {};
    if (!form.diaSemana) next.diaSemana = 'Dia da semana obrigatório';
    if (!form.horario.trim()) next.horario = 'Horário obrigatório';
    if (!form.disciplina.trim()) next.disciplina = 'Disciplina ou atividade obrigatória';
    setErrors(next);
    return Object.keys(next).length === 0;
  };
  const save = () => {
    if (!validate()) return;
    if (modal?.mode === 'create') {
      setRegistros(current => [...current, { ...form, id: `qts-${Date.now()}` }]);
    } else if (modal?.mode === 'edit' && modal.item) {
      setRegistros(current => current.map(item => item.id === modal.item?.id ? { ...form, id: item.id } : item));
    }
    setModal(null);
  };
  const remove = () => {
    if (!deleteTarget) return;
    setRegistros(current => current.filter(item => item.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const exportXlsx = () => {
    const rows = filtered.map(item => ({
      Período: item.periodo,
      'Dia da semana': item.diaSemana,
      Data: item.data,
      Aula: item.aula,
      Horário: item.horario,
      Tipo: item.tipo,
      'Disciplina / Atividade': item.disciplina,
      'Instrutor(a)': item.instrutor,
      Turma: item.turma,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [{ wch: 18 }, { wch: 18 }, { wch: 12 }, { wch: 8 }, { wch: 16 }, { wch: 14 }, { wch: 34 }, { wch: 28 }, { wch: 12 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Registros QTS');
    XLSX.writeFile(wb, 'registros-qts-50-cpt.xlsx');
  };

  const printReport = () => {
    const filterDescription = [
      search && `Busca: “${search}”`,
      diaFiltro && `Dia: ${diaFiltro}`,
      tipoFiltro && `Tipo: ${tipoFiltro}`,
      periodoFiltro && `Período: ${periodoFiltro}`,
    ].filter(Boolean).join(' · ') || 'Todos os registros';

    const recordsByDay = DIAS_SEMANA_QTS.map(day =>
      filtered.filter(item => item.diaSemana === day),
    );
    const rowCount = Math.max(1, ...recordsByDay.map(items => items.length));
    const periods = Array.from(new Set(filtered.map(item => item.periodo).filter(Boolean))).join(' | ') || 'Não informado';

    const renderCells = (item: QtsRegistro | undefined): string => {
      if (!item) return '<td></td><td></td><td></td><td></td><td></td>';
      const schedule = escapeHtml(item.horario).replace(/\s+/g, '<br>');
      const isMerged = item.tipo !== 'Aula' && !item.instrutor && !item.turma;
      if (isMerged) {
        return `<td colspan="2" class="time merged-time">${schedule}</td><td colspan="3" class="merged-label">${escapeHtml(item.disciplina)}</td>`;
      }
      return `<td class="lesson">${escapeHtml(item.aula)}</td><td class="time">${schedule}</td><td class="subject">${escapeHtml(item.disciplina)}</td><td class="instructor">${escapeHtml(item.instrutor)}</td><td class="class">${escapeHtml(item.turma)}</td>`;
    };

    const rows = Array.from({ length: rowCount }, (_, rowIndex) =>
      `<tr>${recordsByDay.map(items => renderCells(items[rowIndex])).join('')}</tr>`,
    ).join('');

    const colGroup = DIAS_SEMANA_QTS.map(() =>
      '<col class="lesson-col"><col class="time-col"><col class="subject-col"><col class="instructor-col"><col class="class-col">',
    ).join('');

    const dayHeaders = DIAS_SEMANA_QTS.map((day, index) => {
      const date = recordsByDay[index].find(item => item.data)?.data ?? '';
      return `<th rowspan="2" class="short">A</th><th rowspan="2" class="short">H</th><th colspan="3" class="day-name">${escapeHtml(day)} <span>(${escapeHtml(formatDate(date))})</span></th>`;
    }).join('');

    const fieldHeaders = DIAS_SEMANA_QTS.map(() =>
      '<th>Disciplina</th><th>Instrutor(a)</th><th class="short">T</th>',
    ).join('');

    const report = `<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><title>QTS 50º CPT</title><style>
      @page { size: A3 landscape; margin: 8mm; }
      * { box-sizing: border-box; }
      body { margin: 0; color: #000; font-family: "Times New Roman", serif; font-size: 8px; }
      header { text-align: center; margin-bottom: 6px; }
      header h1 { margin: 0; font-size: 15px; text-transform: uppercase; }
      header h2 { margin: 2px 0; font-size: 11px; }
      .meta { display: flex; justify-content: space-between; gap: 12px; margin: 5px 0; font: 8px Arial, sans-serif; }
      table { width: 100%; border-collapse: collapse; table-layout: fixed; }
      col.lesson-col { width: 1.9%; } col.time-col { width: 2.35%; } col.subject-col { width: 7.1%; }
      col.instructor-col { width: 7.2%; } col.class-col { width: 1.45%; }
      th, td { border: 1px solid #111; text-align: center; vertical-align: middle; overflow-wrap: anywhere; }
      thead { display: table-header-group; }
      thead th { background: #d4d4d4 !important; padding: 5px 2px; font-size: 8px; font-weight: 700; text-transform: uppercase; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      thead tr:first-child th { height: 27px; font-size: 11px; text-transform: none; }
      thead tr:first-child th.short { font-size: 9px; text-transform: uppercase; }
      .day-name span { font-weight: 400; }
      tbody tr { height: 31px; break-inside: avoid; page-break-inside: avoid; }
      tbody td { padding: 2px; font-size: 8px; }
      tbody td:nth-child(5n), thead th:nth-child(5n) { border-right-width: 2px; }
      .lesson { font-size: 10px; font-weight: 700; }
      .time { font-size: 7px; line-height: 1.25; font-family: Arial, sans-serif; }
      .subject, .instructor { text-transform: uppercase; font-weight: 600; }
      .class { font-size: 7px; }
      .merged-time, .merged-label { background: #d4d4d4 !important; font-weight: 700; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .merged-time { font-size: 8px; }
      .merged-label { font-size: 10px; text-transform: uppercase; }
      .signature { margin-top: 32px; text-align: center; break-inside: avoid; page-break-inside: avoid; }
      .signature strong { display: block; font-size: 11px; text-transform: uppercase; }
      .signature span { display: block; margin-top: 2px; font-size: 10px; }
      footer { margin-top: 5px; display: flex; justify-content: space-between; font: 7px Arial, sans-serif; }
    </style></head><body>
      <header><h1>Quadro de Trabalho Semanal — QTS</h1><h2>50º Curso de Patrulhamento Tático e Ações Especializadas de Polícia — 31ª CIPM — CPE</h2></header>
      <div class="meta"><span><strong>Período:</strong> ${escapeHtml(periods)}</span><span><strong>Filtros:</strong> ${escapeHtml(filterDescription)}</span><span><strong>Registros:</strong> ${filtered.length}</span></div>
      <table><colgroup>${colGroup}</colgroup><thead><tr>${dayHeaders}</tr><tr>${fieldHeaders}</tr></thead><tbody>${rows}</tbody></table>
      <div class="signature"><strong>RAFAEL BUENO GONÇALVES - CAPITÃO PM</strong><span>Coordenador do 50º CPT</span></div>
      <footer><span>QTS 50º CPT</span><span>Emitido em ${new Date().toLocaleString('pt-BR')}</span></footer>
    </body></html>`;

    const url = URL.createObjectURL(new Blob([report], { type: 'text/html;charset=utf-8' }));
    const printWindow = window.open(url, '_blank');
    if (printWindow) {
      printWindow.addEventListener('load', () => {
        printWindow.addEventListener('afterprint', () => URL.revokeObjectURL(url), { once: true });
        printWindow.print();
      });
    } else {
      URL.revokeObjectURL(url);
    }
  };

  const styleInput = { background: 'var(--adm-input)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' };
  const filtersActive = Boolean(search || diaFiltro || tipoFiltro || periodoFiltro);

  return <div>
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg border" style={styleInput} aria-label="Voltar"><ArrowLeft size={20} /></button>
        <div><h2 className="text-2xl font-bold" style={{ color: 'var(--adm-text)' }}>QTS 50º CPT</h2><p className="text-sm" style={{ color: 'var(--adm-muted)' }}>Gerenciamento de aulas e atividades</p></div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button onClick={printReport} className="flex items-center gap-2 px-3 py-2 rounded-lg border" style={styleInput}><Printer size={16} /> Imprimir</button>
        <button onClick={exportXlsx} className="flex items-center gap-2 px-3 py-2 rounded-lg border" style={styleInput}><Download size={16} /> Exportar</button>
        {canCreate && <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cpe-red text-white font-medium"><Plus size={17} /> Inserir registro</button>}
      </div>
    </div>

    <div className="rounded-2xl border p-4 mb-5" style={{ background: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_1fr_auto]">
        <div className="relative">
          <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--adm-muted)' }} />
          <input value={search} onChange={event => { setSearch(event.target.value); resetPage(); }} placeholder="Buscar disciplina, instrutor, horário, turma..." className="adm-input w-full pl-10 pr-3 py-2.5 rounded-lg border" style={styleInput} />
        </div>
        <select value={diaFiltro} onChange={event => { setDiaFiltro(event.target.value); resetPage(); }} className="adm-input px-3 py-2.5 rounded-lg border" style={styleInput}>
          <option value="">Todos os dias</option>{DIAS_SEMANA_QTS.map(day => <option key={day}>{day}</option>)}
        </select>
        <select value={tipoFiltro} onChange={event => { setTipoFiltro(event.target.value); resetPage(); }} className="adm-input px-3 py-2.5 rounded-lg border" style={styleInput}>
          <option value="">Todos os tipos</option>{TIPOS_ATIVIDADE_QTS.map(tipo => <option key={tipo}>{tipo}</option>)}
        </select>
        <select value={periodoFiltro} onChange={event => { setPeriodoFiltro(event.target.value); resetPage(); }} className="adm-input px-3 py-2.5 rounded-lg border" style={styleInput}>
          <option value="">Todos os períodos</option>{periodos.map(periodo => <option key={periodo}>{periodo}</option>)}
        </select>
        <button onClick={clearFilters} disabled={!filtersActive} title="Limpar filtros" className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border disabled:opacity-30" style={styleInput}><FilterX size={17} /><span className="xl:hidden">Limpar</span></button>
      </div>
    </div>

    <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1050px] text-sm">
          <thead style={{ background: 'var(--adm-tbl-head)', color: 'var(--adm-muted)' }}><tr>
            {['Dia / Data', 'Aula / Horário', 'Tipo', 'Disciplina / Atividade', 'Instrutor(a)', 'Turma', 'Ações'].map(label => <th key={label} className={`px-4 py-3 text-left text-xs uppercase tracking-wide ${label === 'Ações' ? 'text-right' : ''}`}>{label}</th>)}
          </tr></thead>
          <tbody>
            {paginated.map(item => <tr key={item.id} className="adm-row border-t" style={{ borderColor: 'var(--adm-border)' }}>
              <td className="px-4 py-3"><div className="font-medium" style={{ color: 'var(--adm-text)' }}>{item.diaSemana}</div><div className="text-xs mt-0.5" style={{ color: 'var(--adm-muted)' }}>{item.data || item.periodo || 'Sem data definida'}</div></td>
              <td className="px-4 py-3"><div style={{ color: 'var(--adm-text)' }}>{item.aula || '—'}</div><div className="text-xs" style={{ color: 'var(--adm-muted)' }}>{item.horario}</div></td>
              <td className="px-4 py-3"><span className={`inline-flex px-2 py-1 rounded-full border text-xs font-medium ${typeColor(item.tipo)}`}>{item.tipo}</span></td>
              <td className="px-4 py-3 max-w-[300px]"><div className="font-medium truncate" style={{ color: 'var(--adm-text)' }}>{item.disciplina || 'Não informada'}</div>{item.periodo && <div className="text-xs truncate" style={{ color: 'var(--adm-muted)' }}>Período: {item.periodo}</div>}</td>
              <td className="px-4 py-3" style={{ color: item.instrutor ? 'var(--adm-text)' : 'var(--adm-muted)' }}>{item.instrutor || 'Não informado'}</td>
              <td className="px-4 py-3" style={{ color: 'var(--adm-text)' }}>{item.turma || '—'}</td>
              <td className="px-4 py-3"><div className="flex items-center justify-end gap-1">
                <button onClick={() => openView(item)} title="Visualizar" className="p-2 rounded-lg hover:bg-white/5" style={{ color: 'var(--adm-muted)' }}><Eye size={17} /></button>
                {canEdit && <button onClick={() => openEdit(item)} title="Editar" className="p-2 rounded-lg hover:bg-white/5 text-blue-400"><Pencil size={17} /></button>}
                {canDelete && <button onClick={() => setDeleteTarget(item)} title="Excluir" className="p-2 rounded-lg hover:bg-white/5 text-red-400"><Trash2 size={17} /></button>}
              </div></td>
            </tr>)}
          </tbody>
        </table>
      </div>
      {paginated.length === 0 && <div className="py-16 text-center"><Search size={38} className="mx-auto mb-3 opacity-30" style={{ color: 'var(--adm-muted)' }} /><p className="font-medium" style={{ color: 'var(--adm-text)' }}>Nenhum registro encontrado</p><p className="text-sm mt-1" style={{ color: 'var(--adm-muted)' }}>Altere os filtros ou insira um novo registro.</p></div>}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t" style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)' }}>
        <span className="text-xs">Exibindo {start}–{end} de {filtered.length} registros</span>
        <div className="flex items-center gap-2"><button onClick={() => setPage(current => Math.max(1, current - 1))} disabled={safePage === 1} className="p-2 rounded-lg border disabled:opacity-30" style={styleInput}><ChevronLeft size={16} /></button><span className="text-xs">Página {safePage} de {totalPages}</span><button onClick={() => setPage(current => Math.min(totalPages, current + 1))} disabled={safePage === totalPages} className="p-2 rounded-lg border disabled:opacity-30" style={styleInput}><ChevronRight size={16} /></button></div>
      </div>
    </div>

    {modal && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"><div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border" style={{ background: 'var(--adm-modal)', borderColor: 'var(--adm-border)' }}>
      <div className="sticky top-0 flex items-center justify-between px-5 py-4 border-b" style={{ background: 'var(--adm-modal)', borderColor: 'var(--adm-border)' }}><div><h3 className="text-lg font-bold" style={{ color: 'var(--adm-text)' }}>{modal.mode === 'create' ? 'Inserir registro' : modal.mode === 'edit' ? 'Editar registro' : 'Detalhes do registro'}</h3><p className="text-xs mt-0.5" style={{ color: 'var(--adm-muted)' }}>QTS do 50º CPT</p></div><button onClick={() => setModal(null)} className="p-2" style={{ color: 'var(--adm-muted)' }}><X size={20} /></button></div>
      <div className="grid gap-4 p-5 sm:grid-cols-2">
        <Field label="Período"><input value={form.periodo} onChange={event => changeField('periodo', event.target.value)} readOnly={modal.mode === 'view'} placeholder="Ex.: 01/12/2026 a 05/12/2026" className="adm-input w-full px-3 py-2.5 rounded-lg border read-only:opacity-70" style={styleInput} /></Field>
        <Field label="Data"><input type="date" value={form.data} onChange={event => changeField('data', event.target.value)} readOnly={modal.mode === 'view'} className="adm-input w-full px-3 py-2.5 rounded-lg border read-only:opacity-70" style={styleInput} /></Field>
        <Field label="Dia da semana" error={errors.diaSemana}><select value={form.diaSemana} onChange={event => changeField('diaSemana', event.target.value)} disabled={modal.mode === 'view'} className="adm-input w-full px-3 py-2.5 rounded-lg border disabled:opacity-70" style={styleInput}>{DIAS_SEMANA_QTS.map(day => <option key={day}>{day}</option>)}</select></Field>
        <Field label="Tipo"><select value={form.tipo} onChange={event => changeField('tipo', event.target.value)} disabled={modal.mode === 'view'} className="adm-input w-full px-3 py-2.5 rounded-lg border disabled:opacity-70" style={styleInput}>{TIPOS_ATIVIDADE_QTS.map(tipo => <option key={tipo}>{tipo}</option>)}</select></Field>
        <Field label="Aula"><input value={form.aula} onChange={event => changeField('aula', event.target.value)} readOnly={modal.mode === 'view'} placeholder="Ex.: 1ª" className="adm-input w-full px-3 py-2.5 rounded-lg border read-only:opacity-70" style={styleInput} /></Field>
        <Field label="Horário" error={errors.horario}><input value={form.horario} onChange={event => changeField('horario', event.target.value)} readOnly={modal.mode === 'view'} placeholder="Ex.: 08:00 08:45" className="adm-input w-full px-3 py-2.5 rounded-lg border read-only:opacity-70" style={styleInput} /></Field>
        <div className="sm:col-span-2"><Field label="Disciplina / Atividade" error={errors.disciplina}><input value={form.disciplina} onChange={event => changeField('disciplina', event.target.value)} readOnly={modal.mode === 'view'} placeholder="Nome da disciplina ou atividade" className="adm-input w-full px-3 py-2.5 rounded-lg border read-only:opacity-70" style={styleInput} /></Field></div>
        <Field label="Instrutor(a)"><input value={form.instrutor} onChange={event => changeField('instrutor', event.target.value)} readOnly={modal.mode === 'view'} placeholder="Nome do instrutor" className="adm-input w-full px-3 py-2.5 rounded-lg border read-only:opacity-70" style={styleInput} /></Field>
        <Field label="Turma / T"><input value={form.turma} onChange={event => changeField('turma', event.target.value)} readOnly={modal.mode === 'view'} placeholder="Turma" className="adm-input w-full px-3 py-2.5 rounded-lg border read-only:opacity-70" style={styleInput} /></Field>
      </div>
      <div className="flex justify-end gap-2 px-5 py-4 border-t" style={{ borderColor: 'var(--adm-border)' }}><button onClick={() => setModal(null)} className="px-4 py-2 rounded-lg border" style={styleInput}>{modal.mode === 'view' ? 'Fechar' : 'Cancelar'}</button>{modal.mode !== 'view' && <button onClick={save} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cpe-red text-white"><Save size={16} /> Salvar</button>}</div>
    </div></div>}

    {deleteTarget && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"><div className="w-full max-w-md rounded-2xl border p-6" style={{ background: 'var(--adm-modal)', borderColor: 'var(--adm-border)' }}><h3 className="text-lg font-bold" style={{ color: 'var(--adm-text)' }}>Excluir registro?</h3><p className="mt-2 text-sm" style={{ color: 'var(--adm-muted)' }}>{deleteTarget.disciplina || 'Atividade sem disciplina'} — {deleteTarget.diaSemana}, {deleteTarget.horario}.</p><div className="flex justify-end gap-2 mt-6"><button onClick={() => setDeleteTarget(null)} className="px-4 py-2 rounded-lg border" style={styleInput}>Cancelar</button><button onClick={remove} className="px-4 py-2 rounded-lg bg-red-600 text-white">Excluir</button></div></div></div>}
  </div>;
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <label className="block text-sm" style={{ color: 'var(--adm-muted)' }}><span className="block mb-1.5 font-medium">{label}</span>{children}{error && <span className="block mt-1 text-xs text-red-400">{error}</span>}</label>;
}
