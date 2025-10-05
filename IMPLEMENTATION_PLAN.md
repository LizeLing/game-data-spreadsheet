# 미구현 기능 구현 계획

## 📋 목차
1. [우선순위 및 로드맵](#우선순위-및-로드맵)
2. [Phase 1: 핵심 기능 강화](#phase-1-핵심-기능-강화)
3. [Phase 2: 고급 기능](#phase-2-고급-기능)
4. [Phase 3: 테스팅 인프라](#phase-3-테스팅-인프라)
5. [Phase 4: 협업 기능](#phase-4-협업-기능)

---

## 우선순위 및 로드맵

### 우선순위 매트릭스

| Priority | Feature | Impact | Effort | Value/Effort |
|----------|---------|--------|--------|--------------|
| P0 | Formula Calculation Engine | High | Medium | High |
| P0 | IndexedDB Persistence | High | Low | Very High |
| P0 | Advanced Formatting | Medium | Medium | Medium |
| P1 | More Game Templates | Medium | Low | High |
| P1 | Excel Export (.xlsx) | Medium | Low | High |
| P2 | Unit Tests (Vitest) | High | High | Medium |
| P2 | E2E Tests (Playwright) | High | High | Medium |
| P3 | Collaborative Editing | Very High | Very High | Medium |

### 구현 순서

**Week 1-2**: Phase 1 (P0 Features)
**Week 3-4**: Phase 2 (P1 Features)
**Week 5-6**: Phase 3 (P2 Testing)
**Week 7-10**: Phase 4 (P3 Collaborative)

---

## Phase 1: 핵심 기능 강화

### 1.1 Formula Calculation Engine ⭐⭐⭐

#### 목표
Excel과 유사한 수식 계산 기능 구현

#### 필요 패키지
```json
{
  "dependencies": {
    "formulajs": "^1.0.8",
    "mathjs": "^12.0.0"
  }
}
```

#### 구현 단계

**Step 1: 수식 파서 구현**
```
파일: src/services/formula/formulaParser.ts
- 수식 토큰화 (tokenize)
- 수식 구문 분석 (parse)
- 셀 참조 추출 (extractCellReferences)
```

**Step 2: 수식 평가 엔진**
```
파일: src/services/formula/formulaEvaluator.ts
- 기본 연산자 (+, -, *, /, ^)
- 셀 참조 해석 (A1, B2:C5)
- 순환 참조 감지
- 의존성 그래프 구축
```

**Step 3: 내장 함수 라이브러리**
```
파일: src/services/formula/formulaFunctions.ts

수학 함수:
- SUM(range)
- AVERAGE(range)
- MIN/MAX(range)
- COUNT/COUNTA
- ROUND/CEILING/FLOOR

논리 함수:
- IF(condition, trueValue, falseValue)
- AND/OR/NOT

텍스트 함수:
- CONCATENATE
- LEFT/RIGHT/MID
- UPPER/LOWER

게임 데이터 전용:
- DAMAGE_CALC(attack, defense)
- STAT_TOTAL(row)
- RARITY_BONUS(rarity)
```

**Step 4: 수식 캐싱 및 최적화**
```
파일: src/services/formula/formulaCache.ts
- 계산 결과 캐싱
- 의존성 기반 무효화
- 배치 재계산
```

**Step 5: UI 통합**
```
파일: src/components/spreadsheet/FormulaBar.tsx
- 수식 입력 바
- 수식 자동완성
- 에러 표시
```

#### 구현 예시
```typescript
// src/services/formula/formulaParser.ts
export interface FormulaAST {
  type: 'function' | 'operator' | 'cell' | 'range' | 'literal';
  value: string | number;
  children?: FormulaAST[];
}

export class FormulaParser {
  parse(formula: string): FormulaAST {
    // =SUM(A1:A10) -> { type: 'function', value: 'SUM', children: [...] }
  }

  extractReferences(ast: FormulaAST): string[] {
    // Extract all cell references for dependency tracking
  }
}

// src/services/formula/formulaEvaluator.ts
export class FormulaEvaluator {
  private cache: Map<string, CellValue>;
  private dependencies: Map<string, Set<string>>;

  evaluate(cellId: string, formula: string, sheet: Sheet): CellValue {
    const ast = this.parser.parse(formula);
    return this.evaluateAST(ast, sheet);
  }

  private detectCircularReference(cellId: string, refs: string[]): boolean {
    // Use DFS to detect cycles
  }
}
```

#### 테스트 시나리오
```typescript
describe('FormulaEvaluator', () => {
  it('should calculate SUM correctly', () => {
    // =SUM(A1:A3) where A1=1, A2=2, A3=3
    expect(result).toBe(6);
  });

  it('should detect circular references', () => {
    // A1 = =B1, B1 = =A1
    expect(() => evaluate()).toThrow('Circular reference');
  });

  it('should update dependent cells', () => {
    // Change A1, verify B1 (=A1*2) updates
  });
});
```

---

### 1.2 IndexedDB Persistence ⭐⭐⭐

#### 목표
브라우저 로컬 스토리지에 자동 저장 및 복구

#### 필요 패키지
```json
{
  "dependencies": {
    "idb": "^8.0.0"
  }
}
```

#### 구현 단계

**Step 1: IndexedDB 스키마 설계**
```typescript
// src/services/persistence/dbSchema.ts
interface SpreadsheetDB {
  spreadsheets: {
    key: string; // spreadsheet ID
    value: Spreadsheet;
  };
  history: {
    key: string; // spreadsheet ID + timestamp
    value: HistoryEntry;
  };
  autosave: {
    key: string; // spreadsheet ID
    value: { timestamp: Date; data: Spreadsheet };
  };
}
```

**Step 2: DB 래퍼 구현**
```typescript
// src/services/persistence/indexedDBService.ts
export class IndexedDBService {
  async saveSpreadsheet(id: string, data: Spreadsheet): Promise<void>
  async loadSpreadsheet(id: string): Promise<Spreadsheet | null>
  async listSpreadsheets(): Promise<SpreadsheetMetadata[]>
  async deleteSpreadsheet(id: string): Promise<void>
  async autoSave(id: string, data: Spreadsheet): Promise<void>
  async getAutoSaveBackup(id: string): Promise<Spreadsheet | null>
}
```

**Step 3: 자동 저장 미들웨어**
```typescript
// src/stores/spreadsheetStore.ts 수정
import { IndexedDBService } from '@services/persistence/indexedDBService';

const db = new IndexedDBService();

export const useSpreadsheetStore = create<SpreadsheetState>()(
  immer((set, get) => ({
    // ... existing state

    // Auto-save wrapper
    _autoSave: debounce(async () => {
      const state = get();
      await db.autoSave(state.activeSpreadsheetId, state);
    }, 2000),

    // Wrap all mutations
    updateCell: (...args) => {
      set((state) => {
        // ... existing logic
      });
      get()._autoSave();
    },
  }))
);
```

**Step 4: 복구 UI**
```typescript
// src/components/recovery/RecoveryDialog.tsx
export const RecoveryDialog = () => {
  const [backups, setBackups] = useState<AutoSaveBackup[]>([]);

  useEffect(() => {
    loadAvailableBackups();
  }, []);

  const handleRestore = async (backupId: string) => {
    const data = await db.getAutoSaveBackup(backupId);
    // Restore to store
  };

  return (
    <Dialog>
      <h2>자동 저장된 파일 복구</h2>
      {backups.map(backup => (
        <BackupItem
          key={backup.id}
          timestamp={backup.timestamp}
          onRestore={() => handleRestore(backup.id)}
        />
      ))}
    </Dialog>
  );
};
```

#### 구현 상세

```typescript
// src/services/persistence/indexedDBService.ts
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface SpreadsheetDB extends DBSchema {
  spreadsheets: {
    key: string;
    value: {
      id: string;
      name: string;
      data: Spreadsheet;
      createdAt: Date;
      updatedAt: Date;
    };
  };
  autosaves: {
    key: string;
    value: {
      spreadsheetId: string;
      data: Spreadsheet;
      timestamp: Date;
    };
  };
}

export class IndexedDBService {
  private db: IDBPDatabase<SpreadsheetDB> | null = null;

  async init() {
    this.db = await openDB<SpreadsheetDB>('game-spreadsheet', 1, {
      upgrade(db) {
        db.createObjectStore('spreadsheets', { keyPath: 'id' });
        db.createObjectStore('autosaves', { keyPath: 'spreadsheetId' });
      },
    });
  }

  async save(spreadsheet: Spreadsheet) {
    await this.db?.put('spreadsheets', {
      id: spreadsheet.id,
      name: spreadsheet.name,
      data: spreadsheet,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async autoSave(spreadsheetId: string, data: Spreadsheet) {
    await this.db?.put('autosaves', {
      spreadsheetId,
      data,
      timestamp: new Date(),
    });
  }
}
```

---

### 1.3 Advanced Formatting ⭐⭐

#### 목표
셀 스타일링 및 조건부 서식

#### 필요 패키지
```json
{
  "dependencies": {
    "@tiptap/core": "^2.1.0",
    "tinycolor2": "^1.6.0"
  },
  "devDependencies": {
    "@types/tinycolor2": "^1.4.6"
  }
}
```

#### 구현 단계

**Step 1: 스타일 데이터 구조 확장**
```typescript
// src/types/spreadsheet.ts 수정
export interface CellStyle {
  // Font
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold' | 'bolder';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline' | 'line-through';

  // Color
  color?: string; // text color
  backgroundColor?: string;

  // Alignment
  textAlign?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';

  // Border
  border?: {
    top?: BorderStyle;
    right?: BorderStyle;
    bottom?: BorderStyle;
    left?: BorderStyle;
  };

  // Number format
  numberFormat?: string; // e.g., "#,##0.00", "0.0%"
}

interface BorderStyle {
  width: number;
  style: 'solid' | 'dashed' | 'dotted';
  color: string;
}

export interface ConditionalFormat {
  id: string;
  condition: {
    type: 'value' | 'formula' | 'text' | 'date';
    operator: 'equals' | 'greaterThan' | 'lessThan' | 'between' | 'contains';
    value: CellValue | CellValue[];
  };
  style: CellStyle;
  priority: number;
}
```

**Step 2: 포맷팅 툴바**
```typescript
// src/components/toolbar/FormattingToolbar.tsx
export const FormattingToolbar = () => {
  const selection = useSpreadsheetStore((state) => state.selection);
  const applyStyle = useSpreadsheetStore((state) => state.applyCellStyle);

  const handleBold = () => {
    applyStyle(selection, { fontWeight: 'bold' });
  };

  const handleColorChange = (color: string) => {
    applyStyle(selection, { color });
  };

  return (
    <div className="formatting-toolbar">
      <ButtonGroup>
        <FormatButton icon="bold" onClick={handleBold} />
        <FormatButton icon="italic" onClick={() => applyStyle(selection, { fontStyle: 'italic' })} />
        <FormatButton icon="underline" onClick={() => applyStyle(selection, { textDecoration: 'underline' })} />
      </ButtonGroup>

      <ColorPicker value={currentColor} onChange={handleColorChange} />
      <BackgroundColorPicker value={currentBgColor} onChange={handleBgColorChange} />

      <NumberFormatSelector />
    </div>
  );
};
```

**Step 3: AG Grid 셀 렌더러**
```typescript
// src/components/spreadsheet/CustomCellRenderer.tsx
export const CustomCellRenderer = (props: ICellRendererParams) => {
  const cell = props.data.cells[props.colDef.field!];
  const style = cell?.style || {};

  const cellStyle: React.CSSProperties = {
    fontWeight: style.fontWeight,
    fontStyle: style.fontStyle,
    textDecoration: style.textDecoration,
    color: style.color,
    backgroundColor: style.backgroundColor,
    textAlign: style.textAlign,
    // Apply conditional formatting
    ...(getConditionalStyle(cell)),
  };

  return (
    <div style={cellStyle}>
      {formatCellValue(cell.value, style.numberFormat)}
    </div>
  );
};

function getConditionalStyle(cell: Cell): React.CSSProperties {
  const formats = cell.conditionalFormats || [];
  const matched = formats
    .sort((a, b) => a.priority - b.priority)
    .find(format => evaluateCondition(cell.value, format.condition));

  return matched ? matched.style : {};
}
```

**Step 4: 조건부 서식 설정 UI**
```typescript
// src/components/formatting/ConditionalFormatDialog.tsx
export const ConditionalFormatDialog = () => {
  const [rules, setRules] = useState<ConditionalFormat[]>([]);

  const addRule = () => {
    setRules([...rules, {
      id: nanoid(),
      condition: {
        type: 'value',
        operator: 'greaterThan',
        value: 0,
      },
      style: {
        backgroundColor: '#ff0000',
        color: '#ffffff',
      },
      priority: rules.length,
    }]);
  };

  return (
    <Dialog>
      <h2>조건부 서식</h2>
      {rules.map(rule => (
        <RuleEditor
          key={rule.id}
          rule={rule}
          onChange={(updated) => updateRule(rule.id, updated)}
          onDelete={() => deleteRule(rule.id)}
        />
      ))}
      <Button onClick={addRule}>규칙 추가</Button>
    </Dialog>
  );
};
```

#### 게임 데이터 전용 조건부 서식

```typescript
// 게임 데이터에 특화된 프리셋
const GAME_DATA_PRESETS = {
  rarityColors: {
    common: '#9e9e9e',
    uncommon: '#4caf50',
    rare: '#2196f3',
    epic: '#9c27b0',
    legendary: '#ff9800',
    mythic: '#f44336',
  },

  statRanges: {
    veryLow: { max: 20, color: '#f44336' },
    low: { max: 40, color: '#ff9800' },
    medium: { max: 60, color: '#ffeb3b' },
    high: { max: 80, color: '#4caf50' },
    veryHigh: { max: 100, color: '#2196f3' },
  },

  levelTiers: {
    beginner: { max: 10, bg: '#e3f2fd' },
    intermediate: { max: 30, bg: '#fff3e0' },
    advanced: { max: 50, bg: '#fce4ec' },
    expert: { max: 100, bg: '#f3e5f5' },
  },
};

// 자동 적용 함수
export const applyGameDataFormatting = (sheet: Sheet, templateType: GameDataTemplateType) => {
  switch (templateType) {
    case 'item':
      applyRarityFormatting(sheet, 'rarity');
      applyPriceFormatting(sheet, 'buyPrice', 'sellPrice');
      break;
    case 'character':
      applyLevelFormatting(sheet, 'level');
      applyStatFormatting(sheet, ['strength', 'agility', 'intelligence']);
      break;
  }
};
```

---

## Phase 2: 고급 기능

### 2.1 More Game Templates ⭐⭐

#### 새로운 템플릿 목록

**Enemy Template**
```typescript
// src/utils/gameTemplates/enemyTemplate.ts
export const getEnemyTemplate = (): GameDataTemplate => ({
  type: 'enemy',
  name: 'Enemy Data',
  columns: [
    { id: 'id', name: 'ID', type: 'text', width: 100 },
    { id: 'name', name: 'Name', type: 'text', width: 150 },
    { id: 'level', name: 'Level', type: 'number', width: 80 },
    { id: 'type', name: 'Type', type: 'select', width: 120,
      options: ['normal', 'elite', 'boss', 'miniboss'] },
    { id: 'hp', name: 'HP', type: 'number', width: 100 },
    { id: 'attack', name: 'Attack', type: 'number', width: 100 },
    { id: 'defense', name: 'Defense', type: 'number', width: 100 },
    { id: 'speed', name: 'Speed', type: 'number', width: 80 },
    { id: 'exp', name: 'EXP', type: 'number', width: 100 },
    { id: 'goldDrop', name: 'Gold Drop', type: 'number', width: 100 },
    { id: 'itemDrops', name: 'Item Drops', type: 'text', width: 200 },
    { id: 'abilities', name: 'Abilities', type: 'text', width: 200 },
    { id: 'weaknesses', name: 'Weaknesses', type: 'text', width: 150 },
    { id: 'resistances', name: 'Resistances', type: 'text', width: 150 },
  ],
  validation: {
    hp: { type: 'range', params: { min: 1, max: 1000000 } },
    level: { type: 'range', params: { min: 1, max: 100 } },
  },
});
```

**Level/Stage Template**
```typescript
export const getLevelTemplate = (): GameDataTemplate => ({
  type: 'level',
  name: 'Level/Stage Data',
  columns: [
    { id: 'id', name: 'Level ID', type: 'text', width: 100 },
    { id: 'name', name: 'Level Name', type: 'text', width: 180 },
    { id: 'world', name: 'World', type: 'select', width: 120,
      options: ['grassland', 'desert', 'snow', 'volcano', 'dungeon'] },
    { id: 'recommendedLevel', name: 'Rec. Level', type: 'number', width: 100 },
    { id: 'enemies', name: 'Enemies', type: 'text', width: 200 },
    { id: 'bosses', name: 'Bosses', type: 'text', width: 150 },
    { id: 'objectives', name: 'Objectives', type: 'text', width: 250 },
    { id: 'rewards', name: 'Rewards', type: 'text', width: 200 },
    { id: 'unlockCondition', name: 'Unlock Condition', type: 'text', width: 200 },
  ],
});
```

**Dialogue Template**
```typescript
export const getDialogueTemplate = (): GameDataTemplate => ({
  type: 'dialogue',
  name: 'Dialogue/Narrative Data',
  columns: [
    { id: 'id', name: 'Line ID', type: 'text', width: 100 },
    { id: 'character', name: 'Character', type: 'text', width: 120 },
    { id: 'emotion', name: 'Emotion', type: 'select', width: 100,
      options: ['neutral', 'happy', 'sad', 'angry', 'surprised', 'thinking'] },
    { id: 'text', name: 'Dialogue Text', type: 'text', width: 400 },
    { id: 'translationKey', name: 'Translation Key', type: 'text', width: 150 },
    { id: 'voiceFile', name: 'Voice File', type: 'text', width: 150 },
    { id: 'nextLine', name: 'Next Line', type: 'text', width: 100 },
    { id: 'choices', name: 'Player Choices', type: 'text', width: 250 },
  ],
});
```

**Localization Template**
```typescript
export const getLocalizationTemplate = (): GameDataTemplate => ({
  type: 'localization',
  name: 'Localization/Translation',
  columns: [
    { id: 'key', name: 'String Key', type: 'text', width: 150 },
    { id: 'en', name: 'English', type: 'text', width: 250 },
    { id: 'ko', name: '한국어', type: 'text', width: 250 },
    { id: 'ja', name: '日本語', type: 'text', width: 250 },
    { id: 'zh', name: '中文', type: 'text', width: 250 },
    { id: 'context', name: 'Context', type: 'text', width: 200 },
    { id: 'category', name: 'Category', type: 'select', width: 120,
      options: ['ui', 'item', 'quest', 'dialogue', 'tutorial'] },
  ],
});
```

**Stat Progression/Balance Template**
```typescript
export const getStatProgressionTemplate = (): GameDataTemplate => ({
  type: 'stat_progression',
  name: 'Stat Progression Table',
  columns: [
    { id: 'level', name: 'Level', type: 'number', width: 80 },
    { id: 'expRequired', name: 'EXP Required', type: 'formula', width: 120,
      defaultFormula: '=100*POWER(A2,1.5)' },
    { id: 'hp', name: 'HP', type: 'formula', width: 100,
      defaultFormula: '=50+10*A2' },
    { id: 'attack', name: 'Attack', type: 'formula', width: 100,
      defaultFormula: '=5+2*A2' },
    { id: 'defense', name: 'Defense', type: 'formula', width: 100,
      defaultFormula: '=3+1.5*A2' },
    { id: 'skillPoints', name: 'Skill Points', type: 'number', width: 100 },
  ],
  initialRows: 100, // 레벨 1-100
});
```

#### 템플릿 관리 UI

```typescript
// src/components/templates/TemplateGallery.tsx
export const TemplateGallery = () => {
  const templates = [
    { type: 'character', icon: '👤', name: 'Character', color: 'blue' },
    { type: 'item', icon: '⚔️', name: 'Item', color: 'purple' },
    { type: 'skill', icon: '✨', name: 'Skill', color: 'green' },
    { type: 'quest', icon: '📜', name: 'Quest', color: 'yellow' },
    { type: 'enemy', icon: '👹', name: 'Enemy', color: 'red' },
    { type: 'level', icon: '🗺️', name: 'Level/Stage', color: 'teal' },
    { type: 'dialogue', icon: '💬', name: 'Dialogue', color: 'pink' },
    { type: 'localization', icon: '🌐', name: 'Localization', color: 'indigo' },
    { type: 'stat_progression', icon: '📊', name: 'Stat Progression', color: 'orange' },
  ];

  return (
    <div className="grid grid-cols-3 gap-4 p-6">
      {templates.map(template => (
        <TemplateCard
          key={template.type}
          icon={template.icon}
          name={template.name}
          color={template.color}
          onClick={() => createFromTemplate(template.type)}
        />
      ))}
    </div>
  );
};
```

---

### 2.2 Excel Export (.xlsx) ⭐⭐

#### 필요 패키지
```json
{
  "dependencies": {
    "xlsx": "^0.18.5" // (already installed)
  }
}
```

#### 구현

```typescript
// src/services/dataExport/xlsxExporter.ts
import * as XLSX from 'xlsx';
import type { Sheet } from '@types';

export interface XLSXExportOptions {
  includeFormatting?: boolean;
  sheetName?: string;
  multipleSheets?: boolean;
}

export const exportToXLSX = (
  sheets: Sheet[],
  filename: string,
  options: XLSXExportOptions = {}
): void => {
  const { includeFormatting = true, multipleSheets = true } = options;

  // Create workbook
  const workbook = XLSX.utils.book_new();

  sheets.forEach((sheet) => {
    // Convert sheet data to worksheet
    const worksheetData: any[][] = [];

    // Add headers
    worksheetData.push(sheet.columns.map(col => col.name));

    // Add data rows
    sheet.rows.forEach(row => {
      const rowData: any[] = [];
      sheet.columns.forEach(col => {
        const cell = row.cells[col.id];
        rowData.push(cell?.value ?? '');
      });
      worksheetData.push(rowData);
    });

    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Apply formatting if requested
    if (includeFormatting) {
      applyXLSXFormatting(worksheet, sheet);
    }

    // Set column widths
    worksheet['!cols'] = sheet.columns.map(col => ({
      wch: Math.floor(col.width / 8),
    }));

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      sheet.name.substring(0, 31) // Excel sheet name limit
    );
  });

  // Write file
  XLSX.writeFile(workbook, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
};

function applyXLSXFormatting(worksheet: XLSX.WorkSheet, sheet: Sheet) {
  sheet.rows.forEach((row, rowIdx) => {
    sheet.columns.forEach((col, colIdx) => {
      const cell = row.cells[col.id];
      if (!cell?.style) return;

      const cellAddress = XLSX.utils.encode_cell({ r: rowIdx + 1, c: colIdx });
      const xlsxCell = worksheet[cellAddress];

      if (xlsxCell) {
        xlsxCell.s = {
          font: {
            bold: cell.style.fontWeight === 'bold',
            italic: cell.style.fontStyle === 'italic',
            color: { rgb: cell.style.color?.replace('#', '') },
          },
          fill: {
            fgColor: { rgb: cell.style.backgroundColor?.replace('#', '') },
          },
          alignment: {
            horizontal: cell.style.textAlign,
            vertical: cell.style.verticalAlign,
          },
        };
      }
    });
  });
}
```

#### Excel Import 개선

```typescript
// src/services/dataImport/xlsxImporter.ts
import * as XLSX from 'xlsx';

export const importFromXLSX = async (
  file: File
): Promise<{ sheets: Sheet[]; success: boolean; error?: string }> => {
  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);

    const sheets: Sheet[] = [];

    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });

      // Convert to internal Sheet format
      const sheet = convertXLSXToSheet(sheetName, jsonData, worksheet);
      sheets.push(sheet);
    });

    return { sheets, success: true };
  } catch (error) {
    return {
      sheets: [],
      success: false,
      error: error instanceof Error ? error.message : 'Import failed',
    };
  }
};

function convertXLSXToSheet(
  name: string,
  data: any[][],
  worksheet: XLSX.WorkSheet
): Sheet {
  // Extract headers, create columns, convert cells with formatting
  // ...
}
```

---

## Phase 3: 테스팅 인프라

### 3.1 Unit Tests with Vitest ⭐⭐

#### 설치
```bash
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

#### 설정
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@types': path.resolve(__dirname, './src/types'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@services': path.resolve(__dirname, './src/services'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@schemas': path.resolve(__dirname, './src/schemas'),
    },
  },
});
```

#### 테스트 구조
```
src/
├── test/
│   ├── setup.ts
│   ├── utils/
│   │   ├── testHelpers.ts
│   │   └── mockData.ts
│   └── __mocks__/
│       └── zustand.ts
├── components/
│   ├── spreadsheet/
│   │   ├── SpreadsheetGrid.tsx
│   │   └── SpreadsheetGrid.test.tsx
├── services/
│   ├── formula/
│   │   ├── formulaEvaluator.ts
│   │   └── formulaEvaluator.test.ts
└── stores/
    ├── spreadsheetStore.ts
    └── spreadsheetStore.test.ts
```

#### 주요 테스트 케이스

**Store Tests**
```typescript
// src/stores/spreadsheetStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSpreadsheetStore } from './spreadsheetStore';

describe('SpreadsheetStore', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useSpreadsheetStore());
    act(() => result.current.reset());
  });

  describe('Sheet Management', () => {
    it('should add a new sheet', () => {
      const { result } = renderHook(() => useSpreadsheetStore());

      act(() => {
        result.current.addSheet('Test Sheet');
      });

      expect(result.current.sheets).toHaveLength(2);
      expect(result.current.sheets[1].name).toBe('Test Sheet');
    });

    it('should delete a sheet', () => {
      const { result } = renderHook(() => useSpreadsheetStore());
      const sheetId = result.current.sheets[0].id;

      act(() => {
        result.current.deleteSheet(sheetId);
      });

      expect(result.current.sheets).toHaveLength(0);
    });
  });

  describe('Cell Operations', () => {
    it('should update cell value', () => {
      const { result } = renderHook(() => useSpreadsheetStore());
      const sheet = result.current.sheets[0];
      const row = sheet.rows[0];
      const col = sheet.columns[0];

      act(() => {
        result.current.updateCell(sheet.id, row.id, col.id, 'New Value');
      });

      const updatedCell = result.current.sheets[0].rows[0].cells[col.id];
      expect(updatedCell.value).toBe('New Value');
    });
  });

  describe('History', () => {
    it('should undo cell update', () => {
      const { result } = renderHook(() => useSpreadsheetStore());
      const sheet = result.current.sheets[0];
      const row = sheet.rows[0];
      const col = sheet.columns[0];
      const originalValue = row.cells[col.id].value;

      act(() => {
        result.current.updateCell(sheet.id, row.id, col.id, 'Modified');
      });

      act(() => {
        result.current.undo();
      });

      const cellAfterUndo = result.current.sheets[0].rows[0].cells[col.id];
      expect(cellAfterUndo.value).toBe(originalValue);
    });
  });
});
```

**Formula Tests**
```typescript
// src/services/formula/formulaEvaluator.test.ts
import { describe, it, expect } from 'vitest';
import { FormulaEvaluator } from './formulaEvaluator';
import { createMockSheet } from '@test/utils/mockData';

describe('FormulaEvaluator', () => {
  const evaluator = new FormulaEvaluator();

  describe('Basic Operations', () => {
    it('should evaluate SUM formula', () => {
      const sheet = createMockSheet({
        rows: [
          { A1: 10, B1: 20, C1: 30 },
        ],
      });

      const result = evaluator.evaluate('D1', '=SUM(A1:C1)', sheet);
      expect(result).toBe(60);
    });

    it('should evaluate nested formulas', () => {
      const sheet = createMockSheet({
        rows: [
          { A1: 10, B1: '=A1*2', C1: '=B1+5' },
        ],
      });

      const result = evaluator.evaluate('C1', '=B1+5', sheet);
      expect(result).toBe(25);
    });
  });

  describe('Error Handling', () => {
    it('should detect circular reference', () => {
      const sheet = createMockSheet({
        rows: [
          { A1: '=B1', B1: '=A1' },
        ],
      });

      expect(() => {
        evaluator.evaluate('A1', '=B1', sheet);
      }).toThrow('Circular reference detected');
    });

    it('should handle division by zero', () => {
      const sheet = createMockSheet({
        rows: [{ A1: 10, B1: 0 }],
      });

      const result = evaluator.evaluate('C1', '=A1/B1', sheet);
      expect(result).toBe('#DIV/0!');
    });
  });
});
```

**Component Tests**
```typescript
// src/components/toolbar/Toolbar.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toolbar } from './Toolbar';

describe('Toolbar', () => {
  it('should render all button groups', () => {
    render(<Toolbar />);

    expect(screen.getByTitle('New')).toBeInTheDocument();
    expect(screen.getByTitle('Save')).toBeInTheDocument();
    expect(screen.getByTitle('Undo (Ctrl+Z)')).toBeInTheDocument();
    expect(screen.getByTitle('Import CSV/JSON')).toBeInTheDocument();
  });

  it('should trigger import when import button clicked', async () => {
    const user = userEvent.setup();
    render(<Toolbar />);

    const importButton = screen.getByTitle('Import CSV/JSON');
    await user.click(importButton);

    // File input should be triggered
    const fileInput = screen.getByRole('button', { hidden: true });
    expect(fileInput).toHaveAttribute('type', 'file');
  });
});
```

#### 테스트 커버리지 목표
- **Overall**: 80%+
- **Services**: 90%+
- **Utils**: 95%+
- **Components**: 70%+
- **Stores**: 85%+

---

### 3.2 E2E Tests with Playwright ⭐⭐

#### 설치
```bash
npm install -D @playwright/test
npx playwright install
```

#### 설정
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
  },
});
```

#### E2E 테스트 시나리오

**User Journey: Create & Edit Sheet**
```typescript
// e2e/spreadsheet-basic.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Spreadsheet Basic Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should create a new sheet', async ({ page }) => {
    // Click new sheet button
    await page.click('button:has-text("New Sheet")');

    // Verify new sheet tab appears
    await expect(page.locator('[data-testid="sheet-tab"]')).toHaveCount(2);
  });

  test('should edit cell value', async ({ page }) => {
    // Click on cell A1
    await page.click('[data-row="0"][data-col="0"]');

    // Type value
    await page.keyboard.type('Test Value');
    await page.keyboard.press('Enter');

    // Verify value appears in cell
    await expect(
      page.locator('[data-row="0"][data-col="0"]')
    ).toContainText('Test Value');
  });

  test('should undo/redo operations', async ({ page }) => {
    // Edit cell
    await page.click('[data-row="0"][data-col="0"]');
    await page.keyboard.type('Original');
    await page.keyboard.press('Enter');

    // Undo with keyboard shortcut
    await page.keyboard.press('Control+Z');

    // Verify cell is empty
    await expect(
      page.locator('[data-row="0"][data-col="0"]')
    ).toBeEmpty();

    // Redo
    await page.keyboard.press('Control+Y');

    // Verify value is back
    await expect(
      page.locator('[data-row="0"][data-col="0"]')
    ).toContainText('Original');
  });
});
```

**Import/Export Flow**
```typescript
// e2e/import-export.spec.ts
import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Import/Export', () => {
  test('should import CSV file', async ({ page }) => {
    await page.goto('/');

    // Click import button
    await page.click('button:has-text("Import")');

    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(
      path.join(__dirname, 'fixtures', 'test-data.csv')
    );

    // Wait for import to complete
    await page.waitForSelector('[data-testid="import-success"]');

    // Verify data appears in grid
    await expect(page.locator('.ag-cell').first()).toContainText('Item 1');
  });

  test('should export to CSV', async ({ page }) => {
    await page.goto('/');

    // Add some data
    await page.click('[data-row="0"][data-col="0"]');
    await page.keyboard.type('Export Test');
    await page.keyboard.press('Enter');

    // Start download
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Export")');

    const download = await downloadPromise;

    // Verify filename
    expect(download.suggestedFilename()).toMatch(/\.csv$/);
  });
});
```

**Game Template Flow**
```typescript
// e2e/game-templates.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Game Data Templates', () => {
  test('should create sheet from character template', async ({ page }) => {
    await page.goto('/');

    // Open template gallery
    await page.click('button:has-text("Templates")');

    // Select character template
    await page.click('[data-template="character"]');

    // Verify columns
    const columnHeaders = page.locator('.ag-header-cell-text');
    await expect(columnHeaders.nth(0)).toContainText('ID');
    await expect(columnHeaders.nth(1)).toContainText('Name');
    await expect(columnHeaders.nth(2)).toContainText('Class');
  });

  test('should validate item data', async ({ page }) => {
    await page.goto('/');

    // Create item sheet from template
    await page.click('button:has-text("Templates")');
    await page.click('[data-template="item"]');

    // Enter invalid rarity
    await page.click('[data-row="0"][data-col="rarity"]');
    await page.keyboard.type('InvalidRarity');
    await page.keyboard.press('Enter');

    // Verify validation error appears
    await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
  });
});
```

**Performance Tests**
```typescript
// e2e/performance.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Performance', () => {
  test('should handle large dataset (1000 rows)', async ({ page }) => {
    await page.goto('/');

    // Import large CSV
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(
      path.join(__dirname, 'fixtures', 'large-data-1000.csv')
    );

    // Wait for import
    await page.waitForSelector('[data-testid="import-success"]', {
      timeout: 10000,
    });

    // Measure scroll performance
    const startTime = Date.now();
    await page.mouse.wheel(0, 10000);
    const scrollTime = Date.now() - startTime;

    expect(scrollTime).toBeLessThan(1000); // Should scroll smoothly

    // Verify data is visible
    await expect(page.locator('.ag-cell').first()).toBeVisible();
  });

  test('should handle rapid cell edits', async ({ page }) => {
    await page.goto('/');

    const iterations = 100;
    const startTime = Date.now();

    for (let i = 0; i < iterations; i++) {
      await page.click(`[data-row="${i % 10}"][data-col="0"]`);
      await page.keyboard.type(`Value ${i}`);
      await page.keyboard.press('Enter');
    }

    const totalTime = Date.now() - startTime;
    const avgTime = totalTime / iterations;

    expect(avgTime).toBeLessThan(100); // Each edit should take < 100ms
  });
});
```

---

## Phase 4: 협업 기능

### 4.1 Collaborative Editing ⭐⭐⭐

#### 아키텍처 개요

```
Client (Browser)
    ↓
