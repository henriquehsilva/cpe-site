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

const _entradaSaida: ReadonlyArray<readonly [
  string,
  number,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string
]> = [
  ['retornam-abril', 1, '3º SGT PM', '35324', 'VICTOR Gomes do Nascimento Dionizio', 'OPERACIONAL', '30', '01/04', '30/04', '01/05 a 05/05', '06/05', 'EXERCÍCIO 2025'],
  ['retornam-abril', 2, 'CB PM', '38380', 'Thiago SANTOS e Sa', 'OPERACIONAL', '30', '05/04', '04/05', '06/05 a 10/05', '11/05', 'EXERC. 2022/2023'],
  ['retornam-abril', 3, 'CB PM', '37528', 'JONATAS Martins de Oliveira', 'OPERACIONAL', '2', '27/04', '28/04', '29/04 a 03/05', '04/05', 'EXERCÍCIO 2024'],
  ['retornam-abril', 4, 'SD PM', '39229', 'JÚLIO César de Paulo Sousa', 'OPERACIONAL', '30', '11/04', '10/05', '11/05 a 15/05', '16/05', 'EXERCÍCIO 2024'],
  ['entram-maio', 1, '1º SGT PM', '31309', 'URBANO Neto Gomes Nascimento', 'OPERACIONAL', '30', '02/05', '31/05', '01/06 a 05/06', '06/06', 'EXERCÍCIO 2025'],
  ['entram-maio', 2, '2º SGT PM', '32573', 'GABRIELA Alves Landin dos Santos', 'ADM - P/3', '30', '04/05', '02/06', '-', '03/06', 'EXERC. 2021/2022'],
  ['entram-maio', 3, '2º SGT PM', '34980', 'Fernando ELIAS de Souza', 'OPERACIONAL', '30', '09/05', '07/06', '08/06 a 12/06', '13/06', 'EXERCÍCIO 2025'],
  ['entram-maio', 4, '3º SGT PM', '34359', 'EDSON de Souza Júnior', 'OPERACIONAL', '30', '17/05', '15/06', '-', '16/06', 'EXERCÍCIO 2022'],
  ['entram-maio', 5, 'CB PM', '37757', 'Lucas MOREIRA do Nascimento', 'OPERACIONAL', '30', '03/05', '01/06', '02/06 a 06/06', '07/06', 'EXERCÍCIO 2025'],
  ['entram-maio', 6, 'SD PM', '39151', 'Hygor Correa BENJAMIM de Sousa', 'OPERACIONAL', '30', '03/05', '01/06', 'NÃO VAI TIRAR', '02/06', 'EXERCÍCIO 2025'],
  ['entram-maio', 7, 'SD PM', '39926', 'Matheus FRANCO de Almeida', 'OPERACIONAL', '30', '13/05', '11/06', '12/06 a 16/06', '17/06', 'EXERCÍCIO 2024'],
  ['entram-maio', 8, 'SD PM', '39821', 'Johnatan William de Oliveira RAMALHO', 'OPERACIONAL', '30', '08/05', '06/06', '07/06 a 11/06', '12/06', 'EXERCÍCIO 2023'],
  ['lesp', 1, '1º SGT PM', '27238', 'Sidney Rodrigues UESSUGI', 'OPERACIONAL', '91', '01/04', '30/06', '-', '01/07', ''],
  ['lesp', 2, 'CB PM', '37597', 'Junio Ferreira Nunes', 'CPE 20', '91', '01/04', '30/06', '-', '01/07', ''],
  ['lesp', 3, 'CB PM', '37596', 'Júnio Albuquerque ARAÚJO', 'OPERACIONAL', '91', '01/04', '30/06', '-', '01/07', ''],
];

export const entradaSaidaFeriasDB: EntradaSaidaFerias[] = _entradaSaida.map(
  ([secao, num, graduacao, rg, nome, funcao, dias, inicio, fim, dispCmdo, pronto, obs], i) => ({
    id: `esf${i + 1}`,
    secao,
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
    observacao: obs,
  }),
);
