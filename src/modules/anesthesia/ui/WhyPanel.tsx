/**
 * The Why panel (learning/knowledge-layer → The Why Panel).
 *
 * Generated from the engine's own attribution data for the CURRENT state, using
 * this session's actual numbers. It is not prewritten text, and where a
 * contributor comes from a teaching model rather than a published one it says so
 * in that line.
 */

import { Badge, Button, Drawer } from '@platform/ui';
import type { Attribution } from '@platform/kernel/protocol';
import { FIELDS, type StateField } from '@anesthesia/physiology';
import { EXPLAINERS } from '@anesthesia/content/explainers';

/** Which explainer each attribution term links to. */
/**
 * Which explainer answers "why is this happening" for each attribution term.
 *
 * EVERY term the engine can emit needs an entry. The panel names the term
 * whatever happens, but the reading behind it is the point of opening the panel
 * at all — and the terms added most recently were the ones most worth reading
 * about: a learner watching a pressure collapse from unrelieved hypoxaemia is
 * exactly the person who should be pushed toward the safe-apnoea explainer.
 * `tests/ui/why-panel.test.tsx` fails the build if a term has no entry.
 */
const TERM_EXPLAINERS: Record<string, string> = {
  'propofol-vasodilation': 'vasodilation-versus-hypovolemia',
  'opioid-vasodilation': 'vasodilation-versus-hypovolemia',
  hypovolemia: 'vasodilation-versus-hypovolemia',
  'propofol-myocardial-depression': 'vasodilation-versus-hypovolemia',
  'positive-pressure-ventilation': 'vasodilation-versus-hypovolemia',
  apnea: 'preoxygenation-and-safe-apnea-time',
  'upper-airway-closure': 'capnogram-morphology',
  'opioid-bradycardia': 'hypnotic-opioid-synergy',
  'surgical-stimulus': 'hypnotic-opioid-synergy',
  // The baroreflex is why a pressure that fell is not still falling, which is
  // the same lesson as telling vasodilation from hypovolaemia.
  baroreflex: 'vasodilation-versus-hypovolemia',
  vasopressor: 'vasodilation-versus-hypovolemia',
  'volatile-vasodilation': 'vasodilation-versus-hypovolemia',
  'volatile-myocardial-depression': 'vasodilation-versus-hypovolemia',
  // The hypoxic terms all lead to safe apnoea time, because the question they
  // raise is always the same one: how long was there, and what was spent.
  'hypoxic-tachycardia': 'preoxygenation-and-safe-apnea-time',
  'hypoxic-bradycardia': 'preoxygenation-and-safe-apnea-time',
  'hypoxic-myocardial-failure': 'preoxygenation-and-safe-apnea-time',
  'rocuronium-blockade': 'train-of-four-and-residual-blockade',
};

/** Exported so a test can require every emitted term to have an entry. */
export const TERM_EXPLAINER_IDS = TERM_EXPLAINERS;

export interface WhyPanelProps {
  readonly open: boolean;
  readonly field: StateField | null;
  readonly value: number | null;
  readonly attribution: readonly Attribution[];
  readonly onClose: () => void;
  readonly onOpenExplainer: (id: string) => void;
  readonly onOpenDrugCard: (drugId: string) => void;
}

export function WhyPanel({
  open, field, value, attribution, onClose, onOpenExplainer, onOpenDrugCard,
}: WhyPanelProps) {
  if (!field) return null;
  const spec = FIELDS[field];
  const entry = attribution.find((candidate) => candidate.variable === field);

  return (
    <Drawer open={open} title={`Why is ${spec.label} doing that?`} onClose={onClose}>
      <p className="numeric" style={{ font: 'var(--type-vital-m)' }}>
        {value === null ? '--' : value.toFixed(spec.precision)}{' '}
        <span className="vital-tile__unit">{spec.unit}</span>
      </p>

      {!entry || entry.terms.length === 0 ? (
        <p className="field__hint">
          Nothing is currently pushing on {spec.label.toLowerCase()}. It is sitting where the
          patient&apos;s own baseline puts it.
        </p>
      ) : (
        <>
          <p className="field__hint">
            Ranked contributors right now, from this session&apos;s own numbers:
          </p>
          <ul style={{ listStyle: 'none' }}>
            {entry.terms.map((term) => {
              const explainerId = TERM_EXPLAINERS[term.termId];
              const explainer = EXPLAINERS.find((candidate) => candidate.id === explainerId);
              return (
                <li key={term.termId} className="why-panel__term">
                  <div>
                    <div>{term.label}</div>
                    <div
                      className="why-panel__bar"
                      style={{ inlineSize: `${Math.round(term.share * 100)}%` }}
                      aria-hidden="true"
                    />
                    {term.teachingModel && (
                      <Badge kind="teaching">
                        From an Open Sim Lab teaching model, not a published one
                      </Badge>
                    )}
                    {explainer && (
                      <Button variant="ghost" compact onClick={() => onOpenExplainer(explainer.id)}>
                        {explainer.title}
                      </Button>
                    )}
                    {term.termId.startsWith('propofol') && (
                      <Button variant="ghost" compact onClick={() => onOpenDrugCard('propofol')}>
                        Propofol card
                      </Button>
                    )}
                    {term.termId.startsWith('opioid') && (
                      <Button variant="ghost" compact onClick={() => onOpenDrugCard('remifentanil')}>
                        Remifentanil card
                      </Button>
                    )}
                    {term.termId.startsWith('rocuronium') && (
                      <Button variant="ghost" compact onClick={() => onOpenDrugCard('rocuronium')}>
                        Rocuronium card
                      </Button>
                    )}
                  </div>
                  <span className="why-panel__share">
                    {(term.share * 100).toFixed(0)}%
                    <span className="visually-hidden"> of the current change</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}
      <p className="reading__aside">
        The simulation continues or stays paused exactly as it was. Closing this returns you to
        where you were.
      </p>
    </Drawer>
  );
}
