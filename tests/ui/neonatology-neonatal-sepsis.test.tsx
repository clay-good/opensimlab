import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PrerenderedBody } from '@routes/Prerendered';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { NEONATAL_SEPSIS as SCENARIO } from '../../src/modules/neonatology/scenarios/neonatal-sepsis';
const markup = (assessment: NonNullable<ActionCockpitProps['resuscitation']['neonatologySepsisAssessment']>, extra: {
  neonatologySepsisGuidance?: ActionCockpitProps['neonatologySepsisGuidance'];
  neonatologySepsisDemonstrating?: boolean;
} = {}) => renderToStaticMarkup(createElement(ActionCockpit, { scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false }, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, neonatologySepsisAssessment: assessment }, lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 24, respiratoryRateBpm: 40, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 2 }, intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {}, onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {}, onNeonatologySepsisResponse: () => {}, ...extra } satisfies ActionCockpitProps));
describe('Neonatology neonatal-sepsis experience', () => {
  it('is discoverable at its exact calm route', () => { const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/neonatology' })); expect(index).toContain('href="/neonatology/scenario/neonatal-sepsis"'); expect(index).toContain('Neonatal sepsis: clinical change outranks a score'); const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/neonatology/scenario/neonatal-sepsis' })); expect(route).toContain('<h1>Neonatal sepsis: clinical change outranks a score</h1>'); });
  it('fails closed and exposes one calm cognitive action at a time', () => { expect(crisisResponseAvailability(SCENARIO).hasNeonatologySepsisResponse).toBe(true); expect(crisisResponseAvailability({ ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) }).hasNeonatologySepsisResponse).toBe(false); const states = [{ supportAtTick: null, contextAtTick: null, recognitionAtTick: null, readinessAtTick: null, reassessmentAtTick: null, handoffAtTick: null }, { supportAtTick: 1, contextAtTick: null, recognitionAtTick: null, readinessAtTick: null, reassessmentAtTick: null, handoffAtTick: null }, { supportAtTick: 1, contextAtTick: 1, recognitionAtTick: null, readinessAtTick: null, reassessmentAtTick: null, handoffAtTick: null }, { supportAtTick: 1, contextAtTick: 1, recognitionAtTick: 1, readinessAtTick: null, reassessmentAtTick: null, handoffAtTick: null }, { supportAtTick: 1, contextAtTick: 1, recognitionAtTick: 1, readinessAtTick: 1, reassessmentAtTick: null, handoffAtTick: null }, { supportAtTick: 1, contextAtTick: 1, recognitionAtTick: 1, readinessAtTick: 1, reassessmentAtTick: 2, handoffAtTick: null }, { supportAtTick: 1, contextAtTick: 1, recognitionAtTick: 1, readinessAtTick: 1, reassessmentAtTick: 2, handoffAtTick: 3 }]; expect(states.map((state) => (markup(state).match(/<button/g) ?? []).length)).toEqual([1,1,1,1,1,1,0]); expect(markup(states[0]!)).toContain('Follow the change, not just the risk.'); const later = markup(states[4]!); expect(later).toContain('Partial improvement is not microbiologic closure.'); expect(later).toContain('Review the fixed 1-hour report'); expect((later.match(/role="status"/g) ?? [])).toHaveLength(1); for (const html of states.map((state) => markup(state))) { const buttons = [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)].map((match) => match[1]); expect(buttons.join(' ')).not.toMatch(/history|examin|score|monitor|measure|culture|test|risk calculat|diagnos|warm|cool|oxygen|respiratory|circulatory|access|fluid|glucose|antimicrobial|drug|dose|feed|device|ventilat|airway|resuscitat|transport|procedure|disposition/iu); } });
});

describe('Neonatal sepsis tutor and worked example', () => {
  const start = { supportAtTick: null, contextAtTick: null, recognitionAtTick: null, readinessAtTick: null, reassessmentAtTick: null, handoffAtTick: null };
  const connected = { ...start, supportAtTick: 0, contextAtTick: 1 };
  const recognized = { ...connected, recognitionAtTick: 2 };

  it('says nothing at all on the unassisted setting', () => {
    expect(markup(start)).not.toContain('A moment to think');
    expect(markup(start, { neonatologySepsisGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner\u2019s own recorded steps when guidance is on', () => {
    const opening = markup(start, { neonatologySepsisGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('Bring the laboratory and the pharmacy in');
    const next = markup(connected, { neonatologySepsisGuidance: 'guided' });
    expect(next).toContain('Let the infant end the calculation');
    expect(next).not.toContain('Bring the laboratory and the pharmacy in');
  });

  it('refuses the calculator and the laboratory in the same breath', () => {
    const html = markup(connected, { neonatologySepsisGuidance: 'guided' });
    expect(html).toContain('cannot overrule a clinically ill infant');
    expect(html).toContain('can diagnose or exclude early-onset sepsis');
    expect(html).not.toContain('he has sepsis');
  });

  it('points the culture clause at the treatment', () => {
    const html = markup(recognized, { neonatologySepsisGuidance: 'guided' });
    expect(html).toContain('protects the antibiotics, not the specimen');
  });

  it('goes quiet once the handoff is recorded', () => {
    const ended = { ...recognized, readinessAtTick: 3, reassessmentAtTick: 4, handoffAtTick: 5 };
    expect(markup(ended, { neonatologySepsisGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = 'Confirm prepared support';
    expect(markup(start)).toContain(label);
    const watching = markup(start, { neonatologySepsisGuidance: 'guided', neonatologySepsisDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
