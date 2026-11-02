import { test, expect } from '@playwright/test';
test('loads the monitoring dashboard', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Pulseboard').first()).toBeVisible();
});
