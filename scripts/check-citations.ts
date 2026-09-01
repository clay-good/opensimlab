/**
 * Hold every PMID-bearing citation against the record it names.
 *
 * The register already asserted, in `verifiedAgainst`, that each entry had been
 * checked "field by field" against the NCBI record. Nothing enforced it. An audit
 * found twelve entries misattributed, five of them pointing at a completely
 * unrelated paper: a computational-chemistry study standing in for an Endocrine
 * Society guideline, a perineal-massage trial for a pulse-oximetry meta-analysis,
 * a gut-metagenomics method paper for an early-warning-score cohort.
 *
 * The test that existed checked MEMBERSHIP: every PMID appearing in the tree also
 * appears in the register. That is a different question from whether the register
 * describes the paper it points at, and only the second one protects a reader who
 * follows a citation to check a number.
 *
 * This is a script rather than a test because it needs the network. The test
 * suite must stay hermetic and offline; correctness of an external record is a
 * thing you go and ask about, on demand and before a release.
 *
 * Run: npm run verify:citations
 */
import { SOURCES } from '../src/platform/docs/sources.ts';

const ENDPOINT = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi';
const BATCH = 150;

interface Summary {
  readonly uid: string;
  readonly title?: string;
  readonly source?: string;
  readonly pubdate?: string;
  readonly authors?: readonly { readonly name: string }[];
}

/** Lowercase alphanumerics only, so punctuation and case never make a false mismatch. */
const normalise = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** A surname is the part a human checks first and the part least likely to be reformatted. */
function surnames(authors: string): string[] {
  return authors
    .split(/,|\band\b/)
    .map((part) => part.trim().replace(/\bet al\.?$/i, '').trim())
    .filter(Boolean)
    .map((part) => normalise(part).split(' ')[0] ?? '')
    .filter((name) => name.length > 2);
}

async function summaries(ids: readonly string[]): Promise<Map<string, Summary>> {
  const found = new Map<string, Summary>();
  for (let index = 0; index < ids.length; index += BATCH) {
    const slice = ids.slice(index, index + BATCH);
    const response = await fetch(`${ENDPOINT}?db=pubmed&retmode=json&id=${slice.join(',')}`);
    if (!response.ok) throw new Error(`NCBI returned ${response.status} for a batch of ${slice.length}`);
    const body = await response.json() as { result?: Record<string, unknown> & { uids?: string[] } };
    for (const uid of body.result?.uids ?? []) found.set(uid, body.result![uid] as Summary);
    // NCBI asks for no more than three requests a second without an API key.
    await new Promise((resolve) => { setTimeout(resolve, 400); });
  }
  return found;
}

const problems: string[] = [];
const cited = SOURCES.filter((source) => source.pmid);
const records = await summaries(cited.map((source) => source.pmid!));

for (const source of cited) {
  const record = records.get(source.pmid!);
  if (!record) { problems.push(`${source.id}: PMID ${source.pmid} returned no record`); continue; }

  // The title is the strongest signal, so a mismatch here is reported first and
  // on its own: it almost always means the PMID names a different paper.
  const claimed = normalise(source.title);
  const actual = normalise(record.title ?? '');
  const shared = claimed.split(' ').filter((word) => word.length > 4 && actual.includes(word)).length;
  const meaningful = claimed.split(' ').filter((word) => word.length > 4).length;
  if (meaningful > 0 && shared / meaningful < 0.6) {
    problems.push(`${source.id}: PMID ${source.pmid} is a different paper\n`
      + `    register: ${source.title}\n    pubmed:   ${record.title ?? '(none)'}`);
    continue;
  }

  const recordYear = Number.parseInt((record.pubdate ?? '').slice(0, 4), 10);
  if (Number.isFinite(recordYear) && Math.abs(recordYear - source.year) > 1) {
    problems.push(`${source.id}: year ${source.year} but PubMed says ${recordYear}`);
  }

  const claimedNames = surnames(source.authors);
  const actualNames = (record.authors ?? []).map((author) => normalise(author.name).split(' ')[0] ?? '');
  const firstClaimed = claimedNames[0];
  // Only the FIRST author is enforced. Guideline writing committees reorder and
  // abbreviate the tail constantly, and a rule that fires on that would be noise
  // nobody reads. A wrong first author is the misattribution that matters.
  if (firstClaimed && actualNames.length > 0 && !actualNames.includes(firstClaimed)) {
    problems.push(`${source.id}: first author "${firstClaimed}" is not on PMID ${source.pmid}\n`
      + `    pubmed: ${(record.authors ?? []).slice(0, 4).map((a) => a.name).join(', ')}`);
  }
}

process.stdout.write(`check-citations: ${cited.length} PMID-bearing entries checked against NCBI\n`);
if (problems.length > 0) {
  process.stdout.write(`\n${problems.length} problem(s):\n\n${problems.join('\n')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('check-citations: every entry matches the record it names\n');
}
