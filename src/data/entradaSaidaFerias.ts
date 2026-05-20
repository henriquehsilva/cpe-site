export interface EntradaSaidaFerias {
  id: string;
  secao: string;
  num: number;
  graduacao: string;
  rg: string;
  nome: string;
  funcao: string;
  dias: string;
  inicio: string;
  fim: string;
  dispCmdo: string;
  pronto: string;
  observacao: string;
}

export const ENTRADA_SAIDA_SECTIONS = [
  { id: 'retornam-abril', label: 'Retornam de Abril/2026' },
  { id: 'entram-maio', label: 'Entram em Maio/2026' },
  { id: 'lesp', label: 'LESP 2º Trim/2026 (ABR/MAI/JUN)' },
] as const;

function splitCsvLine(line: string): string[] {
  const cols: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      cols.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  cols.push(current);
  return cols;
}

function detectSection(line: string): string | null {
  const value = line.trim().toUpperCase();
  if (value.includes('RETORNAM')) return 'retornam-abril';
  if (value.includes('ENTRAM')) return 'entram-maio';
  if (value.includes('LESP')) return 'lesp';
  return null;
}

// @ts-ignore: allow importing CSV with ?raw
import csvText from './entradaSaidaFerias.csv?raw';

function parseEntradaSaidaFromCsv(csv: string): EntradaSaidaFerias[] {
  const lines = csv.split(/\r?\n/).map((line) => line.trim());
  const items: EntradaSaidaFerias[] = [];
  let section = ENTRADA_SAIDA_SECTIONS[0].id;
  let idCounter = 1;

  for (const line of lines) {
    if (!line) continue;
    if (line.toUpperCase().includes('SEI ')) continue;

    const overrideSection = detectSection(line);
    if (overrideSection) {
      section = overrideSection;
      continue;
    }

    const cols = splitCsvLine(line).map((cell) => cell.trim());
    if (cols.length === 0 || !/^[0-9]+$/.test(cols[0])) continue;

    const num = Number(cols[0]) || 0;
    const graduacao = cols[1] ?? '';
    const rg = cols[2] ?? '';
    const nome = cols[3] ?? '';
    const funcao = cols[4] ?? '';
    const dias = cols[5] ?? '';
    const inicio = cols[6] ?? '';
    const fim = cols[7] ?? '';
    const dispCmdo = cols[8] ?? '';
    const pronto = cols[9] ?? '';
    const observacao = cols[10] ?? '';

    items.push({
      id: `esf${idCounter++}`,
      secao: section,
      num,
      graduacao,
      rg,
      nome,
      funcao,
      dias,
      inicio,
      fim,
      dispCmdo,
      pronto,
      observacao,
    });
  }

  return items;
}

export const entradaSaidaFeriasDB: EntradaSaidaFerias[] = parseEntradaSaidaFromCsv(csvText);
