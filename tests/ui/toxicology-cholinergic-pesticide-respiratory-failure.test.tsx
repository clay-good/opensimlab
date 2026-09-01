import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PrerenderedBody } from '@routes/Prerendered';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { CHOLINERGIC_PESTICIDE_RESPIRATORY_FAILURE as SCENARIO } from '../../src/modules/toxicology/scenarios/cholinergic-pesticide-respiratory-failure';
const markup = (assessment: NonNullable<ActionCockpitProps['resuscitation']['toxicologyCholinergicAssessment']>, extra: {
  toxicologyCholinergicGuidance?: ActionCockpitProps['toxicologyCholinergicGuidance'];
  toxicologyCholinergicDemonstrating?: boolean;
} = {}) => renderToStaticMarkup(createElement(ActionCockpit, { scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false }, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, toxicologyCholinergicAssessment: assessment }, lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 450, respiratoryRateBpm: 10, fio2: 1, peep: 0, delivering: true, sevofluranePercent: 0, freshGasFlowLPerMin: 10 }, intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {}, onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {}, onToxicologyCholinergicResponse: () => {}, ...extra } satisfies ActionCockpitProps));

const EMPTY = { trajectoryAtTick: null, recognitionAtTick: null, safetyAtTick: null, evidenceAtTick: null, reassessmentAtTick: null, handoffAtTick: null };
const LABELS = ['Connect exposure + breathing', 'Recognize the whole pattern', 'Protect patient + team', 'Review lungs + strength', 'Record rescue intent + reassess', 'Hand off what can return'];
const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Toxicology cholinergic experience', () => {
  it('is discoverable at its exact calm route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/toxicology' }));
    expect(index).toContain('href="/toxicology/scenario/cholinergic-pesticide-respiratory-failure"');
    expect(index).toContain('Cholinergic poisoning: protect the team, then clear the air');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/toxicology/scenario/cholinergic-pesticide-respiratory-failure' }));
    expect(route).toContain('<h1>Cholinergic poisoning: protect the team, then clear the air</h1>');
  });

  it('fails closed and exposes one calm cognitive action at a time', () => {
    expect(crisisResponseAvailability(SCENARIO).hasToxicologyCholinergicResponse).toBe(true);
    expect(crisisResponseAvailability({ ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) }).hasToxicologyCholinergicResponse).toBe(false);
    const states = [EMPTY,
      { ...EMPTY, trajectoryAtTick: 0 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1, safetyAtTick: 2 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1, safetyAtTick: 2, evidenceAtTick: 3 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1, safetyAtTick: 2, evidenceAtTick: 3, reassessmentAtTick: 4 },
      { trajectoryAtTick: 0, recognitionAtTick: 1, safetyAtTick: 2, evidenceAtTick: 3, reassessmentAtTick: 4, handoffAtTick: 5 }];
    expect(states.map((state) => lessonButtons(markup(state)).length)).toEqual([1, 1, 1, 1, 1, 1, 0]);
    expect(markup(states[0]!)).toContain('Protect the rescuers before the first touch.');
    const later = markup(states[4]!);
    expect(later).toContain('Dryer lungs do not prove stronger muscles.');
    expect(later).toContain('Record qualified intent after time passes.');
    expect(markup(states[5]!)).toContain('Durable ventilation and treatment effect remain unproven.');
    for (const html of states.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/history|examin|auscultat|sample|acquire|calculat|atropine|pralidoxime|benzodiazep|succinyl|blocker|irrigat|wash|glove|intubat|ventilat|oxygen|suction|device|dose|route|drug|infusion|access|fluid|procedure|diagnos|disposition|discharge|prognos/iu);
    }
  });
});

describe('Cholinergic tutor and worked example', () => {
  const named = { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1 };

  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { toxicologyCholinergicGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { toxicologyCholinergicGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('Say that he is still wearing it, in the same breath as the saturation');
    const next = markup(named, { toxicologyCholinergicGuidance: 'guided' });
    expect(next).toContain('Protect the room before you treat the man in it');
    expect(next).not.toContain('Say that he is still wearing it, in the same breath as the saturation');
  });

  it('refuses the mnemonic and the cholinesterase report', () => {
    const html = markup({ ...EMPTY, trajectoryAtTick: 0 }, { toxicologyCholinergicGuidance: 'guided' });
    expect(html).toContain('they are not what kills him');
    expect(html).toContain('marks the exposure rather than grading him');
  });

  it('goes quiet once the handoff is recorded', () => {
    const ended = { trajectoryAtTick: 0, recognitionAtTick: 1, safetyAtTick: 2, evidenceAtTick: 3, reassessmentAtTick: 4, handoffAtTick: 5 };
    expect(markup(ended, { toxicologyCholinergicGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = 'Connect exposure + breathing';
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { toxicologyCholinergicGuidance: 'guided', toxicologyCholinergicDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
