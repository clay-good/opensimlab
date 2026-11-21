/**
 * The model-set revision. It changes whenever any parameter changes, and it is
 * recorded in every transcript so a session can be interpreted years later.
 *
 * Its own module so the envelope evaluator can read it without importing the
 * whole registry: the evaluator runs in the worker and in the pharmacology
 * sandbox, and importing the registry tied it to a chunk every lesson loads.
 */
export const MODEL_SET_REVISION = '2026.08.2';
