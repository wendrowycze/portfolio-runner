# 03 — Plan etapów pracy

## Zasady przechodzenia między etapami

1. Claude Code startuje każdy etap w **Plan Mode** — przedstawia plan działania (co dokładnie zrobi, jakie pliki powstaną/zmienią się) i **czeka na akceptację** zanim zacznie pisać kod. Dotyczy to zwłaszcza Etapów 0, 2 i 3 (patrz prompty w `prompts/`), gdzie decyzje wpływają na dalsze etapy.
2. Po akceptacji planu — praca.
3. Po ukończeniu zakresu etapu — commit z konwencją `etap-N: krótki opis`.
4. Deploy podglądu (GitHub Pages, patrz `02_ARCHITEKTURA.md` sekcja 14).
5. Raport dla Arka wg szablonu poniżej.
6. **Stop** — Claude Code czeka na akceptację/decyzje Arka, chyba że Arek explicite powie "leć dalej" (wtedy można przejść do kolejnego etapu bez przerwy, ale nadal z osobnym raportem na końcu).

## Reguła "Arek nie czyta kodu"

Cała komunikacja z właścicielem projektu odbywa się przez: **link do działającego podglądu** + **krótki opis po polsku, bez żargonu technicznego**, co ma zobaczyć i sprawdzić + **maksymalnie 1-3 pytania decyzyjne**, każde z rekomendacją Claude Code. Żadnych fragmentów kodu, nazw plików czy komunikatów o błędach w raporcie dla Arka — to trafia najwyżej do `docs/DZIENNIK.md`.

## Tabela zbiorcza etapów

| Etap | Nazwa | Złożoność | Kluczowa decyzja Arka |
|---|---|---|---|
| 0 | Fundament | S | — (akceptacja stacku i planu) |
| 1 | Silnik biegu | M | charakter postaci/tempo biegu |
| 2 | Skrypt i panel dialogowy | M | domyślny layout: stack vs side |
| 3 | Pilot "Teatr jest nasz" | L | mechanika puzzle; docelowa kwota licznika zbiórki |
| 4 | Szlif | M | dźwięk od razu czy po pierwszym kliknięciu |
| 5 | QA i przekazanie | S | kolejne 3 case'y do zrobienia |

---

## Etap 0 — Fundament

**Cel:** działające, puste rusztowanie techniczne, które da się budować dalej i pokazać jako link.

**Zakres — wchodzi:** inicjalizacja repo (Vite + TypeScript strict + Phaser 3), ESLint + Prettier, Vitest (skonfigurowany, choćby z jednym testem placeholder), Playwright (skonfigurowany, jeden test smoke), GitHub Actions workflow budujący i wdrażający na GitHub Pages, jeden ekran startowy pokazujący paletę kolorów i tytuł projektu.

**Zakres — nie wchodzi:** jakakolwiek logika gry, sceny poza jedną startową, treść case'ów.

**Zadania:**
- [ ] `npm create vite` z szablonem `vanilla-ts`, dodanie Phasera
- [ ] konfiguracja `tsconfig.json` (strict: true)
- [ ] ESLint + Prettier (konfiguracja, skrypty `npm run lint`)
- [ ] Vitest — konfiguracja + jeden test przechodzący
- [ ] Playwright — konfiguracja + jeden test smoke (strona się ładuje, widać tytuł)
- [ ] `src/config/palette.ts` ze stałymi kolorów z `docs/04_STYL_I_ASSETY.md`
- [ ] jedna scena Phasera pokazująca tytuł projektu i próbki palety
- [ ] `.github/workflows/deploy.yml` (build + test + e2e + deploy Pages)
- [ ] `vite.config.ts` z poprawnym `base`
- [ ] `docs/DZIENNIK.md` — założony, pierwszy wpis o wyborze stacku

**Definition of Done (mierzalne):**
- `npm run build` kończy się bez błędów
- `npm test` (Vitest) — zielone
- `npm run e2e` (Playwright) — zielone
- link do GitHub Pages pokazuje ekran z tytułem i paletą kolorów w przeglądarce

