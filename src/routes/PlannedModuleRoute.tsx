/**
 * A planned module's route (platform/delivery → An unbuilt module route is honest).
 *
 * States that the module is planned, describes what it will cover, and links to
 * the module that exists. It is prerendered and indexable, and promises no date.
 */

import { Button } from '@platform/ui';
import { RELEASE_FEED_URL, type ModuleDeclaration } from '@platform/modules/registry';

export function PlannedModuleRoute({ module }: { module: ModuleDeclaration }) {
  return (
    <main className="reading" id="main">
      <h1>{module.displayName} — planned</h1>
      <p>
        This module is planned and not yet built. There is no interactive entry point here,
        because there is nothing behind it yet.
      </p>

      <h2>What it will cover</h2>
      <p>{module.plannedScope}</p>

      <h2>Who it will be for</h2>
      <p>{module.audience}</p>
      <p className="field__hint">Prerequisites: {module.prerequisites}</p>

      <h2>When</h2>
      <p>
        No date is promised. The project does not commit to a schedule it cannot keep, so there is
        no quarter, no countdown, and no waiting list.{' '}
        <a href={RELEASE_FEED_URL} rel="noreferrer noopener">
          Watch the repository releases to hear when it ships
        </a>
        . No email address is collected.
      </p>

      <h2>What is available today</h2>
      <p>The anesthesia module is built and running.</p>
      <Button variant="primary" onClick={() => { window.location.href = '/anesthesia'; }}>
        Open the anesthesia simulator
      </Button>
      <p><a href="/">Back to the Open Sim Lab front page</a></p>
    </main>
  );
}
