/**
 * @vitest-environment jsdom
 *
 * Acceptance tests for design/layout and cockpit/action-cockpit's keyboard and
 * touch requirements.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { BREAKPOINTS, CONTROL_HEIGHT, HIT_TARGET, LAYOUT, MIN_TARGET_GAP, SACRIFICE_ORDER } from '@platform/tokens/tokens';
import { ActionCockpit } from '@anesthesia/ui/ActionCockpit';
import { StatusBar } from '@anesthesia/ui/StatusBar';
import { ConcentrationPanel } from '@anesthesia/ui/ConcentrationPanel';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { TILES, TRACKS, trackConfigs } from '@anesthesia/ui/tracks';

// `import.meta.url` is not a file URL under jsdom, so the repository root comes
// from the process working directory, which vitest sets to the project root.
const root = process.cwd();
const cockpitCss = readFileSync(join(root, 'src/modules/anesthesia/ui/cockpit.css'), 'utf8');
const componentsCss = readFileSync(join(root, 'src/platform/ui/components.css'), 'utf8');

describe('Requirement: Four-Region Cockpit', () => {
  it('Scenario: Region proportions at the reference desktop width', () => {
    expect(LAYOUT.statusBarHeightPx).toBe(56);
    expect(LAYOUT.analysisWidthFraction).toBe(0.42);
    expect(LAYOUT.monitorWidthFraction).toBe(0.58);
    expect(LAYOUT.analysisWidthFraction + LAYOUT.monitorWidthFraction).toBeCloseTo(1, 9);
    // The grid is laid out from the tokens, and the middle row is what absorbs
    // the change when anything else moves.
    expect(cockpitCss).toContain('var(--status-bar-height)');
    expect(cockpitCss).toContain('var(--action-cockpit-height)');
    expect(cockpitCss).toContain('var(--analysis-fraction, 42%)');
  });

  it('Scenario: The layout is sized in the viewport, not in fixed pixels', () => {
    // The action region is a share of viewport height between two bounds, not a
    // number. A fixed 220 px left the drug tray a letterbox on a laptop.
    expect(LAYOUT.actionCockpitMinPx).toBeLessThan(LAYOUT.actionCockpitHeightPx);
    expect(LAYOUT.actionCockpitMaxPx).toBeGreaterThan(LAYOUT.actionCockpitHeightPx);
    expect(LAYOUT.actionCockpitViewportShare).toBeGreaterThan(0.2);
    const generated = readFileSync(join(root, 'src/platform/tokens/tokens.generated.css'), 'utf8');
    expect(generated).toMatch(/--action-cockpit-height: clamp\(\d+px, \d+dvh, \d+px\)/);
    // Every fluid track is bounded so one child cannot widen the grid.
    expect(cockpitCss).toContain('minmax(0, 1fr)');
    // The waveform canvas takes the height its region has, not a declared number.
    const cockpitTsx = readFileSync(join(root, 'src/modules/anesthesia/ui/Cockpit.tsx'), 'utf8');
    expect(cockpitTsx).toContain('canvasHeight="fill"');
  });

  it('declares exactly four regions and no fifth', () => {
    const areas = new Set([...cockpitCss.matchAll(/grid-template-areas:\s*([^;]+);/g)]
      .flatMap((match) => (match[1] ?? '').match(/[a-z]+/g) ?? []));
    // The two separators are chrome BETWEEN regions, not regions: they hold no
    // content and open nothing. Everything else must be one of the four.
    areas.delete('vdivider');
    areas.delete('hdivider');
    expect(areas).toEqual(new Set(['status', 'analysis', 'monitor', 'actions']));
  });

  it('Scenario: Both separators are operable without a pointer', () => {
    const cockpitTsx = readFileSync(join(root, 'src/modules/anesthesia/ui/Cockpit.tsx'), 'utf8');
    const hook = readFileSync(join(root, 'src/modules/anesthesia/ui/useResizableRegion.ts'), 'utf8');
    expect(cockpitTsx).toContain('divider--vertical');
    expect(cockpitTsx).toContain('divider--horizontal');
    // A real separator: role, bounds, arrow keys, and Home to restore default.
    expect(hook).toContain("role: 'separator'");
    expect(hook).toContain("'aria-valuenow'");
    expect(hook).toContain("'aria-valuemin'");
    expect(hook).toContain("'aria-valuemax'");
    expect(hook).toContain("event.key === 'Home'");
    // And a grab target larger than the hairline it draws.
    expect(LAYOUT.dividerHitTargetPx).toBeGreaterThanOrEqual(12);
  });

  it('Scenario: The monitor is never the region that shrinks', () => {
    // At the medium breakpoint the Monitor keeps the larger share and the other
    // two absorb the reduction.
    expect(cockpitCss).toContain('minmax(0, 1.6fr) minmax(0, 1fr)');
    // Below the small breakpoint the Analysis and Action regions become overlays
    // and the Monitor takes the whole remaining area.
    expect(cockpitCss).toContain("'status'\n      'monitor';");
  });

  it('Scenario: The divider is draggable within bounds', () => {
    expect(LAYOUT.dividerMinFraction).toBe(0.3);
    expect(LAYOUT.dividerMaxFraction).toBe(0.6);
    expect(cockpitCss).toContain('--analysis-fraction');
  });
});

describe('Requirement: Monitor Region Composition', () => {
  it('splits the region 72% traces and 28% tiles, with the rail above both', () => {
    expect(LAYOUT.waveformWidthFraction).toBe(0.72);
    expect(LAYOUT.vitalColumnWidthFraction).toBe(0.28);
    expect(cockpitCss).toContain('minmax(0, 72fr) minmax(0, 28fr)');
  });

  it('Scenario: Alarm rail expands without displacing traces', () => {
    // It collapses to zero height and expands to 48 px over the standard duration.
    expect(LAYOUT.alarmRailHeightPx).toBe(48);
    expect(componentsCss).toContain('block-size: 0;');
    expect(componentsCss).toContain('transition: block-size var(--motion-standard) var(--ease)');
    expect(componentsCss).toContain("[data-active='true'] { block-size: var(--alarm-rail-height); }");
  });

  it('gives each trace a tile, so the eye connects them without a legend', () => {
    const traceTokens = new Set(TILES.map((tile) => tile.traceToken));
    for (const track of TRACKS) {
      expect(traceTokens.has(`--${track.traceId}`), `${track.signal} has no tile in its hue`).toBe(true);
    }
  });
});

describe('Requirement: Sacrifice Order Is Explicit', () => {
  it('degrades in the stated order and never below three traces', () => {
    expect([...SACRIFICE_ORDER]).toEqual([
      'trend-sparklines', 'alarm-limit-text', 'analysis-region', 'patient-summary-detail', 'trace-count',
    ]);
    expect(LAYOUT.minTraceCount).toBe(3);
    // Reducing to the primary traces still leaves at least three.
    expect(trackConfigs(false, new Set(), true).length).toBeGreaterThanOrEqual(LAYOUT.minTraceCount);
  });

  it('Scenario: A phone can run a full scenario', () => {
    expect(BREAKPOINTS.xs).toBe(360);
    // Every trace keeps at least 56 px of vertical space at the smallest viewport.
    expect(LAYOUT.minTraceHeightPx).toBe(56);
    const traceCount = trackConfigs(false, new Set()).length;
    // A 780 px tall phone, minus the status bar, leaves room for them.
    const available = 780 - LAYOUT.statusBarHeightPx;
    expect(traceCount * LAYOUT.minTraceHeightPx).toBeLessThan(available);
  });

  it('Scenario: A lecture display uses the extra space for data, not whitespace', () => {
    expect(LAYOUT.maxContentWidthPx).toBe(2200);
    expect(cockpitCss).toContain('max-inline-size: var(--max-content-width)');
    // Above the extra-large breakpoint the Analysis region shows both at once.
    expect(cockpitCss).toContain(`@media (min-width: ${BREAKPOINTS.xl}px)`);
    expect(cockpitCss).toContain('.analysis--wide .analysis__body');
  });

  it('Scenario: Landscape phone prioritizes the monitor', () => {
    expect(cockpitCss).toContain('@media (max-height: 499px) and (orientation: landscape)');
    expect(cockpitCss).toContain('var(--status-bar-height-compact) minmax(0, 1fr)');
    expect(LAYOUT.statusBarCompactHeightPx).toBe(40);
  });
});

describe('Requirement: No Layout Shift During Simulation', () => {
  it('Scenario: Cumulative layout shift stays at zero mid-session', () => {
    // Geometry is fixed by the grid template, not by content. Nothing in the
    // cockpit stylesheet sizes a region from its contents.
    expect(cockpitCss).not.toMatch(/grid-template-(rows|columns):[^;]*\bauto\b[^;]*var\(--action-cockpit-height\)/);
    // The alarm treatment changes colour and border only; no element moves.
    const tileBlock = componentsCss.slice(componentsCss.indexOf('.vital-tile'), componentsCss.indexOf('.log-list'));
    expect(tileBlock).toContain("[data-alarm='critical']");
    expect(tileBlock).not.toMatch(/\[data-alarm='critical'\][^}]*(padding|margin|font-size|block-size)\s*:/);
    // Numerics are tabular everywhere, so a changing value cannot resize its box.
    expect(componentsCss).toContain('font-variant-numeric: tabular-nums');
    // Flashing animates opacity only.
    expect(componentsCss).toMatch(/@keyframes alarm-flash-critical \{[^}]*opacity/);
  });

  it('Scenario: Long text does not reflow a tray', () => {
    expect(cockpitCss).toContain('text-overflow: ellipsis');
    expect(cockpitCss).toMatch(/\.syringe__name \{[^}]*white-space: nowrap/);
  });
});

describe('Requirement: Cockpit Is Fully Operable Without A Mouse', () => {
  const markup = renderToStaticMarkup(createElement(ActionCockpit, {
    scenario: ROUTINE_INDUCTION,
    region: UNITED_STATES,
    infusions: [],
    syringeRemaining: {},
    ventilator: {
      mode: 'manual' as const, tidalVolumeMl: 500, respiratoryRateBpm: 12,
      fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0,
    },
    intubated: false,
    airwayAttempts: 0,
    lastGrade: null,
    onBolus: () => {},
    onInfusion: () => {},
    onVentilator: () => {},
    onLaryngoscopy: () => {},
    onDrugCard: () => {},
  }));

  it('Scenario: Keyboard-only induction is possible', () => {
    const document_ = new DOMParser().parseFromString(`<body>${markup}</body>`, 'text/html');
    const controls = [...document_.querySelectorAll('button, input, select, [tabindex]')];
    expect(controls.length).toBeGreaterThan(8);
    // Nothing is removed from the tab order, and nothing forces an order.
    for (const control of controls) {
      const tabindex = control.getAttribute('tabindex');
      if (tabindex !== null) expect(Number(tabindex)).toBeLessThanOrEqual(0);
    }
    // No action requires hover or drag: every one is a button or a field.
    expect(document_.querySelectorAll('[draggable="true"]')).toHaveLength(0);
  });

  it('names every control, so none depends on its position to be understood', () => {
    const document_ = new DOMParser().parseFromString(`<body>${markup}</body>`, 'text/html');
    for (const control of document_.querySelectorAll('button')) {
      const name = control.getAttribute('aria-label') ?? control.textContent ?? '';
      expect(name.trim().length, `an unnamed button: ${control.outerHTML.slice(0, 80)}`).toBeGreaterThan(0);
    }
  });

  it('Scenario: Touch targets meet the minimum on a small phone', () => {
    // Declared in the tokens and applied in the stylesheet.
    expect(HIT_TARGET.comfortable).toBe(44);
    expect(HIT_TARGET.compact).toBe(40);
    expect(MIN_TARGET_GAP).toBe(8);
    expect(componentsCss).toContain('min-inline-size: 44px');
    expect(componentsCss).toMatch(/\.icon-button \{[^}]*inline-size: 44px[^}]*block-size: 44px/s);
    // The vital value doubles as the "explain why" control. A `--` reading is
    // two characters wide, so the control needs a floor of its own.
    expect(componentsCss).toMatch(/button\.vital-tile__value \{[^}]*min-inline-size: 44px[^}]*min-block-size: 40px/s);
    // Control height steps between the two densities using scale values only.
    expect(CONTROL_HEIGHT.comfortable).toBe(40);
    expect(CONTROL_HEIGHT.compact).toBe(32);
  });

  it('Scenario: The most-used tray is one tap away, and running infusions cannot be hidden', () => {
    // Syringes is the first tray and is selected by default.
    expect(markup.indexOf('Syringes')).toBeLessThan(markup.indexOf('Infusions'));
    // The pinned infusion summary is outside the tray, so switching tabs cannot hide it.
    expect(markup).toContain('actions__pinned');
    expect(markup).toContain('No infusions running');
    const pinnedIndex = markup.indexOf('actions__pinned');
    const trayIndex = markup.indexOf('actions__tray');
    expect(pinnedIndex).toBeLessThan(trayIndex);
  });
});

describe('Requirement: Status Bar Contents', () => {
  const markup = renderToStaticMarkup(createElement(StatusBar, {
    scenario: ROUTINE_INDUCTION,
    elapsed: '00:04:12',
    transport: 'running' as const,
    speed: 1 as const,
    onPlay: () => {}, onPause: () => {}, onStep: () => {},
    onReset: () => {}, onSpeed: () => {}, onOverflow: () => {},
  }));

  it('Scenario: Patient context is always readable', () => {
    expect(markup).toContain('42 y');
    expect(markup).toContain('ASA 1');
    expect(markup).toContain('Laparoscopic cholecystectomy');
    expect(markup).toContain('00:04:12');
  });

  it('Scenario: The clock is the most prominent element after the vitals', () => {
    expect(cockpitCss).toMatch(/\.status-bar__clock \{[^}]*font: var\(--type-vital-m\)/s);
    expect(cockpitCss).toMatch(/\.status-bar__patient-summary \{[^}]*font: var\(--type-label\)/s);
  });

  it('carries the persistent simulator marker', () => {
    expect(markup).toContain('Simulator');
    expect(markup).toContain('not for clinical use');
  });

  it('offers the transport controls and the speed selector', () => {
    expect(markup).toContain('aria-label="Transport controls"');
    expect(markup).toContain('aria-label="Simulation speed"');
    for (const speed of ['1×', '2×', '5×', '60×']) expect(markup).toContain(speed);
  });
});

describe('Requirement: Reflow To A Phone Without Sideways Scrolling', () => {
  // WCAG 1.4.10 and design/layout: a full induction has to be completable at
  // 360 by 780 CSS pixels. A bare `1fr` grid track takes its minimum from the
  // widest child's min-content, so one non-wrapping row inside the cockpit —
  // the transport controls, the tile strip — silently widens the whole grid
  // past the viewport and the page starts scrolling sideways.
  // Only the rules that lay out the cockpit's own regions: an inner component
  // sized `1fr auto` is bounded by the region it sits in and is not the risk.
  const REGION_SELECTORS = ['.cockpit', '.monitor__body'];
  const regionTracks = [...cockpitCss.matchAll(/([^{}]+)\{([^}]*)\}/g)]
    .filter(([, selector]) => REGION_SELECTORS.some((name) => (selector ?? '').trim().split(/[\s,]+/).includes(name)))
    .flatMap(([, selector, body]) => [...(body ?? '').matchAll(/grid-template-columns:\s*([^;]+);/g)]
      .map((match) => ({ selector: (selector ?? '').trim(), declaration: (match[1] ?? '').trim() })));

  it('Scenario: no cockpit grid column can grow past its container', () => {
    expect(regionTracks.length).toBeGreaterThan(2);
    for (const track of regionTracks) {
      // `var(--analysis-fraction, 42%) 1fr` is the desktop two-column case,
      // where the first track is a percentage and bounds the second.
      if (track.declaration.includes('--analysis-fraction')) continue;
      expect(track.declaration, `${track.selector} { grid-template-columns: ${track.declaration} }`)
        .not.toMatch(/(^|\s)1fr(\s|$)/);
    }
  });

  it('Scenario: the status bar is bounded and does not scroll the page', () => {
    // The status bar clips at a phone width rather than becoming a sideways
    // scroll, and its region is bounded so it cannot widen the grid.
    expect(cockpitCss).toContain('.cockpit__status { grid-area: status; min-inline-size: 0; overflow: hidden; }');
    expect(cockpitCss).toMatch(/\.status-bar \{ gap:[^}]*overflow-x: clip;/);
  });

  it('Scenario: what the status bar drops is what the sacrifice order says it drops', () => {
    // `patient-summary-detail` is fourth in the order and is the procedure name.
    expect(SACRIFICE_ORDER).toContain('patient-summary-detail');
    expect(cockpitCss).toContain('.status-bar__patient { display: none; }');
    expect(cockpitCss).toContain('.status-bar .segmented { display: none; }');
    // The simulator marker is a safety requirement, not chrome. It stays, in a
    // short form that is complete rather than an ellipsis.
    expect(cockpitCss).toContain('.status-bar__marker-short { display: inline; }');
  });

  it('Scenario: everything the status bar drops stays reachable from the overflow', () => {
    const cockpit = readFileSync(join(root, 'src/modules/anesthesia/ui/Cockpit.tsx'), 'utf8');
    const overflow = cockpit.slice(cockpit.indexOf('open={shortcutsOpen}'));
    // The speed selector and the procedure name both reappear in the overflow.
    expect(overflow).toContain('SPEED_MULTIPLIERS');
    expect(overflow).toContain('scenario.patient.procedure');
  });
});

describe('Requirement: The Concentration Plot Warns About The Right Drug', () => {
  it('Scenario: a stacked propofol dose does not warn on the remifentanil panel', () => {
    const markup = renderToStaticMarkup(createElement(ConcentrationPanel, {
      history: [{
        tick: 100,
        state: {},
        concentrations: [
          { drugId: 'propofol', modelId: 'eleveld-2018', confidence: 'published' as const, plasma: 4, effectSite: 2, unit: 'µg/mL' },
          { drugId: 'remifentanil', modelId: 'minto-1997', confidence: 'published' as const, plasma: 3, effectSite: 1, unit: 'ng/mL' },
        ],
      }],
      current: [
        { drugId: 'propofol', modelId: 'eleveld-2018', confidence: 'published' as const, plasma: 4, effectSite: 2, unit: 'µg/mL' },
        { drugId: 'remifentanil', modelId: 'minto-1997', confidence: 'published' as const, plasma: 3, effectSite: 1, unit: 'ng/mL' },
      ],
      tick: 100,
      timeToPeakSeconds: { propofol: 100, remifentanil: 90 },
      stacking: [{ tick: 60, drugId: 'propofol' }],
      onExportCsv: () => {},
    }));
    expect(markup).toContain('propofol dose given while the');
    expect(markup).not.toContain('remifentanil dose given while the');
  });
});
