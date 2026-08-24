import type { ContentMaturity } from '../catalog/maturity';
import { MATURITY_LABELS } from './publication';

const ICONS: Readonly<Record<ContentMaturity, string>> = {
  draft: '◇', preview: '◌', source_checked: '◈', clinically_reviewed: '✓',
  institution_endorsed: '✦', withdrawn: '×',
};

export interface MaturityMarkerProps {
  readonly status: ContentMaturity;
  readonly subjectId: string;
  readonly contentVersion: string;
}

/** A quiet status link that always resolves to the exact public evidence record. */
export function MaturityMarker({ status, subjectId, contentVersion }: MaturityMarkerProps) {
  const label = MATURITY_LABELS[status];
  const href = `/catalog/anesthesia-maturity.json#scenario:${subjectId}@${contentVersion}`;
  return (
    <a className="maturity-marker" data-maturity={status} href={href} aria-label={`${label}. View exact maturity record.`}>
      <span className="maturity-marker__icon" aria-hidden="true">{ICONS[status]}</span>
      <span>{label}</span>
    </a>
  );
}
