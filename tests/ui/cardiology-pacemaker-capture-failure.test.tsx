/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { PACEMAKER_CAPTURE_FAILURE as SCENARIO } from '../../src/modules/cardiology/scenarios/pacemaker-capture-failure';

/** The constants this lesson never moves, spread into every state below. */
const NEVER = {
  initialPulsePresent: true as const,
  electricalCaptureFailureAuthored: true as const,
  pacingDeliveredByLearner: false as const,
  captureAssessedByLearner: false as const,
  deviceInterrogatedByLearner: false as const,
  deviceProgrammedByLearner: false as const,
  outputSelectedByLearner: false as const,
  leadManipulatedByLearner: false as const,
  treatmentDeliveredByLearner: false as const,
  outcomePredicted: false as const,
};
const base = (over: Record<string, unknown>) => ({
  recognitionAtTick: null, rescueAtTick: null, deviceSystemAtTick: null,
  causesAtTick: null, laterPanelAtTick: null, handoffAtTick: null,
  ...NEVER, ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['pacemakerCaptureFailureAssessment']>);

const EMPTY = base({});
const RECOGNISED = base({ recognitionAtTick: 0 });
const RESCUED = base({ recognitionAtTick: 0, rescueAtTick: 1 });
const TWO = base({ recognitionAtTick: 0, deviceSystemAtTick: 1, causesAtTick: 2 });
const THREE = base({ recognitionAtTick: 0, rescueAtTick: 1, deviceSystemAtTick: 2, causesAtTick: 3 });
const PANEL = base({ recognitionAtTick: 0, rescueAtTick: 1, deviceSystemAtTick: 2, causesAtTick: 3, laterPanelAtTick: 4 });
const DONE = base({ recognitionAtTick: 0, rescueAtTick: 1, deviceSystemAtTick: 2, causesAtTick: 3, laterPanelAtTick: 4, handoffAtTick: 5 });
const STATES = [EMPTY, RECOGNISED, RESCUED, TWO, THREE, PANEL, DONE];

const LABELS = ['Reconcile pulse + capture pattern', 'Review device + lead system',
  'Review reversible causes', 'Activate pacing-capable rescue',
  'Review later capture panel', 'Hand off capture-failure plan'];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['pacemakerCaptureFailureAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, pacemakerCaptureFailureAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 450, respiratoryRateBpm: 18, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onPacemakerCaptureFailureResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['pacemakerCaptureFailureAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Pacemaker capture-failure experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/cardiology' }));
    expect(index).toContain('href="/cardiology/scenario/pacemaker-capture-failure"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/cardiology/scenario/pacemaker-capture-failure' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasPacemakerCaptureFailureResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'pacemaker-capture-failure-reassessment'),
    }).hasPacemakerCaptureFailureResponse).toBe(false);
  });

  it('keeps all six steps on screen, one per declared objective', () => {
    expect(SCENARIO.metadata.objectives).toHaveLength(6);
    for (const state of STATES) {
      expect(lessonButtons(markup(state))).toHaveLength(6);
    }
  });

  it('opens the rescue alongside both review lanes rather than ahead of them', () => {
    const LANES = ['Review device \\+ lead system', 'Review reversible causes', 'Activate pacing-capable rescue'];
    for (const lane of LANES) {
      expect(markup(EMPTY)).toMatch(new RegExp(`<button[^>]* disabled=""[^>]*>${lane}`));
      expect(markup(RECOGNISED)).not.toMatch(new RegExp(`<button[^>]* disabled=""[^>]*>${lane}`));
    }
  });

  it('keeps the later panel closed until all three lanes have landed', () => {
    for (const state of [RECOGNISED, RESCUED, TWO]) {
      expect(markup(state)).toMatch(/<button[^>]* disabled=""[^>]*>Review later capture panel/);
    }
    expect(markup(THREE)).not.toMatch(/<button[^>]* disabled=""[^>]*>Review later capture panel/);
  });

  it('never offers to pace, program, or name an output', () => {
    expect(markup(EMPTY)).toContain('A spike is not a heartbeat.');
    expect(markup(THREE)).toContain('Protect perfusion. Bring a bridge.');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/examin|interrogat|program|\bV\b|\bms\b|ohm|implant|extract|diagnos|prognos/u);
    }
  });
});

describe('Pacemaker capture-failure tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { pacemakerCaptureFailureGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { pacemakerCaptureFailureGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('the display is counting the wrong thing');
    const lanes = markup(RECOGNISED, { pacemakerCaptureFailureGuidance: 'guided' });
    expect(lanes).toContain('Rescue is in this group rather than in front of it');
    expect(lanes).not.toContain('the display is counting the wrong thing');
  });

  it('names the rescue when both troubleshooting lanes went first', () => {
    expect(markup(TWO, { pacemakerCaptureFailureGuidance: 'guided' }))
      .toContain('Get the bridge organised now');
  });

  it('reads the interrogation as trends rather than a verdict', () => {
    expect(markup(RESCUED, { pacemakerCaptureFailureGuidance: 'guided' }))
      .toContain('the output has not changed, the threshold has climbed past it');
  });

  it('keeps the programming change temporary', () => {
    expect(markup(THREE, { pacemakerCaptureFailureGuidance: 'guided' }))
      .toContain('the word doing the work is temporary');
  });

  it('goes quiet once the handoff is recorded', () => {
    expect(markup(DONE, { pacemakerCaptureFailureGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { pacemakerCaptureFailureGuidance: 'guided', pacemakerCaptureFailureDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
