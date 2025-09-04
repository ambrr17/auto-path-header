/**
 * VS Code Integration Test runner
 */
import * as path from 'path';
import { runTests } from '@vscode/test-electron';

async function main() {
  try {
    const extensionDevelopmentPath = path.resolve(__dirname, '../../');
    const extensionTestsPath = path.resolve(__dirname, './suite/index');
    const testWorkspace = path.resolve(__dirname, '../../.vscode-testworkspace');

    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: [testWorkspace]
    });
  } catch (err) {
    console.error('Failed to run VS Code integration tests');
    process.exit(1);
  }
}

main();
