/**
 * The demonstration script.
 *
 * These are not cosmetic. The script performs real actions on a real patient
 * through the same path a learner uses, so a beat that fires twice gives a
 * double dose, and a beat whose narration describes something that is not
 * happening is worse than no demonstration at all.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  DEMONSTRATION_HREF, DEMONSTRATION_SCENARIO_ID, DEMONSTRATION_SECONDS, INDUCTION_DEMONSTRATION,
  beatAt, beatsToFire, demonstrationRequested,
} from '@anesthesia/demo/demonstration';
import { SCENARIOS } from '@anesthesia/scenarios';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { replay } from '@anesthesia/debrief/replay';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { LearnerAction } from '@platform/kernel/protocol';

/**
 * Seeds to check the narration against.
 *
 * A viewer's seed comes from their assignment link, not from the script, so a
 * promise that only holds for one lucky seed is not a promise. Everything the
 * narration asserts is checked against all of these.
 */
const SEEDS = [1, 7, 20260819, 987654321];

describe('the guided demonstration', () => {
  it('is authored against a scenario that exists', () => {
    const ids = SCENARIOS.map((scenario) => scenario.metadata.id);
    expect(ids).toContain(DEMONSTRATION_SCENARIO_ID);
  });

  it('runs in order, with no two beats at the same moment', () => {
    const times = INDUCTION_DEMONSTRATION.map((beat) => beat.atSecond);
    expect([...times]).toEqual([...times].sort((a, b) => a - b));
    expect(new Set(times).size).toBe(times.length);
  });

  it('fits in the ninety seconds the interface promises, at five times speed', () => {
    // The Prebrief control says "90-second demonstration". If the script grows
    // past that the control is lying, and this is the test that says so.
    expect(DEMONSTRATION_SECONDS / 5).toBeLessThanOrEqual(90);
  });

  it('has something to say from the very first frame', () => {
    expect(INDUCTION_DEMONSTRATION[0]!.atSecond).toBe(0);
  });

  it('says something specific at every beat', () => {
    for (const beat of INDUCTION_DEMONSTRATION) {
      expect(beat.narration.length, `beat at ${beat.atSecond}s`).toBeGreaterThan(40);
      // No trailing whitespace from the string concatenation the source uses.
      expect(beat.narration).toBe(beat.narration.trim());
      expect(beat.narration).not.toMatch(/\s{2}/);
    }
  });

  it('preoxygenates for at least three minutes before the induction dose', () => {
    // The script teaches that this is the part not to skip, so the script had
    // better not skip it.
    const oxygen = INDUCTION_DEMONSTRATION.find(
      (beat) => beat.action?.type === 'ventilator'
        && (beat.action.payload as { fio2?: number }).fio2 === 1,
    );
    const propofol = INDUCTION_DEMONSTRATION.find(
      (beat) => beat.action?.type === 'bolus'
        && (beat.action.payload as { drugId?: string }).drugId === 'propofol',
    );
    expect(oxygen).toBeDefined();
    expect(propofol).toBeDefined();
    expect(propofol!.atSecond - oxygen!.atSecond).toBeGreaterThanOrEqual(180);
  });

  it('gives the opioid before the hypnotic', () => {
    const remifentanil = INDUCTION_DEMONSTRATION.findIndex(
      (beat) => (beat.action?.payload as { drugId?: string })?.drugId === 'remifentanil',
    );
    const propofol = INDUCTION_DEMONSTRATION.findIndex(
      (beat) => (beat.action?.payload as { drugId?: string })?.drugId === 'propofol',
    );
    expect(remifentanil).toBeGreaterThanOrEqual(0);
    expect(remifentanil).toBeLessThan(propofol);
  });

  it('intubates only after the patient is asleep', () => {
    const propofol = INDUCTION_DEMONSTRATION.find(
      (beat) => (beat.action?.payload as { drugId?: string })?.drugId === 'propofol',
    );
    const laryngoscopy = INDUCTION_DEMONSTRATION.find(
      (beat) => beat.action?.type === 'laryngoscopy',
    );
    expect(laryngoscopy!.atSecond - propofol!.atSecond).toBeGreaterThanOrEqual(60);
  });
});

