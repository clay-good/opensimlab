/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { CROUP as SCENARIO } from '../../src/modules/pediatrics/scenarios/croup';

/** The constants this lesson never moves, spread into every state below. */
const NEVER = {
  initialPulsePresent: true as const, spontaneousBreathingAuthored: true as const,
  croupWorkingPatternAuthored: true as const, stridorAtRestAuthored: true as const,
  preservedRoomAirOxygenationAuthored: true as const,
  abruptChokingAuthored: false as const, lowerAirwayPatternAuthored: false as const,
  droolingOrToxicAppearanceAuthored: false as const,
  patientExaminedByLearner: false as const, monitorInterpretedByLearner: false as const,
  diagnosisMadeByLearner: false as const, testAcquiredByLearner: false as const,
  imagingAcquiredByLearner: false as const, drugSelectedByLearner: false as const,
  doseSelectedByLearner: false as const, routeSelectedByLearner: false as const,
  concentrationSelectedByLearner: false as const,
  oxygenSelectedByLearner: false as const, deviceSelectedByLearner: false as const,
  flowSelectedByLearner: false as const, nebulizerOperatedByLearner: false as const,
  airwayManeuverPerformedByLearner: false as const,
};
const base = (over: Record<string, unknown>) => ({
  patternAtTick: null, severityAtTick: null, treatmentIntentAtTick: null,
  earlyResponseAtTick: null, recurrenceAtTick: null, handoffAtTick: null,
  lastUnsupportedChoice: null,
  experiencedTreatmentAuthored: over.treatmentIntentAtTick != null,
  recurrenceAuthored: over.recurrenceAtTick != null,
  ...NEVER, ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['croupAssessment']>);

const EMPTY = base({});
const PATTERN = base({ patternAtTick: 0 });
const AFTER_ALBUTEROL = base({ patternAtTick: 0, lastUnsupportedChoice: 'albuterol' });
const AFTER_XRAY = base({ patternAtTick: 0, lastUnsupportedChoice: 'radiograph' });
const EARLY = base({ patternAtTick: 0, severityAtTick: 1, treatmentIntentAtTick: 2, earlyResponseAtTick: 3 });
const AFTER_DISCHARGE = base({ patternAtTick: 0, severityAtTick: 1, treatmentIntentAtTick: 2, earlyResponseAtTick: 3, lastUnsupportedChoice: 'discharge-early' });
const AFTER_NORMAL_SAT = base({ patternAtTick: 0, severityAtTick: 1, treatmentIntentAtTick: 2, earlyResponseAtTick: 3, lastUnsupportedChoice: 'normal-saturation' });
const DONE = base({ patternAtTick: 0, severityAtTick: 1, treatmentIntentAtTick: 2, earlyResponseAtTick: 3, recurrenceAtTick: 4, handoffAtTick: 5 });
const STATES = [EMPTY, PATTERN, AFTER_ALBUTEROL, AFTER_XRAY, EARLY, AFTER_DISCHARGE, AFTER_NORMAL_SAT, DONE];

const LABELS = ['Review the upper-airway pattern', 'Review severity + red flags',
  'Try albuterol for stridor', 'Wait for a neck X-ray', 'Keep calm + activate qualified care',
  'Review the early response', 'Review the later observation',
  'Discharge after early improvement', 'Treat SpO₂ 97% as low risk',
  'Hand off active upper-airway risk'];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['croupAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, croupAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 105, respiratoryRateBpm: 34, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onCroupResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['croupAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Pediatric croup experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/pediatrics' }));
    expect(index).toContain('href="/pediatrics/scenario/croup"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/pediatrics/scenario/croup' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasCroupResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'croup-reassessment'),
    }).hasCroupResponse).toBe(false);
  });

  it('offers each set of choices only at the moment it belongs to', () => {
    const opening = markup(EMPTY);
    expect(opening).not.toContain('Try albuterol for stridor');
    expect(opening).not.toContain('Discharge after early improvement');
    const pattern = markup(PATTERN);
    expect(pattern).toContain('Review severity + red flags');
    expect(pattern).toContain('Try albuterol for stridor');
    expect(pattern).toContain('Wait for a neck X-ray');
    const early = markup(EARLY);
    expect(early).toContain('Review the later observation');
    expect(early).toContain('Discharge after early improvement');
    expect(early).toContain('Treat SpO₂ 97% as low risk');
  });

  it('says what happened after each of the four refusals', () => {
    expect(markup(AFTER_ALBUTEROL)).toContain('not lower-airway bronchospasm');
    expect(markup(AFTER_XRAY)).toContain('does not wait for routine imaging');
    expect(markup(AFTER_DISCHARGE)).toContain('does not prove discharge readiness');
    expect(markup(AFTER_NORMAL_SAT)).toContain('does not settle airway severity');
  });

  it('never offers an examination, a dose, or a disposition', () => {
    expect(markup(EMPTY)).toContain('Make calm part of care.');
    expect(markup(DONE)).toContain('Improvement needs time.');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/examin|throat|tongue depressor|swab|mg\/kg|dose|dexamethasone|nebuli[sz]|intubat|admit|diagnose|prognos/iu);
    }
  });
});

describe('Croup tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { croupGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { croupGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('Leave her where she is');
    const severity = markup(PATTERN, { croupGuidance: 'guided' });
    expect(severity).toContain('Grade her without touching her');
    expect(severity).not.toContain('Leave her where she is');
  });

  it('answers the two distressing choices differently', () => {
    const alb = markup(AFTER_ALBUTEROL, { croupGuidance: 'guided' });
    expect(alb).toContain('above the vocal cords');
    expect(alb).not.toContain('a child who will scream');
    const xray = markup(AFTER_XRAY, { croupGuidance: 'guided' });
    expect(xray).toContain('a child who will scream');
    expect(xray).not.toContain('above the vocal cords');
  });

  it('answers the two misreadings differently', () => {
    const disc = markup(AFTER_DISCHARGE, { croupGuidance: 'guided' });
    expect(disc).toContain('Nebulized epinephrine wears off');
    expect(disc).not.toContain('the saturation falls last');
    const sat = markup(AFTER_NORMAL_SAT, { croupGuidance: 'guided' });
    expect(sat).toContain('the saturation falls last');
    expect(sat).not.toContain('Nebulized epinephrine wears off');
  });

  it('goes quiet once the handoff is recorded', () => {
    expect(markup(DONE, { croupGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { croupGuidance: 'guided', croupDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
