import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel } from '@anesthesia/ui/tutor-panel';
import { maternalArrestInlinePrompt } from '../obstetrics/tutor/maternal-cardiac-arrest-coordinated-response-guidance';
import { Button } from '@platform/ui';

export function ObstetricsMaternalArrestTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['obstetricsMaternalArrestAssessment']>;
  scenarioVersion: string;
  onAction: (action: string) => void;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
}) {
  const prompt = maternalArrestInlinePrompt(guidance, { scenarioVersion, maternalArrest: assessment });
  const act = demonstrating ? undefined : onAction;
  const support = assessment?.supportAtTick != null;
  const context = assessment?.contextAtTick != null;
  const modifications = assessment?.modificationsAtTick != null;
  const readiness = assessment?.readinessAtTick != null;
  const reassessment = assessment?.reassessmentAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    <TutorPanel prompt={demonstrating ? null : prompt} />
    <section className="syringe" aria-labelledby="obstetrics-maternal-arrest-now-title">
      <div id="obstetrics-maternal-arrest-now-title" className="syringe__name">Make the whole team ready at once.</div>
      <p className="syringe__remaining">Qualified standard resuscitation is already underway. Add the pregnancy clock, specialized roles, in-place delivery readiness, newborn care, and support without cluttering the learner surface.</p>
      <div className="crisis-drug__actions">
        {!support && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('activate-obstetrics-maternal-arrest-prepared-resuscitation-obstetric-anesthesia-delivery-newborn-and-dignity-response-now') : undefined}>Activate prepared response + clock</Button>}
        {support && !context && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('reconcile-obstetrics-maternal-arrest-clock-responsiveness-breathing-pulse-rhythm-pregnancy-and-whole-person') : undefined}>Connect arrest + pregnancy context</Button>}
        {context && !modifications && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-obstetrics-maternal-arrest-supplied-pregnancy-modifications-and-airway-priority-boundary') : undefined}>Review pregnancy responsibilities</Button>}
        {modifications && !readiness && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-obstetrics-maternal-arrest-reversible-causes-delivery-newborn-and-hemorrhage-readiness-boundary') : undefined}>Review causes + team readiness</Button>}
      </div>
    </section>
    <section className="syringe" aria-labelledby="obstetrics-maternal-arrest-later-title">
      <div id="obstetrics-maternal-arrest-later-title" className="syringe__name">Minute 4 is a readiness checkpoint.</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Active maternal resuscitation, cause, delivery, hemorrhage, newborn, family, staff, disposition, prognosis, and outcome risks handed off.' : reassessment ? 'Circulation has not returned. Qualified resuscitative delivery is beginning at the arrest location while advanced life support continues; completion and outcomes remain open.' : readiness ? 'Qualified maternal-arrest care and in-place delivery readiness are active. Review the fixed minute-4 report after time passes.' : support ? 'The prepared response is active. Connect the context, pregnancy responsibilities, open causes, and team readiness.' : 'Activate the prepared pregnancy cardiac-arrest response now. This practice includes team-owned resuscitative delivery; you can pause or leave at any time.'}</p>
      <div className="crisis-drug__actions">
        {readiness && !reassessment && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-obstetrics-maternal-arrest-fixed-minute-four-active-resuscitation-and-delivery-readiness-report') : undefined}>Review the minute-4 report</Button>}
        {reassessment && !handoff && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('handoff-obstetrics-maternal-arrest-active-arrest-cause-procedure-hemorrhage-newborn-family-and-outcome-risk') : undefined}>Hand off active maternal + newborn risk</Button>}
      </div>
    </section>
  </>;
}
