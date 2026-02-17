# Release Notes

## [1.6.0] - 2026-02-18

### Added
- **AES Encryption**: Implemented AES encryption for VirusTotal API key storage to enhance security
- **Cache Clearing Logic**: Added cache clearing functionality and improved internationalization support

### Changed
- **Core Refactoring**: 
  - Renamed `createStoredSignal` to `createTauriSignal` for better naming consistency
  - Simplified AboutSection update system
  - Extracted command execution state to operations store
  - Unified bucket date formatting logic
- **UI/UX Improvements**:
  - Optimized installed packages page user experience
  - Persisted Scoop config in localStorage to prevent doctor page flickering
- **Internationalization**: Enhanced i18n support across the application

### Fixed
- **OperationModal Display**: Ensured OperationModal displays properly for cleanup commands
- **Version Comparison**: Fixed semantic version comparison in auto cleanup functionality

This release focuses on security enhancements, core refactoring for better maintainability, and improved user experience through UI optimizations and bug fixes.
