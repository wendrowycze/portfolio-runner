# Portfolio Runner — kit startowy

Ten folder to komplet materiałów do zbudowania pilota Twojego portfolio-gry ("Hotel -> Obraz -> Runner") w Claude Code. Nie musisz nic z tego pisać ani rozumieć technicznie — poniżej jest instrukcja krok po kroku.

## Co z tym zrobić — 5 kroków

1. **Załóż puste repozytorium na GitHubie** (np. `portfolio-runner`). Jeśli pracujesz w Claude Code w chmurze (claude.ai/code), podłącz to repozytorium do nowej sesji; jeśli lokalnie — otwórz jego folder w Claude Code.
2. **Wgraj całą zawartość tego folderu** (`Portfolio_Runner_Starter/`) do repozytorium — wszystkie pliki i podfoldery, jeden do jednego (w chmurze możesz też po prostu wkleić pliki jako załączniki do pierwszej wiadomości i poprosić Claude Code, żeby zapisał je w repo w tej samej strukturze).
3. **Wklej `PROMPT_STARTOWY.md`** jako pierwszą wiadomość do Claude Code (w trybie Plan Mode — Claude Code samo o to poprosi lub przełącz ręcznie). Claude Code przeczyta cały kit i przedstawi Ci plan pierwszego etapu.
4. **Akceptuj plany kolejnych etapów.** Po każdym etapie Claude Code zatrzyma się i poczeka na Twoją odpowiedź — możesz napisać "OK, leć dalej" albo odpowiedzieć na konkretne pytania, które zada.
5. **Oceniaj linki.** Po każdym etapie dostaniesz link do działającej wersji w przeglądarce plus krótki opis, co zobaczysz i co sprawdzić. Nie musisz nic instalować ani czytać kodu.

## Czego się spodziewać

Praca podzielona jest na **6 etapów** (Etap 0-5, opisane w `docs/03_PLAN_ETAPOW.md`). Po każdym — nowy link do obejrzenia:

- Etap 0 — pusty szkielet techniczny (ekran z tytułem i kolorami)
- Etap 1 — samo bieganie i skakanie, bez historii
- Etap 2 — pojawia się okno dialogowe z wyborami (na przykładowej, testowej treści)
- Etap 3 — pierwsza prawdziwa historia: "Teatr jest nasz", od początku do końca
- Etap 4 — dopracowanie: dźwięk, płynność, telefon, dostępność
- Etap 5 — domknięcie: podsumowanie, instrukcja jak dodawać kolejne historie, propozycja co dalej

## Jakie decyzje będziesz podejmować

Przy każdym etapie Claude Code zada Ci maksymalnie 1-3 pytania, zawsze z rekomendacją — możesz po prostu potwierdzić rekomendację, jeśli nie masz innego zdania:

- **Etap 1:** jaki ma być charakter i tempo biegu postaci (dynamiczne czy spokojniejsze).
- **Etap 2:** czy panel z dialogiem ma być pod biegiem, czy obok niego.
- **Etap 3:** czy minigra z układanką ma polegać na klikaniu czy przeciąganiu; czy licznik zbiórki pokazuje 200 000 zł czy też sumę 500 000+ zł.
- **Etap 4:** czy dźwięk włącza się od razu, czy dopiero po pierwszym kliknięciu.
- **Etap 5:** które 3 kolejne historie robimy jako następne.

## Mapa plików kitu

| Plik | Dla kogo | Po co |
|---|---|---|
| `README.md` | Ty | ta instrukcja |
| `PROMPT_STARTOWY.md` | Ty -> Claude Code | pierwsza wiadomość, którą wklejasz |
| `CLAUDE.md` | Claude Code | zasady pracy, stack, konwencje — czyta to automatycznie |
| `docs/00_KONCEPCJA.md` | Claude Code (i Ty, jeśli ciekawi) | pełna wizja projektu |
| `docs/01_GDD_RUNNER_POC.md` | Claude Code | zasady rozgrywki pilota |
| `docs/02_ARCHITEKTURA.md` | Claude Code | jak zbudowany jest kod (techniczne, nie musisz czytać) |
| `docs/03_PLAN_ETAPOW.md` | Ty i Claude Code | plan pracy etapami, co i kiedy oceniasz |
| `docs/04_STYL_I_ASSETY.md` | Claude Code | paleta kolorów, źródła darmowej grafiki/dźwięku |
| `docs/05_KONTEKST_ZRODLA.md` | Claude Code | skąd wzięła się treść (Notion, FigJam) |
| `docs/06_BACKLOG_PO_POC.md` | Ty i Claude Code | co świadomie zostawiamy na później |
| `content/schema/case.schema.json` | Claude Code | format danych jednej historii |
| `content/cases/teatr-jest-nasz.json` | Claude Code | dane pilotażowej historii |
| `content/cases_raw/` | Claude Code | surowe teksty historii spisane z Kubą |
| `content/inwentarz_tresci.md` | Claude Code | inwentarz CV/projektów jako materiał źródłowy |
| `prompts/etap_0..5_*.md` | Ty -> Claude Code | gotowe wiadomości do wklejenia na start każdego etapu |

## Co zostało unieważnione ze starych materiałów

Wcześniejszy dokument `Prompt_Claude_Code_MVP_Pilot.md` (wersja 3, plan pilota na piętrze Kultura w Next.js/React ze scrollytellingiem i generowaniem grafik przez Vertex AI) **jest zastąpiony przez ten kit**. Nowy kierunek: Phaser (silnik do gier w przeglądarce) zamiast Next.js/React, placeholdery generowane kodem i darmowe paczki pixel-art zamiast generowania AI, oraz węższy zakres pilota (silnik biegu + jedna historia, nie całe piętro Kultury z formularzem i galerią). `Koncept_Portfolio_Arka.md` zostaje jako materiał źródłowy u Ciebie — nadal opisuje pełną wizję hotelu, ale tam, gdzie jest sprzeczny z tym kitem, obowiązuje ten kit. Oba te dokumenty są historycznym kontekstem poza tym folderem — nie trzeba ich kopiować do repozytorium, wszystko, co z nich istotne dla budowy PoC, jest już przeniesione do plików w `docs/`.

---

Data: 2026-09-09. Źródła treści: FigJam (paleta, moodboard), Notion ("Praca z Kubą" — teksty historii; "Portfolio Arka" i "Czyste portfolio Arka" — inwentarz CV/projektów).
