import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MaturityMarker } from '@platform/governance/MaturityMarker';

describe('maturity marker', () => {
  it('communicates status with text and icon and links exact-version evidence', () => {
    const markup = renderToStaticMarkup(
      <MaturityMarker status="preview" subjectId="routine-induction" contentVersion="1.2.3" />,
    );
    expect(markup).toContain('◌');
    expect(markup).toContain('Preview — not clinically reviewed');
    expect(markup).toContain('/catalog/anesthesia-maturity.json#scenario:routine-induction@1.2.3');
    expect(markup).toContain('data-maturity="preview"');
  });

  it('never uses reviewed or endorsed wording for draft', () => {
    const markup = renderToStaticMarkup(
      <MaturityMarker status="draft" subjectId="test" contentVersion="1.0.0" />,
    );
    expect(markup).toContain('Draft — development build');
    expect(markup).not.toContain('Clinically reviewed');
    expect(markup).not.toContain('endorsed');
  });
});
