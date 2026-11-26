# Diário de desenvolvimento

## Sessão 1 — 13 de novembro de 2026
**Objetivo:** relatório inicial e repositório.

**Atividades realizadas:**
- Escrevi o relatório inicial (objetivo do jogo, funcionalidades, protótipo de baixa fidelidade com dois ecrãs).
- Criei o repositório no GitHub: https://github.com/rodrigo09malheiro/Calan-JungleQuest

**Decisões:**
- Tema sorteado: geração procedimental de mundos e desafios.
- Dois conceitos técnicos: geração procedimental das salas e desafios por orçamento de dificuldade; o desempenho nos níveis decide a variante do boss.
- Duas vistas: top-down nas salas e lateral na luta com o boss.

## Sessão 2 — 17 de novembro de 2026
**Objetivo:** primeiro sprite do Calan.

**Atividades realizadas:**
- Primeira versão do Calan no Piskel.

## Sessão 3 — 18 de novembro de 2026
**Objetivo:** estilo do Calan (cabelo e barrete).

**Atividades realizadas:**
- Refiz o cabelo do Calan num estilo mais desgrenhado, nas vistas de frente, lado e costas.
- Acrescentei um barrete numa camada à parte, para o poder tirar ou mudar sem refazer o resto.

**Problemas:**
- As vistas de frente e de lado não batiam certo (volume e comprimento do cabelo diferentes).

**Solução:**
- Mantive o volume da vista de frente e reduzi o da vista de lado.

### Uso de IA
- Ferramenta: Claude (Anthropic).
- Finalidade: imagens de referência para o cabelo e o barrete; comparação das vistas.
- O que alterei/validei: nada.

## Sessão 4 — 19 de novembro de 2026
**Objetivo:** folha de sprites final do Calan.

**Atividades realizadas:**
- Juntei as animações do Calan numa só folha (parado e andar em frente, lado e costas).
- Várias versões do barrete até à versão final.

**Decisões:**
- Uma só folha com todas as animações, com células do mesmo tamanho e os pés alinhados no fundo.
- O lado esquerdo é o lado direito espelhado (`setFlipX`), para não desenhar mais frames.

### Uso de IA
- Ferramenta: Claude (Anthropic).
- Finalidade: revisão da folha de sprites (alinhamento dos pés, frames em falta) e explicação de como carregar uma spritesheet no Phaser.
- O que alterei/validei: Refiz o cabelo e juntei as animações.

## Sessão 5 — 20 de novembro de 2026
**Objetivo:** ataque do Calan e boss.

**Atividades realizadas:**
- Frames de ataque do Calan (frente, lado e costas), que completam a folha 4x4 de células 34x34.
- Espada e arcos do golpe (`efeitos_calan.png`).
- Sprite do boss.
- Descarreguei o pack *Pixel Crawler - Free Pack* (Anokolisa) para o cenário.

## Sessão 6 — 24 de novembro de 2026
**Objetivo:** primeiro inimigo.

**Atividades realizadas:**
- Sprite do slime, com 4 frames (redondo, achatado, muito achatado e esticado para o salto).

## Sessão 7 — 26 de novembro de 2026
**Objetivo:** jogo jogável com os dois conceitos técnicos, cenário e documentação.

