
import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Product Image Persistence', () => {
    test.setTimeout(60000); // Global timeout for this test

    test('should persist images after creation and editing', async ({ page, context }) => {
        console.log("Starting test...");

        // 0. Clean Setup
        await page.goto('/login');
        await context.clearCookies();
        await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
        });
        await page.reload();

        // 1. Login
        console.log("Navigating to login...");
        await page.goto('/login');

        // Toggle Developer Options
        const devOptions = page.locator('summary', { hasText: 'Developer Options' });
        await expect(devOptions).toBeVisible();
        await devOptions.click();

        const emailInput = page.locator('#test-email');
        await expect(emailInput).toBeVisible({ timeout: 10000 });
        await emailInput.fill('test-admin@greenbird.com');
        await page.fill('#test-password', 'password123!');
        console.log("Clicking login...");
        await page.click('button:has-text("Test Login")');

        // Wait for Admin Redirect
        console.log("Waiting for admin redirect...");
        await expect(page).toHaveURL(/\/admin/, { timeout: 30000 });
        console.log("Logged in as Admin.");

        // 2. Go to New Product
        console.log("Navigating to new product page...");
        await page.goto('/admin/inventory/new');

        // 3. Fill Form
        const timestamp = Date.now();
        const productName = `Auto Test Product ${timestamp}`;
        await page.fill('input[name="name"]', productName);

        const categorySelect = page.locator('select[name="categoryId"]');
        await expect(categorySelect.locator('option')).toHaveCount(await categorySelect.locator('option').count());
        await categorySelect.selectOption({ index: 1 });

        await page.fill('input[name="currentPrice"]', '500');

        // 4. Upload Image
        const imagePath = path.join(process.cwd(), 'public', 'next.svg');
        console.log("Uploading image:", imagePath);
        await page.setInputFiles('input[type="file"]', imagePath);

        // Wait for Preview
        await page.waitForSelector('img[alt="Product 1"]', { timeout: 20000 });
        console.log("Image preview visible.");

        // 5. Save
        console.log("Saving product...");
        await page.click('button[type="submit"]');

        // Wait for List
        await page.waitForURL('**/admin/inventory', { timeout: 30000 });
        console.log("Redirected to inventory list.");

        // 6. Verify in List
        await expect(page.locator('body')).toContainText(productName);

        // 7. Go to Edit
        console.log("Navigating to edit page...");
        // Use search to find the row reliably
        const searchInput = page.locator('input[placeholder*="Search"]');
        if (await searchInput.isVisible()) {
            await searchInput.fill(productName);
            await page.waitForTimeout(2000);
        }

        const productRow = page.locator('tr', { hasText: productName }).first();
        const editLink = productRow.locator('a[href*="/edit"]');
        await expect(editLink).toBeVisible();
        await editLink.click();

        // 8. Verify Image in Edit Mode
        console.log("Checking image in Edit Mode...");
        const previewImage = page.locator('img[alt="Product 1"]');
        await expect(previewImage).toBeVisible({ timeout: 20000 }); // Increased timeout

        const src = await previewImage.getAttribute('src');
        expect(src).toBeTruthy();
        console.log('SUCCESS: Image URL found in edit mode:', src);

        // 9. Public Page Verification
        const url = page.url();
        const id = new URL(url).searchParams.get('id');
        console.log("Checking public page for ID:", id);

        await page.goto(`/shop/${id}`);
        await expect(page.locator(`img[alt="${productName}"]`)).toBeVisible({ timeout: 20000 });
        console.log("SUCCESS: Image visible on public page.");
    });
});
