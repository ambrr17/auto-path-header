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
}

/**
 * Read current configuration for this extension.
 */
export function readConfig(scope?: vscode.ConfigurationScope): AutoPathHeaderConfig {
	const cfg = vscode.workspace.getConfiguration('autoPathHeader', scope)
	return {
		enabled: cfg.get<boolean>('enabled', true),
		language: cfg.get<SupportedUiLanguage>('language', 'auto'),
		updateOnRename: cfg.get<boolean>('updateOnRename', true),
		askBeforeUpdate: cfg.get<boolean>('askBeforeUpdate', false),
	}
}
