/**
 * Comment inserter service
 * Вставляет или заменяет комментарий первой строки, не переключая фокус редактора
 */
import * as vscode from 'vscode'
import { getCommentForLang, isCommentWithPath } from '../utils/comments'

/**
 * Insert a path comment at the top of a document if not already present.
 * Returns true if an edit was applied.
 */
export async function ensureCommentAtTop(document: vscode.TextDocument, relativePath: string): Promise<boolean> {
	const langId = document.languageId
	const comment = getCommentForLang(langId, relativePath)
	if (!comment) return false

	const firstLineText = document.lineAt(0).text.trim()
	if (isCommentWithPath(firstLineText, relativePath)) return false

	const edit = new vscode.WorkspaceEdit()
	edit.insert(document.uri, new vscode.Position(0, 0), comment + '\n\n')
	return vscode.workspace.applyEdit(edit)
}

/**
 * Replace the existing path comment at the top of a document with a new one.
 * Returns true if an edit was applied.
 */
export async function replaceTopComment(
	document: vscode.TextDocument,
	oldRelativePath: string,
	newRelativePath: string
): Promise<boolean> {
	const oldComment = getCommentForLang(document.languageId, oldRelativePath)
	const newComment = getCommentForLang(document.languageId, newRelativePath)
	if (!oldComment || !newComment) return false

	const firstLine = document.lineAt(0)
	if (!firstLine.text.startsWith(oldComment)) return false

	const range = new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, oldComment.length))
	const edit = new vscode.WorkspaceEdit()
	edit.replace(document.uri, range, newComment)
	return vscode.workspace.applyEdit(edit)
}
