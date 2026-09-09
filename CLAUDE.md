# CLAUDE.md — instrukcje projektu dla Claude Code

## Projekt w skrócie

Portfolio Arkadiusza Kleja jako gra. Gracz chodzi po hotelu (pałacu), w którym wiszą zniszczone obrazy — każdy to jeden projekt/case z życia Arka. Wejście w obraz uruchamia endless runner: postać biegnie automatycznie, w oknie dialogowym pojawia się narracja i wybory, decyzje wpływają na przejście przeszkód. Koniec case'a = ułożenie obrazu z powrotem w całość i poznanie całej historii projektu. Ten kit obejmuje wyłącznie PoC: generyczny silnik runnera sterowany danymi (JSON) + jeden kompletny case, "Teatr jest nasz". Pełna wizja (hotel do chodzenia, wybór postaci, galeria, pozostałe case'y) jest opisana w docs/00_KONCEPCJA.md i docs/06_BACKLOG_PO_POC.md, ale NIE wchodzi w zakres tego PoC.

## Mapa dokumentów — czytaj w tej kolejności

1. `CLAUDE.md` (ten plik) — zasady pracy
2. `docs/00_KONCEPCJA.md` — pełna wizja, kontekst
3. `docs/01_GDD_RUNNER_POC.md` — zasady rozgrywki PoC
4. `docs/02_ARCHITEKTURA.md` — jak zbudowany jest kod (wiążące dla implementacji)
5. `docs/03_PLAN_ETAPOW.md` — plan pracy etap po etapie, DoD, szablon raportu
6. `docs/04_STYL_I_ASSETY.md` — paleta, źródła grafik/dźwięków CC0
7. `docs/05_KONTEKST_ZRODLA.md` — skąd pochodzi treść (Notion, FigJam)
8. `docs/06_BACKLOG_PO_POC.md` — co NIE wchodzi teraz, do zrobienia później
9. `content/schema/case.schema.json` — format danych case'a
10. `prompts/etap_N_*.md` — gotowe prompty do wklejenia na start każdego etapu

W trakcie pracy nad konkretnym etapem czytaj też `docs/DZIENNIK.md` (log decyzji z poprzednich etapów) zanim zaczniesz.

## Stack i komendy

Vite + TypeScript (strict) + Phaser 3. Panel dialogowy jako nakładka DOM, brak Reactu/frameworka UI. Testy: Vitest (logika) + Playwright (e2e). Lint: ESLint + Prettier. Deploy: GitHub Pages przez GitHub Actions.

```
npm run dev      # serwer developerski
npm run build    # build produkcyjny (dist/)
npm test         # Vitest
npm run e2e      # Playwright
npm run lint     # ESLint + Prettier check
```

Każda praca kończy się zielonym `build`, `test`, `e2e` — to warunek przed uznaniem etapu za gotowy.

Dodatkowo, jeśli dodane zostaną skrypty pomocnicze, warto trzymać się nazewnictwa npm-owego (`npm run <coś>`), żeby wszystko dało się uruchomić jedną komendą bez pamiętania ścieżek do plików konfiguracyjnych.

## Zasady pracy (wiążące)

- Właściciel projektu (Arek) nie czyta kodu. Każda komunikacja z nim = link do działającego podglądu + krótki opis po polsku, bez żargonu, co ma zobaczyć + maksymalnie 1-3 pytania decyzyjne, każde z Twoją rekomendacją.
- Treść (teksty, dialogi, statystyki, KPI) wyłącznie w `content/` jako JSON zgodny z `content/schema/case.schema.json`. Kod TS nie zawiera tekstów narracyjnych.
- Nowe zależności npm tylko z uzasadnieniem zapisanym w `docs/DZIENNIK.md`. Domyślna preferencja: brak nowej zależności, jeśli da się zrobić prościej istniejącym stackiem.
- Przed uznaniem czegokolwiek za "gotowe": `npm run build && npm test && npm run e2e` zielone, plus ręczne sprawdzenie w Chromium ze zrzutem ekranu do `docs/screens/`.
- Placeholdery graficzne/dźwiękowe muszą być łatwe do podmiany — jedyne miejsce mapujące klucz na plik to `src/assets/manifest.ts`. Nigdy nie odwołuj się do ścieżki pliku bezpośrednio w kodzie scen/UI.
- Nie implementuj niczego z `docs/06_BACKLOG_PO_POC.md` bez pytania. Jeśli w trakcie pracy nasunie się pomysł spoza zakresu bieżącego etapu — zostaw komentarz `// TODO(backlog): ...` z odwołaniem do backlogu, nie implementuj.
- Commit po każdym etapie, konwencja wiadomości: `etap-N: krótki opis po polsku`.
- Pracuj etapami z `docs/03_PLAN_ETAPOW.md` sekwencyjnie. Zaczynaj w Plan Mode tam, gdzie odpowiedni prompt w `prompts/` tego wymaga (Etapy 0, 2, 3) — przedstaw plan i czekaj na akceptację przed pisaniem kodu. Po każdym etapie zatrzymaj się na akceptację, chyba że Arek napisze "leć dalej".

