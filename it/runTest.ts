// src/it/runTest.ts

/**
 * VS Code Integration Test runner
 */
import * as path from 'path';
import { runTests } from '@vscode/test-electron';

async function main() {
  try {
    // Path to the extension root (project root)
    const extensionDevelopmentPath = path.resolve(__dirname, '..', '..');
    
    // Path to the test workspace directory
    const testWorkspace = path.resolve(extensionDevelopmentPath, '.vscode-testworkspace');

    // Создаем уникальный каталог для пользовательских данных
    const userDataDir = path.resolve(__dirname, '../.vscode-test-user-data-' + Date.now());
    
    console.log('Extension Development Path:', extensionDevelopmentPath);
    console.log('Test Workspace Path:', testWorkspace);
    console.log('User Data Dir:', userDataDir);
    
    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath: path.resolve(__dirname, './suite/index'),
      version: 'stable',
      launchArgs: [testWorkspace, '--disable-extensions', '--user-data-dir=' + userDataDir],
      // Добавляем уникальный рабочий каталог для предотвращения конфликтов мьютексов
    });
  } catch (err) {
    console.error('Failed to run VS Code integration tests');
    console.error(err);
    process.exit(1);
  }
}

main();
