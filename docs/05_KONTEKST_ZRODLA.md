# Kontekst źródeł

Ten dokument syntetyzuje cztery źródła, z których wynikła decyzja z 09.09.2026 (roboczo nazywana w historii projektu „SPEC KITU" — wewnętrzny brief, na podstawie którego powstał ten kit; sam nie wchodzi w skład repozytorium, jego ustalenia są w całości przeniesione do plików w `docs/`): tablicę FigJam, dwie strony Notion i historię dwóch koncepcji budowlanych (Next.js z 05.07.2026 → runner w Phaserze z 09.09.2026). Cel: żeby nikt, kto wraca do projektu za pół roku, nie musiał odtwarzać tej archeologii od zera.

## a) Tablica FigJam — co zawiera

Tablica nosi nazwę "Arkadiusz Klej — Strona WWW" i jest surowym brainstormem, nie gotowym design systemem. Eksport, na którym pracowaliśmy, jest **ucięty w połowie** sekcji "ścierzka V2" — wszystko dalej w prawo/w dół tablicy jest nieznane.

Sekcje tablicy: dwie niepowiązane z projektem (notatki z konsultacji sprzedażowej i osobista "rozkmina" Arka), oraz pięć powiązanych — Landing V1, Landing V2, "Słowa i loga ważnych podmiotów", "ścierzka V1" i "ścierzka V2".

**Landing V1/V2** to materiał do zwykłej strony marketingowej (hero, statystyki, case studies w formie kart, sekcja usług, formularz kontaktowy) i osobny, obszerny blok materiału sprzedażowego programu "Personal Forecasting" — metodologii coachingowej Arka, niezwiązanej bezpośrednio z mechaniką gry. Ten wątek jest istotny dla przyszłego CTA/lead capture (patrz backlog), ale nie wpływa na PoC.

**Ścierzka V1** i **ścierzka V2** to sekcje, w których faktycznie powstała mechanika gry. Kluczowe cytaty, dosłownie:

> "Zaczynamy od wpełni ciemnego ekranu, jest tylko pole na imię oraz Maila oraz nieaktywny przycisk »wejdź«/ »zagraj«. Gdy zaczynam wpisywać pojawiają się kolejne pochodnie, tak jakby zapalały się światła w tym budynku."

> "pomyśl o tym jak się zaczyna każda nowa gra w kingdom two crownds — do ciemności do światła które prowadzi w jasnym kierunku."

> "zniszczony fresk/marmur/coś z 3 postaciami których piomniki odbudowuje gracz podczas przygód" — to zdanie z V2 jest najważniejszym zdaniem całej tablicy: potwierdza rdzeń mechaniki progresji, którą SPEC przełożył na obrazy w hotelu.

> "RASA TO RAMKA I TŁO." / "KLASA TO POSTAĆ W DRZWIACH." — terminologia RPG metaforycznie mapowana na elementy strony (nieużywana wprost w PoC, ale tłumaczy skąd wzięła się idea "statystyk" skilli).

> "JAK 10 RAZY KLIKNIESZ POSĄG TO LECI TACIO, MAX 10S. Czuje się jak młody ZEUS."

Mechaniki opisane na tablicy: pochodnia sterowana kursorem/dotykiem odsłaniająca fasadę; formularz imię+mail z nieaktywnym przyciskiem "graj", aktywującym się po wypełnieniu; RODO jako interaktywna "dźwignia/kostka" (w V2: "Rodo BOX"); trzy style wizualne per świat (Kultura — geometryczne kute litery, marmur; Biznes — IT/konsolka/klimat gry Transistor; Edukacja — bastion, ale autor sam pisze "to nie siada na 100%", "ARKOWI TO NIE PASUJE, to jeszcze nie to"); easter eggi per pomnik (10 kliknięć w posąg → utwór "Tacio"; biznes → "Mamma Mia"/"Money Money Money"; kultura → "Exegi monumentum" Horacego; trzeci, dla edukacji, pozostaje pusty w obu wersjach ścieżki — "Może ______").

Referencje wizualne i growe wprost na tablicy lub w Koncepcie wyprowadzonym z niej: **Kingdom Two Crowns** (sekwencja startowa ciemność→światło), **Bastion** i **Transistor** (Supergiant Games — klimat świata Biznes i ogólna stylistyka izometryczna), **Hades** (Supergiant Games — referencja narracyjna/artystyczna ogólna), **Dawnfolk** (inspiracja graficzna wprost podana w kalendarium Notion), **GRIS** (rozważana, ale niekoniecznie finalna nuta dla Kultury — miękka, akwarelowa gra wideo).

Palety i zdobienia: finalna paleta dziesięciu kolorów (patrz `04_STYL_I_ASSETY.md`) powtarza się kilkukrotnie na tablicy i jest uznana za rozstrzygniętą. Sztandary/witraże partnerów są nierozstrzygnięte co do formy — cytat: "Loga ważnych podmiotów na budynkach w tle, może jako sztandary? / jako witraże?".

## b) Notion "Praca z Kubą" — historia współpracy 09/2024–07/2025

Kuba jest współpracownikiem technicznym Arka przy tym projekcie (relacja partnerska, nie zleceniodawca–wykonawca): stawia serwer (OVH), szuka wtyczek/elementów interaktywnych, deklaruje przygotowanie tłumaczeń EN i weryfikację przez native speakerów, dzieli koszty grafika (50/50 lub więcej po jego stronie).

Kalendarium calli od kick-offu (03.09.2024) do retrospektywy z lipca 2025 pokazuje ewolucję pomysłu: od pierwszych case'ów testowych, przez decyzję o klikalnym prototypie (17.02.2025), przez retro 25.02.2025 (ustalenie zasad pracy — regularność, budżet grafika ok. 5K, wprowadzenie Fireflies do notatek), aż po ostateczny, wielokrotnie iterowany szablon case'a.

**Struktura case'a V3**, ustalona 12.03/20.03.2025 — dokładnie ten sam kształt, który SPEC przenosi jeden do jednego na strukturę beatów: (1) Header — tytuł misji i rola Arka, (2) Wstęp — zadanie misji, (3) Wymagane umiejętności — max 3 skille jako tagi, (4) Story — narracja z ok. 2 interakcjami na quest, (5) Rezultaty — KPI i wartość dostarczona.

**Poziomy gotowości produktu**, zdefiniowane 05.03.2025: Koncept (wszystko wyklikane) → Prototyp (pierwsza wersja z grafikiem + kampania) → A (launch) → A+ (launch2, dodatkowe funkcje, lektor) → A++ (usprawnienie, produkt pasywny) → "Personal Forecasting" jako produkt pasywny domykający lejek → "AGA" (nieopisane w źródle). PoC odpowiada mniej więcej etapowi Koncept/Prototyp.

**Retrospektywa 15–17.07.2025** — najważniejsza refleksja procesowa i źródło jednego kluczowego pomysłu na przyszłość: w sekcji "Start" pada propozycja, żeby gra w pewnym momencie pytała odwiedzającego o jego historię i proponowała mu **spersonalizowaną prezentację** w stylu case'ów z portfolio, bo "ludzie nie ufają mailom, ale... dołączasz prezkę spersonalizowaną". To trafia do backlogu jako osobna pozycja.

**Funnel biznesowy** zdefiniowany 22.04.2025: **LEKCJA → SESJA → PLIK (Action)**. Równolegle Kuba proponuje funnel reklamowy: Privy na LinkedIn + Google Ads → Landing + VSL → 10-minutowe wideo uświadamiające "bóle" na danym stanowisku.

Dziewięć case'ów zostało napisanych z Kubą w pełnej strukturze V3 (Header/Wstęp/Wymagania/Story/Rezultaty), plus dziesiąty — "MUNDUR!" — urwany w źródle na samym wstępie. Pełne teksty tych case'ów trafiają do `content/cases_raw/`, pilotem PoC jest "Teatr jest nasz".

## c) Notion "Portfolio Arka" — inwentarz treści

Strona-hub prowadząca do trzech podstron, z motto "Automatyzacja ratuje czas". Zawiera pełny inwentarz dorobku Arka w kategoriach: wolontariaty i działalność społeczna 2014–2023, konkursy i nagrody (NASA Space Apps 2023, #hack4med 2021, EIT Food 2020 i in.), studia (School of Ideas, Międzywydziałowe Indywidualne Studia Humanistyczne UJ), projekty społeczne (Tydzień Porażki, Teatra Miecza, Wideoencyklopedia Filozoficzna), osiem flagowych produktów (gra treningowa dla MFT, platforma onboardingowa SWPS, Narzędziownik BIZ dla ZWzT, Canvas Ko-Kreacji i in.), doświadczenie zawodowe, dydaktyka na sześciu-siedmiu uczelniach, wywiady prasowe. To baza danych treści, z której docelowo mają powstać kolejne case'y po PoC — pełny indeks case'ów będzie żył w `content/cases_raw/_INDEKS.md`.

## d) Historia decyzji — co zostało unieważnione

Projekt przeszedł dwie wyraźnie różne fazy koncepcyjne w ciągu dwóch miesięcy:

**05.07.2026 — Koncept v3 ("Pałac Doświadczeń")**: pilotem miało być piętro Kultura, stack **Next.js (App Router) + TypeScript + Tailwind + Framer Motion**, warstwa wizualna generowana przez **Vertex AI Imagen** (budżet ~100 000 USD kredytów Google Cloud), forma — **scrollytelling** (pozioma scena przewijana z trzema "drzwiami/obrazami", cofanie scrolla usuwa elementy). Ekran startowy, winda z wyborem postaci i mini-galeria miały wejść już do tego pilota.

**09.09.2026 — obecna decyzja (SPEC KITU)**: pilotem jest **jeden case wewnątrz jednego obrazu** ("Teatr jest nasz"), forma to **endless runner sterowany skryptem JSON** z panelem dialogowym, stack to **Phaser 3 + Vite + TypeScript**, bez frameworka UI. Grafika: placeholdery generowane kodem + darmowe paczki CC0, **zamiast** generowania przez Imagen. Zakres PoC zawężony do silnika + jednego case'a; hotel jako przestrzeń do chodzenia, ekran startowy, wybór postaci i galeria trafiają do backlogu.

Wprost **unieważnione** przez decyzję z 09.09.2026: stack Next.js/Tailwind/Framer Motion (zastąpiony Phaserem), scrollytelling jako mechanika rdzeniowa (zastąpiony runnerem z panelem dialogowym), generowanie assetów przez Vertex AI Imagen jako Kamień Milowy 0 poprzedzający front-end (odłożone — patrz `04_STYL_I_ASSETY.md`, "Bank promptów na później"), pilot na piętrze Kultura jako całym piętrze ze scenami wyboru case'a (zastąpiony pojedynczym case'em bez huba-piętra), wcześniejsza jeszcze decyzja o pilocie na Edukacji (odrzucona już w samym Koncepcie 05.07.2026 na rzecz Kultury, ze względu na najlepiej domknięty kierunek wizualny i najmocniejsze liczby w case studies). SPEC KITU jest dokumentem wiążącym — gdziekolwiek Koncept_Portfolio_Arka.md lub Prompt_Claude_Code_MVP_Pilot.md są z nim sprzeczne, obowiązuje SPEC. Oba dokumenty zostają jako kontekst historyczny, nie jako instrukcja budowy.

Co **przetrwało** obie fazy bez zmian: wizja hotelu/pałacu jako przestrzeni nadrzędnej, trzy światy (Kultura/Edukacja/Biznes), mechanika progresji przez odbudowę/ułożenie (pomnik→obraz), paleta dziesięciu kolorów, wybór "Teatr jest nasz" i szerzej Kultury jako punktu startowego, cel "zakochać się" w tym co i jak robi Arek, oraz zerowe zaangażowanie techniczne Arka jako stały warunek komunikacji (linki i raporty nietechniczne, nie opisy kodu).

## e) Otwarte pytania — pogrupowane

**Rozstrzygnięte w SPEC (nie wracać do nich bez pytania Arka):**
- Stack: Phaser 3 + Vite + TS, bez frameworka UI.
- Pilot: jeden case, "Teatr jest nasz", świat Kultura.
- Grafika PoC: placeholdery kodem + CC0, nie generowanie przez Imagen.
- Layout: runner góra / dialog dół na desktopie i mobile jako domyślny; wariant lewo/prawo za flagą, testowany w Etapie 2.
- Brak porażki w grze — potknięcie zamiast game over.
- Zapis stanu w PoC: tylko w pamięci, bez localStorage.

**Do decyzji Arka po PoC (backlog, patrz `06_BACKLOG_PO_POC.md`):**
- Forma sztandarów/witraży partnerów (nierozstrzygnięte na tablicy w obu wersjach).
- Kierunek wizualny świata Edukacja — sam autor pisze wprost, że "nie siada na 100%"; wymaga osobnej rundy referencji, zanim powstanie drugi case.
- Trzeci easter egg pomnika (dla Edukacji) — puste pole na tablicy w V1 i V2.
- Zakres i miejsce sekcji "Personal Forecasting" w całości portfolio — osobny produkt czy integralna część ścieżki Biznes/Edukacja.
- Model "biletu"/paywalla jako żart narracyjny — czy w ogóle wchodzi do zakresu.
- Moment i sposób podpięcia domeny ArkadiuszKlej.pl.
- Pomysł spersonalizowanej historii gracza z retro 07/2025 — wymaga osobnej decyzji o zakresie i koszcie.

**Kosmetyczne (nie blokują żadnego etapu):**
- Dokładna sekwencja zapalania pochodni na ekranie startowym ("[trzeba przemyśleć sekwencje]" — cytat wprost z tablicy).
- Styl architektoniczny budynku wejściowego (renesans lubelski? Pałac w Kozłówce?) — czysto dekoracyjne, nie wpływa na mechanikę.
- Czy dodawać muzykę od pierwszego ekranu — pytanie z Konceptu, nieistotne dla silnika runnera.
- Trzy brakujące logotypy partnerów oznaczone "?" na tablicy — kwestia do domknięcia przy budowie sztandarów, nie wcześniej.
