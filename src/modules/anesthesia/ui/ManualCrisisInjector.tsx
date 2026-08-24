/** Scenario-author tool for transcripted, deterministic manual crisis injection. */

import { useState } from 'react';
import { Badge, Button } from '@platform/ui';

export interface CrisisInjection {
  readonly id: string;
  readonly label: string;
  readonly boundary: string;
}

export const MODELED_CRISIS_INJECTIONS: readonly CrisisInjection[] = [
  { id: 'massive-hemorrhage', label: 'Massive hemorrhage', boundary: 'Starts ongoing whole-blood loss at 100 mL/min.' },
  { id: 'anaphylaxis', label: 'Anaphylaxis', boundary: 'Starts the bounded coupled cardiovascular and bronchospasm response.' },
  { id: 'laryngospasm', label: 'Laryngospasm', boundary: 'Closes an unsecured upper airway completely.' },
  { id: 'bronchospasm', label: 'Bronchospasm', boundary: 'Starts severe lower-airway obstruction.' },
  { id: 'malignant-hyperthermia', label: 'Malignant hyperthermia susceptibility', boundary: 'Arms susceptibility; genuine volatile exposure is still required.' },
  { id: 'local-anesthetic-systemic-toxicity', label: 'Local-anesthetic systemic toxicity', boundary: 'Starts the bounded severe toxicity teaching trajectory.' },
  { id: 'cardiac-arrest-shockable', label: 'Cardiac arrest · shockable VF', boundary: 'Starts pulseless ventricular fibrillation.' },
  { id: 'cardiac-arrest-non-shockable', label: 'Cardiac arrest · non-shockable asystole', boundary: 'Starts asystole; defibrillation cannot convert it.' },
  { id: 'tiva-line-disconnection-under-paralysis', label: 'TIVA line disconnection', boundary: 'Disconnects delivered propofol; paralysis must already be present to create the specified combined pattern.' },
  { id: 'high-spinal', label: 'High spinal', boundary: 'Starts a progressive high-neuraxial-block teaching pattern: hypotension, bradycardia, and impaired unassisted breathing.' },
  { id: 'air-embolism', label: 'Venous air embolism', boundary: 'Starts an abrupt pulmonary-flow obstruction teaching pattern with falling end-tidal carbon dioxide, pressure, output, and oxygen saturation.' },
] as const;

export function ManualCrisisInjector({ injectedCrisisIds, onInject }: {
  readonly injectedCrisisIds: readonly string[];
  readonly onInject: (crisisId: string) => void;
}) {
  const [pending, setPending] = useState<string | null>(null);
  return (
    <div className="reading" style={{ padding: 0 }}>
      <p>
        Inject a modeled crisis into the current patient. Every accepted injection is recorded in
        the transcript and event log. The patient, equipment, and current drugs still matter.
      </p>
      <Badge kind="teaching">Scenario-author tool</Badge>
      <div style={{ display: 'grid', gap: 'var(--space-3)', marginBlockStart: 'var(--space-4)' }}>
        {MODELED_CRISIS_INJECTIONS.map((crisis) => (
          <section className="card" key={crisis.id}>
            <h3 className="panel__title">{crisis.label}</h3>
            <p className="field__hint">{crisis.boundary}</p>
            {pending !== crisis.id ? (
              <Button disabled={injectedCrisisIds.includes(crisis.id)}
                onClick={() => setPending(crisis.id)}>
                {injectedCrisisIds.includes(crisis.id) ? 'Already injected' : `Select ${crisis.label}`}
              </Button>
            ) : (
              <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                <Button variant="primary" onClick={() => { onInject(crisis.id); setPending(null); }}>
                  Inject {crisis.label}
                </Button>
                <Button variant="ghost" onClick={() => setPending(null)}>Cancel</Button>
              </div>
            )}
          </section>
        ))}
      </div>
      <p className="field__hint">
        High spinal does not estimate block height or obstetric physiology. Venous air embolism
        does not estimate gas volume, diagnose the cause, or model paradoxical or cerebral embolism.
      </p>
    </div>
  );
}
