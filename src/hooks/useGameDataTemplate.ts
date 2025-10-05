/**
 * Game Data Template Hook
 * 게임 데이터 템플릿 로드 및 관리
 */

import { useCallback } from 'react';
import type { Sheet } from '@types';
import { getTemplate, type GameDataTemplateType } from '@utils/gameTemplates';

export const useGameDataTemplate = () => {
  // Create sheet from template
  const createSheetFromTemplate = useCallback(
    (templateType: GameDataTemplateType, sheetName?: string): Sheet => {
      const template = getTemplate(templateType);

      // Convert template to Sheet format
      const sheet: Sheet = {
        id: `sheet_${Date.now()}`,
        name: sheetName || template.type,
        columns: template.columns.map((col, index) => ({
          id: col.id,
          name: col.name,
          type: col.type,
          width: col.width || 150,
          index,
          validation: col.validation,
          options: col.options,
        })),
        rows: [],
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
