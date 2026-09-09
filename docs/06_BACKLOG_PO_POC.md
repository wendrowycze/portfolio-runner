# Backlog po PoC

Wszystko poniżej jest świadomie wyłączone z PoC (patrz `docs/00_KONCEPCJA.md`, „Co jest w PoC, a co nie") i czeka na decyzję Arka po obejrzeniu działającego pilota. Priorytety: **P1** — naturalny następny krok, rozszerza PoC bez zmiany architektury; **P2** — istotne dla pełnej wizji, wymaga decyzji projektowej przed startem; **P3** — dopracowanie, nie blokuje żadnego launchu.

## P1 — rozszerzenia bezpośrednio na silniku z PoC

**Kolejne case'y.** Dodanie drugiego, trzeciego case'a na bazie tego samego silnika i schematu JSON. Materiał źródłowy: pełne teksty dziewięciu case'ów napisanych z Kubą, w `content/cases_raw/`, z indeksem w `content/cases_raw/_INDEKS.md`. Uwaga (patrz `_INDEKS.md`, sekcja "Uwaga o zróżnicowaniu światów"): wszystkie 7 finalnych, gotowych do przepisania case'ów jest oznaczonych jako świat Kultura — dla światów Edukacja i Biznes nie ma jeszcze gotowego tekstu w strukturze V3. Dla Biznesu najbliżej gotowości jest `scouting-pfr.md` (wersja robocza), a dla Edukacji trzeba dopiero napisać nowy case od zera na bazie `content/inwentarz_tresci.md`, wg `content/cases/_SZABLON.md`. Zależność: żadna — silnik z PoC jest dla tego zaprojektowany (README z Etapu 5 ma tłumaczyć "jak dodać case w 20 minut"). Złożoność: **S** na case gotowy tekstowo (samo pisanie beatów), **M**–**L** na case wymagający najpierw napisania treści od zera (Edukacja) lub domknięcia wersji roboczej (Biznes).

**Hotel jako przestrzeń.** Zamiast jednego obrazu na ścianie — pełna scena, w której gracz chodzi (lub przewija) i widzi wiele obrazów naraz, ewentualnie rozłożonych na piętra/światy. Zależność: wymaga co najmniej dwóch case'ów gotowych, żeby hub miał sens. Złożoność: **M**.

**Wybór postaci (winda).** Ekran z trzema kartami — Artysta / Edukator / Przedsiębiorca — zanim gracz trafia do huba. Wybór wpływa co najmniej na kolor akcentu UI, docelowo też na to, które piętro/skrzydło hotelu jest widoczne jako pierwsze. Zależność: sensowny dopiero przy co najmniej dwóch światach gotowych (inaczej wybór niczego nie zmienia). Złożoność: **S**–**M**.

## P2 — elementy wymagające decyzji projektowej przed startem

**Ekran startowy.** Ciemność, pochodnia sterowana kursorem/dotykiem odsłaniająca fasadę, pola imię+mail, przycisk "Wejdź" aktywujący się po wypełnieniu, RODO jako interaktywna dźwignia/kostka ("daj mi social media" jako alternatywa dla niepewnych). Referencja: Kingdom Two Crowns. Wymaga decyzji: dokładna sekwencja zapalania pochodni (tablica sama to oznacza jako "do przemyślenia"), styl architektoniczny fasady (renesans lubelski? Kozłówka?). Zależność: żadna techniczna, ale najlepiej budować po tym, jak silnik runnera jest stabilny — to pierwszy ekran, jaki widzi każdy gracz, więc błąd tu kosztuje najwięcej. Złożoność: **M**.

**Zapis postępu (mail jako identyfikator, Airtable).** Progresja gracza (które case'y ukończone, jakie skille zebrane) zapisywana po mailu z ekranu startowego, żeby wracający gracz nie zaczynał od zera. Zależność: wymaga ekranu startowego i minimum dwóch case'ów, żeby "postęp" cokolwiek znaczył. Złożoność: **M**.

**Kierunek wizualny świata Edukacja.** Sam autor określił obecny kierunek (bastion) jako niedopasowany. Wymaga osobnej rundy referencji i decyzji Arka, zanim powstanie choćby jeden case Edukacji — inaczej ryzyko powtórzenia tej samej niepewności. Zależność: żadna techniczna, blokuje tylko rozszerzenie na świat Edukacja. Złożoność: **S** (decyzja) + **M** (wdrożenie, gdy kierunek jest jasny).

**Sztandary/witraże partnerów** (MKIND, SŁOWAK, UJ/SWPS, CEO, PFR, ING). Forma nierozstrzygnięta na tablicy — sztandary rozwijające się animowanie czy świecące witraże reagujące na ruch myszki/postaci. Zależność: hotel jako przestrzeń (potrzebna fasada, na której się je umieszcza). Złożoność: **M**.

**Galeria finałowa.** Sala z biblioteczką (pop-up z pełną treścią działań, docelowo z Notion), kominkiem z trofeami (pop-up z KPI osiągnięć), popiersiami mentorów (lista pełna w Koncept_Portfolio_Arka.md sekcja 5/6 — m.in. Darek Szymura, Joanna Borysiuk, Kasia Mariasiewicz, Marek Kościółek, prof. Worek, prof. Górniak i inni), oraz świadomie pustymi "obrazami na przyszłość" jako miejscami na przyszłe achievementy. Zależność: wymaga ukończenia co najmniej po jednym case'ie z każdego świata, żeby galeria miała treść do pokazania. Złożoność: **L**.

**Spersonalizowana historia gracza.** Pomysł z retro 07/2025: gra w pewnym momencie pyta gracza o jego własną historię i w krótkim czasie generuje spersonalizowaną prezentację w stylu case'ów z portfolio. Wymaga integracji z modelem językowym w czasie rzeczywistym i osobnej decyzji o kosztach/ryzyku treści generowanej na żywo. Zależność: silnik case'ów musi być stabilny, żeby dało się generować beaty dynamicznie zamiast tylko wczytywać statyczny JSON. Złożoność: **L**.

**Pipeline generatywny assetów (Vertex AI Imagen).** Zamiana placeholderów kodem + CC0 na docelową grafikę generowaną przez API, wg banku promptów w `04_STYL_I_ASSETY.md`. Budżet nie jest ograniczeniem (kredyty GCP), ale wymaga dostępu do projektu GCP i klucza API — to do ustalenia jako osobny krok, nie coś, co dzieje się automatycznie. Zależność: warto robić dopiero, gdy kierunek wizualny każdego świata jest zaakceptowany (żeby nie generować grafiki dla stylu, który się jeszcze zmieni). Złożoność: **L**.

**CMS treści z Notion.** Zamiast ręcznego kopiowania case'ów do JSON, bezpośrednie ciągnięcie treści z Notion ("Praca z Kubą", "Portfolio Arka") jako źródła prawdy, z możliwością edycji case'a bez dotykania repozytorium. Zależność: stabilny schemat case'a (już jest, `content/schema/case.schema.json`) i co najmniej kilka case'ów napisanych ręcznie jako wzorzec migracji. Złożoność: **L**.

## P3 — dopracowanie, niekrytyczne

**Easter eggi z tablicy.** Dziesięć kliknięć w posąg/pomnik odtwarza utwór "Tacio" (max 10 s); dla świata Biznes — nawiązanie do "Mamma Mia"/"Money Money Money"; dla Kultury — cytat "Exegi monumentum" Horacego; trzeci easter egg (Edukacja) pozostaje niedookreślony na tablicy w obu wersjach ("Może ______") i wymaga pomysłu Arka. Zależność: co najmniej jeden pomnik/obraz w każdym świecie gotowy do interakcji. Złożoność: **S** na easter egg.

**Dźwięk/muzyka.** Poza podstawowym SFX z PoC (kroki, skok, potknięcie, fragment) — muzyka tła per świat, dźwięki przejść między scenami, decyzja czy muzyka gra od pierwszego ekranu. Zależność: żadna blokująca, ale sensowne dopiero przy stabilnym hubie. Złożoność: **M**.

**i18n PL/EN.** Kuba zadeklarował przygotowanie tłumaczeń angielskich z weryfikacją przez native speakerów korporacyjnych — materiał częściowo już obiecany, ale nieprzygotowany. Wymaga wydzielenia wszystkich tekstów case'ów do osobnych plików per język (struktura JSON już to ułatwia, bo treść i tak żyje poza kodem). Zależność: stabilny zestaw case'ów w PL, żeby nie tłumaczyć treści, która się jeszcze zmienia. Złożoność: **M**.

**Lead capture / CTA / Personal Forecasting.** Sekcja materiału sprzedażowego programu "Personal Forecasting" z tablicy (osobny landing/VSL/moduły) — nierozstrzygnięte, czy wchodzi w skład portfolio-gry, czy zostaje osobnym produktem. Jeśli wejdzie: CTA na końcu ścieżki gracza, formularz kontaktowy, ewentualnie kod rabatowy generowany per gracz. Zależność: decyzja Arka o zakresie (patrz `05_KONTEKST_ZRODLA.md`, sekcja e). Złożoność: **M**–**L** zależnie od zakresu.

**Deploy na ArkadiuszKlej.pl.** Docelowo gra ma zastąpić obecną minimalistyczną wizytówkę pod tą domeną. Świadomie osobny, ręczny krok — nie automatyczny — podejmowany dopiero po akceptacji finalnego kształtu przez Arka. Zależność: stabilna wersja z co najmniej jednym pełnym światem. Złożoność: **S** (samo DNS), ale wymaga świadomej decyzji o momencie.

**Analityka.** Śledzenie, które case'y są kończone, gdzie gracze się potykają najczęściej, ile osób dociera do CTA. Zależność: sensowna dopiero po deployu na docelowej domenie z realnym ruchem. Złożoność: **S**–**M**.
