import { VEL_CALAN, FRAME_CALAN } from '../config.js';

// Frames da folha do Calan para cada direção.
const FRAME_PARADO = { baixo: 0, lado: 1, cima: 2 };
const FRAME_ATAQUE = { baixo: 9, lado: 10, cima: 11 };

const DURACAO_ATAQUE = 260;     // ms em que o Calan fica a golpear
const INVULNERAVEL = 1000;      // ms sem levar dano depois de ser atingido

// O jogador. Estende o sprite com física Arcade e trata do movimento, do ataque e do dano.
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

    this.direcao = 'baixo';     // para onde está virado: baixo, lado ou cima
    this.olhaEsquerda = false;  // quando está de lado, se está virado para a esquerda
    this.aAtacar = false;
    this.invulneravelAte = 0;
    this.empurradoAte = 0;      // durante o recuo (knockback) o jogador não controla o Calan

    // Teclas: setas e WASD para andar, ESPAÇO (ou J) para atacar.
    const kb = scene.input.keyboard;
    this.teclas = kb.addKeys({
      cima: 'UP', baixo: 'DOWN', esq: 'LEFT', dir: 'RIGHT',
      w: 'W', s: 'S', a: 'A', d: 'D',
      atacar: 'SPACE', j: 'J',
    });
  }

  update(time) {
    this.setDepth(this.y);   // quem está mais abaixo no ecrã é desenhado à frente

    // Pisca enquanto está invulnerável.
    this.setAlpha(time < this.invulneravelAte && Math.floor(time / 80) % 2 === 0 ? 0.3 : 1);

    if (time < this.empurradoAte) return;
    if (this.aAtacar) { this.setVelocity(0, 0); return; }

    const t = this.teclas;
    if (Phaser.Input.Keyboard.JustDown(t.atacar) || Phaser.Input.Keyboard.JustDown(t.j)) {
      this.atacar();
      return;
    }

    const esq = t.esq.isDown || t.a.isDown;
    const dir = t.dir.isDown || t.d.isDown;
    const cima = t.cima.isDown || t.w.isDown;
    const baixo = t.baixo.isDown || t.s.isDown;

    // -1, 0 ou 1 em cada eixo.
    const vx = (dir ? 1 : 0) - (esq ? 1 : 0);
    const vy = (baixo ? 1 : 0) - (cima ? 1 : 0);

    // Na diagonal normaliza-se, para não andar mais depressa.
    const v = new Phaser.Math.Vector2(vx, vy).normalize().scale(VEL_CALAN);
    this.setVelocity(v.x, v.y);

    // Escolhe a direção a mostrar. O movimento horizontal tem prioridade.
    if (vx !== 0) {
      this.direcao = 'lado';
      this.olhaEsquerda = vx < 0;
      this.setFlipX(this.olhaEsquerda);   // o lado esquerdo é o direito espelhado
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
      this.setFrame(FRAME_PARADO[this.direcao]);
    }
  }

  // Vetor unitário para onde o Calan está virado.
  vetorDirecao() {
    if (this.direcao === 'lado') return { x: this.olhaEsquerda ? -1 : 1, y: 0 };
    return { x: 0, y: this.direcao === 'baixo' ? 1 : -1 };
  }

  // Golpe de espada: muda o frame e avisa a cena, que cria a zona de dano e o efeito.
  atacar() {
    this.aAtacar = true;
    this.anims.stop();
    this.setFrame(FRAME_ATAQUE[this.direcao]);
    this.setVelocity(0, 0);
    this.scene.events.emit('calan-ataca', this);
    this.scene.time.delayedCall(DURACAO_ATAQUE, () => {
      this.aAtacar = false;
      this.setFrame(FRAME_PARADO[this.direcao]);
    });
  }

  podeLevarDano(time) {
    return time >= this.invulneravelAte;
  }

  // Leva dano: fica invulnerável um bocado e é empurrado para longe da origem do golpe.
  levarDano(time, origemX, origemY) {
    this.invulneravelAte = time + INVULNERAVEL;
    this.empurradoAte = time + 180;
    this.aAtacar = false;
    const v = new Phaser.Math.Vector2(this.x - origemX, this.y - origemY).normalize().scale(160);
    this.setVelocity(v.x, v.y);
  }
}
