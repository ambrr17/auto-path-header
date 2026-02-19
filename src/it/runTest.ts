// src/it/runTest.ts

/**
 * VS Code Integration Test runner
 */
import * as path from 'path';
import { runTests } from '@vscode/test-electron';

async function main() {
  try {
    const extensionDevelopmentPath = path.resolve(__dirname, '../../');
    // Используем директорию тестового рабочего пространства
    const testWorkspace = path.resolve(__dirname, '../../.vscode-testworkspace');

    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath: path.resolve(__dirname, './suite/index'),
      version: '1.106.3',
      launchArgs: [testWorkspace, '--disable-extensions']
    });
  } catch (err) {
    console.error('Failed to run VS Code integration tests');
    process.exit(1);
  }
}

main();
