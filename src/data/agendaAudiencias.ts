export type Modalidade = 'VIDEOCONFERÊNCIA' | 'PRESENCIALMENTE';

export interface Audiencia {
  id: string;
  mes: number;
  ano: number;
  data: string;       // "DD/MM"
  horario: string;    // "HHhMMmin"
  local: string;
  postoGrad: string;
  modalidade: Modalidade;
  sei: string;
}

export const MODALIDADES: Modalidade[] = ['VIDEOCONFERÊNCIA', 'PRESENCIALMENTE'];

export const MESES_AUDIENCIA = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

// Sort key: day from "DD/MM" and minutes from "HHhMMmin"
export function audienciaOrd(a: Audiencia): number {
  const day = parseInt(a.data.split('/')[0] ?? '0', 10);
  const hm  = a.horario.match(/(\d+)h(\d+)/);
  const min = hm ? parseInt(hm[1], 10) * 60 + parseInt(hm[2], 10) : 0;
  return a.ano * 1_000_000 + a.mes * 10_000 + day * 100 + Math.floor(min / 10);
}

// ── Seed helpers ──────────────────────────────────────────────────────────
let _seq = 1;
function r(
  mes: number, ano: number,
  data: string, horario: string, local: string,
  postoGrad: string, modalidade: Modalidade, sei: string,
): Audiencia {
  return { id: `seed-${_seq++}`, mes, ano, data, horario, local, postoGrad, modalidade, sei };
}
const V: Modalidade = 'VIDEOCONFERÊNCIA';
const P: Modalidade = 'PRESENCIALMENTE';

