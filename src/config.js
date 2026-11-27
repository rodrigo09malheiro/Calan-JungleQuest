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
// Folha do Calan (assets/calan.png, montada por ferramentas/montar_calan.py a partir
// do calan_vfinal3.piskel): grelha 4x5 de células 48x48. Em todos os frames os pés estão
// na linha 35 e o corpo centrado; os golpes já trazem o arco desenhado.
export const FRAME_CALAN = 48;     // largura de uma célula
export const ALTURA_CALAN = 48;    // altura de uma célula
export const PES_CALAN = 35;       // linha dos pés dentro da célula (origem do sprite)
export const CENTRO_CALAN = 12;    // meio do corpo do Calan, em píxeis acima dos pés (o corpo tem ~24 px)
export const VIDA_CALAN = 6;       // vida máxima (corações)

// Armas do Calan. Começa só com as mãos; a espada está no baú do nível 1 (opcional).
// Definem a zona de dano do golpe (o desenho do golpe vem nos frames do Calan):
//  dano: vida que tira por golpe     alcance: distância do centro da zona de dano ao meio do Calan
//  tamanho: lado da zona de dano (quadrado)
export const ARMAS = {
  maos:   { nome: 'mãos',   dano: 1, alcance: 8,  tamanho: 14 },
  espada: { nome: 'espada', dano: 2, alcance: 15, tamanho: 24 },
};

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
    vidaInimigos: 1,                // multiplicador da vida dos inimigos
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
    vidaInimigos: 1.5,              // slime 2 -> 3, olho 3 -> 5 (arredonda para cima)
    cenario: { chao: 'tijolo', muro: 'muro_pedra', base: 'base_pedra', rochas: [50, 51], plantas: 0.02 },
  },
];

export const MAX_INIMIGOS_SALA = 6;

// Baús extra: cada beco sem saída (sala com uma só porta) que não seja a sala do tesouro
// tem esta probabilidade de esconder um baú. O conteúdo é escolhido com pesos (seed).
export const BAUS_EXTRA = {
  chance: 0.5,
  conteudos: {
    moedas: { peso: 3, pontos: 200, icone: 0 },   // icone = frame de assets/cenario/itens.png
    pocao:  { peso: 1, vida: 1, icone: 1 },
  },
};
export const ICONE_MOEDA = 0;      // ícone mostrado pelo baú da sala do tesouro (pontos)

// Corações deixados pelos inimigos derrotados.
//  chanceSemEspada / chanceComEspada: probabilidade de cada inimigo deixar um coração
//    (com a semente da partida). Com a espada o Calan é mais forte, por isso recebe menos ajuda.
//  duracao: ms que o coração fica no chão (pisca nos últimos 2 s)
//  pontosSeCheio: pontos que dá se o Calan já tiver a vida cheia
export const CORACAO = {
  chanceSemEspada: 0.12,
  chanceComEspada: 0.08,
  duracao: 8000,
  pontosSeCheio: 50,
};

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

// ---------- Boss (vista lateral) ----------

// Frames de assets/cenario/cripta.png (montada por ferramentas/montar_tileset.py).
export const TILES_CRIPTA = {
  fundo: [0, 1, 2, 3, 4, 5],        // tijolo da parede de fundo
  teto: [6, 7, 8],
  coluna: [9, 10],                  // paredes laterais
  chao: [11, 12, 13],               // topo do chão
  plataforma: { esq: 14, dir: 15, meio: [16, 17, 18] },
  janela: [19, 20, 21, 24, 25, 26], // 3x2
  estandarte: [32, 33, 34, 35, 36, 37, 38, 39],  // 2x4
  porta: [40, 41, 42, 43, 44, 45],  // 2x3
};

// Física da vista lateral (só ativa na BossScene).
export const GRAVIDADE = 900;       // píxeis de arte por segundo ao quadrado
export const SALTO_CALAN = 360;     // velocidade inicial do salto: sobe ~72 px (4,5 tiles)
export const CHAO_Y = 11;           // linha de tiles onde começa o chão da arena

// Variantes do guardião. A métrica do jogador escolhe a variante (Metricas.avaliar)
// e o fator (0,8 a 1,5) multiplica a vida e a velocidade e encurta as pausas.
export const BOSS = {
  tanque: {
    nome: 'TANQUE',
    vida: 14,                       // golpes para o derrotar (antes do fator)
    pausa: 1700,                    // ms entre ataques (dividido pelo fator)
    velTiro: 90,                    // velocidade dos feitiços (multiplicada pelo fator)
    feiticos: 2,                    // feitiços por ataque com o guardião calmo
    feiticosFuria: 3,               // feitiços por ataque na fúria
    // Pesos dos ataques: o Tanque prefere esmagar com as mãos.
    ataques: [{ nome: 'esmagar', peso: 3 }, { nome: 'disparar', peso: 1 }, { nome: 'descer', peso: 1 }],
    // Arena: plataformas mais altas e mais afastadas, para fugir das mãos.
    arena: { quantas: [2, 3], linhas: [4, 7], larguras: [3, 4], separacao: 3 },
  },
  agil: {
    nome: 'ÁGIL',
    vida: 10,
    pausa: 1100,
    velTiro: 125,
    feiticos: 2,
    feiticosFuria: 3,
    // O Ágil prefere lançar rajadas de feitiços.
    ataques: [{ nome: 'esmagar', peso: 1 }, { nome: 'disparar', peso: 3 }, { nome: 'descer', peso: 1 }],
    // Arena: plataformas mais baixas e mais próximas, para fugir dos feitiços.
    arena: { quantas: [3, 3], linhas: [6, 8], larguras: [4, 5], separacao: 1 },
  },
};
