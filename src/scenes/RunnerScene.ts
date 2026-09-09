import Phaser from 'phaser';
import { textureKey } from '../assets/manifest';
import { col } from '../assets/generators/draw';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig';
import { TUNING } from '../config/tuning';
import { bus } from '../events/bus';
import { Hud } from '../runner/Hud';
import { ObstacleSpawner } from '../runner/Obstacles';
import { Parallax } from '../runner/Parallax';
import { Player } from '../runner/Player';
import { TimeDilation } from '../runner/TimeDilation';
import type { BeatOutcome, ScriptRunner } from '../script/ScriptRunner';
import { totalFragments, type Beat, type Case } from '../script/types';
import { PAINTING_RASTER, paintingTextureKey } from '../assets/manifest';
import { createGameState, worldSpeed, type GameState } from '../state/GameState';

export interface RunnerScriptData {
  runner: ScriptRunner;
  kejs: Case;
  state: GameState;
}

export interface RunnerSceneData {
  /** HUD debug widoczny od startu (?debug=1). */
  debug?: boolean;
  /** Pomiń hub i zacznij bieg od razu (?case=…). */
  startInRunner?: boolean;
  /** Tryb skryptowany (Etap 2+). Brak = wolny bieg z przeszkodami proceduralnymi (Etap 1). */
  script?: RunnerScriptData;
}

/**
 * Scena biegu: paralaksa, postać, przeszkody, HUD. W trybie skryptowanym reaguje na zdarzenia
 * ScriptRunnera (spawn przeszkód pod beat, time dilation, skok/potknięcie, lot fragmentu).
 * Nie importuje niczego z src/ui/ — z DOM łączy ją wyłącznie magistrala i ScriptRunner.
 */
export class RunnerScene extends Phaser.Scene {
  private state!: GameState;
  private parallax!: Parallax;
  private player!: Player;
  private spawner!: ObstacleSpawner;
  private timeDilation!: TimeDilation;
  private hud!: Hud;
  private sparks!: Phaser.GameObjects.Particles.ParticleEmitter;
  private zoneMarker!: Phaser.GameObjects.Rectangle;
  private spotlight!: Phaser.GameObjects.Ellipse;
  private script: RunnerScriptData | undefined;
  /** Kierunek biegu w narracji: klawiatura (przez magistralę) i dotyk/klik w scenę. */
  private keyDirection: -1 | 0 | 1 = 0;
  private pointerDirection: -1 | 0 | 1 = 0;
  private finaleStarted = false;
  private lastInputAt = 0;
  private lastStumbleAt = -Infinity;
  private started = false;
  private readonly unsubscribe: (() => void)[] = [];
  private readonly groundY = Math.round(GAME_HEIGHT * TUNING.GROUND_RATIO);

  constructor() {
    super('RunnerScene');
  }

  private get freeRun(): boolean {
    return this.script === undefined;
  }

