# Gera os efeitos sonoros do jogo (ondas quadradas, triangulares e ruido) em WAV.
# Uso: python ferramentas/gerar_sons.py assets/sons
import wave, struct, math, random, sys
SR = 22050          # amostras por segundo (qualidade suficiente para efeitos 8-bit)
random.seed(7)      # semente fixa: os sons saem sempre iguais

# Grava uma lista de amostras (-1 a 1) num ficheiro WAV mono de 16 bits.
def save(nome, amostras):
    with wave.open(f'{sys.argv[1]}/{nome}.wav', 'w') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(b''.join(struct.pack('<h', int(max(-1, min(1, a)) * 30000)) for a in amostras))
# Gera um som que desliza da frequência f0 até f1 durante dur segundos.
# onda: quadrada (som "8-bit"), triangulo (mais suave) ou seno; ruido mistura chiado.
# O volume desce até 0 no fim (envelope), para o som não acabar com um estalo.
def tom(f0, f1, dur, onda='quadrada', vol=0.5, ruido=0.0):
    n = int(SR * dur); out = []; fase = 0
    for i in range(n):
        t = i / n
        f = f0 + (f1 - f0) * t
        fase += f / SR
        if onda == 'quadrada': s = 1 if (fase % 1) < 0.5 else -1
        elif onda == 'triangulo': s = 4 * abs((fase % 1) - 0.5) - 1
        else: s = math.sin(2 * math.pi * fase)
        s = s * (1 - ruido) + (random.random() * 2 - 1) * ruido
        env = min(1, i / (SR * 0.005)) * (1 - t) ** 1.5
        out.append(s * env * vol)
    return out
# Junta vários sons em sequência (ex.: notas de uma pequena melodia).
def seq(*partes): return [a for p in partes for a in p]
# Efeitos do jogo (o nome do ficheiro é a chave usada em this.sound.play).
save('golpe', tom(900, 200, 0.12, 'sin', 0.4, ruido=0.7))
save('acerto', tom(220, 90, 0.10, 'quadrada', 0.45, ruido=0.3))
save('inimigo_morre', seq(tom(600, 300, 0.08, 'quadrada', 0.35), tom(300, 80, 0.15, 'quadrada', 0.35, ruido=0.4)))
save('dano', tom(160, 60, 0.25, 'quadrada', 0.5, ruido=0.25))
save('porta', seq(tom(392, 392, 0.08, 'triangulo', 0.5), tom(523, 523, 0.14, 'triangulo', 0.5)))
save('tesouro', seq(*[tom(f, f, 0.08, 'quadrada', 0.3) for f in (523, 659, 784, 1046)]))
save('fogo', tom(400, 120, 0.22, 'sin', 0.35, ruido=0.85))
save('nivel', seq(*[tom(f, f, d, 'quadrada', 0.3) for f, d in ((392,.1),(523,.1),(659,.1),(784,.25))]))
# Boss: impacto das mãos no chão, salto do Calan e fanfarra de vitória.
save('impacto', tom(120, 40, 0.35, 'quadrada', 0.6, ruido=0.6))
save('salto', tom(300, 600, 0.10, 'quadrada', 0.25))
save('vitoria', seq(*[tom(f, f, d, 'quadrada', 0.3) for f, d in ((523,.12),(659,.12),(784,.12),(1046,.2),(784,.1),(1046,.35))]))
print('ok')
