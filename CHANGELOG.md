# Changelog

## [1.0.3] - 2025-07-31

### Changed
- 🔧 The regex for detecting classes has been updated to include names containing the `$` character. This allows handling cases like `class $App` correctly.

## [1.0.0] - 2025-07-31

### Added
- ✨ CodeLens to display the number of reads/writes for class properties
- 🔍 Navigation to references filtered by type (read/write)
- 📖 Full support for JavaScript and TypeScript
- 🎯 Handling of TypeScript modifiers (public, private, protected, readonly, static, abstract)
- 🛡️ Support for optional properties (`prop?: type`)
- ⚡ Performance optimizations with CancellationToken management
- 🐛 Robust error handling

### Features
- Syntax support:
  - JavaScript: `a = 5;`
  - TypeScript: `a: number = 5;`, `a?: string;`, `public readonly b: number;`
- Clickable CodeLens to filter references
- Intelligent detection of reads vs writes
- Intuitive user interface with 📖 and ✏️ icons

### Technical
- Optimized regex for property detection
- Cancellation management for better performance
- Data validation and error handling
- Clean and maintainable code
