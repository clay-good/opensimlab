import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PrerenderedBody } from '@routes/Prerendered';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { ACETAMINOPHEN_CLOCK_AND_NOMOGRAM as SCENARIO } from '../../src/modules/toxicology/scenarios/acetaminophen-clock-and-nomogram';
const markup = (assessment: NonNullable<ActionCockpitProps['resuscitation']['toxicologyAcetaminophenAssessment']>, extra: {
  toxicologyAcetaminophenGuidance?: ActionCockpitProps['toxicologyAcetaminophenGuidance'];
  toxicologyAcetaminophenDemonstrating?: boolean;
} = {}) => renderToStaticMarkup(createElement(ActionCockpit, { scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false }, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, toxicologyAcetaminophenAssessment: assessment }, lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 450, respiratoryRateBpm: 10, fio2: 1, peep: 0, delivering: true, sevofluranePercent: 0, freshGasFlowLPerMin: 10 }, intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {}, onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {}, onToxicologyAcetaminophenResponse: () => {}, ...extra } satisfies ActionCockpitProps));

const EMPTY = { trajectoryAtTick: null, recognitionAtTick: null, supportAtTick: null, evidenceAtTick: null, reassessmentAtTick: null, handoffAtTick: null };
const LABELS = ['Connect product + clock', 'Set the nomogram boundary', 'Bring in toxicology + safety', 'Review the timed evidence', 'Record intent + review', 'Hand off what stays open'];
const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Toxicology acetaminophen experience', () => {
  it('is discoverable at its exact calm route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/toxicology' }));
    expect(index).toContain('href="/toxicology/scenario/acetaminophen-clock-and-nomogram"');
    expect(index).toContain('Acetaminophen: the clock changes the meaning');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/toxicology/scenario/acetaminophen-clock-and-nomogram' }));
    expect(route).toContain('<h1>Acetaminophen: the clock changes the meaning</h1>');
  });

  it('fails closed and exposes one calm cognitive action at a time', () => {
    expect(crisisResponseAvailability(SCENARIO).hasToxicologyAcetaminophenResponse).toBe(true);
    expect(crisisResponseAvailability({ ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) }).hasToxicologyAcetaminophenResponse).toBe(false);
    const states = [EMPTY,
      { ...EMPTY, trajectoryAtTick: 0 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1, supportAtTick: 2 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1, supportAtTick: 2, evidenceAtTick: 3 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1, supportAtTick: 2, evidenceAtTick: 3, reassessmentAtTick: 4 },
      { trajectoryAtTick: 0, recognitionAtTick: 1, supportAtTick: 2, evidenceAtTick: 3, reassessmentAtTick: 4, handoffAtTick: 5 }];
    expect(states.map((state) => lessonButtons(markup(state)).length)).toEqual([1, 1, 1, 1, 1, 1, 0]);
    expect(markup(states[0]!)).toContain('The clock gives the number its meaning.');
    const later = markup(states[4]!);
    expect(later).toContain('A finished clock is not a stopping rule.');
    expect(later).toContain('Record bounded intent after time passes.');
    expect(markup(states[5]!)).toContain('They do not create an automatic stop or prove treatment effect.');
    for (const html of states.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/history|examin|auscultat|sample|assay|calculat|plot|charcoal|acetylcystein|ventilat|oxygen|device|dose|route|drug|infusion|access|fluid|dialysis|procedure|diagnos|disposition|discharge|prognos/iu);
    }
  });
});

describe('Acetaminophen tutor and worked example', () => {
  const named = { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1 };

  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { toxicologyAcetaminophenGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { toxicologyAcetaminophenGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('Fix the product and the clock before anything else');
    const next = markup(named, { toxicologyAcetaminophenGuidance: 'guided' });
    expect(next).toContain('Get the owners in place');
    expect(next).not.toContain('Fix the product and the clock before anything else');
  });

  it('asks whether the tool applies before it reads the plot', () => {
    const html = markup({ ...EMPTY, trajectoryAtTick: 0 }, { toxicologyAcetaminophenGuidance: 'guided' });
    expect(html).toContain('at least four hours after');
    expect(html).toContain('a different qualified evaluation');
  });

  it('goes quiet once the handoff is recorded', () => {
    const ended = { trajectoryAtTick: 0, recognitionAtTick: 1, supportAtTick: 2, evidenceAtTick: 3, reassessmentAtTick: 4, handoffAtTick: 5 };
    expect(markup(ended, { toxicologyAcetaminophenGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = 'Connect product + clock';
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { toxicologyAcetaminophenGuidance: 'guided', toxicologyAcetaminophenDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