WebSocket Connection
    ↓
Collaboration Server (Node.js + Socket.io)
    ↓
CRDT / OT Engine (Yjs or Automerge)
    ↓
Redis (for presence & locks)
```

#### 필요 패키지

**Backend**
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "socket.io": "^4.6.0",
    "yjs": "^13.6.0",
    "y-websocket": "^1.5.0",
    "redis": "^4.6.0",
    "ioredis": "^5.3.0"
  }
}
```

**Frontend**
```json
{
  "dependencies": {
    "socket.io-client": "^4.6.0",
    "yjs": "^13.6.0",
    "y-websocket": "^1.5.0"
  }
}
```

#### Backend Implementation

```typescript
// server/collaboration-server.ts
import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket/bin/utils';
import Redis from 'ioredis';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3001',
    methods: ['GET', 'POST'],
  },
});

const redis = new Redis(process.env.REDIS_URL);
const documents = new Map<string, Y.Doc>();

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-document', async ({ documentId, user }) => {
    // Join room
    socket.join(documentId);

    // Get or create Yjs document
    let doc = documents.get(documentId);
    if (!doc) {
      doc = new Y.Doc();
      documents.set(documentId, doc);

      // Load from Redis if exists
      const saved = await redis.get(`doc:${documentId}`);
      if (saved) {
        Y.applyUpdate(doc, Buffer.from(saved, 'base64'));
      }
    }

    // Add user to presence
    await redis.sadd(`presence:${documentId}`, JSON.stringify({
      userId: user.id,
      name: user.name,
      color: user.color,
      socketId: socket.id,
    }));

    // Broadcast user joined
    const users = await getDocumentUsers(documentId);
    io.to(documentId).emit('users-updated', users);

    // Send current document state
    socket.emit('document-state', Y.encodeStateAsUpdate(doc));
  });

  socket.on('update', async ({ documentId, update }) => {
    const doc = documents.get(documentId);
    if (!doc) return;

    // Apply update to Yjs document
    Y.applyUpdate(doc, new Uint8Array(update));

    // Broadcast to other clients
    socket.to(documentId).emit('update', { update });

    // Save to Redis (debounced)
    await saveDocument(documentId, doc);
  });

  socket.on('cursor-move', ({ documentId, position }) => {
    socket.to(documentId).emit('cursor-update', {
      userId: socket.id,
      position,
    });
  });

  socket.on('disconnect', async () => {
    // Remove from all presence sets
    const rooms = Array.from(socket.rooms);
    for (const room of rooms) {
      await removeUserFromPresence(room, socket.id);
      const users = await getDocumentUsers(room);
      io.to(room).emit('users-updated', users);
    }
  });
});

async function saveDocument(documentId: string, doc: Y.Doc) {
  const update = Y.encodeStateAsUpdate(doc);
  await redis.set(
    `doc:${documentId}`,
    Buffer.from(update).toString('base64'),
    'EX',
    86400 // 24 hours
  );
}

async function getDocumentUsers(documentId: string) {
  const members = await redis.smembers(`presence:${documentId}`);
  return members.map(m => JSON.parse(m));
}

httpServer.listen(3002, () => {
  console.log('Collaboration server running on port 3002');
});
```

