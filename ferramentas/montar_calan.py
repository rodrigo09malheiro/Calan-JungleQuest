# Monta assets/calan.png a partir do ficheiro do Piskel (calan_vfinal2.piskel).
#
# O Piskel tem 19 frames de 34x34, por esta ordem:
#   0-2 parado (frente, lado, costas)    3-5 andar 1    6-8 andar 2
#   9-11 murro, 1.º tempo (puxar)         12-14 murro, 2.º tempo (esticar)
#   15 parado de frente (variante)        16-18 ataque com espada (frente, lado, costas)
# A folha do jogo é uma grelha 4x5 com os mesmos números de frame.
#
# Porquê células de 34x46 (e não 34x34): no ataque com espada para baixo (frame 16) a espada
# fica 12 píxeis abaixo dos pés, por isso no Piskel o Calan está desenhado 12 píxeis mais acima.
# Se a célula fosse 34x34, como a origem do sprite está nos pés, ele "saltava" em cada golpe.
# Com 46 de altura, os pés ficam sempre na linha 34 e os 12 píxeis de baixo ficam para a espada.
#
# Uso: python ferramentas/montar_calan.py "<pasta>/calan_vfinal2.piskel" assets/calan.png
import base64
import io
import json
import sys
from PIL import Image

LARG, ALT_PISKEL, ALT_CELULA = 34, 34, 46
COLUNAS = 4
DESCER = {16: 12}   # frames desenhados mais acima no Piskel: quantos píxeis descem

# O .piskel é um JSON; cada camada guarda os frames numa faixa PNG em base64.
camada = json.loads(json.load(open(sys.argv[1], encoding='utf-8'))['piskel']['layers'][0])
png = camada['chunks'][0]['base64PNG'].split(',')[1]
faixa = Image.open(io.BytesIO(base64.b64decode(png))).convert('RGBA')
total = camada['frameCount']
linhas = (total + COLUNAS - 1) // COLUNAS

folha = Image.new('RGBA', (COLUNAS * LARG, linhas * ALT_CELULA), (0, 0, 0, 0))
for n in range(total):
    frame = faixa.crop((n * LARG, 0, n * LARG + LARG, ALT_PISKEL))
    x, y = (n % COLUNAS) * LARG, (n // COLUNAS) * ALT_CELULA
    folha.alpha_composite(frame, (x, y + DESCER.get(n, 0)))

folha.save(sys.argv[2])
print('folha', folha.size, f'-> {total} frames')
