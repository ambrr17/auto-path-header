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
 test('applies customTemplatesByExtension for .env.local files', async function() {
     this.timeout(20000); // Увеличиваем таймаут для этого теста
     await updateWorkspaceConfig('customTemplatesByExtension', { '.env.local': '# LOCAL OVERRIDE — {path}' });
     
     try {
       const uri = await createWorkspaceFile('config/.env.local', '');
       // Ждем немного, чтобы убедиться, что конфигурация полностью установлена
       await new Promise(r => setTimeout(r, 500));
       const editor = await openFile(uri);
       // Ждем стабилизации документа
       await waitForDocHeaderStable(editor.document);
       // Проверяем, что файл имеет правильный languageId
       console.log('Language ID for .env.local file:', editor.document.languageId);
       // Ждем немного перед проверкой результата
       await new Promise(r => setTimeout(r, 500));
       // Повторно вызываем команду для гарантии вставки комментария
       await vscode.commands.executeCommand('autoPathHeader.insertComment');
       await new Promise(r => setTimeout(r, 500));
       const firstLine = editor.document.lineAt(0).text.trim();
       assert.strictEqual(firstLine, '# LOCAL OVERRIDE — config/.env.local');
     } finally {
       await resetWorkspaceConfig('customTemplatesByExtension');
     }
   });

   test('prioritizes specific file name over extension template', async function() {
     this.timeout(20000); // Увеличиваем таймаут для этого теста
     await updateWorkspaceConfig('customTemplatesByExtension', {
       'Dockerfile.dev': '# SPECIFIC: {path}',
       '.dev': '# EXTENSION: {path}'
     });
     try {
       const uri = await createWorkspaceFile('Dockerfile.dev', '');
       const editor = await openFile(uri);
       await waitForDocHeaderStable(editor.document);
       const firstLine = editor.document.lineAt(0).text.trim();
       assert.strictEqual(firstLine, '# SPECIFIC: Dockerfile.dev');
     } finally {
       await resetWorkspaceConfig('customTemplatesByExtension');
     }
 });
});