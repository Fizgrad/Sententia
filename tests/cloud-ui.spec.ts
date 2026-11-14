import { expect, test, type Page } from '@playwright/test';

async function openCloudPanel(page: Page) {
  await page.goto('./');
  await expect(page.getByRole('combobox', { name: '学习词汇难度', exact: true })).toBeVisible();
  const profile = page.getByRole('button', { name: /终身学习，始于一句/ });
  const menu = page.getByRole('button', { name: '打开导航', exact: true });
  const closeMenu = page.getByRole('button', { name: '关闭导航', exact: true });
  if (await menu.isVisible() && !await closeMenu.isVisible()) await menu.click();
  await profile.click();
  const dialog = page.getByRole('dialog', { name: '阅读偏好', exact: true });
  await dialog.getByRole('tab', { name: '数据与备份', exact: true }).click();
  const apiUrl = dialog.getByLabel('同步服务地址', { exact: true });
  if (!await apiUrl.isVisible()) await dialog.locator('.cloud-connection summary').click();
  await apiUrl.fill('https://progress.example.test');
  return dialog;
}

test('registration and login preserve a valid supplementary-character password typed into Chrome', async ({ page }) => {
  const password = '🔐'.repeat(90);
  const credentials: { operation: string; password: string }[] = [];
  await page.route('**/api/v1/**', async route => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/auth/config')) return route.fulfill({ json: { registrationMode: 'open' } });
    if (path.endsWith('/auth/logout')) return route.fulfill({ status: 204 });
    if (path.endsWith('/auth/register') || path.endsWith('/auth/login')) {
      const body = route.request().postDataJSON() as { password: string };
      credentials.push({ operation: path.endsWith('/auth/register') ? 'register' : 'login', password: body.password });
      return route.fulfill({ status: path.endsWith('/auth/register') ? 201 : 200, json: { token: 'z'.repeat(43), expiresAt: new Date(Date.now() + 86_400_000).toISOString(), user: { id: 'unicode-account', username: 'unicode-reader' } } });
    }
    if (path.endsWith('/state')) return route.fulfill({ json: { revision: 0, data: null, updatedAt: null } });
    return route.fulfill({ status: 404 });
  });
  const dialog = await openCloudPanel(page);
  await dialog.getByRole('button', { name: '创建账号', exact: true }).click();
  await dialog.getByLabel('同步账号', { exact: true }).fill('unicode-reader');
  for (const label of ['同步密码', '再次输入同步密码']) {
    const input = dialog.getByLabel(label, { exact: true });
    await input.click();
    await page.keyboard.insertText(password);
    await expect(input).toHaveValue(password);
  }
  await dialog.getByRole('button', { name: '创建账号并登录', exact: true }).click();
  await expect(dialog.locator('.cloud-account')).toContainText('unicode-reader');
  expect(credentials).toEqual([{ operation: 'register', password }]);
  await dialog.getByRole('button', { name: '退出账号', exact: true }).click();
  const login = dialog.getByLabel('同步密码', { exact: true });
  await login.click();
  await page.keyboard.insertText(password);
  await expect(login).toHaveValue(password);
  await dialog.getByRole('button', { name: '登录并查看进度', exact: true }).click();
  await expect(dialog.locator('.cloud-account')).toContainText('unicode-reader');
  expect(credentials).toEqual([{ operation: 'register', password }, { operation: 'login', password }]);
});

test('registration rejects 129 code points even though the native input can hold them', async ({ page }) => {
  let registrations = 0;
  await page.route('**/api/v1/**', async route => {
    if (new URL(route.request().url()).pathname.endsWith('/auth/config')) return route.fulfill({ json: { registrationMode: 'open' } });
    registrations++;
    return route.fulfill({ status: 500 });
  });
  const dialog = await openCloudPanel(page);
  await dialog.getByRole('button', { name: '创建账号', exact: true }).click();
  await dialog.getByLabel('同步账号', { exact: true }).fill('unicode-reader');
  for (const label of ['同步密码', '再次输入同步密码']) {
    const input = dialog.getByLabel(label, { exact: true });
    await input.click();
    await page.keyboard.insertText('x'.repeat(129));
    await expect(input).toHaveValue('x'.repeat(129));
  }
  await dialog.getByRole('button', { name: '创建账号并登录', exact: true }).click();
  await expect(dialog.locator('.cloud-sync-error')).toContainText('12–128');
  expect(registrations).toBe(0);
});
