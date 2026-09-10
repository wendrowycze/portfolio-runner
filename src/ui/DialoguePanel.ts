import { TUNING } from '../config/tuning';
import { bus } from '../events/bus';
import type { UiStrings } from '../content/uiStrings';
import { format } from '../content/uiStrings';
import type { BeatOutcome, NarrationProgress, ScriptRunner } from '../script/ScriptRunner';
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
import { choiceTimerMs } from '../script/timing';
import type { GameState } from '../state/GameState';
import { canEnter, isValidEmail, litTorches, TORCHES_TOTAL, type Visitor } from '../state/Visitor';
import { FLOORS } from '../config/hotel';
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
  /** Etykieta przycisku powrotu w finale („Wróć do hotelu”). */
  returnLabel: string;
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
  /** Akapity narracji bieżącego odcinka drogi (id beatu → element). */
  private readonly narrationParagraphs = new Map<string, HTMLElement>();
  private runProgress: HTMLElement | undefined;
  private readonly heldKeys = new Set<string>();
  private readonly reducedMotion = prefersReducedMotion();
  private readonly onKeyDown = (event: KeyboardEvent): void => {
    this.handleKey(event);
  };
  private readonly onKeyUp = (event: KeyboardEvent): void => {
    if (this.heldKeys.delete(event.code)) this.emitDirection();
  };
  private readonly onBlur = (): void => {
    if (this.heldKeys.size === 0) return;
    this.heldKeys.clear();
    this.emitDirection();
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

    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
    this.unsubscribe.push(
      bus.on('finale:assembled', () => {
        this.revealFinale();
      }),
      bus.on('hub:focus', (caseId) => {
        this.setHubFocus(caseId);
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
   * Ekran startowy: formularz imię + mail + dźwignia RODO. Każde wypełnione pole zapala
   * pochodnię na fasadzie (`start:progress`); „Wejdź” aktywne, gdy płoną wszystkie
   * (albo gość wchodzi bez danych). Dane zostają w pamięci (Visitor), nic nie jest wysyłane.
   */
  showStart(visitor: Visitor): void {
    this.kejs = undefined;
    clear(this.header);
    clear(this.story);
    clear(this.footer);
    this.fragmentSlots.length = 0;
    this.narrationParagraphs.clear();
    this.root.dataset.phase = 'start';
    delete this.root.dataset.beat;

    const torches = el('p', { className: 'case-role', attrs: { 'data-testid': 'start-torches' } });
    this.header.append(
      torches,
      el('h1', {
        className: 'case-title',
        attrs: { id: 'panel-title' },
        text: this.strings.startTitle,
      }),
    );
    const lead = this.appendEntry('entry-narration entry-lead');
    lead.append(
      el('p', { className: 'narration-text', text: this.strings.startLead }),
      el('p', { className: 'hint hint-touch', text: this.strings.startTouchHint }),
    );

    const form = el('form', {
      className: 'start-form',
      attrs: { id: 'start-form', 'data-testid': 'start-form', novalidate: '' },
    });
    const name = el('input', {
      className: 'field-input',
      attrs: {
        id: 'start-name',
        type: 'text',
        autocomplete: 'given-name',
        placeholder: this.strings.startNamePlaceholder,
        maxlength: '40',
        'data-testid': 'start-name',
      },
    });
    const email = el('input', {
      className: 'field-input',
      attrs: {
        id: 'start-email',
        type: 'email',
        autocomplete: 'email',
        placeholder: this.strings.startEmailPlaceholder,
        'data-testid': 'start-email',
      },
    });
    const consent = el('input', {
      className: 'lever-input',
      attrs: { id: 'start-consent', type: 'checkbox', 'data-testid': 'start-consent' },
    });
    const enter = el('button', {
      className: 'button button-primary button-enter',
      text: this.strings.startEnter,
      // Przycisk stoi w stopce panelu (poza formularzem) — atrybut form spina go z formularzem.
      attrs: { type: 'submit', form: 'start-form', 'data-testid': 'start-enter', disabled: '' },
    });
    const guest = el('button', {
      className: 'button button-link',
      text: this.strings.startGuest,
      attrs: { type: 'button', 'data-testid': 'start-guest' },
    });
    const field = (id: string, label: string, input: HTMLElement, hint?: string): HTMLElement =>
      el('div', {
        className: 'field',
        children: [
          el('label', { className: 'field-label', attrs: { for: id }, text: label }),
          input,
          ...(hint === undefined ? [] : [el('p', { className: 'hint', text: hint })]),
        ],
      });
    const lever = el('div', {
      className: 'field field-lever',
      children: [
        el('label', {
          className: 'lever',
          attrs: { for: 'start-consent' },
          children: [
            consent,
            el('span', {
              className: 'lever-track',
              children: [el('span', { className: 'lever-knob' })],
            }),
            el('span', { className: 'lever-text', text: this.strings.startConsent }),
          ],
        }),
        el('p', { className: 'hint', text: this.strings.startConsentHint }),
      ],
    });
    form.append(
      field('start-name', this.strings.startName, name),
      field('start-email', this.strings.startEmail, email, this.strings.startEmailHint),
      lever,
    );
    const entry = this.appendEntry('entry-start');
    entry.append(form);

    let lastLit = -1;
    const refresh = (): void => {
      visitor.name = name.value;
      visitor.email = email.value;
      visitor.consent = consent.checked;
      const lit = litTorches(visitor);
      torches.textContent = format(this.strings.startTorches, { lit, total: TORCHES_TOTAL });
      email.classList.toggle('is-invalid', email.value.length > 0 && !isValidEmail(email.value));
      enter.disabled = !canEnter(visitor);
      if (lit !== lastLit) {
        lastLit = lit;
        bus.emit('start:progress', lit, TORCHES_TOTAL);
      }
    };
    for (const input of [name, email]) {
      input.addEventListener('input', () => {
        bus.emit('sfx', 'ui.type');
        refresh();
      });
    }
    consent.addEventListener('change', () => {
      bus.emit('sfx', 'ui.tick');
      refresh();
    });
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      refresh();
      if (!canEnter(visitor)) return;
      this.lockStart(form, enter, guest);
      bus.emit('sfx', 'ui.confirm');
      bus.emit('start:enter');
    });
    guest.addEventListener('click', (event) => {
      event.stopPropagation();
      visitor.guest = true;
      this.lockStart(form, enter, guest);
      bus.emit('sfx', 'ui.confirm');
      bus.emit('start:enter');
    });
    this.footer.append(enter, guest, this.audioToggle());
    refresh();
    name.focus({ preventScroll: true });
  }

  private lockStart(
    form: HTMLFormElement,
    enter: HTMLButtonElement,
    guest: HTMLButtonElement,
  ): void {
    for (const input of form.querySelectorAll('input')) input.disabled = true;
    enter.disabled = true;
    guest.disabled = true;
    this.root.dataset.phase = 'entering';
  }

  /**
   * Widok hotelu: powitanie, opis sterowania, przyciski pięter (winda) i lista historii
   * pogrupowana piętrami. Wejście = `hub:enter`, piętro = `hotel:go`.
   */
  showHotel(cases: Case[], completed: ReadonlySet<string>, visitor: Visitor, floor: number): void {
    this.kejs = undefined;
    clear(this.header);
    clear(this.story);
    clear(this.footer);
    this.fragmentSlots.length = 0;
    this.narrationParagraphs.clear();
    this.root.dataset.phase = 'hub';
    delete this.root.dataset.beat;

    this.header.append(
      el('p', {
        className: 'case-role',
        text: format(this.strings.hubProgress, { done: completed.size, total: cases.length }),
      }),
      el('h1', {
        className: 'case-title',
        attrs: { id: 'panel-title' },
        text: this.strings.hotelTitle,
      }),
    );
    const lead = this.appendEntry('entry-narration entry-lead');
    const greeting =
      visitor.name.trim().length > 0
        ? `${format(this.strings.hotelWelcome, { name: visitor.name.trim() })} `
        : '';
    lead.append(
      el('p', { className: 'narration-text', text: `${greeting}${this.strings.hotelLead}` }),
      el('p', { className: 'hint', text: this.strings.hotelControls }),
      el('p', { className: 'hint hint-touch', text: this.strings.hotelControlsTouch }),
    );

    // Winda: przyciski pięter (od góry).
    const floorsBox = el('div', {
      className: 'floors',
      attrs: { role: 'group', 'aria-label': this.strings.hotelElevator, 'data-testid': 'floors' },
    });
    const floorButtons: HTMLButtonElement[] = [];
    for (const def of [...FLOORS].reverse()) {
      const world = this.worldLabel(def.world);
      const label =
        def.index === 0
          ? this.strings.hotelFloorGround
          : format(this.strings.hotelFloorN, { n: def.index });
      const button = el('button', {
        className: 'floor-button',
        attrs: { type: 'button', 'data-testid': 'floor', 'data-floor': String(def.index) },
        children: [
          el('span', { className: 'floor-name', text: label }),
          el('span', { className: 'floor-world', text: world }),
        ],
      });
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        bus.emit('sfx', 'ui.tick');
        bus.emit('hotel:go', def.index);
      });
      floorButtons.push(button);
      floorsBox.append(button);
    }
    const setFloor = (index: number): void => {
      for (const button of floorButtons) {
        const here = button.dataset.floor === String(index);
        button.classList.toggle('is-here', here);
        button.setAttribute('aria-current', here ? 'true' : 'false');
      }
    };
    setFloor(floor);
    const elevatorEntry = this.appendEntry('entry-elevator');
    elevatorEntry.append(
      el('p', { className: 'hint', text: this.strings.hotelElevator }),
      floorsBox,
    );

    // Lista historii pogrupowana piętrami.
    const list = el('ol', { className: 'gallery', attrs: { 'data-testid': 'gallery' } });
    for (const def of [...FLOORS].reverse()) {
      const onFloor = cases.filter((c) => c.world === def.world);
      if (onFloor.length === 0) continue;
      const floorName =
        def.index === 0
          ? this.strings.hotelFloorGround
          : format(this.strings.hotelFloorN, { n: def.index });
      list.append(
        el('li', {
          className: 'gallery-floor',
          attrs: { 'data-floor': String(def.index) },
          text: `${floorName} · ${this.worldLabel(def.world)}`,
        }),
      );
      for (const kejs of onFloor) {
        const restored = completed.has(kejs.id);
        const button = el('button', {
          className: 'button gallery-enter',
          text: restored ? this.strings.playAgain : this.strings.hubEnter,
          attrs: { type: 'button', 'data-testid': 'hub-enter', 'data-case': kejs.id },
        });
        button.addEventListener('click', (event) => {
          event.stopPropagation();
          bus.emit('hub:enter', kejs.id);
        });
        const meta = el('p', {
          className: 'gallery-meta',
          children: [
            el('span', { className: 'gallery-world', text: this.worldLabel(kejs.world) }),
            el('span', {
              className: 'gallery-status',
              text: restored ? this.strings.hubRestored : this.strings.hubDamaged,
            }),
          ],
        });
        if (kejs.draft === true)
          meta.append(el('span', { className: 'gallery-draft', text: this.strings.hotelDraft }));
        list.append(
          el('li', {
            className: `gallery-item${restored ? ' is-restored' : ''}`,
            attrs: { 'data-case': kejs.id },
            children: [
              meta,
              el('h2', { className: 'gallery-title', text: kejs.title }),
              el('p', { className: 'gallery-role', text: kejs.role }),
              button,
            ],
          }),
        );
      }
    }
    const entry = this.appendEntry('entry-gallery');
    entry.append(list);
    this.footer.append(this.audioToggle());
    this.story.scrollTop = 0;
    this.hotelFloorSetter = setFloor;
  }

  private hotelFloorSetter: ((index: number) => void) | undefined;

  /** Zmiana piętra (winda) — podświetla przycisk i przewija listę do piętra. */
  setHotelFloor(index: number): void {
    this.hotelFloorSetter?.(index);
    const heading = this.story.querySelector<HTMLElement>(
      `.gallery-floor[data-floor="${String(index)}"]`,
    );
    heading?.scrollIntoView({ block: 'start', behavior: this.reducedMotion ? 'auto' : 'smooth' });
  }

  private worldLabel(world: Case['world']): string {
    return world === 'biznes'
      ? this.strings.hubWorldBiznes
      : world === 'edukacja'
        ? this.strings.hubWorldEdukacja
        : this.strings.hubWorldKultura;
  }

  private muted = false;

  /** Przycisk wyciszenia — stan trzyma panel, dźwięk reaguje przez magistralę. */
  private audioToggle(): HTMLElement {
    const button = el('button', {
      className: 'button button-audio',
      attrs: {
        type: 'button',
        'data-testid': 'audio-toggle',
        'aria-pressed': this.muted ? 'true' : 'false',
        title: this.strings.audioToggle,
      },
      text: this.muted ? this.strings.audioOff : this.strings.audioOn,
    });
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      this.setMuted(!this.muted);
    });
    return button;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    for (const button of document.querySelectorAll<HTMLButtonElement>('.button-audio')) {
      button.textContent = muted ? this.strings.audioOff : this.strings.audioOn;
      button.setAttribute('aria-pressed', muted ? 'true' : 'false');
    }
    bus.emit('audio:muted', muted);
  }

  /** Podświetla pozycję listy odpowiadającą obrazowi pod kursorem w scenie hubu. */
  setHubFocus(caseId: string | undefined): void {
    for (const item of this.story.querySelectorAll<HTMLElement>('.gallery-item')) {
      const focused = caseId !== undefined && item.dataset.case === caseId;
      item.classList.toggle('is-focus', focused);
      if (focused) item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  // ----- publiczne API z docs/02_ARCHITEKTURA.md sekcja 3 -----

  /**
   * Beat narracji: pusty akapit, który wypełnia się w miarę biegu (setNarrationProgress).
   * Kolejne narracje tego samego odcinka dopisują się pod spodem; cofanie chowa tekst.
   */
  showNarration(beatId: string): void {
    if (this.runProgress === undefined) {
      this.resetFooter();
      this.narrationParagraphs.clear();
      this.footer.append(
        el('p', { className: 'hint', text: this.strings.runHint }),
        el('p', { className: 'hint hint-touch', text: this.strings.runHintTouch }),
      );
      const bar = el('div', { className: 'run-progress', attrs: { 'aria-hidden': 'true' } });
      this.runProgress = el('div', { className: 'run-progress-fill' });
      bar.append(this.runProgress);
      this.footer.append(bar);
    }
    const entry = this.appendEntry('entry-narration');
    const paragraph = el('p', {
      className: 'narration-text',
      attrs: { 'data-narration': beatId },
    });
    entry.append(paragraph);
    this.narrationParagraphs.set(beatId, paragraph);
  }

  /** Postęp odcinka drogi: tekst = tyle znaków, ile „przebiegnięto”. */
  setNarrationProgress(progress: NarrationProgress[], fraction: number): void {
    const kejs = this.kejs;
    if (kejs === undefined) return;
    let caretOwner: HTMLElement | undefined;
    for (const item of progress) {
      const paragraph = this.narrationParagraphs.get(item.beatId);
      const beat = kejs.beats.find((b) => b.id === item.beatId);
      if (paragraph === undefined || beat?.type !== 'narration') continue;
      const next = beat.text.slice(0, item.revealed);
      if (paragraph.textContent !== next) paragraph.textContent = next;
      paragraph.classList.remove('is-typing');
      if (item.revealed < item.length) caretOwner ??= paragraph;
    }
    caretOwner?.classList.add('is-typing');
    if (this.runProgress !== undefined) {
      this.runProgress.style.width = `${String(fraction * 100)}%`;
    }
    this.scrollToEnd(false);
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
    this.footer.append(
      el('p', { className: 'hint', text: this.strings.choiceHint }),
      list,
      timer,
      el('p', {
        className: 'hint timer-hint',
        text: format(this.strings.choiceTimeHint, { seconds: Math.round(timerMs / 1000) }),
      }),
    );
    this.optionButtons[0]?.focus({ preventScroll: true });
    bus.emit('sfx', 'choice.open');
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

  private pendingFinale: { text: string; cta: Cta } | undefined;

  /** Finał: scena składa fragmenty tła w obraz; panel czeka na `finale:assembled`. */
  showFinale(text: string, cta: Cta): void {
    this.resetFooter();
    this.pendingFinale = { text, cta };
    const entry = this.appendEntry('entry-finale');
    entry.append(el('p', { className: 'hint', text: this.strings.finaleAssembling }));
    this.scrollToEnd(true);
  }

  private revealFinale(): void {
    const pending = this.pendingFinale;
    const kejs = this.kejs;
    if (pending === undefined || kejs === undefined) return;
    this.pendingFinale = undefined;
    const entry = this.appendEntry('entry-finale');
    entry.append(
      el('p', { className: 'finale-badge', text: this.strings.finaleRestored }),
      el('p', { className: 'finale-caption', text: kejs.painting.caption }),
    );
    const textNode = el('p', { className: 'narration-text' });
    entry.append(textNode);
    this.scrollToEnd(true);
    void this.type(textNode, pending.text, () => 1).then(() => {
      const link = el('a', {
        className: 'button button-primary',
        text: pending.cta.label,
        attrs: {
          href: pending.cta.url,
          target: '_blank',
          rel: 'noopener noreferrer',
          'data-testid': 'finale-cta',
        },
      });
      const back = el('button', {
        className: 'button',
        text: this.options.returnLabel,
        attrs: { type: 'button', 'data-testid': 'finale-return' },
      });
      back.addEventListener('click', (event) => {
        event.stopPropagation();
        this.runner.advance();
      });
      clear(this.footer);
      this.footer.append(link, back);
      back.focus({ preventScroll: true });
      this.scrollToEnd(true);
    });
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
      const low = remaining < 0.3;
      if (low && !this.timerFill.classList.contains('is-low')) bus.emit('sfx', 'timer.low');
      this.timerFill.classList.toggle('is-low', low);
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
    document.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
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
      this.runner.on('narration:progress', (progress, fraction) => {
        this.setNarrationProgress(progress, fraction);
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
        this.showNarration(beat.id);
        break;
      case 'choice':
        this.showChoice(beat.prompt, beat.options, choiceTimerMs(beat));
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
    this.runProgress = undefined;
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

  private emitDirection(): void {
    const forward = this.heldKeys.has('KeyD') || this.heldKeys.has('ArrowRight');
    const backward = this.heldKeys.has('KeyA') || this.heldKeys.has('ArrowLeft');
    bus.emit('move:direction', forward && !backward ? 1 : backward && !forward ? -1 : 0);
  }

  private handleKey(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    const inInput = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA';
    if (inInput) return;
    switch (event.code) {
      case 'KeyD':
      case 'ArrowRight':
      case 'KeyA':
      case 'ArrowLeft':
        // Bieg trzymanym klawiszem (D/→ do przodu, A/← cofanie) — stan, nie kliknięcie.
        event.preventDefault();
        if (!this.heldKeys.has(event.code)) {
          this.heldKeys.add(event.code);
          this.emitDirection();
        }
        break;
      case 'KeyM':
        if (event.repeat) return;
        this.setMuted(!this.muted);
        break;
      case 'Space':
      case 'ArrowUp':
        if (event.repeat) return;
        if (this.runner.phase === 'action') {
          event.preventDefault();
          this.runner.triggerAction();
        }
        break;
      case 'Digit1':
      case 'Digit2':
      case 'Digit3':
      case 'Numpad1':
      case 'Numpad2':
      case 'Numpad3': {
        if (event.repeat) return;
        const index = Number(event.code.slice(-1)) - 1;
        if (this.runner.phase === 'choice') this.runner.resolveChoice(index);
        break;
      }
      default:
        break;
    }
  }
}
