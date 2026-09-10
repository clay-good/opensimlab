/**
 * PediatricInjurySafeguardingTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasPediatricInjurySafeguardingResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { pediatricInjurySafeguardingInlinePrompt } from './tutor/pediatric-injury-safeguarding-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function PediatricInjurySafeguardingTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['pediatricInjurySafeguardingAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const trajectory = assessment?.trajectoryAtTick != null;
  const concern = assessment?.concernAtTick != null;
  const safeguarding = assessment?.safeguardingAtTick != null;
  const alternatives = assessment?.alternativesAtTick != null;
  const laterSafety = assessment?.laterSafetyAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  const prompt = demonstrating ? null
    : pediatricInjurySafeguardingInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
    <WatchingNotice demonstrating={demonstrating} />
    <TutorPanel prompt={prompt} />
    <div className="tray-grid">
    <section className="syringe" aria-labelledby="pediatric-safeguarding-pattern-title">
      <div id="pediatric-safeguarding-pattern-title" className="syringe__name">Hold concern without closing the story.</div>
      <Badge kind="teaching">injury · development · history · alternatives · privacy · uncertainty</Badge>
      <div className="syringe__meta">2 years · 12 kg · medically stable · supplied record</div>
      <p className="syringe__remaining">
        {alternatives ? 'Privacy, alternatives, and source-aware documentation remain protected'
          : safeguarding ? 'Qualified safeguarding care is active · review alternatives and information boundaries'
            : concern ? 'A safeguarding concern is present · abuse is not diagnosed'
              : trajectory ? 'Now separate observed facts from explanation and inference'
                : 'Start with the child’s health, development, injuries, and supplied history.'}
      </p>
      <div className="syringe__presets">
        {!trajectory && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('reconcile-pediatric-injury-development-history-and-whole-child') : undefined}>Review child + supplied record</Button>}
        {trajectory && !concern && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('recognize-pediatric-injury-safeguarding-concern-without-diagnosis') : undefined}>Recognize concern without diagnosing</Button>}
        {concern && !safeguarding && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('activate-pediatric-injury-qualified-safeguarding-and-immediate-safety-ownership') : undefined}>Activate qualified safeguarding care</Button>}
        {safeguarding && !alternatives && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('review-pediatric-injury-medical-alternatives-and-information-boundary') : undefined}>Review alternatives + privacy</Button>}
      </div>
      <p className="field__hint">Qualified pediatric, safeguarding, nursing, social-work, and locally appropriate protection teams own examination, history, private-conversation decisions, documentation, testing, immediate safety, communication, and local duties. The scenario actions expose no interview, clinical free text, diagnosis, confrontation, accusation, photograph, clinical report filing, agency, legal, placement, or disposition control.</p>
    </section>
    <section className="syringe" aria-labelledby="pediatric-safeguarding-plan-title">
      <div id="pediatric-safeguarding-plan-title" className="syringe__name">Safety is shared work.</div>
      <Badge kind="teaching">child voice · privacy · immediate safety · medical needs · owners · handoff</Badge>
      <div className="syringe__meta">fixed team checkpoint · concern remains open</div>
      <p className="syringe__remaining" role="status">
        {handoff ? 'Active concern, privacy boundaries, and owners handed off.'
          : laterSafety ? 'Qualified safety coordination remains active. Diagnosis, legal outcome, and disposition remain open.'
            : alternatives ? 'Review the fixed multidisciplinary safety checkpoint.'
              : safeguarding ? 'Qualified safeguarding ownership is active · complete the protected-record review'
                : 'Recognition, qualified ownership, and privacy review proceed in order.'}
      </p>
      <div className="syringe__presets">
        {alternatives && !laterSafety && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('review-pediatric-injury-later-safety-state') : undefined}>Review the team safety checkpoint</Button>}
        {laterSafety && !handoff && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('handoff-pediatric-injury-unresolved-safeguarding-risk') : undefined}>Hand off concern + open questions</Button>}
      </div>
      <p className="field__hint">Team involvement does not prove abuse, identify a person responsible, establish a legal finding, close medical alternatives, or determine placement, disposition, prognosis, or outcome. Information remains need-to-know rather than absolutely confidential.</p>
    </section>
    </div>
  </div>;
}
