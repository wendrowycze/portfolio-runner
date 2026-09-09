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

---

## 2026-09-09 — Etap 1: Silnik biegu

### Co powstało

- `src/runner/Parallax.ts` — 5 warstw tileSprite (gwiazdy 0.03, panorama miasta 0.12, kolonnada 0.35, latarnie/cyprysy 0.7, marmurowa posadzka 1.0) nad statycznym niebem z księżycem. Przewijanie wyłącznie przez `tilePositionX`.
- `src/runner/Player.ts` — sylwetka „czarnofigurowa w negatywie” (jasna postać ze złotą przepaską i wieńcem laurowym), 6 klatek biegu + skok + potknięcie + idle generowane kodem w `BootScene`. Arcade Physics, skok tylko z ziemi, potknięcie = przechył + błysk + drgnięcie kamery (wyłączane przez `prefers-reduced-motion`). Kurz spod stóp jako emiter cząstek.
- `src/runner/Obstacles.ts` — `ObstacleSpawner` z pulą (Phaser Group, `maxSize: 16`), dwa tryby ruchu: `flow` (płynie z prędkością świata — tryb wolnego biegu Etapu 1) i `timed` (pozycja liczona z postępu zegara beatu — przygotowane pod Etap 2, żeby przeszkoda docierała do postaci dokładnie w momencie upływu czasu, niezależnie od easingu time dilation).
- `src/runner/TimeDilation.ts` — jeden mnożnik czasu w `GameState.timeScale`, tweenowany; potknięcie = natychmiast ×0.5, powrót do ×1.0 w 1000 ms (`Quad.easeOut`). Emituje `time:scale` na magistrali dla UI.
- `src/runner/Hud.ts` — licznik fragmentów i potknięć (zawsze, prawy górny róg) + HUD debug (FPS, prędkość, mnożnik czasu) włączany `?debug=1` lub `F3`.
- `src/config/tuning.ts` — wszystkie liczby z GDD sekcja k plus fizyka (grawitacja 1500, skok −620 px/s → wysokość ok. 128 px; test jednostkowy pilnuje, że skok przewyższa najwyższą przeszkodę).
- `src/config/layout.ts` + `main.ts` — przełącznik `?layout=stack|side` zrobiony już teraz (był potrzebny do testu mobilnego), `VITE_LAYOUT` tylko jako domyślna.

### Decyzje

- **Brak assetów CC0 w Etapie 1.** Postać i przeszkody rysowane kodem wyszły wystarczająco czytelnie, a pobieranie paczek z sieci w sandboxie chmurowym nie działa (proxy). `ASSETS_ATTRIBUTION.md` bez zmian. Podmiana na sprite CC0 = wpis w `manifest.ts` + klatki w `Player.ts`.
- **Postać rysowana w skali ×1.5 (72×96 px).** Wersja 48×64 była zbyt mała na scenie 960×540 przy skalowaniu do kolumny 60%.
- **Klucze przeszkód** w słowniku `src/content/obstacles.ts`: `barierka`, `skrzynia`, `kolumna`, `kordon-kamer`, `boty`, `telefony`, `brama`. Nieznany klucz z JSON = fallback `skrzynia` (bez crasha na literówce w treści).
- **Playwright w sandboxie**: pobranie Chromium przez CDN Playwrighta nie przechodzi przez proxy; konfiguracja czyta opcjonalną zmienną `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` (preinstalowany Chromium). Na CI zmiennej nie ma — działa domyślna instalacja z workflow.
- **Błędy ładowania Google Fonts w testach e2e są ignorowane** (`tests/e2e/helpers.ts`) — w środowisku bez sieci fonty mają fallback, a to nie jest błąd gry. Wszystkie inne błędy konsoli nadal oblewają test.
- Favicon jako inline SVG (złota rama na ciemnym tle) — usuwa 404 `favicon.ico` z konsoli.
- FPS w headless Chromium (software rendering) to ok. 20–25 — nie jest miarodajny; w zwykłej przeglądarce scena to kilkanaście obiektów i celuje w 60 fps.

---

## 2026-09-09 — Etap 2: Skrypt i panel dialogowy

### Co powstało

