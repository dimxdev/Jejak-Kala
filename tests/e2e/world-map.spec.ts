import { expect, test } from '@playwright/test';
import { seed } from './helpers';

test.describe('Peta Waktu', () => {
  test('menampilkan Mesir Kuno lengkap dengan rentang tahunnya', async ({ page }) => {
    await seed(page);
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Peta Waktu', level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: /Mesir Kuno, ± 3100 – 30 SM/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Penggaris waktu: Mesir Kuno/ })).toBeVisible();
  });

  test('membuka bab dan memperlihatkan tahun setiap misi', async ({ page }) => {
    await seed(page);
    await page.goto('/');
    await page.getByRole('link', { name: 'Masuk' }).click();

    await expect(page).toHaveURL(/\/bab\/mesir$/);
    await expect(page.getByRole('heading', { name: 'Mesir Kuno', level: 1 })).toBeVisible();
    await expect(page.getByText('0 dari 6 misi selesai')).toBeVisible();
    await expect(page.getByRole('heading', { level: 3 })).toHaveCount(6);

    // the year of each mission is always visible: on its card and on the chapter timeline
    const card = page
      .getByRole('region', { name: 'Misi' })
      .getByRole('listitem')
      .filter({ hasText: 'Suara dari Batu' });
    await expect(card.getByText('196 SM → 1822 M')).toBeVisible();
    const timeline = page.getByRole('region', { name: 'Garis waktu bab' });
    await expect(timeline.getByText('196 SM → 1822 M')).toBeVisible();
    await expect(timeline.getByText('Di luar waktu')).toBeVisible();

    // the exam stays locked until all six missions are finished
    await expect(page.getByText('Selesaikan 6 misi untuk membuka ujian (0/6).')).toBeVisible();
  });

  test('setiap misi bisa dimainkan atau bertanda "segera hadir"', async ({ page }) => {
    await seed(page);
    await page.goto('/bab/mesir');

    // which missions are built keeps changing; each mission's own spec proves that it plays
    const missions = page.getByRole('region', { name: 'Misi' }).getByRole('listitem');
    await expect(missions).toHaveCount(6);
    for (const card of await missions.all()) {
      // a locator that matched both would fail strict mode, so exactly one of the two is shown
      await expect(
        card.getByRole('link', { name: 'Mainkan' }).or(card.getByText('Segera hadir')),
      ).toBeVisible();
    }
  });

  test('membuka ujian setelah keenam misi selesai (progres tersimpan)', async ({ page }) => {
    const missions = [
      'm1-banjir-nil',
      'm2-tali-penyurvei',
      'm3-roti-dan-bir',
      'm4-lereng-sempurna',
      'm5-suara-dari-batu',
      'm6-pelayaran-ke-punt',
    ];
    await seed(page, { missionStars: Object.fromEntries(missions.map((id) => [id, 2])) });
    await page.goto('/bab/mesir');

    await expect(page.getByText('6 dari 6 misi selesai')).toBeVisible();
    await expect(page.getByText('Ujian terbuka.')).toBeVisible();
  });

  test('alamat yang tidak ada menampilkan halaman tidak ditemukan', async ({ page }) => {
    await seed(page);
    await page.goto('/tidak-ada');
    await expect(page.getByRole('heading', { name: 'Halaman tidak ditemukan' })).toBeVisible();
  });
});