#### Frontend Integration

```typescript
// src/services/collaboration/collaborationService.ts
import { io, Socket } from 'socket.io-client';
import * as Y from 'yjs';
import { useSpreadsheetStore } from '@stores/spreadsheetStore';

export class CollaborationService {
  private socket: Socket | null = null;
  private doc: Y.Doc;
  private currentDocumentId: string | null = null;
  private users: Map<string, CollaborationUser> = new Map();

  constructor() {
    this.doc = new Y.Doc();
  }

  connect(serverUrl: string) {
    this.socket = io(serverUrl);

    this.socket.on('connect', () => {
      console.log('Connected to collaboration server');
    });

    this.socket.on('document-state', (update: Uint8Array) => {
      Y.applyUpdate(this.doc, update);
      this.syncToStore();
    });

    this.socket.on('update', ({ update }: { update: Uint8Array }) => {
      Y.applyUpdate(this.doc, update);
      this.syncToStore();
    });

    this.socket.on('users-updated', (users: CollaborationUser[]) => {
      this.users = new Map(users.map(u => [u.userId, u]));
      // Update UI with active users
    });

    this.socket.on('cursor-update', ({ userId, position }) => {
      // Show other user's cursor
      this.showRemoteCursor(userId, position);
    });
  }

  joinDocument(documentId: string, user: CollaborationUser) {
    this.currentDocumentId = documentId;
    this.socket?.emit('join-document', { documentId, user });

    // Set up local changes listener
    this.doc.on('update', (update: Uint8Array) => {
      this.socket?.emit('update', {
        documentId: this.currentDocumentId,
        update: Array.from(update),
      });
    });
  }

  updateCell(sheetId: string, rowId: string, colId: string, value: any) {
    const ySheet = this.doc.getMap(sheetId);
    const yRow = ySheet.get(rowId) as Y.Map<any> || new Y.Map();
    yRow.set(colId, value);
    ySheet.set(rowId, yRow);
  }

  private syncToStore() {
    // Convert Yjs doc to Zustand store format
    const store = useSpreadsheetStore.getState();

    this.doc.getMap('sheets').forEach((ySheet, sheetId) => {
      // Update store without triggering Yjs update (to avoid loop)
      store._syncFromCollaboration(sheetId, ySheet.toJSON());
    });
  }

  private showRemoteCursor(userId: string, position: CellPosition) {
    // Render cursor overlay
  }

  disconnect() {
    this.socket?.disconnect();
  }
}
```

