/**
 * Architecture tests (platform/safety-and-scope → The boundary is testable, not
 * merely promised; platform/privacy; cockpit/action-cockpit → The engine boundary
 * is enforced in code).
 *
 * These assert structure rather than intent. They read the source tree, so a
 * change that crosses a boundary fails the build even if every other test passes.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { PRIVACY_CLAIMS } from '@platform/docs/privacy-claims';

const root = fileURLToPath(new URL('../..', import.meta.url));

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (['node_modules', 'dist', '.git'].includes(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (['.ts', '.tsx', '.css', '.html', '.js'].includes(extname(full))) out.push(full);
  }
  return out;
}

const sourceFiles = walk(join(root, 'src'))
  .concat([join(root, 'index.html')])
  .map((path) => ({ path: relative(root, path), text: readFileSync(path, 'utf8') }));

/** Files that legitimately name a boundary in order to enforce or document it. */
const isMetaFile = (path: string): boolean =>
  path.startsWith('tests/')
  || path.includes('privacy-claims')
  || path.includes('docs/')
  || path.includes('safety/');

describe('Requirement: The Forward-Only Boundary Is Structural', () => {
  it('Scenario: The kernel module exposes no inverse entry point', async () => {
    // Every export of the simulation kernel, enumerated.
    const modules = await Promise.all([
      import('@platform/kernel/compartments'),
      import('@platform/kernel/matrix'),
      import('@platform/kernel/rng'),
      import('@platform/kernel/numeric'),
      import('@anesthesia/engine'),
      import('@anesthesia/physiology'),
    ]);
    const exported = modules.flatMap((module) => Object.keys(module));
    for (const name of exported) {
      // No function that accepts a target concentration or effect and returns a dose.
      expect(name, `${name} looks like inverse control in the kernel`)
        .not.toMatch(/^(solve|compute|find|infer)?(Dose|Rate|Infusion)ForTarget/i);
      expect(name).not.toMatch(/targetControlled|tci|doseFor|rateFor|quantileTarget/i);
    }
    // And the engine's own interface takes a dose in and returns a prediction out.
    const engine = modules[4] as Record<string, unknown>;
    expect(Object.keys(engine)).toContain('AnesthesiaEngine');
  });

  it('Scenario: Quantile targeting is refused', () => {
    for (const file of sourceFiles) {
      if (isMetaFile(file.path)) continue;
      expect(file.text, `${file.path} mentions quantile targeting`)
        .not.toMatch(/quantile\s*target|targetQuantile|percentileTarget/i);
    }
  });

  it('keeps any target-solving code outside the kernel directory', () => {
    const kernelFiles = sourceFiles.filter((file) => file.path.startsWith('src/platform/kernel/'));
    expect(kernelFiles.length).toBeGreaterThan(3);
    for (const file of kernelFiles) {
      expect(file.text, `${file.path} contains target-solving logic`)
        .not.toMatch(/targetConcentration|targetEffectSite|solveForDose/i);
    }
  });
});

