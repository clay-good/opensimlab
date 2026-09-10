/**
 * How a register entry is matched to the record it names.
 *
 * `check-citations.ts` needs the network and so is a script rather than a test, but
 * the comparison it makes is pure, and it is the part that decides whether a real
 * misattribution is reported or waved through. It lives here so the test suite can
 * hold it offline.
 */
/** Lowercase alphanumerics only, so punctuation and case never make a false mismatch. */
export const normalise = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** A surname is the part a human checks first and the part least likely to be reformatted. */
export function surnames(authors: string): string[] {
  return authors
    .split(/,|\band\b/)
    .map((part) => part.trim().replace(/\bet al\.?$/i, '').trim())
    .filter(Boolean)
    .map((part) => normalise(part).split(' ')[0] ?? '')
    .filter((name) => name.length > 2);
}

/**
 * A guideline is cited by the body that issued it, and the record lists the writing
 * committee. Neither is wrong, so the first-author comparison does not apply and
 * saying "American is not an author" would be noise that hides a real mismatch.
 *
 * A joint statement names several bodies, so the commas cannot be the test. Every
 * part has to read as an organisation before the check is waived; one personal name
 * in the list means the register is citing people and the comparison still applies.
 */
const ORGANISATION = /\b(association|college|society|academy|institute|federation|foundation|council|network|task force|committee|panel|working group|initiative|collaborative|organization|organisation|department|ministry|administration|inc\.?|llc)\b/i;
export const isOrganisation = (authors: string) => {
  // Commas only. A body's own name can contain "and" -- the Welsh Endocrine and
  // Diabetes Society is one organisation, not two.
  const parts = authors.split(',')
    .map((part) => part.trim().replace(/^and\s+/i, '')).filter(Boolean);
  return parts.length > 0 && parts.every((part) => ORGANISATION.test(part));
};

/** Share of the longer title's substantial words that the shorter one also carries. */
export function titleOverlap(a: string, b: string): number {
  const words = (text: string) => normalise(text).split(' ').filter((word) => word.length > 4);
  const [left, right] = [words(a), words(b)];
  if (left.length === 0 || right.length === 0) return 1;
  const share = (from: string[], against: string[]) =>
    from.filter((word) => against.includes(word)).length / from.length;
  // Either direction is enough: a record that publishes a title without its subtitle
  // is the same paper, and a paper that is genuinely different matches neither way.
  return Math.max(share(left, right), share(right, left));
}

export function compare(source: { readonly id: string; readonly title: string; readonly authors: string;
  readonly year: number }, where: string, record: { readonly title: string;
  readonly year: number; readonly authors: readonly string[] }, into: string[]): void {
  if (titleOverlap(source.title, record.title) < 0.6) {
    into.push(`${source.id}: ${where} is a different paper\n`
      + `    register: ${source.title}\n    record:   ${record.title || '(none)'}`);
    return;
  }
  if (Number.isFinite(record.year) && Math.abs(record.year - source.year) > 1) {
    into.push(`${source.id}: year ${source.year} but ${where} says ${record.year}`);
  }
  if (isOrganisation(source.authors)) return;
  const firstClaimed = surnames(source.authors)[0];
  const actualNames = record.authors.map((author) => normalise(author).split(' ')[0] ?? '');
  if (firstClaimed && actualNames.length > 0 && !actualNames.includes(firstClaimed)) {
    into.push(`${source.id}: first author "${firstClaimed}" is not on ${where}\n`
      + `    record: ${record.authors.slice(0, 4).join(', ')}`);
  }
}

