// src/utils/comments.ts
import * as path from 'path';

type CommentStyle = {
	prefix: string
	suffix?: string
}


// Mapping from file extensions to comment styles
const EXTENSION_STYLES: Record<string, CommentStyle> = {
	'.js': { prefix: '// ' },
	'.ts': { prefix: '// ' },
	'.jsx': { prefix: '// ' },
	'.tsx': { prefix: '// ' },
	'.java': { prefix: '// ' },
	'.c': { prefix: '// ' },
	'.cpp': { prefix: '// ' },
	'.h': { prefix: '// ' },
	'.hpp': { prefix: '// ' },
	'.cs': { prefix: '// ' },
	'.go': { prefix: '// ' },
	'.rs': { prefix: '// ' },
	'.swift': { prefix: '// ' },
	'.kt': { prefix: '// ' },
	'.kts': { prefix: '// ' },
	'.php': { prefix: '<?php // ', suffix: ' ?>' },
	'.py': { prefix: '# ' },
	'.sh': { prefix: '# ' },
	'.bash': { prefix: '# ' },
	'.zsh': { prefix: '# ' },
	'.rb': { prefix: '# ' },
	'.pl': { prefix: '# ' },
	'.pm': { prefix: '# ' },
	'.env': { prefix: '# ' },
	'.txt': { prefix: '# ' },
	'.md': { prefix: '<!-- ', suffix: ' -->' },
	'.markdown': { prefix: '<!-- ', suffix: ' -->' },
	'.css': { prefix: '/* ', suffix: ' */' },
	'.scss': { prefix: '/* ', suffix: ' */' },
	'.sass': { prefix: '/* ', suffix: ' */' },
	'.less': { prefix: '/* ', suffix: ' */' },
	'.sql': { prefix: '-- ' },
	'.lua': { prefix: '-- ' },
	'.hs': { prefix: '-- ' },
	'.html': { prefix: '<!-- ', suffix: ' -->' },
	'.htm': { prefix: '<!-- ', suffix: ' -->' },
	'.xml': { prefix: '<!-- ', suffix: ' -->' },
	'.svg': { prefix: '<!-- ', suffix: ' -->' },
	'.dockerfile': { prefix: '# ' },
	'.Dockerfile': { prefix: '# ' },
	'.gitignore': { prefix: '# ' },
	'.npmrc': { prefix: '# ' },
	'.yml': { prefix: '# ' },
	'.yaml': { prefix: '# ' },
	'.json': { prefix: '/* ', suffix: ' */' }, // JSON doesn't officially support comments, but some implementations do
	'.jsonc': { prefix: '// ' }, // JSON with comments
	'.toml': { prefix: '# ' },
	'.ini': { prefix: '; ' },
	'.bat': { prefix: '@REM ' },
	'.cmd': { prefix: '@REM ' },
};

const TEMPLATE_PLACEHOLDERS = ['{comment}', '{path}', '{prefix}', '{suffix}']

export function isCommentWithPath(line: string, filePath: string): boolean {
	const normalizedPath = filePath.replace(/\\/g, '/')
	const normalizedLine = line.replace(/\\/g, '/')
	return normalizedLine.includes(normalizedPath)
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
	// Check if the template contains standard placeholders that require extension-specific formatting
	const hasStandardPlaceholder = /{comment}|{prefix}|{suffix}/.test(template);

	if (hasStandardPlaceholder) {
		// If the template contains standard placeholders, apply extension-specific formatting
		return getCommentByFileExtension(filePath, template);
	} else {
		// If the template doesn't contain standard placeholders, we need to decide whether to apply extension-specific formatting
		// If the template already starts with a known comment character, we'll treat it as fully customized
		const normalizedTemplate = template.trim();
		const startsWithComment = ['#', '//', '/*', '--', '<!--', '<?php'].some(commentChar =>
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
				// If template doesn't start with a comment character and doesn't contain {path}, apply extension-specific formatting
				// First, process the {path}, {filename}, and {dirname} placeholders
				let processedTemplate = template;
				processedTemplate = processedTemplate.split('{path}').join(filePath);
				processedTemplate = processedTemplate.split('{filename}').join(path.basename(filePath));
				processedTemplate = processedTemplate.split('{dirname}').join(path.dirname(filePath));
				
				// Then wrap it with the appropriate comment style for the file extension
				const extensionSpecificComment = getCommentByFileExtension(filePath, '{comment}');
				// If the extension is not supported, use a default comment style (#) for the processed template
				if (!extensionSpecificComment) {
					return `# ${processedTemplate}`;
				}
				return extensionSpecificComment;
			}
		}
	}
}

/**
 * Get comment style based on file extension
 * @param filePath Path to the file
 * @returns Comment style for the file extension or undefined if not found
 */
export function getCommentStyleByExtension(filePath: string): CommentStyle | undefined {
	const ext = path.extname(filePath).toLowerCase();
	
	// First, try to match the full extension
	if (EXTENSION_STYLES[ext]) {
		return EXTENSION_STYLES[ext];
	}
	
	// If no match found, try to match by checking if the file is a special case
	// like Dockerfile, Makefile, etc. that don't have extensions
	const basename = path.basename(filePath).toLowerCase();
	if (EXTENSION_STYLES[`.${basename}`]) {
		return EXTENSION_STYLES[`.${basename}`];
	}
	
	// Try compound extensions like .env.local, .gitignore, etc.
	const parts = basename.split('.');
	if (parts.length > 1) {
		for (let i = 1; i < parts.length; i++) {
			const compoundExt = '.' + parts.slice(i).join('.').toLowerCase();
			if (EXTENSION_STYLES[compoundExt]) {
				return EXTENSION_STYLES[compoundExt];
			}
		}
	}
	
	return undefined;
}

/**
 * Get comment for file based on its extension
 * @param filePath Path to the file
 * @param template Template to use for the comment
 * @returns Formatted comment string or null if not possible
 */
export function getCommentByFileExtension(filePath: string, template: string = '{comment}'): string | null {
	const style = getCommentStyleByExtension(filePath);
	
	// If no style found for extension, use default style
	if (!style) {
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
