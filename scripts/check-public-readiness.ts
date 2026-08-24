import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const history = process.argv.includes('--history');
const failures: string[] = [];

const git = (...args: string[]): string => execFileSync('git', args, {
  cwd: root,
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe'],
});

const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
  license?: string;
};
const lock = JSON.parse(readFileSync(join(root, 'package-lock.json'), 'utf8')) as {
  packages: Record<string, { dev?: boolean; license?: string }>;
};
const license = readFileSync(join(root, 'LICENSE'), 'utf8');

if (manifest.license !== 'MIT') failures.push('package.json must declare the repository MIT license');
if (!license.startsWith('MIT License\n') || !license.includes('Copyright (c) 2026 Clay Good')) {
  failures.push('LICENSE must contain the expected MIT grant and copyright owner');
}

const dependencies = Object.entries(lock.packages).filter(([path]) => path.startsWith('node_modules/'));
const missingLicenses = dependencies.filter(([, dependency]) => !dependency.license);
if (missingLicenses.length > 0) failures.push(`${missingLicenses.length} locked dependencies omit license metadata`);
const forbiddenLicense = /(?:^|\s|\()(?:AGPL|SSPL|BUSL|Commons-Clause|Elastic-2\.0|UNLICENSED)(?:[-\s)]|$)/i;
for (const [path, dependency] of dependencies) {
  if (forbiddenLicense.test(dependency.license ?? '')) {
    failures.push(`${path} declares restricted license ${dependency.license}`);
  }
  if (!dependency.dev && dependency.license !== 'MIT') {
    failures.push(`${path} is shipped at runtime under unexpected license ${dependency.license ?? 'missing'}`);
  }
}

const tracked = git('ls-files', '-z').split('\0').filter(Boolean);
const privateFilename = /(?:^|\/)(?:\.env(?:\..+)?|id_(?:rsa|dsa|ecdsa|ed25519)|credentials?(?:\..+)?|secrets?(?:\..+)?)$|\.(?:pem|key|p12|pfx|sqlite|db|dump|bak)$/i;
for (const path of tracked) {
  if (privateFilename.test(path)) failures.push(`${path} looks like a private or credential artifact`);
}

const secretPatterns: readonly [string, RegExp][] = [
  ['AWS access key', /AKIA[0-9A-Z]{16}/],
  ['Google API key', /AIza[0-9A-Za-z_-]{30,}/],
  ['GitHub token', /(?:gh[pousr]_[0-9A-Za-z]{20,}|github_pat_[0-9A-Za-z_]{20,})/],
  ['OpenAI-style secret', /\bsk-[0-9A-Za-z]{20,}/],
  ['private key', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
];
for (const path of tracked) {
  const bytes = readFileSync(join(root, path));
  if (bytes.includes(0)) continue;
  const text = bytes.toString('utf8');
  for (const [name, pattern] of secretPatterns) {
    if (pattern.test(text)) failures.push(`${path} contains a high-confidence ${name} pattern`);
  }
}

if (history) {
  if (git('rev-parse', '--is-shallow-repository').trim() !== 'false') {
    failures.push('full-history audit requires a non-shallow clone');
  } else {
    // Git accepts POSIX ERE here, not JavaScript-only non-capturing groups or word boundaries.
    const historyPattern = 'AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{30,}'
      + '|gh[pousr]_[0-9A-Za-z]{20,}|github_pat_[0-9A-Za-z_]{20,}'
      + '|sk-[0-9A-Za-z]{20,}|-----BEGIN [A-Z ]*PRIVATE KEY-----';
    const matchingCommits = git('log', '--all', '--format=%H', `-G(${historyPattern})`, '--', '.').trim();
    if (matchingCommits) failures.push('repository history contains a high-confidence secret pattern');
    const historyObjects = git('rev-list', '--objects', '--all').trim().split('\n').filter(Boolean);
    for (const object of historyObjects) {
      const path = object.slice(object.indexOf(' ') + 1);
      if (object.includes(' ') && privateFilename.test(path)) {
        failures.push(`history contains private-looking path ${path}`);
      }
    }
    const contributors = new Set(git('log', '--all', '--format=%an <%ae>').trim().split('\n').filter(Boolean));
    process.stdout.write(`public-ready: reviewed ${historyObjects.length} history objects and ${contributors.size} contributor identity\n`);
  }
}

if (failures.length > 0) {
  for (const failure of failures) process.stderr.write(`public-ready: ${failure}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`public-ready: clean tracked tree; ${dependencies.length} dependency licenses classified\n`);
}