**Artefakty:** cała struktura repo z `02_ARCHITEKTURA.md` sekcja 1 (szkielet), działający link.

**Weryfikacja:** `npm run build && npm test && npm run e2e`, ręczne otwarcie linku w przeglądarce, zrzut ekranu do `docs/screens/etap0.png`.

**Raport dla Arka (szablon):**
> Etap 0 gotowy: [link]. Zobaczysz na razie tylko ekran startowy z tytułem projektu i próbkami kolorów, które ustaliliśmy — to sprawdzenie, że cała "instalacja" (budowanie, testy, publikacja) działa automatycznie od teraz przy każdej zmianie. Nie ma jeszcze żadnej gry. Sprawdź: czy strona się otwiera na Twoim telefonie i komputerze, czy kolory wyglądają jak w naszej palecie z Figmy. Decyzja: brak pytań na tym etapie — jeśli wszystko się otwiera, mówisz "leć dalej" i przechodzimy do biegania.

**Ryzyka i mitygacja:** GitHub Pages wymaga poprawnego `base` w Vite — błąd tu daje białą stronę z błędami 404 w konsoli; mitygacja: test e2e sprawdza wprost, że strona się ładuje pod pełnym URL-em Pages, nie tylko lokalnie.

---

## Etap 1 — Silnik biegu

**Cel:** generyczny, grywalny szkielet endless runnera — jeszcze bez treści i dialogów.

**Zakres — wchodzi:** paralaksa (3-4 warstwy), postać (bieg automatyczny, skok, potknięcie — placeholder sprite lub prosty CC0), ziemia, przeszkody generowane proceduralnie (na sztywno, nie ze skryptu), kolizje, animacja potknięcia, HUD debug (FPS, prędkość), sterowanie klawiatura (spacja/strzałka) + tap na mobile.

**Zakres — nie wchodzi:** panel dialogowy, wczytywanie case'ów z JSON, wybory, QTE powiązane z treścią.

**Zadania:**
- [ ] `runner/Parallax.ts` — tileSprite, kilka warstw z różną prędkością
- [ ] `runner/Player.ts` — run/jump/stumble, Arcade Physics
- [ ] `runner/Obstacles.ts` — spawn cykliczny, pula obiektów (pooling)
- [ ] kolizje gracz-przeszkoda -> `stumble()`
- [ ] HUD debug (tekst FPS/prędkość, ukrywalny)
- [ ] sterowanie klawiatura + touch/tap
- [ ] `RunnerScene.ts` spinający powyższe w jedną scenę

**Definition of Done:**
- da się biegać i skakać nad przeszkodami na desktopie (klawiatura) i mobile (tap)
- stabilne 60 fps w Chromium na typowym laptopie (widoczne w HUD debug)
- link pokazuje działający bieg

**Artefakty:** `src/runner/*`, `src/scenes/RunnerScene.ts`, zaktualizowany `docs/screens/etap1.png`.

**Weryfikacja:** `npm run build && npm test && npm run e2e`, ręczna gra przez 60 sekund w Chromium i na symulowanym widoku mobile (DevTools), sprawdzenie HUD (FPS ≥ 55 średnio).

**Raport dla Arka:**
> Etap 1 gotowy: [link]. Możesz już biegać i skakać — spacją na komputerze albo dotykiem na telefonie. To surowy szkielet bez historii, chodzi tylko o "czy bieganie jest przyjemne". Sprawdź: czy tempo biegu i wysokość skoku wydają się naturalne, czy nie jest zbyt wolno/szybko. Decyzja: jaki ma być charakter postaci i tempo — bardziej dynamiczne/zręcznościowe (szybszy bieg, krótsze okno na reakcję) czy spokojniejsze/kontemplacyjne (wolniejszy bieg, więcej czasu na czytanie)? Rekomendacja: spokojniejsze tempo, bo priorytetem jest czytelność historii, nie trudność gry.

**Złożoność:** M. **Ryzyka:** dobór wartości fizyki (grawitacja, prędkość skoku) bywa czasochłonny do "wyczucia" — mitygacja: zostawić stałe w jednym pliku konfiguracyjnym, łatwe do iteracji bez zmian w logice.

