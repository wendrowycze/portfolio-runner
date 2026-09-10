# Atrybucja assetów

Lista wszystkich plików graficznych i dźwiękowych spoza kodu (CC0), wg wzoru z `docs/04_STYL_I_ASSETY.md`.

Stan po Etapie 3: brak plików spoza kodu. Wszystko, co widać, jest rysowane kodem:

- tła, postać, przeszkody, efekty — `Phaser.Graphics → generateTexture` w `BootScene` (generatory w `src/assets/generators/`),
- obrazy case'ów — ręcznie napisane SVG z prostych kształtów w palecie projektu (`public/assets/paintings/*.svg`), nie ilustracje z zewnątrz,
- panel, widgety, finał — DOM/CSS.

Fonty: Press Start 2P i Spectral z Google Fonts (licencja OFL), ładowane przez `<link>` w `index.html`, z fallbackiem systemowym.

## Obrazy wygenerowane przez API (stan po 2026-09-10)

- Generator: Gamma (`generate_image`, konto Arka), prompty w `content/paintings/sources.json` (adresy) i w `docs/DZIENNIK.md`.
- Pliki: `public/assets/paintings/<id>.jpg` (12 obrazów case'ów, 960×640) i `public/assets/hotel/facade.jpg` (fasada, 960×540), importowane workflow'em `.github/workflows/paintings-import.yml`.
- Licencja: treść wygenerowana na koncie właściciela projektu (Arkadiusz Klej) — do użytku w portfolio; nie pochodzi z paczek CC0.
- Dźwięk: brak plików — wszystkie dźwięki są syntezowane w przeglądarce (`src/audio/AudioEngine.ts`).

## Modele i rendery z Meshy (stan po 2026-09-10)

- Generator: Meshy (text-to-3D, API v2, konto Arka; klucz w sekrecie repozytorium `MESHY_API_KEY`), zamówienia w `content/meshy/requests.json`, workflow `.github/workflows/meshy-generate.yml`, skrypt `scripts/meshy.mjs`.
- Pliki źródłowe: `public/assets/meshy/<id>/render.png` (podgląd) i `model.glb` (model 3D) dla `posag-kultura`, `posag-edukacja`, `posag-biznes`, `kinkiet`.
- Użyte w grze: `public/assets/hotel/statue-{kultura,edukacja,biznes}.png` — rendery z wyciętym tłem i przycięte (Chromium/canvas), barwione w grze per świat; `sconce-meshy.png` zapisany, na razie nieużywany.
- Licencja: treść wygenerowana na koncie właściciela projektu — do użytku w portfolio.
