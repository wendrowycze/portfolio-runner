# Dziennik decyzji

Log decyzji technicznych, nowych zależności i odstępstw od dokumentów w `docs/`. Każdy wpis: data, etap, decyzja, uzasadnienie.

## 2026-09-09 — Etap 0: Fundament

### Stack (zgodnie z CLAUDE.md i ADR-1, ADR-2, ADR-5, ADR-6)

- Vite 8 + TypeScript 6 (strict, plus `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`) + Phaser **3.90** (ostatnia stabilna linia 3.x; na npm istnieje już Phaser 4, ale kit wiążąco wymaga 3.x — migracja to osobna decyzja do backlogu).
- Panel opowieści jako DOM, bez frameworka UI. Kontener gry to CSS Grid z atrybutem `data-layout`.
- Testy: Vitest (jednostkowe), Playwright (e2e, tylko Chromium na czas PoC — krótszy CI, jedna przeglądarka do weryfikacji; inne przeglądarki po Etapie 4, jeśli potrzebne).
- Lint: ESLint 9 (flat config, typescript-eslint w trybie `strictTypeChecked`) + Prettier; `npm run lint` sprawdza oba.
- Deploy: GitHub Pages przez GitHub Actions (`actions/deploy-pages`), Node 22 LTS na CI. `base` w Vite = `/portfolio-runner/` (nazwa repo `wendrowycze/portfolio-runner`).
- e2e zawsze na zbudowanym `dist/` przez `vite preview` pod tym samym `base` co Pages — wyłapuje 404 ścieżek assetów przed publikacją.

### Zależności npm (wszystkie uzasadnione)

| Pakiet | Typ | Po co |
|---|---|---|
| phaser | prod | silnik gry (ADR-1) |
| vite, typescript | dev | build, typy |
| vitest | dev | testy jednostkowe (CLAUDE.md) |
| @playwright/test | dev | testy e2e (CLAUDE.md) |
| eslint, @eslint/js, typescript-eslint, globals, eslint-config-prettier, prettier | dev | lint + format (CLAUDE.md) |
| @types/node | dev | typy dla configów (Playwright/Vite) |

Zod dojdzie w Etapie 2 razem z ładowaniem treści (ADR-7).

### Odstępstwa od dokumentów — decyzje Arka z 2026-09-09

1. **Układ ekranu: opowieść po LEWEJ, bieg po PRAWEJ** (odpowiednik wariantu `side` z GDD sekcja b) jest układem **domyślnym**, nie `stack`. `stack` zostaje jako wariant zapasowy (CSS gotowe, przełącznik URL `?layout=` w Etapie 2). Na wąskich ekranach (<768 px) `side` automatycznie składa się do góra/dół.
2. **Tekst opowieści przewija się z góry do dołu w rytmie biegu** — przewijanie tekstu i ruch postaci/tła są zsynchronizowane (jedno tempo świata). Zastępuje to typewriter jako główny sposób podawania narracji; do implementacji w Etapie 2 (typewriter może zostać jako efekt pojawiania się nowych linii — do sprawdzenia na demo).
3. **Zła decyzja zatrzymuje bieg.** Postać nie biegnie dalej, dopóki gracz nie podejmie trafnej decyzji (potknięcie + feedback + powrót do tego samego wyboru, zgodnie z `docs/00_KONCEPCJA.md` krok 5). Nadpisuje zapis z GDD sekcja d ("beat nie wraca jako pętla") — GDD do aktualizacji w Etapie 2. Zasada "nie da się przegrać" pozostaje: brak game over, tylko brak postępu do czasu trafnej decyzji.

### Inne ustalenia

- Repozytorium założone przez Claude Code w przeglądarce Arka: `https://github.com/wendrowycze/portfolio-runner` (publiczne).
- Commity podpisywane jako Arkadiusz Klej.
- Fonty (Press Start 2P, Spectral) z Google Fonts — przy braku sieci działa fallback systemowy.
- Bazowa rozdzielczość sceny 960×540 (16:9), Scale FIT dopasowuje do prawej kolumny.
