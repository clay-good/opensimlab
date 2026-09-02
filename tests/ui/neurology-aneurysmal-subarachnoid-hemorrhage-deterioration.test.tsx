import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PrerenderedBody } from '@routes/Prerendered';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { ANEURYSMAL_SUBARACHNOID_HEMORRHAGE_DETERIORATION as SCENARIO } from '../../src/modules/neurology/scenarios/aneurysmal-subarachnoid-hemorrhage-deterioration';
const markup = (assessment: NonNullable<ActionCockpitProps['resuscitation']['neurologyAsahAssessment']>, extra: {
  neurologyAsahGuidance?: ActionCockpitProps['neurologyAsahGuidance'];
  neurologyAsahDemonstrating?: boolean;
} = {}) => renderToStaticMarkup(createElement(ActionCockpit, { scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false }, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, neurologyAsahAssessment: assessment }, lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 450, respiratoryRateBpm: 10, fio2: 1, peep: 0, delivering: true, sevofluranePercent: 0, freshGasFlowLPerMin: 10 }, intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {}, onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {}, onNeurologyAsahDeteriorationResponse: () => {}, ...extra } satisfies ActionCockpitProps));

const EMPTY = { trajectoryAtTick: null, evidenceAtTick: null, boundaryAtTick: null, ownershipAtTick: null, laterAtTick: null, handoffAtTick: null };
const LABELS = ['Review SAH course + new deficit', 'Review evidence + immediate threats', 'Recognize possible DCI boundary', 'Activate qualified DCI ownership', 'Review the later neurologic report', 'Hand off deficit + open risk'];
const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Neurology delayed-deterioration experience', () => {
  it('is discoverable at its exact calm route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/neurology' }));
    expect(index).toContain('href="/neurology/scenario/aneurysmal-subarachnoid-hemorrhage-deterioration"');
    expect(index).toContain('Aneurysmal SAH delayed deterioration');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/neurology/scenario/aneurysmal-subarachnoid-hemorrhage-deterioration' }));
    expect(route).toContain('<h1>Aneurysmal SAH delayed deterioration</h1>');
  });

  it('fails closed and exposes one calm cognitive action at a time', () => {
    expect(crisisResponseAvailability(SCENARIO).hasNeurologyAsahDeteriorationResponse).toBe(true);
    expect(crisisResponseAvailability({ ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) }).hasNeurologyAsahDeteriorationResponse).toBe(false);
    const states = [EMPTY,
      { ...EMPTY, trajectoryAtTick: 0 },
      { ...EMPTY, trajectoryAtTick: 0, evidenceAtTick: 1 },
      { ...EMPTY, trajectoryAtTick: 0, evidenceAtTick: 1, boundaryAtTick: 2 },
      { ...EMPTY, trajectoryAtTick: 0, evidenceAtTick: 1, boundaryAtTick: 2, ownershipAtTick: 3 },
      { ...EMPTY, trajectoryAtTick: 0, evidenceAtTick: 1, boundaryAtTick: 2, ownershipAtTick: 3, laterAtTick: 4 },
      { trajectoryAtTick: 0, evidenceAtTick: 1, boundaryAtTick: 2, ownershipAtTick: 3, laterAtTick: 4, handoffAtTick: 5 }];
    expect(states.map((state) => lessonButtons(markup(state)).length)).toEqual([1, 1, 1, 1, 1, 1, 0]);
    expect(markup(states[0]!)).toContain('A new deficit reopens the whole story.');
    const later = markup(states[4]!);
    expect(later).toContain('Vasospasm is evidence, not an outcome.');
    expect(later).toContain('Qualified ownership is active. Review the fixed later report.');
    expect(markup(states[5]!)).toContain('Infarction, treatment response, and outcome remain open.');
    for (const html of states.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/history|examin|auscultat|sample|acquire|calculat|score|measure|nimodipine|vasopressor|hypertens|angioplast|intra-arterial|milrinone|bolus|drain|intubat|anesthe|sedat|dose|route|drug|infusion|prescri|procedure|diagnos|exclude|disposition|discharge|prognos/iu);
    }
  });
});

describe('Delayed-deterioration tutor and worked example', () => {
  const named = { ...EMPTY, trajectoryAtTick: 0, evidenceAtTick: 1 };

  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { neurologyAsahGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { neurologyAsahGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('Say the day out loud');
    const next = markup(named, { neurologyAsahGuidance: 'guided' });
    expect(next).toContain('Call it possible delayed cerebral ischemia');
    expect(next).not.toContain('Say the day out loud');
  });

  it('walks the alternatives before landing anywhere', () => {
    const html = markup({ ...EMPTY, trajectoryAtTick: 0 }, { neurologyAsahGuidance: 'guided' });
    expect(html).toContain('rather than assumed away');
    expect(html).toContain('that is this scan, not the next hour');
  });

  it('goes quiet once the handoff is recorded', () => {
    const ended = { trajectoryAtTick: 0, evidenceAtTick: 1, boundaryAtTick: 2, ownershipAtTick: 3, laterAtTick: 4, handoffAtTick: 5 };
    expect(markup(ended, { neurologyAsahGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = 'Review SAH course + new deficit';
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { neurologyAsahGuidance: 'guided', neurologyAsahDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
