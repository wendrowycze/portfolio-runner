# Prompt — Etap 5: QA i przekazanie

Skopiuj poniższy blok do Claude Code w trybie **Plan Mode**.

```
Kontekst: Etapy 0-4 są zaakceptowane i wdrożone — pełny, dopracowany pilot
"Teatr jest nasz" działa. Przeczytaj docs/03_PLAN_ETAPOW.md (sekcja
"Etap 5") i docs/06_BACKLOG_PO_POC.md. Sprawdź docs/DZIENNIK.md w całości
(wszystkie wpisy z Etapów 0-4) i content/inwentarz_tresci.md oraz
content/cases_raw/_INDEKS.md.

Zadanie: zrealizuj wyłącznie Etap 5 ("QA i przekazanie") — domknięcie
pilota i przygotowanie gruntu pod kolejne case'y, bez implementowania ich.

Wymagania techniczne:
- uruchom npm ci && npm run build && npm test && npm run e2e na czystym
  stanie repo (symulacja nowego środowiska) i napraw wszystko co nie
  przechodzi
- napisz README dla autora treści (osobny plik lub sekcja w README.md):
  krok po kroku, jak dodać nowy case w ok. 20 minut — tylko edycja JSON
  wg schema + dodanie obrazu do content/schema i public/assets/paintings,
  bez dotykania kodu TS; podaj przykład na bazie _demo.json
- zaktualizuj docs/DZIENNIK.md o wszelkie decyzje z Etapów 0-4, które nie
  zostały jeszcze zapisane (przejrzyj historię commitów etap-0..etap-4)
- nagraj GIF lub krótkie wideo pełnego przejścia case'a "Teatr jest nasz"
  (np. z Playwright trace/video albo nagranie ekranu) i zapisz w
  docs/screens/ lub osobnym katalogu docs/media/
- zbierz listę otwartych pytań/decyzji, które padły w raportach Etapów 0-4
  i nie zostały jeszcze rozstrzygnięte przez Arka
- na bazie content/cases_raw/_INDEKS.md i content/inwentarz_tresci.md
  zaproponuj 3 kolejne case'y do zrobienia po pilocie, z jednozdaniowym
  uzasadnieniem każdego wyboru (np. różnorodność światów Kultura/
  Edukacja/Biznes, mocne liczby, łatwość dopasowania do formatu beatów)
- przejrzyj docs/06_BACKLOG_PO_POC.md pod kątem kompletności — czy nic z
  ustaleń projektowych nie zostało pominięte

Definition of Done:
- wszystkie testy zielone na czystym npm ci
- README dla autora treści pozwala dodać case bez pytania nikogo o pomoc
- link finalny działa od początku do końca bez błędów

Zanim zaczniesz: przedstaw krótki plan (co dokładnie sprawdzisz, jak
wybierzesz 3 propozycje case'ów) i poczekaj na akceptację.

Na koniec: link + link do GIF-a/wideo + raport po polsku wg szablonu z
docs/03_PLAN_ETAPOW.md (Etap 5) — zaproponuj 3 kolejne case'y z
rekomendacją kolejności.

Zakazy:
- nie implementuj żadnego kolejnego case'a poza "Teatr jest nasz"
- nie dodawaj nowych mechanik gry
- nie dodawaj zależności npm bez wpisu w docs/DZIENNIK.md

Po ukończeniu: commit "etap-5: ...", stop i czekaj na moją odpowiedź.
```
