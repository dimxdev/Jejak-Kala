import { expect, type Page, test } from '@playwright/test';
import { finishScene, seed } from './helpers';

const point = (page: Page, x: number, y: number) =>
  page.getByRole('button', { name: `Titik kolom ${x}, baris ${y}`, exact: true });

/** Opens mission 2 from the chapter page and plays the Lensa Waktu, the story and the mode choice. */
async function openMission(page: Page, mode: 'Santai' | 'Tantangan') {
  await page.goto('/bab/mesir');
  await page
    .getByRole('region', { name: 'Misi' })
    .getByRole('listitem')
    .filter({ hasText: 'Tali Para Penyurvei' })
    .getByRole('link', { name: 'Mainkan' })
    .click();
  await expect(page).toHaveURL(/\/misi\/m2-tali-penyurvei$/);
  await expect(page.getByTestId('year-roller')).toHaveText('± 1850 SM');
  await page.getByRole('button', { name: 'Lanjut' }).click();
  await finishScene(page);
  await page.getByRole('radio', { name: new RegExp(mode) }).click();
  await page.getByRole('button', { name: 'Mulai misi' }).click();
  await finishScene(page); // the scene before the stakes
}

async function setRightStakes(page: Page) {
  await point(page, 1, 4).click();
  await page.getByRole('button', { name: 'Periksa sudut siku' }).click();
  await expect(
    page.getByText(/Sudut siku! Sisi A–B, A–C, dan B–C pas 4, 3, dan 5 ruas\./),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Lanjut ke patok D' }).click();
  await point(page, 5, 4).click();
  await page.getByRole('button', { name: 'Periksa petak' }).click();
  await expect(page.getByText('Petak pulih! Persegi panjang 4 × 3 khet.')).toBeVisible();
  await page.getByRole('button', { name: 'Hitung luasnya' }).click();
  await finishScene(page);
}

async function answer(page: Page, label: string | RegExp, value: string) {
  await page.getByLabel(label).fill(value);
  await page.getByRole('button', { name: 'Periksa', exact: true }).click();
}

test.describe('Misi 2: Tali Para Penyurvei', () => {
  test('Santai: patok, luas, segitiga, dan lingkaran memberi 3 bintang dan entri Kodeks', async ({
    page,
  }) => {
    await seed(page);
    await openMission(page, 'Santai');

    // a wrong spot for C: the rope says why, and the mistake is counted
    await point(page, 3, 3).click();
    await expect(page.getByText(/A–C: ≈ 2,8 ruas/)).toBeVisible();
    await page.getByRole('button', { name: 'Periksa sudut siku' }).click();
    await expect(page.getByText('Belum tepat: ke-12 simpul harus terpakai pas.')).toBeVisible();

    // hints come one at a time
    await page.getByRole('button', { name: 'Petunjuk' }).click();
    await expect(page.getByText(/Jumlah panjang ketiga sisi segitiga/)).toBeVisible();
    await expect(page.getByText(/Cari titik C yang membuat AC 3 ruas/)).toHaveCount(0);

    await setRightStakes(page);

    // the area of the plot: 4 x 3
    await expect(page.getByRole('heading', { name: 'Berapa luas petak?' })).toBeVisible();
    await answer(page, 'Luas petak', 'dua belas');
    await expect(page.getByText('Tulis angkanya dulu.')).toBeVisible(); // not a mistake
    await answer(page, 'Luas petak', '12');
    await expect(page.getByText('Benar! 4 × 3 = 12 setat.')).toBeVisible();
    await page.getByRole('button', { name: 'Lanjut', exact: true }).click();
    await finishScene(page);

    // Rhind problem 51
    await answer(page, 'Luas segitiga', '20');
    await expect(page.getByText('Benar! ½ × 4 × 10 = 20 setat.')).toBeVisible();
    await page.getByRole('button', { name: 'Lanjut', exact: true }).click();
    await finishScene(page);

    // Rhind problem 50, step by step in Santai
    await answer(page, /Berapa 1\/9 dari diameter/, '1');
    await answer(page, /Berapa sisanya/, '8');
    await answer(page, /Berapa setat luasnya/, '64');
    await expect(page.getByText('Benar! 8 × 8 = 64 setat.')).toBeVisible();
    await expect(page.getByText(/π × \(4,5\)² ≈ 63,6 setat/)).toBeVisible();
    await expect(page.getByText(/hanya lebih besar sekitar 0,6%/)).toBeVisible();
    await page.getByRole('button', { name: 'Lanjut', exact: true }).click();

    // one mistake only: the clean run and the circle make three stars
    await expect(page.getByRole('img', { name: '3 dari 3 bintang' })).toBeVisible();
    await expect(page.getByText('Salah coba: 1')).toBeVisible();
    await page.getByRole('button', { name: 'Selesaikan misi' }).click();
    await finishScene(page);

    await expect(page.getByText('Misi selesai')).toBeVisible();
    await expect(page.getByRole('img', { name: '3 dari 3 bintang' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Luas lingkaran ala Mesir/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Penegang tali/ })).toBeVisible();
    await page.getByRole('link', { name: 'Buka Kodeks' }).click();
    await expect(page.getByText(/^6 dari \d+ entri ditemukan$/)).toBeVisible();
  });

  test('Lihat solusi muncul setelah tiga salah coba dan membatasi misi ke 1 bintang', async ({
    page,
  }) => {
    await seed(page);
    await openMission(page, 'Santai');

    // checking before any stake is set asks for one and is not a mistake
    await page.getByRole('button', { name: 'Periksa sudut siku' }).click();
    await expect(page.getByText('Pasang dulu patok C pada sebuah titik.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Lihat solusi' })).toHaveCount(0);

    await point(page, 3, 3).click();
    for (let i = 0; i < 3; i++) {
      await page.getByRole('button', { name: 'Periksa sudut siku' }).click();
    }
    await page.getByRole('button', { name: 'Lihat solusi' }).click();
    await expect(page.getByText('Solusi ditampilkan. Misi ini dihitung 1 bintang.')).toBeVisible();
    await page.getByRole('button', { name: 'Lanjut ke patok D' }).click();

    await point(page, 5, 4).click();
    await page.getByRole('button', { name: 'Periksa petak' }).click();
    await page.getByRole('button', { name: 'Hitung luasnya' }).click();
    await finishScene(page);
    await answer(page, 'Luas petak', '12');
    await page.getByRole('button', { name: 'Lanjut', exact: true }).click();
    await finishScene(page);
    await answer(page, 'Luas segitiga', '20');
    await page.getByRole('button', { name: 'Lanjut', exact: true }).click();
    await finishScene(page);

    // the circle is optional
    await page.getByRole('button', { name: 'Lewati tantangan' }).click();
    await expect(page.getByRole('img', { name: '1 dari 3 bintang' })).toBeVisible();
    await expect(
      page.getByText('Solusi pernah ditampilkan, jadi misi dihitung 1 bintang.'),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Selesaikan misi' }).click();
    await finishScene(page);
    await expect(page.getByRole('heading', { name: 'Entri Kodeks baru' })).toBeVisible();
    // the circle entry is only for those who solved the challenge
    await expect(page.getByRole('link', { name: /Luas lingkaran ala Mesir/ })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /Setat/ })).toBeVisible();
  });

  test('Tantangan: tanpa petunjuk, lingkaran dijawab dalam satu langkah', async ({ page }) => {
    await seed(page, { mode: 'challenge' });
    await openMission(page, 'Tantangan');

    await expect(page.getByRole('button', { name: 'Petunjuk' })).toHaveCount(0);
    await setRightStakes(page);
    await answer(page, 'Luas petak', '12');
    await page.getByRole('button', { name: 'Lanjut', exact: true }).click();
    await finishScene(page);
    await answer(page, 'Luas segitiga', '20');
    await page.getByRole('button', { name: 'Lanjut', exact: true }).click();
    await finishScene(page);

    await expect(page.getByText(/kurangi diameter dengan 1\/9-nya/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Petunjuk' })).toHaveCount(0);
    await answer(page, 'Luas', '63,6'); // the modern value is not the Egyptian answer
    await expect(page.getByText('Belum tepat. Coba hitung lagi.')).toBeVisible();
    await answer(page, 'Luas', '64');
    await expect(page.getByText('Benar! 8 × 8 = 64 setat.')).toBeVisible();
    await page.getByRole('button', { name: 'Lanjut', exact: true }).click();
    await expect(page.getByRole('img', { name: '3 dari 3 bintang' })).toBeVisible();
  });
});