#### UI Components

```typescript
// src/components/collaboration/ActiveUsers.tsx
export const ActiveUsers = () => {
  const [users, setUsers] = useState<CollaborationUser[]>([]);

  useEffect(() => {
    const collab = useCollaborationService();
    collab.onUsersUpdate(setUsers);
  }, []);

  return (
    <div className="flex items-center gap-2 px-4">
      <span className="text-sm text-gray-600">Active:</span>
      <div className="flex -space-x-2">
        {users.map(user => (
          <div
            key={user.userId}
            className="w-8 h-8 rounded-full border-2 border-white"
            style={{ backgroundColor: user.color }}
            title={user.name}
          >
            <span className="text-white text-xs font-semibold">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// src/components/collaboration/RemoteCursor.tsx
export const RemoteCursor = ({ user, position }: RemoteCursorProps) => {
  return (
    <div
      className="absolute pointer-events-none z-50"
      style={{
        left: position.x,
        top: position.y,
        borderLeft: `2px solid ${user.color}`,
      }}
    >
      <div
        className="px-2 py-1 text-xs text-white rounded"
        style={{ backgroundColor: user.color }}
      >
        {user.name}
      </div>
    </div>
  );
};
```

#### Conflict Resolution

```typescript
// src/services/collaboration/conflictResolver.ts
export class ConflictResolver {
  /**
   * Yjs handles most conflicts automatically via CRDT
   * For specific business logic conflicts:
   */

  resolveFormulaDependency(updates: Y.Map<any>[]) {
    // When multiple users edit cells in a formula chain
    // Ensure evaluation order is correct
  }

  resolveCellLock(cellId: string, users: string[]) {
    // If multiple users try to edit same cell
    // First-come-first-served with visual indicator

    return {
      locked: true,
      lockedBy: users[0],
      message: `Cell locked by ${users[0]}`,
    };
  }

  resolveValidationConflict(value: any, rules: ValidationRule[]) {
    // Apply strictest validation rule
    const strictestRule = rules.reduce((prev, curr) =>
      curr.severity === 'error' ? curr : prev
    );

    return strictestRule;
  }
}
```

---

## 📊 구현 우선순위 요약

### Must Have (P0) - 2주
1. ✅ Formula Calculation Engine
2. ✅ IndexedDB Persistence
3. ✅ Advanced Formatting

### Should Have (P1) - 2주
4. ✅ More Game Templates
5. ✅ Excel Export (.xlsx)

### Nice to Have (P2) - 2주
6. ✅ Unit Tests (Vitest)
7. ✅ E2E Tests (Playwright)

### Future (P3) - 4주
8. ✅ Collaborative Editing

---

## 🎯 성공 지표

### 기능 완성도
- [ ] 모든 P0 기능 구현 및 테스트 완료
- [ ] P1 기능 80% 이상 구현
- [ ] P2 테스트 커버리지 80% 달성

### 성능
- [ ] 1000행 데이터 로드 < 2초
- [ ] 수식 재계산 < 100ms
- [ ] IndexedDB 저장 < 500ms
- [ ] 협업 모드 지연 < 200ms

### 사용자 경험
- [ ] 버그 없는 안정적인 동작
- [ ] 직관적인 UI/UX
- [ ] 명확한 에러 메시지
- [ ] 반응형 인터페이스

---

이 계획서를 기반으로 각 Phase를 순차적으로 구현하시겠습니까?
