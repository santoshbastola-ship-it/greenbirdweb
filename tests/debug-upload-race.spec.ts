
import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Debug Upload Race Condition', () => {
    test.setTimeout(60000);

    test('should populate images correctly on immediate save', async ({ page }) => {
        // 1. Login
        await page.goto('/login');
        const devOptions = page.locator('summary', { hasText: 'Developer Options' });
        await expect(devOptions).toBeVisible();
        await devOptions.click();
        await page.fill('#test-email', 'test-admin@greenbird.com');
        await page.fill('#test-password', 'password123!');
        await page.click('button:has-text("Test Login")');
        await expect(page).toHaveURL(/\/admin/, { timeout: 30000 });

        // 2. Go to New Product
        await page.goto('/admin/inventory/add');

        // 3. Fill basic info
        await page.fill('input[name="name"]', 'Debug Upload Product ' + Date.now());
        await page.fill('textarea[name="description"]', 'Test Description');
        await page.selectOption('select[name="categoryId"]', { index: 1 }); // Select first available
        await page.fill('input[name="currentPrice"]', '100');

        // 4. Input File
        const fileInput = page.locator('input[type="file"]');
        // Upload a valid image file for test
        await fileInput.setInputFiles('public/images/esewa_qr.jpg');

        // Wait for Cropper and click Done
        await page.click('button:has-text("Done")');

        // 5. Wait for upload to trigger/complete
        // The button should be disabled while uploading
        const saveBtn = page.locator('button:has-text("Save Product")').first();
        await expect(saveBtn).toBeEnabled({ timeout: 15000 });

        // 6. Click Save IMMEDIATELY after it becomes enabled
        console.log("Save button enabled, clicking immediately...");

        // Capture console logs
        page.on('console', msg => {
            if (msg.text().includes('[ProductForm]')) {
                console.log(`BROWSER: ${msg.text()}`);
            }
        });

        await saveBtn.click();

        // 7. Verify Success Toast
        await expect(page.locator('text=Product created successfully')).toBeVisible();

        // 8. Verify we are redirected
        await expect(page).toHaveURL(/\/admin\/inventory/);
    });
});
