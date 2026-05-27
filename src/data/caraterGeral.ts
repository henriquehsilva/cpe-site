// ── types ─────────────────────────────────────────────────────────────────────

export interface CaraterVeiculo {
  id: string;
  placa: string;
  marcaModelo: string;
  corMilhar: string;
  ano: string;
  art: string;
  dataInfracao: string;
}

export interface CaraterAlerta {
  id: string;
  placa: string;
  descricao: string;
}

export interface CaraterUnidade {
  id: string;
  nome: string;       // "CPE CMDO", "CPE 90", "CPE 8.14156"
  telefone: string;   // "99910-6782"
  integrantes: string[];
}

export interface CaraterGeral {
  id: string;
  data: string;
  veiculos: CaraterVeiculo[];
  alertas: CaraterAlerta[];
  unidades: CaraterUnidade[];
}

// ── seed helpers ──────────────────────────────────────────────────────────────

let _seq = 1;
function vid() { return `cgv-${_seq++}`; }
function aid() { return `cga-${_seq++}`; }
function uid() { return `cgu-${_seq++}`; }

function u(nome: string, telefone: string, ...integrantes: string[]): CaraterUnidade {
  return { id: uid(), nome, telefone, integrantes };
}

// ── seed data ─────────────────────────────────────────────────────────────────

export const caraterGeralDB: CaraterGeral[] = [
  {
    id: 'cg-20260527',
    data: '27/05/2026',
    veiculos: [
      { id: vid(), placa: '0307-NXJ',            marcaModelo: 'YAMAHA/FACTOR YBR 125',  corMilhar: 'PRETA/0833',  ano: '11/12', art: '155', dataInfracao: '18/05' },
      { id: vid(), placa: '0G66-SCN',            marcaModelo: 'HONDA/ CG 160 START',    corMilhar: 'PRETA/5777',  ano: '24/24', art: '155', dataInfracao: '11/05' },
      { id: vid(), placa: '1429-KDY',            marcaModelo: 'VW/ GOL PLUS',           corMilhar: 'BRANCA/0817', ano: '00/01', art: '155', dataInfracao: '30/04' },
      { id: vid(), placa: '2B27-REQ',            marcaModelo: 'HONDA/CG 160 FAN',       corMilhar: 'VERM/9265',   ano: '21/22', art: '155', dataInfracao: '26/05' },
      { id: vid(), placa: '2540-NWW',            marcaModelo: 'HONDA/ CG 150 FAN',      corMilhar: 'VERM/4929',   ano: '11/11', art: '155', dataInfracao: '19/05' },
      { id: vid(), placa: '2F78-KAX',            marcaModelo: 'HONDA/ CG 125 TITAN',    corMilhar: 'PRETA/7782',  ano: '91/91', art: '155', dataInfracao: '08/05' },
      { id: vid(), placa: '6855-KDP (ABADIANIA)', marcaModelo: 'HONDA/ CG 125 TITAN',   corMilhar: 'VERM/5641',   ano: '98/98', art: '155', dataInfracao: '06/05' },
      { id: vid(), placa: '7377-NFO',            marcaModelo: 'HONDA/ CBX 250 TWISTER', corMilhar: 'PRETA/0161',  ano: '07/08', art: '155', dataInfracao: '29/04' },
      { id: vid(), placa: '9I41-NWQ',            marcaModelo: 'HONDA/ CG 125 FAN ES',   corMilhar: 'VERM/7033',   ano: '11/11', art: '155', dataInfracao: '14/05' },
    ],
    alertas: [
      { id: aid(), placa: '0551-MSP', descricao: 'VW/GOL 1.0 / PRETA 09/09 (ART. 168)' },
      { id: aid(), placa: '7I97-RCB', descricao: 'CHEVROLET/ONIX COR BRANCA 21/22 (ART.171) RAI 47320517' },
    ],
    unidades: [
      // linha 1
      u('CPE CMDO', '99910-6782', 'SGT DE FREITAS', 'SGT BARBOSA', 'SGT VICTOR', 'CB T. SANTOS'),
      u('CPE 90',   '99910-6969', 'SGT DE FREITAS', 'SGT BARBOSA', 'SGT VICTOR', 'CB T. SANTOS'),
      u('CPE 8.14156', '99981-4676', 'SGT DE FREITAS', 'SGT BARBOSA', 'SGT VICTOR', 'CB T. SANTOS'),
      u('CPE 8.14156', '99981-4676', 'SGT DE FREITAS', 'SGT BARBOSA', 'SGT VICTOR', 'CB T. SANTOS'),
      u('CPE 8.14156', '99981-4676', 'SGT DE FREITAS', 'SGT BARBOSA', 'SGT VICTOR', 'CB T. SANTOS'),
      // linha 2
      u('CPE 8.14156', '99981-4676', 'SGT DE FREITAS', 'SGT BARBOSA', 'SGT VICTOR', 'CB T. SANTOS'),
      u('CPE 8.14156', '99981-4676', 'SGT DE FREITAS', 'SGT BARBOSA', 'SGT VICTOR', 'CB T. SANTOS'),
      u('CPE 20',   '99624-9821', 'SGT DE FREITAS', 'SGT BARBOSA', 'SGT VICTOR', 'CB T. SANTOS'),
      u('CPE 20',   '99624-9821', 'SGT DE FREITAS', 'SGT BARBOSA', 'SGT VICTOR', 'CB T. SANTOS'),
      u('CPE 20',   '99624-9821', 'SGT DE FREITAS', 'SGT BARBOSA', 'SGT VICTOR', 'CB T. SANTOS'),
    ],
  },
];
