/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { HYPERTENSIVE_EMERGENCY as SCENARIO } from '../../src/modules/cardiology/scenarios/hypertensive-emergency';

/** The constants this lesson never moves, spread into every state below. */
const NEVER = {
  initialPulsePresent: true as const,
  acuteTargetOrganDamage: true as const,
  treatmentDeliveredByLearner: false as const,
  drugSelected: false as const,
  doseSelected: false as const,
  infusionRateSelected: false as const,
  universalTargetSelected: false as const,
  rapidNormalizationSelected: false as const,
  testAcquiredByLearner: false as const,
  procedurePerformed: false as const,
  dispositionDetermined: false as const,
  outcomePredicted: false as const,
};
const base = (over: Record<string, unknown>) => ({
  measurementAtTick: null, organInjuryAtTick: null, phenotypeAtTick: null,
  reductionIntentAtTick: null, laterPanelAtTick: null, handoffAtTick: null,
  ...NEVER, ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['hypertensiveEmergencyAssessment']>);

const EMPTY = base({});
const MEASURED = base({ measurementAtTick: 0 });
const ORGAN = base({ measurementAtTick: 0, organInjuryAtTick: 1 });
const PHENOTYPE = base({ measurementAtTick: 0, organInjuryAtTick: 1, phenotypeAtTick: 2 });
const REDUCTION = base({ measurementAtTick: 0, organInjuryAtTick: 1, reductionIntentAtTick: 2 });
const BOTH = base({ measurementAtTick: 0, organInjuryAtTick: 1, reductionIntentAtTick: 2, phenotypeAtTick: 3 });
const PANEL = base({ measurementAtTick: 0, organInjuryAtTick: 1, reductionIntentAtTick: 2, phenotypeAtTick: 3, laterPanelAtTick: 4 });
const DONE = base({ measurementAtTick: 0, organInjuryAtTick: 1, reductionIntentAtTick: 2, phenotypeAtTick: 3, laterPanelAtTick: 4, handoffAtTick: 5 });
const STATES = [EMPTY, MEASURED, ORGAN, PHENOTYPE, REDUCTION, BOTH, PANEL, DONE];

const LABELS = ['Reconcile pressure trajectory', 'Review acute organ injury',
  'Review phenotype + causes', 'Record controlled-reduction intent',
  'Review later organ panel', 'Hand off causes + owners'];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['hypertensiveEmergencyAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, hypertensiveEmergencyAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 440, respiratoryRateBpm: 16, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onHypertensiveEmergencyResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['hypertensiveEmergencyAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Hypertensive emergency experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/cardiology' }));
    expect(index).toContain('href="/cardiology/scenario/hypertensive-emergency"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/cardiology/scenario/hypertensive-emergency' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasHypertensiveEmergencyResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'hypertensive-emergency-reassessment'),
    }).hasHypertensiveEmergencyResponse).toBe(false);
  });

  it('keeps all six steps on screen, one per declared objective', () => {
    expect(SCENARIO.metadata.objectives).toHaveLength(6);
    for (const state of STATES) {
      expect(lessonButtons(markup(state))).toHaveLength(6);
    }
  });

  it('locks both middle lanes away until the organ injury is reviewed', () => {
    const LANES = ['Review phenotype \\+ causes', 'Record controlled-reduction intent'];
    for (const state of [EMPTY, MEASURED]) {
      for (const lane of LANES) {
        expect(markup(state)).toMatch(new RegExp(`<button[^>]* disabled=""[^>]*>${lane}`));
      }
    }
    for (const lane of LANES) {
      expect(markup(ORGAN)).not.toMatch(new RegExp(`<button[^>]* disabled=""[^>]*>${lane}`));
    }
  });

  it('keeps the later panel closed until both lanes have landed', () => {
    for (const state of [ORGAN, PHENOTYPE, REDUCTION]) {
      expect(markup(state)).toMatch(/<button[^>]* disabled=""[^>]*>Review later organ panel/);
    }
    expect(markup(BOTH)).not.toMatch(/<button[^>]* disabled=""[^>]*>Review later organ panel/);
  });

  it('never offers a drug, a dose, a rate, or a target', () => {
    expect(markup(EMPTY)).toContain('The number needs context.');
    expect(markup(BOTH)).toContain('Lower carefully. Protect perfusion.');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/examin|labetalol|nicardipine|nitroprus|\bmg\b|mg\/min|%|140\/90|diagnos|prognos/iu);
    }
  });
});

describe('Hypertensive emergency tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { hypertensiveEmergencyGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { hypertensiveEmergencyGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('A marked pressure on its own is still not an emergency');
    const organ = markup(MEASURED, { hypertensiveEmergencyGuidance: 'guided' });
    expect(organ).toContain('because the pressure is not it');
    expect(organ).not.toContain('A marked pressure on its own is still not an emergency');
  });

  it('follows whichever middle lane the learner left open', () => {
    expect(markup(PHENOTYPE, { hypertensiveEmergencyGuidance: 'guided' }))
      .toContain('no numbers of any kind');
    expect(markup(REDUCTION, { hypertensiveEmergencyGuidance: 'guided' }))
      .toContain('its own pathway and its own pressure targets');
  });

  it('notices the symptom that has not moved', () => {
    expect(markup(BOTH, { hypertensiveEmergencyGuidance: 'guided' }))
      .toContain('they are the reason nobody is finished');
  });

  it('goes quiet once the handoff is recorded', () => {
    expect(markup(DONE, { hypertensiveEmergencyGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { hypertensiveEmergencyGuidance: 'guided', hypertensiveEmergencyDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
