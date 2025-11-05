# CLAUDE.md - Foxhole Pyramid Report

## Project Overview

**Foxhole Pyramid Report** is a web-based tool that analyzes screenshots from the game [Foxhole](https://www.foxholegame.com/) to help players determine supply needs for bases. The tool uses machine learning (image recognition) and OCR to extract inventory data from in-game base tooltips and displays supply priorities using a "Logi Pyramid" visualization.

**Forked from**: [Foxhole Inventory Report](https://github.com/GICodeWarrior/fir) - This is a UI wrapper around their excellent image recognition work.

**Live site**: https://pyramid.82dk.net

### How It Works
1. Players hover over a base on the in-game map
2. Take a screenshot of the inventory tooltip
3. Paste it into the web interface
4. ML model recognizes items and quantities
5. Tool displays what needs to be supplied using the Logi Pyramid system

## Tech Stack

### Frontend
- **HTML/CSS/JavaScript**: Vanilla ES6 modules, no framework
- **TensorFlow.js**: For running trained image classification models in-browser
- **Tesseract.js**: OCR for text extraction from screenshots
- **html2canvas**: For screenshot rendering/export
- **Google APIs**: Optional Google Sheets integration

### Backend/Training
- **Python**: Model training with TensorFlow/Keras
  - Uses `pipenv` for dependency management
  - Training script: `trainer/train.py`
- **Node.js**: Catalog parsing and training data generation
  - Scripts in `catalog/` directory

### Deployment
- Static site - no server required
- Development: `python3 -m http.server`
- Production: Deployed to https://pyramid.82dk.net

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

### Running the Development Server
```bash
cd fir
python3 -m http.server
# Visit http://localhost:8000
```

### Full Build Pipeline
The `build.sh` script runs the complete training pipeline:

1. **Parse Catalog**: Extract item data from game files
2. **Generate Training Data**: Create training images with variations
3. **Save Icon Catalog**: Copy reference icons
4. **Build Classifier**: Train TensorFlow model and convert to TensorFlow.js

```bash
./build.sh /path/to/foxhole/data/files
```

**Requirements for build.sh**:
- Node.js + npm (for catalog parsing)
- Python 3 + pipenv (for model training)
- TensorFlow with GPU support (optional but recommended)
- ImageMagick (for image processing)
- optipng (for PNG optimization)

### Game Version Management
- Current default version: `naval-57` (set in `includes/main.js`)
- Supported versions listed in `VALID_VERSIONS` set
- Version can be selected via URL parameter: `?v=naval-56`

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

## Machine Learning Details

### Icon Classification Model
- **Input**: 64x64 pixel game item icons
- **Training**: TensorFlow/Keras CNN
- **Output**: TensorFlow.js graph model
- **Classes**: Item names from catalog.json
- **Supports icon mods**: Tested with Sentsu's UI Label Icons and Vanilla Item Icons

### Quantity Recognition
- **Input**: Cropped quantity text from tooltips
- **Method**: OCR (Tesseract.js) + classifier
- **Classes**: Defined in `includes/quantities/class_names.json`

### Training Data Generation
- Multiple variations per item:
  - Different icon packs
  - Rotations
  - Color variations
  - Noise injection
- Parallel processing using all CPU cores
- Output: JPG training images (quality 89)

## Common Tasks for AI Assistants

### Adding Support for a New Game Version
1. Update `VALID_VERSIONS` set in `includes/main.js`
2. Run build.sh with new version name
3. Ensure game data files are available for that version

### Modifying the Pyramid
1. Edit pyramid definitions in frontend code
2. Definitions likely stored in `includes/frontend.mjs` or data files
3. Test with sample screenshots

### Debugging Recognition Issues
1. Use `debug.html` to test individual screenshots
2. Check `specs.html` for test suite results
3. Look at training data quality in `catalog/training/`
4. Retrain model if necessary with more/better samples

### Updating Item Catalog
1. Get latest Foxhole game data files
2. Run `catalog/parse.js` to generate new catalog.json
3. Regenerate training data
4. Retrain classifier model

### Frontend Changes
- Main UI logic: `includes/frontend.mjs`
- Screenshot handling: `includes/screenshot.mjs`
- OCR logic: `includes/ocr.mjs`
- Styles are inline in `index.html` (lines 85-210)
- Consider extracting styles to separate CSS file for maintainability

### Testing
- Test framework: Jasmine 5.1.1
- Test specs: `spec/screenshots.js`
- Run tests: Open `specs.html` in browser

## Important Notes

### For Code Changes
- **No build system**: Direct file editing, no bundler/transpiler
- **Browser compatibility**: Modern browsers only (ES6 modules)
- **Static deployment**: All resources must be static files
- **Large model files**: Classifier models can be several MB

### For Model Training
- **GPU recommended**: Training can take significant time on CPU
- **Data quality critical**: Screenshot quality affects recognition accuracy
- **Icon mod support**: Model needs training data from all supported icon packs
- **Version-specific**: Each game version needs its own trained model

### Known Issues/Limitations
- Recognition accuracy depends on screenshot quality
- High resolution recommended (1080p+)
- Icon mods can affect recognition
- Some items intentionally excluded (too niche, don't fit in transport)
- Tight crops can reduce accuracy - leave space around tooltip

## Contributing

Issues and suggestions: https://github.com/Shard/fir/issues

## License

- Original code: MIT License
- Game data/icons: Fair Use only (owned by Siege Camp)

## External Dependencies

### CDN Resources (loaded at runtime)
- html2canvas 1.4.0
- Tesseract.js 3.0.2
- TensorFlow.js 4.19.0
- Google APIs (for Sheets integration)

### Python Dependencies (training)
See `trainer/Pipfile`:
- tensorflow
- tensorflowjs
- nvidia-cudnn-cu12 (for GPU)
- pillow (image processing)

### Node Dependencies (catalog)
See `catalog/package.json` for parsing dependencies

## Useful Commands

```bash
# Development server
python3 -m http.server

# Full rebuild (requires game data)
./build.sh /path/to/foxhole/data

# Parse catalog only
cd catalog && npm install && node parse.js <game_data_path> ../foxhole/naval-57/catalog.json

# Generate training images only
cd catalog && node generate_training.js <game_data_path> ../foxhole/naval-57/catalog.json training 0 1

# Train model only
cd trainer && pipenv install && pipenv run python train.py 50 rgb 0.10 0.005 ../catalog/training/

# Run tests
# Open specs.html in browser
```

## Architecture Decisions

### Why No Framework?
- Keep it simple and lightweight
- Minimize dependencies
- Easy to deploy as static site
- Fast load times

### Why TensorFlow.js?
- Run ML models entirely in-browser
- No server infrastructure needed
- Works offline after initial load
- Privacy - screenshots never leave user's browser

### Why Multiple Game Versions?
- Game updates change item sets and icons
- Historical support for older game versions
- Each version needs independent trained model
