# Indeks case'ów źródłowych (content/cases_raw)

Ten plik indeksuje wszystkie 10 plików case'ów wyekstrahowanych z Notion „Praca z Kubą" (praca_z_kuba_clean.txt). Pilotem PoC (patrz `docs/00_KONCEPCJA.md`, „Co jest w PoC, a co nie") jest **teatr-jest-nasz** — nie jest on osobno rekomendowany w kolumnie kolejności, bo już został wybrany przez Arka jako pierwszy.

| slug | tytuł | świat [propozycja] | skille | interakcji w tekście | status |
|---|---|---|---|---|---|
| teatr-jest-nasz | Pokaż urzędnikom że #teatrjestnasz | kultura | Pozyskiwanie partnerów, Organizacja zbiórek publicznych, Aktywizacja społeczności | 2 | finalny (pilot PoC) |
| kultura-futura | Zostań redaktorem naczelnym międzynarodowego Biennale Przyszłości Kultury | kultura | Dziennikarstwo, Zarządzanie zespołem, Technologia | 2 | finalny |
| cyrograf-na-kwadrat | Ujawnij model działania przestępców oszukujących studentów | kultura [propozycja — dziennikarstwo śledcze/media] | Dziennikarstwo śledcze, Zarządzanie zespołem, Analiza danych | 2 | finalny |
| ko-kreacja-mkidn | Pomóż Ministerstwu Kultury edukować o ko-kreacji oferty instytucji kulturalnych | kultura | Service Design/Projektowanie usług, Polityki Publiczne, Instytucje kultury/organizacja wydarzeń | 1 (bez opisu widgetu) | finalny |
| kalejdoskop | Pomóż organizatorom festiwalu odnieść sukces | kultura | Organizacja wydarzeń, Prowadzenie warsztatów, Pozyskiwanie partnerów | 2 | finalny (tekst urwany przed Rezultatami) |
| ewaluacja-festiwali | Pomóż teatrowi w ewaluacji międzynarodowego festiwalu | kultura | Antropologia i kulturoznawstwo, Ewaluacja, Strategia | 1 | finalny (Rezultaty niepełne) |
| up-arta | Połącz elektronikę, filozofię i design aby pomóc ludziom rozmawiać o AI | kultura [propozycja — pomost do tematu AI/technologii] | Programowanie (C/Python), Design/Ars-electronica, Produkcja (CNC/Arduino/Druk3D) | 4 (do redukcji przy wdrożeniu) | finalny |
| gra-teatralna-improvisio | Twórca narzędzia treningowego ImproVisio do zaawansowanych ćwiczeń improwizacji teatralnej | kultura [propozycja] | Projektowanie gier/grywalizacja, Prowadzenie warsztatów teatralnych, Projektowanie narzędzi edukacyjnych [propozycja] | 2 | roboczy (V1, [WERSJA ROBOCZA]) |
| scouting-pfr | Warsztat z analizy konkurencji dla programu Venture Building Szkoła Pionierów PFR | biznes [propozycja] | Analiza konkurencji/badania rynku, Metodyka Product Discovery (Mom Test, RTB), Prowadzenie warsztatów w dwóch językach [propozycja] | 0 (brak zaznaczonego miejsca w źródle) | roboczy (V1, [WERSJA ROBOCZA]) |
| mundur | Wykuj zbroję bezsensu | nieznany | nieznane | 0 | niedokończony (tylko Header + początek Wstępu) |

## Rekomendowana kolejność wdrażania po PoC

Pilot PoC: **teatr-jest-nasz** (już wybrany, poza tą listą).

1. **kultura-futura** — najgotowszy tekst spośród pozostałych (pełna wersja ✅ JB CASE, kompletne wszystkie sekcje) i najsilniejsze liczby (5000 uczestników, 150 000 odwiedzin strony, 8 krajów), więc daje szybki, niskoryzykowny drugi case do wdrożenia silnikiem z Etapu 3.
2. **cyrograf-na-kwadrat** — tekst kompletny i emocjonalnie odmienny od dwóch poprzednich (śledztwo dziennikarskie, nie zbiórka/redakcja kulturalna), z twardym KPI (100 000+ zasięgów) — poszerza repertuar typów historii bez zmiany świata, co jest bezpiecznym krokiem przed testem świata biznesowego.
3. **up-arta** — najmocniejsze liczby w całym zbiorze (20 000+ widzów, 200 h warsztatów) i jedyny case dotykający tematu AI/technologii, więc najlepiej przygotowuje grunt pod przyszłe case'y ze świata biznes/startup, mimo że formalnie oznaczony jako kultura.

## Uwaga o zróżnicowaniu światów [ważne ograniczenie]

Wśród 7 finalnych (✅ JB CASE) case'ów **wszystkie** są oznaczone jako świat "kultura" [propozycja] — żaden nie reprezentuje wprost świata "edukacja" ani "biznes" zgodnie z trzema tożsamościami z wizji (`docs/00_KONCEPCJA.md`: Kultura/Artysta, Edukacja/Edukator, Biznes/Przedsiębiorca). Jedynym kandydatem do świata "biznes" jest **scouting-pfr**, ale to wersja robocza (V1) z niedokończonym zakończeniem i bez zaznaczonych interakcji — wymaga dopracowania tekstu, zanim trafi do gry. Rekomendacja: potraktować scouting-pfr jako priorytet nr 4 (zaraz po trzech powyższych) właśnie ze względu na zróżnicowanie światów, równolegle zlecając jego domknięcie tekstowe. Żaden z materiałów w cases_raw nie reprezentuje wprost świata "edukacja" — do tego świata trzeba sięgnąć po inwentarz_tresci.md (np. platforma SWPS „Tajemnica pieczęci", gra „Młodzi w Akcji+" dla CEO, Narzędziownik BIZ dla ZWzT) i napisać nowy case od zera.
