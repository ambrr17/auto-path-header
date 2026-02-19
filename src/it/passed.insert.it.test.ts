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

async function waitForDocHeaderStable(
  doc: vscode.TextDocument,
  timeoutMs = 2000
): Promise<void> {
  return new Promise((resolve) => {
    const start = Date.now();

    const check = () => {
      const firstLine = doc.lineAt(0).text.trim();
      if (firstLine !== '') {
        cleanup();
        resolve();
        return;
      }

      if (Date.now() - start > timeoutMs) {
        cleanup();
        resolve(); // как и раньше — не кидаем ошибку
      }
    };

    const sub = vscode.workspace.onDidChangeTextDocument(e => {
      if (e.document.uri.toString() === doc.uri.toString()) {
        check();
      }
    });

    const interval = setInterval(check, 20);

    const cleanup = () => {
      clearInterval(interval);
      sub.dispose();
    };

    check(); // вдруг заголовок уже вставился
  });
}


const configSection = 'autoPathHeader';

/**
 * Обновляет ключ конфигурации только в Workspace scope.
 * Некоторые настройки, включая customTemplatesByExtension, не поддерживают WorkspaceFolder scope.
 */
async function updateWorkspaceConfig<T>(
  key: string,
  value: T | undefined,
  waitMs = 100
) {
  const cfg = vscode.workspace.getConfiguration(configSection);
  await cfg.update(key, value, vscode.ConfigurationTarget.Workspace);
  
  if (waitMs > 0) await new Promise(r => setTimeout(r, waitMs));
}

/**
  * Гарантированный сброс ключа только в Workspace scope.
 */
async function resetWorkspaceConfig(key: string, waitMs = 100) {
  const cfg = vscode.workspace.getConfiguration(configSection);
  await cfg.update(key, undefined, vscode.ConfigurationTarget.Workspace);
  
  if (waitMs > 0) await new Promise(r => setTimeout(r, waitMs));
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

  test('respects disabledLanguages configuration', async () => {
    await updateWorkspaceConfig('disabledLanguages', ['typescript']);
    try {
      const uri = await createWorkspaceFile('disabled-lang.ts', '');
      const editor = await openFile(uri);
      // Дадим время обработчику onDidOpen
      await new Promise(resolve => setTimeout(resolve, 500));
      const firstLine = editor.document.lineAt(0).text;
      assert.strictEqual(firstLine.trim(), '', 'First line should stay empty when language disabled');
    } finally {
      await resetWorkspaceConfig('disabledLanguages');
    }
 });

  test('applies formatTemplate placeholders', async () => {
    await updateWorkspaceConfig('formatTemplate', '{prefix}[{path}]{suffix}');
    try {
      const uri = await createWorkspaceFile('custom-template.ts', '');
      const editor = await openFile(uri);
      await waitForDocChange(editor.document);
      const firstLine = editor.document.lineAt(0).text.trim();
      assert.strictEqual(firstLine, '// [custom-template.ts]');
    } finally {
      await resetWorkspaceConfig('formatTemplate');
    }
  });

  test('applies customTemplatesByExtension for .test.ts files', async () => {
    await updateWorkspaceConfig('customTemplatesByExtension', { '.test.ts': '// 🧪 TEST: {path}' });
    try {
      const uri = await createWorkspaceFile('src/utils/example.test.ts', '');
      const editor = await openFile(uri);
      // await waitForDocChange(editor.document);
      await waitForDocHeaderStable(editor.document);
      const firstLine = editor.document.lineAt(0).text.trim();
      assert.strictEqual(firstLine, '// 🧪 TEST: src/utils/example.test.ts');
    } finally {
      await resetWorkspaceConfig('customTemplatesByExtension');
    }
  });

 test('applies customTemplatesByExtension for specific file names like Dockerfile.dev', async () => {
    await updateWorkspaceConfig('customTemplatesByExtension', { 'Dockerfile.dev': '# DEV BUILD: {path}' });
    try {
      const uri = await createWorkspaceFile('Dockerfile.dev', '');
      const editor = await openFile(uri);
      await waitForDocChange(editor.document);
      const firstLine = editor.document.lineAt(0).text.trim();
      assert.strictEqual(firstLine, '# DEV BUILD: Dockerfile.dev');
    } finally {
      await resetWorkspaceConfig('customTemplatesByExtension');
    }
  });

  test('prioritizes compound extension over regular extension template', async () => {
    await updateWorkspaceConfig('customTemplatesByExtension', {
      '.env.local': '# COMPOUND: {path}',
      '.local': '# REGULAR: {path}'
    });
    try {
      const uri = await createWorkspaceFile('config/.env.local', '');
      // Ждем немного, чтобы убедиться, что конфигурация полностью установлена
      await new Promise(r => setTimeout(r, 150));
      const editor = await openFile(uri);
      await waitForDocChange(editor.document);
      const firstLine = editor.document.lineAt(0).text.trim();
      assert.strictEqual(firstLine, '# COMPOUND: config/.env.local');
    } finally {
      await resetWorkspaceConfig('customTemplatesByExtension');
    }
  });

  test('falls back to formatTemplate when no matching extension template', async () => {
    await updateWorkspaceConfig('customTemplatesByExtension', { '.other.ts': '// OTHER: {path}' });
    await updateWorkspaceConfig('formatTemplate', '{prefix}[{path}]{suffix}');
    try {
      const uri = await createWorkspaceFile('src/example.ts', '');
      const editor = await openFile(uri);
      await waitForDocChange(editor.document);
      const firstLine = editor.document.lineAt(0).text.trim();
      assert.strictEqual(firstLine, '// [src/example.ts]');
    } finally {
      await resetWorkspaceConfig('customTemplatesByExtension');
      await resetWorkspaceConfig('formatTemplate');
    }
  });

  test('falls back to default when no templates defined', async () => {
    const uri = await createWorkspaceFile('src/default.ts', '');
    const editor = await openFile(uri);
    await waitForDocChange(editor.document);
    const firstLine = editor.document.lineAt(0).text.trim();
    assert.ok(firstLine.startsWith('// src/default.ts'), 'Should use default comment format');
  });
});