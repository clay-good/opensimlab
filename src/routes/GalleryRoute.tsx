/**
 * The component gallery (design/design-system → The inventory is enforced and
 * documented: a component gallery route renders every component in every state
 * for visual review).
 *
 * It is a development surface, not a learner-facing one, and it carries `noindex`.
 */

import { useState } from 'react';
import '@platform/ui/components.css';
import {
  Abbreviation, Badge, Banner, Button, Card, Chip, CitationLink, Drawer, EmptyState, IconButton,
  LoadingState, Modal, NumericField, Panel, SegmentedControl, Select, Slider, SteppedDial, Tabs,
  TabPanel, Timeline, Toggle,
} from '@platform/ui';
import { AlarmRail, LogList, PlotCanvas, VitalTile } from '@platform/ui/monitor';
import { NEUTRAL, RADIUS, SIGNAL, SPACE, TRACE, TRACE_IDS, TYPE, contrastRatio } from '@platform/tokens/tokens';

export function GalleryRoute() {
  const [toggled, setToggled] = useState(true);
  const [segment, setSegment] = useState('a');
  const [slider, setSlider] = useState(50);
  const [dial, setDial] = useState(0.25);
  const [numeric, setNumeric] = useState<number | ''>(140);
  const [tab, setTab] = useState('one');
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <main className="reading" id="main" style={{ maxInlineSize: '90ch' }}>
      <h1>Component gallery</h1>
      <p className="field__hint">
        Every component in the inventory, in every state. A screen never introduces a bespoke
        control outside this set.
      </p>

      <Section title="Button">
        <Row>
          <Button variant="primary">Primary</Button>
          <Button>Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button disabled>Disabled</Button>
          <Button compact>Compact</Button>
        </Row>
      </Section>

      <Section title="IconButton">
        <Row>
          <IconButton label="Play">▶</IconButton>
          <IconButton label="Pressed" aria-pressed="true">⏸</IconButton>
          <IconButton label="Disabled" disabled>↺</IconButton>
        </Row>
      </Section>

      <Section title="Toggle">
        <Row>
          <Toggle checked={toggled} onChange={setToggled} label="On" />
          <Toggle checked={false} onChange={() => {}} label="Off" />
          <Toggle checked={false} onChange={() => {}} label="Disabled" disabled />
        </Row>
      </Section>

      <Section title="SegmentedControl">
        <SegmentedControl
          label="Example"
          value={segment}
          onChange={setSegment}
          options={[{ value: 'a', label: '1×' }, { value: 'b', label: '2×' }, { value: 'c', label: '60×' }]}
        />
      </Section>

      <Section title="Slider and SteppedDial">
        <Slider label="Tidal volume" unit="mL" value={slider} min={0} max={100} step={5} onChange={setSlider} />
        <SteppedDial label="Infusion rate" value={dial} step={0.05} min={0} max={2} precision={2} unit="µg/kg/min" onChange={setDial} />
      </Section>

      <Section title="NumericField and Select">
        <NumericField label="Dose" unit="mg" value={numeric} onValueChange={setNumeric} hint="Free entry" />
        <NumericField label="With an error" unit="mg" value={''} onValueChange={() => {}} error="A dose is required" />
        <Select label="Practice region" options={[{ value: 'US', label: 'United States' }, { value: 'GB', label: 'United Kingdom' }]} />
      </Section>

      <Section title="Tabs">
        <Tabs
          label="Example tabs"
          active={tab}
          onSelect={setTab}
          tabs={[{ id: 'one', label: 'One' }, { id: 'two', label: 'Two', unread: true }]}
        />
        <TabPanel id="one" active={tab}>First panel</TabPanel>
        <TabPanel id="two" active={tab}>Second panel</TabPanel>
      </Section>

      <Section title="Panel, Card, Chip, Badge">
        <Panel title="A panel" actions={<Button compact variant="ghost">Action</Button>}>
          <Card>A card sits on a panel with a surface step and a hairline, never a shadow.</Card>
        </Panel>
        <Row>
          <Chip>A chip</Chip>
          <Badge>Published</Badge>
          <Badge kind="out-of-range">Out of range</Badge>
          <Badge kind="teaching">Teaching model</Badge>
        </Row>
      </Section>

      <Section title="Tooltip">
        <p>
          The <Abbreviation short="TOF" expansion="train-of-four ratio" explanation="the ratio of the fourth twitch to the first, which quantifies residual blockade" /> readout.
        </p>
      </Section>

      <Section title="Banner">
        <Banner kind="critical">A high-priority banner is a solid fill.</Banner>
        <Banner kind="warning">A medium-priority banner.</Banner>
        <Banner kind="advisory">A low-priority banner.</Banner>
        <Banner>A neutral banner.</Banner>
      </Section>

      <Section title="AlarmRail">
        <AlarmRail
          tick={100}
          onSilence={() => {}}
          alarms={[
            { id: 'a', priority: 'critical', message: 'Oxygen saturation low: SpO₂ 88%', silencedUntilTick: null },
            { id: 'b', priority: 'warning', message: 'Mean arterial pressure low: MAP 52 mmHg', silencedUntilTick: 1300 },
            { id: 'c', priority: 'advisory', message: 'Predicted depth index below the usual range', silencedUntilTick: null },
          ]}
        />
      </Section>

      <Section title="VitalTile">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--space-2)' }}>
          <VitalTile name="HR" value={72} unit="bpm" precision={0} traceToken="--ecg" lowLimit={45} highLimit={120} />
          <VitalTile name="MAP" value={52} unit="mmHg" precision={0} traceToken="--arterial" lowLimit={55} alarm="warning" />
          <VitalTile name="SpO₂" value={88} unit="%" precision={0} traceToken="--spo2" lowLimit={90} alarm="critical" />
          <VitalTile name="SpO₂" value={null} unit="%" precision={0} traceToken="--spo2" invalidReason="Probe not reading" />
          <VitalTile name="EtCO₂" value={38} unit="mmHg" precision={0} traceToken="--capno" artifact />
          <VitalTile name="Depth" value={45} unit="" precision={0} traceToken="--neuro" confidence={{ label: 'Predicted', kind: 'default' }} />
        </div>
      </Section>

      <Section title="PlotCanvas">
        <PlotCanvas
          height={120}
          xMax={60}
          yMax={6}
          cursorSeconds={30}
          series={[
            { id: 'p', label: 'Plasma', colorToken: '--neuro', unit: 'µg/mL', points: Array.from({ length: 60 }, (_, i) => [i, 6 * Math.exp(-i / 20)] as [number, number]) },
            { id: 'e', label: 'Effect site', colorToken: '--neuro', dashed: true, unit: 'µg/mL', points: Array.from({ length: 60 }, (_, i) => [i, 4 * (1 - Math.exp(-i / 12)) * Math.exp(-i / 40)] as [number, number]) },
          ]}
        />
      </Section>

      <Section title="LogList">
        <LogList
          entries={[
            { tick: 120, severity: 'info', category: 'drug', eventId: '1', message: 'propofol 140 mg' },
            { tick: 300, severity: 'warning', category: 'alarm', eventId: '2', message: 'Mean arterial pressure low: MAP 52 mmHg' },
            { tick: 420, severity: 'critical', category: 'alarm', eventId: '3', message: 'Oxygen saturation low: SpO₂ 88%' },
            { tick: 500, severity: 'artifact', category: 'artifact', eventId: '4', message: 'Injected sensor artifact: arterial-damping' },
            { tick: 600, severity: 'advisory', category: 'scenario', eventId: '5', message: 'Surgical incision.' },
          ]}
        />
      </Section>

      <Section title="Timeline">
        <Timeline
          totalTicks={1000}
          marks={[
            { tick: 120, severity: 'info', label: 'Induction' },
            { tick: 420, severity: 'critical', label: 'Desaturation' },
            { tick: 700, severity: 'warning', label: 'Hypotension' },
          ]}
        />
      </Section>

      <Section title="Modal and Drawer">
        <Row>
          <Button onClick={() => setModalOpen(true)}>Open a modal</Button>
          <Button onClick={() => setDrawerOpen(true)}>Open a drawer</Button>
        </Row>
        <Modal open={modalOpen} title="A modal" onClose={() => setModalOpen(false)}
          footer={<Button variant="primary" onClick={() => setModalOpen(false)}>Close</Button>}>
          <p>Focus moves in on open and returns to the invoking control on close.</p>
        </Modal>
        <Drawer open={drawerOpen} title="A drawer" onClose={() => setDrawerOpen(false)}>
          <p>A drawer opens over the Analysis region without ending the session.</p>
        </Drawer>
      </Section>

      <Section title="EmptyState, LoadingState, CitationLink">
        <EmptyState title="Nothing here yet">Give a drug to see the plot.</EmptyState>
        <LoadingState label="Starting the engine" />
        <CitationLink href="https://pubmed.ncbi.nlm.nih.gov/12669985/">
          McSharry et al. IEEE Trans Biomed Eng 2003
        </CitationLink>
      </Section>

      <Section title="Tokens">
        <h3>Neutral ramp</h3>
        <Swatches entries={Object.entries(NEUTRAL)} />
        <h3>Traces</h3>
        <Swatches entries={TRACE_IDS.map((id) => [id, TRACE[id].line])} />
        <h3>Alarm and focus</h3>
        <Swatches entries={Object.entries(SIGNAL).filter(([, value]) => value.startsWith('#'))} />
        <h3>Type scale</h3>
        {Object.entries(TYPE).map(([name, style]) => (
          <p key={name} style={{ font: `${style.weight} ${style.sizePx}px/${style.lineHeight} var(--font-ui)`, letterSpacing: `${style.trackingEm}em` }}>
            {name} — {style.sizePx}px
          </p>
        ))}
        <h3>Spacing and radius</h3>
        <Row>
          {SPACE.map((value, index) => (
            <span key={value} className="chip">--space-{index + 1}: {value}px</span>
          ))}
          {Object.entries(RADIUS).map(([name, value]) => (
            <span key={name} className="chip">--radius-{name}: {value}px</span>
          ))}
        </Row>
      </Section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ display: 'grid', gap: 'var(--space-3)' }}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>{children}</div>;
}

function Swatches({ entries }: { entries: readonly (readonly [string, string])[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-2)' }}>
      {entries.map(([name, value]) => (
        <div key={name} className="card" style={{ display: 'grid', gap: 'var(--space-2)' }}>
          <span style={{ blockSize: '32px', background: value, borderRadius: 'var(--radius-chip)' }} />
          <code className="field__hint">{name}: {value}</code>
          <span className="field__hint numeric">
            {contrastRatio(value, NEUTRAL['surface-0']).toFixed(2)}:1 on --surface-0
          </span>
        </div>
      ))}
    </div>
  );
}
