/**
 * Game Data Template Hook
 * 게임 데이터 템플릿 로드 및 관리
 */

import { useCallback } from 'react';
import type { Sheet, Row, Cell } from '@types';
import { getTemplate, type GameDataTemplateType } from '@utils/gameTemplates';
import { generateCellId } from '@utils/cellUtils';

export const useGameDataTemplate = () => {
  // Create sheet from template
  const createSheetFromTemplate = useCallback(
    (templateType: GameDataTemplateType, sheetName?: string): Sheet => {
      const template = getTemplate(templateType);

      // Convert template columns
      const columns = template.columns.map((col, index) => ({
        id: col.id,
        name: col.name,
        type: col.type,
        width: col.width || 150,
        index,
        validation: col.validation,
        options: col.options,
      }));

      // Create rows from sample data
      const rows: Row[] = [];

      if (template.sampleData && template.sampleData.length > 0) {
        template.sampleData.forEach((sampleRow, rowIndex) => {
          const rowId = `row-${rowIndex}`;
          const cells: Record<string, Cell> = {};

          // Create cells for each column
          columns.forEach((column) => {
            const cellValue = sampleRow[column.id] ?? null;

            cells[column.id] = {
              id: generateCellId(rowId, column.id),
              rowId,
              columnId: column.id,
              value: cellValue,
              type: column.type,
            };
          });

          rows.push({
            id: rowId,
            index: rowIndex,
            cells,
          });
        });
      }

      // Add additional empty rows for user input
      const startIndex = rows.length;
      const additionalRows = template.sampleData ? 50 : 100;

      for (let i = 0; i < additionalRows; i++) {
        const rowId = `row-${startIndex + i}`;
        const cells: Record<string, Cell> = {};

        columns.forEach((column) => {
          cells[column.id] = {
            id: generateCellId(rowId, column.id),
            rowId,
            columnId: column.id,
            value: null,
            type: column.type,
          };
        });

        rows.push({
          id: rowId,
          index: startIndex + i,
          cells,
        });
      }

      // Convert template to Sheet format
      const sheet: Sheet = {
        id: `sheet_${Date.now()}`,
        name: sheetName || template.name,
        columns,
        rows,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return sheet;
    },
    []
  );

  return {
    createSheetFromTemplate,
  };
};
