/** Machine-readable catalog files that every distributable build publishes. */
export const PUBLIC_CATALOG_ARTIFACTS = [
  '/catalog/scenario-catalog.schema.json',
  '/catalog/anesthesia-catalog.json',
  '/catalog/scenario-completion.schema.json',
  '/catalog/anesthesia-completion-audit.json',
  '/catalog/training-value.schema.json',
  '/catalog/authored-defaults.schema.json',
  '/catalog/scenario-hazard.schema.json',
  '/catalog/state-space-verification.schema.json',
  '/catalog/anesthesia-quality-audit.json',
  '/catalog/maturity-record.schema.json',
  '/catalog/anesthesia-maturity.json',
  '/catalog/asset-licenses.json',
  '/catalog/evidence-sources.json',
] as const;