describe('firing the beats', () => {
  it('fires each action exactly once across the whole run', () => {
    const fired: number[] = [];
    for (let second = 0; second <= DEMONSTRATION_SECONDS + 30; second += 0.5) {
      for (const beat of beatsToFire(second - 0.5, second)) fired.push(beat.atSecond);
    }
    const withActions = INDUCTION_DEMONSTRATION.filter((beat) => beat.action).map((b) => b.atSecond);
    expect(fired.sort((a, b) => a - b)).toEqual(withActions);
  });

  it('fires nothing for a window that has already passed', () => {
    expect(beatsToFire(400, 401)).toHaveLength(0);
  });

  it('does not lose a beat when the clock jumps a whole minute', () => {
    // At five times speed a slow frame advances several seconds at once, and a
    // half-open window is the only reason the induction dose is not skipped.
    const jumped = beatsToFire(0, 400).map((beat) => beat.atSecond);
    const withActions = INDUCTION_DEMONSTRATION.filter((beat) => beat.action).map((b) => b.atSecond);
    expect(jumped).toEqual(withActions);
  });

  it('shows the beat that is current, not the next one', () => {
    // Something to read from the first frame, so the strip is never blank.
    expect(beatAt(0)!.atSecond).toBe(0);
    expect(beatAt(11)!.atSecond).toBe(0);
    expect(beatAt(12)!.atSecond).toBe(12);
    expect(beatAt(10_000)!.atSecond).toBe(DEMONSTRATION_SECONDS);
  });
});

/**
 * The demonstration's claims, checked against the engine.
 *
 * This is the test that matters. The narration makes six specific promises
 * about what a viewer will see, and each one is asserted here by running the
 * script's actions through the real engine. If a model changes and the patient
 * stops behaving the way the narration says, this fails rather than the
 * demonstration quietly starting to lie to the person it was built to convince.
 */
describe.each(SEEDS)('what the narration promises actually happens (seed %i)', (seed) => {
  const actions = INDUCTION_DEMONSTRATION
    .filter((beat) => beat.action !== undefined)
    .map((beat) => ({ ...beat.action!, tick: Math.round(beat.atSecond * TICKS_PER_SECOND) }));

  const history = replay(actions as LearnerAction[], {
    scenario: ROUTINE_INDUCTION,
    seed,
    practiceRegion: 'US',
    ticks: Math.round((DEMONSTRATION_SECONDS + 20) * TICKS_PER_SECOND),
  });

  const at = (second: number) => {
    const sample = history.find((entry) => entry.tick >= second * TICKS_PER_SECOND);
    expect(sample, `no sample at ${second}s`).toBeDefined();
    return sample!;
  };
  const propofolAt = (second: number) =>
    at(second).concentrations.find((entry) => entry.drugId === 'propofol')!;
  /** A named field at a moment. Absent means the engine stopped reporting it. */
  const field = (second: number, name: string): number => {
    const value = at(second).state[name];
    expect(value, `${name} missing at ${second}s`).toBeTypeOf('number');
    return value!;
  };

  it('produces a session long enough for the whole script', () => {
    expect(history.length).toBeGreaterThan(DEMONSTRATION_SECONDS);
  });

  it('"watch the end-tidal oxygen climb" — it climbs', () => {
    expect(field(180, 'endTidalO2Fraction')).toBeGreaterThan(field(10, 'endTidalO2Fraction'));
    // And reaches the threshold the teaching calls adequate preoxygenation.
    expect(field(180, 'endTidalO2Fraction')).toBeGreaterThan(0.85);
  });

  it('"the plasma spikes immediately" — it does', () => {
    expect(propofolAt(194).plasma).toBeLessThan(0.5);
    expect(propofolAt(200).plasma).toBeGreaterThan(2);
  });

  it('"the plasma is falling and the effect site is still climbing" — at the beat that says so', () => {
    // The beat at 215 s is the entire reason this simulator exists, so it is
    // asserted at exactly the second the narration claims it.
    const early = propofolAt(205);
    const late = propofolAt(215);
    expect(late.plasma).toBeLessThan(early.plasma);
    expect(late.effectSite).toBeGreaterThan(early.effectSite);
    // And the effect site is still behind the plasma, which is the lag itself.
    expect(late.effectSite).toBeLessThan(late.plasma);
  });

  it('"the pressure is coming down" — and it follows the effect site, not the plasma', () => {
    const baseline = field(180, 'meanArterialMmHg');
    const after = field(240, 'meanArterialMmHg');
    expect(after).toBeLessThan(baseline);
    // The plasma peaked around 196 s and the pressure nadir comes later, which
    // is the claim: it tracks the second curve.
    expect(propofolAt(240).plasma).toBeLessThan(propofolAt(200).plasma);
  });

  it('"the depth index is heading into the surgical range"', () => {
    expect(field(240, 'depthIndex')).toBeLessThan(60);
    expect(field(240, 'depthIndex')).toBeLessThan(field(180, 'depthIndex'));
  });

  it('"the capnogram has gone flat" — she is apnoeic by the beat that says so', () => {
    expect(field(180, 'respiratoryRateBpm')).toBeGreaterThan(0);
    expect(field(265, 'respiratoryRateBpm')).toBe(0);
  });

  it('"the capnogram is back" — ventilation restores it', () => {
    expect(field(320, 'etco2MmHg')).toBeGreaterThan(20);
  });

  it('she never desaturates, because the preoxygenation was real', () => {
    // If the script's own patient went hypoxic during the demonstration, the
    // demonstration would be teaching the opposite of its own lesson.
    for (const sample of history) {
      expect(sample.state.spo2Percent, `at tick ${sample.tick}`).toBeGreaterThan(90);
    }
  });
});