## Konwencje kodu

- TypeScript strict, zero `any` (użyj `unknown` + zawężanie typu albo generyków). Nie wyłączaj reguł ESLint inline bez bardzo dobrego powodu wpisanego jako komentarz obok.
- Moduły zgodnie z podziałem z `docs/02_ARCHITEKTURA.md` sekcja 1 — nie przenoś logiki między warstwami (np. logika beatów zawsze w `script/`, nigdy w scenie Phasera bezpośrednio; renderowanie DOM zawsze w `ui/`, nigdy w `script/`).
- Nazewnictwo: pliki i klasy w PascalCase dla klas (`ScriptRunner.ts`), camelCase dla funkcji i zmiennych, identyfikatory JSON i pola contentu po angielsku (`id`, `type`, `text`) zgodnie ze schema — ale wartości tekstowe (treść) po polsku.
- Komunikacja Phaser <-> DOM wyłącznie przez `src/events/bus.ts` (jeden współdzielony `EventEmitter`). Żaden moduł UI nie importuje klas scen Phasera i odwrotnie — to sprawdzalne: grep po `import` w `src/ui/` nie powinien nigdy pokazać importu z `src/scenes/`.
- Bez `localStorage` w PoC — stan gry (`GameState`) tylko w pamięci, resetuje się na odświeżenie strony. To świadoma decyzja (ADR-4 w `02_ARCHITEKTURA.md`), nie luka do "naprawienia" bez pytania.
- Każdy nowy typ beatu albo widgetu wymaga zmiany w co najmniej trzech miejscach: `content/schema/case.schema.json`, `script/types.ts`, `ui/DialoguePanel.ts` — jeśli te trzy miejsca się rozjadą, walidacja zod przy ładowaniu case'a to wyłapie testem w Vitest.

## Zasady komunikacji z właścicielem

- Link + raport nietechniczny po polsku — zawsze, po każdym etapie. Szablon raportu jest w `docs/03_PLAN_ETAPOW.md` przy każdym etapie.
- Pytania tylko decyzyjne (coś, czego nie da się rozstrzygnąć samodzielnie w duchu ustaleń projektowych z tego pliku i z `docs/`), maksymalnie 3 na raz, każde z konkretną rekomendacją Claude Code — Arek ma móc odpowiedzieć jednym słowem ("OK", "drugie", "pierwsze").
- Nigdy nie wklejaj fragmentów kodu, nazw plików ani komunikatów błędów do raportu dla Arka.
- Jeśli coś nie działa albo build/test/e2e są czerwone — nie wysyłaj raportu i linku. Napraw najpierw, albo jeśli utknąłeś, opisz problem Arkowi w jednym zdaniu bez szczegółów technicznych i zapytaj, czy ma czas poczekać, czy wolisz inne podejście.
- Ton raportu: entuzjastyczny, ale rzeczowy — Arek ocenia realny efekt, nie proces. Nie tłumacz "co było trudne", tylko "co jest gotowe i co sprawdzić".

## Workflow etapów

Plan Mode -> przedstawienie planu -> akceptacja Arka -> praca -> `npm run build/test/e2e` zielone -> commit `etap-N: ...` -> deploy (automatyczny przez GitHub Actions po pushu) -> raport dla Arka -> stop i czekaj na akceptację/decyzje (chyba że "leć dalej").

## Definicja "gotowe"

Etap jest gotowy, gdy: (1) Definition of Done z `docs/03_PLAN_ETAPOW.md` dla danego etapu jest spełnione, (2) build/testy/e2e zielone, (3) link działa w przeglądarce (sprawdzone realnie, nie tylko `npm run dev` lokalnie), (4) raport dla Arka wysłany, (5) `docs/DZIENNIK.md` zawiera wpisy o istotnych decyzjach podjętych w trakcie.

## Pomysły spoza zakresu

Każdy pomysł, który wykracza poza aktualny etap lub cały PoC: nie implementować. Dopisać jednozdaniowo do `docs/06_BACKLOG_PO_POC.md` (jeśli go tam jeszcze nie ma) i zostawić `// TODO(backlog): ...` w kodzie, jeśli miejsce jest oczywiste. Nie pytać Arka o każdy taki pomysł osobno — zebrać je i wspomnieć zbiorczo w najbliższym raporcie, tylko jeśli to coś istotnego.