---

## Etap 2 — Skrypt i panel dialogowy

**Cel:** silnik zaczyna być sterowany danymi (JSON) zamiast logiki na sztywno; pojawia się panel dialogowy.

**Zakres — wchodzi:** `content/schema/case.schema.json`, `content/loader.ts` (walidacja zod), `ScriptRunner`, `DialoguePanel` (typewriter, choice + pasek czasu, action/QTE, narration), integracja przeszkód ze skryptem (`spawnForBeat`), time dilation na czas wyboru, licznik zebranych fragmentów, demo na `content/cases/_demo.json` (6 beatów syntetycznych, nie treść "Teatru"). Layout stack/side przełączany w runtime parametrem URL `?layout=stack|side` (`VITE_LAYOUT` tylko jako wartość domyślna) — oba warianty klikalne pod tym samym linkiem podglądu.

**Zakres — nie wchodzi:** treść case'a "Teatr jest nasz", widgety button/puzzle/reveal w pełnej wersji (wystarczy działający szkielet), dźwięk.

**Zadania:**
- [ ] `content/schema/case.schema.json` wg formatu z `docs/01_GDD_RUNNER_POC.md` (sekcja d)
- [ ] schema zod odpowiadająca schemacie JSON + `loadCase()`
- [ ] `content/cases/_demo.json` — 6 beatów: narration, narration(auto), choice, action, results, finale
- [ ] `script/ScriptRunner.ts` — maszyna stanów + zdarzenia (`beat:start`, `beat:resolved`, `fragment:collected`, `case:finished`)
- [ ] `ui/DialoguePanel.ts` — wszystkie metody `show*` z `02_ARCHITEKTURA.md`
- [ ] `ui/typewriter.ts`
- [ ] integracja: `ObstacleSpawner.spawnForBeat` woła się z `beat:start` dla beatów choice/action
- [ ] `runner/TimeDilation.ts` + spięcie z `Parallax.setSpeedMultiplier`
- [ ] licznik fragmentów w HUD/panelu
- [ ] layout stack/side — dwa warianty CSS Grid, przełączane w runtime parametrem URL `?layout=stack|side`, oba dostępne pod jednym linkiem; `VITE_LAYOUT` (build-time) ustawia tylko wartość domyślną, gdy URL nie ma parametru

**Definition of Done:**
- link pokazuje pełne przejście `_demo.json` od startu do finału, wybory i QTE działają, fragmenty się liczą
- oba warianty layoutu (stack/side) możliwe do obejrzenia pod tym samym linkiem
- Vitest: `ScriptRunner` przechodzi `_demo.json` ze wszystkimi wyborami poprawnymi i z błędnymi

**Artefakty:** `src/script/*`, `src/ui/*`, `content/schema/case.schema.json`, `content/cases/_demo.json`.

**Weryfikacja:** `npm run build && npm test && npm run e2e`, ręczne przejście demo w obu layoutach, zrzuty do `docs/screens/etap2-stack.png` i `etap2-side.png`.

**Raport dla Arka:**
> Etap 2 gotowy: [link] (dopisz na końcu `?layout=side`, żeby zobaczyć drugi wariant). To pierwszy raz, kiedy zobaczysz prawdziwy mechanizm gry: bieg, okno z tekstem i wyborami, spowolnienie czasu przy decyzji. Treść jest jeszcze testowa (nie "Teatr jest nasz"), chodzi o sam mechanizm. Zobaczysz dwa warianty ułożenia ekranu — okno dialogowe na dole (jak w grze fabularnej) albo obok biegu — oba pod tym samym linkiem, przełączane w adresie. Sprawdź oba na komputerze i telefonie. Decyzja: który układ ustawiamy jako domyślny — dół czy bok? (Drugi zawsze zostanie dostępny pod ręką, przez adres). Rekomendacja: dół (klasyczny układ visual novel), bo lepiej działa na wąskich ekranach telefonu.

**Złożoność:** M. **Ryzyka:** synchronizacja Phaser-DOM przy time dilation (panel i bieg muszą czuć się spójnie spowolnione) — mitygacja: jeden wspólny mnożnik czasu czytany przez oba systemy z `GameState`, nie dwa niezależne zegary.

