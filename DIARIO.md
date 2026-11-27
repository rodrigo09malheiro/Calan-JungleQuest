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

## Sessão 8 — 27 de novembro de 2026
**Objetivo:** luta com o boss em vista lateral e dificuldade adaptativa.

**Atividades realizadas:**
- Imagem de proposta da arena (cripta com tiles do Pixel Crawler), aprovada antes de programar.
- `GeradorArena.js`: as plataformas da arena são geradas com a semente, dentro das regras da variante (Tanque: mais altas e afastadas; Ágil: mais baixas e próximas), e uma pesquisa em largura (BFS) confirma que todas se alcançam a saltar a partir do chão. Testado com 1000 sementes: nenhuma precisou da arena de reserva.
- `CalanLateral.js`: andar, saltar (com salto variável e uma pequena margem depois de sair de uma plataforma) e atacar, com gravidade só nesta cena.
- `Boss.js`: caveira a flutuar com duas mãos e três ataques: esmagar (a mão roda, treme como aviso e cai a pique até ao chão ou à plataforma de baixo), feitiço (as duas mãos lançam feitiços em leque, que ganham potência a meio do trajeto) e descer (a caveira desce e fica vulnerável). Abaixo de metade da vida entra em fúria (cara ferida, ataques mais rápidos, 3 feitiços em vez de 2, as duas mãos esmagam).
- Cada frame do `boss.png` tem um uso definido (`FRAMES_BOSS` em `Boss.js`): cara normal, cara ferida, cara de ataque; mão normal, mão a cair (rodada -90º), mão a lançar feitiço; feitiço, feitiço forte; e a sequência de impacto (3 frames) quando um feitiço acerta no Calan.
- Dificuldade adaptativa ligada ao jogo: as métricas dos níveis 1 e 2 escolhem a variante (Tanque ou Ágil) e o fator (0,8 a 1,5), que multiplica a vida e a velocidade dos feitiços e encurta as pausas entre ataques. A variante muda também a escolha dos ataques e a arena.
- HUD com barra de vida do guardião e caixa de mensagem (desempenho e variante, à entrada).
- Sons novos: impacto, salto e vitória. Atalhos de teste `?boss=tanque` e `?boss=agil`.

- Depois de testar, revi os ataques: mudei o uso dos frames do boss, a rotação da mão, o número de feitiços e o tamanho dos feitiços (reduzidos para 60%, porque o desenho era quase do tamanho do Calan).

**Problemas:**
- As plataformas mais altas ficavam à altura da caveira, por isso subir para a atacar magoava sempre o Calan.
- As mãos e os feitiços atravessavam as plataformas.

**Solução:**
- A caveira só magoa quando cai a pique (ataque "descer"); a flutuar, tocar-lhe não tira vida. Subir às plataformas passou a ser a forma de a atacar.
- A mão calcula a primeira superfície por baixo dela (plataforma ou chão) e pára aí; ficar debaixo de uma plataforma protege do ataque. Os feitiços usam `overlap` com as plataformas e desfazem-se ao tocar-lhes, mesmo vindos de baixo (o `overlap` ignora a colisão "só por cima").

**Decisões:**
- As plataformas são geradas (e não fixas) para a arena também seguir o tema da geração procedimental.
- Plataformas atravessáveis por baixo para o Calan (colisão só por cima), para o salto ser mais fluido.
- 2 feitiços por ataque com o guardião calmo e 3 na fúria, nas duas variantes; a diferença entre variantes está na frequência, na velocidade e na escolha dos ataques.

### Uso de IA
- Ferramenta: Claude (Anthropic), através do Claude Code.
- Finalidade: imagem de proposta da arena, código da BossScene, do boss, do Calan lateral e do gerador da arena, testes no browser e comentários.
- O que alterei/validei:
  - Aprovei a imagem da arena antes de se programar.
  - Testei a luta e defini o uso de cada frame do boss (caras, mãos, feitiço e impacto).
  - Pedi a mão a cair rodada -90º, 2 feitiços com o guardião calmo e 3 na fúria, e o ajuste dos tamanhos.
  - Pedi que as mãos e os feitiços não atravessassem as plataformas.