## Subagenci — co delegować

Dobre kandydaci do subagentów: ekstrakcja/porządkowanie treści z `content/cases_raw/` do wstępnej wersji JSON (przed ręcznym dopracowaniem w wątku głównym), pisanie i uruchamianie testów (Vitest/Playwright), przeszukiwanie repo pod kątem konkretnych wzorców. Decyzje architektoniczne (zmiana modułu, nowa zależność, zmiana kontraktu API między `ScriptRunner` a `DialoguePanel`) zostają w wątku głównym — nie deleguj ich.

## Pułapki Phaser + Vite

- Importuj Phaser jako moduł ESM (`import Phaser from 'phaser'`), nie przez tag `<script>` — inaczej tree-shaking i typy się rozjadą.
- `pixelArt: true` w konfiguracji gry jest wymagane, żeby tekstury pixel-artowe (CC0 i generowane) nie rozmywały się przy skalowaniu — bez tego `FIT` scale mode robi z ostrych pikseli mazię.
- Base path na GitHub Pages: `vite.config.ts` musi mieć `base: '/<nazwa-repo>/'`, inaczej wszystkie ścieżki do assetów (w tym generowane przez Vite) będą 404 na produkcji mimo działania lokalnie. Sprawdzaj to zawsze na faktycznym linku Pages, nie tylko `npm run preview`.
- Overlay DOM (panel dialogowy) musi mieć `pointer-events` świadomie ustawione: kontener nadrzędny `pointer-events: none`, a klikalne elementy wewnątrz (przyciski, opcje) `pointer-events: auto` — inaczej albo panel blokuje kliknięcia w canvas pod spodem, albo odwrotnie, kliknięcia przechodzą przez panel do gry.
- Scale Manager: użyj `Phaser.Scale.FIT` + `autoCenter: CENTER_BOTH`, i wołaj `this.scale.refresh()` po każdej zmianie layoutu kontenera (np. przy przełączeniu layoutu przez parametr URL `?layout=` albo przy resize) — Phaser nie wykrywa zmian rozmiaru kontenera automatycznie we wszystkich przypadkach.
- `tileSprite` do paralaksy: przesuwaj `tilePositionX` (lub `Y`) w `update()`, nigdy nie twórz nowego `tileSprite` czy nie zmieniaj jego `width`/`height` co klatkę — to jest kosztowne i niepotrzebne, cały efekt przewijania daje sama zmiana `tilePosition`.
- `generateTexture()` w `BootScene` musi zostać wywołane, zanim jakakolwiek scena spróbuje użyć tej tekstury — kolejność scen (`BootScene` jako pierwsza, zawsze) pilnuje tego, ale przy dodawaniu nowych placeholderów pamiętaj, żeby generować je w `BootScene`, nie ad-hoc w scenie, która ich potrzebuje.
- Zmienne środowiskowe Vite (`VITE_LAYOUT` i podobne) są zaszywane w build-time, nie w runtime — zmiana `.env` wymaga nowego builda. Dlatego przełącznik layoutu (stack/side) nie polega na `VITE_LAYOUT` w runtime: czytaj parametr URL `?layout=stack|side` w JS przy starcie gry (wymagane od Etapu 2, patrz `docs/02_ARCHITEKTURA.md` sekcja 10), żeby Arek mógł przełączać sam pod jednym linkiem. `VITE_LAYOUT` zostaje tylko jako wartość domyślna, używana gdy w URL nie ma parametru `layout`.
- Testy Playwright na CI (GitHub Actions) muszą uruchamiać się na zbudowanej wersji (`npm run build` + serwowanie `dist/`), nie na `npm run dev` — inaczej testy przechodzą lokalnie, a psują się dopiero na produkcyjnym buildzie (typowo: różnice w ścieżkach assetów przez `base`).

## Assety CC0 — zasady

- Każdy pobrany plik graficzny lub dźwiękowy spoza kodu (czyli nie wygenerowany przez `Phaser.Graphics`) musi trafić do `ASSETS_ATTRIBUTION.md` z nazwą paczki, autorem, linkiem źródłowym i licencją, zanim zostanie użyty w grze.
- Sprawdzaj licencję bezpośrednio na stronie źródła (Kenney, itch.io, OpenGameArt) w momencie pobrania — nie polegaj na pamięci ani na tym, że "zwykle jest CC0".
- Assety trafiają do `public/assets/cc0/<paczka>/`, nigdy bezpośrednio do `public/assets/` bez podfolderu — ułatwia to późniejsze śledzenie, skąd co pochodzi.
