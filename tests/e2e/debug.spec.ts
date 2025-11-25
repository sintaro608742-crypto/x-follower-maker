import { test, expect } from '@playwright/test';

test('Debug: Full login flow with network capture', async ({ page }) => {
  const consoleLogs: string[] = [];
  const errors: string[] = [];
  const networkRequests: any[] = [];

  // Capture console messages
  page.on('console', msg => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
  });

  // Capture page errors
  page.on('pageerror', error => {
    errors.push(`Page error: ${error.message}`);
  });

  // Capture network requests
  page.on('request', request => {
    networkRequests.push({
      type: 'REQUEST',
      url: request.url(),
      method: request.method(),
    });
  });

  // Capture network responses
  page.on('response', response => {
    networkRequests.push({
      type: 'RESPONSE',
      url: response.url(),
      status: response.status(),
      ok: response.ok(),
    });
  });

  // Capture network failures
  page.on('requestfailed', request => {
    errors.push(`Request failed: ${request.url()} - ${request.failure()?.errorText}`);
  });

  // Navigate to login page
  console.log('===== Step 1: Navigate to login page =====');
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('input[name="email"]', { state: 'visible' });

  // Fill in login form
  console.log('===== Step 2: Fill login form =====');
  await page.fill('input[name="email"]', 'demo@example.com');
  await page.fill('input[name="password"]', 'demo123');

  // Click login button
  console.log('===== Step 3: Click login button =====');
  await page.click('button[type="submit"]');

  // Wait for navigation or error
  console.log('===== Step 4: Wait for response =====');
  await page.waitForTimeout(5000);

  // Check current URL
  const currentURL = page.url();
  console.log('Current URL:', currentURL);

  // Take screenshot
  await page.screenshot({ path: 'tests/temp/debug-login-after.png', fullPage: true });

  // Print all captured data
  console.log('\n===== Console Logs =====');
  consoleLogs.forEach(log => console.log(log));

  console.log('\n===== Errors =====');
  errors.forEach(err => console.log(err));

  console.log('\n===== Network Requests (last 20) =====');
  networkRequests.slice(-20).forEach(req => {
    if (req.type === 'REQUEST') {
      console.log(`→ ${req.method} ${req.url}`);
    } else {
      console.log(`← ${req.status} ${req.ok ? 'OK' : 'FAIL'} ${req.url}`);
    }
  });

  console.log('\n===== Test Complete =====');
  console.log('Expected URL: /dashboard');
  console.log('Actual URL:', currentURL);
  console.log('Success:', currentURL.includes('/dashboard'));
});
