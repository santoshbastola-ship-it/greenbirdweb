
import { test, expect } from '@playwright/test';

test.describe('Image Persistence Reproduction', () => {
    test('should persist new image when editing existing product', async ({ page }) => {
        // Increase timeout for this test
        test.setTimeout(60000);

        // 0. Clean Setup
        await page.goto('/login');
        await page.context().clearCookies();
        await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
        });
        await page.reload();

        // 1. Login
        console.log('[Test] Performing auth...');
        const devOptions = page.locator('summary', { hasText: 'Developer Options' });
        await expect(devOptions).toBeVisible();
        await devOptions.click();
        await page.fill('#test-email', 'test-admin@greenbird.com');
        await page.fill('#test-password', 'password123!');
        await page.click('button:has-text("Test Login")');
        await expect(page).toHaveURL(/\/admin/, { timeout: 30000 });

        // 2. Go to Inventory
        await page.goto('/admin/inventory');

        // 3. Create a temp product to edit (safer than editing random existing ones)
        await page.click('a[href="/admin/inventory/add"]');
        await page.waitForSelector('input[name="name"]');

        const tempName = 'Test Persistence Product ' + Date.now();
        await page.fill('input[name="name"]', tempName);
        await page.selectOption('select[name="categoryId"]', { index: 1 });
        await page.fill('input[name="currentPrice"]', '100');
        await page.locator('button:has-text("Save Product")').first().click();

        // Wait for inventory list and find our product
        await page.waitForURL('/admin/inventory');
        await page.reload(); // Ensure list is fresh

        // Find the row with our product name and click Edit
        // We might need to search if it's not on first page, but let's assume it is or use search
        await page.fill('input[placeholder*="Search"]', tempName);
        await page.waitForTimeout(1000); // Wait for search debounce

        // Click the product card button to open the details modal
        await page.locator('button', { hasText: tempName }).first().click();
        // Click the Edit Product link in the modal
        await page.click('a:has-text("Edit Product")');

        // 4. In Edit Mode
        await expect(page.locator('h1')).toContainText('Edit Product');

        // 5. Setup Network Listener for Firestore Write
        // This is tricky with Firestore SDK, but we can look for HTTP calls if it uses REST, 
        // OR we just rely on console logs we added in ProductForm
        page.on('console', msg => {
            const text = msg.text();
            if (text.includes('[ProductForm]') || text.includes('[ProductService]')) {
                console.log('[Browser Log] ' + text);
            }
        });

        const initialImages = await page.locator('.group.aspect-square').count();
        console.log('[Test] Initial images count: ' + initialImages);

        // 6. Upload Image
        // Use a valid public image file for test
        await page.setInputFiles('input[type="file"]', 'public/images/esewa_qr.jpg');

        // Wait for Cropper and click Done
        await page.click('button:has-text("Done")');

        // Wait for upload toast or UI update
        // The form shows "Uploading..." then the image.
        await expect(page.getByText('Image uploaded successfully')).toBeVisible({ timeout: 15000 });

        // Verify UI shows it BEFORE save
        await expect(page.locator('.group.aspect-square')).toHaveCount(initialImages + 1);
        console.log('[Test] Image uploaded and visible in UI. New count: ' + (initialImages + 1));

        // 7. Save
        console.log('[Test] Clicking Save...');
        await page.locator('button:has-text("Save Product")').first().click();

        // 8. Wait for redirect
        await page.waitForURL('/admin/inventory');
        console.log('[Test] Redirected to inventory.');

        // 9. Go back and Verify
        // Search again to find it
        await page.fill('input[placeholder*="Search"]', tempName);
        await page.waitForTimeout(1000);
        // Click the product card button to open the details modal
        await page.locator('button', { hasText: tempName }).first().click();
        // Click the Edit Product link in the modal
        await page.click('a:has-text("Edit Product")');

        await expect(page.locator('h1')).toContainText('Edit Product');

        // CHECK: Is the image there?
        await page.waitForSelector('.group.aspect-square', { state: 'visible', timeout: 5000 }).catch(() => { });
        const finalImages = await page.locator('.group.aspect-square').count();
        console.log('[Test] Final images count: ' + finalImages);

        expect(finalImages).toBe(initialImages + 1);
    });
});

