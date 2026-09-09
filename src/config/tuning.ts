/**
 * Parametry strojenia rozgrywki — jedyne miejsce z liczbami z docs/01_GDD_RUNNER_POC.md sekcja k.
 * Żaden komponent nie hardkoduje własnej kopii tych wartości.
 */
export const TUNING = {
  /** Bazowa prędkość świata (px/s), fallback gdy case nie podaje runner.baseSpeed. */
  BASE_SPEED: 220,
  /** Mnożnik prędkości podczas narracji (bieg „płynie” przy czytaniu). */
  NARRATION_SPEED_MULT: 1.15,
  /** Spowolnienie świata w choice/action (time dilation). */
  TIME_DILATION_FACTOR: 0.35,
  /** Czas tweenu wejścia/wyjścia z time dilation. */
  TIME_DILATION_EASE_MS: 300,
  /** Mnożnik tempa animacji biegu postaci podczas time dilation (postać nie „zamarza”). */
  PLAYER_ANIM_DILATION_MULT: 0.7,
  /** Prędkość maszyny do pisania (znaków/s) — prompty, feedback, finał. */
  TYPEWRITER_CPS: 45,
  /**
   * Narracja jest „odcinkiem drogi”: każdy znak tekstu to tyle px biegu (trzymając D/→ odsłaniasz
   * tekst, A/← cofa bieg i tekst). 5 px/znak przy 220 px/s ≈ 44 znaki/s.
   */
  NARRATION_PX_PER_CHAR: 5,
  /** Oddech (px biegu) po każdym beacie narracji, zanim zacznie się kolejny. */
  NARRATION_BEAT_GAP_PX: 140,
  /** Prędkość cofania (mnożnik prędkości bazowej). */
  REWIND_SPEED_MULT: 0.8,
  /** Jak szybko świat reaguje na wciśnięcie/puszczenie klawisza biegu (ms, stała czasowa). */
  MOVE_RESPONSE_MS: 160,
  /**
   * Górny limit czasu klatki (ms) używany przez scenę biegu. Bierzemy surowy czas klatki
   * (Phaser przy braku fokusu okna przycina delta do 1/60 s, co spowalnia świat), ale po
   * powrocie z innej karty nie „przewijamy” zegarów beatów o kilkadziesiąt sekund.
   */
  MAX_FRAME_MS: 100,
  /** Ile ms po spawnie przeszkoda wchodzi w strefę QTE (action). */
  ACTION_ZONE_START_MS: 1500,
  /** Domyślna szerokość strefy QTE (px) — używana, gdy beat nie definiuje okna. */
  QTE_ZONE_WIDTH_PX: 120,
  /** Animacja potknięcia. */
  STUMBLE_ANIM_MS: 600,
  /** Prędkość świata tuż po potknięciu (mnożnik). */
  STUMBLE_SPEED_MULT: 0.5,
  /** Czas powrotu do pełnej prędkości po potknięciu. */
  STUMBLE_RECOVERY_MS: 1000,
  /** Lot miniatury fragmentu do licznika. */
  FRAGMENT_FLY_MS: 500,
  /** Finał: odstęp między startem kolejnych kafli. */
  FINALE_TILE_STAGGER_MS: 150,
  /** Finał: lot pojedynczego kafla. */
  FINALE_TILE_FLY_MS: 400,
  /** Finał: złoty rozbłysk. */
  FINALE_FLASH_MS: 500,
  /** Debounce wejścia gracza. */
  INPUT_DEBOUNCE_MS: 150,
  /** Debounce przeliczenia layoutu przy resize. */
  RESIZE_DEBOUNCE_MS: 150,
  /** Animacja licznika w widgecie button. */
  BUTTON_COUNTER_MS: 2000,
  /** Widget reveal: fade do czerni i z powrotem. */
  REVEAL_FADE_MS: 600,
  /** Widget reveal: pauza na czarnym ekranie. */
  REVEAL_HOLD_MS: 800,
  /** Results: wypełnianie pasków skilli. */
  RESULTS_STAT_FILL_MS: 800,
  /** Czas wyświetlania feedbacku po nietrafionym beacie, zanim beat wróci. */
  FEEDBACK_HOLD_MS: 2000,
  /** Automatyczny skok nad „zaliczoną” przeszkodą, gdy jest tyle px przed postacią. */
  AUTO_JUMP_DISTANCE_PX: 150,

  // --- Fizyka postaci (Arcade Physics) ---
  /** Grawitacja (px/s²). */
  GRAVITY_Y: 1500,
  /** Prędkość początkowa skoku (px/s, w górę). */
  JUMP_VELOCITY: -620,
  /** Pozycja X postaci na ekranie (px od lewej krawędzi sceny). */
  PLAYER_X: 200,
  /** Wysokość ziemi jako ułamek wysokości sceny (postać stoi na tej linii). */
  GROUND_RATIO: 0.8,
  /** Klatki na sekundę animacji biegu przy prędkości bazowej. */
  RUN_ANIM_FPS: 12,

  // --- Tryb wolnego biegu (Etap 1, bez skryptu): proceduralne przeszkody ---
  FREE_RUN_SPAWN_MIN_MS: 1400,
  FREE_RUN_SPAWN_MAX_MS: 2600,
  /** Czas „nietykalności” po potknięciu, żeby jedna przeszkoda nie liczyła się dwa razy. */
  STUMBLE_COOLDOWN_MS: 900,
} as const;

export type Tuning = typeof TUNING;
