import { TUNING } from '../config/tuning';
import { bus } from '../events/bus';
import type { UiStrings } from '../content/uiStrings';
import { format } from '../content/uiStrings';
import type { BeatOutcome, ScriptRunner } from '../script/ScriptRunner';
import type {
  Beat,
  Case,
  ChoiceOption,
  Cta,
  InteractionBeat,
  Kpi,
  StatDelta,
} from '../script/types';
import { totalFragments } from '../script/types';
import type { GameState } from '../state/GameState';
import { clear, el, formatDuration, prefersReducedMotion } from './dom';
import { typewrite, type TypewriterHandle } from './typewriter';
import { createWidget, type Widget } from './widgets/createWidget';

/**
 * DialoguePanel — nakładka DOM (nie canvas). Renderuje beaty jako przewijaną opowieść:
 * nowe wpisy dopisują się na dole, starsze uciekają w górę (decyzja Arka z 2026-09-09:
 * tekst przewija się w rytmie biegu — tempo maszyny do pisania narracji jest sprzężone
 * z mnożnikiem czasu świata z GameState).
 *
 * Nie importuje niczego ze scen Phasera. Wejście gracza trafia do ScriptRunner.
 */
export interface DialoguePanelOptions {
  /** Rodzic pełnoekranowych nakładek widgetów (reveal) — zwykle kontener całej gry. */
  overlayParent: HTMLElement;
}

export class DialoguePanel {
  private readonly header: HTMLElement;
  private readonly story: HTMLElement;
  private readonly footer: HTMLElement;
  private readonly fragmentSlots: HTMLElement[] = [];
  private readonly unsubscribe: (() => void)[] = [];
  private typewriter: TypewriterHandle | undefined;
  private optionButtons: HTMLButtonElement[] = [];
  private timerFill: HTMLElement | undefined;
  private qte: HTMLElement | undefined;
  private qteRing: SVGCircleElement | undefined;
  private widget: Widget | undefined;
  private kejs: Case | undefined;
  private readonly reducedMotion = prefersReducedMotion();
  private readonly onKeyDown = (event: KeyboardEvent): void => {
    this.handleKey(event);
  };

  constructor(
    private readonly root: HTMLElement,
    private readonly runner: ScriptRunner,
    private readonly state: GameState,
    private readonly strings: UiStrings,
    private readonly options: DialoguePanelOptions,
  ) {
    clear(root);
    this.header = el('header', { className: 'panel-header' });
    this.story = el('div', {
      className: 'story',
      attrs: { 'aria-live': 'polite', 'data-testid': 'story' },
    });
    this.footer = el('footer', { className: 'panel-actions', attrs: { 'data-testid': 'actions' } });
    root.append(this.header, this.story, this.footer);
    root.dataset.phase = 'idle';

    this.story.addEventListener('click', () => {
      this.handleStoryTap();
    });
    document.addEventListener('keydown', this.onKeyDown);
    this.unsubscribe.push(
      bus.on('runner:tap', () => {
        this.handleStoryTap();
      }),
    );
    this.bind();
  }

  /** Renderuje nagłówek case'a i czyści opowieść. */
  mount(kejs: Case): void {
    this.kejs = kejs;
    clear(this.header);
    clear(this.story);
    clear(this.footer);
    this.fragmentSlots.length = 0;

    const slots = el('div', {
      className: 'fragments',
      attrs: { role: 'img', 'aria-label': this.strings.fragmentsLabel, 'data-testid': 'fragments' },
    });
    for (let i = 0; i < totalFragments(kejs); i += 1) {
      const slot = el('span', { className: 'fragment-slot' });
      this.fragmentSlots.push(slot);
      slots.append(slot);
    }
    this.header.append(
      el('p', { className: 'case-role', text: kejs.role }),
      el('h1', { className: 'case-title', attrs: { id: 'panel-title' }, text: kejs.title }),
      slots,
    );
    this.refreshFragments();
    this.root.dataset.phase = 'idle';
    delete this.root.dataset.beat;
  }

