/**
 * Sidebar Component
 * 사이드바 - 시트 탭 관리, 템플릿 등
 */

import { useState } from 'react';
import { useSpreadsheetStore } from '@stores/spreadsheetStore';
import {
  getTemplate,
  type GameDataTemplateType,
  type GameDataTemplate,
} from '@utils/gameTemplates';
import { useGameDataTemplate } from '@hooks/useGameDataTemplate';

interface TemplateInfo {
  type: GameDataTemplateType;
  icon: string;
  name: string;
  color: string;
  description: string;
}

const templateInfos: TemplateInfo[] = [
  {
    type: 'character',
    icon: '👤',
    name: '캐릭터',
    color: 'blue',
    description: '플레이어 및 NPC 캐릭터',
  },
  {
    type: 'item',
    icon: '⚔️',
    name: '아이템',
    color: 'purple',
    description: '무기, 방어구, 소모품',
  },
  {
    type: 'skill',
    icon: '✨',
    name: '스킬',
    color: 'green',
    description: '능력과 마법',
  },
  {
    type: 'quest',
    icon: '📜',
    name: '퀘스트',
    color: 'yellow',
    description: '미션과 목표',
  },
  {
    type: 'enemy',
    icon: '👹',
    name: '적',
    color: 'red',
    description: '몬스터와 보스',
  },
  {
    type: 'level',
    icon: '🗺️',
    name: '레벨',
    color: 'teal',
    description: '스테이지와 던전',
  },
  {
    type: 'dialogue',
    icon: '💬',
    name: '대화',
    color: 'pink',
    description: '대화 내용',
  },
  {
    type: 'localization',
    icon: '🌐',
    name: '현지화',
    color: 'indigo',
    description: '다국어 지원',
  },
  {
    type: 'statProgression',
    icon: '📊',
    name: '스탯 성장',
    color: 'orange',
    description: '레벨업 스탯',
  },
];

