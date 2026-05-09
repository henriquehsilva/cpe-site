export interface MapaRow {
  label: string;
  pelA: string;
  pelB: string;
  pelC: string;
  pelD: string;
  adminNome?: string;
  adminFuncao?: string;
  serNome?: string;
  serStatus?: string;
}

export type TipoAfastamento = 'LESP' | 'Férias' | 'Curso' | 'JCS' | 'Outros';

export interface MapaAfastamento {
  id: string;
  tipo: TipoAfastamento;
  nome: string;
  retorno: string;
}

export interface MapaContagem {
  pelA: number;
  pelB: number;
  pelC: number;
  pelD: number;
  diagonal: number;
  diaReserva: number;
  administracao: number;
  lesp: number;
  ferias: number;
  curso: number;
  jcs: number;
  outros: number;
  total: number;
}

export interface MapaEfetivo {
  id: string;
  mes: number;
  ano: number;
  diasServico: { pelA: string; pelB: string; pelC: string; pelD: string };
  linhas: MapaRow[];
  afastamentos: MapaAfastamento[];
  contagens: MapaContagem;
}

export const MESES_NOME = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export const TIPOS_AFASTAMENTO: TipoAfastamento[] = ['LESP', 'Férias', 'Curso', 'JCS', 'Outros'];

export function emptyContagens(): MapaContagem {
  return { pelA: 0, pelB: 0, pelC: 0, pelD: 0, diagonal: 0, diaReserva: 0, administracao: 0, lesp: 0, ferias: 0, curso: 0, jcs: 0, outros: 0, total: 0 };
}

export function emptyLinhas(): MapaRow[] {
  return [
    { label: 'CPE CMD', pelA: '', pelB: '', pelC: '', pelD: '', adminNome: '', adminFuncao: 'Comandante' },
    { label: '',         pelA: '', pelB: '', pelC: '', pelD: '', adminNome: '', adminFuncao: 'Subcomandante' },
    { label: '',         pelA: '', pelB: '', pelC: '', pelD: '', adminNome: '', adminFuncao: 'Auxiliar SPJM', serNome: '', serStatus: '' },
    { label: '',         pelA: '', pelB: '', pelC: '', pelD: '', adminNome: '', adminFuncao: 'Aux SAD',       serNome: '', serStatus: '' },
    { label: 'CPE 90',   pelA: '', pelB: '', pelC: '', pelD: '', adminNome: '', adminFuncao: 'Aux SOP',       serNome: '', serStatus: '' },
    { label: '',         pelA: '', pelB: '', pelC: '', pelD: '', adminNome: '', adminFuncao: 'Aux P/4',       serNome: '', serStatus: '' },
    { label: '',         pelA: '', pelB: '', pelC: '', pelD: '',                                              serNome: '', serStatus: '' },
    { label: '',         pelA: '', pelB: '', pelC: '', pelD: '' },
    { label: '',         pelA: '', pelB: '', pelC: '', pelD: '' },
    { label: '',         pelA: '', pelB: '', pelC: '', pelD: '' },
    { label: '',         pelA: '', pelB: '', pelC: '', pelD: '' },
    { label: '',         pelA: '', pelB: '', pelC: '', pelD: '' },
    { label: '',         pelA: '', pelB: '', pelC: '', pelD: '' },
    { label: '',         pelA: '', pelB: '', pelC: '', pelD: '' },
    { label: '',         pelA: '', pelB: '', pelC: '', pelD: '' },
    { label: '',         pelA: '', pelB: '', pelC: '', pelD: '' },
    { label: 'Dia a Reserva', pelA: '', pelB: '', pelC: '', pelD: '' },
    { label: 'CPE 20',   pelA: '', pelB: '', pelC: '', pelD: '' },
    { label: '',         pelA: '', pelB: '', pelC: '', pelD: '' },
    { label: '',         pelA: '', pelB: '', pelC: '', pelD: '' },
  ];
}

// ── Seed data ──────────────────────────────────────────────────────────────

