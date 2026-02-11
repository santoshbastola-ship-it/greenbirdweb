import { test, expect } from '@playwright/test';

test.describe('Admin User Flows', () => {

    test('Admin login page loads', async ({ page }) => {
        // Try to access the admin dashboard directly
        await page.goto('/admin');

        // Should be redirected to login if not authenticated
        // OR if /admin is just a dashboard that redirects, we expect to end up on /login or /admin/login
        // Based on previous analysis, login is at /login or handled there.
        // Let's verify we see a login form or "Sign in with Google"

        // We expect either to be on the login page or see login elements
        // Use precise locator for the button to avoid ambiguity
        await expect(page.getByRole('button', { name: 'Sign in with Google' })).toBeVisible();
    });

    test('Stock update page requires auth', async ({ page }) => {
        await page.goto('/admin/stock-update');
        // Should redirect to login or show forbidden
        await expect(page).toHaveURL(/login/);
        await expect(page.getByRole('button', { name: 'Sign in with Google' })).toBeVisible();
    });

    test('Orders page requires auth', async ({ page }) => {
        await page.goto('/admin/orders');
        await expect(page).toHaveURL(/login/);
        await expect(page.getByRole('button', { name: 'Sign in with Google' })).toBeVisible();
    });

});