**Atividades realizadas:**
- Sprite do olho de chamas (4 frames: dois a flutuar, um a carregar o tiro e um atordoado).
- Projeto Phaser 4 só com HTML e JavaScript, com o Phaser numa cópia local em `lib/`. Cenas Boot, Menu, Game, HUD e GameOver.
- Gerador de números com semente (`Aleatorio.js`, algoritmo mulberry32). Com `index.html?seed=42` a partida repete-se igual.
- Gerador de níveis (`GeradorNivel.js`): salas colocadas numa grelha por crescimento aleatório, com ligações extra para haver ciclos. Uma pesquisa em largura (BFS) confirma que todas as salas são alcançáveis e dá a distância de cada uma à entrada. A saída fica na sala mais longe; o tesouro num beco sem saída.
- Pedras ao acaso em cada sala, com um *flood fill* a confirmar que todo o chão e todas as portas continuam ligados.
- Orçamento de dificuldade (`Orcamento.js`): cada sala recebe pontos (mais longe da entrada = mais pontos) e gasta-os em inimigos com custos diferentes (slime 2, olho 3).
- Ataque do Calan com ESPAÇO (frames 9 a 11 e arco da espada); zona de dano com `physics.overlapRect`.
- Inimigos: classe base `Inimigo` e subclasses `Slime` (persegue aos saltos) e `Olho` (mantém distância e dispara bolas de fogo).
- Portas fecham enquanto há inimigos; baú na sala do tesouro; escada na sala de saída leva ao nível 2.
- HUD numa cena paralela (vida, pontos, nível, seed, minimapa). Pontuação: inimigos, tesouros, bónus de rapidez e de sala sem dano, bónus de nível.
- Métricas do desempenho (`Metricas.js`) com o cálculo do fator e da variante do boss (mostrado no fim; a luta ainda não existe).
- Efeitos sonoros gerados por um script Python (`ferramentas/gerar_sons.py`) e carregados com `this.load.audio`.
- Melhores pontuações em `localStorage` (`Recordes.js`).
- Cenário: script `ferramentas/montar_tileset.py` que copia tiles do Pixel Crawler para `assets/cenario/tiles.png`; as salas passaram a ter relva, tijolo, muros, rochas, porta e plantas, com um cenário diferente por nível.
- Mudei o projeto da subpasta para a raiz do repositório.
- Comentei o código e escrevi a declaração de utilização de IA.

**Problemas:**
- A primeira versão do projeto usava o Vite, que eu não conhecia das aulas.
- Depois de algumas mudanças de sala o jogo congelava com o erro `Cannot read properties of undefined (reading 'size')`.
- Alguns tiles de relva eram mais escuros e o chão parecia um xadrez.

**Solução:**
- Passei para uma versão simples, só com HTML e módulos JavaScript, servida com `python -m http.server`.
- O `scene.restart()` reutiliza o mesmo objeto da cena, por isso `this.projeteis` ainda apontava para o grupo da sala anterior, já destruído. Passei a criar todos os grupos de novo em cada `create()`.
- Fiquei só com os tiles de relva da mesma tonalidade.

**Decisões:**
- Cada sala é uma reinicialização da `GameScene`; o estado da partida vive num objeto `Partida` guardado no `registry`.
- Cada nível usa uma semente derivada da semente da partida, para o nível 2 não depender do que aconteceu no nível 1.
- A grelha de colisões ficou igual com o cenário novo (1 tile = 1 bloco); só mudou o desenho.

### Uso de IA
- Ferramenta: Claude (Anthropic), através do Claude Code.
- Finalidade: geração do código (gerador, orçamento, inimigos, HUD, sons, cenário), depuração do erro acima, comentários e organização deste diário.
- O que alterei/validei:
  - Rejeitei a primeira versão com Vite e escolhi a versão só com HTML e JavaScript, que uso nas aulas.
  - Escolhi o pack Pixel Crawler para o cenário e pedi para o integrar nas salas.
  - Pedi para mudar o projeto da subpasta para a raiz do repositório.
  - Revi e aprovei cada commit antes de ser enviado para o GitHub.

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
- Defini o jogo no relatório inicial: o objetivo, as duas vistas (top-down nas salas e lateral no boss), os dois níveis, os conceitos técnicos e o boss com variantes.
- Desenhei os sprites no Piskel: Calan, slime, olho de chamas e boss.
- Escolhi o estilo do Calan: cabelo desgrenhado, manter o volume da vista de frente e acrescentar o barrete.
- Escolhi os inimigos (slime e olho de chamas) e o pack de cenário (Pixel Crawler).
- Escolhi a versão sem Vite, para trabalhar com as ferramentas das aulas.
- Decidi a ordem do trabalho: geração procedimental e combate primeiro, boss depois.

**Compreensão do código:** todo o código entregue é considerado meu para efeitos de avaliação. <preencher: confirmar que percebeste as partes principais, por exemplo o gerador de níveis e o orçamento, e que as consegues explicar e modificar na defesa>
