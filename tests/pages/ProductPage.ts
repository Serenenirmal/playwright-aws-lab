import { Page, Locator } from '@playwright/test';

export class ProductPage {
  readonly page: Page;
  readonly productTitle: Locator;
  readonly productPrice: Locator;
  readonly productImage: Locator;
  readonly addToCartButton: Locator;
  readonly buyNowButton: Locator;
  readonly quantityDropdown: Locator;
  readonly availabilityText: Locator;
  readonly productRating: Locator;
  readonly customerReviews: Locator;
  readonly productDescription: Locator;
  readonly specificationsSection: Locator;
  readonly continueShoppingButton: Locator;
  readonly rushHourModal: Locator;
  readonly modalCloseButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.productTitle = page.locator('#productTitle');
    this.productPrice = page.locator('.a-price.a-text-price.a-size-medium.apexPriceToPay');
    this.productImage = page.locator('#landingImage');
    this.addToCartButton = page.locator('#add-to-cart-button');
    this.buyNowButton = page.locator('#buy-now-button');
    this.quantityDropdown = page.locator('#quantity');
    this.availabilityText = page.locator('#availability span');
    this.productRating = page.locator('[data-hook="average-star-rating"]');
    this.customerReviews = page.locator('[data-hook="total-review-count"]');
    this.productDescription = page.locator('#feature-bullets');
    this.specificationsSection = page.locator('#productDetails_techSpec_section_1');
    
    // Dynamic content handlers
    this.continueShoppingButton = page.locator('button:has-text("Continue shopping")');
    this.rushHourModal = page.locator('[role="dialog"]');
    this.modalCloseButton = page.locator('button[aria-label="Close"]');
  }

  async addToCart() {
    await this.addToCartButton.click();
    await this.handleDynamicContent();
  }

  async setQuantity(quantity: string) {
    await this.quantityDropdown.selectOption(quantity);
  }

  async getProductDetails() {
    return {
      title: await this.productTitle.textContent(),
      price: await this.productPrice.textContent(),
      availability: await this.availabilityText.textContent(),
      rating: await this.productRating.textContent()
    };
  }

  private async handleDynamicContent() {
    try {
      // Handle rush hour or shopping continuation prompts
      if (await this.continueShoppingButton.isVisible({ timeout: 3000 })) {
        await this.continueShoppingButton.click();
      }
      
      if (await this.rushHourModal.isVisible({ timeout: 2000 })) {
        await this.modalCloseButton.click();
      }
    } catch {
      // Continue if no dynamic content appears
    }
  }

  async isLoaded(): Promise<boolean> {
    try {
      await this.productTitle.waitFor({ timeout: 8000 });
      await this.addToCartButton.waitFor({ timeout: 8000 });
      return true;
    } catch {
      return false;
    }
  }
}
