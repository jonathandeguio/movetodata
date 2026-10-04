# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: portal\home.spec.ts >> Portal – Home page >> should show the notification bell in the sidebar
- Location: e2e\portal\home.spec.ts:132:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/auth/login
Call log:
  - navigating to "http://localhost:3000/auth/login", waiting until "load"

```

# Test source

```ts
  1  | import { expect, Page } from '@playwright/test';
  2  | 
  3  | /**
  4  |  * Logs in a user via the /auth/login page and waits for the portal home redirect.
  5  |  *
  6  |  * Credentials are resolved in the following order:
  7  |  *   1. Arguments passed directly to this function
  8  |  *   2. TEST_USER / TEST_PASSWORD environment variables
  9  |  *   3. Hardcoded development defaults ('admin' / 'admin')
  10 |  */
  11 | export async function loginAs(
  12 |   page: Page,
  13 |   user: string = process.env.TEST_USER ?? 'admin',
  14 |   password: string = process.env.TEST_PASSWORD ?? 'admin',
  15 | ): Promise<void> {
> 16 |   await page.goto('/auth/login');
     |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/auth/login
  17 | 
  18 |   // Ant Design Form.Item with name="username" sets id="username" on the child input.
  19 |   await page.locator('#username').fill(user);
  20 | 
  21 |   // Ant Design Input.Password renders <input id="password" type="password" /> inside
  22 |   // a wrapper span – #password targets the inner input directly.
  23 |   await page.locator('#password').fill(password);
  24 | 
  25 |   await page.locator('button[type="submit"]').click();
  26 | 
  27 |   // After a successful login the app redirects to /portal/home.
  28 |   await page.waitForURL('**/portal/home', { timeout: 15000 });
  29 | }
  30 | 
  31 | /**
  32 |  * Returns true when the Ant Design "Login Error" notification is visible.
  33 |  * The notification is rendered with .ant-notification-notice-message as the title.
  34 |  */
  35 | export async function expectLoginError(page: Page): Promise<void> {
  36 |   await expect(
  37 |     page.locator('.ant-notification-notice-message', { hasText: 'Login Error' }),
  38 |   ).toBeVisible({ timeout: 10000 });
  39 | }
  40 | 
```