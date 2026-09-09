# Czym jest ta gra

Ten dokument tłumaczy projekt komuś, kto widzi go pierwszy raz — w tym Claude Code, który ma go budować. Jeśli czytasz tylko jeden plik w tym repozytorium przed napisaniem kodu, niech to będzie ten.

## Wizja pełna (dokąd to wszystko zmierza)

Portfolio Arkadiusza Kleja jest grą, nie stroną z zakładkami. Gracz wciela się w gościa, który wchodzi do **hotelu** (właściwie pałacu) — metafory dorobku Arka. Na ścianach hotelu wiszą **zniszczone obrazy**. Każdy obraz to jeden projekt z życia Arka — case, misja, historia. Obraz jest uszkodzony, bo historia nie została jeszcze opowiedziana.

Gracz klika w zniszczony obraz i **wchodzi do niego**. Wewnątrz obraz zamienia się w krótki **endless runner**: postać biegnie automatycznie przez scenę, a na drugiej połowie ekranu leci panel dialogowy z narracją i wyborami — jak w visual novel. Gracz reaguje w odpowiednich momentach (skok, wybór repliki, QTE), żeby dobiec do końca. Za każdą trafną reakcję dostaje **fragment obrazu**. Kiedy zbierze wszystkie fragmenty i historia się kończy, obraz **układa się na nowo** — wraca do hotelu jako odrestaurowany. Gracz w tym samym momencie poznał całą historię projektu: co Arek zrobił, dla kogo, jakim kosztem, z jakim skutkiem.

To się powtarza dla trzech światów, odpowiadających trzem tożsamościom zawodowym Arka: **Kultura** (Artysta), **Edukacja** (Edukator), **Biznes/Startup** (Przedsiębiorca). Docelowo hotel ma piętra albo skrzydła odpowiadające tym światom, gracz wybiera postać przy wejściu (winda: Artysta/Edukator/Przedsiębiorca), a po ułożeniu wystarczającej liczby obrazów odsłania się **galeria finałowa** — sala z biblioteczką, kominkiem i popiersiami mentorów, podsumowująca całą wizytę. Cała podróż zaczyna się na **ekranie startowym**: całkowicie ciemny ekran, pole na imię i mail, pochodnia sterowana kursorem/dotykiem odsłaniająca fasadę budynku, kolejne pochodnie zapalające się w miarę wypełniania formularza (referencja: sekwencja otwarcia gry Kingdom Two Crowns — od ciemności do światła).

Hotel-jako-przestrzeń-do-chodzenia, ekran startowy z pochodnią, wybór postaci i galeria finałowa **są elementami docelowymi**, nie tym, co powstaje teraz. Ten dokument opisuje pełną wizję właśnie po to, żeby każda decyzja podjęta w PoC dała się w przyszłości osadzić w tej całości bez przepisywania architektury.

## Słownik pojęć

- **Hotel** — cała metafora budynku/pałacu, przestrzeń nadrzędna, w której gracz się porusza między obrazami. W PoC nie istnieje jako przestrzeń do chodzenia — jest zredukowana do jednego ekranu ze ścianą i jednym obrazem (patrz HubStubScene w architekturze).
- **Obraz** — wizualna reprezentacja jednego case'a. Zaczyna zniszczony, kończy odrestaurowany. Podzielony na siatkę fragmentów (w PoC: 3×2, czyli 6 fragmentów).
- **Case / misja** — jeden projekt z życia zawodowego Arka, opowiedziany jako historia z początkiem, wyborami i wynikiem. Treść case'a żyje wyłącznie w plikach JSON w `content/`, nigdy w kodzie.
- **Beat** — najmniejsza jednostka historii wewnątrz case'a: jeden ekran narracji, jeden wybór, jedno QTE, jeden widget interakcji. Silnik runnera nie zna treści case'a — wykonuje sekwencję beatów zapisaną w JSON-ie, niezależnie od tego, co dany beat akurat mówi.
- **Fragment** — kawałek obrazu, który gracz zdobywa za trafną reakcję na beat typu choice lub action. Liczba beatów nagradzających fragment musi się równać liczbie pól siatki obrazu (`cols × rows`).
- **Skill** — jedna z maks. trzech umiejętności przypisanych do case'a (np. "Pozyskiwanie partnerów"). Rośnie w trakcie gry i jest pokazywana jak statystyka RPG na starcie i w wynikach — to nie jest ozdobnik, tylko sposób, żeby gracz zapamiętał, czego dowodzi dany case.
- **Świat** — jedna z trzech tożsamości zawodowych: Kultura, Edukacja, Biznes. Każdy świat ma inny kierunek wizualny (marmur/ceramika czarnofigurowa dla Kultury, Transistor/art-deco dla Biznesu, bastion/marmur+dłonie — nieustalone — dla Edukacji). PoC działa wyłącznie w świecie Kultura.
- **Potknięcie** — konsekwencja nietrafnej reakcji gracza (zły wybór, spóźnione QTE, brak reakcji w czasie). Gra się nie kończy porażką — nie da się jej "przegrać" — ale da się ją przejść gorzej. Potknięcia są liczone i pokazywane w wynikach jako miękka kara.
- **Pomnik** — pojęcie z tablicy FigJam, gdzie mechanika progresji była pierwotnie opisana jako odbudowywanie zniszczonych pomników/płaskorzeźb trzech postaci. W koncepcji hotelowej ta sama mechanika została przełożona na **układanie zniszczonych obrazów**. Pomnik i obraz to jedna i ta sama mechanika progresji pod dwiema różnymi nazwami z dwóch etapów projektu — SPEC rozstrzyga na korzyść obrazu, ale każdy fragment tablicy mówiący o "pomniku" (easter eggi, animacja patrzenia, budowanie po pop-upie) dotyczy wprost tego mechanizmu i ma zastosowanie do obrazów.

