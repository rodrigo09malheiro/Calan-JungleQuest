import { ECRA_LARGURA } from '../config.js';

// Placeholder: mais tarde mostra a pontuação final e o recorde.
export default class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOver'); }

  create() {
    const cx = ECRA_LARGURA / 2;
    this.add.text(cx, 200, 'Game Over', { fontSize: '56px', color: '#ff6b6b' }).setOrigin(0.5);
    this.add.text(cx, 320, 'Prime ENTER para jogar de novo', { fontSize: '24px', color: '#ffffff' }).setOrigin(0.5);
    this.input.keyboard.once('keydown-ENTER', () => this.scene.start('Game'));
  }
}
