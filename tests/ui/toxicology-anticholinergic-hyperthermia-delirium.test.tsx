import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PrerenderedBody } from '@routes/Prerendered';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { ANTICHOLINERGIC_HYPERTHERMIA_DELIRIUM as SCENARIO } from '../../src/modules/toxicology/scenarios/anticholinergic-hyperthermia-delirium';
const markup = (assessment: NonNullable<ActionCockpitProps['resuscitation']['toxicologyAnticholinergicAssessment']>, extra: {
  toxicologyAnticholinergicGuidance?: ActionCockpitProps['toxicologyAnticholinergicGuidance'];
  toxicologyAnticholinergicDemonstrating?: boolean;
} = {}) => renderToStaticMarkup(createElement(ActionCockpit, { scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false }, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, toxicologyAnticholinergicAssessment: assessment }, lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 450, respiratoryRateBpm: 10, fio2: 1, peep: 0, delivering: true, sevofluranePercent: 0, freshGasFlowLPerMin: 10 }, intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {}, onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {}, onToxicologyAnticholinergicResponse: () => {}, ...extra } satisfies ActionCockpitProps));

const EMPTY = { trajectoryAtTick: null, recognitionAtTick: null, supportAtTick: null, evidenceAtTick: null, reassessmentAtTick: null, handoffAtTick: null };
const LABELS = ['Connect heat + delirium', 'Recognize the whole pattern', 'Build a calm rescue circle', 'Review heat + hidden harm', 'Record support intent + reassess', 'Hand off what can rebound'];
const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Toxicology anticholinergic experience', () => {
  it('is discoverable at its exact calm route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/toxicology' }));
    expect(index).toContain('href="/toxicology/scenario/anticholinergic-hyperthermia-delirium"');
    expect(index).toContain('Anticholinergic poisoning: cool the patient, not the clues');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/toxicology/scenario/anticholinergic-hyperthermia-delirium' }));
    expect(route).toContain('<h1>Anticholinergic poisoning: cool the patient, not the clues</h1>');
  });

  it('fails closed and exposes one calm cognitive action at a time', () => {
    expect(crisisResponseAvailability(SCENARIO).hasToxicologyAnticholinergicResponse).toBe(true);
    expect(crisisResponseAvailability({ ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) }).hasToxicologyAnticholinergicResponse).toBe(false);
    const states = [EMPTY,
      { ...EMPTY, trajectoryAtTick: 0 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1, supportAtTick: 2 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1, supportAtTick: 2, evidenceAtTick: 3 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1, supportAtTick: 2, evidenceAtTick: 3, reassessmentAtTick: 4 },
      { trajectoryAtTick: 0, recognitionAtTick: 1, supportAtTick: 2, evidenceAtTick: 3, reassessmentAtTick: 4, handoffAtTick: 5 }];
    expect(states.map((state) => lessonButtons(markup(state)).length)).toEqual([1, 1, 1, 1, 1, 1, 0]);
    expect(markup(states[0]!)).toContain('Cool the patient. Keep the differential warm.');
    const later = markup(states[4]!);
    expect(later).toContain('A cooler number does not close the case.');
    expect(later).toContain('Record qualified intent after time passes.');
    expect(markup(states[5]!)).toContain('Durable cooling and treatment effect remain unproven.');
    for (const html of states.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/history|examin|auscultat|sample|acquire|calculat|measure|physostigmine|sedativ|lorazepam|restrain|catheter|ice|intubat|ventilat|oxygen|device|dose|route|drug|infusion|access|fluid|procedure|diagnos|exclude|disposition|discharge|prognos/iu);
    }
  });
});

describe('Anticholinergic tutor and worked example', () => {
  const named = { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1 };

  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { toxicologyAnticholinergicGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { toxicologyAnticholinergicGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('Say the temperature first');
    const next = markup(named, { toxicologyAnticholinergicGuidance: 'guided' });
    expect(next).toContain('Give the cooling an owner before you give the diagnosis any more attention');
    expect(next).not.toContain('Say the temperature first');
  });

  it('refuses the four early closures', () => {
    const html = markup({ ...EMPTY, trajectoryAtTick: 0 }, { toxicologyAnticholinergicGuidance: 'guided' });
    expect(html).toContain('no single mnemonic, temperature, pupil or dry surface');
    expect(html).toContain('it excludes nothing on its own');
  });

  it('goes quiet once the handoff is recorded', () => {
    const ended = { trajectoryAtTick: 0, recognitionAtTick: 1, supportAtTick: 2, evidenceAtTick: 3, reassessmentAtTick: 4, handoffAtTick: 5 };
    expect(markup(ended, { toxicologyAnticholinergicGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = 'Connect heat + delirium';
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { toxicologyAnticholinergicGuidance: 'guided', toxicologyAnticholinergicDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
