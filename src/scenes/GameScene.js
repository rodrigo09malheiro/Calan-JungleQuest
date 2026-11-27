import { TILE, SCALE, SALA_LARGURA, SALA_ALTURA, HUD_ALTURA, ECRA_LARGURA, PORTAS, OPOSTA, VIDA_CALAN, TILES, CENTRO_CALAN } from '../config.js';
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

  // Cria os inimigos da sala a partir da lista gerada pelo GeradorNivel (tipo e tile).
  // Se a sala já foi limpa numa visita anterior, não aparece ninguém.
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
      // Posição em píxeis: centro do tile em x, fundo do tile em y (origem nos pés).
      const x = def.tx * TILE + TILE / 2, y = def.ty * TILE + TILE;
      const inimigo = new Classe(this, x, y, this.cfg.velocidade);
      this.inimigos.add(inimigo);
    }
  }

  // Baú (sala do tesouro) e escada (sala de saída): só aparecem com a sala limpa.
  criarObjetos() {
    if (this.sala.limpa) this.mostrarRecompensas(false);
  }

  // Mostra o baú e/ou a escada. comEfeito = true quando a sala acaba de ser limpa
  // (aparecem com um fade); false quando o Calan volta a uma sala já limpa.
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

  // Fade-in simples: o objeto passa de invisível a visível em 400 ms.
  aparecer(obj) {
    obj.setAlpha(0);
    this.tweens.add({ targets: obj, alpha: 1, duration: 400 });
  }

  // Colisões e sobreposições (Arcade Physics):
  //  - collider: os corpos batem e não se atravessam (paredes, pedras, portas fechadas);
  //  - overlap: os corpos podem sobrepor-se e chama-se uma função (dano, mudar de sala).
  criarColisoes() {
    this.physics.add.collider(this.calan, this.paredes);
    this.physics.add.collider(this.calan, this.portasFechadas);
    this.physics.add.collider(this.inimigos, this.paredes);
    this.physics.add.collider(this.inimigos, this.portasFechadas);
    this.physics.add.collider(this.inimigos, this.inimigos);
    // Proteção extra: os inimigos nunca passam pelos vãos das portas.
    for (const zona of this.zonasPorta) this.physics.add.collider(this.inimigos, zona);

    // Tocar num inimigo ou numa bola de fogo tira vida ao Calan.
    this.physics.add.overlap(this.calan, this.inimigos, (calan, inimigo) => this.calanAtingido(inimigo.x, inimigo.y), null, this);
    this.physics.add.overlap(this.calan, this.projeteis, (calan, bola) => {
      this.calanAtingido(bola.x, bola.y);
      bola.destroy();
    }, null, this);
    // As bolas de fogo desaparecem ao bater numa parede ou porta.
    this.physics.add.collider(this.projeteis, this.paredes, (bola) => bola.destroy());
    this.physics.add.collider(this.projeteis, this.portasFechadas, (bola) => bola.destroy());

    // Pisar o vão de uma porta aberta leva à sala vizinha.
    for (const zona of this.zonasPorta) {
      this.physics.add.overlap(this.calan, zona, () => this.mudarSala(zona.direcao), null, this);
    }
  }

  // ---------- Combate ----------
  // Chamado pelo evento 'calan-ataca' (emitido em Calan.atacar()).
  // O alcance, a zona e o dano dependem da arma: mãos ou espada (ARMAS em config.js).
  // O desenho do golpe (com o arco) está nos frames de ataque do Calan; aqui só se trata do dano.
  golpe(calan) {
    this.sons.tocar('golpe');
    const arma = this.partida.arma;
    const d = calan.vetorDirecao();
    // Centro do golpe: à frente do Calan, a partir do meio do corpo (os pés estão em calan.y).
    const meioY = calan.y - CENTRO_CALAN;
    const cx = calan.x + d.x * arma.alcance;
    const cy = meioY + d.y * arma.alcance;

    // Zona de dano: quadrado à frente do Calan. Cada inimigo só leva 1 golpe por ataque.
    // Só contam os corpos do grupo dos inimigos: a zona também toca no próprio Calan
    // (sobretudo no golpe para baixo) e ele não se pode atingir a si mesmo.
    const t = arma.tamanho;
    const atingidos = new Set();
    const verificar = () => {
      const corpos = this.physics.overlapRect(cx - t / 2, cy - t / 2, t, t, true, false);
      for (const corpo of corpos) {
        const alvo = corpo.gameObject;
        if (alvo && this.inimigos.contains(alvo) && !atingidos.has(alvo)) {
          atingidos.add(alvo);
          alvo.levarDano(arma.dano, calan.x, calan.y - 8);
        }
      }
    };
    verificar();
    this.time.delayedCall(100, verificar);   // segunda verificação a meio do golpe
  }

  // Chamado pelo evento 'olho-dispara': cria uma bola de fogo apontada ao Calan.
  disparar(olho) {
    if (!this.calan.active) return;
    this.sons.tocar('fogo');
    const bola = this.projeteis.create(olho.x, olho.y - 10, 'bola_fogo');
    bola.body.setCircle(3, 1, 1);
    bola.setDepth(2000);
    const v = new Phaser.Math.Vector2(this.calan.x - olho.x, this.calan.y - 8 - (olho.y - 10)).normalize().scale(90 * this.cfg.velocidade);
    bola.setVelocity(v.x, v.y);
    this.time.delayedCall(3000, () => bola.destroy());   // não fica a voar para sempre
  }

  // O Calan levou dano vindo do ponto (ox, oy). Ignora se estiver invulnerável
  // (pisca durante 1 s depois de cada golpe) ou se a cena estiver a mudar de sala.
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

  // Chamado pelo evento 'inimigo-morto' (Inimigo.morrer()): pontos, métricas e,
  // se era o último inimigo, a sala fica limpa.
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

  // O Calan tocou no baú: +500 pontos, +1 coração e conta para as métricas (estilo cauteloso).
  // O baú do nível 1 guarda também a espada (é opcional: fica num beco sem saída).
  abrirBau() {
    if (this.sala.tesouroApanhado) return;
    this.sala.tesouroApanhado = true;
    this.sons.tocar('tesouro');
    this.partida.somarPontos(500);
    this.partida.metricas.tesouro();
    // Um tesouro também recupera 1 coração.
    this.partida.vida = Math.min(this.partida.vida + 1, VIDA_CALAN);
    this.textoFlutuante(CENTRO_X, CENTRO_Y - 24, 'Tesouro! +500', '#ffd34d');
    if (this.partida.nivel === 0 && !this.partida.temEspada) this.encontrarEspada();
    this.bau.destroy();
  }

  // A espada sai do baú e sobe por cima do Calan; a partir daqui
  // os golpes têm mais alcance e o dobro do dano.
  encontrarEspada() {
    this.partida.temEspada = true;
    this.sons.tocar('vitoria');
    this.partida.mensagem = {
      linhas: ['Encontraste a espada!', 'Mais alcance e o dobro do dano'],
      ate: Date.now() + 2500,
      y: 560,   // em baixo, para não tapar a espada a subir (o baú fica no centro)
    };
    const espada = this.add.image(CENTRO_X, CENTRO_Y - 8, 'efeitos_calan', 0).setDepth(5000);
    this.tweens.add({
      targets: espada, x: this.calan.x, y: this.calan.y - 40, duration: 600, ease: 'Sine.easeOut',
      onComplete: () => this.tweens.add({
        targets: espada, alpha: 0, delay: 900, duration: 400, onComplete: () => espada.destroy(),
      }),
    });
  }

  // ---------- Mudança de sala e de nível ----------
  // Passa para a sala vizinha na direção dir. Só funciona com a sala limpa.
  // A cena é reiniciada e desenha a sala nova; o Calan aparece na porta oposta.
  mudarSala(dir) {
    if (!this.sala.limpa || this.aMudar) return;
    this.aMudar = true;
    this.partida.salaAtual = this.sala.vizinhos[dir];
    this.partida.entradaPor = OPOSTA[dir];
    this.calan.setVelocity(0, 0);
    this.cameras.main.fadeOut(150);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.restart());
  }

  // O Calan pisou a escada da sala de saída: passa ao nível seguinte (gerado de novo)
  // ou, no último nível, desce para a arena do boss.
  descer() {
    if (this.aMudar) return;
    this.aMudar = true;
    this.sons.tocar('nivel');
    this.partida.somarPontos(1000);
    this.calan.setVelocity(0, 0);
    this.cameras.main.fadeOut(500);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      if (this.partida.ultimoNivel) {
        this.scene.start('Boss');   // depois do último nível: luta com o guardião
      } else {
        this.partida.iniciarNivel(this.partida.nivel + 1);
        this.scene.restart();
      }
    });
  }

  // Fim da partida: pára a física, fecha o HUD e abre o ecrã de resultados.
  fimDeJogo(vitoria) {
    this.aMudar = true;
    this.physics.pause();
    this.time.delayedCall(vitoria ? 0 : 600, () => {
      this.scene.stop('HUD');
      this.scene.start('GameOver', { vitoria });
    });
  }

  // Texto pequeno que sobe e desaparece (ex.: "+100" quando um inimigo morre).
  textoFlutuante(x, y, texto, cor) {
    const t = this.add.text(x, y, texto, { fontFamily: 'monospace', fontSize: '8px', color: cor, stroke: '#000', strokeThickness: 2 })
      .setOrigin(0.5).setDepth(5000).setResolution(SCALE);
    this.tweens.add({ targets: t, y: y - 12, alpha: 0, duration: 900, delay: 300, onComplete: () => t.destroy() });
  }

  // Ciclo de jogo: o Phaser chama update() a cada frame (~60 vezes por segundo).
  update(time) {
    this.calan.update(time);
    for (const inimigo of this.inimigos.getChildren()) inimigo.update(time, this.calan);
  }
}
