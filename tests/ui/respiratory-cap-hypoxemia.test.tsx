/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { COMMUNITY_ACQUIRED_PNEUMONIA_HYPOXEMIA_REASSESSMENT as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/community-acquired-pneumonia-hypoxemia-reassessment';

/** The constants this lesson never moves, spread into every state below. */
const NEVER = {
  hypoxemiaAuthored: true as const, pneumoniaPatternAuthored: true as const,
  oxygenDeliveredByLearner: false as const, supportDeviceSelected: false as const,
  antimicrobialSelected: false as const, testAcquiredByLearner: false as const,
  dispositionDetermined: false as const, outcomePredicted: false as const,
};
const EMPTY = { supportAtTick: null, evidenceAtTick: null, severityAtTick: null, treatmentIntentAtTick: null, handoffAtTick: null, ...NEVER };
const LABELS = ['Corroborate hypoxemia + whole patient', 'Review pneumonia pattern + alternatives', 'Review severity + activate help', 'Record treatment + indicated tests', 'Reassess + hand off active care'];
const STATES = [EMPTY,
  { ...EMPTY, supportAtTick: 0 },
  { ...EMPTY, supportAtTick: 0, evidenceAtTick: 1 },
  { ...EMPTY, supportAtTick: 0, evidenceAtTick: 1, severityAtTick: 2 },
  { ...EMPTY, supportAtTick: 0, evidenceAtTick: 1, severityAtTick: 2, treatmentIntentAtTick: 3 },
  { supportAtTick: 0, evidenceAtTick: 1, severityAtTick: 2, treatmentIntentAtTick: 3, handoffAtTick: 4, ...NEVER }];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['capHypoxemiaAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, capHypoxemiaAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 360, respiratoryRateBpm: 18, fio2: 0.35, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 10 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onCapHypoxemiaResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['capHypoxemiaAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Respiratory hypoxemic-pneumonia experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/respiratory-medicine' }));
    expect(index).toContain('href="/respiratory-medicine/scenario/community-acquired-pneumonia-hypoxemia-reassessment"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/respiratory-medicine/scenario/community-acquired-pneumonia-hypoxemia-reassessment' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed and never offers oxygen, a device, or an antimicrobial', () => {
    expect(crisisResponseAvailability(SCENARIO).hasCapHypoxemiaResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'community-acquired-pneumonia-hypoxemia-reassessment'),
    }).hasCapHypoxemiaResponse).toBe(false);
    expect(lessonButtons(markup(EMPTY)).length).toBe(5);
    expect(markup(STATES[0]!)).toContain('Low oxygen, clear next steps.');
    expect(markup(STATES[5]!)).toContain('Plan the treatment. Watch the trajectory.');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/measure|examin|auscultat|sample|acquire|order the|send the|culture|pcr|ceftriaxone|azithro|antibiotic|antimicrobial|litres|high-flow|cannula|mask|intubat|dose|drug|prescri|procedure|diagnose|exclude|admit|icu bed|disposition|discharge|prognos/iu);
    }
  });
});

describe('Hypoxemic-pneumonia tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { capHypoxemiaGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { capHypoxemiaGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('before anything else');
    const next = markup(STATES[1]!, { capHypoxemiaGuidance: 'guided' });
    expect(next).toContain('consistent, not as conclusive');
    expect(next).not.toContain('before anything else');
  });

  it('refuses to let the severity score choose a location of care', () => {
    const html = markup(STATES[2]!, { capHypoxemiaGuidance: 'guided' });
    expect(html).toContain('do not let them decide where she goes');
    expect(html).toContain('a score has never been able to');
  });

  it('goes quiet once the handoff is recorded', () => {
    expect(markup(STATES[5]!, { capHypoxemiaGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { capHypoxemiaGuidance: 'guided', capHypoxemiaDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
