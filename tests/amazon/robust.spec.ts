import { test, expect } from '@playwright/test';

test.describe('Amazon India - Architecture Demo Tests', () => {
  
  test('Amazon.in page accessibility and navigation', async ({ page }) => {
    // Test focuses on demonstrating serverless architecture, not complex interactions
    await page.goto('https://amazon.in');
    
    // Verify Amazon.in loads (regardless of rush hour page)
    await expect(page).toHaveTitle(/Amazon/);
    
    // Check if we get the main page or rush hour page
    const isRushHour = await page.locator('text=rush hour').count() > 0;
    const isMainPage = await page.locator('#nav-logo').count() > 0;
    const isContinuePage = await page.locator('button:has-text("Continue shopping")').count() > 0;
    
    console.log(`Page state - Rush hour: ${isRushHour}, Main: ${isMainPage}, Continue: ${isContinuePage}`);
    
    if (isContinuePage) {
      await page.locator('button:has-text("Continue shopping")').click();
      await page.waitForTimeout(3000);
    }
    
    if (isRushHour) {
      // Handle rush hour gracefully - this demonstrates error handling
      console.log('Rush hour detected - demonstrating graceful handling');
      await page.screenshot({ path: `test-results/rush-hour-${Date.now()}.png` });
      
      // Try to continue to home page
      try {
        await page.locator('text=Go to the Amazon.in home page').click({ timeout: 5000 });
        await page.waitForTimeout(5000);
      } catch (e) {
        console.log('Rush hour redirect failed, continuing with current page');
      }
    }
    
    // Final verification - we successfully handled Amazon.in's response
    expect(page.url()).toContain('amazon.in');
    
    // Take final screenshot for demo
    await page.screenshot({ 
      path: `test-results/amazon-final-${Date.now()}.png`,
      fullPage: true 
    });
  });

  test('Page response time measurement', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('https://amazon.in');
    await page.waitForLoadState('load');
    
    const loadTime = Date.now() - startTime;
    console.log(`Amazon.in load time: ${loadTime}ms`);
    
    // Verify reasonable load time (under 10 seconds)
    expect(loadTime).toBeLessThan(10000);
    
    // This test demonstrates Lambda performance monitoring
    await page.evaluate((time) => {
      console.log(`Performance metric: ${time}ms load time`);
    }, loadTime);
  });

  test('Basic HTML structure validation', async ({ page }) => {
    await page.goto('https://amazon.in');
    
    // Wait for page to stabilize
    await page.waitForTimeout(3000);
    
    // Verify essential HTML elements exist (regardless of content)
    const htmlStructure = await page.evaluate(() => {
      return {
        hasTitle: !!document.title,
        hasBody: !!document.body,
        hasHead: !!document.head,
        metaTags: document.querySelectorAll('meta').length,
        linkTags: document.querySelectorAll('link').length
      };
    });
    
    expect(htmlStructure.hasTitle).toBe(true);
    expect(htmlStructure.hasBody).toBe(true);
    expect(htmlStructure.hasHead).toBe(true);
    expect(htmlStructure.metaTags).toBeGreaterThan(0);
    
    console.log('HTML structure validation passed:', htmlStructure);
  });

  test('Network connectivity and SSL verification', async ({ page }) => {
    // This test demonstrates Lambda's network capabilities
    const response = await page.goto('https://amazon.in');
    
    // Verify SSL and response
    expect(response?.status()).toBeLessThan(400);
    expect(page.url()).toMatch(/^https:/);
    
    // Check for any network errors
    const networkErrors: string[] = [];
    page.on('response', response => {
      if (response.status() >= 400) {
        networkErrors.push(`${response.status()}: ${response.url()}`);
      }
    });
    
    await page.waitForTimeout(5000);
    
    // Report network health (useful for Lambda monitoring)
    console.log(`Network errors detected: ${networkErrors.length}`);
    if (networkErrors.length > 0) {
      console.log('Network errors:', networkErrors.slice(0, 5)); // Log first 5
    }
  });
});
