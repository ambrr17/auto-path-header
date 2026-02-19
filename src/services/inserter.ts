// src/services/inserter.ts
/**
 * Comment inserter service
 * Вставляет или заменяет комментарий первой строки, не переключая фокус редактора
 */
import * as vscode from 'vscode'
import * as path from 'path';
import { getCommentForLang, isCommentWithPath, getCommentForFileExtension, getCommentForCustomTemplate } from '../utils/comments'
import { AutoPathHeaderConfig } from './config'

/**
 * Insert a path comment at the top of a document if not already present.
 * Returns true if an edit was applied.
 */
export async function ensureCommentAtTop(
	document: vscode.TextDocument,
	relativePath: string,
	config: Pick<AutoPathHeaderConfig, 'formatTemplate' | 'customTemplatesByExtension'>
): Promise<boolean> {
	const langId = document.languageId

	// Use the custom template by extension if available, otherwise use formatTemplate
	const templateResult = getCommentForFileExtension(relativePath, config.customTemplatesByExtension, config.formatTemplate);

	if (!templateResult) return false;

	let comment: string | null = null;

	if (templateResult.isCustom) {
		// If we have a custom template, we need to process it with the special placeholders
		comment = getCommentForCustomTemplate(langId, relativePath, templateResult.template);
	} else {
		// Otherwise, use the standard template processing
		comment = getCommentForLang(langId, relativePath, templateResult.template);
	}

	if (!comment) return false

	const firstLineText = document.lineAt(0).text.trim()

	// Check if there's already a comment with the path
	if (isCommentWithPath(firstLineText, relativePath)) {
		// If the existing comment matches the expected template, no need to update
		if (firstLineText === comment.trim()) {
			return false;
		} else {
			// If there's a comment with the path but different format, replace it
			const edit = new vscode.WorkspaceEdit()
			edit.replace(document.uri, document.lineAt(0).range, comment)
			return vscode.workspace.applyEdit(edit)
		}
	}

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
	config: Pick<AutoPathHeaderConfig, 'formatTemplate' | 'customTemplatesByExtension'>
): Promise<boolean> {
	const langId = document.languageId

	// Use the custom template by extension if available, otherwise use formatTemplate
	const templateResult = getCommentForFileExtension(newRelativePath, config.customTemplatesByExtension, config.formatTemplate);

	if (!templateResult) return false;

	let newComment: string | null = null;

	if (templateResult.isCustom) {
		// If we have a custom template, we need to process it with the special placeholders
		newComment = getCommentForCustomTemplate(langId, newRelativePath, templateResult.template);
	} else {
		// Otherwise, use the standard template processing
		newComment = getCommentForLang(langId, newRelativePath, templateResult.template);
	}

	if (!newComment) return false

	const firstLine = document.lineAt(0)
	const firstLineText = firstLine.text.trim()
	if (!isCommentWithPath(firstLineText, oldRelativePath)) return false

	const edit = new vscode.WorkspaceEdit()
	edit.replace(document.uri, firstLine.range, newComment)
	return vscode.workspace.applyEdit(edit)
}
