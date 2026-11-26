// Gerador de números aleatórios com SEMENTE (seed).
// Com a mesma semente, a sequência de números é sempre igual: o mesmo mapa,
// os mesmos obstáculos e os mesmos inimigos. Isto é a "aleatoriedade controlada"
// e permite repetir uma partida (ex.: index.html?seed=1234) para testar ou demonstrar.
//
// Algoritmo: mulberry32 (gerador pequeno de 32 bits, suficiente para jogos).
export default class Aleatorio {
  constructor(semente) {
    this.semente = semente >>> 0;   // força inteiro sem sinal de 32 bits
    this.estado = this.semente;
  }

  // Número real entre 0 (inclusive) e 1 (exclusive).
  real() {
    this.estado = (this.estado + 0x6d2b79f5) >>> 0;
    let t = this.estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // Inteiro entre min e max (ambos incluídos).
  inteiro(min, max) {
    return min + Math.floor(this.real() * (max - min + 1));
  }

  // true com a probabilidade p (0 a 1).
  chance(p) {
    return this.real() < p;
  }

  // Um elemento ao acaso de uma lista.
  escolher(lista) {
    return lista[Math.floor(this.real() * lista.length)];
  }

  // Escolha com pesos: lista de { peso, ... }. Elementos com mais peso saem mais vezes.
  escolherComPeso(lista) {
    const total = lista.reduce((soma, e) => soma + e.peso, 0);
    let r = this.real() * total;
    for (const e of lista) {
      r -= e.peso;
      if (r < 0) return e;
    }
    return lista[lista.length - 1];
  }

  // Baralha uma cópia da lista (Fisher-Yates).
  baralhar(lista) {
    const copia = lista.slice();
    for (let i = copia.length - 1; i > 0; i--) {
      const j = Math.floor(this.real() * (i + 1));
      [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
  }
}
