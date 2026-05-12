import transporteCsv from './viaturas/transporte.csv?raw';

export interface ViaturaItem {
  id: string;
  ordem: number | null;
  tombamento: string;
  estado: string;
  quantidade: number;
  especificacao: string;
  valor: string;
  localizacao: string;
}

function parseCSV(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    const next = input[i + 1];

    if (quoted) {
      if (char === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') quoted = true;
    else if (char === ',') {
      row.push(cell.trim());
      cell = '';
    } else if (char === '\n') {
      row.push(cell.replace(/\r$/, '').trim());
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }

  if (cell || row.length) {
    row.push(cell.replace(/\r$/, '').trim());
    rows.push(row);
  }

  return rows;
}

function isInventoryRow(row: string[]): boolean {
  if (row.length < 7) return false;
  const [, tombamento, estado, quantidade, especificacao, valor, localizacao] = row;
  if (!tombamento || !estado || !quantidade || !especificacao || valor === undefined || !localizacao) return false;
  if (estado === 'ESTADO DE CONSERVAÇÃO') return false;
  if (especificacao.includes('Base da 31')) return false;
  if (especificacao.includes('Danisclay Ferreira Barros')) return false;
  if (especificacao.includes('Chefe do Almoxarifado')) return false;
  return true;
}

export const viaturasDB: ViaturaItem[] = parseCSV(transporteCsv)
  .filter(isInventoryRow)
  .map((row, index) => ({
    id: `viatura-${index + 1}`,
    ordem: row[0] ? Number(row[0]) : null,
    tombamento: row[1],
    estado: row[2],
    quantidade: Number(row[3].replace(/\D/g, '')) || 0,
    especificacao: row[4],
    valor: row[5],
    localizacao: row[6],
  }));