describe('Requirement: No Real-Patient Data Path', () => {
  it('Scenario: Patient setup is scenario-authored only', () => {
    // No field anywhere collects identifiable information about a real person.
    const forbidden = [
      /name=["']patientName["']/i,
      /medicalRecordNumber/i,
      /\bmrn\b/i,
      /dateOfBirth|dobField/i,
      /nationalInsurance|socialSecurity/i,
    ];
    for (const file of sourceFiles) {
      if (isMetaFile(file.path)) continue;
      for (const pattern of forbidden) {
        expect(file.text, `${file.path} matches ${pattern}`).not.toMatch(pattern);
      }
    }
  });

  it('Scenario: No import of clinical records', () => {
    for (const file of sourceFiles) {
      if (isMetaFile(file.path)) continue;
      // No code path reads a clinical record format.
      expect(file.text, `${file.path} reads a clinical record format`)
        .not.toMatch(/\bfhir\b|\bhl7\b|\bccda\b|\bdicom\b/i);
    }
  });
});

describe('Requirement: No Telemetry, No Analytics, No Third-Party Requests', () => {
  it('Scenario: A third-party request fails the build', () => {
    // The single permitted foreign origins are documentation links a human clicks,
    // which are never fetched by the application.
    // Namespace URIs are identifiers, not addresses: nothing ever fetches them.
    const namespaceUris = /^https?:\/\/(www\.w3\.org|schema\.org|www\.sitemaps\.org|json-schema\.org)\//;
    // The framework bodies are here for the same reason as the journals: the
    // curriculum mapping has to link a program director to the document it is a
    // reading OF, so they can check it against the one they are accredited to.
    const documentationHosts = /^https:\/\/(pubmed\.ncbi\.nlm\.nih\.gov|www\.asahq\.org|www\.fda\.gov|www\.mhaus\.org|github\.com|doi\.org|opensimlab\.com|www\.nbcrna\.com|www\.coacrna\.org|www\.acgme\.org|www\.endocrine\.org)/;
    for (const file of sourceFiles) {
      if (isMetaFile(file.path)) continue;
      for (const match of file.text.matchAll(/https?:\/\/[^\s'"`)]+/g)) {
        const url = match[0];
        const lazyTurnstile = file.path === 'src/platform/reporting/client.ts'
          && url === 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        expect(
          documentationHosts.test(url) || namespaceUris.test(url) || lazyTurnstile,
          `${file.path} references ${url}`,
        ).toBe(true);
      }
      // And nothing FETCHES a foreign origin.
      for (const match of file.text.matchAll(/fetch\((['"`])(https?:)?\/\/[^)]*\)/g)) {
        expect.fail(`${file.path} fetches a foreign origin: ${match[0]}`);
      }
    }
  });

  it('no third-party or telemetry dependency exists', () => {
    const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const runtime = Object.keys(manifest.dependencies ?? {});
    const forbidden = /analytics|telemetry|sentry|bugsnag|datadog|amplitude|mixpanel|segment|posthog|ga4|gtag|hotjar|fullstory|plausible|matomo/i;
    for (const name of [...runtime, ...Object.keys(manifest.devDependencies ?? {})]) {
      expect(name, `${name} is an analytics or telemetry package`).not.toMatch(forbidden);
    }
    // The runtime dependency ceiling: a very small set, all of them well known.
    expect(runtime.sort()).toEqual(['react', 'react-dom', 'zustand']);
  });

  it('Scenario: No credential surface exists', () => {
    // Looks for the CONTROLS, not the words: a page may say there is no sign-in.
    for (const file of sourceFiles) {
      if (isMetaFile(file.path)) continue;
      expect(file.text, `${file.path} has a password field`).not.toMatch(/type=["']password["']/i);
      expect(file.text, `${file.path} autocompletes a credential`)
        .not.toMatch(/autoComplete=["'](current-password|new-password|username|cc-number)["']/i);
      expect(file.text, `${file.path} calls a sign-in function`)
        .not.toMatch(/\b(signIn|signUp|logIn|signOut|authenticate|getToken|oauth2?)\s*\(/i);
      expect(file.text, `${file.path} sends a credential`)
        .not.toMatch(/Authorization:\s*["'`]|Bearer\s/i);
    }
  });

  it('Scenario: No tracking parameter is ever added to an outbound link', () => {
    for (const file of sourceFiles) {
      if (isMetaFile(file.path)) continue;
      expect(file.text, `${file.path} carries a tracking parameter`)
        .not.toMatch(/[?&](utm_[a-z]+|fbclid|gclid|ref|referrer|campaign)=/i);
    }
  });
});

describe('Requirement: Links Are Descriptive', () => {
  it('never uses "click here", "read more" or "learn more" without naming the destination', () => {
    for (const file of sourceFiles) {
      if (isMetaFile(file.path)) continue;
      for (const match of file.text.matchAll(/>([^<>{]{2,80})<\/a>/g)) {
        const text = (match[1] ?? '').trim().toLowerCase();
        expect(['click here', 'read more', 'learn more', 'here', 'more'], `${file.path}: "${text}"`)
          .not.toContain(text);
      }
    }
  });
});

describe('Requirement: The privacy statement matches the code', () => {
  it('names a real test for every claim it makes', () => {
    const testFiles = walk(join(root, 'tests')).map((path) => ({
      path: relative(root, path), text: readFileSync(path, 'utf8'),
    }));
    for (const claim of PRIVACY_CLAIMS) {
      const [file, name] = claim.test.split(' → ');
      const found = testFiles.find((candidate) => candidate.path === file?.trim());
      expect(found, `${claim.test} names a file that does not exist`).toBeDefined();
      expect(found!.text, `${claim.test} names a test that does not exist`)
        .toContain(name?.trim().slice(0, 30) ?? '');
    }
  });
});

describe('Requirement: One Theme, No Theme Switcher', () => {
  it('Scenario: No theme switching surface exists', () => {
    for (const file of sourceFiles) {
      if (isMetaFile(file.path)) continue;
      expect(file.text, `${file.path} has a theme toggle`)
        .not.toMatch(/themeToggle|toggleTheme|setTheme|lightMode|data-theme=["']light/i);
    }
    // `prefers-color-scheme` never branches the palette. It appears only as the
    // `color-scheme` declaration that tells the browser the page is dark.
    const css = sourceFiles.filter((file) => extname(file.path) === '.css');
    for (const file of css) {
      expect(file.text, `${file.path} branches the palette on prefers-color-scheme`)
        .not.toMatch(/@media[^{]*prefers-color-scheme/);
    }
  });
});

describe('Requirement: no box-shadow is used for elevation anywhere', () => {
  it('separates raised elements with a surface step and a hairline instead', () => {
    for (const file of sourceFiles) {
      if (isMetaFile(file.path)) continue;
      expect(file.text, `${file.path} uses a box-shadow`).not.toMatch(/box-shadow\s*:/);
    }
  });
});

describe('Requirement: The Depth Index Is A Model Prediction, Not A Monitor Reading', () => {
  /**
   * Trademarked monitor names, and the words that would make one a product name.
   * The specification permits NOMINATIVE use only: naming the scale a published
   * model was fitted to, in a citation. It forbids using one as a product name, a
   * display label, or a logo.
   */
  const TRADEMARKED_MONITORS = [
    'BIS', 'Bispectral', 'Entropy', 'Narcotrend', 'SedLine', 'PSI', 'NOL', 'CONOX', 'qCON',
  ];

  it('Scenario: No commercial monitor is imitated or implied', () => {
    for (const file of sourceFiles) {
      if (isMetaFile(file.path)) continue;
      for (const name of TRADEMARKED_MONITORS) {
        // As a display label, a product name, or an element's accessible name.
        const asLabel = new RegExp(
          `(?:name|label|title|aria-label|displayName|heading|productName)\\s*[:=]\\s*['"\`][^'"\`]*\\b${name}\\b`,
          'i',
        );
        expect(file.text, `${file.path} uses "${name}" as a label`).not.toMatch(asLabel);
        // As rendered text in the interface.
        const asText = new RegExp(`>\\s*[^<>{]*\\b${name}\\b[^<>{]*<`, '');
        expect(file.text, `${file.path} renders "${name}" as interface text`).not.toMatch(asText);
      }
    }
  });

  it('Scenario: The index is labeled as predicted, with its source model named', async () => {
    const { getExplainer } = await import('@anesthesia/content/explainers');
    const explainer = getExplainer('depth-monitoring-and-its-limits');
    // It states plainly that the value is a prediction from a published model,
    // computed from effect-site concentration rather than measured.
    expect(explainer.body).toContain('PREDICTION');
    expect(explainer.body).toContain('effect-site concentration');
    expect(explainer.body).toContain('not the output of any commercial monitor');

    // And the tile carries the word, in the design system's confidence badge.
    const { TILES } = await import('@anesthesia/ui/tracks');
    const depth = TILES.find((tile) => tile.field === 'depthIndex');
    expect(depth?.name).toBe('Depth');
    expect(depth?.name).not.toMatch(/BIS|bispectral/i);
  });

  it('keeps the depth index on the 0 to 100 scale the published models were fitted to', async () => {
    const { FIELDS } = await import('@anesthesia/physiology');
    expect(FIELDS.depthIndex.min).toBe(0);
    expect(FIELDS.depthIndex.max).toBe(100);
    // With no unit, because it is an index rather than a measurement.
    expect(FIELDS.depthIndex.unit).toBe('');
  });
});

describe('Requirement: The Deployment Has No Origin Service', () => {
  // platform/delivery: the production artifact is a set of static files with no
  // server-side rendering, no runtime function and no origin service. The
  // Cloudflare configuration has to keep that true, or the claim quietly stops
  // being one — an assets-only Worker serves files at the edge and executes
  // nothing, and the moment a `main` entry point appears that is no longer so.
  const wrangler = readFileSync(join(root, 'wrangler.toml'), 'utf8');

  it('Scenario: the Worker is assets-only, with no script to run', () => {
    expect(wrangler).not.toMatch(/^\s*main\s*=/m);
    expect(wrangler).toContain('[assets]');
    expect(wrangler).toContain('directory = "./dist"');
  });

  it('Scenario: no binding gives the deployment state or a backend', () => {
    // Any of these would mean the site had somewhere to put a learner's data.
    // Matched as a TOML key at the start of a line, so a binding name that also
    // happens to be a substring of English prose in a comment does not trip it.
    for (const binding of ['kv_namespaces', 'd1_databases', 'r2_buckets', 'durable_objects',
      'queues', 'ai', 'vectorize', 'hyperdrive', 'analytics_engine_datasets', 'services']) {
      const declared = new RegExp(`^\\s*(\\[+\\s*${binding}|${binding}\\s*=)`, 'm');
      expect(wrangler, `wrangler.toml declares ${binding}`).not.toMatch(declared);
    }
  });

  it('Scenario: the canonical address is the one that serves, without a redirect', () => {
    // Canonicals carry no trailing slash, so the host must serve them directly.
    expect(wrangler).toContain('html_handling = "drop-trailing-slash"');
    expect(wrangler).toContain('not_found_handling = "404-page"');
  });

  it('Scenario: the content security policy permits only the declared reporting boundary', () => {
    const headers = readFileSync(join(root, 'dist/_headers'), 'utf8');
    const csp = /Content-Security-Policy: ([^\n]+)/.exec(headers)?.[1] ?? '';
    expect(csp, 'dist/_headers has no content security policy').toBeTruthy();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("connect-src 'self'");
    expect(csp).toContain("script-src 'self' https://challenges.cloudflare.com");
    expect(csp).toContain('frame-src https://challenges.cloudflare.com');
    expect(csp).toContain("form-action 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
  });
});
