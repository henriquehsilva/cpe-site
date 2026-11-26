export interface QtsAtividade {
  id: string;
  aula: string;
  horario: string;
  disciplina: string;
  instrutor: string;
  turma: string;
}

export interface QtsDia {
  id: string;
  nome: string;
  data: string;
  atividades: QtsAtividade[];
}

export interface QtsDocumento {
  id: string;
  periodo: string;
  curso: string;
  coordenador: string;
  funcaoCoordenador: string;
  dias: QtsDia[];
}

const DIAS = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira'];
const AULAS = ['', '1ª', '2ª', '3ª', '', '4ª', '5ª', '', '6ª', '7ª', '', '8ª', '9ª', '10ª'];
const HORARIOS_PADRAO = [
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

export function criarQtsEmBranco(id: string): QtsDocumento {
  return {
    id,
    periodo: '',
    curso: '50º Curso de Patrulhamento Tático e Ações Especializadas de Polícia (CPT) – 31ª CIPM – CPE',
    coordenador: 'RAFAEL BUENO GONÇALVES - CAPITÃO PM',
    funcaoCoordenador: 'Coordenador do 50º CPT',
    dias: DIAS.map((nome, dia) => ({
      id: `dia-${dia}`,
      nome,
      data: '',
      atividades: AULAS.map((aula, linha) => ({
        id: `atividade-${linha}`,
        aula,
        horario: dia === 2 && linha === 0
          ? '07:15 08:20'
          : dia === 2 && linha === 1
            ? '08:20 09:05'
            : HORARIOS_PADRAO[linha],
        disciplina: disciplinaInicial(dia, linha),
        instrutor: '',
        turma: turmaInicial(dia, linha),
      })),
    })),
  };
}

export const qts50CptDB: QtsDocumento[] = [criarQtsEmBranco('qts-50-cpt-modelo')];
