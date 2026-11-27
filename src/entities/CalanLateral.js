import { FRAME_CALAN, ALTURA_CALAN, PES_CALAN, SALTO_CALAN } from '../config.js';

// Frames da folha do Calan usados na vista lateral (só as vistas "de lado").
const FRAME = { parado: 1, subir: 4, cair: 7, ataqueEspada: 17 };   // sem espada: animação 'calan-murro-lado'

const VELOCIDADE = 90;          // píxeis de arte por segundo
const DURACAO_ATAQUE = 260;     // ms em que o Calan fica a golpear
const INVULNERAVEL = 1200;      // ms sem levar dano depois de ser atingido
const MARGEM_SALTO = 90;        // ms em que ainda pode saltar depois de sair de uma plataforma

// O Calan na arena do boss: anda para os lados, salta e ataca, com gravidade.
// É uma classe à parte do Calan das salas porque o controlo é diferente
// (não há cima/baixo; há salto e queda).
export default class CalanLateral extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'calan', FRAME.parado);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Origem nos pés; a hitbox é o corpo inteiro (na vista lateral a cabeça também conta).
    this.setOrigin(0.5, PES_CALAN / ALTURA_CALAN);   // pés na linha 35 da célula de 48x48
    const larg = 12, alt = 24;
    this.body.setSize(larg, alt);
    this.body.setOffset((FRAME_CALAN - larg) / 2, PES_CALAN - alt);
    this.setDepth(100);

    this.olhaEsquerda = false;
    this.aAtacar = false;
    this.invulneravelAte = 0;
    this.empurradoAte = 0;
    this.noChaoAte = 0;         // último instante em que esteve apoiado (+ margem de salto)

    // Teclas: setas/A-D para andar, CIMA/W para saltar, ESPAÇO/J para atacar.
    this.teclas = scene.input.keyboard.addKeys({
      esq: 'LEFT', dir: 'RIGHT', cima: 'UP',
      a: 'A', d: 'D', w: 'W',
      atacar: 'SPACE', j: 'J',
    });
  }

  update(time) {
    const t = this.teclas;
    const apoiado = this.body.blocked.down || this.body.touching.down;
    if (apoiado) this.noChaoAte = time + MARGEM_SALTO;

    // Pisca enquanto está invulnerável.
    this.setAlpha(time < this.invulneravelAte && Math.floor(time / 80) % 2 === 0 ? 0.3 : 1);
    if (time < this.empurradoAte) return;

    // Ataque (também no ar).
    if (!this.aAtacar && (Phaser.Input.Keyboard.JustDown(t.atacar) || Phaser.Input.Keyboard.JustDown(t.j))) {
      this.atacar();
    }

    // Movimento horizontal. A atacar no chão fica parado; no ar mantém o impulso.
    const vx = ((t.dir.isDown || t.d.isDown) ? 1 : 0) - ((t.esq.isDown || t.a.isDown) ? 1 : 0);
    if (this.aAtacar && apoiado) {
      this.setVelocityX(0);
    } else {
      this.setVelocityX(vx * VELOCIDADE);
      if (vx !== 0 && !this.aAtacar) {
        this.olhaEsquerda = vx < 0;
        this.setFlipX(this.olhaEsquerda);
      }
    }

    // Salto: só a partir do chão (ou logo a seguir a sair dele).
    const saltar = Phaser.Input.Keyboard.JustDown(t.cima) || Phaser.Input.Keyboard.JustDown(t.w);
    if (saltar && time < this.noChaoAte) {
      this.setVelocityY(-SALTO_CALAN);
      this.noChaoAte = 0;
      this.scene.sons.tocar('salto');
    }
    // Salto variável: largar a tecla a meio da subida corta o salto (mais controlo).
    const aSegurar = t.cima.isDown || t.w.isDown;
    if (!aSegurar && this.body.velocity.y < -120) this.setVelocityY(this.body.velocity.y * 0.5);

    this.escolherFrame(apoiado, vx);
  }

  // Animação conforme o estado: a atacar, no ar (a subir ou a cair), a andar ou parado.
  escolherFrame(apoiado, vx) {
    if (this.aAtacar) return;
    if (!apoiado) {
      this.anims.stop();
      this.setFrame(this.body.velocity.y < 0 ? FRAME.subir : FRAME.cair);
    } else if (vx !== 0) {
      this.anims.play('calan-andar-lado', true);
    } else {
      this.anims.stop();
      this.setFrame(FRAME.parado);
    }
  }

  // Golpe de espada para o lado para onde está virado. A cena trata do dano.
  atacar() {
    this.aAtacar = true;
    this.anims.stop();
    if (this.scene.partida.temEspada) this.setFrame(FRAME.ataqueEspada);
    else this.anims.play('calan-murro-lado');
    this.scene.events.emit('calan-ataca', this);
    // Cancela o fim do golpe anterior (se ainda estiver pendente), para não cortar este.
    if (this.fimAtaque) this.fimAtaque.remove();
    this.fimAtaque = this.scene.time.delayedCall(DURACAO_ATAQUE, () => { this.aAtacar = false; });
  }

  podeLevarDano(time) {
    return time >= this.invulneravelAte;
  }

  // Leva dano: fica invulnerável e é atirado para cima e para longe do golpe.
  levarDano(time, origemX) {
    this.invulneravelAte = time + INVULNERAVEL;
    this.empurradoAte = time + 250;
    this.aAtacar = false;
    const lado = this.x < origemX ? -1 : 1;
    this.setVelocity(lado * 140, -200);
  }
}
