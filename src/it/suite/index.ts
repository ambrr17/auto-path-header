/**
 * VS Code Integration Test suite index
 */
import * as path from 'path';
import Mocha from 'mocha';
import { glob } from 'glob';

export function run(): Promise<void> {
  const mocha = new Mocha({ ui: 'tdd', color: true, timeout: 10000 });
  const testsRoot = path.resolve(__dirname, '..');

  return new Promise(async (resolve, reject) => {
    try {
      const files: string[] = await glob('**/*.it.test.js', { cwd: testsRoot });
      files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));

      mocha.run(failures => failures ? reject(new Error(`${failures} tests failed.`)) : resolve());
    } catch (err) {
      reject(err);
    }
  });
}
