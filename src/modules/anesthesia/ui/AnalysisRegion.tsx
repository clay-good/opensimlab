/**
 * The Analysis region (design/layout → Analysis Region Is Tabbed).
 *
 * Tabs for Concentrations, Log, Patient and Learn. Concentrations is default.
 * Tab state and scroll position persist across pause and speed changes, and a
 * critical log entry raises an unread indicator without stealing focus.
 */

import { useMemo, useState } from 'react';
import { Badge, Button, CitationLink, EmptyState, Tabs, TabPanel } from '@platform/ui';
import { LogList } from '@platform/ui/monitor';
import { SEVERITIES, type Severity } from '@platform/log/event-log';
import type { Attribution, DrugConcentration, EngineEvent } from '@platform/kernel/protocol';
import type { HistorySample } from '@platform/session/session-store';
import type { Scenario } from '@anesthesia/engine';
import { ConcentrationPanel } from './ConcentrationPanel';
import { EXPLAINERS } from '@anesthesia/content/explainers';
import { ASA_MONITORING_EXPLAINER } from './tracks';
import { HONEST_STATUS } from '@platform/governance/status';

export type AnalysisTab = 'concentrations' | 'log' | 'patient' | 'learn';

export interface AnalysisRegionProps {
  readonly scenario: Scenario;
  readonly history: readonly HistorySample[];
  readonly concentrations: readonly DrugConcentration[];
  readonly attribution: readonly Attribution[];
  readonly log: readonly EngineEvent[];
  readonly unreadLog: boolean;
  readonly tick: number;
  readonly timeToPeakSeconds: Readonly<Record<string, number>>;
  readonly stacking: readonly { readonly tick: number; readonly drugId: string }[];
  readonly wide: boolean;
  readonly onSelectTick: (tick: number) => void;
  readonly selectedTick: number | null;
  readonly onExportCsv: () => void;
  readonly onOpenExplainer: (id: string) => void;
  readonly onMarkLogRead: () => void;
}

export function AnalysisRegion(props: AnalysisRegionProps) {
  const [tab, setTab] = useState<AnalysisTab>('concentrations');
  const [severityFilter, setSeverityFilter] = useState<Severity | 'all'>('all');

  const filtered = useMemo(
    () => (severityFilter === 'all' ? props.log : props.log.filter((entry) => entry.severity === severityFilter)),
    [props.log, severityFilter],
  );

  return (
    <div className={`analysis ${props.wide ? 'analysis--wide' : ''}`}>
      <Tabs
        label="Analysis"
        active={tab}
        onSelect={(id) => {
          setTab(id as AnalysisTab);
          if (id === 'log') props.onMarkLogRead();
        }}
        tabs={[
          { id: 'concentrations', label: 'Concentrations' },
          { id: 'log', label: 'Log', unread: props.unreadLog },
          { id: 'patient', label: 'Patient' },
          { id: 'learn', label: 'Learn' },
        ]}
      />
      <div className="analysis__body">
        <TabPanel id="concentrations" active={tab}>
          <ConcentrationPanel
            history={props.history}
            current={props.concentrations}
            tick={props.tick}
            timeToPeakSeconds={props.timeToPeakSeconds}
            stacking={props.stacking}
            onExportCsv={props.onExportCsv}
            pendingCheck
          />
        </TabPanel>

        <TabPanel id="log" active={tab}>
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBlockEnd: 'var(--space-3)' }}>
            <Button compact variant={severityFilter === 'all' ? 'primary' : 'ghost'} onClick={() => setSeverityFilter('all')}>
              All
            </Button>
            {SEVERITIES.map((severity) => (
              <Button
                key={severity}
                compact
                variant={severityFilter === severity ? 'primary' : 'ghost'}
                onClick={() => setSeverityFilter(severity)}
              >
                {severity}
              </Button>
            ))}
          </div>
          <p className="field__hint" role="status">
            {severityFilter === 'all'
              ? `${props.log.length} entries`
              : `Filtered to ${severityFilter}: ${filtered.length} of ${props.log.length} entries`}
          </p>
          <LogList entries={filtered} onSelect={props.onSelectTick} selectedTick={props.selectedTick} />
        </TabPanel>

        <TabPanel id="patient" active={tab}>
          <PatientPanel scenario={props.scenario} />
        </TabPanel>

        <TabPanel id="learn" active={tab}>
          <LearnPanel onOpen={props.onOpenExplainer} />
        </TabPanel>
      </div>
    </div>
  );
}

