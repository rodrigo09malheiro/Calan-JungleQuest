# Monta assets/calan.png a partir do ficheiro do Piskel (calan_vfinal3.piskel).
#
# O Piskel tem 19 frames de 48x48, por esta ordem (frente, lado, costas):
#   0-2 parado          3-5 andar 1          6-8 andar 2
#   9-11 murro: preparar           12-14 murro: golpe (com o arco desenhado)
#   15 parado de frente (variante, não usado)   16-18 espada: golpe (com o arco desenhado)
# Em todos os frames os pés estão na linha 35 e o corpo centrado na coluna 24,
# por isso basta copiar os frames para uma grelha, sem ajustes.
#
# Uso: python ferramentas/montar_calan.py "<pasta>/calan_vfinal3.piskel" assets/calan.png
import base64
import io
import json
import sys
from PIL import Image

COLUNAS = 4

# O .piskel é um JSON; a camada guarda os frames numa faixa PNG em base64.
piskel = json.load(open(sys.argv[1], encoding='utf-8'))['piskel']
camada = json.loads(piskel['layers'][0])
png = camada['chunks'][0]['base64PNG'].split(',')[1]
faixa = Image.open(io.BytesIO(base64.b64decode(png))).convert('RGBA')
larg, alt, total = piskel['width'], piskel['height'], camada['frameCount']
linhas = (total + COLUNAS - 1) // COLUNAS

folha = Image.new('RGBA', (COLUNAS * larg, linhas * alt), (0, 0, 0, 0))
for n in range(total):
    frame = faixa.crop((n * larg, 0, n * larg + larg, alt))
    folha.alpha_composite(frame, ((n % COLUNAS) * larg, (n // COLUNAS) * alt))

folha.save(sys.argv[2])
print('folha', folha.size, f'-> {total} frames de {larg}x{alt}')
