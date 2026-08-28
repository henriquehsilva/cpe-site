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
  { id: 'proc-1', numero: '0001/2026', assunto: 'Apuração de ocorrência com lesão corporal', interessado: 'Vitima N.N.', status: 'Não iniciado', entrada: '02/01/2026', prazo: '02/02/2026', observacoes: '' },
  { id: 'proc-2', numero: '0002/2026', assunto: 'Furto qualificado em estabelecimento comercial', interessado: 'Comerciário Ltda.', status: 'Em andamento', entrada: '05/01/2026', prazo: '05/03/2026', observacoes: 'Aguardando laudo pericial.' },
  { id: 'proc-3', numero: '0003/2026', assunto: 'Tráfico de drogas — flagrante', interessado: 'Indiciado A.B.C.', status: 'Aguardando despacho', entrada: '10/01/2026', prazo: '10/02/2026', observacoes: 'Encaminhado ao Judiciário.' },
  { id: 'proc-4', numero: '0004/2026', assunto: 'Reconhecimento de pessoa natural', interessado: 'Requerente M.S.', status: 'Sobrestado', entrada: '12/01/2026', prazo: '', observacoes: 'Suspenso por determinação judicial.' },
  { id: 'proc-5', numero: '0005/2026', assunto: 'Inquérito policial — ameaça', interessado: 'Ofendido J.D.', status: 'Concluído', entrada: '03/01/2026', prazo: '03/03/2026', observacoes: 'Concluso para arquivamento.' },
  { id: 'proc-6', numero: '0006/2026', assunto: 'Cumprimento de mandado de prisão', interessado: 'Procurado R.T.', status: 'TJGO em andamento', entrada: '15/01/2026', prazo: '15/04/2026', observacoes: 'Coordenação com TJGO.' },
];
