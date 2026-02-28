"use strict";
/**
 * Test suite index for Auto Path Header Extension
 * Автор: Niklis
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
const path = __importStar(require("path"));
const mocha_1 = __importDefault(require("mocha"));
const glob_1 = require("glob");
// Создаем кастомный reporter, который наследуется от базового
class CustomReporter extends mocha_1.default.reporters.Base {
    constructor(runner) {
        super(runner);
        this.testResults = [];
        runner.on('test', (test) => {
            // Инициализируем тест в массиве результатов
            this.testResults.push({
                title: test.title,
                fullTitle: test.fullTitle(),
                state: undefined,
                duration: undefined,
                err: null
            });
        });
        runner.on('test end', (test) => {
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
            const resultsPath = pathModule.resolve(__dirname, '../../../unit-test-results.json');
            fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
        });
    }
}
function run() {
    // Create the mocha test
    const mocha = new mocha_1.default({
        ui: 'tdd',
        color: true,
        reporter: CustomReporter
    });
    const testsRoot = path.resolve(__dirname, '..');
    return new Promise(async (resolve, reject) => {
        try {
            const files = await (0, glob_1.glob)('**/**.test.js', { cwd: testsRoot });
            // Add files to the test suite
            files.forEach((f) => mocha.addFile(path.resolve(testsRoot, f)));
            // Run the mocha test
            mocha.run((failures) => {
                if (failures > 0) {
                    reject(new Error(`${failures} tests failed.`));
                }
                else {
                    resolve();
                }
            });
        }
        catch (err) {
            // В случае ошибки также записываем результаты
            const results = {
                failures: 1,
                error: err.message || 'Unknown error occurred',
                stack: err.stack || null,
                tests: []
            };
            const fs = require('fs');
            const pathModule = require('path');
            const resultsPath = pathModule.resolve(__dirname, '../../../unit-test-results.json');
            fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
            reject(err);
        }
    });
}
//# sourceMappingURL=index.js.map