export const Sidebar = () => {
  const sheets = useSpreadsheetStore((state) => state.sheets);
  const activeSheetId = useSpreadsheetStore((state) => state.activeSheetId);
  const addSheet = useSpreadsheetStore((state) => state.addSheet);
  const removeSheet = useSpreadsheetStore((state) => state.removeSheet);
  const setActiveSheet = useSpreadsheetStore((state) => state.setActiveSheet);
  const renameSheet = useSpreadsheetStore((state) => state.renameSheet);

  const { createSheetFromTemplate } = useGameDataTemplate();

  const [editingSheetId, setEditingSheetId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<GameDataTemplateType | null>(null);

  const handleAddSheet = () => {
    addSheet(`Sheet ${sheets.length + 1}`);
  };

  const handleRemoveSheet = (id: string) => {
    if (sheets.length > 1) {
      removeSheet(id);
    } else {
      alert('마지막 시트는 삭제할 수 없습니다');
    }
  };

  const handleStartRename = (id: string, currentName: string) => {
    setEditingSheetId(id);
    setEditingName(currentName);
  };

  const handleFinishRename = () => {
    if (editingSheetId && editingName.trim()) {
      renameSheet(editingSheetId, editingName.trim());
    }
    setEditingSheetId(null);
    setEditingName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleFinishRename();
    } else if (e.key === 'Escape') {
      setEditingSheetId(null);
      setEditingName('');
    }
  };

  const handleCreateFromTemplate = () => {
    if (!selectedTemplate) return;

    const templateInfo = templateInfos.find((t) => t.type === selectedTemplate);
    if (!templateInfo) return;

    // Create sheet name (avoid duplicates)
    const baseName = templateInfo.name;
    let sheetName = baseName;
    let counter = 1;

    while (sheets.some((s) => s.name === sheetName)) {
      sheetName = `${baseName} ${counter}`;
      counter++;
    }

    // Create sheet from template using the hook
    const newSheet = createSheetFromTemplate(selectedTemplate, sheetName);

    // Add sheet to store
    useSpreadsheetStore.setState((state) => ({
      sheets: [...state.sheets, newSheet],
      activeSheetId: newSheet.id,
    }));

    // Close modal and reset
    setShowTemplateGallery(false);
    setSelectedTemplate(null);
  };

  return (
    <div className="w-64 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Sheets section */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">시트</h3>
          <button
            onClick={handleAddSheet}
            className="text-xs px-2 py-1 bg-primary-500 dark:bg-primary-600 text-white rounded hover:bg-primary-600 dark:hover:bg-primary-700"
            title="새 시트 추가"
          >
            + 추가
          </button>
        </div>

        <div className="space-y-1">
          {sheets.map((sheet) => (
            <div
              key={sheet.id}
              className={`group relative flex items-center p-2 rounded cursor-pointer transition-colors ${
                sheet.id === activeSheetId
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-100'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'
              }`}
            >
              {editingSheetId === sheet.id ? (
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={handleFinishRename}
                  onKeyDown={handleKeyDown}
                  className="flex-1 px-2 py-1 text-sm border border-primary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                  autoFocus
                />
              ) : (
                <>
                  <div
                    className="flex-1 text-sm truncate"
                    onClick={() => setActiveSheet(sheet.id)}
                  >
                    {sheet.name}
                  </div>
                  <div className="hidden group-hover:flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartRename(sheet.id, sheet.name);
                      }}
                      className="p-1 hover:bg-gray-200 rounded"
                      title="이름 변경"
                    >
                      ✏️
                    </button>
                    {sheets.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveSheet(sheet.id);
                        }}
                        className="p-1 hover:bg-red-100 rounded"
                        title="삭제"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Templates section */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">템플릿</h3>
        <button
          onClick={() => setShowTemplateGallery(true)}
          className="w-full px-3 py-2 text-sm rounded bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 text-white hover:from-primary-600 hover:to-primary-700 dark:hover:from-primary-700 dark:hover:to-primary-800 transition-all font-medium"
        >
          📋 템플릿 둘러보기
        </button>
      </div>

      {/* Template Gallery Modal */}
      {showTemplateGallery && (
        <TemplateGallery
          selectedTemplate={selectedTemplate}
          onSelectTemplate={setSelectedTemplate}
          onClose={() => {
            setShowTemplateGallery(false);
            setSelectedTemplate(null);
          }}
          onCreate={handleCreateFromTemplate}
        />
      )}
    </div>
  );
};

// Template Gallery Component
interface TemplateGalleryProps {
  selectedTemplate: GameDataTemplateType | null;
  onSelectTemplate: (type: GameDataTemplateType | null) => void;
  onClose: () => void;
  onCreate: () => void;
}

const TemplateGallery = ({
  selectedTemplate,
  onSelectTemplate,
  onClose,
  onCreate,
}: TemplateGalleryProps) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            게임 데이터 템플릿
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {!selectedTemplate ? (
            // Template grid
            <div className="grid grid-cols-3 gap-4">
              {templateInfos.map((template) => (
                <TemplateCard
                  key={template.type}
                  template={template}
                  onClick={() => onSelectTemplate(template.type)}
                />
              ))}
            </div>
          ) : (
            // Template preview
            <div>
              <button
                onClick={() => onSelectTemplate(null)}
                className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 mb-4 flex items-center gap-1"
              >
                ← 템플릿 목록으로
              </button>

              <TemplatePreview
                template={getTemplate(selectedTemplate)}
                templateInfo={
                  templateInfos.find((t) => t.type === selectedTemplate)!
                }
              />
            </div>
          )}
        </div>

        {/* Footer */}
        {selectedTemplate && (
          <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              취소
            </button>
            <button
              onClick={onCreate}
              className="px-4 py-2 text-sm text-white bg-primary-600 dark:bg-primary-700 rounded hover:bg-primary-700 dark:hover:bg-primary-800"
            >
              시트 생성
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Template Card Component
interface TemplateCardProps {
  template: TemplateInfo;
  onClick: () => void;
}

const TemplateCard = ({ template, onClick }: TemplateCardProps) => {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200 hover:border-blue-400 hover:bg-blue-100',
    purple:
      'bg-purple-50 border-purple-200 hover:border-purple-400 hover:bg-purple-100',
    green:
      'bg-green-50 border-green-200 hover:border-green-400 hover:bg-green-100',
    yellow:
      'bg-yellow-50 border-yellow-200 hover:border-yellow-400 hover:bg-yellow-100',
    red: 'bg-red-50 border-red-200 hover:border-red-400 hover:bg-red-100',
    teal: 'bg-teal-50 border-teal-200 hover:border-teal-400 hover:bg-teal-100',
    pink: 'bg-pink-50 border-pink-200 hover:border-pink-400 hover:bg-pink-100',
    indigo:
      'bg-indigo-50 border-indigo-200 hover:border-indigo-400 hover:bg-indigo-100',
    orange:
      'bg-orange-50 border-orange-200 hover:border-orange-400 hover:bg-orange-100',
  };

  return (
    <button
      onClick={onClick}
      className={`p-4 border-2 rounded-lg text-left transition-all ${
        colorClasses[template.color]
      }`}
    >
      <div className="text-3xl mb-2">{template.icon}</div>
      <div className="font-semibold text-gray-800 dark:text-gray-100 mb-1">{template.name}</div>
      <div className="text-xs text-gray-600 dark:text-gray-300">{template.description}</div>
    </button>
  );
};

// Template Preview Component
interface TemplatePreviewProps {
  template: GameDataTemplate;
  templateInfo: TemplateInfo;
}

const TemplatePreview = ({ template, templateInfo }: TemplatePreviewProps) => {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="text-4xl">{templateInfo.icon}</div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {template.name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">{templateInfo.description}</p>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">컬럼:</h4>
        <div className="grid grid-cols-2 gap-2">
          {template.columns.map((col) => (
            <div key={col.id} className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-primary-400 dark:bg-primary-500 rounded-full"></div>
              <span className="font-medium text-gray-700 dark:text-gray-200">{col.name}</span>
              <span className="text-gray-500 dark:text-gray-400">({col.type})</span>
            </div>
          ))}
        </div>

        {template.sampleData && template.sampleData.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
              샘플 데이터:
            </h4>
            <div className="text-xs text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 rounded p-2 border border-gray-200 dark:border-gray-600">
              {template.sampleData.length}개의 샘플 행 사용 가능
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