const janeiro2026: MapaEfetivo = {
  id: 'jan-2026',
  mes: 1, ano: 2026,
  diasServico: {
    pelA: '03, 07, 11, 15, 19, 23, 27, 31',
    pelB: '04, 08, 12, 16, 20, 24, 28',
    pelC: '01, 05, 09, 13, 17, 21, 25, 29',
    pelD: '02, 06, 10, 14, 18, 22, 26, 30',
  },
  linhas: [
    { label: 'CPE CMD',      pelA: '2º Ten Gleydson',    pelB: '2º Ten Andrade',      pelC: '1º Ten Danisclay',        pelD: '1º Ten Araújo',    adminNome: 'Maj George',      adminFuncao: 'Comandante' },
    { label: '9 9910-6782',  pelA: 'Cb Filho',           pelB: 'Cb Danilo',           pelC: '3º Sgt J Junior',         pelD: '3º Sgt Thássio',   adminNome: 'Cap Bueno',       adminFuncao: 'Subcomandante' },
    { label: '10956',        pelA: '2º Sgt Ramos Junior',pelB: '1º Sgt Peixoto',      pelC: '2º Sgt Cerávolo',         pelD: '3º Sgt Milazzo',   adminNome: '1º Sgt Leonardo', adminFuncao: 'Auxiliar SPJM', serNome: 'Cap Josias',     serStatus: 'Transferido' },
    { label: '',             pelA: 'Cb Wandrer',          pelB: 'Cb Donário',          pelC: 'Cb Evandro',              pelD: 'Cb Arantes',       adminNome: '2º Sgt Chagas',   adminFuncao: 'Aux SAD',       serNome: 'Cb Wemerson',    serStatus: 'Transferido' },
    { label: 'CPE 90',       pelA: 'ST Thales',           pelB: 'ST Nivaldo',          pelC: 'ST Luis Carlos',          pelD: 'ST Roni',          adminNome: '2º Sgt Gabriela', adminFuncao: 'Aux SOP',       serNome: 'Cb Jean',        serStatus: 'Transferido' },
    { label: '9 9910-6969',  pelA: 'Cb Moreira',          pelB: '3º Sgt Albernaz',     pelC: '3º Sgt Marcos Carvalho',  pelD: '3º Sgt Lucas',     adminNome: '2º Sgt Gabriel',  adminFuncao: 'Aux P/4',       serNome: '2º Sgt Elias',   serStatus: 'Transferido' },
    { label: '',             pelA: '3º Sgt Queiroz',      pelB: '2º Sgt Tabata',       pelC: '2º Sgt Dos Santos',       pelD: '2º Sgt Ederson',                                                                serNome: 'Cap Nascimento', serStatus: 'Transferido' },
    { label: '',             pelA: 'Sd Benjamim',         pelB: 'Cb Jonatas',          pelC: '3º Sgt Edson',            pelD: 'Cb Pereira' },
    { label: '',             pelA: '2º Sgt Ribeiro',      pelB: '1º Sgt Diogo',        pelC: '1º Sgt Aguinaldo',        pelD: '1º Sgt Urbano' },
    { label: '',             pelA: 'Cb T Santos',         pelB: '3º Sgt Valadão',      pelC: 'Cb Neves',                pelD: '3º Sgt Cliff' },
    { label: '',             pelA: '3º Sgt Victor',       pelB: '2º Sgt Frederico',    pelC: '3º Sgt Gustavo',          pelD: '2º Sgt Rocha' },
    { label: '',             pelA: 'Cb Bruno',            pelB: 'Cb Otto',             pelC: 'Sd Júlio',                pelD: 'Sd Vinícius' },
    { label: '',             pelA: '2º Sgt De Freitas',   pelB: '2º Sgt George',       pelC: '1º Sgt Sérgio',           pelD: 'S. E. R.' },
    { label: '',             pelA: 'Cb Araújo',           pelB: 'S. E. R.',            pelC: 'S. E. R.',                pelD: '' },
    { label: '',             pelA: '3º Sgt Barbosa',      pelB: 'S. E. R.',            pelC: 'S. E. R.',                pelD: 'S. E. R.' },
    { label: '',             pelA: 'Sd Gleiber',          pelB: 'Sd Jonathan',         pelC: 'Sd Franco',               pelD: 'Sd Martins' },
    { label: 'Dia a Reserva',pelA: 'Cb Malheiros',        pelB: 'Cb J Ferreira',       pelC: 'Cb Gouveia',              pelD: 'Cb Reis' },
    { label: 'CPE 20',       pelA: '1º Sgt Santiago',     pelB: '3º Sgt Morais',       pelC: 'ST Couto',                pelD: 'ST Emílio' },
    { label: '9 9624-9821',  pelA: 'Cb Glauber',          pelB: '3º Sgt Brandão',      pelC: 'Cb Douglas',              pelD: '3º Sgt W Lima' },
    { label: '14582',        pelA: 'S. E. R.',            pelB: 'S. E. R.',            pelC: 'S. E. R.',                pelD: 'Cb J Nunes Ferreira' },
  ],
  afastamentos: [
    { id: 'jan-1',  tipo: 'LESP',   nome: '3º Sgt Felipe',  retorno: '05/04/2026' },
    { id: 'jan-2',  tipo: 'LESP',   nome: 'Cb Mateus',       retorno: '05/04/2026' },
    { id: 'jan-3',  tipo: 'Férias', nome: 'ST Wilker',       retorno: '10/02/2026' },
    { id: 'jan-4',  tipo: 'Férias', nome: '2º Sgt Barreto',  retorno: '06/02/2026' },
    { id: 'jan-5',  tipo: 'Férias', nome: '3º Sgt Coelho',   retorno: '24/01/2026' },
    { id: 'jan-6',  tipo: 'Férias', nome: 'Cb Nathan',       retorno: '07/02/2026' },
    { id: 'jan-7',  tipo: 'JCS',    nome: 'Cb Wellis',       retorno: '06/02/2025' },
    { id: 'jan-8',  tipo: 'Outros', nome: '1º Sgt Freire',   retorno: 'Lic. Paternidade / Férias' },
    { id: 'jan-9',  tipo: 'Outros', nome: 'Cb Ianca',        retorno: 'Lic. Maternidade / Férias' },
    { id: 'jan-10', tipo: 'Outros', nome: 'Cb Vilela',       retorno: 'Lic. Paternidade / Férias' },
  ],
  contagens: { pelA: 16, pelB: 14, pelC: 14, pelD: 13, diagonal: 9, diaReserva: 4, administracao: 6, lesp: 2, ferias: 4, curso: 0, jcs: 1, outros: 3, total: 86 },
};

