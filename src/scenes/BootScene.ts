import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig';
import { PALETTE, PALETTE_KEYS, PALETTE_ROLES, paletteNumber } from '../config/palette';

export const PROJECT_TITLE = 'PORTFOLIO RUNNER';

/**
 * Etap 0: jedyna scena — tytuł projektu i próbki palety.
 * Od Etapu 1 ta scena będzie generować tekstury placeholderów i przechodzić dalej.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create(): void {
    this.drawTitle();
    this.drawSwatches();
  }

  private drawTitle(): void {
    this.add
      .text(GAME_WIDTH / 2, 72, PROJECT_TITLE, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '28px',
        color: PALETTE.gold,
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 118, 'Hotel → Obraz → Runner · Etap 0: fundament', {
        fontFamily: 'Spectral, Georgia, serif',
        fontSize: '20px',
        color: PALETTE.textMuted,
      })
      .setOrigin(0.5);
  }

  private drawSwatches(): void {
    const columns = 5;
    const swatch = 112;
    const gap = 32;
    const gridWidth = columns * swatch + (columns - 1) * gap;
    const startX = (GAME_WIDTH - gridWidth) / 2;
    const startY = 170;

    PALETTE_KEYS.forEach((key, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      const x = startX + col * (swatch + gap);
      const y = startY + row * (swatch + 56);

      this.add
        .rectangle(x, y, swatch, swatch, paletteNumber(key))
        .setOrigin(0, 0)
        .setStrokeStyle(2, paletteNumber('gold'));

      this.add.text(x, y + swatch + 8, PALETTE[key], {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '10px',
        color: PALETTE.text,
      });
      this.add.text(x, y + swatch + 24, PALETTE_ROLES[key], {
        fontFamily: 'Spectral, Georgia, serif',
        fontSize: '14px',
        color: PALETTE.textMuted,
      });
    });

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 18, 'Paleta: docs/04 · Phaser 3 · Vite · TypeScript', {
        fontFamily: 'Spectral, Georgia, serif',
        fontSize: '14px',
        color: PALETTE.cool,
      })
      .setOrigin(0.5);
  }
}
