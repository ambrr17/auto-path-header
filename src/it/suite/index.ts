// src/it/suite/index.ts

/**
 * VS Code Integration Test suite index
 */
import * as path from 'path';
import Mocha from 'mocha';
import { glob } from 'glob';

// Создаем кастомный reporter, который наследуется от базового
class CustomReporter extends Mocha.reporters.Base {
  private testResults: Array<{
    title: string;
    fullTitle: string;
    state: string | undefined;
    duration: number | undefined;
    err: {
      message: string;
      stack: string | undefined;
    } | null;
  }> = [];

  constructor(runner: Mocha.Runner) {
    super(runner);

    runner.on('test', (test: Mocha.Test) => {
      // Инициализируем тест в массиве результатов
      this.testResults.push({
        title: test.title,
        fullTitle: test.fullTitle(),
        state: undefined,
        duration: undefined,
        err: null
      });
    });

    runner.on('test end', (test: Mocha.Test) => {
      // Обновляем информацию о тесте после его завершения
      const result = this.testResults.find(t => t.fullTitle === test.fullTitle());
      if (result) {
        result.state = test.state;
        result.duration = test.duration;
        result.err = test.err ? {
          message: test.err.message,
          stack: test.err.stack
        } : null;
      }
    });

    runner.once('end', () => {
      // Собираем финальные результаты
      const results = {
        failures: this.stats.failures || 0,
        tests: this.testResults,
        passed: this.testResults.filter(test => test.state === 'passed').length,
        failed: this.testResults.filter(test => test.state === 'failed').length,
        pending: this.testResults.filter(test => test.state === 'pending').length
      };

      // Записываем результаты в файл
      const fs = require('fs');
      const pathModule = require('path');
      const resultsPath = pathModule.resolve(__dirname, '../../../it-test-results.json');
      fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    });
  }
}

export function run(): Promise<void> {
  const mocha = new Mocha({ ui: 'tdd', color: true, timeout: 10000, reporter: CustomReporter });
  const testsRoot = path.resolve(__dirname, '..');

  return new Promise(async (resolve, reject) => {
    try {
      const files: string[] = await glob('**/*.it.test.js', { cwd: testsRoot });
      files.sort().forEach(f => mocha.addFile(path.resolve(testsRoot, f)));

      mocha.run((failures: number) => {
        failures ? reject(new Error(`${failures} tests failed.`)) : resolve();
      });
    } catch (err: any) {
      // В случае ошибки также записываем результаты
      const results = {
        failures: 1,
        error: err.message || 'Unknown error occurred',
        stack: err.stack || null,
        tests: []
      };

      const fs = require('fs');
      const pathModule = require('path');
      const resultsPath = pathModule.resolve(__dirname, '../../../it-test-results.json');
      fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));

      reject(err);
    }
  });
}
