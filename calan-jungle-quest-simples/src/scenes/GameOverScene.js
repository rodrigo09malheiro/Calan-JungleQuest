import { ECRA_LARGURA, VIDA_CALAN } from '../config.js';
import Partida from '../sistemas/Partida.js';
import Recordes from '../sistemas/Recordes.js';

// Resultados: pontuação final, avaliação do desempenho e melhores pontuações.
export default class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOver'); }

  create(data) {
    const cx = ECRA_LARGURA / 2;
    const p = this.registry.get('partida');
    const vitoria = data && data.vitoria;

    this.add.text(cx, 80, vitoria ? 'Ruínas atravessadas!' : 'Game Over', {
      fontSize: '52px', color: vitoria ? '#9fffa8' : '#ff6b6b',
    }).setOrigin(0.5);
    this.add.text(cx, 150, `Pontuação: ${p.pontuacao}`, { fontSize: '32px', color: '#ffe08a' }).setOrigin(0.5);

    // Resumo do desempenho (é isto que vai decidir a variante do boss).
    const t = p.metricas.total();
    const a = p.metricas.avaliar(Math.max(p.vida, 0), VIDA_CALAN);
    const linhas = [
      `Inimigos derrotados: ${t.inimigos}   Tesouros: ${t.tesouros}   Dano sofrido: ${t.dano}`,
      `Tempo médio por sala: ${a.tempoPorSala.toFixed(1)} s   Estilo: ${a.estilo}`,
    ];
    if (vitoria) linhas.push(`Guardião previsto: ${a.variante} (x${a.fator})  ·  luta com o boss em breve`);
    this.add.text(cx, 220, linhas, { fontSize: '18px', color: '#cfd8dc', align: 'center' }).setOrigin(0.5, 0);

    // Recordes (localStorage).
    const posicao = Recordes.guardar(p.pontuacao, p.semente);
    const recordes = Recordes.ler();
    this.add.text(cx, 330, 'Melhores pontuações', { fontSize: '24px', color: '#ffffff' }).setOrigin(0.5);
    recordes.forEach((r, i) => {
      const cor = i === posicao ? '#ffe08a' : '#aab4bf';
      this.add.text(cx, 370 + i * 30, `${i + 1}.  ${String(r.pontos).padStart(6)}   ${r.data}   seed ${r.semente}`,
        { fontFamily: 'monospace', fontSize: '20px', color: cor }).setOrigin(0.5);
    });

    this.add.text(cx, 560, 'ENTER: jogar de novo    M: menu', { fontSize: '24px', color: '#ffffff' }).setOrigin(0.5);
    this.input.keyboard.once('keydown-ENTER', () => {
      this.registry.set('partida', new Partida(Partida.sementeInicial()));
      this.scene.start('Game');
    });
    this.input.keyboard.once('keydown-M', () => this.scene.start('Menu'));
  }
}
