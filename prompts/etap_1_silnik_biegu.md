# Prompt — Etap 1: Silnik biegu

Skopiuj poniższy blok do Claude Code (kontynuacja tej samej sesji/repo co Etap 0).

```
Kontekst: Etap 0 (fundament) jest zaakceptowany i wdrożony. Przeczytaj
docs/02_ARCHITEKTURA.md (sekcje 3, 9, 15 — moduły runner/*, konfiguracja
Phasera, wydajność) i docs/03_PLAN_ETAPOW.md (sekcja "Etap 1"). Sprawdź
docs/DZIENNIK.md, żeby znać decyzje podjęte w Etapie 0.

Zadanie: zrealizuj wyłącznie Etap 1 ("Silnik biegu"). Zakres jest zamknięty
listą zadań w docs/03_PLAN_ETAPOW.md — generyczny bieg bez treści i bez
skryptu JSON (to Etap 2).

Wymagania techniczne:
- src/runner/Parallax.ts — 3-4 warstwy tileSprite, różne prędkości
- src/runner/Player.ts — run/jump/stumble na Arcade Physics, tekstury
  placeholder wygenerowane w BootScene (Phaser.Graphics.generateTexture)
  lub prosty CC0 sprite jeśli szybciej dostępny (wpisz źródło i licencję do
  ASSETS_ATTRIBUTION.md)
- src/runner/Obstacles.ts — ObstacleSpawner z object poolingiem
  (reużywanie instancji, zero alokacji w update())
- kolizje gracz-przeszkoda wywołują stumble()
- HUD debug: FPS i aktualna prędkość, tekst w rogu ekranu
- sterowanie: spacja/strzałka w górę = skok (desktop), tap = skok (mobile)
- src/scenes/RunnerScene.ts spina powyższe w jedną grywalną scenę,
  dostępną z ekranu startowego Etapu 0

Definition of Done:
- da się biegać i skakać nad przeszkodami na desktop i mobile (test w
  DevTools emulacji dotyku)
- 60 fps stabilnie widoczne w HUD debug na typowym laptopie
- link pokazuje działający bieg

Na koniec: link + raport po polsku wg szablonu z docs/03_PLAN_ETAPOW.md
(sekcja "Raport dla Arka" pod Etapem 1) — pamiętaj o pytaniu o charakter
postaci/tempo biegu z rekomendacją. Zrzut ekranu do docs/screens/etap1.png.

Zakazy:
- nie wychodź poza Etap 1 (żadnego panelu dialogowego, żadnego JSON-a ze
  skryptem beatów)
- nie dodawaj zależności npm bez wpisu w docs/DZIENNIK.md
- jeśli sięgasz po sprite CC0 zamiast placeholdera generowanego kodem,
  odnotuj to i licencję w ASSETS_ATTRIBUTION.md

Po ukończeniu: commit "etap-1: ...", stop i czekaj na moją odpowiedź.
```
