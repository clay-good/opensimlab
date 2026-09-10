/**
 * The citation audit is only worth running if it still fires.
 *
 * An earlier audit found twelve register entries misattributed, five pointing at a
 * completely unrelated paper. The comparison that catches that has since been loosened
 * twice -- once so a record publishing a title without its subtitle is not called a
 * different paper, once so a guideline cited by the body that issued it is not accused
 * of having the wrong first author. Both are real, and both are the shape a genuine
 * misattribution could hide behind, so this file holds the loosening to exactly what
 * was intended.
 */
import { describe, expect, it } from 'vitest';
import { compare, isOrganisation, surnames, titleOverlap } from '../../scripts/citation-matching';

const problems = (source: Parameters<typeof compare>[0], record: Parameters<typeof compare>[2]) => {
  const found: string[] = [];
  compare(source, 'the record', record, found);
  return found;
};

const REGISTER = {
  id: 'entry',
  title: 'Respiratory Management of Patients With Neuromuscular Weakness: '
    + 'An American College of Chest Physicians Clinical Practice Guideline',
  authors: 'Khan A, Frank J, Geiger G, et al',
  year: 2023,
};

describe('Requirement: a register entry is matched to the record it names', () => {
  it('still reports a record that is a different paper', () => {
    expect(problems(REGISTER, { title: 'Perineal massage in the second stage of labour',
      year: 2023, authors: ['Khan'] })[0]).toContain('is a different paper');
  });

  it('accepts a record that publishes the title without its subtitle', () => {
    expect(problems(REGISTER, { title: 'Respiratory Management of Patients With Neuromuscular Weakness',
      year: 2023, authors: ['Khan'] })).toEqual([]);
  });

  it('reports a first author who is not on the record', () => {
    expect(problems(REGISTER, { ...REGISTER, authors: ['Lindner', 'Burdmann'] })[0])
      .toContain('first author "khan" is not on the record');
  });

  it('reports a year more than a year from the record', () => {
    expect(problems(REGISTER, { ...REGISTER, authors: ['Khan'], year: 2019 })[0])
      .toContain('year 2023 but the record says 2019');
  });

  it('waives the author check for a body that issued its own guideline', () => {
    expect(problems({ ...REGISTER, authors: 'American Heart Association' },
      { ...REGISTER, authors: ['Cao', 'Arens'] })).toEqual([]);
  });

  it('waives it for a joint statement naming several bodies', () => {
    expect(isOrganisation('European Thyroid Association, British Thyroid Association, '
      + 'Society for Endocrinology, and Welsh Endocrine and Diabetes Society')).toBe(true);
  });

  it('does not waive it for a list of people, however long', () => {
    expect(isOrganisation('Lindner G, Burdmann EA, Clase CM, et al')).toBe(false);
    expect(problems({ ...REGISTER, authors: 'Lindner G, Burdmann EA, Clase CM, et al' },
      { ...REGISTER, authors: ['Cao', 'Arens'] })[0]).toContain('first author');
  });

  it('does not waive it when one personal name sits among organisations', () => {
    expect(isOrganisation('American Heart Association, Smith J')).toBe(false);
  });

  it('measures title overlap in whichever direction is more forgiving', () => {
    expect(titleOverlap('Acute hyperkalemia in the emergency department',
      'Acute hyperkalemia in the emergency department: a summary')).toBe(1);
    expect(titleOverlap('Acute hyperkalemia in the emergency department',
      'Perineal massage in the second stage of labour')).toBeLessThan(0.6);
  });

  it('reads a surname past an initial and past "et al"', () => {
    expect(surnames('Lindner G, Burdmann EA, Clase CM, et al')).toEqual(['lindner', 'burdmann', 'clase']);
  });
});