---

## Etap 3 — Pilot "Teatr jest nasz"

**Cel:** pierwszy kompletny, grywalny case od początku do końca z prawdziwą treścią.

**Zakres — wchodzi:** pełny skrypt JSON `content/cases/teatr-jest-nasz.json` (na bazie treści z `content/cases_raw/`), widgety `button` (licznik zbiórki), `puzzle` (zamiana dwóch kafli), `reveal` (fade to black), beat `results` z prawdziwymi statystykami, beat `finale` z układaniem obrazu 3x2 z zebranych fragmentów, `HubStubScene` (zniszczony obraz -> klik -> runner -> po ukończeniu obraz odrestaurowany).

**Zakres — nie wchodzi:** pozostałe case'y, dźwięk, wybór postaci, pełny hub do chodzenia.

**Zadania:**
- [ ] przepisanie treści "Teatr jest nasz" z `content/cases_raw/` do `content/cases/teatr-jest-nasz.json` wg schematu
- [ ] `ui/widgets/ButtonWidget.ts` — animacja licznika 0 -> wartość docelowa
- [ ] `ui/widgets/PuzzleWidget.ts` — klik zamienia dwa kafle, walidacja ułożenia
- [ ] `ui/widgets/RevealWidget.ts` — fade to black i z powrotem
- [ ] beat `results` — karta z 3 skillami (delty) i KPI z case'a
- [ ] beat `finale` — animacja składania 6 fragmentów w obraz (placeholder 3x2), CTA LinkedIn + powrót do huba
- [ ] `HubStubScene.ts` — stan zniszczony/odrestaurowany, przełączany po `case:finished`
- [ ] obraz placeholder "gmach teatru" jako SVG/PNG generowany kodem, podzielony na 6 fragmentów
- [ ] test Playwright pełnego przejścia case'a (klikanie, nie API)

**Definition of Done:**
- pełne przejście case'a (3-5 minut) bez błędów w konsoli przeglądarki
- Playwright przechodzi cały case automatycznie, zielony
- link pokazuje hub ze zniszczonym obrazem -> pełną grę -> odrestaurowany obraz

**Artefakty:** `content/cases/teatr-jest-nasz.json`, `src/ui/widgets/*`, `src/scenes/HubStubScene.ts`, `docs/screens/etap3-*.png`.

**Weryfikacja:** `npm run build && npm test && npm run e2e`, pełne ręczne przejście w Chromium z otwartą konsolą (zero błędów), zrzuty ekranu każdego typu beatu.

**Raport dla Arka:**
> Etap 3 gotowy: [link]. To jest pierwszy pełny "poziom" — historia "Teatr jest nasz" od kliknięcia w zniszczony obraz w holu, przez bieg z wyborami i minigrami, aż po złożenie obrazu z powrotem w całość. Zajmuje 3-5 minut. Sprawdź: czy historia się dobrze czyta, czy minigra ze zrzutką i układanka są zrozumiałe bez tłumaczenia, czy finałowe złożenie obrazu robi wrażenie. Decyzje: (1) czy układanka z fragmentami obrazu ma polegać na przeciąganiu myszką czy na klikaniu (obecnie: klikanie, prostsze na telefonie) — rekomendacja: zostawić klikanie; (2) czy licznik zbiórki ma kończyć się na 200 000 zł (pierwsze dni) czy pokazywać też sumę 500 000+ zł łącznie — rekomendacja: pokazać obie liczby, pierwszą w scenie zbiórki, drugą w wynikach końcowych jako pełny efekt.

**Złożoność:** L. **Ryzyka:** przepisywanie treści z `content/cases_raw/` do formatu beatów wymaga interpretacji (gdzie ciąć na osobne beaty, które momenty są "choice" a które "narration") — mitygacja: trzymać się rytmu opisanego w `content/cases/_SZABLON.md` (naprzemiennie narracja/decyzja, nie więcej niż 2-3 beaty narracyjne pod rząd), zostawić TODO przy niejasnych fragmentach zamiast zgadywać ton wypowiedzi.

