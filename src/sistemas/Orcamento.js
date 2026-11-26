import { INIMIGOS, MAX_INIMIGOS_SALA } from '../config.js';

// CONCEITO TÉCNICO: desafios por "orçamento de dificuldade".
// Cada sala recebe pontos de dificuldade. Esses pontos são "gastos" em inimigos:
// cada tipo tem um custo (config.js). A escolha do tipo é aleatória (com pesos e semente),
// mas o total nunca passa do orçamento, por isso a dificuldade é controlada.
export default class Orcamento {
  // Quantos pontos recebe uma sala.
  static calcular(nivelCfg, sala) {
    if (sala.tipo === 'inicio') return 0;               // a sala de entrada é segura
    let pontos = nivelCfg.orcamentoBase + sala.distancia * nivelCfg.orcamentoPorDistancia;
    if (sala.tipo === 'saida') pontos = Math.round(pontos * 1.5);   // sala final mais difícil
    if (sala.tipo === 'tesouro') pontos = Math.round(pontos * 0.5); // sala do tesouro mais calma
    return pontos;
  }

  // Gasta o orçamento e devolve a lista de tipos de inimigo, ex.: ['slime', 'olho', 'slime'].
  static gastar(pontos, catalogo, rng) {
    const escolhidos = [];
    let resto = pontos;

    while (escolhidos.length < MAX_INIMIGOS_SALA) {
      // Só entram na escolha os tipos que ainda cabem no orçamento.
      const possiveis = catalogo.filter((e) => INIMIGOS[e.tipo].custo <= resto);
      if (possiveis.length === 0) break;
      const tipo = rng.escolherComPeso(possiveis).tipo;
      escolhidos.push(tipo);
      resto -= INIMIGOS[tipo].custo;
    }
    return escolhidos;
  }
}
