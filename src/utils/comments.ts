export function isCommentWithPath(line: string, filePath: string): boolean {
	const normalizedPath = filePath.replace(/\\/g, '/');
	const normalizedLine = line.replace(/\\/g, '/');
	return normalizedLine.includes(normalizedPath) && (
		normalizedLine.startsWith('//') ||
		normalizedLine.startsWith('#') ||
		normalizedLine.startsWith('/*') ||
		normalizedLine.startsWith('--') ||
		normalizedLine.startsWith('<!--')
	);
}

export function getCommentForLang(lang: string, filePath: string): string | null {
	const line = ` ${filePath}`
	switch (lang) {
		case 'javascript':
		case 'typescript':
		case 'java':
		case 'c':
		case 'cpp':
		case 'csharp':
		case 'go':
		case 'rust':
		case 'swift':
		case 'kotlin':
		case 'php':
			return '//' + line
		case 'python':
		case 'shellscript':
		case 'ruby':
		case 'perl':
		case 'dotenv':
			return '#' + line
		case 'css':
		case 'scss':
		case 'sass':
			return `/*${line} */`
		case 'sql':
			return '--' + line
		case 'html':
		case 'xml':
			return `<!--${line}-->`
		default:
			return null
	}
}
