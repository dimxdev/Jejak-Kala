import { expect, test } from '@playwright/test';
import { STORAGE_KEY } from './helpers';

test.describe('Layar sambutan', () => {
  test('pemain baru memilih nama dan penjelajah, lalu tersimpan', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/mulai$/);
    await expect(page.getByRole('heading', { name: 'Selamat datang, penjelajah!' })).toBeVisible();

    // a name is required
    await page.getByRole('button', { name: 'Mulai petualangan' }).click();
    await expect(page.getByText('Tulis namamu dulu.')).toBeVisible();

    await page.getByLabel('Namamu').fill('  Dimas  ');
    await page.getByText('Penjelajah 2').click();
    await page.getByRole('button', { name: 'Mulai petualangan' }).click();

    await expect(page.getByRole('heading', { name: 'Peta Waktu', level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Ubah profil' })).toContainText('Dimas');

    // saved: a reload goes straight to the map
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Peta Waktu', level: 1 })).toBeVisible();
    const saved = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
    expect(JSON.parse(saved ?? '{}').state.profile).toEqual({ name: 'Dimas', traveler: 'b' });
  });

  test('nama yang terlalu panjang ditolak', async ({ page }) => {
    await page.goto('/mulai');
    await page.getByLabel('Namamu').fill('x'.repeat(24));
    await page.getByRole('button', { name: 'Mulai petualangan' }).click();
    await expect(page.getByText(/terlalu panjang/)).toBeVisible();
  });

  test('progres dari versi lama (tanpa profil) tidak hilang', async ({ page }) => {
    await page.addInitScript((key) => {
      if (localStorage.getItem(key) === null) {
        localStorage.setItem(
          key,
          JSON.stringify({
            state: { missionStars: { 'm1-banjir-nil': 3 }, completedChapters: [] },
            version: 1,
          }),
        );
      }
    }, STORAGE_KEY);

    await page.goto('/bab/mesir');
    await expect(page).toHaveURL(/\/mulai$/); // no profile yet
    await page.getByLabel('Namamu').fill('Sari');
    await page.getByRole('button', { name: 'Mulai petualangan' }).click();

    await page.goto('/bab/mesir');
    await expect(page.getByText('1 dari 6 misi selesai')).toBeVisible();
  });

  test('profil bisa diubah lewat chip pemain di header', async ({ page }) => {
    await page.addInitScript((key) => {
      if (localStorage.getItem(key) === null) {
        localStorage.setItem(
          key,
          JSON.stringify({
            state: {
              missionStars: {},
              completedChapters: [],
              codex: [],
              profile: { name: 'Sari', traveler: 'a' },
              mode: 'relaxed',
            },
            version: 2,
          }),
        );
      }
    }, STORAGE_KEY);
    await page.goto('/');
    await page.getByRole('link', { name: 'Ubah profil' }).click();
    await expect(page.getByLabel('Namamu')).toHaveValue('Sari');

    await page.getByLabel('Namamu').fill('Budi');
    await page.getByRole('button', { name: 'Simpan' }).click();
    await expect(page.getByRole('link', { name: 'Ubah profil' })).toContainText('Budi');
  });
});
