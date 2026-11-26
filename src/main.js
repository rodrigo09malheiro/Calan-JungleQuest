import { ECRA_LARGURA, ECRA_ALTURA } from './config.js';
import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';
import HUDScene from './scenes/HUDScene.js';
import GameOverScene from './scenes/GameOverScene.js';

// Configuração principal do Phaser.
const config = {
  type: Phaser.AUTO,
  parent: 'jogo',
  width: ECRA_LARGURA,
  height: ECRA_ALTURA,
  backgroundColor: '#1b1b26',
  pixelArt: true,                       // sem suavização: os píxeis ficam nítidos
  physics: {
    default: 'arcade',                  // física Arcade (exigida pelo enunciado)
    arcade: { gravity: { y: 0 }, debug: false },   // vista de cima: sem gravidade
  },
  scale: {
    mode: Phaser.Scale.FIT,             // ajusta à janela
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, MenuScene, GameScene, HUDScene, GameOverScene],
};

// window.jogo permite inspecionar o jogo na consola do navegador (depuração).
window.jogo = new Phaser.Game(config);
