import Inimigo from './Inimigo.js';

// Slime: avança aos saltos. Quando o Calan está perto, salta na direção dele;
// quando está longe, salta numa direção ao acaso.
export default class Slime extends Inimigo {
  constructor(scene, x, y, nivel) {
    super(scene, x, y, 'slime', 'slime', nivel);
    this.body.setSize(16, 10);
    this.body.setOffset(7, 14);
    this.proximoSalto = scene.time.now + Phaser.Math.Between(400, 1200);
    this.anims.play('slime-parado');
  }

  pensar(time, calan) {
    if (time < this.proximoSalto) return;

    const { dx, dy, dist } = this.ate(calan);
    let dir;
    if (dist < 130) {
      dir = new Phaser.Math.Vector2(dx, dy).normalize();            // persegue
    } else {
      dir = new Phaser.Math.Vector2(1, 0).rotate(Math.random() * Math.PI * 2);   // vagueia
    }
    const vel = 55 * this.multVel;
    this.setVelocity(dir.x * vel, dir.y * vel);
    this.anims.play('slime-salto');

    // Aterra ao fim de 350 ms e espera antes do próximo salto.
    this.scene.time.delayedCall(350, () => {
      if (this.morto) return;
      this.setVelocity(0, 0);
      this.anims.play('slime-parado');
    });
    this.proximoSalto = time + Phaser.Math.Between(700, 1100) / this.multVel;
  }
}
