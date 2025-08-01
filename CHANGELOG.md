# [1.0.7] - 2025-07-31

### Added
- New settings: `showReads` and `showWrites` to enable or disable the display of read/write references in CodeLens.
- Fully customizable: toggle the visibility of read/write counts independently in the extension settings.

# [1.0.6] - 2025-07-31

### Added
- Customizable affixes: you can now set the text after the read/write count (e.g. "lectures", "écritures", "読み取り", "書き込み") in the extension settings.
- Emojis and affixes are instantly updated in CodeLens when changed in settings.


# [1.0.5] - 2025-07-31

### Added
- New VS Code OutputChannel: all crashes, errors, and critical logs are now visible in the "Output" panel.
- Improved robustness: all errors are logged to the VS Code output for easier debugging.
- Extension activation log to verify successful loading.

### Changed
- Removed unnecessary console logs for better performance and a cleaner user experience.

### Fixed
- Internal properties of anonymous instantiated classes are now correctly detected and receive a CodeLens, just like in the VS Code symbol palette.

# Changelog

## [1.0.4] - 2025-07-31

### Improved
- Major performance improvement: document caching for cross-file references (no more duplicate openTextDocument calls).
- Uses already open documents in the editor when possible (faster, less memory).
- Robust error handling and logging for invalid lines/positions.
- CodeLens now reliably counts reads/writes across all files in the workspace.

## [1.0.3] - 2025-07-31

### Changed
- The regex for detecting classes has been updated to include names containing the `$` character. This allows handling cases like `class $App` correctly.

## [1.0.0] - 2025-07-30

### Added
- CodeLens to display the number of reads/writes for class properties
- Navigation to references filtered by type (read/write)
- Full support for JavaScript and TypeScript
- Handling of TypeScript modifiers (public, private, protected, readonly, static, abstract)
- Support for optional properties (`prop?: type`)
- Performance optimizations with CancellationToken management
- Robust error handling

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
