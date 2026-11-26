import { VEL_CALAN, FRAME_CALAN } from '../config.js';

// O jogador. Estende o sprite com física Arcade e trata do movimento e das animações.
export default class Calan extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'calan', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // A origem fica nos PÉS: a posição (x, y) é onde o Calan pisa o chão.
    this.setOrigin(0.5, 1);

    // Hitbox pequena junto aos pés (12x8), para o corpo poder "passar por trás" das paredes de cima.
    const larg = 12, alt = 8;
    this.body.setSize(larg, alt);
    this.body.setOffset((FRAME_CALAN - larg) / 2, FRAME_CALAN - alt);

    this.direcao = 'baixo';  // para onde está virado: baixo, lado ou cima

    // Teclas: setas e WASD.
    const kb = scene.input.keyboard;
    this.teclas = kb.addKeys({
      cima: 'UP', baixo: 'DOWN', esq: 'LEFT', dir: 'RIGHT',
      w: 'W', s: 'S', a: 'A', d: 'D',
    });
  }

  update() {
    const t = this.teclas;
    const esq = t.esq.isDown || t.a.isDown;
    const dir = t.dir.isDown || t.d.isDown;
    const cima = t.cima.isDown || t.w.isDown;
    const baixo = t.baixo.isDown || t.s.isDown;

    // -1, 0 ou 1 em cada eixo.
    let vx = (dir ? 1 : 0) - (esq ? 1 : 0);
    let vy = (baixo ? 1 : 0) - (cima ? 1 : 0);

    // Na diagonal normaliza-se, para não andar mais depressa.
    const v = new Phaser.Math.Vector2(vx, vy).normalize().scale(VEL_CALAN);
    this.setVelocity(v.x, v.y);

    // Escolhe a direção a mostrar. O movimento horizontal tem prioridade.
    if (vx !== 0) {
      this.direcao = 'lado';
      this.setFlipX(vx < 0);          // o lado esquerdo é o direito espelhado
    } else if (vy > 0) {
      this.direcao = 'baixo';
    } else if (vy < 0) {
      this.direcao = 'cima';
    }

    if (vx !== 0 || vy !== 0) {
      this.anims.play(`calan-andar-${this.direcao}`, true);
    } else {
      // Parado: mostra o frame de repouso da direção atual.
      this.anims.stop();
      this.setFrame({ baixo: 0, lado: 1, cima: 2 }[this.direcao]);
    }
  }
}
