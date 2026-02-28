import { strict as assert } from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { afterEach } from 'mocha';

suite('Integration Test Suite: Automatic Insertion', () => {
	let tempDir: string;

	beforeEach(async () => {
		// reset allowed directories so tests are not affected by defaults
		await vscode.workspace.getConfiguration('autoPathHeader').update('allowedOnlyDirectories', [], vscode.ConfigurationTarget.Workspace);

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

	test('Auto-insert test: allowedOnlyDirectories filters files correctly', async () => {
		// configure to only allow the temp directory
		const config = vscode.workspace.getConfiguration('autoPathHeader');
		await config.update('allowedOnlyDirectories', [path.basename(tempDir)], vscode.ConfigurationTarget.Workspace);

		// file inside allowed directory should get comment
		const inAllowed = path.join(tempDir, 'allowed.ts');
		fs.writeFileSync(inAllowed, '');
		const doc1 = await vscode.workspace.openTextDocument(inAllowed);
		const editor1 = await vscode.window.showTextDocument(doc1);
		await new Promise(resolve => setTimeout(resolve, 1000));
		assert.ok(editor1.document.lineAt(0).text.includes('allowed.ts'));

		// file outside allowed (root) should not
		const outside = path.join(vscode.workspace.rootPath || __dirname, 'outside.ts');
		fs.writeFileSync(outside, '');
		const doc2 = await vscode.workspace.openTextDocument(outside);
		const editor2 = await vscode.window.showTextDocument(doc2);
		await new Promise(resolve => setTimeout(resolve, 1000));
		assert.strictEqual(editor2.document.lineAt(0).text, '');
	});

	test('Auto-insert test: allowedOnlyDirectories glob pattern support', async () => {
		const config = vscode.workspace.getConfiguration('autoPathHeader');
		await config.update('allowedOnlyDirectories', ['**/nested'], vscode.ConfigurationTarget.Workspace);

		// create nested folder and file
		const nestedDir = path.join(tempDir, 'nested');
		fs.mkdirSync(nestedDir, { recursive: true });
		const nestedFile = path.join(nestedDir, 'file.ts');
		fs.writeFileSync(nestedFile, '');

		const doc = await vscode.workspace.openTextDocument(nestedFile);
		const editor = await vscode.window.showTextDocument(doc);
		await new Promise(resolve => setTimeout(resolve, 1000));
		assert.ok(editor.document.lineAt(0).text.includes('nested/file.ts'));

		// file in unmatching folder should not get inserted
		const other = path.join(tempDir, 'other', 'foo.ts');
		fs.mkdirSync(path.dirname(other), { recursive: true });
		fs.writeFileSync(other, '');
		const doc2 = await vscode.workspace.openTextDocument(other);
		const editor2 = await vscode.window.showTextDocument(doc2);
		await new Promise(resolve => setTimeout(resolve, 1000));
		assert.strictEqual(editor2.document.lineAt(0).text, '');
	});
});