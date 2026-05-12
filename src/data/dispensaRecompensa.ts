export interface DispensaCmdo {
  id: string;
  ord: number;
  posto: string;
  rg: string;
  nome: string;
  periodo: string;  // "DD/MM a DD/MM" or ""
  dopm: string;     // e.g. "67/2026", "CHOA", ""
  sei: string;
}

export interface DispensaAnual {
  id: string;
  ord: number;
  posto: string;
  rg: string;
  nome: string;
  dispensas: { data: string; dopm: string }[];  // exactly 5 slots
}

// ── seed helpers ──────────────────────────────────────────────────────────────

let _seq = 1;

function c(
  ord: number, posto: string, rg: string, nome: string,
  periodo: string, dopm: string, sei: string,
): DispensaCmdo {
  return { id: `cmdo-${_seq++}`, ord, posto, rg, nome, periodo, dopm, sei };
}

function a(
  ord: number, posto: string, rg: string, nome: string,
  d1 = '', p1 = '', d2 = '', p2 = '', d3 = '', p3 = '',
  d4 = '', p4 = '', d5 = '', p5 = '',
): DispensaAnual {
  return {
    id: `anual-${_seq++}`, ord, posto, rg, nome,
    dispensas: [
      { data: d1, dopm: p1 }, { data: d2, dopm: p2 }, { data: d3, dopm: p3 },
      { data: d4, dopm: p4 }, { data: d5, dopm: p5 },
    ],
  };
}

// ── CMDO GERAL ────────────────────────────────────────────────────────────────

