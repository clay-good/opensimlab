import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PrerenderedBody } from '@routes/Prerendered';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { NEONATAL_BRADYCARDIA as SCENARIO } from '../../src/modules/neonatology/scenarios/neonatal-bradycardia';
const markup = (assessment: NonNullable<ActionCockpitProps['resuscitation']['neonatologyBradycardiaAssessment']>, extra: {
  neonatologyBradycardiaGuidance?: ActionCockpitProps['neonatologyBradycardiaGuidance'];
  neonatologyBradycardiaDemonstrating?: boolean;
} = {}) => renderToStaticMarkup(createElement(ActionCockpit, { scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false }, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, neonatologyBradycardiaAssessment: assessment }, lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 23, respiratoryRateBpm: 30, fio2: 1, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 2 }, intubated: true, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'tracheal-tube', supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {}, onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {}, onNeonatologyBradycardiaResponse: () => {}, ...extra } satisfies ActionCockpitProps));
describe('Neonatology neonatal-bradycardia experience', () => {
  it('is discoverable at its exact calm route', () => { const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/neonatology' })); expect(index).toContain('href="/neonatology/scenario/neonatal-bradycardia"'); expect(index).toContain('Neonatal bradycardia: verify ventilation before compressions'); const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/neonatology/scenario/neonatal-bradycardia' })); expect(route).toContain('<h1>Neonatal bradycardia: verify ventilation before compressions</h1>'); });
  it('fails closed and exposes one calm cognitive action at a time', () => { expect(crisisResponseAvailability(SCENARIO).hasNeonatologyBradycardiaResponse).toBe(true); expect(crisisResponseAvailability({ ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) }).hasNeonatologyBradycardiaResponse).toBe(false); const states = [{ supportAtTick: null, contextAtTick: null, recognitionAtTick: null, readinessAtTick: null, reassessmentAtTick: null, handoffAtTick: null }, { supportAtTick: 1, contextAtTick: null, recognitionAtTick: null, readinessAtTick: null, reassessmentAtTick: null, handoffAtTick: null }, { supportAtTick: 1, contextAtTick: 1, recognitionAtTick: null, readinessAtTick: null, reassessmentAtTick: null, handoffAtTick: null }, { supportAtTick: 1, contextAtTick: 1, recognitionAtTick: 1, readinessAtTick: null, reassessmentAtTick: null, handoffAtTick: null }, { supportAtTick: 1, contextAtTick: 1, recognitionAtTick: 1, readinessAtTick: 1, reassessmentAtTick: null, handoffAtTick: null }, { supportAtTick: 1, contextAtTick: 1, recognitionAtTick: 1, readinessAtTick: 1, reassessmentAtTick: 2, handoffAtTick: null }, { supportAtTick: 1, contextAtTick: 1, recognitionAtTick: 1, readinessAtTick: 1, reassessmentAtTick: 2, handoffAtTick: 3 }]; expect(states.map((state) => (markup(state).match(/<button/g) ?? []).length)).toEqual([1,1,1,1,1,1,0]); expect(markup(states[0]!)).toContain('Verify the lungs first. Then support the heart together.'); const later = markup(states[4]!); expect(later).toContain('A heart-rate rise changes the branch. It does not close the case.'); expect(later).toContain('Review the fixed 3-minute report'); expect((later.match(/role="status"/g) ?? [])).toHaveLength(1); for (const html of states.map((state) => markup(state))) { const buttons = [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)].map((match) => match[1]); expect(buttons.join(' ')).not.toMatch(/examin|score|monitor|position|dry|warm|suction|stimulat|separat|oxygen|ventilat|airway|correct|compress|access|fluid|blood|glucose|epinephrine|drug|dose|feed|resuscitat|transport|procedure|disposition/iu); } });
});

describe('Neonatal bradycardia tutor and worked example', () => {
  const start = { supportAtTick: null, contextAtTick: null, recognitionAtTick: null, readinessAtTick: null, reassessmentAtTick: null, handoffAtTick: null };
  const connected = { ...start, supportAtTick: 0, contextAtTick: 1 };
  const observed = { ...connected, recognitionAtTick: 2, readinessAtTick: 3, reassessmentAtTick: 4 };

  it('says nothing at all on the unassisted setting', () => {
    expect(markup(start)).not.toContain('A moment to think');
    expect(markup(start, { neonatologyBradycardiaGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner\u2019s own recorded steps when guidance is on', () => {
    const opening = markup(start, { neonatologyBradycardiaGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('Staff the compressions and the ventilation as two jobs');
    const next = markup(connected, { neonatologyBradycardiaGuidance: 'guided' });
    expect(next).toContain('Name both halves of the threshold');
    expect(next).not.toContain('Staff the compressions and the ventilation as two jobs');
  });

  it('requires the ventilation evidence before the threshold', () => {
    const html = markup(connected, { neonatologyBradycardiaGuidance: 'guided' });
    expect(html).toContain('Ventilation is optimized first');
    expect(html).toContain('only needed a better seal');
  });

  it('refuses the post-hoc reading at the handoff beat', () => {
    const html = markup(observed, { neonatologyBradycardiaGuidance: 'guided' });
    expect(html).toContain('not evidence the treatment is why');
    expect(html).not.toContain('the compressions worked');
  });

  it('goes quiet once the handoff is recorded', () => {
    const ended = { ...observed, handoffAtTick: 5 };
    expect(markup(ended, { neonatologyBradycardiaGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = 'Activate qualified response';
    expect(markup(start)).toContain(label);
    const watching = markup(start, { neonatologyBradycardiaGuidance: 'guided', neonatologyBradycardiaDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
