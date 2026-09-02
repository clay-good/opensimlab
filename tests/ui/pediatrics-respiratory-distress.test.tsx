/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { PEDIATRIC_RESPIRATORY_DISTRESS as SCENARIO } from '../../src/modules/pediatrics/scenarios/pediatric-respiratory-distress';

/** The constants this lesson never moves, spread into every state below. */
const NEVER = {
  initialPulsePresent: true as const, spontaneousBreathingAuthored: true as const,
  hypoxemiaAuthored: true as const, pulseSignalCoherentAuthored: true as const,
  progressiveInadequateBreathingAuthored: true as const,
  patientExaminedByLearner: false as const, monitorInterpretedByLearner: false as const,
  diagnosisMadeByLearner: false as const, testAcquiredByLearner: false as const,
  oxygenSelectedByLearner: false as const, oxygenDeliveredByLearner: false as const,
  deviceSelectedByLearner: false as const, flowSelectedByLearner: false as const,
  fio2SelectedByLearner: false as const, oxygenTargetSelectedByLearner: false as const,
  ventilationDeliveredByLearner: false as const,
  airwayManeuverPerformedByLearner: false as const,
  intubationPerformedByLearner: false as const, drugDeliveredByLearner: false as const,
  fluidDeliveredByLearner: false as const, procedurePerformedByLearner: false as const,
  treatmentDeliveredByLearner: false as const, durableRecoveryProven: false as const,
  dispositionDetermined: false as const, outcomePredicted: false as const,
};
const base = (over: Record<string, unknown>) => ({
  recognitionAtTick: null, supportAtTick: null, earlyResponseAtTick: null,
  laterPanelAtTick: null, rescueAtTick: null, handoffAtTick: null,
  lastUnsupportedChoice: null,
  experiencedSupportActivated: over.supportAtTick != null,
  rescueReadinessActivated: over.rescueAtTick != null,
  ...NEVER, ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['pediatricRespiratoryDistressAssessment']>);

const EMPTY = base({});
const RECOGNIZED = base({ recognitionAtTick: 0 });
const AFTER_HISTORY = base({ recognitionAtTick: 0, lastUnsupportedChoice: 'history-first' });
const AFTER_IMAGING = base({ recognitionAtTick: 0, lastUnsupportedChoice: 'imaging-first' });
const EARLY = base({ recognitionAtTick: 0, supportAtTick: 1, earlyResponseAtTick: 2 });
const AFTER_SINGLE = base({ recognitionAtTick: 0, supportAtTick: 1, earlyResponseAtTick: 2, lastUnsupportedChoice: 'single-number' });
const LATER = base({ recognitionAtTick: 0, supportAtTick: 1, earlyResponseAtTick: 2, laterPanelAtTick: 3 });
const AFTER_FALLING = base({ recognitionAtTick: 0, supportAtTick: 1, earlyResponseAtTick: 2, laterPanelAtTick: 3, lastUnsupportedChoice: 'falling-rate' });
const DONE = base({ recognitionAtTick: 0, supportAtTick: 1, earlyResponseAtTick: 2, laterPanelAtTick: 3, rescueAtTick: 4, handoffAtTick: 5 });
const STATES = [EMPTY, RECOGNIZED, AFTER_HISTORY, AFTER_IMAGING, EARLY, AFTER_SINGLE, LATER, AFTER_FALLING, DONE];

const LABELS = ['Review the whole-child trend', 'Activate experienced pediatric help',
  'Complete the history first', 'Wait for imaging first', 'Review the 5-minute response',
  'Review the later whole-child panel', 'Reassure from SpO₂ 94%',
  'Activate airway-capable pediatric rescue', 'Treat RR 28 as recovery',
  'Hand off active breathing risk'];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['pediatricRespiratoryDistressAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, pediatricRespiratoryDistressAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 140, respiratoryRateBpm: 46, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onPediatricRespiratoryDistressResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['pediatricRespiratoryDistressAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Pediatric respiratory-distress experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/pediatrics' }));
    expect(index).toContain('href="/pediatrics/scenario/pediatric-respiratory-distress"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/pediatrics/scenario/pediatric-respiratory-distress' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasPediatricRespiratoryDistressResponse).toBe(true);
    // Throughout this module the targets carry a -reassessment suffix the ids do not.
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'pediatric-respiratory-distress-reassessment'),
    }).hasPediatricRespiratoryDistressResponse).toBe(false);
  });

  it('offers each set of readings only at the moment it belongs to', () => {
    const opening = markup(EMPTY);
    expect(opening).not.toContain('Complete the history first');
    expect(opening).not.toContain('Treat RR 28 as recovery');
    const recognized = markup(RECOGNIZED);
    expect(recognized).toContain('Activate experienced pediatric help');
    expect(recognized).toContain('Complete the history first');
    expect(recognized).toContain('Wait for imaging first');
    const early = markup(EARLY);
    expect(early).toContain('Review the later whole-child panel');
    expect(early).toContain('Reassure from SpO₂ 94%');
    const later = markup(LATER);
    expect(later).toContain('Activate airway-capable pediatric rescue');
    expect(later).toContain('Treat RR 28 as recovery');
  });

  it('says what happened after each of the four readings', () => {
    expect(markup(AFTER_HISTORY)).toContain('Continue history in parallel');
    expect(markup(AFTER_IMAGING)).toContain('support cannot wait for imaging');
    expect(markup(AFTER_SINGLE)).toContain('A better saturation does not overrule the child');
    expect(markup(AFTER_FALLING)).toContain('A lower rate is not recovery when the child worsens');
  });

  it('never offers a diagnosis, a device, a drug, or an intubation', () => {
    expect(markup(EMPTY)).toContain('Read the whole child.');
    expect(markup(DONE)).toContain('Notice what the number misses.');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/examin|order the|acquire|interpret|salbutamol|adrenaline|epinephrine|steroid|drug|dose|fluid|bolus|intubat|ventilat|FiO|L\/min|oxygen target|diagnose|disposition|discharge|prognos/iu);
    }
  });
});

