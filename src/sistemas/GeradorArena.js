import { SALA_LARGURA, CHAO_Y } from '../config.js';

// Alcance do salto do Calan, em tiles (com SALTO_CALAN = 360 e GRAVIDADE = 900
// ele sobe ~4,5 tiles e avança ~4 tiles no ar; usamos margens de segurança).
const SUBIDA_MAX = 4;       // diferença de altura máxima entre duas superfícies
const DISTANCIA_MAX = 3;    // buraco horizontal máximo entre duas superfícies

// Plataformas fixas usadas se a geração falhar muitas vezes (nunca deve acontecer).
const RESERVA = [{ tx: 4, ty: 8, largura: 5 }, { tx: 9, ty: 5, largura: 5 }];

// GERAÇÃO PROCEDIMENTAL da arena do boss.
// Escolhe as plataformas ao acaso (com a semente da partida), dentro das regras da
// variante (BOSS.<variante>.arena em config.js), e VERIFICA que todas se alcançam
// a saltar a partir do chão: o mesmo princípio do BFS que valida o mapa das salas.
export default class GeradorArena {
  constructor(rng, regras) {
    this.rng = rng;
    this.regras = regras;   // { quantas: [min, max], linhas: [min, max], larguras: [min, max], separacao }
  }

  gerar() {
    for (let tentativa = 1; tentativa <= 100; tentativa++) {
      const plataformas = this.sortear();
      if (plataformas && this.todasAlcancaveis(plataformas)) return { plataformas, tentativa };
    }
    return { plataformas: RESERVA, tentativa: 0 };
  }

  // Sorteia as plataformas uma a uma; devolve null se não conseguir pôr todas.
  sortear() {
    const r = this.regras;
    const quantas = this.rng.inteiro(...r.quantas);
    const lista = [];
    let falhas = 0;
    while (lista.length < quantas) {
      if (falhas++ > 60) return null;
      const largura = this.rng.inteiro(...r.larguras);
      const p = {
        largura,
        tx: this.rng.inteiro(2, SALA_LARGURA - 2 - largura),
        ty: this.rng.inteiro(...r.linhas),
      };
      if (this.cabe(p, lista)) lista.push(p);
    }
    return lista;
  }

  // Regras de posição de uma plataforma nova em relação às que já existem.
  cabe(p, lista) {
    // Não tapar a porta de entrada nem o sítio onde o Calan aparece (canto inferior esquerdo).
    if (p.tx < 5 && p.ty >= 8) return false;
    for (const o of lista) {
      const buraco = this.buraco(p, o);
      const dy = Math.abs(p.ty - o.ty);
      // Uma por cima da outra: precisa de espaço para o Calan caber e saltar entre elas.
      if (buraco <= 0 && dy < 3) return false;
      // Lado a lado (quase à mesma altura): distância mínima da variante.
      if (dy < 3 && buraco < this.regras.separacao) return false;
    }
    return true;
  }

  // Buraco horizontal, em tiles, entre duas plataformas (negativo ou 0 se se sobrepõem).
  buraco(a, b) {
    return Math.max(b.tx - (a.tx + a.largura), a.tx - (b.tx + b.largura));
  }

  // VERIFICAÇÃO: pesquisa em largura (BFS) a partir do chão.
  // De uma superfície consegue-se saltar para outra se ela estiver no máximo
  // SUBIDA_MAX tiles mais acima e DISTANCIA_MAX tiles de lado.
  // O chão ocupa a arena toda, por isso descer para ele é sempre possível.
  todasAlcancaveis(plataformas) {
    const chao = { tx: 0, ty: CHAO_Y, largura: SALA_LARGURA };
    const alcancadas = new Set();
    const fila = [chao];
    while (fila.length > 0) {
      const atual = fila.shift();
      plataformas.forEach((p, i) => {
        if (alcancadas.has(i)) return;
        const subida = atual.ty - p.ty;
        const lado = atual === chao ? 0 : this.buraco(atual, p);
        if (subida <= SUBIDA_MAX && lado <= DISTANCIA_MAX) {
          alcancadas.add(i);
          fila.push(p);
        }
      });
    }
    return alcancadas.size === plataformas.length;
  }
}
