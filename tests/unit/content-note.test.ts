/**
 * The content note: what a learner may decline before starting.
 *
 * It exists for the blind draw, where the title, the module and the objectives
 * are withheld until the reveal, and a learner who would rather not meet a
 * death today has nothing else to go on. That is also why the one rule with
 * teeth is the leak rule: a note that repeats its own title's distinctive words
 * gives away the lesson it is standing in front of.
 *
 * Nothing in the catalogue declares one yet. That is recorded here rather than
 * assumed, so the day it changes, this test says so instead of quietly passing.
 */
import { describe, expect, it } from 'vitest';
import { CONTENT_NOTE_LIMIT, validateScenario } from '@anesthesia/scenarios/schema';
import { SCENARIOS } from '@anesthesia/scenarios';
import { facilitatorGuide } from '@platform/facilitation/guide';
import { FACILITATED_SCENARIOS } from '@platform/facilitation/scenario-catalog';

const base = SCENARIOS[0]!;
const withNote = (contentNote: string) => ({
  ...base, metadata: { ...base.metadata, contentNote },
});

describe('a scenario content note', () => {
  it('is optional, and every scenario is still valid without one', () => {
    expect(validateScenario(base)).toEqual([]);
    expect(base.metadata.contentNote).toBeUndefined();
  });

  it('accepts one short sentence that does not name the lesson', () => {
    expect(validateScenario(withNote('A patient dies during this lesson.'))).toEqual([]);
  });

  it('refuses a note longer than one sentence\'s worth', () => {
    const long = `A patient dies. ${'x'.repeat(CONTENT_NOTE_LIMIT)}`;
    const errors = validateScenario(withNote(long));
    expect(errors.map((error) => error.rule)).toContain('bounds');
    expect(errors.find((error) => error.rule === 'bounds')?.pointer).toBe('/metadata/contentNote');
  });

  it('refuses a note that repeats a distinctive word from its own title', () => {
    // The title is "Routine induction of general anaesthesia".
    const errors = validateScenario(withNote('This lesson covers the induction of a patient.'));
    expect(errors.map((error) => error.rule)).toContain('leak');
    expect(errors.find((error) => error.rule === 'leak')?.message).toContain('induction');
  });

  it('does not read a short shared word as a leak', () => {
    expect(validateScenario(withNote('The patient in this lesson is harmed.'))).toEqual([]);
  });

  it('shows in the facilitator guide as absent, saying absence is not an assurance', () => {
    const section = facilitatorGuide(FACILITATED_SCENARIOS[0]!)
      .find((entry) => entry.id === 'content-note');
    expect(section?.status).toBe('absent');
    expect(section?.status === 'absent' && section.reason).toContain('not an assurance');
  });

  /**
   * The set is pinned by name, both ways. A lesson added to it has had its own
   * course read, and a lesson dropped from it stops warning someone, so neither
   * should be possible without saying so in a diff.
   *
   * The rule the set follows: a cardiac arrest, a death, or the resuscitation
   * of a newborn or a child is this lesson's own modelled course. Not a risk it
   * hands off, and not an arrest that happened before it starts - post-arrest
   * temperature control is deliberately absent for that reason.
   */
  it('is declared by exactly the lessons whose course was read for it', () => {
    const declared = FACILITATED_SCENARIOS
      .filter((entry) => entry.scenario.metadata.contentNote !== undefined)
      .map((entry) => `${entry.moduleRoute}:${entry.scenario.metadata.id}`)
      .sort();
    expect(declared).toEqual([
      'anesthesia:persistent-vf-cardiac-arrest',
      'emergency-medicine:pea-arrest',
      'emergency-medicine:persistent-vf-arrest',
      'neonatology:ineffective-ventilation-correction',
      'neonatology:neonatal-bradycardia',
      'obstetrics:maternal-cardiac-arrest-coordinated-response',
      'obstetrics:maternal-to-neonatal-resuscitation-handoff',
      'pediatrics:pediatric-bradycardic-arrest',
      'pediatrics:pediatric-foreign-body-airway-obstruction',
    ]);
  });

  it('writes every declared note as one plain sentence that passes the validator', () => {
    for (const entry of FACILITATED_SCENARIOS) {
      const note = entry.scenario.metadata.contentNote;
      if (note === undefined) continue;
      const where = `${entry.moduleRoute}:${entry.scenario.metadata.id}`;
      expect([where, validateScenario(entry.scenario)]).toEqual([where, []]);
      expect([where, note.length <= CONTENT_NOTE_LIMIT]).toEqual([where, true]);
      expect([where, note.endsWith('.')]).toEqual([where, true]);
      // It says what happens, not what the learner will be judged on.
      expect([where, /score|fail|should|must/i.test(note)]).toEqual([where, false]);
    }
  });

  it('shows a declared note on the briefing, above everything else about the lesson', () => {
    const entry = FACILITATED_SCENARIOS
      .find((candidate) => candidate.scenario.metadata.id === 'pea-arrest')!;
    const section = facilitatorGuide(entry).find((item) => item.id === 'content-note');
    expect(section?.status).toBe('present');
    expect(section?.status === 'present' && section.items[0]?.text)
      .toBe(entry.scenario.metadata.contentNote);
  });
});
