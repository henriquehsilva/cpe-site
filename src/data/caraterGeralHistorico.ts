import veiculosCsv from './caraterGeralHistorico/veiculos.csv?raw';
import alertasCsv from './caraterGeralHistorico/alertas.csv?raw';

export interface CaraterVeiculoHistorico {
  id: string;
  placa: string;
  marcaModelo: string;
  corMilhar: string;
  ano: string;
  art: string;
  dataInfracao: string;
}

export interface CaraterAlertaHistorico {
  id: string;
  placa: string;
  descricao: string;
}

function parseCsv(raw: string): string[][] {
  return raw
    .split('\n')
    .slice(1) // skip header
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const cols: string[] = [];
      let cur = '';
      let quoted = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') { quoted = !quoted; continue; }
        if (ch === ',' && !quoted) { cols.push(cur.trim()); cur = ''; continue; }
        cur += ch;
      }
      cols.push(cur.trim());
      return cols;
    });
}

let _seq = 1;

export const caraterVeiculosHistoricoDB: CaraterVeiculoHistorico[] = parseCsv(veiculosCsv)
  .filter(c => c.length >= 6 && c[0])
  .map(c => ({
    id: `chv-${_seq++}`,
    placa:        c[0],
    marcaModelo:  c[1],
    corMilhar:    c[2],
    ano:          c[3],
    art:          c[4],
    dataInfracao: c[5],
  }));

export const caraterAlertasHistoricoDB: CaraterAlertaHistorico[] = parseCsv(alertasCsv)
  .filter(c => c.length >= 2 && (c[0] || c[1]))
  .map(c => ({
    id:       `cha-${_seq++}`,
    placa:    c[0] || 'S/PLACA',
    descricao: c[1],
  }));
