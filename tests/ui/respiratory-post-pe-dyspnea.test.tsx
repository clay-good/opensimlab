/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { POST_PULMONARY_EMBOLISM_PERSISTENT_DYSPNEA as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/post-pulmonary-embolism-persistent-dyspnea';

/** The constants this lesson never moves, spread into every state below. */
const NEVER = {
  acutePeConfirmedAuthored: true as const,
  anticoagulationDeliveredByLearner: false as const, testAcquiredByLearner: false as const,
  ctepdDiagnosed: false as const, treatmentSelected: false as const,
  procedurePerformedByLearner: false as const, dispositionDetermined: false as const,
  outcomePredicted: false as const,
};
const EMPTY = { trajectoryAtTick: null, safetyAtTick: null, evidenceAtTick: null, referralAtTick: null, handoffAtTick: null, ...NEVER };
const LABELS = ['Reconcile course + symptoms', 'Review function + current safety', 'Review evidence + open causes', 'Coordinate expert evaluation', 'Hand off unresolved post-PE work'];
const STATES = [EMPTY,
  { ...EMPTY, trajectoryAtTick: 0 },
  { ...EMPTY, trajectoryAtTick: 0, safetyAtTick: 1 },
  { ...EMPTY, trajectoryAtTick: 0, safetyAtTick: 1, evidenceAtTick: 2 },
  { ...EMPTY, trajectoryAtTick: 0, safetyAtTick: 1, evidenceAtTick: 2, referralAtTick: 3 },
  { trajectoryAtTick: 0, safetyAtTick: 1, evidenceAtTick: 2, referralAtTick: 3, handoffAtTick: 4, ...NEVER }];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['postPeDyspneaAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, postPeDyspneaAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 360, respiratoryRateBpm: 18, fio2: 0.35, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 10 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onPostPeDyspneaResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['postPeDyspneaAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Respiratory post-PE dyspnea experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/respiratory-medicine' }));
    expect(index).toContain('href="/respiratory-medicine/scenario/post-pulmonary-embolism-persistent-dyspnea"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/respiratory-medicine/scenario/post-pulmonary-embolism-persistent-dyspnea' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed and never offers a test, a diagnosis, or a drug change', () => {
    expect(crisisResponseAvailability(SCENARIO).hasPostPeDyspneaResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'post-pulmonary-embolism-persistent-dyspnea-reassessment'),
    }).hasPostPeDyspneaResponse).toBe(false);
    expect(lessonButtons(markup(EMPTY)).length).toBe(5);
    expect(markup(STATES[0]!)).toContain('Recovery deserves a real comparison.');
    expect(markup(STATES[5]!)).toContain('Persistent symptoms + unresolved evaluation handed off');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/measure|examin|auscultat|sample|acquire|order the|send the|walk test|echo|catheter|ct scan|cpet|anticoagulant|warfarin|apixaban|heparin|stop the|switch|dose|drug|prescri|procedure|diagnose|exclude|disposition|discharge|prognos/iu);
    }
  });
});

describe('Post-PE dyspnea tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { postPeDyspneaGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { postPeDyspneaGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('take the anticoagulation as given');
    const next = markup(STATES[1]!, { postPeDyspneaGuidance: 'guided' });
    expect(next).toContain('before you interpret anything');
    expect(next).not.toContain('take the anticoagulation as given');
  });

  it('reads the reports as a reason to refer rather than a diagnosis', () => {
    const html = markup(STATES[2]!, { postPeDyspneaGuidance: 'guided' });
    expect(html).toContain('a reason to refer, not as a diagnosis');
    expect(html).toContain('It does not diagnose CTEPD or CTEPH');
  });

  it('goes quiet once the handoff is recorded', () => {
    expect(markup(STATES[5]!, { postPeDyspneaGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { postPeDyspneaGuidance: 'guided', postPeDyspneaDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
