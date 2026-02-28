/**
 * Unit tests for Auto Path Header Extension
 * Автор: Niklis
 */

import * as assert from 'assert';
import { isCommentWithPath, getCommentForCustomTemplate, getCommentByFileExtension, getCommentStyleByExtension } from '../src/utils/comments';

suite('Auto Path Header Extension Tests', () => {
  
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

  test('getCommentForCustomTemplate should apply extension prefix when template does not start with comment', () => {
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

  test('getCommentForCustomTemplate should return processed template with default comment for unsupported extension', () => {
    const result = getCommentForCustomTemplate('unsupported_extension', 'src/example.mjd', 'LLL: {path}');
    assert.strictEqual(result, '# LLL: src/example.mjd');
  });

  test('getCommentForCustomTemplate should not apply extension prefix when template starts with comment character', () => {
    const result = getCommentForCustomTemplate('plaintext', 'src/example.txt', '# MY CUSTOM: {path}');
    assert.strictEqual(result, '# MY CUSTOM: src/example.txt');
  });

  test('getCommentForCustomTemplate should apply extension prefix for text extension as well', () => {
    const result = getCommentForCustomTemplate('text', 'src/example.ttt', 'qwerty: {path}');
    assert.strictEqual(result, '# qwerty: src/example.ttt');
  });
  
  test('getCommentStyleByExtension should return correct style for JavaScript file', () => {
    const result = getCommentStyleByExtension('src/example.js');
    assert.deepStrictEqual(result, { prefix: '// ' });
  });
  
  test('getCommentStyleByExtension should return correct style for Python file', () => {
    const result = getCommentStyleByExtension('src/example.py');
    assert.deepStrictEqual(result, { prefix: '# ' });
  });
  
  test('getCommentStyleByExtension should return correct style for CSS file', () => {
    const result = getCommentStyleByExtension('src/styles.css');
    assert.deepStrictEqual(result, { prefix: '/* ', suffix: ' */' });
  });
  
  test('getCommentStyleByExtension should return undefined for unsupported extension', () => {
    const result = getCommentStyleByExtension('src/example.xyz');
    assert.strictEqual(result, undefined);
  });
  
  test('getCommentByFileExtension should return correct comment for JavaScript file', () => {
    const result = getCommentByFileExtension('src/example.js');
    assert.strictEqual(result, '// src/example.js');
  });
  
  test('getCommentByFileExtension should return correct comment for Python file', () => {
    const result = getCommentByFileExtension('src/example.py');
    assert.strictEqual(result, '# src/example.py');
  });
  
  test('getCommentByFileExtension should return correct comment for CSS file', () => {
    const result = getCommentByFileExtension('src/styles.css');
    assert.strictEqual(result, '/* src/styles.css */');
  });
  
  test('getCommentByFileExtension should return correct comment for PHP file', () => {
    const result = getCommentByFileExtension('src/example.php');
    assert.strictEqual(result, '<?php // src/example.php ?>');
  });
  
  test('getCommentByFileExtension should return default comment for unsupported extension', () => {
    const result = getCommentByFileExtension('src/example.xyz');
    assert.strictEqual(result, '# src/example.xyz');
  });
  
  test('getCommentByFileExtension should apply template placeholders', () => {
    const result = getCommentByFileExtension('src/example.js', '{prefix}[{path}]{suffix}');
    assert.strictEqual(result, '// [src/example.js]');
  });
});
