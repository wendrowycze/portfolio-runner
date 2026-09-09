import { Emitter } from './Emitter';

/**
 * Jedyna magistrala Phaser <-> DOM (docs/02_ARCHITEKTURA.md sekcja 4).
 * Sceny emitują i nasłuchują; UI emituje i nasłuchuje. Nikt nie trzyma referencji do drugiej strony.
 */
export interface BusEvents extends Record<string, unknown[]> {
  /** Scena biegu jest gotowa i biegnie. */
  'runner:ready': [];
  /** Postać potknęła się (licznik potknięć już zaktualizowany w GameState). */
  'runner:stumble': [];
  /** Skok gracza (klawiatura/tap) — informacyjnie, np. dla dźwięku w Etapie 4. */
  'runner:jump': [];
  /** Zmiana mnożnika czasu świata (time dilation); UI synchronizuje maszynę do pisania. */
  'time:scale': [scale: number];
  /** Kierunek biegu z klawiatury (D/→ = 1, A/← = -1, nic = 0) — trzymany, nie klikany. */
  'move:direction': [direction: -1 | 0 | 1];
  /** Finał: fragmenty tła złożyły się w obraz — panel może pokazać tekst zamknięcia i CTA. */
  'finale:assembled': [];
  /** Prośba o wejście w obraz (klik w obraz na hubie albo przycisk w panelu). */
  'hub:enter': [];
  /** Przełączenie widoczności HUD debug. */
  'debug:toggle': [visible: boolean];
}

export const bus = new Emitter<BusEvents>();
