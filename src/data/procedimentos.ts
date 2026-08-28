export interface ProcedimentoItem {
  id: string;
  numero: string;
  assunto: string;
  interessado: string;
  status: string;
  entrada: string;
  prazo: string;
  observacoes: string;
}

export const STATUS_PROCEDIMENTO: string[] = [
  'Não iniciado',
  'Em andamento',
  'Aguardando despacho',
  'Sobrestado',
  'Encaminhado',
  'Concluído',
  'Arquivado',
  'TJGO em andamento',
];

export const procedimentosDB: ProcedimentoItem[] = [
  { id: 'proc-1', numero: '0001/2026', assunto: 'A instaurar', interessado: '', status: 'Não iniciado', entrada: '', prazo: '', observacoes: '' },
  { id: 'proc-2', numero: '0002/2026', assunto: 'A instaurar', interessado: '', status: 'Não iniciado', entrada: '', prazo: '', observacoes: '' },
  { id: 'proc-3', numero: '0003/2026', assunto: 'A instaurar', interessado: '', status: 'Não iniciado', entrada: '', prazo: '', observacoes: '' },
  { id: 'proc-4', numero: '0004/2026', assunto: 'A instaurar', interessado: '', status: 'Não iniciado', entrada: '', prazo: '', observacoes: '' },
  { id: 'proc-5', numero: '0005/2026', assunto: 'A instaurar', interessado: '', status: 'Não iniciado', entrada: '', prazo: '', observacoes: '' },
  { id: 'proc-6', numero: '0006/2026', assunto: 'A instaurar', interessado: '', status: 'Não iniciado', entrada: '', prazo: '', observacoes: '' },
  { id: 'proc-7', numero: '0007/2026', assunto: 'A instaurar', interessado: '', status: 'Não iniciado', entrada: '', prazo: '', observacoes: '' },
  { id: 'proc-8', numero: '0008/2026', assunto: 'A instaurar', interessado: '', status: 'Não iniciado', entrada: '', prazo: '', observacoes: '' },
  { id: 'proc-9', numero: '0009/2026', assunto: 'A instaurar', interessado: '', status: 'Não iniciado', entrada: '', prazo: '', observacoes: '' },
  { id: 'proc-10', numero: '0010/2026', assunto: 'A instaurar', interessado: '', status: 'Não iniciado', entrada: '', prazo: '', observacoes: '' },
  { id: 'proc-11', numero: '0011/2026', assunto: 'A instaurar', interessado: '', status: 'Não iniciado', entrada: '', prazo: '', observacoes: '' },
  { id: 'proc-12', numero: '0012/2026', assunto: 'A instaurar', interessado: '', status: 'Não iniciado', entrada: '', prazo: '', observacoes: '' },
  { id: 'proc-13', numero: '0013/2026', assunto: 'A instaurar', interessado: '', status: 'Não iniciado', entrada: '', prazo: '', observacoes: '' },
  { id: 'proc-14', numero: '0014/2026', assunto: 'A instaurar', interessado: '', status: 'Não iniciado', entrada: '', prazo: '', observacoes: '' },
];
