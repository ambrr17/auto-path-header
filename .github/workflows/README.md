# GitHub Actions Workflow

## Описание

Workflow автоматически собирает VSIX пакет расширения при:
- Push в ветки `main` или `master`
- Создании Pull Request в эти ветки
- Создании Release

## Что делает workflow

1. **Checkout code** - получает код из репозитория
2. **Setup Node.js** - устанавливает Node.js 20 с кешированием npm
3. **Install dependencies** - устанавливает зависимости через `npm ci`
4. **Compile TypeScript** - компилирует исходники в `dist/`
5. **Package VSIX** - собирает VSIX пакет через `vsce package`
6. **Upload artifact** - загружает VSIX как артефакт (доступен 30 дней)

## Как проверить работу

### Локальная проверка

1. Убедитесь, что компиляция работает:
```bash
npm run compile
```

2. Проверьте сборку пакета (будет предупреждение о репозитории, это нормально):
```bash
npm run package
```

### Проверка в GitHub

1. Сделайте коммит и push:
```bash
git add .github/workflows/build.yml
git commit -m "Add GitHub Actions workflow for VSIX build"
git push
```

2. Перейдите в GitHub → вкладка **Actions**
3. Выберите запущенный workflow "Build VSIX"
4. После успешного выполнения:
   - В разделе **Artifacts** будет доступен файл `extension-vsix`
   - Можно скачать готовый `.vsix` файл

### Проверка артефакта

После скачивания VSIX из GitHub Actions:
1. Откройте VS Code
2. `Ctrl+Shift+P` → "Extensions: Install from VSIX..."
3. Выберите скачанный файл
4. Проверьте, что расширение установилось и работает

## Примечания

- Тестирование выполняется локально на Windows перед коммитом
- Workflow только собирает VSIX, не запускает тесты
- Предупреждение о репозитории игнорируется через флаг `--allow-missing-repository`


