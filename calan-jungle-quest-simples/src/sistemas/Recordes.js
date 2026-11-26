// Melhores pontuações guardadas no localStorage do navegador.
const CHAVE = 'calan-jungle-quest-recordes';
const MAXIMO = 5;

export default class Recordes {
  static ler() {
    try {
      return JSON.parse(localStorage.getItem(CHAVE)) || [];
    } catch {
      return [];   // dados estragados ou localStorage indisponível
    }
  }

  // Junta uma pontuação, ordena e guarda só as 5 melhores. Devolve a posição (0 = 1.º) ou -1.
  static guardar(pontos, semente) {
    const lista = Recordes.ler();
    const novo = { pontos, semente, data: new Date().toLocaleDateString('pt-PT') };
    lista.push(novo);
    lista.sort((a, b) => b.pontos - a.pontos);
    const top = lista.slice(0, MAXIMO);
    try { localStorage.setItem(CHAVE, JSON.stringify(top)); } catch { /* sem localStorage */ }
    return top.indexOf(novo);
  }
}
