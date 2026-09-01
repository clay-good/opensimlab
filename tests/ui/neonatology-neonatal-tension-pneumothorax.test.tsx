import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PrerenderedBody } from '@routes/Prerendered';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { NEONATAL_TENSION_PNEUMOTHORAX as SCENARIO } from '../../src/modules/neonatology/scenarios/neonatal-tension-pneumothorax';
const markup = (assessment: NonNullable<ActionCockpitProps['resuscitation']['neonatologyTensionPneumothoraxAssessment']>, extra: {
  neonatologyTensionPneumothoraxGuidance?: ActionCockpitProps['neonatologyTensionPneumothoraxGuidance'];
  neonatologyTensionPneumothoraxDemonstrating?: boolean;
} = {}) => renderToStaticMarkup(createElement(ActionCockpit, { scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false }, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, neonatologyTensionPneumothoraxAssessment: assessment }, lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'pressure-control', tidalVolumeMl: 15, respiratoryRateBpm: 40, fio2: 0.7, peep: 5, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 6 }, intubated: true, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'tracheal-tube', supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {}, onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {}, onNeonatologyTensionPneumothoraxResponse: () => {}, ...extra } satisfies ActionCockpitProps));
describe('Neonatology tension-pneumothorax experience', () => {
  it('is discoverable at its exact calm route', () => { const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/neonatology' })); expect(index).toContain('href="/neonatology/scenario/neonatal-tension-pneumothorax"'); expect(index).toContain('Tension pneumothorax: recognize sudden collapse during support'); const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/neonatology/scenario/neonatal-tension-pneumothorax' })); expect(route).toContain('<h1>Tension pneumothorax: recognize sudden collapse during support</h1>'); });
  it('fails closed and exposes one calm cognitive action at a time', () => { expect(crisisResponseAvailability(SCENARIO).hasNeonatologyTensionPneumothoraxResponse).toBe(true); expect(crisisResponseAvailability({ ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) }).hasNeonatologyTensionPneumothoraxResponse).toBe(false); const states = [{ supportAtTick: null, contextAtTick: null, recognitionAtTick: null, readinessAtTick: null, reassessmentAtTick: null, handoffAtTick: null }, { supportAtTick: 1, contextAtTick: null, recognitionAtTick: null, readinessAtTick: null, reassessmentAtTick: null, handoffAtTick: null }, { supportAtTick: 1, contextAtTick: 1, recognitionAtTick: null, readinessAtTick: null, reassessmentAtTick: null, handoffAtTick: null }, { supportAtTick: 1, contextAtTick: 1, recognitionAtTick: 1, readinessAtTick: null, reassessmentAtTick: null, handoffAtTick: null }, { supportAtTick: 1, contextAtTick: 1, recognitionAtTick: 1, readinessAtTick: 1, reassessmentAtTick: null, handoffAtTick: null }, { supportAtTick: 1, contextAtTick: 1, recognitionAtTick: 1, readinessAtTick: 1, reassessmentAtTick: 2, handoffAtTick: null }, { supportAtTick: 1, contextAtTick: 1, recognitionAtTick: 1, readinessAtTick: 1, reassessmentAtTick: 2, handoffAtTick: 3 }]; expect(states.map((state) => (markup(state).match(/<button/g) ?? []).length)).toEqual([1,1,1,1,1,1,0]); expect(markup(states[0]!)).toContain('Sudden asymmetry changes the emergency.'); const later = markup(states[4]!); expect(later).toContain('A pressure release is a beginning, not closure.'); expect(later).toContain('Review the fixed 2-minute report'); expect((later.match(/role="status"/g) ?? [])).toHaveLength(1); for (const html of states.map((state) => markup(state))) { const buttons = [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)].map((match) => match[1]); expect(buttons.join(' ')).not.toMatch(/history|examin|auscultat|transillumin|image|measure|monitor|test|circuit|airway|ventilat|oxygen|device|pressure|volume|rate|peep|equipment|needle|catheter|drain|site|position|decompress|analgesi|fluid|blood|drug|dose|access|resuscitat|transport|call|speak|document|counsel|parent|procedure|diagnos|disposition/iu); } });
});

describe('Neonatal tension pneumothorax tutor and worked example', () => {
  const start = { supportAtTick: null, contextAtTick: null, recognitionAtTick: null, readinessAtTick: null, reassessmentAtTick: null, handoffAtTick: null };
  const connected = { ...start, supportAtTick: 0, contextAtTick: 1 };

  it('says nothing at all on the unassisted setting', () => {
    expect(markup(start)).not.toContain('A moment to think');
    expect(markup(start, { neonatologyTensionPneumothoraxGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner\u2019s own recorded steps when guidance is on', () => {
    const opening = markup(start, { neonatologyTensionPneumothoraxGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('Confirm a team that can decompress');
    const next = markup(connected, { neonatologyTensionPneumothoraxGuidance: 'guided' });
    expect(next).toContain('Record this as a suspected pattern');
    expect(next).not.toContain('Confirm a team that can decompress');
  });

  it('keeps the alternatives open while it presses for action', () => {
    const html = markup(connected, { neonatologyTensionPneumothoraxGuidance: 'guided' });
    expect(html).toContain('stay open');
    expect(html).toContain('wait for a film');
    expect(html).not.toContain('confirmed tension pneumothorax');
  });

  it('goes quiet once the handoff is recorded', () => {
    const ended = { supportAtTick: 0, contextAtTick: 1, recognitionAtTick: 2, readinessAtTick: 3, reassessmentAtTick: 4, handoffAtTick: 5 };
    expect(markup(ended, { neonatologyTensionPneumothoraxGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = 'Confirm prepared support';
    expect(markup(start)).toContain(label);
    const watching = markup(start, { neonatologyTensionPneumothoraxGuidance: 'guided', neonatologyTensionPneumothoraxDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