const fevereiro2026: MapaEfetivo = {
  id: 'fev-2026',
  mes: 2, ano: 2026,
  diasServico: {
    pelA: '03, 07, 11, 15, 19, 23, 27',
    pelB: '04, 08, 12, 16, 20, 24, 28',
    pelC: '01, 05, 09, 13, 17, 21, 25',
    pelD: '02, 06, 10, 14, 18, 22, 26',
  },
  linhas: [
    { label: 'CPE CMD',      pelA: 'ST Thales',           pelB: '2º Ten Andrade',      pelC: '1º Ten Danisclay',       pelD: '1º Ten Araújo',    adminNome: 'Maj George',      adminFuncao: 'Comandante' },
    { label: '9 9910-6782',  pelA: 'Cb Moreira',          pelB: 'Cb Danilo',           pelC: '3º Sgt J Junior',        pelD: '3º Sgt Milazzo',   adminNome: 'Cap Bueno',       adminFuncao: 'Subcomandante' },
    { label: '10956',        pelA: '3º Sgt Queiroz',      pelB: '1º Sgt Peixoto',      pelC: '2º Sgt Cerávolo',        pelD: '2º Sgt Ederson',   adminNome: '1º Sgt Leonardo', adminFuncao: 'Auxiliar SPJM', serNome: 'Cap Josias',     serStatus: 'Transferido' },
    { label: '',             pelA: 'Sd Benjamim',         pelB: 'Cb Donário',          pelC: 'Cb Evandro',             pelD: 'Cb Arantes',       adminNome: '2º Sgt Chagas',   adminFuncao: 'Aux SAD',       serNome: 'Cb Wemerson',    serStatus: 'Transferido' },
    { label: 'CPE 90',       pelA: '2º Sgt Ribeiro',      pelB: 'ST Nivaldo',          pelC: 'ST Luis Carlos',         pelD: '1º Sgt Urbano',    adminNome: '2º Sgt Gabriela', adminFuncao: 'Aux SOP',       serNome: 'Cb Jean',        serStatus: 'Transferido' },
    { label: '9 9910-6969',  pelA: 'Cb T Santos',         pelB: '3º Sgt Albernaz',     pelC: '3º Sgt Marcos Carvalho', pelD: 'Cb Pereira',       adminNome: '2º Sgt Gabriel',  adminFuncao: 'Aux P/4',       serNome: '2º Sgt Elias',   serStatus: 'Transferido' },
    { label: '',             pelA: '3º Sgt Victor',       pelB: '2º Sgt Tabata',       pelC: '2º Sgt Dos Santos',      pelD: '3º Sgt Lucas',                                                                  serNome: 'Cap Nascimento', serStatus: 'Transferido' },
    { label: '',             pelA: 'Cb Bruno',            pelB: 'Cb Jonatas',          pelC: '3º Sgt Edson',           pelD: 'Sd Martins' },
    { label: '',             pelA: '2º Sgt De Freitas',   pelB: '1º Sgt Diogo',        pelC: '1º Sgt Aguinaldo',       pelD: '2º Sgt Rocha' },
    { label: '',             pelA: 'Cb Araújo',           pelB: '3º Sgt Valadão',      pelC: 'Cb Neves',               pelD: '3º Sgt Thássio' },
    { label: '',             pelA: '3º Sgt Barbosa',      pelB: '2º Sgt Frederico',    pelC: '3º Sgt Gustavo',         pelD: '3º Sgt Cliff' },
    { label: '',             pelA: 'Sd Gleiber',          pelB: 'Cb Otto',             pelC: 'Sd Júlio',               pelD: 'Sd Vinícius' },
    { label: '',             pelA: '2º Sgt Barreto',      pelB: '2º Sgt George',       pelC: '1º Sgt Sérgio',          pelD: '' },
    { label: '',             pelA: 'Cb Filho',            pelB: 'S. E. R.',            pelC: 'S. E. R.',               pelD: '' },
    { label: '',             pelA: '2º Sgt Ramos Junior', pelB: 'S. E. R.',            pelC: 'S. E. R.',               pelD: '' },
    { label: '',             pelA: 'Cb Wandrer',          pelB: 'Sd Jonathan',         pelC: 'Sd Franco',              pelD: '' },
    { label: 'Dia a Reserva',pelA: 'Cb Malheiros',        pelB: '3º Sgt Coelho',       pelC: 'Cb Gouveia',             pelD: 'Cb Reis' },
    { label: 'CPE 20',       pelA: '1º Sgt Santiago',     pelB: '3º Sgt Morais',       pelC: '3º Sgt Brandão',         pelD: 'ST Emílio' },
    { label: '9 9624-9821',  pelA: 'Cb Glauber',          pelB: 'Cb Nathan',           pelC: 'Cb Douglas',             pelD: 'Cb J Nunes Ferreira' },
    { label: '14582',        pelA: 'S. E. R.',            pelB: 'S. E. R.',            pelC: 'S. E. R.',               pelD: 'S. E. R.' },
  ],
  afastamentos: [
    { id: 'fev-1',  tipo: 'LESP',   nome: '3º Sgt Felipe',  retorno: '05/04/2026' },
    { id: 'fev-2',  tipo: 'LESP',   nome: 'Cb Mateus',       retorno: '05/04/2026' },
    { id: 'fev-3',  tipo: 'Férias', nome: 'ST Roni',         retorno: '13/03/2026' },
    { id: 'fev-4',  tipo: 'Férias', nome: '1º Sgt Freire',   retorno: '09/03/2026' },
    { id: 'fev-5',  tipo: 'Férias', nome: '3º Sgt W Lima',   retorno: '09/03/2026' },
    { id: 'fev-6',  tipo: 'Férias', nome: 'Cb J Ferreira',   retorno: '21/02/2026' },
    { id: 'fev-7',  tipo: 'Férias', nome: 'Cb Ianca',        retorno: '17/03/2026' },
    { id: 'fev-8',  tipo: 'Férias', nome: 'Cb Vilela',       retorno: '18/02/2026' },
    { id: 'fev-9',  tipo: 'Curso',  nome: '2º Ten Gleydson', retorno: 'CHOA' },
    { id: 'fev-10', tipo: 'Curso',  nome: 'ST Couto',        retorno: 'CHOA' },
    { id: 'fev-11', tipo: 'JCS',    nome: 'Cb Wellis',       retorno: '06/02/2025' },
    { id: 'fev-12', tipo: 'Outros', nome: 'ST Wilker',       retorno: 'Dispensas de CMD' },
  ],
  contagens: { pelA: 16, pelB: 14, pelC: 14, pelD: 12, diagonal: 8, diaReserva: 4, administracao: 6, lesp: 2, ferias: 6, curso: 2, jcs: 1, outros: 1, total: 86 },
};

