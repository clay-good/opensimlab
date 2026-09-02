/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { BRONCHIECTASIS_MUCUS_PLUGGING_REASSESSMENT as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/bronchiectasis-mucus-plugging-reassessment';

/** The constants this lesson never moves, spread into every state below. */
const NEVER = {
  initialPulsePresent: true as const, spontaneouslyBreathingAuthored: true as const,
  artificialAirwayPresent: false as const, focalCollapseAuthored: true as const,
  mucusImpactionWorkingPatternAuthored: true as const, mucusPlugEtiologyProven: false as const,
  examinationPerformedByLearner: false as const, imagingAcquiredByLearner: false as const,
  sputumAssessedByLearner: false as const, airwayClearancePerformedByLearner: false as const,
  suctionPerformedByLearner: false as const, bronchoscopyPerformedByLearner: false as const,
  deviceOrTechniqueSelected: false as const, oxygenDeliveredByLearner: false as const,
  treatmentDeliveredByLearner: false as const, diagnosisDetermined: false as const,
  dispositionDetermined: false as const, outcomePredicted: false as const,
};
const EMPTY = { trajectoryAtTick: null, evidenceAtTick: null, clearanceIntentAtTick: null, responseAtTick: null, escalationAtTick: null, handoffAtTick: null, ...NEVER };
const LABELS = ['Review patient + clearance trajectory', 'Review focal evidence + alternatives', 'Record individualized clearance trial', 'Review later patient + focal response', 'Connect persistent-collapse evaluation', 'Hand off unresolved focal work'];
const STATES = [EMPTY,
  { ...EMPTY, trajectoryAtTick: 0 },
  { ...EMPTY, trajectoryAtTick: 0, evidenceAtTick: 1 },
  { ...EMPTY, trajectoryAtTick: 0, evidenceAtTick: 1, clearanceIntentAtTick: 2 },
  { ...EMPTY, trajectoryAtTick: 0, evidenceAtTick: 1, clearanceIntentAtTick: 2, responseAtTick: 3 },
  { ...EMPTY, trajectoryAtTick: 0, evidenceAtTick: 1, clearanceIntentAtTick: 2, responseAtTick: 3, escalationAtTick: 4 },
  { trajectoryAtTick: 0, evidenceAtTick: 1, clearanceIntentAtTick: 2, responseAtTick: 3, escalationAtTick: 4, handoffAtTick: 5, ...NEVER }];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['bronchiectasisMucusPluggingAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, bronchiectasisMucusPluggingAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 360, respiratoryRateBpm: 18, fio2: 0.35, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 10 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onBronchiectasisMucusPluggingResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['bronchiectasisMucusPluggingAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Respiratory mucus-plugging experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/respiratory-medicine' }));
    expect(index).toContain('href="/respiratory-medicine/scenario/bronchiectasis-mucus-plugging-reassessment"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/respiratory-medicine/scenario/bronchiectasis-mucus-plugging-reassessment' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed and never offers clearance, suction, or a bronchoscopy', () => {
    expect(crisisResponseAvailability(SCENARIO).hasBronchiectasisMucusPluggingResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'bronchiectasis-mucus-plugging-reassessment'),
    }).hasBronchiectasisMucusPluggingResponse).toBe(false);
    expect(lessonButtons(markup(EMPTY)).length).toBe(6);
    expect(markup(STATES[0]!)).toContain('The image says where. The trajectory says why it matters.');
    expect(markup(STATES[6]!)).toContain('Better is useful. Persistent is useful, too.');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/measure|examin|auscultat|suction|bronchoscop|nebulis|nebuliz|saline|flutter|percussion|postural|sputum sample|order the|send the|dose|drug|prescri|diagnose|exclude|disposition|discharge|prognos/iu);
    }
  });
});

describe('Mucus-plugging tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { bronchiectasisMucusPluggingGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { bronchiectasisMucusPluggingGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('the routine that normally works');
    const next = markup(STATES[1]!, { bronchiectasisMucusPluggingGuidance: 'guided' });
    expect(next).toContain('without closing it');
    expect(next).not.toContain('the routine that normally works');
  });

  it('supports her own routine rather than replacing it', () => {
    const html = markup(STATES[2]!, { bronchiectasisMucusPluggingGuidance: 'guided' });
    expect(html).toContain('Individualized is the operative word');
    expect(html).toContain('belong to the physiotherapist');
  });

  it('goes quiet once the handoff is recorded', () => {
    expect(markup(STATES[6]!, { bronchiectasisMucusPluggingGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { bronchiectasisMucusPluggingGuidance: 'guided', bronchiectasisMucusPluggingDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
