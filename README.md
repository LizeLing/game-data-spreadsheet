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

## Keyboard Shortcuts

- `Ctrl+S`: Save spreadsheet
- `Ctrl+Shift+V`: Open validation panel
- `Ctrl+F`: Find and replace
- `Ctrl+C/X/V`: Copy/Cut/Paste
- `Ctrl+Z/Y`: Undo/Redo

## Recent Updates

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