## Co jest w PoC, a co nie

Pełny podział zakresu jest wiążąco opisany niżej w tym rozdziale. W skrócie: PoC to **silnik runnera + jeden kompletny case**. Konkretnie budujemy: generyczny silnik biegu sterowany skryptem JSON, panel dialogowy jako nakładkę DOM, jeden case od pierwszego beatu do ułożonego obrazu — "Teatr jest nasz" — oraz minimalny stub hubu: jeden zniszczony obraz na ścianie, klik wchodzi do runnera, po ukończeniu obraz wraca odrestaurowany.

Poza PoC (trafia do `06_BACKLOG_PO_POC.md`): hotel jako przestrzeń do chodzenia, ekran startowy z formularzem imię/mail i RODO, wybór postaci, pozostałe case'y, galeria finałowa, easter eggi, dźwięk poza podstawowym SFX, i18n, CMS z Notion. Nic z tej listy nie powinno pojawić się w kodzie PoC nawet jako uproszczona wersja — zamiast tego zostawiamy komentarz TODO odsyłający do backlogu.

## Doświadczenie gracza w PoC — krok po kroku

1. Gracz widzi ekran ze ścianą, na której wisi jeden zniszczony obraz (placeholder graficzny w palecie Kultury). To cały "hub" — nic więcej nie da się na nim zrobić poza kliknięciem w obraz.
2. Klik w obraz przenosi do sceny runnera. Ekran dzieli się na dwie połowy: u góry biegnąca postać na tle przesuwającej się paralaksy, u dołu panel dialogowy.
3. Historia zaczyna się od narracji (efekt maszyny do pisania, typewriter) — kontekst case'a "Teatr jest nasz": teatr broni się przed cenzurą, gracz wciela się w organizatora zbiórki.
4. W kolejnych beatach pojawiają się na przemian: momenty wyboru (czas zwalnia, gracz ma kilka sekund na wybranie repliki spośród 2–3 opcji, trafna reaguje na zbliżającą się przeszkodę), skoki na sygnał (QTE w krótkim oknie czasowym) i widgety interakcji osadzone w panelu. W pilocie „Teatr jest nasz" są to: przycisk zrzutki z rosnącym licznikiem zebranej kwoty oraz prosta układanka. Silnik obsługuje też trzeci wariant widgetu — „reveal" (zamknięcie oczu, fade to black i z powrotem) — jest on w schemie i zaimplementowany, ale pilot świadomie go nie wykorzystuje; pojawi się dopiero w kolejnych case'ach, jeśli treść tego wymaga.
5. Trafne reakcje dają fragmenty obrazu i punkty do skilli; nietrafne — krótkie potknięcie, feedback i powrót do tego samego beatu z podpowiedzią. Gracz zawsze może iść dalej.
6. Po zebraniu wszystkich sześciu fragmentów pojawia się karta wyników: trzy skille z przyrostami, KPI case'a (np. "200 000 zł w kilka dni"), liczba potknięć, czas przejścia.
7. Finałowa animacja składa fragmenty w pełny obraz, pojawia się tekst zamknięcia i CTA — link do LinkedIn oraz powrót do huba, gdzie obraz na ścianie jest już odrestaurowany.

Całość trwa 3–5 minut i da się przejść od początku do końca bez ładowania nowej strony i bez błędów w konsoli — to jest twarde kryterium DoD Etapu 3 (patrz `docs/03_PLAN_ETAPOW.md`).

## Dla kogo to jest

Dwie grupy odbiorców naraz: **studenci**, którzy mogą uczyć się od Arka lub z nim pracować, oraz **potencjalni klienci** instytucjonalni i biznesowi. Cel nie jest transakcyjny w pierwszej kolejności — to nie ma być formularz kontaktowy z ozdobnikiem. Cel jest emocjonalny: sprawić, żeby odbiorca **zakochał się** w tym, co i jak Arek robi, zanim jeszcze przeczyta CV. Dopiero z tego wynikają leady — biznesowe i edukacyjne — jako efekt uboczny dobrego doświadczenia, nie jako wymuszony lejek.

## Ryzyko zaakceptowane świadomie

Forma growa nie spodoba się każdemu. Bardziej formalni odbiorcy — administracja, duże instytucje typu ING czy PFR — mogą odebrać runner z panelem dialogowym jako zbyt zabawowy dla poważnego kontekstu biznesowego. Arek zaakceptował to ryzyko świadomie: nie ma być rozwadniane pół-środkami ani "trybem poważnym" dla korporacji. Konsekwencja tej decyzji dla PoC: nie budujemy wariantu bez gry, nie chowamy mechaniki za przełącznikiem "przejdź do zwykłego CV". Jeśli forma nie trafi do części odbiorców, to koszt świadomie przyjęty w zamian za to, że reszcie zapadnie w pamięć.
