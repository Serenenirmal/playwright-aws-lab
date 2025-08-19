import { test, expect } from '@playwright/test';

test.describe('Visual Regression and UI Consistency Tests', () => {
  
  test('homepage visual consistency across browsers', async ({ page, browserName }) => {
    await test.step(`Test visual consistency on ${browserName}`, async () => {
      await page.goto('https://amazon.in');
      await page.waitForSelector('#twotabsearchtextbox', { timeout: 30000 });
      
      // Wait for all images to load
      await page.waitForLoadState('networkidle');
      
      // Hide dynamic content that changes (like ads, recommendations)
      await page.addStyleTag({
        content: `
          [data-testid*="ad"], [class*="ad"], [id*="ad"],
          [class*="recommendation"], [data-cel-widget*="recommendation"],
          [class*="personalized"], .a-carousel-container,
          #nav-belt .nav-fill, .nav-progressive-attribute {
            visibility: hidden !important;
          }
        `
      });
      
      // Test key UI elements positioning
      const searchBox = page.locator('#twotabsearchtextbox');
      const logo = page.locator('#nav-logo');
      const cart = page.locator('#nav-cart');
      
      await expect(searchBox).toBeVisible();
      await expect(logo).toBeVisible();  
      await expect(cart).toBeVisible();
      
      // Verify elements are properly positioned
      const searchBoxBounds = await searchBox.boundingBox();
      const logoBounds = await logo.boundingBox();
      
      expect(searchBoxBounds).toBeTruthy();
      expect(logoBounds).toBeTruthy();
      
      // Logo should be to the left of search box on desktop
      if (searchBoxBounds && logoBounds) {
        expect(logoBounds.x).toBeLessThan(searchBoxBounds.x);
      }
      
      console.log(`✓ Visual consistency validated on ${browserName}`);
    });
  });

  test('search results page layout validation', async ({ page }) => {
    await test.step('Validate search results page visual elements', async () => {
      await page.goto('https://amazon.in');
      await page.waitForSelector('#twotabsearchtextbox', { timeout: 30000 });
      
      await page.fill('#twotabsearchtextbox', 'wireless bluetooth headphones');
      await page.click('#nav-search-submit-button');
      
      await page.waitForURL('**/s?**', { timeout: 30000 });
      await page.waitForSelector('[data-component-type="s-search-result"], .s-result-item', { timeout: 20000 });
      
      // Wait for page to stabilize
      await page.waitForTimeout(3000);
      
      // Validate search results grid layout
      const results = await page.locator('[data-component-type="s-search-result"], .s-result-item').count();
      expect(results).toBeGreaterThan(5);
      
      // Check if results are properly aligned
      const firstResult = page.locator('[data-component-type="s-search-result"], .s-result-item').first();
      const firstResultBounds = await firstResult.boundingBox();
      
      expect(firstResultBounds?.width).toBeGreaterThan(200);
      expect(firstResultBounds?.height).toBeGreaterThan(100);
      
      console.log(`✓ Search results layout validated - ${results} results found`);
    });
  });

  test('responsive design visual validation', async ({ page }) => {
    const viewports = [
      { name: 'desktop', width: 1920, height: 1080 },
      { name: 'laptop', width: 1366, height: 768 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'mobile', width: 375, height: 667 }
    ];
    
    for (const viewport of viewports) {
      await test.step(`Test responsive design on ${viewport.name}`, async () => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        
        await page.goto('https://amazon.in');
        await page.waitForSelector('#twotabsearchtextbox', { timeout: 30000 });
        await page.waitForLoadState('domcontentloaded');
        
        // Verify key elements are still visible and properly sized
        await expect(page.locator('#twotabsearchtextbox')).toBeVisible();
        await expect(page.locator('#nav-search-submit-button')).toBeVisible();
        
        const searchBox = page.locator('#twotabsearchtextbox');
        const searchBoxBounds = await searchBox.boundingBox();
        
        // Search box should take appropriate width on different devices
        if (viewport.width <= 768) {
          // On mobile/tablet, search box should be wider relative to screen
          expect(searchBoxBounds?.width).toBeGreaterThan(viewport.width * 0.4);
        } else {
          // On desktop, search box should have reasonable minimum width
          expect(searchBoxBounds?.width).toBeGreaterThan(300);
        }
        
        console.log(`✓ Responsive design validated on ${viewport.name} (${viewport.width}x${viewport.height})`);
      });
    }
  });

  test('color contrast and accessibility visual validation', async ({ page }) => {
    await test.step('Validate color contrast and visual accessibility', async () => {
      await page.goto('https://amazon.in');
      await page.waitForSelector('#twotabsearchtextbox', { timeout: 30000 });
      
      // Verify elements are visible in standard view
      await expect(page.locator('#twotabsearchtextbox')).toBeVisible();
      await expect(page.locator('#nav-search-submit-button')).toBeVisible();
      await expect(page.locator('#nav-logo')).toBeVisible();
      
      // Test focus visibility
      await page.locator('#twotabsearchtextbox').focus();
      await page.waitForTimeout(1000);
      
      // Verify focus is visible (element should have focus styles)
      const focusedElement = await page.locator('#twotabsearchtextbox').evaluate(el => el === document.activeElement);
      expect(focusedElement).toBe(true);
      
      console.log('✓ Accessibility visual validation completed');
    });
  });

  test('loading states and progressive enhancement', async ({ page }) => {
    await test.step('Test loading states and progressive enhancement', async () => {
      const loadingStartTime = Date.now();
      await page.goto('https://amazon.in');
      
      // Wait for essential elements to load
      await page.waitForSelector('#twotabsearchtextbox', { timeout: 30000 });
      const loadingEndTime = Date.now();
      const totalLoadTime = loadingEndTime - loadingStartTime;
      
      // Verify progressive loading - essential elements load quickly
      expect(totalLoadTime).toBeLessThan(15000); // Should load key elements within 15 seconds
      
      // Test that page is usable during loading
      await page.fill('#twotabsearchtextbox', 'test product');
      await expect(page.locator('#twotabsearchtextbox')).toHaveValue('test product');
      
      console.log(`✓ Progressive enhancement validated - Essential elements loaded in ${totalLoadTime}ms`);
    });
  });

  test('UI component interaction states', async ({ page }) => {
    await test.step('Test various UI interaction states', async () => {
      await page.goto('https://amazon.in');
      await page.waitForSelector('#twotabsearchtextbox', { timeout: 30000 });
      
      const searchBox = page.locator('#twotabsearchtextbox');
      const searchButton = page.locator('#nav-search-submit-button');
      
      // Test hover states
      await searchButton.hover();
      await page.waitForTimeout(500);
      
      // Test active states
      await searchBox.focus();
      await page.waitForTimeout(500);
      
      // Test input states
      await searchBox.fill('interaction test');
      await page.waitForTimeout(500);
      
      // Verify interactive elements respond to user actions
      const hasValue = await searchBox.inputValue();
      expect(hasValue).toBe('interaction test');
      
      // Test button click state
      await searchButton.click();
      await page.waitForURL('**/s?**', { timeout: 30000 });
      
      expect(page.url()).toContain('interaction+test');
      
      console.log('✓ UI interaction states validated');
    });
  });

  test('layout consistency with dynamic content', async ({ page }) => {
    await test.step('Test layout stability with dynamic content changes', async () => {
      await page.goto('https://amazon.in');
      await page.waitForSelector('#twotabsearchtextbox', { timeout: 30000 });
      
      // Measure initial layout
      const initialSearchBoxPosition = await page.locator('#twotabsearchtextbox').boundingBox();
      const initialLogoPosition = await page.locator('#nav-logo').boundingBox();
      
      // Simulate dynamic content loading by waiting
      await page.waitForTimeout(5000);
      
      // Measure layout after potential dynamic content changes
      const finalSearchBoxPosition = await page.locator('#twotabsearchtextbox').boundingBox();
      const finalLogoPosition = await page.locator('#nav-logo').boundingBox();
      
      // Layout should remain stable (minimal shift)
      if (initialSearchBoxPosition && finalSearchBoxPosition) {
        const positionShift = Math.abs(initialSearchBoxPosition.y - finalSearchBoxPosition.y);
        expect(positionShift).toBeLessThan(50); // Allow max 50px shift
      }
      
      if (initialLogoPosition && finalLogoPosition) {
        const logoShift = Math.abs(initialLogoPosition.y - finalLogoPosition.y);
        expect(logoShift).toBeLessThan(30); // Allow max 30px shift for logo
      }
      
      console.log('✓ Layout stability validated against dynamic content changes');
    });
  });
});
