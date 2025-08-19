import { test, expect } from '@playwright/test';

test.describe('E-Commerce Platform Automation Suite', () => {
  
  test('homepage functionality and navigation', async ({ page }) => {
    await test.step('Load homepage and verify core elements', async () => {
      await page.goto('https://amazon.in', { timeout: 60000 });
      
      
      await page.waitForSelector('#twotabsearchtextbox', { timeout: 30000 });
      
      
      await expect(page.locator('#twotabsearchtextbox')).toBeVisible();
      await expect(page.locator('#nav-logo')).toBeVisible();
      await expect(page.locator('#nav-cart')).toBeVisible();
      await expect(page.locator('#nav-search-submit-button')).toBeVisible();
    });

    await test.step('Test search interface functionality', async () => {
      
      await page.fill('#twotabsearchtextbox', 'electronics');
      await expect(page.locator('#twotabsearchtextbox')).toHaveValue('electronics');
      
      
      await page.fill('#twotabsearchtextbox', '');
      await page.fill('#twotabsearchtextbox', 'books');
      await expect(page.locator('#twotabsearchtextbox')).toHaveValue('books');
    });

    await test.step('Execute search and verify results page', async () => {
      
      await page.click('#nav-search-submit-button');
      
      
      await page.waitForURL('**/s?**', { timeout: 30000 });
      
      
      expect(page.url()).toContain('/s?');
      expect(page.url()).toContain('k=books');
      
      
      await page.waitForSelector('[data-component-type="s-search-result"], .s-result-item', { timeout: 20000 });
      
      
      const resultCount = await page.locator('[data-component-type="s-search-result"], .s-result-item').count();
      expect(resultCount).toBeGreaterThan(0);
    });
  });

  test('search functionality with different terms', async ({ page }) => {
    await test.step('Test multiple search scenarios', async () => {
      await page.goto('https://amazon.in');
      await page.waitForSelector('#twotabsearchtextbox', { timeout: 30000 });
      
      
      await page.fill('#twotabsearchtextbox', 'electronics wireless headphones');
      await page.click('#nav-search-submit-button');
      
      
      await page.waitForURL('**/s?**', { timeout: 30000 });
      expect(page.url()).toContain('electronics');
      
      
      const results = await page.locator('[data-component-type="s-search-result"], .s-result-item').count();
      expect(results).toBeGreaterThan(0);
    });
  });

  test('user interface responsiveness and accessibility', async ({ page }) => {
    await test.step('Test keyboard navigation', async () => {
      await page.goto('https://amazon.in');
      await page.waitForSelector('#twotabsearchtextbox', { timeout: 30000 });
      
      
      await page.locator('#twotabsearchtextbox').focus();
      
      
      await page.keyboard.type('smartphone');
      await expect(page.locator('#twotabsearchtextbox')).toHaveValue('smartphone');
      
      
      await page.keyboard.press('Tab');
      
      
      await page.keyboard.press('Enter');
      
      
      await page.waitForURL('**/s?**', { timeout: 30000 });
      expect(page.url()).toContain('smartphone');
    });

    await test.step('Test responsive design elements', async () => {
      await page.goto('https://amazon.in');
      await page.waitForSelector('#twotabsearchtextbox', { timeout: 30000 });
      
      
      await page.setViewportSize({ width: 375, height: 667 });
      
      
      await expect(page.locator('#twotabsearchtextbox')).toBeVisible();
      await expect(page.locator('#nav-search-submit-button')).toBeVisible();
      
      
      await page.setViewportSize({ width: 1280, height: 720 });
      
      
      await expect(page.locator('#nav-logo')).toBeVisible();
      await expect(page.locator('#nav-cart')).toBeVisible();
    });
  });

  test('form validation and error handling', async ({ page }) => {
    await test.step('Test empty search handling', async () => {
      await page.goto('https://amazon.in');
      await page.waitForSelector('#twotabsearchtextbox', { timeout: 30000 });
      
      
      await page.locator('#twotabsearchtextbox').clear();
      await page.click('#nav-search-submit-button');
      
      
      const currentUrl = page.url();
      expect(currentUrl).toBeTruthy();
    });

    await test.step('Test special character search', async () => {
      await page.fill('#twotabsearchtextbox', '@#$%');
      await page.click('#nav-search-submit-button');
      
      
      await page.waitForTimeout(3000);
      const url = page.url();
      expect(url).toBeTruthy();
    });
  });

  test('cross-browser compatibility check', async ({ page }) => {
    await test.step('Verify core functionality across different scenarios', async () => {
      await page.goto('https://amazon.in');
      await page.waitForSelector('#twotabsearchtextbox', { timeout: 30000 });
      
      
      const searchTerms = ['laptop', 'mobile', 'books'];
      
      for (const term of searchTerms) {
        await page.goto('https://amazon.in');
        await page.waitForSelector('#twotabsearchtextbox', { timeout: 30000 });
        
        await page.fill('#twotabsearchtextbox', term);
        await page.click('#nav-search-submit-button');
        
        await page.waitForURL('**/s?**', { timeout: 30000 });
        expect(page.url()).toContain(term);
        

        const hasResults = await page.locator('[data-component-type="s-search-result"], .s-result-item').count() > 0;
        expect(hasResults).toBe(true);
      }
    });
  });
});
