import { execFileSync } from 'node:child_process';

/**
 * The identifier this build reports, read by `@platform/governance/status` and
 * stamped into the adoption pack.
 *
 * A build date and the commit it came from, because this project has no staged
 * version ladder to name a release after. A source export with no git history
 * still builds and says so.
 */
export function releaseId(): string {
  const date = new Date().toISOString().slice(0, 10);
  let commit = 'unknown';
  try {
    commit = execFileSync('git', ['rev-parse', '--short=10', 'HEAD'], { encoding: 'utf8' }).trim();
  } catch {
    // No git available or no repository: the date alone still identifies the build.
  }
  return `${date}+${commit}`;
}
