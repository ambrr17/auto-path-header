/**
 * Auto Path Header Extension
 * Автор: Niklis
 * Автоматически вставляет относительный путь файла в виде комментария на первой строке
 */

import * as vscode from 'vscode'
import { getMessage } from './localization'

export function activate(context: vscode.ExtensionContext) {
  // Автоматическая вставка при открытии файла
  const disposable = vscode.workspace.onDidOpenTextDocument(async (document) => {
    try {
      const filePath = vscode.workspace.asRelativePath(document.uri)

      if (document.lineCount > 1 || document.languageId === 'Log') return
      if (document.isUntitled || document.uri.scheme !== 'file') return

      // Проверяем, не вставлен ли уже комментарий
      const firstLine = document.lineAt(0).text.trim()
      if (isCommentWithPath(firstLine, filePath)) return

      const editor = await vscode.window.showTextDocument(document)
      const comment = getCommentForLang(document.languageId, filePath)
      if (!comment) {
        const language = vscode.env.language
        vscode.window.showWarningMessage(
          getMessage('unsupportedLanguage', language, document.languageId)
        )
        return
      }

      await editor.edit(editBuilder => {
        editBuilder.insert(new vscode.Position(0, 0), comment + '\n\n')
      })
    } catch (error) {
      const language = vscode.env.language
      vscode.window.showErrorMessage(
        getMessage('errorInsertingComment', language, error instanceof Error ? error.message : String(error))
      )
    }
  })

  // Слушатель переименования файлов
  const renameDisposable = vscode.workspace.onDidRenameFiles(async (event) => {
    const config = vscode.workspace.getConfiguration('autoPathHeader')
    const updateOnRename = config.get<boolean>('updateOnRename', true)
    
    if (!updateOnRename) return

    for (const fileRename of event.files) {
      try {
        const oldPath = vscode.workspace.asRelativePath(fileRename.oldUri)
        const newPath = vscode.workspace.asRelativePath(fileRename.newUri)
        
        // Открываем новый файл для обновления комментария
        const document = await vscode.workspace.openTextDocument(fileRename.newUri)
        const editor = await vscode.window.showTextDocument(document)
        
        // Проверяем, есть ли комментарий с путём в первой строке
        const firstLine = document.lineAt(0).text.trim()
        if (!isCommentWithPath(firstLine, oldPath)) continue

        // Проверяем, нужно ли спрашивать разрешение
        const askBeforeUpdate = config.get<boolean>('askBeforeUpdate', false)
        if (askBeforeUpdate) {
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

        // Обновляем комментарий с новым путём
        const newComment = getCommentForLang(document.languageId, newPath)
        if (!newComment) continue

        // Заменяем старый комментарий новым
        const oldComment = getCommentForLang(document.languageId, oldPath)
        if (oldComment) {
          const oldCommentRange = new vscode.Range(0, 0, 0, oldComment.length)
          await editor.edit(editBuilder => {
            editBuilder.replace(oldCommentRange, newComment)
          })
          
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
      const comment = getCommentForLang(document.languageId, filePath)
      if (!comment) {
        const language = vscode.env.language
        vscode.window.showWarningMessage(
          getMessage('unsupportedLanguage', language, document.languageId)
        )
        return
      }

      // Проверяем, не вставлен ли уже комментарий
      const firstLine = document.lineAt(0).text.trim()
      if (isCommentWithPath(firstLine, filePath)) {
        vscode.window.showInformationMessage('Comment already exists in file')
        return
      }

      await editor.edit(editBuilder => {
        editBuilder.insert(new vscode.Position(0, 0), comment + '\n\n')
      })
    } catch (error) {
      const language = vscode.env.language
      vscode.window.showErrorMessage(
        getMessage('errorInsertingComment', language, error instanceof Error ? error.message : String(error))
      )
    }
  })

  context.subscriptions.push(disposable, renameDisposable, insertCommentCommand)
}

function isCommentWithPath(line: string, filePath: string): boolean {
  const normalizedPath = filePath.replace(/\\/g, '/')
  return line.includes(normalizedPath) && (
    line.startsWith('//') || 
    line.startsWith('#') || 
    line.startsWith('/*') || 
    line.startsWith('--') || 
    line.startsWith('<!--')
  )
}

function getCommentForLang(lang: string, filePath: string): string | null {
  const line = ` ${filePath}`
  switch (lang) {
    case 'javascript':
    case 'typescript':
    case 'java':
    case 'c':
    case 'cpp':
    case 'csharp':
    case 'go':
    case 'rust':
    case 'swift':
    case 'kotlin':
    case 'php':
      return '//' + line
    case 'python':
    case 'shellscript':
    case 'ruby':
    case 'perl':
    case 'dotenv':
      return '#' + line
    case 'css':
    case 'scss':
    case 'sass':
      return `/*${line} */`
    case 'sql':
      return '--' + line
    case 'html':
    case 'xml':
      return `<!--${line}-->`
    default:
      return null
  }
}

export function deactivate() {}
