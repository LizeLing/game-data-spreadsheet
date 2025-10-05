/**
 * ConditionalFormatDialog Component
 * 조건부 서식 설정 다이얼로그
 */

import { useState } from 'react';
import { useSpreadsheetStore } from '@stores/spreadsheetStore';
import type { ConditionalFormat, CellStyle, CellValue, Sheet } from '@types';

interface ConditionalFormatDialogProps {
  sheet: Sheet;
  onClose: () => void;
}

// 게임 데이터 조건부 서식 프리셋
export const GAME_DATA_PRESETS = {
  // 희귀도 색상
  RARITY_COLORS: {
    common: { backgroundColor: '#9e9e9e', color: '#ffffff' },
    uncommon: { backgroundColor: '#4caf50', color: '#ffffff' },
    rare: { backgroundColor: '#2196f3', color: '#ffffff' },
    epic: { backgroundColor: '#9c27b0', color: '#ffffff' },
    legendary: { backgroundColor: '#ff9800', color: '#ffffff' },
    mythic: { backgroundColor: '#f44336', color: '#ffffff' },
  },

  // 스탯 범위 색상
  STAT_RANGES: [
    { max: 20, label: '매우 낮음', backgroundColor: '#ffcdd2', color: '#b71c1c' }, // red
    { max: 40, label: '낮음', backgroundColor: '#ffe0b2', color: '#e65100' }, // orange
    { max: 60, label: '보통', backgroundColor: '#fff9c4', color: '#f57f17' }, // yellow
    { max: 80, label: '높음', backgroundColor: '#c8e6c9', color: '#1b5e20' }, // green
    { max: 100, label: '매우 높음', backgroundColor: '#bbdefb', color: '#0d47a1' }, // blue
  ],

  // 퀄리티 색상
  QUALITY_COLORS: {
    poor: { backgroundColor: '#9e9e9e', color: '#ffffff' },
    normal: { backgroundColor: '#ffffff', color: '#000000' },
    good: { backgroundColor: '#4caf50', color: '#ffffff' },
    excellent: { backgroundColor: '#2196f3', color: '#ffffff' },
    perfect: { backgroundColor: '#9c27b0', color: '#ffffff' },
  },

  // 상태 색상
  STATUS_COLORS: {
    active: { backgroundColor: '#4caf50', color: '#ffffff' },
    inactive: { backgroundColor: '#9e9e9e', color: '#ffffff' },
    pending: { backgroundColor: '#ff9800', color: '#ffffff' },
    error: { backgroundColor: '#f44336', color: '#ffffff' },
  },
};

