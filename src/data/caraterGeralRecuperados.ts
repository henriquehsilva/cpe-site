import recuperadosCsv from './caraterGeralHistorico/recuperados.csv?raw';

export interface CaraterRecuperado {
  id: string;
  placa: string;
  marcaModelo: string;
  corMilhar: string;
  ano: string;
  art: string;
  dataInfracao: string;
  raiRecuperacao: string;
  dataRecuperacao: string;
}

function parseCsv(raw: string): string[][] {
  return raw
    .split('\n')
    .slice(1)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const cols: string[] = [];
      let cur = '';
      let quoted = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          quoted = !quoted;
          continue;
        }
        if (ch === ',' && !quoted) {
          cols.push(cur.trim());
          cur = '';
          continue;
        }
        cur += ch;
      }
      cols.push(cur.trim());
      return cols;
    });
}

let _seq = 1;
export const caraterRecuperadosDB: CaraterRecuperado[] = parseCsv(recuperadosCsv)
  .filter(c => c.length >= 8 && c[0])
  .map((c) => ({
    id: `cr-${_seq++}`,
    placa: c[0],
    marcaModelo: c[1] || '',
    corMilhar: c[2] || '',
    ano: c[3] || '',
    art: c[4] || '',
    dataInfracao: c[5] || '',
    raiRecuperacao: c[6] || '',
    dataRecuperacao: c[7] || '',
  }));
