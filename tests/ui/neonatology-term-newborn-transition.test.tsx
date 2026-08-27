import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PrerenderedBody } from '@routes/Prerendered';
import { Prebrief } from '@anesthesia/ui/Prebrief';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { TERM_NEWBORN_TRANSITION as SCENARIO } from '../../src/modules/neonatology/scenarios/term-newborn-transition';

const markup = (assessment: NonNullable<ActionCockpitProps['resuscitation']['neonatologyTermTransitionAssessment']>) => renderToStaticMarkup(createElement(ActionCockpit, { scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false }, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, neonatologyTermTransitionAssessment: assessment }, lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 24, respiratoryRateBpm: 42, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 2 }, intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {}, onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {}, onNeonatologyTermTransitionResponse: () => {} } satisfies ActionCockpitProps));

describe('Neonatology term-newborn-transition experience', () => {
  it('mounts a calm module, exact route, and newborn-dyad prebrief', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/neonatology' }));
    expect(index).toContain('<h1>Neonatology simulator</h1>');
    expect(index).toContain('href="/neonatology" aria-current="page"');
    expect(index).toContain('href="/neonatology/scenario/term-newborn-transition"');
    expect(index).toContain('Term newborn transition: protect the quiet start');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/neonatology/scenario/term-newborn-transition' }));
    expect(route).toContain('<h1>Term newborn transition: protect the quiet start</h1>');
    const prebrief = renderToStaticMarkup(createElement(Prebrief, { scenario: SCENARIO, region: UNITED_STATES, environment: 'neonatology', guidance: 'coached', onGuidance: () => {}, onStart: () => {} }));
    expect(prebrief).toContain('newborn findings, parent-dyad context');
  });

  it('fails closed and exposes one calm cognitive action at a time', () => {
    expect(crisisResponseAvailability(SCENARIO).hasNeonatologyTermTransitionResponse).toBe(true);
    expect(crisisResponseAvailability({ ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) }).hasNeonatologyTermTransitionResponse).toBe(false);
    const states = [{ supportAtTick: null, contextAtTick: null, recognitionAtTick: null, careAtTick: null, reassessmentAtTick: null, handoffAtTick: null }, { supportAtTick: 1, contextAtTick: null, recognitionAtTick: null, careAtTick: null, reassessmentAtTick: null, handoffAtTick: null }, { supportAtTick: 1, contextAtTick: 1, recognitionAtTick: null, careAtTick: null, reassessmentAtTick: null, handoffAtTick: null }, { supportAtTick: 1, contextAtTick: 1, recognitionAtTick: 1, careAtTick: null, reassessmentAtTick: null, handoffAtTick: null }, { supportAtTick: 1, contextAtTick: 1, recognitionAtTick: 1, careAtTick: 1, reassessmentAtTick: null, handoffAtTick: null }, { supportAtTick: 1, contextAtTick: 1, recognitionAtTick: 1, careAtTick: 1, reassessmentAtTick: 2, handoffAtTick: null }, { supportAtTick: 1, contextAtTick: 1, recognitionAtTick: 1, careAtTick: 1, reassessmentAtTick: 2, handoffAtTick: 3 }];
    expect(states.map((state) => (markup(state).match(/<button/g) ?? []).length)).toEqual([1,1,1,1,1,1,0]);
    expect(markup(states[0]!)).toContain('Protect the quiet start. Keep the dyad together.');
    const later = markup(states[4]!); expect(later).toContain('A smooth first hour is a checkpoint, not a promise.'); expect(later).toContain('Review the fixed 1-hour report'); expect((later.match(/role="status"/g) ?? [])).toHaveLength(1);
    for (const html of states.map(markup)) { const buttons = [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)].map((match) => match[1]); expect(buttons.join(' ')).not.toMatch(/examin|score|monitor|clamp|position|dry|warm|suction|stimulat|separat|oxygen|ventilat|airway|compress|access|fluid|glucose|drug|dose|feed|resuscitat|transport|procedure|disposition/iu); }
  });
});
