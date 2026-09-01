import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MaturityMarker } from '@platform/governance/MaturityMarker';
import { ENGINE_VERSION } from '@anesthesia/engine';
import { SCENARIOS } from '@anesthesia/scenarios';
import { buildAnesthesiaCompletionCatalog } from '@anesthesia/catalog/scenario-completion';
import { buildScenarioQualityCatalog } from '@platform/catalog/scenario-quality';
import { buildMaturityCatalog } from '@platform/catalog/maturity';
import { PUBLIC_CATALOG_ARTIFACTS } from '@platform/catalog/public-artifacts';
import { additionalMaturitySubjects } from '@platform/governance/records';

describe('maturity marker', () => {
  it('communicates status with text and icon and links exact-version evidence', () => {
    const markup = renderToStaticMarkup(
      <MaturityMarker
        status="preview"
        subjectKind="scenario"
        subjectId="routine-induction"
        contentVersion="1.2.3"
      />,
    );
    expect(markup).toContain('◌');
    expect(markup).toContain('Educational use only. Not clinically reviewed');
    expect(markup).toContain('/catalog/anesthesia-maturity.json#scenario:routine-induction@1.2.3');
    expect(markup).toContain('data-maturity="preview"');
    expect(markup).toContain('target="_blank"');
  });

  it('never uses reviewed or endorsed wording for draft', () => {
    const markup = renderToStaticMarkup(
      <MaturityMarker status="draft" subjectKind="scenario" subjectId="test" contentVersion="1.0.0" />,
    );
    expect(markup).toContain('Draft: development build');
    expect(markup).not.toContain('Clinically reviewed');
    expect(markup).not.toContain('endorsed');
  });

  it('links non-scenario content to its normalized exact record', () => {
    const markup = renderToStaticMarkup(
      <MaturityMarker
        compact
        status="draft"
        subjectKind="practice-region"
        subjectId="US"
        contentVersion="0.1.0"
      />,
    );
    expect(markup).toContain('◇');
    expect(markup).toContain('>Draft<');
    expect(markup).toContain('/catalog/anesthesia-maturity.json#practice-region:us@0.1.0');
    expect(markup).toContain('aria-label="Draft: development build. View exact maturity record in a new tab."');
  });

  it('links a scenario to its owning module catalog', () => {
    const markup = renderToStaticMarkup(
      <MaturityMarker
        status="draft"
        subjectKind="scenario"
        subjectId="undifferentiated-shock"
        contentVersion="0.1.0"
        moduleId="emergency-medicine"
      />,
    );
    expect(markup).toContain(
      '/catalog/emergency-medicine-maturity.json#scenario:undifferentiated-shock@0.1.0',
    );
  });

  it('resolves every current badge to an exact record in the offline catalog', () => {
    const completion = buildAnesthesiaCompletionCatalog(SCENARIOS, ENGINE_VERSION);
    const catalog = buildMaturityCatalog(
      completion,
      buildScenarioQualityCatalog(completion),
      additionalMaturitySubjects(),
    );
    expect(PUBLIC_CATALOG_ARTIFACTS).toContain('/catalog/anesthesia-maturity.json');
    for (const record of catalog.records) {
      const markup = renderToStaticMarkup(
        <MaturityMarker
          status={record.status}
          subjectKind={record.subjectKind}
          subjectId={record.subjectId}
          contentVersion={record.contentVersion}
        />,
      );
      expect(markup, record.recordId)
        .toContain(`/catalog/anesthesia-maturity.json#${record.recordId}`);
    }
  });
});
