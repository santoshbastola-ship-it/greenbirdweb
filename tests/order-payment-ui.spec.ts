
import { test, expect } from '@playwright/test';
import { cleanupAllTestData } from './test-utils';

test.describe('Order Payment UI & Flow', () => {

    test.afterEach(async () => {
        await cleanupAllTestData();
    });

    test('Customer sees Pay Now button and can open payment modal', async ({ page }) => {
        // 1. Setup: Create Product
        // Login as Admin
        await page.goto('/login');
        await page.locator('summary', { hasText: 'Developer Options' }).click();
        await page.fill('#test-email', 'test-admin@greenbird.com');
        await page.fill('#test-password', 'password123!');
        await page.click('button:has-text("Test Login")');
        await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });

        // Add Product
        await page.goto('/admin/inventory/add');
        await page.fill('input[name="name"]', 'Payment Test Product');
        await page.selectOption('select[name="businessType"]', 'product');
        // We need a category. Assuming "Vegetables" or creating one.
        // Let's quickly create a category to be safe
        // Navigate to categories to ensure it exists
        await page.goto('/admin/categories');
        // Check if exists
        const catExists = await page.locator('h3:has-text("Payment Test Category")').isVisible();
        if (!catExists) {
            await page.click('button:has-text("New Category")');
            await page.fill('input[placeholder*="e.g., Dairy"]', 'Payment Test Category');
            // Select by value to be safe, defaulting to 'product' business type
            // Try/catch for different select structures or assume standard
            try {
                await page.selectOption('select', { value: 'product' });
            } catch (e) {
                // Fallback to label if value not found or different structure
                await page.selectOption('select', { label: 'Products' });
            }
            await page.click('button:has-text("Save Category")');
            // Wait for it to appear
            await expect(page.locator('h3:has-text("Payment Test Category")')).toBeVisible();
        }

        // Navigate to add product page
        await page.goto('/admin/inventory/add');
        await page.fill('input[name="name"]', 'Payment Test Product');
        await page.selectOption('select[name="businessType"]', 'product');

        // Wait for category to be in the dropdown
        // Use a more specific locator if possible, or wait for fetch
        // We look for any option that isn't the placeholder
        await expect(page.locator('select[name="categoryId"] option:not([value=""])').first()).toBeAttached({ timeout: 10000 });

        // Now try to select. If it fails, maybe filtering didn't work.
        // We'll trust the business type filter works if we selected 'product' above.
        // If Payment Test Category has wrong business type, it won't show up.
        // But we just ensured it has 'product' type (hopefully).

        // Wait specifically for our category
        await expect(page.locator('select[name="categoryId"] option', { hasText: 'Payment Test Category' })).toBeAttached({ timeout: 5000 });

        await page.selectOption('select[name="categoryId"]', { label: 'Payment Test Category' });
        await page.fill('input[name="currentPrice"]', '500');
        await page.click('button:has-text("Save Product")');
        // Wait for success toast
        await expect(page.getByText('Product created successfully')).toBeVisible();

        // Add Stock
        const productCard = page.locator('div', { hasText: 'Payment Test Product' }).first();
        // Wait for list to load
        await page.goto('/admin/inventory');
        await page.click('button:has-text("Products")');
        await page.reload(); // Reload to ensure new product appears
        await expect(page.locator('div', { hasText: 'Payment Test Product' }).first()).toBeVisible();

        // Find the stock button (it might be 0)
        // Refined locator based on previous implementation or knowledge
        // But let's just use the "Update Stock" button if we can find it
        // Or simpler: The product creation likely sets stock to 0.
        // Let's assume stock is needed.
        // Update locator to match the stock button specifically within the target product card
        // We use the specific classes from product card and ensure we look for the button inside it
        const targetProductCard = page.locator('div.bg-white.rounded-lg.shadow-sm.border.border-gray-200', { hasText: 'Payment Test Product' }).first();
        const stockBtn = targetProductCard.locator('button', { hasText: /0\s/ });
        if (await stockBtn.isVisible()) {
            await stockBtn.click();
            await page.fill('input[type="number"]', '100');
            await page.fill('textarea', 'Initial Stock');
            await page.click('button:has-text("Update Stock")');
        }

        // Logout
        await page.context().clearCookies();
        await page.evaluate(async () => {
            localStorage.clear();
            sessionStorage.clear();
            if (window.indexedDB && window.indexedDB.databases) {
                const dbs = await window.indexedDB.databases();
                await Promise.all(dbs.map(db => window.indexedDB.deleteDatabase(db.name!)));
            }
        });


        // 2. Customer Flow
        await page.goto('/login');
        await page.locator('summary', { hasText: 'Developer Options' }).click();
        await page.fill('#test-email', 'test-customer@greenbird.com');
        await page.fill('#test-password', 'password123!');
        await page.click('button:has-text("Test Login")');

        // Add to Cart
        await page.goto('/shop');
        // Find the specific product card container
        const shopProductCard = page.locator('div.group.bg-white', { hasText: 'Payment Test Product' }).first();
        const addBtn = shopProductCard.locator('button', { hasText: 'Add' });
        await addBtn.click();

        // Checkout
        await page.goto('/cart');

        // Login as Customer (since we logged out earlier)
        await page.click('text=Login to Continue');
        await page.locator('summary', { hasText: 'Developer Options' }).click();
        await page.fill('#test-email', 'test-customer@greenbird.com'); // Use verified email or bypassed one
        await page.fill('#test-password', 'password123!'); // Password for test user
        await page.click('button:has-text("Test Login")');

        // Wait for redirect back to cart
        await page.waitForURL('**/cart');

        await page.fill('input[type="tel"]', '9800000000');

        // Add address if needed
        const placeOrderBtn = page.locator('button:has-text("Place Order")');
        if (await placeOrderBtn.isDisabled()) {
            const addNewAddrBtn = page.locator('button:has-text("Add New Address")');
            if (await addNewAddrBtn.isVisible()) {
                await addNewAddrBtn.click();
                await page.fill('input[placeholder*="House No"]', 'Test Address');
                await page.getByRole('button', { name: 'Save' }).click();
            }
        }

        await placeOrderBtn.click();
        await expect(page).toHaveURL('/order-success');

        // 3. Verify Payment UI in Orders Page
        await page.goto('/orders');

        // Find the order card
        const orderCard = page.locator('div.bg-white', { hasText: 'Payment Test Product' }).first();
        await expect(orderCard).toBeVisible();

        // 3a. Check Payment Status Badge
        const paymentBadge = orderCard.locator('span', { hasText: 'Payment Pending' });
        await expect(paymentBadge).toBeVisible();
        await expect(paymentBadge).toHaveClass(/bg-gray-100 text-gray-700/);
        await expect(paymentBadge).toHaveClass(/px-3 py-1 rounded-full/); // Check new classes

        // 3b. Check Pay Now Button
        const payButton = orderCard.locator('button:has-text("Pay Now")');
        await expect(payButton).toBeVisible();

        // 3c. Open Modal
        await payButton.click();
        const modal = page.locator('div.fixed.inset-0');
        await expect(modal).toBeVisible();
        await expect(modal).toContainText('Payment for #');
        await expect(modal).toContainText('Rs. 500');

        // 3d. Check QR Code (fallback or image)
        const qrImage = modal.locator('img[alt="Payment QR Code"]');
        await expect(qrImage).toBeVisible();

        // 3e. Check WhatsApp Link
        const whatsappLink = modal.locator('a[href*="wa.me/9779849850000"]');
        await expect(whatsappLink).toBeVisible();

        // Check message param
        const href = await whatsappLink.getAttribute('href');
        expect(href).toContain('text=Hi%2C%20I\'ve%20just%20made%20a%20payment');

        // 3f. Close Modal
        await modal.locator('button:has-text("Close")').click();
        await expect(modal).not.toBeVisible();
    });
});
