import { strict as assert } from 'assert';
import * as vscode from 'vscode';
import { afterEach } from 'mocha';

suite('Integration Test Suite: Extension Activation', () => {
	
	afterEach(() => {
		vscode.window.showInformationMessage('All tests done');
	});

	test('Activation test: Opening supported file type activates extension', async () => {
		// Create a temporary file with a supported extension
		const doc = await vscode.workspace.openTextDocument({
			content: '',
			language: 'typescript'
		});
		
		await vscode.window.showTextDocument(doc);
		
		// Check that extension is activated by attempting to execute a command
		try {
			await vscode.commands.executeCommand('autoPathHeader.insertComment');
			assert.ok(true, 'Extension was successfully activated');
		} catch (error) {
			assert.fail(`Extension was not activated: ${error}`);
		}
	});

	test('Activation test: Execute command activates extension', async () => {
		// Try to execute the command directly to activate the extension
		try {
			await vscode.commands.executeCommand('autoPathHeader.insertComment');
			assert.ok(true, 'Extension was successfully activated via command');
		} catch (error) {
			assert.fail(`Extension was not activated via command: ${error}`);
		}
	});
});