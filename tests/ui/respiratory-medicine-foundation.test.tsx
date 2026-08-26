/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Prebrief } from '@anesthesia/ui/Prebrief';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { SITE_BAR_LINKS, SiteBar } from '@platform/ui';
import { PrerenderedBody } from '@routes/Prerendered';

const moduleId = 'respiratory-medicine';
const modulePath = '/respiratory-medicine';
const scenarioPath = `${modulePath}/scenario/acute-severe-asthma`;
const transitionPath = `${modulePath}/scenario/copd-exacerbation-transition-reassessment`;
const capPath = `${modulePath}/scenario/community-acquired-pneumonia-hypoxemia-reassessment`;
const postPePath = `${modulePath}/scenario/post-pulmonary-embolism-persistent-dyspnea`;
const apeSupportPath = `${modulePath}/scenario/acute-pulmonary-edema-respiratory-support-reassessment`;
const postTensionPath = `${modulePath}/scenario/spontaneous-tension-pneumothorax-post-drainage-reassessment`;
const largeEffusionPath = `${modulePath}/scenario/large-unilateral-pleural-effusion-reassessment`;
const bronchiectasisMucusPath = `${modulePath}/scenario/bronchiectasis-mucus-plugging-reassessment`;
const chronicOpioidHypoventilationPath = `${modulePath}/scenario/chronic-opioid-related-hypoventilation-reassessment`;
const neuromuscularRespiratoryFailurePath = `${modulePath}/scenario/neuromuscular-respiratory-failure-reassessment`;
const obesityHypoventilationPath = `${modulePath}/scenario/obesity-hypoventilation-reassessment`;
const noninvasiveVentilationSelectionPath = `${modulePath}/scenario/noninvasive-ventilation-selection`;

describe('respiratory medicine foundation surfaces', () => {
  it('offers the specialty from the shared navigation and marks it current', () => {
    expect(SITE_BAR_LINKS).toContainEqual({
      href: modulePath,
      label: 'Respiratory medicine',
    });
    const markup = renderToStaticMarkup(createElement(SiteBar, { current: modulePath }));
    expect(markup).toContain(`href="${modulePath}"`);
    expect(markup).toMatch(/href="\/respiratory-medicine"[^>]*aria-current="page"/);
  });

  it('renders a crawler-usable module page with exactly twelve scenario links', () => {
    const markup = renderToStaticMarkup(createElement(PrerenderedBody, { path: modulePath }));
    expect(markup).toContain('<h1>Respiratory medicine simulator</h1>');
    expect(markup).toContain(`href="${scenarioPath}"`);
    expect(markup).toMatch(/Acute severe asthma/i);
    expect(markup).toContain(`href="${transitionPath}"`);
    expect(markup).toMatch(/COPD exacerbation/i);
    expect(markup).toContain(`href="${capPath}"`);
    expect(markup).toMatch(/Hypoxemic community-acquired pneumonia/i);
    expect(markup).toContain(`href="${postPePath}"`);
    expect(markup).toMatch(/Persistent dyspnea after pulmonary embolism/i);
    expect(markup).toContain(`href="${apeSupportPath}"`);
    expect(markup).toMatch(/Pulmonary edema support reassessment/i);
    expect(markup).toContain(`href="${postTensionPath}"`);
    expect(markup).toMatch(/After tension pneumothorax drainage/i);
    expect(markup).toContain(`href="${largeEffusionPath}"`);
    expect(markup).toMatch(/Large unilateral pleural effusion/i);
    expect(markup).toContain(`href="${bronchiectasisMucusPath}"`);
    expect(markup).toMatch(/Mucus plugging with focal collapse/i);
    expect(markup).toContain(`href="${chronicOpioidHypoventilationPath}"`);
    expect(markup).toMatch(/Chronic opioid-related hypoventilation/i);
    expect(markup).toContain(`href="${neuromuscularRespiratoryFailurePath}"`);
    expect(markup).toMatch(/Neuromuscular respiratory failure/i);
    expect(markup).toContain(`href="${obesityHypoventilationPath}"`);
    expect(markup).toMatch(/Obesity hypoventilation reassessment/i);
    expect(markup).toContain(`href="${noninvasiveVentilationSelectionPath}"`);
    expect(markup).toMatch(/Bilevel NIV selection in acute COPD/i);
    expect((markup.match(/\/respiratory-medicine\/scenario\//g) ?? [])).toHaveLength(12);
    expect(markup).toContain('aria-label="Site"');
  });

  it('renders the scenario briefing with its sources and honest review status', () => {
    const markup = renderToStaticMarkup(createElement(PrerenderedBody, { path: scenarioPath }));
    expect(markup).toMatch(/<h1>[^<]*Acute severe asthma[^<]*<\/h1>/i);
    expect(markup).toContain('Review and sources');
    expect(markup).toContain('Not clinically reviewed');
    expect(markup).toContain(`href="${modulePath}"`);
  });

  it('gives respiratory learners a specialty-specific prebrief, not anesthesia controls', () => {
    const markup = renderToStaticMarkup(createElement(Prebrief, {
      scenario: ROUTINE_INDUCTION,
      region: UNITED_STATES,
      environment: moduleId as never,
      onStart: () => {},
      guidance: 'coached' as const,
      onGuidance: () => {},
    }));
    const environment = markup.slice(markup.indexOf('<h2>The environment</h2>'));
    expect(environment).toMatch(/respiratory|breathing/i);
    expect(environment).toMatch(/focused|reassess|assessment/i);
    expect(environment).not.toMatch(/concentration plot|your drugs, the ventilator and the airway/i);
    expect(markup).toContain(`catalog/${moduleId}-maturity.json`);
  });
});
