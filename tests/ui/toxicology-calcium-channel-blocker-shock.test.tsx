import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PrerenderedBody } from '@routes/Prerendered';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { CALCIUM_CHANNEL_BLOCKER_SHOCK as SCENARIO } from '../../src/modules/toxicology/scenarios/calcium-channel-blocker-shock';
const markup = (assessment: NonNullable<ActionCockpitProps['resuscitation']['toxicologyCalciumChannelBlockerAssessment']>, extra: {
  toxicologyCalciumChannelBlockerGuidance?: ActionCockpitProps['toxicologyCalciumChannelBlockerGuidance'];
  toxicologyCalciumChannelBlockerDemonstrating?: boolean;
} = {}) => renderToStaticMarkup(createElement(ActionCockpit, { scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false }, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, toxicologyCalciumChannelBlockerAssessment: assessment }, lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 450, respiratoryRateBpm: 10, fio2: 1, peep: 0, delivering: true, sevofluranePercent: 0, freshGasFlowLPerMin: 10 }, intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {}, onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {}, onToxicologyCalciumChannelBlockerResponse: () => {}, ...extra } satisfies ActionCockpitProps));

const EMPTY = { trajectoryAtTick: null, recognitionAtTick: null, supportAtTick: null, evidenceAtTick: null, reassessmentAtTick: null, handoffAtTick: null };
const LABELS = ['Connect rhythm + glucose', 'Recognize mixed shock', 'Build the rescue circle', 'Review pump + vessels', 'Record rescue intent + reassess', 'Hand off delayed risk'];
const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Toxicology calcium-channel-blocker experience', () => {
  it('is discoverable at its exact calm route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/toxicology' }));
    expect(index).toContain('href="/toxicology/scenario/calcium-channel-blocker-shock"');
    expect(index).toContain('Calcium-channel blocker toxicity: read the glucose with the shock');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/toxicology/scenario/calcium-channel-blocker-shock' }));
    expect(route).toContain('<h1>Calcium-channel blocker toxicity: read the glucose with the shock</h1>');
  });

  it('fails closed and exposes one calm cognitive action at a time', () => {
    expect(crisisResponseAvailability(SCENARIO).hasToxicologyCalciumChannelBlockerResponse).toBe(true);
    expect(crisisResponseAvailability({ ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) }).hasToxicologyCalciumChannelBlockerResponse).toBe(false);
    const states = [EMPTY,
      { ...EMPTY, trajectoryAtTick: 0 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1, supportAtTick: 2 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1, supportAtTick: 2, evidenceAtTick: 3 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1, supportAtTick: 2, evidenceAtTick: 3, reassessmentAtTick: 4 },
      { trajectoryAtTick: 0, recognitionAtTick: 1, supportAtTick: 2, evidenceAtTick: 3, reassessmentAtTick: 4, handoffAtTick: 5 }];
    expect(states.map((state) => lessonButtons(markup(state)).length)).toEqual([1, 1, 1, 1, 1, 1, 0]);
    expect(markup(states[0]!)).toContain('The high glucose belongs beside the slow rhythm.');
    const later = markup(states[4]!);
    expect(later).toContain('Extended release means the clock keeps mattering.');
    expect(later).toContain('Record qualified intent after time passes.');
    expect(markup(states[5]!)).toContain('Durable stability and completed absorption remain unproven.');
    for (const html of states.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/history|examin|auscultat|sample|acquire|calculat|charcoal|calcium chloride|insulin|lipid|methylene|intubat|ventilat|oxygen|pacing|device|dose|route|drug|infusion|access|fluid|procedure|diagnos|disposition|discharge|prognos/iu);
    }
  });
});

describe('Calcium-channel-blocker tutor and worked example', () => {
  const named = { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1 };

  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { toxicologyCalciumChannelBlockerGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { toxicologyCalciumChannelBlockerGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('Say the word \u201cextended release\u201d out loud');
    const next = markup(named, { toxicologyCalciumChannelBlockerGuidance: 'guided' });
    expect(next).toContain('Build a room for a long night');
    expect(next).not.toContain('Say the word \u201cextended release\u201d out loud');
  });

  it('refuses all three closures at once', () => {
    const html = markup({ ...EMPTY, trajectoryAtTick: 0 }, { toxicologyCalciumChannelBlockerGuidance: 'guided' });
    expect(html).toContain('the same mistake three ways');
    expect(html).toContain('while leaving both');
  });

  it('goes quiet once the handoff is recorded', () => {
    const ended = { trajectoryAtTick: 0, recognitionAtTick: 1, supportAtTick: 2, evidenceAtTick: 3, reassessmentAtTick: 4, handoffAtTick: 5 };
    expect(markup(ended, { toxicologyCalciumChannelBlockerGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = 'Connect rhythm + glucose';
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { toxicologyCalciumChannelBlockerGuidance: 'guided', toxicologyCalciumChannelBlockerDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
