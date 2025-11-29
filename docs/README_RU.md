# Auto Path Header

Расширение для Visual Studio Code, которое автоматически вставляет путь файла в виде комментария в первую строку.

---

Идеально подходит для:
- больших монорепозиториев
- навигации в незнакомом проекте
- упрощения code review и копирования файлов
<br><br>

Язык: RU | [EN](./README.md)

## Как это выглядит

**До:**

```ts
export function greet() {
  console.log("Hello");
}
```

**После:**

```ts
// src/utils/greet.ts
export function greet() {
  console.log("Hello");
}
```
## Возможности

- ✅ Автоматическая вставка пути при открытии файла
- ✅ Поддержка множества языков
- ✅ Обновление пути при переименовании и перемещении
- ✅ Кастомный шаблон комментария
- ✅ Ручная вставка через команду

## Поддерживаемые языки
| Тип        | Примеры                  |
| ---------- | ------------------------ |
| `//`       | JS, TS, Java, C, C++, C#, Go, Rust, Swift, Kotlin, PHP |
| `#`        | Python, Shell, Ruby, Perl, .env      |
| `/* */`    | CSS, SCSS, Sass          |
| `--`       | SQL                      |
| `<!-- -->` | HTML, XML                |


## Установка

### Через Marketplace

1. Открой VS Code

2. Перейди в Extensions (Ctrl+Shift+X)

3. Найди Auto Path Header

4. Нажми Install

### Через VSIX

1. Скачай `.vsix` файл

2. В VS Code: `Ctrl+Shift+P` → "Extensions: Install from VSIX..."

3. Выбери: Extensions: Install from VSIX...

## Настройки

Расширение можно настроить в настройках VS Code:
| Настройка                          | По умолчанию | Описание                                    |
| ---------------------------------- | ------------ | ------------------------------------------- |
| `autoPathHeader.enabled`           | true         | Включить / выключить                        |
| `autoPathHeader.language`          | auto         | Язык сообщений (auto/en/ru)                 |
| `autoPathHeader.updateOnRename`    | true         | Обновлять путь при переименовании           |
| `autoPathHeader.askBeforeUpdate`   | true         | Запрашивать подтверждение перед обновлением |
| `autoPathHeader.formatTemplate`    | `{comment}`  | Шаблон комментария                          |
| `autoPathHeader.disabledLanguages` | []           | Языки, в которых расширение отключено       |

### Настройка шаблона

`formatTemplate` позволяет менять внешний вид первой строки. Доступные плейсхолдеры:

| Плейсхолдер | Значение                             | Пример               |
|-------------|--------------------------------------|----------------------|
| `{comment}` | Готовый комментарий (префикс + путь) | `// src/example.ts`  |
| `{path}`    | Относительный путь                   | `src/example.ts`     |
| `{prefix}`  | Открывающий токен языка              | `// `, `/* `, `<!-- ` |
| `{suffix}`  | Закрывающий токен (если есть)        | ` */`, `-->`         |

Примеры настроек:

```jsonc
{
  "autoPathHeader.formatTemplate": "{prefix}[{path}]{suffix}"
}
```

```jsonc
{
  "autoPathHeader.formatTemplate": "// File: {path}"
}
```

### Отключение языков

Чтобы не вставлять комментарии в конкретных языках (например, Markdown), добавьте их идентификаторы:

```jsonc
{
  "autoPathHeader.disabledLanguages": [
    "markdown",
    "plaintext"
  ]
}
```

Даже ручная команда учтёт этот список и покажет сообщение вместо вставки.

## Использование

Расширение работает автоматически при открытии файлов. Если нужно вставить комментарий вручную:

1. `Ctrl+Shift+P` → "Auto Path Header: Insert Path Comment"
## Поддержка

Если у вас есть вопросы или предложения, создайте Issue в репозитории.

**Автор:** Niklis