- **zod 4** (`npm i zod`) — jedyna nowa zależność, uzasadniona ADR-7. `src/content/loader.ts`: schema zod typowana jako `z.ZodType<Case>` względem ręcznych typów w `src/script/types.ts` — rozjazd między nimi to błąd kompilacji, rozjazd z `content/schema/case.schema.json` wyłapują testy Vitest na `_demo.json`. Loader sprawdza też reguły spoza JSON Schema: unikalne id beatów, liczba fragmentów = cols×rows, każdy fragment przyznany raz, skille z opcji/results istnieją w `case.skills`, ostatni beat = finale.
- `src/script/ScriptRunner.ts` — maszyna stanów bez Phasera i DOM; czas dostaje przez `tick(deltaMs)` (scena woła co klatkę, testy ręcznie). Zdarzenia: `beat:start`, `beat:resolved`, `beat:retry`, `fragment:collected`, `skill:gained`, `timer:progress`, `action:window`, `phase`, `case:finished`.
- `src/ui/DialoguePanel.ts` + `typewriter.ts` — panel jako przewijana opowieść: wpisy dopisują się na dole, starsze bledną i uciekają w górę. Nagłówek z rolą, tytułem i 6 slotami fragmentów; stopka z akcjami (Dalej / opcje + pasek czasu / pierścień QTE / przycisk widgetu).
- `src/ui/FinaleOverlay.ts` — pełnoekranowy finał: kafle wlatują w kolejności zebrania (naprzemiennie z lewej/prawej, `Back.easeOut`), złoty rozbłysk, podpis, tekst zamknięcia, CTA + powrót. W Etapie 2 powrót = „Zagraj jeszcze raz” (hub dopiero w Etapie 3).
- `content/ui.json` + `src/content/uiStrings.ts` — teksty interfejsu (przyciski, podpowiedzi, feedback generyczny) poza kodem TS, walidowane zodem.
- `content/cases/_demo.json` + `public/assets/paintings/_demo.svg` — 6 beatów syntetycznych, obraz 2×1.
- Integracja w `RunnerScene`: choice/action → time dilation z `runner.choiceSlowdown` + `spawnForBeat`; sukces → auto-skok, przeszkoda „podjeżdża” pod postać, iskry, lot miniatury fragmentu do HUD; porażka → potknięcie, świat staje (0×), przeszkoda znika, po 2 s beat wraca. Złoty snop światła na ziemi pod przeszkodą aktywnego beatu.
- `?layout=stack|side` (runtime) — oba layouty przetestowane e2e ze zrzutami `etap2-side.png`, `etap2-stack.png`; do tego `etap2-results.png`, `etap2-finale.png`.
- `?free=1` — tryb wolnego biegu z Etapu 1 nadal dostępny (ocena tempa bez historii). `?case=_demo` wybiera case; `?debug=1` dodatkowo wystawia uchwyt `window.__portfolioRunner` do diagnostyki.

### Decyzje

1. **Decyzja Arka „zła decyzja zatrzymuje bieg” wdrożona dla choice ORAZ action.** Nietrafiony wybór, brak wyboru w czasie, skok za wcześnie/za późno = potknięcie + feedback (2 s, świat stoi) + powrót do tego samego beatu (`attempt` +1, przeszkoda spawnuje się ponownie). Konsekwencja: finał zawsze ma komplet fragmentów. GDD sekcja d („beat nie wraca jako pętla”) jest tym samym nadpisana — zgodnie z zapisem z Etapu 0.
2. **Tempo maszyny do pisania sprzężone ze światem tylko dla narracji** (`rate = max(0.25, timeScale)`): przy ×1.15 tekst płynie szybciej, przy potknięciu prawie staje. Prompt wyboru i QTE piszą się szybko (×2.2), żeby nie zjadać czasu z paska; feedback i wyniki normalnie. Uzasadnienie: gracz musi zdążyć przeczytać opcje w 7 s.
3. **Przeszkody beatu poruszają się „po zegarze”, nie po fizyce** — pozycja = interpolacja od punktu spawnu do postaci wg postępu `timerMs`. Moment dotarcia zawsze pokrywa się z upływem czasu, niezależnie od easingu time dilation (300 ms) i FPS. Dystans spawnu liczony jak w GDD sekcja e (`baseSpeed × slowdown × czas`).
4. **Wizualna szerokość strefy QTE wynika z `windowMs`** (`baseSpeed × slowdown × windowMs`), a nie ze stałej `QTE_ZONE_WIDTH_PX` (zostaje jako fallback). Dzięki temu pasek na ziemi mówi prawdę o oknie z JSON — GDD dopuszczało rozjazd z ostrzeżeniem, tu go po prostu nie ma.
5. **Klawiatura obsługiwana w jednym miejscu (panel DOM)**, nie w Phaserze: spacja/↑ = skok w action albo „dalej” w narracji, Enter = dalej, 1/2/3 = opcja. Phaser obsługuje tylko klik/tap w canvas (i klawisze w trybie `?free=1`). Unika podwójnych zdarzeń.
6. **Typy beatów w `script/types.ts` mają pola opcjonalne jako `T | undefined`** — wymusza to `exactOptionalPropertyTypes` w połączeniu z typem wyjściowym zod.
7. Sukces beatu: przeszkoda nie „znika” po poprawnym wyborze, tylko w 420 ms podjeżdża pod skaczącą postać i płynie dalej — czytelniejsze niż nagłe zniknięcie i daje moment na lot fragmentu.
8. `.finale[hidden] { display: none }` — atrybut `hidden` przegrywa z `display: grid` klasy; bez tej reguły niewidoczny overlay przechwytywał kliknięcia (wyłapane przez e2e).

