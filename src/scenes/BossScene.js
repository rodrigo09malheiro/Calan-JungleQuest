import {
  TILE, SCALE, SALA_LARGURA, SALA_ALTURA, HUD_ALTURA, ECRA_LARGURA,
  VIDA_CALAN, TILES_CRIPTA, GRAVIDADE, CHAO_Y, BOSS, CENTRO_CALAN,
} from '../config.js';
import Aleatorio from '../sistemas/Aleatorio.js';
import GeradorArena from '../sistemas/GeradorArena.js';
import Sons from '../sistemas/Sons.js';
import CalanLateral from '../entities/CalanLateral.js';
import Boss, { FRAMES_BOSS } from '../entities/Boss.js';

const C = TILES_CRIPTA;
const TINTA_FUNDO = 0x707080;   // escurece a parede de fundo para se distinguir do primeiro plano
const POTENCIA = 1.5;           // o feitiço acelera assim a meio do trajeto (frame 7)
const ESCALA_FEITICO = 0.6;     // o desenho do feitiço é quase do tamanho do Calan: reduz-se

// Luta final em VISTA LATERAL (gravidade, salto e ataque).
// Junta os conceitos do tema:
//  - dificuldade adaptativa: as métricas dos níveis 1 e 2 escolhem a variante e o fator do boss;
//  - geração procedimental: as plataformas da arena são geradas com a semente e verificadas.
export default class BossScene extends Phaser.Scene {
  constructor() { super('Boss'); }

  create() {
    this.partida = this.registry.get('partida');
    const p = this.partida;
    this.sons = new Sons(this);
    this.aTerminar = false;

    // 1) Dificuldade adaptativa: avalia o desempenho (se ainda não foi avaliado).
    if (!p.avaliacao) p.avaliacao = p.metricas.avaliar(p.vida, VIDA_CALAN);
    const { variante, fator, estilo } = p.avaliacao;
    this.variante = BOSS[variante];

    // A gravidade só existe nesta cena (as salas são vistas de cima, sem gravidade).
    this.physics.world.gravity.y = GRAVIDADE;

    // 2) Arena: plataformas geradas com uma semente derivada da partida.
    const rng = new Aleatorio(p.semente * 13 + 777);
    this.arena = new GeradorArena(rng, this.variante.arena).gerar();
    this.desenharArena(rng);

    // 3) Personagens: o Calan entra pela porta da esquerda; o guardião desce do teto.
    this.calan = new CalanLateral(this, 4 * TILE, CHAO_Y * TILE);
    // O guardião adapta-se também à arma: com a espada (dano 2) tem o dobro da vida,
    // para a luta durar o mesmo número de golpes com ou sem espada.
    this.boss = new Boss(this, 13 * TILE, -40, this.variante, fator, rng, this.arena.plataformas, p.arma.dano);
    this.feiticos = this.physics.add.group({ allowGravity: false });

    this.criarColisoes();
    this.ligarEventos();

    // Estado do boss lido pelo HUD (nome, vida, barra).
    p.boss = { nome: this.variante.nome, fator, vida: this.boss.vida, vidaMax: this.boss.vidaMax };

    // Câmara igual à das salas: zoom inteiro, por baixo do HUD.
    const cam = this.cameras.main;
    cam.setViewport(0, HUD_ALTURA, ECRA_LARGURA, SALA_ALTURA * TILE * SCALE);
    cam.setZoom(SCALE);
    cam.centerOn((SALA_LARGURA * TILE) / 2, (SALA_ALTURA * TILE) / 2);
    cam.fadeIn(500);
    if (!this.scene.isActive('HUD')) this.scene.launch('HUD');

    // Apresentação: mensagem da dificuldade adaptativa enquanto o guardião desce.
    p.mensagem = {
      linhas: [`Desempenho: ${estilo}`, `Guardião: ${this.variante.nome} (x${fator.toFixed(2)})`],
      ate: Date.now() + 3200,
    };
    this.boss.entrar();

    this.input.keyboard.once('keydown-ESC', () => {
      this.scene.stop('HUD');
      this.scene.start('Menu');
    });
  }

