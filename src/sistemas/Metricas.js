// Regista o desempenho do jogador em cada nível.
// Estes números alimentam a dificuldade adaptativa do boss (DifficultyManager do relatório):
// no fim do nível 2 são convertidos num fator (0,8 a 1,5) e numa variante (Tanque ou Ágil).
export default class Metricas {
  constructor() {
    this.niveis = [];
  }

  iniciarNivel(n) {
    this.niveis[n] = {
      inimigos: 0,        // inimigos derrotados
      dano: 0,            // vida perdida
      tesouros: 0,        // baús abertos
      salasLimpas: 0,     // salas com inimigos que foram limpas
      tempoCombate: 0,    // segundos gastos a limpar salas
      inicio: Date.now(),
    };
    this.atual = this.niveis[n];
  }

  inimigoDerrotado() { this.atual.inimigos++; }
  danoSofrido(n) { this.atual.dano += n; }
  tesouro() { this.atual.tesouros++; }
  salaLimpa(segundos) {
    this.atual.salasLimpas++;
    this.atual.tempoCombate += segundos;
  }

  // Soma os níveis jogados.
  total() {
    const t = { inimigos: 0, dano: 0, tesouros: 0, salasLimpas: 0, tempoCombate: 0 };
    for (const n of this.niveis) for (const k of Object.keys(t)) t[k] += n[k];
    return t;
  }

  // Converte as métricas em estilo de jogo, variante e fator do boss.
  avaliar(vidaRestante, vidaMax) {
    const t = this.total();
    const tempoPorSala = t.salasLimpas > 0 ? t.tempoCombate / t.salasLimpas : 30;

    // Agressivo: limpa salas depressa. Cauteloso: demora mais, apanha tesouros, leva pouco dano.
    // A variante é a chave usada em BOSS (config.js): 'tanque' ou 'agil'.
    const agressivo = tempoPorSala < 12;
    const variante = agressivo ? 'tanque' : 'agil';

    // Fator: começa em 1 e sobe quando o jogador está a jogar bem.
    let fator = 1;
    fator += (vidaRestante / vidaMax - 0.5) * 0.4;        // muita vida -> boss mais forte
    fator += Math.min(t.inimigos, 30) / 30 * 0.2;         // muitos inimigos derrotados
    fator -= Math.min(t.dano, 10) / 10 * 0.2;             // muito dano sofrido -> boss mais fraco
    fator += (12 - Math.min(tempoPorSala, 24)) / 12 * 0.1;
    fator = Math.min(1.5, Math.max(0.8, fator));          // limite 0,8 a 1,5 (ver relatório)

    return { estilo: agressivo ? 'agressivo' : 'cauteloso', variante, fator: Math.round(fator * 100) / 100, tempoPorSala };
  }
}
