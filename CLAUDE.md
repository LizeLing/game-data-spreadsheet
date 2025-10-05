# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Game Data Spreadsheet - React 기반 웹 스프레드시트 애플리케이션으로, 게임 데이터 관리에 특화되어 있습니다. Excel과 유사한 기능을 제공하며, 수식 계산, 조건부 서식, IndexedDB 자동 저장, XLSX 파일 import/export를 지원합니다.

**핵심 기술 스택:**
- React 19 + TypeScript
- Vite 7 (빌드 도구)
- AG Grid Community (스프레드시트 그리드)
- Zustand + Immer (상태 관리)
- IndexedDB (브라우저 로컬 저장소)
- Tailwind CSS (스타일링)

## Development Commands

```bash
# 개발 서버 시작 (포트 3000, 자동 브라우저 오픈)
npm run dev

# 프로덕션 빌드 (TypeScript 컴파일 + Vite 빌드)
npm run build

# 프로덕션 미리보기
npm run preview

# 테스팅
npm test                  # Vitest watch 모드 (개발 중 사용)
npm run test:run          # 모든 테스트 1회 실행 (CI용)
npm run test:ui           # Vitest UI 모드 (브라우저 기반)
npm run test:coverage     # 코드 커버리지 리포트
npm run test:e2e          # Playwright E2E 테스트
npm run test:e2e:ui       # Playwright UI 모드
npm run test:e2e:headed   # Playwright 브라우저 표시 모드

# 린팅
npm run lint              # ESLint 실행
npm run lint:fix          # ESLint 자동 수정

# 포맷팅
npm run format            # Prettier로 코드 포맷팅
npm run format:check      # 포맷팅 검사 (CI용)

# 타입 체크 (빌드 없이 타입만 검사)
npm run type-check
```

## Architecture Overview

### 1. 상태 관리 아키텍처 (Zustand + Immer)

**핵심 Store:** `src/stores/spreadsheetStore.ts`

- **Immer middleware** 사용으로 불변성 자동 관리
- **History 관리**: undo/redo 기능 (historyIndex 기반)
- **IndexedDB 통합**: 2초 debounce로 자동 저장
- **Formula 엔진 통합**: updateCell 시 수식 자동 평가 및 의존성 재계산

**중요 메서드:**
- `updateCell()`: 셀 값 업데이트 (수식이면 자동 평가)
- `_recalculateDependents()`: 의존성 셀 재계산 (재귀적)
- `applyCellStyle()`: 선택 영역에 스타일 적용
- `addConditionalFormat()`: 조건부 서식 추가
- `mergeCells()`: 셀 병합 (겹치는 병합 검증 포함)
- `unmergeCells()`: 병합 해제
- `getMergedCell()`: 특정 위치의 병합 셀 조회

### 2. Formula 계산 엔진 (Excel-like)

**4개 핵심 모듈:**

1. **`formulaParser.ts`** - 수식 파싱
   - Tokenization → AST 생성
   - 셀 참조 추출 (A1, B2:C5 등)
   - 연산자 우선순위 처리 (^, *, /, +, -)

2. **`formulaEvaluator.ts`** - 수식 평가
   - AST 재귀 평가
   - **순환 참조 감지** (DFS 기반)
   - 의존성 그래프 관리

3. **`formulaFunctions.ts`** - 23개 내장 함수
   - 수학: SUM, AVERAGE, MIN, MAX, COUNT, ROUND 등
   - 논리: IF, AND, OR, NOT
   - 텍스트: CONCATENATE, LEFT, RIGHT, UPPER, LOWER
   - 게임 데이터 전용: DAMAGE_CALC, STAT_TOTAL, RARITY_BONUS

4. **`formulaCache.ts`** - 캐싱 및 최적화
   - 계산 결과 캐싱
   - 의존성 기반 캐시 무효화
   - Topological sort로 배치 재계산

**수식 평가 플로우:**
```
updateCell(value)
  → formulaParser.parse(formula)
  → formulaEvaluator.evaluate(ast, sheet)
  → 순환 참조 검사
  → formulaCache.set(cellId, result)
  → _recalculateDependents(cellId)  // 재귀적 재계산
```

### 3. 데이터 Import/Export

**CSV/XLSX/JSON 지원:**

- **Import**: `src/services/dataImport/csvImporter.ts`
  - CSV: PapaParse 사용
  - XLSX: xlsx 라이브러리, 스타일 추출 지원

- **Export**: `src/services/dataExport/`
  - CSV: PapaParse
  - JSON: 구조화된 배열로 export
  - XLSX: 스타일 보존 (폰트, 색상, 테두리, 숫자 포맷)

**XLSX 스타일 변환:**
- `convertCellStyleToXLSX()`: CellStyle → XLSX 스타일 객체
- `extractCellStyle()`: XLSX 셀 → CellStyle