  // ---------- Arena ----------
  // Desenha a cripta com os tiles de cripta.png e cria os corpos de colisão.
  desenharArena(rng) {
    const W = SALA_LARGURA, H = SALA_ALTURA;
    const img = (tx, ty, frame) => this.add.image(tx * TILE + TILE / 2, ty * TILE + TILE / 2, 'cripta', frame);
    this.paredes = this.physics.add.staticGroup();
    const parede = (tx, ty, frame) => this.paredes.create(tx * TILE + TILE / 2, ty * TILE + TILE / 2, 'cripta', frame);

    // Fundo: tijolo escurecido em toda a arena.
    for (let ty = 0; ty < H; ty++) {
      for (let tx = 0; tx < W; tx++) img(tx, ty, rng.escolher(C.fundo)).setTint(TINTA_FUNDO).setDepth(-100);
    }
    // Decoração de fundo: estandartes e janelas (sem colisão).
    const bloco = (tx, ty, largura, frames, tinta) => frames.forEach((f, i) =>
      img(tx + (i % largura), ty + Math.floor(i / largura), f).setTint(tinta).setDepth(-90));
    bloco(2, 1, 2, C.estandarte, 0xd0d0d0);
    bloco(16, 1, 2, C.estandarte, 0xd0d0d0);
    bloco(5, 2, 3, C.janela, 0x909098);
    bloco(12, 2, 3, C.janela, 0x909098);
    // Porta de entrada em arco, na parede da esquerda (por onde o Calan entrou).
    bloco(1, CHAO_Y - 3, 2, C.porta, 0xffffff);

    // Teto, paredes laterais e chão (com colisão).
    for (let tx = 0; tx < W; tx++) parede(tx, 0, C.teto[tx % 3]);
    for (let ty = 1; ty < CHAO_Y; ty++) {
      parede(0, ty, C.coluna[ty % 2]);
      parede(W - 1, ty, C.coluna[ty % 2]).setFlipX(true);
    }
    for (let tx = 0; tx < W; tx++) {
      parede(tx, CHAO_Y, C.chao[tx % 3]);
      parede(tx, CHAO_Y + 1, rng.escolher(C.fundo)).setTint(0x9090a0);
    }

    // Plataformas geradas: barras de ferro com pontas. Só colidem por cima,
    // para o Calan as atravessar a saltar de baixo e aterrar em cima.
    this.plataformas = this.physics.add.staticGroup();
    for (const p of this.arena.plataformas) {
      for (let i = 0; i < p.largura; i++) {
        const frame = i === 0 ? C.plataforma.esq
          : i === p.largura - 1 ? C.plataforma.dir
          : C.plataforma.meio[i % 3];
        const peca = this.plataformas.create(
          (p.tx + i) * TILE + TILE / 2, p.ty * TILE + TILE / 2, 'cripta', frame);
        peca.body.setSize(TILE, 6, false).setOffset(0, 1);   // só a barra, no topo do tile
        peca.body.checkCollision.down = false;
        peca.body.checkCollision.left = false;
        peca.body.checkCollision.right = false;
      }
    }
  }

  criarColisoes() {
    this.physics.add.collider(this.calan, this.paredes);
    this.physics.add.collider(this.calan, this.plataformas);
    // As mãos caem para o chão quando o guardião morre.
    this.physics.add.collider(this.boss.maos, this.paredes);
    // Os feitiços desfazem-se nas paredes, no chão e nas plataformas (não as atravessam).
    // Nas plataformas usa-se overlap: apanha o feitiço mesmo quando sobe por baixo delas.
    this.physics.add.collider(this.feiticos, this.paredes, (f) => this.desfazerFeitico(f));
    this.physics.add.overlap(this.feiticos, this.plataformas, (f) => this.desfazerFeitico(f));

    // Dano no Calan: a caveira a cair a pique, uma mão a esmagar ou um feitiço.
    this.physics.add.overlap(this.calan, this.boss, () => {
      if (this.boss.ativo && this.boss.aCair) this.calanAtingido(this.boss.x);
    });
    this.physics.add.overlap(this.calan, this.boss.maos, (calan, mao) => {
      if (mao.perigosa) this.calanAtingido(mao.x);
    });
    this.physics.add.overlap(this.calan, this.feiticos, (calan, f) => {
      if (this.calanAtingido(f.x)) this.impacto(calan.x, calan.y - 12);   // frames 8, 9 e 10
      f.destroy();
    });
  }

  // Eventos emitidos pelo Calan e pelo Boss. Desligam-se ao sair da cena.
  ligarEventos() {
    const ev = {
      'calan-ataca': this.golpe,
      'boss-feitico': this.criarFeitico,
      'boss-furia': this.furia,
      'boss-morto': this.bossMorto,
    };
    for (const [nome, fn] of Object.entries(ev)) this.events.on(nome, fn, this);
    this.events.once('shutdown', () => {
      for (const [nome, fn] of Object.entries(ev)) this.events.off(nome, fn, this);
    });
  }

  // ---------- Combate ----------
  // Golpe do Calan: zona de dano à frente (como nas salas). O arco vem desenhado nos frames do Calan.
  golpe(calan) {
    this.sons.tocar('golpe');
    const arma = this.partida.arma;
    const lado = calan.olhaEsquerda ? -1 : 1;
    const cx = calan.x + lado * arma.alcance;
    const cy = calan.y - CENTRO_CALAN;   // meio do corpo

    const t = arma.tamanho;
    let acertou = false;
    const verificar = () => {
      if (acertou) return;
      const corpos = this.physics.overlapRect(cx - t / 2, cy - t / 2, t, t, true, false);
      if (corpos.some((c) => c.gameObject === this.boss) && this.boss.levarDano(arma.dano)) {
        acertou = true;
        this.partida.somarPontos(50);
        this.textoFlutuante(this.boss.x, this.boss.y - 28, '+50', '#ffe08a');
      }
    };
    verificar();
    this.time.delayedCall(100, verificar);   // segunda verificação a meio do golpe
  }

