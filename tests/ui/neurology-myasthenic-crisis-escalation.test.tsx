import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PrerenderedBody } from '@routes/Prerendered';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { MYASTHENIC_CRISIS_ESCALATION as SCENARIO } from '../../src/modules/neurology/scenarios/myasthenic-crisis-escalation';
const markup = (assessment: NonNullable<ActionCockpitProps['resuscitation']['neurologyMyasthenicCrisisAssessment']>, extra: {
  neurologyMyastheniaGuidance?: ActionCockpitProps['neurologyMyastheniaGuidance'];
  neurologyMyastheniaDemonstrating?: boolean;
} = {}) => renderToStaticMarkup(createElement(ActionCockpit, { scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false }, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, neurologyMyasthenicCrisisAssessment: assessment }, lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 450, respiratoryRateBpm: 10, fio2: 1, peep: 0, delivering: true, sevofluranePercent: 0, freshGasFlowLPerMin: 10 }, intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {}, onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {}, onNeurologyMyasthenicCrisisResponse: () => {}, ...extra } satisfies ActionCockpitProps));

const EMPTY = { trajectoryAtTick: null, recognitionAtTick: null, ownershipAtTick: null, causesAtTick: null, laterAtTick: null, handoffAtTick: null };
const LABELS = ['Review rapid weakness trajectory', 'Recognize impending crisis', 'Activate airway-ready ownership', 'Review safety + open causes', 'Review the minute-30 crisis report', 'Hand off crisis + open risk'];
const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Neurology myasthenic-crisis experience', () => {
  it('is discoverable at its exact calm route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/neurology' }));
    expect(index).toContain('href="/neurology/scenario/myasthenic-crisis-escalation"');
    expect(index).toContain('Myasthenic crisis escalation');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/neurology/scenario/myasthenic-crisis-escalation' }));
    expect(route).toContain('<h1>Myasthenic crisis escalation</h1>');
  });

  it('fails closed and exposes one calm cognitive action at a time', () => {
    expect(crisisResponseAvailability(SCENARIO).hasNeurologyMyasthenicCrisisResponse).toBe(true);
    expect(crisisResponseAvailability({ ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) }).hasNeurologyMyasthenicCrisisResponse).toBe(false);
    const states = [EMPTY,
      { ...EMPTY, trajectoryAtTick: 0 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1, ownershipAtTick: 2 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1, ownershipAtTick: 2, causesAtTick: 3 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1, ownershipAtTick: 2, causesAtTick: 3, laterAtTick: 4 },
      { trajectoryAtTick: 0, recognitionAtTick: 1, ownershipAtTick: 2, causesAtTick: 3, laterAtTick: 4, handoffAtTick: 5 }];
    expect(states.map((state) => lessonButtons(markup(state)).length)).toEqual([1, 1, 1, 1, 1, 1, 0]);
    expect(markup(states[0]!)).toContain('Watch work, not just oxygen.');
    const later = markup(states[4]!);
    expect(later).toContain('Crisis is a clinical transition.');
    expect(later).toContain('Qualified ownership is active. Review the fixed later bulbar and respiratory report.');
    expect(markup(states[5]!)).toContain('establishes the authored manifest-crisis transition');
    for (const html of states.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/history|examin|auscultat|sample|acquire|calculat|measure|spirometr|vital capacity|blood gas|pyridostigmine|immunoglobulin|plasma exchange|bipap|intubat|anesthe|sedat|dose|route|drug|infusion|oxygen|ventilat|prescri|procedure|diagnos|exclude|disposition|discharge|prognos/iu);
    }
  });
});

describe('Myasthenic-crisis tutor and worked example', () => {
  const named = { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1 };

  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { neurologyMyastheniaGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { neurologyMyastheniaGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('Read the direction of travel');
    const next = markup(named, { neurologyMyastheniaGuidance: 'guided' });
    expect(next).toContain('Get neurology, neurocritical care, respiratory');
    expect(next).not.toContain('Read the direction of travel');
  });

  it('refuses the saturation and the single cutoff', () => {
    const html = markup({ ...EMPTY, trajectoryAtTick: 0 }, { neurologyMyastheniaGuidance: 'guided' });
    expect(html).toContain('hypercapnia here is a late sign');
    expect(html).toContain('is a universal threshold');
  });

  it('goes quiet once the handoff is recorded', () => {
    const ended = { trajectoryAtTick: 0, recognitionAtTick: 1, ownershipAtTick: 2, causesAtTick: 3, laterAtTick: 4, handoffAtTick: 5 };
    expect(markup(ended, { neurologyMyastheniaGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = 'Review rapid weakness trajectory';
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { neurologyMyastheniaGuidance: 'guided', neurologyMyastheniaDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