export const ConditionalFormatDialog = ({
  sheet,
  onClose,
}: ConditionalFormatDialogProps) => {
  const [formats, setFormats] = useState<ConditionalFormat[]>(
    sheet.conditionalFormats || []
  );
  const [selectedPreset, setSelectedPreset] = useState<string>('none');

  const addConditionalFormat = useSpreadsheetStore(
    (state) => state.addConditionalFormat
  );
  const removeConditionalFormat = useSpreadsheetStore(
    (state) => state.removeConditionalFormat
  );

  const addNewFormat = () => {
    const newFormat: ConditionalFormat = {
      id: `cf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      range: {
        startRow: 0,
        endRow: sheet.rows.length - 1,
        startColumn: 0,
        endColumn: sheet.columns.length - 1,
      },
      condition: {
        type: 'value',
        operator: 'greaterThan',
        value: 0,
      },
      style: {
        backgroundColor: '#ffeb3b',
        color: '#000000',
      },
      priority: formats.length,
    };

    setFormats([...formats, newFormat]);
  };

  const updateFormat = (
    id: string,
    updates: Partial<ConditionalFormat>
  ) => {
    setFormats(formats.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const deleteFormat = (id: string) => {
    setFormats(formats.filter((f) => f.id !== id));
  };

  const applyPreset = (presetType: string) => {
    if (presetType === 'none') return;

    const newFormats: ConditionalFormat[] = [];

    if (presetType === 'rarity') {
      Object.entries(GAME_DATA_PRESETS.RARITY_COLORS).forEach(
        ([rarity, style], index) => {
          newFormats.push({
            id: `cf-${Date.now()}-${index}`,
            range: {
              startRow: 0,
              endRow: sheet.rows.length - 1,
              startColumn: 0,
              endColumn: sheet.columns.length - 1,
            },
            condition: {
              type: 'text',
              operator: 'equals',
              value: rarity,
            },
            style,
            priority: index,
          });
        }
      );
    } else if (presetType === 'stat_ranges') {
      GAME_DATA_PRESETS.STAT_RANGES.forEach((range, index) => {
        newFormats.push({
          id: `cf-stat-${Date.now()}-${index}`,
          range: {
            startRow: 0,
            endRow: sheet.rows.length - 1,
            startColumn: 0,
            endColumn: sheet.columns.length - 1,
          },
          condition: {
            type: 'value',
            operator: index === 0 ? 'lessThanOrEqual' : 'lessThanOrEqual',
            value: range.max,
          },
          style: {
            backgroundColor: range.backgroundColor,
            color: range.color,
          },
          priority: index,
        });
      });
    } else if (presetType === 'quality') {
      Object.entries(GAME_DATA_PRESETS.QUALITY_COLORS).forEach(
        ([quality, style], index) => {
          newFormats.push({
            id: `cf-quality-${Date.now()}-${index}`,
            range: {
              startRow: 0,
              endRow: sheet.rows.length - 1,
              startColumn: 0,
              endColumn: sheet.columns.length - 1,
            },
            condition: {
              type: 'text',
              operator: 'equals',
              value: quality,
            },
            style,
            priority: index,
          });
        }
      );
    } else if (presetType === 'status') {
      Object.entries(GAME_DATA_PRESETS.STATUS_COLORS).forEach(
        ([status, style], index) => {
          newFormats.push({
            id: `cf-status-${Date.now()}-${index}`,
            range: {
              startRow: 0,
              endRow: sheet.rows.length - 1,
              startColumn: 0,
              endColumn: sheet.columns.length - 1,
            },
            condition: {
              type: 'text',
              operator: 'equals',
              value: status,
            },
            style,
            priority: index,
          });
        }
      );
    }

    setFormats([...formats, ...newFormats]);
  };

  const handleApply = () => {
    // Remove existing formats
    if (sheet.conditionalFormats) {
      sheet.conditionalFormats.forEach((format) => {
        removeConditionalFormat(sheet.id, format.id);
      });
    }

    // Add new formats
    formats.forEach((format) => {
      addConditionalFormat(sheet.id, format);
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[800px] max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">조건부 서식</h2>

        {/* Presets */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">프리셋 적용</label>
          <div className="flex gap-2">
            <select
              value={selectedPreset}
              onChange={(e) => setSelectedPreset(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="none">프리셋 선택...</option>
              <option value="rarity">희귀도 색상 (Common ~ Mythic)</option>
              <option value="stat_ranges">스탯 범위 (0-100)</option>
              <option value="quality">퀄리티 (Poor ~ Perfect)</option>
              <option value="status">상태 (Active, Inactive, ...)</option>
            </select>
            <button
              onClick={() => applyPreset(selectedPreset)}
              disabled={selectedPreset === 'none'}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              적용
            </button>
          </div>
        </div>

        {/* Format Rules */}
        <div className="space-y-3 mb-4">
          {formats.map((format, index) => (
            <FormatRuleEditor
              key={format.id}
              format={format}
              index={index}
              sheet={sheet}
              onChange={(updates) => updateFormat(format.id, updates)}
              onDelete={() => deleteFormat(format.id)}
            />
          ))}
        </div>

        <button
          onClick={addNewFormat}
          className="mb-4 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
        >
          + 규칙 추가
        </button>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
          >
            취소
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            적용
          </button>
        </div>
      </div>
    </div>
  );
};

// Format Rule Editor Component
interface FormatRuleEditorProps {
  format: ConditionalFormat;
  index: number;
  sheet: Sheet;
  onChange: (updates: Partial<ConditionalFormat>) => void;
  onDelete: () => void;
}

const FormatRuleEditor = ({
  format,
  index,
  sheet,
  onChange,
  onDelete,
}: FormatRuleEditorProps) => {
  const updateCondition = (updates: Partial<ConditionalFormat['condition']>) => {
    onChange({
      condition: { ...format.condition, ...updates },
    });
  };

  const updateStyle = (updates: Partial<CellStyle>) => {
    onChange({
      style: { ...format.style, ...updates },
    });
  };

  return (
    <div className="border border-gray-200 rounded p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium">규칙 {index + 1}</span>
        <button
          onClick={onDelete}
          className="text-red-600 hover:bg-red-50 px-2 py-1 rounded text-sm"
        >
          삭제
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        {/* Condition Type */}
        <div>
          <label className="block text-xs text-gray-600 mb-1">조건 타입</label>
          <select
            value={format.condition.type}
            onChange={(e) =>
              updateCondition({
                type: e.target.value as 'value' | 'text' | 'formula',
              })
            }
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="value">숫자</option>
            <option value="text">텍스트</option>
          </select>
        </div>

        {/* Operator */}
        <div>
          <label className="block text-xs text-gray-600 mb-1">연산자</label>
          <select
            value={format.condition.operator}
            onChange={(e) =>
              updateCondition({
                operator: e.target.value as ConditionalFormat['condition']['operator'],
              })
            }
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="equals">같음</option>
            <option value="notEquals">같지 않음</option>
            {format.condition.type === 'value' && (
              <>
                <option value="greaterThan">초과</option>
                <option value="lessThan">미만</option>
                <option value="greaterThanOrEqual">이상</option>
                <option value="lessThanOrEqual">이하</option>
                <option value="between">범위</option>
              </>
            )}
            {format.condition.type === 'text' && (
              <option value="contains">포함</option>
            )}
          </select>
        </div>

        {/* Value */}
        <div>
          <label className="block text-xs text-gray-600 mb-1">값</label>
          <input
            type={format.condition.type === 'value' ? 'number' : 'text'}
            value={String(format.condition.value ?? '')}
            onChange={(e) => {
              const value =
                format.condition.type === 'value'
                  ? Number(e.target.value)
                  : e.target.value;
              updateCondition({ value });
            }}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Style Controls */}
      <div className="grid grid-cols-4 gap-3">
        <div>
          <label className="block text-xs text-gray-600 mb-1">배경색</label>
          <input
            type="color"
            value={format.style.backgroundColor || '#ffffff'}
            onChange={(e) => updateStyle({ backgroundColor: e.target.value })}
            className="w-full h-8 rounded border border-gray-300 cursor-pointer"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1">글자색</label>
          <input
            type="color"
            value={format.style.color || '#000000'}
            onChange={(e) => updateStyle({ color: e.target.value })}
            className="w-full h-8 rounded border border-gray-300 cursor-pointer"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1">굵기</label>
          <select
            value={format.style.fontWeight || 'normal'}
            onChange={(e) =>
              updateStyle({
                fontWeight: e.target.value as 'normal' | 'bold',
              })
            }
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="normal">보통</option>
            <option value="bold">굵게</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1">우선순위</label>
          <input
            type="number"
            value={format.priority}
            onChange={(e) => onChange({ priority: Number(e.target.value) })}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Preview */}
      <div className="mt-3 p-2 border border-gray-200 rounded">
        <div className="text-xs text-gray-600 mb-1">미리보기:</div>
        <div
          style={{
            backgroundColor: format.style.backgroundColor,
            color: format.style.color,
            fontWeight: format.style.fontWeight,
            padding: '4px 8px',
            borderRadius: '2px',
          }}
        >
          샘플 텍스트
        </div>
      </div>
    </div>
  );
};