const marco2026: MapaEfetivo = {
  id: 'mar-2026',
  mes: 3, ano: 2026,
  diasServico: {
    pelA: '04, 08, 12, 16, 20, 24, 28',
    pelB: '01, 05, 09, 13, 17, 21, 25, 29',
    pelC: '02, 06, 10, 14, 18, 22, 26, 30',
    pelD: '03, 07, 11, 15, 19, 23, 27, 31',
  },
  linhas: [
    { label: 'CPE CMD',      pelA: 'ST Thales',           pelB: '2º Ten Andrade',      pelC: '1º Ten Danisclay',       pelD: '1º Ten Araújo',    adminNome: 'Maj George',      adminFuncao: 'Comandante' },
    { label: '9 9910-6782',  pelA: 'Cb Moreira',          pelB: 'Cb Danilo',           pelC: '3º Sgt J Junior',        pelD: '3º Sgt Milazzo',   adminNome: 'Cap Bueno',       adminFuncao: 'Subcomandante' },
    { label: '10956',        pelA: '3º Sgt Queiroz',      pelB: '3º Sgt Valadão',      pelC: '2º Sgt Cerávolo',        pelD: '2º Sgt Ederson',   adminNome: '2º Sgt Chagas',   adminFuncao: 'Aux SAD',       serNome: 'Cap Josias',        serStatus: 'Transferido' },
    { label: '',             pelA: 'Sd Benjamim',         pelB: 'Cb Donário',          pelC: 'Cb Evandro',             pelD: 'Cb Arantes',       adminNome: '2º Sgt Gabriela', adminFuncao: 'Aux SOP',       serNome: 'Cb Wemerson',       serStatus: 'Transferido' },
    { label: 'CPE 90',       pelA: '2º Sgt Ribeiro',      pelB: 'ST Nivaldo',          pelC: 'ST Luis Carlos',         pelD: 'ST Roni',          adminNome: '2º Sgt Gabriel',  adminFuncao: 'Aux P/4',       serNome: 'Cb Jean',           serStatus: 'Transferido' },
    { label: '9 9910-6969',  pelA: 'Cb T Santos',         pelB: '3º Sgt Albernaz',     pelC: '3º Sgt Edson',           pelD: '3º Sgt Lucas',     adminNome: 'Cb Ianca',        adminFuncao: 'Aux SAD / SOP', serNome: '2º Sgt Elias',      serStatus: 'Transferido' },
    { label: '',             pelA: '3º Sgt Victor',       pelB: '2º Sgt George',       pelC: '2º Sgt Dos Santos',      pelD: '2º Sgt Rocha',                                                                  serNome: 'Cap Nascimento',    serStatus: 'Transferido' },
    { label: '',             pelA: 'Cb Bruno',            pelB: 'Cb J Ferreira',       pelC: 'Sd Franco',              pelD: 'Sd Martins',                                                                    serNome: '1º Sgt Leonardo',   serStatus: 'Transferido' },
    { label: '',             pelA: '2º Sgt Barreto',      pelB: '2º Sgt Uessugi',      pelC: '1º Sgt Aguinaldo',       pelD: '1º Sgt Urbano',                                                                 serNome: '2º Ten Gleydson',   serStatus: 'Transferido' },
    { label: '',             pelA: 'Cb Araújo',           pelB: 'Cb Otto',             pelC: 'Cb Neves',               pelD: 'Cb Pereira',                                                                    serNome: 'ST Couto',          serStatus: 'Transferido' },
    { label: '',             pelA: '3º Sgt Barbosa',      pelB: 'S. E. R.',            pelC: '3º Sgt Marcos Carvalho', pelD: '3º Sgt Thássio' },
    { label: '',             pelA: 'Sd Gleiber',          pelB: 'Sd Ramalho',          pelC: 'Sd Júlio',               pelD: 'Sd Vinícius' },
    { label: '',             pelA: '2º Sgt Ramos Junior', pelB: '1º Sgt Diogo',        pelC: '1º Sgt Sérgio',          pelD: '1º Sgt Freire' },
    { label: '',             pelA: 'Cb Filho',            pelB: 'S. E. R.',            pelC: 'S. E. R.',               pelD: 'S. E. R.' },
    { label: '',             pelA: 'S. E. R.',            pelB: '2º Sgt Frederico',    pelC: 'S. E. R.',               pelD: '3º Sgt Cliff' },
    { label: '',             pelA: 'Cb Wandrer',          pelB: 'Cb Vilela',           pelC: 'S. E. R.',               pelD: 'S. E. R.' },
    { label: 'Dia a Reserva',pelA: 'Cb Malheiros',        pelB: '3º Sgt Coelho',       pelC: 'Cb Gouveia',             pelD: 'Cb Reis' },
    { label: 'CPE 20',       pelA: 'S. E. R.',            pelB: '3º Sgt W Lima',       pelC: '3º Sgt Brandão',         pelD: 'ST Emílio' },
    { label: '9 9624-9821',  pelA: 'Cb Glauber',          pelB: 'Cb Nathan',           pelC: 'Cb Douglas',             pelD: 'Cb J Nunes Ferreira' },
    { label: '14582',        pelA: 'S. E. R.',            pelB: 'S. E. R.',            pelC: 'S. E. R.',               pelD: 'S. E. R.' },
  ],
  afastamentos: [
    { id: 'mar-1', tipo: 'LESP',   nome: '3º Sgt Felipe',    retorno: '05/04/2026' },
    { id: 'mar-2', tipo: 'LESP',   nome: 'Cb Mateus',         retorno: '05/04/2026' },
    { id: 'mar-3', tipo: 'Férias', nome: '3º Sgt Morais',     retorno: '25/03/2026' },
    { id: 'mar-4', tipo: 'Férias', nome: '3º Sgt Gustavo',    retorno: '13/04/2026' },
    { id: 'mar-5', tipo: 'Férias', nome: 'Cb Jonatas',        retorno: '08/04/2026' },
    { id: 'mar-6', tipo: 'Curso',  nome: '1º Sgt Santiago',   retorno: '08/05/2026' },
    { id: 'mar-7', tipo: 'Curso',  nome: '1º Sgt Peixoto',    retorno: '08/05/2026' },
    { id: 'mar-8', tipo: 'Curso',  nome: '2º Sgt De Freitas', retorno: '08/05/2026' },
    { id: 'mar-9', tipo: 'Curso',  nome: '2º Sgt Tabata',     retorno: '08/05/2026' },
    { id: 'mar-10',tipo: 'JCS',    nome: 'Cb Wellis',         retorno: '23/03/2025' },
    { id: 'mar-11',tipo: 'Outros', nome: 'ST Wilker',         retorno: 'Agregado R/R' },
  ],
  contagens: { pelA: 15, pelB: 14, pelC: 13, pelD: 14, diagonal: 7, diaReserva: 4, administracao: 6, lesp: 2, ferias: 3, curso: 4, jcs: 1, outros: 1, total: 84 },
};

