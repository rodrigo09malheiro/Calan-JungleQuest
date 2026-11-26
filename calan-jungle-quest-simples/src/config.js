// Constantes partilhadas por todo o jogo.
// Todas as medidas de mundo estão em PÍXEIS DO DESENHO (arte);
// a câmara faz o zoom (SCALE) para o ecrã, por isso os números do código não mudam com a escala.

export const TILE = 16;            // tamanho de um tile, em píxeis de arte
export const SCALE = 3;            // zoom único para Calan, inimigos e boss (inteiro, para a pixel art ficar nítida)
export const SALA_LARGURA = 20;    // tiles na horizontal
export const SALA_ALTURA = 13;     // tiles na vertical

export const ECRA_LARGURA = 960;   // tamanho da janela do jogo (píxeis do ecrã)
export const ECRA_ALTURA = 640;

export const VEL_CALAN = 70;       // píxeis de arte por segundo
export const FRAME_CALAN = 34;     // cada célula da folha do Calan tem 34x34
