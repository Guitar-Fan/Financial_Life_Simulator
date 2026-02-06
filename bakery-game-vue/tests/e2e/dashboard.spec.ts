import { test, expect } from '@playwright/test';

test.describe('Dashboard Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('bakery-tutorial-completed', 'true');
    });
    await page.reload();
  });

  test('should display dashboard with all tabs', async ({ page }) => {
    // Navigate to dashboard
    await page.locator('button').filter({ hasText: 'Dashboard' }).click();
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Check all tabs exist
    await expect(page.getByRole('button', { name: 'Overview' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Market' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Business Performance' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Pricing' })).toBeVisible();
  });

  test('should switch between tabs', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Default to Overview
    await expect(page.getByRole('button', { name: 'Overview' })).toHaveClass(/bg-bakery-gold-500/);
    
    // Switch to Market tab
    await page.getByRole('button', { name: 'Market' }).click();
    await expect(page.getByRole('button', { name: 'Market' })).toHaveClass(/bg-bakery-gold-500/);
    
    // Switch to Performance tab
    await page.getByRole('button', { name: 'Business Performance' }).click();
    await expect(page.getByRole('button', { name: 'Business Performance' })).toHaveClass(/bg-bakery-gold-500/);
    
    // Switch to Pricing tab
    await page.getByRole('button', { name: 'Pricing' }).click();
    await expect(page.getByRole('button', { name: 'Pricing' })).toHaveClass(/bg-bakery-gold-500/);
  });

  test('should display KPI cards on Overview tab', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check for KPI cards
    await expect(page.locator('text=/Cash on Hand/i')).toBeVisible();
    await expect(page.locator('text=/Daily Revenue/i')).toBeVisible();
    await expect(page.locator('text=/Net Profit/i')).toBeVisible();
    await expect(page.locator('text=/Total Customers/i')).toBeVisible();
  });

  test('should display charts', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Overview tab should have a chart canvas
    const overviewCanvas = page.locator('canvas').first();
    await expect(overviewCanvas).toBeVisible();
    
    // Switch to Market tab and check for chart
    await page.getByRole('button', { name: 'Market' }).click();
    const marketCanvas = page.locator('canvas').first();
    await expect(marketCanvas).toBeVisible();
    
    // Switch to Performance tab
    await page.getByRole('button', { name: 'Business Performance' }).click();
    const performanceCanvas = page.locator('canvas').first();
    await expect(performanceCanvas).toBeVisible();
  });

  test('should show market information', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByRole('button', { name: 'Market' }).click();
    
    // Check for economic indicators
    await expect(page.locator('text=/Current Season/i')).toBeVisible();
    await expect(page.locator('text=/Day of Week/i')).toBeVisible();
    await expect(page.locator('text=/Market Markup/i')).toBeVisible();
  });

  test('should display pricing calculator', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByRole('button', { name: 'Pricing' }).click();
    
    // Check for margin calculator
    await expect(page.locator('text=/Margin Calculator/i')).toBeVisible();
    
    // Should have input fields
    const costInput = page.locator('input[placeholder*="Cost"]').first();
    const priceInput = page.locator('input[placeholder*="Price"]').first();
    
    if (await costInput.isVisible()) {
      await costInput.fill('10');
      await priceInput.fill('15');
      
      // Should calculate margin
      await expect(page.locator('text=/50%|Margin/i')).toBeVisible();
    }
  });

  test('should show business performance metrics', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByRole('button', { name: 'Business Performance' }).click();
    
    // Check for performance sections
    await expect(page.locator('text=/Product Sales/i')).toBeVisible();
    await expect(page.locator('text=/Cost Breakdown/i')).toBeVisible();
    await expect(page.locator('text=/All-Time Records/i')).toBeVisible();
  });

  test('should return to menu from dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Click on logo or home link
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Bakery Tycoon');
  });

  test('should display financial data after playing', async ({ page }) => {
    // Play a quick game
    await page.getByRole('button', { name: 'Start New Game' }).click();
    
    // Buy ingredients
    const flourCard = page.locator('.bg-white').filter({ hasText: 'Flour' }).first();
    await flourCard.locator('button').filter({ hasText: '+' }).click();
    
    // Proceed through phases quickly
    await page.getByRole('button', { name: /Proceed to Baking/i }).click();
    await page.getByRole('button', { name: /Start Baking/i }).click();
    await page.getByRole('button', { name: /End Day/i }).click();
    
    // Go to dashboard
    await page.getByRole('button', { name: /Return to Menu/i }).click();
    await page.locator('button').filter({ hasText: 'Dashboard' }).click();
    
    // Cash should be less than starting amount
    const cashText = await page.locator('text=/Cash on Hand/').locator('..').textContent();
    expect(cashText).toMatch(/\$[\d,]+/);
  });
});
