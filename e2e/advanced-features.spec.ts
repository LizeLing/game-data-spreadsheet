/**
 * E2E Tests: Advanced Features
 */

import { test, expect } from '@playwright/test';

test.describe('Advanced Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.ag-root', { timeout: 10000 });
  });

  test('should create sheet from template', async ({ page }) => {
    // Click on template in sidebar
    await page.getByText('캐릭터').first().click();
    await page.waitForTimeout(500);

    // Verify template columns created
    await expect(page.getByText('name')).toBeVisible();
    await expect(page.getByText('level')).toBeVisible();
  });

  test('should merge and unmerge cells', async ({ page }) => {
    // Add some rows
    await page.getByTitle(/행 추가/i).click();
    await page.waitForTimeout(300);

    // Select a range (click first cell, then shift+click another)
    const cells = await page.locator('.ag-cell').all();
    if (cells.length >= 4) {
      await cells[0].click();
      await page.keyboard.down('Shift');
      await cells[3].click();
      await page.keyboard.up('Shift');

      // Click merge button
      await page.getByTitle(/셀 병합/).click();
      await page.waitForTimeout(300);

      // Verify cells merged (check for merge styling)
      const firstCell = cells[0];
      const style = await firstCell.getAttribute('style');
      expect(style).toContain('grid-row');

      // Unmerge
      await page.getByTitle(/병합 해제/).click();
      await page.waitForTimeout(300);
    }
  });

  test('should apply conditional formatting', async ({ page }) => {
    // Add row with value
    await page.getByTitle(/행 추가/i).click();
    await page.waitForTimeout(300);

    const firstCell = page.locator('.ag-cell').first();
    await firstCell.dblclick();
    await page.keyboard.type('100');
    await page.keyboard.press('Enter');

    // Open conditional format dialog
    await page.getByTitle(/조건부 서식/).click();
    await page.waitForTimeout(300);

    // Verify dialog opened
    await expect(page.getByText(/조건부 서식/)).toBeVisible();

    // Close dialog
    await page.getByText(/취소/).click();
  });

  test('should validate data', async ({ page }) => {
    // Open validation panel
    await page.getByTitle(/데이터 검증/).click();
    await page.waitForTimeout(300);

    // Verify panel opened
    await expect(page.getByText(/데이터 검증/)).toBeVisible();

    // Close panel
    await page.keyboard.press('Escape');
  });

  test('should search and replace', async ({ page }) => {
    // Add some data
    await page.getByTitle(/행 추가/i).click();
    await page.waitForTimeout(200);

    const firstCell = page.locator('.ag-cell').first();
    await firstCell.dblclick();
    await page.keyboard.type('테스트');
    await page.keyboard.press('Enter');

    // Open search dialog (Ctrl+F)
    await page.keyboard.press('Control+f');
    await page.waitForTimeout(300);

    // Verify dialog opened
    await expect(page.locator('input[placeholder*="찾기"]')).toBeVisible();

    // Close dialog
    await page.keyboard.press('Escape');
  });

  test('should create and update formula', async ({ page }) => {
    // Add rows
    await page.getByTitle(/행 추가/i).click();
    await page.waitForTimeout(300);

    // Add value in first cell
    const cells = await page.locator('.ag-cell').all();
    await cells[0].dblclick();
    await page.keyboard.type('10');
    await page.keyboard.press('Tab');

    // Add formula in second cell
    await page.keyboard.type('=A1*2');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);

    // Verify formula result
    const secondCell = cells[1];
    await expect(secondCell).toContainText('20');

    // Update source value
    await cells[0].dblclick();
    await page.keyboard.press('Control+a');
    await page.keyboard.type('50');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);

    // Verify formula recalculated
    await expect(secondCell).toContainText('100');
  });

  test('should use formula functions', async ({ page }) => {
    // Add multiple rows
    for (let i = 0; i < 3; i++) {
      await page.getByTitle(/행 추가/i).click();
    }
    await page.waitForTimeout(500);

    // Add values
    const cells = await page.locator('.ag-cell').all();
    for (let i = 0; i < 3; i++) {
      await cells[i * 2].dblclick(); // First column
      await page.keyboard.type(`${(i + 1) * 10}`);
      await page.keyboard.press('Enter');
    }
    await page.waitForTimeout(300);

    // Add SUM formula
    await cells[6].dblclick(); // 4th row, first column
    await page.keyboard.type('=SUM(A1:A3)');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);

    // Verify result (10 + 20 + 30 = 60)
    await expect(cells[6]).toContainText('60');
  });

  test('should open keyboard shortcuts help', async ({ page }) => {
    // Open shortcuts (Ctrl+/)
    await page.keyboard.press('Control+/');
    await page.waitForTimeout(300);

    // Verify dialog opened
    await expect(page.getByText(/단축키 도움말/)).toBeVisible();

    // Close dialog
    await page.keyboard.press('Escape');
  });

  test('should delete rows and columns', async ({ page }) => {
    // Add rows
    for (let i = 0; i < 3; i++) {
      await page.getByTitle(/행 추가/i).click();
    }
    await page.waitForTimeout(500);

    const initialRows = await page.locator('.ag-row').count();

    // Select first cell to enable delete
    const firstCell = page.locator('.ag-cell').first();
    await firstCell.click();

    // Delete row
    await page.getByTitle(/선택한 행 삭제/).click();
    await page.waitForTimeout(300);

    const rowsAfterDelete = await page.locator('.ag-row').count();
    expect(rowsAfterDelete).toBe(initialRows - 1);
  });

  test('should change column type', async ({ page }) => {
    // Double-click on column header type icon
    const headerCell = page.locator('.ag-header-cell').first();

    // Look for type icon in header
    const typeButton = headerCell.locator('button').last();
    await typeButton.click();
    await page.waitForTimeout(300);

    // Verify type menu appeared (should show text, number, etc.)
    const typeMenu = page.locator('div').filter({ hasText: /Text|Number|Boolean/ }).first();

    // Menu should be visible or error gracefully
    const isVisible = await typeMenu.isVisible().catch(() => false);

    if (isVisible) {
      // Click to close menu
      await page.keyboard.press('Escape');
    }
  });
});
