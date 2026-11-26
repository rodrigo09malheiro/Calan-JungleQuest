# Diário de desenvolvimento

## Sessão 1 — projeto base
- Criado o projeto Vite + Phaser 4 e a estrutura de pastas.
- Cenas Boot, Menu, Game e GameOver; Calan a andar nas 4 direções numa sala de teste, com colisões Arcade.

### Uso de IA (obrigatório declarar)
- Ferramenta: Claude (Anthropic).
- Finalidade: ajuda com os sprites (referências, pixel art, descrição de frames) e geração do esqueleto inicial do código.
- O que usei: o esqueleto do projeto e a classe do Calan.
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
