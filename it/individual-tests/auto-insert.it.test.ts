import { strict as assert } from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { afterEach } from 'mocha';

suite('Integration Test Suite: Automatic Insertion', () => {
	let tempDir: string;

	beforeEach(async () => {
		// Create a temporary directory for our test files
		tempDir = path.join(vscode.workspace.rootPath || __dirname, 'temp-test-dir');
		if (!fs.existsSync(tempDir)) {
			fs.mkdirSync(tempDir, { recursive: true });
		}
	});

	afterEach(async () => {
		vscode.window.showInformationMessage('All tests done');
		
		// Clean up temporary files
		if (tempDir && fs.existsSync(tempDir)) {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test('Auto-insert test: Empty file of supported type gets comment inserted', async () => {
		// Create an empty .ts file in the temp directory
		const testFilePath = path.join(tempDir, 'test.ts');
		fs.writeFileSync(testFilePath, '');
		
		// Open the file
		const doc = await vscode.workspace.openTextDocument(testFilePath);
		const editor = await vscode.window.showTextDocument(doc);
		
		// Wait a bit for the extension to potentially insert the comment
		await new Promise(resolve => setTimeout(resolve, 1000));
		
		// Check if the comment was inserted on the first line
		const firstLine = editor.document.lineAt(0).text;
		assert.ok(firstLine.includes('/') || firstLine.includes('*'), 'Expected a comment to be inserted on the first line');
	});

	test('Auto-insert test: File with content does not get automatic insertion', async () => {
		// Create a file with content
		const testFilePath = path.join(tempDir, 'test-with-content.ts');
		fs.writeFileSync(testFilePath, 'console.log("Hello World");\nlet x = 5;');
		
		// Open the file
		const doc = await vscode.workspace.openTextDocument(testFilePath);
		const editor = await vscode.window.showTextDocument(doc);
		
		// Wait a bit
		await new Promise(resolve => setTimeout(resolve, 1000));
		
		// Check that the first line hasn't changed
		const firstLine = editor.document.lineAt(0).text;
		assert.strictEqual(firstLine, 'console.log("Hello World");', 'Expected first line to remain unchanged');
	});

	test('Auto-insert test: Unsupported file type does not get insertion', async () => {
		// Create an unsupported file type
		const testFilePath = path.join(tempDir, 'test.log');
		fs.writeFileSync(testFilePath, '');
		
		// Open the file
		const doc = await vscode.workspace.openTextDocument(testFilePath);
		const editor = await vscode.window.showTextDocument(doc);
		
		// Wait a bit
		await new Promise(resolve => setTimeout(resolve, 1000));
		
		// Check that no comment was added
		const firstLine = editor.document.lineAt(0).text;
		assert.strictEqual(firstLine, '', 'Expected no comment to be inserted in unsupported file type');
	});
});