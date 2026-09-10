import Phaser from 'phaser';
import { textureKey } from '../assets/manifest';
import { obstacleDef } from '../content/obstacles';
import { TUNING } from '../config/tuning';

/**
 * Sposób ruchu przeszkody:
 * - flow: płynie z prędkością świata (tryb wolnego biegu),
 * - timed: pozycja wynika z postępu zegara beatu (dociera do postaci dokładnie po `totalMs`).
 */
export type ObstacleMotion = 'flow' | 'timed';

export interface ObstacleData {
  motion: ObstacleMotion;
  /** Przeszkoda już „zaliczona” (poprawny wybór) — kolizja ignorowana. */
  cleared: boolean;
  /** Dla timed: pozycja startowa i docelowa (X środka). */
  fromX: number;
  toX: number;
  /** Etykieta z treści (klucz przeszkody). */
  key: string;
}

export interface SpawnForBeatOptions {
  obstacleKey: string;
  arriveInMs: number;
  /** Prędkość świata w px/s, przy której przeszkoda płynie (z uwzględnieniem dilation). */
  worldSpeedPxPerSec: number;
}

/**
 * ObstacleSpawner — pula obiektów (Phaser Group), zero alokacji w update().
 */
export class ObstacleSpawner {
  readonly group: Phaser.Physics.Arcade.Group;
  private readonly data = new WeakMap<Phaser.Physics.Arcade.Image, ObstacleData>();
  private nextFreeSpawnAt = 0;
  private readonly rnd: Phaser.Math.RandomDataGenerator;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly width: number,
    private readonly groundY: number,
    private readonly playerX: number,
  ) {
    this.group = scene.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      maxSize: 16,
      allowGravity: false,
      immovable: true,
      runChildUpdate: false,
    });
    this.rnd = new Phaser.Math.RandomDataGenerator(['runner']);
  }

  private acquire(obstacleKey: string, x: number): Phaser.Physics.Arcade.Image | undefined {
    const def = obstacleDef(obstacleKey);
    const image = this.group.get(
      x,
      this.groundY,
      textureKey(def.texture),
    ) as Phaser.Physics.Arcade.Image | null;
    if (image === null) return undefined;
    image
      .setTexture(textureKey(def.texture))
      .setOrigin(0.5, 1)
      .setPosition(x, this.groundY)
      .setDepth(8)
      .setAlpha(1)
      .setActive(true)
      .setVisible(true);
    const body = image.body as Phaser.Physics.Arcade.Body | null;
    if (body !== null) {
      body.enable = true;
      body.setSize(def.bodyWidth, def.bodyHeight, false);
      body.setOffset((def.width - def.bodyWidth) / 2, def.height - def.bodyHeight);
      body.reset(x, this.groundY);
    }
    return image;
  }

  /** Tryb wolnego biegu: losowa przeszkoda wjeżdża z prawej i płynie z prędkością świata. */
  spawnFree(obstacleKey: string): void {
    const image = this.acquire(obstacleKey, this.width + 80);
    if (image === undefined) return;
    this.data.set(image, {
      motion: 'flow',
      cleared: false,
      fromX: this.width + 80,
      toX: this.playerX,
      key: obstacleKey,
    });
  }

  /**
   * Przeszkoda powiązana z beatem: startuje tak daleko, by dotrzeć do postaci po `arriveInMs`
   * (docs/01_GDD_RUNNER_POC.md sekcja e). Ruch sterowany postępem zegara beatu (setProgress),
   * więc moment „zderzenia” zawsze pokrywa się z upływem czasu — niezależnie od easingu dilation.
   */
  spawnForBeat(options: SpawnForBeatOptions): Phaser.Physics.Arcade.Image | undefined {
    const distance = (options.worldSpeedPxPerSec * options.arriveInMs) / 1000;
    const fromX = Math.max(this.playerX + distance, this.playerX + 160);
    const image = this.acquire(options.obstacleKey, fromX);
    if (image === undefined) return undefined;
    this.data.set(image, {
      motion: 'timed',
      cleared: false,
      fromX,
      toX: this.playerX,
      key: options.obstacleKey,
    });
    return image;
  }

  /** Ustawia pozycję przeszkód „timed” wg postępu beatu 0..1 (1 = przy postaci). */
  setProgress(progress: number): void {
    const t = Phaser.Math.Clamp(progress, 0, 1.4);
    this.group.children.each((child) => {
      const image = child as Phaser.Physics.Arcade.Image;
      const info = this.data.get(image);
      if (image.active && info?.motion === 'timed') {
        image.x = info.fromX + (info.toX - info.fromX) * t;
      }
      return true;
    });
  }

  /** Oznacza aktywne przeszkody jako zaliczone (kolizja nie liczy się). */
  clearActive(): void {
    this.group.children.each((child) => {
      const image = child as Phaser.Physics.Arcade.Image;
      const info = this.data.get(image);
      if (image.active && info !== undefined) info.cleared = true;
      return true;
    });
  }

  /** Najbliższa aktywna przeszkoda przed postacią (do auto-skoku i lotu fragmentu). */
  nearestAhead(): Phaser.Physics.Arcade.Image | undefined {
    let best: Phaser.Physics.Arcade.Image | undefined;
    this.group.children.each((child) => {
      const image = child as Phaser.Physics.Arcade.Image;
      if (
        image.active &&
        image.x >= this.playerX - 20 &&
        (best === undefined || image.x < best.x)
      ) {
        best = image;
      }
      return true;
    });
    return best;
  }

  info(image: Phaser.Physics.Arcade.Image): ObstacleData | undefined {
    return this.data.get(image);
  }

  /** Przeszkoda znika (fade 200 ms) — np. po potknięciu, żeby nie zderzyć się drugi raz. */
  dismiss(image: Phaser.Physics.Arcade.Image, fadeMs = 200): void {
    const body = image.body as Phaser.Physics.Arcade.Body | null;
    if (body !== null) body.enable = false;
    this.scene.tweens.add({
      targets: image,
      alpha: 0,
      y: this.groundY + 10,
      duration: fadeMs,
      onComplete: () => {
        this.release(image);
      },
    });
  }

  dismissAll(fadeMs = 200): void {
    this.group.children.each((child) => {
      const image = child as Phaser.Physics.Arcade.Image;
      if (image.active) this.dismiss(image, fadeMs);
      return true;
    });
  }

  private release(image: Phaser.Physics.Arcade.Image): void {
    this.scene.tweens.killTweensOf(image);
    image.setActive(false).setVisible(false).setAlpha(1);
    const body = image.body as Phaser.Physics.Arcade.Body | null;
    if (body !== null) body.enable = false;
    this.group.killAndHide(image);
  }

  /** Aktualizacja: przeszkody „flow” płyną; te za lewą krawędzią wracają do puli. */
  update(now: number, deltaMs: number, worldSpeedPxPerSec: number, freeRun: boolean): void {
    const dx = (worldSpeedPxPerSec * deltaMs) / 1000;
    this.group.children.each((child) => {
      const image = child as Phaser.Physics.Arcade.Image;
      if (!image.active) return true;
      const info = this.data.get(image);
      if (info?.motion === 'flow') image.x -= dx;
      if (image.x < -image.width) this.release(image);
      return true;
    });

    if (freeRun && now >= this.nextFreeSpawnAt) {
      this.spawnFree(this.rnd.pick(['barierka', 'skrzynia', 'kolumna', 'telefony']));
      this.nextFreeSpawnAt =
        now + this.rnd.between(TUNING.FREE_RUN_SPAWN_MIN_MS, TUNING.FREE_RUN_SPAWN_MAX_MS);
    }
  }

  /** Start odliczania do pierwszej przeszkody w trybie wolnym. */
  scheduleFree(now: number, delayMs: number): void {
    this.nextFreeSpawnAt = now + delayMs;
  }
}
