/**
 * Localization messages for Auto Path Header extension
 * Автор: Niklis
 */

export const messages = {
  en: {
    extensionName: 'Auto Path Header',
    description: 'Automatically inserts the relative path of the file as a comment on the first line.',
    errorInsertingComment: 'Error inserting comment: {0}',
    commentAlreadyExists: 'Comment already exists in file',
    unsupportedLanguage: 'Unsupported language: {0}',
    fileRenamed: 'File renamed from {0} to {1}',
    updatePathComment: 'Update path comment?',
    pathCommentUpdated: 'Path comment updated successfully',
    errorUpdatingComment: 'Error updating comment: {0}'
  },
  ru: {
    extensionName: 'Автозаголовок расположения файла',
    description: 'Автоматически вставляет относительный путь файла в виде комментария на первой строке.',
    errorInsertingComment: 'Ошибка вставки комментария: {0}',
    commentAlreadyExists: 'Комментарий уже существует в файле',
    unsupportedLanguage: 'Неподдерживаемый язык: {0}',
    fileRenamed: 'Файл переименован с {0} на {1}',
    updatePathComment: 'Обновить комментарий с путём?',
    pathCommentUpdated: 'Комментарий с путём обновлён успешно',
    errorUpdatingComment: 'Ошибка обновления комментария: {0}'
  }
};

export function getMessage(key: keyof typeof messages.en, language: string = 'en', ...args: string[]): string {
  const lang = language.startsWith('ru') ? 'ru' : 'en';
  let message = messages[lang][key] || messages.en[key];
  
  // Заменяем плейсхолдеры аргументами
  args.forEach((arg, index) => {
    message = message.replace(`{${index}}`, arg);
  });
  
  return message;
}
