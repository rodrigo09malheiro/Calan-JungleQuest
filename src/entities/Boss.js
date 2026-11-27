import { TILE, CHAO_Y } from '../config.js';

// Frames de assets/boss.png (grelha 3x4 de células 64x64), pela ordem em que foram desenhados.
export const FRAMES_BOSS = {
  cara: 0,            // cara normal
  caraFerida: 1,      // cara com pouca vida (passa a ser a cara normal na fúria)
  caraAtaque: 2,      // cara durante um ataque (corpo a corpo ou mágico)
  mao: 3,             // mão normal
  maoQueda: 4,        // mão a cair (rodada -90º)
  maoFeitico: 5,      // mão a lançar o feitiço
  feitico: 6,         // feitiço disparado
  feiticoForte: 7,    // feitiço a meio do trajeto, com mais potência
  impacto: [8, 9, 10] // sequência quando o feitiço acerta no Calan
};
const F = FRAMES_BOSS;

const ALTURA_VOO = 58;                      // y da caveira quando flutua (píxeis de arte)
const Y_CHAO = CHAO_Y * TILE;               // y do topo do chão
const MAO_Y = 28;                           // distância vertical das mãos à caveira
const MAO_X = 38;                           // distância horizontal das mãos à caveira

// Hitbox das mãos: a mão normal (punho) e a mão a cair (rodada -90º).
const CORPO_MAO = { larg: 16, alt: 14, ox: 23, oy: 26 };
const CORPO_QUEDA = { larg: 12, alt: 21, ox: 26, oy: 19, fundo: 8 };    // fundo = píxeis abaixo do centro

// O guardião: uma caveira que flutua, com duas mãos separadas.
// A variante (Tanque ou Ágil) e o fator vêm da dificuldade adaptativa e mudam
// a vida, as pausas, a velocidade e a frequência de cada ataque.
// Só a caveira leva dano. Ao Calan só magoam: as mãos a cair, os feitiços e a
// caveira quando cai a pique (ataque "descer"). Tocar na caveira a flutuar não magoa,
// para valer a pena subir às plataformas e atacá-la de perto.
export default class Boss extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, variante, fator, rng, plataformas, danoCalan) {
    super(scene, x, y, 'boss', F.cara);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setAllowGravity(false);       // flutua: a gravidade da arena não o afeta
    this.body.setSize(28, 32).setOffset(18, 18);
    this.setDepth(50);

    this.v = variante;                      // regras da variante (BOSS.tanque ou BOSS.agil)
    this.fator = fator;
    this.rng = rng;
    this.plataformas = plataformas;         // para as mãos pararem em cima delas
    // Vida = vida da variante x fator do desempenho x dano da arma do Calan.
    this.vidaMax = Math.round(variante.vida * fator * danoCalan);
    this.vida = this.vidaMax;
    this.ativo = false;                     // só ataca depois da apresentação
    this.morto = false;
    this.furia = false;                     // segunda fase: abaixo de metade da vida
    this.estado = 'flutuar';                // flutuar | esmagar | disparar | descer
    this.aCair = false;                     // true enquanto a caveira cai a pique (magoa)
    this.invulneravelAte = 0;
    this.proximoAtaque = 0;
    this.centroX = x;                       // centro do movimento de vaivém

