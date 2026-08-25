/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { AnalysisRegion } from '@anesthesia/ui/AnalysisRegion';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { COPD_EXACERBATION_TRANSITION_REASSESSMENT as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/copd-exacerbation-transition-reassessment';

describe('COPD transition private-tutor surface', () => {
  let container: HTMLDivElement; let root: Root;
  beforeEach(() => { (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean })
    .IS_REACT_ACT_ENVIRONMENT = true; container = document.createElement('div');
  document.body.appendChild(container); root = createRoot(container); });
  afterEach(() => { act(() => root.unmount()); container.remove(); });

  const assessment = (ticks: Partial<{ readinessAtTick: number;
    respiratoryNeedsAtTick: number; medicationAtTick: number;
    coordinationAtTick: number; handoffAtTick: number }> = {}) => ({
    readinessAtTick: ticks.readinessAtTick ?? null,
    respiratoryNeedsAtTick: ticks.respiratoryNeedsAtTick ?? null,
    medicationAtTick: ticks.medicationAtTick ?? null,
    coordinationAtTick: ticks.coordinationAtTick ?? null,
    handoffAtTick: ticks.handoffAtTick ?? null,
    treatmentDeliveredByLearner: false as const, oxygenDeliveredByLearner: false as const,
    longTermOxygenEligibilityDetermined: false as const, regimenSelected: false as const,
    techniquePerformedByLearner: false as const, rehabilitationEnrolled: false as const,
    appointmentGuaranteed: false as const, dispositionDetermined: false as const,
    outcomePredicted: false as const,
  });
  function props(value = assessment(), onAction = vi.fn()): ActionCockpitProps {
    return { scenario: SCENARIO, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
        lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0,
        dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false,
        copdTransitionAssessment: value }, lastExposure: null,
      syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 430,
        respiratoryRateBpm: 20, fio2: 0.21, peep: 0, delivering: false,
        sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 }, intubated: false,
      airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0,
      airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0,
      helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {},
      onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {},
      onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {},
      onCallForHelp: () => {}, onAirwayDevice: () => {}, onEpinephrine: () => {},
      onDantrolene: () => {}, onActiveCooling: () => {},
      onCopdTransitionResponse: onAction, onDrugCard: () => {} };
  }
  const button = (label: string) => [...container.querySelectorAll('button')]
    .find((entry) => entry.textContent?.trim() === label) as HTMLButtonElement;

  it('shows two calm cards with one available action and explicit boundaries', () => {
    const onAction = vi.fn();
    act(() => root.render(createElement(ActionCockpit, props(assessment(), onAction))));
    expect(container.querySelector('[role="tablist"]')).toBeNull();
    expect(container.querySelectorAll('.tray-grid > section.syringe')).toHaveLength(2);
    expect(button('Reconcile recovery + readiness').disabled).toBe(false);
    for (const label of ['Review residual breathing + oxygen needs',
      'Review medication + technique ownership', 'Coordinate rehab + follow-up',
      'Hand off unresolved transition work']) expect(button(label).disabled).toBe(true);
    act(() => button('Reconcile recovery + readiness').click());
    expect(onAction).toHaveBeenCalledWith('reconcile-copd-exacerbation-recovery-and-readiness');
    expect(container.textContent).toMatch(/Better is not the same as ready/i);
    expect(container.textContent).toMatch(/does not qualify long-term oxygen/i);
    expect(container.textContent).toMatch(/No oxygen prescription/i);
  });

  it('opens coordination after review and explains the elapsed handoff gate', () => {
    act(() => root.render(createElement(ActionCockpit, props(assessment({
      readinessAtTick: 10, respiratoryNeedsAtTick: 20, medicationAtTick: 30 })))));
    expect(button('Coordinate rehab + follow-up').disabled).toBe(false);
    expect(button('Hand off unresolved transition work').disabled).toBe(true);
    act(() => root.render(createElement(ActionCockpit, props(assessment({
      readinessAtTick: 10, respiratoryNeedsAtTick: 20, medicationAtTick: 30,
      coordinationAtTick: 40 })))));
    expect(button('Hand off unresolved transition work').disabled).toBe(false);
    expect(container.textContent).toMatch(/advance time before handoff/i);
  });

  it('opens on the patient record without perioperative-only fields', () => {
    const markup = renderToStaticMarkup(createElement(AnalysisRegion, {
      scenario: SCENARIO, history: [], concentrations: [], attribution: [], log: [],
      unreadLog: false, tick: 0, timeToPeakSeconds: {}, stacking: [], wide: false,
      onSelectTick: () => {}, selectedTick: null, onExportCsv: () => {},
      onOpenExplainer: () => {}, onMarkLogRead: () => {}, initialTab: 'patient',
      moduleId: 'respiratory-medicine',
    }));
    expect(markup).toMatch(/role="tab"[^>]*aria-selected="true"[^>]*>Patient/);
    expect(markup).toContain('Hospital-day-3 COPD recovery-versus-readiness');
    expect(markup).not.toContain('ASA physical status');
    expect(markup).not.toContain('Fasting');
  });
});
