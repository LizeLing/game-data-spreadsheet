/**
 * AdvancedFormatDialog Component
 * 고급 셀 서식 설정 다이얼로그 (테두리, 폰트, 숫자 포맷)
 */

import { useState } from 'react';
import { useSpreadsheetStore } from '@stores/spreadsheetStore';
import type { CellStyle, BorderStyle, SelectionRange } from '@types';

interface AdvancedFormatDialogProps {
  selection: SelectionRange;
  sheetId: string;
  onClose: () => void;
}

// 숫자 포맷 프리셋
const NUMBER_FORMAT_PRESETS = [
  { label: '일반', value: '' },
  { label: '숫자 (1,234)', value: '#,##0' },
  { label: '숫자 (1,234.00)', value: '#,##0.00' },
  { label: '퍼센트 (0%)', value: '0%' },
  { label: '퍼센트 (0.0%)', value: '0.0%' },
  { label: '퍼센트 (0.00%)', value: '0.00%' },
  { label: '통화 ($1,234)', value: '$#,##0' },
  { label: '통화 ($1,234.00)', value: '$#,##0.00' },
  { label: '과학적 (1.23E+3)', value: '0.00E+0' },
];

// 폰트 패밀리 옵션
const FONT_FAMILIES = [
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Courier New',
  'Verdana',
  'Georgia',
  'Palatino',
  'Garamond',
  'Comic Sans MS',
  'Trebuchet MS',
  'Arial Black',
  'Impact',
];

// 폰트 크기 옵션
const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72];

