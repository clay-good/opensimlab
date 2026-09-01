import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PrerenderedBody } from '@routes/Prerendered';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { SYMPATHOMIMETIC_HYPERADRENERGIC_HYPERTHERMIA as SCENARIO } from '../../src/modules/toxicology/scenarios/sympathomimetic-hyperadrenergic-hyperthermia';
const markup = (assessment: NonNullable<ActionCockpitProps['resuscitation']['toxicologySympathomimeticAssessment']>, extra: {
  toxicologySympathomimeticGuidance?: ActionCockpitProps['toxicologySympathomimeticGuidance'];
  toxicologySympathomimeticDemonstrating?: boolean;
} = {}) => renderToStaticMarkup(createElement(ActionCockpit, { scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false }, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, toxicologySympathomimeticAssessment: assessment }, lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 450, respiratoryRateBpm: 10, fio2: 1, peep: 0, delivering: true, sevofluranePercent: 0, freshGasFlowLPerMin: 10 }, intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {}, onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {}, onToxicologySympathomimeticResponse: () => {}, ...extra } satisfies ActionCockpitProps));

const EMPTY = { trajectoryAtTick: null, recognitionAtTick: null, supportAtTick: null, evidenceAtTick: null, reassessmentAtTick: null, handoffAtTick: null };
const LABELS = ['Connect exposure + surge', 'Recognize the whole pattern', 'Make the room safer', 'Review surge + hidden harm', 'Record calming intent + reassess', 'Hand off what can rebound'];
const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Toxicology sympathomimetic experience', () => {
  it('is discoverable at its exact calm route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/toxicology' }));
    expect(index).toContain('href="/toxicology/scenario/sympathomimetic-hyperadrenergic-hyperthermia"');
    expect(index).toContain('Sympathomimetic toxicity: calm the surge, protect the person');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/toxicology/scenario/sympathomimetic-hyperadrenergic-hyperthermia' }));
    expect(route).toContain('<h1>Sympathomimetic toxicity: calm the surge, protect the person</h1>');
  });

  it('fails closed and exposes one calm cognitive action at a time', () => {
    expect(crisisResponseAvailability(SCENARIO).hasToxicologySympathomimeticResponse).toBe(true);
    expect(crisisResponseAvailability({ ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) }).hasToxicologySympathomimeticResponse).toBe(false);
    const states = [EMPTY,
      { ...EMPTY, trajectoryAtTick: 0 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1, supportAtTick: 2 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1, supportAtTick: 2, evidenceAtTick: 3 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1, supportAtTick: 2, evidenceAtTick: 3, reassessmentAtTick: 4 },
      { trajectoryAtTick: 0, recognitionAtTick: 1, supportAtTick: 2, evidenceAtTick: 3, reassessmentAtTick: 4, handoffAtTick: 5 }];
    expect(states.map((state) => lessonButtons(markup(state)).length)).toEqual([1, 1, 1, 1, 1, 1, 0]);
    expect(markup(states[0]!)).toContain('Lower the heat. Lower the threat.');
    const later = markup(states[4]!);
    expect(later).toContain('Calmer is safer. It is not the same as safe.');
    expect(later).toContain('Record qualified intent after time passes.');
    expect(markup(states[5]!)).toContain('psychiatric safety, and treatment effect remain unproven.');
    for (const html of states.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/history|examin|auscultat|sample|acquire|calculat|measure|midazolam|sedativ|restrain|nitro|labetalol|ice|intubat|ventilat|oxygen|device|dose|route|drug|infusion|access|fluid|procedure|diagnos|exclude|disposition|discharge|prognos/iu);
    }
  });
});

describe('Sympathomimetic tutor and worked example', () => {
  const named = { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1 };

  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { toxicologySympathomimeticGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { toxicologySympathomimeticGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('Say what is driving all of it');
    const next = markup(named, { toxicologySympathomimeticGuidance: 'guided' });
    expect(next).toContain('Make the room calmer and cooler in the same beat');
    expect(next).not.toContain('Say what is driving all of it');
  });

  it('refuses the five early closures', () => {
    const html = markup({ ...EMPTY, trajectoryAtTick: 0 }, { toxicologySympathomimeticGuidance: 'guided' });
    expect(html).toContain('no toxicology screen, pupil, pressure, temperature, pulse or behavior');
    expect(html).toContain('they exclude nothing on their own');
  });

  it('goes quiet once the handoff is recorded', () => {
    const ended = { trajectoryAtTick: 0, recognitionAtTick: 1, supportAtTick: 2, evidenceAtTick: 3, reassessmentAtTick: 4, handoffAtTick: 5 };
    expect(markup(ended, { toxicologySympathomimeticGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = 'Connect exposure + surge';
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { toxicologySympathomimeticGuidance: 'guided', toxicologySympathomimeticDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
