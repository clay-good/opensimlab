import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { Badge, Button } from '@platform/ui';

export function CiedPlanningTray({ assessment, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['ciedPlanningAssessment']>;
  onAction: (action: string) => void;
}) {
  const deviceReviewed = assessment?.deviceRecordReviewedAtTick != null;
  const procedureReviewed = assessment?.procedureRiskReviewedAtTick != null;
  const plan = assessment?.plan ?? null;
  const restoration = assessment?.backupAndRestorationDocumentedAtTick != null;
  return (
    <div className="tray-grid">
      <section className="syringe" aria-labelledby="cied-facts-title">
        <div id="cied-facts-title" className="syringe__name">Build the device picture</div>
        <Badge kind="teaching">Focused vignette</Badge>
        <div className="syringe__meta">Device · dependence · procedure · interference</div>
        <p className="syringe__remaining" role="status">
          {!deviceReviewed ? 'Device-record review pending'
            : !procedureReviewed ? 'Dual-chamber pacemaker · pacing dependent · documented magnet response'
              : 'Right shoulder · above umbilicus · anticipated monopolar electrosurgery'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={deviceReviewed}
            onClick={() => onAction('review-device-record')}>Review device record</Button>
          <Button className="crisis-drug__action" disabled={procedureReviewed}
            onClick={() => onAction('review-procedure-emi')}>Review procedure + EMI</Button>
        </div>
        <p className="field__hint">No interrogation, programming, magnet effect, cautery technique, or current-path calculation is simulated.</p>
      </section>
      <section className="syringe" aria-labelledby="cied-plan-title">
        <div id="cied-plan-title" className="syringe__name">Coordinate the whole plan</div>
        <div className="syringe__meta">Pacing strategy · backup · restoration</div>
        <p className="syringe__remaining" role="status">
          {restoration ? 'Backup, monitoring, and restoration documented'
            : plan === 'coordinate-asynchronous-pacing' ? 'Coordinated asynchronous pacing plan recorded'
              : plan ? 'Unsafe shortcut recorded for debrief' : 'Plan pending both reviews'}
        </p>
        {plan === null && <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!deviceReviewed || !procedureReviewed}
            onClick={() => onAction('coordinate-asynchronous-pacing')}>Coordinate asynchronous pacing</Button>
          <Button className="crisis-drug__action" disabled={!deviceReviewed || !procedureReviewed}
            onClick={() => onAction('apply-unverified-magnet')}>Apply magnet without confirmation</Button>
          <Button className="crisis-drug__action" disabled={!deviceReviewed || !procedureReviewed}
            onClick={() => onAction('proceed-no-change')}>Proceed with no device change</Button>
        </div>}
        <Button className="crisis-drug__action" disabled={plan === null || restoration}
          onClick={() => onAction('document-backup-and-restoration')}>Document backup + restoration</Button>
        <p className="field__hint">This case supports a patient-specific team plan, never a universal magnet rule or device order.</p>
      </section>
    </div>
  );
}
