import { Page, expect } from '@playwright/test';

export class TestHelpers {
  
  /**
   * Wait for element with retry logic
   */
  static async waitForElementWithRetry(
    page: Page, 
    selector: string, 
    maxRetries: number = 3, 
    timeout: number = 10000
  ): Promise<boolean> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        await page.waitForSelector(selector, { timeout });
        return true;
      } catch (error) {
        if (i === maxRetries - 1) {
          console.log(`Failed to find element ${selector} after ${maxRetries} retries`);
          return false;
        }
        await page.waitForTimeout(2000);
      }
    }
    return false;
  }

  /**
   * Measure page load performance
   */
  static async measurePageLoad(page: Page, url: string): Promise<{
    loadTime: number;
    domContentLoaded: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
  }> {
    const startTime = Date.now();
    
    await page.goto(url);
    
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paintEntries = performance.getEntriesByType('paint');
      
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
        firstContentfulPaint: paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
        largestContentfulPaint: paintEntries.find(entry => entry.name === 'largest-contentful-paint')?.startTime || 0
      };
    });
    
    const endTime = Date.now();
    
    return {
      loadTime: endTime - startTime,
      ...performanceMetrics
    };
  }

  /**
   * Take screenshot with timestamp
   */
  static async takeTimestampedScreenshot(page: Page, name: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${name}-${timestamp}.png`;
    
    await page.screenshot({ 
      path: `test-results/screenshots/${filename}`,
      fullPage: true 
    });
    
    return filename;
  }

  /**
   * Check for JavaScript errors on page
   */
  static async monitorJavaScriptErrors(page: Page): Promise<string[]> {
    const jsErrors: string[] = [];
    
    page.on('pageerror', error => {
      jsErrors.push(error.message);
    });
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        jsErrors.push(msg.text());
      }
    });
    
    return jsErrors;
  }

  /**
   * Simulate different network conditions
   */
  static async setNetworkConditions(
    page: Page, 
    conditions: 'slow-3g' | 'fast-3g' | 'offline' | 'normal'
  ): Promise<void> {
    const client = await page.context().newCDPSession(page);
    await client.send('Network.enable');
    
    const conditionsMap = {
      'slow-3g': { offline: false, downloadThroughput: 400 * 1024, uploadThroughput: 400 * 1024, latency: 2000 },
      'fast-3g': { offline: false, downloadThroughput: 1.5 * 1024 * 1024, uploadThroughput: 750 * 1024, latency: 562.5 },
      'offline': { offline: true, downloadThroughput: 0, uploadThroughput: 0, latency: 0 },
      'normal': { offline: false, downloadThroughput: -1, uploadThroughput: -1, latency: 0 }
    };
    
    await client.send('Network.emulateNetworkConditions', conditionsMap[conditions]);
  }

  /**
   * Extract product information from Amazon search results
   */
  static async extractProductInfo(page: Page, maxProducts: number = 5): Promise<Array<{
    title: string;
    price: string;
    rating: string;
    image: string;
  }>> {
    const products = [];
    
    const productElements = await page.locator('[data-component-type="s-search-result"]').all();
    const limit = Math.min(productElements.length, maxProducts);
    
    for (let i = 0; i < limit; i++) {
      const product = productElements[i];
      
      try {
        const title = await product.locator('h2 a, h2 span').first().textContent() || 'No title';
        const price = await product.locator('.a-price .a-offscreen').first().textContent() || 'No price';
        const rating = await product.locator('[data-cy="reviews-ratings-slot"] span').first().textContent() || 'No rating';
        const image = await product.locator('img').first().getAttribute('src') || 'No image';
        
        products.push({ title, price, rating, image });
      } catch (error) {
        console.log(`Error extracting product ${i + 1}:`, error);
      }
    }
    
    return products;
  }

  /**
   * Validate accessibility compliance
   */
  static async checkAccessibility(page: Page): Promise<{
    hasSkipLinks: boolean;
    hasAriaLabels: boolean;
    hasHeadingStructure: boolean;
    keyboardNavigable: boolean;
  }> {
    // Check for skip links
    const hasSkipLinks = await page.locator('a[href*="#main"], a[href*="#content"], .skip-link').count() > 0;
    
    // Check for ARIA labels on form elements
    const formElements = await page.locator('input, button, select, textarea').count();
    const labeledElements = await page.locator('input[aria-label], input[aria-labelledby], button[aria-label], select[aria-label], textarea[aria-label]').count();
    const hasAriaLabels = formElements > 0 && (labeledElements / formElements) > 0.5;
    
    // Check heading structure
    const hasH1 = await page.locator('h1').count() > 0;
    const hasHeadingStructure = hasH1;
    
    // Test basic keyboard navigation
    await page.keyboard.press('Tab');
    const activeElement = await page.evaluate(() => document.activeElement?.tagName);
    const keyboardNavigable = activeElement !== 'BODY';
    
    return {
      hasSkipLinks,
      hasAriaLabels,
      hasHeadingStructure,
      keyboardNavigable
    };
  }

  /**
   * Generate test report data
   */
  static generateTestReport(results: Array<{
    testName: string;
    passed: boolean;
    duration: number;
    error?: string;
  }>): {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    passRate: number;
    totalDuration: number;
    averageDuration: number;
  } {
    const totalTests = results.length;
    const passedTests = results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const passRate = (passedTests / totalTests) * 100;
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
    const averageDuration = totalDuration / totalTests;
    
    return {
      totalTests,
      passedTests,
      failedTests,
      passRate,
      totalDuration,
      averageDuration
    };
  }

  /**
   * Handle dynamic content and loading states
   */
  static async handleDynamicContent(page: Page): Promise<void> {
    // Handle common dynamic content that might interfere with tests
    const dynamicElements = [
      'button:has-text("Continue shopping")',
      '[data-testid*="modal"] button[aria-label="Close"]',
      '.rush-component button:has-text("OK")',
      '[role="dialog"] button',
      '.a-modal-scroller button:has-text("Close")'
    ];
    
    for (const selector of dynamicElements) {
      try {
        const element = page.locator(selector);
        if (await element.isVisible({ timeout: 3000 })) {
          await element.click();
          await page.waitForTimeout(1000);
        }
      } catch {
        // Continue if element not found or not clickable
      }
    }
  }

  /**
   * Validate search results relevance
   */
  static validateSearchRelevance(searchTerm: string, productTitles: string[]): {
    relevanceScore: number;
    matchedProducts: number;
    totalProducts: number;
  } {
    const searchWords = searchTerm.toLowerCase().split(' ');
    let matchedProducts = 0;
    
    productTitles.forEach(title => {
      const titleWords = title.toLowerCase();
      const hasMatch = searchWords.some(word => titleWords.includes(word));
      if (hasMatch) matchedProducts++;
    });
    
    const relevanceScore = (matchedProducts / productTitles.length) * 100;
    
    return {
      relevanceScore,
      matchedProducts,
      totalProducts: productTitles.length
    };
  }
}

export default TestHelpers;
