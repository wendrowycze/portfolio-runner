import type Phaser from 'phaser';
import { PALETTE } from '../config/palette';
import { bus } from '../events/bus';
import type { GameState } from '../state/GameState';

const FONT_HUD = '"Press Start 2P", monospace';

/**
 * HUD w canvasie: licznik fragmentów i potknięć (zawsze) + HUD debug (FPS, prędkość, time scale)
 * włączany parametrem URL ?debug=1 lub klawiszem F3.
 */
export class Hud {
  private readonly fragmentsText: Phaser.GameObjects.Text;
  private readonly stumblesText: Phaser.GameObjects.Text;
  private readonly debugText: Phaser.GameObjects.Text;
  private debugVisible: boolean;
  private lastFpsUpdate = 0;

  constructor(
    scene: Phaser.Scene,
    width: number,
    private readonly state: GameState,
    private totalFragments: number,
    debugVisible: boolean,
  ) {
    this.debugVisible = debugVisible;
    this.fragmentsText = scene.add
      .text(width - 16, 14, '', {
        fontFamily: FONT_HUD,
        fontSize: '12px',
        color: PALETTE.gold,
        stroke: PALETTE.bgDeep,
        strokeThickness: 4,
      })
      .setOrigin(1, 0)
      .setDepth(100);
    this.stumblesText = scene.add
      .text(width - 16, 36, '', {
        fontFamily: FONT_HUD,
        fontSize: '10px',
        color: PALETTE.textMuted,
        stroke: PALETTE.bgDeep,
        strokeThickness: 4,
      })
      .setOrigin(1, 0)
      .setDepth(100);
    this.debugText = scene.add
      .text(12, 12, '', {
        fontFamily: FONT_HUD,
        fontSize: '9px',
        color: PALETTE.text,
        backgroundColor: 'rgba(38,22,25,0.75)',
        padding: { x: 6, y: 6 },
        lineSpacing: 6,
      })
      .setDepth(100)
      .setVisible(debugVisible);

    scene.input.keyboard?.on('keydown-F3', () => {
      this.setDebugVisible(!this.debugVisible);
    });
    this.refreshCounters();
  }

  setVisible(visible: boolean): void {
    this.fragmentsText.setVisible(visible);
    this.stumblesText.setVisible(visible);
    this.debugText.setVisible(visible && this.debugVisible);
  }

  setTotalFragments(total: number): void {
    this.totalFragments = total;
    this.refreshCounters();
  }

  setDebugVisible(visible: boolean): void {
    this.debugVisible = visible;
    this.debugText.setVisible(visible);
    bus.emit('debug:toggle', visible);
  }

  get fragmentsAnchor(): { x: number; y: number } {
    return { x: this.fragmentsText.x - this.fragmentsText.width / 2, y: this.fragmentsText.y + 8 };
  }

  /** Miga licznikiem fragmentów po zebraniu. */
  pulseFragments(scene: Phaser.Scene): void {
    this.refreshCounters();
    scene.tweens.add({
      targets: this.fragmentsText,
      scale: 1.35,
      duration: 120,
      yoyo: true,
      ease: 'Quad.easeOut',
    });
  }

  refreshCounters(): void {
    this.fragmentsText.setText(
      `${String(this.state.fragments.length)}/${String(this.totalFragments)}`,
    );
    this.stumblesText.setText(`x${String(this.state.stumbles)}`);
  }

  update(now: number, actualFps: number, worldSpeed: number): void {
    this.stumblesText.setText(`x${String(this.state.stumbles)}`);
    if (!this.debugVisible) return;
    if (now - this.lastFpsUpdate >= 500) {
      this.lastFpsUpdate = now;
      this.debugText.setText(
        [
          `FPS ${String(Math.round(actualFps))}`,
          `SPEED ${String(Math.round(worldSpeed))} px/s`,
          `TIME x${this.state.timeScale.toFixed(2)}`,
          `STUMBLES ${String(this.state.stumbles)}`,
        ].join('\n'),
      );
    }
  }
}
