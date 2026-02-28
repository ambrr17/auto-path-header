/**
 * Utility functions for directory operations
 */

import * as path from 'path';

/**
 * Check if a file path is within any of the ignored directories
 * @param filePath The absolute or relative file path to check
 * @param ignoredDirectories Array of directory names/patterns to ignore (relative to workspace root)
 * @returns true if the file is in an ignored directory, false otherwise
 */
export function isInIgnoredDirectory(filePath: string, ignoredDirectories: string[]): boolean {
  // Normalize the file path to use forward slashes for consistent comparison
  const normalizedPath = filePath.replace(/\\/g, '/');
  
  // Split the path into segments
  const pathSegments = normalizedPath.split('/').filter(segment => segment.length > 0);
  
  // Check if any segment matches the ignored directories
  for (const dir of ignoredDirectories) {
    const normalizedDir = dir.replace(/\\/g, '/');
    
    // Check if any segment in the path matches the ignored directory
    if (pathSegments.some(segment => segment === normalizedDir)) {
      return true;
    }
    
    // Also check if the full path starts with the ignored directory pattern
    if (normalizedPath.startsWith(normalizedDir + '/') || normalizedPath === normalizedDir) {
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
    // Get relative path from workspace root
    const relativePath = path.relative(workspaceRoot, fullPath).replace(/\\/g, '/');
    return isInIgnoredDirectory(relativePath, ignoredDirectories);
  } catch (error) {
    // If there's an error calculating the relative path, fall back to checking the full path
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

  const normalizedPath = filePath.replace(/\\/g, '/');
  const pathSegments = normalizedPath.split('/').filter(segment => segment.length > 0);

  for (const dir of allowedDirectories) {
    const normalizedDir = dir.replace(/\\/g, '/').replace(/\/$/, '');

    // If the normalized path starts with the allowed directory pattern
    if (normalizedPath === normalizedDir || normalizedPath.startsWith(normalizedDir + '/')) {
      return true;
    }

    // Also check if any segment of the path equals the allowed directory
    if (pathSegments.some(segment => segment === normalizedDir)) {
      return true;
    }
  }

  return false;
}