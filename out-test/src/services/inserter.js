"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureCommentAtTop = ensureCommentAtTop;
exports.replaceTopComment = replaceTopComment;
// src/services/inserter.ts
/**
 * Comment inserter service
 * Вставляет или заменяет комментарий первой строки, не переключая фокус редактора
 */
const vscode = __importStar(require("vscode"));
const comments_1 = require("../utils/comments");
/**
 * Insert a path comment at the top of a document if not already present.
 * Returns true if an edit was applied.
 */
async function ensureCommentAtTop(document, relativePath, config) {
    // Use the custom template by extension if available, otherwise use formatTemplate
    const templateResult = (0, comments_1.getCommentForFileExtension)(relativePath, config.customTemplatesByExtension, config.formatTemplate);
    if (!templateResult)
        return false;
    let comment = null;
    if (templateResult.isCustom) {
        // If we have a custom template, we need to process it with the special placeholders
        // Use the document's file extension to determine language-specific formatting if needed
        const langId = document.languageId; // Fallback to languageId if needed by custom template
        comment = (0, comments_1.getCommentForCustomTemplate)(langId, relativePath, templateResult.template);
    }
    else {
        // Use the new extension-based comment function instead of languageId-based one
        comment = (0, comments_1.getCommentByFileExtension)(relativePath, templateResult.template);
    }
    if (!comment)
        return false;
    const firstLineText = document.lineAt(0).text.trim();
    // Check if there's already a comment with the path
    if ((0, comments_1.isCommentWithPath)(firstLineText, relativePath)) {
        // If the existing comment matches the expected template, no need to update
        if (firstLineText === comment.trim()) {
            return false;
        }
        else {
            // If there's a comment with the path but different format, replace it
            const edit = new vscode.WorkspaceEdit();
            edit.replace(document.uri, document.lineAt(0).range, comment);
            return vscode.workspace.applyEdit(edit);
        }
    }
    const edit = new vscode.WorkspaceEdit();
    edit.insert(document.uri, new vscode.Position(0, 0), comment + '\n\n');
    return vscode.workspace.applyEdit(edit);
}
/**
 * Replace the existing path comment at the top of a document with a new one.
 * Returns true if an edit was applied.
 */
async function replaceTopComment(document, oldRelativePath, newRelativePath, config) {
    // Use the custom template by extension if available, otherwise use formatTemplate
    const templateResult = (0, comments_1.getCommentForFileExtension)(newRelativePath, config.customTemplatesByExtension, config.formatTemplate);
    if (!templateResult)
        return false;
    let newComment = null;
    if (templateResult.isCustom) {
        // If we have a custom template, we need to process it with the special placeholders
        // Use the document's file extension to determine language-specific formatting if needed
        const langId = document.languageId; // Fallback to languageId if needed by custom template
        newComment = (0, comments_1.getCommentForCustomTemplate)(langId, newRelativePath, templateResult.template);
    }
    else {
        // Use the new extension-based comment function instead of languageId-based one
        newComment = (0, comments_1.getCommentByFileExtension)(newRelativePath, templateResult.template);
    }
    if (!newComment)
        return false;
    const firstLine = document.lineAt(0);
    const firstLineText = firstLine.text.trim();
    if (!(0, comments_1.isCommentWithPath)(firstLineText, oldRelativePath))
        return false;
    const edit = new vscode.WorkspaceEdit();
    edit.replace(document.uri, firstLine.range, newComment);
    return vscode.workspace.applyEdit(edit);
}
//# sourceMappingURL=inserter.js.map