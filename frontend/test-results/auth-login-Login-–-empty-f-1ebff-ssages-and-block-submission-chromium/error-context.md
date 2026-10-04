# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth\login.spec.ts >> Login – empty fields >> should show required-field messages and block submission
- Location: e2e\auth\login.spec.ts:62:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/auth/login
Call log:
  - navigating to "http://localhost:3000/auth/login", waiting until "load"

```

# Test source

```ts
  1   | /**
  2   |  * E2E tests – Authentication / Login
  3   |  *
  4   |  * Page under test : /auth/login
  5   |  * Component       : src/pages/Auth/Login.tsx + LoginModal.tsx
  6   |  *
  7   |  * Selectors used:
  8   |  *   #username            – Ant Design Form.Item name="username" sets id on child input
  9   |  *   #password            – Ant Design Input.Password inner <input id="password">
  10  |  *   button[type="submit"]– BoslerButton htmlType="submit"
  11  |  *   .ant-notification-notice-message – Ant Design notification title
  12  |  *   .ant-form-item-explain-error     – Ant Design inline validation message
  13  |  */
  14  | 
  15  | import { expect, test } from '@playwright/test';
  16  | import { expectLoginError, loginAs } from '../helpers/auth';
  17  | 
  18  | // ---------------------------------------------------------------------------
  19  | // Happy path
  20  | // ---------------------------------------------------------------------------
  21  | 
  22  | test.describe('Login – happy path', () => {
  23  |   test('should redirect to /portal/home after valid credentials', async ({ page }) => {
  24  |     await page.goto('/auth/login');
  25  | 
  26  |     await page.locator('#username').fill(process.env.TEST_USER ?? 'admin');
  27  |     await page.locator('#password').fill(process.env.TEST_PASSWORD ?? 'admin');
  28  |     await page.locator('button[type="submit"]').click();
  29  | 
  30  |     await page.waitForURL('**/portal/home', { timeout: 15000 });
  31  |     await expect(page).toHaveURL(/\/portal\/home/);
  32  |   });
  33  | });
  34  | 
  35  | // ---------------------------------------------------------------------------
  36  | // Error path – wrong password
  37  | // ---------------------------------------------------------------------------
  38  | 
  39  | test.describe('Login – wrong credentials', () => {
  40  |   test('should show "Login Error" notification for bad password', async ({ page }) => {
  41  |     await page.goto('/auth/login');
  42  | 
  43  |     await page.locator('#username').fill(process.env.TEST_USER ?? 'admin');
  44  |     // Deliberately use an invalid password
  45  |     await page.locator('#password').fill('__invalid_password__');
  46  |     await page.locator('button[type="submit"]').click();
  47  | 
  48  |     // The Login component calls openNotification("Login Error", ...) on error.
  49  |     // Ant Design 5 renders the notification title inside .ant-notification-notice-message.
  50  |     await expectLoginError(page);
  51  | 
  52  |     // Must remain on the login page
  53  |     await expect(page).toHaveURL(/\/auth\/login/);
  54  |   });
  55  | });
  56  | 
  57  | // ---------------------------------------------------------------------------
  58  | // Validation – empty fields
  59  | // ---------------------------------------------------------------------------
  60  | 
  61  | test.describe('Login – empty fields', () => {
  62  |   test('should show required-field messages and block submission', async ({ page }) => {
> 63  |     await page.goto('/auth/login');
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/auth/login
  64  | 
  65  |     // Click submit without filling any field
  66  |     await page.locator('button[type="submit"]').click();
  67  | 
  68  |     // Ant Design Form validates and renders .ant-form-item-explain-error elements.
  69  |     // Rules from LoginModal.tsx:
  70  |     //   username: "Please input your username!"
  71  |     //   password: "Please input your password!"
  72  |     await expect(
  73  |       page.locator('.ant-form-item-explain-error', {
  74  |         hasText: 'Please input your username!',
  75  |       }),
  76  |     ).toBeVisible({ timeout: 5000 });
  77  | 
  78  |     await expect(
  79  |       page.locator('.ant-form-item-explain-error', {
  80  |         hasText: 'Please input your password!',
  81  |       }),
  82  |     ).toBeVisible({ timeout: 5000 });
  83  | 
  84  |     // Should stay on the login page (no redirect)
  85  |     await expect(page).toHaveURL(/\/auth\/login/);
  86  |   });
  87  | 
  88  |   test('should show username validation when only password is filled', async ({ page }) => {
  89  |     await page.goto('/auth/login');
  90  | 
  91  |     await page.locator('#password').fill('somepassword');
  92  |     await page.locator('button[type="submit"]').click();
  93  | 
  94  |     await expect(
  95  |       page.locator('.ant-form-item-explain-error', {
  96  |         hasText: 'Please input your username!',
  97  |       }),
  98  |     ).toBeVisible({ timeout: 5000 });
  99  | 
  100 |     await expect(page).toHaveURL(/\/auth\/login/);
  101 |   });
  102 | });
  103 | 
  104 | // ---------------------------------------------------------------------------
  105 | // Already authenticated
  106 | // ---------------------------------------------------------------------------
  107 | 
  108 | test.describe('Login – already authenticated', () => {
  109 |   test('should redirect to /portal/home when a valid token is already set', async ({
  110 |     page,
  111 |   }) => {
  112 |     // First login to obtain a valid session token stored in localStorage.
  113 |     await loginAs(page);
  114 |     await expect(page).toHaveURL(/\/portal\/home/);
  115 | 
  116 |     // Now navigate to the login page; Login.tsx reads tokenStatus from Redux
  117 |     // and calls navigate("/portal/home") when isTokenValid === true.
  118 |     await page.goto('/auth/login');
  119 | 
  120 |     await page.waitForURL('**/portal/home', { timeout: 10000 });
  121 |     await expect(page).toHaveURL(/\/portal\/home/);
  122 |   });
  123 | });
  124 | 
```