# Szablon pisania nowego case'a

Ten plik to instrukcja dla osoby piszącej treść nowego case'a (Arek / Kuba / inny redaktor) — nie jest to plik JSON gotowy do wczytania przez silnik. Efektem pracy wg tego szablonu jest najpierw tekst w formacie zbliżonym do content/cases_raw/*.md, a dopiero potem — wg mapowania w sekcji 2 poniżej — przepisanie go na `content/cases/<slug>.json` zgodnie ze schemą `content/schema/case.schema.json` (opisaną też w `docs/01_GDD_RUNNER_POC.md`, sekcja d).

## 1. Ogólna struktura V3 (definicja z Notion „Praca z Kubą", ustalona 12.03/20.03.2025)

Cytat źródłowy (case „Ogólna struktura V3"):

> 1. Header - nazwa projektu i twoja rola / działanie. TYTUŁ MISJI (co i dla kogo). Zacznij od napisania sobie po kilku myśli wejściowych które chcesz zawrzeć, dopiero potem pisz tekst.
> 1. Wstęp - tekstowy, nieco dłuższy, ładnie leadujący. ZADANIE [zobacz szczegóły misji].
> 1. Wymagania / wymagane umiejętności - wymagane statystki? / zdolności / SKILE max 3 które stają się tagami poszczególnych casów.
> 1. Story - dłuższe, ładne prowadzenie przez doświadczenie. Skupienie na drodze. Tu po drodze jakieś 2 taski per quest typu (dopasuj partnera, wybierz coś, ułóż coś).
> 1. Rezultaty - idealnie, jak przedstawimy graficznie. Jakieś KPIs, inne rzeczy. [nazywamy rezultaty, Jaką wartość to dało organizatorom.]

Pięć sekcji w tej kolejności to obowiązkowy szkielet każdego case'a. Do tego, zgodnie z ustaleniami projektowymi (`docs/01_GDD_RUNNER_POC.md`, sekcja d), dochodzi zakończenie — animacja złożenia obrazu i CTA — którego "Ogólna struktura V3" wprost nie wymienia, ale które jest wymagane przez silnik gry (beat typu `finale`).

## 2. Mapowanie sekcji V3 na typy beatów (`docs/01_GDD_RUNNER_POC.md` sekcja d, `content/schema/case.schema.json`)

| Sekcja V3 | Pole/typ beatu w JSON | Uwagi |
|---|---|---|
| Header (tytuł misji + rola) | `title`, `role` w nagłówku case'a (poza tablicą `beats`) | Rola nie jest osobnym beatem — to metadana case'a, pokazywana w UI jako podtytuł. |
| Wstęp (ZADANIE) | `lead` w nagłówku case'a + pierwszy 1-2 beaty typu `narration` | `lead` to krótkie streszczenie (1-2 zdania) do karty case'a w hubie; pełny Wstęp rozbity na beaty `narration` otwierające Story. |
| Wymagania / Skille (max 3) | `skills` w nagłówku case'a (tablica max 3 stringów) | Te same nazwy skilli muszą pojawiać się w `options[].skill` beatów typu `choice`, żeby przyrosty "+X" w wynikach miały pokrycie w treści. |
| Story (~2 zadania/interakcje na quest) | ciąg beatów: `narration`, `choice`, `action`, `interaction` | Każde miejsce oznaczone w cases_raw jako `> INTERAKCJA: ...` staje się jednym beatem `choice`, `action` lub `interaction` — wybór typu zależy od charakteru interakcji (patrz sekcja 3 niżej). |
| Rezultaty | jeden beat typu `results` na końcu tablicy `beats` | Pola `stats` (przyrosty do skilli) i `kpis` (liczby z case'a) — tylko liczby faktycznie obecne w cases_raw, nic dopisanego. |
| Zakończenie (poza V3, wymagane przez silnik) | jeden beat typu `finale` na samym końcu | Tekst zamknięcia + `cta` (link LinkedIn + "wróć do hotelu"), zgodnie z `docs/01_GDD_RUNNER_POC.md` sekcja h. |

## 3. Zasady liczbowe i jakościowe (wiążące, z `docs/01_GDD_RUNNER_POC.md` sekcje d-f)

- **6 beatów z nagrodą** (`reward.fragment`, numerowane 1..6 dla obrazu 3×2) — liczba beatów nagradzających fragment obrazu musi się równać `painting.cols * painting.rows`. Fragmenty przyznają tylko beaty typu `choice` (opcja trafna) i `action` (sukces QTE).
- **2-3 beaty typu `choice`** w całym case'ie (pilot „Teatr jest nasz" ma 3).
- **1-2 beaty typu `action`** (QTE).
- **1-2 beaty typu `interaction`** (widget DOM: `button`, `puzzle`, `reveal`).
- Razem: orientacyjnie 4-7 beatów interaktywnych plus otaczające je beaty `narration` (pilot „Teatr jest nasz" ma 7: 3 choice, 2 action, 2 interaction) — zgodne z ustaleniem "2 taski per quest" z definicji V3 (tu rozumiane jako 2 GŁÓWNE punkty przełamania fabuły, rozbite ewentualnie na kilka mniejszych beatów).
- **Długość tekstu `narration`: maks. 400 znaków na beat.** Dłuższy akapit z cases_raw trzeba podzielić na 2+ osobne beaty `narration`, każdy kończący się naturalną pauzą w opowieści (koniec zdania/akapitu w źródle), nie w połowie myśli.
- **2-3 opcje w każdym beacie `choice`.** Nie mniej (to nie miałoby sensu jako wybór) i nie więcej (przeciąga decyzję i psuje tempo runnera).
- **Opcja trafna musi wynikać z historii** — gracz, który uważnie czytał poprzedzające beaty `narration`, powinien być w stanie ją rozpoznać bez zgadywania. Nie chowaj poprawnej odpowiedzi za wiedzą, której case nie dał wcześniej.
- **Feedback dla opcji nietrafnej ma uczyć, nie karać.** Brak śmierci w historii (patrz `docs/01_GDD_RUNNER_POC.md`, sekcja a) — nieudana opcja to potknięcie i podpowiedź, nigdy ślepy zaułek ani upokarzający tekst. Feedback powinien tłumaczyć DLACZEGO ta opcja nie zadziałała w kontekście case'a, żeby przy powrocie do beatu gracz podjął świadomą decyzję.

## 4. Proces pisania nowego case'a (lista kontrolna)

1. Zbierz surowy materiał (wywiad z Arkiem / notatki / inwentarz_tresci.md) — nie wymyślaj faktów, liczb ani cytatów.
2. Napisz Header: 1 zdanie tytułu misji (co i dla kogo) + rola Arka.
3. Napisz Wstęp: 3-5 zdań leadujących do zadania.
4. Wybierz max 3 skille — muszą być konkretne (nie "komunikacja", tylko np. "Organizacja zbiórek publicznych").
5. Napisz Story chronologicznie, jak faktycznie przebiegły wydarzenia — dopiero potem szukaj w nim 2 naturalnych miejsc na `choice`/`action`/`interaction` (nie wymyślaj wyborów, które nie wynikają z realnej historii).
6. Sprawdź limit długości beatów `narration` (400 znaków) i limit liczby beatów interaktywnych (sekcja 3 wyżej).
7. Napisz Rezultaty — tylko liczby i fakty, które faktycznie masz od Arka (KPI, przyrosty do skilli).
8. Zapisz wersję roboczą w `content/cases_raw/<slug>.md` (ten sam format co pozostałe pliki w tym katalogu) — do akceptacji przez Arka.
9. Po akceptacji: przepisz na `content/cases/<slug>.json` wg schemy `content/schema/case.schema.json`, uruchom walidację (`content/loader.ts` / zod) przed commitem.

## 5. Czego NIE robić

- Nie pisz tekstu narracyjnego w kodzie TS — wszystkie teksty tylko w JSON (patrz `CLAUDE.md`).
- Nie przekraczaj 3 skilli — więcej rozmywa tagi case'a w hubie.
- Nie twórz beatu `choice` bez logicznie trafnej opcji wynikającej z historii.
- Nie dodawaj więcej niż 6 beatów nagradzających fragment — silnik zakłada 1:1 z liczbą pól obrazu (`cols * rows`).
- Nie zostawiaj "[do uzupełnienia]" w polach `stats`/`kpis` beatu `results` — jeśli case nie ma jeszcze liczb, zgłoś to jako lukę zamiast wpisywać placeholder, który mógłby zostać przypadkiem opublikowany jako fakt.
