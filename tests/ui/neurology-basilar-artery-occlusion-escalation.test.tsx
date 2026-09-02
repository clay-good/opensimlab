import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PrerenderedBody } from '@routes/Prerendered';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { BASILAR_ARTERY_OCCLUSION_ESCALATION as SCENARIO } from '../../src/modules/neurology/scenarios/basilar-artery-occlusion-escalation';
const markup = (assessment: NonNullable<ActionCockpitProps['resuscitation']['neurologyBasilarLvoAssessment']>, extra: {
  neurologyBasilarLvoGuidance?: ActionCockpitProps['neurologyBasilarLvoGuidance'];
  neurologyBasilarLvoDemonstrating?: boolean;
} = {}) => renderToStaticMarkup(createElement(ActionCockpit, { scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false }, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, neurologyBasilarLvoAssessment: assessment }, lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 450, respiratoryRateBpm: 10, fio2: 1, peep: 0, delivering: true, sevofluranePercent: 0, freshGasFlowLPerMin: 10 }, intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {}, onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {}, onNeurologyBasilarLvoResponse: () => {}, ...extra } satisfies ActionCockpitProps));

const EMPTY = { trajectoryAtTick: null, imagingAtTick: null, boundaryAtTick: null, activationAtTick: null, laterAtTick: null, handoffAtTick: null };
const LABELS = ['Review clock + posterior syndrome', 'Review fixed imaging + selection context', 'Recognize the escalation boundary', 'Activate qualified EVT + airway ownership', 'Review the later neurologic report', 'Hand off clocks + active risk'];
const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Neurology basilar-occlusion experience', () => {
  it('is discoverable at its exact calm route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/neurology' }));
    expect(index).toContain('href="/neurology/scenario/basilar-artery-occlusion-escalation"');
    expect(index).toContain('Late-window basilar occlusion escalation');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/neurology/scenario/basilar-artery-occlusion-escalation' }));
    expect(route).toContain('<h1>Late-window basilar occlusion escalation</h1>');
  });

  it('fails closed and exposes one calm cognitive action at a time', () => {
    expect(crisisResponseAvailability(SCENARIO).hasNeurologyBasilarLvoResponse).toBe(true);
    expect(crisisResponseAvailability({ ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) }).hasNeurologyBasilarLvoResponse).toBe(false);
    const states = [EMPTY,
      { ...EMPTY, trajectoryAtTick: 0 },
      { ...EMPTY, trajectoryAtTick: 0, imagingAtTick: 1 },
      { ...EMPTY, trajectoryAtTick: 0, imagingAtTick: 1, boundaryAtTick: 2 },
      { ...EMPTY, trajectoryAtTick: 0, imagingAtTick: 1, boundaryAtTick: 2, activationAtTick: 3 },
      { ...EMPTY, trajectoryAtTick: 0, imagingAtTick: 1, boundaryAtTick: 2, activationAtTick: 3, laterAtTick: 4 },
      { trajectoryAtTick: 0, imagingAtTick: 1, boundaryAtTick: 2, activationAtTick: 3, laterAtTick: 4, handoffAtTick: 5 }];
    expect(states.map((state) => lessonButtons(markup(state)).length)).toEqual([1, 1, 1, 1, 1, 1, 0]);
    expect(markup(states[0]!)).toContain('Posterior signs still need speed.');
    const later = markup(states[4]!);
    expect(later).toContain('The handoff keeps every risk open.');
    expect(later).toContain('Qualified ownership is active. Review the fixed later neurologic report.');
    expect(markup(states[5]!)).toContain('Airway risk and outcome remain open.');
    for (const html of states.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/history|examin|auscultat|sample|acquire|calculat|nihss|score|measure|alteplase|tenecteplase|thrombolys|stent|catheter|aspirat|intubat|anesthe|sedat|dose|route|drug|infusion|prescri|procedure|diagnos|exclude|disposition|discharge|prognos/iu);
    }
  });
});

describe('Basilar-occlusion tutor and worked example', () => {
  const named = { ...EMPTY, trajectoryAtTick: 0, imagingAtTick: 1 };

  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { neurologyBasilarLvoGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { neurologyBasilarLvoGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('Read ten hours as a reason to hurry');
    const next = markup(named, { neurologyBasilarLvoGuidance: 'guided' });
    expect(next).toContain('Name the escalation boundary');
    expect(next).not.toContain('Read ten hours as a reason to hurry');
  });

  it('reads the imaging as selection facts rather than a verdict', () => {
    const html = markup({ ...EMPTY, trajectoryAtTick: 0 }, { neurologyBasilarLvoGuidance: 'guided' });
    expect(html).toContain('selection facts, not a mechanism and not a verdict');
    expect(html).toContain('snapshots taken once');
  });

  it('goes quiet once the handoff is recorded', () => {
    const ended = { trajectoryAtTick: 0, imagingAtTick: 1, boundaryAtTick: 2, activationAtTick: 3, laterAtTick: 4, handoffAtTick: 5 };
    expect(markup(ended, { neurologyBasilarLvoGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = 'Review clock + posterior syndrome';
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { neurologyBasilarLvoGuidance: 'guided', neurologyBasilarLvoDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