/**
 * The one link that starts it.
 *
 * The demonstration used to be four clicks from the front door — module index,
 * scenario, briefing, then the control. Three too many for someone deciding in
 * ten seconds whether any of this is worth their time.
 */
describe('the demonstration link', () => {
  it('points at the scenario the script was authored against', () => {
    expect(DEMONSTRATION_HREF).toContain(DEMONSTRATION_SCENARIO_ID);
    expect(DEMONSTRATION_HREF.startsWith('/anesthesia/scenario/')).toBe(true);
  });

  it('asks for the demonstration in the query string', () => {
    const [, search = ''] = DEMONSTRATION_HREF.split('?');
    expect(demonstrationRequested(`?${search}`)).toBe(true);
  });

  it('is not requested by an ordinary visit', () => {
    expect(demonstrationRequested('')).toBe(false);
    expect(demonstrationRequested('?seed=7')).toBe(false);
    expect(demonstrationRequested('?demo=0')).toBe(false);
    expect(demonstrationRequested('?demo=yes')).toBe(false);
    // An assignment link with a label must not accidentally start a demo.
    expect(demonstrationRequested('?label=Week%201&seed=42')).toBe(false);
  });

  it('is the link the front door actually renders', () => {
    // Defined once beside the script, so a rename cannot leave a dead link on
    // the front page.
    const landing = readFileSync(join(process.cwd(), 'src/landing/Landing.tsx'), 'utf8');
    expect(landing).toContain('DEMONSTRATION_HREF');
    expect(landing).toContain('Watch a 90-second demonstration');
    // And it stays a quiet link: the page is allowed exactly one primary action.
    expect((landing.match(/className="button button--primary"/g) ?? []).length).toBe(1);
  });
});

describe('the narration survives the layout reflowing', () => {
  /**
   * "Everything on the right is her baseline" was false on a phone, where the
   * numbers sit above the traces — and a phone is where most of the people this
   * gets shown to will read it. The ring the beat's `focus` puts on the region
   * is true at every width; a compass direction is true at one.
   */
  const DIRECTIONS = /\b(on the (left|right)|above|below|left-hand|right-hand|top of the screen)\b/i;

  it('never tells the viewer to look in a direction', () => {
    for (const beat of INDUCTION_DEMONSTRATION) {
      expect(beat.narration, `beat at ${beat.atSecond}s gives a direction`)
        .not.toMatch(DIRECTIONS);
    }
  });

  it('names the region instead, which reflow cannot invalidate', () => {
    const bar = readFileSync(join(process.cwd(), 'src/modules/anesthesia/ui/DemonstrationBar.tsx'), 'utf8');
    const labels = bar.slice(bar.indexOf('const FOCUS_LABEL'), bar.indexOf('export function'));
    expect(labels).not.toMatch(DIRECTIONS);
    expect(labels).toContain("monitor: 'the monitor'");
  });

  it('still points somewhere for all but the closing beat', () => {
    const pointed = INDUCTION_DEMONSTRATION.filter((beat) => beat.focus !== 'none');
    expect(pointed.length).toBe(INDUCTION_DEMONSTRATION.length - 1);
  });
});