  // Feitiço do guardião (o Boss decide a origem, o ângulo e a velocidade).
  // O desenho (frame 6) tem o núcleo à esquerda e o rasto à direita: a origem fica
  // no núcleo e roda-se o sprite para o rasto ficar para trás do movimento.
  criarFeitico(x, y, angulo, velocidade, alvo) {
    const f = this.feiticos.create(x, y, 'boss', FRAMES_BOSS.feitico);
    f.setOrigin(30 / 64, 31 / 64).setRotation(angulo + Math.PI).setDepth(80);
    f.setScale(ESCALA_FEITICO);
    f.body.setCircle(6, 24, 25);   // círculo no núcleo (o Arcade aplica a escala ao corpo)
    f.setVelocity(Math.cos(angulo) * velocidade, Math.sin(angulo) * velocidade);
    // A meio do caminho até onde o Calan estava, ganha potência (ver update()).
    f.inicio = { x, y };
    f.metade = Phaser.Math.Distance.Between(x, y, alvo.x, alvo.y - 12) / 2;
    f.forte = false;
    this.time.delayedCall(4000, () => { if (f.active) f.destroy(); });
  }

  // Passa o feitiço à versão forte (frame 7) e acelera-o.
  potenciarFeitico(f) {
    f.forte = true;
    f.setFrame(FRAMES_BOSS.feiticoForte);
    f.setVelocity(f.body.velocity.x * POTENCIA, f.body.velocity.y * POTENCIA);
  }

  // Feitiço que bate numa parede ou plataforma: desaparece depressa.
  desfazerFeitico(f) {
    if (!f.active || f.aDesfazer) return;
    f.aDesfazer = true;
    f.body.enable = false;
    this.tweens.add({ targets: f, alpha: 0, scale: f.scale * 0.5, duration: 120, onComplete: () => f.destroy() });
  }

  // Sequência de impacto quando um feitiço acerta no Calan (frames 8, 9 e 10).
  impacto(x, y) {
    this.add.sprite(x, y, 'boss', FRAMES_BOSS.impacto[0]).setDepth(120)
      .play('feitico-impacto')
      .once('animationcomplete', function () { this.destroy(); });
  }

  // Tira 1 coração ao Calan. Devolve true se o golpe contou (não estava invulnerável).
  calanAtingido(origemX) {
    const agora = this.time.now;
    if (this.aTerminar || !this.calan.podeLevarDano(agora)) return false;
    const p = this.partida;
    p.vida -= 1;
    p.metricas.danoSofrido(1);
    this.sons.tocar('dano');
    this.cameras.main.shake(120, 0.005);
    this.calan.levarDano(agora, origemX);
    if (p.vida <= 0) this.terminar(false);
    return true;
  }

  furia() {
    this.partida.mensagem = { linhas: ['O guardião enfurece-se!'], ate: Date.now() + 1500 };
    this.cameras.main.shake(250, 0.006);
  }

  // Vitória: bónus proporcional ao fator (um boss mais difícil vale mais pontos).
  bossMorto() {
    const bonus = Math.round(3000 * this.boss.fator);
    this.partida.somarPontos(bonus);
    this.partida.bossDerrotado = true;
    this.feiticos.clear(true, true);
    this.sons.tocar('vitoria');
    this.textoFlutuante(this.boss.x, this.boss.y, `Guardião derrotado! +${bonus}`, '#9fffa8');
    this.time.delayedCall(2500, () => this.terminar(true));
  }

  // Fim da luta: vai para o ecrã de resultados.
  terminar(vitoria) {
    if (this.aTerminar && !vitoria) return;
    this.aTerminar = true;
    this.cameras.main.fadeOut(vitoria ? 600 : 400);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop('HUD');
      this.scene.start('GameOver', { vitoria });
    });
  }

  textoFlutuante(x, y, texto, cor) {
    const t = this.add.text(x, y, texto, { fontFamily: 'monospace', fontSize: '8px', color: cor, stroke: '#000', strokeThickness: 2 })
      .setOrigin(0.5).setDepth(5000).setResolution(SCALE);
    this.tweens.add({ targets: t, y: y - 14, alpha: 0, duration: 1100, delay: 400, onComplete: () => t.destroy() });
  }

  // Ciclo de jogo: Calan, guardião, feitiços e valores para o HUD.
  update(time) {
    if (!this.aTerminar) this.calan.update(time);
    this.boss.update(time, this.calan);
    for (const f of this.feiticos.getChildren()) {
      if (!f.forte && !f.aDesfazer &&
          Phaser.Math.Distance.Between(f.inicio.x, f.inicio.y, f.x, f.y) >= f.metade) {
        this.potenciarFeitico(f);
      }
    }
    this.partida.boss.vida = Math.max(0, this.boss.vida);
  }
}
