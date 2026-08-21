/**
 * State predicates for timeline events.
 *
 * A scenario may fire an event when the patient reaches a state rather than at a
 * fixed tick — `spo2Percent < 90` rather than `atTick: 3000` — which is how a
 * scenario reacts to what the learner actually did instead of to the clock.
 *
 * The grammar is deliberately tiny and there is no `eval` anywhere near it. A
 * scenario is content, content will eventually come from contributors, and a
 * predicate that could execute arbitrary code would make every scenario file a
 * script. One comparison, a known state field, a finite number. Anything else is
 * refused at validation time with a message naming what was wrong, because the
 * failure mode this replaces — an event that validates and then silently never
 * fires — is the one that wastes an author's afternoon.
 */

/** The comparisons a predicate may use, longest first so `<=` beats `<`. */
export const PREDICATE_OPERATORS = ['<=', '>=', '==', '!=', '<', '>'] as const;

export type PredicateOperator = (typeof PREDICATE_OPERATORS)[number];

export interface StatePredicate {
  readonly field: string;
  readonly operator: PredicateOperator;
  readonly value: number;
}

export class InvalidPredicate extends Error {}

/**
 * Parse `"spo2Percent < 90"`.
 *
 * Throws `InvalidPredicate` with a message an author can act on. Callers that
 * validate rather than run should catch it and report; the engine parses every
 * predicate once at construction so a bad one cannot fail mid-session.
 */
export function parsePredicate(source: string): StatePredicate {
  const text = String(source).trim();
  if (text.length === 0) throw new InvalidPredicate('A predicate cannot be empty.');

  // Rejected explicitly rather than by falling through to "no operator found",
  // because an author who writes one of these has a clear intent and deserves to
  // be told it is not supported rather than that their string is unparseable.
  for (const unsupported of ['&&', '||', '(', ')']) {
    if (text.includes(unsupported)) {
      throw new InvalidPredicate(
        `"${text}" uses "${unsupported}". A predicate is one comparison of one state field to one `
        + 'number. Use two timeline events rather than combining conditions.',
      );
    }
  }

  const operator = PREDICATE_OPERATORS.find((candidate) => text.includes(candidate));
  if (!operator) {
    throw new InvalidPredicate(
      `"${text}" has no comparison. Write it as "field ${PREDICATE_OPERATORS.join('" , "field ')}" `
      + 'followed by a number, for example "spo2Percent < 90".',
    );
  }

  const at = text.indexOf(operator);
  const field = text.slice(0, at).trim();
  const rest = text.slice(at + operator.length).trim();

  if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(field)) {
    throw new InvalidPredicate(
      `"${field}" is not a state field name. Field names are the keys of the engine's state, `
      + 'for example spo2Percent, meanArterialMmHg, depthIndex.',
    );
  }

  const value = Number(rest);
  if (rest.length === 0 || !Number.isFinite(value)) {
    throw new InvalidPredicate(`"${rest}" is not a finite number, so "${text}" can never be decided.`);
  }

  return { field, operator, value };
}

/**
 * Decide a predicate against a state.
 *
 * A field the state does not carry is FALSE, not an error: the engine's state
 * gains and loses fields as equipment comes and goes, and a scenario should not
 * die because a train-of-four ratio is absent before a blocker is given.
 */
export function evaluatePredicate(
  predicate: StatePredicate,
  state: Readonly<Record<string, number>>,
): boolean {
  const actual = state[predicate.field];
  if (actual === undefined || !Number.isFinite(actual)) return false;
  switch (predicate.operator) {
    case '<': return actual < predicate.value;
    case '<=': return actual <= predicate.value;
    case '>': return actual > predicate.value;
    case '>=': return actual >= predicate.value;
    case '==': return actual === predicate.value;
    case '!=': return actual !== predicate.value;
  }
}
