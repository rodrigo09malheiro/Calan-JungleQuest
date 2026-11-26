import Inimigo from './Inimigo.js';

// Olho de chamas: mantém distância do Calan e dispara bolas de fogo.
// Se o Calan se aproxima, afasta-se; se está longe, aproxima-se.
export default class Olho extends Inimigo {
  constructor(scene, x, y, multVel) {
    super(scene, x, y, 'olho', 'olho', multVel);
    this.body.setSize(14, 12);
    this.body.setOffset(10, 18);
    this.proximoTiro = scene.time.now + Phaser.Math.Between(1200, 2200);
    this.aCarregar = false;
    this.anims.play('olho-parado');
  }

  pensar(time, calan) {
    const { dx, dy, dist } = this.ate(calan);
    const vel = 35 * this.multVel;

    if (this.aCarregar) {
      this.setVelocity(0, 0);
    } else if (dist < 60) {
      this.setVelocity(-dx / dist * vel, -dy / dist * vel);   // foge
    } else if (dist > 110) {
      this.setVelocity(dx / dist * vel, dy / dist * vel);     // aproxima-se
    } else {
      // À distância certa, anda de lado (perpendicular ao Calan).
      this.setVelocity(-dy / dist * vel * 0.6, dx / dist * vel * 0.6);
    }

    if (time >= this.proximoTiro && !this.aCarregar) this.carregarTiro();
  }

  // Pára, mostra o frame de carregar (chamas grandes) e dispara.
  carregarTiro() {
    this.aCarregar = true;
    this.anims.stop();
    this.setFrame(2);
    this.scene.time.delayedCall(400, () => {
      if (this.morto) return;
      this.aCarregar = false;
      this.anims.play('olho-parado');
      this.scene.events.emit('olho-dispara', this);
    });
    this.proximoTiro = this.scene.time.now + Phaser.Math.Between(1800, 2800) / this.multVel;
  }

  levarDano(dano, ox, oy) {
    super.levarDano(dano, ox, oy);
    if (!this.morto) {
      this.aCarregar = false;
      this.anims.stop();
      this.setFrame(3);   // frame de "atordoado"
      this.scene.time.delayedCall(200, () => { if (!this.morto) this.anims.play('olho-parado'); });
    }
  }
}
