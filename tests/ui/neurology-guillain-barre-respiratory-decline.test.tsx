import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PrerenderedBody } from '@routes/Prerendered';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { GUILLAIN_BARRE_RESPIRATORY_DECLINE as SCENARIO } from '../../src/modules/neurology/scenarios/guillain-barre-respiratory-decline';
const markup = (assessment: NonNullable<ActionCockpitProps['resuscitation']['neurologyGbsAssessment']>, extra: {
  neurologyGbsGuidance?: ActionCockpitProps['neurologyGbsGuidance'];
  neurologyGbsDemonstrating?: boolean;
} = {}) => renderToStaticMarkup(createElement(ActionCockpit, { scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false }, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, neurologyGbsAssessment: assessment }, lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 450, respiratoryRateBpm: 10, fio2: 1, peep: 0, delivering: true, sevofluranePercent: 0, freshGasFlowLPerMin: 10 }, intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {}, onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {}, onNeurologyGbsResponse: () => {}, ...extra } satisfies ActionCockpitProps));

const EMPTY = { trajectoryAtTick: null, evidenceAtTick: null, recognitionAtTick: null, ownershipAtTick: null, laterAtTick: null, handoffAtTick: null };
const LABELS = ['Review ascending trajectory', 'Review evidence + mimics', 'Recognize respiratory risk', 'Activate airway + cardiac owners', 'Review the 4-hour decline', 'Hand off airway + autonomic risk'];
const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Neurology Guillain-Barré experience', () => {
  it('is discoverable at its exact calm route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/neurology' }));
    expect(index).toContain('href="/neurology/scenario/guillain-barre-respiratory-decline"');
    expect(index).toContain('Guillain-Barré respiratory decline');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/neurology/scenario/guillain-barre-respiratory-decline' }));
    expect(route).toContain('<h1>Guillain-Barré respiratory decline</h1>');
  });

  it('fails closed and exposes one calm cognitive action at a time', () => {
    expect(crisisResponseAvailability(SCENARIO).hasNeurologyGbsResponse).toBe(true);
    expect(crisisResponseAvailability({ ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) }).hasNeurologyGbsResponse).toBe(false);
    const states = [EMPTY,
      { ...EMPTY, trajectoryAtTick: 0 },
      { ...EMPTY, trajectoryAtTick: 0, evidenceAtTick: 1 },
      { ...EMPTY, trajectoryAtTick: 0, evidenceAtTick: 1, recognitionAtTick: 2 },
      { ...EMPTY, trajectoryAtTick: 0, evidenceAtTick: 1, recognitionAtTick: 2, ownershipAtTick: 3 },
      { ...EMPTY, trajectoryAtTick: 0, evidenceAtTick: 1, recognitionAtTick: 2, ownershipAtTick: 3, laterAtTick: 4 },
      { trajectoryAtTick: 0, evidenceAtTick: 1, recognitionAtTick: 2, ownershipAtTick: 3, laterAtTick: 4, handoffAtTick: 5 }];
    expect(states.map((state) => lessonButtons(markup(state)).length)).toEqual([1, 1, 1, 1, 1, 1, 0]);
    expect(markup(states[0]!)).toContain('Track decline, not saturation.');
    const later = markup(states[4]!);
    expect(later).toContain('Weakness is not just motor.');
    expect(later).toContain('Qualified ownership is active. Review the fixed 4-hour respiratory, bulbar, and autonomic report.');
    expect(markup(states[5]!)).toContain('The authored decline is wider and faster.');
    for (const html of states.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/history|examin|auscultat|sample|acquire|calculat|measure|spirometr|vital capacity|blood gas|lumbar puncture|immunoglobulin|plasma exchange|atropine|pacing|intubat|anesthe|sedat|dose|route|drug|infusion|oxygen|ventilat|prescri|procedure|diagnos|exclude|disposition|discharge|prognos/iu);
    }
  });
});

describe('Guillain-Barré tutor and worked example', () => {
  const named = { ...EMPTY, trajectoryAtTick: 0, evidenceAtTick: 1 };

  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { neurologyGbsGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { neurologyGbsGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('Measure this in days rather than in findings');
    const next = markup(named, { neurologyGbsGuidance: 'guided' });
    expect(next).toContain('Call this a high-risk respiratory decline');
    expect(next).not.toContain('Measure this in days rather than in findings');
  });

  it('names the mimic before the obvious answer closes', () => {
    const html = markup({ ...EMPTY, trajectoryAtTick: 0 }, { neurologyGbsGuidance: 'guided' });
    expect(html).toContain('The mimic that matters is a cord lesion');
    expect(html).toContain('no sensory level, no extensor plantar');
  });

  it('goes quiet once the handoff is recorded', () => {
    const ended = { trajectoryAtTick: 0, evidenceAtTick: 1, recognitionAtTick: 2, ownershipAtTick: 3, laterAtTick: 4, handoffAtTick: 5 };
    expect(markup(ended, { neurologyGbsGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = 'Review ascending trajectory';
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { neurologyGbsGuidance: 'guided', neurologyGbsDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
