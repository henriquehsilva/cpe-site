export type TipoAtividadeQts = 'Aula' | 'Formatura' | 'Intervalo' | 'Almoço' | 'Atividade';

export interface QtsRegistro {
  id: string;
  periodo: string;
  diaSemana: string;
  data: string;
  aula: string;
  horario: string;
  disciplina: string;
  instrutor: string;
  turma: string;
  tipo: TipoAtividadeQts;
}

export const DIAS_SEMANA_QTS = [
  'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira',
] as const;

export const TIPOS_ATIVIDADE_QTS: TipoAtividadeQts[] = [
  'Aula', 'Formatura', 'Intervalo', 'Almoço', 'Atividade',
];

const AULAS = ['', '1ª', '2ª', '3ª', '', '4ª', '5ª', '', '6ª', '7ª', '', '8ª', '9ª', '10ª'];
const HORARIOS = [
  '07:15 08:00', '08:00 08:45', '08:45 09:30', '09:30 10:15',
  '10:15 10:30', '10:30 11:15', '11:15 12:00', '12:00 14:00',
  '14:00 14:45', '14:45 15:30', '15:30 15:45', '15:45 16:30',
  '16:30 17:15', '17:15 18:00',
];

function disciplinaInicial(dia: number, linha: number): string {
  if (linha === 0) {
    if (dia === 2) return 'FORMATURA GERAL';
    if (dia === 4) return 'MOMENTO RELIGIOSO';
    return 'APRESENTAR FORMATURA';
  }
  if (linha === 4 || linha === 10) return 'INTERVALO';
  if (linha === 7) return 'ALMOÇO';
  return '';
}

function turmaInicial(dia: number, linha: number): string {
  if (linha === 8 || linha === 9) {
    if (dia === 0 || dia === 3 || dia === 4) return '14';
    if (dia === 1) return '1';
    if (dia === 2 && linha === 8) return 'CONVITE';
  }
  if (linha >= 11 && dia !== 1 && dia !== 2) return '14';
  return '';
}

function tipoInicial(linha: number, disciplina: string): TipoAtividadeQts {
  if (linha === 0) return disciplina.includes('FORMATURA') ? 'Formatura' : 'Atividade';
  if (linha === 4 || linha === 10) return 'Intervalo';
  if (linha === 7) return 'Almoço';
  return 'Aula';
}

export const qts50CptDB: QtsRegistro[] = DIAS_SEMANA_QTS.flatMap((diaSemana, dia) =>
  AULAS.map((aula, linha) => {
    const disciplina = disciplinaInicial(dia, linha);
    return {
      id: `qts-seed-${dia + 1}-${linha + 1}`,
      periodo: '',
      diaSemana,
      data: '',
      aula,
      horario: dia === 2 && linha === 0
        ? '07:15 08:20'
        : dia === 2 && linha === 1
          ? '08:20 09:05'
          : HORARIOS[linha],
      disciplina,
      instrutor: '',
      turma: turmaInicial(dia, linha),
      tipo: tipoInicial(linha, disciplina),
    };
  }),
);