// ── May 2026 ──────────────────────────────────────────────────────────────
const maio2026: Audiencia[] = [
  r(5,2026,'04/05','14h00min','Fórum de Goianápolis',                       'SGT SÉRGIO',       V,'202600002016083'),
  r(5,2026,'04/05','14h45min','2ª Vara Criminal Comarca de Anápolis',       'CB WELLIS',        V,'202600002032769'),
  r(5,2026,'04/05','15h15min','2ª Vara Criminal Comarca de Anápolis',       'SGT SÉRGIO',       V,'202600002032764'),
  r(5,2026,'04/05','15h15min','2ª Vara Criminal Comarca de Anápolis',       'CB MATEUS',        V,'202600002032764'),
  r(5,2026,'04/05','15h15min','2ª Vara Criminal Comarca de Anápolis',       'CB WANDRER',       V,'202600002032764'),
  r(5,2026,'05/05','15h30min','2ª Vara Criminal Comarca de Anápolis',       'SGT PEIXOTO',      V,'202600002040081'),
  r(5,2026,'05/05','15h30min','2ª Vara Criminal Comarca de Anápolis',       'SGT SERGIO',       V,'202600002040081'),
  r(5,2026,'05/05','15h30min','2ª Vara Criminal Comarca de Anápolis',       'SGT VALADÃO',      V,'202600002040081'),
  r(5,2026,'05/05','16h30min','3ª Vara Criminal Comarca de Anápolis',       'SGT MILAZZO',      V,'202600002045747'),
  r(5,2026,'05/05','16h30min','3ª Vara Criminal Comarca de Anápolis',       'CB REIS',          V,'202600002045747'),
  r(5,2026,'05/05','17h00min','2ª Vara Criminal Comarca de Anápolis',       'TEN ANDRADE',      V,'202600002046856'),
  r(5,2026,'05/05','17h00min','2ª Vara Criminal Comarca de Anápolis',       'CB DONÁRIO',       V,'202600002046856'),
  r(5,2026,'06/05','08h30min','Tribunal do Júri',                           'ST NIVALDO',       P,'202600002040129'),
  r(5,2026,'06/05','08h30min','Tribunal do Júri',                           'SGT DE FREITAS',   P,'202600002040129'),
  r(5,2026,'06/05','08h30min','Tribunal do Júri',                           'CB MALHEIROS',     P,'202600002040129'),
  r(5,2026,'06/05','14h00min','1º Juizado Especial Criminal',               'SD VINICIUS',      V,'202600002034148'),
  r(5,2026,'06/05','16h00min','1ª Vara Criminal Comarca de Anápolis',       'SGT PEIXOTO',      V,'202600002033790'),
  r(5,2026,'06/05','16h00min','1ª Vara Criminal Comarca de Anápolis',       'SGT THÁSSIO',      V,'202600002033790'),
  r(5,2026,'06/05','16h00min','1ª Vara Criminal Comarca de Anápolis',       'SD BENJAMIM',      V,'202600002033790'),
  r(5,2026,'07/05','14h00min','2ª Vara Judicial de Pirenópolis',            'SD FRANCO',        V,'202600002046304'),
  r(5,2026,'07/05','14h00min','5ª Vara Criminal Comarca de Anápolis',       'SD MARTINS',       V,'202600002032732'),
  r(5,2026,'07/05','15h00min','3ª Vara Criminal de Anápolis',               'TEN DANISCLAY',    V,'202600002042596'),
  r(5,2026,'07/05','15h00min','3ª Vara Criminal de Anápolis',               'SGT J JUNIOR',     V,'202600002042596'),
  r(5,2026,'07/05','15h00min','3ª Vara Criminal de Anápolis',               'SGT BRANDÃO',      V,'202600002042596'),
  r(5,2026,'07/05','15h00min','3ª Vara Criminal de Anápolis',               'CB EVANDRO',       V,'202600002042596'),
  r(5,2026,'07/05','16h00min','1ª Vara Criminal Comarca de Anápolis',       'SGT VALADÃO',      V,'202600002026934'),
  r(5,2026,'07/05','16h00min','5ª Vara Criminal Comarca de Anápolis',       'SGT PEIXOTO',      V,'202600002032734'),
  r(5,2026,'07/05','16h00min','5ª Vara Criminal Comarca de Anápolis',       'SGT BARBOSA',      V,'202600002032734'),
  r(5,2026,'08/05','13h30min','Tribunal do Júri de Goiânia',                'CB MALHEIROS',     P,'202600002045544'),
  r(5,2026,'11/05','15h20min','5ª Vara Criminal Comarca de Anápolis',       'CB MARTINS',       V,'202600002048302'),
  r(5,2026,'11/05','16h40min','5ª Vara Criminal Comarca de Anápolis',       'SGT VALADÃO',      V,'202600002033484'),
  r(5,2026,'12/05','13h30min','Vara Criminal de Corumbá',                   'CB WELLIS',        V,'202600002045765'),
  r(5,2026,'13/05','14h00min','1ª Vara Criminal Comarca de Anápolis',       'SGT TABATA',       V,'202600002037177'),
  r(5,2026,'13/05','14h00min','1ª Vara Criminal Comarca de Anápolis',       'SGT GEORGE',       V,'202600002037177'),
  r(5,2026,'13/05','14h00min','1ª Vara Criminal Comarca de Anápolis',       'SGT ELIAS',        V,'202600002033698'),
  r(5,2026,'13/05','14h00min','1ª Vara Criminal Comarca de Anápolis',       'SGT QUEIROZ',      V,'202600002033698'),
  r(5,2026,'13/05','15h30min','Vara Criminal de Pirenópolis',               'SD FRANCO',        V,'202600002050833'),
  r(5,2026,'13/05','17h00min','2ª Vara Criminal Comarca de Anápolis',       'SGT THÁSSIO',      V,'202600002034023'),
  r(5,2026,'13/05','17h00min','1ª Vara Criminal Comarca de Anápolis',       'SGT AGUINALDO',    V,'202600002053911'),
  r(5,2026,'13/05','17h00min','1ª Vara Criminal Comarca de Anápolis',       'SGT SÉRGIO',       V,'202600002053911'),
  r(5,2026,'13/05','17h00min','1ª Vara Criminal Comarca de Anápolis',       'CB GOUVEIA',       V,'202600002053911'),
  r(5,2026,'14/05','14h00min','5ª Vara Criminal de Anápolis',               'SGT FELIPE',       V,'202600002044929'),
  r(5,2026,'14/05','14h00min','5ª Vara Criminal de Anápolis',               'CB J NUNES',       V,'202600002044929'),
  r(5,2026,'14/05','14h00min','2ª Vara Criminal Comarca de Anápolis',       'CB JONATAS',       V,'202600002036975'),
  r(5,2026,'14/05','14h00min','2ª Vara Criminal Comarca de Anápolis',       'ST LUIS CARLOS',   V,'202600002034015'),
  r(5,2026,'14/05','14h00min','3ª Vara Criminal Comarca de Anápolis',       'CB FILHO',         V,'202600002015458'),
  r(5,2026,'14/05','14h30min','2ª Vara Criminal Comarca de Anápolis',       'CB RAMALHO',       V,'202600002055479'),
  r(5,2026,'14/05','14h30min','2ª Vara Criminal Comarca de Anápolis',       'SD RAMALHO',       V,'202600002034014'),
  r(5,2026,'14/05','15h30min','3ª Vara Criminal Comarca de Anápolis',       'CB WANDRER',       V,'202600002046867'),
  r(5,2026,'18/05','14h00min','5ª Vara Criminal Comarca de Anápolis',       'CB MATEUS',        V,'202600002047985'),
  r(5,2026,'18/05','15h30min','3ª Vara Criminal Comarca de Anápolis',       'SGT VALADÃO',      V,'202600002037393'),
  r(5,2026,'20/05','14h40min','Tribunal do Júri',                           'SGT BARRETO',      P,'202600002038133'),
  r(5,2026,'20/05','14h40min','Tribunal do Júri',                           'SGT GUSTAVO',      P,'202600002038133'),
  r(5,2026,'20/05','14h40min','Tribunal do Júri',                           'CB EVANDRO',       P,'202600002038133'),
  r(5,2026,'20/05','14h40min','5ª Vara Criminal Comarca de Anápolis',       'SGT BARRETO',      V,'202600002038133'),
  r(5,2026,'20/05','14h40min','5ª Vara Criminal Comarca de Anápolis',       'SGT GUSTAVO',      V,'202600002038133'),
  r(5,2026,'20/05','14h40min','5ª Vara Criminal Comarca de Anápolis',       'CB EVANDRO',       V,'202600002038133'),
  r(5,2026,'20/05','17h00min','Juizado de Violência Doméstica de Anápolis', 'SD MARTINS',       V,'202600002033748'),
  r(5,2026,'21/05','14h00min','4ª Vara Criminal Comarca de Goiânia',        'MAJ GEORGE',       V,'202600002033809'),
  r(5,2026,'21/05','14h40min','5ª Vara Criminal Comarca de Anápolis',       'SGT GEORGE',       V,'202600002039822'),
  r(5,2026,'21/05','14h40min','5ª Vara Criminal Comarca de Anápolis',       'SGT RAMOS JUNIOR', V,'202600002039822'),
  r(5,2026,'21/05','14h45min','1ª Vara Criminal Comarca de Anápolis',       'ST THALES',        V,'202600002033521'),
  r(5,2026,'21/05','14h45min','1ª Vara Criminal Comarca de Anápolis',       'CB PEREIRA',       V,'202600002033521'),
  r(5,2026,'21/05','14h45min','1ª Vara Criminal Comarca de Anápolis',       'ST THALES',        V,'202600002053337'),
  r(5,2026,'21/05','14h45min','2ª Vara Criminal de Anápolis',               'CB FILHO',         V,'202600002045518'),
  r(5,2026,'21/05','14h45min','1ª Vara Criminal Comarca de Anápolis',       'CB PEREIRA',       V,'202600002053337'),
  r(5,2026,'25/05','17h00min','1ª Vara Criminal Comarca de Anápolis',       'SGT RAMOS JUNIOR', V,'202600002037514'),
  r(5,2026,'25/05','17h00min','1ª Vara Criminal Comarca de Anápolis',       'CB GOUVEIA',       V,'202600002037514'),
  r(5,2026,'26/05','16h15min','1ª Vara Criminal Comarca de Anápolis',       'SD BENJAMIM',      V,'202600002037504'),
  r(5,2026,'27/05','15h00min','1ª Vara Criminal Comarca de Anápolis',       'SGT GEORGE',       V,'202600002040352'),
  r(5,2026,'27/05','15h00min','1ª Vara Criminal Comarca de Anápolis',       'SGT TABATA',       V,'202600002040352'),
  r(5,2026,'27/05','17h00min','2ª Vara Criminal Comarca de Anápolis',       'SGT DOS SANTOS',   V,'202600002046562'),
  r(5,2026,'27/05','17h00min','2ª Vara Criminal Comarca de Anápolis',       'CB EVANDRO',       V,'202600002046562'),
  r(5,2026,'28/05','08h30min','Tribunal do Júri',                           'CB MOREIRA',       P,'202600002042647'),
  r(5,2026,'28/05','09h30min','Tribunal do Júri Leopoldo de Bulhões',       'ST THALES',        P,'202600002052405'),
  r(5,2026,'28/05','14h00min','3ª Vara Criminal Comarca de Anápolis',       'ST NIVALDO',       V,'202600002043682'),
  r(5,2026,'28/05','14h45min','1ª Vara Criminal Comarca de Anápolis',       'SGT DE FREITAS',   V,'202600002037411'),
  r(5,2026,'28/05','14h45min','1ª Vara Criminal Comarca de Anápolis',       'SGT VICTOR',       V,'202600002037411'),
  r(5,2026,'28/05','16h00min','2ª Vara Criminal Comarca de Anápolis',       'TEN DANISCLAY',    V,'202600002046885'),
  r(5,2026,'28/05','16h00min','2ª Vara Criminal Comarca de Anápolis',       'SGT CERÁVOLO',     V,'202600002046885'),
  r(5,2026,'28/05','17h00min','Juizado de Violência Doméstica de Anápolis', 'CB MOREIRA',       V,'202600002033814'),
];

