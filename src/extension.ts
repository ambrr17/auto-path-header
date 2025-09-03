/**
 * Auto Path Header Extension
 * Автор: Niklis
 * Автоматически вставляет относительный путь файла в виде комментария на первой строке
 */

import * as vscode from 'vscode'
import * as path from 'path'
import { getMessage } from './localization'

export function activate(context: vscode.ExtensionContext) {
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

  context.subscriptions.push(disposable)
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