  /**
   * Widok hubu (przed wejściem w obraz i po ukończeniu): lead case'a + przycisk wejścia.
   * Wejście = zdarzenie `hub:enter` na magistrali (scena hubu robi przejście).
   */
  showHub(kejs: Case, restored: boolean): void {
    this.mount(kejs);
    this.root.dataset.phase = restored ? 'hub-restored' : 'hub';
    const entry = this.appendEntry('entry-narration entry-lead');
    entry.append(el('p', { className: 'narration-text', text: kejs.lead }));
    if (restored) {
      const done = this.appendEntry('entry-feedback is-right');
      done.append(el('p', { text: this.strings.finaleRestored }));
      const again = this.appendEntry('entry-narration');
      again.append(el('p', { className: 'hint', text: this.strings.hubLeadRestored }));
    } else {
      entry.append(el('p', { className: 'hint', text: this.strings.hubHint }));
    }
    this.showContinue(restored ? this.strings.playAgain : this.strings.hubEnter, () => {
      bus.emit('hub:enter');
    });
    this.footer.querySelector('button')?.setAttribute('data-testid', 'hub-enter');
  }

  // ----- publiczne API z docs/02_ARCHITEKTURA.md sekcja 3 -----

  showNarration(text: string, mode: 'tap' | 'auto', durationMs?: number): void {
    this.resetFooter();
    const entry = this.appendEntry('entry-narration');
    const paragraph = el('p', { className: 'narration-text' });
    entry.append(paragraph);
    void this.type(paragraph, text, () => Math.max(0.25, this.state.timeScale)).then(() => {
      if (this.runner.current?.type !== 'narration') return;
      this.runner.textRevealed();
      if (mode === 'auto') {
        this.showAutoProgress(durationMs ?? 0);
      } else {
        this.showContinue(this.strings.continue, () => {
          this.runner.advance();
        });
      }
    });
  }

