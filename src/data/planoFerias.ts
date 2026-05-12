// ── Types ─────────────────────────────────────────────────────────────────────

export interface FeriasPessoa {
  id: string;
  mes: number;       // 1–12
  ord: number;
  posto: string;
  rg: string;
  nome: string;
  funcao: string;
  dias: string;
  saida: string;
  retorno: string;
  observacao: string;
}

export interface FeriasPendente {
  id: string;
  ord: number;
  posto: string;
  rg: string;
  nome: string;
  inclusao: string;
  exercicios: { dias: string; exercicio: string }[];
}

export interface FeriasAbrilMaio {
  id: string;
  secao: 'retornam-abril' | 'entram-maio' | 'lesp';
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

// ── Compact helpers ───────────────────────────────────────────────────────────

type PlanoRow = readonly [number, number, string, string, string, string, string, string, string, string];
// [mes, ord, posto, rg, nome, funcao, dias, saida, retorno, obs]

type PendenteRow = readonly [number, string, string, string, string, string, string, string, string, string, string, string, string, string, string];
// [ord, posto, rg, nome, inclusao, d1, e1, d2, e2, d3, e3, d4, e4, d5, e5]

type AbrMaiRow = readonly [string, number, string, string, string, string, string, string, string, string, string, string];
// [secao, num, grad, rg, nome, funcao, dias, inicio, fim, dispCmdo, pronto, obs]

// ── Plano Mensal seed (Anotações CSV, SETEMBRO = Plano Pronto) ────────────────

const _plano: PlanoRow[] = [
  // JANEIRO
  [1, 1, '1º TEN PM', '31519', 'DANISCLAY Ferreira Barros', 'CPE CMDO', '', '', '', ''],
  [1, 2, 'SUBTEN PM', '28521', 'Guiomar WILKER Alves', 'Operacional', '', '', '', ''],
  [1, 3, '1º SGT PM', '32576', 'LEONARDO de Araújo Gomes Borges', 'ADM', '', '', '', 'só receber'],
  [1, 4, '1º SGT PM', '32508', 'DIOGO Alves de Oliveira', 'Operacional', '', '', '', ''],
  [1, 5, '2º SGT PM', '32573', 'GABRIELA Alves Landin dos Santos', 'ADM', '', '', '', ''],
  [1, 6, '2º SGT PM', '33279', 'Moises Monteiro BARRETO', 'Operacional', '', '', '', ''],
  [1, 7, '3º SGT PM', '35320', 'Uislei Gonçalves COELHO', 'Operacional', '', '', '', ''],
  [1, 8, '3º SGT PM', '38038', 'Paulo Sérgio Santana ALBERNAZ', 'Operacional', '', '', '', ''],
  [1, 9, 'CB PM', '37340', 'Higor NATHAN Moreira Silva', 'CPE 20', '', '', '', ''],
  // FEVEREIRO
  [2, 1, 'SUBTEN PM', '31478', 'RONI Vieira', 'OPERACIONAL', '', '', '', ''],
  [2, 2, '1º SGT PM', '33751', 'Andre FREIRE de Paiva', 'OPERACIONAL', '', '', '', ''],
  [2, 3, '3º SGT PM', '36051', 'Wellington de Melo LIMA', 'CPE 20', '', '', '', ''],
  [2, 4, 'CB PM', '37531', 'Jonathan FERREIRA de Carvalho', 'OPERACIONAL', '20', '01/02', '22/02', '22/02 EAS'],
  [2, 5, 'CB PM', '37365', 'IANCA Andressa Holanda de Souza', 'ADM - P/1', '', '', '', ''],
  [2, 6, 'CB PM', '38214', 'Ricardo VILELA Arantes', 'OPERACIONAL', '10', '', '', 'depois da lic paternidade'],
  // MARÇO
  [3, 1, '2º TEN PM', '38802', 'Alexandre ANDRADE Girardi', 'CPE CMDO', 'JULHO', '', '', ''],
  [3, 2, '2º SGT PM', '29982', 'Maria Aparecida CHAGAS', 'ADM - P/1', '', '', '', ''],
  [3, 3, '3º SGT PM', '37571', 'José Francisco de MORAIS Júnior', 'CPE 20', '', '', '', ''],
  [3, 4, '3º SGT PM', '37308', 'GUSTAVO Dutra Monteiro', 'OPERACIONAL', '', '', '', ''],
  [3, 5, 'CB PM', '37528', 'JONATAS Martins de Oliveira', 'OPERACIONAL', '', '', '', ''],
  // ABRIL
  [4, 1, '3º SGT PM', '35324', 'VICTOR Gomes do Nascimento Dionizio', 'OPERACIONAL', '', '', '', ''],
  [4, 2, '3º SGT PM', '38038', 'Paulo Sérgio Santana ALBERNAZ', 'OPERACIONAL', '30', '08/04', '', 'APÓS LIC PAT. 19/03 A 07/04'],
  [4, 3, 'CB PM', '37885', 'MATEUS Aires de Lima Souza', 'CPE 20', '', '', '', 'NÃO VAI TIRAR'],
  [4, 4, 'CB PM', '38311', 'Sérgio REIS de Andrade', 'OPERACIONAL', '', '', '', ''],
  [4, 5, 'CB PM', '38380', 'Thiago SANTOS e Sa', 'OPERACIONAL', '', '', '', ''],
  [4, 6, 'SD PM', '39229', 'JÚLIO César de Paulo Sousa', 'OPERACIONAL', '30', '11/04', '', ''],
  [4, 7, 'SD PM', '38944', 'Bruno Eduardo MARTINS de Oliveira', 'OPERACIONAL', '', '', '', 'NÃO VAI TIRAR'],
  // MAIO
  [5, 1, '1º SGT PM', '31309', 'URBANO Neto Gomes Nascimento', 'OPERACIONAL', '', '02/05', '', ''],
  [5, 2, '2º SGT PM', '34980', 'Fernando ELIAS de Souza', 'OPERACIONAL', '', '', '', ''],
  [5, 3, 'CB PM', '37757', 'Lucas MOREIRA do Nascimento', 'OPERACIONAL', '', '', '', ''],
  [5, 4, 'CB PM', '37596', 'Júnio Albuquerque ARAÚJO', 'OPERACIONAL', '', '', '', 'LESP'],
  [5, 5, 'CB PM', '38500', 'WELLIS Jones Batista de Sá', 'OPERACIONAL', '', '', '', 'NÃO VAI TIRAR'],
  [5, 6, 'CB PM', '37009', 'DOUGLAS Bueno da Rocha', 'CPE 20', '', '15/05', '', 'FOI PARA JUNHO'],
  [5, 7, 'SD PM', '39151', 'Hygor Correa BENJAMIM de Sousa', 'OPERACIONAL', '', '', '', ''],
  [5, 8, 'SD PM', '39926', 'Matheus FRANCO de Almeida', 'OPERACIONAL', '', '', '', ''],
  [5, 9, 'SD PM', '39821', 'Johnatan William de Oliveira RAMALHO', 'OPERACIONAL', '', '', '', ''],
  // JUNHO
  [6, 1, 'SUBTEN PM', '30494', 'Eduardo THALES Santana Silva', 'OPERACIONAL', '', '', '', ''],
  [6, 2, '2º SGT PM', '35708', 'GABRIEL Soares de Oliveira', 'ADM - P/4', '', '', '', ''],
  [6, 3, '3º SGT PM', '38130', 'Rafael QUEIROZ Silva', 'OPERACIONAL', '', '', '', ''],
  [6, 4, 'CB PM', '36412', 'BRUNO César Ribeiro e Silva', 'OPERACIONAL', '', '', '', ''],
  [6, 5, 'CB PM', '36511', 'Rogério GOUVEIA da Costa', 'OPERACIONAL', '', '', '', ''],
  [6, 6, 'CB PM', '37597', 'Junio Ferreira NUNES', 'CPE 20', '', '', '', ''],
  [6, 7, 'CB PM', '37009', 'DOUGLAS Bueno da Rocha', 'CPE 20', '30', '22/06', '21/07', ''],
  // JULHO
  [7, 1, '1º TEN PM', '31124', 'Newton Ramos de ARAÚJO', 'CPE CMDO', '', '', '', ''],
  [7, 2, 'SUBTEN PM', '32594', 'GLEYDSON Oliveira do Prado', 'OPERACIONAL', '', '', '', 'CHOA'],
  [7, 3, '1º SGT PM', '33770', 'SANTIAGO Marques', 'CPE 20', '', '', '', ''],
  [7, 4, '2º SGT PM', '33041', 'Thiago TABATA Santos', 'OPERACIONAL', '', '', '', ''],
  [7, 5, '2º SGT PM', '35285', 'Maykon Ygor ROCHA Freire', 'OPERACIONAL', '', '', '', ''],
  [7, 6, '2º SGT PM', '34429', 'FREDERICO Gomes da Silva', 'OPERACIONAL', '', '', '', ''],
  [7, 7, '2º SGT PM', '34563', 'Kleyton Galvão CERÁVOLO', 'OPERACIONAL', '', '', '', ''],
  [7, 8, '3º SGT PM', '34359', 'EDSON de Souza Júnior', 'OPERACIONAL', '', '', '', 'FOI PARA MAIO'],
  [7, 9, '3º SGT PM', '35884', 'Marcos Antonio de CARVALHO', 'OPERACIONAL', '', '', '', 'AUT. CAP BUENO'],
  // AGOSTO
  [8, 1, '3º SGT PM', '35378', 'Danilo Soares BARBOSA', 'OPERACIONAL', '', '', '', ''],
  [8, 2, '3º SGT PM', '35850', 'LUCAS Gabriel de Araújo', 'OPERACIONAL', '', '', '', ''],
  [8, 3, '3º SGT PM', '35884', 'Marcos Antonio de CARVALHO', 'OPERACIONAL', '', '', '', ''],
  [8, 4, '3º SGT PM', '36410', 'Alex Rodrigues BRANDÃO', 'CPE 20', '', '', '', ''],
  [8, 5, '3º SGT PM', '38348', 'THÁSSIO Ferreira do Nascimento', 'OPERACIONAL', '', '', '', ''],
  [8, 6, 'CB PM', '38499', 'Wellington MALHEIROS dos Santos', 'OPERACIONAL', '', '', '', ''],
  [8, 7, 'CB PM', '37007', 'DONÁRIO Rogério De Godoy Junior', 'OPERACIONAL', '', '', '', 'estava em novembro'],
  [8, 8, 'CB PM', '38005', 'Patrick NEVES Ferreira', 'OPERACIONAL', '', '', '', ''],
  [8, 9, 'SD PM', '39102', 'GLEIBER Lins dos Santos', 'OPERACIONAL', '', '', '', 'Após licença paternidade'],
  // SETEMBRO (Plano Pronto)
  [9, 1, '2º SGT PM', '33168', 'Weber Pereira RAMOS JÚNIOR', 'OPERACIONAL', '', '', '', ''],
  [9, 2, '3º SGT PM', '37905', 'Matheus VALADÃO Firmiano', 'OPERACIONAL', '', '', '', ''],
  [9, 3, 'CB PM', '37259', 'GLAUBER Sousa Dutra', 'CPE 20', '', '', '', ''],
  [9, 4, 'CB PM', '38341', 'THAISLANE Rezende Bertoldo', 'ADM', '', '', '', ''],
  [9, 5, 'CB PM', '36917', 'DANILO de Paula Magalhães', 'OPERACIONAL', '', '', '', ''],
  [9, 6, 'CB PM', '37998', 'Pablo Gabriel PEREIRA Dias', 'OPERACIONAL', '', '', '', ''],
  [9, 7, 'CB PM', '38320', 'Silvio Nunes FILHO', 'OPERACIONAL', '', '', '', ''],
  [9, 8, 'SD PM', '39337', 'Marcos VINÍCIUS Ribeiro', 'OPERACIONAL', '', '', '', ''],
  // OUTUBRO
  [10, 1, 'SUBTEN PM', '33490', 'Luiz Sérgio Ferreira COUTO', 'CPE 20', '', '', '', ''],
  [10, 2, '1º SGT PM', '31958', 'SÉRGIO Roberto Barbosa da Cruz', 'OPERACIONAL', '', '', '', ''],
  [10, 3, '2º SGT PM', '29635', 'Cleber Soares RIBEIRO', 'OPERACIONAL', '', '', '', ''],
  [10, 4, '3º SGT PM', '35621', 'David CLIFF Theodoro da Cunha', 'OPERACIONAL', '', '', '', ''],
  [10, 5, 'CB PM', '36428', 'OTTO Schutz Guimarães', 'OPERACIONAL', '', '', '', ''],
  [10, 6, 'CB PM', '37108', 'EVANDRO dos Santos Rosa', 'OPERACIONAL', '', '', '', ''],
  [10, 7, 'CB PM', '36642', 'Alex Vieira ARANTES', 'OPERACIONAL', '', '', '', ''],
  // NOVEMBRO
  [11, 1, '2º SGT PM', '33516', 'Willian DE FREITAS Pinto', 'OPERACIONAL', '', '', '', ''],
  [11, 2, '2º SGT PM', '33303', 'EDERSON Rocha Martins', 'OPERACIONAL', '', '', '', ''],
  [11, 3, '3º SGT PM', '37509', 'Joao FELIPE Candido de Souza', 'CPE 20', '', '', '', ''],
  [11, 4, '3º SGT PM', '35821', 'Jurandi Campos Araújo JUNIOR', 'OPERACIONAL', '', '', '', ''],
  [11, 5, 'CB PM', '37007', 'DONÁRIO Rogério De Godoy Junior', 'OPERACIONAL', '', '', '', 'FOI PARA AGOSTO'],
  [11, 6, 'CB PM', '38476', 'WANDRER Francisco De Oliveira', 'OPERACIONAL', '', '', '', ''],
  // DEZEMBRO
  [12, 1, 'SUBTEN PM', '32579', 'NIVALDO Gomes Correia', 'OPERACIONAL', '', '', '', ''],
  [12, 2, 'SUBTEN PM', '32786', 'Fernando EMÍLIO Silva Pereira', 'CPE 20', '', '', '', ''],
  [12, 3, '1º SGT PM', '27207', 'AGUINALDO Aparecido da Silva', 'OPERACIONAL', '', '', '', ''],
  [12, 4, '1º SGT PM', '32508', 'DIOGO Alves de Oliveira', 'OPERACIONAL', '', '', '', 'Tirou dispensa Cmdo Geral 15/07 a 19/07'],
  [12, 5, '1º SGT PM', '33344', 'Diego PEIXOTO Noel', 'OPERACIONAL', '', '', '', ''],
  [12, 6, '2º SGT PM', '31648', 'Éder DOS SANTOS Magalhães', 'OPERACIONAL', '', '', '', ''],
  [12, 7, '2º SGT PM', '32574', 'GEORGE Gonzaga de Sousa Santos', 'OPERACIONAL', '', '', '', ''],
];

export const feriasMensalDB: FeriasPessoa[] = _plano.map(
  ([mes, ord, posto, rg, nome, funcao, dias, saida, retorno, obs], i) => ({
    id: `fm${i + 1}`,
    mes, ord, posto, rg, nome, funcao, dias, saida, retorno, observacao: obs,
  }),
);

// ── Férias Pendentes seed ─────────────────────────────────────────────────────

const _pendentes: PendenteRow[] = [
  [1,  'MAJ PM',     '33633', 'GEORGE Augusto Silva',                 '12/07/2010', '','',  '','',  '18','2023','30','2024','30','2025'],
  [2,  'CAP PM',     '38129', 'Rafael BUENO Gonçalves',               '13/11/2017', '9','2021','','',  '30','2023','30','2024','30','2025'],
  [3,  'CAP PM',     '29976', 'JOSIAS Alves da Silva',                '07/02/2000', '','',  '','',  '','',  '30','2024','30','2025'],
  [4,  '1º TEN PM',  '31519', 'DANISCLAY Ferreira Barros',            '18/02/2002', '','',  '','',  '30','2023','30','2024','30','2025'],
  [5,  '1º TEN PM',  '31124', 'Newton Ramos de ARAÚJO',              '15/07/2001', '','',  '20','2022','30','2023','30','2024','30','2025'],
  [6,  '2º TEN PM',  '38802', 'Alexandre ANDRADE Girardi',            '05/06/2023', '','',  '','',  '30','2023','30','2024','30','2025'],
  [7,  '2º TEN PM',  '32594', 'GLEYDSON Oliveira do Prado',           '08/09/2005', '5','2021','','',  '','',  '30','2024','30','2025'],
  [8,  'SUBTEN PM',  '30494', 'Eduardo THALES Santana Silva',         '07/02/2000', '','',  '','',  '','',  '','',  '30','2025'],
  [9,  'SUBTEN PM',  '31478', 'RONI Vieira',                          '18/02/2002', '','',  '','',  '','',  '','',  '','FEV'],
  [10, 'SUBTEN PM',  '32579', 'NIVALDO Gomes Correia',                '08/09/2005', '','',  '30','2022','30','2023','30','2024','30','2025'],
  [11, 'SUBTEN PM',  '32786', 'Fernando EMÍLIO Silva Pereira',       '12/07/2010', '5','2021','','',  '30','2023','30','2024','30','2025'],
  [12, 'SUBTEN PM',  '31616', 'CARLA Alves de Andrade',               '18/02/2002', '','',  '','',  '','',  '','',  '30','2025'],
  [13, '1º SGT PM',  '33490', 'Luiz Sérgio Ferreira COUTO',          '12/07/2010', '','',  '30','2022','30','2023','30','2024','30','2025'],
  [14, '1º SGT PM',  '27207', 'AGUINALDO Aparecido da Silva',         '01/06/1994', '','',  '30','2022','30','2023','30','2024','30','2025'],
  [15, '1º SGT PM',  '32576', 'LEONARDO de Araújo Gomes Borges',    '08/09/2005', '','',  '','',  '','',  '','',  '30','2025'],
  [16, '1º SGT PM',  '31309', 'URBANO Neto Gomes Nascimento',         '18/02/2002', '','',  '','',  '','',  '','',  '','MAIO'],
  [17, '1º SGT PM',  '33770', 'SANTIAGO Marques',                     '27/07/2010', '','',  '','',  '','',  '30','2024','30','2025'],
  [18, '1º SGT PM',  '27238', 'Sidney Rodrigues UESSUGI',             '01/06/1994', '','',  '30','2022','30','2023','30','2024','30','2025'],
  [19, '1º SGT PM',  '32508', 'DIOGO Alves de Oliveira',              '08/09/2005', '','',  '','',  '','',  '10','2024','30','2025'],
  [20, '1º SGT PM',  '33751', 'Andre FREIRE de Paiva',                '09/08/2010', '','',  '30','2022','30','2023','30','2024','30','2025'],
  [21, '1º SGT PM',  '33344', 'Diego PEIXOTO Noel',                   '12/07/2010', '','',  '','',  '','',  '30','2024','30','2025'],
  [22, '2º SGT PM',  '31958', 'SÉRGIO Roberto Barbosa da Cruz',      '22/12/2003', '','',  '','',  '','',  '30','2024','30','2025'],
  [23, '2º SGT PM',  '29635', 'Cleber Soares RIBEIRO',                '09/11/1998', '','',  '','',  '30','2023','30','2024','30','2025'],
  [24, '2º SGT PM',  '29982', 'Maria Aparecida CHAGAS',               '07/02/2000', '15','2021','','',  '30','2023','30','2024','30','2025'],
  [25, '2º SGT PM',  '32573', 'GABRIELA Alves Landin dos Santos',     '08/09/2005', '','',  '15','2022','30','2023','30','2024','30','2025'],
  [26, '2º SGT PM',  '31648', 'Éder DOS SANTOS Magalhães',           '18/02/2002', '','',  '','',  '','',  '30','2024','30','2025'],
  [27, '2º SGT PM',  '32574', 'GEORGE Gonzaga de Sousa Santos',       '08/09/2005', '','',  '','',  '','',  '','',  '30','2025'],
  [28, '2º SGT PM',  '33516', 'Willian DE FREITAS Pinto',             '12/07/2010', '','',  '','',  '15','2023','','',  '30','2025'],
  [29, '2º SGT PM',  '33041', 'Thiago TABATA Santos',                 '12/07/2010', '','',  '','',  '','',  '','',  '30','2025'],
  [30, '2º SGT PM',  '33279', 'Moises Monteiro BARRETO',              '12/07/2010', '','',  '','',  '','',  '','',  '30','2025'],
  [31, '2º SGT PM',  '34980', 'Fernando ELIAS de Souza',              '04/02/2014', '','',  '','',  '','',  '','',  '','MAIO'],
  [32, '2º SGT PM',  '35285', 'Maykon Ygor ROCHA Freire',             '14/04/2014', '','',  '','',  '','',  '','',  '30','2025'],
  [33, '2º SGT PM',  '35708', 'GABRIEL Soares de Oliveira',           '05/01/2016', '','',  '','',  '15','2023','','',  '30','2025'],
  [34, '2º SGT PM',  '33303', 'EDERSON Rocha Martins',                '12/07/2010', '','',  '','',  '15','2023','30','2024','30','2025'],
  [35, '2º SGT PM',  '33168', 'Weber Pereira RAMOS JÚNIOR',          '12/07/2010', '','',  '','',  '30','2023','30','2024','30','2025'],
  [36, '2º SGT PM',  '34429', 'FREDERICO Gomes da Silva',             '06/01/2014', '','',  '','',  '','',  '','',  '30','2025'],
  [37, '2º SGT PM',  '34563', 'Kleyton Galvão CERÁVOLO',             '06/01/2014', '','',  '','',  '','',  '30','2024','30','2025'],
  [38, '3º SGT PM',  '36051', 'Wellington de Melo LIMA',              '05/01/2016', '','',  '','',  '','',  '','',  '','FEV'],
  [39, '3º SGT PM',  '35850', 'LUCAS Gabriel de Araújo',             '05/01/2016', '','',  '','',  '','',  '30','2024','30','2025'],
  [40, '3º SGT PM',  '34359', 'EDSON de Souza Júnior',               '06/01/2014', '','',  '','',  '30','2023','30','2024','30','2025'],
  [41, '3º SGT PM',  '35320', 'Uislei Gonçalves COELHO',             '17/03/2014', '','',  '10','2022','','',  '','',  '10','2025'],
  [42, '3º SGT PM',  '37509', 'Joao FELIPE Candido de Souza',         '09/10/2017', '15','2021','','',  '','',  '','',  '30','2025'],
  [43, '3º SGT PM',  '37571', 'José Francisco de MORAIS Júnior',     '09/10/2017', '','',  '','',  '','',  '15','2024','30','2025'],
  [44, '3º SGT PM',  '35621', 'David CLIFF Theodoro da Cunha',        '05/01/2016', '','',  '','',  '','',  '30','2024','30','2025'],
  [45, '3º SGT PM',  '35324', 'VICTOR Gomes do Nascimento Dionizio',  '08/04/2014', '','',  '','',  '','',  '','',  '','ABRIL'],
  [46, '3º SGT PM',  '35378', 'Danilo Soares BARBOSA',                '03/10/2014', '','',  '30','2022','30','2023','30','2024','30','2025'],
  [47, '3º SGT PM',  '35884', 'Marcos Antonio de CARVALHO',           '05/01/2016', '','',  '','',  '','',  '','',  '30','2025'],
  [48, '3º SGT PM',  '35821', 'Jurandi Campos Araújo JUNIOR',        '05/01/2016', '','',  '','',  '20','2023','','',  '30','2025'],
  [49, '3º SGT PM',  '36410', 'Alex Rodrigues BRANDÃO',              '13/02/2017', '','',  '15','2022','30','2023','','',  '30','2025'],
  [50, '3º SGT PM',  '38348', 'Thássio Ferreira do NASCIMENTO',      '09/10/2017', '','',  '30','2022','30','2023','30','2024','30','2025'],
  [51, '3º SGT PM',  '37905', 'Matheus VALADÃO Firmiano',            '09/10/2017', '30','2021','30','2022','30','2023','30','2024','30','2025'],
  [52, '3º SGT PM',  '37308', 'GUSTAVO Dutra Monteiro',               '09/10/2017', '','',  '15','2022','30','2023','30','2024','30','2025'],
  [53, '3º SGT PM',  '38130', 'Rafael QUEIROZ Silva',                 '09/10/2017', '30','2021','30','2022','30','2023','30','2024','30','2025'],
  [54, 'CB PM',      '36412', 'BRUNO César Ribeiro e Silva',          '13/02/2017', '','',  '','',  '','',  '','',  '30','2025'],
  [55, 'CB PM',      '36428', 'OTTO Schutz Guimarães',               '13/02/2017', '','',  '','',  '','',  '30','2024','30','2025'],
  [56, 'CB PM',      '36511', 'Rogério GOUVEIA da Costa',            '02/07/2017', '','',  '','',  '','',  '','',  '30','2025'],
  [57, 'CB PM',      '37259', 'GLAUBER Sousa Dutra',                  '09/10/2017', '30','2021','30','2022','30','2023','30','2024','30','2025'],
  [58, 'CB PM',      '37531', 'Jonathan FERREIRA de Carvalho',        '09/10/2017', '','',  '','',  '','',  '10','2024','30','2025'],
  [59, 'CB PM',      '38341', 'THAISLANE Rezende Bertoldo',           '09/10/2017', '','',  '18','2022','30','2023','30','2024','30','2025'],
  [60, 'CB PM',      '37108', 'EVANDRO dos Santos Rosa',              '09/10/2017', '30','2021','30','2022','30','2023','30','2024','30','2025'],
  [61, 'CB PM',      '37885', 'MATEUS Aires de Lima Souza',           '09/10/2017', '','',  '30','2022','30','2023','30','2024','30','2025'],
  [62, 'CB PM',      '38499', 'Wellington MALHEIROS dos Santos',      '09/10/2017', '','',  '','',  '30','2023','30','2024','30','2025'],
  [63, 'CB PM',      '37007', 'DONÁRIO Rogério De Godoy Junior',     '09/10/2017', '','',  '','',  '','',  '30','2024','30','2025'],
  [64, 'CB PM',      '37365', 'IANCA Andressa Holanda de Souza',      '09/10/2017', '10','2021','30','2022','30','2023','','',  '30','2025'],
  [65, 'CB PM',      '38311', 'Sérgio REIS de Andrade',              '09/10/2017', '','',  '','',  '','',  '30','2024','30','2025'],
  [66, 'CB PM',      '38005', 'Patrick NEVES Ferreira',               '09/10/2017', '','',  '','',  '30','2023','30','2024','30','2025'],
  [67, 'CB PM',      '38500', 'WELLIS Jones Batista de Sá',          '09/10/2017', '','',  '30','2022','30','2023','30','2024','30','2025'],
  [68, 'CB PM',      '38476', 'WANDRER Francisco De Oliveira',        '09/10/2017', '','',  '30','2022','30','2023','30','2024','30','2025'],
  [69, 'CB PM',      '36917', 'DANILO de Paula Magalhães',           '09/10/2017', '','',  '','',  '30','2023','30','2024','30','2025'],
  [70, 'CB PM',      '37998', 'Pablo Gabriel PEREIRA Dias',           '09/10/2017', '30','2021','30','2022','30','2023','30','2024','30','2025'],
  [71, 'CB PM',      '37597', 'Junio FERREIRA Nunes',                 '09/10/2017', '','',  '30','2022','30','2023','30','2024','30','2025'],
  [72, 'CB PM',      '37009', 'DOUGLAS Bueno da Rocha',               '09/10/2017', '','',  '','',  '','',  '30','2024','30','2025'],
  [73, 'CB PM',      '38380', 'Thiago SANTOS e Sa',                   '09/10/2017', '','',  '','',  '15','2023','30','2024','30','2025'],
  [74, 'CB PM',      '36642', 'Alex Vieira ARANTES',                  '09/10/2017', '','',  '','',  '30','2023','30','2024','30','2025'],
  [75, 'CB PM',      '37340', 'Higor NATHAN Moreira Silva',           '09/10/2017', '','',  '','',  '30','2023','30','2024','30','2025'],
  [76, 'CB PM',      '37757', 'Lucas MOREIRA do Nascimento',          '09/10/2017', '','',  '','',  '','',  '','',  '30','2025'],
  [77, 'CB PM',      '38320', 'Silvio Nunes FILHO',                   '09/10/2017', '','',  '15','2022','30','2023','30','2024','30','2025'],
  [78, 'CB PM',      '37596', 'Júnio Albuquerque ARAÚJO',            '09/10/2017', '','',  '','',  '','',  '30','2024','30','2025'],
  [79, 'CB PM',      '37528', 'JONATAS Martins De Oliveira',          '09/10/2017', '','',  '','',  '','',  '','',  '30','2025'],
  [80, 'CB PM',      '38214', 'Ricardo VILELA Arantes',               '09/10/2017', '','',  '','',  '30','2023','30','2024','30','2025'],
  [81, 'SD PM',      '39151', 'Hygor Correa BENJAMIM de Sousa',       '05/06/2023', '','',  '','',  '','',  '','',  '','MAIO'],
  [82, 'SD PM',      '38944', 'Bruno Eduardo MARTINS de Oliveira',    '05/06/2023', '','',  '','',  '','',  '30','2024','30','2025'],
  [83, 'SD PM',      '39229', 'JÚLIO César de Paulo Sousa',          '05/06/2023', '','',  '','',  '','',  '','',  '30','2025'],
  [84, 'SD PM',      '39337', 'Marcos VINÍCIUS Ribeiro',             '05/06/2023', '','',  '','',  '','',  '30','2024','30','2025'],
  [85, 'SD PM',      '39102', 'GLEIBER Lins dos Santos',              '05/06/2023', '','',  '','',  '','',  '30','2024','30','2025'],
  [86, 'SD PM',      '39926', 'Matheus FRANCO de Almeida',            '19/09/2023', '','',  '','',  '','',  '30','2024','30','2025'],
  [87, 'SD PM',      '39821', 'Johnatan William de Oliveira RAMALHO', '19/09/2023', '','',  '','',  '30','2023','30','2024','30','2025'],
];

export const feriasPendenteDB: FeriasPendente[] = _pendentes.map(
  ([ord, posto, rg, nome, inclusao, d1, e1, d2, e2, d3, e3, d4, e4, d5, e5]) => ({
    id: `fp${ord}`,
    ord: Number(ord), posto, rg, nome, inclusao,
    exercicios: [
      { dias: d1, exercicio: e1 },
      { dias: d2, exercicio: e2 },
      { dias: d3, exercicio: e3 },
      { dias: d4, exercicio: e4 },
      { dias: d5, exercicio: e5 },
    ],
  }),
);

// ── Abr/Mai 2026 seed ────────────────────────────────────────────────────────

const _abrMai: AbrMaiRow[] = [
  // RETORNAM DE FÉRIAS DE ABRIL/2026
  ['retornam-abril', 1, '3º SGT PM', '35324', 'VICTOR Gomes do Nascimento Dionizio', 'OPERACIONAL', '30', '01/04', '30/04', '01/05 a 05/05', '06/05', 'EXERCÍCIO 2025'],
  ['retornam-abril', 2, 'CB PM',     '38380', 'Thiago SANTOS e Sa',                  'OPERACIONAL', '30', '05/04', '04/05', '06/05 a 10/05', '11/05', 'EXERC. 2022/2023'],
  ['retornam-abril', 3, 'CB PM',     '37528', 'JONATAS Martins de Oliveira',          'OPERACIONAL', '2',  '27/04', '28/04', '29/04 a 03/05', '04/05', 'EXERCÍCIO 2024'],
  ['retornam-abril', 4, 'SD PM',     '39229', 'JÚLIO César de Paulo Sousa',          'OPERACIONAL', '30', '11/04', '10/05', '11/05 a 15/05', '16/05', 'EXERCÍCIO 2024'],
  // ENTRAM DE FÉRIAS EM MAIO/2026 — SEI 202600002056915
  ['entram-maio', 1, '1º SGT PM', '31309', 'URBANO Neto Gomes Nascimento',         'OPERACIONAL', '30', '02/05', '31/05', '01/06 a 05/06', '06/06', 'EXERCÍCIO 2025'],
  ['entram-maio', 2, '2º SGT PM', '32573', 'GABRIELA Alves Landin dos Santos',     'ADM - P/3',   '30', '04/05', '02/06', '-',             '03/06', 'EXERC. 2021/2022'],
  ['entram-maio', 3, '2º SGT PM', '34980', 'Fernando ELIAS de Souza',              'OPERACIONAL', '30', '09/05', '07/06', '08/06 a 12/06', '13/06', 'EXERCÍCIO 2025'],
  ['entram-maio', 4, '3º SGT PM', '34359', 'EDSON de Souza Júnior',               'OPERACIONAL', '30', '17/05', '15/06', '-',             '16/06', 'EXERCÍCIO 2022'],
  ['entram-maio', 5, 'CB PM',     '37757', 'Lucas MOREIRA do Nascimento',          'OPERACIONAL', '30', '03/05', '01/06', '02/06 a 06/06', '07/06', 'EXERCÍCIO 2025'],
  ['entram-maio', 6, 'SD PM',     '39151', 'Hygor Correa BENJAMIM de Sousa',       'OPERACIONAL', '30', '03/05', '01/06', 'NÃO VAI TIRAR', '02/06', 'EXERCÍCIO 2025'],
  ['entram-maio', 7, 'SD PM',     '39926', 'Matheus FRANCO de Almeida',            'OPERACIONAL', '30', '13/05', '11/06', '12/06 a 16/06', '17/06', 'EXERCÍCIO 2024'],
  ['entram-maio', 8, 'SD PM',     '39821', 'Johnatan William de Oliveira RAMALHO', 'OPERACIONAL', '30', '08/05', '06/06', '07/06 a 11/06', '12/06', 'EXERCÍCIO 2023'],
  // LESP 2º TRIM/2026 (ABR/MAI/JUN)
  ['lesp', 1, '1º SGT PM', '27238', 'Sidney Rodrigues UESSUGI',  'OPERACIONAL', '91', '01/04', '30/06', '-', '01/07', ''],
  ['lesp', 2, 'CB PM',     '37597', 'Junio Ferreira Nunes',       'CPE 20',      '91', '01/04', '30/06', '-', '01/07', ''],
  ['lesp', 3, 'CB PM',     '37596', 'Júnio Albuquerque ARAÚJO',  'OPERACIONAL', '91', '01/04', '30/06', '-', '01/07', ''],
];

export const feriasAbrilMaioDB: FeriasAbrilMaio[] = _abrMai.map(
  ([secao, num, graduacao, rg, nome, funcao, dias, inicio, fim, dispCmdo, pronto, obs], i) => ({
    id: `am${i + 1}`,
    secao: secao as FeriasAbrilMaio['secao'],
    num: Number(num), graduacao, rg, nome, funcao, dias, inicio, fim, dispCmdo, pronto, observacao: obs,
  }),
);
