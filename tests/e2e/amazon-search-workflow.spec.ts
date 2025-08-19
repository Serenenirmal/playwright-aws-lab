import { test, expect } from '@playwright/test';
import { AmazonHomePage } from '../pages/AmazonHomePage';
import { SearchResultsPage } from '../pages/SearchResultsPage';
import { ProductPage } from '../pages/ProductPage';

test.describe('Amazon E2E Search Workflow', () => {
  let homePage: AmazonHomePage;
  let searchPage: SearchResultsPage;
  let productPage: ProductPage;

  test.beforeEach(async ({ page }) => {
    homePage = new AmazonHomePage(page);
    searchPage = new SearchResultsPage(page);
    productPage = new ProductPage(page);
    
    await homePage.navigate();
  });

  test('complete product search and selection workflow', async ({ page }) => {
    // Test homepage functionality
    await test.step('Verify homepage loads correctly', async () => {
      expect(await homePage.isLoaded()).toBe(true);
      await expect(homePage.searchBox).toBeVisible();
      await expect(homePage.cartIcon).toBeVisible();
    });

    // Test search functionality
    await test.step('Search for electronics products', async () => {
      await homePage.selectCategory('Electronics');
      await homePage.search('wireless headphones');
      
      expect(await searchPage.isLoaded()).toBe(true);
      const productCount = await searchPage.getProductCount();
      expect(productCount).toBeGreaterThan(0);
    });

    // Test search results interaction
    await test.step('Interact with search results', async () => {
      await searchPage.sortBy('price-desc-rank');
      await page.waitForTimeout(2000); // Allow sort to complete
      
      const productDetails = await searchPage.getFirstProductDetails();
      expect(productDetails.title).toBeTruthy();
      expect(productDetails.price).toBeTruthy();
      
      await searchPage.clickFirstProduct();
    });

    // Test product page functionality
    await test.step('Verify product page and add to cart', async () => {
      expect(await productPage.isLoaded()).toBe(true);
      
      const productInfo = await productPage.getProductDetails();
      expect(productInfo.title).toBeTruthy();
      expect(productInfo.availability).toBeTruthy();
      
      // Test add to cart functionality
      await productPage.addToCart();
      
      // Verify cart interaction (may redirect or show modal)
      await page.waitForTimeout(3000);
      expect(page.url()).toContain('amazon.in');
    });
  });

  test('advanced search with filters', async ({ page }) => {
    await test.step('Search with category filter', async () => {
      await homePage.selectCategory('Books');
      await homePage.search('javascript programming');
      
      expect(await searchPage.isLoaded()).toBe(true);
    });

    await test.step('Apply price filters', async () => {
      await searchPage.applyPriceFilter('500', '2000');
      await page.waitForTimeout(2000);
      
      const productCount = await searchPage.getProductCount();
      expect(productCount).toBeGreaterThan(0);
    });

    await test.step('Verify filtered results', async () => {
      const firstProduct = await searchPage.getFirstProductDetails();
      expect(firstProduct.title).toContain('JavaScript');
    });
  });

  test('navigation and UI responsiveness', async ({ page }) => {
    await test.step('Test navigation elements', async () => {
      await expect(homePage.todaysDealsLink).toBeVisible();
      await expect(homePage.customerServiceLink).toBeVisible();
      await expect(homePage.deliveryLocation).toBeVisible();
    });

    await test.step('Test search without category', async () => {
      await homePage.search('amazon kindle');
      expect(await searchPage.isLoaded()).toBe(true);
      
      const results = await searchPage.getProductCount();
      expect(results).toBeGreaterThanOrEqual(1);
    });

    await test.step('Test pagination if available', async () => {
      if (await searchPage.nextPageButton.isVisible()) {
        await searchPage.nextPageButton.click();
        await page.waitForLoadState('networkidle');
        expect(await searchPage.isLoaded()).toBe(true);
      }
    });
  });
});
