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

// Definição dos níveis. Cada nível muda o tamanho do mapa, o orçamento, os inimigos e as cores.
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
    cores: { chao: [0x2e4d36, 0x335a3d], parede: 0x3b4a5a, borda: 0x222c36, pedra: 0x6b6f5a, pedraBorda: 0x3f4234 },
  },
  {
    nome: 'Cavernas e criptas',
    salas: 8,
    orcamentoBase: 4,
    orcamentoPorDistancia: 1,
    catalogo: [{ tipo: 'slime', peso: 2 }, { tipo: 'olho', peso: 2 }],
    obstaculos: [4, 8],
    velocidade: 1.2,
    cores: { chao: [0x2f2a3a, 0x352f42], parede: 0x4a3f5c, borda: 0x231d2e, pedra: 0x5c5470, pedraBorda: 0x2c2638 },
  },
];

export const MAX_INIMIGOS_SALA = 6;
