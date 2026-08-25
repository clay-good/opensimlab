import {
  maturityRecordId,
  type ContentMaturity,
  type MaturitySubjectKind,
} from '../catalog/maturity';
import { MATURITY_LABELS } from './publication';

const ICONS: Readonly<Record<ContentMaturity, string>> = {
  draft: '◇', preview: '◌', source_checked: '◈', clinically_reviewed: '✓',
  institution_endorsed: '✦', withdrawn: '×',
};

const SHORT_LABELS: Readonly<Record<ContentMaturity, string>> = {
  draft: 'Draft', preview: 'Preview', source_checked: 'Sources checked',
  clinically_reviewed: 'Reviewed', institution_endorsed: 'Endorsed', withdrawn: 'Withdrawn',
};

export interface MaturityMarkerProps {
  readonly status: ContentMaturity;
  readonly subjectKind: MaturitySubjectKind;
  readonly subjectId: string;
  readonly contentVersion: string;
  readonly compact?: boolean;
  readonly moduleId?: string;
}

/** A quiet status link that always resolves to the exact public evidence record. */
export function MaturityMarker({
  status, subjectKind, subjectId, contentVersion, compact = false, moduleId = 'anesthesia',
}: MaturityMarkerProps) {
  const label = MATURITY_LABELS[status];
  const href = `/catalog/${moduleId}-maturity.json#${maturityRecordId(subjectKind, subjectId, contentVersion)}`;
  return (
    <a
      className={`maturity-marker${compact ? ' maturity-marker--compact' : ''}`}
      data-maturity={status}
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={`${label}. View exact maturity record in a new tab.`}
    >
      <span className="maturity-marker__icon" aria-hidden="true">{ICONS[status]}</span>
      <span>{compact ? SHORT_LABELS[status] : label}</span>
    </a>
  );
}
