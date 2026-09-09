# Styl i assety

## Paleta

Dziesięć kolorów, finalne i potwierdzone (powtarzają się wielokrotnie na tablicy FigJam, przeniesione bez zmian do tego dokumentu). Role poniżej są propozycją do zastosowania w PoC — oznaczone `[propozycja]`, bo tablica nie przypisuje kolorów do funkcji wprost.

| Hex | Rola `[propozycja]` |
|---|---|
| `#261619` | Tło głębokie (canvas, tła scen) |
| `#3E2219` | Tło panelu dialogowego |
| `#742224` | Akcent ostrzegawczy / potknięcie, obramowania |
| `#895F47` | Ziemia, drewno, elementy sceny (ground, ramy) |
| `#DFB67C` | Złoto — akcent Kultury, ornamenty, obramowania obrazu, przyciski główne |
| `#E2E9E1` | Tekst jasny na ciemnym tle |
| `#ACCBC6` | Tekst drugorzędny / stan nieaktywny |
| `#3D5E67` | Akcent chłodny — pasek czasu, elementy UI wyboru |
| `#11485D` | Tło warstwy paralaksy (środkowej) |
| `#0B2F2E` | Tło warstwy paralaksy (najdalszej) |

Zasada kontrastu: tekst w panelu dialogowym zawsze `#E2E9E1` na `#3E2219` lub `#261619` — to jedyna kombinacja gwarantująca kontrast ≥ 4.5:1 wymagany w Etapie 4. `#DFB67C` na ciemnym tle służy do akcentów i elementów klikalnych, nie do bloków tekstu.

## Kierunki wizualne trzech światów

**Kultura** (świat PoC): czarnofigurowa ceramika attycka — sylwetki na pomarańczowo-czarnym tle — jako motyw sylwetek postaci i przeszkód; marmur jako faktura teł i ram; złote ornamenty maureskowe (geometryczne, islamsko-inspirowane wzory) jako obramowania paneli i obrazu; akcenty w stylu Klimta — złote, dekoracyjne kompozycje — jako tło finałowej animacji układania obrazu. Geometryczne, kute litery w tytułach. Na PoC ten kierunek jest oddany wyłącznie paletą i prostymi ornamentami generowanymi kodem — żadnej z tych faktur nie generujemy graficznie na tym etapie.

**Biznes**: klimat gry Transistor — techniczny, industrialny, z motywem "planów konstrukcyjnych" (obiekty rysowane jak złote schematy techniczne, referencja z Konceptu). Art-deco jako nuta dodatkowa. Poza zakresem PoC.

**Edukacja**: nieustalone. Referencje na tablicy — bastion, marmur + dłonie ze "Stworzenia Adama" Michała Anioła (motyw przekazywania wiedzy) — ale sam autor odrzuca obecny kierunek wprost ("bastion Vibe, ale to nie siada na 100%", "ARKOWI TO NIE PASUJE, to jeszcze nie to"). Nie projektować niczego dla Edukacji w PoC poza odnotowaniem tego stanu w backlogu.

## Typografia `[propozycja]`

Dwa fonty, oba darmowe z Google Fonts:

- **HUD/nagłówki (pixel/bitmap)**: `Press Start 2P` — czytelny w małych rozmiarach, jednoznacznie kojarzony z estetyką gry, dobry do liczników fragmentów, etykiet przycisków, tytułu case'a.
- **Dialogi (czytelny tekst)**: `Spectral` lub `Crimson Pro` — szeryfowy, o lekko klasycznym charakterze pasującym do marmuru/antyku świata Kultury, ale wystarczająco czytelny w dłuższych fragmentach narracji przy 14–16 px. Unikać fontu pixelowego dla całych akapitów tekstu — to obniża czytelność i dostępność.

Weryfikacja przed użyciem: sprawdzić w Google Fonts, że oba fonty mają pełny zestaw polskich znaków diakrytycznych (ą, ć, ę, ł, ń, ó, ś, ź, ż) — część fontów bitmapowych ich nie ma.