export const dispensaCmdoDB: DispensaCmdo[] = [
  c(1,  'CAP PM',     '38129', 'Rafael BUENO Gonçalves',              '13/04 a 17/04', '67/2026',  '202600002045744'),
  c(2,  'CAP PM',     '29976', 'JOSIAS Alves da Silva',               '', '', ''),
  c(3,  '1º TEN PM',  '31519', 'DANISCLAY Ferreira Barros',           '17/01 a 21/01', '19/2026',  '202600002010112'),
  c(4,  '1º TEN PM',  '31124', 'Newton Ramos de ARAÚJO',              '', '', ''),
  c(5,  '2º TEN PM',  '38802', 'Alexandre ANDRADE Girardi',           '', '', ''),
  c(6,  '2º TEN PM',  '32594', 'GLEYDSON Oliveira do Prado',          '', 'CHOA', ''),
  c(7,  'SUBTEN PM',  '30494', 'Eduardo THALES Santana Silva',        '', '', ''),
  c(8,  'SUBTEN PM',  '31478', 'RONI Vieira',                         '15/03 a 19/03', '057/2026', '202600002037447'),
  c(9,  'SUBTEN PM',  '32579', 'NIVALDO Gomes Correia',               '21/02 a 25/02', '11/2026',  '202600002006865'),
  c(10, 'SUBTEN PM',  '32786', 'Fernando EMÍLIO Silva Pereira',       '16/01 a 20/01', '6/2026',   '202600002003582'),
  c(11, 'SUBTEN PM',  '33490', 'Luiz Sérgio Ferreira COUTO',          '', 'CHOA', ''),
  c(12, 'SUBTEN PM',  '31616', 'CARLA Alves de Andrade',              '', '', ''),
  c(13, '1º SGT PM',  '27207', 'AGUINALDO Aparecido da Silva',        '', '', ''),
  c(14, '1º SGT PM',  '32576', 'LEONARDO de Araújo Gomes Borges',     '', 'CHOA', ''),
  c(15, '1º SGT PM',  '31309', 'URBANO Neto Gomes Nascimento',        '01/06 a 05/06', '82/2026',  '202600002056915'),
  c(16, '1º SGT PM',  '33770', 'SANTIAGO Marques',                    '', '', ''),
  c(17, '1º SGT PM',  '32508', 'DIOGO Alves de Oliveira',             '15/07 a 19/07', '?', ''),
  c(18, '1º SGT PM',  '33751', 'Andre FREIRE de Paiva',               '28/01 a 01/02', '15/2026',  '202600002006865'),
  c(19, '1º SGT PM',  '33344', 'Diego PEIXOTO Noel',                  '', '', ''),
  c(20, '1º SGT PM',  '31958', 'SÉRGIO Roberto Barbosa da Cruz',      '', '', ''),
  c(21, '2º SGT PM',  '29982', 'Maria Aparecida CHAGAS',              '', '', ''),
  c(22, '2º SGT PM',  '32573', 'GABRIELA Alves Landin dos Santos',    '', '', ''),
  c(23, '2º SGT PM',  '29635', 'Cleber Soares RIBEIRO',               '', '', ''),
  c(24, '2º SGT PM',  '31648', 'Éder DOS SANTOS Magalhães',           '25/01 a 29/01', '31/2026',  '202600002016624'),
  c(25, '2º SGT PM',  '32574', 'GEORGE Gonzaga de Sousa Santos',      '', '', ''),
  c(26, '2º SGT PM',  '33516', 'Willian DE FREITAS Pinto',            '20/02 a 24/02', '25/2026',  '202600002016127'),
  c(27, '2º SGT PM',  '33041', 'Thiago TABATA Santos',                '', '', ''),
  c(28, '2º SGT PM',  '33279', 'Moises Monteiro BARRETO',             '06/02 a 10/02', '11/2026',  '202600002006865'),
  c(29, '2º SGT PM',  '34980', 'Fernando ELIAS de Souza',             '08/06 a 12/06', '82/2026',  '202600002056915'),
  c(30, '2º SGT PM',  '35285', 'Maykon Ygor ROCHA Freire',            '', '', ''),
  c(31, '2º SGT PM',  '35708', 'GABRIEL Soares de Oliveira',          '', '', ''),
  c(32, '2º SGT PM',  '33303', 'EDERSON Rocha Martins',               '', '', ''),
  c(33, '2º SGT PM',  '33168', 'Weber Pereira RAMOS JÚNIOR',          '', '', ''),
  c(34, '2º SGT PM',  '34429', 'FREDERICO Gomes da Silva',            '20/01 a 24/01', '19/2026',  '202600002010112'),
  c(35, '2º SGT PM',  '34563', 'Kleyton Galvão CERÁVOLO',             '', '', ''),
  c(36, '3º SGT PM',  '36051', 'Wellington de Melo LIMA',             '09/03 a 13/03', '057/2026', '202600002037447'),
  c(37, '3º SGT PM',  '35850', 'LUCAS Gabriel de Araújo',             '', '', ''),
  c(38, '3º SGT PM',  '34359', 'EDSON de Souza Júnior',               '', '', ''),
  c(39, '3º SGT PM',  '35320', 'Uislei Gonçalves COELHO',             '24/01 a 28/01', '11/2026',  '202600002006865'),
  c(40, '3º SGT PM',  '35717', 'Gerson Dias de Oliveira MILAZZO',     '', '', ''),
  c(41, '3º SGT PM',  '37509', 'Joao FELIPE Candido de Souza',        '', '', ''),
  c(42, '3º SGT PM',  '37571', 'José Francisco de MORAIS Júnior',     '24/03 a 28/03', '057/2026', '202600002037447'),
  c(43, '3º SGT PM',  '35621', 'David CLIFF Theodoro da Cunha',       '', '', ''),
  c(44, '3º SGT PM',  '35324', 'VICTOR Gomes do Nascimento Dionizio', '01/05 a 05/05', '82/2026',  '202600002056225'),
  c(45, '3º SGT PM',  '35378', 'Danilo Soares BARBOSA',               '', '', ''),
  c(46, '3º SGT PM',  '35884', 'Marcos Antonio de CARVALHO',          '', '', ''),
  c(47, '3º SGT PM',  '35821', 'Jurandi Campos Araújo JUNIOR',        '22/03 a 26/03', '057/2026', '202600002037447'),
  c(48, '3º SGT PM',  '36410', 'Alex Rodrigues BRANDÃO',              '05/01 a 09/01', '251/2025', '202500002163667'),
  c(49, '3º SGT PM',  '38348', 'THÁSSIO Ferreira do Nascimento',      '', '', ''),
  c(50, '3º SGT PM',  '37905', 'Matheus VALADÃO Firmiano',            '', '', ''),
  c(51, '3º SGT PM',  '37308', 'GUSTAVO Dutra Monteiro',              '09 a 13/01',    '19/2026',  '202600002010112'),
  c(52, '3º SGT PM',  '38038', 'Paulo Sérgio Santana ALBERNAZ',       '', '', ''),
  c(53, '3º SGT PM',  '38130', 'Rafael QUEIROZ Silva',                '', '', ''),
  c(54, 'CB PM',      '36412', 'BRUNO César Ribeiro e Silva',         '', '', ''),
  c(55, 'CB PM',      '36428', 'OTTO Schutz Guimarães',               '', '', ''),
  c(56, 'CB PM',      '36511', 'Rogério GOUVEIA da Costa',            '', '', ''),
  c(57, 'CB PM',      '37259', 'GLAUBER Sousa Dutra',                 '', '', ''),
  c(58, 'CB PM',      '37531', 'Jonathan FERREIRA de Carvalho',       '', '', ''),
  c(59, 'CB PM',      '38341', 'THAISLANE Rezende Bertoldo',          '', '', ''),
  c(60, 'CB PM',      '37108', 'EVANDRO dos Santos Rosa',             '', '', ''),
  c(61, 'CB PM',      '37885', 'MATEUS Aires de Lima Souza',          '06/10 a 10/04', '057/2026', '202600002037447'),
  c(62, 'CB PM',      '38499', 'Wellington MALHEIROS dos Santos',     '', '', ''),
  c(63, 'CB PM',      '37007', 'DONÁRIO Rogério De Godoy Junior',     '', '', ''),
  c(64, 'CB PM',      '37365', 'IANCA Andressa Holanda de Souza',     '', '', ''),
  c(65, 'CB PM',      '38311', 'Sérgio REIS de Andrade',              '', '', ''),
  c(66, 'CB PM',      '38005', 'Patrick NEVES Ferreira',              '', '', ''),
  c(67, 'CB PM',      '38500', 'WELLIS Jones Batista de Sá',          '', '', ''),
  c(68, 'CB PM',      '38476', 'WANDRER Francisco De Oliveira',       '', '', ''),
  c(69, 'CB PM',      '36917', 'DANILO de Paula Magalhães',           '', '', ''),
  c(70, 'CB PM',      '37998', 'Pablo Gabriel PEREIRA Dias',          '', '', ''),
  c(71, 'CB PM',      '37597', 'Junio Ferreira Nunes',                '', '', ''),
  c(72, 'CB PM',      '37009', 'DOUGLAS Bueno da Rocha',              '', '', ''),
  c(73, 'CB PM',      '38380', 'Thiago SANTOS e Sa',                  '06/05 a 10/05', '82/2026',  '202600002056225'),
  c(74, 'CB PM',      '36642', 'Alex Vieira ARANTES',                 '', '', ''),
  c(75, 'CB PM',      '37340', 'Higor NATHAN Moreira Silva',          '07/02 a 11/02', '11/2026',  '202600002006865'),
  c(76, 'CB PM',      '37757', 'Lucas MOREIRA do Nascimento',         '02/06 a 06/06', '82/2026',  '202600002056915'),
  c(77, 'CB PM',      '38320', 'Silvio Nunes FILHO',                  '', '', ''),
  c(78, 'CB PM',      '37596', 'Júnio Albuquerque ARAÚJO',            '', '', ''),
  c(79, 'CB PM',      '37528', 'JONATAS Martins de Oliveira',         '29/04 a 03/05', '76/2026',  '202600002050255'),
  c(80, 'CB PM',      '38214', 'Ricardo VILELA Arantes',              '', '', ''),
  c(81, 'SD PM',      '39151', 'Hygor Correa BENJAMIM de Sousa',      '', '', ''),
  c(82, 'SD PM',      '38944', 'Bruno Eduardo MARTINS de Oliveira',   '', '', ''),
  c(83, 'SD PM',      '39229', 'JÚLIO César de Paulo Sousa',          '11/05 a 15/05', '82/2026',  '202600002056225'),
  c(84, 'SD PM',      '39337', 'Marcos VINÍCIUS Ribeiro',             '', '', ''),
  c(85, 'SD PM',      '39102', 'GLEIBER Lins dos Santos',             '', '', ''),
  c(86, 'SD PM',      '39926', 'Matheus FRANCO de Almeida',           '12/06 a 16/06', '82/2026',  '202600002056915'),
  c(87, 'SD PM',      '39821', 'Johnatan William de Oliveira RAMALHO','07/06 a 11/06', '82/2026',  '202600002056915'),
];

