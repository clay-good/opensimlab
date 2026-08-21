/**
 * Sevoflurane, which used to be a control that did nothing.
 *
 * The vaporizer setting reached the uptake model, so the end-tidal concentration
 * and the MAC fraction both climbed on screen — and nothing downstream read
 * either number. A learner could dial 8% and watch their patient sit at a depth
 * index of 93 with a normal blood pressure, wide awake at four and a half MAC.
 * A control that moves a figure and does not touch the patient is worse than no
 * control at all.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import {
  PROPOFOL_REMIFENTANIL_SURFACE, VOLATILE_DEPTH_MAC_50, combinedPotency, responseSurfaceEffect,
} from '@anesthesia/pharmacology/pd';

/** Hold the vaporizer at a setting for fifteen simulated minutes. */
function maintainedOn(sevofluranePercent: number) {
  const engine = new AnesthesiaEngine({
    scenario: ROUTINE_INDUCTION, seed: 7, practiceRegion: 'US',
  });
  engine.apply({
    type: 'ventilator',
    payload: { fio2: 1, delivering: true, mode: 'volume-control', sevofluranePercent },
    tick: 0,
  } as never);
  let state: Readonly<Record<string, number>> = {};
  for (let tick = 0; tick < 9000; tick += 1) state = engine.step().state;
  return { engine, state };
}

describe('a volatile reaches the depth index', () => {
  it('leaves an unanaesthetised patient alone', () => {
    const { state } = maintainedOn(0);
    expect(state.macFraction).toBe(0);
    expect(state.depthIndex).toBeGreaterThan(90);
  });

  it('reproduces the processed-EEG values reported against MAC', () => {
    // Indices sit in the mid-forties at 1 MAC, near sixty-five at half a MAC and
    // in the twenties at two MAC. All three come from one anchor, so getting
    // them together is the check that the anchor is the right endpoint.
    const at = (mac: number) => responseSurfaceEffect(0, 0, undefined, mac);
    expect(at(0.5)).toBeGreaterThan(60);
    expect(at(0.5)).toBeLessThan(72);
    expect(at(1.0)).toBeGreaterThan(38);
    expect(at(1.0)).toBeLessThan(52);
    expect(at(2.0)).toBeGreaterThan(18);
    expect(at(2.0)).toBeLessThan(30);
  });

  it('is anchored to the index endpoint, not to MAC-awake', () => {
    // MAC-awake is about 0.34 and is an EC50 for response to command. Using it
    // put the index at 30 for half a MAC — a lightly sedated patient reported as
    // deeply anaesthetised.
    expect(VOLATILE_DEPTH_MAC_50).toBeGreaterThan(0.7);
    expect(responseSurfaceEffect(0, 0, undefined, 0.5)).toBeGreaterThan(55);
  });

  it('adds to an intravenous hypnotic rather than interacting with it', () => {
    // The synergy term stays where it is established, between hypnotic and
    // opioid. A volatile treated as a third synergistic partner would be an
    // invented interaction.
    const surface = PROPOFOL_REMIFENTANIL_SURFACE;
    const both = combinedPotency(2, 0, surface, 0.5);
    const propofolOnly = combinedPotency(2, 0, surface, 0);
    const volatileOnly = combinedPotency(0, 0, surface, 0.5);
    expect(both).toBeCloseTo(propofolOnly + volatileOnly, 9);
  });

  it('deepens the patient as the vaporizer goes up', () => {
    const light = maintainedOn(1).state.depthIndex!;
    const surgical = maintainedOn(2).state.depthIndex!;
    const deep = maintainedOn(3).state.depthIndex!;
    expect(light).toBeGreaterThan(surgical);
    expect(surgical).toBeGreaterThan(deep);
    // Two per cent is a maintenance setting and lands in the surgical range.
    expect(surgical).toBeGreaterThan(30);
    expect(surgical).toBeLessThan(60);
  });
});

describe('a volatile reaches the circulation', () => {
  it('drops the blood pressure in proportion to dose', () => {
    const none = maintainedOn(0).state.meanArterialMmHg!;
    const one = maintainedOn(2).state.meanArterialMmHg!;
    const lots = maintainedOn(8).state.meanArterialMmHg!;
    expect(one).toBeLessThan(none);
    expect(lots).toBeLessThan(one);
    // A maintenance dose costs a recognisable fraction of the pressure, not all
    // of it and not none of it.
    expect((none - one) / none).toBeGreaterThan(0.1);
    expect((none - one) / none).toBeLessThan(0.35);
  });

  it('makes an overdose look like an overdose', () => {
    // Eight per cent is four and a half MAC. The patient should be profoundly
    // deep and profoundly hypotensive, which is the teaching.
    const { state } = maintainedOn(8);
    expect(state.macFraction).toBeGreaterThan(4);
    expect(state.depthIndex).toBeLessThan(15);
    expect(state.meanArterialMmHg).toBeLessThan(40);
  });

  it('names the volatile as the cause, as a teaching model', () => {
    const { engine } = maintainedOn(3);
    const attribution = engine.step().attribution;
    const terms = attribution.flatMap((entry) => entry.terms);
    const volatileTerms = terms.filter((term) => term.termId.startsWith('volatile-'));
    expect(volatileTerms.length).toBeGreaterThan(0);
    // Declared a teaching model wherever it drives a number.
    for (const term of volatileTerms) expect(term.teachingModel).toBe(true);
  });

  it('blunts the baroreflex, so the patient does not compensate', () => {
    // Deep on agent, the heart rate does not mount the tachycardia the falling
    // pressure would otherwise call for. That is why volatile hypotension keeps
    // falling until somebody turns the vaporizer down.
    const shallow = maintainedOn(1).state;
    const deep = maintainedOn(4).state;
    expect(deep.meanArterialMmHg!).toBeLessThan(shallow.meanArterialMmHg! - 15);
    expect(deep.heartRateBpm!).toBeLessThan(shallow.heartRateBpm! * 1.2);
  });
});
