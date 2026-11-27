import { FRAME_CALAN } from '../config.js';
import { LISTA_SONS } from '../sistemas/Sons.js';

// Carrega todos os assets e cria as animações. Depois passa para o Menu.
export default class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    // Folha do Calan: grelha 4x4 de células 34x34 (frames 0 a 15, linha a linha).
    this.load.spritesheet('calan', 'assets/calan.png', { frameWidth: FRAME_CALAN, frameHeight: FRAME_CALAN });
    // Efeitos: 0 espada, 1 arco pequeno, 2 e 3 arcos do golpe.
    this.load.spritesheet('efeitos_calan', 'assets/efeitos_calan.png', { frameWidth: 32, frameHeight: 32 });
    // Slime: 0 redondo, 1 achatado, 2 muito achatado, 3 esticado (salto).
    this.load.spritesheet('slime', 'assets/slime.png', { frameWidth: 30, frameHeight: 24 });
    // Olho: 0 e 1 a flutuar, 2 a carregar o tiro, 3 atordoado.
    this.load.spritesheet('olho', 'assets/olho_chamas.png', { frameWidth: 34, frameHeight: 34 });
    // Cenário: tileset montado a partir do pack Pixel Crawler (ver CREDITS.md).
    this.load.spritesheet('tiles', 'assets/cenario/tiles.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('cripta', 'assets/cenario/cripta.png', { frameWidth: 16, frameHeight: 16 });
    // Boss: 0 cara normal, 1 cara ferida, 2 cara de ataque; 3 mão, 4 mão a cair, 5 mão a lançar;
    // 6 feitiço, 7 feitiço forte; 8-10 impacto do feitiço (ver FRAMES_BOSS em Boss.js).
    this.load.spritesheet('boss', 'assets/boss.png', { frameWidth: 64, frameHeight: 64 });

    for (const nome of LISTA_SONS) this.load.audio(nome, `assets/sons/${nome}.wav`);
  }

  create() {
    this.criarAnimacoes();
    this.criarTexturas();
    this.scene.start('Menu');
  }

  criarAnimacoes() {
    // Calan. Mapa dos frames (começam em 0):
    //   parado: 0 frente, 1 lado, 2 costas
    //   andar 1: 3, 4, 5      andar 2: 6, 7, 8      ataque: 9, 10, 11
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

    // Slime: respira parado; ao saltar achata, estica e volta ao normal.
    this.anims.create({ key: 'slime-parado', frames: this.anims.generateFrameNumbers('slime', { frames: [0, 1] }), frameRate: 3, repeat: -1 });
    this.anims.create({ key: 'slime-salto', frames: this.anims.generateFrameNumbers('slime', { frames: [2, 3, 3, 0] }), frameRate: 10, repeat: 0 });

    // Olho: as chamas tremem.
    // Boss: sequência do impacto quando um feitiço acerta no Calan (frames 8, 9 e 10).
    this.anims.create({ key: 'feitico-impacto', frames: this.anims.generateFrameNumbers('boss', { frames: [8, 9, 10] }), frameRate: 12, repeat: 0 });

    this.anims.create({ key: 'olho-parado', frames: this.anims.generateFrameNumbers('olho', { frames: [0, 1] }), frameRate: 5, repeat: -1 });
  }

  // Pequenas texturas desenhadas por código (bola de fogo, baú, escada).
  criarTexturas() {
    const g = this.add.graphics();

    // Bola de fogo 8x8.
    g.fillStyle(0xff6a00).fillCircle(4, 4, 4);
    g.fillStyle(0xffd34d).fillCircle(4, 4, 2);
    g.generateTexture('bola_fogo', 8, 8);
    g.clear();

    // Baú 16x14.
    g.fillStyle(0x2a1a0e).fillRect(0, 2, 16, 12);
    g.fillStyle(0x8a5a2b).fillRect(1, 3, 14, 10);
    g.fillStyle(0x6b4220).fillRect(1, 3, 14, 4);
    g.fillStyle(0xe0b33a).fillRect(0, 6, 16, 1).fillRect(7, 6, 2, 3);
    g.generateTexture('bau', 16, 14);
    g.clear();

    // Escada para o nível seguinte 32x32 (um buraco com degraus).
    g.fillStyle(0x0b0b10).fillRect(0, 0, 32, 32);
    for (let i = 0; i < 4; i++) {
      g.fillStyle(0x8c8577 - i * 0x111111).fillRect(2 + i * 2, 4 + i * 7, 28 - i * 4, 4);
    }
    g.lineStyle(2, 0xd9c48a).strokeRect(1, 1, 30, 30);
    g.generateTexture('escada', 32, 32);

    g.destroy();
  }
}
