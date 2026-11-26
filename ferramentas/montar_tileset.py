# Monta assets/cenario/tiles.png a partir do pack "Pixel Crawler - Free Pack" (Anokolisa).
# Copia tiles de 16x16 das folhas originais para uma única folha, uma categoria por linha.
# Uso: python ferramentas/montar_tileset.py "<pasta do pack>/Environment"
# A ordem dos tiles tem de bater com TILES em src/config.js.
import sys
from PIL import Image

E = sys.argv[1].rstrip('/') + '/'
T = 16
FOLHAS = {
    'chao':  'Tilesets/Floors_Tiles.png',
    'muro':  'Tilesets/Wall_Variations.png',
    'masm':  'Tilesets/Dungeon_Tiles.png',
    'pedra': 'Props/Static/Rocks.png',
    'veg':   'Props/Static/Vegetation.png',
}
# Cada linha da folha final: (nome, folha, lista de (coluna, linha) em tiles de 16 px).
LINHAS = [
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

colunas = max(len(t) for _, _, t in LINHAS)
saida = Image.new('RGBA', (colunas * T, len(LINHAS) * T), (0, 0, 0, 0))
abertas = {k: Image.open(E + v).convert('RGBA') for k, v in FOLHAS.items()}
for y, (nome, folha, tiles) in enumerate(LINHAS):
    for x, (cx, cy) in enumerate(tiles):
        tile = abertas[folha].crop((cx * T, cy * T, cx * T + T, cy * T + T))
        saida.paste(tile, (x * T, y * T))
    print(f'linha {y}: {nome} ({len(tiles)} tiles) -> frames {y * colunas}..{y * colunas + len(tiles) - 1}')
saida.save(sys.argv[2] if len(sys.argv) > 2 else 'assets/cenario/tiles.png')
