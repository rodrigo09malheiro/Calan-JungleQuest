import { SALA_LARGURA, SALA_ALTURA, PORTAS, OPOSTA, PASSO, BAUS_EXTRA } from '../config.js';
import Orcamento from './Orcamento.js';

// CONCEITO TÉCNICO: geração procedimental do layout das salas.
//
// 1) MAPA: as salas são colocadas numa grelha por "crescimento aleatório":
//    começa-se numa sala e, de cada vez, escolhe-se uma sala já existente e uma direção
//    livre e cria-se lá uma sala nova, ligada à anterior. Assim o mapa é sempre conexo.
//    Depois juntam-se algumas ligações extra entre salas vizinhas para haver ciclos.
// 2) VERIFICAÇÃO: uma pesquisa em largura (BFS) a partir da entrada confirma que todas
//    as salas são alcançáveis e dá a distância de cada sala à entrada.
//    A saída é a sala MAIS LONGE da entrada; o tesouro vai para um beco sem saída
//    e os outros becos podem ter um baú extra (com uma probabilidade e a semente).
// 3) SALAS: cada sala recebe pedras ao acaso; um "flood fill" confirma que todas as
//    portas e todo o chão continuam ligados (senão tenta outra vez).
// 4) DESAFIOS: o orçamento de dificuldade de cada sala é gasto em inimigos (Orcamento.js).
export default class GeradorNivel {
  constructor(rng, nivelCfg) {
    this.rng = rng;
    this.cfg = nivelCfg;
  }

  gerar() {
    // Repete até o mapa passar a verificação (na prática passa sempre à primeira,
    // mas a verificação garante que nunca se entrega um mapa impossível).
    for (let tentativa = 0; tentativa < 50; tentativa++) {
      const salas = this.gerarMapa();
      if (this.verificarCaminho(salas)) {
        this.escolherTipos(salas);
        for (const sala of salas) this.preencherSala(sala);
        return { salas, inicio: 0 };
      }
    }
    throw new Error('Não foi possível gerar um nível válido');
  }

  // ---------- 1) Mapa ----------
  gerarMapa() {
    const salas = [];
    const porPosicao = new Map();   // "gx,gy" -> sala
    const chave = (gx, gy) => `${gx},${gy}`;

    const criar = (gx, gy) => {
      const sala = {
        id: salas.length, gx, gy,
        vizinhos: { cima: null, baixo: null, esq: null, dir: null },
        tipo: 'normal', distancia: 0, bauExtra: null,   // bauExtra: 'moedas', 'pocao' ou null
        visitada: false, limpa: false, tesouroApanhado: false,
      };
      salas.push(sala);
      porPosicao.set(chave(gx, gy), sala);
      return sala;
    };
    const ligar = (a, dir, b) => {
      a.vizinhos[dir] = b.id;
      b.vizinhos[OPOSTA[dir]] = a.id;
    };

    criar(0, 0);
    const direcoes = Object.keys(PASSO);

    let guarda = 0;
    while (salas.length < this.cfg.salas && guarda++ < 1000) {
      const base = this.rng.escolher(salas);
      const dir = this.rng.escolher(direcoes);
      const [dx, dy] = PASSO[dir];
      const nx = base.gx + dx, ny = base.gy + dy;
      if (porPosicao.has(chave(nx, ny))) continue;          // já há sala aí
      // Evita mapas em "linha reta": uma sala nova com 2+ vizinhos é rejeitada às vezes.
      const vizinhasOcupadas = direcoes.filter((d) =>
        porPosicao.has(chave(nx + PASSO[d][0], ny + PASSO[d][1]))).length;
      if (vizinhasOcupadas > 1 && this.rng.chance(0.6)) continue;
      ligar(base, dir, criar(nx, ny));
    }

    // Ligações extra (ciclos): portas entre salas vizinhas que ainda não estão ligadas.
    for (const sala of salas) {
      for (const dir of direcoes) {
        const [dx, dy] = PASSO[dir];
        const outra = porPosicao.get(chave(sala.gx + dx, sala.gy + dy));
        if (outra && sala.vizinhos[dir] === null && this.rng.chance(0.25)) ligar(sala, dir, outra);
      }
    }
    return salas;
  }

  // ---------- 2) Verificação (BFS) ----------
  // Devolve true se todas as salas são alcançáveis a partir da entrada (sala 0).
  // Também guarda em cada sala a distância (número de portas) até à entrada.
  verificarCaminho(salas) {
    const visto = new Set([0]);
    const fila = [0];
    salas[0].distancia = 0;
    while (fila.length > 0) {
      const atual = salas[fila.shift()];
      for (const id of Object.values(atual.vizinhos)) {
        if (id === null || visto.has(id)) continue;
        visto.add(id);
        salas[id].distancia = atual.distancia + 1;
        fila.push(id);
      }
    }
    return visto.size === salas.length;
  }