---

## Etap 4 — Szlif

**Cel:** grę da się pokazać komuś z zewnątrz bez wstydu za detale.

**Zakres — wchodzi:** SFX CC0 (kroki, skok, potknięcie, zebranie fragmentu), przejścia między beatami/scenami, test na szerokości 375 px, dostępność (nawigacja klawiaturą, widoczny fokus, `prefers-reduced-motion`, kontrast tekstu ≥ 4.5:1), ekran ładowania, obsługa zmiany rozmiaru okna.

**Zakres — nie wchodzi:** nowe case'y, nowe mechaniki gry.

**Zadania:**
- [ ] dobór i wpisanie SFX CC0 do `ASSETS_ATTRIBUTION.md` i `manifest.ts`
- [ ] podpięcie dźwięków pod zdarzenia (`fragment:collected`, skok, potknięcie, krok)
- [ ] przejścia fade/slide między beatami w `DialoguePanel`
- [ ] test manualny + Playwright na viewport 375x667
- [ ] `aria-live`, zarządzanie fokusem na opcjach wyboru
- [ ] media query `prefers-reduced-motion` — wyłączenie/skrócenie animacji
- [ ] audyt kontrastu tekstu panelu (narzędzie devtools/Lighthouse), poprawki kolorów jeśli trzeba
- [ ] ekran ładowania (progress bar Phasera na starcie)
- [ ] `scale.refresh()` na resize, test zmiany rozmiaru okna w trakcie gry

**Definition of Done:**
- Lighthouse Accessibility ≥ 90 na stronie z grą
- gra grywalna i czytelna na szerokości 375 px
- dźwięk słyszalny i niemęczący (nie za głośny, da się wyciszyć — jeśli jest przełącznik, inaczej TODO do backlogu)

**Artefakty:** `public/assets/cc0/sfx/*`, zaktualizowany `manifest.ts`, `ASSETS_ATTRIBUTION.md`, raport Lighthouse.

**Weryfikacja:** `npm run build && npm test && npm run e2e`, Lighthouse (Chromium DevTools), ręczny test na emulowanym 375 px i z klawiaturą (Tab przez całą grę).

**Raport dla Arka:**
> Etap 4 gotowy: [link]. Ta sama gra co w Etapie 3, ale wygładzona: dźwięk, płynniejsze przejścia, działa dobrze na telefonie i dla osób korzystających z klawiatury zamiast myszki. Sprawdź: czy dźwięk Ci odpowiada (głośność, moment włączenia), czy gra dobrze wygląda na Twoim telefonie. Decyzja: czy dźwięk ma włączać się automatycznie od pierwszej sekundy, czy dopiero po pierwszym kliknięciu użytkownika? Rekomendacja: po pierwszym kliknięciu — przeglądarki i tak blokują autoodtwarzanie dźwięku bez interakcji, więc to jednocześnie wymóg techniczny i lepsze doświadczenie (bez zaskoczenia dźwiękiem).

**Złożoność:** M. **Ryzyka:** audio autoplay jest blokowane przez przeglądarki bez wcześniejszej interakcji użytkownika — mitygacja: dźwięk startuje dopiero po pierwszym kliknięciu/tapie (patrz decyzja wyżej), nie przy ładowaniu strony.

---

## Etap 5 — QA i przekazanie

**Cel:** projekt jest gotowy, by Arek albo ktoś inny mógł samodzielnie dodawać kolejne case'y.

**Zakres — wchodzi:** pełne przejście testów e2e, README dla autora treści ("jak dodać nowy case w 20 minut"), `docs/DZIENNIK.md` uzupełniony o wszystkie decyzje z etapów 0-4, GIF/wideo pełnego przejścia, lista otwartych decyzji dla Arka, propozycja kolejnych 3 case'ów do zrobienia.

**Zakres — nie wchodzi:** implementacja kolejnych case'ów (tylko propozycja i przygotowanie gruntu).

