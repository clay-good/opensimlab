/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { INTRACRANIAL_HYPERTENSION as SCENARIO } from '../../src/modules/critical-care/scenarios/intracranial-hypertension';

describe('Requirement: intracranial hypertension opens a focused brain-protection surface', () => {
  it('keeps ICP, CPP, systemic protection, rescue, and prognosis boundaries visible', () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div'); document.body.appendChild(container);
    const root = createRoot(container); const onAction = vi.fn();
    const props = { scenario: SCENARIO, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null,
        crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
        lastDantroleneTick: null, activeCooling: false,
        intracranialHypertensionAssessment: { recognitionAtTick: null, contextAtTick: null,
          protectionAtTick: null, rescueAtTick: null, reassessmentAtTick: null } },
      lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'volume-control',
        tidalVolumeMl: 480, respiratoryRateBpm: 16, fio2: 0.35, peep: 0, delivering: true,
        sevofluranePercent: 0, freshGasFlowLPerMin: 10 }, intubated: true, airwayAttempts: 0,
      lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'tracheal-tube',
      supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null,
      muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {},
      onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {},
      onCallForHelp: () => {}, onAirwayDevice: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
      onActiveCooling: () => {}, onIntracranialHypertensionResponse: onAction, onDrugCard: () => {},
    } satisfies ActionCockpitProps;
    act(() => root.render(createElement(ActionCockpit, props)));
    expect(container.querySelector('[role="tablist"]')).toBeNull();
    expect(container.textContent).toContain('Lower pressure. Preserve perfusion.');
    expect(container.textContent).toContain('Treat pressure. Protect the patient.');
    expect(container.textContent).toContain('ICP 28 · CPP 54 · threshold >22 · contextualize with exam + CT');
    expect(container.textContent).toContain('CPP 60–70 · do not force >70 · no universal osmotherapy recipe');
    const recognize = [...container.querySelectorAll('button')]
      .find((button) => button.textContent?.includes('Recognize ICP crisis + activate help'));
    act(() => recognize?.click());
    expect(onAction).toHaveBeenCalledWith('recognize-intracranial-hypertension');
    act(() => root.unmount()); container.remove();
  });
});
