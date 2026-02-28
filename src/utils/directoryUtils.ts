/**
 * Utility functions for directory operations
 */

import * as path from 'path';
import minimatch = require('minimatch');
import * as vscode from 'vscode';

// Helper to detect if a pattern contains glob syntax
function isGlobPattern(pattern: string): boolean {
  return /[*?\[\]{}]/.test(pattern);
}

// Shared matching logic used for both ignored and allowed lists.
// Supports plain string comparisons as well as glob patterns via minimatch.
function matchesAnyPattern(normalizedPath: string, pathSegments: string[], normalizedPattern: string): boolean {
  // minimatch package exports an object; actual matcher is under `.minimatch`
  const mm: any = (minimatch as any).minimatch || minimatch;
  if (isGlobPattern(normalizedPattern)) {
    // handle **/prefix: match segment anywhere in path
    if (normalizedPattern.startsWith('**/')) {
      const segPattern = normalizedPattern.slice(3);
      for (let i = 0; i < pathSegments.length; i++) {
        const segment = pathSegments[i];
        if (mm(segment, segPattern)) {
          return true;
        }
        const subpath = pathSegments.slice(i).join('/');
        if (mm(subpath, segPattern, { matchBase: true })) {
          return true;
        }
      }
    }

    // try matching the full path; matchBase allows patterns like *.ts to match filenames
    if (mm(normalizedPath, normalizedPattern, { matchBase: true })) {
      return true;
    }
  } else {
    // plain string behaviour (previous implementation)
    if (normalizedPath === normalizedPattern || normalizedPath.startsWith(normalizedPattern + '/')) {
      return true;
    }
    if (pathSegments.some(seg => seg === normalizedPattern)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if a file path is within any of the ignored directories
 * @param filePath The absolute or relative file path to check
 * @param ignoredDirectories Array of directory names/patterns to ignore (relative to workspace root)
 * @returns true if the file is in an ignored directory, false otherwise
 */
export function isInIgnoredDirectory(filePath: string, ignoredDirectories: string[]): boolean {
  const normalizedPath = filePath.replace(/\\/g, '/').replace(/\/$/, '');
  const pathSegments = normalizedPath.split('/').filter(s => s.length > 0);

  for (const pattern of ignoredDirectories) {
    const normalizedPattern = pattern.replace(/\\/g, '/').replace(/\/$/, '');
    if (matchesAnyPattern(normalizedPath, pathSegments, normalizedPattern)) {
      vscode.window.showInformationMessage(`File in ignored directory ${pattern}`);
      return true;
    }
  }

  return false;
}

/**
 * Get the relative path from workspace root and check if it's in ignored directories
 * @param fullPath The absolute file path
 * @param workspaceRoot The workspace root path
 * @param ignoredDirectories Array of directory names to ignore
 * @returns true if the file is in an ignored directory, false otherwise
 */
export function isFileInIgnoredDirectory(fullPath: string, workspaceRoot: string, ignoredDirectories: string[]): boolean {
  try {
    const relativePath = path.relative(workspaceRoot, fullPath).replace(/\\/g, '/');
    return isInIgnoredDirectory(relativePath, ignoredDirectories);
  } catch (error) {
    return isInIgnoredDirectory(fullPath.replace(/\\/g, '/'), ignoredDirectories);
  }
}

/**
 * Check if a file path is under any of the allowed-only directories.
 * If the list is empty then everything is allowed.
 * @param filePath The absolute or relative file path to check
 * @param allowedDirectories Array of directory names/patterns allowed (relative to workspace root)
 * @returns true if the file is inside one of the allowed directories, false otherwise
 */
export function isInAllowedDirectory(filePath: string, allowedDirectories: string[]): boolean {
  if (!allowedDirectories || allowedDirectories.length === 0) {
    return true; // no restrictions
  }

  // treat '.' as wildcard meaning "allow everything"
  if (allowedDirectories.includes('.')) {
    return true;
  }

  const normalizedPath = filePath.replace(/\\/g, '/').replace(/\/$/, '');
  const pathSegments = normalizedPath.split('/').filter(segment => segment.length > 0);

  for (const pattern of allowedDirectories) {
    const normalizedPattern = pattern.replace(/\\/g, '/').replace(/\/$/, '');
    if (matchesAnyPattern(normalizedPath, pathSegments, normalizedPattern)) {
      return true;
    }
  }

  return false;
}
