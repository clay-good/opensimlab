import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PrerenderedBody } from '@routes/Prerendered';
import { crisisResponseAvailability } from '@anesthesia/ui/ActionCockpit';
import { Prebrief } from '@anesthesia/ui/Prebrief';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { SevereHypoglycemiaTray } from '../../src/modules/endocrine-metabolic/SevereHypoglycemiaTray';
import { SevereHypoglycemia } from '../../src/modules/endocrine-metabolic/severe-hypoglycemia';
import { HYPOGLYCEMIA_FIXTURES } from '../../src/modules/endocrine-metabolic/severe-hypoglycemia-fixtures';
import { SEVERE_HYPOGLYCEMIA_RECURRENCE as SCENARIO } from '../../src/modules/endocrine-metabolic/scenarios/severe-hypoglycemia-recurrence';
import { LIMITATIONS } from '@platform/docs/limitations';

const markup = (model: SevereHypoglycemia, tick: number) => renderToStaticMarkup(createElement(SevereHypoglycemiaTray, { assessment: model.snapshot(tick), onAction: () => {} }));

describe('Severe hypoglycemia experience', () => {
  it('publishes its exact briefing and only binds its declared response tray', () => {
    const html = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/endocrine-metabolic/scenario/severe-hypoglycemia-recurrence' }));
    expect(html).toContain('<h1>Severe hypoglycemia: rescue is not the end</h1>');
    expect(html).not.toContain('ASA 4');
    const briefing = renderToStaticMarkup(createElement(Prebrief, { limitations: LIMITATIONS, scenario: SCENARIO, region: UNITED_STATES, environment: 'endocrine-metabolic', guidance: 'coached', onGuidance: () => {}, onStart: () => {} }));
    expect(briefing).not.toContain('prompts are not yet available');
    expect(briefing).toContain('Guided — prompt me');
    expect(crisisResponseAvailability(SCENARIO).hasSevereHypoglycemiaResponse).toBe(true);
    expect(crisisResponseAvailability({ ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) }).hasSevereHypoglycemiaResponse).toBe(false);
  });
  it('offers distinct choices without exposing hidden glucose or medication findings', () => {
    const model = new SevereHypoglycemia(); const html = markup(model, 0);
    expect(html).toContain('Glucose has not been checked');
    expect(html).not.toMatch(/36 mg|glimepiride/);
    expect(html).toContain('Check bedside glucose'); expect(html).toContain('Choose oral glucose');
    expect(html).toContain('disabled=""');
    model.apply('check-glucose', 0); model.apply('call-support', 0); model.apply('review-medications', 0);
    expect(markup(model, 0)).toContain('36 mg/dL'); expect(markup(model, 0)).toContain('glimepiride');
    expect(markup(model, 0)).not.toContain('disabled=""');
    model.apply('oral-glucose', 1);
    expect(markup(model, 1)).toContain('risks aspiration');
    model.apply('iv-rescue', 1);
    expect(markup(model, 1)).not.toContain('risks aspiration');
  });
  it('keeps a stale result visible during recurrence and ends without discharge permission', () => {
    const model = new SevereHypoglycemia();
    for (const [tick, action] of HYPOGLYCEMIA_FIXTURES.expert) {
      if (tick === 18010) {
        model.advance(tick); const html = markup(model, tick);
        expect(html).toContain('Sweaty and drowsy'); expect(html).toContain('112 mg/dL');
        expect(html).toContain('A past result may be stale'); expect(html).toContain('Request repeat qualified IV rescue');
      }
      model.apply(action, tick);
    }
    const html = markup(model, 24012);
    expect(html).toContain('not discharge clearance'); expect(html).not.toContain('<button');
    expect(html.match(/role="status"/g)).toHaveLength(1);
  });
});