### 4. IndexedDB 자동 저장

**IndexedDBService 클래스** (`spreadsheetStore.ts` 내부):

- 2개 Object Store: `spreadsheets`, `autosaves`
- **Auto-save**: lodash debounce 2초 (사용자 입력 후 2초 대기)
- **Backup 관리**: timestamp 기반, 7일 이상 자동 삭제

```typescript
// Auto-save 플로우
updateCell() → _triggerAutoSave() → debouncedAutoSave(state)
  → dbService.autoSave(spreadsheetId, data)
```

### 5. 게임 데이터 템플릿 시스템

**템플릿 타입:** (`src/utils/gameTemplates.ts`)
- Character, Item, Enemy, Level, Dialogue, Localization, Stat Progression, Quest, Skill

**템플릿 구조:**
```typescript
interface GameDataTemplate {
  type: string;
  columns: ColumnDefinition[];  // 컬럼 정의 (타입, 옵션)
  sampleData?: any[];           // 샘플 데이터
  conditionalFormats?: ConditionalFormat[];  // 자동 적용 서식
}
```

**조건부 서식 프리셋:**
- `RARITY_COLORS`: common → mythic (회색 → 빨강)
- `QUALITY_COLORS`: poor → perfect
- `STATUS_COLORS`: active, inactive, pending, error

### 6. Conditional Formatting

**우선순위 기반 적용:**

```typescript
// src/utils/cellUtils.ts
getConditionalStyle(cell, rowIndex, columnIndex, formats)
  → formats를 priority로 정렬
  → 첫 번째 매치되는 서식 반환
```

**조건 타입:**
- `value`: 숫자 비교 (equals, greaterThan, between 등)
- `text`: 문자열 비교 (equals, contains)
- `formula`: 수식 기반 (미구현)

### 7. TypeScript Path Aliases

`vite.config.ts`에 정의된 alias:

```typescript
'@' → './src'
'@components' → './src/components'
'@hooks' → './src/hooks'
'@types' → './src/types'
'@utils' → './src/utils'
'@services' → './src/services'
'@stores' → './src/stores'
'@schemas' → './src/schemas'
```

**모든 import는 절대 경로 사용:**
```typescript
import { useSpreadsheetStore } from '@stores/spreadsheetStore';
import { formatCellValue } from '@utils/cellUtils';
```

## Key Design Patterns

### 1. Cell ID 생성

```typescript
// rowId:columnId 형식
generateCellId('row-0', 'col-A') // → "row-0:col-A"
```

Formula 엔진에서 의존성 추적에 사용.

### 2. AG Grid 통합 및 셀 선택

**CustomCellRenderer** (`SpreadsheetGrid.tsx`):
- 각 셀마다 조건부 서식 계산
- `cellStyleToCSS()` 변환 후 inline style 적용
- Formula가 있으면 계산된 값 표시, 없으면 원본 값
- 병합된 셀 렌더링 (CSS Grid의 `gridRow`, `gridColumn` span 사용)

**셀 선택 처리 (중요):**
```typescript
// 단일 셀 클릭 시 selection 설정
onCellClicked={(event) => {
  const rowIndex = event.rowIndex;
  const colId = event.column?.getColId();
  const colIndex = sheet.columns.findIndex((col) => col.id === colId);

  setSelection({
    startRow: rowIndex, endRow: rowIndex,
    startColumn: colIndex, endColumn: colIndex,
  });
}}

// 범위 선택 시 selection 업데이트
onRangeSelectionChanged={() => {
  const cellRanges = gridApi.getCellRanges();
  // ... 범위를 SelectionRange로 변환
  setSelection({ startRow, endRow, startColumn, endColumn });
}}
```

**주의사항:**
- AG Grid는 단일 셀 클릭 시 `onRangeSelectionChanged`를 트리거하지 않음
- **반드시 `onCellClicked` 핸들러를 추가**해야 Toolbar 버튼들이 활성화됨
- `selection` state는 Toolbar의 모든 기능 활성화 기준임 (`disabled={!selection}`)

### 3. History (Undo/Redo)

```typescript
interface HistoryEntry {
  sheets: Sheet[];
  timestamp: Date;
}

// Undo
historyIndex > 0 → history[historyIndex - 1]로 복원

// Redo
historyIndex < history.length - 1 → history[historyIndex + 1]로 복원
```

**주의사항:**
- 새 액션 시 historyIndex 이후 기록 삭제
- 최대 50개 히스토리 유지 (메모리 관리)

## Common Pitfalls

### 1. Formula 평가 시 타입 에러

수식 함수는 `CellValue | CellValue[]` 타입을 받습니다 (Range 지원):

```typescript
// ❌ 잘못된 예
function SUM(...args: CellValue[]): CellValue

// ✅ 올바른 예
function SUM(...args: (CellValue | CellValue[])[]): CellValue {
  const flattened = flatten(args);  // 배열 평탄화 필수
  return flattened.reduce((sum, n) => sum + toNumber(n), 0);
}
```

