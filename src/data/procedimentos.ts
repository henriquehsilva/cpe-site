export interface ProcedimentoItem {
  id: string;
  sei: string;
  tipo: string;
  numero: string;
  dataAbertura: string;
  prazoDias: number;
  status: string;
  responsavelInterno: string;
  sindicante: string;
  envolvidos: string;
  rai: string;
  portariaInicial: string;
  assunto: string;
  orgaoDestino: string;
  dataConclusao: string;
  observacoes: string;
  qtdPublicacoes: number;
  qtdPortarias: number;
  checklistPendente: boolean;
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

export const TIPO_PROCEDIMENTO: string[] = [
  'SINDICANCIA',
  'IPM',
  'TJGO',
  'PAD',
];

export const procedimentosDB: ProcedimentoItem[] = [
  { id: 'proc-1', sei: '202600002014800', tipo: 'SINDICANCIA', numero: '', dataAbertura: '', prazoDias: 40, status: 'Não iniciado', responsavelInterno: 'TENENTE LEONARDO', sindicante: 'Tenente Araujo', envolvidos: '', rai: '', portariaInicial: '', assunto: '', orgaoDestino: '', dataConclusao: '', observacoes: '', qtdPublicacoes: 0, qtdPortarias: 0, checklistPendente: false },
  { id: 'proc-2', sei: '202600002076085', tipo: 'SINDICANCIA', numero: '', dataAbertura: '', prazoDias: 40, status: 'Não iniciado', responsavelInterno: 'TENENTE LEONARDO', sindicante: 'Tenente Leonardo', envolvidos: '', rai: '', portariaInicial: '', assunto: '', orgaoDestino: '', dataConclusao: '', observacoes: '', qtdPublicacoes: 0, qtdPortarias: 0, checklistPendente: false },
  { id: 'proc-3', sei: '202600002072753', tipo: 'IPM', numero: '', dataAbertura: '', prazoDias: 40, status: 'Não iniciado', responsavelInterno: 'TENENTE LEONARDO', sindicante: 'Tenente Andrade', envolvidos: '', rai: '', portariaInicial: '', assunto: '', orgaoDestino: '', dataConclusao: '', observacoes: '', qtdPublicacoes: 0, qtdPortarias: 0, checklistPendente: false },
  { id: 'proc-4', sei: '202600002089686', tipo: 'SINDICANCIA', numero: '', dataAbertura: '', prazoDias: 40, status: 'Não iniciado', responsavelInterno: 'TENENTE LEONARDO', sindicante: 'Tenente Leonardo', envolvidos: '', rai: '', portariaInicial: '', assunto: '', orgaoDestino: '', dataConclusao: '', observacoes: '', qtdPublicacoes: 0, qtdPortarias: 0, checklistPendente: false },
  { id: 'proc-5', sei: '202600002096641', tipo: 'IPM', numero: '', dataAbertura: '', prazoDias: 40, status: 'Não iniciado', responsavelInterno: 'TENENTE LEONARDO', sindicante: 'Tenente Leonardo', envolvidos: '', rai: '', portariaInicial: '', assunto: '', orgaoDestino: '', dataConclusao: '', observacoes: '', qtdPublicacoes: 0, qtdPortarias: 0, checklistPendente: false },
  { id: 'proc-6', sei: '202600002089684', tipo: 'SINDICANCIA', numero: '', dataAbertura: '', prazoDias: 40, status: 'Não iniciado', responsavelInterno: 'TENENTE LEONARDO', sindicante: 'Tenente Leonardo', envolvidos: '', rai: '', portariaInicial: '', assunto: '', orgaoDestino: '', dataConclusao: '', observacoes: '', qtdPublicacoes: 0, qtdPortarias: 0, checklistPendente: false },
  { id: 'proc-7', sei: '202600002060127', tipo: 'SINDICANCIA', numero: '', dataAbertura: '', prazoDias: 40, status: 'Não iniciado', responsavelInterno: 'TENENTE LEONARDO', sindicante: 'Tenente Danisclay', envolvidos: '', rai: '', portariaInicial: '', assunto: '', orgaoDestino: '', dataConclusao: '', observacoes: '', qtdPublicacoes: 0, qtdPortarias: 0, checklistPendente: false },
  { id: 'proc-8', sei: '202600002071541', tipo: 'SINDICANCIA', numero: '', dataAbertura: '', prazoDias: 40, status: 'Não iniciado', responsavelInterno: 'TENENTE LEONARDO', sindicante: 'Tenente Leonardo', envolvidos: '', rai: '', portariaInicial: '', assunto: '', orgaoDestino: '', dataConclusao: '', observacoes: '', qtdPublicacoes: 0, qtdPortarias: 0, checklistPendente: false },
  { id: 'proc-9', sei: '202600002035145', tipo: 'SINDICANCIA', numero: '', dataAbertura: '', prazoDias: 40, status: 'Não iniciado', responsavelInterno: 'TENENTE LEONARDO', sindicante: 'Tenente Couto', envolvidos: '', rai: '', portariaInicial: '', assunto: '', orgaoDestino: '', dataConclusao: '', observacoes: '', qtdPublicacoes: 0, qtdPortarias: 0, checklistPendente: false },
  { id: 'proc-10', sei: '202600002071321', tipo: 'SINDICANCIA', numero: '', dataAbertura: '', prazoDias: 40, status: 'Não iniciado', responsavelInterno: 'TENENTE LEONARDO', sindicante: 'Tenente Couto', envolvidos: '', rai: '', portariaInicial: '', assunto: '', orgaoDestino: '', dataConclusao: '', observacoes: '', qtdPublicacoes: 0, qtdPortarias: 0, checklistPendente: false },
  { id: 'proc-11', sei: '202600002016079', tipo: 'SINDICANCIA', numero: '', dataAbertura: '', prazoDias: 40, status: 'Não iniciado', responsavelInterno: 'TENENTE LEONARDO', sindicante: 'Tenente Leonardo', envolvidos: '', rai: '', portariaInicial: '', assunto: '', orgaoDestino: '', dataConclusao: '', observacoes: '', qtdPublicacoes: 0, qtdPortarias: 0, checklistPendente: false },
  { id: 'proc-12', sei: '202500007095758', tipo: 'SINDICANCIA', numero: '', dataAbertura: '', prazoDias: 40, status: 'Não iniciado', responsavelInterno: 'TENENTE LEONARDO', sindicante: 'Tenente Leonardo', envolvidos: '', rai: '', portariaInicial: '', assunto: '', orgaoDestino: '', dataConclusao: '', observacoes: '', qtdPublicacoes: 0, qtdPortarias: 0, checklistPendente: false },
  { id: 'proc-13', sei: '202500002131575', tipo: 'SINDICANCIA', numero: '', dataAbertura: '', prazoDias: 40, status: 'Não iniciado', responsavelInterno: 'TENENTE LEONARDO', sindicante: 'Tenente Andrade', envolvidos: '', rai: '', portariaInicial: '', assunto: '', orgaoDestino: '', dataConclusao: '', observacoes: '', qtdPublicacoes: 0, qtdPortarias: 0, checklistPendente: false },
  { id: 'proc-14', sei: '202500002068120', tipo: 'SINDICANCIA', numero: '', dataAbertura: '', prazoDias: 40, status: 'Não iniciado', responsavelInterno: 'TENENTE LEONARDO', sindicante: 'Tenente Leonardo', envolvidos: '', rai: '', portariaInicial: '', assunto: '', orgaoDestino: '', dataConclusao: '', observacoes: '', qtdPublicacoes: 0, qtdPortarias: 0, checklistPendente: false },
];