function PatientPanel({ scenario }: { scenario: Scenario }) {
  const patient = scenario.patient;
  const rows: [string, string][] = [
    ['Age', `${patient.ageYears} years`],
    ['Sex', patient.sex],
    ['Height', `${patient.heightCm} cm`],
    ['Weight', `${patient.weightKg} kg`],
    ['Body mass index', (patient.weightKg / (patient.heightCm / 100) ** 2).toFixed(1)],
    ['ASA physical status', String(patient.asaClass)],
    ['Diagnosis', patient.diagnosis],
    ['Procedure', patient.procedure],
    ['Comorbidities', (patient.comorbidities ?? []).join(', ') || 'None recorded'],
    ['Medications', (patient.medications ?? []).join(', ') || 'None recorded'],
    ['Allergies', (patient.allergies ?? []).join(', ') || 'None documented'],
    ['Fasting', patient.fasting ?? 'Not recorded'],
    ['Airway assessment', patient.airway.assessment ?? 'Not recorded'],
  ];
  return (
    <div className="reading" style={{ padding: 0 }}>
      <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 'var(--space-2) var(--space-4)' }}>
        {rows.map(([label, value]) => (
          <div key={label} style={{ display: 'contents' }}>
            <dt className="field__label">{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <p className="reading__aside">
        Derived values such as body mass index and lean body mass are computed from the profile,
        never stored, so they cannot drift from it.
      </p>
    </div>
  );
}

function LearnPanel({ onOpen }: { onOpen: (id: string) => void }) {
  return (
    <div className="reading" style={{ padding: 0 }}>
      <h2>Concepts this scenario exercises</h2>
      <ul style={{ listStyle: 'none' }}>
        {EXPLAINERS.map((explainer) => (
          <li key={explainer.id}>
            <Button variant="ghost" onClick={() => onOpen(explainer.id)}>{explainer.title}</Button>
          </li>
        ))}
      </ul>

      <h2>Why these parameters</h2>
      <p>
        The monitored set maps onto the four categories the{' '}
        {ASA_MONITORING_EXPLAINER.standard} require to be evaluated continually.
      </p>
      <dl>
        {Object.entries(ASA_MONITORING_EXPLAINER.categories).map(([category, description]) => (
          <div key={category}>
            <dt className="field__label">{category}</dt>
            <dd>{description}</dd>
          </div>
        ))}
      </dl>
      <p className="reading__aside">
        {ASA_MONITORING_EXPLAINER.standard}, revision {ASA_MONITORING_EXPLAINER.revisionYear}.
        Non-invasive pressure defaults to the {ASA_MONITORING_EXPLAINER.nibpIntervalMaxMinutes}-minute
        maximum interval the standard specifies.
      </p>

      <Badge kind="out-of-range">{HONEST_STATUS.headline}</Badge>
      <p className="reading__aside">{HONEST_STATUS.detail}</p>
      <CitationLink href="https://www.asahq.org/standards-and-practice-parameters/standards-for-basic-anesthetic-monitoring">
        Read the ASA Standards for Basic Anesthetic Monitoring
      </CitationLink>
    </div>
  );
}

export function EmptyAnalysis() {
  return <EmptyState title="Nothing to analyse yet">Start the scenario to see concentrations and events.</EmptyState>;
}
