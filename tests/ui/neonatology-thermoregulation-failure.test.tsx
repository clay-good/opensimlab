import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PrerenderedBody } from '@routes/Prerendered';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { THERMOREGULATION_FAILURE as SCENARIO } from '../../src/modules/neonatology/scenarios/thermoregulation-failure';
const markup = (assessment: NonNullable<ActionCockpitProps['resuscitation']['neonatologyThermoregulationAssessment']>, extra: {
  neonatologyThermoregulationGuidance?: ActionCockpitProps['neonatologyThermoregulationGuidance'];
  neonatologyThermoregulationDemonstrating?: boolean;
} = {}) => renderToStaticMarkup(createElement(ActionCockpit, { scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false }, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, neonatologyThermoregulationAssessment: assessment }, lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 24, respiratoryRateBpm: 40, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 2 }, intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {}, onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {}, onNeonatologyThermoregulationResponse: () => {}, ...extra } satisfies ActionCockpitProps));
describe('Neonatology thermoregulation-failure experience', () => {
  it('is discoverable at its exact calm route', () => { const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/neonatology' })); expect(index).toContain('href="/neonatology/scenario/thermoregulation-failure"'); expect(index).toContain('Thermoregulation failure: restore the warm chain'); const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/neonatology/scenario/thermoregulation-failure' })); expect(route).toContain('<h1>Thermoregulation failure: restore the warm chain</h1>'); });
  it('fails closed and exposes one calm cognitive action at a time', () => { expect(crisisResponseAvailability(SCENARIO).hasNeonatologyThermoregulationResponse).toBe(true); expect(crisisResponseAvailability({ ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) }).hasNeonatologyThermoregulationResponse).toBe(false); const states = [{ supportAtTick: null, contextAtTick: null, recognitionAtTick: null, readinessAtTick: null, reassessmentAtTick: null, handoffAtTick: null }, { supportAtTick: 1, contextAtTick: null, recognitionAtTick: null, readinessAtTick: null, reassessmentAtTick: null, handoffAtTick: null }, { supportAtTick: 1, contextAtTick: 1, recognitionAtTick: null, readinessAtTick: null, reassessmentAtTick: null, handoffAtTick: null }, { supportAtTick: 1, contextAtTick: 1, recognitionAtTick: 1, readinessAtTick: null, reassessmentAtTick: null, handoffAtTick: null }, { supportAtTick: 1, contextAtTick: 1, recognitionAtTick: 1, readinessAtTick: 1, reassessmentAtTick: null, handoffAtTick: null }, { supportAtTick: 1, contextAtTick: 1, recognitionAtTick: 1, readinessAtTick: 1, reassessmentAtTick: 2, handoffAtTick: null }, { supportAtTick: 1, contextAtTick: 1, recognitionAtTick: 1, readinessAtTick: 1, reassessmentAtTick: 2, handoffAtTick: 3 }]; expect(states.map((state) => (markup(state).match(/<button/g) ?? []).length)).toEqual([1,1,1,1,1,1,0]); expect(markup(states[0]!)).toContain('Warmth is a chain, not a switch.'); const later = markup(states[4]!); expect(later).toContain('A rising temperature is progress, not closure.'); expect(later).toContain('Review the fixed 45-minute report'); expect((later.match(/role="status"/g) ?? [])).toHaveLength(1); for (const html of states.map((state) => markup(state))) { const buttons = [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)].map((match) => match[1]); expect(buttons.join(' ')).not.toMatch(/history|examin|score|temperature|monitor|measure|test|diagnos|warm|cool|skin|incubator|radiant|device|set.?point|rate|feed|glucose|fluid|drug|dose|access|oxygen|respiratory|ventilat|airway|resuscitat|transport|procedure|disposition/iu); } });
});

describe('Neonatal thermoregulation tutor and worked example', () => {
  const start = { supportAtTick: null, contextAtTick: null, recognitionAtTick: null, readinessAtTick: null, reassessmentAtTick: null, handoffAtTick: null };
  const connected = { ...start, supportAtTick: 0, contextAtTick: 1 };
  const recognized = { ...connected, recognitionAtTick: 2 };

  it('says nothing at all on the unassisted setting', () => {
    expect(markup(start)).not.toContain('A moment to think');
    expect(markup(start, { neonatologyThermoregulationGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner\u2019s own recorded steps when guidance is on', () => {
    const opening = markup(start, { neonatologyThermoregulationGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('Confirm the thermal, glucose and feeding pathways together');
    const next = markup(connected, { neonatologyThermoregulationGuidance: 'guided' });
    expect(next).toContain('Rewarm now, and refuse the rate');
    expect(next).not.toContain('Confirm the thermal, glucose and feeding pathways together');
  });

  it('declines the rate while requiring the rewarming', () => {
    const html = markup(connected, { neonatologyThermoregulationGuidance: 'guided' });
    expect(html).toContain('requires immediate qualified rewarming');
    expect(html).toContain('does not support prescribing one optimal rate');
    expect(html).not.toContain('she is warm now');
  });

  it('names hyperthermia as the harm in the direction of the treatment', () => {
    const html = markup(recognized, { neonatologyThermoregulationGuidance: 'guided' });
    expect(html).toContain('avoiding hyperthermia');
  });

  it('goes quiet once the handoff is recorded', () => {
    const ended = { ...recognized, readinessAtTick: 3, reassessmentAtTick: 4, handoffAtTick: 5 };
    expect(markup(ended, { neonatologyThermoregulationGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = 'Confirm prepared support';
    expect(markup(start)).toContain(label);
    const watching = markup(start, { neonatologyThermoregulationGuidance: 'guided', neonatologyThermoregulationDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