---

## 2026-09-09 — Etap 3: Pilot „Teatr jest nasz”

### Co powstało

- `content/cases/teatr-jest-nasz.json` — treść z kitu przeniesiona 1:1 (16 beatów: 7 narracji, 3 choice, 2 action, 2 interaction, results, finale; 6 fragmentów). Zmiany wyłącznie techniczne: klucze przeszkód `sala-teatru` → `telefony` (obdzwanianie mediów) i `opor-dyrekcji` → `brama` (zamknięta brama szkoły z kłódką), `painting.src` → SVG. Wszystkie beaty mieszczą się w 400 znakach (test jednostkowy pilnuje rytmu: max 3 narracje pod rząd, 3 choice, 2 action, 2 interaction).
- `public/assets/paintings/teatr-jest-nasz.svg` — obraz-płaskorzeźba wg `docs/04` (gmach z tympanonem i maskami, sześć kolumn, portal; aktor z maską, widz z biletem i uniesionymi dłońmi, reżyser z tubą i scenariuszem jako kariatydy; rama maureskowa, inskrypcja „TEATR JEST NASZ · KRAKÓW · MMXXII”). Napisany ręcznie z prostych kształtów w palecie — nie ilustracja, nie AI. 960×640, siatka 3×2.
- Widgety (`src/ui/widgets/`): **ButtonWidget** — licznik 0 → 200 000 zł (Cubic.easeOut, 2 s), pasek, konfetti CSS, „Dalej” dopiero po animacji; **PuzzleWidget** — siatka 3×2 z obrazu case'a, klik-klik zamienia kafle, złota obwódka na dobrym miejscu, błysk i auto-„dalej” po 800 ms; **RevealWidget** — pełnoekranowe zaciemnienie z tekstem, tap skraca pauzę (zaimplementowany, pilot go nie używa — zgodnie z `docs/00`).
- `src/scenes/HubStubScene.ts` — ściana hotelu (tapeta maureskowa, boazeria, kinkiety), złota rama, tabliczka z tytułem i rolą. Zniszczony: kafle przyciemnione + pęknięcia; odrestaurowany: pełny obraz, pulsująca złota poświata, iskry. Klik w obraz (albo przycisk „Wejdź w obraz” w panelu — klawiatura/czytnik ekranu) → najazd kamery + fade → RunnerScene. Po `case:finished` → hub w stanie odrestaurowanym, panel proponuje „Zagraj jeszcze raz”.
- Obraz case'a ładowany w `BootScene.preload` jako SVG rasteryzowany do 960×640 (klucz `painting.current` w manifeście, ścieżka z JSON). Ten sam plik służy hubowi (Phaser), układance i finałowi (DOM) — jedno źródło prawdy.
- Testy: Vitest — pilot przechodzi w całości z poprawnymi wyborami (6/6, 0 potknięć) i z błędem w każdym beacie (5 potknięć, 6/6); Playwright — pełne przejście przez klikanie od hubu do odrestaurowanego obrazu z zerem błędów w konsoli i zrzutami `docs/screens/etap3-*.png` (hub, narracja, wybór, QTE, zrzutka, układanka, wyniki, finał, hub odrestaurowany).

### Decyzje

