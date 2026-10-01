// @ts-ignore: o Vite carrega o CSV como texto para gerar os dados iniciais.
import agendaCsv from './agenda.csv?raw';

export const AGENDA_CORES = [
  { nome: 'Azul', valor: '#1a73e8' },
  { nome: 'Verde', valor: '#0b8043' },
  { nome: 'Roxo', valor: '#8e24aa' },
  { nome: 'Vermelho', valor: '#d50000' },
  { nome: 'Laranja', valor: '#e67c00' },
  { nome: 'Turquesa', valor: '#039be5' },
  { nome: 'Rosa', valor: '#d81b60' },
  { nome: 'Cinza', valor: '#616161' },
] as const;

export interface AgendaCompromisso {
  id: string;
  titulo: string;
  inicio: string;
  fim: string;
  horaInicio: string;
  horaFim: string;
  diaInteiro: boolean;
  local: string;
  categoria: string;
  notas: string;
  cor: string;
}

function parseCsv(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];

    if (quoted) {
      if (char === '"' && csv[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ';') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  if (field || row.length) {
    row.push(field.replace(/\r$/, ''));
    rows.push(row);
  }

  return rows;
}

function normalizeHeader(value: string): string {
  return value
    .replace(/^\uFEFF/, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function parseDateTime(value: string): { date: string; time: string } | null {
  const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?/);
  if (!match) return null;

  return {
    date: `${match[3]}-${match[2]}-${match[1]}`,
    time: match[4] ? `${match[4]}:${match[5]}` : '',
  };
}

function categoryColor(category: string): string {
  const normalized = category.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (normalized.includes('ferias') || normalized.includes('lesp')) return '#0b8043';
  if (normalized.includes('ordens')) return '#1a73e8';
  if (normalized.includes('alteracoes')) return '#e67c00';
  if (normalized.includes('dispensa')) return '#8e24aa';
  if (normalized.includes('importante')) return '#d50000';
  if (normalized.includes('pessoal')) return '#039be5';
  if (normalized.includes('relatorio')) return '#616161';
  return '#1a73e8';
}

function parseAgenda(csv: string): AgendaCompromisso[] {
  const [header = [], ...rows] = parseCsv(csv);
  const index = new Map(header.map((value, column) => [normalizeHeader(value), column]));
  const get = (row: string[], name: string) => row[index.get(name) ?? -1]?.trim() ?? '';

  return rows.flatMap((row, rowIndex) => {
    const start = parseDateTime(get(row, 'hora do inicio'));
    if (!start) return [];

    const end = parseDateTime(get(row, 'termino')) ?? start;
    const duration = get(row, 'duracao');
    const category = get(row, 'categoria');
    const allDay = duration === '24:00' || (!start.time && !end.time);

    return [{
      id: `agenda-${rowIndex + 1}`,
      titulo: get(row, 'assunto') || '(Sem título)',
      inicio: start.date,
      fim: end.date,
      horaInicio: allDay ? '' : start.time,
      horaFim: allDay ? '' : end.time,
      diaInteiro: allDay,
      local: get(row, 'local'),
      categoria: category,
      notas: get(row, 'notas'),
      cor: categoryColor(category),
    }];
  });
}

export const agendaDB: AgendaCompromisso[] = parseAgenda(agendaCsv);
