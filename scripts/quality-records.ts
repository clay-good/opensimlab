import type { QualityRecordEnvelope } from '../src/platform/catalog/scenario-quality';
import { HYPOCALCEMIA_QUALITY_RECORDS } from '../src/modules/endocrine-metabolic/hypocalcemia-quality';

/** Authored records are version-bound evidence, not independent review approval. */
export const QUALITY_RECORDS: readonly QualityRecordEnvelope[] = [...HYPOCALCEMIA_QUALITY_RECORDS];
