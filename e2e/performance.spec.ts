/**
 * E2E Tests: Performance and Load Testing
 */

import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.ag-root', { timeout: 10000 });
  });

  test('should load quickly with initial data', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');
    await page.waitForSelector('.ag-root');

    const loadTime = Date.now() - startTime;

    // App should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should handle adding 50 rows efficiently', async ({ page }) => {
    const startTime = Date.now();

    // Add 50 rows
    for (let i = 0; i < 50; i++) {
      await page.getByTitle(/행 추가/i).click();
      if (i % 10 === 0) {
        await page.waitForTimeout(100); // Small delay every 10 rows
      }
    }

    const addTime = Date.now() - startTime;

    // Should complete within 10 seconds
    expect(addTime).toBeLessThan(10000);

    // Verify all rows added
    const rowCount = await page.locator('.ag-row').count();
    expect(rowCount).toBeGreaterThanOrEqual(50);
  });

  test('should handle adding 20 columns efficiently', async ({ page }) => {
    const startTime = Date.now();

    // Add 20 columns
    for (let i = 0; i < 20; i++) {
      await page.getByTitle(/열 추가/i).click();
      await page.waitForTimeout(50);
    }

    const addTime = Date.now() - startTime;

    // Should complete within 5 seconds
    expect(addTime).toBeLessThan(5000);

    // Verify columns added
    const colCount = await page.locator('.ag-header-cell').count();
    expect(colCount).toBeGreaterThanOrEqual(20);
  });

  test('should handle rapid cell edits', async ({ page }) => {
    // Add some rows and columns first
    for (let i = 0; i < 5; i++) {
      await page.getByTitle(/행 추가/i).click();
    }
    await page.waitForTimeout(300);

    const startTime = Date.now();

    // Rapidly edit 20 cells
    const cells = await page.locator('.ag-cell').all();
    for (let i = 0; i < Math.min(20, cells.length); i++) {
      await cells[i].dblclick();
      await page.keyboard.type(`값${i}`);
      await page.keyboard.press('Enter');
    }

    const editTime = Date.now() - startTime;

    // Should complete within 5 seconds
    expect(editTime).toBeLessThan(5000);
  });

  test('should maintain responsiveness during formula calculation', async ({ page }) => {
    // Add rows with formula
    await page.getByTitle(/행 추가/i).click();
    await page.waitForTimeout(300);

    // Edit first cell with a value
    const firstCell = page.locator('.ag-cell').first();
    await firstCell.dblclick();
    await page.keyboard.type('100');
    await page.keyboard.press('Tab');

    // Edit second cell with formula
    await page.keyboard.type('=A1*2');
    await page.keyboard.press('Enter');

    // UI should remain responsive
    await page.waitForTimeout(100);

    // Click toolbar button to verify responsiveness
    const saveButton = page.getByTitle(/저장/i);
    await expect(saveButton).toBeEnabled();
  });

  test('should handle IndexedDB save without blocking UI', async ({ page }) => {
    // Make a change
    await page.getByTitle(/행 추가/i).click();
    await page.waitForTimeout(500);

    // Add cell value
    const firstCell = page.locator('.ag-cell').first();
    await firstCell.dblclick();
    await page.keyboard.type('자동 저장 테스트');
    await page.keyboard.press('Enter');

    // Wait for auto-save (2 second debounce)
    await page.waitForTimeout(2500);

    // Verify UI is still responsive
    const undoButton = page.getByTitle(/실행 취소/i);
    await expect(undoButton).toBeEnabled();

    // Check for "마지막 저장" text in header
    await expect(page.locator('text=/마지막 저장/')).toBeVisible();
  });

  test('should scroll through large dataset smoothly', async ({ page }) => {
    // Add many rows
    for (let i = 0; i < 30; i++) {
      await page.getByTitle(/행 추가/i).click();
    }
    await page.waitForTimeout(500);

    const grid = page.locator('.ag-root');

    // Scroll down
    await grid.evaluate(el => {
      el.scrollTop = el.scrollHeight;
    });
    await page.waitForTimeout(200);

    // Scroll up
    await grid.evaluate(el => {
      el.scrollTop = 0;
    });
    await page.waitForTimeout(200);

    // Verify grid is still interactive
    const firstCell = page.locator('.ag-cell').first();
    await expect(firstCell).toBeVisible();
  });
});
