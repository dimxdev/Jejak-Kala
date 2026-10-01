import { expect, test } from '@playwright/test';
import { seed } from './helpers';

test.describe('Kodeks', () => {
  test('menampilkan entri yang sudah ditemukan dan menyembunyikan sisanya', async ({ page }) => {
    await seed(page, { codex: ['mesir/tiga-musim', 'mesir/nilometer'] });
    await page.goto('/kodeks');

    await expect(page.getByRole('heading', { name: 'Kodeks', level: 1 })).toBeVisible();
    // the total grows with every mission, so everything that is not found must simply show as locked
    const progress = page.getByText(/^2 dari \d+ entri ditemukan$/);
    await expect(progress).toBeVisible();
    const total = Number((await progress.textContent())?.match(/dari (\d+)/)?.[1]);
    await expect(page.getByText('Belum ditemukan')).toHaveCount(total - 2);
    await expect(page.getByRole('link', { name: /Nilometer/ })).toBeVisible();
    // a locked entry never gives away its title
    await expect(page.getByText('Siklus Sothis')).toHaveCount(0);
  });

  test('entri memperlihatkan label kredibilitas, lapisan Dalam, dan sumber', async ({ page }) => {
    await seed(page, { codex: ['mesir/nilometer'] });
    await page.goto('/kodeks');
    await page.getByRole('link', { name: /Nilometer/ }).click();

    await expect(page).toHaveURL(/\/kodeks\/mesir\/nilometer$/);
    await expect(page.getByRole('heading', { name: 'Nilometer', level: 1 })).toBeVisible();
    await expect(page.getByText('Terbukti', { exact: true }).first()).toBeVisible();
    await expect(page.getByText(/masih menunggu pengecekan/)).toBeVisible();

    const deep = page.locator('details');
    await expect(deep.getByRole('link', { name: /Nilometer \(Wikipedia\)/ })).toBeHidden();
    await deep.getByText('Dalam: sumber dan perdebatan').click();
    const source = deep.getByRole('link', { name: /Nilometer \(Wikipedia\)/ });
    await expect(source).toBeVisible();
    await expect(source).toHaveAttribute('href', 'https://en.wikipedia.org/wiki/Nilometer');

    // related entries that are still locked are shown as locked
    await expect(page.getByText('Terkait')).toBeVisible();
    await expect(page.getByText('Belum ditemukan').first()).toBeVisible();
  });

  test('entri yang belum ditemukan tidak bisa dibuka lewat alamatnya', async ({ page }) => {
    await seed(page);
    await page.goto('/kodeks/mesir/siklus-sothis');
    await expect(page.getByText('Belum ditemukan')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Siklus Sothis' })).toHaveCount(0);
  });

  test('entri yang tidak ada menampilkan pesan', async ({ page }) => {
    await seed(page);
    await page.goto('/kodeks/mesir/tidak-ada');
    await expect(page.getByText('Entri tidak ditemukan.')).toBeVisible();
  });
});
