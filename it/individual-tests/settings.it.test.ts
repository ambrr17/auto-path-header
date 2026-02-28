import { strict as assert } from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { afterEach } from 'mocha';

suite('Integration Test Suite: Settings', () => {
	let tempDir: string;
	let originalConfig: vscode.WorkspaceConfiguration;

	beforeEach(async () => {
		// Store original config
		originalConfig = vscode.workspace.getConfiguration('autoPathHeader');
		
		// Create a temporary directory for our test files
		tempDir = path.join(vscode.workspace.rootPath || __dirname, 'temp-test-dir-settings');
		if (!fs.existsSync(tempDir)) {
			fs.mkdirSync(tempDir, { recursive: true });
		}
	});

	afterEach(async () => {
		vscode.window.showInformationMessage('All tests done');
		
		// Restore original config
		const config = vscode.workspace.getConfiguration('autoPathHeader');
		await config.update('enabled', originalConfig.get('enabled'), vscode.ConfigurationTarget.Global);
		await config.update('disabledExtensions', originalConfig.get('disabledExtensions'), vscode.ConfigurationTarget.Global);
		await config.update('allowedOnlyExtensions', originalConfig.get('allowedOnlyExtensions'), vscode.ConfigurationTarget.Global);
		await config.update('formatTemplate', originalConfig.get('formatTemplate'), vscode.ConfigurationTarget.Global);
		await config.update('customTemplatesByExtension', originalConfig.get('customTemplatesByExtension'), vscode.ConfigurationTarget.Global);
		
		// Clean up temporary files
		if (tempDir && fs.existsSync(tempDir)) {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test('Settings test: Disabled extension does not auto-insert', async () => {
		// Disable the extension
		const config = vscode.workspace.getConfiguration('autoPathHeader');
		await config.update('enabled', false, vscode.ConfigurationTarget.Global);
		
		// Create an empty .ts file in the temp directory
		const testFilePath = path.join(tempDir, 'disabled-test.ts');
		fs.writeFileSync(testFilePath, '');
		
		// Open the file
		const doc = await vscode.workspace.openTextDocument(testFilePath);
		const editor = await vscode.window.showTextDocument(doc);
		
		// Wait a bit for potential insertion
		await new Promise(resolve => setTimeout(resolve, 1000));
		
		// Check that no comment was inserted
		const firstLine = editor.document.lineAt(0).text;
		assert.strictEqual(firstLine, '', 'Expected no comment to be inserted when extension is disabled');
	});

	test('Settings test: disabledExtensions works correctly', async () => {
		// Add .ts to disabled extensions
		const config = vscode.workspace.getConfiguration('autoPathHeader');
		await config.update('disabledExtensions', ['.ts'], vscode.ConfigurationTarget.Global);
		
		// Create an empty .ts file in the temp directory
		const testFilePath = path.join(tempDir, 'disabled-ext-test.ts');
		fs.writeFileSync(testFilePath, '');
		
		// Open the file
		const doc = await vscode.workspace.openTextDocument(testFilePath);
		const editor = await vscode.window.showTextDocument(doc);
		
		// Wait a bit for potential insertion
		await new Promise(resolve => setTimeout(resolve, 1000));
		
		// Check that no comment was inserted
		const firstLine = editor.document.lineAt(0).text;
		assert.strictEqual(firstLine, '', 'Expected no comment to be inserted for disabled extension');
	});

	test('Settings test: allowedOnlyExtensions works correctly', async () => {
		// Configure to only allow .js files
		const config = vscode.workspace.getConfiguration('autoPathHeader');
		await config.update('allowedOnlyExtensions', ['.js'], vscode.ConfigurationTarget.Global);
		
		// Create an empty .ts file in the temp directory
		const testFilePath = path.join(tempDir, 'not-allowed-test.ts');
		fs.writeFileSync(testFilePath, '');
		
		// Open the file
		const doc = await vscode.workspace.openTextDocument(testFilePath);
		const editor = await vscode.window.showTextDocument(doc);
		
		// Wait a bit for potential insertion
		await new Promise(resolve => setTimeout(resolve, 1000));
		
		// Check that no comment was inserted
		const firstLine = editor.document.lineAt(0).text;
		assert.strictEqual(firstLine, '', 'Expected no comment to be inserted for non-allowed extension');
	});

	test('Settings test: formatTemplate customization works', async () => {
		// Set a custom template
		const config = vscode.workspace.getConfiguration('autoPathHeader');
		const customTemplate = 'Custom path: {{path}}';
		await config.update('formatTemplate', customTemplate, vscode.ConfigurationTarget.Global);
		
		// Create an empty .ts file in the temp directory
		const testFilePath = path.join(tempDir, 'custom-template.ts');
		fs.writeFileSync(testFilePath, '');
		
		// Open the file
		const doc = await vscode.workspace.openTextDocument(testFilePath);
		const editor = await vscode.window.showTextDocument(doc);
		
		// Execute manual insertion
		await vscode.commands.executeCommand('autoPathHeader.insertComment');
		
		// Wait a bit
		await new Promise(resolve => setTimeout(resolve, 500));
		
		// Check if the custom template was used
		const firstLine = editor.document.lineAt(0).text;
		assert.ok(firstLine.includes('Custom path:'), 'Expected custom template to be used');
	});
});