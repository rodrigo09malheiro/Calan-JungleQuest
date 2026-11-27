import { INIMIGOS } from '../config.js';

// Classe base dos inimigos: vida, dano recebido, recuo e morte.
// As subclasses (Slime, Olho) só tratam do comportamento em pensar().
// nivel = configuração do nível (NIVEIS em config.js): muda a velocidade e a vida.
export default class Inimigo extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, textura, tipo, nivel) {
    super(scene, x, y, textura, 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 1);   // origem nos pés, como o Calan

    this.tipo = tipo;
    this.vida = Math.ceil(INIMIGOS[tipo].vida * nivel.vidaInimigos);   // mais vida no nível 2
    this.pontos = INIMIGOS[tipo].pontos;
    this.multVel = nivel.velocidade;
    this.atordoadoAte = 0;   // durante o recuo não se mexe por conta própria
    this.recuando = false;   // true enquanto está a ser empurrado por um golpe
    this.morto = false;
  }

  // Chamado pela cena em cada frame.
  update(time, calan) {
    if (this.morto) return;
    this.setDepth(this.y);
    if (time < this.atordoadoAte) return;
    if (this.recuando) { this.recuando = false; this.setVelocity(0, 0); }   // fim do recuo
    this.pensar(time, calan);
  }

  pensar() {}   // comportamento: definido em cada subclasse

  // Vetor do inimigo até ao Calan, com a distância.
  ate(calan) {
    const dx = calan.x - this.x, dy = calan.y - this.y;
    return { dx, dy, dist: Math.hypot(dx, dy) };
  }

  // Recebe dano vindo do ponto (origemX, origemY), normalmente o Calan.
  levarDano(dano, origemX, origemY) {
    if (this.morto) return;
    this.vida -= dano;
    this.scene.sons.tocar('acerto');

    // Fica vermelho um instante e é empurrado para trás.
    this.setTint(0xff5050);
    this.scene.time.delayedCall(120, () => { if (!this.morto) this.clearTint(); });
    const v = new Phaser.Math.Vector2(this.x - origemX, this.y - origemY).normalize().scale(150);
    this.setVelocity(v.x, v.y);
    this.atordoadoAte = this.scene.time.now + 200;
    this.recuando = true;

    if (this.vida <= 0) this.morrer();
  }

  // Desliga o corpo físico (já não magoa nem é atingido), avisa a cena
  // (pontos, sala limpa) e remove o sprite depois da animação.
  morrer() {
    this.morto = true;
    this.body.enable = false;
    this.anims.stop();
    this.scene.events.emit('inimigo-morto', this);
    // Pequena animação de desaparecer.
    this.scene.tweens.add({
      targets: this, alpha: 0, scaleX: 1.4, scaleY: 0.4, duration: 220,
      onComplete: () => this.destroy(),
    });
  }
}