export const AdvancedFormatDialog = ({
  selection,
  sheetId,
  onClose,
}: AdvancedFormatDialogProps) => {
  const applyCellStyle = useSpreadsheetStore((state) => state.applyCellStyle);

  const [style, setStyle] = useState<Partial<CellStyle>>({
    fontFamily: 'Arial',
    fontSize: 12,
    fontWeight: 'normal',
    fontStyle: 'normal',
    textDecoration: 'none',
    color: '#000000',
    backgroundColor: '#ffffff',
    textAlign: 'left',
    border: {
      top: { width: 1, style: 'solid', color: '#000000' },
      right: { width: 1, style: 'solid', color: '#000000' },
      bottom: { width: 1, style: 'solid', color: '#000000' },
      left: { width: 1, style: 'solid', color: '#000000' },
    },
    numberFormat: '',
  });

  const updateBorder = (
    side: 'top' | 'right' | 'bottom' | 'left',
    updates: Partial<BorderStyle>
  ) => {
    setStyle({
      ...style,
      border: {
        ...style.border,
        [side]: { ...style.border?.[side], ...updates },
      },
    });
  };

  const applyToAllBorders = (updates: Partial<BorderStyle>) => {
    setStyle({
      ...style,
      border: {
        top: { ...style.border?.top, ...updates },
        right: { ...style.border?.right, ...updates },
        bottom: { ...style.border?.bottom, ...updates },
        left: { ...style.border?.left, ...updates },
      },
    });
  };

  const handleApply = () => {
    applyCellStyle(sheetId, selection, style);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-[700px] max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">고급 서식</h2>

        {/* Font Section */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold mb-3 text-gray-900 dark:text-gray-100">폰트</h3>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                폰트 패밀리
              </label>
              <select
                value={style.fontFamily}
                onChange={(e) => setStyle({ ...style, fontFamily: e.target.value })}
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                {FONT_FAMILIES.map((font) => (
                  <option key={font} value={font} style={{ fontFamily: font }}>
                    {font}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">크기</label>
              <select
                value={style.fontSize}
                onChange={(e) =>
                  setStyle({ ...style, fontSize: Number(e.target.value) })
                }
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                {FONT_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">스타일</label>
              <div className="flex gap-1">
                <button
                  onClick={() =>
                    setStyle({
                      ...style,
                      fontWeight: style.fontWeight === 'bold' ? 'normal' : 'bold',
                    })
                  }
                  className={`flex-1 px-2 py-1 text-sm border rounded ${
                    style.fontWeight === 'bold'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <span className="font-bold">B</span>
                </button>
                <button
                  onClick={() =>
                    setStyle({
                      ...style,
                      fontStyle: style.fontStyle === 'italic' ? 'normal' : 'italic',
                    })
                  }
                  className={`flex-1 px-2 py-1 text-sm border rounded ${
                    style.fontStyle === 'italic'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <span className="italic">I</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Border Section */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold mb-3 text-gray-900 dark:text-gray-100">테두리</h3>

          {/* All Borders */}
          <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">모든 테두리</div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs mb-1 text-gray-700 dark:text-gray-300">두께</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={style.border?.top?.width || 1}
                  onChange={(e) =>
                    applyToAllBorders({ width: Number(e.target.value) })
                  }
                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-xs mb-1 text-gray-700 dark:text-gray-300">스타일</label>
                <select
                  value={style.border?.top?.style || 'solid'}
                  onChange={(e) =>
                    applyToAllBorders({
                      style: e.target.value as BorderStyle['style'],
                    })
                  }
                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="solid">실선</option>
                  <option value="dashed">파선</option>
                  <option value="dotted">점선</option>
                  <option value="double">이중선</option>
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1 text-gray-700 dark:text-gray-300">색상</label>
                <input
                  type="color"
                  value={style.border?.top?.color || '#000000'}
                  onChange={(e) => applyToAllBorders({ color: e.target.value })}
                  className="w-full h-8 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Individual Borders */}
          <div className="grid grid-cols-2 gap-3">
            {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
              <div key={side} className="p-2 border border-gray-200 dark:border-gray-700 rounded">
                <div className="text-xs font-medium mb-2 text-gray-900 dark:text-gray-100">
                  {side === 'top' && '위'}
                  {side === 'right' && '오른쪽'}
                  {side === 'bottom' && '아래'}
                  {side === 'left' && '왼쪽'}
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={style.border?.[side]?.width || 1}
                    onChange={(e) =>
                      updateBorder(side, { width: Number(e.target.value) })
                    }
                    className="px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    placeholder="두께"
                  />
                  <select
                    value={style.border?.[side]?.style || 'solid'}
                    onChange={(e) =>
                      updateBorder(side, {
                        style: e.target.value as BorderStyle['style'],
                      })
                    }
                    className="px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <option value="solid">실선</option>
                    <option value="dashed">파선</option>
                    <option value="dotted">점선</option>
                    <option value="double">이중</option>
                  </select>
                  <input
                    type="color"
                    value={style.border?.[side]?.color || '#000000'}
                    onChange={(e) => updateBorder(side, { color: e.target.value })}
                    className="w-full h-6 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Number Format Section */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold mb-3 text-gray-900 dark:text-gray-100">숫자 포맷</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">프리셋</label>
              <select
                value={style.numberFormat}
                onChange={(e) =>
                  setStyle({ ...style, numberFormat: e.target.value })
                }
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                {NUMBER_FORMAT_PRESETS.map((preset) => (
                  <option key={preset.value} value={preset.value}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                커스텀 포맷
              </label>
              <input
                type="text"
                value={style.numberFormat}
                onChange={(e) =>
                  setStyle({ ...style, numberFormat: e.target.value })
                }
                placeholder="예: #,##0.00"
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            예시: 1234.5 → {applyNumberFormatPreview(1234.5, style.numberFormat || '')}
          </div>
        </div>

        {/* Preview */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold mb-3 text-gray-900 dark:text-gray-100">미리보기</h3>
          <div
            style={{
              fontFamily: style.fontFamily,
              fontSize: `${style.fontSize}px`,
              fontWeight: style.fontWeight,
              fontStyle: style.fontStyle,
              textDecoration: style.textDecoration,
              color: style.color,
              backgroundColor: style.backgroundColor,
              textAlign: style.textAlign,
              border: `${style.border?.top?.width}px ${style.border?.top?.style} ${style.border?.top?.color}`,
              padding: '12px',
              borderRadius: '4px',
            }}
          >
            샘플 텍스트 (Sample Text)
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
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

// Helper function for number format preview
function applyNumberFormatPreview(value: number, format: string): string {
  if (!format) return String(value);

  try {
    // Simple implementation - can be extended with full Excel format support
    const isPercent = format.includes('%');
    const decimalPlaces = (format.match(/0/g) || []).length - (isPercent ? 1 : 0);
    const hasComma = format.includes(',');
    const hasDollar = format.includes('$');

    let result = isPercent ? value * 100 : value;
    result = Number(result.toFixed(decimalPlaces));

    let formatted = String(result);
    if (hasComma) {
      formatted = result.toLocaleString('en-US', {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
      });
    }

    if (hasDollar) formatted = '$' + formatted;
    if (isPercent) formatted = formatted + '%';

    return formatted;
  } catch {
    return String(value);
  }
}
