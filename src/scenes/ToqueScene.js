import { ECRA_LARGURA, ECRA_ALTURA, HUD_ALTURA } from '../config.js';
import Toque from '../sistemas/Toque.js';

// Comandos táteis por cima do jogo (só em telemóvel/tablet; no PC esta cena nunca abre).
// É aberta pelo HUD e fecha com ele, por isso existe durante as salas e a luta com o boss.
//  - metade esquerda do ecrã: joystick (aparece onde o dedo toca)
//  - direita: botão ATACAR e, só na luta com o boss, o botão SALTAR
//  - canto superior direito: botão MENU (toque duplo, para não sair sem querer)

const RAIO_JOYSTICK = 64;       // quanto o manípulo se afasta da base (píxeis do ecrã)
const ZONA_MORTA = 0.2;         // movimentos mais pequenos do que isto são ignorados
const BASE_JOYSTICK = { x: 130, y: ECRA_ALTURA - 120 };   // posição de repouso
const BOTOES = {
  atacar: { x: ECRA_LARGURA - 95, y: ECRA_ALTURA - 115, raio: 54, texto: 'ATACAR', cor: 0xe0414f },
  saltar: { x: ECRA_LARGURA - 215, y: ECRA_ALTURA - 70, raio: 46, texto: 'SALTAR', cor: 0x6fa8dc },
};
const MENU = { x: ECRA_LARGURA - 52, y: HUD_ALTURA + 30, largura: 76, altura: 36 };
const ALPHA_SOLTO = 0.35;
const ALPHA_PREMIDO = 0.75;

export default class ToqueScene extends Phaser.Scene {
  constructor() { super('Toque'); }

  create() {
    Toque.limpar();
    this.dedoJoystick = null;     // id do dedo que está no joystick
    this.dedosBotao = {};         // id do dedo -> nome do botão que está a premir
    this.menuConfirmarAte = 0;

    // Joystick: base e manípulo.
    this.baseJoy = this.add.circle(BASE_JOYSTICK.x, BASE_JOYSTICK.y, RAIO_JOYSTICK + 16, 0xffffff, 0.12)
      .setStrokeStyle(3, 0xffffff, 0.4);
    this.manipulo = this.add.circle(BASE_JOYSTICK.x, BASE_JOYSTICK.y, 34, 0xffffff, ALPHA_SOLTO);

    // Botões redondos com o nome por cima.
    this.botoes = {};
    for (const [nome, b] of Object.entries(BOTOES)) {
      const circulo = this.add.circle(b.x, b.y, b.raio, b.cor, ALPHA_SOLTO).setStrokeStyle(3, 0xffffff, 0.6);
      const texto = this.add.text(b.x, b.y, b.texto, {
        fontFamily: 'monospace', fontSize: '17px', color: '#ffffff', stroke: '#000000', strokeThickness: 3,
      }).setOrigin(0.5);
      this.botoes[nome] = { ...b, circulo, texto };
    }

    // Botão MENU (substitui o ESC).
    this.fundoMenu = this.add.rectangle(MENU.x, MENU.y, MENU.largura, MENU.altura, 0x000000, 0.45)
      .setStrokeStyle(2, 0xffffff, 0.6);
    this.txtMenu = this.add.text(MENU.x, MENU.y, 'MENU', {
      fontFamily: 'monospace', fontSize: '16px', color: '#ffffff',
    }).setOrigin(0.5);
    this.txtConfirmar = this.add.text(MENU.x - MENU.largura / 2 - 10, MENU.y, 'Toca outra vez para sair', {
      fontFamily: 'monospace', fontSize: '15px', color: '#ffe08a', stroke: '#000000', strokeThickness: 3,
    }).setOrigin(1, 0.5).setVisible(false);

    this.input.on('pointerdown', this.premir, this);
    this.input.on('pointermove', this.mover, this);
    this.input.on('pointerup', this.largar, this);
    this.input.on('pointerupoutside', this.largar, this);
    this.events.once('shutdown', () => {
      this.input.off('pointerdown', this.premir, this);
      this.input.off('pointermove', this.mover, this);
      this.input.off('pointerup', this.largar, this);
      this.input.off('pointerupoutside', this.largar, this);
      Toque.limpar();
    });
  }

  // O botão SALTAR só faz falta na luta com o boss (vista lateral).
  emLuta() {
    return this.scene.isActive('Boss');
  }

