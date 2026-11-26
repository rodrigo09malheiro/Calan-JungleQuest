// Constantes partilhadas por todo o jogo.
// Todas as medidas de mundo estão em PÍXEIS DO DESENHO (arte);
// a câmara faz o zoom (SCALE) para o ecrã, por isso os números do código não mudam com a escala.

export const TILE = 16;            // tamanho de um tile, em píxeis de arte
export const SCALE = 3;            // zoom único para Calan, inimigos e boss (inteiro, para a pixel art ficar nítida)
export const SALA_LARGURA = 20;    // tiles na horizontal
export const SALA_ALTURA = 13;     // tiles na vertical

export const HUD_ALTURA = 72;      // faixa do HUD no topo do ecrã (píxeis do ecrã)
export const ECRA_LARGURA = 960;   // tamanho da janela do jogo (píxeis do ecrã)
export const ECRA_ALTURA = SALA_ALTURA * TILE * SCALE + HUD_ALTURA;   // 624 da sala + HUD = 696

export const VEL_CALAN = 70;       // píxeis de arte por segundo
export const FRAME_CALAN = 34;     // cada célula da folha do Calan tem 34x34
export const VIDA_CALAN = 6;       // vida máxima (corações)

// Portas: tiles da parede que abrem quando existe uma sala vizinha nesse lado.
export const PORTAS = {
  cima:  [[9, 0], [10, 0]],
  baixo: [[9, SALA_ALTURA - 1], [10, SALA_ALTURA - 1]],
  esq:   [[0, 6]],
  dir:   [[SALA_LARGURA - 1, 6]],
};

// Direção oposta (entrar pela porta de cima da sala nova = sair pela de baixo da antiga).
export const OPOSTA = { cima: 'baixo', baixo: 'cima', esq: 'dir', dir: 'esq' };

// Deslocamento na grelha do mapa para cada direção.
export const PASSO = { cima: [0, -1], baixo: [0, 1], esq: [-1, 0], dir: [1, 0] };

// Inimigos: pontos dados ao derrotar e "custo" no orçamento de dificuldade.
export const INIMIGOS = {
  slime: { vida: 2, pontos: 100, custo: 2 },
  olho:  { vida: 3, pontos: 150, custo: 3 },
};

// Definição dos níveis. Cada nível muda o tamanho do mapa, o orçamento, os inimigos e o cenário.
export const NIVEIS = [
  {
    nome: 'Selva em ruínas',
    salas: 6,                       // número de salas geradas
    orcamentoBase: 2,               // pontos de dificuldade de uma sala perto da entrada
    orcamentoPorDistancia: 1,       // pontos extra por cada sala de distância à entrada
    // Catálogo de inimigos deste nível: o peso decide quais saem mais vezes.
    catalogo: [{ tipo: 'slime', peso: 4 }, { tipo: 'olho', peso: 1 }],
    obstaculos: [3, 6],             // mínimo e máximo de pedras por sala
    velocidade: 1,                  // multiplicador da velocidade dos inimigos
    // Cenário: frames de assets/cenario/tiles.png (ver TILES abaixo).
    cenario: { chao: 'relva', muro: 'muro_terra', base: 'base_terra', rochas: [48, 49], plantas: 0.07 },
  },
  {
    nome: 'Cavernas e criptas',
    salas: 8,
    orcamentoBase: 4,
    orcamentoPorDistancia: 1,
    catalogo: [{ tipo: 'slime', peso: 2 }, { tipo: 'olho', peso: 2 }],
    obstaculos: [4, 8],
    velocidade: 1.2,
    cenario: { chao: 'tijolo', muro: 'muro_pedra', base: 'base_pedra', rochas: [50, 51], plantas: 0.02 },
  },
];

export const MAX_INIMIGOS_SALA = 6;

// Tileset do cenário (assets/cenario/tiles.png, montado por ferramentas/montar_tileset.py
// a partir do pack Pixel Crawler). Cada linha da folha tem 8 tiles de 16x16.
// Para cada tipo: o primeiro frame e quantas variações há.
export const TILES = {
  relva:      { inicio: 0, n: 8 },
  tijolo:     { inicio: 8, n: 8 },
  muro_terra: { inicio: 16, n: 8 },
  base_terra: { inicio: 24, n: 8 },   // parede vista de frente, com relva na base
  muro_pedra: { inicio: 32, n: 8 },
  base_pedra: { inicio: 40, n: 8 },
  porta:      { inicio: 56, n: 1 },
  planta:     { inicio: 64, n: 8 },
};
