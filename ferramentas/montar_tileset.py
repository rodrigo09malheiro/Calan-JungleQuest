# Monta as folhas de cenário do jogo a partir do pack "Pixel Crawler - Free Pack" (Anokolisa):
#   assets/cenario/tiles.png  -> salas em vista de cima (níveis 1 e 2)
#   assets/cenario/cripta.png -> arena do boss em vista lateral
#   assets/cenario/itens.png  -> ícones dos baús (moeda e poção)
# Copia tiles de 16x16 das folhas originais para uma folha nova, uma categoria por linha
# (8 tiles por linha). A ordem tem de bater com TILES e TILES_CRIPTA em src/config.js.
#
# Uso: python ferramentas/montar_tileset.py "<pasta do pack>/Environment" [pasta de saída]
import sys
from PIL import Image

E = sys.argv[1].rstrip('/') + '/'
SAIDA = (sys.argv[2] if len(sys.argv) > 2 else 'assets/cenario').rstrip('/') + '/'
T = 16          # tamanho de um tile
COLUNAS = 8     # tiles por linha nas folhas finais

FOLHAS = {
    'chao':  'Tilesets/Floors_Tiles.png',
    'muro':  'Tilesets/Wall_Variations.png',
    'masm':  'Tilesets/Dungeon_Tiles.png',
    'pedra': 'Props/Static/Rocks.png',
    'veg':   'Props/Static/Vegetation.png',
    'recur': 'Props/Static/Resources.png',
    'esot':  'Props/Static/Esoteric.png',
}

# Cada linha: (nome, folha de origem, lista de (coluna, linha) em tiles de 16 px).
TILES = [
    ('relva',        'chao', [(1, 10), (2, 10), (3, 10), (1, 10), (2, 10), (3, 10), (2, 10), (1, 10)]),
    ('tijolo',       'chao', [(16, 1), (17, 1), (18, 1), (16, 2), (17, 2), (18, 2), (17, 3), (18, 3)]),
    ('muro_terra',   'muro', [(0, 0), (1, 0), (2, 0), (3, 0), (0, 1), (1, 1), (2, 1), (3, 1)]),
    ('base_terra',   'muro', [(1, 9), (2, 9), (3, 9), (4, 9), (5, 9), (6, 9), (8, 9), (9, 9)]),
    ('muro_pedra',   'muro', [(0, 10), (1, 10), (2, 10), (3, 10), (0, 11), (1, 11), (2, 11), (3, 11)]),
    ('base_pedra',   'muro', [(1, 19), (2, 19), (3, 19), (4, 19), (5, 19), (6, 19), (8, 19), (9, 19)]),
    ('rocha',        'pedra', [(4, 1), (5, 1), (10, 1), (11, 1)]),   # 2 castanhas, 2 cinzentas
    ('porta',        'masm', [(8, 4)]),
    ('planta',       'veg',  [(0, 9), (1, 9), (2, 9), (0, 11), (1, 11), (2, 13), (3, 13), (8, 24)]),
]

# Arena do boss (vista lateral), tudo da folha de masmorra.
CRIPTA = [
    # 0-5 tijolo de fundo; 6-7 teto
    ('fundo_teto',   'masm', [(0, 1), (1, 1), (2, 1), (0, 2), (1, 2), (2, 2), (0, 0), (1, 0)]),
    # 8 teto; 9-10 coluna das paredes; 11-13 topo do chão; 14-15 pontas da plataforma
    ('coluna_chao',  'masm', [(2, 0), (3, 1), (3, 2), (0, 5), (1, 5), (2, 5), (0, 13), (4, 13)]),
    # 16-18 meio da plataforma; 19-21 janela (linha de cima); 22-23 (vazio)
    ('plat_janela',  'masm', [(1, 13), (2, 13), (3, 13), (0, 3), (1, 3), (2, 3)]),
    # 24-26 janela (linha de baixo)
    ('janela',       'masm', [(0, 4), (1, 4), (2, 4)]),
    # 32-39 estandarte 2x4 (esquerda, direita, de cima para baixo)
    ('estandarte',   'masm', [(5, 10), (6, 10), (5, 11), (6, 11), (5, 12), (6, 12), (5, 13), (6, 13)]),
    # 40-45 porta em arco 2x3
    ('porta_arco',   'masm', [(0, 7), (1, 7), (0, 8), (1, 8), (0, 9), (1, 9)]),
]

# Ícones do que sai dos baús (vêm de folhas diferentes): 0 moeda (pontos), 1 poção verde (+1 coração).
ITENS = [('recur', (6, 1)), ('esot', (2, 2))]

abertas = {k: Image.open(E + v).convert('RGBA') for k, v in FOLHAS.items()}


# Cria uma folha com as linhas pedidas e grava-a.
def montar(linhas, ficheiro):
    folha = Image.new('RGBA', (COLUNAS * T, len(linhas) * T), (0, 0, 0, 0))
    for y, (nome, origem, tiles) in enumerate(linhas):
        for x, (cx, cy) in enumerate(tiles):
            tile = abertas[origem].crop((cx * T, cy * T, cx * T + T, cy * T + T))
            folha.paste(tile, (x * T, y * T))
        print(f'{ficheiro} linha {y}: {nome} -> frames {y * COLUNAS}..{y * COLUNAS + len(tiles) - 1}')
    folha.save(SAIDA + ficheiro)


montar(TILES, 'tiles.png')
montar(CRIPTA, 'cripta.png')

# Folha dos ícones: uma só linha, um ícone por frame.
itens = Image.new('RGBA', (len(ITENS) * T, T), (0, 0, 0, 0))
for x, (origem, (cx, cy)) in enumerate(ITENS):
    itens.paste(abertas[origem].crop((cx * T, cy * T, cx * T + T, cy * T + T)), (x * T, 0))
itens.save(SAIDA + 'itens.png')
print('itens.png -> frames 0 (moeda) e 1 (poção)')
