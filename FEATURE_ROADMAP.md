# Feature Roadmap - 기능 확장 로드맵

게임 데이터 스프레드시트의 추가 기능 및 개선 사항

## 현재 완성도: 90%

### ✅ 완료된 핵심 기능
- Excel-like 스프레드시트 (AG Grid)
- 수식 계산 엔진 (26개 함수)
- CSV/XLSX/JSON Import/Export
- 데이터 검증 (타입별 실시간 검증)
- 셀 병합, 조건부 서식
- IndexedDB 자동저장
- 9개 게임 데이터 템플릿
- Error Boundary + Toast 알림
- 235개 테스트 (100% 통과)

---

## 우선순위별 추가 기능

## P0: 즉시 구현 권장 (1-2주)

### 1. 키보드 단축키 확장 ⌨️
**예상 소요**: 4-6시간
**중요도**: ⭐⭐⭐⭐⭐

현재 지원하는 단축키가 제한적이므로 확장 필요

#### 추가할 단축키
- **Ctrl+F / Cmd+F**: 찾기 다이얼로그
- **Ctrl+H / Cmd+H**: 바꾸기 다이얼로그
- **Ctrl+D / Cmd+D**: 현재 행 복제
- **Ctrl+K / Cmd+K**: 현재 행 삭제
- **Ctrl+Shift+Arrow**: 범위 선택 확장
- **Ctrl+Home / Cmd+Home**: 첫 셀로 이동
- **Ctrl+End / Cmd+End**: 마지막 셀로 이동
- **F2**: 셀 편집 모드
- **Esc**: 편집 취소
- **Ctrl+Enter / Cmd+Enter**: 편집 완료 후 아래 셀로 이동
- **Ctrl+/**: 단축키 도움말 표시

#### 구현 방법
```typescript
// src/hooks/useKeyboardShortcuts.ts
export const useKeyboardShortcuts = () => {
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (modifier && e.key === 'f') {
        e.preventDefault();
        openSearchDialog();
      }
      // ... 기타 단축키
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);
};
```

---

### 2. 컨텍스트 메뉴 (우클릭) 🖱️
**예상 소요**: 6-8시간
**중요도**: ⭐⭐⭐⭐⭐

사용자 편의성을 크게 향상시킬 수 있는 기능

#### 셀 컨텍스트 메뉴
- 잘라내기 / 복사 / 붙여넾기
- 행 삽입 (위/아래)
- 열 삽입 (좌/우)
- 행 삭제
- 열 삭제
- 셀 병합 / 병합 해제
- 셀 서식 (굵게, 기울임, 색상)
- 정렬 (오름차순/내림차순)
- 필터 적용

#### 헤더 컨텍스트 메뉴
- 열 너비 자동 조정
- 열 숨기기
- 열 고정
- 정렬 (오름차순/내림차순)
- 필터 설정
- 컬럼 타입 변경

#### 구현 예시
```typescript
// src/components/ui/ContextMenu.tsx
export const ContextMenu = ({ x, y, items, onClose }) => {
  return (
    <div
      style={{ position: 'fixed', top: y, left: x }}
      className="bg-white shadow-lg rounded-lg border"
    >
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => { item.action(); onClose(); }}
          className="w-full px-4 py-2 text-left hover:bg-gray-100"
        >
          {item.icon} {item.label}
        </button>
      ))}
    </div>
  );
};
```

---

### 3. 다크 모드 🌙
**예상 소요**: 4-5시간
**중요도**: ⭐⭐⭐⭐

장시간 사용 시 눈의 피로 감소

#### 구현 내용
- 시스템 테마 감지
- 수동 테마 토글
- AG Grid 다크 테마 적용
- Tailwind dark 클래스 활용
- 테마 설정 LocalStorage 저장

#### 구현 방법
```typescript
// src/stores/themeStore.ts
export const useThemeStore = create<ThemeState>((set) => ({
  theme: 'system', // 'light' | 'dark' | 'system'

  setTheme: (theme) => {
    set({ theme });
    localStorage.setItem('theme', theme);

    if (theme === 'dark' ||
        (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },
}));
```

---

## P1: 중요 기능 (2-4주)

### 4. 데이터 시각화 (차트) 📊
**예상 소요**: 10-12시간
**중요도**: ⭐⭐⭐⭐⭐

게임 밸런스 분석을 위한 필수 기능

#### 지원할 차트 타입
- 막대 차트 (Bar Chart): 캐릭터 스탯 비교
- 선 차트 (Line Chart): 레벨별 성장 곡선
- 파이 차트 (Pie Chart): 아이템 등급 분포
- 산점도 (Scatter Plot): 데미지-방어력 밸런스
- 히트맵 (Heatmap): 스킬 조합 효율성

#### 구현 라이브러리
- **Recharts** (추천): React 친화적, 커스터마이징 용이
- **Chart.js**: 가볍고 빠름
- **ApexCharts**: 인터랙티브, 다양한 차트 타입

#### 기능
- 범위 선택 → 차트 생성
- 차트 타입 변경
- 색상/라벨 커스터마이징
- PNG/SVG export
- 차트 시트 별도 관리

---

### 5. 고급 필터링 🔍
**예상 소요**: 6-8시간
**중요도**: ⭐⭐⭐⭐

현재 기본 필터만 지원, 게임 데이터 분석을 위해 고급 필터 필요

#### 추가 기능
- **다중 조건 필터**: AND/OR 조건
- **커스텀 필터**: 수식 기반 필터
- **필터 프리셋**: 자주 사용하는 필터 저장
- **고급 검색**:
  - 정규식 지원
  - 여러 컬럼 동시 검색
  - 대소문자 구분 옵션
- **필터 히스토리**: 최근 사용한 필터

#### UI 개선
```
┌─────────────────────────────────┐
│ 데이터 필터                      │
├─────────────────────────────────┤
│ ☐ Rarity = "legendary"          │
│   AND ☑ HP > 1000               │
│   OR  ☐ Attack > 500            │
├─────────────────────────────────┤
│ [프리셋 저장] [프리셋 불러오기]   │
│ [모두 지우기]      [필터 적용]   │
└─────────────────────────────────┘
```

---

### 6. 더 많은 게임 템플릿 🎮
**예상 소요**: 6-8시간
**중요도**: ⭐⭐⭐⭐

게임 데이터 관리 특화를 위한 추가 템플릿

#### 추가할 템플릿

##### 1. Drop Table (드랍 테이블)
```
| Monster | Item       | Chance | Min | Max |
|---------|------------|--------|-----|-----|
| Goblin  | Gold       | 100%   | 10  | 50  |
| Goblin  | Iron Sword | 15%    | 1   | 1   |
| Dragon  | Dragon Egg | 5%     | 1   | 1   |
```

##### 2. Achievement (업적)
```
| ID  | Name          | Description         | Points | Hidden |
|-----|---------------|---------------------|--------|--------|
| A01 | First Blood   | Kill first enemy    | 10     | No     |
| A02 | Dragon Slayer | Defeat Ancient Dragon| 100   | Yes    |
```

##### 3. Gacha Pool (가챠 확률표)
```
| Pool   | Item      | Rarity    | Weight | Rate  |
|--------|-----------|-----------|--------|-------|
| Normal | Common    | 1-star    | 60     | 60%   |
| Normal | Uncommon  | 2-star    | 30     | 30%   |
| Normal | Rare      | 3-star    | 10     | 10%   |
```

##### 4. Crafting Recipe (제작법)
```
| Result     | Material1 | Count1 | Material2 | Count2 | Station |
|------------|-----------|--------|-----------|--------|---------|
| Iron Sword | Iron Bar  | 2      | Wood      | 1      | Forge   |
| Potion     | Herb      | 3      | Water     | 1      | Alchemy |
```

##### 5. Buff/Debuff (버프/디버프)
```
| ID   | Name       | Type   | Duration | Stat   | Value | Stackable |
|------|------------|--------|----------|--------|-------|-----------|
| B001 | Rage       | Buff   | 30s      | Attack | +50%  | No        |
| D001 | Poison     | Debuff | 10s      | HP     | -10/s | Yes       |
```

##### 6. Enemy Wave (적 웨이브)
```
| Wave | Enemy Type | Count | Spawn Delay | Boss |
|------|------------|-------|-------------|------|
| 1    | Goblin     | 10    | 2s          | No   |
| 5    | Orc        | 5     | 3s          | Yes  |
```

##### 7. Tutorial (튜토리얼)
```
| Step | Title        | Description           | Trigger    | Reward |
|------|-------------|-----------------------|------------|--------|
| 1    | Welcome     | Click to start        | OnLoad     | -      |
| 2    | First Move  | Move your character   | Movement   | 100 XP |
```

##### 8. Season Pass (시즌 패스)
```
| Level | Free Reward | Premium Reward | XP Required |
|-------|-------------|----------------|-------------|
| 1     | 100 Gold    | Epic Chest     | 100         |
| 2     | Potion x3   | Legendary Item | 250         |
```

---

### 7. 데이터 분석 함수 📈
**예상 소요**: 4-6시간
**중요도**: ⭐⭐⭐⭐

통계 및 분석 함수 추가

#### 추가할 함수

**통계 함수**
- `MEDIAN()`: 중앙값
- `MODE()`: 최빈값
- `PERCENTILE(range, k)`: 백분위수
- `QUARTILE(range, quart)`: 사분위수
- `STDEV()`: 표준편차
- `VAR()`: 분산
- `CORREL(range1, range2)`: 상관계수

**게임 전용 함수**
- `DPS_CALC(damage, attackSpeed, critRate, critDamage)`: DPS 계산
- `EXP_CURVE(level, baseExp, multiplier)`: 경험치 곡선
- `DROP_RATE(baseRate, luck, modifier)`: 드랍률 계산
- `BALANCE_SCORE(stats)`: 밸런스 점수
- `GACHA_PROB(pulls, rate)`: 가챠 확률 계산

---

## P2: 협업 및 고급 기능 (4-8주)

### 8. 실시간 협업 편집 👥
**예상 소요**: 35-50시간
**중요도**: ⭐⭐⭐⭐⭐

팀 협업을 위한 핵심 기능

#### Backend 구현
- **Node.js + Express/Fastify**
- **Socket.io**: WebSocket 통신
- **Yjs CRDT**: 충돌 해결
- **Redis**: Presence 관리
- **PostgreSQL**: 데이터 영속성

#### Frontend 기능
- 실시간 커서 표시
- 사용자 목록 (아바타, 이름)
- 변경사항 실시간 동기화
- 셀 잠금 (편집 중인 셀)
- 충돌 해결 UI
- 오프라인 모드 지원

#### 아키텍처
```
┌──────────┐    WebSocket    ┌──────────┐
│ Client A │◄──────────────►│  Server  │
└──────────┘                 │ (Socket) │
┌──────────┐                 │  + Yjs   │
│ Client B │◄──────────────►│  + Redis │
└──────────┘                 └──────────┘
```

---

### 9. API 연동 🔌
**예상 소요**: 12-15시간
**중요도**: ⭐⭐⭐⭐

게임 서버와 데이터 동기화

#### 기능
- **RESTful API Export**: `/api/sheets/{id}`
- **Webhook 지원**: 데이터 변경 시 알림
- **실시간 Fetch**: 게임 서버에서 데이터 가져오기
- **동기화 설정**:
  - 자동 동기화 (N분마다)
  - 수동 동기화
  - 충돌 해결 전략

#### API 엔드포인트
```
GET    /api/sheets/:id
POST   /api/sheets
PUT    /api/sheets/:id
DELETE /api/sheets/:id
GET    /api/sheets/:id/export?format=json|csv|xlsx
POST   /api/sheets/:id/import
```

---

### 10. 버전 관리 및 히스토리 📜
**예상 소요**: 10-12시간
**중요도**: ⭐⭐⭐⭐

변경 이력 추적 및 복원

#### 기능
- **자동 스냅샷**: 매 N분, 매 N개 변경마다
- **수동 스냅샷**: "체크포인트" 생성
- **Diff 표시**: 변경사항 비교
- **특정 버전 복원**
- **변경 이력 타임라인**
- **변경자 표시** (협업 시)

#### UI
```
┌───────────────────────────────────┐
│ 버전 히스토리                      │
├───────────────────────────────────┤
│ ◉ 2025-10-06 18:30  (Current)     │
│   변경: 10 cells, 사용자: Admin    │
│ ○ 2025-10-06 18:15                │
│   변경: 5 cells, 사용자: Admin     │
│ ○ 2025-10-06 17:45  ⭐체크포인트   │
│   변경: 20 cells, 사용자: Designer │
├───────────────────────────────────┤
│ [Diff 보기] [이 버전으로 복원]     │
└───────────────────────────────────┘
```

---

## P3: 엔터프라이즈 및 최적화 (선택사항)

### 11. 권한 관리 🔐
**예상 소요**: 10-12시간
**중요도**: ⭐⭐⭐

대규모 조직용 접근 제어

#### 기능
- **역할 기반 접근 제어 (RBAC)**
  - Admin: 모든 권한
  - Editor: 읽기/쓰기
  - Viewer: 읽기만
  - Commenter: 읽기 + 코멘트
- **시트별 권한 설정**
- **셀 레벨 잠금**: 중요 셀 보호
- **감사 로그**: 누가, 언제, 무엇을 변경했는지

---

### 12. 성능 최적화 ⚡
**예상 소요**: 10-15시간
**중요도**: ⭐⭐⭐

대용량 데이터 처리 개선

#### 최적화 항목
- **Virtual Scrolling 개선**: 10,000+ 행 처리
- **Web Worker**: 수식 계산 이동
- **Code Splitting**: 번들 크기 감소
- **Lazy Loading**: 컴포넌트 지연 로딩
- **Memoization**: 불필요한 재계산 방지
- **IndexedDB 인덱싱**: 검색 속도 향상

---

### 13. 매크로/스크립팅 🤖
**예상 소요**: 15-20시간
**중요도**: ⭐⭐⭐

고급 자동화

#### 기능
- **JavaScript 기반 스크립트**
- **이벤트 트리거**:
  - onChange: 셀 값 변경 시
  - onLoad: 시트 로드 시
  - onSave: 저장 시
  - Custom: 사용자 정의
- **배치 처리**: 대량 데이터 조작
- **스크립트 라이브러리**: 공유 가능한 스크립트
- **디버거**: 스크립트 디버깅 도구

#### 예시
```javascript
// 자동 레벨업 보상 계산
function onCellChange(cell, oldValue, newValue) {
  if (cell.column === 'level') {
    const goldReward = newValue * 100;
    const expReward = newValue * 50;
    setCellValue(cell.row, 'gold', goldReward);
    setCellValue(cell.row, 'exp', expReward);
  }
}
```

---

### 14. 플러그인 시스템 🧩
**예상 소요**: 20-25시간
**중요도**: ⭐⭐⭐

확장성을 위한 플러그인 아키텍처

#### 기능
- 플러그인 SDK 제공
- 커스텀 함수 추가
- 커스텀 컴포넌트
- 커스텀 임포터/익스포터
- 플러그인 마켓플레이스

---

## 기타 개선 사항

### UI/UX 개선
- **셀 코멘트**: 셀에 메모 추가
- **셀 링크**: 다른 셀 참조
- **이미지 삽입**: 셀에 이미지 추가
- **리치 텍스트**: 셀 내 서식 지원
- **테마 커스터마이징**: 색상, 폰트 변경
- **레이아웃 저장**: 사용자별 UI 설정

### 데이터 관리
- **데이터 검증 규칙 확장**: 정규식, 커스텀 검증
- **자동 완성**: 드롭다운에서 자동 완성
- **데이터 정규화**: 중복 제거, 포맷 통일
- **참조 무결성**: 외래 키 검증

### Export/Import 개선
- **Google Sheets 연동**
- **Airtable 연동**
- **Notion 연동**
- **Git 연동**: 버전 관리
- **Markdown Export**: 문서화

---

## 구현 우선순위 요약

### 즉시 구현 (1-2주)
1. ⌨️ 키보드 단축키 확장 (4-6h)
2. 🖱️ 컨텍스트 메뉴 (6-8h)
3. 🌙 다크 모드 (4-5h)

**총 예상 소요**: 14-19시간

### 단기 목표 (2-4주)
4. 📊 데이터 시각화 (10-12h)
5. 🔍 고급 필터링 (6-8h)
6. 🎮 게임 템플릿 추가 (6-8h)
7. 📈 데이터 분석 함수 (4-6h)

**총 예상 소요**: 26-34시간

### 중기 목표 (4-8주)
8. 👥 실시간 협업 (35-50h)
9. 🔌 API 연동 (12-15h)
10. 📜 버전 관리 (10-12h)

**총 예상 소요**: 57-77시간

### 장기 목표 (선택사항)
11. 🔐 권한 관리 (10-12h)
12. ⚡ 성능 최적화 (10-15h)
13. 🤖 매크로/스크립팅 (15-20h)
14. 🧩 플러그인 시스템 (20-25h)

**총 예상 소요**: 55-72시간

---

## 결론

현재 애플리케이션은 **프로덕션 수준 (90% 완성도)**이며, 즉시 사용 가능합니다.

**권장 접근 방식**:
1. 먼저 **P0 (즉시 구현)** 기능들을 추가하여 사용성 개선
2. 사용자 피드백 수집
3. **P1 (중요 기능)** 중 우선순위에 따라 선택적 구현
4. 팀 규모/요구사항에 따라 **P2 (협업/고급)** 기능 검토

각 기능은 독립적으로 구현 가능하므로, 필요에 따라 선택적으로 추가할 수 있습니다.
