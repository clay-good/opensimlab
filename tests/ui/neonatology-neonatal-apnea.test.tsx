import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PrerenderedBody } from '@routes/Prerendered';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { NEONATAL_APNEA as SCENARIO } from '../../src/modules/neonatology/scenarios/neonatal-apnea';
const markup = (assessment: NonNullable<ActionCockpitProps['resuscitation']['neonatologyApneaAssessment']>, extra: {
  neonatologyApneaGuidance?: ActionCockpitProps['neonatologyApneaGuidance'];
  neonatologyApneaDemonstrating?: boolean;
} = {}) => renderToStaticMarkup(createElement(ActionCockpit, { scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false }, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, neonatologyApneaAssessment: assessment }, lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 25, respiratoryRateBpm: 40, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 2 }, intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {}, onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {}, onNeonatologyApneaResponse: () => {}, ...extra } satisfies ActionCockpitProps));
describe('Neonatology neonatal-apnea experience', () => {
  it('is discoverable at its exact calm route', () => { const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/neonatology' })); expect(index).toContain('href="/neonatology/scenario/neonatal-apnea"'); expect(index).toContain('Neonatal apnea: ventilation is the priority'); const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/neonatology/scenario/neonatal-apnea' })); expect(route).toContain('<h1>Neonatal apnea: ventilation is the priority</h1>'); });
  it('fails closed and exposes one calm cognitive action at a time', () => { expect(crisisResponseAvailability(SCENARIO).hasNeonatologyApneaResponse).toBe(true); expect(crisisResponseAvailability({ ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) }).hasNeonatologyApneaResponse).toBe(false); const states = [{ supportAtTick: null, contextAtTick: null, recognitionAtTick: null, readinessAtTick: null, reassessmentAtTick: null, handoffAtTick: null }, { supportAtTick: 1, contextAtTick: null, recognitionAtTick: null, readinessAtTick: null, reassessmentAtTick: null, handoffAtTick: null }, { supportAtTick: 1, contextAtTick: 1, recognitionAtTick: null, readinessAtTick: null, reassessmentAtTick: null, handoffAtTick: null }, { supportAtTick: 1, contextAtTick: 1, recognitionAtTick: 1, readinessAtTick: null, reassessmentAtTick: null, handoffAtTick: null }, { supportAtTick: 1, contextAtTick: 1, recognitionAtTick: 1, readinessAtTick: 1, reassessmentAtTick: null, handoffAtTick: null }, { supportAtTick: 1, contextAtTick: 1, recognitionAtTick: 1, readinessAtTick: 1, reassessmentAtTick: 2, handoffAtTick: null }, { supportAtTick: 1, contextAtTick: 1, recognitionAtTick: 1, readinessAtTick: 1, reassessmentAtTick: 2, handoffAtTick: 3 }]; expect(states.map((state) => (markup(state).match(/<button/g) ?? []).length)).toEqual([1,1,1,1,1,1,0]); expect(markup(states[0]!)).toContain('Make breathing effective. Watch the heart rate answer.'); const later = markup(states[4]!); expect(later).toContain('A rising heart rate is the first answer, not the last word.'); expect(later).toContain('Review the fixed 90-second report'); expect((later.match(/role="status"/g) ?? [])).toHaveLength(1); for (const html of states.map((state) => markup(state))) { const buttons = [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)].map((match) => match[1]); expect(buttons.join(' ')).not.toMatch(/examin|score|monitor|position|dry|warm|suction|stimulat|separat|oxygen|ventilat|airway|correct|compress|access|fluid|glucose|drug|dose|feed|resuscitat|transport|procedure|disposition/iu); } });
});

describe('Neonatal apnea tutor and worked example', () => {
  const start = { supportAtTick: null, contextAtTick: null, recognitionAtTick: null, readinessAtTick: null, reassessmentAtTick: null, handoffAtTick: null };
  const connected = { ...start, supportAtTick: 0, contextAtTick: 1 };

  it('says nothing at all on the unassisted setting', () => {
    expect(markup(start)).not.toContain('A moment to think');
    expect(markup(start, { neonatologyApneaGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner\u2019s own recorded steps when guidance is on', () => {
    const opening = markup(start, { neonatologyApneaGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('Name who owns the ventilation');
    const next = markup(connected, { neonatologyApneaGuidance: 'guided' });
    expect(next).toContain('Let the threshold decide');
    expect(next).not.toContain('Name who owns the ventilation');
  });

  it('keeps the cause open while it presses for ventilation', () => {
    const html = markup(connected, { neonatologyApneaGuidance: 'guided' });
    expect(html).toContain('stays open');
    expect(html).toContain('none of it changes what comes first');
    expect(html).not.toContain('he has recovered');
  });

  it('goes quiet once the handoff is recorded', () => {
    const ended = { supportAtTick: 0, contextAtTick: 1, recognitionAtTick: 2, readinessAtTick: 3, reassessmentAtTick: 4, handoffAtTick: 5 };
    expect(markup(ended, { neonatologyApneaGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = 'Activate qualified response';
    expect(markup(start)).toContain(label);
    const watching = markup(start, { neonatologyApneaGuidance: 'guided', neonatologyApneaDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
