// Comandos táteis (telemóvel e tablet).
// A ToqueScene desenha o joystick e os botões e escreve aqui o seu estado;
// o Calan (salas) e o CalanLateral (boss) leem-no a par do teclado.
// No PC nada disto aparece: ehTatil() é falso e o estado fica sempre a zeros.

// Ecrã tátil? Usa o ponteiro principal "grosso" (dedo), por isso um portátil com ecrã
// tátil e rato continua a ser tratado como PC.
// Atalhos de teste: index.html?toque=1 força os comandos táteis; ?toque=0 desliga-os.
export function ehTatil() {
  const forcar = new URLSearchParams(window.location.search).get('toque');
  if (forcar === '1') return true;
  if (forcar === '0') return false;
  const dedo = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  return dedo && navigator.maxTouchPoints > 0;
}

const Toque = {
  ativo: ehTatil(),
  x: 0,              // joystick: -1 (esquerda) a 1 (direita)
  y: 0,              // joystick: -1 (cima) a 1 (baixo)
  atacar: false,     // botão premido agora
  saltar: false,
  pedidos: { atacar: false, saltar: false },   // toques ainda por tratar (como o JustDown do teclado)

  // Devolve true uma única vez por cada toque no botão.
  consumir(nome) {
    const p = this.pedidos[nome];
    this.pedidos[nome] = false;
    return p;
  },

  // Esquece os toques por tratar (ao entrar numa sala nova, para não atacar logo à entrada).
  // O joystick fica como está: se o dedo continuar em cima, o Calan continua a andar.
  limparPedidos() {
    this.pedidos.atacar = false;
    this.pedidos.saltar = false;
  },

  // Põe tudo a zeros (quando os comandos são criados ou fechados).
  limpar() {
    this.x = 0; this.y = 0;
    this.atacar = false; this.saltar = false;
    this.limparPedidos();
  },
};

export default Toque;
