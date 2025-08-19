import { test, expect } from '@playwright/test';

test.describe('API Integration and Network Monitoring', () => {
  
  test('network request monitoring during search', async ({ page }) => {
  type NetworkRequest = { url: string; method: string; resourceType: string };
  type FailedRequest = { url: string; failure?: string };
  const networkRequests: NetworkRequest[] = [];
  const failedRequests: FailedRequest[] = [];
    
    // Monitor network requests
    page.on('request', request => {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType()
      });
    });
    
    page.on('requestfailed', request => {
      failedRequests.push({
        url: request.url(),
        failure: request.failure()?.errorText
      });
    });
    
    await test.step('Monitor API calls during search workflow', async () => {
      await page.goto('https://amazon.in');
      await page.waitForSelector('#twotabsearchtextbox', { timeout: 30000 });
      
      await page.fill('#twotabsearchtextbox', 'wireless headphones');
      await page.click('#nav-search-submit-button');
      
      await page.waitForURL('**/s?**', { timeout: 30000 });
      await page.waitForSelector('[data-component-type="s-search-result"], .s-result-item', { timeout: 20000 });
      
      
      const searchAPIRequests = networkRequests.filter(req => 
        req.url.includes('/s?') || req.url.includes('search') || req.url.includes('/api/')
      );
      
      console.log(`Network Analysis:
        - Total Requests: ${networkRequests.length}
        - Search-related Requests: ${searchAPIRequests.length}
        - Failed Requests: ${failedRequests.length}`);
      
      
      expect(failedRequests.length).toBeLessThan(5); // Allow some minor asset failures
      
      
      expect(searchAPIRequests.length).toBeGreaterThan(0);
    });
  });

  test('response time monitoring and SLA validation', async ({ page }) => {
  type ResponseMetric = { url: string; status: number; size?: string };
  const responseMetrics: ResponseMetric[] = [];
    
    page.on('response', response => {
      responseMetrics.push({
        url: response.url(),
        status: response.status(),
        size: response.headers()['content-length']
      });
    });
    
    await test.step('Monitor response times for SLA compliance', async () => {
      const startTime = Date.now();
      
      await page.goto('https://amazon.in');
      await page.waitForSelector('#twotabsearchtextbox', { timeout: 30000 });
      
      const pageLoadTime = Date.now() - startTime;
      
      await page.fill('#twotabsearchtextbox', 'performance test');
      const searchStartTime = Date.now();
      await page.click('#nav-search-submit-button');
      
      await page.waitForURL('**/s?**', { timeout: 30000 });
      await page.waitForSelector('[data-component-type="s-search-result"], .s-result-item', { timeout: 20000 });
      
      const searchTime = Date.now() - searchStartTime;
      
      
      expect(pageLoadTime).toBeLessThan(8000); // Homepage should load within 8 seconds
      expect(searchTime).toBeLessThan(12000); // Search should complete within 12 seconds
      
      
      const criticalAPIs = responseMetrics.filter(metric => 
        metric.url.includes('amazon.in') && 
        (metric.url.includes('/s?') || metric.url.includes('/api/'))
      );
      
      criticalAPIs.forEach(api => {
        expect(api.status).toBeLessThan(400); // No 4xx or 5xx errors for critical APIs
      });
      
      console.log(`SLA Compliance Check:
        - Page Load Time: ${pageLoadTime}ms (Target: <8000ms)
        - Search Response Time: ${searchTime}ms (Target: <12000ms)
        - Critical API Calls: ${criticalAPIs.length}`);
    });
  });

  test('error handling and resilience testing', async ({ page }) => {
    await test.step('Test application resilience with invalid inputs', async () => {
      const errorScenarios = [
        { input: '', description: 'Empty search' },
        { input: '!@#$%^&*()', description: 'Special characters only' },
        { input: 'a'.repeat(200), description: 'Very long search term' },
        { input: '12345', description: 'Numeric only search' },
        { input: 'xyzabcdefghijklmnop', description: 'Non-existent product term' }
      ];
      
      for (const scenario of errorScenarios) {
        await page.goto('https://amazon.in');
        await page.waitForSelector('#twotabsearchtextbox', { timeout: 30000 });
        
        await page.fill('#twotabsearchtextbox', scenario.input);
        await page.click('#nav-search-submit-button');
        
      
        await page.waitForTimeout(5000);
        
        
        const currentUrl = page.url();
        expect(currentUrl).toBeTruthy();
        
        
        const hasResults = await page.locator('[data-component-type="s-search-result"], .s-result-item').count() > 0;
        const hasNoResultsMessage = await page.locator('text="No results", text="did not match", text="Try different"').isVisible({ timeout: 3000 });
        
        
        expect(hasResults || hasNoResultsMessage).toBe(true);
        
        console.log(`✓ Error scenario "${scenario.description}" handled gracefully`);
      }
    });
  });

  test('security and data validation testing', async ({ page }) => {
    await test.step('Test XSS and injection protection', async () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        '\'; DROP TABLE products; --',
        '"><script>alert(1)</script>',
        'javascript:alert("test")',
        '<img src="x" onerror="alert(1)">'
      ];
      
      for (const maliciousInput of maliciousInputs) {
        await page.goto('https://amazon.in');
        await page.waitForSelector('#twotabsearchtextbox', { timeout: 30000 });
        
        await page.fill('#twotabsearchtextbox', maliciousInput);
        await page.click('#nav-search-submit-button');
        
        await page.waitForTimeout(3000);
        
        
        let alertTriggered = false;
        page.once('dialog', () => { alertTriggered = true; });
        await page.waitForTimeout(1000);
        expect(alertTriggered).toBe(false);
        
        
        const currentUrl = page.url();
        expect(currentUrl).not.toContain('<script>');
        expect(currentUrl).not.toContain('javascript:');
        
        console.log(`✓ Security test passed for malicious input: ${maliciousInput.substring(0, 20)}...`);
      }
    });
  });

  test('accessibility compliance validation', async ({ page }) => {
    await test.step('Test WCAG compliance and accessibility features', async () => {
      await page.goto('https://amazon.in');
      await page.waitForSelector('#twotabsearchtextbox', { timeout: 30000 });
      
      
      const searchBox = page.locator('#twotabsearchtextbox');
      const hasAriaLabel = await searchBox.getAttribute('aria-label') || 
                          await searchBox.getAttribute('aria-labelledby') ||
                          await searchBox.getAttribute('title');
      
      expect(hasAriaLabel).toBeTruthy();
      
      
      await searchBox.focus();
      await page.keyboard.press('Tab');
      
      const searchButton = page.locator('#nav-search-submit-button');
      const isFocused = await searchButton.evaluate(el => el === document.activeElement);
      expect(isFocused).toBe(true);
      
      
      await page.fill('#twotabsearchtextbox', 'accessibility test');
      await page.click('#nav-search-submit-button');
      
      await page.waitForURL('**/s?**', { timeout: 30000 });
      
      
      const hasH1 = await page.locator('h1').count() > 0;
      expect(hasH1).toBe(true);
      
      console.log('✓ Accessibility compliance validation completed');
    });
  });

  test('load testing simulation', async ({ page, context }) => {
    await test.step('Simulate concurrent user load', async () => {
  type SearchResult = { searchTerm: string; loadTime: number | null; success: boolean; error?: string };
  const concurrentSearches: Promise<SearchResult>[] = [];
      const searchTerms = ['laptop', 'mobile', 'books', 'clothing', 'electronics'];
      
      
      for (let i = 0; i < 3; i++) {
        const newPage = await context.newPage();
        const searchTerm = searchTerms[i % searchTerms.length];
        
        const searchPromise = (async () => {
          const startTime = Date.now();
          
          await newPage.goto('https://amazon.in');
          await newPage.waitForSelector('#twotabsearchtextbox', { timeout: 30000 });
          
          await newPage.fill('#twotabsearchtextbox', searchTerm);
          await newPage.click('#nav-search-submit-button');
          
          await newPage.waitForURL('**/s?**', { timeout: 30000 });
          await newPage.waitForSelector('[data-component-type="s-search-result"], .s-result-item', { timeout: 20000 });
          
          const endTime = Date.now();
          await newPage.close();
          
          return {
            searchTerm,
            loadTime: endTime - startTime,
            success: true
          };
        })().catch((error: Error) => ({
          searchTerm,
          loadTime: null,
          success: false,
          error: error.message
        }));
        
        concurrentSearches.push(searchPromise);
      }
      
      
      const results = await Promise.all(concurrentSearches);
      

      const successfulSearches = results.filter(r => r.success);
  const averageLoadTime = successfulSearches.reduce((sum, r) => sum + (r.loadTime ?? 0), 0) / (successfulSearches.length || 1);
      
      expect(successfulSearches.length).toBeGreaterThanOrEqual(2); // At least 2/3 should succeed
      expect(averageLoadTime).toBeLessThan(20000); // Average should be under 20 seconds
      
      console.log(`Load Test Results:
        - Successful Searches: ${successfulSearches.length}/3
        - Average Load Time: ${averageLoadTime}ms
        - Results: ${JSON.stringify(results, null, 2)}`);
    });
  });
});
