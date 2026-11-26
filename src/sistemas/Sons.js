// Efeitos sonoros. Os ficheiros são carregados na BootScene (assets/sons/*.wav)
// e gerados pelo script ferramentas/gerar_sons.py.
export const LISTA_SONS = ['golpe', 'acerto', 'inimigo_morre', 'dano', 'porta', 'tesouro', 'fogo', 'nivel'];

export default class Sons {
  constructor(scene) {
    this.scene = scene;
    this.volume = 0.5;
  }

  tocar(nome) {
    this.scene.sound.play(nome, { volume: this.volume });
  }
}
