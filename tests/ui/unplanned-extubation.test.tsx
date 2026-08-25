/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { UNPLANNED_EXTUBATION as SCENARIO } from '../../src/modules/critical-care/scenarios/unplanned-extubation';

describe('Requirement: unplanned extubation opens a focused read-then-act surface', () => {
  it('keeps whole-patient judgment, prompt escalation, and skill boundaries visible', () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div'); document.body.appendChild(container);
    const root = createRoot(container); const onAction = vi.fn();
    const props = { scenario: SCENARIO, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null,
        crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
        lastDantroleneTick: null, activeCooling: false, seizureSuppressed: false,
        unplannedExtubationAssessment: { supportAtTick: null, assessmentAtTick: null,
          failureAtTick: null, airwayPlanAtTick: null, reassessmentAtTick: null } },
      lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'volume-control',
        tidalVolumeMl: 430, respiratoryRateBpm: 18, fio2: 0.5, peep: 5, delivering: false,
        sevofluranePercent: 0, freshGasFlowLPerMin: 10 }, intubated: false, airwayAttempts: 0,
      lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
      supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null,
      muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {},
      onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {},
      onCallForHelp: () => {}, onAirwayDevice: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
      onActiveCooling: () => {}, onUnplannedExtubationResponse: onAction,
      onDrugCard: () => {} } satisfies ActionCockpitProps;
    act(() => root.render(createElement(ActionCockpit, props)));
    expect(container.querySelector('[role="tablist"]')).toBeNull();
    expect(container.textContent).toContain('The tube is out. Read the patient.');
    expect(container.textContent).toContain('airway · effort · gas · brain · circulation');
    expect(container.textContent).toContain('Don’t rent time from failure.');
    expect(container.textContent).toContain('Noninvasive support must not delay');
    const support = [...container.querySelectorAll('button')]
      .find((button) => button.textContent?.includes('Oxygenate + call airway help'));
    act(() => support?.click());
    expect(onAction).toHaveBeenCalledWith('support-unplanned-extubation-and-call-help');
    act(() => root.unmount()); container.remove();
  });
});
