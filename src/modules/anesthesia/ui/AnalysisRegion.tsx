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
import { t } from '@platform/i18n/messages';

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
  readonly initialTab?: AnalysisTab;
  readonly moduleId?: string;
}

export function AnalysisRegion(props: AnalysisRegionProps) {
  const [tab, setTab] = useState<AnalysisTab>(props.initialTab ?? 'concentrations');
  const [severityFilter, setSeverityFilter] = useState<Severity | 'all'>('all');

  const filtered = useMemo(
    () => (severityFilter === 'all' ? props.log : props.log.filter((entry) => entry.severity === severityFilter)),
    [props.log, severityFilter],
  );

  return (
    <div className={`analysis ${props.wide ? 'analysis--wide' : ''}`}>
      <Tabs
        label={t('analysis.label')}
        active={tab}
        onSelect={(id) => {
          setTab(id as AnalysisTab);
          if (id === 'log') props.onMarkLogRead();
        }}
        tabs={[
          { id: 'concentrations', label: t('analysis.tab-concentrations') },
          { id: 'log', label: t('analysis.tab-log'), unread: props.unreadLog },
          { id: 'patient', label: t('analysis.tab-patient') },
          { id: 'learn', label: t('analysis.tab-learn') },
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
              {t('analysis.filter-all')}
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
              ? t('analysis.entries', { count: props.log.length })
              : t('analysis.entries-filtered', { severity: severityFilter, shown: filtered.length, count: props.log.length })}
          </p>
          <LogList entries={filtered} onSelect={props.onSelectTick} selectedTick={props.selectedTick} />
        </TabPanel>

        <TabPanel id="patient" active={tab}>
          <PatientPanel scenario={props.scenario} moduleId={props.moduleId} />
        </TabPanel>

        <TabPanel id="learn" active={tab}>
          <LearnPanel onOpen={props.onOpenExplainer} />
        </TabPanel>
      </div>
    </div>
  );
}

function PatientPanel({ scenario, moduleId }: { scenario: Scenario; moduleId?: string }) {
  const patient = scenario.patient;
  const perioperativeProfile = moduleId !== 'respiratory-medicine' && moduleId !== 'pediatrics' && moduleId !== 'neonatology' && moduleId !== 'endocrine-metabolic';
  const rows: [string, string][] = [
    [t('patient.age'), patient.ageYears === 0 ? t('status.newborn') : t('patient.age-years', { years: patient.ageYears })],
    [t('patient.sex'), patient.sex],
    [t('patient.height'), t('patient.height-cm', { cm: patient.heightCm })],
    [t('patient.weight'), t('status.weight', { kg: patient.weightKg })],
    [t('patient.bmi'), (patient.weightKg / (patient.heightCm / 100) ** 2).toFixed(1)],
    ...(perioperativeProfile ? [[t('patient.asa'), String(patient.asaClass)] as [string, string]] : []),
    [t('patient.diagnosis'), patient.diagnosis],
    [t('patient.procedure'), patient.procedure],
    [t('patient.comorbidities'), (patient.comorbidities ?? []).join(', ') || t('patient.none-recorded')],
    [t('patient.medications'), (patient.medications ?? []).join(', ') || t('patient.none-recorded')],
    [t('patient.allergies'), (patient.allergies ?? []).join(', ') || t('patient.none-documented')],
    ...(perioperativeProfile ? [[t('patient.fasting'), patient.fasting ?? t('patient.not-recorded')] as [string, string]] : []),
    [t('patient.airway'), patient.airway.assessment ?? t('patient.not-recorded')],
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
      <p className="reading__aside">{t('patient.derived')}</p>
    </div>
  );
}

function LearnPanel({ onOpen }: { onOpen: (id: string) => void }) {
  return (
    <div className="reading" style={{ padding: 0 }}>
      <h2>{t('learn.concepts')}</h2>
      <ul style={{ listStyle: 'none' }}>
        {EXPLAINERS.map((explainer) => (
          <li key={explainer.id}>
            <Button variant="ghost" onClick={() => onOpen(explainer.id)}>{explainer.title}</Button>
          </li>
        ))}
      </ul>

      <h2>{t('learn.why-parameters')}</h2>
      <p>{t('learn.categories', { standard: ASA_MONITORING_EXPLAINER.standard })}</p>
      <dl>
        {Object.entries(ASA_MONITORING_EXPLAINER.categories).map(([category, description]) => (
          <div key={category}>
            <dt className="field__label">{category}</dt>
            <dd>{description}</dd>
          </div>
        ))}
      </dl>
      <p className="reading__aside">
        {t('learn.revision', {
          standard: ASA_MONITORING_EXPLAINER.standard,
          year: ASA_MONITORING_EXPLAINER.revisionYear,
          minutes: ASA_MONITORING_EXPLAINER.nibpIntervalMaxMinutes,
        })}
      </p>

      <Badge kind="out-of-range">{HONEST_STATUS.headline}</Badge>
      <p className="reading__aside">{HONEST_STATUS.detail}</p>
      <CitationLink href="https://www.asahq.org/standards-and-practice-parameters/standards-for-basic-anesthetic-monitoring">
        {t('learn.read-asa')}
      </CitationLink>
    </div>
  );
}

export function EmptyAnalysis() {
  return <EmptyState title={t('analysis.empty-title')}>{t('analysis.empty')}</EmptyState>;
}
