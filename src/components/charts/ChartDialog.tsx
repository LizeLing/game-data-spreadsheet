/**
 * Chart Dialog Component
 * 데이터 시각화 차트 생성 및 편집 다이얼로그
 */

import { useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import type { Sheet, SelectionRange } from '@types';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export type ChartType = 'line' | 'bar' | 'pie';

interface ChartDialogProps {
  sheet: Sheet;
  selection: SelectionRange | null;
  onClose: () => void;
}

export const ChartDialog = ({ sheet, selection, onClose }: ChartDialogProps) => {
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [title, setTitle] = useState('');
  const [useFirstRowAsLabels, setUseFirstRowAsLabels] = useState(true);
  const [useFirstColumnAsLabels, setUseFirstColumnAsLabels] = useState(false);

  // Extract data from selection
  const chartData = useMemo(() => {
    if (!selection) return null;

    const { startRow, endRow, startColumn, endColumn } = selection;
    const labels: string[] = [];
    const datasets: { label: string; data: number[]; backgroundColor: string[] }[] = [];

    // Extract labels from first row if enabled
    const dataStartRow = useFirstRowAsLabels ? startRow + 1 : startRow;

    // Extract column labels
    if (useFirstRowAsLabels) {
      for (let col = startColumn; col <= endColumn; col++) {
        const row = sheet.rows[startRow];
        const column = sheet.columns[col];
        const cell = row?.cells[column?.id];
        labels.push(cell?.value?.toString() || `Column ${col + 1}`);
      }
    } else {
      for (let col = startColumn; col <= endColumn; col++) {
        labels.push(`Column ${col + 1}`);
      }
    }

    // For pie chart, we only use first data series
    if (chartType === 'pie') {
      const data: number[] = [];
      const colors: string[] = [];

      for (let col = startColumn; col <= endColumn; col++) {
        const row = sheet.rows[dataStartRow];
        const column = sheet.columns[col];
        const cell = row?.cells[column?.id];
        const value = parseFloat(cell?.value?.toString() || '0');
        data.push(isNaN(value) ? 0 : value);
        colors.push(generateColor(col - startColumn));
      }

      return {
        labels,
        datasets: [
          {
            label: title || 'Data',
            data,
            backgroundColor: colors,
          },
        ],
      };
    }

    // For line/bar charts, create dataset for each row
    for (let row = dataStartRow; row <= endRow; row++) {
      const data: number[] = [];
      const rowLabel = useFirstColumnAsLabels
        ? sheet.rows[row]?.cells[sheet.columns[startColumn]?.id]?.value?.toString() || `Series ${row - dataStartRow + 1}`
        : `Series ${row - dataStartRow + 1}`;

      const dataStartCol = useFirstColumnAsLabels ? startColumn + 1 : startColumn;

      for (let col = dataStartCol; col <= endColumn; col++) {
        const column = sheet.columns[col];
        const cell = sheet.rows[row]?.cells[column?.id];
        const value = parseFloat(cell?.value?.toString() || '0');
        data.push(isNaN(value) ? 0 : value);
      }

      datasets.push({
        label: rowLabel,
        data,
        backgroundColor: [generateColor(row - dataStartRow)],
      });
    }

    return { labels, datasets };
  }, [selection, sheet, chartType, useFirstRowAsLabels, useFirstColumnAsLabels, title]);

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: !!title,
        text: title,
      },
    },
  };

  const renderChart = () => {
    if (!chartData) {
      return (
        <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
          선택 영역이 없습니다
        </div>
      );
    }

    switch (chartType) {
      case 'line':
        return <Line data={chartData} options={options} />;
      case 'bar':
        return <Bar data={chartData} options={options} />;
      case 'pie':
        return <Pie data={chartData} options={options} />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            📊 차트 생성
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Settings Panel */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  차트 유형
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setChartType('bar')}
                    className={`px-3 py-2 text-sm rounded border ${
                      chartType === 'bar'
                        ? 'bg-primary-500 text-white border-primary-500'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                    }`}
                  >
                    📊 막대
                  </button>
                  <button
                    onClick={() => setChartType('line')}
                    className={`px-3 py-2 text-sm rounded border ${
                      chartType === 'line'
                        ? 'bg-primary-500 text-white border-primary-500'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                    }`}
                  >
                    📈 선
                  </button>
                  <button
                    onClick={() => setChartType('pie')}
                    className={`px-3 py-2 text-sm rounded border ${
                      chartType === 'pie'
                        ? 'bg-primary-500 text-white border-primary-500'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                    }`}
                  >
                    🥧 원
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  차트 제목
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="제목 입력 (선택사항)"
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  데이터 옵션
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={useFirstRowAsLabels}
                      onChange={(e) => setUseFirstRowAsLabels(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      첫 번째 행을 레이블로 사용
                    </span>
                  </label>
                  {chartType !== 'pie' && (
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={useFirstColumnAsLabels}
                        onChange={(e) => setUseFirstColumnAsLabels(e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        첫 번째 열을 시리즈 이름으로 사용
                      </span>
                    </label>
                  )}
                </div>
              </div>

              {selection && (
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded text-sm">
                  <div className="text-gray-600 dark:text-gray-400 mb-1">선택 영역</div>
                  <div className="text-gray-900 dark:text-gray-100 font-mono">
                    {sheet.columns[selection.startColumn]?.name}
                    {selection.startRow + 1}:
                    {sheet.columns[selection.endColumn]?.name}
                    {selection.endRow + 1}
                  </div>
                </div>
              )}
            </div>

            {/* Chart Preview */}
            <div className="lg:col-span-2">
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-700">
                <div className="aspect-video">
                  {renderChart()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Generate color for chart series
 */
function generateColor(index: number): string {
  const colors = [
    'rgba(59, 130, 246, 0.8)', // blue
    'rgba(16, 185, 129, 0.8)', // green
    'rgba(251, 146, 60, 0.8)', // orange
    'rgba(139, 92, 246, 0.8)', // purple
    'rgba(236, 72, 153, 0.8)', // pink
    'rgba(245, 158, 11, 0.8)', // amber
    'rgba(20, 184, 166, 0.8)', // teal
    'rgba(239, 68, 68, 0.8)', // red
  ];
  return colors[index % colors.length];
}
