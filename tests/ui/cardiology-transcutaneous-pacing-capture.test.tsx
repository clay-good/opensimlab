/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { TRANSCUTANEOUS_PACING_MECHANICAL_CAPTURE_REASSESSMENT as SCENARIO } from '../../src/modules/cardiology/scenarios/transcutaneous-pacing-mechanical-capture-reassessment';

/** The constants this lesson never moves, spread into every state below. */
const NEVER = {
  initialPulsePresent: false as const,
  electricalCaptureAuthored: true as const,
  mechanicalCaptureAbsent: true as const,
  pacingDeliveredByLearner: false as const,
  captureAssessedByLearner: false as const,
  cprDeliveredByLearner: false as const,
  treatmentDeliveredByLearner: false as const,
  procedurePerformedByLearner: false as const,
  roscReported: false as const,
  outcomePredicted: false as const,
};
const base = (over: Record<string, unknown>) => ({
  recognitionAtTick: null, pulselessResponseAtTick: null,
  causesBridgeAtTick: null, handoffAtTick: null,
  nonshockableArrestPathwayActivated: false,
  ...NEVER, ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['transcutaneousPacingCaptureAssessment']>);

const EMPTY = base({});
const RECOGNISED = base({ recognitionAtTick: 0 });
const ARREST = base({ recognitionAtTick: 0, pulselessResponseAtTick: 1, nonshockableArrestPathwayActivated: true });
const CAUSES = base({ recognitionAtTick: 0, pulselessResponseAtTick: 1, nonshockableArrestPathwayActivated: true, causesBridgeAtTick: 2 });
const DONE = base({ recognitionAtTick: 0, pulselessResponseAtTick: 1, nonshockableArrestPathwayActivated: true, causesBridgeAtTick: 2, handoffAtTick: 3 });
const STATES = [EMPTY, RECOGNISED, ARREST, CAUSES, DONE];

const LABELS = ['Reconcile electrical + mechanical capture', 'Activate pulseless response',
  'Review open causes + bridge', 'Hand off active resuscitation'];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['transcutaneousPacingCaptureAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, transcutaneousPacingCaptureAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 440, respiratoryRateBpm: 18, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onTranscutaneousPacingCaptureResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['transcutaneousPacingCaptureAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Transcutaneous-pacing capture experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/cardiology' }));
    expect(index).toContain('href="/cardiology/scenario/transcutaneous-pacing-mechanical-capture-reassessment"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/cardiology/scenario/transcutaneous-pacing-mechanical-capture-reassessment' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasTranscutaneousPacingCaptureResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'transcutaneous-pacing-mechanical-capture-reassessment'),
    }).hasTranscutaneousPacingCaptureResponse).toBe(false);
  });

  it('keeps all four steps on screen, one per declared objective', () => {
    expect(SCENARIO.metadata.objectives).toHaveLength(4);
    for (const state of STATES) {
      expect(lessonButtons(markup(state))).toHaveLength(4);
    }
  });

  it('opens exactly one step at a time, because nothing here may go first', () => {
    const openCount = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
      .filter((match) => LABELS.some((known) => match[1]!.includes(known)))
      .filter((match) => !/ disabled=""/.test(match[0])).length;
    for (const state of [EMPTY, RECOGNISED, ARREST, CAUSES]) {
      expect(openCount(markup(state))).toBe(1);
    }
    expect(openCount(markup(DONE))).toBe(0);
  });

  it('never offers an output, a pad placement, a drug, or CPR', () => {
    expect(markup(EMPTY)).toContain('A QRS can still have no pulse.');
    expect(markup(ARREST)).toContain('Treat the arrest. Keep causes open.');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/examin|palpat|\bmA\b|pad|compress|CPR|adrenal|epinephr|joule|diagnos|prognos/u);
    }
  });
});

describe('Transcutaneous-pacing capture tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { transcutaneousPacingCaptureGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { transcutaneousPacingCaptureGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('Four independent signals say there is no circulation');
    const arrest = markup(RECOGNISED, { transcutaneousPacingCaptureGuidance: 'guided' });
    expect(arrest).toContain('are minutes without compressions');
    expect(arrest).not.toContain('Four independent signals say there is no circulation');
  });

  it('keeps the cause review alongside the arrest', () => {
    expect(markup(ARREST, { transcutaneousPacingCaptureGuidance: 'guided' }))
      .toContain('The word that matters is while');
  });

  it('says the missing ending is a choice', () => {
    expect(markup(CAUSES, { transcutaneousPacingCaptureGuidance: 'guided' }))
      .toContain('that is a choice rather than an omission');
  });

  it('goes quiet once the handoff is recorded', () => {
    expect(markup(DONE, { transcutaneousPacingCaptureGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { transcutaneousPacingCaptureGuidance: 'guided', transcutaneousPacingCaptureDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
