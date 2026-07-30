import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const directory = mkdtempSync(join(tmpdir(), 'invoice-status-'));
const output = join(directory, 'invoice-status.mjs');

try {
  execFileSync('pnpm', [
    'exec',
    'esbuild',
    'src/services/invoice-status.ts',
    '--bundle',
    '--platform=node',
    '--format=esm',
    `--outfile=${output}`,
  ], { cwd: new URL('..', import.meta.url), stdio: 'pipe' });

  const { canTransition, statusAfterPayment } = await import(`file://${output}`);
  const validTransitions = [
    ['Draft', 'Sent'],
    ['Sent', 'Paid'],
    ['Sent', 'Partially Paid'],
    ['Sent', 'Overdue'],
    ['Partially Paid', 'Paid'],
  ];
  for (const [from, to] of validTransitions) {
    assert.equal(canTransition(from, to), true, `${from} -> ${to} should be valid`);
  }

  const invalidTransitions = [
    ['Draft', 'Paid'],
    ['Draft', 'Partially Paid'],
    ['Paid', 'Partially Paid'],
    ['Paid', 'Overdue'],
    ['Cancelled', 'Sent'],
  ];
  for (const [from, to] of invalidTransitions) {
    assert.equal(canTransition(from, to), false, `${from} -> ${to} should be invalid`);
  }

  assert.equal(statusAfterPayment(100, 0), 'Sent');
  assert.equal(statusAfterPayment(100, 25), 'Partially Paid');
  assert.equal(statusAfterPayment(100, 100), 'Paid');
  console.log('Invoice status transition checks passed.');
} finally {
  rmSync(directory, { recursive: true, force: true });
}