import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PrerenderedBody } from '@routes/Prerendered';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { DIGOXIN_RHYTHM_POTASSIUM as SCENARIO } from '../../src/modules/toxicology/scenarios/digoxin-rhythm-potassium';
const markup = (assessment: NonNullable<ActionCockpitProps['resuscitation']['toxicologyDigoxinAssessment']>, extra: {
  toxicologyDigoxinGuidance?: ActionCockpitProps['toxicologyDigoxinGuidance'];
  toxicologyDigoxinDemonstrating?: boolean;
} = {}) => renderToStaticMarkup(createElement(ActionCockpit, { scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false }, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, toxicologyDigoxinAssessment: assessment }, lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 450, respiratoryRateBpm: 10, fio2: 1, peep: 0, delivering: true, sevofluranePercent: 0, freshGasFlowLPerMin: 10 }, intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {}, onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {}, onToxicologyDigoxinResponse: () => {}, ...extra } satisfies ActionCockpitProps));

const EMPTY = { trajectoryAtTick: null, recognitionAtTick: null, supportAtTick: null, evidenceAtTick: null, reassessmentAtTick: null, handoffAtTick: null };
const LABELS = ['Connect rhythm + potassium', 'Recognize the whole pattern', 'Build the rescue circle', 'Review timing + antidote', 'Record Fab intent + reassess', 'Hand off what can recur'];
const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Toxicology digoxin experience', () => {
  it('is discoverable at its exact calm route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/toxicology' }));
    expect(index).toContain('href="/toxicology/scenario/digoxin-rhythm-potassium"');
    expect(index).toContain('Digoxin toxicity: read the rhythm and potassium together');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/toxicology/scenario/digoxin-rhythm-potassium' }));
    expect(route).toContain('<h1>Digoxin toxicity: read the rhythm and potassium together</h1>');
  });

  it('fails closed and exposes one calm cognitive action at a time', () => {
    expect(crisisResponseAvailability(SCENARIO).hasToxicologyDigoxinResponse).toBe(true);
    expect(crisisResponseAvailability({ ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) }).hasToxicologyDigoxinResponse).toBe(false);
    const states = [EMPTY,
      { ...EMPTY, trajectoryAtTick: 0 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1, supportAtTick: 2 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1, supportAtTick: 2, evidenceAtTick: 3 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1, supportAtTick: 2, evidenceAtTick: 3, reassessmentAtTick: 4 },
      { trajectoryAtTick: 0, recognitionAtTick: 1, supportAtTick: 2, evidenceAtTick: 3, reassessmentAtTick: 4, handoffAtTick: 5 }];
    expect(states.map((state) => lessonButtons(markup(state)).length)).toEqual([1, 1, 1, 1, 1, 1, 0]);
    expect(markup(states[0]!)).toContain('The rhythm and potassium tell one story.');
    const later = markup(states[4]!);
    expect(later).toContain('After Fab, follow the patient, not a misleading total level.');
    expect(later).toContain('Record qualified intent after time passes.');
    expect(markup(states[5]!)).toContain('Durable stability and treatment effect remain unproven.');
    for (const html of states.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/history|examin|auscultat|sample|acquire|calculat|charcoal|vial|calcium|insulin|intubat|ventilat|oxygen|pacing|dialys|cardiovert|device|dose|route|drug|infusion|access|fluid|procedure|diagnos|disposition|discharge|prognos/iu);
    }
  });
});

describe('Digoxin tutor and worked example', () => {
  const named = { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1 };

  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { toxicologyDigoxinGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { toxicologyDigoxinGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('Say the vomiting and the yellow vision alongside the rhythm');
    const next = markup(named, { toxicologyDigoxinGuidance: 'guided' });
    expect(next).toContain('Get the owners in place for an arrhythmia that has not happened yet');
    expect(next).not.toContain('Say the vomiting and the yellow vision alongside the rhythm');
  });

  it('refuses all four closures at once', () => {
    const html = markup({ ...EMPTY, trajectoryAtTick: 0 }, { toxicologyDigoxinGuidance: 'guided' });
    expect(html).toContain('none of them is the whole finding');
    expect(html).toContain('leave the poisoning');
  });

  it('goes quiet once the handoff is recorded', () => {
    const ended = { trajectoryAtTick: 0, recognitionAtTick: 1, supportAtTick: 2, evidenceAtTick: 3, reassessmentAtTick: 4, handoffAtTick: 5 };
    expect(markup(ended, { toxicologyDigoxinGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = 'Connect rhythm + potassium';
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { toxicologyDigoxinGuidance: 'guided', toxicologyDigoxinDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
