# Gera os efeitos sonoros do jogo (ondas quadradas, triangulares e ruido) em WAV.
# Uso: python ferramentas/gerar_sons.py assets/sons
import wave, struct, math, random, sys
SR = 22050
random.seed(7)
def save(nome, amostras):
    with wave.open(f'{sys.argv[1]}/{nome}.wav', 'w') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(b''.join(struct.pack('<h', int(max(-1, min(1, a)) * 30000)) for a in amostras))
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
def seq(*partes): return [a for p in partes for a in p]
save('golpe', tom(900, 200, 0.12, 'sin', 0.4, ruido=0.7))
save('acerto', tom(220, 90, 0.10, 'quadrada', 0.45, ruido=0.3))
save('inimigo_morre', seq(tom(600, 300, 0.08, 'quadrada', 0.35), tom(300, 80, 0.15, 'quadrada', 0.35, ruido=0.4)))
save('dano', tom(160, 60, 0.25, 'quadrada', 0.5, ruido=0.25))
save('porta', seq(tom(392, 392, 0.08, 'triangulo', 0.5), tom(523, 523, 0.14, 'triangulo', 0.5)))
save('tesouro', seq(*[tom(f, f, 0.08, 'quadrada', 0.3) for f in (523, 659, 784, 1046)]))
save('fogo', tom(400, 120, 0.22, 'sin', 0.35, ruido=0.85))
save('nivel', seq(*[tom(f, f, d, 'quadrada', 0.3) for f, d in ((392,.1),(523,.1),(659,.1),(784,.25))]))
print('ok')
