// src/utils/comments.ts
import * as path from 'path';

type CommentStyle = {
	prefix: string
	suffix?: string
}

// Default mapping from file extensions to comment styles
const DEFAULT_EXTENSION_STYLES: Record<string, CommentStyle> = {
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

// export function getCommentForCustomTemplate(lang: string, filePath: string, template: string): string | null {
// 	// Process the {path}, {filename}, and {dirname} placeholders in the custom template
// 	let processedTemplate = template;
// 	processedTemplate = processedTemplate.split('{path}').join(filePath);
// 	processedTemplate = processedTemplate.split('{absolutePath}').join(path.resolve(filePath));
// 	processedTemplate = processedTemplate.split('{filename}').join(path.basename(filePath));
// 	processedTemplate = processedTemplate.split('{dirname}').join(path.dirname(filePath));
// 	return processedTemplate;
// }

/**
 * Get comment style based on file extension
 * @param filePath Path to the file
 * @returns Comment style for the file extension or undefined if not found
 */
export function getCommentStyleByExtension(filePath: string): CommentStyle | undefined {
	const ext = path.extname(filePath).toLowerCase();

	// First, try to match the full extension
	if (DEFAULT_EXTENSION_STYLES[ext]) {
		return DEFAULT_EXTENSION_STYLES[ext];
	}

	// If no match found, try to match by checking if the file is a special case
	// like Dockerfile, Makefile, etc. that don't have extensions
	const basename = path.basename(filePath).toLowerCase();
	if (DEFAULT_EXTENSION_STYLES[`.${basename}`]) {
		return DEFAULT_EXTENSION_STYLES[`.${basename}`];
	}

	// Try compound extensions like .env.local, .gitignore, etc.
	const parts = basename.split('.');
	if (parts.length > 1) {
		for (let i = 1; i < parts.length; i++) {
			const compoundExt = '.' + parts.slice(i).join('.').toLowerCase();
			if (DEFAULT_EXTENSION_STYLES[compoundExt]) {
				return DEFAULT_EXTENSION_STYLES[compoundExt];
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

/**
 * Базовые типы значений в пайплайне
 */
type Primitive = string | number | boolean;
type Value = Primitive | Primitive[];

/**
 * Сигнатура фильтра
 */
type FilterFn = (value: Value, ...args: string[]) => Value;

/**
 * Реестр фильтров
 */
const filterRegistry: Record<string, FilterFn> = {
	unix: (v) => String(v).replace(/\\/g, '/'),

	toUpperCase: (v) => String(v).toUpperCase(),
	toLowerCase: (v) => String(v).toLowerCase(),

	// normalize: (v) =>
	//     String(v)
	//         .replace(/\\/g, '/')
	//         .replace(/\/+/g, '/'),

	// split: (v, sep) => String(v).split(sep),

	// last: (v) =>
	//     Array.isArray(v) ? v[v.length - 1] ?? '' : v,

	// replace: (v, from, to) =>
	//     String(v).replace(from, to ?? ''),

	// contains: (v, substr) =>
	//     String(v).includes(substr),

	// ternary: (v, a, b) =>
	//     v ? a : b,

	// slice: (v, start, end) =>
	//     String(v).slice(Number(start), Number(end)),

	// depth: (v, n) =>
	//     String(v)
	//         .split('/')
	//         .slice(0, Number(n))
	//         .join('/'),

	// relative: (v, base) => {
	//     const normalized = String(v).replace(/\\/g, '/');
	//     const idx = normalized.indexOf(base);
	//     return idx >= 0
	//         ? normalized.slice(idx + base.length + 1)
	//         : normalized;
	// }
};

/**
 * Описание фильтра после парсинга
 */
interface ParsedFilter {
	name: string;
	args: string[];
}

/**
 * Описание выражения {path|filter}
 */
interface ParsedExpression {
	base: string;
	filters: ParsedFilter[];
}

/**
 * Контекст доступных переменных
 */
interface TemplateContext {
	path: string;
	absolutePath: string;
	filename: string;
	dirname: string;
}

/**
 * Парсинг выражения
 */
function parseExpression(expr: string): ParsedExpression {
	const [base, ...filters] = expr.split('|');

	return {
		base: base.trim(),
		filters: filters.map((f) => {
			const [name, args] = f.split(':');
			return {
				name: name.trim(),
				args: args ? args.split(',').map(a => a.trim()) : []
			};
		})
	};
}

/**
 * Применение фильтров
 */
function applyFilters(value: Value, filters: ParsedFilter[]): Value {
	return filters.reduce<Value>((acc, filter) => {
		const fn = filterRegistry[filter.name];

		if (!fn) {
			console.warn(`Unknown filter: ${filter.name}`);
			return acc;
		}

		try {
			return fn(acc, ...filter.args);
		} catch (e) {
			console.warn(`Filter error: ${filter.name}`, e);
			return acc;
		}
	}, value);
}

/**
 * Регистрация пользовательских фильтров
 */
export function registerUserFilters(userFilters: Record<string, string>) {
	for (const [name, fnString] of Object.entries(userFilters)) {
		try {
			const fn = new Function(
				'value',
				'...args',
				`return (${fnString})(value, ...args)`
			) as FilterFn;

			filterRegistry[name] = fn;
		} catch (e) {
			console.warn(`Invalid filter: ${name}`);
		}
	}
}

/**
 * Основная функция обработки шаблона
 */
export function getCommentForCustomTemplate(
	lang: string,
	filePath: string,
	template: string
): string | null {

	const context: TemplateContext = {
		path: filePath,
		absolutePath: path.resolve(filePath),
		filename: path.basename(filePath),
		dirname: path.dirname(filePath)
	};

	const result = template.replace(/\{([^}]+)\}/g, (_, expr: string) => {
		const { base, filters } = parseExpression(expr);

		const value = context[base as keyof TemplateContext];

		if (value === undefined) {
			console.warn(`Unknown variable: ${base}`);
			return '';
		}

		const processed = applyFilters(value, filters);

		return String(processed);
	});

	return result;
}
