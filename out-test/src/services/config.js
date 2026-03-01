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
exports.readConfig = readConfig;
/**
 * Configuration service for Auto Path Header extension
 * Предоставляет типобезопасный доступ к настройкам расширения
 */
const vscode = __importStar(require("vscode"));
/**
 * Read current configuration for this extension.
 */
function readConfig(scope) {
    const cfg = vscode.workspace.getConfiguration('autoPathHeader', scope);
    const formatTemplate = cfg.get('formatTemplate', '{comment}')?.trim() || '{comment}';
    return {
        enabled: cfg.get('enabled', true),
        language: cfg.get('language', 'auto'),
        updateOnRename: cfg.get('updateOnRename', true),
        askBeforeUpdate: cfg.get('askBeforeUpdate', false),
        formatTemplate,
        disabledExtensions: cfg.get('disabledExtensions', []),
        allowedOnlyExtensions: cfg.get('allowedOnlyExtensions', [
            ".js", ".ts", ".jsx", ".tsx", ".java", ".c", ".cpp", ".h", ".hpp", ".cs",
            ".go", ".rs", ".swift", ".kt", ".kts", ".php", ".py", ".sh", ".bash",
            ".zsh", ".rb", ".pl", ".pm", ".env", ".txt", ".md", ".markdown", ".css",
            ".scss", ".sass", ".less", ".sql", ".lua", ".hs", ".html", ".htm",
            ".xml", ".svg", ".dockerfile", ".Dockerfile", ".gitignore", ".npmrc",
            ".yml", ".yaml", ".json", ".jsonc", ".toml", ".ini", ".bat", ".cmd"
        ]),
        allowedOnlyDirectories: cfg.get('allowedOnlyDirectories', ['.']),
        ignoredDirectories: cfg.get('ignoredDirectories', ['node_modules', 'vendor', 'vendors', 'dist', 'build', '.git', '.svn', '.hg', 'target', 'out', 'bin']),
        updateOnRenameFolder: cfg.get('updateOnRenameFolder', true),
        updateOnRenameRecursive: cfg.get('updateOnRenameRecursive', false),
        customTemplatesByExtension: cfg.get('customTemplatesByExtension', {}),
    };
}
//# sourceMappingURL=config.js.map