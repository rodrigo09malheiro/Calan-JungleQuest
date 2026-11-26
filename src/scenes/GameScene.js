import { TILE, SCALE, SALA_LARGURA, SALA_ALTURA, HUD_ALTURA, ECRA_LARGURA, PORTAS, OPOSTA, VIDA_CALAN, TILES } from '../config.js';
import Aleatorio from '../sistemas/Aleatorio.js';
import Calan from '../entities/Calan.js';
import Slime from '../entities/Slime.js';
import Olho from '../entities/Olho.js';
import Sons from '../sistemas/Sons.js';

const CLASSES_INIMIGO = { slime: Slime, olho: Olho };

// Centro da sala, em píxeis de arte (o Calan, a escada e o baú ficam aqui).
const CENTRO_X = 10 * TILE;
const CENTRO_Y = 7 * TILE;

// Onde o Calan aparece quando entra por cada porta (posição dos pés).
const ENTRADAS = {
  cima:  { x: CENTRO_X, y: 2 * TILE + 6 },
  baixo: { x: CENTRO_X, y: (SALA_ALTURA - 1) * TILE - 2 },
  esq:   { x: 2 * TILE, y: 7 * TILE - 2 },
  dir:   { x: (SALA_LARGURA - 2) * TILE, y: 7 * TILE - 2 },
};

// Uma sala do nível. A cena é reiniciada sempre que o Calan muda de sala;
// o estado da partida (mapa, vida, pontos) vive na Partida, guardada no registry.
export default class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  create() {
    this.partida = this.registry.get('partida');
    this.sala = this.partida.sala;
    this.cfg = this.partida.cfg;
    this.sons = new Sons(this);
    this.aMudar = false;          // evita mudar de sala duas vezes seguidas
    this.inicioSala = this.time.now;
    this.danoNestaSala = 0;

    // Primeira visita à sala de entrada de um nível: mostra o nome do nível.
    if (this.sala.tipo === 'inicio' && !this.sala.visitada) {
      this.partida.mensagem = { texto: `Nível ${this.partida.nivel + 1}: ${this.cfg.nome}`, ate: Date.now() + 2500 };
    }
    this.sala.visitada = true;

    this.desenharSala();

    // O Calan entra pela porta oposta àquela por onde saiu (ou no centro, no início do nível).
    const pos = this.partida.entradaPor ? ENTRADAS[this.partida.entradaPor] : { x: CENTRO_X, y: CENTRO_Y + 12 };
    this.calan = new Calan(this, pos.x, pos.y);

    this.criarInimigos();
    this.criarObjetos();
    this.criarColisoes();

    this.events.on('calan-ataca', this.golpe, this);
    this.events.on('inimigo-morto', this.inimigoMorto, this);
    this.events.on('olho-dispara', this.disparar, this);
    // Os eventos da cena sobrevivem ao restart: é preciso desligá-los ao sair da sala.
    this.events.once('shutdown', () => {
      this.events.off('calan-ataca', this.golpe, this);
      this.events.off('inimigo-morto', this.inimigoMorto, this);
      this.events.off('olho-dispara', this.disparar, this);
    });

    // Câmara: zoom inteiro (pixel art nítida), por baixo da faixa do HUD.
    const cam = this.cameras.main;
    cam.setViewport(0, HUD_ALTURA, ECRA_LARGURA, SALA_ALTURA * TILE * SCALE);
    cam.setZoom(SCALE);
    cam.centerOn((SALA_LARGURA * TILE) / 2, (SALA_ALTURA * TILE) / 2);
    cam.fadeIn(150);

    // O HUD é uma cena à parte, por cima desta, sem zoom.
    if (!this.scene.isActive('HUD')) this.scene.launch('HUD');

