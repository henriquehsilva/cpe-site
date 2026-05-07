import { useState, useMemo } from 'react';
import {
  Search, Plus, Eye, Pencil, Trash2, X, ChevronUp, ChevronDown,
  Download, FileJson, FileText, Printer, ArrowLeft, Save, AlertCircle,
} from 'lucide-react';
import { efetivoDB, Militar, POSTOS_GRADUACOES } from '../../data/efetivo';
import { ModulePermission } from '../../types/rbac';

type SortKey = keyof Pick<Militar, 'ord' | 'posto' | 'rg' | 'nome'>;
type SortDir = 'asc' | 'desc';
type ModalMode = 'view' | 'edit' | 'create';

const POSTO_ORDER = [
  'MAJ PM', 'CAP PM', '1º TEN PM', '2º TEN PM',
  'SUBTEN PM', '1º SGT PM', '2º SGT PM', '3º SGT PM', 'CB PM', 'SD PM',
];

// ── Masks ──────────────────────────────────────────────
function maskCPF(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function maskPhone(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

// ── CPF validation ──────────────────────────────────────
function validateCPF(cpf: string): boolean {
  const d = cpf.replace(/\D/g, '');
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
  const dig = (len: number) => {
    let s = 0;
    for (let i = 0; i < len; i++) s += +d[i] * (len + 1 - i);
    const r = 11 - (s % 11);
    return r >= 10 ? 0 : r;
  };
  return dig(9) === +d[9] && dig(10) === +d[10];
}

// ── Reorder helpers ─────────────────────────────────────

// CREATE: se ord já existe, empurra os demais para baixo
function insertWithReorder(item: Militar, list: Militar[]): Militar[] {
  const conflict = list.some(m => m.ord === item.ord);
  if (!conflict) return [...list, item].sort((a, b) => a.ord - b.ord);
  const shifted = list.map(m => m.ord >= item.ord ? { ...m, ord: m.ord + 1 } : m);
  return [...shifted, item].sort((a, b) => a.ord - b.ord);
}

// DELETE: fecha o buraco decrementando quem estava abaixo
function reorderAfterDelete(deletedOrd: number, list: Militar[]): Militar[] {
  return list
    .map(m => m.ord > deletedOrd ? { ...m, ord: m.ord - 1 } : m)
    .sort((a, b) => a.ord - b.ord);
}

// EDIT (troca de posição): desloca apenas o intervalo afetado
function reorderAfterMove(item: Militar, oldOrd: number, list: Militar[]): Militar[] {
  const newOrd = item.ord;
  const reordered = list.map(m => {
    if (newOrd < oldOrd) {
      // subindo: empurra [newOrd, oldOrd-1] para baixo
      return m.ord >= newOrd && m.ord < oldOrd ? { ...m, ord: m.ord + 1 } : m;
    } else {
      // descendo: puxa [oldOrd+1, newOrd] para cima
      return m.ord > oldOrd && m.ord <= newOrd ? { ...m, ord: m.ord - 1 } : m;
    }
  });
  return [...reordered, item].sort((a, b) => a.ord - b.ord);
}

const emptyForm = (): Omit<Militar, 'id'> => ({
  ord: 0, posto: 'SD PM', rg: '', nome: '', cpf: '', telefone: '', obs: '',
});

interface Errors { cpf?: string; telefone?: string; nome?: string; }

export default function EfetivoModule({ onBack, permissions }: { onBack: () => void; permissions?: ModulePermission }) {
  const canCreate = !permissions || permissions.create;
  const canEdit   = !permissions || permissions.edit;
  const canDelete = !permissions || permissions.delete;
  const [data, setData] = useState<Militar[]>(efetivoDB);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('ord');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [modal, setModal] = useState<{ mode: ModalMode; item: Militar | null } | null>(null);
  const [form, setForm] = useState<Omit<Militar, 'id'>>(emptyForm());
  const [errors, setErrors] = useState<Errors>({});
  const [deleteTarget, setDeleteTarget] = useState<Militar | null>(null);
  const [showExport, setShowExport] = useState(false);

  // ── Filtered + sorted list ──────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const list = q
      ? data.filter(m =>
          m.nome.toLowerCase().includes(q) ||
          m.posto.toLowerCase().includes(q) ||
          m.rg.includes(q) ||
          m.telefone.includes(q)
        )
      : [...data];
    return list.sort((a, b) => {
      let cmp = sortKey === 'posto'
        ? POSTO_ORDER.indexOf(a.posto) - POSTO_ORDER.indexOf(b.posto)
        : sortKey === 'ord'
        ? a.ord - b.ord
        : String(a[sortKey]).localeCompare(String(b[sortKey]), 'pt-BR');
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, search, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  // ── Form helpers ────────────────────────────────────
  const changeField = (key: keyof Omit<Militar, 'id'>, raw: string) => {
    let value = raw;
    if (key === 'cpf') value = maskCPF(raw);
    if (key === 'telefone') value = maskPhone(raw);
    setForm(f => ({ ...f, [key]: key === 'ord' ? Number(raw) : value }));
    if (key in errors) setErrors(e => ({ ...e, [key]: undefined }));
  };

  const validate = (): boolean => {
    const errs: Errors = {};
    if (!form.nome.trim()) errs.nome = 'Nome obrigatório';
    const cpfDigits = form.cpf.replace(/\D/g, '');
    if (cpfDigits.length > 0 && !validateCPF(form.cpf))
      errs.cpf = 'CPF inválido';
    const telDigits = form.telefone.replace(/\D/g, '');
    if (telDigits.length > 0 && telDigits.length < 10)
      errs.telefone = 'Telefone incompleto';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Modal open/close ────────────────────────────────
  const openCreate = () => {
    setForm({ ...emptyForm(), ord: data.length + 1 });
    setErrors({});
    setModal({ mode: 'create', item: null });
  };
  const openView = (m: Militar) => { setForm(m); setErrors({}); setModal({ mode: 'view', item: m }); };
  const openEdit = (m: Militar) => { setForm(m); setErrors({}); setModal({ mode: 'edit', item: m }); };
  const closeModal = () => setModal(null);

  // ── Save with reorder ────────────────────────────────
  const handleSave = () => {
    if (!validate()) return;
    if (modal?.mode === 'create') {
      const item: Militar = { ...form, id: Date.now().toString() };
      setData(d => insertWithReorder(item, d));
    } else if (modal?.mode === 'edit' && modal.item) {
      const item: Militar = { ...form, id: modal.item.id };
      if (form.ord !== modal.item.ord) {
        const oldOrd = modal.item.ord;
        setData(d => reorderAfterMove(item, oldOrd, d.filter(m => m.id !== modal.item!.id)));
      } else {
        setData(d => d.map(m => m.id === item.id ? item : m));
      }
    }
    closeModal();
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const ord = deleteTarget.ord;
    setData(d => reorderAfterDelete(ord, d.filter(m => m.id !== deleteTarget.id)));
    setDeleteTarget(null);
  };

  // ── Exports ─────────────────────────────────────────
  const dl = (filename: string, type: string, content: string) => {
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([content], { type })),
      download: filename,
    });
    a.click(); URL.revokeObjectURL(a.href);
    setShowExport(false);
  };

  const exportCSV = () => {
    const rows = data.map(m =>
      `${m.ord},"${m.posto}","${m.rg}","${m.nome}","${m.cpf}","${m.telefone}","${m.obs}"`
    ).join('\n');
    dl('efetivo.csv', 'text/csv', '﻿Ord,Posto/Grad.,RG,Nome,CPF,Telefone,OBS\n' + rows);
  };

  const exportJSON = () => dl('efetivo.json', 'application/json', JSON.stringify(data, null, 2));

  const exportPrint = () => {
    const rows = data.map(m =>
      `<tr><td>${m.ord}</td><td>${m.posto}</td><td>${m.rg}</td><td>${m.nome}</td><td>${m.cpf}</td><td>${m.telefone}</td></tr>`
    ).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Efetivo 31ª CIPM-CPE</title>
      <style>body{font-family:Arial;font-size:12px}table{width:100%;border-collapse:collapse}
      th,td{border:1px solid #ccc;padding:5px 8px}th{background:#333;color:#fff}
      h3{margin-bottom:12px}</style></head><body>
      <h3>Efetivo Geral — 31ª CIPM-CPE</h3>
      <table><thead><tr><th>Ord</th><th>Posto/Grad.</th><th>RG</th><th>Nome</th><th>CPF</th><th>Telefone</th></tr></thead>
      <tbody>${rows}</tbody></table></body></html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, '_blank');
    if (w) w.addEventListener('load', () => { w.print(); URL.revokeObjectURL(url); });
    setShowExport(false);
  };

  // ── UI helpers ───────────────────────────────────────
  const SortIcon = ({ col }: { col: SortKey }) =>
    sortKey === col
      ? sortDir === 'asc'
        ? <ChevronUp size={13} className="inline ml-1" />
        : <ChevronDown size={13} className="inline ml-1" />
      : <ChevronUp size={13} className="inline ml-1 opacity-20" />;

  const isRO = modal?.mode === 'view';

  const inputCls = (err?: string) =>
    `adm-input w-full rounded-lg px-3 py-2.5 text-base border transition-colors ${
      err ? 'border-cpe-red/70' : ''
    }`;

  const fieldStyle = { background: 'var(--adm-input)', color: 'var(--adm-text)', border: '1px solid var(--adm-border)' };
  const roStyle   = { ...fieldStyle, opacity: 0.65 };

  return (
    <div className="flex flex-col h-full">

      {/* ── Toolbar ──────────────────────────────────── */}
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
        <h3 className="font-bold text-2xl flex-1" style={{ color: 'var(--adm-text)' }}>
          Efetivo — 31ª CIPM-CPE
        </h3>
        <span className="text-base" style={{ color: 'var(--adm-muted)' }}>
          {filtered.length} de {data.length} militares
        </span>

        {/* Export dropdown */}
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
              className="absolute right-0 top-full mt-1 rounded-xl shadow-2xl z-20 w-48 py-1.5 overflow-hidden"
              style={{ background: 'var(--adm-dropdown)', border: '1px solid var(--adm-border)' }}
            >
              <button onClick={exportCSV} className="adm-drop-item flex items-center gap-3 w-full px-4 py-3 text-base transition-colors" style={{ color: 'var(--adm-text)' }}>
                <FileText size={16} className="text-emerald-400" /> CSV
              </button>
              <button onClick={exportJSON} className="adm-drop-item flex items-center gap-3 w-full px-4 py-3 text-base transition-colors" style={{ color: 'var(--adm-text)' }}>
                <FileJson size={16} className="text-blue-400" /> JSON
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

      {/* ── Search ───────────────────────────────────── */}
      <div className="relative mb-4">
        <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--adm-muted)' }} />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nome, posto, RG ou telefone..."
          className="adm-input w-full rounded-xl pl-10 pr-10 py-3 text-base border"
          style={{ background: 'var(--adm-input)', color: 'var(--adm-text)', border: '1px solid var(--adm-border)' }}
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors" style={{ color: 'var(--adm-muted)' }}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* ── Table ────────────────────────────────────── */}
      <div className="flex-1 overflow-auto rounded-xl border" style={{ borderColor: 'var(--adm-border)' }}>
        <table className="w-full">
          <thead className="sticky top-0 z-10" style={{ background: 'var(--adm-tbl-head)' }}>
            <tr className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--adm-muted)' }}>
              <th className="px-4 py-3.5 text-left cursor-pointer hover:opacity-100 opacity-80 select-none w-16" onClick={() => toggleSort('ord')}>
                # <SortIcon col="ord" />
              </th>
              <th className="px-4 py-3.5 text-left cursor-pointer hover:opacity-100 opacity-80 select-none" onClick={() => toggleSort('posto')}>
                Posto/Grad. <SortIcon col="posto" />
              </th>
              <th className="px-4 py-3.5 text-left cursor-pointer hover:opacity-100 opacity-80 select-none w-24" onClick={() => toggleSort('rg')}>
                RG <SortIcon col="rg" />
              </th>
              <th className="px-4 py-3.5 text-left cursor-pointer hover:opacity-100 opacity-80 select-none" onClick={() => toggleSort('nome')}>
                Nome <SortIcon col="nome" />
              </th>
              <th className="px-4 py-3.5 text-left hidden lg:table-cell">Telefone</th>
              <th className="px-4 py-3.5 text-center w-32">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m, i) => (
              <tr
                key={m.id}
                className="adm-row border-t transition-colors"
                style={{
                  borderColor: 'var(--adm-border)',
                  background: i % 2 === 0 ? 'var(--adm-row-even)' : 'transparent',
                }}
              >
                <td className="px-4 py-3.5 text-base tabular-nums" style={{ color: 'var(--adm-subtle)' }}>{m.ord}</td>
                <td className="px-4 py-3.5 text-base font-medium" style={{ color: 'var(--adm-muted)' }}>{m.posto}</td>
                <td className="px-4 py-3.5 text-base tabular-nums" style={{ color: 'var(--adm-muted)' }}>{m.rg}</td>
                <td className="px-4 py-3.5 text-base font-semibold" style={{ color: 'var(--adm-text)' }}>{m.nome}</td>
                <td className="px-4 py-3.5 text-base hidden lg:table-cell" style={{ color: 'var(--adm-muted)' }}>{m.telefone}</td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => openView(m)} title="Visualizar" className="p-2 rounded-lg transition-colors hover:bg-blue-400/10 text-blue-400 opacity-70 hover:opacity-100">
                      <Eye size={17} />
                    </button>
                    {canEdit && (
                      <button onClick={() => openEdit(m)} title="Editar" className="p-2 rounded-lg transition-colors hover:bg-amber-400/10 text-amber-400 opacity-70 hover:opacity-100">
                        <Pencil size={17} />
                      </button>
                    )}
                    {canDelete && (
                      <button onClick={() => setDeleteTarget(m)} title="Remover" className="p-2 rounded-lg transition-colors hover:bg-cpe-red/10 text-cpe-red opacity-70 hover:opacity-100">
                        <Trash2 size={17} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-20 text-center text-lg" style={{ color: 'var(--adm-subtle)' }}>
                  Nenhum resultado encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Modal view/edit/create ────────────────────── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div
            className="w-full max-w-lg rounded-2xl shadow-2xl border"
            style={{ background: 'var(--adm-modal)', borderColor: 'var(--adm-border)' }}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--adm-border)' }}>
              <h4 className="font-bold text-xl" style={{ color: 'var(--adm-text)' }}>
                {modal.mode === 'create' ? 'Novo Militar' : modal.mode === 'edit' ? 'Editar Registro' : 'Visualizar Registro'}
              </h4>
              <button onClick={closeModal} className="transition-colors" style={{ color: 'var(--adm-muted)' }}>
                <X size={22} />
              </button>
            </div>

            {/* Fields */}
            <div className="px-6 py-5 grid grid-cols-2 gap-4">
              {/* Nº Ordem */}
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Nº Ordem</label>
                <input
                  type="number"
                  value={form.ord}
                  onChange={e => changeField('ord', e.target.value)}
                  readOnly={isRO}
                  className={inputCls()}
                  style={isRO ? roStyle : fieldStyle}
                />
                {!isRO && data.some(m => m.ord === form.ord && m.id !== modal.item?.id) && (
                  <p className="text-xs mt-1 text-amber-400 flex items-center gap-1">
                    <AlertCircle size={12} /> Os registros abaixo serão reordenados
                  </p>
                )}
              </div>

              {/* RG */}
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>RG</label>
                <input
                  type="text"
                  value={form.rg}
                  onChange={e => changeField('rg', e.target.value)}
                  readOnly={isRO}
                  className={inputCls()}
                  style={isRO ? roStyle : fieldStyle}
                />
              </div>

              {/* CPF */}
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>CPF</label>
                <input
                  type="text"
                  value={form.cpf}
                  onChange={e => changeField('cpf', e.target.value)}
                  readOnly={isRO}
                  placeholder="000.000.000-00"
                  className={inputCls(errors.cpf)}
                  style={isRO ? roStyle : { ...fieldStyle, ...(errors.cpf ? { borderColor: '#ef4444' } : {}) }}
                />
                {errors.cpf && (
                  <p className="text-sm mt-1 text-red-400 flex items-center gap-1">
                    <AlertCircle size={13} /> {errors.cpf}
                  </p>
                )}
              </div>

              {/* Telefone */}
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Telefone</label>
                <input
                  type="text"
                  value={form.telefone}
                  onChange={e => changeField('telefone', e.target.value)}
                  readOnly={isRO}
                  placeholder="(00) 00000-0000"
                  className={inputCls(errors.telefone)}
                  style={isRO ? roStyle : { ...fieldStyle, ...(errors.telefone ? { borderColor: '#ef4444' } : {}) }}
                />
                {errors.telefone && (
                  <p className="text-sm mt-1 text-red-400 flex items-center gap-1">
                    <AlertCircle size={13} /> {errors.telefone}
                  </p>
                )}
              </div>

              {/* Posto */}
              <div className="col-span-2">
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Posto / Graduação</label>
                {isRO ? (
                  <input readOnly value={form.posto} className={inputCls()} style={roStyle} />
                ) : (
                  <select
                    value={form.posto}
                    onChange={e => changeField('posto', e.target.value)}
                    className="adm-input w-full rounded-lg px-3 py-2.5 text-base border"
                    style={fieldStyle}
                  >
                    {POSTOS_GRADUACOES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                )}
              </div>

              {/* Nome */}
              <div className="col-span-2">
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Nome Completo</label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={e => changeField('nome', e.target.value)}
                  readOnly={isRO}
                  className={inputCls(errors.nome)}
                  style={isRO ? roStyle : { ...fieldStyle, ...(errors.nome ? { borderColor: '#ef4444' } : {}) }}
                />
                {errors.nome && (
                  <p className="text-sm mt-1 text-red-400 flex items-center gap-1">
                    <AlertCircle size={13} /> {errors.nome}
                  </p>
                )}
              </div>

              {/* Observações */}
              <div className="col-span-2">
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--adm-muted)' }}>Observações</label>
                <textarea
                  value={form.obs}
                  onChange={e => changeField('obs', e.target.value)}
                  readOnly={isRO}
                  rows={2}
                  className="adm-input w-full rounded-lg px-3 py-2.5 text-base border resize-none"
                  style={isRO ? roStyle : fieldStyle}
                />
              </div>
            </div>

            {!isRO && (
              <div className="flex justify-end gap-3 px-6 pb-5">
                <button
                  onClick={closeModal}
                  className="px-5 py-2.5 text-base rounded-lg border transition-colors"
                  style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)', background: 'transparent' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-5 py-2.5 text-base font-semibold text-white bg-cpe-red hover:bg-cpe-red/80 rounded-lg transition-colors"
                >
                  <Save size={16} /> Salvar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Confirm delete ────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div
            className="w-full max-w-sm rounded-2xl shadow-2xl border p-6"
            style={{ background: 'var(--adm-modal)', borderColor: 'var(--adm-border)' }}
          >
            <h4 className="font-bold text-xl mb-2" style={{ color: 'var(--adm-text)' }}>Confirmar remoção</h4>
            <p className="text-base mb-6" style={{ color: 'var(--adm-muted)' }}>
              Deseja remover{' '}
              <span className="font-semibold" style={{ color: 'var(--adm-text)' }}>{deleteTarget.nome}</span>?
              {' '}Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-5 py-2.5 text-base rounded-lg border transition-colors"
                style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)', background: 'transparent' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-5 py-2.5 text-base font-semibold text-white bg-cpe-red hover:bg-cpe-red/80 rounded-lg transition-colors"
              >
                <Trash2 size={16} /> Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
