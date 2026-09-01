import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PrerenderedBody } from '@routes/Prerendered';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { METHEMOGLOBINEMIA_SATURATION_GAP as SCENARIO } from '../../src/modules/toxicology/scenarios/methemoglobinemia-saturation-gap';
const markup = (assessment: NonNullable<ActionCockpitProps['resuscitation']['toxicologyMethemoglobinemiaAssessment']>, extra: {
  toxicologyMethemoglobinemiaGuidance?: ActionCockpitProps['toxicologyMethemoglobinemiaGuidance'];
  toxicologyMethemoglobinemiaDemonstrating?: boolean;
} = {}) => renderToStaticMarkup(createElement(ActionCockpit, { scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false }, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, toxicologyMethemoglobinemiaAssessment: assessment }, lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 420, respiratoryRateBpm: 10, fio2: 1, peep: 0, delivering: true, sevofluranePercent: 0, freshGasFlowLPerMin: 10 }, intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {}, onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {}, onToxicologyMethemoglobinemiaResponse: () => {}, ...extra } satisfies ActionCockpitProps));

const EMPTY = { trajectoryAtTick: null, recognitionAtTick: null, supportAtTick: null, hazardsAtTick: null, reassessmentAtTick: null, handoffAtTick: null };

describe('Toxicology methemoglobinemia experience', () => {
  it('is discoverable at its exact calm route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/toxicology' }));
    expect(index).toContain('href="/toxicology/scenario/methemoglobinemia-saturation-gap"');
    expect(index).toContain('Methemoglobinemia with a saturation gap');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/toxicology/scenario/methemoglobinemia-saturation-gap' }));
    expect(route).toContain('<h1>Methemoglobinemia with a saturation gap</h1>');
  });

  it('fails closed and exposes one calm cognitive action at a time', () => {
    expect(crisisResponseAvailability(SCENARIO).hasToxicologyMethemoglobinemiaResponse).toBe(true);
    expect(crisisResponseAvailability({ ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) }).hasToxicologyMethemoglobinemiaResponse).toBe(false);
    const states = [EMPTY,
      { ...EMPTY, trajectoryAtTick: 0 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1, supportAtTick: 2 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1, supportAtTick: 2, hazardsAtTick: 3 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1, supportAtTick: 2, hazardsAtTick: 3, reassessmentAtTick: 4 },
      { trajectoryAtTick: 0, recognitionAtTick: 1, supportAtTick: 2, hazardsAtTick: 3, reassessmentAtTick: 4, handoffAtTick: 5 }];
    // The scenario also renders the shared airway and ventilator controls, so
    // count only the buttons this lesson owns.
    const LABELS = ['Connect the discordant clues', 'Recognize the urgent pattern', 'Support + call toxicology', 'Review co-ox + hazards', 'Record intent + reassess', 'Hand off what stays open'];
    const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
      .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));
    expect(states.map((state) => lessonButtons(markup(state)).length)).toEqual([1, 1, 1, 1, 1, 1, 0]);
    expect(markup(states[0]!)).toContain('The numbers disagree. The patient matters.');
    const later = markup(states[4]!);
    expect(later).toContain('Better is a trend, not an all-clear.');
    expect(later).toContain('Record intent + reassess');
    expect(later).toContain('Record bounded intent after time passes.');
    expect(markup(states[5]!)).toContain('Rebound and treatment hazards remain open.');
    for (const html of states.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/history|examin|auscultat|sample|gas|calculat|measure|ventilat|oxygen|device|dose|route|drug|methylene|infusion|access|fluid|blood product|procedure|transfusion|hyperbaric|diagnos|disposition|discharge|prognos/iu);
    }
  });
});

describe('Methemoglobinemia tutor and worked example', () => {
  const connected = { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1, supportAtTick: 2 };

  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { toxicologyMethemoglobinemiaGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { toxicologyMethemoglobinemiaGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('Put both oxygen numbers in one sentence');
    const next = markup(connected, { toxicologyMethemoglobinemiaGuidance: 'guided' });
    expect(next).toContain('Read the co-oximetry');
    expect(next).not.toContain('Put both oxygen numbers in one sentence');
  });

  it('keeps the gap as the finding rather than picking a winner', () => {
    const html = markup(EMPTY, { toxicologyMethemoglobinemiaGuidance: 'guided' });
    expect(html).toContain('are not arguing');
    expect(html).toContain('right about themselves');
    expect(html).not.toContain('The pulse oximeter is wrong');
  });

  it('goes quiet once the handoff is recorded', () => {
    const ended = { trajectoryAtTick: 0, recognitionAtTick: 1, supportAtTick: 2, hazardsAtTick: 3, reassessmentAtTick: 4, handoffAtTick: 5 };
    expect(markup(ended, { toxicologyMethemoglobinemiaGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = 'Connect the discordant clues';
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { toxicologyMethemoglobinemiaGuidance: 'guided', toxicologyMethemoglobinemiaDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