    // ESC volta ao menu.
    this.input.keyboard.once('keydown-ESC', () => {
      this.scene.stop('HUD');
      this.scene.start('Menu');
    });
  }

  // ---------- Sala ----------
  // Desenha a sala com os tiles do cenário (assets/cenario/tiles.png).
  // As variações (que tile de relva, que rocha, onde há plantas) vêm de um gerador
  // com semente própria da sala: a mesma sala tem sempre o mesmo aspeto.
  desenharSala() {
    const cen = this.cfg.cenario;
    const rng = new Aleatorio(this.partida.semente * 97 + this.partida.nivel * 1009 + this.sala.id);
    const variacao = (tipo) => TILES[tipo].inicio + rng.inteiro(0, TILES[tipo].n - 1);

    this.paredes = this.physics.add.staticGroup();
    const g = this.sala.grelha;

    for (let ty = 0; ty < SALA_ALTURA; ty++) {
      for (let tx = 0; tx < SALA_LARGURA; tx++) {
        const x = tx * TILE + TILE / 2;
        const y = ty * TILE + TILE / 2;
        const t = g[ty][tx];
        if (t === 1) {
          // Parede: a de cima mostra a face do muro (vista de frente), as outras o topo.
          const frame = variacao(ty === 0 ? cen.base : cen.muro);
          this.paredes.create(x, y, 'tiles', frame);   // cria a imagem e o corpo estático
          continue;
        }
        this.add.image(x, y, 'tiles', variacao(cen.chao)).setDepth(-1000);
        if (t === 2) {
          // Pedra: uma rocha do nível, ordenada pela base (o Calan pode passar "por trás").
          const pedra = this.paredes.create(x, y, 'tiles', rng.escolher(cen.rochas));
          pedra.setDepth(y + TILE / 2);
        } else if (rng.chance(cen.plantas)) {
          // Decoração sem colisão: ervas e flores pelo chão.
          this.add.image(x, y, 'tiles', variacao('planta')).setDepth(-900);
        }
      }
    }

    // Portas: enquanto houver inimigos, ficam fechadas (bloqueiam a passagem).
    this.portasFechadas = this.physics.add.staticGroup();
    this.zonasPorta = [];
    for (const [dir, tiles] of Object.entries(PORTAS)) {
      if (this.sala.vizinhos[dir] === null) continue;
      for (const [tx, ty] of tiles) {
        const x = tx * TILE + TILE / 2, y = ty * TILE + TILE / 2;
        if (!this.sala.limpa) {
          this.portasFechadas.create(x, y, 'tiles', TILES.porta.inicio);
        }
        // Zona invisível no vão da porta: ao pisá-la, o Calan passa para a sala vizinha.
        const zona = this.add.zone(x, y, TILE, TILE);
        this.physics.add.existing(zona, true);
        zona.direcao = dir;
        this.zonasPorta.push(zona);
      }
    }
  }

  criarInimigos() {
    // Atenção: no restart o Phaser reutiliza o MESMO objeto da cena, por isso todos os
    // grupos e objetos têm de ser criados de novo aqui (senão ficam os da sala anterior).
    this.inimigos = this.physics.add.group();
    this.projeteis = this.physics.add.group();
    this.bau = null;
    this.escada = null;
    if (this.sala.limpa) return;
    for (const def of this.sala.inimigos) {
      const Classe = CLASSES_INIMIGO[def.tipo];
      const x = def.tx * TILE + TILE / 2, y = def.ty * TILE + TILE;
      const inimigo = new Classe(this, x, y, this.cfg.velocidade);
      this.inimigos.add(inimigo);
    }
  }

  // Baú (sala do tesouro) e escada (sala de saída): só aparecem com a sala limpa.
  criarObjetos() {
    if (this.sala.limpa) this.mostrarRecompensas(false);
  }

  mostrarRecompensas(comEfeito) {
    if (this.sala.tipo === 'tesouro' && !this.sala.tesouroApanhado) {
      this.bau = this.physics.add.staticImage(CENTRO_X, CENTRO_Y - 4, 'bau').setDepth(CENTRO_Y);
      this.physics.add.overlap(this.calan, this.bau, this.abrirBau, null, this);
      if (comEfeito) this.aparecer(this.bau);
    }
    if (this.sala.tipo === 'saida') {
      this.escada = this.physics.add.staticImage(CENTRO_X, CENTRO_Y - 8, 'escada').setDepth(-500);
      this.escada.body.setSize(12, 12);   // só conta quando o Calan pisa o meio
      this.physics.add.overlap(this.calan, this.escada, this.descer, null, this);
      if (comEfeito) this.aparecer(this.escada);
    }
  }

  aparecer(obj) {
    obj.setAlpha(0);
    this.tweens.add({ targets: obj, alpha: 1, duration: 400 });
  }

  criarColisoes() {
    this.physics.add.collider(this.calan, this.paredes);
    this.physics.add.collider(this.calan, this.portasFechadas);
    this.physics.add.collider(this.inimigos, this.paredes);
    this.physics.add.collider(this.inimigos, this.portasFechadas);
    this.physics.add.collider(this.inimigos, this.inimigos);
    // Proteção extra: os inimigos nunca passam pelos vãos das portas.
    for (const zona of this.zonasPorta) this.physics.add.collider(this.inimigos, zona);

    this.physics.add.overlap(this.calan, this.inimigos, (calan, inimigo) => this.calanAtingido(inimigo.x, inimigo.y), null, this);
    this.physics.add.overlap(this.calan, this.projeteis, (calan, bola) => {
      this.calanAtingido(bola.x, bola.y);
      bola.destroy();
    }, null, this);
    this.physics.add.collider(this.projeteis, this.paredes, (bola) => bola.destroy());
    this.physics.add.collider(this.projeteis, this.portasFechadas, (bola) => bola.destroy());

    for (const zona of this.zonasPorta) {
      this.physics.add.overlap(this.calan, zona, () => this.mudarSala(zona.direcao), null, this);
    }
  }

  // ---------- Combate ----------
  golpe(calan) {
    this.sons.tocar('golpe');
    const d = calan.vetorDirecao();
    // Centro do golpe: à frente do Calan, à altura do corpo.
    const cx = calan.x + d.x * 14;
    const cy = calan.y - 9 + d.y * 13;

    // Efeito visual: o arco da espada, rodado para a direção do golpe.
    const angulo = d.x > 0 ? 0 : d.x < 0 ? 180 : d.y > 0 ? 90 : -90;
    const arco = this.add.image(cx, cy, 'efeitos_calan', 2).setAngle(angulo).setDepth(calan.y + 1);
    this.tweens.add({ targets: arco, alpha: 0, duration: 200, onComplete: () => arco.destroy() });

    // Zona de dano: retângulo à frente do Calan. Cada inimigo só leva 1 golpe por ataque.
    const largura = d.x !== 0 ? 20 : 26;
    const altura = d.x !== 0 ? 22 : 18;
    const atingidos = new Set();
    const verificar = () => {
      const corpos = this.physics.overlapRect(cx - largura / 2, cy - altura / 2, largura, altura, true, false);
      for (const corpo of corpos) {
        const alvo = corpo.gameObject;
        if (alvo && alvo.levarDano && !atingidos.has(alvo)) {
          atingidos.add(alvo);
          alvo.levarDano(1, calan.x, calan.y - 8);
        }
      }
    };
    verificar();
    this.time.delayedCall(100, verificar);   // segunda verificação a meio do golpe
  }

  disparar(olho) {
    if (!this.calan.active) return;
    this.sons.tocar('fogo');
    const bola = this.projeteis.create(olho.x, olho.y - 10, 'bola_fogo');
    bola.body.setCircle(3, 1, 1);
    bola.setDepth(2000);
    const v = new Phaser.Math.Vector2(this.calan.x - olho.x, this.calan.y - 8 - (olho.y - 10)).normalize().scale(90 * this.cfg.velocidade);
    bola.setVelocity(v.x, v.y);
    this.time.delayedCall(3000, () => bola.destroy());
  }

  calanAtingido(ox, oy) {
    const agora = this.time.now;
    if (!this.calan.podeLevarDano(agora) || this.aMudar) return;
    this.partida.vida -= 1;
    this.partida.metricas.danoSofrido(1);
    this.danoNestaSala += 1;
    this.sons.tocar('dano');
    this.cameras.main.shake(120, 0.004);
    this.calan.levarDano(agora, ox, oy);
    if (this.partida.vida <= 0) this.fimDeJogo(false);
  }

  inimigoMorto(inimigo) {
    this.sons.tocar('inimigo_morre');
    this.partida.somarPontos(inimigo.pontos);
    this.partida.metricas.inimigoDerrotado();
    this.textoFlutuante(inimigo.x, inimigo.y - 20, `+${inimigo.pontos}`, '#ffe08a');

    const vivos = this.inimigos.getChildren().filter((e) => !e.morto);
    if (vivos.length === 0) this.salaLimpa();
  }

  // Todos os inimigos derrotados: abre as portas e dá o bónus de rapidez e de pouco dano.
  salaLimpa() {
    this.sala.limpa = true;
    const segundos = (this.time.now - this.inicioSala) / 1000;
    this.partida.metricas.salaLimpa(segundos);

    const bonusTempo = Math.max(0, Math.round(300 - segundos * 10));
    const bonusVida = this.danoNestaSala === 0 ? 100 : 0;
    const bonus = bonusTempo + bonusVida;
    if (bonus > 0) {
      this.partida.somarPontos(bonus);
      this.textoFlutuante(CENTRO_X, CENTRO_Y - 30, `Sala limpa! +${bonus}`, '#9fffa8');
    }

    this.time.delayedCall(250, () => {
      this.sons.tocar('porta');
      this.portasFechadas.clear(true, true);   // remove os blocos das portas
      this.projeteis.clear(true, true);
      this.mostrarRecompensas(true);
    });
  }

  abrirBau() {
    if (this.sala.tesouroApanhado) return;
    this.sala.tesouroApanhado = true;
    this.sons.tocar('tesouro');
    this.partida.somarPontos(500);
    this.partida.metricas.tesouro();
    // Um tesouro também recupera 1 coração.
    this.partida.vida = Math.min(this.partida.vida + 1, VIDA_CALAN);
    this.textoFlutuante(CENTRO_X, CENTRO_Y - 24, 'Tesouro! +500', '#ffd34d');
    this.bau.destroy();
  }

  // ---------- Mudança de sala e de nível ----------
  mudarSala(dir) {
    if (!this.sala.limpa || this.aMudar) return;
    this.aMudar = true;
    this.partida.salaAtual = this.sala.vizinhos[dir];
    this.partida.entradaPor = OPOSTA[dir];
    this.calan.setVelocity(0, 0);
    this.cameras.main.fadeOut(150);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.restart());
  }

  descer() {
    if (this.aMudar) return;
    this.aMudar = true;
    this.sons.tocar('nivel');
    this.partida.somarPontos(1000);
    this.calan.setVelocity(0, 0);
    this.cameras.main.fadeOut(500);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      if (this.partida.ultimoNivel) {
        this.fimDeJogo(true);   // o boss entra aqui numa fase seguinte
      } else {
        this.partida.iniciarNivel(this.partida.nivel + 1);
        this.scene.restart();
      }
    });
  }

  fimDeJogo(vitoria) {
    this.aMudar = true;
    this.physics.pause();
    this.time.delayedCall(vitoria ? 0 : 600, () => {
      this.scene.stop('HUD');
      this.scene.start('GameOver', { vitoria });
    });
  }

  textoFlutuante(x, y, texto, cor) {
    const t = this.add.text(x, y, texto, { fontFamily: 'monospace', fontSize: '8px', color: cor, stroke: '#000', strokeThickness: 2 })
      .setOrigin(0.5).setDepth(5000).setResolution(SCALE);
    this.tweens.add({ targets: t, y: y - 12, alpha: 0, duration: 900, delay: 300, onComplete: () => t.destroy() });
  }

  update(time) {
    this.calan.update(time);
    for (const inimigo of this.inimigos.getChildren()) inimigo.update(time, this.calan);
  }
}
