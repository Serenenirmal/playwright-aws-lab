import { Page, Locator } from '@playwright/test';

export class AmazonHomePage {
  readonly page: Page;
  readonly searchBox: Locator;
  readonly searchButton: Locator;
  readonly cartIcon: Locator;
  readonly signInButton: Locator;
  readonly deliveryLocation: Locator;
  readonly categoryDropdown: Locator;
  readonly headerLogo: Locator;
  readonly todaysDealsLink: Locator;
  readonly customerServiceLink: Locator;
  readonly sellLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchBox = page.locator('#twotabsearchtextbox');
    this.searchButton = page.locator('#nav-search-submit-button');
    this.cartIcon = page.locator('#nav-cart');
    this.signInButton = page.locator('#nav-link-accountList');
    this.deliveryLocation = page.locator('#glow-ingress-line1');
    this.categoryDropdown = page.locator('#searchDropdownBox');
    this.headerLogo = page.locator('#nav-logo-sprites');
    this.todaysDealsLink = page.locator('a[href*="deals"]').first();
    this.customerServiceLink = page.locator('a[href*="customer-service"]');
    this.sellLink = page.locator('a[href*="sell"]');
  }

  async navigate() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  async search(searchTerm: string) {
    await this.searchBox.fill(searchTerm);
    await this.searchButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async selectCategory(category: string) {
    await this.categoryDropdown.selectOption(category);
  }

  async isLoaded(): Promise<boolean> {
    try {
      await this.headerLogo.waitFor({ timeout: 5000 });
      await this.searchBox.waitFor({ timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }
}
