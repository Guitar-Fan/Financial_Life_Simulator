import { test, expect } from '@playwright/test';

test.describe('Complete Game Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Skip tutorial for testing
    await page.evaluate(() => {
      localStorage.setItem('bakery-tutorial-completed', 'true');
    });
    await page.reload();
  });

  test('should complete full game cycle: Buy → Bake → Sell → Summary', async ({ page }) => {
    // Start new game
    await expect(page.locator('h1')).toContainText('Bakery Tycoon');
    await page.getByRole('button', { name: 'Start New Game' }).click();

    // === BUYING PHASE ===
    await expect(page.locator('h2')).toContainText('Buying Phase');
    
    // Check initial budget
    const budgetText = await page.locator('text=/Available Cash:/').textContent();
    expect(budgetText).toContain('$50,000');
    
    // Buy ingredients - find flour and add some
    const flourCard = page.locator('.bg-white').filter({ hasText: 'Flour' }).first();
    await flourCard.locator('button').filter({ hasText: '+' }).click();
    await flourCard.locator('button').filter({ hasText: '+' }).click();
    
    // Buy sugar
    const sugarCard = page.locator('.bg-white').filter({ hasText: 'Sugar' }).first();
    await sugarCard.locator('button').filter({ hasText: '+' }).click();
    
    // Proceed to baking
    await page.getByRole('button', { name: /Proceed to Baking/i }).click();
    
    // === BAKING PHASE ===
    await expect(page.locator('h2')).toContainText('Baking Phase');
    
    // Select a recipe and set quantity
    const recipeCard = page.locator('.bg-white').first();
    const quantityInput = recipeCard.locator('input[type="number"]');
    await quantityInput.fill('5');
    
    // Start baking
    await page.getByRole('button', { name: /Start Baking/i }).click();
    
    // === SELLING PHASE ===
    await expect(page.locator('h2')).toContainText('Selling Phase');
    
    // Set a price for the product
    const productCard = page.locator('.bg-white').first();
    const priceInput = productCard.locator('input[type="number"]');
    await priceInput.fill('15');
    
    // Open shop
    const openShopButton = page.getByRole('button', { name: /Open Shop/i });
    if (await openShopButton.isVisible()) {
      await openShopButton.click();
    }
    
    // Wait a moment for customers
    await page.waitForTimeout(2000);
    
    // End day
    await page.getByRole('button', { name: /End Day/i }).click();
    
    // === SUMMARY PHASE ===
    await expect(page.locator('h2')).toContainText('Summary');
    
    // Check that we have financial data
    await expect(page.locator('text=/Revenue:/i')).toBeVisible();
    await expect(page.locator('text=/Expenses:/i')).toBeVisible();
    await expect(page.locator('text=/Profit:/i')).toBeVisible();
    
    // Return to menu
    await page.getByRole('button', { name: /Return to Menu/i }).click();
    await expect(page.locator('h1')).toContainText('Bakery Tycoon');
  });

  test('should prevent baking without ingredients', async ({ page }) => {
    // Start new game
    await page.getByRole('button', { name: 'Start New Game' }).click();
    
    // Skip buying phase without purchasing anything
    await page.getByRole('button', { name: /Proceed to Baking/i }).click();
    
    // Try to bake something
    await expect(page.locator('h2')).toContainText('Baking Phase');
    
    // All recipes should show as unavailable (red X)
    const unavailableIndicators = page.locator('text=❌');
    await expect(unavailableIndicators.first()).toBeVisible();
  });

  test('should calculate costs correctly', async ({ page }) => {
    await page.getByRole('button', { name: 'Start New Game' }).click();
    
    // Buy specific quantities
    const flourCard = page.locator('.bg-white').filter({ hasText: 'Flour' }).first();
    const flourPriceText = await flourCard.locator('text=$/').textContent();
    const flourPrice = parseFloat(flourPriceText?.replace(/[^0-9.]/g, '') || '0');
    
    // Buy 3 units
    await flourCard.locator('button').filter({ hasText: '+' }).click();
    await flourCard.locator('button').filter({ hasText: '+' }).click();
    await flourCard.locator('button').filter({ hasText: '+' }).click();
    
    const quantity = await flourCard.locator('text=/Qty:/').textContent();
    expect(quantity).toContain('3');
    
    // Check total
    const expectedTotal = flourPrice * 3;
    const totalText = await page.locator('text=/Total Cost:/').textContent();
    const actualTotal = parseFloat(totalText?.replace(/[^0-9.]/g, '') || '0');
    
    expect(actualTotal).toBeCloseTo(expectedTotal, 0);
  });
});