// ── June 2026 ─────────────────────────────────────────────────────────────
const junho2026: Audiencia[] = [
  r(6,2026,'01/06','15h45min','1ª Vara Criminal de Anápolis',         'SD MARTINS',       V,'202600002040365'),
  r(6,2026,'01/06','16h30min','3ª Vara Criminal de Anápolis',         'SD VINICIUS',      V,'202600002044693'),
  r(6,2026,'08/06','08h00min','Tribunal do Júri de Abediânia',        'CAP JOSIAS',       P,'202600002054350'),
  r(6,2026,'08/06','08h00min','Tribunal do Júri de Abediânia',        'SGT RAMOS JUNIOR', P,'202600002054350'),
  r(6,2026,'08/06','08h00min','Tribunal do Júri de Abediânia',        'CB WANDRER',       P,'202600002054350'),
  r(6,2026,'08/06','14h00min','5ª Vara Criminal de Anápolis',         'SGT URBANO',       V,'202600002045507'),
  r(6,2026,'08/06','16h40min','5ª Vara Criminal de Anápolis',         'SGT MILAZZO',      V,'202600002043500'),
  r(6,2026,'08/06','16h45min','1ª Vara Criminal de Anápolis',         'SGT RIBEIRO',      V,'202600002040719'),
  r(6,2026,'08/06','17h00min','Juizado da Violência Doméstica',       'SD GLEIBER',       V,'202600002044460'),
  r(6,2026,'09/06','14h00min','2ª Vara Criminal de Anápolis',         'SGT EDERSON',      V,'202600002055020'),
  r(6,2026,'09/06','14h00min','2ª Vara Criminal de Anápolis',         'SGT W LIMA',       V,'202600002055020'),
  r(6,2026,'09/06','14h00min','1ª Vara Criminal de Anápolis',         'SD MARTINS',       V,'202600002040946'),
  r(6,2026,'10/06','14h00min','2ª Vara Criminal de Anápolis',         'SGT CLIFF',        V,'202600002042962'),
  r(6,2026,'10/06','14h00min','2ª Vara Criminal de Anápolis',         'CB EVANDRO',       V,'202600002042962'),
  r(6,2026,'10/06','14h40min','5ª Vara Criminal Anápolis',            'CB FILHO',         V,'202600002050968'),
  r(6,2026,'11/06','14h00min','5ª Vara Criminal Anápolis',            'ST NIVALDO',       V,'202600002048526'),
  r(6,2026,'11/06','14h00min','5ª Vara Criminal Anápolis',            'SGT TABATA',       V,'202600002048526'),
  r(6,2026,'11/06','14h00min','5ª Vara Criminal Anápolis',            'CB OTTO',          V,'202600002048526'),
  r(6,2026,'11/06','14h00min','5ª Vara Criminal Anápolis',            'CB JONATAS',       V,'202600002048526'),
  r(6,2026,'11/06','14h45min','1ª Vara Criminal de Anápolis',         'SGT ELIAS',        V,'202600002044477'),
  r(6,2026,'11/06','14h45min','1ª Vara Criminal de Anápolis',         'CB GLAUBER',       V,'202600002044477'),
  r(6,2026,'15/06','14h00min','5ª Vara Criminal Anápolis',            'SGT UESSUGI',      V,'202600002048532'),
  r(6,2026,'15/06','15h20min','5ª Vara Criminal Anápolis',            'ST LUIS CARLOS',   V,'202600002046755'),
  r(6,2026,'15/06','15h20min','5ª Vara Criminal Anápolis',            'SGT DOS SANTOS',   V,'202600002046755'),
  r(6,2026,'15/06','15h30min','3ª Vara Criminal Anápolis',            'CB FILHO',         V,'202600002055137'),
  r(6,2026,'15/06','16h00min','Juizado da Violência Doméstica',       'SD MARTINS',       V,'202600002044482'),
  r(6,2026,'15/06','16h00min','5ª Vara Criminal Anápolis',            'SGT AGUINALDO',    V,'202600002046753'),
  r(6,2026,'15/06','16h00min','5ª Vara Criminal Anápolis',            'SGT EDSON',        V,'202600002046753'),
  r(6,2026,'15/06','16h00min','5ª Vara Criminal Anápolis',            'SGT THASSIO',      V,'202600002046753'),
  r(6,2026,'16/06','14h00min','3ª Vara Criminal Anápolis',            'SGT DOS SANTOS',   V,'202600002054482'),
  r(6,2026,'16/06','14h00min','3ª Vara Criminal Anápolis',            'SGT GUSTAVO',      V,'202600002054482'),
  r(6,2026,'16/06','14h00min','2ª Vara Criminal de Anapolis',         'CB JÚLIO',         V,'202600002049662'),
  r(6,2026,'18/06','14h00min','3ª Vara Criminal de Anápolis',         'SGT URBANO',       V,'202600002055535'),
  r(6,2026,'18/06','14h00min','3ª Vara Criminal de Anápolis',         'SGT TABATA',       V,'202600002055535'),
  r(6,2026,'18/06','14h00min','3ª Vara Criminal de Anápolis',         'CB ARANTES',       V,'202600002055535'),
  r(6,2026,'18/06','14h40min','5ª Vara Criminal de Anápolis',         'SGT RIBEIRO',      V,'202600002050853'),
  r(6,2026,'18/06','16h30min','2ª Vara Criminal de Anapolis',         'TEN DANISCLAY',    V,'202600002053156'),
  r(6,2026,'18/06','16h30min','2ª Vara Criminal de Anapolis',         'SGT CERÁVOLO',     V,'202600002053156'),
  r(6,2026,'18/06','16h30min','2ª Vara Criminal de Anapolis',         'CB EVANDRO',       V,'202600002053156'),
  r(6,2026,'22/06','14h30min','2ª Vara Criminal de Anapolis',         'SGT VALADÃO',      V,'202600002053361'),
  r(6,2026,'22/06','14h30min','2ª Vara Criminal de Anapolis',         'CB MATEUS',        V,'202600002053361'),
  r(6,2026,'22/06','16h00min','5ª Vara Criminal de Anápolis',         'CB WANDRER',       V,'202600002050862'),
  r(6,2026,'24/06','17h20min','5ª Vara Criminal de Anápolis',         'SGT VALADÃO',      V,'202600002053873'),
  r(6,2026,'25/06','17h00min','3ª Vara Criminal de Caldas Novas',     'CB DANILO',        V,'202600002053397'),
  r(6,2026,'29/06','15h00min','2ª Vara Criminal de Anápolis',         'CB EVANDRO',       V,'202600002044484'),
  r(6,2026,'29/06','15h00min','2ª Vara Criminal de Anápolis',         'CB EVANDRO',       V,'202600002044484'),
];

// ── July 2026 ─────────────────────────────────────────────────────────────
const julho2026: Audiencia[] = [
  r(7,2026,'01/07','14h40min','5ª Vara Criminal de Anápolis','SGT SÉRGIO',V,'202600002054154'),
];

export const agendaAudienciasDB: Audiencia[] = [
  ...maio2026,
  ...junho2026,
  ...julho2026,
];
