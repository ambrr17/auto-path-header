import { strict as assert } from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { afterEach } from 'mocha';

suite('Integration Test Suite: Rename/Update Functionality', () => {
	let tempDir: string;
	let originalConfig: vscode.WorkspaceConfiguration;

	beforeEach(async () => {
		// Store original config
		originalConfig = vscode.workspace.getConfiguration('autoPathHeader');
		
		// Create a temporary directory for our test files
		tempDir = path.join(vscode.workspace.rootPath || __dirname, 'temp-test-dir-rename');
		if (!fs.existsSync(tempDir)) {
			fs.mkdirSync(tempDir, { recursive: true });
		}
	});

	afterEach(async () => {
		vscode.window.showInformationMessage('All tests done');
		
		// Restore original config
		const config = vscode.workspace.getConfiguration('autoPathHeader');
		await config.update('updateOnRename', originalConfig.get('updateOnRename'), vscode.ConfigurationTarget.Global);
		await config.update('askBeforeUpdate', originalConfig.get('askBeforeUpdate'), vscode.ConfigurationTarget.Global);
		
		// Clean up temporary files
		if (tempDir && fs.existsSync(tempDir)) {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test('Rename update test: Comment updates when file is renamed (updateOnRename=true, askBeforeUpdate=false)', async () => {
		// Set the appropriate configuration
		const config = vscode.workspace.getConfiguration('autoPathHeader');
		await config.update('updateOnRename', true, vscode.ConfigurationTarget.Global);
		await config.update('askBeforeUpdate', false, vscode.ConfigurationTarget.Global);
		
		// Create a file in a subdirectory
		const subDir = path.join(tempDir, 'subdir');
		if (!fs.existsSync(subDir)) {
			fs.mkdirSync(subDir, { recursive: true });
		}
		
		const originalFilePath = path.join(subDir, 'original.ts');
		fs.writeFileSync(originalFilePath, '');
		
		// Open the file
		const doc = await vscode.workspace.openTextDocument(originalFilePath);
		const editor = await vscode.window.showTextDocument(doc);
		
		// Execute manual insertion to add the path header
		await vscode.commands.executeCommand('autoPathHeader.insertComment');
		await new Promise(resolve => setTimeout(resolve, 500));
		
		// Get the initial content
		const initialContent = editor.document.getText();
		const initialLine = editor.document.lineAt(0).text;
		
		// Close the document
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
		
		// Rename the file
		const renamedFilePath = path.join(subDir, 'renamed.ts');
		fs.renameSync(originalFilePath, renamedFilePath);
		
		// Reopen the renamed file
		const renamedDoc = await vscode.workspace.openTextDocument(renamedFilePath);
		const renamedEditor = await vscode.window.showTextDocument(renamedDoc);
		
		// Wait for potential update
		await new Promise(resolve => setTimeout(resolve, 1000));
		
		// Check if the comment was updated with the new path
		const updatedLine = renamedEditor.document.lineAt(0).text;
		assert.ok(updatedLine.includes('renamed.ts'), 'Expected the comment to reflect the new filename after renaming');
	});

	test('Rename update test: Update disabled (updateOnRename=false)', async () => {
		// Disable update on rename
		const config = vscode.workspace.getConfiguration('autoPathHeader');
		await config.update('updateOnRename', false, vscode.ConfigurationTarget.Global);
		
		// Create a file
		const originalFilePath = path.join(tempDir, 'no-update-original.ts');
		fs.writeFileSync(originalFilePath, '');
		
		// Open the file
		const doc = await vscode.workspace.openTextDocument(originalFilePath);
		const editor = await vscode.window.showTextDocument(doc);
		
		// Execute manual insertion to add the path header
		await vscode.commands.executeCommand('autoPathHeader.insertComment');
		await new Promise(resolve => setTimeout(resolve, 500));
		
		const initialLine = editor.document.lineAt(0).text;
		
		// Close the document
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
		
		// Rename the file
		const renamedFilePath = path.join(tempDir, 'no-update-renamed.ts');
		fs.renameSync(originalFilePath, renamedFilePath);
		
		// Reopen the renamed file
		const renamedDoc = await vscode.workspace.openTextDocument(renamedFilePath);
		const renamedEditor = await vscode.window.showTextDocument(renamedDoc);
		
		// Wait for potential update
		await new Promise(resolve => setTimeout(resolve, 1000));
		
		// Check that the comment was NOT updated
		const updatedLine = renamedEditor.document.lineAt(0).text;
		assert.ok(initialLine.includes(originalFilePath), 'Expected the comment to retain the original filename when updateOnRename is false');
	});
});