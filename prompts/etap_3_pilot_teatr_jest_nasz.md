# Prompt — Etap 3: Pilot "Teatr jest nasz"

Skopiuj poniższy blok do Claude Code w trybie **Plan Mode**.

```
Kontekst: Etapy 0-2 są zaakceptowane i wdrożone — silnik biegu i mechanizm
skryptowanych beatów działają na danych testowych. Teraz podpinamy pierwszą
prawdziwą treść. Przeczytaj docs/02_ARCHITEKTURA.md (cały) i
docs/03_PLAN_ETAPOW.md (sekcja "Etap 3"). Przeczytaj też
content/cases_raw/ (treść case'u "Teatr jest nasz" spisana z Kubą) oraz
content/schema/case.schema.json. Sprawdź docs/DZIENNIK.md, żeby znać
wcześniejsze decyzje (m.in. wybór layoutu z Etapu 2).

Zadanie: zrealizuj wyłącznie Etap 3 ("Pilot Teatr jest nasz") — pierwszy
kompletny, grywalny case od kliknięcia w zniszczony obraz do jego
odbudowania.

Wymagania techniczne:
- content/cases/teatr-jest-nasz.json — przepisz treść z content/cases_raw/
  na format beatów zgodny ze schema (content/schema/case.schema.json /
  docs/02_ARCHITEKTURA.md).
  Zachowaj rytm: naprzemiennie narracja i decyzja, max 2-3 beaty narracyjne
  pod rząd. 6 beatów z reward.fragment (obraz podzielony 3x2). Jeśli jakiś
  fragment treści jest niejednoznaczny co do formy (choice czy action,
  gdzie ciąć), zostaw TODO w JSON zamiast zgadywać ton wypowiedzi.
- src/ui/widgets/ButtonWidget.ts — widget "zrzutka": klik = animowany
  licznik rosnący do wartości docelowej
- src/ui/widgets/PuzzleWidget.ts — klik zamienia dwa kafle, walidacja
  poprawnego ułożenia
- src/ui/widgets/RevealWidget.ts — fade to black i z powrotem
- beat results — karta z 3 skillami (delty) i KPI z treści case'a
- beat finale — animacja składania 6 fragmentów w pełny obraz (placeholder
  3x2 wygenerowany kodem/SVG), tekst zamknięcia, CTA (LinkedIn + powrót do
  huba)
- src/scenes/HubStubScene.ts — jeden zniszczony obraz na ścianie, klik =
  wejście do RunnerScene; po case:finished obraz wraca odrestaurowany
- test Playwright: pełne przejście case'a przez faktyczne klikanie
  (nie wołanie API bezpośrednio), zrzuty do docs/screens/

Definition of Done:
- pełne przejście case'a (3-5 minut) bez błędów w konsoli przeglądarki
- Playwright przechodzi cały case automatycznie i jest zielony
- link pokazuje hub -> pełną grę -> odrestaurowany obraz

Zanim zaczniesz: przedstaw plan, w tym wstępny podział treści z
content/cases_raw/ na konkretne beaty (lista id beatów + typ), i poczekaj
na akceptację przed pisaniem kodu i przed finalnym zapisem JSON.

Na koniec: link + raport po polsku wg szablonu z docs/03_PLAN_ETAPOW.md
(Etap 3) — zadaj dwie decyzyjne pytania z rekomendacją: (1) puzzle jako
klikanie czy przeciąganie, (2) czy licznik zbiórki kończy na 200 000 zł
czy pokazuje też 500 000+ zł łącznie.

Zakazy:
- nie wychodź poza Etap 3 (żadnych innych case'ów, żadnego dźwięku)
- nie dodawaj zależności npm bez wpisu w docs/DZIENNIK.md
- treść tylko w content/ — zero tekstów narracyjnych zaszytych w kodzie TS

Po ukończeniu: commit "etap-3: ...", stop i czekaj na moją odpowiedź.
```
