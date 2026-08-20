/**
 * The ninety seconds that have to land.
 *
 * Someone shown this for the first time meets a cockpit where nothing happens
 * until they already know what to give. The thing this simulator does that a
 * textbook cannot — showing a drug arriving somewhere it has not acted yet, and
 * the pressure following the second curve rather than the first — is invisible
 * unless you know where to look.
 *
 * So the demonstration performs one induction and narrates it, pointing at what
 * is on screen AT THAT MOMENT. It is not a video: it is the real engine, the
 * real models and the real traces, driven by a script, and the viewer can take
 * the controls at any point and carry on from exactly where it got to.
 *
 * Every beat is authored against the routine induction and its seed, so what the
 * narration promises is what the viewer actually sees.
 */

import type { LearnerAction } from '@platform/kernel/protocol';

/**
 * The scenario the script was authored against. The beats name concentrations,
 * pressures and timings that belong to this patient and this seed, so offering
 * the demonstration anywhere else would narrate a session that is not happening.
 */
export const DEMONSTRATION_SCENARIO_ID = 'routine-induction';

export interface DemonstrationBeat {
  /** Simulated seconds from the start of the scenario. */
  readonly atSecond: number;
  /** What to say while this is happening. One or two sentences, present tense. */
  readonly narration: string;
  /** Where to look. Matches a region so the interface can draw attention there. */
  readonly focus: 'monitor' | 'analysis' | 'actions' | 'none';
  /** The action to perform at this beat, if any. */
  readonly action?: Omit<LearnerAction, 'tick'>;
}

/**
 * The script. Timings are in SIMULATED seconds; at five times speed the whole
 * thing runs in about a minute and a half of real time.
 */
export const INDUCTION_DEMONSTRATION: readonly DemonstrationBeat[] = [
  // Second zero, not second two. The strip has to be saying something the
  // instant the button is pressed: a demonstration that opens with an empty bar
  // reads as one that has failed to start.
  {
    atSecond: 0,
    narration: 'A healthy 42-year-old, breathing room air, nothing given yet. Everything on '
      + 'the right is her baseline.',
    focus: 'monitor',
  },
  {
    atSecond: 12,
    narration: 'Oxygen to 100%. Watch the end-tidal oxygen climb — that is her lungs filling '
      + 'with the reserve she will live on once she stops breathing.',
    focus: 'monitor',
    action: { type: 'ventilator', payload: { fio2: 1 } },
  },
  {
    atSecond: 120,
    narration: 'Nearly three minutes of that. This is the part everyone is tempted to skip, and '
      + 'it is the difference between eight minutes of apnoea and one.',
    focus: 'monitor',
  },
  {
    atSecond: 190,
    narration: 'Remifentanil first, then propofol. Now watch the plot on the left.',
    focus: 'analysis',
    action: { type: 'bolus', payload: { drugId: 'remifentanil', amount: 50, unit: 'µg' } },
  },
  {
    atSecond: 195,
    narration: 'Propofol, 2 mg/kg. The solid line is the plasma concentration and it spikes '
      + 'immediately. The dashed line is the effect site — where the drug actually works.',
    focus: 'analysis',
    action: { type: 'bolus', payload: { drugId: 'propofol', amount: 2, unit: 'mg/kg' } },
  },
  {
    atSecond: 215,
    narration: 'The plasma is already falling and the effect site is still climbing. She is '
      + 'getting deeper while the concentration in her blood drops. That gap is why a second '
      + 'dose given now is a dose you will regret.',
    focus: 'analysis',
  },
  {
    atSecond: 240,
    narration: 'The pressure is coming down, following the effect site rather than the plasma. '
      + 'The depth index is heading into the surgical range.',
    focus: 'monitor',
  },
  {
    atSecond: 265,
    narration: 'The capnogram has gone flat. She has stopped breathing — expected, not a '
      + 'complication, and the reason the last three minutes mattered.',
    focus: 'monitor',
  },
  {
    atSecond: 290,
    narration: 'Laryngoscopy. The view and the number of attempts are drawn from a distribution '
      + 'anchored to reported incidence, so this is not scripted to succeed.',
    focus: 'actions',
    action: { type: 'laryngoscopy', payload: { technique: 'video' } },
  },
  {
    atSecond: 300,
    narration: 'Ventilating. The capnogram is back, and that returning trace is how you know the '
      + 'tube is where you think it is.',
    focus: 'monitor',
    action: { type: 'ventilator', payload: { delivering: true, mode: 'volume-control' } },
  },
  {
    atSecond: 330,
    narration: 'That is the whole idea. Every number came from a published model, and the '
      + 'debrief at the end works out what happened by re-running this, not by scoring it. '
      + 'Take the controls and try it yourself.',
    focus: 'none',
  },
];

/** The last beat's time, so the interface knows when the demonstration is over. */
export const DEMONSTRATION_SECONDS =
  INDUCTION_DEMONSTRATION[INDUCTION_DEMONSTRATION.length - 1]!.atSecond;

/** The beat a viewer should be reading at a given simulated second. */
export function beatAt(second: number): DemonstrationBeat | null {
  let current: DemonstrationBeat | null = null;
  for (const beat of INDUCTION_DEMONSTRATION) {
    if (beat.atSecond <= second) current = beat;
  }
  return current;
}

/** Beats whose action falls in `(from, to]`, so none is fired twice or missed. */
export function beatsToFire(from: number, to: number): DemonstrationBeat[] {
  return INDUCTION_DEMONSTRATION.filter(
    (beat) => beat.action !== undefined && beat.atSecond > from && beat.atSecond <= to,
  );
}
