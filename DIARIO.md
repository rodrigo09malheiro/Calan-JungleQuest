# Diário de desenvolvimento

## Sessão 1 — 18 a 24 de novembro de 2026
**Objetivo:** sprites do Calan e projeto base.

**Atividades realizadas:**
- Desenhei no Piskel os sprites do Calan, do slime, do olho com chamas e do boss.
- Ajustei o cabelo do Calan (estilo mais desgrenhado nas vistas de frente, lado e costas) e acrescentei um barrete numa camada à parte.
- Organizei o Calan numa folha 4x4 de células 34x34 (parado, andar 1, andar 2 e ataque, em frente, lado e costas).
- Criei o projeto Phaser 4 só com HTML e JavaScript (sem ferramentas de build), com o Phaser numa cópia local em `lib/`.
- Cenas Boot, Menu, Game e GameOver; o Calan anda nas 4 direções numa sala de teste, com colisões Arcade.

**Problemas:**
- A primeira versão usava o Vite, que eu não conhecia das aulas.

**Solução:**
- Passei para uma versão simples, só com HTML e módulos JavaScript, servida com `python -m http.server`.

**Decisões:**
- Origem dos sprites nos pés (`setOrigin(0.5, 1)`) e hitbox pequena junto aos pés, para a vista de cima.
- O lado esquerdo é o lado direito espelhado (`setFlipX`), para não desenhar mais frames.

### Uso de IA
- Ferramenta: Claude (Anthropic).
- Finalidade: imagens de referência para o cabelo e o barrete, comentários sobre a folha de sprites, esqueleto inicial do código (cenas e classe do Calan).
- O que alterei/validei: <preencher: o que mudaste, testaste e percebeste>.

## Sessão 2 — 26 de novembro de 2026
**Objetivo:** geração procedimental dos níveis, combate e inimigos, pontuação.

**Atividades realizadas:**
- Gerador de números com semente (`Aleatorio.js`, algoritmo mulberry32). Com `index.html?seed=42` a partida repete-se igual.
- Gerador de níveis (`GeradorNivel.js`): salas colocadas numa grelha por crescimento aleatório, com ligações extra para haver ciclos. Uma pesquisa em largura (BFS) confirma que todas as salas são alcançáveis e dá a distância de cada uma à entrada. A saída fica na sala mais longe; o tesouro num beco sem saída.
- Pedras ao acaso em cada sala, com um *flood fill* a confirmar que todo o chão e todas as portas continuam ligados.
- Orçamento de dificuldade (`Orcamento.js`): cada sala recebe pontos (mais longe da entrada = mais pontos) e gasta-os em inimigos com custos diferentes (slime 2, olho 3).
- Ataque do Calan com ESPAÇO (frames 9 a 11 da folha + arco da espada de `efeitos_calan.png`); zona de dano com `physics.overlapRect`.
- Inimigos: classe base `Inimigo` e subclasses `Slime` (persegue aos saltos) e `Olho` (mantém distância e dispara bolas de fogo).
- Portas fecham enquanto há inimigos; baú na sala do tesouro; escada na sala de saída leva ao nível 2.
- HUD numa cena paralela (vida, pontos, nível, seed, minimapa). Pontuação: inimigos, tesouros, bónus de rapidez e de sala sem dano, bónus de nível.
- Métricas do desempenho (`Metricas.js`) com o cálculo do fator e da variante do boss (mostrado no fim, o boss ainda não existe).
- Efeitos sonoros gerados por um script Python (`ferramentas/gerar_sons.py`) e carregados com `this.load.audio`.
- Melhores pontuações em `localStorage` (`Recordes.js`).

**Problemas:**
- Depois de algumas mudanças de sala o jogo congelava com o erro `Cannot read properties of undefined (reading 'size')`.

**Solução:**
- O `scene.restart()` reutiliza o mesmo objeto da cena, por isso `this.projeteis` ainda apontava para o grupo da sala anterior, já destruído. Passei a criar todos os grupos de novo em cada `create()`.

**Decisões:**
- Cada sala é uma reinicialização da `GameScene`; o estado da partida vive num objeto `Partida` guardado no `registry`.
- Cada nível usa uma semente derivada da semente da partida, para o nível 2 não depender do que aconteceu no nível 1.

