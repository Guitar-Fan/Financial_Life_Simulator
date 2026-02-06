import { test, expect } from '@playwright/test';

test.describe('Navigation and Routing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('bakery-tutorial-completed', 'true');
    });
    await page.reload();
  });

  test('should navigate to dashboard', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Bakery Tycoon');
    
    // Click dashboard button
    await page.locator('button').filter({ hasText: 'Dashboard' }).click();
    
    // Should be on dashboard page
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('h2')).toContainText('Business Dashboard');
  });

  test('should show tutorial on first visit', async ({ page }) => {
    // Clear tutorial flag
    await page.evaluate(() => {
      localStorage.removeItem('bakery-tutorial-completed');
    });
    await page.reload();
    
    // Tutorial should appear after delay
    await page.waitForTimeout(1500);
    await expect(page.locator('.tutorial-card')).toBeVisible();
    await expect(page.locator('text=/Welcome to Bakery Manager/i')).toBeVisible();
  });

  test('should navigate through tutorial steps', async ({ page }) => {
    // Start tutorial manually
    await page.locator('button').filter({ hasText: 'Tutorial' }).click();
    
    // Wait for tutorial to appear
    await expect(page.locator('.tutorial-card')).toBeVisible();
    
    // Click next
    const nextButton = page.getByRole('button', { name: /Next/i });
    await nextButton.click();
    
    // Should show step 2
    await expect(page.locator('text=/Step 2 of/i')).toBeVisible();
    
    // Can go back
    const prevButton = page.getByRole('button', { name: /Previous/i });
    await prevButton.click();
    await expect(page.locator('text=/Step 1 of/i')).toBeVisible();
  });

  test('should skip tutorial', async ({ page }) => {
    await page.locator('button').filter({ hasText: 'Tutorial' }).click();
    await expect(page.locator('.tutorial-card')).toBeVisible();
    
    // Click close/skip button
    await page.locator('.tutorial-card button[title="Skip tutorial"]').click();
    
    // Tutorial should be hidden
    await expect(page.locator('.tutorial-card')).not.toBeVisible();
  });

  test('should have smooth page transitions', async ({ page }) => {
    // Start game and check for transitions
    await page.getByRole('button', { name: 'Start New Game' }).click();
    
    // Wait for transition
    await page.waitForTimeout(400);
    await expect(page.locator('h2')).toContainText('Buying Phase');
    
    // Navigate through phases
    await page.getByRole('button', { name: /Proceed to Baking/i }).click();
    await page.waitForTimeout(400);
    await expect(page.locator('h2')).toContainText('Baking Phase');
  });

  test('should maintain state across navigation', async ({ page }) => {
    // Start game
    await page.getByRole('button', { name: 'Start New Game' }).click();
    
    // Buy some ingredients
    const flourCard = page.locator('.bg-white').filter({ hasText: 'Flour' }).first();
    await flourCard.locator('button').filter({ hasText: '+' }).click();
    await flourCard.locator('button').filter({ hasText: '+' }).click();
    
    // Go to dashboard
    await page.goto('/dashboard');
    await expect(page.locator('h2')).toContainText('Business Dashboard');
    
    // Return to menu
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Bakery Tycoon');
    
    // Continue game - should still have ingredients
    await page.getByRole('button', { name: 'Start New Game' }).click();
    
    // State should be fresh (new game)
    const budgetText = await page.locator('text=/Available Cash:/').textContent();
    expect(budgetText).toContain('$50,000');
  });

  test('should handle browser back button', async ({ page }) => {
    await page.getByRole('button', { name: 'Start New Game' }).click();
    await expect(page).toHaveURL(/.*buying/);
    
    // Use browser back
    await page.goBack();
    
    // Should be back at menu
    await expect(page).toHaveURL(/.*\//);
    await expect(page.locator('h1')).toContainText('Bakery Tycoon');
  });
});
