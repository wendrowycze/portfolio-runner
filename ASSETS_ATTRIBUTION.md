# Atrybucja assetów

Lista wszystkich plików graficznych i dźwiękowych spoza kodu (CC0), wg wzoru z `docs/04_STYL_I_ASSETY.md`.

Stan po Etapie 3: brak plików spoza kodu. Wszystko, co widać, jest rysowane kodem:

- tła, postać, przeszkody, efekty — `Phaser.Graphics → generateTexture` w `BootScene` (generatory w `src/assets/generators/`),
- obrazy case'ów — ręcznie napisane SVG z prostych kształtów w palecie projektu (`public/assets/paintings/*.svg`), nie ilustracje z zewnątrz,
- panel, widgety, finał — DOM/CSS.

Fonty: Press Start 2P i Spectral z Google Fonts (licencja OFL), ładowane przez `<link>` w `index.html`, z fallbackiem systemowym.
