/**
 * E2E Tests: Basic Spreadsheet Operations
 */

import { test, expect } from '@playwright/test';

test.describe('Spreadsheet Basic Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for app to load
    await page.waitForSelector('.ag-root', { timeout: 10000 });
  });

  test('should load the application', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('게임 데이터 스프레드시트');
  });

  test('should display toolbar', async ({ page }) => {
    const toolbar = page.locator('.bg-white.border-b').first();
    await expect(toolbar).toBeVisible();
  });

  test('should have AG Grid rendered', async ({ page }) => {
    const grid = page.locator('.ag-root');
    await expect(grid).toBeVisible();
  });

  test('should add a new row', async ({ page }) => {
    // Count initial rows
    const initialRows = await page.locator('.ag-row').count();

    // Click "➕행" button
    await page.getByTitle(/행 추가/i).click();

    // Wait for new row to appear
    await page.waitForTimeout(500);

    // Count rows again
    const newRows = await page.locator('.ag-row').count();
    expect(newRows).toBe(initialRows + 1);
  });

  test('should add a new column', async ({ page }) => {
    // Count initial columns
    const initialColumns = await page.locator('.ag-header-cell').count();

    // Click "➕열" button
    await page.getByTitle(/열 추가/i).click();

    // Wait for new column
    await page.waitForTimeout(500);

    // Count columns again
    const newColumns = await page.locator('.ag-header-cell').count();
    expect(newColumns).toBe(initialColumns + 1);
  });

  test('should edit cell value', async ({ page }) => {
    // Double click on first cell
    const firstCell = page.locator('.ag-cell').first();
    await firstCell.dblclick();

    // Type new value
    await page.keyboard.type('테스트 값');
    await page.keyboard.press('Enter');

    // Verify value changed
    await expect(firstCell).toContainText('테스트 값');
  });

  test('should undo and redo', async ({ page }) => {
    // Add a row
    await page.getByTitle(/행 추가/i).click();
    await page.waitForTimeout(300);
    const rowsAfterAdd = await page.locator('.ag-row').count();

    // Undo
    await page.getByTitle(/실행 취소/i).click();
    await page.waitForTimeout(300);
    const rowsAfterUndo = await page.locator('.ag-row').count();
    expect(rowsAfterUndo).toBe(rowsAfterAdd - 1);

    // Redo
    await page.getByTitle(/다시 실행/i).click();
    await page.waitForTimeout(300);
    const rowsAfterRedo = await page.locator('.ag-row').count();
    expect(rowsAfterRedo).toBe(rowsAfterAdd);
  });

  test('should apply text formatting', async ({ page }) => {
    // Select first cell
    const firstCell = page.locator('.ag-cell').first();
    await firstCell.click();

    // Click bold button
    await page.getByTitle(/굵게/i).click();

    // Verify style applied (check if font-weight is bold)
    const cellStyle = await firstCell.getAttribute('style');
    expect(cellStyle).toContain('font-weight');
  });

  test('should open and close filter dialog', async ({ page }) => {
    // Open filter dialog
    await page.getByTitle(/데이터 필터/i).click();

    // Verify dialog opened
    await expect(page.getByText(/데이터 필터/i).filter({ hasText: /^데이터 필터$/ })).toBeVisible();

    // Close dialog
    await page.getByText(/취소/i).click();

    // Verify dialog closed
    await expect(page.getByText(/데이터 필터/i).filter({ hasText: /^데이터 필터$/ })).not.toBeVisible();
  });

  test('should toggle theme', async ({ page }) => {
    // Get initial theme
    const htmlElement = page.locator('html');
    const initialClass = await htmlElement.getAttribute('class');

    // Toggle theme
    await page.getByTitle(/모드/i).click();
    await page.waitForTimeout(200);

    // Verify theme changed
    const newClass = await htmlElement.getAttribute('class');
    expect(newClass).not.toBe(initialClass);
  });
});
