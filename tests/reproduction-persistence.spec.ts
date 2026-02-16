
import { test, expect } from '@playwright/test';

test.describe('Image Persistence Reproduction', () => {
    test('should persist new image when editing existing product', async ({ page }) => {
        // Increase timeout for this test
        test.setTimeout(60000);

        // 1. Login
        // 1. Try going directly to inventory
        await page.goto('/admin/inventory');

        // If redirected to login, perform login
        if (page.url().includes('/login')) {
            console.log('[Test] Redirected to login, performing auth...');
            await page.waitForSelector('input[type="email"]');
            await page.fill('input[type="email"]', 'admin@example.com');
            await page.fill('input[type="password"]', 'admin123');
            await page.click('button:has-text("Sign In"), button:has-text("Login")');
            await page.waitForURL(/\/admin/);
        } else {
            console.log('[Test] Already logged in.');
        }

        // 2. Go to Inventory
        await page.goto('/admin/inventory');

        // 3. Create a temp product to edit (safer than editing random existing ones)
        await page.click('a[href="/admin/inventory/new"]');
        await page.waitForSelector('input[name="name"]');

        const tempName = 'Test Persistence Product ' + Date.now();
        await page.fill('input[name="name"]', tempName);
        await page.selectOption('select[name="categoryId"]', { index: 1 });
        await page.fill('input[name="currentPrice"]', '100');
        await page.click('button:has-text("Save Product")');

        // Wait for inventory list and find our product
        await page.waitForURL('/admin/inventory');
        await page.reload(); // Ensure list is fresh

        // Find the row with our product name and click Edit
        // We might need to search if it's not on first page, but let's assume it is or use search
        await page.fill('input[placeholder*="Search"]', tempName);
        await page.waitForTimeout(1000); // Wait for search debounce

        // Click the first edit link found (should be ours)
        await page.click('a[href^="/admin/inventory/edit"]');

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
        // Use a dummy file for test
        await page.setInputFiles('input[type="file"]', 'tests/fixtures/test-image.jpg');

        // Wait for upload toast or UI update
        // The form shows "Uploading..." then the image.
        await expect(page.getByText('Successfully uploaded')).toBeVisible({ timeout: 15000 });

        // Verify UI shows it BEFORE save
        await expect(page.locator('.group.aspect-square')).toHaveCount(initialImages + 1);
        console.log('[Test] Image uploaded and visible in UI. New count: ' + (initialImages + 1));

        // 7. Save
        console.log('[Test] Clicking Save...');
        await page.click('button:has-text("Save Product")');

        // 8. Wait for redirect
        await page.waitForURL('/admin/inventory');
        console.log('[Test] Redirected to inventory.');

        // 9. Go back and Verify
        // Search again to find it
        await page.fill('input[placeholder*="Search"]', tempName);
        await page.waitForTimeout(1000);
        await page.click('a[href^="/admin/inventory/edit"]');

        await expect(page.locator('h1')).toContainText('Edit Product');

        // CHECK: Is the image there?
        await page.waitForSelector('.group.aspect-square', { state: 'visible', timeout: 5000 }).catch(() => { });
        const finalImages = await page.locator('.group.aspect-square').count();
        console.log('[Test] Final images count: ' + finalImages);

        expect(finalImages).toBe(initialImages + 1);
    });
});

