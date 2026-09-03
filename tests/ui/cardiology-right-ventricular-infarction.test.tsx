/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { RIGHT_VENTRICULAR_INFARCTION as SCENARIO } from '../../src/modules/cardiology/scenarios/right-ventricular-infarction';

/** The constants this lesson never moves, spread into every state below. */
const NEVER = {
  initialPulsePresent: true as const,
  treatmentDeliveredByLearner: false as const,
  medicationDeliveredByLearner: false as const,
  reperfusionPerformedByLearner: false as const,
  deviceSelected: false as const,
  liveEcgInterpreted: false as const,
  imageAcquired: false as const,
  nitrateSelected: false as const,
  diureticSelected: false as const,
  blindFluidLoading: false as const,
  fixedFluidVolumeSelected: false as const,
  treatmentDelivered: false as const,
  pciPerformed: false as const,
  reperfusionCompleted: false as const,
};
const base = (over: Record<string, unknown>) => ({
  reconciledAtTick: null, phenotypeAtTick: null, reperfusionAtTick: null,
  supportAtTick: null, handoffAtTick: null,
  ...NEVER, ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['rightVentricularInfarctionAssessment']>);

const EMPTY = base({});
const RECONCILED = base({ reconciledAtTick: 0 });
const PHENOTYPE = base({ reconciledAtTick: 0, phenotypeAtTick: 1 });
const REPERFUSION = base({ reconciledAtTick: 0, reperfusionAtTick: 1 });
const BOTH = base({ reconciledAtTick: 0, reperfusionAtTick: 1, phenotypeAtTick: 2 });
const SUPPORT = base({ reconciledAtTick: 0, reperfusionAtTick: 1, phenotypeAtTick: 2, supportAtTick: 3 });
const DONE = base({ reconciledAtTick: 0, reperfusionAtTick: 1, phenotypeAtTick: 2, supportAtTick: 3, handoffAtTick: 4 });
const STATES = [EMPTY, RECONCILED, PHENOTYPE, REPERFUSION, BOTH, SUPPORT, DONE];

const LABELS = ['Reconcile RV trajectory', 'Review RV phenotype + harms',
  'Record cautious support intent', 'Keep reperfusion moving', 'Hand off later trajectory'];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['rightVentricularInfarctionAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, rightVentricularInfarctionAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 450, respiratoryRateBpm: 18, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onRightVentricularInfarctionResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['rightVentricularInfarctionAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Right-ventricular infarction experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/cardiology' }));
    expect(index).toContain('href="/cardiology/scenario/right-ventricular-infarction"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/cardiology/scenario/right-ventricular-infarction' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasRightVentricularInfarctionResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'right-ventricular-infarction'),
    }).hasRightVentricularInfarctionResponse).toBe(false);
  });

  it('keeps all five steps on screen, one per declared objective', () => {
    expect(SCENARIO.metadata.objectives).toHaveLength(5);
    for (const state of STATES) {
      expect(lessonButtons(markup(state))).toHaveLength(5);
    }
  });

  it('opens the phenotype and the reperfusion lanes together after the trajectory', () => {
    const LANES = ['Review RV phenotype \\+ harms', 'Keep reperfusion moving'];
    for (const lane of LANES) {
      expect(markup(EMPTY)).toMatch(new RegExp(`<button[^>]* disabled=""[^>]*>${lane}`));
      expect(markup(RECONCILED)).not.toMatch(new RegExp(`<button[^>]* disabled=""[^>]*>${lane}`));
    }
  });

  it('keeps support behind the phenotype and the handoff behind both lanes', () => {
    expect(markup(REPERFUSION)).toMatch(/<button[^>]* disabled=""[^>]*>Record cautious support intent/);
    expect(markup(PHENOTYPE)).not.toMatch(/<button[^>]* disabled=""[^>]*>Record cautious support intent/);
    for (const state of [BOTH, PHENOTYPE]) {
      expect(markup(state)).toMatch(/<button[^>]* disabled=""[^>]*>Hand off later trajectory/);
    }
    expect(markup(SUPPORT)).not.toMatch(/<button[^>]* disabled=""[^>]*>Hand off later trajectory/);
  });

  it('never offers a nitrate, a diuretic, a fluid volume, or a procedure', () => {
    expect(markup(EMPTY)).toContain('The right side changes the bridge.');
    expect(markup(BOTH)).toContain('Support gently. Reperfuse early.');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/examin|nitrate|nitro|furosem|diuretic|\bml\b|bolus|noradren|PCI\b|diagnos|prognos/iu);
    }
  });
});

describe('Right-ventricular infarction tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { rightVentricularInfarctionGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { rightVentricularInfarctionGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('preload-sensitive hypotension rather than declared shock');
    const parallel = markup(RECONCILED, { rightVentricularInfarctionGuidance: 'guided' });
    expect(parallel).toContain('quietly consume the time the other half does not have');
    expect(parallel).not.toContain('preload-sensitive hypotension rather than declared shock');
  });

  it('follows whichever lane the learner left open', () => {
    expect(markup(PHENOTYPE, { rightVentricularInfarctionGuidance: 'guided' }))
      .toContain('the reperfusion pathway is still moving');
    expect(markup(REPERFUSION, { rightVentricularInfarctionGuidance: 'guided' }))
      .toContain('not a diagnosis you have made');
  });

  it('names the two drugs to leave alone', () => {
    expect(markup(BOTH, { rightVentricularInfarctionGuidance: 'guided' }))
      .toContain('the two drugs you would ordinarily reach for are the two to leave alone');
  });

  it('goes quiet once the handoff is recorded', () => {
    expect(markup(DONE, { rightVentricularInfarctionGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { rightVentricularInfarctionGuidance: 'guided', rightVentricularInfarctionDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
