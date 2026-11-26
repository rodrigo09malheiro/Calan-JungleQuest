# Calan: Jungle Quest

Jogo em Phaser 4 para o 2.º trabalho de Sistemas Multimédia. Projeto simples: HTML + JavaScript, sem ferramentas de build.

## Como correr
O jogo precisa de ser aberto através de um servidor local. Se abrires o `index.html` com duplo clique, o navegador bloqueia os ficheiros e o jogo não arranca.

**Opção A (VS Code):** instala a extensão *Live Server*, abre esta pasta, clica com o botão direito em `index.html` e escolhe *Open with Live Server*.

**Opção B (terminal):**
```bash
python3 -m http.server 8000      # ou: python -m http.server 8000
```
e abre http://localhost:8000 no navegador.

## Estrutura
- `index.html` — carrega o Phaser (`lib/phaser.min.js`) e o jogo (`src/main.js`)
- `src/scenes/` — cenas (Boot, Menu, Game, HUD, GameOver)
- `src/entities/` — Calan, Inimigo, Slime e Olho
- `src/config.js` — constantes (tile, escala, velocidades)
- `assets/` — folhas de sprites

## Controlos
Setas ou WASD para andar, ESPAÇO ou J para atacar. ESC volta ao menu.

## Semente (seed)
Cada partida usa uma semente ao acaso, mostrada no HUD. Para repetir um mapa, abre `index.html?seed=42`.

## Estrutura dos sistemas
- `src/sistemas/Aleatorio.js` — números aleatórios com semente
- `src/sistemas/GeradorNivel.js` — geração procedimental do mapa e das salas (conceito 1)
- `src/sistemas/Orcamento.js` — inimigos por orçamento de dificuldade (conceito 2)
- `src/sistemas/Metricas.js` — desempenho do jogador e fator do boss
- `src/sistemas/Partida.js`, `Recordes.js`, `Sons.js`
