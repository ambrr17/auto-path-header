"use strict";
/**
 * Auto Path Header Extension
 * Автор: Niklis
 * Автоматически вставляет относительный путь файла в виде комментария на первой строке
 */
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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const localization_1 = require("./localization");
const comments_1 = require("./utils/comments");
const config_1 = require("./services/config");
const inserter_1 = require("./services/inserter");
const directoryUtils_1 = require("./utils/directoryUtils");
function activate(context) {
    // Подписка на изменения конфигурации для обновления кэша
    const configChangeDisposable = vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('autoPathHeader')) {
            // Конфигурация будет перечитана при следующем использовании
        }
    });
    // Автоматическая вставка при открытии файла
    const disposable = vscode.workspace.onDidOpenTextDocument(async (document) => {
        try {
            if (document.lineCount > 1)
                return;
            if (document.isUntitled || document.uri.scheme !== 'file')
                return;
            const filePath = vscode.workspace.asRelativePath(document.uri);
            const cfg = (0, config_1.readConfig)(document.uri);
            if (!cfg.enabled)
                return;
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
            if (cfg.allowedOnlyExtensions.length > 0 && !cfg.allowedOnlyExtensions.includes(fileExtension) && !hasCustomTemplate)
                return;
            // Проверяем, не отключено ли расширение в disabledExtensions
            // Но если есть пользовательский шаблон, разрешаем обработку независимо от disabledExtensions
            if (cfg.disabledExtensions.includes(fileExtension) && !hasCustomTemplate)
                return;
            // Check if the file is in an ignored directory
            if ((0, directoryUtils_1.isInIgnoredDirectory)(filePath, cfg.ignoredDirectories))
                return;
            const ok = await (0, inserter_1.ensureCommentAtTop)(document, filePath, cfg);
            if (!ok)
                return;
        }
        catch (error) {
            const language = vscode.env.language;
            vscode.window.showErrorMessage((0, localization_1.getMessage)('errorInsertingComment', language, error instanceof Error ? error.message : String(error)));
        }
    });
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
                    const oldPath = vscode.workspace.asRelativePath(fileRename.oldUri);
                    const newPath = vscode.workspace.asRelativePath(fileRename.newUri);
                    // Проверяем существование файла перед открытием
                    let stat;
                    try {
                        stat = await vscode.workspace.fs.stat(fileRename.newUri);
                    }
                    catch (error) {
                        // Файл не существует, пропускаем обработку
                        continue;
                    }
                    // #######
                    if (stat.type !== vscode.FileType.File) {
                        vscode.window.showInformationMessage(`это папка — пропускаем event.files.length: ${event.files.length}`);
                        continue; // это папка — пропускаем
                    }
                    // #######
                    const document = await vscode.workspace.openTextDocument(fileRename.newUri);
                    // Читаем конфигурацию после открытия документа, чтобы получить актуальные настройки
                    const cfg = (0, config_1.readConfig)(fileRename.newUri);
                    if (!cfg.enabled || !cfg.updateOnRename)
                        continue;
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
                    if (cfg.allowedOnlyExtensions.length > 0 && !cfg.allowedOnlyExtensions.includes(fileExtension) && !hasCustomTemplate)
                        continue;
                    // Проверяем, является ли расширение отключенным - если да, то игнорируем файл полностью
                    // Но если есть пользовательский шаблон, разрешаем обработку независимо от disabledExtensions
                    const isExtensionDisabled = cfg.disabledExtensions.includes(fileExtension) && !hasCustomTemplate;
                    if (isExtensionDisabled)
                        continue;
                    // Check if the new file path is in an ignored directory
                    const isNewPathInIgnoredDir = (0, directoryUtils_1.isInIgnoredDirectory)(newPath, cfg.ignoredDirectories);
                    if (isNewPathInIgnoredDir)
                        continue;
                    // Проверка наличия старого комментария
                    const firstLine = document.lineAt(0).text.trim();
                    if (!(0, comments_1.isCommentWithPath)(firstLine, oldPath)) {
                        // Если в файле не найден комментарий с предыдущим путем, уведомляем пользователя
                        const language = vscode.env.language;
                        const fileName = path.basename(newPath);
                        const result = await vscode.window.showInformationMessage((0, localization_1.getMessage)('insertNewComment', language, fileName), 'Yes', 'No');
                        if (result === 'Yes') {
                            // Вставляем новый комментарий как при создании нового файла
                            await (0, inserter_1.ensureCommentAtTop)(document, newPath, cfg);
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
                        const language = vscode.env.language;
                        const message = (0, localization_1.getMessage)('updatePathComment', language);
                        const oldName = oldPath.split('/').pop() || oldPath;
                        const newName = newPath.split('/').pop() || newPath;
                        const renameInfo = (0, localization_1.getMessage)('fileRenamed', language, oldName, newName);
                        const result = await vscode.window.showInformationMessage(`${renameInfo}\n${message}`, 'Yes', 'No');
                        if (result !== 'Yes')
                            continue;
                    }
                    const ok = await (0, inserter_1.replaceTopComment)(document, oldPath, newPath, cfg);
                    if (ok) {
                        const language = vscode.env.language;
                        vscode.window.showInformationMessage((0, localization_1.getMessage)('pathCommentUpdated', language));
                    }
                }
                catch (error) {
                    const language = vscode.env.language;
                    vscode.window.showErrorMessage((0, localization_1.getMessage)('errorUpdatingComment', language, error instanceof Error ? error.message : String(error)));
                }
            }
        }
        finally {
            renameOperationInProgress = false;
        }
    });
    // Команда для ручной вставки комментария
    const insertCommentCommand = vscode.commands.registerCommand('autoPathHeader.insertComment', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No active editor');
            return;
        }
        const document = editor.document;
        const filePath = vscode.workspace.asRelativePath(document.uri);
        if (document.isUntitled || document.uri.scheme !== 'file') {
            vscode.window.showWarningMessage('Cannot insert comment in untitled or non-file documents');
            return;
        }
        try {
            // Проверяем, не вставлен ли уже комментарий
            const firstLine = document.lineAt(0).text.trim();
            if ((0, comments_1.isCommentWithPath)(firstLine, filePath)) {
                vscode.window.showInformationMessage('Comment already exists in file');
                return;
            }
            const cfg = (0, config_1.readConfig)(document.uri);
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
                const language = vscode.env.language;
                vscode.window.showInformationMessage((0, localization_1.getMessage)('extensionDisabled', language, fileExtension));
                return;
            }
            // Проверяем отключение по расширению файла
            // Но если есть пользовательский шаблон, разрешаем обработку независимо от disabledExtensions
            if (cfg.disabledExtensions.includes(fileExtension) && !hasCustomTemplate) {
                const language = vscode.env.language;
                vscode.window.showInformationMessage((0, localization_1.getMessage)('extensionDisabled', language, fileExtension));
                return;
            }
            // Check if the file is in an ignored directory
            if ((0, directoryUtils_1.isInIgnoredDirectory)(filePath, cfg.ignoredDirectories)) {
                const language = vscode.env.language;
                vscode.window.showInformationMessage((0, localization_1.getMessage)('directoryIgnored', language, path.dirname(filePath)));
                return;
            }
            await (0, inserter_1.ensureCommentAtTop)(document, filePath, cfg);
        }
        catch (error) {
            const language = vscode.env.language;
            vscode.window.showErrorMessage((0, localization_1.getMessage)('errorInsertingComment', language, error instanceof Error ? error.message : String(error)));
        }
    });
    context.subscriptions.push(disposable, renameDisposable, insertCommentCommand, configChangeDisposable);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map