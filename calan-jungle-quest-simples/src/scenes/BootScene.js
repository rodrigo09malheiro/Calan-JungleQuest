import { FRAME_CALAN } from '../config.js';

// Carrega todos os assets e cria as animações. Depois passa para o Menu.
export default class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    // Folha do Calan: grelha 4x4 de células 34x34 (frames 0 a 15, linha a linha).
    this.load.spritesheet('calan', 'assets/calan.png', { frameWidth: FRAME_CALAN, frameHeight: FRAME_CALAN });
    // Os restantes ficam carregados para os próximos passos.
    this.load.spritesheet('efeitos_calan', 'assets/efeitos_calan.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('slime', 'assets/slime.png', { frameWidth: 30, frameHeight: 24 });
    this.load.spritesheet('olho', 'assets/olho_chamas.png', { frameWidth: 34, frameHeight: 34 });
    this.load.spritesheet('boss', 'assets/boss.png', { frameWidth: 64, frameHeight: 64 });
  }

  create() {
    this.criarAnimacoesCalan();
    this.scene.start('Menu');
  }

  criarAnimacoesCalan() {
    // Mapa dos frames (começam em 0):
    //   parado: 0 frente, 1 lado, 2 costas
    //   andar 1: 3, 4, 5      andar 2: 6, 7, 8
    // O ciclo de andar usa o "parado" como frame de passagem: andar1, parado, andar2, parado.
    const anda = (chave, a, p, b) =>
      this.anims.create({
        key: chave,
        frames: [a, p, b, p].map((frame) => ({ key: 'calan', frame })),
        frameRate: 8,
        repeat: -1,
      });
    anda('calan-andar-baixo', 3, 0, 6);
    anda('calan-andar-lado', 4, 1, 7);
    anda('calan-andar-cima', 5, 2, 8);
  }
}
