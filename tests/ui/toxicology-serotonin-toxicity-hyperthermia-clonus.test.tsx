import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PrerenderedBody } from '@routes/Prerendered';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { TOXICOLOGY_TRAYS } from '../../src/modules/toxicology/trays';
// The lesson trays moved to the module, so the gate now needs them supplied.
const crisisResponseAvailabilityWithTrays = (
  scenario: Parameters<typeof crisisResponseAvailability>[0],
  injected: Parameters<typeof crisisResponseAvailability>[1] = [],
) => crisisResponseAvailability(scenario, injected, TOXICOLOGY_TRAYS);
import { SEROTONIN_TOXICITY_HYPERTHERMIA_CLONUS as SCENARIO } from '../../src/modules/toxicology/scenarios/serotonin-toxicity-hyperthermia-clonus';
const markup = (assessment: NonNullable<ActionCockpitProps['resuscitation']['toxicologySerotoninAssessment']>, extra: {
  guidance?: ActionCockpitProps['guidance'];
  demonstratingLessonId?: string | undefined;
} = {}) => renderToStaticMarkup(createElement(ActionCockpit, { scenario: SCENARIO, region: UNITED_STATES, lessonTrays: TOXICOLOGY_TRAYS, infusions: [], hypnoticLine: { connected: true, inspected: false }, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, toxicologySerotoninAssessment: assessment }, lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 450, respiratoryRateBpm: 10, fio2: 1, peep: 0, delivering: true, sevofluranePercent: 0, freshGasFlowLPerMin: 10 }, intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {}, onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {}, onLessonAction: () => {}, ...extra } satisfies ActionCockpitProps));

const EMPTY = { trajectoryAtTick: null, recognitionAtTick: null, supportAtTick: null, evidenceAtTick: null, reassessmentAtTick: null, handoffAtTick: null };
const LABELS = ['Connect interaction + pattern', 'Recognize the whole pattern', 'Build a calm rescue circle', 'Review clonus + hidden harm', 'Record rescue intent + reassess', 'Hand off what can rebound'];
const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Toxicology serotonin experience', () => {
  it('is discoverable at its exact calm route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/toxicology' }));
    expect(index).toContain('href="/toxicology/scenario/serotonin-toxicity-hyperthermia-clonus"');
    expect(index).toContain('Serotonin toxicity: cool the heat, follow the clonus');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/toxicology/scenario/serotonin-toxicity-hyperthermia-clonus' }));
    expect(route).toContain('<h1>Serotonin toxicity: cool the heat, follow the clonus</h1>');
  });

  it('fails closed and exposes one calm cognitive action at a time', () => {
    expect(crisisResponseAvailabilityWithTrays(SCENARIO).hasToxicologySerotoninResponse).toBe(true);
    expect(crisisResponseAvailabilityWithTrays({ ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) }).hasToxicologySerotoninResponse).toBe(false);
    const states = [EMPTY,
      { ...EMPTY, trajectoryAtTick: 0 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1, supportAtTick: 2 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1, supportAtTick: 2, evidenceAtTick: 3 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1, supportAtTick: 2, evidenceAtTick: 3, reassessmentAtTick: 4 },
      { trajectoryAtTick: 0, recognitionAtTick: 1, supportAtTick: 2, evidenceAtTick: 3, reassessmentAtTick: 4, handoffAtTick: 5 }];
    expect(states.map((state) => lessonButtons(markup(state)).length)).toEqual([1, 1, 1, 1, 1, 1, 0]);
    expect(markup(states[0]!)).toContain('Follow the clonus, not just the thermometer.');
    const later = markup(states[4]!);
    expect(later).toContain('Cooler is better. Persistent clonus keeps the story open.');
    expect(later).toContain('Record qualified intent after time passes.');
    expect(markup(states[5]!)).toContain('Durable cooling and neuromuscular recovery remain unproven.');
    for (const html of states.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/history|examin|auscultat|sample|acquire|calculat|measure|cyproheptadine|sedativ|lorazepam|restrain|paralys|ice|intubat|ventilat|oxygen|device|dose|route|drug|infusion|access|fluid|procedure|diagnos|exclude|disposition|discharge|prognos/iu);
    }
  });
});

describe('Serotonin tutor and worked example', () => {
  const named = { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1 };

  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { guidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { guidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('Say the interaction out loud');
    const next = markup(named, { guidance: 'guided' });
    expect(next).toContain('before you give the antagonist a thought');
    expect(next).not.toContain('Say the interaction out loud');
  });

  it('refuses the four early closures', () => {
    const html = markup({ ...EMPTY, trajectoryAtTick: 0 }, { guidance: 'guided' });
    expect(html).toContain('no Hunter rule, clonus finding, temperature, pulse or medication list');
    expect(html).toContain('they exclude nothing on their own');
  });

  it('goes quiet once the handoff is recorded', () => {
    const ended = { trajectoryAtTick: 0, recognitionAtTick: 1, supportAtTick: 2, evidenceAtTick: 3, reassessmentAtTick: 4, handoffAtTick: 5 };
    expect(markup(ended, { guidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = 'Connect interaction + pattern';
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { guidance: 'guided', demonstratingLessonId: 'Serotonin' });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
