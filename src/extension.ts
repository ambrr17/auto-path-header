/**
 * Auto Path Header Extension
 * Автор: Niklis
 * Автоматически вставляет относительный путь файла в виде комментария на первой строке
 */

import * as vscode from 'vscode'
import { getMessage } from './localization'
import { isCommentWithPath } from './utils/comments'
import { readConfig } from './services/config'
import { ensureCommentAtTop, replaceTopComment } from './services/inserter'

export function activate(context: vscode.ExtensionContext) {
  // Автоматическая вставка при открытии файла
  const disposable = vscode.workspace.onDidOpenTextDocument(async (document) => {
    try {
      const cfg = readConfig(document.uri)
      if (!cfg.enabled) return
      if (cfg.disabledLanguages.includes(document.languageId)) return

      const filePath = vscode.workspace.asRelativePath(document.uri)

      if (document.lineCount > 1 || document.languageId === 'Log') return
      if (document.isUntitled || document.uri.scheme !== 'file') return

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
  const renameDisposable = vscode.workspace.onDidRenameFiles(async (event) => {
    for (const fileRename of event.files) {
      try {
        const cfg = readConfig(fileRename.newUri)
        if (!cfg.enabled || !cfg.updateOnRename) continue

        const oldPath = vscode.workspace.asRelativePath(fileRename.oldUri)
        const newPath = vscode.workspace.asRelativePath(fileRename.newUri)

        const document = await vscode.workspace.openTextDocument(fileRename.newUri)
        if (cfg.disabledLanguages.includes(document.languageId)) continue

        // Проверка наличия старого комментария
        const firstLine = document.lineAt(0).text.trim()
        if (!isCommentWithPath(firstLine, oldPath)) continue

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
      const cfg = readConfig(document.uri)
      if (cfg.disabledLanguages.includes(document.languageId)) {
        const language = vscode.env.language
        vscode.window.showInformationMessage(
          getMessage('languageDisabled', language, document.languageId)
        )
        return
      }

      // Проверяем, не вставлен ли уже комментарий
      const firstLine = document.lineAt(0).text.trim()
      if (isCommentWithPath(firstLine, filePath)) {
        vscode.window.showInformationMessage('Comment already exists in file')
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

  context.subscriptions.push(disposable, renameDisposable, insertCommentCommand)
}

export function deactivate() {}
