import { Emitter } from './Emitter';
import type { World } from '../script/types';

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
  /** Prośba o wejście w obraz danego case'a (klik w obraz na hubie albo przycisk w panelu). */
  'hub:enter': [caseId: string];
  /** Hub potwierdza wybór case'a i zaczyna przejście — main.ts przygotowuje skrypt i panel. */
  'hub:selected': [caseId: string];
  /** Najechanie na obraz w hubie (panel może podświetlić pozycję listy). */
  'hub:focus': [caseId: string | undefined];
  /** Przełączenie widoczności HUD debug. */
  'debug:toggle': [visible: boolean];

  // --- hotel (piętra, winda, posągi) ---
  /** Gość stanął na piętrze (po wejściu albo po przejeździe windą). */
  'hotel:floor': [floor: number, world: World];
  /** Prośba z panelu: jedź na piętro (gość sam dochodzi do windy). */
  'hotel:go': [floor: number];
  /** Gość jest w strefie windy (panel pokazuje przyciski pięter mocniej). */
  'hotel:elevator': [inside: boolean];
  /** Klik w posąg (easter egg — dźwięk po 10 kliknięciach). */
  'hotel:statue': [world: World, count: number];
  /** Naprawa piętra ruszyła (fala malarska) — dźwięk. */
  'hotel:restored': [world: World, fraction: number];

  // --- ekran startowy ---
  /** Wypełnianie formularza: ile pochodni świeci (0..3). */
  'start:progress': [lit: number, total: number];
  /** Gość wchodzi do hotelu (brama). */
  'start:enter': [];

  // --- dźwięk ---
  /** Krótki dźwięk UI/zdarzenia (placeholder syntezowany). */
  sfx: [name: SfxName];
  /** Wyciszenie/odciszenie (M albo przycisk w panelu). */
  'audio:muted': [muted: boolean];
}

export type SfxName =
  | 'ui.tick'
  | 'ui.confirm'
  | 'ui.type'
  | 'torch'
  | 'gate'
  | 'walk.step'
  | 'elevator.ding'
  | 'elevator.move'
  | 'painting.enter'
  | 'painting.near'
  | 'fragment'
  | 'choice.open'
  | 'timer.low'
  | 'success'
  | 'stumble'
  | 'jump'
  | 'finale'
  | 'restore'
  | 'statue';

export const bus = new Emitter<BusEvents>();
