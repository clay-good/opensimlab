import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { RapidCyclePanel } from '@anesthesia/ui/RapidCyclePanel';
import { PausePointPanel } from '@anesthesia/ui/PausePointPanel';
import { PERSISTENT_VF_CARDIAC_ARREST as SCENARIO } from '@anesthesia/scenarios/persistent-vf-cardiac-arrest';
import { EN_MESSAGES, setActiveCatalog } from '@platform/i18n/messages';
import { pseudoLocale } from '@platform/i18n/catalog';

const point = SCENARIO.rapidCycle![0]!;
const panel = (status: 'waiting' | 'landed' | 'missed', cycle = 1) => renderToStaticMarkup(createElement(RapidCyclePanel, {
  point, cycle, status, objectiveStatement: 'Resume chest compressions.', onRetry: () => {}, onFinish: () => {},
}));

describe('the rapid-cycle panel', () => {
  afterEach(() => setActiveCatalog(undefined));

  it('shows the cycle, then the result, the directive with a retry, or the source after the last cycle', () => {
    expect(panel('waiting')).toContain('Rapid cycle 1 of 4');
    expect(panel('waiting')).toContain('Resume chest compressions.');
    expect(panel('landed')).toContain('Inside the window.');
    expect(panel('missed')).toContain(point.directive);
    expect(panel('missed')).toContain('Try the cycle again');
    const last = panel('missed', point.cycleCap);
    expect(last).not.toContain('Try the cycle again');
    expect(last).toContain(`That was the last cycle. Source: ${point.sourceLocator}.`);
  });

  it('translates its interface text but keeps the clinical directive in the scenario\'s words', () => {
    setActiveCatalog(pseudoLocale(EN_MESSAGES, 'en-XA'));
    const markup = panel('missed');
    expect(markup).toMatch(/\[Rapid cycle 1 of 4[· ]+\]/);
    expect(markup).toContain(point.directive);
  });
});

describe('the classroom pause panel', () => {
  it('asks the scenario\'s question and names the region', () => {
    const markup = renderToStaticMarkup(createElement(PausePointPanel, {
      point: { id: 'p', atTick: 600, question: 'What would you check first?', region: 'monitor' }, onResume: () => {},
    }));
    expect(markup).toContain('Pause for the room');
    expect(markup).toContain('What would you check first?');
    expect(markup).toContain('Look at the monitor region. The clock is paused.');
    expect(markup).toContain('Resume');
  });
});