**Zadania:**
- [ ] przegląd i uzupełnienie `docs/DZIENNIK.md`
- [ ] README dla autora treści: krok po kroku jak stworzyć plik JSON nowego case'a, zweryfikować go lokalnie, zobaczyć w podglądzie
- [ ] nagranie GIF/wideo pełnego przejścia "Teatr jest nasz" (np. z Playwright trace lub proste nagranie ekranu)
- [ ] zebranie listy otwartych pytań/decyzji nierozstrzygniętych w toku etapów
- [ ] propozycja 3 kolejnych case'ów (na bazie `content/cases_raw/_INDEKS.md` i `content/inwentarz_tresci.md`) z krótkim uzasadnieniem wyboru — uwzględnij, że wszystkie finalne case'y w `content/cases_raw/` są ze świata Kultura (patrz `_INDEKS.md`, „Uwaga o zróżnicowaniu światów"); dla Edukacji i Biznesu nie ma jeszcze gotowego tekstu, trzeba go dopiero napisać wg `content/cases/_SZABLON.md`
- [ ] finalny przegląd `06_BACKLOG_PO_POC.md` — czy nic nie zostało pominięte

**Definition of Done:**
- wszystkie testy (unit + e2e) zielone na czystym `npm ci`
- README dla autora treści pozwala dodać nowy case bez pytania nikogo o pomoc (self-service)
- link finalny działa, gra przechodzi się od początku do końca bez błędów

**Artefakty:** `README_TRESC.md` (albo sekcja w głównym README), `docs/DZIENNIK.md` finalny, plik GIF/wideo, lista decyzji, propozycja case'ów.

**Weryfikacja:** `npm ci && npm run build && npm test && npm run e2e` na czystym katalogu (symulacja nowego środowiska), przegląd README przez osobę nieznającą kodu (jeśli możliwe).

**Raport dla Arka:**
> Etap 5 gotowy: [link] + [GIF przejścia]. To domknięcie pilota: silnik biegu + pełny case "Teatr jest nasz" działają od początku do końca, są przetestowane automatycznie i mamy gotową instrukcję, jak dokładać kolejne historie. Obejrzyj GIF, jeśli nie chcesz grać sam. Decyzja: które 3 case'y robimy jako następne? Proponuję [lista z uzasadnieniem] — możesz zmienić kolejność albo dodać inny z tych 9 przygotowanych z Kubą. Kolejny krok po Twojej decyzji: nowy etap pracy nad wybranymi case'ami, poza zakresem tego pilota.

**Złożoność:** S. **Ryzyka:** ryzyko rozjazdu dokumentacji z kodem, jeśli decyzje z wcześniejszych etapów nie były na bieżąco zapisywane w `DZIENNIK.md` — mitygacja: przegląd retrospektywny wszystkich commitów `etap-N` przed napisaniem README.

---

## Co dalej po PoC

Pełna lista pomysłów wykraczających poza ten pilot (hotel do chodzenia, formularz kontaktowy, wybór postaci, galeria finałowa, pozostałe case'y, dźwięk ambientowy, i18n, CMS) jest w `06_BACKLOG_PO_POC.md`. Nic z tej listy nie jest implementowane w Etapach 0-5 bez wyraźnej decyzji Arka.

## Kryteria oceny PoC jako całości

Po Etapie 5 warto ocenić PoC względem 6 pytań (niezależnie od tego, czy poszczególne DoD etapów zostały spełnione):

1. Czy koncept "wejścia w obraz i przeżycia historii jako biegu" jest zrozumiały bez tłumaczenia w pierwszych 30 sekundach?
2. Czy wybory w trakcie biegu faktycznie wpływają na odczucie tempa/napięcia, czy są tylko kosmetyczne?
3. Czy udało się przekazać realne fakty i liczby z case'u (kwoty, skille, efekt), nie tylko atmosferę?
4. Czy finałowe złożenie obrazu daje satysfakcjonujące poczucie zamknięcia historii?
5. Czy format da się powtórzyć dla kolejnych 8 case'ów bez przepisywania silnika (tylko nowy JSON + obraz)?
6. Czy Arek, pokazując to komuś rekrutującemu/klientowi, czułby dumę, a nie zażenowanie stanem "demo"?
