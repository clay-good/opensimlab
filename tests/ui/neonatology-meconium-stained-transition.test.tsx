import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PrerenderedBody } from '@routes/Prerendered';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { MECONIUM_STAINED_TRANSITION as SCENARIO } from '../../src/modules/neonatology/scenarios/meconium-stained-transition';
const markup = (assessment: NonNullable<ActionCockpitProps['resuscitation']['neonatologyMeconiumTransitionAssessment']>, extra: {
  neonatologyMeconiumGuidance?: ActionCockpitProps['neonatologyMeconiumGuidance'];
  neonatologyMeconiumDemonstrating?: boolean;
} = {}) => renderToStaticMarkup(createElement(ActionCockpit, { scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false }, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, neonatologyMeconiumTransitionAssessment: assessment }, lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 24, respiratoryRateBpm: 40, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 2 }, intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {}, onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {}, onNeonatologyMeconiumTransitionResponse: () => {}, ...extra } satisfies ActionCockpitProps));
describe('Neonatology meconium-stained-transition experience', () => {
  it('is discoverable at its exact calm route', () => { const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/neonatology' })); expect(index).toContain('href="/neonatology/scenario/meconium-stained-transition"'); expect(index).toContain('Meconium-stained transition: observe, do not suction routinely'); const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/neonatology/scenario/meconium-stained-transition' })); expect(route).toContain('<h1>Meconium-stained transition: observe, do not suction routinely</h1>'); });
  it('fails closed and exposes one calm cognitive action at a time', () => { expect(crisisResponseAvailability(SCENARIO).hasNeonatologyMeconiumTransitionResponse).toBe(true); expect(crisisResponseAvailability({ ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) }).hasNeonatologyMeconiumTransitionResponse).toBe(false); const states = [{ supportAtTick: null, contextAtTick: null, recognitionAtTick: null, readinessAtTick: null, reassessmentAtTick: null, handoffAtTick: null }, { supportAtTick: 1, contextAtTick: null, recognitionAtTick: null, readinessAtTick: null, reassessmentAtTick: null, handoffAtTick: null }, { supportAtTick: 1, contextAtTick: 1, recognitionAtTick: null, readinessAtTick: null, reassessmentAtTick: null, handoffAtTick: null }, { supportAtTick: 1, contextAtTick: 1, recognitionAtTick: 1, readinessAtTick: null, reassessmentAtTick: null, handoffAtTick: null }, { supportAtTick: 1, contextAtTick: 1, recognitionAtTick: 1, readinessAtTick: 1, reassessmentAtTick: null, handoffAtTick: null }, { supportAtTick: 1, contextAtTick: 1, recognitionAtTick: 1, readinessAtTick: 1, reassessmentAtTick: 2, handoffAtTick: null }, { supportAtTick: 1, contextAtTick: 1, recognitionAtTick: 1, readinessAtTick: 1, reassessmentAtTick: 2, handoffAtTick: 3 }]; expect(states.map((state) => (markup(state).match(/<button/g) ?? []).length)).toEqual([1,1,1,1,1,1,0]); expect(markup(states[0]!)).toContain('See the newborn, not just the fluid.'); const later = markup(states[4]!); expect(later).toContain('Quiet observation protects more than a reflex procedure.'); expect(later).toContain('Review the fixed 30-minute report'); expect((later.match(/role="status"/g) ?? [])).toHaveLength(1); for (const html of states.map((state) => markup(state))) { const buttons = [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)].map((match) => match[1]); expect(buttons.join(' ')).not.toMatch(/examin|score|monitor|position|dry|warm|suction|stimulat|separat|oxygen|ventilat|airway|correct|compress|access|fluid|glucose|drug|dose|feed|resuscitat|transport|procedure|diagnos|disposition/iu); } });
});

describe('Meconium-stained transition tutor and worked example', () => {
  const start = { supportAtTick: null, contextAtTick: null, recognitionAtTick: null, readinessAtTick: null, reassessmentAtTick: null, handoffAtTick: null };
  const connected = { ...start, supportAtTick: 0, contextAtTick: 1 };

  it('says nothing at all on the unassisted setting', () => {
    expect(markup(start)).not.toContain('A moment to think');
    expect(markup(start, { neonatologyMeconiumGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner\u2019s own recorded steps when guidance is on', () => {
    const opening = markup(start, { neonatologyMeconiumGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('Confirm airway-ready attendance');
    const next = markup(connected, { neonatologyMeconiumGuidance: 'guided' });
    expect(next).toContain('Say what is not indicated');
    expect(next).not.toContain('Confirm airway-ready attendance');
  });

  it('separates the declined intervention from the excluded disease', () => {
    const html = markup(connected, { neonatologyMeconiumGuidance: 'guided' });
    expect(html).toContain('does not exclude meconium aspiration');
    expect(html).toContain('does not make her well');
    expect(html).not.toContain('she is fine');
  });

  it('goes quiet once the handoff is recorded', () => {
    const ended = { supportAtTick: 0, contextAtTick: 1, recognitionAtTick: 2, readinessAtTick: 3, reassessmentAtTick: 4, handoffAtTick: 5 };
    expect(markup(ended, { neonatologyMeconiumGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = 'Confirm prepared support';
    expect(markup(start)).toContain(label);
    const watching = markup(start, { neonatologyMeconiumGuidance: 'guided', neonatologyMeconiumDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
