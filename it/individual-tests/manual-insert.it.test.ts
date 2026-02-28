import { strict as assert } from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { afterEach } from 'mocha';

suite('Integration Test Suite: Manual Insertion', () => {
	let tempDir: string;

	beforeEach(async () => {
		// Create a temporary directory for our test files
		tempDir = path.join(vscode.workspace.rootPath || __dirname, 'temp-test-dir-manual');
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

	test('Manual insertion test: Insert in empty file', async () => {
		// Create an empty .ts file in the temp directory
		const testFilePath = path.join(tempDir, 'manual-test.ts');
		fs.writeFileSync(testFilePath, '');
		
		// Open the file
		const doc = await vscode.workspace.openTextDocument(testFilePath);
		const editor = await vscode.window.showTextDocument(doc);
		
		// Execute the manual insertion command
		await vscode.commands.executeCommand('autoPathHeader.insertComment');
		
		// Wait a bit for the command to execute
		await new Promise(resolve => setTimeout(resolve, 500));
		
		// Check if the comment was inserted on the first line
		const firstLine = editor.document.lineAt(0).text;
		assert.ok(firstLine.includes('/') || firstLine.includes('*'), 'Expected a comment to be manually inserted on the first line');
	});

	test('Manual insertion test: Prevent duplication when inserting again', async () => {
		// Create an empty .ts file in the temp directory
		const testFilePath = path.join(tempDir, 'no-duplication-test.ts');
		fs.writeFileSync(testFilePath, '');
		
		// Open the file
		const doc = await vscode.workspace.openTextDocument(testFilePath);
		const editor = await vscode.window.showTextDocument(doc);
		
		// Execute the manual insertion command twice
		await vscode.commands.executeCommand('autoPathHeader.insertComment');
		await new Promise(resolve => setTimeout(resolve, 500));
		
		const linesAfterFirstInsert = editor.document.getText().split('\n').length;
		
		await vscode.commands.executeCommand('autoPathHeader.insertComment');
		await new Promise(resolve => setTimeout(resolve, 500));
		
		const linesAfterSecondInsert = editor.document.getText().split('\n').length;
		
		// Verify that no duplicate comment was added
		assert.strictEqual(linesAfterFirstInsert, linesAfterSecondInsert, 'Expected no duplicate comment to be inserted');
	});

	test('Manual insertion test: Message shown for unsupported file type', async () => {
		// Create an unsupported file type
		const testFilePath = path.join(tempDir, 'unsupported.log');
		fs.writeFileSync(testFilePath, '');
		
		// Open the file
		const doc = await vscode.workspace.openTextDocument(testFilePath);
		const editor = await vscode.window.showTextDocument(doc);
		
		// Execute the manual insertion command
		await vscode.commands.executeCommand('autoPathHeader.insertComment');
		
		// Wait a bit
		await new Promise(resolve => setTimeout(resolve, 500));
		
		// Check that no comment was added
		const firstLine = editor.document.lineAt(0).text;
		assert.strictEqual(firstLine, '', 'Expected no comment to be inserted in unsupported file type');
	});
});