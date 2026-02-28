/**
 * Configuration service for Auto Path Header extension
 * Предоставляет типобезопасный доступ к настройкам расширения
 */
import * as vscode from 'vscode'

export type SupportedUiLanguage = 'auto' | 'en' | 'ru'

export interface AutoPathHeaderConfig {
	/** Enable or disable automatic comment insertion */
	enabled: boolean
	/** Language for extension messages */
	language: SupportedUiLanguage
	/** Update path comment on file rename/move */
	updateOnRename: boolean
	/** Ask confirmation before updating path comment */
	askBeforeUpdate: boolean
	/** Template for generated comment */
	formatTemplate: string
	/** File extensions where functionality is disabled */
	disabledExtensions: string[]
	/** File extensions that are allowed for automatic insertion. Extensions not in this list will be ignored. */
	allowedOnlyExtensions: string[]
	/** Directories to ignore (relative paths from workspace root) */
	ignoredDirectories: string[]
	/** Allowed only directories (relative paths from workspace root) */
	allowedOnlyDirectories: string[]
	/** Custom templates by file extension */
	customTemplatesByExtension: Record<string, string>
}

/**
 * Read current configuration for this extension.
 */
export function readConfig(scope?: vscode.ConfigurationScope): AutoPathHeaderConfig {
	const cfg = vscode.workspace.getConfiguration('autoPathHeader', scope)
	const formatTemplate = cfg.get<string>('formatTemplate', '{comment}')?.trim() || '{comment}'
	return {
	    enabled: cfg.get<boolean>('enabled', true),
	    language: cfg.get<SupportedUiLanguage>('language', 'auto'),
	    updateOnRename: cfg.get<boolean>('updateOnRename', true),
	    askBeforeUpdate: cfg.get<boolean>('askBeforeUpdate', false),
	    formatTemplate,
	    disabledExtensions: cfg.get<string[]>('disabledExtensions', []),
	    allowedOnlyExtensions: cfg.get<string[]>('allowedOnlyExtensions', [
            ".js", ".ts", ".jsx", ".tsx", ".java", ".c", ".cpp", ".h", ".hpp", ".cs",
            ".go", ".rs", ".swift", ".kt", ".kts", ".php", ".py", ".sh", ".bash",
            ".zsh", ".rb", ".pl", ".pm", ".env", ".txt", ".md", ".markdown", ".css",
            ".scss", ".sass", ".less", ".sql", ".lua", ".hs", ".html", ".htm",
            ".xml", ".svg", ".dockerfile", ".Dockerfile", ".gitignore", ".npmrc",
            ".yml", ".yaml", ".json", ".jsonc", ".toml", ".ini", ".bat", ".cmd"
        ]),
		allowedOnlyDirectories: cfg.get<string[]>('allowedOnlyDirectories', ['.']),
		ignoredDirectories: cfg.get<string[]>('ignoredDirectories', ['node_modules', 'vendor', 'vendors', 'dist', 'build', '.git', '.svn', '.hg', 'target', 'out', 'bin']),
	    customTemplatesByExtension: cfg.get<Record<string, string>>('customTemplatesByExtension', {}),
	}
}
