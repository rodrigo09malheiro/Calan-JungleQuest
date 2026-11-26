import { TILE, SCALE, SALA_LARGURA, SALA_ALTURA } from '../config.js';
import Calan from '../entities/Calan.js';

// Sala de teste: chão, paredes com colisão e o Calan a andar.
// Mais tarde esta cena recebe salas geradas por código.
export default class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  create() {
    this.criarSala();

    // O Calan começa no centro da sala.
    this.calan = new Calan(this, (SALA_LARGURA * TILE) / 2, (SALA_ALTURA * TILE) / 2);
    this.physics.add.collider(this.calan, this.paredes);

    // Câmara: zoom inteiro para a pixel art ficar nítida; a sala cabe toda no ecrã.
    const cam = this.cameras.main;
    cam.setZoom(SCALE);
    cam.centerOn((SALA_LARGURA * TILE) / 2, (SALA_ALTURA * TILE) / 2);

    // Atalhos de teste (serão removidos): ESC volta ao menu, G vai para o Game Over.
    this.input.keyboard.once('keydown-ESC', () => this.scene.start('Menu'));
    this.input.keyboard.once('keydown-G', () => this.scene.start('GameOver'));
  }

  // Desenha a sala com retângulos (substituídos por tiles desenhados mais tarde).
  criarSala() {
    this.paredes = this.physics.add.staticGroup();

    for (let ty = 0; ty < SALA_ALTURA; ty++) {
      for (let tx = 0; tx < SALA_LARGURA; tx++) {
        const x = tx * TILE + TILE / 2;
        const y = ty * TILE + TILE / 2;
        const borda = tx === 0 || ty === 0 || tx === SALA_LARGURA - 1 || ty === SALA_ALTURA - 1;
        const bloco = (tx === 6 && ty >= 4 && ty <= 7) || (tx === 13 && ty >= 5 && ty <= 9);

        if (borda || bloco) {
          const parede = this.add.rectangle(x, y, TILE, TILE, 0x3b4a5a).setStrokeStyle(1, 0x222c36);
          this.paredes.add(parede);   // cria um corpo estático para a colisão
        } else {
          // Chão com um padrão de xadrez suave.
          const cor = (tx + ty) % 2 === 0 ? 0x2e4d36 : 0x335a3d;
          this.add.rectangle(x, y, TILE, TILE, cor);
        }
      }
    }
  }

  update() {
    this.calan.update();
  }
}