## Strategia placeholderów PoC

**Generujemy kodem** (Phaser.Graphics → generateTexture, bez plików graficznych):
- Sylwetki postaci (bieg/skok/potknięcie) jako proste kształty geometryczne w palecie, jeśli CC0 sprite nie pasuje do rytmu animacji.
- Tła gradientowe warstw paralaksy — proste przejścia między `#0B2F2E`, `#11485D`, `#261619`.
- Kafle obrazu do układanki (siatka 3×2) — prostokąty z numerem/fragmentem prostego wzoru w palecie, żeby złożenie było czytelne wizualnie nawet bez finalnej grafiki.
- Pasek czasu, ramki paneli, ikony przycisków wyboru.

**Bierzemy z CC0** (paczki pixel-art, patrz niżej):
- Sprite postaci gracza (run/jump/idle) — potrzebuje spójnej animacji klatkowej, trudnej do sensownego wygenerowania kodem.
- Tła paralaksy pierwszego planu (elementy dekoracyjne, sylwetki budynków) — jeśli paczka CC0 pasuje kolorystycznie po przefiltrowaniu w palecie.
- Propsy sceny — przeszkody, elementy scenografii teatralnej pasujące tematycznie do "Teatr jest nasz".
- SFX: kroki, skok, potknięcie, zebranie fragmentu.

## Paczki CC0 — kandydaci

- **Kenney** — https://kenney.nl — zestawy: "Pixel Platformer", "Background Elements Redux", "Pixel UI Pack". Licencja CC0 zadeklarowana wprost na stronie Kenney dla większości zasobów.
- **ansimuz — "Sunny Land"** — https://itch.io (szukaj "ansimuz sunny land") — CC0, pixel-art platformer z gotową paletą tła i postacią.
- **Cainos — "Pixel Art Platformer – Village Props"** — https://itch.io (szukaj "Cainos village props") — CC0, propsy do scenografii.
- **OpenGameArt** — https://opengameart.org — filtrować wyłącznie po licencji CC0 (opcja filtra na stronie), nie ufać samej nazwie paczki.
- **Kenney SFX** — https://kenney.nl — zestawy dźwiękowe, CC0.

**Instrukcja weryfikacji licencji przed pobraniem:**
1. Otworzyć stronę assetu na itch.io/OpenGameArt/kenney.nl i sprawdzić licencję wprost przy pliku do pobrania — nie ufać opisowi w wynikach wyszukiwania.
2. Zrobić zrzut ekranu strony z licencją (dowód na wypadek zmiany licencji w przyszłości) i zapisać do `docs/screens/`.
3. Pobrać plik, zanotować dokładną nazwę paczki, autora, URL, datę pobrania i typ licencji.
4. Wpisać do `ASSETS_ATTRIBUTION.md` w katalogu głównym repo (utworzyć plik, jeśli nie istnieje) wg wzoru:

```
## <nazwa paczki>
- Autor: <autor/studio>
- Źródło: <URL>
- Licencja: CC0 (data weryfikacji: RRRR-MM-DD)
- Użyte pliki: <lista plików w public/assets/cc0/...>
- Zastosowanie w grze: <np. sprite gracza, SFX skoku>
```

5. Jeśli licencja jest niejednoznaczna (np. "free for personal use" zamiast wyraźnego CC0), nie używać — szukać alternatywy.

## Zasady pixel-artu w Phaserze

- `pixelArt: true` w konfiguracji gry (`Phaser.Game config`) — wyłącza filtrowanie tekstur, zachowuje ostre krawędzie pikseli.
- `roundPixels: true` w konfiguracji kamery/renderera — zapobiega subpikselowemu "drżeniu" sprite'ów przy ruchu.
- Skalowanie sprite'ów wyłącznie w liczbach całkowitych (×2, ×3), nigdy ułamkowych — inaczej piksele się rozjeżdżają wizualnie.
- Brak wygładzania (antialiasing wyłączony) na wszystkich teksturach pixel-art — sprzeczne z `pixelArt: true`, więc pilnować, żeby żaden loader tekstur go nie włączał domyślnie.
- Elementy generowane kodem (Graphics → generateTexture) i elementy CC0 muszą używać tej samej siatki pikseli (np. bazowej jednostki 16×16 lub 32×32), inaczej różnice w gęstości pikseli będą widoczne przy przejściach między nimi.

