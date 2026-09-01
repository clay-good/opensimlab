import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PrerenderedBody } from '@routes/Prerendered';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { SALICYLATE_FALLING_NUMBER as SCENARIO } from '../../src/modules/toxicology/scenarios/salicylate-falling-number';
const markup = (assessment: NonNullable<ActionCockpitProps['resuscitation']['toxicologySalicylateAssessment']>, extra: {
  toxicologySalicylateGuidance?: ActionCockpitProps['toxicologySalicylateGuidance'];
  toxicologySalicylateDemonstrating?: boolean;
} = {}) => renderToStaticMarkup(createElement(ActionCockpit, { scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false }, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, toxicologySalicylateAssessment: assessment }, lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 450, respiratoryRateBpm: 10, fio2: 1, peep: 0, delivering: true, sevofluranePercent: 0, freshGasFlowLPerMin: 10 }, intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {}, onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {}, onToxicologySalicylateResponse: () => {}, ...extra } satisfies ActionCockpitProps));

const EMPTY = { trajectoryAtTick: null, recognitionAtTick: null, supportAtTick: null, evidenceAtTick: null, reassessmentAtTick: null, handoffAtTick: null };
const LABELS = ['Connect exposure + breathing', 'See the mixed pattern', 'Gather the right team early', 'Review the coupled evidence', 'Prepare early + reassess', 'Hand off the whole trajectory'];
const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Toxicology salicylate experience', () => {
  it('is discoverable at its exact calm route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/toxicology' }));
    expect(index).toContain('href="/toxicology/scenario/salicylate-falling-number"');
    expect(index).toContain('Salicylate: the falling number can be worse');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/toxicology/scenario/salicylate-falling-number' }));
    expect(route).toContain('<h1>Salicylate: the falling number can be worse</h1>');
  });

  it('fails closed and exposes one calm cognitive action at a time', () => {
    expect(crisisResponseAvailability(SCENARIO).hasToxicologySalicylateResponse).toBe(true);
    expect(crisisResponseAvailability({ ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) }).hasToxicologySalicylateResponse).toBe(false);
    const states = [EMPTY,
      { ...EMPTY, trajectoryAtTick: 0 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1, supportAtTick: 2 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1, supportAtTick: 2, evidenceAtTick: 3 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1, supportAtTick: 2, evidenceAtTick: 3, reassessmentAtTick: 4 },
      { trajectoryAtTick: 0, recognitionAtTick: 1, supportAtTick: 2, evidenceAtTick: 3, reassessmentAtTick: 4, handoffAtTick: 5 }];
    expect(states.map((state) => lessonButtons(markup(state)).length)).toEqual([1, 1, 1, 1, 1, 1, 0]);
    expect(markup(states[0]!)).toContain('Read the patient and the number together.');
    const later = markup(states[4]!);
    expect(later).toContain('A lower number can travel with a sicker patient.');
    expect(later).toContain('Record qualified intent after time passes.');
    expect(markup(states[5]!)).toContain('The whole trajectory is ominous, not reassuring.');
    for (const html of states.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/history|examin|auscultat|sample|assay|calculat|charcoal|bicarbonate|potassium|intubat|ventilat|oxygen|device|dose|route|drug|infusion|access|fluid|dialys|procedure|diagnos|disposition|discharge|prognos/iu);
    }
  });
});

describe('Salicylate tutor and worked example', () => {
  const named = { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1 };

  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { toxicologySalicylateGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { toxicologySalicylateGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('Describe the breathing as a finding rather than as distress');
    const next = markup(named, { toxicologySalicylateGuidance: 'guided' });
    expect(next).toContain('Call everyone who might be needed later, now');
    expect(next).not.toContain('Describe the breathing as a finding rather than as distress');
  });

  it('says what the near-normal pH is made of', () => {
    const html = markup({ ...EMPTY, trajectoryAtTick: 0 }, { toxicologySalicylateGuidance: 'guided' });
    expect(html).toContain('not a patient who is compensating well');
    expect(html).toContain('stay coupled');
  });

  it('goes quiet once the handoff is recorded', () => {
    const ended = { trajectoryAtTick: 0, recognitionAtTick: 1, supportAtTick: 2, evidenceAtTick: 3, reassessmentAtTick: 4, handoffAtTick: 5 };
    expect(markup(ended, { toxicologySalicylateGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = 'Connect exposure + breathing';
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { toxicologySalicylateGuidance: 'guided', toxicologySalicylateDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
