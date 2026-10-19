/**
 * `/<module>/scenario/<id>/facilitator`: the printable facilitator guide.
 *
 * Every line is generated from the scenario by `facilitatorGuide`; this file
 * only lays it out. Sections are never collapsed, because the guide is printed
 * and a closed disclosure prints as nothing.
 */
import { SiteBar } from '@platform/ui';
import { facilitatorGuide } from '@platform/facilitation/guide';
import { facilitatedScenarioFor } from '@platform/facilitation/scenario-catalog';
import { NOT_FOR_CLINICAL_USE } from '@platform/transcript/transcript';

export function FacilitatorGuideRoute({ path }: { path: string }) {
  const entry = facilitatedScenarioFor(path);
  if (entry === undefined) {
    return (
      <div className="document">
        <SiteBar />
        <main className="reading" id="main">
          <h1>No such facilitator guide</h1>
          <p>That address does not match a scenario. <a href="/for-educators">The educator pages</a> list them.</p>
        </main>
      </div>
    );
  }
  const briefing = `/${entry.moduleRoute}/scenario/${entry.scenario.metadata.id}`;
  return (
    <div className="document">
      <SiteBar />
      <main className="reading" id="main">
        <h1>Facilitator guide: {entry.scenario.metadata.title}</h1>
        <p>
          Generated from the scenario itself, so it cannot drift from what learners see. A section
          the scenario cannot fill says so rather than reading as complete.{' '}
          <a className="guide__screen-only" href={briefing}>Open the scenario briefing</a>
        </p>
        {facilitatorGuide(entry).map((section) => (
          <section key={section.id} className="guide__section document__group" aria-labelledby={`guide-${section.id}`}>
            <h2 id={`guide-${section.id}`}>{section.heading}</h2>
            {section.status === 'absent'
              ? <p className="guide__absent">Not available: {section.reason}</p>
              : (
                <ul>
                  {section.items.map((item, index) => (
                    <li key={`${section.id}-${index}`}>
                      {item.label !== undefined && <strong>{item.label}. </strong>}
                      {item.text}
                    </li>
                  ))}
                </ul>
              )}
          </section>
        ))}
        <p>{NOT_FOR_CLINICAL_USE}</p>
      </main>
      <footer className="document__foot">
        <a href={briefing}>Back to the scenario</a>
        <a href="/for-educators">For educators</a>
      </footer>
    </div>
  );
}
