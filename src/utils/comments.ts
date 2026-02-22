// src/utils/comments.ts
import * as path from 'path';

type CommentStyle = {
	prefix: string
	suffix?: string
}

const LANGUAGE_STYLES: Record<string, CommentStyle> = {
	javascript: { prefix: '// ' },
	typescript: { prefix: '// ' },
	java: { prefix: '// ' },
	c: { prefix: '// ' },
	cpp: { prefix: '// ' },
	csharp: { prefix: '// ' },
	go: { prefix: '// ' },
	rust: { prefix: '// ' },
	swift: { prefix: '// ' },
	kotlin: { prefix: '// ' },
	php: { prefix: '<?php // ', suffix: ' ?>' },
	python: { prefix: '# ' },
	shellscript: { prefix: '# ' },
	ruby: { prefix: '# ' },
	perl: { prefix: '# ' },
	dotenv: { prefix: '# ' },
	css: { prefix: '/* ', suffix: ' */' },
	scss: { prefix: '/* ', suffix: ' */' },
	sass: { prefix: '/* ', suffix: ' */' },
	sql: { prefix: '-- ' },
	html: { prefix: '<!-- ', suffix: '-->' },
	xml: { prefix: '<!-- ', suffix: '-->' },
	dockerfile: { prefix: '# ' },
	plaintext: { prefix: '# ' },
	text: { prefix: '# ' },
}

const TEMPLATE_PLACEHOLDERS = ['{comment}', '{path}', '{prefix}', '{suffix}']

export function isCommentWithPath(line: string, filePath: string): boolean {
	const normalizedPath = filePath.replace(/\\/g, '/')
	const normalizedLine = line.replace(/\\/g, '/')
	return normalizedLine.includes(normalizedPath)
}

export function getCommentForLang(lang: string, filePath: string, template = '{comment}'): string | null {
	const style = LANGUAGE_STYLES[lang]
	// Если язык не найден, используем стиль по умолчанию для текстовых файлов
	if (!style) {
		// Используем # как универсальный символ комментария для неизвестных языков
		const defaultPrefix = '# ';
		const defaultSuffix = '';
		const defaultComment = `${defaultPrefix}${filePath}${defaultSuffix}`;
		
		let result = template;
		for (const placeholder of TEMPLATE_PLACEHOLDERS) {
			if (!result.includes(placeholder)) continue;
			switch (placeholder) {
				case '{comment}':
					result = result.split(placeholder).join(defaultComment);
					break;
				case '{path}':
					result = result.split(placeholder).join(filePath);
					break;
				case '{prefix}':
					result = result.split(placeholder).join(defaultPrefix);
					break;
				case '{suffix}':
					result = result.split(placeholder).join(defaultSuffix);
					break;
				default:
					break;
			}
		}

		// If template did not include any placeholder, fall back to default comment
		const containsPlaceholder = TEMPLATE_PLACEHOLDERS.some((ph) => template.includes(ph));
		return containsPlaceholder ? result : defaultComment;
	}

	const prefix = style.prefix;
	const suffix = style.suffix ?? '';
	const defaultComment = `${prefix}${filePath}${suffix}`;

	let result = template;
	for (const placeholder of TEMPLATE_PLACEHOLDERS) {
		if (!result.includes(placeholder)) continue;
		switch (placeholder) {
			case '{comment}':
				result = result.split(placeholder).join(defaultComment);
				break;
			case '{path}':
				result = result.split(placeholder).join(filePath);
				break;
			case '{prefix}':
				result = result.split(placeholder).join(prefix);
				break;
			case '{suffix}':
				result = result.split(placeholder).join(suffix);
				break;
			default:
				break;
		}
	}

	// If template did not include any placeholder, fall back to default comment
	const containsPlaceholder = TEMPLATE_PLACEHOLDERS.some((ph) => template.includes(ph));
	return containsPlaceholder ? result : defaultComment;
}

interface TemplateResult {
	template: string;
	isCustom: boolean;
}

