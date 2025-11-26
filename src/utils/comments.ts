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
	php: { prefix: '// ' },
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
}

const TEMPLATE_PLACEHOLDERS = ['{comment}', '{path}', '{prefix}', '{suffix}']

export function isCommentWithPath(line: string, filePath: string): boolean {
	const normalizedPath = filePath.replace(/\\/g, '/')
	const normalizedLine = line.replace(/\\/g, '/')
	return normalizedLine.includes(normalizedPath) && (
		normalizedLine.startsWith('//') ||
		normalizedLine.startsWith('#') ||
		normalizedLine.startsWith('/*') ||
		normalizedLine.startsWith('--') ||
		normalizedLine.startsWith('<!--')
	)
}

export function getCommentForLang(lang: string, filePath: string, template = '{comment}'): string | null {
	const style = LANGUAGE_STYLES[lang]
	if (!style) return null

	const prefix = style.prefix
	const suffix = style.suffix ?? ''
	const defaultComment = `${prefix}${filePath}${suffix}`

	let result = template
	for (const placeholder of TEMPLATE_PLACEHOLDERS) {
		if (!result.includes(placeholder)) continue
		switch (placeholder) {
			case '{comment}':
				result = result.split(placeholder).join(defaultComment)
				break
			case '{path}':
				result = result.split(placeholder).join(filePath)
				break
			case '{prefix}':
				result = result.split(placeholder).join(prefix)
				break
			case '{suffix}':
				result = result.split(placeholder).join(suffix)
				break
			default:
				break
		}
	}

	// If template did not include any placeholder, fall back to default comment
	const containsPlaceholder = TEMPLATE_PLACEHOLDERS.some((ph) => template.includes(ph))
	return containsPlaceholder ? result : defaultComment
}
