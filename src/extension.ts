/**
 * Auto Path Header Extension
 * Автор: Niklis
 * Автоматически вставляет относительный путь файла в виде комментария на первой строке
 */

import * as vscode from 'vscode'
import { getMessage } from './localization'
import { getCommentForLang, isCommentWithPath } from './utils/comments'
import { readConfig } from './services/config'
import { ensureCommentAtTop, replaceTopComment } from './services/inserter'

export function activate(context: vscode.ExtensionContext) {
  // Автоматическая вставка при открытии файла
  const disposable = vscode.workspace.onDidOpenTextDocument(async (document) => {
    try {
      const filePath = vscode.workspace.asRelativePath(document.uri)

      if (document.lineCount > 1 || document.languageId === 'Log') return
      if (document.isUntitled || document.uri.scheme !== 'file') return

      const ok = await ensureCommentAtTop(document, filePath)
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
    const cfg = readConfig()
    if (!cfg.updateOnRename) return

    for (const fileRename of event.files) {
      try {
        const oldPath = vscode.workspace.asRelativePath(fileRename.oldUri)
        const newPath = vscode.workspace.asRelativePath(fileRename.newUri)

        const document = await vscode.workspace.openTextDocument(fileRename.newUri)

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

        const ok = await replaceTopComment(document, oldPath, newPath)
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
      // Проверяем, не вставлен ли уже комментарий
      const firstLine = document.lineAt(0).text.trim()
      if (isCommentWithPath(firstLine, filePath)) {
        vscode.window.showInformationMessage('Comment already exists in file')
        return
      }

      await ensureCommentAtTop(document, filePath)
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
