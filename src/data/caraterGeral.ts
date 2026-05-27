// ── types ─────────────────────────────────────────────────────────────────────

export interface CaraterVeiculo {
  id: string;
  placa: string;
  marcaModelo: string;
  corMilhar: string;
  ano: string;
  art: string;
  dataInfracao: string;
  cpe90A: string;
  cpe90B: string;
}

export interface CaraterAlerta {
  id: string;
  placa: string;
  descricao: string;
}

export interface CaraterGeral {
  id: string;
  data: string;           // "27/05/2026"
  // Unit identifiers
  cpe90NomeA: string;
  cpe90NomeB: string;
  cpe90NomeC: string;
  cpe20Nome: string;
  serNomeA: string;
  serNomeB: string;
  // Vehicle assignments
  veiculos: CaraterVeiculo[];
  // Personnel per unit
  cpe90C: string[];
  cpe20A: string[];
  cpe20B: string[];
  serA: string[];
  serB: string[];
  // Alert vehicles
  alertas: CaraterAlerta[];
}

// ── seed data ─────────────────────────────────────────────────────────────────

let _seq = 1;
function vid() { return `cgv-${_seq++}`; }
function aid() { return `cga-${_seq++}`; }

export const caraterGeralDB: CaraterGeral[] = [
  {
    id: 'cg-20260527',
    data: '27/05/2026',
    cpe90NomeA: 'CPE 90 8.14156 9 9910-6782',
    cpe90NomeB: 'CPE 90 8.15349 9 9910-6969',
    cpe90NomeC: 'CPE 8.14158 9 99814676',
    cpe20Nome:  'CPE 20 62 9 9624-9821',
    serNomeA:   'CPE 8.15349 9 9976-8606 S.E.R.',
    serNomeB:   'CPE 8.14161 9 9910-6847 S.E.R.',
    veiculos: [
      { id: vid(), placa: '0307-NXJ',           marcaModelo: 'YAMAHA/FACTOR YBR 125',   corMilhar: 'PRETA/0833', ano: '11/12', art: '155', dataInfracao: '18/05', cpe90A: 'ST THALES',        cpe90B: 'SGT RIBEIRO'   },
      { id: vid(), placa: '0G66-SCN',           marcaModelo: 'HONDA/ CG 160 START',     corMilhar: 'PRETA/5777', ano: '24/24', art: '155', dataInfracao: '11/05', cpe90A: 'SGT GUSTAVO',      cpe90B: ''              },
      { id: vid(), placa: '1429-KDY',           marcaModelo: 'VW/ GOL PLUS',            corMilhar: 'BRANCA/0817',ano: '00/01', art: '155', dataInfracao: '30/04', cpe90A: 'SGT BARRETO',      cpe90B: 'CB MOREIRA'    },
      { id: vid(), placa: '2B27-REQ',           marcaModelo: 'HONDA/CG 160 FAN',        corMilhar: 'VERM/9265',  ano: '21/22', art: '155', dataInfracao: '26/05', cpe90A: 'SD GLEIBER',       cpe90B: 'CB MALHEIROS'  },
      { id: vid(), placa: '2540-NWW',           marcaModelo: 'HONDA/ CG 150 FAN',       corMilhar: 'VERM/4929',  ano: '11/11', art: '155', dataInfracao: '19/05', cpe90A: 'CPE 8.14154 9 9910-6969', cpe90B: ''       },
      { id: vid(), placa: '2F78-KAX',           marcaModelo: 'HONDA/ CG 125 TITAN',     corMilhar: 'PRETA/7782', ano: '91/91', art: '155', dataInfracao: '08/05', cpe90A: 'SGT RIBEIRO',      cpe90B: ''              },
      { id: vid(), placa: '6855-KDP (ABADIANIA)',marcaModelo: 'HONDA/ CG 125 TITAN',   corMilhar: 'VERM/5641',  ano: '98/98', art: '155', dataInfracao: '06/05', cpe90A: 'CB MALHEIROS',     cpe90B: 'SGT DIOGO'     },
      { id: vid(), placa: '7377-NFO',           marcaModelo: 'HONDA/ CBX 250 TWISTER',  corMilhar: 'PRETA/0161', ano: '07/08', art: '155', dataInfracao: '29/04', cpe90A: 'SGT RAMOS JÚNIOR', cpe90B: 'SGT ALBERNAZ'  },
      { id: vid(), placa: '9I41-NWQ',           marcaModelo: 'HONDA/ CG 125 FAN ES',    corMilhar: 'VERM/7033',  ano: '11/11', art: '155', dataInfracao: '14/05', cpe90A: 'CB FILHO',         cpe90B: 'SGT FREDERICO' },
    ],
    cpe90C: ['SGT DE FREITAS', 'SGT BARBOSA', 'SGT VICTOR', 'CB T. SANTOS'],
    cpe20A: ['SGT SANTIAGO', 'SGT W LIMA', 'CB GLAUBER'],
    cpe20B: ['ST EMÍLIO', 'CB DOUGLAS'],
    serA:   ['SGT FREIRE', 'SGT CLIFF', 'SGT FREDERICO', 'SGT VALADAO'],
    serB:   ['SGT UESSUGI', 'SGT CARVALHO', 'SGT PEIXOTO', 'SD VINÍCIUS'],
    alertas: [
      { id: aid(), placa: '0551-MSP', descricao: 'VW/GOL 1.0 / PRETA 09/09 (ART. 168)' },
      { id: aid(), placa: '7I97-RCB', descricao: 'CHEVROLET/ONIX COR BRANCA 21/22 (ART.171) RAI 47320517' },
    ],
  },
];
