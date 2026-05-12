import taserCsv from './armamento/taser10.csv?raw';
import materialBelicoCsv from './armamento/material-belico.csv?raw';
import agentesQuimicosCsv from './armamento/agentes-quimicos.csv?raw';

export type ArmamentoCategoria = 'TASER 10' | 'Material Bélico' | 'Agentes Químicos';

export interface ArmamentoItem {
  id: string;
  categoria: ArmamentoCategoria;
  tombamento: string;
  estado: string;
  quantidade: number;
  especificacao: string;
  valor: string;
  localizacao: string;
}

export const ARMAMENTO_CATEGORIAS: ArmamentoCategoria[] = [
  'Material Bélico',
  'Agentes Químicos',
  'TASER 10',
];

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

    if (char === '"') {
      quoted = true;
    } else if (char === ',') {
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
  if (row.length < 6) return false;
  const [tombamento, estado, quantidade, especificacao, valor, localizacao] = row;
  if (!tombamento || !estado || !quantidade || !especificacao || valor === undefined || !localizacao) return false;
  if (estado === 'ESTADO DE CONSERVAÇÃO') return false;
  if (tombamento.includes('ESTADO DE GOIÁS')) return false;
  if (especificacao.includes('Base da 31')) return false;
  if (especificacao.includes('Danisclay Ferreira Barros')) return false;
  if (especificacao.includes('Chefe do Almoxarifado')) return false;
  return true;
}

function fromCSV(categoria: ArmamentoCategoria, csv: string): ArmamentoItem[] {
  return parseCSV(csv)
    .filter(isInventoryRow)
    .map((row, index) => ({
      id: `${categoria.toLowerCase().replace(/\s+/g, '-')}-${index + 1}`,
      categoria,
      tombamento: row[0],
      estado: row[1],
      quantidade: Number(row[2].replace(/\D/g, '')) || 0,
      especificacao: row[3],
      valor: row[4],
      localizacao: row[5],
    }));
}

export const armamentoDB: ArmamentoItem[] = [
  ...fromCSV('Material Bélico', materialBelicoCsv),
  ...fromCSV('Agentes Químicos', agentesQuimicosCsv),
  ...fromCSV('TASER 10', taserCsv),
];
