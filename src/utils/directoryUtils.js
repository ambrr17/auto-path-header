"use strict";
/**
 * Utility functions for directory operations
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.isInIgnoredDirectory = isInIgnoredDirectory;
exports.isFileInIgnoredDirectory = isFileInIgnoredDirectory;
const path = __importStar(require("path"));
/**
 * Check if a file path is within any of the ignored directories
 * @param filePath The absolute or relative file path to check
 * @param ignoredDirectories Array of directory names/patterns to ignore (relative to workspace root)
 * @returns true if the file is in an ignored directory, false otherwise
 */
function isInIgnoredDirectory(filePath, ignoredDirectories) {
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
function isFileInIgnoredDirectory(fullPath, workspaceRoot, ignoredDirectories) {
    try {
        // Get relative path from workspace root
        const relativePath = path.relative(workspaceRoot, fullPath).replace(/\\/g, '/');
        return isInIgnoredDirectory(relativePath, ignoredDirectories);
    }
    catch (error) {
        // If there's an error calculating the relative path, fall back to checking the full path
        return isInIgnoredDirectory(fullPath.replace(/\\/g, '/'), ignoredDirectories);
    }
}
//# sourceMappingURL=directoryUtils.js.map