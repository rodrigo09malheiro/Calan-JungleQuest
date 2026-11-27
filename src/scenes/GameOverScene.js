import { ECRA_LARGURA, VIDA_CALAN, BOSS } from '../config.js';
import Partida from '../sistemas/Partida.js';
import Recordes from '../sistemas/Recordes.js';
import Toque from '../sistemas/Toque.js';

// Resultados: pontuação final, avaliação do desempenho e melhores pontuações.
export default class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOver'); }

  create(data) {
    const cx = ECRA_LARGURA / 2;
    const p = this.registry.get('partida');
    const vitoria = data && data.vitoria;

    this.add.text(cx, 80, vitoria ? 'Guardião derrotado!' : 'Game Over', {
      fontSize: '52px', color: vitoria ? '#9fffa8' : '#ff6b6b',
    }).setOrigin(0.5);
    this.add.text(cx, 150, `Pontuação: ${p.pontuacao}`, { fontSize: '32px', color: '#ffe08a' }).setOrigin(0.5);

    // Resumo do desempenho. Se a partida chegou ao boss, mostra a avaliação usada
    // (a que escolheu a variante); senão, mostra a avaliação feita agora.
    const t = p.metricas.total();
    const a = p.avaliacao || p.metricas.avaliar(Math.max(p.vida, 0), VIDA_CALAN);
    const linhas = [
      `Inimigos derrotados: ${t.inimigos}   Tesouros: ${t.tesouros}   Dano sofrido: ${t.dano}`,
      `Tempo médio por sala: ${a.tempoPorSala.toFixed(1)} s   Estilo: ${a.estilo}`,
      p.temEspada ? 'Arma: espada' : 'Arma: mãos (a espada ficou por encontrar)',
    ];
    if (p.boss) {
      const estado = p.bossDerrotado ? 'derrotado' : 'invicto';
      linhas.push(`Guardião ${BOSS[a.variante].nome} (x${a.fator.toFixed(2)}): ${estado}`);
    }
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

    this.input.keyboard.once('keydown-ENTER', () => Partida.comecar(this));
    this.input.keyboard.once('keydown-M', () => this.scene.start('Menu'));
    if (Toque.ativo) {
      // Telemóvel: dois botões no lugar das teclas.
      this.botao(cx - 150, 600, 'Jogar de novo', () => Partida.comecar(this));
      this.botao(cx + 150, 600, 'Menu', () => this.scene.start('Menu'));
    } else {
      this.add.text(cx, 560, 'ENTER: jogar de novo    M: menu', { fontSize: '24px', color: '#ffffff' }).setOrigin(0.5);
    }
  }

  // Botão tátil simples: retângulo com texto, reage ao largar o dedo.
  botao(x, y, texto, acao) {
    const fundo = this.add.rectangle(x, y, 250, 64, 0x2a2a3a).setStrokeStyle(2, 0xffffff, 0.8);
    this.add.text(x, y, texto, { fontSize: '24px', color: '#ffffff' }).setOrigin(0.5);
    fundo.setInteractive();
    fundo.once('pointerup', acao);
  }
}