const abril2026: MapaEfetivo = {
  id: 'abr-2026',
  mes: 4, ano: 2026,
  diasServico: {
    pelA: '01, 05, 09, 13, 17, 21, 25, 29',
    pelB: '02, 06, 10, 14, 18, 22, 26, 30',
    pelC: '03, 07, 11, 15, 19, 23, 27, 31',
    pelD: '04, 08, 12, 16, 20, 24, 28',
  },
  linhas: [
    { label: 'CPE CMD',      pelA: 'ST Thales',           pelB: '2º Ten Andrade',      pelC: '1º Ten Danisclay',       pelD: '1º Ten Araújo',   adminNome: 'Maj George',     adminFuncao: 'Comandante' },
    { label: '9 9910-6782',  pelA: 'Cb Moreira',          pelB: 'Cb Danilo',           pelC: '3º Sgt J Junior',        pelD: '3º Sgt Lucas',    adminNome: 'Cap Bueno',      adminFuncao: 'Subcomandante' },
    { label: '10956',        pelA: '3º Sgt Queiroz',      pelB: '3º Sgt Valadão',      pelC: '2º Sgt Cerávolo',        pelD: '2º Sgt Ederson',  adminNome: '2º Sgt Chagas',  adminFuncao: 'Aux SAD',       serNome: 'Cap Josias',      serStatus: 'Transferido' },
    { label: '',             pelA: 'Sd Benjamim',         pelB: 'Cb Donário',          pelC: 'Cb Evandro',             pelD: 'Cb Arantes',      adminNome: '2º Sgt Gabriela',adminFuncao: 'Aux SOP',       serNome: 'Cb Wemerson',     serStatus: 'Transferido' },
    { label: 'CPE 90',       pelA: '2º Sgt Ribeiro',      pelB: 'ST Nivaldo',          pelC: 'ST Luis Carlos',         pelD: 'ST Roni',         adminNome: '2º Sgt Gabriel', adminFuncao: 'Aux P/4',       serNome: 'Cb Jean',         serStatus: 'Transferido' },
    { label: '9 9910-6969',  pelA: 'Cb Filho',            pelB: 'Cb Vilela',           pelC: '3º Sgt Edson',           pelD: '3º Sgt Thássio',  adminNome: 'Cb Ianca',       adminFuncao: 'Aux SAD / SOP', serNome: '2º Sgt Elias',    serStatus: 'Transferido' },
    { label: '',             pelA: '2º Sgt Ramos Junior', pelB: '2º Sgt George',       pelC: '2º Sgt Dos Santos',      pelD: '1º Sgt Freire',   adminNome: 'Cb Reis',        adminFuncao: 'Aux SPJM',      serNome: 'Cap Nascimento',  serStatus: 'Transferido' },
    { label: '',             pelA: 'Cb Bruno',            pelB: 'Cb J Ferreira',       pelC: 'Sd Franco',              pelD: 'Sd Martins',                                                                    serNome: '1º Sgt Leonardo', serStatus: 'Transferido' },
    { label: '',             pelA: '2º Sgt Barreto',      pelB: '2º Sgt Uessugi',      pelC: '1º Sgt Aguinaldo',       pelD: '1º Sgt Urbano',                                                                 serNome: '2º Ten Gleydson', serStatus: 'Transferido' },
    { label: '',             pelA: 'Cb Malheiros',        pelB: 'Cb Otto',             pelC: '3º Sgt Gustavo',         pelD: '3º Sgt Cliff',                                                                  serNome: 'ST Couto',        serStatus: 'Transferido' },
    { label: '',             pelA: '3º Sgt Barbosa',      pelB: '2º Sgt Frederico',    pelC: '3º Sgt Marcos Carvalho', pelD: '2º Sgt Rocha',                                                                  serNome: '3º Sgt Albernaz', serStatus: 'Transferido' },
    { label: '',             pelA: 'Sd Gleiber',          pelB: 'Sd Ramalho',          pelC: 'Cb Neves',               pelD: 'Sd Vinícius' },
    { label: '',             pelA: 'S. E. R.',            pelB: '1º Sgt Diogo',        pelC: '1º Sgt Sérgio',          pelD: 'S. E. R.' },
    { label: '',             pelA: 'Cb Jonatas',          pelB: 'S. E. R.',            pelC: 'S. E. R.',               pelD: 'S. E. R.' },
    { label: '',             pelA: 'S. E. R.',            pelB: 'S. E. R.',            pelC: 'S. E. R.',               pelD: '3º Sgt Milazzo' },
    { label: '',             pelA: 'Cb Wandrer',          pelB: 'S. E. R.',            pelC: 'S. E. R.',               pelD: 'S. E. R.' },
    { label: 'Dia a Reserva',pelA: 'Cb Wellis',           pelB: '3º Sgt Coelho',       pelC: 'Cb Gouveia',             pelD: 'Cb Pereira' },
    { label: 'CPE 20',       pelA: 'Cb Glauber',          pelB: '3º Sgt Morais',       pelC: '3º Sgt Brandão',         pelD: 'ST Emílio' },
    { label: '9 9624-9821',  pelA: 'Cb Mateus',           pelB: 'Cb Nathan',           pelC: 'Cb Douglas',             pelD: '3º Sgt Felipe' },
    { label: '14582',        pelA: 'S. E. R.',            pelB: 'S. E. R.',            pelC: 'S. E. R.',               pelD: 'S. E. R.' },
  ],
  afastamentos: [
    { id: 'abr-1', tipo: 'LESP',   nome: 'Cb J Nunes Ferreira', retorno: '01/07/2026' },
    { id: 'abr-2', tipo: 'LESP',   nome: 'Cb Araújo',           retorno: '01/07/2026' },
    { id: 'abr-3', tipo: 'Férias', nome: '3º Sgt Victor',       retorno: '01/05/2026' },
    { id: 'abr-4', tipo: 'Férias', nome: 'Cb T Santos',         retorno: '05/05/2026' },
    { id: 'abr-5', tipo: 'Férias', nome: 'Sd Júlio',            retorno: '11/05/2026' },
    { id: 'abr-6', tipo: 'Curso',  nome: '1º Sgt Santiago',     retorno: 'CAS - 08/05/2026' },
    { id: 'abr-7', tipo: 'Curso',  nome: '1º Sgt Peixoto',      retorno: 'CAS - 08/05/2026' },
    { id: 'abr-8', tipo: 'Curso',  nome: '2º Sgt De Freitas',   retorno: 'CAS - 08/05/2026' },
    { id: 'abr-9', tipo: 'Curso',  nome: '2º Sgt Tabata',       retorno: 'CAS - 08/05/2026' },
    { id: 'abr-10',tipo: 'Curso',  nome: '3º Sgt W Lima',       retorno: 'COPAR - 30/04/2026' },
    { id: 'abr-11',tipo: 'Outros', nome: 'ST Wilker',           retorno: 'Agregado R/R' },
  ],
  contagens: { pelA: 14, pelB: 13, pelC: 13, pelD: 13, diagonal: 9, diaReserva: 4, administracao: 7, lesp: 2, ferias: 3, curso: 4, jcs: 0, outros: 1, total: 83 },
};

