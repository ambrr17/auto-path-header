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
import { isInIgnoredDirectory, isInAllowedDirectory } from './utils/directoryUtils'

export function activate(context: vscode.ExtensionContext) {

  // Подписка на изменения конфигурации для обновления кэша
  const configChangeDisposable = vscode.workspace.onDidChangeConfiguration(e => {
    if (e.affectsConfiguration('autoPathHeader')) {
      // Конфигурация будет перечитана при следующем использовании
    }
  });

  // Автоматическая вставка при открытии файла
  const disposable = vscode.workspace.onDidOpenTextDocument(async (document) => {

    try {
      if (document.lineCount > 1) return
      if (document.isUntitled || document.uri.scheme !== 'file') return

      const filePath = vscode.workspace.asRelativePath(document.uri)
      const cfg = readConfig(document.uri)
      if (!cfg.enabled) return

      // Получаем расширение файла и проверяем, разрешено ли оно
      const documentPath = document.uri.path;
      const fileExtension = path.extname(documentPath).toLowerCase();
      const fileName = path.basename(documentPath);

      // Проверяем, есть ли пользовательский шаблон для этого файла
      const hasCustomTemplate = cfg.customTemplatesByExtension.hasOwnProperty(fileName) ||
        cfg.customTemplatesByExtension.hasOwnProperty(fileExtension) ||
        // Проверяем составные расширения (например, .env.local)
        (() => {
          const parts = fileName.split('.');
          if (parts.length > 1) {
            for (let i = 1; i < parts.length; i++) {
              const compoundExt = '.' + parts.slice(i).join('.');
              if (cfg.customTemplatesByExtension.hasOwnProperty(compoundExt)) {
                return true;
              }
            }
          }
          return false;
        })();

      // Проверяем, разрешено ли расширение в allowedOnlyExtensions
      // Но если есть пользовательский шаблон, разрешаем обработку независимо от allowedOnlyExtensions
      if (cfg.allowedOnlyExtensions.length > 0 && !cfg.allowedOnlyExtensions.includes(fileExtension) && !hasCustomTemplate) return

      // Проверяем, не отключено ли расширение в disabledExtensions
      // Но если есть пользовательский шаблон, разрешаем обработку независимо от disabledExtensions
      if (cfg.disabledExtensions.includes(fileExtension) && !hasCustomTemplate) return

      // Check if the file is in an ignored directory
      if (isInIgnoredDirectory(filePath, cfg.ignoredDirectories)) return

      // Enforce allowed-only directories if configured (relative to workspace root)
      if (!isInAllowedDirectory(filePath, cfg.allowedOnlyDirectories)) return

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
          let stat;
          try {
            stat = await vscode.workspace.fs.stat(fileRename.newUri);
          } catch (error) {
            // Файл не существует, пропускаем обработку
            continue;
          }

          // #######
          // if (stat.type !== vscode.FileType.File) {
          //   vscode.window.showInformationMessage(`это папка — пропускаем event.files.length: ${event.files.length}`)
          //   continue; // это папка — пропускаем
          // }
          // #######

          const document = await vscode.workspace.openTextDocument(fileRename.newUri)

          // Читаем конфигурацию после открытия документа, чтобы получить актуальные настройки
          const cfg = readConfig(fileRename.newUri)
          if (!cfg.enabled || !cfg.updateOnRename) continue

          // Проверяем, разрешено ли расширение в allowedOnlyExtensions
          const documentPath = fileRename.newUri.path;
          const fileExtension = path.extname(documentPath).toLowerCase();
          const fileName = path.basename(documentPath);
          // Проверяем, есть ли пользовательский шаблон для этого файла
          const hasCustomTemplate = cfg.customTemplatesByExtension.hasOwnProperty(fileName) ||
            cfg.customTemplatesByExtension.hasOwnProperty(fileExtension) ||
            // Проверяем составные расширения (например, .env.local)
            (() => {
              const parts = fileName.split('.');
              if (parts.length > 1) {
                for (let i = 1; i < parts.length; i++) {
                  const compoundExt = '.' + parts.slice(i).join('.');
                  if (cfg.customTemplatesByExtension.hasOwnProperty(compoundExt)) {
                    return true;
                  }
                }
              }
              return false;
            })();

          // Проверяем, разрешено ли расширение в allowedOnlyExtensions
          // Но если есть пользовательский шаблон, разрешаем обработку независимо от allowedOnlyExtensions
          if (cfg.allowedOnlyExtensions.length > 0 && !cfg.allowedOnlyExtensions.includes(fileExtension) && !hasCustomTemplate) continue;

          // Проверяем, является ли расширение отключенным - если да, то игнорируем файл полностью
          // Но если есть пользовательский шаблон, разрешаем обработку независимо от disabledExtensions
          const isExtensionDisabled = cfg.disabledExtensions.includes(fileExtension) && !hasCustomTemplate;
          if (isExtensionDisabled) continue;

          // Check if the new file path is in an ignored directory
          const isNewPathInIgnoredDir = isInIgnoredDirectory(newPath, cfg.ignoredDirectories);
          if (isNewPathInIgnoredDir) continue;

          // if allowed-only directories are set, skip paths outside them
          if (!isInAllowedDirectory(newPath, cfg.allowedOnlyDirectories)) continue;

          // Проверка наличия старого комментария
          const firstLine = document.lineAt(0).text.trim()
          if (!isCommentWithPath(firstLine, oldPath)) {
            // Если в файле не найден комментарий с предыдущим путем, уведомляем пользователя
            const language = vscode.env.language;
            const fileName = path.basename(newPath);

            const result = await vscode.window.showInformationMessage(
              getMessage('insertNewComment', language, fileName),
              'Yes', 'No'
            );

            if (result === 'Yes') {
              // Вставляем новый комментарий как при создании нового файла
              await ensureCommentAtTop(document, newPath, cfg);
            }
            // В любом случае продолжаем с остальными файлами
            continue;
          }

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

      // Проверяем разрешение по расширению файла
      const documentPath = document.uri.path;
      const fileExtension = path.extname(documentPath).toLowerCase();
      const fileName = path.basename(documentPath);

      // Проверяем, есть ли пользовательский шаблон для этого файла
      const hasCustomTemplate = cfg.customTemplatesByExtension.hasOwnProperty(fileName) ||
        cfg.customTemplatesByExtension.hasOwnProperty(fileExtension) ||
        // Проверяем составные расширения (например, .env.local)
        (() => {
          const parts = fileName.split('.');
          if (parts.length > 1) {
            for (let i = 1; i < parts.length; i++) {
              const compoundExt = '.' + parts.slice(i).join('.');
              if (cfg.customTemplatesByExtension.hasOwnProperty(compoundExt)) {
                return true;
              }
            }
          }
          return false;
        })();

      // Проверяем, разрешено ли расширение в allowedOnlyExtensions
      // Но если есть пользовательский шаблон, разрешаем обработку независимо от allowedOnlyExtensions
      if (cfg.allowedOnlyExtensions.length > 0 && !cfg.allowedOnlyExtensions.includes(fileExtension) && !hasCustomTemplate) {
        const language = vscode.env.language
        vscode.window.showInformationMessage(
          getMessage('extensionDisabled', language, fileExtension)
        )
        return
      }

      // Проверяем отключение по расширению файла
      // Но если есть пользовательский шаблон, разрешаем обработку независимо от disabledExtensions
      if (cfg.disabledExtensions.includes(fileExtension) && !hasCustomTemplate) {
        const language = vscode.env.language
        vscode.window.showInformationMessage(
          getMessage('extensionDisabled', language, fileExtension)
        )
        return
      }

      // Check if the file is in an ignored directory
      if (isInIgnoredDirectory(filePath, cfg.ignoredDirectories)) {
        const language = vscode.env.language;
        vscode.window.showInformationMessage(
          getMessage('directoryIgnored', language, path.dirname(filePath))
        );
        return;
      }

      // Enforce allowed-only directories for manual insertion
      if (!isInAllowedDirectory(filePath, cfg.allowedOnlyDirectories)) {
        const language = vscode.env.language;
        vscode.window.showInformationMessage(
          getMessage('directoryNotAllowed', language, path.dirname(filePath))
        );
        return;
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