### Sessão 8 (continuação) — espada
**Objetivo:** espada como recompensa opcional do nível 1.

**Atividades realizadas:**
- Ideia minha: o Calan começa sem espada e encontra-a no baú do nível 1, depois de limpar a sala do tesouro.
- `ARMAS` em `config.js`: mãos (golpe curto, 1 de dano, arco pequeno) e espada (mais alcance, 2 de dano, arco grande). O golpe nas salas e no boss lê a arma da `Partida` (`partida.arma`).
- Ao abrir o baú do nível 1, a espada sai do baú e sobe por cima do Calan, com a mensagem "Encontraste a espada!". O baú continua a dar +500 pontos e +1 coração.
- Ícone da espada no HUD (escuro até ser encontrada), dica no menu e linha "Arma" no ecrã de resultados.
- O guardião adapta-se à arma: a vida é multiplicada pelo dano do Calan (com a espada tem o dobro), para a luta durar o mesmo número de golpes com ou sem espada.
- Desenhei no Piskel os ataques do Calan com a espada e juntei tudo num só ficheiro (`calan_vfinal2.piskel`, 19 frames): parado, andar, o murro em dois tempos (puxar e esticar o braço) e o ataque com espada, de frente, de lado e de costas. A folha do Calan é montada a partir desse ficheiro pelo script `ferramentas/montar_calan.py` (lê o `.piskel` diretamente) numa grelha 4x5.
- Sem espada, o golpe é a animação do murro (frames 9→12, 10→13, 11→14) com o arco pequeno; com espada, os frames 16, 17 e 18 com o arco grande.

**Problemas:**
- A caixa da mensagem "Encontraste a espada!" tapava a espada a subir, porque o baú fica no centro da sala.
- No ataque com espada para baixo, a espada fica abaixo dos pés. Para caber na célula de 34x34, o Calan estava desenhado 12 píxeis mais acima e, como a origem do sprite está nos pés, ia "saltar" em cada golpe.
- Ao testar no XAMPP apareceu uma "segunda cabeça" do Calan por baixo dos pés (gravei um vídeo do bug). O navegador estava a usar a folha antiga (células 34x34) e o `Calan.js` antigo guardados em cache, misturados com o código novo (células 34x46): cada frame lia 12 píxeis a mais e apanhava o topo do frame de baixo.
- Ao investigar, apareceu outro problema: o temporizador que termina um golpe podia disparar já durante o golpe seguinte e cortá-lo.
- Num segundo vídeo, o golpe para baixo era cortado e o Calan mexia-se sozinho. Pus uma "armadilha" na variável `aAtacar` para ver quem a mudava: era o próprio golpe. A zona de dano tocava na hitbox do Calan e, como ele também tem um método `levarDano`, era tratado como inimigo.

**Solução:**
- As mensagens do HUD passaram a aceitar uma altura (`y`); a da espada aparece na parte de baixo do ecrã.
- A folha do Calan passou a ter células de 34x46: os pés ficam sempre na linha 34 (`PES_CALAN` em `config.js`) e os 12 píxeis de baixo servem para a espada. A origem e a hitbox usam essa linha.
- `.htaccess` na pasta do jogo: o Apache envia `Cache-Control: no-cache`, por isso o navegador confirma sempre se os ficheiros mudaram. Na `BootScene`, as imagens e os sons são pedidos com `?v=<arranque>`, para nunca virem da cache (útil também com outros servidores).
- Cada golpe novo cancela o temporizador do golpe anterior.
- O golpe só atinge corpos do grupo dos inimigos (`this.inimigos.contains(alvo)`).
- A folha do Calan passou a vir só do meu ficheiro do Piskel (`calan_vfinal2.piskel`, que junta os frames antigos e os da espada), em vez de ser montada a partir de várias fontes. O arco do golpe passou a ficar centrado no meio do desenho do Calan (`CENTRO_CALAN` em `config.js`). Para isso foi preciso medir o centro de cada desenho de arco: no `efeitos_calan.png` os arcos não estão centrados nas células de 32x32, por isso a origem de cada arco passou a ser o centro do próprio desenho (`ARCO.centros`). Notei o problema ao testar e marquei numa imagem onde queria o arco.

