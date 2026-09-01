import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PrerenderedBody } from '@routes/Prerendered';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { TRICYCLIC_SODIUM_CHANNEL_CARDIOTOXICITY as SCENARIO } from '../../src/modules/toxicology/scenarios/tricyclic-sodium-channel-cardiotoxicity';
const markup = (assessment: NonNullable<ActionCockpitProps['resuscitation']['toxicologyTricyclicAssessment']>, extra: {
  toxicologyTricyclicGuidance?: ActionCockpitProps['toxicologyTricyclicGuidance'];
  toxicologyTricyclicDemonstrating?: boolean;
} = {}) => renderToStaticMarkup(createElement(ActionCockpit, { scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false }, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, toxicologyTricyclicAssessment: assessment }, lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 450, respiratoryRateBpm: 10, fio2: 1, peep: 0, delivering: true, sevofluranePercent: 0, freshGasFlowLPerMin: 10 }, intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {}, onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {}, onToxicologyTricyclicResponse: () => {}, ...extra } satisfies ActionCockpitProps));

const EMPTY = { trajectoryAtTick: null, recognitionAtTick: null, supportAtTick: null, evidenceAtTick: null, reassessmentAtTick: null, handoffAtTick: null };
const LABELS = ['Connect patient + tracing', 'Recognize the electrical pattern', 'Build the rescue circle', 'Review the coupled risk', 'Record intent + reassess', 'Hand off what can recur'];
const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Toxicology tricyclic experience', () => {
  it('is discoverable at its exact calm route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/toxicology' }));
    expect(index).toContain('href="/toxicology/scenario/tricyclic-sodium-channel-cardiotoxicity"');
    expect(index).toContain('Tricyclic toxicity: read the whole electrical pattern');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/toxicology/scenario/tricyclic-sodium-channel-cardiotoxicity' }));
    expect(route).toContain('<h1>Tricyclic toxicity: read the whole electrical pattern</h1>');
  });

  it('fails closed and exposes one calm cognitive action at a time', () => {
    expect(crisisResponseAvailability(SCENARIO).hasToxicologyTricyclicResponse).toBe(true);
    expect(crisisResponseAvailability({ ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) }).hasToxicologyTricyclicResponse).toBe(false);
    const states = [EMPTY,
      { ...EMPTY, trajectoryAtTick: 0 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1, supportAtTick: 2 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1, supportAtTick: 2, evidenceAtTick: 3 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1, supportAtTick: 2, evidenceAtTick: 3, reassessmentAtTick: 4 },
      { trajectoryAtTick: 0, recognitionAtTick: 1, supportAtTick: 2, evidenceAtTick: 3, reassessmentAtTick: 4, handoffAtTick: 5 }];
    expect(states.map((state) => lessonButtons(markup(state)).length)).toEqual([1, 1, 1, 1, 1, 1, 0]);
    expect(markup(states[0]!)).toContain('The tracing belongs to a whole patient.');
    const later = markup(states[4]!);
    expect(later).toContain('A narrower tracing is a checkpoint, not an all-clear.');
    expect(later).toContain('Record qualified intent after time passes.');
    expect(markup(states[5]!)).toContain('Durable stability and treatment effect remain unproven.');
    for (const html of states.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/history|examin|auscultat|sample|acquire|calculat|charcoal|bicarbonate|amiodarone|antiarrhythmic|lipid|intubat|ventilat|oxygen|defibrillat|pacing|device|dose|route|drug|infusion|access|fluid|procedure|diagnos|disposition|discharge|prognos/iu);
    }
  });
});

describe('Tricyclic tutor and worked example', () => {
  const named = { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1 };

  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { toxicologyTricyclicGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { toxicologyTricyclicGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('Put the product, the seizure and the pressure in the same sentence');
    const next = markup(named, { toxicologyTricyclicGuidance: 'guided' });
    expect(next).toContain('Put people in the room for the things that have not happened yet');
    expect(next).not.toContain('Put the product, the seizure and the pressure in the same sentence');
  });

  it('refuses to close on the QRS', () => {
    const html = markup({ ...EMPTY, trajectoryAtTick: 0 }, { toxicologyTricyclicGuidance: 'guided' });
    expect(html).toContain('does not make the diagnosis on its own');
    expect(html).toContain('wrong instinct');
  });

  it('goes quiet once the handoff is recorded', () => {
    const ended = { trajectoryAtTick: 0, recognitionAtTick: 1, supportAtTick: 2, evidenceAtTick: 3, reassessmentAtTick: 4, handoffAtTick: 5 };
    expect(markup(ended, { toxicologyTricyclicGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = 'Connect patient + tracing';
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { toxicologyTricyclicGuidance: 'guided', toxicologyTricyclicDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
