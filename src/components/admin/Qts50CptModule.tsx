import { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { ArrowLeft, CalendarDays, CopyPlus, Download, Pencil, Printer, Save, Trash2, X } from 'lucide-react';
import { criarQtsEmBranco, qts50CptDB, QtsDocumento } from '../../data/qts50Cpt';
import { usePersistentState } from '../../hooks/usePersistentState';
import { ModulePermission } from '../../types/rbac';

interface Props { onBack: () => void; permissions?: ModulePermission; }

function cloneQts(qts: QtsDocumento): QtsDocumento {
  return JSON.parse(JSON.stringify(qts)) as QtsDocumento;
}

function html(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export default function Qts50CptModule({ onBack, permissions }: Props) {
  const canCreate = !permissions || permissions.create;
  const canEdit = !permissions || permissions.edit;
  const canDelete = !permissions || permissions.delete;
  const [documentos, setDocumentos] = usePersistentState<QtsDocumento[]>('cpe-site:qts-50-cpt:v1', qts50CptDB);
  const [selecionadoId, setSelecionadoId] = useState(qts50CptDB[0].id);
  const [rascunho, setRascunho] = useState<QtsDocumento | null>(null);
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);

  const selecionado = useMemo(
    () => documentos.find(item => item.id === selecionadoId) ?? documentos[0] ?? null,
    [documentos, selecionadoId],
  );
  const exibido = rascunho ?? selecionado;

  useEffect(() => {
    if (selecionado && selecionado.id !== selecionadoId) setSelecionadoId(selecionado.id);
  }, [selecionado, selecionadoId]);

  const iniciarEdicao = () => selecionado && setRascunho(cloneQts(selecionado));
  const salvar = () => {
    if (!rascunho) return;
    setDocumentos(current => current.map(item => item.id === rascunho.id ? rascunho : item));
    setRascunho(null);
  };
  const criar = () => {
    const id = `qts-${Date.now()}`;
    const novo = criarQtsEmBranco(id);
    setDocumentos(current => [...current, novo]);
    setSelecionadoId(id);
    setRascunho(cloneQts(novo));
  };
  const excluir = () => {
    if (!selecionado) return;
    const restantes = documentos.filter(item => item.id !== selecionado.id);
    setDocumentos(restantes);
    setSelecionadoId(restantes[0]?.id ?? '');
    setRascunho(null);
    setConfirmarExclusao(false);
  };

  const alterarDocumento = (campo: 'periodo' | 'curso' | 'coordenador' | 'funcaoCoordenador', valor: string) => {
    setRascunho(current => current ? { ...current, [campo]: valor } : current);
  };
  const alterarDia = (diaIndex: number, campo: 'nome' | 'data', valor: string) => {
    setRascunho(current => current ? {
      ...current,
      dias: current.dias.map((dia, index) => index === diaIndex ? { ...dia, [campo]: valor } : dia),
    } : current);
  };
  const alterarAtividade = (diaIndex: number, atividadeIndex: number, campo: 'disciplina' | 'instrutor' | 'turma', valor: string) => {
    setRascunho(current => {
      if (!current) return current;
      return {
        ...current,
        dias: current.dias.map((dia, index) => index !== diaIndex ? dia : {
          ...dia,
          atividades: dia.atividades.map((atividade, linha) =>
            linha === atividadeIndex ? { ...atividade, [campo]: valor } : atividade,
          ),
        }),
      };
    });
  };

  const exportarXlsx = () => {
    if (!exibido) return;
    const linhas: (string | number)[][] = [
      ['POLÍCIA MILITAR'], ['COMANDO DA ACADEMIA DE POLÍCIA MILITAR'], ['ESCOLA DA HONRA E DA LEALDADE'],
      ['Quadro de Trabalho Semanal - QTS', exibido.curso], ['PERÍODO:', exibido.periodo], [],
    ];
    const cabecalho1: string[] = [];
    const cabecalho2: string[] = [];
    exibido.dias.forEach(dia => {
      cabecalho1.push('A', 'H', `${dia.nome} (${dia.data})`, '', 'T');
      cabecalho2.push('', '', 'DISCIPLINA', 'INSTRUTOR(A)', 'T');
    });
    linhas.push(cabecalho1, cabecalho2);
    for (let linha = 0; linha < exibido.dias[0].atividades.length; linha += 1) {
      const valores: string[] = [];
      exibido.dias.forEach(dia => {
        const atividade = dia.atividades[linha];
        valores.push(atividade.aula, atividade.horario, atividade.disciplina, atividade.instrutor, atividade.turma);
      });
      linhas.push(valores);
    }
    linhas.push([], [exibido.coordenador], [exibido.funcaoCoordenador]);
    const ws = XLSX.utils.aoa_to_sheet(linhas);
    ws['!cols'] = Array.from({ length: 25 }, (_, index) => ({ wch: index % 5 === 2 ? 27 : index % 5 === 3 ? 22 : 12 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'QTS 50º CPT');
    XLSX.writeFile(wb, `qts-50-cpt-${exibido.periodo || 'sem-periodo'}.xlsx`);
  };

  const imprimir = () => {
    if (!exibido) return;
    const dias = exibido.dias.map(dia => `<section><h3>${html(dia.nome)} (${html(dia.data)})</h3><table>
      <thead><tr><th>A</th><th>Horário</th><th>Disciplina</th><th>Instrutor(a)</th><th>T</th></tr></thead>
      <tbody>${dia.atividades.map(a => `<tr><td>${html(a.aula)}</td><td>${html(a.horario)}</td><td>${html(a.disciplina)}</td><td>${html(a.instrutor)}</td><td>${html(a.turma)}</td></tr>`).join('')}</tbody>
      </table></section>`).join('');
    const conteudo = `<!doctype html><html><head><meta charset="UTF-8"><title>QTS 50º CPT</title><style>
      body{font-family:Arial,sans-serif;margin:18px;color:#111}h1,h2,p{text-align:center;margin:3px}main{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-top:16px}section:last-child{grid-column:1/-1}h3{text-align:center;margin:4px;font-size:12px}table{width:100%;border-collapse:collapse;font-size:9px}th,td{border:1px solid #555;padding:3px}th{background:#ddd}.assinatura{margin-top:24px;text-align:center}@media print{body{margin:5mm}}</style></head><body>
      <h1>Quadro de Trabalho Semanal - QTS</h1><h2>${html(exibido.curso)}</h2><p>PERÍODO: ${html(exibido.periodo)}</p><main>${dias}</main>
      <div class="assinatura"><strong>${html(exibido.coordenador)}</strong><br>${html(exibido.funcaoCoordenador)}</div></body></html>`;
    const url = URL.createObjectURL(new Blob([conteudo], { type: 'text/html;charset=utf-8' }));
    const janela = window.open(url, '_blank');
    if (janela) janela.addEventListener('load', () => { janela.print(); URL.revokeObjectURL(url); });
  };

  const inputStyle = { background: 'var(--adm-input)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' };

  return <div>
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-lg border" style={inputStyle} aria-label="Voltar"><ArrowLeft size={20} /></button>
          <div><h2 className="text-2xl font-bold" style={{ color: 'var(--adm-text)' }}>QTS 50º CPT</h2><p className="text-sm" style={{ color: 'var(--adm-muted)' }}>Quadro de Trabalho Semanal</p></div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={exportarXlsx} disabled={!exibido} className="flex items-center gap-2 px-3 py-2 rounded-lg border disabled:opacity-40" style={inputStyle}><Download size={16} /> XLSX</button>
          <button onClick={imprimir} disabled={!exibido} className="flex items-center gap-2 px-3 py-2 rounded-lg border disabled:opacity-40" style={inputStyle}><Printer size={16} /> Imprimir</button>
          {canCreate && <button onClick={criar} disabled={Boolean(rascunho)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cpe-red text-white disabled:opacity-40"><CopyPlus size={16} /> Novo QTS</button>}
        </div>
      </div>
      {documentos.length > 0 && <div className="flex flex-wrap items-center gap-2">
        <select value={selecionado?.id ?? ''} onChange={event => { setSelecionadoId(event.target.value); setRascunho(null); }} disabled={Boolean(rascunho)} className="adm-input px-3 py-2 rounded-lg border max-w-full" style={inputStyle}>
          {documentos.map((item, index) => <option key={item.id} value={item.id}>QTS {index + 1} — {item.periodo || 'Período não informado'}</option>)}
        </select>
        {!rascunho && canEdit && <button onClick={iniciarEdicao} className="flex items-center gap-2 px-3 py-2 rounded-lg border" style={inputStyle}><Pencil size={16} /> Editar</button>}
        {rascunho && <button onClick={salvar} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 text-white"><Save size={16} /> Salvar</button>}
        {rascunho && <button onClick={() => setRascunho(null)} className="flex items-center gap-2 px-3 py-2 rounded-lg border" style={inputStyle}><X size={16} /> Cancelar</button>}
        {!rascunho && canDelete && <button onClick={() => setConfirmarExclusao(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-500/40 text-red-400"><Trash2 size={16} /> Excluir</button>}
      </div>}
    </div>

    {!exibido ? <div className="rounded-2xl border p-12 text-center" style={{ background: 'var(--adm-surface)', borderColor: 'var(--adm-border)', color: 'var(--adm-muted)' }}><CalendarDays size={44} className="mx-auto mb-3 opacity-40" />Nenhum QTS cadastrado.</div> : <div className="space-y-5">
      <div className="rounded-2xl border p-4 sm:p-6" style={{ background: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
        <div className="grid gap-4 lg:grid-cols-2">
          {([['periodo', 'Período', 'Ex.: 01/12/2026 a 05/12/2026'], ['curso', 'Curso', ''], ['coordenador', 'Coordenador', ''], ['funcaoCoordenador', 'Função', '']] as const).map(([campo, rotulo, placeholder]) => <label key={campo} className="text-sm" style={{ color: 'var(--adm-muted)' }}>{rotulo}
            <input value={exibido[campo]} onChange={event => alterarDocumento(campo, event.target.value)} readOnly={!rascunho} placeholder={placeholder} className="adm-input mt-1 w-full px-3 py-2 rounded-lg border read-only:opacity-80" style={inputStyle} />
          </label>)}
        </div>
      </div>
      <div className="overflow-x-auto pb-2"><div className="grid grid-cols-5 gap-3 min-w-[1500px]">
        {exibido.dias.map((dia, diaIndex) => <section key={dia.id} className="rounded-xl border overflow-hidden" style={{ background: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
          <div className="p-3" style={{ background: 'var(--adm-tbl-head)' }}>
            <input value={dia.nome} onChange={event => alterarDia(diaIndex, 'nome', event.target.value)} readOnly={!rascunho} className="w-full bg-transparent text-center font-bold outline-none" style={{ color: 'var(--adm-text)' }} />
            <input value={dia.data} onChange={event => alterarDia(diaIndex, 'data', event.target.value)} readOnly={!rascunho} placeholder="Data" className="mt-1 w-full bg-transparent text-center text-xs outline-none" style={{ color: 'var(--adm-muted)' }} />
          </div>
          <div className="grid grid-cols-[34px_78px_1fr_1fr_42px] text-[10px] font-bold uppercase" style={{ color: 'var(--adm-muted)' }}>
            {['A', 'Horário', 'Disciplina', 'Instrutor(a)', 'T'].map(rotulo => <div key={rotulo} className="p-1 border-b border-r last:border-r-0 text-center" style={{ borderColor: 'var(--adm-border)' }}>{rotulo}</div>)}
          </div>
          {dia.atividades.map((atividade, atividadeIndex) => <div key={atividade.id} className="adm-row grid grid-cols-[34px_78px_1fr_1fr_42px] min-h-12 text-xs" style={{ borderBottom: '1px solid var(--adm-border)' }}>
            <div className="p-1 flex items-center justify-center border-r" style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)' }}>{atividade.aula}</div>
            <div className="p-1 flex items-center justify-center text-center border-r" style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)' }}>{atividade.horario}</div>
            {(['disciplina', 'instrutor', 'turma'] as const).map(campo => <textarea key={campo} value={atividade[campo]} onChange={event => alterarAtividade(diaIndex, atividadeIndex, campo, event.target.value)} readOnly={!rascunho} rows={2} className="resize-none p-1 bg-transparent outline-none border-r last:border-r-0 read-only:cursor-default" style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }} />)}
          </div>)}
        </section>)}
      </div></div>
    </div>}

    {confirmarExclusao && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"><div className="w-full max-w-md rounded-2xl border p-6" style={{ background: 'var(--adm-modal)', borderColor: 'var(--adm-border)' }}>
      <h3 className="text-lg font-bold" style={{ color: 'var(--adm-text)' }}>Excluir este QTS?</h3><p className="mt-2 text-sm" style={{ color: 'var(--adm-muted)' }}>A grade e todos os preenchimentos deste período serão removidos.</p>
      <div className="flex justify-end gap-2 mt-6"><button onClick={() => setConfirmarExclusao(false)} className="px-4 py-2 rounded-lg border" style={inputStyle}>Cancelar</button><button onClick={excluir} className="px-4 py-2 rounded-lg bg-red-600 text-white">Excluir</button></div>
    </div></div>}
  </div>;
}