1. **Układanka na klikanie** (nie przeciąganie) — prostsze na telefonie i dla klawiatury (kafle to przyciski). Tasowanie deterministyczne, bez kafla na właściwym miejscu na starcie; da się ułożyć w ≤ 5 zamianach.
2. **Licznik zrzutki kończy na 200 000 zł**, a 500 000+ zł pojawia się w wynikach jako „Zebrane łącznie” — obie liczby z treści, każda w swoim momencie historii (rekomendacja z planu etapu). Do potwierdzenia przez Arka.
3. **Nazwisko dyrektora w KPI** (`results.kpis`) zostawione tak, jak było w JSON z kitu, mimo że `cases_raw/teatr-jest-nasz.md` go nie wymienia — to fakt publiczny, a plik z kitu był dostarczony jako dane pilota. Jeśli Arek woli bez nazwiska, to zmiana jednej wartości w JSON.
4. **W e2e skok w QTE wywoływany spacją**, nie klikiem w pierścień: klik Playwrighta ma ok. 0,5 s narzutu (sprawdzanie stabilności elementu), co w oknie 800 ms dawało losowe „za późno”. Sam pierścień jest klikalny i pulsuje poświatą (`box-shadow`), nie transformacją — dzięki temu nie „ucieka” automatom i czytnikom.
5. **Workflow CI uruchamia lint/build/testy także dla pull requestów** (`pull_request`), a publikację Pages tylko z `main`. Powód: praca w sesji chmurowej idzie przez gałąź i PR — bez tego PR nie miałby żadnej weryfikacji.
6. `docs/01_GDD_RUNNER_POC.md` zaktualizowany o decyzje Arka z Etapu 0 (layout `side` domyślny; nietrafiony choice/action = powrót do tego samego beatu) — zgodnie z zapisem z Etapu 0, że GDD ma być poprawione w Etapie 2.

### Pomysły spoza zakresu (nie zaimplementowane)

- Dźwięk (kroki, skok, potknięcie, fragment, konfetti) — Etap 4.
- Lepszy obraz case'a (generatywny pipeline) — backlog P2, bank promptów w `docs/04`.
- Pauza gry przy utracie fokusu karty: Phaser sam wstrzymuje pętlę (zegary beatów stają), ale maszyna do pisania i CSS-owe animacje idą dalej — do dopracowania w Etapie 4 razem z `prefers-reduced-motion`.

### Stan na koniec sesji

Etapy 1–3 gotowe na gałęzi `claude/sweet-cerf-g5z7oe` (trzy commity `etap-1`, `etap-2`, `etap-3`). Build/lint/Vitest/Playwright zielone lokalnie. Publikacja na GitHub Pages następuje po scaleniu do `main` — link produkcyjny pokaże nową wersję dopiero wtedy.

---

## 2026-09-09 — Poprawki Arka po obejrzeniu Etapów 1–3

Arek (po zagraniu w podgląd): „ogólnie jest zajebiście”, plus dwie zmiany mechaniki.

### 1. Bieg i tekst sterowane trzymanym klawiszem, cofanie

- **Narracja jest „odcinkiem drogi”** (`ScriptRunner.moveBy(±px)`): kolejne beaty narracji tworzą jeden ciąg; tekst odsłania się proporcjonalnie do przebiegniętych pikseli (`NARRATION_PX_PER_CHAR = 5`, oddech `NARRATION_BEAT_GAP_PX = 140` między beatami). Trzymanie **D / →** = bieg do przodu, **A / ←** = cofanie (świat i animacja postaci odtwarzane wstecz, tekst się chowa). Puszczenie klawisza = świat staje. Na dotyku: przytrzymanie prawej połowy sceny = bieg, lewej = cofanie.
- Cofać można do początku bieżącego odcinka narracji (nie za rozstrzygnięty wybór/skok — to „kotwice” historii).
- Przejście do kolejnego beatu (wybór, skok, widget) następuje samo, gdy gracz przebiegnie cały tekst. Nie ma już przycisku „Dalej” ani narracji „auto” — pola `advance`/`durationMs` zostają w schemacie i JSON-ach dla zgodności, silnik ich nie używa (odnotowane w `script/types.ts`).
- Stan klawiszy obsługuje panel (DOM, `keydown`/`keyup`, reset przy `blur`) i wysyła `move:direction` magistralą; scena śledzi cel prędkości wykładniczo (`TimeDilation.track`, stała `MOVE_RESPONSE_MS = 160`). `GameState.timeScale` może być ujemny.
- Wybory i QTE bez zmian (zegar rzeczywisty, przeszkoda po zegarze). Widgety i wyniki: świat stoi.
- Pełne przejście „Teatru” trwa teraz ok. 2 minuty realnego biegu — limit testu e2e podniesiony do 5 minut.

### 2. Tło składa się w obraz (finał w scenie biegu)

- Nakładka DOM finału usunięta (`FinaleOverlay.ts`). Finał gra `RunnerScene.playFinale()`: sceneria ciemnieje, sześć fragmentów obrazu (klatki tekstury SVG) pojawia się rozrzuconych po panoramie, kolumnadzie i latarniach jak ukryte w tle, po czym w kolejności zebrania zlatują na siatkę pośrodku sceny (`Back.easeOut`), iskry, złoty rozbłysk, rama. Scena emituje `finale:assembled`; panel po lewej pokazuje wtedy podpis obrazu, tekst zamknięcia (maszyna do pisania) i CTA + „Wróć do hotelu”.
- Do testów: `body[data-finale="assembled"]`.
