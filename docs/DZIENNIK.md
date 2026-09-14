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

---

## 2026-09-09 — Pozostałe historie: 8 nowych case'ów, obrazy, galeria w hubie

Na prośbę Arka („przygotuj też wszystkie pozostałe historie, zrób do nich grafiki”) — poza pierwotnym zakresem PoC (backlog P1 „Kolejne case'y”), ale zamówione wprost.

### Treść (`content/cases/*.json`)

Przepisane z `content/cases_raw/` wg `content/cases/_SZABLON.md`: 6 fragmentów (3×2), 2–3 choice, 1–2 action, 1–2 interaction, max 3 narracje pod rząd, teksty ≤ 400 znaków, liczby wyłącznie z materiału źródłowego. Test `tests/unit/cases.test.ts` pilnuje tych reguł dla każdego pliku i przechodzi każdy case ScriptRunnerem.

| id | świat | interakcje | uwagi / interpretacje do potwierdzenia przez Arka |
|---|---|---|---|
| kultura-futura | kultura | reveal („zamknij oczy”) + puzzle | Wybór patronów (A&B / Vogue / Wyborcza): źródło nie mówi, kogo wybrano — opcja trafna „wszystkie trzy” wzorowana na easter eggu z Kalejdoskopu. Literówka źródła „konfiltków” poprawiona. |
| cyrograf-na-kwadrat | kultura | puzzle (wykres oszustw) + button „Otwórz gazetę” (licznik do 100 000 osób) | Linki do Facebooka/Issuu ze źródła pominięte (nie ma ich w cases_raw). |
| ko-kreacja-mkidn | kultura | puzzle (Canvas Ko-kreacji) | Trzy zdania otwierające z tekstu źródłowego stały się dosłownie opcjami pierwszego wyboru. Brak liczbowych KPI w źródle — wyniki jakościowe. Skille skrócone do 3 słów-kluczy. |
| kalejdoskop | kultura | puzzle | Easter egg z wersji roboczej („wybierasz jednego, potem wszystkich”) oddany jako wybór z opcją „wszyscy trzej”. Tekst źródłowy urywa się po pierwszym dniu — finał nie dopisuje kolejnych dni. Delty skilli z wersji roboczej (+10/+15/+11), „Lniane gacie… +4” jako KPI-żart. |
| ewaluacja-festiwali | kultura | puzzle („mała postać otoczona klockami” — dosłownie motyw obrazu) | Wyniki z wersji roboczej (+8/+10/+7); pierwszy, urwany punkt „+10 do ,” przypisany do skilla Antropologia. |
| up-arta | kultura | puzzle (ilustracja pianina) + button (licznik 20 000 widzów) | Cztery interakcje ze źródła scalone do dwóch; przyciski „TEDx / ING / dowiedz się więcej” bez linków w źródle → KPI „warsztaty dla sektora bankowego (ING)”. Czwarty skill (Filozofia cyfrowa) pominięty (limit 3). |
| gra-teatralna-improvisio | kultura | puzzle | Wersja robocza (V1). Brak KPI liczbowych; „testy: licea, SWPS, UJ, UŚ” z notatki źródłowej. Tytuł skrócony do formy misji. |
| scouting-pfr | **biznes** | button („Roześlij zapytania”, licznik 5 języków) | Wersja robocza. Jedyny case świata Biznes — obraz w stylu „planów konstrukcyjnych” (docs/04). Pytanie o The Mom Test oparte na metodzie, nie na cytacie ze źródła. CTA „Napisz do Arka” zgodnie z placeholderem autora. |
| mundur | — | — | **Pominięty**: w źródle tylko nagłówek, bez treści (zasada „nie wymyślaj faktów”). |

Nowe przeszkody: `dokumenty` (sterta kartek z pieczęcią), `kable` (plątanina przewodów).

### Obrazy (`scripts/paintings.mjs`, `npm run paintings`)

Generator SVG: wspólna rama maureskowa, marmur, promienie i sylwetki-kariatydy (jak w ręcznie napisanym obrazie „Teatru”), motyw środkowy per case (globus VR, tablica śledztwa z wykresem, Canvas, pałac w Gardzienicach z ogniskiem, przedzieranka z klockami, czterostronne pianino, trzy karty, kompas z dymkami w 5 językach). Świat Biznes: tło „blueprint” (siatka techniczna na ciemnym turkusie). Obrazy są „wygenerowane kodem” w rozumieniu docs/04 — pliki w `public/assets/paintings/` są artefaktem skryptu, nie edytować ręcznie (poza `teatr-jest-nasz.svg` i `_demo.svg`, pisanymi ręcznie wcześniej).

### Silnik

- `src/content/cases.ts`: rejestr wszystkich case'ów z kolejnością wieszania (wg rekomendacji `_INDEKS.md`, pilot pierwszy, `_demo` ukryty), `fetchGalleryCases()`.
- `src/state/progress.ts`: ukończone historie — w pamięci (ADR-4).
- `HubStubScene` = galeria: 9 obrazów w dwóch rzędach (`src/scenes/hubLayout.ts`, czysta funkcja używana też przez e2e do kliknięcia w obraz), każdy z ramą, tabliczką, stanem zniszczony/odrestaurowany, najazdem i nazwą pod kursorem. Panel po lewej: lista historii z przyciskami „Wejdź w obraz” (klawiatura/czytnik), podświetlana przy najechaniu na obraz (`hub:focus`).
- Wejście: `hub:enter(id)` → scena emituje `hub:selected(id)` → `main.ts` przeładowuje ScriptRunner i panel na wybraną historię → najazd kamery → RunnerScene. Po finale obraz danego case'a wraca odrestaurowany (iskry), reszta bez zmian.
- `?case=<id>` pomija hub i startuje historię od razu (także `_demo`). `BootScene` ładuje wszystkie SVG galerii na starcie (9 × 960×640).
- Klucze tekstur: `painting.<id>` (wpis `painting.*` w manifeście).

---

## 2026-09-10 — Etap 4+: hotel z piętrami, ekran startowy, dźwięk, efekty, obrazy z API

Po scaleniu PR #1 Arek zamówił szlif UX/UI całego produktu i elementy spoza PoC (backlog P1/P2/P3): budynek z trzema piętrami, ekran startowy z pochodniami, dźwięk, „niekanciaste” animacje i efekty, obrazy generowane przez API zamiast placeholderów, czas na wybór proporcjonalny do długości tekstu. Odpowiedzi Arka na pytania wstępne: seria malarska obrazów ze wspólną ramą na pixelartowym świecie; **piętro naprawia się razem z obrazami** (przestaje być pixelartowe, staje się malarskie); chodzenie lewo–prawo, winda między piętrami; dźwięki tylko jako placeholdery; GRIS jako referencja ruchu (Bastion jako drugi kierunek do rozważenia); zacząć od budynku, przygotować wszystko naraz, w tym ekran startowy.

### Decyzje i interpretacje

- **Trzy piętra = trzy światy** (parter Kultura, 1. piętro Edukacja, 2. piętro Biznes) — `src/config/hotel.ts`. Obrazy wieszają się na piętrze swojego świata w kolejności rejestru (`src/scenes/hotelLayout.ts`, czysta funkcja, testowana). Kultura ma 7 obrazów, Edukacja 2, Biznes 3.
- **Historie dla pustych pięter** — Arek wskazał, że „pozostałe historie są w Notion”, ale podłączony konektor Notion widzi tylko workspace „Speech Flow’s Space”, w którym nie ma stron „Praca z Kubą” / „Portfolio Arka” (404). Dlatego trzy nowe historie powstały **z inwentarza** (`content/inwentarz_tresci.md`), wyłącznie z faktów tam zapisanych, oznaczone `draft: true` (odznaka „wersja robocza” w panelu): `narzedziownik-biz` (ZWzT: 1993 nauczycieli, 60 003 uczniów, Innovation 2023), `tajemnica-pieczeci` (SWPS: kilkanaście tysięcy studentów, 6 kampusów), `nasa-space-apps` (PCIS: 5. miejsce, 5000 zł, nagroda SES i ARP). Narracja wokół faktów jest interpretacją — do potwierdzenia/zamiany na teksty z Notion, gdy dostęp będzie działał.
- **Naprawa piętra**: każde piętro ma dwie wersje korytarza o identycznym układzie — pixelartową (`NEAREST`) i malarską rysowaną w 2× z filtrem `LINEAR` (gradienty, pociągnięcia pędzla, poświaty, złote łuki). Warstwa malarska ma alfę = ułamek odrestaurowanych obrazów na piętrze (`Floor.setRestoration`). Po ukończeniu historii, po powrocie do hotelu, malarska wersja rozlewa się kołem od obrazu na całe piętro (maska geometryczna, `Floor.restoreFrom`) — to jest dosłowna realizacja pomysłu Arka. Drzwi i kinkiety też mają obie wersje.
- **Ekran startowy** wg tablicy FigJam: ciemność jako `RenderTexture`, z której wycierane jest światło pochodni (tekstura radialna z canvasu); pochodnia idzie za kursorem/palcem, a zanim gracz ruszy myszką — krąży przy bramie. Trzy pochodnie na fasadzie zapalają się od pól formularza: imię, mail, dźwignia RODO (`start:progress`). „Wejdź” aktywne przy trzech pochodniach; alternatywa „Wejdź jako gość” (interpretacja notatki „daj mi social media jako alternatywa dla niepewnych” — bez logowania społecznościowego). Brama otwiera się, kamera wjeżdża do środka. **Dane gościa zostają w pamięci** (`state/Visitor.ts`, ADR-4), mail nigdzie nie jest wysyłany (zapis postępu po mailu — nadal backlog P2); imię pojawia się w powitaniu w hotelu. `?guest=1` pomija ekran startowy (testy), `?case=` pomija start i hotel.
- **Fasada**: renesans lubelski z attyką (kosmetyczna decyzja z docs/05 rozstrzygnięta na korzyść Lublina, bo Arek stamtąd startował z teatrami) — rysowana kodem; obraz z API (`_facade`) importowany jako alternatywa do oceny.
- **Dźwięk — placeholdery syntezowane** (Web Audio, bez plików, bez zależności; `src/audio/`): ambient per scena (start: wiatr; hotel: kominek + pad; bieg: pad per świat), kroki, winda, zbliżenie do obrazu, wejście w obraz, otwarcie wyboru, ostrzeżenie zegara, sukces, potknięcie, skok, fragment, finał, fala naprawy, posąg. Kontekst audio startuje po pierwszym geście (polityka autoplay = decyzja z planu Etapu 4). Wyciszenie: **M** albo przycisk w panelu, `?mute=1`. Podmiana na pliki CC0 = wymiana implementacji `AudioDirector.play`.
- **Easter egg posągu**: na każdym piętrze popiersie; 10 kliknięć = iskry i krótka syntezowana melodyjka (placeholder za „Tacio”; docelowo utwór Arka — plik do dostarczenia).
- **Efekty (referencja GRIS: powoli, miękko)**: winieta i zbliżenie kamery 1.04 przy wyborze/QTE, czerwony błysk winiety przy potknięciu, squash postaci przy lądowaniu, oddech w bezruchu, „pop” przeszkód, fala pierścienia przy fragmencie, najazd kamery na ułożony obraz w finale, miękkie wejścia wpisów i opcji w panelu, dźwignia RODO z animacją. Wszystko respektuje `prefers-reduced-motion`.
- **Czas na wybór**: `choiceTimerMs(beat) = max(timerMs, znaki(prompt+opcje)/22 s + 3 s)` w `src/script/timing.ts` — jedno źródło prawdy dla zegara, sceny (dojazd przeszkody) i panelu (podpis „Czas na wybór: N s”). Dla historii pilota daje ok. 15–18 s zamiast 7 s. Parametry w `tuning.ts` (`CHOICE_READ_CPS`, `CHOICE_READ_BUFFER_MS`).
- **Obrazy z API**: wygenerowane przez Gamma (jedyny generator dostępny z sesji; Meshy, którego chciał Arek, jest zablokowany sieciowo). Środowisko Claude Code nie może pobrać plików z CDN Gamma (blokada egress), więc pobieranie robi **GitHub Actions** (`.github/workflows/paintings-import.yml`): zmiana `content/paintings/sources.json` na dowolnej gałęzi uruchamia import, kadrowanie do 960×640 i commit do `public/assets/paintings/<id>.jpg`. Koszt: 70 kredytów/obraz; 13 obrazów (12 case'ów + fasada) = 910 kredytów, zostało 1020. Vertex AI Imagen jest osiągalny sieciowo, ale bez potwierdzonego projektu/klucza — do decyzji Arka, jeśli ma zastąpić Gamma.
- **Usunięte**: `HubStubScene` i `hubLayout.ts` (zastąpione hotelem). Testy e2e wchodzą do obrazu chodząc korytarzem (`data-near`, klawisz E) albo przyciskiem z listy.

### Z tablicy FigJam (odczytanej przez konektor Figma)

Notatki z sekcji „ścieżka V1/V2”, które weszły wprost: ciemny ekran → pochodnia kursorem → pola zapalają pochodnie → „wejdź” (Kingdom Two Crowns); „Edu — minimalistyczny marmur, Kultura — GRIS, Biz — Transistor” (piętro Edukacji jest teraz jasnym kamieniem, nie turkusem); „gdy stoisz pod obrazem, pojawia się w nim postać” (złota sylwetka gościa w obrazie, gdy stoi obok); „jak ruszasz myszką — poczucie, że obraz ma głębię” (obraz przesuwa się za kursorem w ramie); „fun z jazdy windą” (drzwi, ding, przejazd kamery). Odnotowane, ale nie wdrożone: winda z wyborem postaci (Artysta/Edukator/Przedsiębiorca), 9 drzwi jako ikonografia obszarów, pop-up „odblokowałeś galerię”, bramka biletowa jako żart, 4. piętro z galerią i popiersiami mentorów, trzy puste obrazy na koniec („Wyrok gwiazd”, „Wypicie kielicha”, „Szarża słów”), tła pre-renderowane jako filmy, „Klimt i Łempicka to Transistor, ale w marmurze”. Pytanie z tablicy „czy muzyka od razu jest ok?” — rozstrzygnięte: dźwięk startuje po pierwszym geście (polityka przeglądarek), ambient gra już na ekranie startowym.

### Zakres backlogu, który wszedł (na prośbę Arka)

P1 „Hotel jako przestrzeń”, P2 „Ekran startowy” (bez zapisu postępu), P2 „Pipeline generatywny” (Gamma zamiast Imagen), P3 „Dźwięk/muzyka” (placeholdery), P3 „Easter eggi” (posąg, melodyjka-placeholder). Nadal w backlogu: zapis postępu po mailu, galeria finałowa, sztandary partnerów, i18n, CMS z Notion, spersonalizowana historia, deploy na domenie.

---

## 2026-09-10 — Meshy: posągi z modeli 3D

Arek chciał użyć Meshy. Domena `meshy.ai` jest zablokowana sieciowo w środowisku sesji, więc generowanie robi **GitHub Actions** (`meshy-generate.yml`, sekret `MESHY_API_KEY` dodany przez Arka; sesja nie może zakładać sekretów — zabezpieczenia blokują bezpośrednie użycie tokena GitHuba poza wbudowanymi narzędziami). API v2 przyjmuje wyłącznie `art_style: realistic` (400 dla `sculpture`) — charakter rzeźby idzie w prompcie. Pierwsze zamówienie: trzy popiersia (Kultura: marmur z wieńcem, Edukacja: minimalistyczny marmur z książką, Biznes: art-deco brąz) i barokowy kinkiet. Wynik: podglądowe rendery 512×512 (szara „glina” na białym tle) i modele GLB (~1 MB każdy) w `public/assets/meshy/`. Rendery mają wycięte tło (próg bieli z miękką krawędzią) i są przycięte do zawartości — `public/assets/hotel/statue-<świat>.png`; w hotelu stoją na cokole przy końcu korytarza, barwione per świat (marmur / biały / brąz), filtr liniowy (rzeźba, nie pixel-art), fallback: popiersie rysowane kodem. Kinkiet z Meshy zapisany, nieużywany (kinkiety rysowane kodem trzymają płomień w stałym miejscu). Kolejne zamówienia = dopisanie wpisu do `content/meshy/requests.json` i uruchomienie workflow (wejście `only` ogranicza do wybranych id).

---

## 2026-09-10 — Tła biegu z trzech warstw, które składają się w obraz; bogatsze wnętrza; atmosfera

Prośba Arka: „bardziej zaawansowane wnętrza oraz budynek, efekty FX, tła biegu bardziej złożone i składające się w obraz — wygenerować obraz o trzech warstwach, pokroić i złączyć w logiczną całość”.

### Tła biegu (`src/runner/Parallax.ts`, `PaintingShards.ts`)

- **Trzy warstwy per świat z API (Gamma)**: daleki plan (Kultura: rzymskie kopuły pod maureskowym niebem; Edukacja: marmurowa biblioteka z ciepłym światłem; Biznes: blueprintowe miasto z konstelacjami), środkowy (kolumnada z łukami / białe arkady z lampami / kolumny i zębatki z rysunkiem technicznym) i bliski (rekwizyty świata: latarnia, wieniec, amfora, afisze, znicz / ławka, globus, książki, tablica, kwiat / biurko, serwer, kabel, antena, puchar, umowa). Środkowy i bliski są generowane na tle magenta, wycinane do przezroczystości lokalnie (`npm run layers`, Chromium/canvas: alfa z odległości od magenty na rampie 24..255 — dla mieszanki „kolor × magenta” to niemal dokładne krycie, więc rozmycia nie zostają różowe; kolor krawędzi z najbliższego kryjącego piksela; przycięcie pionowe do zawartości; WebP 1440 px, razem ~1 MB na trzy światy).
- **Bezszwowe zawijanie**: BootScene skleja z każdej warstwy kafel „obraz + lustrzane odbicie” jako teksturę canvas (TileSprite nie przyjmuje RenderTexture — pierwsza próba dała zieloną kratkę „brak tekstury”). Mnożniki prędkości: 0.06 / 0.35 / 0.7; ziemia nadal rysowana kodem (postać i przeszkody stoją na niej), barwiona per świat. Brak plików = poprzednia paralaksa rysowana kodem (`data-bg="code"` vs `"layers"`).
- **Tło składa się w obraz**: sześć kafli obrazu case'a dryfuje w warstwach (wyblakłe, sepiowe, lekko unoszą się), rozłożone równomiernie na cyklu 2,2 szerokości ekranu (`shardLayout`, czysta funkcja z testem). Zebrany fragment rozjaśnia „swój” kafel w scenerii. Finał nie rozrzuca już kafli z listy pozycji — bierze te, które akurat są w kadrze (spoza kadru „wchodzą” w kadr), i zlatuje nimi na siatkę. Efekt: obraz był w tle przez cały bieg.
- Manifest: wpisy `runner.layer.<świat>.<warstwa>` (pliki), klucze kafli `…tile`.

### Atmosfera biegu (`src/runner/Atmosphere.ts`)

Snopy światła (klin z gradientem, blend ADD, kołyszą się), pyłki kurzu (miękkie kropki, interpolacja alfy 0→0.55→0), smugi prędkości, gdy świat pędzi ponad tempo bazowe (narracja trzymanym klawiszem). Kolor per świat (złoto / ciepła biel / turkus). W finale atmosfera gaśnie. `prefers-reduced-motion`: mniej cząsteczek, bez kołysania, bez smug.

### Wnętrza hotelu (`src/assets/generators/hotel.ts`, `src/hotel/Floor.ts`)

Sześć mebli w dwóch wersjach (pixel + malarska, przenikają razem ze ścianą): żyrandol, okno ostrołukowe z księżycem, regał, panel art déco (promienie), kotara, pilaster. Kultura: kotary przy drzwiach, żyrandole między obrazami, pilaster przy windzie. Edukacja: okna z księżycem zamiast kinkietów, snopy księżycowego światła na podłogę (ADD), regały przy windzie i posągu. Biznes: panele art déco nad drzwiami, mosiężne pilastry. Na każdym piętrze pyłki kurzu w powietrzu. Budynek (fasada, winda, układ pięter) bez zmian — Arek ocenia najpierw wnętrza i tła.

### Uwagi

- Gamma: 9 obrazów × 70 kredytów = 630; zostało 390.
- Testy e2e pilota sprawdzają `data-bg="layers"`.
