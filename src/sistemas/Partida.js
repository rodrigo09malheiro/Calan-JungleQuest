import { NIVEIS, VIDA_CALAN } from '../config.js';
import Aleatorio from './Aleatorio.js';
import GeradorNivel from './GeradorNivel.js';
import Metricas from './Metricas.js';

// Estado de uma partida: semente, nível atual, mapa gerado, vida e pontuação.
// Fica guardado no registry do Phaser ('partida'), para passar de sala em sala
// (a GameScene é reiniciada a cada sala) e para o HUD e o Game Over o lerem.
export default class Partida {
  constructor(semente) {
    this.semente = semente;
    this.vida = VIDA_CALAN;
    this.pontuacao = 0;
    this.metricas = new Metricas();
    this.nivel = 0;
    this.iniciarNivel(0);
  }

  // Semente ao acaso, ou a da URL (index.html?seed=1234) para repetir uma partida.
  static sementeInicial() {
    const daUrl = new URLSearchParams(window.location.search).get('seed');
    if (daUrl !== null && !Number.isNaN(Number(daUrl))) return Number(daUrl);
    return Math.floor(Math.random() * 1_000_000);
  }

  // Atalhos: configuração do nível atual, sala onde o Calan está e se é o último nível.
  get cfg() { return NIVEIS[this.nivel]; }
  get sala() { return this.mapa.salas[this.salaAtual]; }
  get ultimoNivel() { return this.nivel === NIVEIS.length - 1; }

  // Gera o mapa do nível n e põe o Calan na sala de entrada.
  iniciarNivel(n) {
    this.nivel = n;
    // Cada nível tem o seu próprio gerador, derivado da semente da partida,
    // para o nível 2 não depender de quantos números o nível 1 consumiu.
    const rngNivel = new Aleatorio(this.semente * 31 + n * 7919);
    this.mapa = new GeradorNivel(rngNivel, this.cfg).gerar();
    this.salaAtual = this.mapa.inicio;
    this.entradaPor = null;   // por que porta o Calan entrou (null = começa no centro)
    this.metricas.iniciarNivel(n);
  }

  // Toda a pontuação passa por aqui (inimigos, tesouros, bónus de sala e de nível).
  somarPontos(p) {
    this.pontuacao += p;
  }
}
