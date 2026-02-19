/**
 * Auto Path Header Extension
 * Автор: Niklis
 * Автоматически вставляет относительный путь файла в виде комментария на первой строке
 */

import * as vscode from 'vscode'
import * as path from 'path';
import { getMessage } from './localization'
import { isCommentWithPath } from './utils/comments'
import { readConfig } from './services/config'
import { ensureCommentAtTop, replaceTopComment } from './services/inserter'

export function activate(context: vscode.ExtensionContext) {
  // Подписка на изменения конфигурации для обновления кэша
  const configChangeDisposable = vscode.workspace.onDidChangeConfiguration(e => {
    if (e.affectsConfiguration('autoPathHeader')) {
      // Конфигурация будет перечитана при следующем использовании
    }
  });

  // Автоматическая вставка при открытии файла
  const disposable = vscode.workspace.onDidOpenTextDocument(async (document) => {

    //##############
    // vscode.window.showInformationMessage(`!Hello from my extension: ${document.languageId}`);
    // vscode.window.showInformationMessage(document.languageId);
    //##############

    try {
      if (document.lineCount > 1 || document.languageId === 'Log') return
      if (document.isUntitled || document.uri.scheme !== 'file') return

      const filePath = vscode.workspace.asRelativePath(document.uri)
      const cfg = readConfig(document.uri)
      if (!cfg.enabled) return
      if (cfg.disabledLanguages.includes(document.languageId)) return
      
      // Получаем расширение файла и проверяем, не отключено ли оно
      const documentPath = document.uri.path;
      const fileExtension = path.extname(documentPath).toLowerCase();
      if (cfg.disabledExtensions.includes(fileExtension)) return

      const ok = await ensureCommentAtTop(document, filePath, cfg)
      if (!ok) return
    } catch (error) {
      const language = vscode.env.language
      vscode.window.showErrorMessage(
        getMessage('errorInsertingComment', language, error instanceof Error ? error.message : String(error))
      )
    }
  })

  // Слушатель переименования файлов
  let renameOperationInProgress = false;
  const renameDisposable = vscode.workspace.onDidRenameFiles(async (event) => {
    // Prevent concurrent rename operations to avoid race conditions
    if (renameOperationInProgress) {
      // Wait a bit before processing to allow previous operations to complete
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    renameOperationInProgress = true;
    try {
      // Process all renames sequentially to avoid conflicts
      for (const fileRename of event.files) {
        try {
          const oldPath = vscode.workspace.asRelativePath(fileRename.oldUri)
          const newPath = vscode.workspace.asRelativePath(fileRename.newUri)

          // Проверяем существование файла перед открытием
          try {
            const stat = await vscode.workspace.fs.stat(fileRename.newUri);
          } catch (error) {
            // Файл не существует, пропускаем обработку
            continue;
          }

          const document = await vscode.workspace.openTextDocument(fileRename.newUri)

          // Читаем конфигурацию после открытия документа, чтобы получить актуальные настройки
          const cfg = readConfig(fileRename.newUri)
          if (!cfg.enabled || !cfg.updateOnRename) continue

          // Проверяем, является ли язык отключенным - если да, то игнорируем файл полностью
          const isLanguageDisabled = cfg.disabledLanguages.includes(document.languageId);
          if (isLanguageDisabled) continue;
          
          // Проверяем, является ли расширение отключенным - если да, то игнорируем файл полностью
          const documentPath = fileRename.newUri.path;
          const fileExtension = path.extname(documentPath).toLowerCase();
          const isExtensionDisabled = cfg.disabledExtensions.includes(fileExtension);
          if (isExtensionDisabled) continue;

          // Проверка наличия старого комментария
          const firstLine = document.lineAt(0).text.trim()
          if (!isCommentWithPath(firstLine, oldPath)) continue

          ///////////////
          // const msg = await vscode.window.showInformationMessage(`+++ ${oldPath}`,
          //   'Yes', 'No');
          // if (msg !== 'Yes') continue
          ///////////////

          if (cfg.askBeforeUpdate) {
            const language = vscode.env.language
            const message = getMessage('updatePathComment', language)
            const oldName = oldPath.split('/').pop() || oldPath
            const newName = newPath.split('/').pop() || newPath
            const renameInfo = getMessage('fileRenamed', language, oldName, newName)

            const result = await vscode.window.showInformationMessage(
              `${renameInfo}\n${message}`,
              'Yes', 'No'
            )
            if (result !== 'Yes') continue
          }

          const ok = await replaceTopComment(document, oldPath, newPath, cfg)
          if (ok) {
            const language = vscode.env.language
            vscode.window.showInformationMessage(
              getMessage('pathCommentUpdated', language)
            )
          }
        } catch (error) {
          const language = vscode.env.language
          vscode.window.showErrorMessage(
            getMessage('errorUpdatingComment', language, error instanceof Error ? error.message : String(error))
          )
        }
      }
    } finally {
      renameOperationInProgress = false;
    }
  })

  // Команда для ручной вставки комментария
  const insertCommentCommand = vscode.commands.registerCommand('autoPathHeader.insertComment', async () => {
    const editor = vscode.window.activeTextEditor
    if (!editor) {
      vscode.window.showWarningMessage('No active editor')
      return
    }

    const document = editor.document
    const filePath = vscode.workspace.asRelativePath(document.uri)

    if (document.isUntitled || document.uri.scheme !== 'file') {
      vscode.window.showWarningMessage('Cannot insert comment in untitled or non-file documents')
      return
    }

    try {
      // Проверяем, не вставлен ли уже комментарий
      const firstLine = document.lineAt(0).text.trim()
      if (isCommentWithPath(firstLine, filePath)) {
        vscode.window.showInformationMessage('Comment already exists in file')
        return
      }

      const cfg = readConfig(document.uri)
      if (cfg.disabledLanguages.includes(document.languageId)) {
        const language = vscode.env.language
        vscode.window.showInformationMessage(
          getMessage('languageDisabled', language, document.languageId)
        )
        return
      }
      
      // Проверяем отключение по расширению файла
      const documentPath = document.uri.path;
      const fileExtension = path.extname(documentPath).toLowerCase();
      if (cfg.disabledExtensions.includes(fileExtension)) {
        const language = vscode.env.language
        vscode.window.showInformationMessage(
          getMessage('extensionDisabled', language, fileExtension)
        )
        return
      }

      await ensureCommentAtTop(document, filePath, cfg)
    } catch (error) {
      const language = vscode.env.language
      vscode.window.showErrorMessage(
        getMessage('errorInsertingComment', language, error instanceof Error ? error.message : String(error))
      )
    }
  })

  context.subscriptions.push(disposable, renameDisposable, insertCommentCommand, configChangeDisposable)
}

export function deactivate() { }
