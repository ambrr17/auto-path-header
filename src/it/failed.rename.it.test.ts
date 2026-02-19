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
     this.timeout(30000); // Увеличиваем таймаут для этого теста
     const folder = vscode.workspace.workspaceFolders?.[0].uri!;
     const config = vscode.workspace.getConfiguration('autoPathHeader', folder);
     await config.update('updateOnRename', true, vscode.ConfigurationTarget.Workspace);
     await config.update('askBeforeUpdate', false, vscode.ConfigurationTarget.Workspace);

     const uriOld = await createWorkspaceFile('a.ts', '');
     let doc = await vscode.workspace.openTextDocument(uriOld);
     await vscode.window.showTextDocument(doc);
     await waitForDocChange(doc);
     const oldFirst = doc.lineAt(0).text;

     const uriNew = vscode.Uri.joinPath(folder, 'b.ts');
     await vscode.workspace.fs.rename(uriOld, uriNew, { overwrite: true });

     doc = await vscode.workspace.openTextDocument(uriNew);
     await waitForDocChange(doc);
     const newFirst = doc.lineAt(0).text;
     assert.notStrictEqual(newFirst, oldFirst, 'First line should change after rename');
   });

   test('updates comment style when language changes on rename', async function () {
       this.timeout(30000); // Увеличиваем таймаут для этого теста
       const folder = vscode.workspace.workspaceFolders?.[0].uri!;
       const config = vscode.workspace.getConfiguration('autoPathHeader', folder);
       await config.update('updateOnRename', true, vscode.ConfigurationTarget.Workspace);
       await config.update('askBeforeUpdate', false, vscode.ConfigurationTarget.Workspace);
  
       const uriOld = await createWorkspaceFile('renameStyle/test.ts', '');
       let doc = await vscode.workspace.openTextDocument(uriOld);
       await vscode.window.showTextDocument(doc);
       await waitForDocChange(doc);
       // Ждем немного, чтобы комментарий гарантированно вставился
       await new Promise(r => setTimeout(r, 500));
       assert.strictEqual(doc.lineAt(0).text.trim(), '// renameStyle/test.ts');
  
       const uriNew = vscode.Uri.joinPath(folder, 'renameStyle/test.py');
       await vscode.workspace.fs.rename(uriOld, uriNew, { overwrite: true });
  
       // Ждем обновления документа после переименования
       await new Promise(r => setTimeout(r, 1000));
       doc = await vscode.workspace.openTextDocument(uriNew);
       await waitForDocChange(doc);
       // Ждем обновления комментария
       await new Promise(r => setTimeout(r, 1000));
       assert.strictEqual(doc.lineAt(0).text.trim(), '# renameStyle/test.py');
     });
  
     test('updates path with custom template when file is renamed', async function () {
         this.timeout(30000); // Увеличиваем таймаут для этого теста
         const folder = vscode.workspace.workspaceFolders?.[0].uri!;
         const config = vscode.workspace.getConfiguration('autoPathHeader', folder);
         await config.update('updateOnRename', true, vscode.ConfigurationTarget.Workspace);
         await config.update('askBeforeUpdate', false, vscode.ConfigurationTarget.Workspace);
         await config.update('customTemplatesByExtension', { '.test.ts': '// 🧪 TEST: {path}' }, vscode.ConfigurationTarget.Workspace);
         // Ждем, чтобы конфигурация точно применилась
         await new Promise(r => setTimeout(r, 500));
    
         try {
           const uriOld = await createWorkspaceFile('src/example.test.ts', '');
           let doc = await vscode.workspace.openTextDocument(uriOld);
           await vscode.window.showTextDocument(doc);
           await waitForDocChange(doc);
           // Ждем немного, чтобы комментарий гарантированно вставился
           await new Promise(r => setTimeout(r, 500));
           assert.strictEqual(doc.lineAt(0).text.trim(), '// 🧪 TEST: src/example.test.ts');
    
           const uriNew = vscode.Uri.joinPath(folder, 'src/renamed.test.ts');
           await vscode.workspace.fs.rename(uriOld, uriNew, { overwrite: true });
    
           // Ждем обновления документа после переименования
           await new Promise(r => setTimeout(r, 3000));
           doc = await vscode.workspace.openTextDocument(uriNew);
           await waitForDocChange(doc);
           // Ждем обновления комментария
           await new Promise(r => setTimeout(r, 3000));
           assert.strictEqual(doc.lineAt(0).text.trim(), '// 🧪 TEST: src/renamed.test.ts');
         } finally {
           await config.update('customTemplatesByExtension', undefined, vscode.ConfigurationTarget.Workspace);
           // Ждем, чтобы конфигурация точно сбросилась
           await new Promise(r => setTimeout(r, 500));
         }
       });
  
     test('updates path with specific file template when file is renamed', async function () {
         this.timeout(30000); // Увеличиваем таймаут для этого теста
         const folder = vscode.workspace.workspaceFolders?.[0].uri!;
         const config = vscode.workspace.getConfiguration('autoPathHeader', folder);
         
         // Полностью сбрасываем все настройки перед тестом
         await config.update('customTemplatesByExtension', undefined, vscode.ConfigurationTarget.Workspace);
         await new Promise(r => setTimeout(r, 1000)); // Даем время на сброс
         
         // Убеждаемся, что конфигурация полностью сброшена
         let allConfigs = config.get('customTemplatesByExtension');
         if (allConfigs && typeof allConfigs === 'object' && Object.keys(allConfigs).length > 0) {
           console.log('Still has configurations, waiting more...');
           await new Promise(r => setTimeout(r, 2000));
           // Пробуем сбросить еще раз
           await config.update('customTemplatesByExtension', undefined, vscode.ConfigurationTarget.Workspace);
           await new Promise(r => setTimeout(r, 1000));
         }
         
         await config.update('updateOnRename', true, vscode.ConfigurationTarget.Workspace);
         await config.update('askBeforeUpdate', false, vscode.ConfigurationTarget.Workspace);
         // Устанавливаем только нужный шаблон
         await config.update('customTemplatesByExtension', { 'Dockerfile.dev': '# DEV BUILD: {path}' }, vscode.ConfigurationTarget.Workspace);
         // Ждем, чтобы конфигурация точно применилась
         await new Promise(r => setTimeout(r, 2000));
    
         try {
           const uriOld = await createWorkspaceFile('Dockerfile.dev', '');
           let doc = await vscode.workspace.openTextDocument(uriOld);
           await vscode.window.showTextDocument(doc);
           await waitForDocChange(doc);
           // Ждем немного, чтобы комментарий гарантированно вставился
           await new Promise(r => setTimeout(r, 1000));
           // Проверяем, что установлен правильный комментарий
           const firstLine = doc.lineAt(0).text.trim();
           assert.strictEqual(firstLine, '# DEV BUILD: Dockerfile.dev', `Expected '# DEV BUILD: Dockerfile.dev', but got '${firstLine}'`);
    
           const uriNew = vscode.Uri.joinPath(folder, 'Dockerfile.prod');
           await vscode.workspace.fs.rename(uriOld, uriNew, { overwrite: true });
    
           // Ждем дополнительное время, чтобы система могла обработать переименование с учетом новой конфигурации
           await new Promise(r => setTimeout(r, 5000));
           doc = await vscode.workspace.openTextDocument(uriNew);
           await waitForDocChange(doc);
           // Ждем обновления комментария
           await new Promise(r => setTimeout(r, 1000));
           // Should fall back to default template since .prod extension doesn't have a custom template
           const newFirstLine = doc.lineAt(0).text.trim();
           assert.ok(newFirstLine.startsWith('# Dockerfile.prod'), `Expected line to start with '# Dockerfile.prod', but got '${newFirstLine}'`);
         } finally {
           // Полностью сбрасываем конфигурацию после теста
           await config.update('customTemplatesByExtension', undefined, vscode.ConfigurationTarget.Workspace);
           await new Promise(r => setTimeout(r, 1000));
         }
       });
  
     test('updates path with compound extension template when file is renamed', async function () {
         this.timeout(30000); // Увеличиваем таймаут для этого теста
         const folder = vscode.workspace.workspaceFolders?.[0].uri!;
         const config = vscode.workspace.getConfiguration('autoPathHeader', folder);
             
             // Сбрасываем все кастомные шаблоны и другие возможные настройки перед тестом
             await config.update('customTemplatesByExtension', undefined, vscode.ConfigurationTarget.Workspace);
             await new Promise(r => setTimeout(r, 1000)); // Увеличиваем ожидание сброса
             
             // Перед установкой новой конфигурации убедимся, что предыдущая полностью сброшена
             const allConfigs = config.get('customTemplatesByExtension');
             if (allConfigs && typeof allConfigs === 'object' && Object.keys(allConfigs).length > 0) {
               console.log('Still has configurations, waiting more...');
               await new Promise(r => setTimeout(r, 2000));
             }
             
             await config.update('updateOnRename', true, vscode.ConfigurationTarget.Workspace);
             await config.update('askBeforeUpdate', false, vscode.ConfigurationTarget.Workspace);
             // Устанавливаем только нужный шаблон
             await config.update('customTemplatesByExtension', { '.env.local': '# RENAME LOCAL: {path}' }, vscode.ConfigurationTarget.Workspace);
             // Ждем, чтобы конфигурация точно применилась
             await new Promise(r => setTimeout(r, 2000));
    
         try {
           const uriOld = await createWorkspaceFile('config/.env.local', '');
           let doc = await vscode.workspace.openTextDocument(uriOld);
           await vscode.window.showTextDocument(doc);
           await waitForDocChange(doc);
           // Ждем немного, чтобы комментарий гарантированно вставился
           await new Promise(r => setTimeout(r, 500));
           assert.strictEqual(doc.lineAt(0).text.trim(), '# RENAME LOCAL: config/.env.local');
    
           const uriNew = vscode.Uri.joinPath(folder, 'config/.env.production');
           await vscode.workspace.fs.rename(uriOld, uriNew, { overwrite: true });
    
           // Ждем обновления документа после переименования
           await new Promise(r => setTimeout(r, 300));
           doc = await vscode.workspace.openTextDocument(uriNew);
           await waitForDocChange(doc);
           // Ждем обновления комментария
           await new Promise(r => setTimeout(r, 3000));
           // Should fall back to default template since .env.production doesn't have a custom template
           assert.ok(doc.lineAt(0).text.trim().startsWith('# config/.env.production'));
         } finally {
           await config.update('customTemplatesByExtension', undefined, vscode.ConfigurationTarget.Workspace);
           // Ждем, чтобы конфигурация точно сбросилась
           await new Promise(r => setTimeout(r, 500));
         }
       });
});