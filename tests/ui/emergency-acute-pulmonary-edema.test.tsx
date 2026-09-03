/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { ACUTE_PULMONARY_EDEMA as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/acute-pulmonary-edema';

const base = (over: Record<string, unknown>) => ({
  patternReviewedAtTick: null, nivAtTick: null, diureticIntentAtTick: null,
  vasodilatorIntentAtTick: null, reassessedAtTick: null,
  ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['acutePulmonaryEdemaAssessment']>);

const EMPTY = base({});
const PATTERN = base({ patternReviewedAtTick: 0 });
const SUPPORTED = base({ patternReviewedAtTick: 0, nivAtTick: 1 });
const VASODILATED = base({ patternReviewedAtTick: 0, nivAtTick: 1, vasodilatorIntentAtTick: 2 });
const TREATED = base({ patternReviewedAtTick: 0, nivAtTick: 1, vasodilatorIntentAtTick: 2, diureticIntentAtTick: 3 });
const DONE = base({ patternReviewedAtTick: 0, nivAtTick: 1, vasodilatorIntentAtTick: 2, diureticIntentAtTick: 3, reassessedAtTick: 4 });
const DIURETIC_ONLY = base({ patternReviewedAtTick: 0, diureticIntentAtTick: 1 });
const STATES = [EMPTY, PATTERN, SUPPORTED, VASODILATED, TREATED, DONE, DIURETIC_ONLY];

const LABELS = ['Review pattern + mimics + precipitants', 'Start NIV + titrated oxygen intent',
  'Record IV loop-diuretic intent', 'Record IV vasodilator intent',
  'Reassess breathing + BP + perfusion'];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['acutePulmonaryEdemaAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, acutePulmonaryEdemaAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 480, respiratoryRateBpm: 18, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 10 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onAcutePulmonaryEdemaResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['acutePulmonaryEdemaAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

const openCount = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .filter((match) => LABELS.some((known) => match[1]!.includes(known)))
  .filter((match) => !/ disabled=""/.test(match[0])).length;

describe('Emergency acute pulmonary edema experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/emergency-medicine' }));
    expect(index).toContain('href="/emergency-medicine/scenario/acute-pulmonary-edema"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/emergency-medicine/scenario/acute-pulmonary-edema' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasAcutePulmonaryEdemaResponse).toBe(true);
    expect(crisisResponseAvailability({ ...SCENARIO, timeline: [] })
      .hasAcutePulmonaryEdemaResponse).toBe(false);
  });

  it('keeps all five recorded steps on screen', () => {
    for (const state of STATES) {
      expect(lessonButtons(markup(state))).toHaveLength(5);
    }
  });

  it('opens the three treatments together, because they are not a ranked list', () => {
    expect(openCount(markup(EMPTY))).toBe(1);
    expect(openCount(markup(PATTERN))).toBe(3);
    expect(openCount(markup(DIURETIC_ONLY))).toBe(2);
    expect(openCount(markup(SUPPORTED))).toBe(2);
    expect(openCount(markup(VASODILATED))).toBe(1);
    expect(openCount(markup(TREATED))).toBe(1);
    expect(openCount(markup(DONE))).toBe(0);
  });

  it('holds the reassessment shut until all three treatments are recorded', () => {
    const reassessOpen = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
      .filter((match) => match[1]!.includes('Reassess breathing'))
      .some((match) => !/ disabled=""/.test(match[0]));
    for (const state of [EMPTY, PATTERN, DIURETIC_ONLY, SUPPORTED, VASODILATED]) {
      expect(reassessOpen(markup(state))).toBe(false);
    }
    expect(reassessOpen(markup(TREATED))).toBe(true);
  });

  it('never offers a delivery, a dose, or an outcome', () => {
    expect(markup(EMPTY)).toContain('See lungs, pressure, and perfusion together');
    for (const html of STATES.map((state) => markup(state))) {
      // "titrated oxygen" is an authored control label and is the lesson's own
      // content, so the guard is on dose, delivery, and outcome language.
      expect(lessonButtons(html).join(' '))
        .not.toMatch(/push |bolus|\d\s?(?:mg|mcg|mL)\b|titrate to|diagnos|prognos|resolv/iu);
    }
  });
});

describe('Emergency acute pulmonary edema tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { acutePulmonaryEdemaGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { acutePulmonaryEdemaGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('the part that explains the rest');
    const treating = markup(PATTERN, { acutePulmonaryEdemaGuidance: 'guided' });
    expect(treating).toContain('They are unordered on purpose');
    expect(treating).not.toContain('the part that explains the rest');
  });

  it('puts the load-bearing claim where every path passes through', () => {
    const treating = markup(PATTERN, { acutePulmonaryEdemaGuidance: 'guided' });
    expect(treating).toContain('it is the slowest at the thing the next few minutes need');
    expect(treating).toContain('recording it does not buy you the other two');
  });

  it('picks up the missing lane whichever one the learner left', () => {
    expect(markup(DIURETIC_ONLY, { acutePulmonaryEdemaGuidance: 'guided' }))
      .toContain('the shortest interval between recording it and the patient looking different');
    expect(markup(SUPPORTED, { acutePulmonaryEdemaGuidance: 'guided' }))
      .toContain('comfortably above 110');
    expect(markup(VASODILATED, { acutePulmonaryEdemaGuidance: 'guided' }))
      .toContain('natriuresis takes time to matter');
  });

  it('goes quiet once the reassessment is recorded', () => {
    expect(markup(DONE, { acutePulmonaryEdemaGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { acutePulmonaryEdemaGuidance: 'guided', acutePulmonaryEdemaDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
