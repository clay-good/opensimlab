/**
 * The Learn tab lists the running module's concepts
 * (knowledge-layer → the minimum knowledge set).
 *
 * It used to list the anesthesia set in every module, because the panel
 * imported that array directly. An emergency medicine learner was offered
 * hysteresis and effect-site lag and nothing about shock.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import { AnalysisRegion } from '@anesthesia/ui/AnalysisRegion';
import { EMERGENCY_MEDICINE_EXPLAINERS } from '../../src/modules/emergency-medicine/content/explainers';
import { EXPLAINERS } from '@anesthesia/content/explainers';
import { getEmergencyMedicineScenario } from '../../src/modules/emergency-medicine/scenarios';

const SCENARIO = getEmergencyMedicineScenario('undifferentiated-shock')!;

const props = (explainers: typeof EXPLAINERS) => ({
  scenario: SCENARIO, history: [], concentrations: [], attribution: [], log: [],
  unreadLog: false, tick: 0, timeToPeakSeconds: {}, stacking: [], wide: false,
  onSelectTick: () => {}, selectedTick: null, onExportCsv: () => {},
  onOpenExplainer: () => {}, explainers, onMarkLogRead: () => {},
  initialTab: 'learn' as const, moduleId: 'emergency-medicine',
});

describe('the Learn tab', () => {
  it('lists the concepts of the module being run', () => {
    const markup = renderToStaticMarkup(createElement(AnalysisRegion, props(EMERGENCY_MEDICINE_EXPLAINERS)));
    for (const explainer of EMERGENCY_MEDICINE_EXPLAINERS) {
      expect(markup, `${explainer.id} is not offered`).toContain(explainer.title);
    }
    expect(markup).not.toContain('Hysteresis and effect-site lag');
  });

  it('offers the shared set to a module that has authored none', () => {
    const markup = renderToStaticMarkup(createElement(AnalysisRegion, props(EXPLAINERS)));
    expect(markup).toContain('Hysteresis and effect-site lag');
  });
});
