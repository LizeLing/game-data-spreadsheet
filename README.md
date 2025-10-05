# Game Data Spreadsheet

A powerful React-based spreadsheet application specialized for game data management, with Excel-like functionality including formulas, conditional formatting, and data validation.

## Features

- **Excel-like Spreadsheet**: AG Grid-based interface with cell editing, formatting, and formulas
- **Formula Engine**: 23+ built-in functions (SUM, AVERAGE, IF, CONCATENATE, etc.)
- **Data Validation**: Real-time validation with visual error/warning indicators
- **Conditional Formatting**: Priority-based cell styling
- **Import/Export**: Support for CSV, JSON, and XLSX formats
- **Auto-save**: IndexedDB-based persistence with 2-second debounce
- **Game Templates**: Pre-configured templates for characters, items, enemies, etc.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server (http://localhost:3000)
npm run dev

# Build for production
npm run build
```

## Testing

The project uses two independent testing systems:

### Unit Tests (Vitest)
```bash
# Run all unit tests (208 tests)
npm run test:run

# Watch mode (for development)
npm test

# UI mode (browser-based test viewer)
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### E2E Tests (Playwright)
```bash
# Run E2E tests
npm run test:e2e

# UI mode (step-by-step debugging)
npm run test:e2e:ui

# Headed mode (see browser)
npm run test:e2e:headed

# Debug mode
npm run test:e2e:debug
```

### Run All Tests
```bash
# Unit + E2E tests
npm run test:all
```

**Note:** Unit tests and E2E tests are completely separated. `npm run test:run` only runs unit tests (no E2E), and E2E tests are only executed via `npm run test:e2e`.

## Data Validation

Use the built-in validation system to ensure data integrity:

### Toolbar Button
Click the **"✓ 검증"** button in the toolbar or press `Ctrl+Shift+V` to open the validation panel.

### Visual Indicators
- **Red border**: Validation errors
- **Yellow border**: Warnings
- **Tooltip**: Hover to see error messages

### Adding Validation Rules
```typescript
// In column definition
{
  id: 'col-1',
  name: 'HP',
  validation: {
    type: 'range',
    params: { min: 0, max: 1000 },
    message: 'HP must be between 0 and 1000'
  }
}
```

## Cell Selection

### Single Cell Selection
- **Click**: Select a single cell

### Multiple Cell Selection (Range Selection)
- **Click and Drag**: Click on a cell and drag to select a range
- **Shift + Click**: Select from current cell to clicked cell
- **Ctrl + Click**: Add/remove individual cells to selection (multi-range)
- **Click on Row Number**: Select entire row
- **Click on Column Header**: Select entire column
- **Ctrl + A**: Select all cells

### Visual Feedback
- Selected cells are highlighted with a blue background
- Selection borders are shown in blue (2px solid)
- Multiple overlapping selections show darker blue shades

## Keyboard Shortcuts

- `Ctrl+S`: Save spreadsheet
- `Ctrl+Shift+V`: Open validation panel
- `Ctrl+F`: Find and replace
- `Ctrl+C/X/V`: Copy/Cut/Paste
- `Ctrl+Z/Y`: Undo/Redo
- `Ctrl+A`: Select all cells

## Recent Updates

### ✅ Advanced Features Added (2025-10-06)

**Phase 3-4 Implementation Complete:**

#### 1. Conditional Formatting UI
- **ConditionalFormatDialog** with visual rule editor
- Game data presets (Rarity, Stat Ranges, Quality, Status)
- Priority-based formatting rules
- Real-time preview

**Usage:**
```typescript
// Click "🎨 조건부" button in toolbar
// Select preset or create custom rules
// Apply to entire sheet or specific ranges
```

#### 2. Advanced Cell Formatting
- **AdvancedFormatDialog** with comprehensive styling options
- Border styles (individual sides: top/right/bottom/left)
- Font family and size selection (12+ fonts, 8-72pt)
- Number format presets (#,##0.00, 0.0%, $#,##0, etc.)
- Real-time preview

**Toolbar Button:** "⚙️ 고급"

#### 3. Row/Column Insert & Delete
- Insert row/column at selected position
- Delete selected rows/columns
- Smart positioning (after selection or append)
- Full undo/redo support

**New Toolbar Buttons:**
- ➕ 행 / ➖ 행 (Row insert/delete)
- ➕ 열 / ➖ 열 (Column insert/delete)

#### 4. Additional Game Templates (6 New!)
- **Enemy Wave** - Wave-based enemy spawning
- **Drop Table** - Item drop rates and loot
- **Achievement** - Trophy/achievement system
- **Tutorial** - Onboarding steps
- **Season Pass** - Battle pass rewards
- **Gacha Pool** - Gacha/loot box probabilities

**🆕 Auto-populate Sample Data:**
- Templates now automatically create rows with sample data
- If no sample data exists, creates 10 empty rows for quick start
- Fully editable and expandable

#### 5. Game-Specific Formula Functions (4 New!)
- **STAT_SCALE(level, base, growth, formula)** - Stat scaling (linear/exponential/logarithmic/quadratic)
- **DROP_RATE(baseRate, luck, enemyLvl, playerLvl)** - Drop rate calculation with luck bonus
- **EXP_CURVE(level, baseExp, multiplier, exponent)** - Experience curve calculation
- **GACHA_RATE(rarity, pityCounter, baseRate, threshold)** - Gacha rates with pity system

**Examples:**
```typescript
=STAT_SCALE(10, 100, 10, "exponential") // → 235.79
=DROP_RATE(10, 50, 20, 25) // → 17.5% (with luck and level bonus)
=EXP_CURVE(10, 100, 1.5, 1.5) // → 1837
=GACHA_RATE(6, 89, 0.6, 90) // → 100% (pity reached)
```

---

### ✅ Data Validation UI (2025-10-06)

**New Features Implemented:**
- ✓ ValidationPanel dialog with real-time validation
- ✓ Toolbar integration with keyboard shortcut (Ctrl+Shift+V)
- ✓ Visual cell validation indicators (red/yellow borders)
- ✓ Error/warning tooltips on hover
- ✓ Click-to-navigate validation errors
- ✓ Enhanced game templates with validation rules

**Files Modified:**
- `/src/components/toolbar/Toolbar.tsx` - Added validation button and inline ValidationPanel component
- `/src/components/spreadsheet/SpreadsheetGrid.tsx` - Added visual validation indicators
- `/src/utils/gameTemplates.ts` - Enhanced with validation rules for HP, MP, Attack, Defense
- `/README.md` - Updated with validation documentation

**Usage:**
```typescript
// 1. Click "✓ 검증" button in toolbar or press Ctrl+Shift+V
// 2. View validation summary (errors/warnings count)
// 3. Click any error to navigate to the cell
// 4. Hover over cells with red/yellow borders to see error messages
```

---

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
