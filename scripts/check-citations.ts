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
 * A second pass covers the entries with no PMID. 79 of them record a DOI in their
 * locator or in what they were verified against, and Crossref answers for a DOI with
 * the same four fields NCBI answers with, so the same comparison holds them. That
 * takes the audit from 173 of 400 entries to 252. The remaining 148 are drug labels,
 * society guidance and web pages that carry no machine-resolvable identifier at all;
 * the script says so rather than counting them as passing.
 *
 * This is a script rather than a test because it needs the network. The test
 * suite must stay hermetic and offline; correctness of an external record is a
 * thing you go and ask about, on demand and before a release.
 *
 * Run: npm run verify:citations
 */
import { SOURCES } from '../src/platform/docs/sources.ts';
import { compare } from './citation-matching.ts';

const ENDPOINT = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi';
const CROSSREF = 'https://api.crossref.org/works';
/** Crossref asks for a contact address so it can reach a script that misbehaves. */
const CONTACT = 'opensimlab-citation-audit (mailto:hi@claygood.com)';
const BATCH = 150;

/**
 * A DOI as it appears inside a locator string, which is prose rather than a field:
 * `27:329-337; doi:10.1097/MEJ.0000000000000691`. Trailing sentence punctuation is
 * excluded because a DOI at the end of a clause picks it up.
 */
const DOI_IN_TEXT = /\b(10\.\d{4,9}\/[^\s;,)]+?)[.,;)]?(?=\s|$)/;
const doiOf = (source: { readonly locator?: string; readonly verifiedAgainst?: string }) =>
  DOI_IN_TEXT.exec(source.locator ?? '')?.[1] ?? DOI_IN_TEXT.exec(source.verifiedAgainst ?? '')?.[1];

interface Summary {
  readonly uid: string;
  readonly title?: string;
  readonly source?: string;
  readonly pubdate?: string;
  readonly authors?: readonly { readonly name: string }[];
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

interface CrossrefWork {
  readonly title?: readonly string[];
  readonly 'container-title'?: readonly string[];
  readonly issued?: { readonly 'date-parts'?: readonly (readonly number[])[] };
  readonly author?: readonly { readonly family?: string; readonly name?: string }[];
}

async function crossrefWork(doi: string): Promise<CrossrefWork | null> {
  const response = await fetch(`${CROSSREF}/${encodeURIComponent(doi)}`,
    { headers: { 'User-Agent': CONTACT } });
  // Crossref answers 404 for a DOI it does not register, which is a finding, not an outage.
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Crossref returned ${response.status} for ${doi}`);
  const body = await response.json() as { message?: CrossrefWork };
  return body.message ?? null;
}

/**
 * The same three comparisons both passes make, so a DOI-checked entry is held to the
 * standard a PMID-checked one is: the title names the same paper, the year is within a
 * year of the record's, and the first author is on it.
 */
const problems: string[] = [];
const cited = SOURCES.filter((source) => source.pmid);
const records = await summaries(cited.map((source) => source.pmid!));

for (const source of cited) {
  const record = records.get(source.pmid!);
  if (!record) { problems.push(`${source.id}: PMID ${source.pmid} returned no record`); continue; }
  compare(source, `PMID ${source.pmid}`, {
    title: record.title ?? '',
    year: Number.parseInt((record.pubdate ?? '').slice(0, 4), 10),
    authors: (record.authors ?? []).map((author) => author.name),
  }, problems);
}

// The entries with no PMID. Those recording a DOI are held to the same comparison
// against Crossref; the rest are counted and named as unresolvable by machine.
const uncited = SOURCES.filter((source) => !source.pmid);
const byDoi = uncited
  .map((source) => ({ source, doi: doiOf(source) }))
  .filter((entry): entry is { source: typeof entry.source; doi: string } => !!entry.doi);

for (const { source, doi } of byDoi) {
  const work = await crossrefWork(doi);
  if (!work) { problems.push(`${source.id}: DOI ${doi} is not registered with Crossref`); continue; }
  compare(source, `DOI ${doi}`, {
    title: work.title?.[0] ?? '',
    year: work.issued?.['date-parts']?.[0]?.[0] ?? Number.NaN,
    authors: (work.author ?? []).map((author) => author.family ?? author.name ?? ''),
  }, problems);
  // Crossref asks for a courteous rate rather than publishing a hard limit.
  await new Promise((resolve) => { setTimeout(resolve, 120); });
}

const unresolvable = uncited.length - byDoi.length;
process.stdout.write(`check-citations: ${cited.length} PMID-bearing entries checked against NCBI\n`);
process.stdout.write(`check-citations: ${byDoi.length} DOI-bearing entries checked against Crossref\n`);
process.stdout.write(`check-citations: ${unresolvable} entries carry neither a PMID nor a DOI `
  + '-- drug labels, society guidance and web pages, which only a person can check\n');
if (problems.length > 0) {
  process.stdout.write(`\n${problems.length} problem(s):\n\n${problems.join('\n')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('check-citations: every entry matches the record it names\n');
}
