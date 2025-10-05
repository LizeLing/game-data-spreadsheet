import { useState, useCallback } from 'react';
import {
  importFromCSV,
  type CSVImportOptions,
} from '@services/dataImport/csvImporter';
import {
  importFromXLSX,
  type XLSXImportOptions,
} from '@services/dataImport/xlsxImporter';
import {
  exportToCSV,
  type CSVExportOptions,
} from '@services/dataExport/csvExporter';
import {
  exportToJSON,
  type JSONExportOptions,
} from '@services/dataExport/jsonExporter';
import {
  exportToXLSX,
  type XLSXExportOptions,
} from '@services/dataExport/xlsxExporter';
import type { Sheet } from '@types';

export type ImportFormat = 'csv' | 'json' | 'xlsx';
export type ExportFormat = 'csv' | 'json' | 'xlsx';

export const useImportExport = () => {
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const importFile = useCallback(
    async (
      file: File,
      format: ImportFormat,
      options?: CSVImportOptions | XLSXImportOptions
    ): Promise<{ sheets: Sheet[]; success: boolean } | null> => {
      setImporting(true);
      setError(null);

      try {
        let result;

        if (format === 'csv') {
          const csvResult = await importFromCSV(
            file,
            options as CSVImportOptions
          );
          if (csvResult.success && csvResult.sheet) {
            result = { success: true, sheets: [csvResult.sheet] };
          } else {
            result = { success: false, sheets: [], error: csvResult.error };
          }
        } else if (format === 'xlsx') {
          result = await importFromXLSX(file, options as XLSXImportOptions);
        } else {
          throw new Error(`Unsupported format: ${format}`);
        }

        if (!result.success) {
          setError(result.error || 'Unknown error');
          return null;
        }

        return { sheets: result.sheets || [], success: true };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Import failed';
        setError(errorMessage);
        return null;
      } finally {
        setImporting(false);
      }
    },
    []
  );

  const exportSheet = useCallback(
    (
      sheet: Sheet,
      filename: string,
      format: ExportFormat,
      options?: CSVExportOptions | JSONExportOptions | XLSXExportOptions
    ): void => {
      setExporting(true);
      setError(null);

      try {
        if (format === 'csv') {
          exportToCSV(sheet, filename, options as CSVExportOptions);
        } else if (format === 'json') {
          exportToJSON(sheet, filename, options as JSONExportOptions);
        } else if (format === 'xlsx') {
          exportToXLSX([sheet], filename, options as XLSXExportOptions);
        } else {
          throw new Error(`Unsupported format: ${format}`);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Export failed';
        setError(errorMessage);
      } finally {
        setExporting(false);
      }
    },
    []
  );

  const exportMultipleSheets = useCallback(
    (sheets: Sheet[], filename: string, options?: XLSXExportOptions): void => {
      setExporting(true);
      setError(null);

      try {
        exportToXLSX(sheets, filename, options);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Export multiple sheets failed';
        setError(errorMessage);
      } finally {
        setExporting(false);
      }
    },
    []
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    importing,
    exporting,
    error,
    importFile,
    exportSheet,
    exportMultipleSheets,
    clearError,
  };
};
