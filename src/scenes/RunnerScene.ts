import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig';
import { TUNING } from '../config/tuning';
import { bus } from '../events/bus';
import { Hud } from '../runner/Hud';
import { ObstacleSpawner } from '../runner/Obstacles';
import { Parallax } from '../runner/Parallax';
import { Player } from '../runner/Player';
import { TimeDilation } from '../runner/TimeDilation';
import { createGameState, worldSpeed, type GameState } from '../state/GameState';

export interface RunnerSceneData {
  /** HUD debug widoczny od startu (?debug=1). */
  debug?: boolean;
}

/**
 * Scena biegu (Etap 1): paralaksa, postać, przeszkody proceduralne, kolizje, HUD.
 * Od Etapu 2 przeszkody i tempo będą sterowane skryptem beatów.
 */
export class RunnerScene extends Phaser.Scene {
  private state!: GameState;
  private parallax!: Parallax;
  private player!: Player;
  private spawner!: ObstacleSpawner;
  private timeDilation!: TimeDilation;
  private hud!: Hud;
  private lastInputAt = 0;
  private lastStumbleAt = -Infinity;
  private freeRun = true;
  private readonly groundY = Math.round(GAME_HEIGHT * TUNING.GROUND_RATIO);

  constructor() {
    super('RunnerScene');
  }

  create(data: RunnerSceneData): void {
    this.state = createGameState(TUNING.BASE_SPEED);
    this.physics.world.setBounds(0, -400, GAME_WIDTH, this.groundY + 400);
    this.physics.world.gravity.y = TUNING.GRAVITY_Y;

    this.parallax = new Parallax(this, GAME_WIDTH, GAME_HEIGHT, this.groundY);
    this.player = new Player(this, TUNING.PLAYER_X, this.groundY);
    this.spawner = new ObstacleSpawner(this, GAME_WIDTH, this.groundY, TUNING.PLAYER_X);
    this.timeDilation = new TimeDilation(this, this.state);
    this.hud = new Hud(this, GAME_WIDTH, this.state, 6, data.debug === true);

    this.physics.add.overlap(this.player.sprite, this.spawner.group, (_p, obstacle) => {
      this.onObstacleHit(obstacle as Phaser.Physics.Arcade.Image);
    });

    this.setupInput();
    this.spawner.scheduleFree(this.time.now, 1200);
    this.cameras.main.fadeIn(400, 0x26, 0x16, 0x19);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.timeDilation.destroy();
    });
    bus.emit('runner:ready');
  }

  private setupInput(): void {
    const keyboard = this.input.keyboard;
    keyboard?.on('keydown-SPACE', () => {
      this.handleJumpInput();
    });
    keyboard?.on('keydown-UP', () => {
      this.handleJumpInput();
    });
    this.input.on(Phaser.Input.Events.POINTER_DOWN, () => {
      this.handleJumpInput();
    });
  }

  /** Skok z debouncem (GDD sekcja i) — spacja/↑/klik/tap. */
  private handleJumpInput(): void {
    const now = this.time.now;
    if (now - this.lastInputAt < TUNING.INPUT_DEBOUNCE_MS) return;
    this.lastInputAt = now;
    this.player.jump();
  }

  private onObstacleHit(obstacle: Phaser.Physics.Arcade.Image): void {
    const info = this.spawner.info(obstacle);
    if (info === undefined || info.cleared) return;
    const now = this.time.now;
    if (now - this.lastStumbleAt < TUNING.STUMBLE_COOLDOWN_MS) return;
    this.lastStumbleAt = now;
    this.state.stumbles += 1;
    this.player.stumble();
    this.timeDilation.stumble();
    this.spawner.dismiss(obstacle);
    this.hud.refreshCounters();
  }

  override update(time: number, delta: number): void {
    const speed = worldSpeed(this.state);
    this.state.elapsedMs += delta;
    this.parallax.update(delta, speed);
    this.spawner.update(time, delta, speed, this.freeRun);
    this.player.setTimeScale(this.state.timeScale);
    this.player.update(time);
    this.hud.update(time, this.game.loop.actualFps, speed);
  }
}
