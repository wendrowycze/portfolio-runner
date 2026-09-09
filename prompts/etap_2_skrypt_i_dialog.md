# Prompt — Etap 2: Skrypt i panel dialogowy

Skopiuj poniższy blok do Claude Code w trybie **Plan Mode**.

```
Kontekst: Etapy 0-1 są zaakceptowane i wdrożone (fundament + bieg działa).
Przeczytaj docs/02_ARCHITEKTURA.md w całości, ze szczególną uwagą na sekcje
2-6 (przepływ scen, moduły ScriptRunner/DialoguePanel, komunikacja
Phaser<->DOM, stan gry, walidacja JSON) oraz docs/03_PLAN_ETAPOW.md (sekcja
"Etap 2"). Sprawdź content/schema/case.schema.json (formalna schema pól
case'a) i docs/DZIENNIK.md.

Zadanie: zrealizuj wyłącznie Etap 2 ("Skrypt i panel dialogowy"). Silnik
zaczyna być sterowany danymi (JSON) zamiast logiki na sztywno. Użyj
content/cases/_demo.json jako danych testowych (6 beatów syntetycznych) —
NIE treści "Teatr jest nasz" (to Etap 3).

Wymagania techniczne:
- src/content/loader.ts — walidacja przez zod, schema zod odpowiadająca
  content/schema/case.schema.json (patrz docs/02_ARCHITEKTURA.md sekcja 6
  i ADR-7 dla uzasadnienia wyboru zod)
- content/cases/_demo.json — 6 beatów: narration (tap), narration (auto),
  choice, action, results, finale — zgodnie z formatem pól ze schemy
  (content/schema/case.schema.json)
- src/script/ScriptRunner.ts — maszyna stanów beatów z publicznym API:
  load(case), start(), resolveChoice(i), triggerAction(), zdarzenia
  beat:start / beat:resolved / fragment:collected / case:finished
  (dokładne sygnatury w docs/02_ARCHITEKTURA.md sekcja 3)
- src/ui/DialoguePanel.ts — showNarration, showChoice, showAction,
  showWidget, showResults, showFinale (nakładka DOM, NIE canvas)
- src/ui/typewriter.ts — efekt maszyny do pisania
- komunikacja Phaser<->DOM wyłącznie przez wspólny EventEmitter
  (src/events/bus.ts) — zero bezpośrednich referencji między scenami a UI
- integracja: beat choice/action wywołuje ObstacleSpawner.spawnForBeat
- src/runner/TimeDilation.ts — spowolnienie 0.35x na czas wyboru,
  zsynchronizowane między Parallax i logiką panelu
- licznik zebranych fragmentów widoczny w interfejsie
- layout stack/side (CSS Grid), przełączany w runtime parametrem URL
  `?layout=stack|side` — oba warianty muszą być możliwe do obejrzenia pod
  tym samym linkiem podglądu bez nowego builda; zmienna budowy
  VITE_LAYOUT=stack|side ustawia tylko wartość domyślną, gdy w URL nie ma
  parametru layout
- test Vitest: ScriptRunner przechodzi _demo.json ze wszystkimi wyborami
  poprawnymi i osobno z błędnymi (case da się ukończyć mimo błędnych
  wyborów — brak "przegrania" historii)

Definition of Done:
- link pokazuje pełne przejście _demo.json z działającymi wyborami, QTE,
  spowolnieniem czasu i licznikiem fragmentów
- oba layouty (stack/side) dostępne i sprawdzone

Zanim zaczniesz: przedstaw plan, w tym implementację przełącznika layoutu
przez parametr URL, i poczekaj na akceptację.

Na koniec: link + raport po polsku wg szablonu z docs/03_PLAN_ETAPOW.md
(Etap 2) — zapytaj wprost, który layout ustawiamy jako domyślny (stack czy
side), z rekomendacją; drugi zostaje zawsze dostępny przez adres URL.
Zrzuty do docs/screens/etap2-stack.png i etap2-side.png.

Zakazy:
- nie wychodź poza Etap 2 (żadnej treści "Teatr jest nasz", żadnych
  widgetów button/puzzle/reveal w pełnej wersji — wystarczy szkielet
  showWidget jeśli demo tego wymaga)
- nie dodawaj zależności npm bez wpisu w docs/DZIENNIK.md (zod jest już
  zaakceptowany, patrz docs/02_ARCHITEKTURA.md ADR-7, nie wymaga
  ponownego uzasadnienia)

Po ukończeniu: commit "etap-2: ...", stop i czekaj na moją odpowiedź.
```