  showChoice(prompt: string, options: ChoiceOption[], timerMs: number): void {
    this.resetFooter();
    const entry = this.appendEntry('entry-prompt');
    const paragraph = el('p', { className: 'prompt-text' });
    entry.append(paragraph);
    void this.type(paragraph, prompt, () => 2.2);

    const list = el('div', {
      className: 'options',
      attrs: { role: 'group', 'aria-label': prompt },
    });
    this.optionButtons = options.map((option, index) => {
      const button = el('button', {
        className: 'option',
        attrs: { type: 'button', 'data-index': String(index), 'data-testid': 'option' },
        children: [
          el('span', { className: 'option-key', text: String(index + 1) }),
          el('span', { className: 'option-text', text: option.text }),
        ],
      });
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        this.runner.resolveChoice(index);
      });
      list.append(button);
      return button;
    });
    const timer = el('div', {
      className: 'timer',
      attrs: { role: 'progressbar', 'aria-label': `${String(Math.round(timerMs / 1000))} s` },
    });
    this.timerFill = el('div', { className: 'timer-fill' });
    timer.append(this.timerFill);
    this.footer.append(el('p', { className: 'hint', text: this.strings.choiceHint }), list, timer);
    this.optionButtons[0]?.focus({ preventScroll: true });
    this.scrollToEnd(true);
  }

  showAction(prompt: string, windowMs: number): void {
    this.resetFooter();
    const entry = this.appendEntry('entry-prompt entry-action');
    const paragraph = el('p', { className: 'prompt-text' });
    entry.append(paragraph);
    void this.type(paragraph, prompt, () => 2.2);

    const svgNs = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNs, 'svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('class', 'qte-ring');
    const track = document.createElementNS(svgNs, 'circle');
    track.setAttribute('class', 'qte-track');
    track.setAttribute('cx', '50');
    track.setAttribute('cy', '50');
    track.setAttribute('r', '44');
    const ring = document.createElementNS(svgNs, 'circle');
    ring.setAttribute('class', 'qte-progress');
    ring.setAttribute('cx', '50');
    ring.setAttribute('cy', '50');
    ring.setAttribute('r', '44');
    svg.append(track, ring);
    this.qteRing = ring;

    const label = el('span', { className: 'qte-label', text: this.strings.actionWait });
    const button = el('button', {
      className: 'qte',
      attrs: {
        type: 'button',
        'data-testid': 'qte',
        'data-open': 'false',
        'aria-label': this.strings.jumpPrompt,
        title: `${this.strings.jumpPrompt} (${String(windowMs)} ms)`,
      },
      children: [svg, label],
    });
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      this.runner.triggerAction();
    });
    this.qte = button;
    this.footer.append(
      el('div', { className: 'qte-wrap', children: [button] }),
      el('p', { className: 'hint', text: this.strings.jumpHint }),
    );
    this.scrollToEnd(true);
  }

  showWidget(beat: InteractionBeat): void {
    this.resetFooter();
    const entry = this.appendEntry('entry-widget');
    if (beat.text !== undefined) {
      const paragraph = el('p', { className: 'narration-text' });
      entry.append(paragraph);
      void this.type(paragraph, beat.text, () => 1.6);
    }
    const mount = el('div', { className: `widget widget-${beat.widget}` });
    entry.append(mount);
    if (this.kejs === undefined) return;
    this.widget = createWidget(beat, mount, this.footer, this.strings, {
      reducedMotion: this.reducedMotion,
      painting: this.kejs.painting,
      overlayParent: this.options.overlayParent,
      onComplete: () => {
        this.runner.completeInteraction();
      },
      onLayout: () => {
        this.scrollToEnd(false);
      },
    });
    this.scrollToEnd(true);
  }

  showResults(stats: StatDelta[], kpis: Kpi[]): void {
    this.resetFooter();
    const entry = this.appendEntry('entry-results');
    const card = el('section', {
      className: 'results',
      attrs: { 'aria-label': this.strings.resultsTitle, 'data-testid': 'results' },
    });
    card.append(el('h2', { className: 'results-title', text: this.strings.resultsTitle }));

    const skills = el('ul', {
      className: 'skills',
      attrs: { 'aria-label': this.strings.resultsSkills },
    });
    const maxDelta = Math.max(1, ...stats.map((s) => Math.abs(s.delta)));
    stats.forEach((stat, index) => {
      const value = el('span', { className: 'skill-value', text: '+0' });
      const fill = el('span', { className: 'skill-fill' });
      const item = el('li', {
        className: 'skill',
        children: [
          el('span', { className: 'skill-name', text: stat.skill }),
          el('span', { className: 'skill-bar', children: [fill] }),
          value,
        ],
      });
      skills.append(item);
      const target = stat.delta;
      const width = `${String((Math.abs(target) / maxDelta) * 100)}%`;
      window.setTimeout(
        () => {
          fill.style.width = width;
          this.countUp(value, target, TUNING.RESULTS_STAT_FILL_MS);
        },
        120 + index * 140,
      );
    });

    const kpiList = el('dl', {
      className: 'kpis',
      attrs: { 'aria-label': this.strings.resultsKpis },
    });
    for (const kpi of kpis) {
      kpiList.append(el('dt', { text: kpi.label }), el('dd', { text: kpi.value }));
    }
    const meta = el('p', {
      className: 'results-meta',
      children: [
        el('span', { text: `${this.strings.resultsStumbles}: ${String(this.state.stumbles)}` }),
        el('span', {
          text: `${this.strings.resultsTime}: ${formatDuration(this.runner.elapsedMs)}`,
        }),
      ],
    });
    card.append(skills, kpiList, meta);
    entry.append(card);
    this.showContinue(this.strings.resultsSee, () => {
      this.runner.advance();
    });
    this.scrollToEnd(true);
  }

  showFinale(text: string, cta: Cta): void {
    // Finał renderuje FinaleOverlay (pełny ekran); panel pokazuje tylko podsumowanie w opowieści.
    this.resetFooter();
    const entry = this.appendEntry('entry-finale');
    entry.append(el('p', { className: 'narration-text', text: text }));
    const link = el('a', {
      className: 'button button-primary',
      text: cta.label,
      attrs: { href: cta.url, target: '_blank', rel: 'noopener noreferrer' },
    });
    this.footer.append(link);
    this.scrollToEnd(true);
  }

  /** Feedback po rozstrzygnięciu beatu (trafnym i nietrafnym). */
  showFeedback(beat: Beat, outcome: BeatOutcome): void {
    if (outcome.correct) {
      this.optionButtons.forEach((button, index) => {
        button.disabled = true;
        if (index === outcome.optionIndex) button.classList.add('is-right');
      });
      if (this.qte !== undefined) {
        this.qte.dataset.open = 'false';
        this.qte.classList.add('is-hit');
      }
      if (beat.type === 'choice' || beat.type === 'action') {
        const entry = this.appendEntry('entry-feedback is-right');
        entry.append(el('p', { text: this.strings.feedbackRight }));
      }
      return;
    }
    this.optionButtons.forEach((button, index) => {
      button.disabled = true;
      if (index === outcome.optionIndex) button.classList.add('is-wrong');
    });
    if (this.qte !== undefined) {
      this.qte.dataset.open = 'false';
      this.qte.classList.add('is-miss');
    }
    const text =
      outcome.feedback ??
      (outcome.reason === 'early'
        ? this.strings.feedbackEarly
        : outcome.reason === 'late'
          ? this.strings.feedbackLate
          : this.strings.feedbackTimeout);
    const entry = this.appendEntry('entry-feedback is-wrong');
    entry.append(el('p', { text }), el('p', { className: 'hint', text: this.strings.retryIn }));
    this.scrollToEnd(true);
  }

  setTimerProgress(fraction: number): void {
    if (this.timerFill !== undefined) {
      const remaining = 1 - fraction;
      this.timerFill.style.width = `${String(remaining * 100)}%`;
      this.timerFill.classList.toggle('is-low', remaining < 0.3);
    }
    if (this.qteRing !== undefined) {
      const circumference = 2 * Math.PI * 44;
      this.qteRing.style.strokeDashoffset = String(circumference * (1 - fraction));
    }
  }

  setActionWindow(open: boolean): void {
    if (this.qte === undefined) return;
    this.qte.dataset.open = open ? 'true' : 'false';
    const label = this.qte.querySelector('.qte-label');
    if (label !== null) label.textContent = open ? this.strings.actionNow : this.strings.actionWait;
  }

  refreshFragments(): void {
    this.fragmentSlots.forEach((slot, index) => {
      slot.dataset.collected = this.state.fragments.includes(index + 1) ? 'true' : 'false';
    });
  }

  /** Miga slotem świeżo zebranego fragmentu. */
  celebrateFragment(fragment: number, total: number): void {
    this.refreshFragments();
    const slot = this.fragmentSlots[fragment - 1];
    slot?.classList.add('is-new');
    window.setTimeout(() => slot?.classList.remove('is-new'), 900);
    const entry = this.appendEntry('entry-fragment');
    entry.append(el('p', { text: format(this.strings.fragmentCollected, { n: fragment, total }) }));
    this.scrollToEnd(true);
  }

  destroy(): void {
    document.removeEventListener('keydown', this.onKeyDown);
    for (const off of this.unsubscribe) off();
    this.typewriter?.cancel();
    this.widget?.destroy();
  }

  // ----- wewnętrzne -----

  private bind(): void {
    this.unsubscribe.push(
      this.runner.on('beat:start', (beat) => {
        this.root.dataset.phase = beat.type;
        this.root.dataset.beat = beat.id;
        this.renderBeat(beat);
      }),
      this.runner.on('beat:resolved', (beat, outcome) => {
        this.root.dataset.phase = outcome.correct ? 'success' : 'feedback';
        this.showFeedback(beat, outcome);
      }),
      this.runner.on('timer:progress', (fraction) => {
        this.setTimerProgress(fraction);
      }),
      this.runner.on('action:window', (open) => {
        this.setActionWindow(open);
      }),
      this.runner.on('fragment:collected', (fragment, total) => {
        this.celebrateFragment(fragment, total);
      }),
      this.runner.on('case:finished', () => {
        this.root.dataset.phase = 'finished';
      }),
    );
  }

  private renderBeat(beat: Beat): void {
    switch (beat.type) {
      case 'narration':
        this.showNarration(beat.text, beat.advance, beat.durationMs);
        break;
      case 'choice':
        this.showChoice(beat.prompt, beat.options, beat.timerMs);
        break;
      case 'action':
        this.showAction(beat.prompt, beat.windowMs);
        break;
      case 'interaction':
        this.showWidget(beat);
        break;
      case 'results':
        this.showResults(beat.stats, beat.kpis);
        break;
      case 'finale':
        this.showFinale(beat.text, beat.cta);
        break;
    }
  }

  private appendEntry(className: string): HTMLElement {
    for (const previous of this.story.querySelectorAll('.entry.is-current')) {
      previous.classList.remove('is-current');
    }
    const entry = el('article', { className: `entry ${className} is-current` });
    this.story.append(entry);
    this.scrollToEnd(true);
    return entry;
  }

  private type(target: HTMLElement, text: string, rate: () => number): Promise<void> {
    this.typewriter?.cancel();
    const handle = typewrite(target, text, {
      cps: TUNING.TYPEWRITER_CPS,
      rate,
      instant: this.reducedMotion,
      onProgress: () => {
        this.scrollToEnd(false);
      },
    });
    this.typewriter = handle;
    return handle.done;
  }

  private resetFooter(): void {
    clear(this.footer);
    this.optionButtons = [];
    this.timerFill = undefined;
    this.qte = undefined;
    this.qteRing = undefined;
    this.widget?.destroy();
    this.widget = undefined;
  }

  private showContinue(label: string, onClick: () => void): void {
    clear(this.footer);
    const button = el('button', {
      className: 'button button-primary button-continue',
      text: label,
      attrs: { type: 'button', 'data-testid': 'continue' },
    });
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      onClick();
    });
    this.footer.append(button);
    button.focus({ preventScroll: true });
  }

  private showAutoProgress(durationMs: number): void {
    clear(this.footer);
    const bar = el('div', { className: 'auto-progress', attrs: { 'aria-hidden': 'true' } });
    const fill = el('div', { className: 'auto-progress-fill' });
    bar.append(fill);
    this.footer.append(bar);
    requestAnimationFrame(() => {
      fill.style.transitionDuration = `${String(durationMs)}ms`;
      fill.style.width = '0%';
    });
  }

  private countUp(target: HTMLElement, value: number, durationMs: number): void {
    const start = performance.now();
    const sign = value < 0 ? '−' : '+';
    const step = (now: number): void => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      target.textContent = `${sign}${String(Math.round(Math.abs(value) * eased))}`;
      if (t < 1) requestAnimationFrame(step);
    };
    if (this.reducedMotion) {
      target.textContent = `${sign}${String(Math.abs(value))}`;
      return;
    }
    requestAnimationFrame(step);
  }

  private scrollToEnd(smooth: boolean): void {
    const top = this.story.scrollHeight;
    if (smooth && !this.reducedMotion) {
      this.story.scrollTo({ top, behavior: 'smooth' });
    } else {
      this.story.scrollTop = top;
    }
  }

  /** Tap w opowieść: w narracji — dopisz resztę albo idź dalej. */
  private handleStoryTap(): void {
    if (this.runner.phase !== 'narration') return;
    if (this.typewriter !== undefined && !this.typewriter.isDone) {
      this.typewriter.skip();
      return;
    }
    const beat = this.runner.current;
    if (beat?.type === 'narration' && beat.advance === 'tap') this.runner.advance();
  }

  private handleKey(event: KeyboardEvent): void {
    if (event.repeat) return;
    const target = event.target as HTMLElement | null;
    const inInput = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA';
    if (inInput) return;
    switch (event.code) {
      case 'Space':
      case 'ArrowUp':
        if (this.runner.phase === 'action') {
          event.preventDefault();
          this.runner.triggerAction();
        } else if (this.runner.phase === 'narration') {
          event.preventDefault();
          this.handleStoryTap();
        }
        break;
      case 'Enter':
        if (this.runner.phase === 'narration' && target?.tagName !== 'BUTTON') {
          event.preventDefault();
          this.handleStoryTap();
        }
        break;
      case 'Digit1':
      case 'Digit2':
      case 'Digit3':
      case 'Numpad1':
      case 'Numpad2':
      case 'Numpad3': {
        const index = Number(event.code.slice(-1)) - 1;
        if (this.runner.phase === 'choice') this.runner.resolveChoice(index);
        break;
      }
      default:
        break;
    }
  }
}
