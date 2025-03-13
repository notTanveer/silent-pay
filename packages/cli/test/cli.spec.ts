import { spawnSync } from 'child_process';
import { join } from 'path';

describe('silentpay CLI', () => {
  const cliPath = join(__dirname, '..', 'dist', 'index.js');

  it('should display version', () => {
    const result = spawnSync('node', [cliPath, '--version']);
    expect(result.stdout.toString().trim()).toMatch(/^0\.0\.1/);
  });

});
