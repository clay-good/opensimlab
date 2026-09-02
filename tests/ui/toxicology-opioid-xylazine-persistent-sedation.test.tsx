import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PrerenderedBody } from '@routes/Prerendered';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { OPIOID_XYLAZINE_PERSISTENT_SEDATION as SCENARIO } from '../../src/modules/toxicology/scenarios/opioid-xylazine-persistent-sedation';
const markup = (assessment: NonNullable<ActionCockpitProps['resuscitation']['toxicologyOpioidXylazineAssessment']>, extra: {
  toxicologyOpioidXylazineGuidance?: ActionCockpitProps['toxicologyOpioidXylazineGuidance'];
  toxicologyOpioidXylazineDemonstrating?: boolean;
} = {}) => renderToStaticMarkup(createElement(ActionCockpit, { scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false }, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, toxicologyOpioidXylazineAssessment: assessment }, lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 450, respiratoryRateBpm: 10, fio2: 1, peep: 0, delivering: true, sevofluranePercent: 0, freshGasFlowLPerMin: 10 }, intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {}, onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {}, onToxicologyOpioidXylazineResponse: () => {}, ...extra } satisfies ActionCockpitProps));

const EMPTY = { trajectoryAtTick: null, recognitionAtTick: null, supportAtTick: null, evidenceAtTick: null, reassessmentAtTick: null, handoffAtTick: null };
const LABELS = ['Connect rescue + patient', 'Act without overcalling', 'Bring care around the person', 'Review response + hidden harm', 'Record support + reassess', 'Hand off the whole horizon'];
const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Toxicology opioid-xylazine experience', () => {
  it('is discoverable at its exact calm route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/toxicology' }));
    expect(index).toContain('href="/toxicology/scenario/opioid-xylazine-persistent-sedation"');
    expect(index).toContain('Opioid poisoning: breathing can improve before sedation does');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/toxicology/scenario/opioid-xylazine-persistent-sedation' }));
    expect(route).toContain('<h1>Opioid poisoning: breathing can improve before sedation does</h1>');
  });

  it('fails closed and exposes one calm cognitive action at a time', () => {
    expect(crisisResponseAvailability(SCENARIO).hasToxicologyOpioidXylazineResponse).toBe(true);
    expect(crisisResponseAvailability({ ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) }).hasToxicologyOpioidXylazineResponse).toBe(false);
    const states = [EMPTY,
      { ...EMPTY, trajectoryAtTick: 0 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1, supportAtTick: 2 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1, supportAtTick: 2, evidenceAtTick: 3 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1, supportAtTick: 2, evidenceAtTick: 3, reassessmentAtTick: 4 },
      { trajectoryAtTick: 0, recognitionAtTick: 1, supportAtTick: 2, evidenceAtTick: 3, reassessmentAtTick: 4, handoffAtTick: 5 }];
    expect(states.map((state) => lessonButtons(markup(state)).length)).toEqual([1, 1, 1, 1, 1, 1, 0]);
    expect(markup(states[0]!)).toContain('Restore breathing. Keep the differential open.');
    const later = markup(states[4]!);
    expect(later).toContain('Better breathing is progress, not proof.');
    expect(later).toContain('Record qualified intent after time passes.');
    expect(markup(states[5]!)).toContain('naloxone resistance, recovery, treatment effect, and durable safety remain unproven.');
    for (const html of states.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/history|examin|auscultat|sample|acquire|calculat|measure|naloxone|antagonist|atipamezole|yohimbine|bag-mask|intubat|ventilat|oxygen|device|dose|route|drug|infusion|access|fluid|wound|procedure|diagnos|exclude|disposition|discharge|prognos/iu);
    }
  });
});

describe('Opioid-xylazine tutor and worked example', () => {
  const named = { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1 };

  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { toxicologyOpioidXylazineGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { toxicologyOpioidXylazineGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('Say which number is the emergency');
    const next = markup(named, { toxicologyOpioidXylazineGuidance: 'guided' });
    expect(next).toContain('Give the ventilation and the oxygen an owner');
    expect(next).not.toContain('Say which number is the emergency');
  });

  it('refuses the four early closures', () => {
    const html = markup({ ...EMPTY, trajectoryAtTick: 0 }, { toxicologyOpioidXylazineGuidance: 'guided' });
    expect(html).toContain('Pupils, the naloxone response, a routine screen and a wound');
    expect(html).toContain('neither establishes nor excludes xylazine');
  });

  it('goes quiet once the handoff is recorded', () => {
    const ended = { trajectoryAtTick: 0, recognitionAtTick: 1, supportAtTick: 2, evidenceAtTick: 3, reassessmentAtTick: 4, handoffAtTick: 5 };
    expect(markup(ended, { toxicologyOpioidXylazineGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = 'Connect rescue + patient';
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { toxicologyOpioidXylazineGuidance: 'guided', toxicologyOpioidXylazineDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
