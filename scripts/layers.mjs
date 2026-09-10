// Warstwy tła biegu (`npm run layers`): z obrazów zaimportowanych przez workflow
// (public/assets/runner/<świat>/{far,mid,near}.jpg, 1920×1080) robi pliki do gry:
//  - far.webp  — pełny kadr, 1440×810;
//  - mid.webp, near.webp — tło magenta (#FF00FF) wycięte do przezroczystości (miękka krawędź,
//    despill), przycięte pionowo do zawartości, szerokość 1440 (kafel; scena odbija go lustrzanie).
// Źródłowe JPG są kasowane po konwersji (workflow tworzy je ponownie przy imporcie).
// Wymaga Chromium z Playwrighta (canvas) — ten sam, którego używa e2e.
import { chromium } from '@playwright/test';
import { existsSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'assets', 'runner');
const OUT_WIDTH = 1440;
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
const browser = await chromium.launch({
  ...(executablePath ? { executablePath } : {}),
  args: ['--allow-file-access-from-files'],
});
const page = await browser.newPage();
await page.goto(`file://${ROOT}/`);

const worlds = readdirSync(ROOT, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);
for (const world of worlds) {
  for (const layer of ['far', 'mid', 'near']) {
    const src = join(ROOT, world, `${layer}.jpg`);
    if (!existsSync(src)) continue;
    const result = await page.evaluate(
      async ({ src, key, outWidth }) => {
        const img = new Image();
        await new Promise((ok, err) => {
          img.onload = ok;
          img.onerror = err;
          img.src = src;
        });
        const W = img.width;
        const H = img.height;
        const c = document.createElement('canvas');
        c.width = W;
        c.height = H;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0);
        let top = 0;
        let h = H;
        if (key) {
          const im = ctx.getImageData(0, 0, W, H);
          const d = im.data;
          // Rampa 24..255: dla mieszanki „kolor × magenta” odległość od magenty to niemal
          // dokładnie krycie, więc rozmycia (biel w tle) dostają prawdziwą alfę zamiast różowej
          // plamy; dolny próg zjada szum JPEG w czystym tle.
          const LO = 24;
          const HI = 255;
          const alpha = new Uint8ClampedArray(W * H);
          for (let i = 0, p = 0; i < d.length; i += 4, p += 1) {
            const r = d[i];
            const g = d[i + 1];
            const b = d[i + 2];
            const dist = Math.sqrt((255 - r) ** 2 + g * g + (255 - b) ** 2);
            let a = (dist - LO) / (HI - LO);
            a = a < 0 ? 0 : a > 1 ? 1 : a;
            alpha[p] = Math.round(a * 255);
          }
          // Krawędzie (półprzezroczyste) dostają kolor najbliższego kryjącego piksela — bez
          // różowej obwódki po JPEG i poświatach zmieszanych z magentą.
          const R = 7;
          for (let y = 0; y < H; y += 1) {
            for (let x = 0; x < W; x += 1) {
              const p = y * W + x;
              const a = alpha[p];
              if (a === 0 || a === 255) continue;
              let found = -1;
              for (let rad = 1; rad <= R && found < 0; rad += 1) {
                for (let dy = -rad; dy <= rad && found < 0; dy += 1) {
                  const yy = y + dy;
                  if (yy < 0 || yy >= H) continue;
                  for (let dx = -rad; dx <= rad; dx += 1) {
                    if (Math.abs(dx) !== rad && Math.abs(dy) !== rad) continue;
                    const xx = x + dx;
                    if (xx < 0 || xx >= W) continue;
                    const q = yy * W + xx;
                    if (alpha[q] === 255) {
                      found = q;
                      break;
                    }
                  }
                }
              }
              if (found >= 0) {
                d[p * 4] = d[found * 4];
                d[p * 4 + 1] = d[found * 4 + 1];
                d[p * 4 + 2] = d[found * 4 + 2];
              } else {
                // Bez kryjącego sąsiada (rozmycie): odejmij domieszkę magenty wg alfy.
                const t = a / 255;
                d[p * 4] = Math.max(0, Math.min(255, (d[p * 4] - (1 - t) * 255) / t));
                d[p * 4 + 1] = Math.max(0, Math.min(255, d[p * 4 + 1] / t));
                d[p * 4 + 2] = Math.max(0, Math.min(255, (d[p * 4 + 2] - (1 - t) * 255) / t));
              }
            }
          }
          for (let p = 0; p < alpha.length; p += 1) d[p * 4 + 3] = alpha[p];
          top = H;
          let bottom = 0;
          for (let y = 0; y < H; y += 1) {
            for (let x = 0; x < W; x += 1) {
              if (alpha[y * W + x] > 8) {
                if (y < top) top = y;
                if (y > bottom) bottom = y;
              }
            }
          }
          top = Math.max(0, top - 6);
          bottom = Math.min(H - 1, bottom + 6);
          h = bottom - top + 1;
          ctx.putImageData(im, 0, 0);
        }
        const scale = outWidth / W;
        const out = document.createElement('canvas');
        out.width = outWidth;
        out.height = Math.round(h * scale);
        const octx = out.getContext('2d');
        octx.imageSmoothingQuality = 'high';
        octx.drawImage(c, 0, top, W, h, 0, 0, out.width, out.height);
        return {
          data: out.toDataURL('image/webp', key ? 0.86 : 0.82),
          width: out.width,
          height: out.height,
        };
      },
      { src: `file://${src}`, key: layer !== 'far', outWidth: OUT_WIDTH },
    );
    const buf = Buffer.from(result.data.split(',')[1], 'base64');
    writeFileSync(join(ROOT, world, `${layer}.webp`), buf);
    unlinkSync(src);
    console.log(
      `${world}/${layer}.webp ${result.width}×${result.height} ${Math.round(buf.length / 1024)} kB`,
    );
  }
}
await browser.close();
