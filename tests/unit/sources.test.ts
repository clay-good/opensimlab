/**
 * The source register, and the rule that nothing cites outside it.
 *
 * An audit of every citation in this project found the age-related MAC relation
 * and all five MAC-at-40 values attributed to Nickalls and Mapleson 2003. They
 * are from Mapleson 1996; the 2003 paper is the iso-MAC charts built on that
 * relation. Somebody checking the numbers against the cited paper would not have
 * found them, and nothing here would have caught it.
 *
 * These tests are what catches it next time. Every PMID that appears anywhere in
 * the source tree must be in the register, and every register entry must say
 * specifically what was taken from it and how the citation was checked.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SOURCES, formatSource, registeredPmids, requireSource } from '@platform/docs/sources';

/** Every TypeScript file under src, so nothing can cite from a corner. */
function sourceFiles(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) sourceFiles(path, found);
    else if (/\.tsx?$/.test(entry)) found.push(path);
  }
  return found;
}

const files = sourceFiles(join(process.cwd(), 'src'));
const registerPath = join(process.cwd(), 'src/platform/docs/sources.ts');

describe('the register is complete', () => {
  it('contains every PMID cited anywhere in the source tree', () => {
    const registered = registeredPmids();
    const missing: string[] = [];
    for (const file of files) {
      if (file === registerPath) continue;
      const text = readFileSync(file, 'utf8');
      for (const match of text.matchAll(/PMID[:\s]+(\d{5,8})|pmid: '(\d{5,8})'/g)) {
        const pmid = match[1] ?? match[2]!;
        if (!registered.has(pmid)) missing.push(`${pmid} in ${file.replace(process.cwd(), '')}`);
      }
    }
    expect(missing, 'cited but not in the source register').toEqual([]);
  });

  it('has a unique id and a unique PMID for every entry', () => {
    expect(new Set(SOURCES.map((s) => s.id)).size).toBe(SOURCES.length);
    const pmids = SOURCES.flatMap((s) => (s.pmid ? [s.pmid] : []));
    expect(new Set(pmids).size).toBe(pmids.length);
  });
});

