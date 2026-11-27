import { ECRA_LARGURA } from '../config.js';
import Partida from '../sistemas/Partida.js';
import Toque from '../sistemas/Toque.js';

// Ecrã inicial com título e instruções.
export default class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    const cx = ECRA_LARGURA / 2;
    this.add.text(cx, 130, 'Calan: Jungle Quest', { fontSize: '48px', color: '#ffffff' }).setOrigin(0.5);
    this.add.text(cx, 190, 'As ruínas mudam a cada entrada.', { fontSize: '20px', color: '#9fd8a8' }).setOrigin(0.5);
    // No telemóvel as instruções falam dos comandos táteis; no PC, do teclado.
    const controlos = Toque.ativo
      ? ['Joystick (lado esquerdo): andar', 'Botão ATACAR: atacar', 'No guardião: botão SALTAR']
      : ['Setas ou WASD: andar', 'ESPAÇO ou J: atacar com a espada', 'No guardião: CIMA ou W para saltar'];
    this.add.text(cx, 360, [
      ...controlos,
      '',
      'Derrota os inimigos para abrir as portas.',
      'Há uma espada escondida num baú do nível 1.',
      'Encontra o tesouro, desce as escadas e derrota o guardião.',
      '',
      Toque.ativo ? 'Toca no ecrã para jogar' : 'Prime ENTER para jogar',
    ], { fontSize: '22px', color: '#cfd8dc', align: 'center' }).setOrigin(0.5);

    // Nova partida: gera o nível 1 a partir de uma semente nova.
    this.input.keyboard.once('keydown-ENTER', () => Partida.comecar(this));
    // (Espera um instante: o dedo que tocou em MENU durante o jogo ainda pode estar a ser largado.)
    if (Toque.ativo) {
      this.time.delayedCall(400, () => this.input.once('pointerup', () => {
        ecraInteiro(this);
        Partida.comecar(this);
      }));
    }
  }
}

// No telemóvel, joga em ecrã inteiro e na horizontal (se o navegador deixar;
// no iPhone o Safari não deixa, e o jogo continua normalmente).
export function ecraInteiro(scene) {
  if (!scene.scale.isFullscreen && scene.sys.game.device.fullscreen.available) {
    try { scene.scale.startFullscreen(); } catch (e) { /* sem ecrã inteiro */ }
  }
  if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {});
}
