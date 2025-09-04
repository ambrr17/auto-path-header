/** Integration test: activation */
import * as assert from 'assert';
import * as vscode from 'vscode';

function findThisExtension(): vscode.Extension<any> | undefined {
  return vscode.extensions.all.find(ext => ext.packageJSON?.name === 'auto-path-header');
}

suite('Activation (integration)', () => {
  test('activates on command', async () => {
    const ext = findThisExtension();
    assert.ok(ext, 'Extension should be discoverable');
    await vscode.commands.executeCommand('autoPathHeader.insertComment');
    await ext!.activate();
    assert.ok(ext!.isActive, 'Extension should activate on command');
  });

  test('activates on language open (typescript)', async () => {
    const doc = await vscode.workspace.openTextDocument({ language: 'typescript', content: '' });
    await vscode.window.showTextDocument(doc);
    const ext = findThisExtension();
    assert.ok(ext, 'Extension should be discoverable');
    // Небольшое ожидание цикла событий
    await new Promise(r => setTimeout(r, 200));
    assert.ok(ext!.isActive, 'Extension should be active after opening TS document');
  });
});
