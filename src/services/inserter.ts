/**
 * Comment inserter service
 * Вставляет или заменяет комментарий первой строки, не переключая фокус редактора
 */
import * as vscode from 'vscode'
import { getCommentForLang, isCommentWithPath } from '../utils/comments'
import { AutoPathHeaderConfig } from './config'

/**
 * Insert a path comment at the top of a document if not already present.
 * Returns true if an edit was applied.
 */
export async function ensureCommentAtTop(
	document: vscode.TextDocument,
	relativePath: string,
	config: Pick<AutoPathHeaderConfig, 'formatTemplate'>
): Promise<boolean> {
	const langId = document.languageId
	const comment = getCommentForLang(langId, relativePath, config.formatTemplate)
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
	newRelativePath: string,
	config: Pick<AutoPathHeaderConfig, 'formatTemplate'>
): Promise<boolean> {
	const newComment = getCommentForLang(document.languageId, newRelativePath, config.formatTemplate)
	if (!newComment) return false

	const firstLine = document.lineAt(0)
	const firstLineText = firstLine.text.trim()
	if (!isCommentWithPath(firstLineText, oldRelativePath)) return false

	const edit = new vscode.WorkspaceEdit()
	edit.replace(document.uri, firstLine.range, newComment)
	return vscode.workspace.applyEdit(edit)
}
