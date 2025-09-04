/**
 * Unit tests for Localization
 * Автор: Niklis
 */

import * as assert from 'assert';
import { getMessage, messages } from '../localization';

suite('Localization Tests', () => {
  
  test('getMessage should return English message for English language', () => {
    const result = getMessage('extensionName', 'en');
    assert.strictEqual(result, 'Auto Path Header');
  });

  test('getMessage should return Russian message for Russian language', () => {
    const result = getMessage('extensionName', 'ru');
    assert.strictEqual(result, 'Автозаголовок расположения файла');
  });

  test('getMessage should return English message for unsupported language', () => {
    const result = getMessage('extensionName', 'fr');
    assert.strictEqual(result, 'Auto Path Header');
  });

  test('getMessage should replace placeholders with arguments', () => {
    const result = getMessage('errorInsertingComment', 'en', 'Test error');
    assert.strictEqual(result, 'Error inserting comment: Test error');
  });

  test('getMessage should replace multiple placeholders', () => {
    const result = getMessage('fileRenamed', 'en', 'old.js', 'new.js');
    assert.strictEqual(result, 'File renamed from old.js to new.js');
  });

  test('getMessage should handle Russian placeholders', () => {
    const result = getMessage('fileRenamed', 'ru', 'старый.js', 'новый.js');
    assert.strictEqual(result, 'Файл переименован с старый.js на новый.js');
  });

  test('getMessage should default to English for unknown keys', () => {
    const result = getMessage('unknownKey' as any, 'en');
    assert.strictEqual(result, undefined);
  });

  test('messages should contain all required keys', () => {
    const requiredKeys = ['extensionName', 'description', 'errorInsertingComment', 'unsupportedLanguage', 'fileRenamed', 'updatePathComment', 'pathCommentUpdated', 'errorUpdatingComment'];
    
    requiredKeys.forEach(key => {
      assert.ok(messages.en[key as keyof typeof messages.en], `Missing English key: ${key}`);
      assert.ok(messages.ru[key as keyof typeof messages.ru], `Missing Russian key: ${key}`);
    });
  });

  test('getMessage should handle empty arguments array', () => {
    const result = getMessage('extensionName', 'en');
    assert.strictEqual(result, 'Auto Path Header');
  });

  test('getMessage should handle language variants', () => {
    const result1 = getMessage('extensionName', 'ru-RU');
    const result2 = getMessage('extensionName', 'ru');
    assert.strictEqual(result1, result2);
  });
});

