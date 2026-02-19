/**
 * Unit tests for Auto Path Header Extension
 * Автор: Niklis
 */

import * as assert from 'assert';
import { getCommentForLang, isCommentWithPath, getCommentForCustomTemplate } from '../utils/comments';

suite('Auto Path Header Extension Tests', () => {
  
  test('getCommentForLang should return correct comment for JavaScript', () => {
    const result = getCommentForLang('javascript', 'src/example.js');
    assert.strictEqual(result, '// src/example.js');
  });

  test('getCommentForLang should return correct comment for TypeScript', () => {
    const result = getCommentForLang('typescript', 'src/example.ts');
    assert.strictEqual(result, '// src/example.ts');
  });

  test('getCommentForLang should return correct comment for Python', () => {
    const result = getCommentForLang('python', 'src/example.py');
    assert.strictEqual(result, '# src/example.py');
  });

  test('getCommentForLang should return correct comment for CSS', () => {
    const result = getCommentForLang('css', 'src/styles.css');
    assert.strictEqual(result, '/* src/styles.css */');
  });

  test('getCommentForLang should return correct comment for SQL', () => {
    const result = getCommentForLang('sql', 'src/query.sql');
    assert.strictEqual(result, '-- src/query.sql');
  });

  test('getCommentForLang should return correct comment for HTML', () => {
    const result = getCommentForLang('html', 'src/index.html');
    assert.strictEqual(result, '<!-- src/index.html-->');
  });

  test('getCommentForLang should return null for unsupported language', () => {
    const result = getCommentForLang('unsupported', 'src/example.xyz');
    assert.strictEqual(result, null);
  });

  test('isCommentWithPath should detect existing comment with path', () => {
    const result = isCommentWithPath('// src/example.js', 'src/example.js');
    assert.strictEqual(result, true);
  });

  test('isCommentWithPath should detect existing comment with different path format', () => {
    const result = isCommentWithPath('// src\\example.js', 'src/example.js');
    assert.strictEqual(result, true);
  });

  test('isCommentWithPath should not detect comment without path', () => {
    const result = isCommentWithPath('// This is a comment', 'src/example.js');
    assert.strictEqual(result, false);
  });

  test('isCommentWithPath should detect Python comment with path', () => {
    const result = isCommentWithPath('# src/example.py', 'src/example.py');
    assert.strictEqual(result, true);
  });

  test('isCommentWithPath should detect CSS comment with path', () => {
    const result = isCommentWithPath('/* src/styles.css */', 'src/styles.css');
    assert.strictEqual(result, true);
  });

  test('isCommentWithPath should detect SQL comment with path', () => {
    const result = isCommentWithPath('-- src/query.sql', 'src/query.sql');
    assert.strictEqual(result, true);
  });

  test('isCommentWithPath should detect HTML comment with path', () => {
    const result = isCommentWithPath('<!-- src/index.html-->', 'src/index.html');
    assert.strictEqual(result, true);
  });

  test('isCommentWithPath should not detect non-comment line with path', () => {
    const result = isCommentWithPath('import src/example.js', 'src/example.js');
    assert.strictEqual(result, false);
  });

  test('getCommentForLang should apply prefix/path template placeholders', () => {
    const result = getCommentForLang('javascript', 'src/example.js', '{prefix}[{path}]{suffix}');
    assert.strictEqual(result, '// [src/example.js]');
  });

  test('getCommentForLang should keep block suffix when templated', () => {
    const result = getCommentForLang('css', 'styles/site.css', '{prefix}{path}{suffix}');
    assert.strictEqual(result, '/* styles/site.css */');
  });

  test('getCommentForLang should return comment for plaintext language', () => {
    const result = getCommentForLang('plaintext', 'src/example.txt');
    assert.strictEqual(result, '# src/example.txt');
  });

  test('getCommentForLang should return comment for text language', () => {
    const result = getCommentForLang('text', 'src/example.txt');
    assert.strictEqual(result, '# src/example.txt');
  });

  test('getCommentForCustomTemplate should apply language prefix when template does not start with comment', () => {
    const result = getCommentForCustomTemplate('plaintext', 'src/example.mjd', 'LLL: {path}');
    assert.strictEqual(result, '# LLL: src/example.mjd');
  });

  test('getCommentForCustomTemplate should process {filename} placeholder correctly', () => {
    const result = getCommentForCustomTemplate('plaintext', 'src/example.mjd', 'LLL: {filename}');
    assert.strictEqual(result, '# LLL: example.mjd');
  });

  test('getCommentForCustomTemplate should process {dirname} placeholder correctly', () => {
    const result = getCommentForCustomTemplate('plaintext', 'src/example.mjd', 'LLL: {dirname}');
    assert.strictEqual(result, '# LLL: src');
  });

  test('getCommentForCustomTemplate should return processed template with default comment for unsupported language', () => {
    const result = getCommentForCustomTemplate('unsupported_language', 'src/example.mjd', 'LLL: {path}');
    assert.strictEqual(result, '# LLL: src/example.mjd');
  });

  test('getCommentForCustomTemplate should not apply language prefix when template starts with comment character', () => {
    const result = getCommentForCustomTemplate('plaintext', 'src/example.txt', '# MY CUSTOM: {path}');
    assert.strictEqual(result, '# MY CUSTOM: src/example.txt');
  });

  test('getCommentForCustomTemplate should apply language prefix for text language as well', () => {
    const result = getCommentForCustomTemplate('text', 'src/example.ttt', 'qwerty: {path}');
    assert.strictEqual(result, '# qwerty: src/example.ttt');
  });
});

