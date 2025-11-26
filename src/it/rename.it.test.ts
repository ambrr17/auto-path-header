/** Integration tests: rename/move updates */
import * as assert from 'assert';
import * as path from 'path';
import * as vscode from 'vscode';

async function createWorkspaceFile(relPath: string, content: string): Promise<vscode.Uri> {
  const folder = vscode.workspace.workspaceFolders?.[0].uri;
  assert.ok(folder, 'Workspace folder required');
  const uri = vscode.Uri.joinPath(folder, relPath);
  const dirName = path.dirname(relPath);
  if (dirName && dirName !== '.') {
    const dir = vscode.Uri.joinPath(folder, dirName);
    await vscode.workspace.fs.createDirectory(dir);
  }
  await vscode.workspace.fs.writeFile(uri, Buffer.from(content, 'utf8'));
  return uri;
}

async function waitForDocChange(doc: vscode.TextDocument, timeoutMs = 3000): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      sub.dispose();
      resolve();
    }, timeoutMs);
    const sub = vscode.workspace.onDidChangeTextDocument(e => {
      if (e.document.uri.toString() === doc.uri.toString()) {
        clearTimeout(timer);
        sub.dispose();
        resolve();
      }
    });
  });
}

suite('Rename/Move updates (integration)', () => {
  test('updates path automatically when updateOnRename=true, askBeforeUpdate=false', async function () {
    this.timeout(30000);
    const config = vscode.workspace.getConfiguration('autoPathHeader');
    await config.update('updateOnRename', true, vscode.ConfigurationTarget.Workspace);
    await config.update('askBeforeUpdate', false, vscode.ConfigurationTarget.Workspace);

    const uriOld = await createWorkspaceFile('a.ts', '');
    let doc = await vscode.workspace.openTextDocument(uriOld);
    await vscode.window.showTextDocument(doc);
    await waitForDocChange(doc);
    const oldFirst = doc.lineAt(0).text;

    const folder = vscode.workspace.workspaceFolders?.[0].uri!;
    const uriNew = vscode.Uri.joinPath(folder, 'b.ts');
    await vscode.workspace.fs.rename(uriOld, uriNew, { overwrite: true });

    doc = await vscode.workspace.openTextDocument(uriNew);
    await waitForDocChange(doc);
    const newFirst = doc.lineAt(0).text;
    assert.notStrictEqual(newFirst, oldFirst, 'First line should change after rename');
  });

  test('updates comment style when language changes on rename', async function () {
    this.timeout(30000);
    const config = vscode.workspace.getConfiguration('autoPathHeader');
    await config.update('updateOnRename', true, vscode.ConfigurationTarget.Workspace);
    await config.update('askBeforeUpdate', false, vscode.ConfigurationTarget.Workspace);

    const uriOld = await createWorkspaceFile('renameStyle/test.ts', '');
    let doc = await vscode.workspace.openTextDocument(uriOld);
    await vscode.window.showTextDocument(doc);
    await waitForDocChange(doc);
    assert.strictEqual(doc.lineAt(0).text.trim(), '// renameStyle/test.ts');

    const folder = vscode.workspace.workspaceFolders?.[0].uri!;
    const uriNew = vscode.Uri.joinPath(folder, 'renameStyle/test.py');
    await vscode.workspace.fs.rename(uriOld, uriNew, { overwrite: true });

    doc = await vscode.workspace.openTextDocument(uriNew);
    await waitForDocChange(doc);
    assert.strictEqual(doc.lineAt(0).text.trim(), '# renameStyle/test.py');
  });
});
