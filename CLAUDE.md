# CLAUDE.md - Foxhole Pyramid Report

## Project Overview

**Foxhole Pyramid Report** is a pyramid UI built on top of the [Foxhole Inventory Report (fir)](https://github.com/GICodeWarrior/fir) screenshot analysis tool. It displays Foxhole base supply needs using the "Logi Pyramid" visualization system.

**Live site**: https://pyramid.82dk.net

### How It Works
1. Players take a screenshot of a base inventory tooltip from Foxhole
2. Paste it into the web interface
3. fir's ML model recognizes items and quantities (not maintained in this fork)
4. Pyramid UI displays what needs to be supplied, prioritized by importance

**Development focus**: This fork primarily develops the pyramid UI/UX. The underlying ML/OCR functionality is from the upstream fir project.

## Tech Stack

### Frontend (Primary Development Area)
- **Vanilla JavaScript**: ES6 modules, no framework
- **HTML/CSS**: Inline styles in index.html
- **Dependencies** (loaded via CDN):
  - TensorFlow.js 4.19.0 - Runs image recognition models
  - Tesseract.js 3.0.2 - OCR for quantities
  - html2canvas 1.4.0 - Screenshot export
  - Google APIs - Optional Sheets integration

### ML/Training Pipeline (Rarely Modified)
Inherited from upstream fir project:
- `catalog/` - Node.js scripts for parsing game data
- `trainer/` - Python/TensorFlow model training
- `build.sh` - Full training pipeline

### Deployment
- Static site: `python3 -m http.server` for local dev
- Production: https://pyramid.82dk.net

## Project Structure

```
fir/
├── index.html              # Main Pyramid Report interface
├── build.sh                # Full training pipeline script
├── includes/               # Frontend JS modules (main.js, frontend.mjs, screenshot.mjs, ocr.mjs)
├── foxhole/[version]/      # Game version data (catalog.json, classifier/, icons/)
├── catalog/                # Catalog parsing and training data generation (Node.js)
├── trainer/                # ML model training (Python/TensorFlow)
└── spec/                   # Jasmine test suite
```

## Development Workflow

### Running Locally
```bash
cd fir
python3 -m http.server
# Visit http://localhost:8000
```

### Game Version Management
- Default version: `naval-57` (set in `includes/main.js`)
- Supported versions in `VALID_VERSIONS` set
- URL parameter: `?v=naval-56` to test different versions
- Version data in `foxhole/[version]/` (catalog.json, classifier/, icons/)

## Key Features

### Pyramid Display
- **Items are prioritized**: Higher items = higher priority
- **Color coding**:
  - Dark red: 0-25% stocked (depleted)
  - Dark orange: 25-50% (low)
  - Gold: 50-100% (medium)
  - Dark green: 100%+ (full)
- **Display formats**:
  - Crates Required (default)
  - Items Required
  - Current Items
  - Current / Desired

### Pyramid Definitions
- **FMAT**: Full Military Arsenal Template
- **FMAT Basic**: Simplified version

### Special Features
- **Filter full items**: Hide 100%+ stocked items
- **82DK copy**: Custom format for 82DK clan
- **Snow indicator**: Items only needed when snowing (e.g., Caoivish Parka)
- **Multiple screenshot support**: Upload multiple screenshots to aggregate data

## Recognition System (Inherited from fir)

The image recognition is handled by upstream fir code:
- **Icon recognition**: TensorFlow.js model (64x64 icons) → `foxhole/[version]/classifier/`
- **Quantity OCR**: Tesseract.js → `includes/ocr.mjs`
- **Training**: `build.sh` pipeline (rarely used) - requires game data files, Python, Node.js

Recognition issues are usually upstream fir problems, not pyramid UI bugs.

## Common Development Tasks

### Modifying the Pyramid UI
- **Pyramid definitions**: `includes/frontend.mjs` - FMAT, FMAT Basic
- **Layout/styles**: Inline CSS in `index.html` (lines 85-210)
- **Item display**: Color coding, filtering, format options
- **Custom features**: 82DK copy button, snow indicators

### Key Files for UI Work
- `includes/frontend.mjs` - Main UI logic, pyramid rendering, event handling
- `includes/screenshot.mjs` - Screenshot processing, multi-upload
- `index.html` - HTML structure and inline styles
- `includes/dk.mjs` - 82DK-specific integrations

### Testing
- Manual: Upload screenshots via local dev server
- Automated: `specs.html` (Jasmine tests)
- Debug mode: `debug.html` for isolated testing

### Adding a New Game Version
1. Add version to `VALID_VERSIONS` in `includes/main.js`
2. Get trained model from upstream fir (or contact maintainer)
3. Place in `foxhole/[version]/` directory
4. Test with version parameter: `?v=new-version`

## Important Notes

### Development Constraints
- **No build system**: Direct file editing, no bundler/transpiler
- **ES6 modules**: Modern browsers only
- **Static site**: All resources must be static files
- **CDN dependencies**: TensorFlow.js, Tesseract.js loaded at runtime

### Known Limitations
- Recognition accuracy varies (upstream fir issue, not UI bug)
- High resolution screenshots work best (1080p+)
- Icon mods can affect recognition
- Some items excluded from pyramids (too niche or don't fit in Dunne trucks)

## Contributing

Issues and suggestions: https://github.com/Shard/fir/issues

## License

- Original code: MIT License
- Game data/icons: Fair Use only (owned by Siege Camp)

## Quick Reference

### Development
```bash
# Local dev server
python3 -m http.server  # then visit http://localhost:8000

# Run tests
# Open specs.html in browser
```

### CDN Dependencies
- html2canvas 1.4.0 - Screenshot export
- Tesseract.js 3.0.2 - OCR
- TensorFlow.js 4.19.0 - Model inference
- Google APIs - Sheets integration

## Design Philosophy

### Vanilla JS + Static Deployment
- No build system, no framework - keeps it simple
- Easy to deploy (just static files)
- Fast load times
- All processing in-browser (privacy - screenshots never leave user's machine)

### Multiple Game Versions
- Game updates change items/icons, requires new models
- Each version in `foxhole/[version]/` with its own classifier
- Versions rarely added (requires upstream fir training pipeline)

## Development Tips

1. **Test with real screenshots**: Use actual Foxhole screenshots, recognition quality varies
2. **UI changes only**: Avoid modifying recognition code (`screenshot.mjs`, `ocr.mjs`) - that's upstream fir
3. **Pyramid definitions**: Main customization point is `includes/frontend.mjs`
4. **Icon mods**: Different players use different icon packs, test accordingly
5. **Mobile/responsive**: Consider mobile screenshot uploads
