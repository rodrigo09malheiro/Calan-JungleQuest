import { ECRA_LARGURA, ECRA_ALTURA } from '../config.js';

// Ecrã inicial com título e instruções.
export default class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    const cx = ECRA_LARGURA / 2;
    this.add.text(cx, 150, 'Calan: Jungle Quest', { fontSize: '48px', color: '#ffffff' }).setOrigin(0.5);
    this.add.text(cx, 270,
      ['Setas ou WASD: andar', 'ESPAÇO: atacar (em breve)', '', 'Prime ENTER para jogar'],
      { fontSize: '24px', color: '#cfd8dc', align: 'center' }).setOrigin(0.5);

    this.input.keyboard.once('keydown-ENTER', () => this.scene.start('Game'));
  }
}