  premir(pointer) {
    const { x, y } = pointer;

    // MENU: o primeiro toque pede confirmação, o segundo sai.
    if (Math.abs(x - MENU.x) <= MENU.largura / 2 + 8 && Math.abs(y - MENU.y) <= MENU.altura / 2 + 8) {
      if (this.time.now < this.menuConfirmarAte) this.sairParaMenu();
      else this.menuConfirmarAte = this.time.now + 2000;
      return;
    }

    // Botões (com uma margem à volta, porque o dedo não é preciso).
    for (const [nome, b] of Object.entries(this.botoes)) {
      if (nome === 'saltar' && !this.emLuta()) continue;
      if (Phaser.Math.Distance.Between(x, y, b.x, b.y) <= b.raio + 18) {
        this.dedosBotao[pointer.id] = nome;
        Toque[nome] = true;
        Toque.pedidos[nome] = true;
        return;
      }
    }

    // Joystick: qualquer toque na metade esquerda (abaixo do HUD) põe lá a base.
    if (this.dedoJoystick === null && x < ECRA_LARGURA / 2 && y > HUD_ALTURA) {
      this.dedoJoystick = pointer.id;
      // A base não sai do ecrã, para o manípulo ter espaço para todos os lados.
      const m = RAIO_JOYSTICK + 16;
      this.baseJoy.setPosition(Phaser.Math.Clamp(x, m, ECRA_LARGURA / 2 - m), Phaser.Math.Clamp(y, HUD_ALTURA + m, ECRA_ALTURA - m));
      this.mover(pointer);
    }
  }

  mover(pointer) {
    if (pointer.id !== this.dedoJoystick) return;
    const dx = pointer.x - this.baseJoy.x;
    const dy = pointer.y - this.baseJoy.y;
    const dist = Math.hypot(dx, dy);
    const lim = Math.min(dist, RAIO_JOYSTICK);
    const ang = Math.atan2(dy, dx);
    this.manipulo.setPosition(this.baseJoy.x + Math.cos(ang) * lim, this.baseJoy.y + Math.sin(ang) * lim);

    // Intensidade de 0 a 1: abaixo da zona morta fica parado; a 75% do raio já é velocidade máxima.
    const forca = Phaser.Math.Clamp((lim / RAIO_JOYSTICK - ZONA_MORTA) / (0.75 - ZONA_MORTA), 0, 1);
    Toque.x = forca * Math.cos(ang);
    Toque.y = forca * Math.sin(ang);
  }

  largar(pointer) {
    if (pointer.id === this.dedoJoystick) {
      this.dedoJoystick = null;
      Toque.x = 0;
      Toque.y = 0;
      this.baseJoy.setPosition(BASE_JOYSTICK.x, BASE_JOYSTICK.y);
      this.manipulo.setPosition(BASE_JOYSTICK.x, BASE_JOYSTICK.y);
    }
    const nome = this.dedosBotao[pointer.id];
    if (nome) {
      delete this.dedosBotao[pointer.id];
      // Só larga o botão se nenhum outro dedo o estiver a premir.
      if (!Object.values(this.dedosBotao).includes(nome)) Toque[nome] = false;
    }
  }

  // Igual ao ESC: fecha a cena de jogo e o HUD (que fecha esta cena) e volta ao menu.
  sairParaMenu() {
    const jogo = this.scene.isActive('Boss') ? 'Boss' : 'Game';
    this.scene.stop(jogo);
    this.scene.stop('HUD');
    this.scene.start('Menu');
  }

  // Aspeto dos comandos: mais opacos enquanto premidos.
  update() {
    const luta = this.emLuta();
    this.botoes.saltar.circulo.setVisible(luta);
    this.botoes.saltar.texto.setVisible(luta);
    if (!luta) Toque.saltar = false;
    for (const [nome, b] of Object.entries(this.botoes)) b.circulo.setFillStyle(b.cor, Toque[nome] ? ALPHA_PREMIDO : ALPHA_SOLTO);

    const aMexer = this.dedoJoystick !== null;
    this.baseJoy.setAlpha(aMexer ? 1 : 0.7);
    this.manipulo.setFillStyle(0xffffff, aMexer ? ALPHA_PREMIDO : ALPHA_SOLTO);

    this.txtConfirmar.setVisible(this.time.now < this.menuConfirmarAte);
  }
}
