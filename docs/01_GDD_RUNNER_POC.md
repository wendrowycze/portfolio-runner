# Game Design Document — PoC „Silnik biegu + 1 case"

Status: wersja robocza do implementacji Etapu 1–3. Ten dokument jest operacyjnym zapisem ustaleń projektowych dla PoC — zgodny z `CLAUDE.md` i `docs/02_ARCHITEKTURA.md`. Wszystkie parametry liczbowe z tego dokumentu muszą trafić do jednego pliku `src/config/tuning.ts` (patrz sekcja k) — nic nie może być zahardkodowane w komponentach.

## a. Cel i emocja

Cel gracza (właściciela portfolio Arka lub rekrutera/klienta, który wszedł w „obraz"): przejść przez historię jednego case'a, robiąc w drodze wybory i akcje, i na końcu zobaczyć — dosłownie — jak fragmenty zniszczonego obrazu składają się w całość.

Emocja, jaką ma wywołać PoC:
- **Napięcie chwilowe, nie zagrożenie życia.** Gracz nigdy nie przegrywa historii — może ją tylko przejść gorzej (więcej potknięć). Emocja to „zdążę czy się potknę", nie „przegram grę".
- **Satysfakcja z synchronizacji.** Timing akcji (skok w oknie czasowym, wybór przed upływem paska czasu) ma dawać przyjemność trafienia w rytm — podobnie jak w prostych endless runnerach (Chrome Dino, Alto's Adventure), ale z warstwą narracyjną.
- **Uczucie „poznaję prawdziwą historię".** Tekst jest wierny faktycznemu case'owi Arka — gracz ma poczuć, że to nie fikcyjna gra, tylko opowiedziane realne wydarzenie z 2022 roku.
- **Domknięcie.** Finałowe układanie obrazu (kafle wlatują, złoty rozbłysk) ma dać wyraźny sygnał „koniec, dobra robota" — moment nagrody, nie tylko ekran wyników.

## b. Układ ekranu

> **Aktualizacja 2026-09-09 (decyzja Arka, Etap 0):** layoutem domyślnym jest `side` (opowieść po lewej, bieg po prawej); `stack` pozostaje dostępny pod `?layout=stack`. Poniższy opis wariantów jest nadal aktualny, zmienia się tylko wartość domyślna.

### Desktop / landscape (layout `stack`, zapasowy)

- Kontener gry: pełna wysokość viewportu, `width: 100%`, `max-width` nieograniczony (canvas Phasera skaluje się do kontenera przez `Phaser.Scale.FIT` lub `RESIZE` — patrz niżej).
- **Runner** (górna połowa): `height: 50%` kontenera, `width: 100%`. Canvas Phasera renderuje tu paralaksę, ziemię, postać, przeszkody, HUD (licznik fragmentów, licznik potknięć).
- **Panel dialogowy** (dolna połowa): `height: 50%`, `width: 100%`, DOM (HTML/CSS) nad/pod canvasem — nie w canvasie. Zawiera: pasek tytułu beatu (opcjonalnie), tekst narracji z typewriterem, opcje wyboru, pasek czasu (choice/action), widgety interakcji, przycisk „dalej".
- Podział 50/50 jest sztywny w layoucie `stack` — nie zależy od długości tekstu.

### Wariant `side` (do testu w Etapie 2)

- Panel dialogowy: `width: 40%` z lewej, `height: 100%`.
- Runner: `width: 60%` z prawej, `height: 100%`.
- Ten sam zestaw komponentów, inny kontener CSS Grid (`grid-template-columns: 40% 60%` vs `grid-template-rows: 50% 50%`). Przełącznik layoutu to jedna zmienna CSS Grid — komponenty nie wiedzą, w którym są layoucie.
- Przełączanie: parametrem URL `?layout=stack` lub `?layout=side`, odczytywanym w runtime (JS), żeby Arek mógł porównać oba warianty pod jednym linkiem bez nowego builda. Zmienna budowy `VITE_LAYOUT` ustawia tylko wartość domyślną, gdy w URL nie ma parametru `layout` — patrz `docs/02_ARCHITEKTURA.md` sekcja 10.

### Zachowanie przy resize

- Nasłuch na `window.resize` (debounce 150 ms). Kontener DOM jest źródłem prawdy dla wymiarów (CSS %/Grid) — Phaser dostaje `scale.resize(width, height)` runnerowego kontenera po każdej zmianie.
- Paralaksa (tileSprite) i pozycja gruntu przeliczane proporcjonalnie — postać zawsze na tej samej wysokości względem dolnej krawędzi runnera (`groundY = runnerHeight * 0.8`).
- Przeszkoda w locie (już zespawnowana) podczas resize: przelicza pozycję proporcjonalnie do nowej szerokości, żeby czas dotarcia (`timerMs`) się nie rozjechał — patrz stany brzegowe (i).

### Mobile portrait (min. 375 px)

- Ten sam układ góra/dół co desktop stack, ale: czcionka panelu min. 16 px (zapobiega auto-zoomowi w Safari), przyciski wyboru min. wysokość 44 px (touch target), pasek czasu wyższy (8 px zamiast 4 px) dla czytelności.
- Runner na 375 px szerokości: paralaksa nadal 3–4 warstwy, ale gęstość elementów tła zmniejszona (mniej powtórzeń tile na ekran, żeby nie było gęsto).

### Sterowanie

| Akcja | Klawiatura | Mysz | Dotyk |
|---|---|---|---|
| Skok (action) | Spacja, ↑ | klik w obszar runnera | tap w obszar runnera |
| Wybór opcji 1/2/3 | 1 / 2 / 3 | klik na opcję | tap na opcję |
| Dalej (narration) | Enter, Spacja | klik w panel | tap w panel |
| Fokus na opcjach (a11y) | Tab + Enter | — | — |

Wejście jest globalne dla aktywnego beatu — silnik ignoruje wejścia nieadekwatne do typu beatu (np. spacja podczas `choice` nie liczy się jako wybór, tylko jako brak akcji).

## c. Pętla: auto-run, prędkość, time dilation

- **Auto-run**: postać biegnie zawsze, gracz nie steruje ruchem w poziomie. Prędkość bazowa: `runner.baseSpeed` z case'a (domyślnie 220 px/s w `content/cases/*.json`, zmienna `TUNING.BASE_SPEED` jako fallback silnika).
- **Przyspieszanie w narracji**: podczas beatu `narration` prędkość rośnie do `TUNING.NARRATION_SPEED_MULT` (domyślnie ×1.15) względem `baseSpeed` — daje wrażenie płynięcia przez tło podczas czytania, bez przeszkód do ominięcia.
- **Time dilation w choice/action**: gdy beat typu `choice` lub `action` się rozpoczyna, prędkość świata (paralaksa, prędkość zbliżania się przeszkody, animacje tła) mnożona jest przez `TUNING.TIME_DILATION_FACTOR = 0.35`. Przejście do spowolnionej prędkości i z powrotem do normalnej to tween `TUNING.TIME_DILATION_EASE_MS = 300` ms, easing `Sine.easeInOut`. Postać sama (animacja biegu) nie zwalnia proporcjonalnie tak samo jak tło — żeby nie wyglądała na spowolnioną w miejscu, jej animacja frame-rate biegu spada tylko do ×0.7, dając wrażenie „czas dokoła zwalnia, Ty reagujesz szybciej".
- Po rozwiązaniu beatu (wybór dokonany / QTE trafione lub nie) — tween z powrotem do ×1.0 w tym samym czasie `TIME_DILATION_EASE_MS`.

## d. Specyfikacja typów beatów

Konwencja dla każdego typu: **Panel** (co widać w DOM), **Runner** (co dzieje się w scenie Phasera), **Wejście gracza**, **Sukces/porażka**, **Timing**, **Feedback**, **Przejście dalej**.

### narration

- Panel: tekst efektem typewriter (domyślnie `TUNING.TYPEWRITER_CPS = 45` znaków/s), potem widoczny przycisk/wskazówka „dalej” (strzałka pulsująca).
- Runner: bieg w prędkości `NARRATION_SPEED_MULT`, brak przeszkód, paralaksa płynie.
- Wejście: tap/klik/Enter — jeśli typewriter jeszcze pisze, pierwsze wejście dopisuje resztę tekstu natychmiast (skip), drugie wejście przechodzi dalej.
- Sukces/porażka: nie dotyczy (zawsze „sukces").
- Timing: jeśli `advance: "auto"` — automatyczne przejście po `durationMs` (dodatkowo counted od momentu zakończenia typewritera, nie od startu beatu). Jeśli `advance: "tap"` — czeka na wejście, bez limitu czasu.
- Feedback: brak dźwięku specjalnego poza cichym „tyk" przy każdym znaku (placeholder, wyłączalny).
- Przejście: do kolejnego beatu w kolejności tablicy `beats`.

### choice

- Panel: prompt (pytanie), 2–3 opcje jako przyciski, pasek czasu odliczający `timerMs` (wypełnienie maleje liniowo z kolorem zmieniającym się z `#ACCBC6` na `#742224` poniżej 30% czasu).
- Runner: na starcie beatu spawnuje się przeszkoda związana z `obstacle` (patrz sekcja e), time dilation aktywne (×0.35).
- Wejście: klik/tap na opcję lub klawisz 1/2/3.
- Sukces: wybór z `correct: true` → postać automatycznie przeskakuje/mija przeszkodę (animacja jump/pass 400 ms), zbiera fragment jeśli `reward.fragment` jest ustawiony, +1 do skilla z `option.skill`, prędkość wraca do normalnej.
- Porażka: wybór z `correct: false`, LUB brak wyboru przed upływem `timerMs` (traktowane jak nietrafna opcja) → animacja potknięcia (600 ms, patrz sekcja e), krótki feedback tekstowy z `option.feedback` (dla braku wyboru — feedback generyczny „Nie zdążyłeś zareagować — spróbujmy jeszcze raz."), licznik potknięć +1. **Aktualizacja 2026-09-09 (decyzja Arka „zła decyzja zatrzymuje bieg”, wdrożona w Etapie 2):** świat zatrzymuje się na czas feedbacku (2 s), po czym **ten sam beat wraca** (przeszkoda spawnuje się ponownie, zegar startuje od nowa) — aż do trafnej reakcji. Fragment jest przyznawany dopiero przy trafieniu, więc finał zawsze ma komplet fragmentów. Zasada „nie da się przegrać historii” zostaje: nie ma game over, tylko brak postępu do czasu trafnej decyzji.
- Timing: `timerMs` z JSON (typowo 6000–8000 ms). Feedback wyświetlany 2000 ms przed przejściem dalej.
- Feedback wizualny/dźwiękowy: trafienie — błysk zielonkawej poświaty na przeszkodzie + SFX „success-chime" (placeholder); nietrafienie — czerwone potrząśnięcie ekranu (mikro, 150 ms, wyłączane w reduced-motion) + SFX „stumble" (placeholder).
- Przejście: po rozwiązaniu (sukces natychmiast po animacji skoku, porażka po 2 s feedbacku) do kolejnego beatu.

### action

- Panel: prompt (np. „Skocz!"), duży wizualny wskaźnik strefy QTE (pasek/pierścień wypełniający się), bez opcji tekstowych.
- Runner: przeszkoda `obstacle` spawnuje się tak, by wejść w strefę QTE dokładnie w oknie `windowMs` (patrz wzór w sekcji e).
- Wejście: `input: "jump"` → spacja/↑/klik/tap w dowolnym momencie trwania beatu.
- Sukces: wejście zarejestrowane w oknie `windowMs`, gdy przeszkoda jest w strefie QTE → skok, fragment (jeśli zdefiniowany), +1 do powiązanego skilla (jeśli podany).
- Porażka: brak wejścia w oknie LUB wejście poza oknem → potknięcie (600 ms), bez fragmentu. **Aktualizacja 2026-09-09:** jak w `choice` — świat staje na czas feedbacku, potem beat wraca (nowa przeszkoda, nowe okno), aż do trafionego skoku.
- Timing: okno `windowMs` (typowo 800 ms) rozpoczyna się gdy przeszkoda wchodzi w strefę QTE (nie od startu beatu — patrz sekcja e).
- Feedback: jak w `choice` (błysk/SFX sukcesu, potrząśnięcie/SFX potknięcia).
- Przejście: natychmiast po rozstrzygnięciu (sukces); po porażce — powrót do tego samego beatu (patrz wyżej).

### interaction

Trzy warianty widgetu (`widget`), wspólne dla wszystkich: panel zatrzymuje typowy przepływ narracji i pokazuje interaktywny komponent DOM; runner w tle biegnie w tle bez przeszkód (prędkość normalna, bez time dilation — to nie jest moment refleksowy, tylko eksploracyjny/emocjonalny).

- **button** (np. „WESPRZYJ TEATR"): przycisk stylizowany na crowdfunding. Wejście: klik/tap/Enter (fokus). Sukces: zawsze — po kliknięciu licznik (`counter.from` → `counter.to`) animuje się w górę (2000 ms, easing `Cubic.easeOut`), z sufiksem (`counter.suffix`). Feedback: przyrost liczb w locie + konfetti/iskry (placeholder cząsteczki), SFX „coin-tick" narastający. Przejście: przycisk „dalej" aktywuje się po zakończeniu animacji licznika (min. 2000 ms, nie da się przejść dalej wcześniej — to jest chwila do przeczytania KPI).
- **reveal**: „zamknij oczy" — pełnoekranowy fade-to-black (600 ms) nad całym kontenerem gry (runner + panel), krótka pauza (800 ms) z tekstem na czarnym tle, potem fade-from-black (600 ms). Wejście: tap/klik/Enter po zakończeniu fade-in odsłania wcześniej fade-out. Sukces: zawsze. Przejście: automatyczne po pełnym cyklu (ok. 2500 ms) lub po tapie w trakcie ciemnego ekranu (skip pauzy, ale nie skip samego fade).
- **puzzle**: uproszczony wariant — siatka kafli (rozmiar wg `painting.cols × painting.rows`, w pilocie 3×2 dla docelowego obrazu finałowego; jeśli puzzle dotyczy osobnej grafiki jak w tym case, siatka 3×2 tej właśnie płaskorzeźby), klik w kafel #1 potem klik w kafel #2 zamienia je miejscami. Wejście: klik/tap w dwa kafle po kolei. Sukces: wszystkie kafle na właściwych miejscach (silnik sprawdza po każdej zamianie). Feedback: kafel na dobrym miejscu dostaje delikatną złotą obwódkę; cała plansza ułożona → błysk + SFX „puzzle-complete". Przejście: automatyczne 800 ms po ułożeniu całości; brak limitu czasu (nie da się przegrać, tylko dłużej klikać).

### results

- Panel: karta na pełną szerokość panelu (lub overlay pełnoekranowy) z: 3 paskami skilli (nazwa + suma delt zebranych w trakcie, animowany przyrost 0→wartość w 800 ms), listą KPI z case'a (`kpis[]`, tekst statyczny — dane nie są generowane przez silnik, tylko przepisane z JSON), liczbą potknięć, czasem przejścia (mm:ss).
- Runner: postać zatrzymuje się (bieg w miejscu / idle animacja), tło przestaje przewijać się.
- Wejście: klik/tap/Enter na przycisk „Zobacz obraz” (przejście do finale).
- Sukces/porażka: nie dotyczy — to ekran informacyjny.
- Timing: bez limitu, gracz kontroluje tempo.
- Feedback: paski skilli wypełniają się z lekkim „tyknięciem" na każde 10 punktów (placeholder SFX).
- Przejście: do beatu `finale` po kliknięciu.

### finale

Patrz szczegółowa sekwencja w sekcji (h).

## e. System przeszkód

### Wzór spawnu

Każda przeszkoda powiązana z beatem (`choice`, `action`) ma spawnować się w takiej odległości od postaci, by dotrzeć do niej dokładnie po czasie zdefiniowanym w beacie (`timerMs` dla `choice`, lub czasie do początku strefy QTE dla `action`).

```
dystans_spawn_px = prędkość_świata_px_na_s × czas_dotarcia_s
```

Gdzie:
- `prędkość_świata_px_na_s` = `runner.baseSpeed × TIME_DILATION_FACTOR` (bo w momencie spawnu beat już aktywował time dilation) — domyślnie `220 × 0.35 = 77 px/s`.
- `czas_dotarcia_s` dla `choice` = `timerMs / 1000` (przeszkoda ma dotrzeć do postaci dokładnie gdy upływa czas na wybór — moment „zderzenia" pokrywa się z rozstrzygnięciem).
- `czas_dotarcia_s` dla `action` = `(startStrefyQTE_Ms) / 1000`, gdzie `startStrefyQTE_Ms` to stały offset `TUNING.ACTION_ZONE_START_MS` (domyślnie 1500 ms — przeszkoda spawnuje się, płynie 1500 ms, wchodzi w strefę QTE, gracz ma `windowMs` na reakcję zanim przeszkoda dotrze do postaci).

Przykład (choice, `timerMs = 7000`): `dystans = 77 × 7 = 539 px`. Przeszkoda spawnuje się 539 px przed postacią i płynie w kierunku postaci przy prędkości spowolnionej (time dilation), docierając do niej dokładnie w momencie `timerMs`.

### Strefa QTE (action)

- Strefa QTE to zakres pikseli tuż przed postacią: `[groundX - TUNING.QTE_ZONE_WIDTH_PX, groundX]`, domyślnie szerokość strefy `TUNING.QTE_ZONE_WIDTH_PX = 120` px.
- Okno czasowe `windowMs` z beatu odpowiada czasowi, w jakim przeszkoda fizycznie przemierza tę strefę przy aktualnej (spowolnionej) prędkości: `windowMs ≈ QTE_ZONE_WIDTH_PX / (prędkość_świata_px_na_s / 1000)`. Wartość w JSON (`windowMs`) jest źródłem prawdy dla logiki „trafienia" (silnik nie przelicza jej z geometrii — geometria jest tylko wizualną spójnością); jeśli się rozjadą, silnik loguje ostrzeżenie w konsoli w trybie dev.
- Wejście gracza zarejestrowane w dowolnym momencie, gdy współrzędna X przeszkody mieści się w strefie QTE = trafienie.

### Zachowanie przy potknięciu

- Animacja potknięcia: 600 ms (`TUNING.STUMBLE_ANIM_MS`), sprite/placeholder przechyla się i odzyskuje równowagę (prosty tween rotacji ±8° i powrót).
- Prędkość świata spada do `TUNING.STUMBLE_SPEED_MULT = 0.5` × aktualnej prędkości bazowej natychmiast w momencie potknięcia, i wraca do 1.0× w ciągu `TUNING.STUMBLE_RECOVERY_MS = 1000` ms (tween `Quad.easeOut`).
- Przeszkoda, o którą postać się potknęła, znika (fade 200 ms) — nie zostaje na trasie do ponownego zderzenia.
- Licznik potknięć w HUD +1, widoczny cały czas w runnerze (mały licznik w rogu, styl debug/RPG).

## f. Fragmenty obrazu

- 6 fragmentów łącznie (`painting.cols=3 × painting.rows=2`), numerowane 1–6 w kolejności zbierania w skrypcie (niekoniecznie w kolejności geometrycznej na siatce finałowej — kolejność geometryczna jest ustalana w finale, patrz (h)).
- HUD w runnerze: licznik „X/6" w rogu ekranu (ten sam róg co licznik potknięć, rozdzielone), aktualizowany natychmiast po przyznaniu fragmentu.
- Animacja zebrania: w momencie przyznania fragmentu (po udanym `choice`/`action`) miniatura fragmentu „odrywa się" od miejsca przeszkody i leci (tween 500 ms, `Cubic.easeIn`, z lekkim narastaniem skali w locie 0.6→1.0 potem szybkim zmniejszeniem do 0.3 przy dotarciu) do pozycji licznika w HUD, gdzie licznik miga i rośnie o 1. SFX „fragment-collect" (placeholder, wznoszący dźwięk).

## g. Skille i statystyki

- 3 skille zdefiniowane w `case.skills[]`: „Pozyskiwanie partnerów", „Organizacja zbiórek publicznych", „Aktywizacja społeczności".
- Przyrosty: każda `correct: true` opcja w `choice` z polem `option.skill` dodaje +1 do wskazanego skilla (wewnętrzny licznik silnika, nie w JSON). `results.stats[]` w JSON zawiera deltę do **wyświetlenia** (np. `+10`) — jest to wartość narracyjna/prezentacyjna dopasowana przez autora treści, niezależna od surowego licznika trafień silnika (silnik nie wylicza automatycznie wartości punktowej, tylko pokazuje to, co jest w JSON — upraszcza to balansowanie bez zmian w kodzie).
- Ekran startowy (poza zakresem PoC, patrz `docs/00_KONCEPCJA.md` — brak ekranu wyboru postaci) nie pokazuje skilli przed rozpoczęciem; w PoC skille pokazywane są wyłącznie na ekranie `results`.
- Ekran results: 3 poziome paski/liczniki, nazwa skilla + wartość delty animowana 0→wartość w 800 ms (`Cubic.easeOut`), plus sekcja KPI (statyczne teksty z `results.kpis[]`), liczba potknięć, czas przejścia całego case'a (stoper start przy pierwszym beacie, stop przy wejściu w `results`).

## h. Finale — sekwencja układania obrazu

1. Wejście do beatu `finale` (po `results`, po kliknięciu „Zobacz obraz").
2. Tło: pełnoekranowy overlay z ciemnym tłem (kolor `#261619` z palety), na środku pusta siatka 3×2 (obrys kafli, `painting.cols × rows`).
3. Kafle wlatują na siatkę w **kolejności zebrania** (nie geometrycznej) — każdy kafel leci z boku ekranu (naprzemiennie lewa/prawa krawędź) do swojej **docelowej pozycji geometrycznej** na siatce (pozycja geometryczna = numer fragmentu 1–6 czytany wiersz po wierszu, lewo-prawo, góra-dół). Tween 400 ms na kafel, `Back.easeOut` (lekkie „doskoczenie"). Odstęp między startem kolejnych kafli: `TUNING.FINALE_TILE_STAGGER_MS = 150` ms.
4. Po wylądowaniu ostatniego kafla (6/6): 300 ms pauzy, potem **złoty rozbłysk** — radialny gradient/particle burst w kolorze `#DFB67C`, 500 ms, przechodzący w delikatne złote obramowanie całego obrazu, które zostaje na stałe widoczne.
5. Pod obrazem pojawia się podpis (`painting.caption` z JSON) — fade-in 400 ms.
6. Pojawia się tekst zakończenia (`finale.text` z JSON) w panelu pod obrazem lub obok, efektem typewriter jak w `narration`.
7. CTA: dwa przyciski — „Poznaj Arka na LinkedIn" (`finale.cta.url`, otwiera w nowej karcie) i „Wróć do hotelu" (drugi, generowany przez silnik, nie z JSON — poza zakresem treści case'a).
8. Kliknięcie „Wróć do hotelu": przejście do `HubStubScene` — stub hubu renderuje ten sam obraz, tym razem oznaczony jako **odrestaurowany** (bez pęknięć/uszkodzeń — placeholder graficzny podmieniony na wersję „całą", z lekką złotą poświatą w tle jako sygnał ukończenia).

## i. Stany brzegowe

- **Brak wejścia w `choice`**: traktowane identycznie jak wybór opcji `correct: false` — potknięcie, feedback generyczny, brak fragmentu, historia idzie dalej. Nie blokuje progresu.
- **Szybkie/wielokrotne klikanie**: silnik debounce'uje wejścia na 150 ms (`TUNING.INPUT_DEBOUNCE_MS`) — drugi klik w tym oknie jest ignorowany. Kliknięcie w opcję już rozstrzygniętego beatu (np. po animacji sukcesu, przed przejściem dalej) jest no-opem.
- **Zmiana rozmiaru okna w trakcie beatu**: layout przelicza się natychmiast (patrz sekcja b), aktywne tweeny (time dilation, animacja fragmentu) kontynuują na nowych współrzędnych proporcjonalnych — silnik nie restartuje beatu. Jeśli trwa QTE, `windowMs` nie resetuje się (timer działa niezależnie od rozmiaru okna).
- **Utrata focusu okna/karty** (`visibilitychange` / `blur`): gra pauzuje globalnie (wszystkie tweeny, timery `timerMs`/`windowMs`, typewriter) — wznowienie przy `focus` z dokładnie tym samym stanem. Zapobiega ukaraniu gracza za przełączenie karty.
- **`prefers-reduced-motion: reduce`**: typewriter wyłączony — tekst pojawia się natychmiast w całości; brak tweenów kamery/potrząśnięć ekranu; time dilation nadal działa (to mechanika rozgrywki, nie ozdobnik), ale bez dodatkowych efektów cząsteczkowych przy przejściu; animacja fragmentów i finałowe kafle nadal się poruszają (to informacja o stanie gry, nie czysta dekoracja), ale bez easingów typu `Back`/overshoot — proste liniowe przejścia.

## j. Metryki „grywalności" — pytania kontrolne dla Arka

Do sprawdzenia na linku podglądu po Etapie 3, 5 pytań tak/nie:

1. Czy rozumiesz bez podpowiedzi, że masz kliknąć/wcisnąć spację, gdy pojawia się prompt akcji?
2. Czy zdążyłeś przeczytać każdy fragment narracji, zanim scena poszła dalej (albo czy miałeś kontrolę, by przejść dopiero gdy skończysz czytać)?
3. Czy moment spowolnienia czasu przy wyborze/akcji był zauważalny i pomógł Ci zareagować?
4. Czy finałowe układanie obrazu dało poczucie „nagrody" na koniec?
5. Czy potknięcie się (błędny wybór/spóźniona reakcja) było zrozumiałe jako „mniejszy sukces", a nie jako przegraną gry?

## k. Tabela parametrów strojenia (`src/config/tuning.ts`)

| Nazwa | Wartość domyślna | Zakres |
|---|---|---|
| `BASE_SPEED` | 220 px/s | 120–400 |
| `NARRATION_SPEED_MULT` | 1.15 | 1.0–1.5 |
| `TIME_DILATION_FACTOR` | 0.35 | 0.2–0.6 |
| `TIME_DILATION_EASE_MS` | 300 ms | 150–600 |
| `TYPEWRITER_CPS` | 45 znaków/s | 20–80 |
| `ACTION_ZONE_START_MS` | 1500 ms | 800–2500 |
| `QTE_ZONE_WIDTH_PX` | 120 px | 60–200 |
| `STUMBLE_ANIM_MS` | 600 ms | 400–900 |
| `STUMBLE_SPEED_MULT` | 0.5 | 0.3–0.7 |
| `STUMBLE_RECOVERY_MS` | 1000 ms | 600–1500 |
| `FRAGMENT_FLY_MS` | 500 ms | 300–800 |
| `FINALE_TILE_STAGGER_MS` | 150 ms | 80–300 |
| `FINALE_TILE_FLY_MS` | 400 ms | 250–600 |
| `FINALE_FLASH_MS` | 500 ms | 300–800 |
| `INPUT_DEBOUNCE_MS` | 150 ms | 80–300 |
| `RESIZE_DEBOUNCE_MS` | 150 ms | 80–300 |
| `BUTTON_COUNTER_MS` | 2000 ms | 1200–3000 |
| `REVEAL_FADE_MS` | 600 ms | 300–1000 |
| `REVEAL_HOLD_MS` | 800 ms | 400–1500 |
| `RESULTS_STAT_FILL_MS` | 800 ms | 400–1500 |

Wszystkie te wartości MUSZĄ być zdefiniowane w jednym pliku `src/config/tuning.ts` jako pojedynczy eksportowany obiekt (np. `export const TUNING = {...}`) — żaden komponent nie hardkoduje własnej kopii tych liczb.
