/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { ACUTE_SEVERE_ASTHMA as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/acute-severe-asthma';

/** The constants this lesson never moves, spread into every state below. */
const NEVER = {
  respiratoryFailureAuthored: true as const,
  medicationDeliveredByLearner: false as const, oxygenDeliveredByLearner: false as const,
  airwayProcedurePerformedByLearner: false as const, ventilatorSettingSelected: false as const,
  dispositionDetermined: false as const, outcomePredicted: false as const,
};
const EMPTY = { treatmentAtTick: null, failureAtTick: null, escalationAtTick: null, risksAtTick: null, handoffAtTick: null, ...NEVER };
const LABELS = ['Reconcile treatment + trajectory', 'Recognize respiratory failure', 'Activate critical-care help', 'Review causes + ventilation risks', 'Hand off active respiratory failure'];
const STATES = [EMPTY,
  { ...EMPTY, treatmentAtTick: 0 },
  { ...EMPTY, treatmentAtTick: 0, failureAtTick: 1 },
  { ...EMPTY, treatmentAtTick: 0, failureAtTick: 1, escalationAtTick: 2 },
  { ...EMPTY, treatmentAtTick: 0, failureAtTick: 1, escalationAtTick: 2, risksAtTick: 3 },
  { treatmentAtTick: 0, failureAtTick: 1, escalationAtTick: 2, risksAtTick: 3, handoffAtTick: 4, ...NEVER }];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['acuteSevereAsthmaAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, acuteSevereAsthmaAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 360, respiratoryRateBpm: 18, fio2: 0.35, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 10 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onAcuteSevereAsthmaResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['acuteSevereAsthmaAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Respiratory acute-severe-asthma experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/respiratory-medicine' }));
    expect(index).toContain('href="/respiratory-medicine/scenario/acute-severe-asthma"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/respiratory-medicine/scenario/acute-severe-asthma' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed and never offers a treatment, a device, or a setting', () => {
    expect(crisisResponseAvailability(SCENARIO).hasAcuteSevereAsthmaResponse).toBe(true);
    expect(crisisResponseAvailability({ ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) }).hasAcuteSevereAsthmaResponse).toBe(false);
    expect(lessonButtons(markup(EMPTY)).length).toBe(5);
    expect(markup(STATES[0]!)).toContain('Quieter is not always better.');
    expect(markup(STATES[4]!)).toContain('Open causes + ventilation hazards reviewed');
    expect(markup(STATES[5]!)).toContain('Active failure, hazards, and owners handed off');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/measure|examin|auscultat|peak flow|blood gas|sample|acquire|salbutamol|albuterol|magnesium|steroid|adrenaline|epinephrine|oxygen|bipap|niv|high-flow|intubat|ventilate the|sedat|paralys|peep|tidal|dose|drug|prescri|procedure|diagnose|exclude|disposition|discharge|prognos/iu);
    }
  });
});

describe('Acute-severe-asthma tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { acuteSevereAsthmaGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { acuteSevereAsthmaGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('Separate what was already done from how she has responded');
    const next = markup(STATES[1]!, { acuteSevereAsthmaGuidance: 'guided' });
    expect(next).toContain('as fatigue, not as improvement');
    expect(next).not.toContain('Separate what was already done from how she has responded');
  });

  it('refuses both numbers that moved the right way', () => {
    const html = markup(STATES[1]!, { acuteSevereAsthmaGuidance: 'guided' });
    expect(html).toContain('running out of the strength to breathe');
    expect(html).toContain('now on 35% oxygen rather than room air');
  });

  it('goes quiet once the handoff is recorded', () => {
    expect(markup(STATES[5]!, { acuteSevereAsthmaGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { acuteSevereAsthmaGuidance: 'guided', acuteSevereAsthmaDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