// ── ANUAL 2026 ────────────────────────────────────────────────────────────────

export const dispensaAnualDB: DispensaAnual[] = [
  a(1,  'CAP PM',    '38129', 'Rafael BUENO Gonçalves'),
  a(2,  '1º TEN PM', '31519', 'DANISCLAY Ferreira Barros'),
  a(3,  '1º TEN PM', '31124', 'Newton Ramos de ARAÚJO'),
  a(4,  '2º TEN PM', '38802', 'Alexandre ANDRADE Girardi'),
  a(5,  '2º TEN PM', '32594', 'GLEYDSON Oliveira do Prado'),
  a(6,  'SUBTEN PM', '30494', 'Eduardo THALES Santana Silva', '07/01', '31/2026'),
  a(7,  'SUBTEN PM', '28521', 'Guiomar WILKER Alves'),
  a(8,  'SUBTEN PM', '31438', 'LUIS CARLOS Pereira da Silva'),
  a(9,  'SUBTEN PM', '31478', 'RONI Vieira',                  '26/01', '31/2026'),
  a(10, 'SUBTEN PM', '32579', 'NIVALDO Gomes Correia'),
  a(11, 'SUBTEN PM', '32786', 'Fernando EMÍLIO Silva Pereira'),
  a(12, 'SUBTEN PM', '33490', 'Luiz Sérgio Ferreira COUTO'),
  a(13, '1º SGT PM', '27207', 'AGUINALDO Aparecido da Silva'),
  a(14, '1º SGT PM', '32576', 'LEONARDO de Araújo Gomes Borges'),
  a(15, '1º SGT PM', '31309', 'URBANO Neto Gomes Nascimento'),
  a(16, '1º SGT PM', '33770', 'SANTIAGO Marques'),
  a(17, '1º SGT PM', '32508', 'DIOGO Alves de Oliveira'),
  a(18, '1º SGT PM', '33751', 'Andre FREIRE de Paiva',        '06/01', '31/2026'),
  a(19, '1º SGT PM', '33344', 'Diego PEIXOTO Noel'),
  a(20, '1º SGT PM', '31958', 'SÉRGIO Roberto Barbosa da Cruz'),
  a(21, '2º SGT PM', '29982', 'Maria Aparecida CHAGAS'),
  a(22, '2º SGT PM', '32573', 'GABRIELA Alves Landin dos Santos'),
  a(23, '2º SGT PM', '29635', 'Cleber Soares RIBEIRO',        '31/01', '31/2026'),
  a(24, '2º SGT PM', '31648', 'Éder DOS SANTOS Magalhães'),
  a(25, '2º SGT PM', '32574', 'GEORGE Gonzaga de Sousa Santos'),
  a(26, '2º SGT PM', '33516', 'Willian DE FREITAS Pinto',     '23/01', '31/2026'),
  a(27, '2º SGT PM', '33041', 'Thiago TABATA Santos'),
  a(28, '2º SGT PM', '33279', 'Moises Monteiro BARRETO'),
  a(29, '2º SGT PM', '35285', 'Maykon Ygor ROCHA Freire'),
  a(30, '2º SGT PM', '35708', 'GABRIEL Soares de Oliveira'),
  a(31, '2º SGT PM', '33303', 'EDERSON Rocha Martins'),
  a(32, '2º SGT PM', '33168', 'Weber Pereira RAMOS JÚNIOR'),
  a(33, '2º SGT PM', '34429', 'FREDERICO Gomes da Silva'),
  a(34, '2º SGT PM', '34563', 'Kleyton Galvão CERÁVOLO'),
  a(35, '3º SGT PM', '36051', 'Wellington de Melo LIMA',      '22/01', '19/2026'),
  a(36, '3º SGT PM', '35850', 'LUCAS Gabriel de Araújo'),
  a(37, '3º SGT PM', '34359', 'EDSON de Souza Júnior',        '21/01', '31/2026'),
  a(38, '3º SGT PM', '35320', 'Uislei Gonçalves COELHO'),
  a(39, '3º SGT PM', '35717', 'Gerson Dias de Oliveira MILAZZO','06/01','31/2026'),
  a(40, '3º SGT PM', '37509', 'Joao FELIPE Candido de Souza'),
  a(41, '3º SGT PM', '37571', 'José Francisco de MORAIS Júnior'),
  a(42, '3º SGT PM', '35621', 'David CLIFF Theodoro da Cunha','22/01', '31/2026'),
  a(43, '3º SGT PM', '35324', 'VICTOR Gomes do Nascimento Dionizio','23/01','31/2026'),
  a(44, '3º SGT PM', '35378', 'Danilo Soares BARBOSA'),
  a(45, '3º SGT PM', '35884', 'Marcos Antonio de CARVALHO'),
  a(46, '3º SGT PM', '35821', 'Jurandi Campos Araújo JUNIOR'),
  a(47, '3º SGT PM', '36410', 'Alex Rodrigues BRANDÃO'),
  a(48, '3º SGT PM', '38348', 'THÁSSIO Ferreira do Nascimento','02/01','31/2026'),
  a(49, '3º SGT PM', '37905', 'Matheus VALADÃO Firmiano'),
  a(50, '3º SGT PM', '37308', 'GUSTAVO Dutra Monteiro'),
  a(51, '3º SGT PM', '38038', 'Paulo Sérgio Santana ALBERNAZ'),
  a(52, '3º SGT PM', '38130', 'Rafael QUEIROZ Silva'),
  a(53, 'CB PM',     '36412', 'BRUNO César Ribeiro e Silva',  '31/01', '31/2026'),
  a(54, 'CB PM',     '36428', 'OTTO Schutz Guimarães'),
  a(55, 'CB PM',     '36511', 'Rogério GOUVEIA da Costa',     '05/01', '31/2026'),
  a(56, 'CB PM',     '37259', 'GLAUBER Sousa Dutra'),
  a(57, 'CB PM',     '37531', 'Jonathan FERREIRA de Carvalho'),
  a(58, 'CB PM',     '37108', 'EVANDRO dos Santos Rosa'),
  a(59, 'CB PM',     '37885', 'MATEUS Aires de Lima Souza'),
  a(60, 'CB PM',     '38499', 'Wellington MALHEIROS dos Santos'),
  a(61, 'CB PM',     '37007', 'DONÁRIO Rogério De Godoy Junior','04/01','31/2026'),
  a(62, 'CB PM',     '37365', 'IANCA Andressa Holanda de Souza'),
  a(63, 'CB PM',     '38311', 'Sérgio REIS de Andrade'),
  a(64, 'CB PM',     '38005', 'Patrick NEVES Ferreira'),
  a(65, 'CB PM',     '38500', 'WELLIS Jones Batista de Sá'),
  a(66, 'CB PM',     '38476', 'WANDRER Francisco De Oliveira'),
  a(67, 'CB PM',     '36917', 'DANILO de Paula Magalhães'),
  a(68, 'CB PM',     '37998', 'Pablo Gabriel PEREIRA Dias'),
  a(69, 'CB PM',     '37597', 'Junio Ferreira Nunes'),
  a(70, 'CB PM',     '37009', 'DOUGLAS Bueno da Rocha'),
  a(71, 'CB PM',     '38380', 'Thiago SANTOS e Sa',           '31/01', '31/2026'),
  a(72, 'CB PM',     '36642', 'Alex Vieira ARANTES'),
  a(73, 'CB PM',     '37340', 'Higor NATHAN Moreira Silva'),
  a(74, 'CB PM',     '37757', 'Lucas MOREIRA do Nascimento'),
  a(75, 'CB PM',     '38320', 'Silvio Nunes FILHO'),
  a(76, 'CB PM',     '37596', 'Júnio Albuquerque ARAÚJO'),
  a(77, 'CB PM',     '37528', 'JONATAS Martins de Oliveira'),
  a(78, 'CB PM',     '38214', 'Ricardo VILELA Arantes',       '04/01', '31/2026'),
  a(79, 'SD PM',     '39151', 'Hygor Correa BENJAMIM de Sousa'),
  a(80, 'SD PM',     '38944', 'Bruno Eduardo MARTINS de Oliveira'),
  a(81, 'SD PM',     '39229', 'JÚLIO César de Paulo Sousa'),
  a(82, 'SD PM',     '39337', 'Marcos VINÍCIUS Ribeiro',      '10/01', '31/2026'),
  a(83, 'SD PM',     '39102', 'GLEIBER Lins dos Santos'),
  a(84, 'SD PM',     '39926', 'Matheus FRANCO de Almeida'),
  a(85, 'SD PM',     '39821', 'Johnatan William de Oliveira RAMALHO'),
];
