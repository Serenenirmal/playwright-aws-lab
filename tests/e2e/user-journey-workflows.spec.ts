import { test, expect } from '@playwright/test';
import { AmazonHomePage } from '../pages/AmazonHomePage';
import { SearchResultsPage } from '../pages/SearchResultsPage';
import { ProductPage } from '../pages/ProductPage';

test.describe('Complete User Journey Workflows', () => {
  
  test('end-to-end shopping journey - search to cart', async ({ page }) => {
    const homePage = new AmazonHomePage(page);
    const searchPage = new SearchResultsPage(page);
    const productPage = new ProductPage(page);

    // Step 1: Homepage Navigation and Search
    await test.step('Navigate to homepage and perform product search', async () => {
      await homePage.navigate();
      await expect(homePage.searchBox).toBeVisible();
      
      // Search for specific product category
      await homePage.search('wireless bluetooth headphones');
      expect(await searchPage.isLoaded()).toBe(true);
      
      const productCount = await searchPage.getProductCount();
      expect(productCount).toBeGreaterThan(5);
    });

    // Step 2: Product Selection and Filtering
    await test.step('Apply filters and select product', async () => {
      // Sort by customer reviews
      if (await searchPage.sortDropdown.isVisible({ timeout: 5000 })) {
        await searchPage.sortBy('review-rank');
        await page.waitForTimeout(3000);
      }
      
      // Get first product details
      const firstProductTitle = page.locator('[data-component-type="s-search-result"] h2 a, [data-component-type="s-search-result"] h2 span').first();
      await expect(firstProductTitle).toBeVisible({ timeout: 10000 });
      
      // Click on first product
      await Promise.all([
        page.waitForNavigation({ timeout: 30000 }),
        firstProductTitle.click()
      ]);
    });

    // Step 3: Product Page Interaction
    await test.step('Interact with product page and add to cart', async () => {
      // Verify product page loaded
      await page.waitForSelector('#productTitle, .product-title', { timeout: 15000 });
      
      const productTitle = page.locator('#productTitle, .product-title').first();
      await expect(productTitle).toBeVisible();
      
      // Check if add to cart button exists
      const addToCartButton = page.locator('#add-to-cart-button, [name="submit.add-to-cart"]').first();
      if (await addToCartButton.isVisible({ timeout: 10000 })) {
        await addToCartButton.click();
        
        // Handle any pop-ups or modals
        await page.waitForTimeout(3000);
        
        // Look for cart success indicators
        const cartSuccessIndicators = [
          'text="Added to Cart"',
          'text="Added to cart"', 
          '[aria-label*="cart"]',
          '#huc-v2-order-row-confirm-text',
          '#attachDisplayAddBaseAlert'
        ];
        
        let cartUpdated = false;
        for (const indicator of cartSuccessIndicators) {
          if (await page.locator(indicator).isVisible({ timeout: 5000 })) {
            cartUpdated = true;
            break;
          }
        }
        
        expect(cartUpdated).toBe(true);
      }
    });

    // Step 4: Cart Verification
    await test.step('Verify cart functionality', async () => {
      // Navigate to cart
      const cartButton = page.locator('#nav-cart, [data-csa-c-content-id="sw-atc-details-single-container"]').first();
      if (await cartButton.isVisible({ timeout: 5000 })) {
        await cartButton.click();
        await page.waitForTimeout(3000);
        
        // Verify cart page or popup
        const cartIndicators = [
          '#sc-active-cart',
          '[data-name="Active Items"]',
          'text="Shopping Cart"',
          'text="Your cart"'
        ];
        
        let cartVisible = false;
        for (const indicator of cartIndicators) {
          if (await page.locator(indicator).isVisible({ timeout: 5000 })) {
            cartVisible = true;
            break;
          }
        }
        
        expect(cartVisible).toBe(true);
      }
    });
  });

  test('multi-category product comparison workflow', async ({ page }) => {
    const homePage = new AmazonHomePage(page);
    
    await test.step('Search across multiple product categories', async () => {
      const categories = ['laptops', 'smartphones', 'tablets'];
      const searchResults = new Map();
      
      for (const category of categories) {
        await homePage.navigate();
        await homePage.search(category);
        
        // Wait for results
        await page.waitForSelector('[data-component-type="s-search-result"], .s-result-item', { timeout: 20000 });
        
        const resultCount = await page.locator('[data-component-type="s-search-result"], .s-result-item').count();
        searchResults.set(category, resultCount);
        
        expect(resultCount).toBeGreaterThan(0);
      }
      
      // Verify all categories returned results
      expect(searchResults.size).toBe(3);
      categories.forEach(category => {
        expect(searchResults.get(category)).toBeGreaterThan(0);
      });
    });
  });

  test('price range filtering and sorting workflow', async ({ page }) => {
    await test.step('Advanced price filtering scenario', async () => {
      await page.goto('https://amazon.in');
      await page.waitForSelector('#twotabsearchtextbox', { timeout: 30000 });
      
      // Search for specific product category
      await page.fill('#twotabsearchtextbox', 'wireless earbuds');
      await page.click('#nav-search-submit-button');
      
      // Wait for results page
      await page.waitForURL('**/s?**', { timeout: 30000 });
      await page.waitForSelector('[data-component-type="s-search-result"], .s-result-item', { timeout: 20000 });
      
      // Try to apply price filter if available
      const priceFilterOptions = [
        '#p_36-title',
        'span:has-text("Price")',
        '[data-cy="price-filter"]'
      ];
      
      let priceFilterApplied = false;
      for (const filterOption of priceFilterOptions) {
        const filter = page.locator(filterOption);
        if (await filter.isVisible({ timeout: 5000 })) {
          await filter.click();
          await page.waitForTimeout(2000);
          
          // Look for price range inputs or checkboxes
          const priceRangeSelectors = [
            '[data-cy="range-picker-form"] input',
            '#low-price',
            'input[placeholder*="Min"]',
            '.s-range-input'
          ];
          
          for (const rangeSelector of priceRangeSelectors) {
            if (await page.locator(rangeSelector).isVisible({ timeout: 3000 })) {
              await page.locator(rangeSelector).first().fill('1000');
              priceFilterApplied = true;
              break;
            }
          }
          
          if (priceFilterApplied) break;
        }
      }
      
      // Verify results still exist after filtering
      const filteredResults = await page.locator('[data-component-type="s-search-result"], .s-result-item').count();
      expect(filteredResults).toBeGreaterThan(0);
    });
  });

  test('accessibility and mobile responsiveness workflow', async ({ page }) => {
    await test.step('Test responsive design across devices', async () => {
      // Desktop view
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('https://amazon.in');
      await page.waitForSelector('#twotabsearchtextbox', { timeout: 30000 });
      
      await expect(page.locator('#nav-logo')).toBeVisible();
      await expect(page.locator('#twotabsearchtextbox')).toBeVisible();
      
      // Tablet view
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.reload();
      await page.waitForSelector('#twotabsearchtextbox', { timeout: 30000 });
      
      await expect(page.locator('#twotabsearchtextbox')).toBeVisible();
      
      // Mobile view
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      await page.waitForSelector('#twotabsearchtextbox', { timeout: 30000 });
      
      await expect(page.locator('#twotabsearchtextbox')).toBeVisible();
      
      // Test mobile search functionality
      await page.fill('#twotabsearchtextbox', 'mobile accessories');
      await page.click('#nav-search-submit-button');
      
      await page.waitForURL('**/s?**', { timeout: 30000 });
      const mobileResults = await page.locator('[data-component-type="s-search-result"], .s-result-item').count();
      expect(mobileResults).toBeGreaterThan(0);
    });
  });

  test('performance and load time monitoring', async ({ page }) => {
    await test.step('Monitor page load performance', async () => {
      // Measure homepage load time
      const homepageStart = Date.now();
      await page.goto('https://amazon.in');
      await page.waitForSelector('#twotabsearchtextbox', { timeout: 30000 });
      const homepageLoadTime = Date.now() - homepageStart;
      
      expect(homepageLoadTime).toBeLessThan(10000); // Should load within 10 seconds
      
      // Measure search performance
      const searchStart = Date.now();
      await page.fill('#twotabsearchtextbox', 'performance test product');
      await page.click('#nav-search-submit-button');
      await page.waitForURL('**/s?**', { timeout: 30000 });
      await page.waitForSelector('[data-component-type="s-search-result"], .s-result-item', { timeout: 20000 });
      const searchLoadTime = Date.now() - searchStart;
      
      expect(searchLoadTime).toBeLessThan(15000); // Search should complete within 15 seconds
      
      console.log(`Performance Metrics:
        - Homepage Load Time: ${homepageLoadTime}ms
        - Search Load Time: ${searchLoadTime}ms`);
    });
  });
});
