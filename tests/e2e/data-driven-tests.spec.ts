import { test, expect } from '@playwright/test';
import testData from '../data/test-data.json';

test.describe('Data-Driven E-Commerce Testing Suite', () => {
  
  // Test all search scenarios from JSON data
  for (const scenario of testData.searchScenarios) {
    test(`search validation for ${scenario.category} - ${scenario.searchTerm}`, async ({ page }) => {
      await test.step(`Test search scenario: ${scenario.searchTerm} in ${scenario.category}`, async () => {
        await page.goto('https://amazon.in');
        await page.waitForSelector('#twotabsearchtextbox', { timeout: 30000 });
        
        
        await page.fill('#twotabsearchtextbox', scenario.searchTerm);
        await page.click('#nav-search-submit-button');
        
       
        await page.waitForURL('**/s?**', { timeout: 30000 });
        await page.waitForSelector('[data-component-type="s-search-result"], .s-result-item', { timeout: 20000 });
        
      
        const resultCount = await page.locator('[data-component-type="s-search-result"], .s-result-item').count();
        expect(resultCount).toBeGreaterThanOrEqual(scenario.expectedMinResults);
        
        
        expect(page.url()).toContain(encodeURIComponent(scenario.searchTerm.replace(' ', '+')));
        
        console.log(`✓ ${scenario.category} search for "${scenario.searchTerm}" returned ${resultCount} results`);
      });
    });
  }

  // Test user personas with different search patterns
  for (const persona of testData.userPersonas) {
    test(`user persona simulation - ${persona.name}`, async ({ page }) => {
      await test.step(`Simulate ${persona.name} user behavior`, async () => {
        await page.goto('https://amazon.in');
        await page.waitForSelector('#twotabsearchtextbox', { timeout: 30000 });
        
        // Test each search pattern for this persona
        for (const searchPattern of persona.searchPatterns) {
          await page.goto('https://amazon.in');
          await page.waitForSelector('#twotabsearchtextbox', { timeout: 30000 });
          
          await page.fill('#twotabsearchtextbox', searchPattern);
          await page.click('#nav-search-submit-button');
          
          await page.waitForURL('**/s?**', { timeout: 30000 });
          await page.waitForSelector('[data-component-type="s-search-result"], .s-result-item', { timeout: 20000 });
          
          const results = await page.locator('[data-component-type="s-search-result"], .s-result-item').count();
          expect(results).toBeGreaterThan(0);
          
          console.log(`${persona.name} searched for "${searchPattern}" - ${results} results found`);
        }
      });
    });
  }

  // Test across different device environments
  for (const environment of testData.testEnvironments) {
    test(`cross-platform compatibility - ${environment.name}`, async ({ page }) => {
      await test.step(`Test on ${environment.name} viewport`, async () => {
        // Set viewport for current environment
        await page.setViewportSize(environment.viewport);
        
        await page.goto('https://amazon.in');
        await page.waitForSelector('#twotabsearchtextbox', { timeout: 30000 });
        
        
        await expect(page.locator('#twotabsearchtextbox')).toBeVisible();
        await expect(page.locator('#nav-search-submit-button')).toBeVisible();
        
        
        await page.fill('#twotabsearchtextbox', 'test product');
        await page.click('#nav-search-submit-button');
        
        await page.waitForURL('**/s?**', { timeout: 30000 });
        const results = await page.locator('[data-component-type="s-search-result"], .s-result-item').count();
        expect(results).toBeGreaterThan(0);
        
        console.log(`✓ ${environment.name} (${environment.viewport.width}x${environment.viewport.height}) - Search functional`);
      });
    });
  }

  test('bulk search performance testing', async ({ page }) => {
    await test.step('Execute multiple searches and measure performance', async () => {
  type PerformanceMetric = { searchTerm: string; loadTime: number; category: string };
  const performanceMetrics: PerformanceMetric[] = [];
      
      for (let i = 0; i < 3; i++) {
        const scenario = testData.searchScenarios[i];
        
        const startTime = Date.now();
        
        await page.goto('https://amazon.in');
        await page.waitForSelector('#twotabsearchtextbox', { timeout: 30000 });
        
        await page.fill('#twotabsearchtextbox', scenario.searchTerm);
        await page.click('#nav-search-submit-button');
        
        await page.waitForURL('**/s?**', { timeout: 30000 });
        await page.waitForSelector('[data-component-type="s-search-result"], .s-result-item', { timeout: 20000 });
        
        const endTime = Date.now();
        const loadTime = endTime - startTime;
        
        performanceMetrics.push({
          searchTerm: scenario.searchTerm,
          loadTime,
          category: scenario.category
        });
        
        // Performance assertion
        expect(loadTime).toBeLessThan(20000); // Should complete within 20 seconds
      }
      
     
  const averageLoadTime = performanceMetrics.reduce((sum, metric) => sum + metric.loadTime, 0) / (performanceMetrics.length || 1);
      
      console.log('Performance Metrics Summary:', {
        averageLoadTime: `${averageLoadTime}ms`,
        individualMetrics: performanceMetrics
      });
      
      expect(averageLoadTime).toBeLessThan(15000); // Average should be under 15 seconds
    });
  });

  test('search result quality validation', async ({ page }) => {
    await test.step('Validate search result relevance and quality', async () => {
      for (const scenario of testData.searchScenarios.slice(0, 3)) {
        await page.goto('https://amazon.in');
        await page.waitForSelector('#twotabsearchtextbox', { timeout: 30000 });
        
        await page.fill('#twotabsearchtextbox', scenario.searchTerm);
        await page.click('#nav-search-submit-button');
        
        await page.waitForURL('**/s?**', { timeout: 30000 });
        await page.waitForSelector('[data-component-type="s-search-result"], .s-result-item', { timeout: 20000 });
        
        
        const productTitles = await page.locator('[data-component-type="s-search-result"] h2 a, [data-component-type="s-search-result"] h2 span, .s-result-item h2 a, .s-result-item h2 span')
          .first()
          .textContent();
        
        if (productTitles) {
          // Validate that search term appears in results (basic relevance check)
          const searchWords = scenario.searchTerm.toLowerCase().split(' ');
          const titleWords = productTitles.toLowerCase();
          
          const relevantWords = searchWords.filter(word => titleWords.includes(word));
          expect(relevantWords.length).toBeGreaterThan(0);
          
          console.log(`✓ Search relevance validated for "${scenario.searchTerm}" - ${relevantWords.length}/${searchWords.length} keywords matched`);
        }
      }
    });
  });
});