  escolherTipos(salas) {
    salas[0].tipo = 'inicio';
    // Saída: a sala mais distante da entrada (o caminho mais longo possível).
    const maxDist = Math.max(...salas.map((s) => s.distancia));
    const saida = this.rng.escolher(salas.filter((s) => s.distancia === maxDist));
    saida.tipo = 'saida';
    // Tesouro: de preferência um beco sem saída (sala com uma só porta).
    const portas = (s) => Object.values(s.vizinhos).filter((v) => v !== null).length;
    const livres = salas.filter((s) => s.tipo === 'normal');
    const becos = livres.filter((s) => portas(s) === 1);
    const tesouro = becos.length > 0 ? this.rng.escolher(becos) : this.rng.escolher(livres);
    if (tesouro) tesouro.tipo = 'tesouro';

    // Baús extra: os outros becos sem saída podem esconder um baú (recompensa por explorar).
    const conteudos = Object.entries(BAUS_EXTRA.conteudos).map(([tipo, c]) => ({ tipo, peso: c.peso }));
    for (const s of becos) {
      if (s.tipo === 'normal' && this.rng.chance(BAUS_EXTRA.chance)) {
        s.bauExtra = this.rng.escolherComPeso(conteudos).tipo;
      }
    }
  }

  // ---------- 3) Conteúdo de cada sala ----------
  preencherSala(sala) {
    // Tiles reservados: corredores à frente das portas e o centro (entrada, escada, baú).
    const reservado = (tx, ty) =>
      (tx >= 8 && tx <= 11 && (ty <= 2 || ty >= SALA_ALTURA - 3)) ||   // portas de cima/baixo
      (ty >= 5 && ty <= 7 && (tx <= 2 || tx >= SALA_LARGURA - 3)) ||   // portas laterais
      (tx >= 8 && tx <= 11 && ty >= 5 && ty <= 7);                     // centro

    let grelha = null;
    for (let tentativa = 0; tentativa < 30 && !grelha; tentativa++) {
      const g = this.grelhaVazia(sala);
      const n = sala.tipo === 'inicio' ? 2 : this.rng.inteiro(...this.cfg.obstaculos);
      for (let i = 0; i < n; i++) {
        const [w, h] = this.rng.escolher([[1, 1], [2, 1], [1, 2], [2, 2], [3, 1]]);
        const tx = this.rng.inteiro(2, SALA_LARGURA - 3 - w);
        const ty = this.rng.inteiro(2, SALA_ALTURA - 3 - h);
        let ok = true;
        for (let y = ty; y < ty + h; y++) for (let x = tx; x < tx + w; x++) if (reservado(x, y)) ok = false;
        if (!ok) continue;
        for (let y = ty; y < ty + h; y++) for (let x = tx; x < tx + w; x++) g[y][x] = 2;   // 2 = pedra
      }
      if (this.salaLigada(g)) grelha = g;
    }
    sala.grelha = grelha || this.grelhaVazia(sala);   // se tudo falhar, sala sem pedras

    // Tiles onde podem aparecer inimigos: chão, longe das portas e do centro.
    const livres = [];
    for (let ty = 1; ty < SALA_ALTURA - 1; ty++) {
      for (let tx = 1; tx < SALA_LARGURA - 1; tx++) {
        if (sala.grelha[ty][tx] !== 0) continue;
        const pertoPorta = Object.values(PORTAS).flat().some(([px, py]) => Math.abs(px - tx) + Math.abs(py - ty) < 5);
        const pertoCentro = Math.abs(tx - 10) + Math.abs(ty - 6) < 3;
        if (!pertoPorta && !pertoCentro) livres.push([tx, ty]);
      }
    }
    const posicoes = this.rng.baralhar(livres);

    // ---------- 4) Inimigos pelo orçamento ----------
    sala.orcamento = Orcamento.calcular(this.cfg, sala);
    const tipos = Orcamento.gastar(sala.orcamento, this.cfg.catalogo, this.rng);
    sala.inimigos = tipos.map((tipo, i) => ({ tipo, tx: posicoes[i][0], ty: posicoes[i][1] }));
    if (sala.inimigos.length === 0) sala.limpa = true;   // sala sem inimigos já começa aberta
  }

  // Grelha da sala: 1 = parede, 0 = chão; abre as portas onde há vizinhos.
  grelhaVazia(sala) {
    const g = [];
    for (let ty = 0; ty < SALA_ALTURA; ty++) {
      g.push([]);
      for (let tx = 0; tx < SALA_LARGURA; tx++) {
        const borda = tx === 0 || ty === 0 || tx === SALA_LARGURA - 1 || ty === SALA_ALTURA - 1;
        g[ty].push(borda ? 1 : 0);
      }
    }
    for (const [dir, tiles] of Object.entries(PORTAS)) {
      if (sala.vizinhos[dir] !== null) for (const [tx, ty] of tiles) g[ty][tx] = 0;
    }
    return g;
  }

  // Flood fill: a partir do centro, conta o chão alcançável.
  // A sala é válida se TODO o chão (incluindo as portas) for alcançável.
  salaLigada(g) {
    let totalChao = 0;
    for (const linha of g) for (const t of linha) if (t === 0) totalChao++;
    const visto = new Set();
    const pilha = [[10, 6]];
    while (pilha.length > 0) {
      const [x, y] = pilha.pop();
      const k = y * SALA_LARGURA + x;
      if (x < 0 || y < 0 || x >= SALA_LARGURA || y >= SALA_ALTURA) continue;
      if (visto.has(k) || g[y][x] !== 0) continue;
      visto.add(k);
      pilha.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
    return visto.size === totalChao;
  }
}
