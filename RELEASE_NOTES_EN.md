# Release Notes 1.4.52

## [1.4.52] - 2025-11-25

## New Features & Enhancements

### Interface & Interaction
- **Global Bulk Update**: Added a global "Update All" button (executes `scoop update *`)
- **PackageInfo Modal Enhancements**:
  - Added dedicated "Update" and "Change Repository" buttons
  - Update button now supports forced update (with confirmation) when no update is available
  - Added confirmation dialog for uninstall operations

### Functional Components
- **Scoop Configuration Improvements**:
  - Added path validation button to Scoop Configuration component
  - Memory state now automatically syncs after Scoop path updates
- **Doctor Page Expansion**:
  - New Configuration component displaying Scoop Config contents
  - New Scoop Commands component for quick command execution
  - Added terminal-like display area with command hints
- **Operation Panel Refinement**: FloatingOperationPanel now supports minimize behavior

## Fixes & Adjustments

### Functional Fixes
- **Upstream Sync**: Integrated changes from upstream [v1.4.5](https://github.com/AmarBego/Rscoop/releases/tag/v1.4.5)
- **Component Relocation**: Scoop Proxy component moved from Settings page to Doctor page

### Interface Optimizations
- **Page Restructuring**:
  - "Installed" page renamed to "Package" page (internal code retains InstalledPage naming)
  - Improved List/Grid view layouts with fixed edge clipping issues
- **Interaction Improvements**:
  - Replaced OperationModal with FloatingOperationPanel
  - Page transitions now use persistent rendering mode
- **API Extensions**: New interfaces for retrieving Scoop configuration and executing commands

### Styling Refinements
- Removed default focus outlines on input fields
- Improved application name display in List view
- Experimental fixed margins for global and Package page windows

## Roadmap

### Short-term Focus
- [ ] Refine window minimize behavior
- [ ] Resolve search box content persistence issues
- [ ] Enhance Debug Mode functionality
- [ ] Integrate upstream [v1.4.6]changes

### Future Extensions
- [ ] Add action support for additional content areas
- [ ] Continuous optimization for refined user experience

> Note: Internal codebase continues to use "InstalledPage" naming for easier legacy code management.