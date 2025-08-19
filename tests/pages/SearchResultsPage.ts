import { Page, Locator } from '@playwright/test';

export class SearchResultsPage {
  readonly page: Page;
  readonly searchResults: Locator;
  readonly firstProductTitle: Locator;
  readonly firstProductImage: Locator;
  readonly firstProductPrice: Locator;
  readonly firstProductRating: Locator;
  readonly sortDropdown: Locator;
  readonly filtersSidebar: Locator;
  readonly priceFilter: Locator;
  readonly brandFilter: Locator;
  readonly resultsCount: Locator;
  readonly nextPageButton: Locator;
  readonly previousPageButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchResults = page.locator('[data-component-type="s-search-result"]');
    this.firstProductTitle = page.locator('[data-component-type="s-search-result"] h2 a').first();
    this.firstProductImage = page.locator('[data-component-type="s-search-result"] img').first();
    this.firstProductPrice = page.locator('[data-component-type="s-search-result"] .a-price').first();
    this.firstProductRating = page.locator('[data-component-type="s-search-result"] [data-cy="reviews-ratings-slot"]').first();
    this.sortDropdown = page.locator('#s-result-sort-select');
    this.filtersSidebar = page.locator('#s-refinements');
    this.priceFilter = page.locator('#p_36-title');
    this.brandFilter = page.locator('#p_89-title');
    this.resultsCount = page.locator('[data-component-type="s-result-info-bar"]');
    this.nextPageButton = page.locator('a:has-text("Next")');
    this.previousPageButton = page.locator('a:has-text("Previous")');
  }

  async getProductCount(): Promise<number> {
    await this.searchResults.first().waitFor();
    return await this.searchResults.count();
  }

  async clickFirstProduct() {
    await this.firstProductTitle.click();
    await this.page.waitForLoadState('networkidle');
  }

  async sortBy(option: string) {
    await this.sortDropdown.selectOption(option);
    await this.page.waitForLoadState('networkidle');
  }

  async applyPriceFilter(minPrice: string, maxPrice: string) {
    await this.priceFilter.click();
    await this.page.fill('#low-price', minPrice);
    await this.page.fill('#high-price', maxPrice);
    await this.page.click('input[aria-labelledby="a-autoid-1-announce"]');
  }

  async getFirstProductDetails() {
    return {
      title: await this.firstProductTitle.textContent(),
      price: await this.firstProductPrice.textContent(),
      rating: await this.firstProductRating.textContent()
    };
  }

  async isLoaded(): Promise<boolean> {
    try {
      await this.searchResults.first().waitFor({ timeout: 10000 });
      return true;
    } catch {
      return false;
    }
  }
}