### Uso de IA
- Ferramenta: Claude (Anthropic).
- Finalidade: geração do código desta sessão (gerador, orçamento, inimigos, HUD, sons) e depuração do erro acima.
- O que alterei/validei: <preencher: o que testaste, mudaste e percebeste>.

## Sessão 3 — 26 de novembro de 2026
**Objetivo:** substituir os retângulos das salas por cenário a sério.

**Atividades realizadas:**
- Escolhi tiles do pack *Pixel Crawler - Free Pack* (Anokolisa): relva, tijolo, muros de terra e de pedra, rochas, porta e plantas.
- Script `ferramentas/montar_tileset.py` que copia esses tiles para uma única folha `assets/cenario/tiles.png` (16x16), carregada com `this.load.spritesheet('tiles', ...)`.
- `GameScene.desenharSala()` passou a usar imagens do tileset: a parede de cima mostra a face do muro com relva, as outras o topo; as pedras são rochas; há plantas decorativas pelo chão.
- Cada nível tem o seu cenário em `config.js` (nível 1: relva e terra; nível 2: tijolo e pedra).
- As variações de cada sala vêm de um gerador com semente própria da sala, por isso a mesma sala tem sempre o mesmo aspeto.
- Mudei o projeto da subpasta para a raiz do repositório.

**Problemas:**
- Alguns tiles de relva eram mais escuros e o chão parecia um xadrez.

**Solução:**
- Fiquei só com os tiles de relva da mesma tonalidade.

**Decisões:**
- Mantive a grelha de colisões igual (1 tile = 1 bloco); só mudou o desenho.

### Uso de IA
- Ferramenta: Claude (Anthropic).
- Finalidade: escolha dos tiles, script de montagem do tileset e alteração do desenho das salas.
- O que alterei/validei: <preencher>.

## Sessão 4 — 26 de novembro de 2026
**Objetivo:** rever o código e preparar a declaração de IA.

**Atividades realizadas:**
- Comentei o código todo: cenas, entidades, sistemas e os scripts em `ferramentas/`.
- Juntei a declaração de utilização de IA no fim deste diário.

### Uso de IA
- Ferramenta: Claude (Anthropic).
- Finalidade: comentários no código e organização deste diário.
- O que alterei/validei: <preencher>.

---

# Declaração de utilização de IA

**Ferramenta:** Claude (Anthropic), através do Claude Code e do chat.

| Parte do trabalho | O que a IA fez | O que foi usado no jogo |
|---|---|---|
| Sprites | Imagens de referência para o cabelo e o barrete do Calan; análise da folha de sprites (alinhamento, frames em falta) | Sprites desenhados por mim no Piskel, com base nessas referências |
| Estrutura do projeto | Esqueleto das cenas (Boot, Menu, Game, GameOver) e da classe `Calan` | Usado e depois alterado nas sessões seguintes |
| Geração procedimental (conceito 1) | Código de `Aleatorio.js` e `GeradorNivel.js` (mapa, BFS, flood fill) | Usado |
| Orçamento de dificuldade (conceito 2) | Código de `Orcamento.js` e das métricas em `Metricas.js` | Usado |
| Combate e inimigos | Ataque do Calan, `Inimigo`, `Slime`, `Olho`, bolas de fogo | Usado |
| Interface | `HUDScene`, ecrã de resultados, recordes em `localStorage` | Usado |
| Som | Script `ferramentas/gerar_sons.py`, que gera os efeitos em WAV | Usado |
| Cenário | Escolha dos tiles do pack Pixel Crawler e script `ferramentas/montar_tileset.py` | Usado (o pack está creditado em `CREDITS.md`) |
| Depuração | Diagnóstico do jogo a congelar ao mudar de sala (grupos reutilizados no `scene.restart()`) | Correção aplicada |
| Documentação | Comentários no código, README e organização deste diário | Usado |

**Decisões e alterações feitas por mim:**
- <preencher: o que decidiste (ex.: tema do jogo, inimigos, níveis, estilo do Calan), o que mudaste no código gerado e o que testaste>

**Compreensão do código:** todo o código entregue é considerado meu para efeitos de avaliação. <preencher: confirmar que percebeste as partes principais, por exemplo o gerador de níveis e o orçamento, e que as consegues explicar e modificar na defesa>