### 2. IndexedDB 초기화

앱 시작 시 반드시 `initDB()` 호출:

```typescript
// App.tsx
useEffect(() => {
  initDB().catch(console.error);
}, [initDB]);
```

### 3. Zustand Immer 사용 시 주의

```typescript
// ❌ 새 객체 반환하면 Immer가 무시됨
set(() => ({ sheets: newSheets }));

// ✅ Draft 직접 수정
set((state) => {
  state.sheets[0].name = 'New Name';
});
```

### 4. AG Grid 데이터 동기화

AG Grid는 `rowData` prop 변경 시에만 re-render:

```typescript
// Store의 sheets 변경 → useMemo로 rowData 재계산 필요
const rowData = useMemo(() => {
  return sheet.rows.map(row => { /* ... */ });
}, [sheet]);  // sheet 의존성
```

## Testing Strategy

**현재 상태: 208개 유닛 테스트 모두 통과 ✅**

### Unit Tests (Vitest)
- **위치**: `src/**/*.test.ts(x)`
- **테스트 환경**: Happy DOM (경량 브라우저 환경)
- **주요 테스트 대상**:
  - Formula 엔진 (`formulaEvaluator.test.ts`)
  - Store 로직 (`spreadsheetStore.test.ts`)
  - 유틸리티 함수 (`cellUtils.test.ts`, `clipboardUtils.test.ts`, `searchUtils.test.ts`)
  - React 컴포넌트 (`SpreadsheetGrid.test.tsx`, `Toolbar.test.tsx`, `Sidebar.test.tsx`, `FormulaBar.test.tsx`)

**테스트 작성 시 주의사항:**
- **UI 텍스트는 한국어 사용**: 테스트 matcher는 실제 UI의 한국어 텍스트와 일치해야 함
  - 예: `screen.getByText('캐릭터')` (O), `screen.getByText('Character')` (X)
  - 예: `screen.getByTitle('삭제')` (O), `screen.getByTitle('Delete')` (X)
- **Store 테스트 시 필수 mock**:
  ```typescript
  const defaultStoreState = {
    activeSheetId: 'sheet-1',
    sheets: [mockSheet],
    selection: null,
    getMergedCell: vi.fn(() => undefined),
    mergeCells: vi.fn(),
    unmergeCells: vi.fn(),
    // ... 기타 메서드
  };
  ```

### E2E Tests (Playwright)
- **위치**: `e2e/**/*.spec.ts`
- **상태**: 설정 완료, 일부 실행 이슈 있음 (Playwright 설정 문제)
- **주요 시나리오**:
  - Import/Export 플로우
  - Spreadsheet 기본 조작

### 8. Cell Merging (셀 병합)

**구현 완료 (2025-10-06)**

**데이터 구조:**
```typescript
interface MergedCell {
  id: string;
  startRow: number;
  endRow: number;
  startColumn: number;
  endColumn: number;
  value: CellValue;
}

interface Sheet {
  // ... 기타 필드
  mergedCells?: MergedCell[];
}
```

**Store 메서드:**
- `mergeCells(sheetId, selection)`: 선택 영역을 병합
  - 단일 셀 병합 방지 검증
  - 겹치는 병합 영역 검사
  - 왼쪽 상단 셀의 값을 병합된 셀 값으로 사용
- `unmergeCells(sheetId, mergedCellId)`: 병합 해제
- `getMergedCell(sheetId, rowIndex, columnIndex)`: 특정 위치의 병합 셀 반환

**렌더링 (CustomCellRenderer):**
```typescript
// 병합된 셀의 왼쪽 상단만 렌더링
if (mergedCell &&
    (rowIndex !== mergedCell.startRow || columnIndex !== mergedCell.startColumn)) {
  return <div style={{ display: 'none' }} />;
}

// 병합된 셀 스타일 (CSS Grid 사용)
const mergedStyles = {
  gridRow: `span ${rowSpan}`,
  gridColumn: `span ${colSpan}`,
  border: '1px solid #3b82f6',      // 파란색 테두리
  backgroundColor: '#eff6ff',        // 연한 파란 배경
};
```

**UI (Toolbar):**
- "⬜ 병합" 버튼: 선택된 영역을 병합 (`disabled={!selection || !!hasMergedCell}`)
- "⬜ 해제" 버튼: 병합 해제 (`disabled={!hasMergedCell}`)

## Future Development Phases

현재 완료: **Phase 1 (P0) + Phase 2 (P1) + Cell Merging**

다음 단계 (`IMPLEMENTATION_PLAN.md` 참조):
- **Phase 3**: Enhanced Testing Coverage
- **Phase 4**: Collaborative Editing (Yjs + WebSocket)