export function getCommentForFileExtension(filePath: string, customTemplatesByExtension: Record<string, string>, defaultTemplate: string = '{comment}'): TemplateResult | null {
	// Extract file extension including the dot, case-insensitive
	const ext = path.extname(filePath).toLowerCase();
	const basename = path.basename(filePath); // Keep original case for template matching

	// Check for specific file names first (like "Dockerfile.dev")
	if (customTemplatesByExtension[basename]) {
		return { template: customTemplatesByExtension[basename], isCustom: true };
	}

	// Check for compound extensions (like ".env.local")
	// We need to check from longest to shortest to ensure we get the most specific match
	const parts = basename.split('.');
	if (parts.length > 1) {
		// For files that start with a dot (like .env.local), we need to make sure we check properly
		for (let i = 1; i < parts.length; i++) {
			const compoundExt = '.' + parts.slice(i).join('.').toLowerCase();
			if (customTemplatesByExtension[compoundExt]) {
				return { template: customTemplatesByExtension[compoundExt], isCustom: true };
			}
		}
	}

	// Check for regular extensions
	if (customTemplatesByExtension[ext]) {
		return { template: customTemplatesByExtension[ext], isCustom: true };
	}

	// Check for a default/wildcard template for any extension (using '*' as key)
	if (customTemplatesByExtension['*']) {
		return { template: customTemplatesByExtension['*'], isCustom: true };
	}

	// If no custom template found, return default template
	return { template: defaultTemplate, isCustom: false };
}

export function getCommentForCustomTemplate(lang: string, filePath: string, template: string): string | null {
	// Check if the template contains standard placeholders that require language-specific formatting
	const hasStandardPlaceholder = /{comment}|{prefix}|{suffix}/.test(template);

	if (hasStandardPlaceholder) {
		// If the template contains standard placeholders, apply language-specific formatting
		return getCommentForLang(lang, filePath, template);
	} else {
		// If the template doesn't contain standard placeholders, we need to decide whether to apply language-specific formatting
		// If the template already starts with a known comment character, we'll treat it as fully customized
		const normalizedTemplate = template.trim();
		const startsWithComment = ['#', '//', '/*', '--', '<!--'].some(commentChar =>
			normalizedTemplate.startsWith(commentChar)
		);

		if (startsWithComment) {
			// If template already starts with a comment character, process it as-is
			let processedTemplate = template;
			processedTemplate = processedTemplate.split('{path}').join(filePath);
			processedTemplate = processedTemplate.split('{filename}').join(path.basename(filePath));
			processedTemplate = processedTemplate.split('{dirname}').join(path.dirname(filePath));
			return processedTemplate;
		} else {
			// Check if the template contains {path} placeholder - if so, treat it as a fully custom template
			if (template.includes('{path}')) {
				// Process the {path}, {filename}, and {dirname} placeholders in the custom template
				let processedTemplate = template;
				processedTemplate = processedTemplate.split('{path}').join(filePath);
				processedTemplate = processedTemplate.split('{filename}').join(path.basename(filePath));
				processedTemplate = processedTemplate.split('{dirname}').join(path.dirname(filePath));
				return processedTemplate;
			} else {
				// If template doesn't start with a comment character and doesn't contain {path}, apply language-specific formatting
				// First, process the {path}, {filename}, and {dirname} placeholders
				let processedTemplate = template;
				processedTemplate = processedTemplate.split('{path}').join(filePath);
				processedTemplate = processedTemplate.split('{filename}').join(path.basename(filePath));
				processedTemplate = processedTemplate.split('{dirname}').join(path.dirname(filePath));
				
				// Then wrap it with the appropriate comment style for the language
				const langSpecificComment = getCommentForLang(lang, processedTemplate, '{comment}');
				// If the language is not supported, use a default comment style (#) for the processed template
				if (!langSpecificComment) {
					return `# ${processedTemplate}`;
				}
				return langSpecificComment;
			}
		}
	}
}
