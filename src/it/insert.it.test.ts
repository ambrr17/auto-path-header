/** Integration tests: insert comment */
import * as assert from 'assert';
import * as vscode from 'vscode';

async function createWorkspaceFile(relPath: string, content: string): Promise<vscode.Uri> {
  const folder = vscode.workspace.workspaceFolders?.[0].uri;
  assert.ok(folder, 'Workspace folder required');
  const uri = vscode.Uri.joinPath(folder, relPath);
  await vscode.workspace.fs.writeFile(uri, Buffer.from(content, 'utf8'));
  return uri;
}

async function openFile(uri: vscode.Uri): Promise<vscode.TextEditor> {
  const doc = await vscode.workspace.openTextDocument(uri);
  return vscode.window.showTextDocument(doc);
}

async function waitForDocChange(doc: vscode.TextDocument, timeoutMs = 2000): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      sub.dispose();
      resolve(); // не считаем падением, дадим шанс проверке
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

suite('Insert comment (integration)', () => {
  test('auto insert on open for empty TS file', async () => {
    const uri = await createWorkspaceFile('auto-insert.ts', '');
    const editor = await openFile(uri);
    await waitForDocChange(editor.document);
    const firstLine = editor.document.lineAt(0).text;
    assert.ok(firstLine.trim().startsWith('// '), 'First line should start with // <path>');
  });

  test('manual command inserts when not present', async () => {
    // 2 строки, чтобы авто-вставка не сработала (document.lineCount > 1)
    const uri = await createWorkspaceFile('manual-insert.ts', '\n');
    const editor = await openFile(uri);
    await vscode.commands.executeCommand('autoPathHeader.insertComment');
    await waitForDocChange(editor.document);
    const firstLine = editor.document.lineAt(0).text;
    assert.ok(firstLine.trim().startsWith('// '), 'First line should start with // <path> after command');
  });

  test('manual command does not duplicate', async () => {
    const uri = await createWorkspaceFile('no-duplicate.ts', '');
    const editor = await openFile(uri); // авто вставит
    await waitForDocChange(editor.document);
    const before = editor.document.lineAt(0).text;
    await vscode.commands.executeCommand('autoPathHeader.insertComment');
    // подождём на случай ненужной правки
    await new Promise(r => setTimeout(r, 200));
    const after = editor.document.lineAt(0).text;
    assert.strictEqual(after, before, 'Command should not duplicate existing comment');
  });
});
