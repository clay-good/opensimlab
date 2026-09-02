import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PrerenderedBody } from '@routes/Prerendered';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { SPONTANEOUS_CEREBELLAR_INTRACEREBRAL_HEMORRHAGE as SCENARIO } from '../../src/modules/neurology/scenarios/spontaneous-cerebellar-intracerebral-hemorrhage';
const markup = (assessment: NonNullable<ActionCockpitProps['resuscitation']['neurologyCerebellarIchAssessment']>, extra: {
  neurologyCerebellarIchGuidance?: ActionCockpitProps['neurologyCerebellarIchGuidance'];
  neurologyCerebellarIchDemonstrating?: boolean;
} = {}) => renderToStaticMarkup(createElement(ActionCockpit, { scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false }, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, neurologyCerebellarIchAssessment: assessment }, lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 450, respiratoryRateBpm: 10, fio2: 1, peep: 0, delivering: true, sevofluranePercent: 0, freshGasFlowLPerMin: 10 }, intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {}, onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {}, onNeurologyCerebellarIchResponse: () => {}, ...extra } satisfies ActionCockpitProps));

const EMPTY = { trajectoryAtTick: null, imagingAtTick: null, boundaryAtTick: null, ownershipAtTick: null, laterAtTick: null, handoffAtTick: null };
const LABELS = ['Review clock + neurologic trajectory', 'Review fixed CT + threat context', 'Recognize posterior-fossa escalation', 'Activate qualified neuro + airway ownership', 'Review the later neurologic report', 'Hand off imaging + active risk'];
const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Neurology cerebellar-hemorrhage experience', () => {
  it('is discoverable at its exact calm route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/neurology' }));
    expect(index).toContain('href="/neurology/scenario/spontaneous-cerebellar-intracerebral-hemorrhage"');
    expect(index).toContain('Spontaneous cerebellar ICH escalation');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/neurology/scenario/spontaneous-cerebellar-intracerebral-hemorrhage' }));
    expect(route).toContain('<h1>Spontaneous cerebellar ICH escalation</h1>');
  });

  it('fails closed and exposes one calm cognitive action at a time', () => {
    expect(crisisResponseAvailability(SCENARIO).hasNeurologyCerebellarIchResponse).toBe(true);
    expect(crisisResponseAvailability({ ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) }).hasNeurologyCerebellarIchResponse).toBe(false);
    const states = [EMPTY,
      { ...EMPTY, trajectoryAtTick: 0 },
      { ...EMPTY, trajectoryAtTick: 0, imagingAtTick: 1 },
      { ...EMPTY, trajectoryAtTick: 0, imagingAtTick: 1, boundaryAtTick: 2 },
      { ...EMPTY, trajectoryAtTick: 0, imagingAtTick: 1, boundaryAtTick: 2, ownershipAtTick: 3 },
      { ...EMPTY, trajectoryAtTick: 0, imagingAtTick: 1, boundaryAtTick: 2, ownershipAtTick: 3, laterAtTick: 4 },
      { trajectoryAtTick: 0, imagingAtTick: 1, boundaryAtTick: 2, ownershipAtTick: 3, laterAtTick: 4, handoffAtTick: 5 }];
    expect(states.map((state) => lessonButtons(markup(state)).length)).toEqual([1, 1, 1, 1, 1, 1, 0]);
    expect(markup(states[0]!)).toContain('Location changes the danger.');
    const later = markup(states[4]!);
    expect(later).toContain('Stability is only a checkpoint.');
    expect(later).toContain('Qualified ownership is active. Review the fixed later report.');
    expect(markup(states[5]!)).toContain('Repeat CT reports expansion, hydrocephalus, and brainstem compression.');
    for (const html of states.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/history|examin|auscultat|sample|acquire|calculat|volume|millilitre|score|measure|andexanet|reversal|mannitol|hypertonic|drain|craniect|surger|intubat|anesthe|sedat|dose|route|drug|infusion|prescri|procedure|diagnos|exclude|disposition|discharge|prognos/iu);
    }
  });
});

describe('Cerebellar-hemorrhage tutor and worked example', () => {
  const named = { ...EMPTY, trajectoryAtTick: 0, imagingAtTick: 1 };

  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { neurologyCerebellarIchGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { neurologyCerebellarIchGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('Say that she is fully alert and cannot sit up');
    const next = markup(named, { neurologyCerebellarIchGuidance: 'guided' });
    expect(next).toContain('Name the escalation boundary now, while she still looks well');
    expect(next).not.toContain('Say that she is fully alert and cannot sit up');
  });

  it('makes the scan rather than the syndrome decide what this is', () => {
    const html = markup({ ...EMPTY, trajectoryAtTick: 0 }, { neurologyCerebellarIchGuidance: 'guided' });
    expect(html).toContain('blood changes who is called');
    expect(html).toContain('the fourth ventricle is already effaced');
  });

  it('goes quiet once the handoff is recorded', () => {
    const ended = { trajectoryAtTick: 0, imagingAtTick: 1, boundaryAtTick: 2, ownershipAtTick: 3, laterAtTick: 4, handoffAtTick: 5 };
    expect(markup(ended, { neurologyCerebellarIchGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = 'Review clock + neurologic trajectory';
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { neurologyCerebellarIchGuidance: 'guided', neurologyCerebellarIchDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