describe('Pediatric respiratory-distress tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { pediatricRespiratoryDistressGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { pediatricRespiratoryDistressGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('let no single number speak for her');
    const supporting = markup(RECOGNIZED, { pediatricRespiratoryDistressGuidance: 'guided' });
    expect(supporting).toContain('qualified oxygenation started now');
    expect(supporting).not.toContain('let no single number speak for her');
  });

  it('answers the specific reading at the first decision point', () => {
    const history = markup(AFTER_HISTORY, { pediatricRespiratoryDistressGuidance: 'guided' });
    expect(history).toContain('Just not instead of this');
    expect(history).not.toContain('It will not help with the breathing');
    const imaging = markup(AFTER_IMAGING, { pediatricRespiratoryDistressGuidance: 'guided' });
    expect(imaging).toContain('It will not help with the breathing');
    expect(imaging).not.toContain('Just not instead of this');
  });

  it('answers the improved saturation and the falling rate differently', () => {
    const single = markup(AFTER_SINGLE, { pediatricRespiratoryDistressGuidance: 'guided' });
    expect(single).toContain('The number moved. The child did not.');
    expect(single).not.toContain('That is her running out');
    const falling = markup(AFTER_FALLING, { pediatricRespiratoryDistressGuidance: 'guided' });
    expect(falling).toContain('That is her running out');
    expect(falling).toContain('the most dangerous reassuring number in pediatrics');
    expect(falling).not.toContain('The number moved. The child did not.');
  });

  it('goes quiet once the handoff is recorded', () => {
    expect(markup(DONE, { pediatricRespiratoryDistressGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { pediatricRespiratoryDistressGuidance: 'guided', pediatricRespiratoryDistressDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
