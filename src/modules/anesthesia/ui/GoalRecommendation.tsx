import { useState } from 'react';
import type { Scenario } from '@anesthesia/engine';
import type { PreparationPathId } from '@anesthesia/catalog/preparation-paths';
import { dismissRecommendation, recommendationDismissed } from '@anesthesia/catalog/recommendation-state';
import { MaturityMarker } from '@platform/governance/MaturityMarker';
import { Button, Panel } from '@platform/ui';

export interface GoalRecommendationProps {
  readonly pathId: PreparationPathId;
  readonly pathTitle: string;
  readonly scenario: Scenario;
  readonly reason: string;
  readonly now?: () => number;
}

export function GoalRecommendation({
  pathId, pathTitle, scenario, reason, now = () => new Date().getTime(),
}: GoalRecommendationProps) {
  const [dismissed, setDismissed] = useState(() => recommendationDismissed(pathId, now()));
  if (dismissed) return null;
  return (
    <Panel title="A good next rehearsal">
      <p className="field__hint">Your private path · {pathTitle}</p>
      <p><a href={`/anesthesia/scenario/${scenario.metadata.id}?goal=${pathId}`}>{scenario.metadata.title}</a></p>
      <MaturityMarker
        compact
        status={scenario.metadata.maturity}
        subjectKind="scenario"
        subjectId={scenario.metadata.id}
        contentVersion={scenario.metadata.version}
      />
      <p>{reason}</p>
      <p className="reading__aside">This suggestion uses only the goal in this link and the path stored in the offline catalog. It does not measure competence.</p>
      <Button compact variant="ghost" onClick={() => {
        dismissRecommendation(pathId, now());
        setDismissed(true);
      }}>
        Hide this suggestion for 7 days
      </Button>
    </Panel>
  );
}