const maio2026: MapaEfetivo = {
  id: 'mai-2026',
  mes: 5, ano: 2026,
  diasServico: {
    pelA: '03, 07, 11, 15, 19, 23, 27, 31',
    pelB: '04, 08, 12, 16, 20, 24, 28',
    pelC: '01, 09, 13, 17, 21, 25, 29',
    pelD: '02, 06, 10, 14, 18, 22, 26, 30',
  },
  linhas: [
    { label: 'CPE CMD',      pelA: 'ST Thales',           pelB: '2º Ten Andrade',      pelC: '1º Ten Danisclay',       pelD: '1º Ten Araújo',   adminNome: 'Maj George',     adminFuncao: 'Comandante' },
    { label: '9 9910-6782',  pelA: 'Cb Wandrer',          pelB: 'Cb Danilo',           pelC: '3º Sgt J Junior',        pelD: '3º Sgt Thássio',  adminNome: 'Cap Bueno',      adminFuncao: 'Subcomandante' },
    { label: '10956',        pelA: '3º Sgt Victor',       pelB: '3º Sgt Valadão',      pelC: '2º Sgt Cerávolo',        pelD: '2º Sgt Ederson',  adminNome: '2º Sgt Chagas',  adminFuncao: 'Aux SAD',       serNome: 'Cap Josias',      serStatus: 'Transferido' },
    { label: '',             pelA: 'Sd Gleiber',          pelB: 'Cb Donário',          pelC: '3º Sgt Gustavo',         pelD: 'Cb Arantes',      adminNome: '2º Sgt Gabriel', adminFuncao: 'Aux P/4',       serNome: 'Cb Wemerson',     serStatus: 'Transferido' },
    { label: 'CPE 90',       pelA: '2º Sgt Ribeiro',      pelB: 'ST Nivaldo',          pelC: '1º Sgt Aguinaldo',       pelD: 'ST Roni',         adminNome: 'CB Thaislane',   adminFuncao: 'Aux SOP',       serNome: 'Cb Jean',         serStatus: 'Transferido' },
    { label: '9 9910-6969',  pelA: 'Cb Malheiros',        pelB: 'Cb Bruno',            pelC: '3º Sgt Marcos Carvalho', pelD: '3º Sgt Cliff',    adminNome: 'Cb Ianca',       adminFuncao: 'Aux SAD / SOP', serNome: '2º Sgt Elias',    serStatus: 'Transferido' },
    { label: '',             pelA: '3º Sgt Queiroz',      pelB: '2º Sgt George',       pelC: '2º Sgt Dos Santos',      pelD: '3º Sgt Lucas',                                                                  serNome: 'Cap Nascimento',  serStatus: 'Transferido' },
    { label: '',             pelA: 'Cb Filho',            pelB: 'Cb Jonatas',          pelC: 'Cb Gouveia',             pelD: 'Sd Vinícius',                                                                   serNome: '1º Sgt Leonardo', serStatus: 'Transferido' },
    { label: '',             pelA: '2º Sgt Barreto',      pelB: '1º Sgt Diogo',        pelC: '1º Sgt Sérgio',          pelD: '1º Sgt Freire',                                                                 serNome: '2º Ten Gleydson', serStatus: 'Transferido' },
    { label: '',             pelA: '3º Sgt Barbosa',      pelB: 'Cb Otto',             pelC: 'Cb Neves',               pelD: 'Cb Pereira',                                                                    serNome: 'ST Couto',        serStatus: 'Transferido' },
    { label: '',             pelA: '2º Sgt Ramos Junior', pelB: '2º Sgt Frederico',    pelC: 'S. E. R.',               pelD: '2º Sgt Rocha',                                                                  serNome: '3º Sgt Albernaz', serStatus: 'Transferido' },
    { label: '',             pelA: 'Cb T Santos',         pelB: 'Cb Vilela',           pelC: 'Sd Júlio',               pelD: 'Sd Martins',                                                                    serNome: 'ST Luiz Carlos',  serStatus: 'Transferido' },
    { label: '',             pelA: '',                    pelB: '',                    pelC: '',                       pelD: 'Cb Reis',                                                                       serNome: 'ST Wilker',       serStatus: 'Transferido' },
    { label: '',             pelA: '',                    pelB: '',                    pelC: '',                       pelD: '',                                                                              serNome: '3º Sgt Milazzo',  serStatus: 'Transferido' },
    { label: '',             pelA: '',                    pelB: '',                    pelC: '',                       pelD: '',                adminNome: 'S. E. R.',       adminFuncao: '' },
    { label: '',             pelA: '',                    pelB: '',                    pelC: '',                       pelD: '' },
    { label: 'Dia a Reserva',pelA: 'Cb Wellis',           pelB: '3º Sgt Coelho',       pelC: 'Cb Evandro',             pelD: 'ST Carla' },
    { label: 'CPE 20',       pelA: '3º Sgt W Lima',       pelB: '3º Sgt Morais',       pelC: '3º Sgt Brandão',         pelD: 'ST Emílio' },
    { label: '9 9624-9821',  pelA: 'Cb Glauber',          pelB: 'Cb Mateus',           pelC: 'Cb Douglas',             pelD: '3º Sgt Felipe' },
    { label: '14582',        pelA: 'S. E. R.',            pelB: 'Cb Nathan',           pelC: 'S. E. R.',               pelD: 'S. E. R.' },
  ],
  afastamentos: [
    { id: 'mai-1',  tipo: 'LESP',   nome: '2º Sgt Uessugi',    retorno: '01/07/2026' },
    { id: 'mai-2',  tipo: 'LESP',   nome: 'Cb J Nunes Ferreira',retorno: '01/07/2026' },
    { id: 'mai-3',  tipo: 'LESP',   nome: 'Cb Araújo',          retorno: '01/07/2026' },
    { id: 'mai-4',  tipo: 'Férias', nome: '1º Sgt Urbano',      retorno: '01/06/2026' },
    { id: 'mai-5',  tipo: 'Férias', nome: '2º Sgt Gabriela',    retorno: '03/06/2026' },
    { id: 'mai-6',  tipo: 'Férias', nome: '2º Sgt Elias',       retorno: '08/06/2026' },
    { id: 'mai-7',  tipo: 'Férias', nome: '3º Sgt Edson',       retorno: '16/06/2026' },
    { id: 'mai-8',  tipo: 'Férias', nome: 'Cb Moreira',         retorno: '02/06/2026' },
    { id: 'mai-9',  tipo: 'Férias', nome: 'Sd Benjamim',        retorno: '02/06/2026' },
    { id: 'mai-10', tipo: 'Férias', nome: 'Sd Franco',          retorno: '12/06/2026' },
    { id: 'mai-11', tipo: 'Férias', nome: 'Sd Ramalho',         retorno: '07/06/2026' },
    { id: 'mai-12', tipo: 'Curso',  nome: '1º Sgt Santiago',    retorno: 'CAS - 08/05/2026' },
    { id: 'mai-13', tipo: 'Curso',  nome: '1º Sgt Peixoto',     retorno: 'CAS - 08/05/2026' },
    { id: 'mai-14', tipo: 'Curso',  nome: '2º Sgt De Freitas',  retorno: 'CAS - 08/05/2026' },
    { id: 'mai-15', tipo: 'Curso',  nome: '2º Sgt Tabata',      retorno: 'CAS - 08/05/2026' },
    { id: 'mai-16', tipo: 'JCS',    nome: 'Cb J Ferreira',      retorno: '22/05/2026' },
  ],
  contagens: { pelA: 12, pelB: 12, pelC: 12, pelD: 13, diagonal: 9, diaReserva: 4, administracao: 6, lesp: 3, ferias: 8, curso: 4, jcs: 1, outros: 0, total: 84 },
};

export const mapaEfetivoDB: MapaEfetivo[] = [
  janeiro2026,
  fevereiro2026,
  marco2026,
  abril2026,
  maio2026,
];
