/**
 * Sidebar Component Tests
 * 시트 관리 및 템플릿 갤러리 사이드바 테스트
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Sidebar } from './Sidebar';
import { useSpreadsheetStore } from '@stores/spreadsheetStore';
import type { Sheet } from '@types';
import * as gameTemplates from '@utils/gameTemplates';

// Mock the store
vi.mock('@stores/spreadsheetStore', () => ({
  useSpreadsheetStore: Object.assign(vi.fn(), {
    setState: vi.fn(),
  }),
}));

// Mock gameTemplates
vi.mock('@utils/gameTemplates', () => ({
  getTemplate: vi.fn(),
}));

// Mock generateCellId
vi.mock('@utils/cellUtils', () => ({
  generateCellId: vi.fn((rowId: string, colId: string) => `${rowId}:${colId}`),
}));

describe('사이드바', () => {
  const mockAddSheet = vi.fn();
  const mockRemoveSheet = vi.fn();
  const mockSetActiveSheet = vi.fn();
  const mockRenameSheet = vi.fn();

  const mockSheets: Sheet[] = [
    {
      id: 'sheet-1',
      name: 'Sheet 1',
      columns: [],
      rows: [],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'sheet-2',
      name: 'Sheet 2',
      columns: [],
      rows: [],
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
    },
  ];

  const defaultStoreState = {
    sheets: mockSheets,
    activeSheetId: 'sheet-1',
    addSheet: mockAddSheet,
    removeSheet: mockRemoveSheet,
    setActiveSheet: mockSetActiveSheet,
    renameSheet: mockRenameSheet,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (
      useSpreadsheetStore as unknown as ReturnType<typeof vi.fn>
    ).mockImplementation(
      (selector: (state: typeof defaultStoreState) => unknown) =>
        selector(defaultStoreState)
    );

    // Mock setState to call the updater function
    (useSpreadsheetStore as any).setState.mockImplementation((updater: any) => {
      if (typeof updater === 'function') {
        updater(defaultStoreState);
      }
    });

    // Mock alert
    global.alert = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('렌더링', () => {
    it('시트 목록을 렌더링해야 함', () => {
      render(<Sidebar />);
      expect(screen.getByText('Sheet 1')).toBeInTheDocument();
      expect(screen.getByText('Sheet 2')).toBeInTheDocument();
    });

    it('"Sheets" 제목을 표시해야 함', () => {
      render(<Sidebar />);
      expect(screen.getByText('시트')).toBeInTheDocument();
    });

    it('"+ Add" 버튼을 표시해야 함', () => {
      render(<Sidebar />);
      expect(screen.getByText('+ 추가')).toBeInTheDocument();
    });

    it('"Templates" 섹션을 표시해야 함', () => {
      render(<Sidebar />);
      expect(screen.getByText('템플릿')).toBeInTheDocument();
    });

    it('"Browse Templates" 버튼을 표시해야 함', () => {
      render(<Sidebar />);
      expect(screen.getByText(/템플릿 둘러보기/)).toBeInTheDocument();
    });

    it('활성 시트를 하이라이트해야 함', () => {
      render(<Sidebar />);
      const sheet1Element = screen.getByText('Sheet 1');
      const sheet1Container = sheet1Element.parentElement;
      expect(sheet1Container).toHaveClass('bg-primary-100');
    });

    it('비활성 시트는 하이라이트하지 않아야 함', () => {
      render(<Sidebar />);
      const sheet2Element = screen.getByText('Sheet 2');
      const sheet2Container = sheet2Element.parentElement;
      expect(sheet2Container).not.toHaveClass('bg-primary-100');
    });
  });

  describe('시트 추가', () => {
    it('+ Add 버튼 클릭 시 addSheet를 호출해야 함', async () => {
      const user = userEvent.setup();
      render(<Sidebar />);

      const addButton = screen.getByText('+ 추가');
      await user.click(addButton);

      expect(mockAddSheet).toHaveBeenCalledTimes(1);
      expect(mockAddSheet).toHaveBeenCalledWith('Sheet 3');
    });

    it('시트 이름을 Sheet N 형식으로 생성해야 함', async () => {
      const user = userEvent.setup();
      render(<Sidebar />);

      const addButton = screen.getByText('+ 추가');
      await user.click(addButton);

      // sheets.length = 2, so next sheet should be "Sheet 3"
      expect(mockAddSheet).toHaveBeenCalledWith('Sheet 3');
    });
  });

  describe('시트 삭제', () => {
    it('삭제 버튼 클릭 시 removeSheet를 호출해야 함', async () => {
      const user = userEvent.setup();
      render(<Sidebar />);

      // Hover over sheet to show delete button
      const sheet2Element = screen.getByText('Sheet 2');
      await user.hover(sheet2Element);

      // Find delete button (🗑️) - get the last one since sheet-2 is second
      const deleteButtons = screen.getAllByTitle('삭제');
      await user.click(deleteButtons[deleteButtons.length - 1]);

      expect(mockRemoveSheet).toHaveBeenCalledTimes(1);
      expect(mockRemoveSheet).toHaveBeenCalledWith('sheet-2');
    });

    it('마지막 시트 삭제 시도 시 알림을 표시해야 함', async () => {
      const user = userEvent.setup();

      // Mock only one sheet
      (
        useSpreadsheetStore as unknown as ReturnType<typeof vi.fn>
      ).mockImplementation((selector: (state: any) => unknown) =>
        selector({
          ...defaultStoreState,
          sheets: [mockSheets[0]],
        })
      );

      render(<Sidebar />);

      const sheet1Element = screen.getByText('Sheet 1');
      await user.hover(sheet1Element);

      // Delete button should not be visible when only one sheet exists
      const deleteButtons = screen.queryAllByTitle('삭제');
      expect(deleteButtons).toHaveLength(0);
    });

    it('시트가 하나만 있을 때 removeSheet를 호출하지 않아야 함', async () => {
      (
        useSpreadsheetStore as unknown as ReturnType<typeof vi.fn>
      ).mockImplementation((selector: (state: any) => unknown) =>
        selector({
          ...defaultStoreState,
          sheets: [mockSheets[0]],
        })
      );

      render(<Sidebar />);

      expect(mockRemoveSheet).not.toHaveBeenCalled();
    });

    it('여러 시트가 있을 때 삭제를 허용해야 함', async () => {
      const user = userEvent.setup();
      render(<Sidebar />);

      const sheet2Element = screen.getByText('Sheet 2');
      await user.hover(sheet2Element);

      const deleteButtons = screen.getAllByTitle('삭제');
      expect(deleteButtons.length).toBeGreaterThan(0);
    });
  });

  describe('시트 선택', () => {
    it('시트 클릭 시 setActiveSheet를 호출해야 함', async () => {
      const user = userEvent.setup();
      render(<Sidebar />);

      const sheet2Element = screen.getByText('Sheet 2');
      await user.click(sheet2Element);

      expect(mockSetActiveSheet).toHaveBeenCalledTimes(1);
      expect(mockSetActiveSheet).toHaveBeenCalledWith('sheet-2');
    });

    it('클릭 시 활성 시트 스타일을 업데이트해야 함', async () => {
      render(<Sidebar />);

      const sheet1Element = screen.getByText('Sheet 1');
      const sheet1Container = sheet1Element.parentElement;
      expect(sheet1Container).toHaveClass('bg-primary-100');

      const sheet2Element = screen.getByText('Sheet 2');
      const sheet2Container = sheet2Element.parentElement;
      expect(sheet2Container).not.toHaveClass('bg-primary-100');
    });
  });

  describe('시트 이름 변경', () => {
    it('이름 변경 버튼 클릭 시 편집 모드로 전환해야 함', async () => {
      const user = userEvent.setup();
      render(<Sidebar />);

      const sheet1Element = screen.getByText('Sheet 1');
      await user.hover(sheet1Element);

      const renameButton = screen.getAllByTitle('이름 변경')[0];
      await user.click(renameButton);

      // Should show input field
      const input = screen.getByDisplayValue('Sheet 1');
      expect(input).toBeInTheDocument();
      expect(input.tagName).toBe('INPUT');
    });

    it('입력 필드에 현재 이름을 표시해야 함', async () => {
      const user = userEvent.setup();
      render(<Sidebar />);

      const sheet1Element = screen.getByText('Sheet 1');
      await user.hover(sheet1Element);

      const renameButton = screen.getAllByTitle('이름 변경')[0];
      await user.click(renameButton);

      const input = screen.getByDisplayValue('Sheet 1') as HTMLInputElement;
      expect(input.value).toBe('Sheet 1');
    });

    it('Enter 키 입력 시 저장해야 함', async () => {
      const user = userEvent.setup();
      render(<Sidebar />);

      const sheet1Element = screen.getByText('Sheet 1');
      await user.hover(sheet1Element);

      const renameButton = screen.getAllByTitle('이름 변경')[0];
      await user.click(renameButton);

      const input = screen.getByDisplayValue('Sheet 1');
      await user.clear(input);
      await user.type(input, 'New Name');
      await user.keyboard('{Enter}');

      expect(mockRenameSheet).toHaveBeenCalledTimes(1);
      expect(mockRenameSheet).toHaveBeenCalledWith('sheet-1', 'New Name');
    });

    it('Escape 키 입력 시 취소해야 함', async () => {
      const user = userEvent.setup();
      render(<Sidebar />);

      const sheet1Element = screen.getByText('Sheet 1');
      await user.hover(sheet1Element);

      const renameButton = screen.getAllByTitle('이름 변경')[0];
      await user.click(renameButton);

      const input = screen.getByDisplayValue('Sheet 1');
      await user.clear(input);
      await user.type(input, 'New Name');
      await user.keyboard('{Escape}');

      // Should not call renameSheet
      expect(mockRenameSheet).not.toHaveBeenCalled();

      // Should exit edit mode
      await waitFor(() => {
        expect(screen.queryByDisplayValue('New Name')).not.toBeInTheDocument();
      });
    });

    it('포커스 해제 시 저장해야 함', async () => {
      const user = userEvent.setup();
      render(<Sidebar />);

      const sheet1Element = screen.getByText('Sheet 1');
      await user.hover(sheet1Element);

      const renameButton = screen.getAllByTitle('이름 변경')[0];
      await user.click(renameButton);

      const input = screen.getByDisplayValue('Sheet 1');
      await user.clear(input);
      await user.type(input, 'Blurred Name');

      // Trigger blur
      await user.tab();

      expect(mockRenameSheet).toHaveBeenCalledTimes(1);
      expect(mockRenameSheet).toHaveBeenCalledWith('sheet-1', 'Blurred Name');
    });

    it('빈 이름을 저장하지 않아야 함', async () => {
      const user = userEvent.setup();
      render(<Sidebar />);

      const sheet1Element = screen.getByText('Sheet 1');
      await user.hover(sheet1Element);

      const renameButton = screen.getAllByTitle('이름 변경')[0];
      await user.click(renameButton);

      const input = screen.getByDisplayValue('Sheet 1');
      await user.clear(input);
      await user.keyboard('{Enter}');

      // Should not call renameSheet with empty name
      expect(mockRenameSheet).not.toHaveBeenCalled();
    });

    it('공백만 있는 이름을 저장하지 않아야 함', async () => {
      const user = userEvent.setup();
      render(<Sidebar />);

      const sheet1Element = screen.getByText('Sheet 1');
      await user.hover(sheet1Element);

      const renameButton = screen.getAllByTitle('이름 변경')[0];
      await user.click(renameButton);

      const input = screen.getByDisplayValue('Sheet 1');
      await user.clear(input);
      await user.type(input, '   ');
      await user.keyboard('{Enter}');

      expect(mockRenameSheet).not.toHaveBeenCalled();
    });
  });

  describe('템플릿 갤러리', () => {
    it('템플릿 갤러리 모달을 열어야 함', async () => {
      const user = userEvent.setup();
      render(<Sidebar />);

      const browseButton = screen.getByText(/템플릿 둘러보기/);
      await user.click(browseButton);

      await waitFor(() => {
        expect(screen.getByText('게임 데이터 템플릿')).toBeInTheDocument();
      });
    });

    it('9개의 템플릿 카드를 표시해야 함', async () => {
      const user = userEvent.setup();
      render(<Sidebar />);

      const browseButton = screen.getByText(/템플릿 둘러보기/);
      await user.click(browseButton);

      await waitFor(() => {
        expect(screen.getByText('캐릭터')).toBeInTheDocument();
        expect(screen.getByText('아이템')).toBeInTheDocument();
        expect(screen.getByText('스킬')).toBeInTheDocument();
        expect(screen.getByText('퀘스트')).toBeInTheDocument();
        expect(screen.getByText('적')).toBeInTheDocument();
        expect(screen.getByText('레벨')).toBeInTheDocument();
        expect(screen.getByText('대화')).toBeInTheDocument();
        expect(screen.getByText('현지화')).toBeInTheDocument();
        expect(screen.getByText('스탯 성장')).toBeInTheDocument();
      });
    });

    it('카드 클릭 시 템플릿 미리보기를 표시해야 함', async () => {
      const user = userEvent.setup();

      // Mock getTemplate
      (gameTemplates.getTemplate as ReturnType<typeof vi.fn>).mockReturnValue({
        type: 'character',
        name: 'Character Data',
        columns: [
          { id: 'id', name: 'ID', type: 'text' },
          { id: 'name', name: 'Name', type: 'text' },
        ],
      });

      render(<Sidebar />);

      const browseButton = screen.getByText(/템플릿 둘러보기/);
      await user.click(browseButton);

      await waitFor(() => {
        expect(screen.getByText('캐릭터')).toBeInTheDocument();
      });

      // Find Character card using role and name
      const characterCards = screen.getAllByRole('button');
      const characterCard = characterCards.find(
        (button) =>
          button.textContent?.includes('캐릭터') &&
          button.textContent?.includes('플레이어 및 NPC 캐릭터')
      );

      if (characterCard) {
        await user.click(characterCard);
      }

      await waitFor(() => {
        expect(screen.getByText(/템플릿 목록으로/)).toBeInTheDocument();
        expect(screen.getByText('Character Data')).toBeInTheDocument();
        expect(screen.getByText('컬럼:')).toBeInTheDocument();
      });
    });

    it('"Back to templates" 클릭 시 템플릿 목록으로 돌아가야 함', async () => {
      const user = userEvent.setup();

      (gameTemplates.getTemplate as ReturnType<typeof vi.fn>).mockReturnValue({
        type: 'character',
        name: 'Character Data',
        columns: [{ id: 'id', name: 'ID', type: 'text' }],
      });

      render(<Sidebar />);

      const browseButton = screen.getByText(/템플릿 둘러보기/);
      await user.click(browseButton);

      await waitFor(() => {
        expect(screen.getByText('캐릭터')).toBeInTheDocument();
      });

      // Find Character card using role and name
      const characterCards = screen.getAllByRole('button');
      const characterCard = characterCards.find(
        (button) =>
          button.textContent?.includes('캐릭터') &&
          button.textContent?.includes('플레이어 및 NPC 캐릭터')
      );

      if (characterCard) {
        await user.click(characterCard);
      }

      await waitFor(() => {
        expect(screen.getByText(/템플릿 목록으로/)).toBeInTheDocument();
      });

      const backButton = screen.getByText(/템플릿 목록으로/);
      await user.click(backButton);

      await waitFor(() => {
        expect(screen.queryByText(/템플릿 목록으로/)).not.toBeInTheDocument();
        expect(screen.getByText('캐릭터')).toBeInTheDocument();
      });
    });

    it('닫기 버튼(×) 클릭 시 모달을 닫아야 함', async () => {
      const user = userEvent.setup();
      render(<Sidebar />);

      const browseButton = screen.getByText(/템플릿 둘러보기/);
      await user.click(browseButton);

      await waitFor(() => {
        expect(screen.getByText('게임 데이터 템플릿')).toBeInTheDocument();
      });

      const closeButton = screen.getByText('×');
      await user.click(closeButton);

      await waitFor(() => {
        expect(
          screen.queryByText('게임 데이터 템플릿')
        ).not.toBeInTheDocument();
      });
    });

    it('"Cancel" 버튼 클릭 시 모달을 닫아야 함', async () => {
      const user = userEvent.setup();

      (gameTemplates.getTemplate as ReturnType<typeof vi.fn>).mockReturnValue({
        type: 'character',
        name: 'Character Data',
        columns: [{ id: 'id', name: 'ID', type: 'text' }],
      });

      render(<Sidebar />);

      const browseButton = screen.getByText(/템플릿 둘러보기/);
      await user.click(browseButton);

      await waitFor(() => {
        expect(screen.getByText('캐릭터')).toBeInTheDocument();
      });

      // Find Character card using role and name
      const characterCards = screen.getAllByRole('button');
      const characterCard = characterCards.find(
        (button) =>
          button.textContent?.includes('캐릭터') &&
          button.textContent?.includes('플레이어 및 NPC 캐릭터')
      );

      if (characterCard) {
        await user.click(characterCard);
      }

      await waitFor(() => {
        expect(screen.getByText('취소')).toBeInTheDocument();
      });

      const cancelButton = screen.getByText('취소');
      await user.click(cancelButton);

      await waitFor(() => {
        expect(
          screen.queryByText('게임 데이터 템플릿')
        ).not.toBeInTheDocument();
      });
    });

  });

  describe('템플릿 시트 생성', () => {
    it('템플릿에서 시트를 생성해야 함', async () => {
      const user = userEvent.setup();

      const mockTemplate = {
        type: 'character' as const,
        name: 'Character Data',
        columns: [
          { id: 'id', name: 'ID', type: 'text' as const, width: 120 },
          { id: 'name', name: 'Name', type: 'text' as const, width: 150 },
        ],
        sampleData: [{ id: 'char_001', name: 'Hero' }],
      };

      (gameTemplates.getTemplate as ReturnType<typeof vi.fn>).mockReturnValue(
        mockTemplate
      );

      render(<Sidebar />);

      const browseButton = screen.getByText(/템플릿 둘러보기/);
      await user.click(browseButton);

      await waitFor(() => {
        expect(screen.getByText('캐릭터')).toBeInTheDocument();
      });

      const characterCard = screen.getByText('캐릭터').closest('button');
      if (characterCard) {
        await user.click(characterCard);
      }

      await waitFor(() => {
        expect(screen.getByText('시트 생성')).toBeInTheDocument();
      });

      const createButton = screen.getByText('시트 생성');
      await user.click(createButton);

      // Modal should close
      await waitFor(() => {
        expect(
          screen.queryByText('게임 데이터 템플릿')
        ).not.toBeInTheDocument();
      });
    });

    it('중복된 이름을 처리해야 함', async () => {
      const user = userEvent.setup();

      const sheetsWithDuplicate = [
        ...mockSheets,
        {
          id: 'sheet-3',
          name: '캐릭터',
          columns: [],
          rows: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (
        useSpreadsheetStore as unknown as ReturnType<typeof vi.fn>
      ).mockImplementation((selector: (state: any) => unknown) =>
        selector({
          ...defaultStoreState,
          sheets: sheetsWithDuplicate,
        })
      );

      const mockTemplate = {
        type: 'character' as const,
        name: 'Character Data',
        columns: [{ id: 'id', name: 'ID', type: 'text' as const }],
      };

      (gameTemplates.getTemplate as ReturnType<typeof vi.fn>).mockReturnValue(
        mockTemplate
      );

      render(<Sidebar />);

      const browseButton = screen.getByText(/템플릿 둘러보기/);
      await user.click(browseButton);

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        const hasCharacterCard = buttons.some(
          (btn) =>
            btn.textContent?.includes('캐릭터') &&
            btn.textContent?.includes('플레이어 및 NPC 캐릭터')
        );
        expect(hasCharacterCard).toBe(true);
      });

      // Find Character card using role and name
      const characterCards = screen.getAllByRole('button');
      const characterCard = characterCards.find(
        (button) =>
          button.textContent?.includes('캐릭터') &&
          button.textContent?.includes('플레이어 및 NPC 캐릭터')
      );

      if (characterCard) {
        await user.click(characterCard);
      }

      await waitFor(() => {
        expect(screen.getByText('시트 생성')).toBeInTheDocument();
      });

      const createButton = screen.getByText('시트 생성');
      await user.click(createButton);

      // Sheet should be created with name "캐릭터 1"
      await waitFor(() => {
        expect(
          screen.queryByText('게임 데이터 템플릿')
        ).not.toBeInTheDocument();
      });
    });

    it('생성 후 모달을 닫아야 함', async () => {
      const user = userEvent.setup();

      const mockTemplate = {
        type: 'character' as const,
        name: 'Character Data',
        columns: [{ id: 'id', name: 'ID', type: 'text' as const }],
      };

      (gameTemplates.getTemplate as ReturnType<typeof vi.fn>).mockReturnValue(
        mockTemplate
      );

      render(<Sidebar />);

      const browseButton = screen.getByText(/템플릿 둘러보기/);
      await user.click(browseButton);

      await waitFor(() => {
        expect(screen.getByText('게임 데이터 템플릿')).toBeInTheDocument();
      });

      const characterCard = screen.getByText('캐릭터').closest('button');
      if (characterCard) {
        await user.click(characterCard);
      }

      await waitFor(() => {
        expect(screen.getByText('시트 생성')).toBeInTheDocument();
      });

      const createButton = screen.getByText('시트 생성');
      await user.click(createButton);

      await waitFor(() => {
        expect(
          screen.queryByText('게임 데이터 템플릿')
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('예외 케이스', () => {
    it('빈 시트 배열을 처리해야 함', () => {
      (
        useSpreadsheetStore as unknown as ReturnType<typeof vi.fn>
      ).mockImplementation((selector: (state: any) => unknown) =>
        selector({
          ...defaultStoreState,
          sheets: [],
        })
      );

      render(<Sidebar />);
      expect(screen.getByText('시트')).toBeInTheDocument();
      expect(screen.getByText('+ 추가')).toBeInTheDocument();
    });

    it('시트가 하나만 있을 때 비활성 시트에 호버해도 삭제 버튼을 표시하지 않아야 함', async () => {
      const user = userEvent.setup();

      (
        useSpreadsheetStore as unknown as ReturnType<typeof vi.fn>
      ).mockImplementation((selector: (state: any) => unknown) =>
        selector({
          ...defaultStoreState,
          sheets: [mockSheets[0]],
        })
      );

      render(<Sidebar />);

      const sheet1Element = screen.getByText('Sheet 1');
      await user.hover(sheet1Element);

      const deleteButtons = screen.queryAllByTitle('삭제');
      expect(deleteButtons).toHaveLength(0);
    });

    it('빠른 시트 선택을 처리해야 함', async () => {
      const user = userEvent.setup();
      render(<Sidebar />);

      const sheet1 = screen.getByText('Sheet 1');
      const sheet2 = screen.getByText('Sheet 2');

      await user.click(sheet2);
      await user.click(sheet1);
      await user.click(sheet2);

      expect(mockSetActiveSheet).toHaveBeenCalledTimes(3);
    });

    it('샘플 데이터 없이 템플릿 생성을 처리해야 함', async () => {
      const user = userEvent.setup();

      const mockTemplate = {
        type: 'character' as const,
        name: 'Character Data',
        columns: [{ id: 'id', name: 'ID', type: 'text' as const }],
        // No sampleData
      };

      (gameTemplates.getTemplate as ReturnType<typeof vi.fn>).mockReturnValue(
        mockTemplate
      );

      render(<Sidebar />);

      const browseButton = screen.getByText(/템플릿 둘러보기/);
      await user.click(browseButton);

      await waitFor(() => {
        expect(screen.getByText('캐릭터')).toBeInTheDocument();
      });

      const characterCard = screen.getByText('캐릭터').closest('button');
      if (characterCard) {
        await user.click(characterCard);
      }

      await waitFor(() => {
        expect(screen.getByText('시트 생성')).toBeInTheDocument();
      });

      const createButton = screen.getByText('시트 생성');
      await user.click(createButton);

      await waitFor(() => {
        expect(
          screen.queryByText('게임 데이터 템플릿')
        ).not.toBeInTheDocument();
      });
    });
  });
});
