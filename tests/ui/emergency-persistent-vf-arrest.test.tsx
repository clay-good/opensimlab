/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { PERSISTENT_VF_ARREST as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/persistent-vf-arrest';
import { PEA_ARREST } from '../../src/modules/emergency-medicine/scenarios/pea-arrest';

type Resuscitation = ActionCockpitProps['resuscitation'];

const base = (over: Partial<Resuscitation>): Resuscitation => ({
  epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null,
  crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
  lastDantroleneTick: null, activeCooling: false,
  cardiacArrestActive: true, chestCompressionsActive: false, chestCompressionSeconds: 0,
  arrestEpinephrineTotalMg: 0, defibrillationShockCount: 0, lastDefibrillationEnergyJ: null,
  roscAtTick: null, ...over,
});

const BEFORE = base({ cardiacArrestActive: false });
const ARREST = base({});
const COMPRESSING = base({ chestCompressionsActive: true, chestCompressionSeconds: 4 });
const PAUSED = base({ chestCompressionsActive: false, chestCompressionSeconds: 4 });
const READY = base({
  chestCompressionsActive: true, chestCompressionSeconds: 8, arrestEpinephrineTotalMg: 1,
});
const UNDER_ENERGY = base({
  chestCompressionsActive: true, chestCompressionSeconds: 8, arrestEpinephrineTotalMg: 1,
  defibrillationShockCount: 1, lastDefibrillationEnergyJ: 120,
});
const CONVERTED = base({
  cardiacArrestActive: false, chestCompressionsActive: false, chestCompressionSeconds: 9,
  arrestEpinephrineTotalMg: 1, defibrillationShockCount: 1, lastDefibrillationEnergyJ: 200,
  roscAtTick: 30,
});

const props = (resuscitation: Resuscitation, extra: Partial<ActionCockpitProps> = {}): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation,
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 500, respiratoryRateBpm: 10, fio2: 1, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 10 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onChestCompressions: () => {}, onArrestEpinephrine: () => {}, onDefibrillation: () => {}, ...extra,
});

const markup = (resuscitation: Resuscitation, extra: Partial<ActionCockpitProps> = {}) =>
  renderToStaticMarkup(createElement(ActionCockpit, props(resuscitation, extra)));

describe('Emergency persistent VF experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/emergency-medicine' }));
    expect(index).toContain('href="/emergency-medicine/scenario/persistent-vf-arrest"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/emergency-medicine/scenario/persistent-vf-arrest' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('offers all three energy settings, so the wrong one is a choice', () => {
    const html = markup(ARREST);
    expect(html).toContain('Biphasic defibrillation');
    for (const energy of ['120 J', '150 J', '200 J']) expect(html).toContain(energy);
    expect(html).toContain('converts VF at 200 J under the case conditions');
  });

  it('reports the shock that was delivered and its energy', () => {
    expect(markup(UNDER_ENERGY)).toContain('Shocks: 1');
    expect(markup(UNDER_ENERGY)).toContain('last 120 J');
    expect(markup(CONVERTED)).toContain('ROSC recorded');
  });
});

describe('Emergency persistent VF tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(ARREST)).not.toContain('A moment to think');
    expect(markup(ARREST, { persistentVfGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('says nothing before the arrest is active', () => {
    expect(markup(BEFORE, { persistentVfGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(ARREST, { persistentVfGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('not a third shock');
    const dose = markup(COMPRESSING, { persistentVfGuidance: 'guided' });
    expect(dose).toContain('after shocks have failed rather than before them');
    const shock = markup(READY, { persistentVfGuidance: 'guided' });
    expect(shock).toContain('what makes this attempt different from the two that failed');
  });

  it('asks for compressions to be restarted before the next shock', () => {
    const paused = markup(PAUSED, { persistentVfGuidance: 'guided' });
    expect(paused).toContain('Compressions are paused');
    expect(paused).not.toContain('after shocks have failed rather than before them');
  });

  it('names the declared setting after a shock that went out below it', () => {
    const under = markup(UNDER_ENERGY, { persistentVfGuidance: 'guided' });
    expect(under).toContain('This device declares 200 J');
    expect(under).toContain('120 J and did not convert');
  });

  it('goes quiet once the bounded case has converted', () => {
    expect(markup(CONVERTED, { persistentVfGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    expect(markup(ARREST)).toContain('Start compressions');
    const watching = markup(ARREST, { persistentVfGuidance: 'guided', persistentVfDemonstrating: true });
    expect(watching).toContain('Start compressions');
    expect(watching).toContain('200 J');
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });

  it('leaves the sibling PEA tray untouched by this lesson’s tutor', () => {
    const html = renderToStaticMarkup(createElement(ActionCockpit,
      props(ARREST, { scenario: PEA_ARREST, persistentVfGuidance: 'guided' })));
    expect(html).not.toContain('A moment to think');
    expect(html).not.toContain('Biphasic defibrillation');
  });
});
