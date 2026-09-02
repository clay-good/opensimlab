import type { OpioidXylazineAction } from './opioid-xylazine-persistent-sedation';

/**
 * Reference transcripts for the opioid-xylazine lesson.
 *
 * The error path is the one persistent sedation invites: she has had two doses
 * of naloxone and she is still not awake, so reach for a third. It is an
 * ordering error rather than a treatment error, because this lesson delivers no
 * treatment. What it skips is the beat where ventilation, oxygen and monitoring
 * get an owner — and breathing, not wakefulness, is the endpoint that was
 * always in danger here. The recovery path starts from that refusal and still
 * reaches a correct handoff in the same run.
 */
export const OPIOID_XYLAZINE_FIXTURES = {
  scenarioId: 'opioid-xylazine-persistent-sedation', contentVersion: '0.1.0', seed: 5869,
  noAction: [],
  expert: [
    [0, 'reconcile-toxicology-opioid-xylazine-exposure-rescue-breathing-sedation-perfusion-and-whole-patient'],
    [1, 'recognize-toxicology-opioid-xylazine-opioid-emergency-and-possible-adulterant-without-pupil-naloxone-response-or-screen-only-closure'],
    [2, 'activate-toxicology-opioid-xylazine-ventilation-oxygen-monitoring-toxicology-addiction-wound-and-dignity-ownership'],
    [3, 'review-toxicology-opioid-xylazine-supplied-respiratory-response-circulation-temperature-glucose-ecg-screen-wound-and-differential-boundary'],
    [4, 'record-toxicology-opioid-xylazine-bounded-qualified-continued-support-opioid-antagonist-symptomatic-care-no-veterinary-antagonist-and-strict-later-review'],
    [5, 'handoff-toxicology-opioid-xylazine-recurrent-depression-persistent-sedation-shock-hypothermia-wound-withdrawal-addiction-and-outcome-risk'],
  ],
  commonError: [
    [0, 'reconcile-toxicology-opioid-xylazine-exposure-rescue-breathing-sedation-perfusion-and-whole-patient'],
    [1, 'recognize-toxicology-opioid-xylazine-opioid-emergency-and-possible-adulterant-without-pupil-naloxone-response-or-screen-only-closure'],
    [2, 'record-toxicology-opioid-xylazine-bounded-qualified-continued-support-opioid-antagonist-symptomatic-care-no-veterinary-antagonist-and-strict-later-review'],
    [3, 'review-toxicology-opioid-xylazine-supplied-respiratory-response-circulation-temperature-glucose-ecg-screen-wound-and-differential-boundary'],
  ],
  recovery: [
    [0, 'reconcile-toxicology-opioid-xylazine-exposure-rescue-breathing-sedation-perfusion-and-whole-patient'],
    [1, 'recognize-toxicology-opioid-xylazine-opioid-emergency-and-possible-adulterant-without-pupil-naloxone-response-or-screen-only-closure'],
    [2, 'record-toxicology-opioid-xylazine-bounded-qualified-continued-support-opioid-antagonist-symptomatic-care-no-veterinary-antagonist-and-strict-later-review'],
    [3, 'activate-toxicology-opioid-xylazine-ventilation-oxygen-monitoring-toxicology-addiction-wound-and-dignity-ownership'],
    [4, 'review-toxicology-opioid-xylazine-supplied-respiratory-response-circulation-temperature-glucose-ecg-screen-wound-and-differential-boundary'],
    [5, 'record-toxicology-opioid-xylazine-bounded-qualified-continued-support-opioid-antagonist-symptomatic-care-no-veterinary-antagonist-and-strict-later-review'],
    [6, 'handoff-toxicology-opioid-xylazine-recurrent-depression-persistent-sedation-shock-hypothermia-wound-withdrawal-addiction-and-outcome-risk'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, OpioidXylazineAction])[];
  expert: readonly (readonly [number, OpioidXylazineAction])[];
  commonError: readonly (readonly [number, OpioidXylazineAction])[];
  recovery: readonly (readonly [number, OpioidXylazineAction])[];
};