## Specyfikacja placeholdera obrazu "Teatr jest nasz"

Płaskorzeźba: gmach teatru wspierany przez trzy postacie — aktora, widza i reżysera — w układzie symetrycznym, centralnym (gmach pośrodku, postacie po bokach/pod spodem jako "kariatydy"). Styl: marmurowa płaskorzeźba, sylwetki w tonacji `#895F47`/`#DFB67C` na tle `#261619` lub `#3E2219`, z prostym ornamentem maureskowym w obramowaniu.

- Rozmiar: 960×640 px (proporcja 3:2, dopasowana do siatki).
- Siatka podziału: 3×2 (3 kolumny, 2 rzędy) = 6 fragmentów, każdy 320×320 px.
- Realizacja na PoC: prosty SVG lub PNG wygenerowany kodem (kombinacja prostokątów, łuków i prostych kształtów w Phaser.Graphics albo osobny statyczny plik SVG wygenerowany raz i wyeksportowany do `public/assets/paintings/teatr-jest-nasz.png`), nie ręczna ilustracja.
- Stan "zniszczony" (przed grą) i stan "odrestaurowany" (po grze) to dwie wersje tego samego układu — zniszczony ma widoczne pęknięcia/braki w miejscach fragmentów, odrestaurowany jest kompletny. Prostszy wariant: jeden plik z pełnym obrazem, na start renderowany z siatką ciemnych/wyszarzonych kafli nałożonych na brakujące fragmenty, zdejmowanych jeden po drugim w miarę zbierania.

## Bank promptów na później (poza PoC)

Prompty do generatora obrazów (Imagen lub inny), przygotowane pod świat Kultura w finalnej palecie, do wykorzystania przy przejściu z placeholderów na docelową grafikę — **nie realizować w PoC**.

1. "Ancient Greek black-figure pottery style illustration of a theatre facade, silhouette figures on terracotta and black background, gold ornamental border, palette: deep bordeaux #742224, gold #DFB67C, dark teal #0B2F2E, flat vector illustration, no text."
2. "Marble bas-relief sculpture of a Greek theatre building supported by three allegorical figures — actor, audience member, director — symmetrical composition, weathered stone texture, warm gold lighting, palette: #895F47 #DFB67C #261619."
3. "Klimt-inspired decorative gold mosaic background, ornamental geometric patterns, Mauresque motifs, deep teal and bordeaux accents, seamless tileable texture, palette: #DFB67C #742224 #11485D."
4. "Side-scrolling parallax background, ancient Mediterranean city street at dusk, marble columns and terracotta rooftops, layered silhouettes for parallax scrolling, muted color palette #0B2F2E #11485D #3D5E67, painterly pixel-art style."
5. "Pixel art sprite sheet reference style, running human silhouette character in classical Greek-inspired tunic, side view, 32x32 base grid, limited palette #E2E9E1 #895F47 #261619, clean readable silhouette for game animation."
6. "Ornamental gold Mauresque geometric border pattern, seamless, for UI panel framing, palette: #DFB67C on #3E2219 background, flat vector, high contrast for legibility."
7. "Damaged marble fresco, cracked and missing fragments, three figures partially visible beneath rubble, dramatic side lighting, palette: #261619 #895F47 #DFB67C, painterly texture, before-restoration state."
8. "Restored golden mosaic artwork, theatre facade fully intact, radiant gold light emanating from center, ornamental frame, palette: #DFB67C #742224 #E2E9E1, celebratory finale illustration style."
