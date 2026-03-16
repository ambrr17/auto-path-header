# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.0.1] - 2026-03-16

### Fixed

- Fixed notification being shown for files opened automatically in ignored directories. The message is now displayed only when the file is actually visible to the user.

## [1.0.0] - 2026-03-01

### Added

- Initial release of Auto Path Header extension.
- Automatic path comment insertion for new/empty files.
- Auto-update comments on file rename/move with configurable behavior.
- Support for custom templates enabling ANY file extension.
- Settings: `enabled`, `language`, `updateOnRename`, `askBeforeUpdate`, `updateOnRenameFolder`, `updateOnRenameRecursive`, `allowedOnlyExtensions`, `disabledExtensions`, `allowedOnlyDirectories`, `ignoredDirectories`, `formatTemplate`, `customTemplatesByExtension`.
- Comprehensive README and documentation.
