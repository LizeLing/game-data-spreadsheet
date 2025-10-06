# 다중 셀 선택 기능

## 개요

AG Grid의 기본 다중 범위 선택 기능을 활용하여 여러 개의 셀 범위를 동시에 선택하고 일괄적으로 스타일을 적용할 수 있는 기능입니다.

## 구현 내용

### 1. 타입 정의 (`src/types/spreadsheet.ts`)

```typescript
// Multi Selection - 여러 개의 셀 범위를 동시에 선택
export interface MultiSelection {
  ranges: SelectionRange[];
  primary?: SelectionRange; // 주 선택 영역 (포커스된 영역)
}
```

### 2. Store 확장 (`src/stores/spreadsheetStore.ts`)

**새로운 State:**
- `multiSelection: SelectionRange[]` - 다중 선택된 범위들

**새로운 메서드:**
- `setMultiSelection(ranges)` - 다중 선택 범위 설정
- `addSelectionRange(range)` - 선택 범위 추가
- `removeSelectionRange(index)` - 선택 범위 제거
- `clearMultiSelection()` - 다중 선택 초기화
- `getAllSelectedRanges()` - 모든 선택된 범위 반환 (primary + multi)
- `applyStyleToMultiSelection(sheetId, style)` - 모든 선택 범위에 스타일 적용

### 3. SpreadsheetGrid 컴포넌트 (`src/components/spreadsheet/SpreadsheetGrid.tsx`)

**AG Grid 설정:**
- `rowSelection="multiple"` - 다중 행 선택 활성화
- `enableRangeSelection={true}` - 범위 선택 활성화

**이벤트 핸들러:**
```typescript
const onRangeSelectionChanged = useCallback(() => {
  const cellRanges = gridApi.getCellRanges();

  // 다중 범위 처리
  const ranges = cellRanges.map((range) => {
    // 각 range를 SelectionRange로 변환
  });

  // 첫 번째 범위를 주 선택 영역으로 설정
  if (ranges.length > 0) {
    setSelection(ranges[0]);

    // 나머지 범위들을 multiSelection으로 설정
    if (ranges.length > 1) {
      setMultiSelection(ranges.slice(1));
    } else {
      setMultiSelection([]);
    }
  }
}, [sheet, setSelection, setMultiSelection]);
```

### 4. Toolbar 컴포넌트 (`src/components/toolbar/Toolbar.tsx`)

모든 스타일 핸들러가 다중 선택을 지원하도록 수정:

```typescript
const handleBold = () => {
  if (!selection) return;

  // 다중 선택이 있으면 모든 선택 영역에 적용
  if (multiSelection.length > 0) {
    applyStyleToMultiSelection(activeSheetId, { fontWeight: 'bold' });
  } else {
    applyCellStyle(activeSheetId, selection, { fontWeight: 'bold' });
  }
};
```

**지원하는 스타일:**
- 굵게 (Bold)
- 기울임 (Italic)
- 밑줄 (Underline)
- 텍스트 색상
- 배경 색상
- 텍스트 정렬

## 사용 방법

### 1. 기본 범위 선택
- 마우스로 드래그하여 셀 범위 선택

### 2. 다중 범위 선택
- **Windows/Linux**: `Ctrl` 키를 누른 채로 추가 범위 선택
- **Mac**: `Cmd` 키를 누른 채로 추가 범위 선택

### 3. 스타일 적용
1. 여러 범위 선택
2. Toolbar에서 원하는 스타일 버튼 클릭
3. 모든 선택된 범위에 스타일이 일괄 적용됨

## 테스트

모든 다중 선택 기능은 단위 테스트로 검증되었습니다:

**테스트 파일:** `src/stores/spreadsheetStore.multiselection.test.ts`

**테스트 케이스:**
- ✅ 다중 선택 범위 설정
- ✅ 선택 범위 추가
- ✅ 선택 범위 제거
- ✅ 다중 선택 초기화
- ✅ 모든 선택 범위 조회
- ✅ 다중 선택 영역에 스타일 적용

**테스트 실행:**
```bash
npm run test:run -- src/stores/spreadsheetStore.multiselection.test.ts
```

**전체 테스트 결과:** 251개 테스트 모두 통과 ✅

## 기술적 특징

### 1. AG Grid 네이티브 기능 활용
- AG Grid의 `getCellRanges()` API를 사용하여 선택된 모든 범위를 가져옴
- 별도의 복잡한 UI 구현 없이 AG Grid의 검증된 기능 활용

### 2. 상태 관리
- Zustand의 Immer middleware로 불변성 자동 관리
- `multiSelection` 배열로 다중 선택 상태 추적
- `selection`은 주 선택 영역으로 유지 (기존 호환성)

### 3. 성능 최적화
- `getAllSelectedRanges()`로 primary + multi 범위를 한 번에 처리
- 스타일 적용 시 모든 범위를 한 번의 setState로 처리

### 4. 후방 호환성
- 기존 `selection` 및 `applyCellStyle` API는 그대로 유지
- 단일 선택 시에는 기존 동작 방식 그대로 작동
- 다중 선택은 선택적 기능으로 추가

## 향후 개선 사항

### 1. 시각적 피드백
- 다중 선택된 범위 수 표시
- 각 범위별 색상 구분 표시

### 2. 추가 기능
- 다중 선택 영역 복사/붙여넣기
- 다중 선택 영역에 대한 일괄 수식 적용
- 다중 선택 영역 병합

### 3. 키보드 단축키
- `Shift` + 화살표: 범위 확장
- `Ctrl/Cmd` + 클릭: 범위 추가/제거

## 참고 자료

- [AG Grid Range Selection](https://www.ag-grid.com/javascript-data-grid/range-selection/)
- [Zustand Documentation](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [Immer Documentation](https://immerjs.github.io/immer/)