describe('every entry says enough to be checked', () => {
  it.each(SOURCES.map((s) => [s.id, s] as const))('%s', (_id, source) => {
    expect(source.authors.length).toBeGreaterThan(4);
    expect(source.title.length).toBeGreaterThan(20);
    expect(source.publication.length).toBeGreaterThan(3);
    expect(source.year).toBeGreaterThan(1950);
    expect(source.year).toBeLessThanOrEqual(2026);
    // A locator a reader can actually turn to — a volume and pages, a version,
    // or an explicit statement that the source is not version-pinned.
    if (source.unpinned) {
      // A section name or "the current one" — and the entry has to say WHY it
      // cannot be pinned, so `unpinned` never becomes a way to skip the work.
      expect(source.locator.length).toBeGreaterThan(10);
      expect(`${source.locator} ${source.verifiedAgainst}`).toContain('current');
    } else {
      expect(source.locator).toMatch(/\d/);
    }
    // What was taken from it, specifically. "Pharmacology" would not do.
    expect(source.usedFor.length).toBeGreaterThan(60);
    // How the citation itself was checked, not somebody's recollection.
    expect(source.verifiedAgainst.length).toBeGreaterThan(15);
    expect(source.verifiedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    if (source.pmid) expect(source.pmid).toMatch(/^\d{5,8}$/);
  });
});

describe('standards are tracked for currency, because they are amended', () => {
  it('records when the ASA monitoring standard was last amended, and when that was checked', () => {
    // The interface told learners it was showing them the 2020 revision while
    // the current one was 2025. Nothing here noticed, because nothing here
    // looked. This is what looking leaves behind.
    const asa = requireSource('asa-basic-monitoring');
    expect(asa.currency).toBeDefined();
    expect(asa.currency!.lastAmended).toBe('2025-10-15');
    expect(asa.year).toBe(2025);
  });

  it('shows the revision year the standard actually carries', async () => {
    const { ASA_MONITORING_EXPLAINER } = await import('@anesthesia/ui/tracks');
    const asa = requireSource('asa-basic-monitoring');
    expect(ASA_MONITORING_EXPLAINER.revisionYear)
      .toBe(Number(asa.currency!.lastAmended.slice(0, 4)));
  });

  it('says plainly which standards were read and which were not', () => {
    // IEC 60601-1-8 is paywalled. Following its conventions from secondary
    // engineering references is defensible; claiming to have read it is not.
    const iec = requireSource('iec-60601-1-8');
    expect(iec.verifiedAgainst).toContain('paywalled');
    expect(iec.verifiedAgainst).toContain('not read');
    expect(iec.usedFor).toContain('not a certified medical device');
  });
});

describe('a source that cannot be pinned says so', () => {
  it('is the exception, not the habit', () => {
    const unpinned = SOURCES.filter((source) => source.unpinned);
    expect(unpinned.length).toBeLessThan(SOURCES.length / 4);
  });

  it('is only used where the issuer publishes no fixed version to cite', () => {
    // A journal article is fixed once published, so a PMID and `unpinned` are
    // contradictory. Continuously revised documents — a drug label, an exam
    // content outline — are the only legitimate case.
    for (const source of SOURCES.filter((s) => s.unpinned)) {
      expect(source.pmid, `${source.id} has a PMID and does not need to be unpinned`).toBeUndefined();
      expect(source.verifiedAgainst).toMatch(/stale|current/);
    }
  });
});

describe('the entries that were found to be wrong', () => {
  it('attributes the MAC age relation to Mapleson 1996, not to the 2003 charts', () => {
    const mapleson = requireSource('mapleson-1996');
    expect(mapleson.pmid).toBe('8777094');
    expect(mapleson.year).toBe(1996);
    // The constants the code actually uses, named in the entry.
    expect(mapleson.usedFor).toContain('-0.00269');
    expect(mapleson.usedFor).toContain('1.80%');
    expect(mapleson.usedFor).toContain('6.6%');
    expect(mapleson.usedFor).toContain('104%');
  });

  it('keeps the 2003 charts, and records what they are NOT the source of', () => {
    const charts = requireSource('nickalls-mapleson-2003');
    expect(charts.pmid).toBe('12878613');
    expect(charts.usedFor).toContain('NOT the source');
  });

  it('states the LAST checklist version and its publication year separately', () => {
    // The checklist is the 2020 version and the paper appeared in 2021. Either
    // number alone looks like a mistake to someone holding the other.
    const last = requireSource('asra-last-2020');
    expect(last.year).toBe(2021);
    expect(last.title).toContain('2020');
    expect(last.usedFor).toContain('2021');
  });

  it('registers the current official adult cardiac-arrest algorithm and device energy boundary', () => {
    const source = requireSource('aha-adult-cardiac-arrest-2025');
    expect(source.publication).toContain('2025 American Heart Association');
    expect(source.usedFor).toContain('1 mg IV/IO epinephrine every 3-5 minutes');
    expect(source.usedFor).toContain('manufacturer guidance');
    expect(source.usedFor).toContain('120-200 J');
    expect(source.currency?.checkedAt).toBe('2026-08-24');
  });

  it('registers the evidence boundaries for the remaining manual crises', () => {
    const highSpinal = requireSource('oaa-high-central-neuraxial-block-current');
    expect(highSpinal.verifiedAgainst).toContain('official');
    expect(highSpinal.usedFor).toContain('bradycardia');

    const airEmbolism = requireSource('mccarthy-air-embolism-2017');
    expect(airEmbolism.pmid).toBe('28106717');
    expect(airEmbolism.usedFor).toContain('end-tidal carbon-dioxide');
  });
});

describe('the code agrees with the register', () => {
  it('uses the MAC constants the register says Mapleson published', async () => {
    const { MAC_40, MAC_AGE_EXPONENT, NITROUS_OXIDE_MAC_40_PERCENT } =
      await import('@anesthesia/pharmacology/pd');
    expect(MAC_AGE_EXPONENT).toBe(-0.00269);
    expect(MAC_40.sevoflurane).toBe(1.80);
    expect(MAC_40.isoflurane).toBe(1.17);
    expect(MAC_40.desflurane).toBe(6.6);
    expect(NITROUS_OXIDE_MAC_40_PERCENT).toBe(104);
  });

  it('keeps the exponent inside the published confidence limits', async () => {
    const { MAC_AGE_EXPONENT, MAC_AGE_EXPONENT_CL } = await import('@anesthesia/pharmacology/pd');
    const [low, high] = MAC_AGE_EXPONENT_CL;
    expect(MAC_AGE_EXPONENT).toBeGreaterThanOrEqual(low);
    expect(MAC_AGE_EXPONENT).toBeLessThanOrEqual(high);
  });

  it('uses the Severinghaus inversion exactly as the paper states it', async () => {
    const { saturationFromPo2 } = await import('@anesthesia/physiology/respiratory');
    // S = 1 / (23400 / (PO2^3 + 150 PO2) + 1), computed independently here.
    for (const po2 of [20, 27, 40, 60, 100, 200]) {
      const expected = 100 / (23400 / (po2 ** 3 + 150 * po2) + 1);
      expect(saturationFromPo2(po2)).toBeCloseTo(expected, 10);
    }
    // The half-saturation tension the curve implies is about 27 mmHg, which is
    // the value every textbook quotes and an independent check on the algebra.
    expect(saturationFromPo2(27)).toBeGreaterThan(49);
    expect(saturationFromPo2(27)).toBeLessThan(51);
  });
});

describe('formatting a source for a reader', () => {
  it('produces something a reader can paste into a search box', () => {
    const formatted = formatSource(requireSource('benumof-1997'));
    expect(formatted).toContain('Benumof JL');
    expect(formatted).toContain('Anesthesiology 1997;87:979-82');
    expect(formatted).toContain('PMID 9357902');
  });

  it('refuses an id nobody registered', () => {
    expect(() => requireSource('not-a-source')).toThrow(/No source registered/);
  });
});
