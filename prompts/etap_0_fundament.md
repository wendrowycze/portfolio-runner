# Prompt — Etap 0: Fundament

Skopiuj poniższy blok do Claude Code w trybie **Plan Mode**.

```
Kontekst: Buduję pilotażowy PoC interaktywnego portfolio "Hotel -> Obraz -> Runner".
Przeczytaj w całości, w tej kolejności: CLAUDE.md, docs/00_KONCEPCJA.md,
docs/01_GDD_RUNNER_POC.md, docs/02_ARCHITEKTURA.md, docs/03_PLAN_ETAPOW.md
(sekcja "Etap 0"). Nie czytaj jeszcze treści case'ów w content/cases_raw/ —
nie są potrzebne na tym etapie.

Zadanie: zrealizuj wyłącznie Etap 0 ("Fundament") z docs/03_PLAN_ETAPOW.md.
Zakres jest zamknięty listą zadań w tym dokumencie — nie dodawaj nic poza nią.

Wymagania techniczne (wiążące, patrz docs/02_ARCHITEKTURA.md):
- Vite + TypeScript (strict: true) + Phaser 3 (najnowsza stabilna 3.x)
- ESLint + Prettier
- Vitest skonfigurowany, min. jeden przechodzący test
- Playwright skonfigurowany, min. jeden test smoke (strona się ładuje)
- .github/workflows/deploy.yml: build + test + e2e + deploy na GitHub Pages
- vite.config.ts z poprawnym `base` dla GitHub Pages
- jedna scena Phasera pokazująca tytuł projektu i próbki palety z docs/02_ARCHITEKTURA.md
- struktura katalogów dokładnie wg docs/02_ARCHITEKTURA.md sekcja 1 (szkielet,
  puste katalogi tam gdzie treść przyjdzie później)

Definition of Done:
- npm run build, npm test, npm run e2e przechodzą bez błędów
- link do GitHub Pages pokazuje działający ekran z tytułem i paletą

Zanim zaczniesz: przedstaw plan (jakie pliki/katalogi powstaną, jakie decyzje
konfiguracyjne podejmujesz i dlaczego) i poczekaj na moją akceptację. Nie pisz
kodu przed akceptacją planu.

Na koniec: podaj link do działającego podglądu i napisz raport dla mnie po
polsku, nietechniczny, wg szablonu z docs/03_PLAN_ETAPOW.md (sekcja "Raport
dla Arka" pod Etapem 0). Zapisz zrzut ekranu do docs/screens/etap0.png.

Zakazy:
- nie wychodź poza zakres Etapu 0 (żadnej logiki gry, żadnych scen poza
  startową)
- nie dodawaj żadnej zależności npm bez wpisu w docs/DZIENNIK.md z
  uzasadnieniem
- nie commituj bez mojej akceptacji planu

Po ukończeniu: commit z wiadomością "etap-0: ...", potem stop i czekaj na
moją odpowiedź.
```