**Decisões:**
- A espada é opcional: fica na sala do tesouro, que o gerador põe num beco sem saída. Quem explora (estilo cauteloso) fica mais forte; quem corre para a saída luta só com as mãos.
- O boss adapta-se a tudo: à variante e ao fator do desempenho, e também à arma do Calan.

### Uso de IA
- Ferramenta: Claude (Anthropic), através do Claude Code.
- Finalidade: implementação da espada, do ícone no HUD, da adaptação do boss à arma e testes no browser.
- O que alterei/validei:
  - A ideia da espada no baú do nível 1 foi minha.
  - Decidi que a espada é opcional, que o boss se adapta a tudo e que o baú dá a espada e também os pontos e o coração.
  - Desenhei os frames de ataque com espada, juntei-os num só ficheiro do Piskel com os frames antigos e pedi que a folha do Calan viesse desse ficheiro.
  - Gravei vídeos dos bugs que encontrei ao testar.

### Sessão 8 (continuação) — Calan redesenhado com os golpes
**Objetivo:** acabar com os ajustes ao arco do golpe no código.

**Atividades realizadas:**
- Redesenhei o Calan no Piskel (`calan_vfinal3.piskel`) em células de 48x48, com os pés sempre na linha 35 e o corpo centrado. Os golpes já trazem o arco desenhado: murro (preparar 9-11, golpe 12-14) e espada (16-18), de frente, de lado e de costas.
- O `montar_calan.py` ficou mais simples: lê o tamanho das células do próprio `.piskel` e copia os frames para uma grelha, sem ajustes.
- Saiu do código o arco desenhado à parte (`ARCO` e os centros dos arcos de `efeitos_calan.png`). O código só trata da zona de dano (`ARMAS` em `config.js`).

**Decisões:**
- Desenhar o arco nos frames em vez de o posicionar no código: a posição é a do desenho e não há números para acertar.
- Mínimo de frames por direção: 1 parado, 2 a andar, e os golpes (2 no murro, 1 na espada).

### Uso de IA
- Ferramenta: Claude (Anthropic), através do Claude Code.
- Finalidade: verificar o novo Piskel (pés, centro, espaço na célula), adaptar o script e o código e testar no XAMPP.
- O que alterei/validei:
  - Redesenhei todos os frames do Calan com os golpes incluídos, depois de perguntar se isso resolvia os problemas do arco.

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
| Boss e dificuldade adaptativa | Proposta da arena, `BossScene`, `Boss`, `CalanLateral`, `GeradorArena` e ligação das métricas ao boss | Usado |
| Espada | Armas na configuração, espada no baú do nível 1, ícone no HUD e adaptação do boss à arma (a ideia foi minha) | Usado |
| Documentação | Comentários no código, README e organização deste diário | Usado |

**Decisões e alterações feitas por mim:**
- Defini o jogo no relatório inicial: o objetivo, as duas vistas (top-down nas salas e lateral no boss), os dois níveis, os conceitos técnicos e o boss com variantes.
- Desenhei os sprites no Piskel: Calan, slime, olho de chamas e boss.
- Escolhi o estilo do Calan: cabelo desgrenhado, manter o volume da vista de frente e acrescentar o barrete.
- Escolhi os inimigos (slime e olho de chamas) e o pack de cenário (Pixel Crawler).
- Escolhi a versão sem Vite, para trabalhar com as ferramentas das aulas.
- Decidi a ordem do trabalho: geração procedimental e combate primeiro, boss depois.

**Compreensão do código:** todo o código entregue é considerado meu para efeitos de avaliação. <preencher: confirmar que percebeste as partes principais, por exemplo o gerador de níveis e o orçamento, e que as consegues explicar e modificar na defesa>
