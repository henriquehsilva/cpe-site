import { useMemo, useState } from 'react';
import {
  ArrowLeft, CalendarDays, ChevronLeft, ChevronRight, Clock,
  MapPin, Pencil, Plus, Save, Search, Trash2, X,
} from 'lucide-react';
import { agendaDB, AGENDA_CORES, AgendaCompromisso } from '../../data/agenda';
import { usePersistentState } from '../../hooks/usePersistentState';
import { ModulePermission } from '../../types/rbac';

interface Props {
  onBack: () => void;
  permissions?: ModulePermission;
}

type FormData = Omit<AgendaCompromisso, 'id'>;
type ModalMode = 'view' | 'create' | 'edit';

const WEEK_DAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function dateToIso(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function isoToDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function addDays(date: Date, amount: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

function monthLabel(date: Date): string {
  const label = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function fullDateLabel(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  }).format(isoToDate(iso));
}

function nextId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function emptyForm(date: string): FormData {
  return {
    titulo: '',
    inicio: date,
    fim: date,
    horaInicio: '08:00',
    horaFim: '09:00',
    diaInteiro: true,
    local: '',
    categoria: '',
    notas: '',
    cor: AGENDA_CORES[0].valor,
  };
}

function eventTime(event: AgendaCompromisso): string {
  if (event.diaInteiro) return 'Dia inteiro';
  if (!event.horaFim) return event.horaInicio;
  return `${event.horaInicio} – ${event.horaFim}`;
}

export default function AgendaModule({ onBack, permissions }: Props) {
  const canCreate = !permissions || permissions.create;
  const canEdit = !permissions || permissions.edit;
  const canDelete = !permissions || permissions.delete;
  const today = new Date();
  const todayIso = dateToIso(today);

  const [data, setData] = usePersistentState<AgendaCompromisso[]>('cpe-site:agenda:v1', agendaDB);
  const [currentMonth, setCurrentMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ mode: ModalMode; item: AgendaCompromisso | null } | null>(null);
  const [form, setForm] = useState<FormData>(() => emptyForm(todayIso));
  const [error, setError] = useState('');
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  const calendarDays = useMemo(() => {
    const first = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const gridStart = addDays(first, -first.getDay());
    return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
  }, [currentMonth]);

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('pt-BR');
    const rows = query
      ? data.filter(item => [item.titulo, item.local, item.categoria, item.notas]
          .some(value => value.toLocaleLowerCase('pt-BR').includes(query)))
      : data;

    return [...rows].sort((a, b) =>
      a.inicio.localeCompare(b.inicio)
      || a.horaInicio.localeCompare(b.horaInicio)
      || a.titulo.localeCompare(b.titulo, 'pt-BR'),
    );
  }, [data, search]);

  const eventsForDay = (iso: string) => filtered.filter(item => item.inicio <= iso && item.fim >= iso);
  const monthStart = dateToIso(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1));
  const monthEnd = dateToIso(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0));
  const monthCount = filtered.filter(item => item.inicio <= monthEnd && item.fim >= monthStart).length;

  const navigateMonth = (amount: number) => {
    setCurrentMonth(value => new Date(value.getFullYear(), value.getMonth() + amount, 1));
  };

  const goToday = () => {
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  const openCreate = (date = dateToIso(currentMonth)) => {
    setForm(emptyForm(date));
    setError('');
    setModal({ mode: 'create', item: null });
  };

  const openEvent = (event: AgendaCompromisso) => {
    setExpandedDay(null);
    setForm({
      titulo: event.titulo,
      inicio: event.inicio,
      fim: event.fim,
      horaInicio: event.horaInicio,
      horaFim: event.horaFim,
      diaInteiro: event.diaInteiro,
      local: event.local,
      categoria: event.categoria,
      notas: event.notas,
      cor: event.cor,
    });
    setError('');
    setModal({ mode: canEdit ? 'edit' : 'view', item: event });
  };

  const saveEvent = () => {
    if (!form.titulo.trim()) {
      setError('Informe o título do compromisso.');
      return;
    }
    if (!form.inicio || !form.fim) {
      setError('Informe as datas de início e término.');
      return;
    }
    if (form.fim < form.inicio) {
      setError('A data de término não pode ser anterior à data de início.');
      return;
    }

    const normalized: FormData = {
      ...form,
      titulo: form.titulo.trim(),
      local: form.local.trim(),
      categoria: form.categoria.trim(),
      notas: form.notas.trim(),
      horaInicio: form.diaInteiro ? '' : form.horaInicio,
      horaFim: form.diaInteiro ? '' : form.horaFim,
    };

    if (modal?.mode === 'create') {
      setData(items => [...items, { id: nextId(), ...normalized }]);
    } else if (modal?.item) {
      setData(items => items.map(item => item.id === modal.item!.id ? { id: item.id, ...normalized } : item));
    }

    setCurrentMonth(new Date(isoToDate(normalized.inicio).getFullYear(), isoToDate(normalized.inicio).getMonth(), 1));
    setModal(null);
  };

  const deleteEvent = () => {
    if (!modal?.item || !window.confirm(`Excluir o compromisso “${modal.item.titulo}”?`)) return;
    setData(items => items.filter(item => item.id !== modal.item!.id));
    setModal(null);
  };

  const isReadOnly = modal?.mode === 'view';
  const inputClass = 'w-full rounded-md border border-[#dadce0] bg-white px-3 py-2.5 text-sm text-[#202124] outline-none transition-shadow focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] disabled:bg-[#f8f9fa] disabled:text-[#5f6368]';

  return (
    <div className="min-h-full rounded-2xl bg-white text-[#202124] shadow-xl overflow-hidden">
      <header className="flex flex-wrap items-center gap-3 border-b border-[#dadce0] px-4 py-3 sm:px-6">
        <button onClick={onBack} className="rounded-full p-2 text-[#5f6368] hover:bg-[#f1f3f4]" title="Voltar aos módulos">
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-2 mr-2">
          <CalendarDays size={27} className="text-[#1a73e8]" />
          <h2 className="text-xl font-medium text-[#3c4043]">Agenda</h2>
        </div>

        <button onClick={goToday} className="rounded border border-[#dadce0] px-4 py-2 text-sm font-medium hover:bg-[#f8f9fa]">
          Hoje
        </button>
        <div className="flex items-center">
          <button onClick={() => navigateMonth(-1)} className="rounded-full p-2 hover:bg-[#f1f3f4]" title="Mês anterior">
            <ChevronLeft size={20} />
          </button>
          <button onClick={() => navigateMonth(1)} className="rounded-full p-2 hover:bg-[#f1f3f4]" title="Próximo mês">
            <ChevronRight size={20} />
          </button>
        </div>
        <h3 className="min-w-[190px] text-lg font-medium text-[#3c4043]">{monthLabel(currentMonth)}</h3>

        <div className="relative ml-auto min-w-[190px] flex-1 sm:max-w-xs">
          <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5f6368]" />
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Pesquisar"
            className="w-full rounded-lg bg-[#f1f3f4] py-2.5 pl-10 pr-9 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#1a73e8]/30"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-[#dadce0]">
              <X size={15} />
            </button>
          )}
        </div>
        {canCreate && (
          <button onClick={() => openCreate(todayIso)} className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-medium shadow-md ring-1 ring-[#dadce0] hover:bg-[#f8f9fa] hover:shadow-lg">
            <Plus size={20} className="text-[#1a73e8]" /> Criar
          </button>
        )}
      </header>

      <div className="flex items-center justify-between border-b border-[#dadce0] bg-[#f8f9fa] px-4 py-2 text-xs text-[#5f6368] sm:px-6">
        <span>{monthCount} compromisso{monthCount !== 1 ? 's' : ''} neste mês</span>
        <span>{data.length} no total</span>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          <div className="grid grid-cols-7 border-b border-[#dadce0] bg-white">
            {WEEK_DAYS.map(day => (
              <div key={day} className="py-2 text-center text-[11px] font-medium tracking-wide text-[#70757a]">{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {calendarDays.map(day => {
              const iso = dateToIso(day);
              const events = eventsForDay(iso);
              const inMonth = day.getMonth() === currentMonth.getMonth();
              const isToday = iso === todayIso;

              return (
                <div
                  key={iso}
                  onClick={() => canCreate && openCreate(iso)}
                  className={`min-h-[132px] border-b border-r border-[#dadce0] p-1.5 ${inMonth ? 'bg-white' : 'bg-[#f8f9fa]'} ${canCreate ? 'cursor-pointer' : ''}`}
                >
                  <div className="mb-1 flex justify-center">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${isToday ? 'bg-[#1a73e8] font-semibold text-white' : inMonth ? 'text-[#3c4043]' : 'text-[#9aa0a6]'}`}>
                      {day.getDate()}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {events.slice(0, 4).map(event => (
                      <button
                        key={event.id}
                        onClick={click => { click.stopPropagation(); openEvent(event); }}
                        className="block w-full truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium text-white shadow-sm hover:brightness-95"
                        style={{ backgroundColor: event.cor }}
                        title={`${eventTime(event)} — ${event.titulo}`}
                      >
                        {!event.diaInteiro && <span className="mr-1 opacity-80">{event.horaInicio}</span>}
                        {event.titulo}
                      </button>
                    ))}
                    {events.length > 4 && (
                      <button
                        onClick={click => { click.stopPropagation(); setExpandedDay(iso); }}
                        className="w-full px-1 text-left text-[11px] font-medium text-[#5f6368] hover:text-[#1a73e8]"
                      >
                        +{events.length - 4} outros
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {expandedDay && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onMouseDown={() => setExpandedDay(null)}>
          <div className="max-h-[80vh] w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl" onMouseDown={event => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[#dadce0] px-5 py-4">
              <div>
                <h4 className="font-medium text-[#202124]">{fullDateLabel(expandedDay)}</h4>
                <p className="mt-0.5 text-xs text-[#5f6368]">{eventsForDay(expandedDay).length} compromissos</p>
              </div>
              <button onClick={() => setExpandedDay(null)} className="rounded-full p-2 hover:bg-[#f1f3f4]"><X size={18} /></button>
            </div>
            <div className="max-h-[60vh] space-y-2 overflow-y-auto p-4">
              {eventsForDay(expandedDay).map(event => (
                <button key={event.id} onClick={() => openEvent(event)} className="flex w-full items-start gap-3 rounded-lg p-3 text-left hover:bg-[#f8f9fa]">
                  <span className="mt-1.5 h-3 w-3 flex-none rounded" style={{ backgroundColor: event.cor }} />
                  <span className="min-w-0">
                    <span className="block font-medium text-[#202124]">{event.titulo}</span>
                    <span className="mt-0.5 block text-xs text-[#5f6368]">{eventTime(event)}{event.local ? ` · ${event.local}` : ''}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onMouseDown={() => setModal(null)}>
          <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white shadow-2xl" onMouseDown={event => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[#dadce0] px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="h-4 w-4 rounded" style={{ backgroundColor: form.cor }} />
                <h4 className="text-lg font-medium">
                  {modal.mode === 'create' ? 'Novo compromisso' : modal.mode === 'edit' ? 'Editar compromisso' : 'Compromisso'}
                </h4>
              </div>
              <button onClick={() => setModal(null)} className="rounded-full p-2 hover:bg-[#f1f3f4]"><X size={19} /></button>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#5f6368]">Título</label>
                <input disabled={isReadOnly} value={form.titulo} onChange={event => { setForm(value => ({ ...value, titulo: event.target.value })); setError(''); }} className={inputClass} autoFocus={!isReadOnly} />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#5f6368]">Data de início</label>
                  <input disabled={isReadOnly} type="date" value={form.inicio} onChange={event => setForm(value => ({ ...value, inicio: event.target.value, fim: value.fim < event.target.value ? event.target.value : value.fim }))} className={inputClass} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#5f6368]">Data de término</label>
                  <input disabled={isReadOnly} type="date" min={form.inicio} value={form.fim} onChange={event => setForm(value => ({ ...value, fim: event.target.value }))} className={inputClass} />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-[#3c4043]">
                <input disabled={isReadOnly} type="checkbox" checked={form.diaInteiro} onChange={event => setForm(value => ({ ...value, diaInteiro: event.target.checked }))} className="h-4 w-4 accent-[#1a73e8]" />
                Dia inteiro
              </label>

              {!form.diaInteiro && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-[#5f6368]"><Clock size={13} /> Horário inicial</label>
                    <input disabled={isReadOnly} type="time" value={form.horaInicio} onChange={event => setForm(value => ({ ...value, horaInicio: event.target.value }))} className={inputClass} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[#5f6368]">Horário final</label>
                    <input disabled={isReadOnly} type="time" value={form.horaFim} onChange={event => setForm(value => ({ ...value, horaFim: event.target.value }))} className={inputClass} />
                  </div>
                </div>
              )}

              <div>
                <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-[#5f6368]"><MapPin size={13} /> Local</label>
                <input disabled={isReadOnly} value={form.local} onChange={event => setForm(value => ({ ...value, local: event.target.value }))} className={inputClass} />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#5f6368]">Categoria</label>
                <input disabled={isReadOnly} value={form.categoria} onChange={event => setForm(value => ({ ...value, categoria: event.target.value }))} className={inputClass} placeholder="Ex.: Operação, reunião, férias" />
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-[#5f6368]">Cor do compromisso</label>
                <div className="flex flex-wrap gap-2">
                  {AGENDA_CORES.map(color => (
                    <button
                      key={color.valor}
                      type="button"
                      disabled={isReadOnly}
                      onClick={() => setForm(value => ({ ...value, cor: color.valor }))}
                      className={`h-7 w-7 rounded-full transition-transform ${form.cor === color.valor ? 'scale-110 ring-2 ring-[#202124] ring-offset-2' : 'hover:scale-110'}`}
                      style={{ backgroundColor: color.valor }}
                      title={color.nome}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#5f6368]">Notas</label>
                <textarea disabled={isReadOnly} value={form.notas} onChange={event => setForm(value => ({ ...value, notas: event.target.value }))} className={`${inputClass} min-h-[100px] resize-y`} />
              </div>

              {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[#dadce0] px-6 py-4">
              {modal.item && canDelete && (
                <button onClick={deleteEvent} className="mr-auto flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-[#d93025] hover:bg-red-50">
                  <Trash2 size={16} /> Excluir
                </button>
              )}
              {isReadOnly ? (
                <button onClick={() => setModal(null)} className="rounded-md px-4 py-2 text-sm font-medium text-[#1a73e8] hover:bg-blue-50">Fechar</button>
              ) : (
                <>
                  <button onClick={() => setModal(null)} className="rounded-md px-4 py-2 text-sm font-medium text-[#5f6368] hover:bg-[#f1f3f4]">Cancelar</button>
                  <button onClick={saveEvent} className="flex items-center gap-2 rounded-md bg-[#1a73e8] px-4 py-2 text-sm font-medium text-white hover:bg-[#1765cc]">
                    {modal.mode === 'edit' ? <Pencil size={15} /> : <Save size={15} />} Salvar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
