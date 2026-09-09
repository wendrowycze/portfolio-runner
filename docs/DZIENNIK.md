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

### Deploy — pierwsze uruchomienie (2026-09-09)

- GitHub CLI zalogowany na koncie Arka (zakres `repo` + `workflow`, autoryzacja w przeglądarce za zgodą Arka). Push przez HTTPS z poświadczeniami z gh.
- Pierwszy przebieg workflow: lint/build/test/e2e zielone, ale automatyczne włączenie Pages z poziomu workflow nie ma uprawnień na tym koncie. Pages włączone jednorazowo przez API (źródło: GitHub Actions), ponowne uruchomienie przeszło. Kolejne pushe publikują automatycznie.
- Link produkcyjny: https://wendrowycze.github.io/portfolio-runner/ — sprawdzony w Chrome: strona 200, oba pliki assetów 200, brak błędów w konsoli.

---

## Stan na 2026-09-09 (po Etapie 0) i następny krok — przekazanie do sesji w chmurze

**Gotowe i opublikowane:** Etap 0 w całości. Link: https://wendrowycze.github.io/portfolio-runner/ (ekran startowy: panel opowieści po lewej, scena Phasera z tytułem i paletą po prawej). Build, lint, Vitest, Playwright zielone lokalnie i na GitHub Actions; publikacja automatyczna po każdym pushu na `main`. Raport z Etapu 0 wysłany Arkowi, Arek zaakceptował plan Etapu 0 i wprowadził trzy zmiany projektowe (patrz sekcja "Odstępstwa od dokumentów" wyżej) — obowiązują od Etapu 2.

**Nie zrobione (zgodnie z planem):** Etapy 1–5. Brak logiki gry, brak scen poza `BootScene`, brak zod, brak `?layout=`, brak treści w kodzie.

**Sesja w chmurze — polecenie startowe (skopiować jako pierwszą wiadomość):**

> Przeczytaj CLAUDE.md i docs/DZIENNIK.md (cały, zwłaszcza "Odstępstwa od dokumentów" i tę sekcję). Etap 0 jest zrobiony, opublikowany i zaakceptowany — nie ruszaj go. Zrealizuj Etap 1 ("Silnik biegu") z docs/03_PLAN_ETAPOW.md wg promptu prompts/etap_1_silnik_biegu.md. Pamiętaj o decyzjach Arka z 2026-09-09: układ side jest domyślny (bieg po prawej), zła decyzja zatrzymuje bieg (od Etapu 2). Na koniec: build/test/e2e zielone, commit `etap-1: ...`, push, sprawdzony link, raport dla Arka po polsku bez kodu, jedno pytanie o tempo biegu z rekomendacją.

**Uwagi praktyczne dla sesji w chmurze:**
- Push na GitHub działa przez połączenie sesji z repozytorium — nie trzeba logować GitHub CLI.
- Playwright wymaga `npx playwright install chromium` (jest w workflow CI; lokalnie w sandboxie trzeba uruchomić raz).
- Fonty z Google Fonts mogą być niedostępne bez sieci — jest fallback systemowy, testy tego nie wymagają.
- Ekran startowy używa bazowej rozdzielczości 960×540 i Scale FIT; kolumna runnera to 60% szerokości (`#runner`), panel 40% (`#panel`), przełączane atrybutem `data-layout` na `#game`.
- Wartości strojenia biegu (prędkość, grawitacja, skok) trzymać w `src/config/tuning.ts` wg GDD sekcja k — plik jeszcze nie istnieje, tworzy go Etap 1.