  create(data: RunnerSceneData): void {
    this.script = data.script;
    this.started = false;
    this.finaleStarted = false;
    this.keyDirection = 0;
    this.pointerDirection = 0;
    delete document.body.dataset.finale;
    this.state = this.script?.state ?? createGameState(TUNING.BASE_SPEED);
    this.state.timeScale = 1;
    this.physics.world.setBounds(0, -400, GAME_WIDTH, this.groundY + 400);
    this.physics.world.gravity.y = TUNING.GRAVITY_Y;

    this.parallax = new Parallax(this, GAME_WIDTH, GAME_HEIGHT, this.groundY);
    this.player = new Player(this, TUNING.PLAYER_X, this.groundY);
    this.spawner = new ObstacleSpawner(this, GAME_WIDTH, this.groundY, TUNING.PLAYER_X);
    this.timeDilation = new TimeDilation(this, this.state);
    const total = this.script === undefined ? 6 : totalFragments(this.script.kejs);
    this.hud = new Hud(this, GAME_WIDTH, this.state, total, data.debug === true);

    this.sparks = this.add.particles(0, 0, textureKey('fx.spark'), {
      lifespan: { min: 300, max: 600 },
      speed: { min: 60, max: 180 },
      angle: { min: 200, max: 340 },
      gravityY: 400,
      scale: { start: 1.2, end: 0 },
      quantity: 14,
      emitting: false,
    });
    this.sparks.setDepth(20);

    this.zoneMarker = this.add
      .rectangle(TUNING.PLAYER_X, this.groundY, TUNING.QTE_ZONE_WIDTH_PX, 6, col('gold'), 0.45)
      .setOrigin(0, 1)
      .setDepth(7)
      .setVisible(false);

    // Złoty snop światła pod przeszkodą aktywnego beatu — przyciąga wzrok do tego, co nadchodzi.
    this.spotlight = this.add
      .ellipse(0, this.groundY - 2, 140, 22, col('gold'), 0.22)
      .setDepth(6)
      .setVisible(false);

    this.physics.add.overlap(this.player.sprite, this.spawner.group, (_p, obstacle) => {
      this.onObstacleHit(obstacle as Phaser.Physics.Arcade.Image);
    });

    this.setupInput();
    this.cameras.main.fadeIn(400, 0x26, 0x16, 0x19);

    if (this.script !== undefined) {
      this.bindScript(this.script.runner);
      this.time.delayedCall(700, () => {
        this.started = true;
        this.script?.runner.start();
      });
    } else {
      this.spawner.scheduleFree(this.time.now, 1200);
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      for (const off of this.unsubscribe) off();
      this.unsubscribe.length = 0;
      this.timeDilation.destroy();
    });
    document.body.dataset.scene = 'runner';
    bus.emit('runner:ready');
  }

  // ----- wejście -----

  private setupInput(): void {
    if (this.freeRun) {
      // W trybie skryptowanym klawiaturę obsługuje panel (jedno miejsce, bez podwójnych zdarzeń).
      this.input.keyboard?.on('keydown-SPACE', () => {
        this.handleJumpInput();
      });
      this.input.keyboard?.on('keydown-UP', () => {
        this.handleJumpInput();
      });
    }
    this.input.on(Phaser.Input.Events.POINTER_DOWN, (pointer: Phaser.Input.Pointer) => {
      if (this.script?.runner.phase === 'narration') {
        // Przytrzymanie prawej połowy sceny = bieg, lewej = cofanie (dotyk/mysz).
        this.pointerDirection = pointer.x >= GAME_WIDTH / 2 ? 1 : -1;
        return;
      }
      this.handleJumpInput();
    });
    const release = (): void => {
      this.pointerDirection = 0;
    };
    this.input.on(Phaser.Input.Events.POINTER_UP, release);
    this.input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, release);
    this.input.on(Phaser.Input.Events.GAME_OUT, release);
    this.unsubscribe.push(
      bus.on('move:direction', (direction) => {
        this.keyDirection = direction;
      }),
    );
  }

  private get moveDirection(): -1 | 0 | 1 {
    return this.keyDirection !== 0 ? this.keyDirection : this.pointerDirection;
  }

  /** Skok/tap z debouncem (GDD sekcja i). W trybie skryptowanym trafia do ScriptRunnera. */
  private handleJumpInput(): void {
    const now = this.time.now;
    if (now - this.lastInputAt < TUNING.INPUT_DEBOUNCE_MS) return;
    this.lastInputAt = now;
    if (this.script === undefined) {
      this.player.jump();
      return;
    }
    const runner = this.script.runner;
    if (runner.phase === 'action') runner.triggerAction();
  }

  private onObstacleHit(obstacle: Phaser.Physics.Arcade.Image): void {
    const info = this.spawner.info(obstacle);
    if (info === undefined || info.cleared || info.motion === 'timed') return;
    const now = this.time.now;
    if (now - this.lastStumbleAt < TUNING.STUMBLE_COOLDOWN_MS) return;
    this.lastStumbleAt = now;
    this.state.stumbles += 1;
    this.player.stumble();
    this.timeDilation.stumble();
    this.spawner.dismiss(obstacle);
    this.hud.refreshCounters();
  }

  // ----- integracja ze skryptem -----

  private bindScript(runner: ScriptRunner): void {
    this.unsubscribe.push(
      runner.on('beat:start', (beat) => {
        this.onBeatStart(beat);
      }),
      runner.on('timer:progress', (fraction) => {
        this.spawner.setProgress(fraction);
      }),
      runner.on('action:window', (open) => {
        this.zoneMarker.setAlpha(open ? 0.9 : 0.45);
        if (open) {
          this.tweens.add({ targets: this.zoneMarker, scaleY: 2.2, duration: 160, yoyo: true });
        }
      }),
      runner.on('beat:resolved', (beat, outcome) => {
        this.onBeatResolved(beat, outcome);
      }),
    );
  }

  private onBeatStart(beat: Beat): void {
    const kejs = this.script?.kejs;
    if (kejs === undefined) return;
    const slowdown = kejs.runner.choiceSlowdown;
    this.zoneMarker.setVisible(false);
    this.player.run();
    switch (beat.type) {
      case 'narration':
        // Świat staje od razu; dalej tempo śledzi trzymany klawisz (update → track), nie tween.
        this.timeDilation.setTarget(0, 0);
        break;
      case 'choice':
        this.timeDilation.enter(slowdown);
        this.spawner.spawnForBeat({
          obstacleKey: beat.obstacle,
          arriveInMs: beat.timerMs,
          worldSpeedPxPerSec: this.state.baseSpeed * slowdown,
        });
        break;
      case 'action': {
        this.timeDilation.enter(slowdown);
        const arriveInMs = TUNING.ACTION_ZONE_START_MS + beat.windowMs;
        const zoneWidth = (this.state.baseSpeed * slowdown * beat.windowMs) / 1000;
        this.spawner.spawnForBeat({
          obstacleKey: beat.obstacle,
          arriveInMs,
          worldSpeedPxPerSec: this.state.baseSpeed * slowdown,
        });
        this.zoneMarker.setSize(Math.max(zoneWidth, 40), 6).setAlpha(0.45).setVisible(true);
        break;
      }
      case 'interaction':
        this.timeDilation.setTarget(0, 500, 'Quad.easeOut');
        break;
      case 'results':
        this.timeDilation.setTarget(0, 900, 'Quad.easeOut');
        this.time.delayedCall(900, () => {
          if (this.script?.runner.phase === 'results') this.player.idle();
        });
        break;
      case 'finale':
        this.playFinale();
        break;
    }
  }

  /**
   * Finał w scenie (decyzja Arka): świat ciemnieje, fragmenty obrazu „ukryte” w scenerii
   * rozjaśniają się i zlatują w kolejności zebrania na siatkę pośrodku sceny, potem złoty
   * rozbłysk i rama. Panel dostaje `finale:assembled` i pokazuje tekst zamknięcia + CTA.
   */
  private playFinale(): void {
    const kejs = this.script?.kejs;
    if (kejs === undefined || this.finaleStarted) return;
    this.finaleStarted = true;
    this.hud.setVisible(false);
    this.spotlight.setVisible(false);
    this.timeDilation.setTarget(0, 700, 'Quad.easeOut');
    this.time.delayedCall(700, () => {
      this.player.idle();
    });

    const { cols, rows } = kejs.painting;
    const total = totalFragments(kejs);
    const srcW = PAINTING_RASTER.width / cols;
    const srcH = PAINTING_RASTER.height / rows;
    const tileSize = Math.min(150, Math.floor((GAME_WIDTH * 0.55) / cols), Math.floor(300 / rows));
    const scale = tileSize / srcW;
    const gridW = tileSize * cols;
    const gridH = tileSize * rows;
    const cx = GAME_WIDTH / 2;
    const cy = this.groundY / 2 + 10;
    const paintingKey = paintingTextureKey(kejs.id);
    const texture = this.textures.get(paintingKey);

    // Przyciemnienie scenerii — obraz wyłania się z tła.
    const shade = this.add
      .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, col('bgDeep'), 1)
      .setOrigin(0, 0)
      .setDepth(40)
      .setAlpha(0);
    this.tweens.add({ targets: shade, alpha: 0.62, duration: 1400, ease: 'Sine.easeInOut' });

    // Kolejność wlatywania = kolejność zebrania (brakujące — teoretycznie — na końcu).
    const order = [...this.state.fragments];
    for (let f = 1; f <= total; f += 1) if (!order.includes(f)) order.push(f);

    // Pozycje startowe rozrzucone po scenerii (panorama, kolumnada, latarnie).
    const scatter = [
      [0.12, 0.3],
      [0.88, 0.22],
      [0.3, 0.62],
      [0.72, 0.66],
      [0.5, 0.18],
      [0.06, 0.74],
      [0.94, 0.5],
      [0.4, 0.4],
      [0.62, 0.85],
    ];
    const tiles: Phaser.GameObjects.Image[] = [];
    for (let f = 1; f <= total; f += 1) {
      const c = (f - 1) % cols;
      const r = Math.floor((f - 1) / cols);
      const frameName = `tile-${String(cols)}x${String(rows)}-${String(f)}`;
      if (!texture.has(frameName)) texture.add(frameName, 0, c * srcW, r * srcH, srcW, srcH);
      const spot = scatter[(f - 1) % scatter.length];
      const spotX = spot?.[0] ?? 0.5;
      const spotY = spot?.[1] ?? 0.5;
      const tile = this.add
        .image(spotX * GAME_WIDTH, spotY * this.groundY, paintingKey, frameName)
        .setDepth(41)
        .setScale(scale * 0.45)
        .setAlpha(0)
        .setAngle((f % 2 === 0 ? 1 : -1) * (8 + f * 3))
        .setTint(0xdfb67c);
      tile.setData('target', {
        x: cx - gridW / 2 + c * tileSize + tileSize / 2,
        y: cy - gridH / 2 + r * tileSize + tileSize / 2,
      });
      tiles.push(tile);
      this.tweens.add({ targets: tile, alpha: 0.55, duration: 900, delay: 300 + f * 90 });
    }

    const stagger = TUNING.FINALE_TILE_STAGGER_MS + TUNING.FINALE_TILE_FLY_MS * 0.5;
    order.forEach((fragment, i) => {
      const tile = tiles[fragment - 1];
      if (tile === undefined) return;
      const target = tile.getData('target') as { x: number; y: number };
      this.time.delayedCall(1500 + i * stagger, () => {
        tile.clearTint();
        this.tweens.add({
          targets: tile,
          x: target.x,
          y: target.y,
          angle: 0,
          alpha: 1,
          scale,
          duration: TUNING.FINALE_TILE_FLY_MS,
          ease: 'Back.easeOut',
          onComplete: () => {
            this.sparks.explode(6, target.x, target.y);
          },
        });
      });
    });

    const landedAt = 1500 + (order.length - 1) * stagger + TUNING.FINALE_TILE_FLY_MS;
    this.time.delayedCall(landedAt + 300, () => {
      // Złoty rozbłysk i rama, która zostaje.
      const flash = this.add
        .rectangle(cx, cy, gridW + 80, gridH + 80, col('gold'), 1)
        .setDepth(42)
        .setAlpha(0);
      this.tweens.add({
        targets: flash,
        alpha: { from: 0.85, to: 0 },
        scaleX: 1.6,
        scaleY: 1.6,
        duration: TUNING.FINALE_FLASH_MS,
        ease: 'Quad.easeOut',
        onComplete: () => {
          flash.destroy();
        },
      });
      const frame = this.add.graphics().setDepth(43).setAlpha(0);
      frame.lineStyle(10, col('ground'), 1);
      frame.strokeRect(cx - gridW / 2 - 14, cy - gridH / 2 - 14, gridW + 28, gridH + 28);
      frame.lineStyle(4, col('gold'), 1);
      frame.strokeRect(cx - gridW / 2 - 16, cy - gridH / 2 - 16, gridW + 32, gridH + 32);
      frame.strokeRect(cx - gridW / 2 - 4, cy - gridH / 2 - 4, gridW + 8, gridH + 8);
      this.tweens.add({ targets: frame, alpha: 1, duration: 500 });
      this.sparks.explode(40, cx, cy - gridH / 2);
      this.sparks.explode(40, cx, cy + gridH / 2);
      document.body.dataset.finale = 'assembled';
      bus.emit('finale:assembled');
    });
  }

  private onBeatResolved(beat: Beat, outcome: BeatOutcome): void {
    this.zoneMarker.setVisible(false);
    if (!outcome.correct) {
      this.player.stumble();
      this.timeDilation.setTarget(0, 500, 'Quad.easeOut');
      this.spawner.dismissAll(220);
      this.hud.refreshCounters();
      return;
    }
    this.timeDilation.exit();
    const obstacle = this.spawner.nearestAhead();
    this.spawner.clearActive();
    if (beat.type === 'choice' || beat.type === 'action') {
      this.player.jump();
      if (obstacle !== undefined) {
        // Przeszkoda „podjeżdża” pod skaczącą postać, potem płynie dalej z prędkością świata.
        const info = this.spawner.info(obstacle);
        this.tweens.add({
          targets: obstacle,
          x: TUNING.PLAYER_X - 30,
          duration: 420,
          ease: 'Quad.easeIn',
          onComplete: () => {
            if (info !== undefined) info.motion = 'flow';
          },
        });
      }
    }
    if (outcome.fragment !== undefined) {
      const fromX = obstacle?.x ?? this.player.sprite.x;
      const fromY =
        obstacle !== undefined ? obstacle.y - obstacle.height / 2 : this.player.sprite.y - 60;
      this.time.delayedCall(obstacle !== undefined ? 380 : 100, () => {
        this.flyFragment(fromX, fromY);
      });
    }
  }

  /** Miniatura fragmentu odrywa się od przeszkody i leci do licznika w HUD (GDD sekcja f). */
  private flyFragment(fromX: number, fromY: number): void {
    this.sparks.explode(14, fromX, fromY);
    const icon = this.add.image(fromX, fromY, textureKey('fx.fragment')).setDepth(30).setScale(0.6);
    const anchor = this.hud.fragmentsAnchor;
    this.tweens.chain({
      targets: icon,
      tweens: [
        { scale: 1.1, y: fromY - 40, duration: 160, ease: 'Quad.easeOut' },
        {
          x: anchor.x,
          y: anchor.y,
          scale: 0.3,
          duration: TUNING.FRAGMENT_FLY_MS,
          ease: 'Cubic.easeIn',
          onComplete: () => {
            icon.destroy();
            this.hud.pulseFragments(this);
          },
        },
      ],
    });
  }

  private updateSpotlight(time: number): void {
    const phase = this.script?.runner.phase;
    const target =
      phase === 'choice' || phase === 'action' ? this.spawner.nearestAhead() : undefined;
    if (target === undefined) {
      this.spotlight.setVisible(false);
      return;
    }
    const pulse = 1 + Math.sin(time / 180) * 0.08;
    this.spotlight
      .setVisible(true)
      .setPosition(target.x, this.groundY - 2)
      .setScale(pulse, 1)
      .setAlpha(0.18 + Math.sin(time / 180) * 0.06);
  }

  override update(time: number, frameDelta: number): void {
    // Czas rzeczywisty klatki z limitem (patrz TUNING.MAX_FRAME_MS).
    const delta = Math.min(this.game.loop.rawDelta || frameDelta, TUNING.MAX_FRAME_MS);
    if (this.script !== undefined && this.started) {
      const runner = this.script.runner;
      if (runner.phase === 'narration') {
        const direction = this.moveDirection;
        const target =
          direction > 0
            ? TUNING.NARRATION_SPEED_MULT
            : direction < 0
              ? -TUNING.REWIND_SPEED_MULT
              : 0;
        this.timeDilation.track(target, delta, TUNING.MOVE_RESPONSE_MS);
        runner.moveBy((worldSpeed(this.state) * delta) / 1000);
      }
      runner.tick(delta);
    }
    const speed = worldSpeed(this.state);
    this.state.elapsedMs += delta;
    this.parallax.update(delta, speed);
    this.spawner.update(time, delta, speed, this.freeRun);
    this.player.setTimeScale(this.state.timeScale);
    this.player.update(time);
    this.updateSpotlight(time);
    this.hud.update(time, this.game.loop.actualFps, speed);
  }
}
