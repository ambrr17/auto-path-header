import * as assert from 'assert';
import { readConfig, AutoPathHeaderConfig } from '../src/services/config';
import * as vscode from 'vscode';

suite('Configuration Tests', () => {
    test('default reactTo folder rename setting is true', () => {
        // readConfig returns the configuration using the workspace defaults,
        // so the property should exist and default to true
        const cfg = readConfig();
        assert.strictEqual(cfg.updateOnRenameFolder, true);
    });

    test('reading explicit folder rename setting from workspace configuration', async () => {
        const config = vscode.workspace.getConfiguration('autoPathHeader');
        await config.update('updateOnRenameFolder', false, vscode.ConfigurationTarget.Global);
        const cfg = readConfig();
        assert.strictEqual(cfg.updateOnRenameFolder, false);
        // clean up
        await config.update('updateOnRenameFolder', undefined, vscode.ConfigurationTarget.Global);
    });
});
