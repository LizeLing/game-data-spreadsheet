/**
 * E2E Tests: Import/Export Functionality
 */

import { test, expect } from '@playwright/test';

test.describe('Import/Export', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.ag-root', { timeout: 10000 });
  });

  test('should export to CSV', async ({ page }) => {
    // Wait for export button
    const exportButton = page.getByRole('button', { name: /export/i });
    await expect(exportButton).toBeVisible();

    // Select CSV format
    await page.getByRole('combobox').selectOption('csv');

    // Start download
    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();

    const download = await downloadPromise;

    // Verify filename
    expect(download.suggestedFilename()).toMatch(/\.csv$/);
  });

  test('should export to JSON', async ({ page }) => {
    // Select JSON format
    await page.getByRole('combobox').selectOption('json');

    // Start download
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /export/i }).click();

    const download = await downloadPromise;

    // Verify filename
    expect(download.suggestedFilename()).toMatch(/\.json$/);
  });

  test('should export to XLSX', async ({ page }) => {
    // Select XLSX format
    await page.getByRole('combobox').selectOption('xlsx');

    // Start download
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /export/i }).click();

    const download = await downloadPromise;

    // Verify filename
    expect(download.suggestedFilename()).toMatch(/\.xlsx$/);
  });

  test('should have import button', async ({ page }) => {
    const importButton = page.getByRole('button', { name: /import/i });
    await expect(importButton).toBeVisible();
  });
});
