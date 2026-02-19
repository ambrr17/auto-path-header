// tree.js

const fs = require('fs');
const path = require('path');

// Папки, содержимое которых НЕ раскрывать (только имя + "/")
const EXCLUDE_DIR_NAMES = new Set([
    'node_modules',
    '.git',
    '.vscode-testworkspace',
    '.vscode-test',
    'dist',        // ← опционально: можно убрать, если dist нужно раскрывать
    // Добавьте свои по необходимости
]);

function getDirectoryTree(dirPath, prefix = '') {
    let result = '';
    let entries = fs.readdirSync(dirPath);
    const total = entries.length;

    // Фильтруем исключаемые папки
    // entries = entries.filter(name => !EXCLUDE_DIR_NAMES.has(name));
    // console.log('Entries:', entries);
    // return;

    entries.forEach((name, index) => {
        const fullPath = path.join(dirPath, name);
        const isLast = index === total - 1;
        const connector = isLast ? '└── ' : '├── ';

        const isDir = fs.statSync(fullPath).isDirectory();

        if (isDir && EXCLUDE_DIR_NAMES.has(name)) {
            // Только имя папки — не заходим внутрь!
            result += `${prefix}${connector}${name}/\n`;
        } else if (isDir) {
            result += `${prefix}${connector}${name}/\n`;
            const nextPrefix = prefix + (isLast ? '    ' : '│   ');
            result += getDirectoryTree(fullPath, nextPrefix);
        } else {
            result += `${prefix}${connector}${name}\n`;
        }
    });

    return result;
}

function main() {
    const targetDir = process.argv[2] || '.';
    const resolved = path.resolve(targetDir);
    const rootName = path.basename(resolved);

    if (!fs.existsSync(resolved)) {
        console.error(`Путь не найден: ${resolved}`);
        process.exit(1);
    }

    try {
        const tree = getDirectoryTree(resolved);
        console.log(`${rootName}/`);
        if (tree) {
            console.log(tree.trimEnd());
        }
    } catch (err) {
        console.error('Ошибка:', err.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}