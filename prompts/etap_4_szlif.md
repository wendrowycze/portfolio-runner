# Prompt — Etap 4: Szlif

Skopiuj poniższy blok do Claude Code.

```
Kontekst: Etapy 0-3 są zaakceptowane i wdrożone — pełny case "Teatr jest
nasz" działa od huba do finału. Przeczytaj docs/02_ARCHITEKTURA.md sekcje
11-12 (responsywność, dostępność) i docs/03_PLAN_ETAPOW.md (sekcja
"Etap 4"). Sprawdź docs/DZIENNIK.md.

Zadanie: zrealizuj wyłącznie Etap 4 ("Szlif") — te same mechaniki co w
Etapie 3, dopracowane w detalach, bez nowej treści ani mechanik gry.

Wymagania techniczne:
- dobierz SFX na licencji CC0 (kroki, skok, potknięcie, zebranie
  fragmentu) — np. Kenney SFX (patrz docs/04_STYL_I_ASSETY.md) — wpisz
  każdy do ASSETS_ATTRIBUTION.md i src/assets/manifest.ts
- podepnij dźwięki pod odpowiednie zdarzenia z bus.ts; dźwięk startuje
  dopiero po pierwszym kliknięciu/tapie użytkownika (wymóg przeglądarek +
  lepsze UX), nie automatycznie przy ładowaniu
- przejścia fade/slide między beatami w DialoguePanel
- sprawdź i popraw działanie na szerokości 375 px (layout stack musi
  działać w pełni; jeśli layout side nie mieści się sensownie poniżej
  pewnej szerokości, przełącz automatycznie na stack poniżej breakpointu
  i odnotuj to w docs/DZIENNIK.md)
- dostępność: pełna nawigacja klawiaturą (Tab przez cały przebieg gry),
  widoczny fokus, aria-live="polite" na kontenerze tekstu, fokus
  automatyczny na pierwszej opcji przy beacie choice
- media query prefers-reduced-motion: wyłącz/skróć typewriter, fade,
  time dilation (przejście natychmiastowe zamiast płynnego)
- audytuj kontrast tekstu panelu (cel: >= 4.5:1), popraw kolory jeśli
  trzeba (tylko w granicach palety z docs/02_ARCHITEKTURA.md, konsultuj
  odcienie tej samej rodziny barw)
- ekran ładowania z progress barem na starcie (BootScene)
- scale.refresh() na resize, przetestuj zmianę rozmiaru okna w trakcie
  gry (nie tylko przed startem)

Definition of Done:
- Lighthouse Accessibility >= 90 na stronie z grą (dołącz zrzut wyniku)
- gra grywalna i czytelna na 375 px
- dźwięk działa, nie jest za głośny, włącza się po interakcji

Na koniec: link + raport po polsku wg szablonu z docs/03_PLAN_ETAPOW.md
(Etap 4) — poinformuj że dźwięk włącza się po pierwszym kliknięciu
(techniczny wymóg przeglądarek) zamiast pytać, chyba że napotkasz realny
wybór wymagający decyzji.

Zakazy:
- nie wychodź poza Etap 4 (żadnych nowych case'ów, żadnych nowych
  mechanik rozgrywki)
- nie dodawaj zależności npm bez wpisu w docs/DZIENNIK.md

Po ukończeniu: commit "etap-4: ...", stop i czekaj na moją odpowiedź.
```
