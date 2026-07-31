import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const directory = mkdtempSync(join(tmpdir(), 'invoice-onboarding-feedback-'));
const entry = join(directory, 'rules-entry.ts');
const output = join(directory, 'rules.mjs');
writeFileSync(entry, [
  `export { browserFromUserAgent, deviceFromUserAgent } from ${JSON.stringify(join(new URL('..', import.meta.url).pathname, 'src/lib/feedback-metadata.ts'))};`,
  `export { needsOnboarding } from ${JSON.stringify(join(new URL('..', import.meta.url).pathname, 'src/lib/onboarding-state.ts'))};`,
].join('\n'));

try {
  execFileSync('pnpm', [
    'exec',
    'esbuild',
    entry,
    '--bundle',
    '--platform=node',
    '--format=esm',
    `--outfile=${output}`,
  ], { cwd: new URL('..', import.meta.url), stdio: 'pipe' });

  const rules = await import(`file://${output}`);
  const desktopChrome = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36';
  const mobileSafari = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1';
  assert.equal(rules.browserFromUserAgent(desktopChrome), 'Chrome');
  assert.equal(rules.browserFromUserAgent(mobileSafari), 'Safari');
  assert.equal(rules.deviceFromUserAgent(mobileSafari), 'Mobile');
  assert.equal(rules.deviceFromUserAgent(desktopChrome), 'Desktop');

  const fresh = { completed: false, skipped: false, businessProfile: null };
  assert.equal(rules.needsOnboarding(fresh, '', 0, 0), true);
  assert.equal(rules.needsOnboarding({ ...fresh, completed: true }, '', 0, 0), false);
  assert.equal(rules.needsOnboarding(fresh, '', 1, 0), false);
  assert.equal(rules.needsOnboarding({ ...fresh, businessProfile: { businessName: 'Studio' } }, '', 0, 0), false);
  console.log('Onboarding and feedback metadata checks passed.');
} finally {
  rmSync(directory, { recursive: true, force: true });
}