    // As duas mãos: sprites com corpo próprio, sem gravidade.
    this.maos = [-1, 1].map((lado) => {
      const mao = scene.physics.add.sprite(x + lado * MAO_X, y + MAO_Y, 'boss', F.mao);
      mao.body.setAllowGravity(false);
      mao.setDepth(60);
      mao.lado = lado;
      mao.livre = false;                    // true enquanto está a atacar (não segue a caveira)
      mao.perigosa = false;                 // true enquanto magoa o Calan
      this.maoNormal(mao);
      return mao;
    });
  }

  // Cara de repouso: normal, ou ferida depois de entrar em fúria.
  get caraRepouso() {
    return this.furia ? F.caraFerida : F.cara;
  }

  // Põe uma mão no estado normal: punho, virada para o seu lado, sem rodar.
  maoNormal(mao) {
    mao.setFrame(F.mao).setAngle(0).setFlipX(mao.lado > 0);
    mao.body.setSize(CORPO_MAO.larg, CORPO_MAO.alt).setOffset(CORPO_MAO.ox, CORPO_MAO.oy);
  }

  // Põe uma mão em queda: frame 4 rodado -90º.
  maoEmQueda(mao) {
    mao.setFrame(F.maoQueda).setFlipX(false).setAngle(-90);
    mao.body.setSize(CORPO_QUEDA.larg, CORPO_QUEDA.alt).setOffset(CORPO_QUEDA.ox, CORPO_QUEDA.oy);
  }

  // Altura onde uma mão que cai em x vai bater: a plataforma mais alta por baixo,
  // ou o chão. Assim as mãos nunca atravessam as plataformas.
  superficieAbaixo(x, desdeY) {
    let y = Y_CHAO;
    for (const p of this.plataformas) {
      const topo = p.ty * TILE;
      const dentro = x >= p.tx * TILE - 4 && x <= (p.tx + p.largura) * TILE + 4;
      if (dentro && topo > desdeY && topo < y) y = topo;
    }
    return y;
  }

  // ---------- Apresentação ----------
  // A caveira desce do teto até à altura de voo, a arena treme e o combate começa.
  entrar(aoAcabar) {
    this.y = -40;
    this.scene.tweens.add({
      targets: this, y: ALTURA_VOO, duration: 1600, ease: 'Sine.easeOut',
      onComplete: () => {
        this.scene.cameras.main.shake(300, 0.006);
        this.scene.sons.tocar('impacto');
        this.scene.time.delayedCall(900, () => {
          this.ativo = true;
          this.proximoAtaque = this.scene.time.now + 600;
          if (aoAcabar) aoAcabar();
        });
      },
    });
  }

  // ---------- Ciclo de cada frame ----------
  update(time, calan) {
    if (this.morto) return;

    // A flutuar: vaivém lento de um lado para o outro e balanço vertical.
    // Aproxima-se do ponto alvo aos poucos, para não "saltar" depois de um ataque.
    if (this.estado === 'flutuar' && this.ativo) {
      const vel = this.furia ? 0.0009 : 0.0006;
      const alvoX = this.centroX + Math.sin(time * vel) * 70;
      const alvoY = ALTURA_VOO + Math.sin(time * 0.003) * 5;
      this.x += (alvoX - this.x) * 0.05;
      this.y += (alvoY - this.y) * 0.1;
    }

    // As mãos que não estão a atacar seguem a caveira, com um pequeno atraso (suaviza o movimento).
    for (const mao of this.maos) {
      if (mao.livre) continue;
      const alvoX = this.x + mao.lado * MAO_X;
      const alvoY = this.y + MAO_Y + Math.sin(time * 0.004 + mao.lado) * 3;
      mao.x += (alvoX - mao.x) * 0.15;
      mao.y += (alvoY - mao.y) * 0.15;
    }

    // Hora de atacar? A cara muda para a de ataque durante todo o ataque.
    if (this.ativo && this.estado === 'flutuar' && time >= this.proximoAtaque) {
      const ataque = this.rng.escolherComPeso(this.v.ataques).nome;
      this.setFrame(F.caraAtaque);
      this[ataque](calan);
    }
  }

  // Volta a flutuar e marca o próximo ataque. A pausa encolhe com o fator e na fúria.
  terminarAtaque() {
    if (this.morto) return;
    this.estado = 'flutuar';
    this.setFrame(this.caraRepouso);
    const pausa = this.v.pausa / this.fator * (this.furia ? 0.7 : 1);
    this.proximoAtaque = this.scene.time.now + pausa;
  }

  // ---------- Ataque 1: esmagar (corpo a corpo) ----------
  // Uma mão sobe por cima do Calan, treme (aviso) e cai a pique até ao chão
  // ou até à plataforma que estiver por baixo. Na fúria, as duas mãos esmagam seguidas.
  esmagar(calan) {
    this.estado = 'esmagar';
    const maos = this.furia ? this.maos : [this.rng.escolher(this.maos)];
    const umaMao = (i) => {
      if (i >= maos.length) { this.terminarAtaque(); return; }
      this.esmagarCom(maos[i], calan, () => umaMao(i + 1));
    };
    umaMao(0);
  }

  esmagarCom(mao, calan, depois) {
    const s = this.scene;
    mao.livre = true;
    // 1) Sobe para cima do Calan.
    s.tweens.add({
      targets: mao, x: Phaser.Math.Clamp(calan.x, 32, 288), y: 34, duration: 450, ease: 'Sine.easeInOut',
      onComplete: () => {
        if (this.morto) return;
        // 2) Roda para apontar para baixo e treme meio segundo (tempo para o jogador fugir).
        this.maoEmQueda(mao);
        s.tweens.add({
          targets: mao, x: mao.x + 2, duration: 50, yoyo: true, repeat: 4,
          onComplete: () => {
            if (this.morto) return;
            // 3) Cai a pique até à primeira superfície por baixo (plataforma ou chão).
            const destino = this.superficieAbaixo(mao.x, mao.y) - CORPO_QUEDA.fundo;
            mao.perigosa = true;
            s.tweens.add({
              targets: mao, y: destino, duration: 170, ease: 'Quad.easeIn',
              onComplete: () => {
                if (this.morto) return;
                s.sons.tocar('impacto');
                s.cameras.main.shake(180, 0.008);
                // 4) Fica um instante cravada e volta, já como mão normal, para junto da caveira.
                s.time.delayedCall(450, () => {
                  mao.perigosa = false;
                  if (this.morto) return;
                  this.maoNormal(mao);
                  s.tweens.add({
                    targets: mao, x: this.x + mao.lado * MAO_X, y: this.y + MAO_Y, duration: 400, ease: 'Sine.easeOut',
                    onComplete: () => { mao.livre = false; depois(); },
                  });
                });
              },
            });
          },
        });
      },
    });
  }

  // ---------- Ataque 2: feitiço (mágico) ----------
  // As duas mãos preparam o feitiço (frame 5) e disparam-no em leque na direção do Calan:
  // 2 feitiços com o guardião calmo, 3 na fúria (config.js: feiticos e feiticosFuria).
  disparar(calan) {
    this.estado = 'disparar';
    const s = this.scene;
    const maos = this.maos;
    for (const mao of maos) mao.setFrame(F.maoFeitico).setAngle(0);

    s.time.delayedCall(600, () => {
      if (this.morto) return;
      const n = this.furia ? this.v.feiticosFuria : this.v.feiticos;
      for (let i = 0; i < n; i++) {
        const mao = maos[i % maos.length];
        // Sai do círculo vermelho, por cima da mão.
        const ox = mao.x, oy = mao.y - 6;
        const base = Phaser.Math.Angle.Between(ox, oy, calan.x, calan.y - 12);
        const desvio = (i - (n - 1) / 2) * 0.3;   // leque: ±0,15 rad com 2; -0,3/0/+0,3 com 3
        s.events.emit('boss-feitico', ox, oy, base + desvio, this.v.velTiro * this.fator, calan);
      }
      s.sons.tocar('fogo');
      s.time.delayedCall(250, () => {
        if (this.morto) return;
        for (const mao of maos) this.maoNormal(mao);
        s.time.delayedCall(200, () => this.terminarAtaque());
      });
    });
  }

  // ---------- Ataque 3: descer (corpo a corpo) ----------
  // A caveira desce até perto do chão e fica lá um bocado: é a melhor altura para
  // lhe acertar, mas a queda magoa. É a "janela" que torna o boss justo.
  descer() {
    this.estado = 'descer';
    this.aCair = true;
    const s = this.scene;
    s.tweens.add({
      targets: this, y: Y_CHAO - 30, duration: 650, ease: 'Sine.easeIn',
      onComplete: () => {
        this.aCair = false;
        if (this.morto) return;
        s.sons.tocar('impacto');
        s.cameras.main.shake(120, 0.004);
        s.time.delayedCall(1500, () => {
          if (this.morto) return;
          s.tweens.add({
            targets: this, y: ALTURA_VOO, duration: 650, ease: 'Sine.easeOut',
            onComplete: () => this.terminarAtaque(),
          });
        });
      },
    });
  }

  // ---------- Dano e morte ----------
  levarDano(dano) {
    const agora = this.scene.time.now;
    if (!this.ativo || this.morto || agora < this.invulneravelAte) return false;
    this.vida -= dano;
    this.invulneravelAte = agora + 250;
    this.scene.sons.tocar('acerto');
    this.setTint(0xff6060);
    this.scene.time.delayedCall(120, () => { if (!this.morto) this.clearTint(); });

    // Abaixo de metade da vida: fúria. A cara ferida passa a ser a cara de repouso.
    if (!this.furia && this.vida <= this.vidaMax / 2) {
      this.furia = true;
      if (this.estado === 'flutuar') this.setFrame(this.caraRepouso);
      this.scene.events.emit('boss-furia');
    }
    if (this.vida <= 0) this.morrer();
    return true;
  }

  morrer() {
    this.morto = true;
    this.ativo = false;
    const s = this.scene;
    s.tweens.killTweensOf([this, ...this.maos]);
    this.setFrame(F.caraFerida);
    // As mãos voltam ao normal e caem com a gravidade da arena.
    for (const mao of this.maos) {
      mao.perigosa = false;
      this.maoNormal(mao);
      mao.body.setAllowGravity(true);
      mao.setVelocity(mao.lado * 60, -120);
    }
    // A caveira treme e desfaz-se com a mesma explosão dos feitiços (frames 8, 9 e 10).
    s.tweens.add({ targets: this, x: this.x + 2, duration: 40, yoyo: true, repeat: 12 });
    s.time.delayedCall(1000, () => {
      for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * Math.PI * 2;
        s.time.delayedCall(i * 60, () => {
          s.add.sprite(this.x + Math.cos(ang) * 14, this.y + Math.sin(ang) * 14, 'boss', F.impacto[0])
            .setDepth(70).play('feitico-impacto')
            .once('animationcomplete', function () { this.destroy(); });
        });
      }
      s.cameras.main.flash(250, 255, 240, 200);
      this.setVisible(false);
      this.body.enable = false;
      s.events.emit('boss-morto');
    });
  }
}
