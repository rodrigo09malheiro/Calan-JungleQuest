import { ECRA_LARGURA } from '../config.js';
import Partida from '../sistemas/Partida.js';

// Ecrã inicial com título e instruções.
export default class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    const cx = ECRA_LARGURA / 2;
    this.add.text(cx, 130, 'Calan: Jungle Quest', { fontSize: '48px', color: '#ffffff' }).setOrigin(0.5);
    this.add.text(cx, 190, 'As ruínas mudam a cada entrada.', { fontSize: '20px', color: '#9fd8a8' }).setOrigin(0.5);
    this.add.text(cx, 360, [
      'Setas ou WASD: andar',
      'ESPAÇO ou J: atacar com a espada',
      '',
      'Derrota os inimigos para abrir as portas.',
      'Encontra o tesouro e desce a escada da última sala.',
      '',
      'Prime ENTER para jogar',
    ], { fontSize: '22px', color: '#cfd8dc', align: 'center' }).setOrigin(0.5);

    this.input.keyboard.once('keydown-ENTER', () => {
      // Nova partida: gera o nível 1 a partir de uma semente nova.
      this.registry.set('partida', new Partida(Partida.sementeInicial()));
      this.scene.start('Game');
    });
  }
}
