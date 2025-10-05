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
    await expect(page).toHaveTitle(/Game Data Spreadsheet/i);
  });

  test('should display toolbar', async ({ page }) => {
    const toolbar = page.locator('.bg-white.border-b');
    await expect(toolbar).toBeVisible();
  });

  test('should have AG Grid rendered', async ({ page }) => {
    const grid = page.locator('.ag-root');
    await expect(grid).toBeVisible();
  });

  test('should add a new row', async ({ page }) => {
    // Count initial rows
    const initialRows = await page.locator('.ag-row').count();

    // Click "Add Row" button
    await page.getByRole('button', { name: /add row/i }).click();

    // Wait for new row to appear
    await page.waitForTimeout(500);

    // Count rows again
    const newRows = await page.locator('.ag-row').count();
    expect(newRows).toBe(initialRows + 1);
  });

  test('should add a new column', async ({ page }) => {
    // Count initial columns
    const initialColumns = await page.locator('.ag-header-cell').count();

    // Click "Add Column" button
    await page.getByRole('button', { name: /add col/i }).click();

    // Wait for new column
    await page.waitForTimeout(500);

    // Count columns again
    const newColumns = await page.locator('.ag-header-cell').count();
    expect(newColumns).toBe(initialColumns + 1);
  });
});
