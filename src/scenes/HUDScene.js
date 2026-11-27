import { ECRA_LARGURA, HUD_ALTURA, VIDA_CALAN, NIVEIS } from '../config.js';

// HUD: faixa no topo com vida, pontuação, nível, semente e minimapa
// (na luta com o boss, o minimapa dá lugar à barra de vida do guardião).
// Corre em paralelo com a GameScene/BossScene, sem zoom, e lê o estado da Partida a cada frame.
export default class HUDScene extends Phaser.Scene {
  constructor() { super('HUD'); }

  create() {
    this.add.rectangle(0, 0, ECRA_LARGURA, HUD_ALTURA, 0x101018).setOrigin(0);
    this.add.rectangle(0, HUD_ALTURA - 2, ECRA_LARGURA, 2, 0x3a3a50).setOrigin(0);

    const estilo = { fontFamily: 'monospace', fontSize: '20px', color: '#ffffff' };
    this.txtNivel = this.add.text(16, 10, '', estilo);
    this.txtPontos = this.add.text(16, 40, '', { ...estilo, color: '#ffe08a' });
    this.txtSemente = this.add.text(560, 50, '', { ...estilo, fontSize: '14px', color: '#8a8aa0' });

    this.coracoes = this.add.graphics();
    this.minimapa = this.add.graphics();

    // Barra de vida do guardião (só aparece na BossScene).
    this.barraBoss = this.add.graphics();
    this.txtBoss = this.add.text(640, 8, 'Vida do guardião', { ...estilo, fontSize: '16px', color: '#dcc8c8' }).setVisible(false);
    this.vidaMostrada = null;   // valor que a barra mostra; desce aos poucos até à vida real

    // Mensagem no centro do ecrã, numa caixa (ex.: nome do nível, variante do boss).
    this.caixaMensagem = this.add.graphics();
    // Duas linhas com cores diferentes: título a branco, pormenor a amarelo.
    const estiloMsg = { fontFamily: 'monospace', fontSize: '28px', color: '#ffffff', align: 'center' };
    this.txtMensagem = this.add.text(ECRA_LARGURA / 2, 300, '', estiloMsg).setOrigin(0.5);
    this.txtMensagem2 = this.add.text(ECRA_LARGURA / 2, 342, '', { ...estiloMsg, color: '#ffe08a' }).setOrigin(0.5);
  }

  update() {
    const p = this.registry.get('partida');
    if (!p) return;

    this.txtPontos.setText(`Pontos: ${p.pontuacao}`);
    this.txtSemente.setText(`seed ${p.semente}`);
    this.desenharCoracoes(p.vida);

    if (p.boss) {
      // Luta com o boss: título com a variante e barra de vida no lugar do minimapa.
      this.txtNivel.setText(`Boss final · Guardião ${p.boss.nome}`);
      this.minimapa.clear();
      this.desenharBarraBoss(p.boss);
    } else {
      this.txtNivel.setText(`Nível ${p.nivel + 1}/${NIVEIS.length} · ${p.cfg.nome}`);
      this.desenharMinimapa(p);
    }

    this.desenharMensagem(p.mensagem);
  }

  // Mensagem de uma ou duas linhas, numa caixa escura com contorno.
  // A 1.ª linha fica a branco e a 2.ª a amarelo (ex.: a variante do boss).
  desenharMensagem(m) {
    const g = this.caixaMensagem.clear();
    if (!m || Date.now() >= m.ate) {
      this.txtMensagem.setText('');
      this.txtMensagem2.setText('');
      return;
    }
    const linhas = m.linhas || [m.texto];
    this.txtMensagem.setText(linhas[0]);
    this.txtMensagem2.setText(linhas[1] || '');
    // Caixa à medida das duas linhas, com margem.
    const largura = Math.max(this.txtMensagem.width, this.txtMensagem2.width) + 48;
    const altura = linhas.length > 1 ? 104 : 64;
    const x = ECRA_LARGURA / 2 - largura / 2, y = 300 - 32;
    g.fillStyle(0x000000, 0.75).fillRect(x, y, largura, altura);
    g.lineStyle(2, 0xffffff).strokeRect(x, y, largura, altura);
  }

  // Barra de vida do guardião. A parte "perdida" fica a branco um instante,
  // porque a barra desce aos poucos até ao valor real (dá a sensação de impacto).
  desenharBarraBoss(boss) {
    this.txtBoss.setVisible(true);
    if (this.vidaMostrada === null) this.vidaMostrada = boss.vidaMax;
    this.vidaMostrada += (boss.vida - this.vidaMostrada) * 0.08;
    const x = 640, y = 32, w = 300, h = 18;
    const g = this.barraBoss.clear();
    g.lineStyle(2, 0xc8c8c8).strokeRect(x, y, w, h);
    g.fillStyle(0xffffff).fillRect(x + 3, y + 3, (w - 6) * (this.vidaMostrada / boss.vidaMax), h - 6);
    g.fillStyle(0xc8323c).fillRect(x + 3, y + 3, (w - 6) * (boss.vida / boss.vidaMax), h - 6);
  }

  // Corações como quadrados de pixel art: cheios (vermelho) ou vazios (cinzento).
  desenharCoracoes(vida) {
    const g = this.coracoes.clear();
    for (let i = 0; i < VIDA_CALAN; i++) {
      const x = 380 + i * 28, y = 14;
      g.fillStyle(i < vida ? 0xe0414f : 0x3a3a48);
      // Forma de coração com retângulos (2 bossas em cima, ponta em baixo).
      g.fillRect(x + 2, y, 8, 6).fillRect(x + 12, y, 8, 6);
      g.fillRect(x, y + 4, 22, 8);
      g.fillRect(x + 3, y + 12, 16, 4).fillRect(x + 7, y + 16, 8, 4);
    }
  }

  // Minimapa: salas visitadas a cheio, salas vizinhas ainda por visitar só com contorno.
  desenharMinimapa(p) {
    const g = this.minimapa.clear();
    const salas = p.mapa.salas;
    const minX = Math.min(...salas.map((s) => s.gx));
    const minY = Math.min(...salas.map((s) => s.gy));
    const maxX = Math.max(...salas.map((s) => s.gx));
    const W = 18, H = 11, ESP = 4;
    const ox = ECRA_LARGURA - 16 - (maxX - minX + 1) * (W + ESP);
    const oy = 6;

    const conhecida = (s) => s.visitada || Object.values(s.vizinhos).some((id) => id !== null && salas[id].visitada);
    const cor = { inicio: 0x6fa8dc, saida: 0xd9c48a, tesouro: 0xe0b33a, normal: 0x7f8c8d };

    for (const s of salas) {
      if (!conhecida(s)) continue;
      const x = ox + (s.gx - minX) * (W + ESP);
      const y = oy + (s.gy - minY) * (H + ESP);
      // Ligações (portas) para a direita e para baixo.
      g.fillStyle(0x555566);
      if (s.vizinhos.dir !== null) g.fillRect(x + W, y + H / 2 - 1, ESP, 2);
      if (s.vizinhos.baixo !== null) g.fillRect(x + W / 2 - 1, y + H, 2, ESP);

      if (s.visitada) {
        g.fillStyle(s.id === p.salaAtual ? 0xffffff : cor[s.tipo]).fillRect(x, y, W, H);
        if (!s.limpa) g.fillStyle(0xe0414f).fillRect(x + W / 2 - 2, y + H / 2 - 2, 4, 4);   // ainda tem inimigos
      } else {
        g.lineStyle(1, 0x7f8c8d).strokeRect(x + 0.5, y + 0.5, W - 1, H - 1);
      }
    }
  }
}
