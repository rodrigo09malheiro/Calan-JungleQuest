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
- `src/scenes/` — cenas (Boot, Menu, Game, Boss, HUD, GameOver)
- `src/entities/` — Calan (salas), CalanLateral (boss), Inimigo, Slime, Olho e Boss
- `src/config.js` — constantes (tile, escala, velocidades)
- `assets/` — folhas de sprites, cenário (`cenario/`) e sons (`sons/`)
- `ferramentas/` — scripts Python que geram os sons e montam as folhas de cenário

## Controlos
- Salas (vista de cima): setas ou WASD para andar, ESPAÇO ou J para atacar.
- Boss (vista lateral): setas/A-D para andar, CIMA ou W para saltar, ESPAÇO ou J para atacar.
- ESC volta ao menu.

## Atalhos de teste
- `index.html?boss=tanque` ou `index.html?boss=agil` — começa logo na luta com o boss, com essa variante e fator 1.
- `index.html?boss=1` — começa no boss e deixa as métricas escolherem a variante.
- Juntam-se à semente: `index.html?seed=42&boss=agil`.

## Semente (seed)
Cada partida usa uma semente ao acaso, mostrada no HUD. Para repetir um mapa, abre `index.html?seed=42`.

## Estrutura dos sistemas
- `src/sistemas/Aleatorio.js` — números aleatórios com semente
- `src/sistemas/GeradorNivel.js` — geração procedimental do mapa e das salas (conceito 1)
- `src/sistemas/Orcamento.js` — inimigos por orçamento de dificuldade (conceito 2)
- `src/sistemas/Metricas.js` — desempenho do jogador, variante e fator do boss (dificuldade adaptativa)
- `src/sistemas/GeradorArena.js` — plataformas da arena do boss geradas com semente e verificadas
- `src/sistemas/Partida.js`, `Recordes.js`, `Sons.js`
