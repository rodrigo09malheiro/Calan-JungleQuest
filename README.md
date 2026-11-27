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

**Opção C (XAMPP):** com a pasta dentro de `htdocs`, abre `http://localhost/<caminho da pasta>/`. O ficheiro `.htaccess` diz ao Apache para o navegador não usar versões antigas dos ficheiros.

Com o servidor do Python, se mudares o código e o jogo continuar igual, recarrega com **Ctrl+F5** (o navegador guarda os ficheiros antigos em cache).

## Estrutura
- `index.html` — carrega o Phaser (`lib/phaser.min.js`) e o jogo (`src/main.js`)
- `src/scenes/` — cenas (Boot, Menu, Game, Boss, HUD, GameOver)
- `src/entities/` — Calan (salas), CalanLateral (boss), Inimigo, Slime, Olho e Boss
- `src/config.js` — constantes (tile, escala, velocidades)
- `assets/` — folhas de sprites, cenário (`cenario/`) e sons (`sons/`)
- `ferramentas/` — scripts Python que geram os sons e montam as folhas do cenário e do Calan

## Controlos
- Salas (vista de cima): setas ou WASD para andar, ESPAÇO ou J para atacar.
- Boss (vista lateral): setas/A-D para andar, CIMA ou W para saltar, ESPAÇO ou J para atacar.
- ESC volta ao menu.

## Espada
O Calan começa a lutar só com as mãos (golpe curto, 1 de dano). A espada está no baú da sala do
tesouro do nível 1, que é opcional (fica num beco sem saída). Com a espada, o golpe tem mais
alcance e tira 2 de dano. O guardião adapta-se: com a espada tem o dobro da vida.
Os valores das duas armas estão em `ARMAS`, no `src/config.js`.

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
