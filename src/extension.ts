import * as vscode from 'vscode'
import * as path from 'path'

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.workspace.onDidOpenTextDocument(async (document) => {
    const filePath = vscode.workspace.asRelativePath(document.uri)

    if (document.lineCount > 1 || document.languageId === 'Log') return
    if (document.isUntitled || document.uri.scheme !== 'file') return

    const editor = await vscode.window.showTextDocument(document)
    const comment = getCommentForLang(document.languageId, filePath)
    if (!comment) return

    await editor.edit(editBuilder => {
      editBuilder.insert(new vscode.Position(0, 0), comment + '\n\n')
    })
  })

  context.subscriptions.push(disposable)
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
