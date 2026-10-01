import { expect, type Page, test } from '@playwright/test';
import { finishScene, seed } from './helpers';

/** Opens mission 4 from the chapter page and plays the Lensa Waktu, the story and the mode choice. */
async function openMission(page: Page, mode: 'Santai' | 'Tantangan') {
  await page.goto('/bab/mesir');
  await page
    .getByRole('region', { name: 'Misi' })
    .getByRole('listitem')
    .filter({ hasText: 'Lereng Sempurna' })
    .getByRole('link', { name: 'Mainkan' })
    .click();
  await expect(page).toHaveURL(/\/misi\/m4-lereng-sempurna$/);
  await expect(page.getByTestId('year-roller')).toHaveText('± 2560 SM');
  await page.getByRole('button', { name: 'Lanjut' }).click();
  await finishScene(page);
  await page.getByRole('radio', { name: new RegExp(mode) }).click();
  await page.getByRole('button', { name: 'Mulai misi' }).click();
}

const gaugeReading = (page: Page) => page.getByTestId('gauge-reading');

/** The gauge starts at 6 palms: this moves it by whole fingers (a quarter of a palm each). */
async function moveGauge(page: Page, fingers: number) {
  const button = page.getByRole('button', {
    name: fingers > 0 ? 'Tambah satu jari' : 'Kurangi satu jari',
  });
  for (let i = 0; i < Math.abs(fingers); i++) await button.click();
}

async function openGate(page: Page, n: number) {
  await finishScene(page); // the story before the gate
  await expect(page.getByRole('dialog', { name: `Gerbang Ukur ${n}` })).toBeVisible();
}

async function solve(page: Page, fingers: number, reading: string) {
  await moveGauge(page, fingers);
  await expect(gaugeReading(page)).toHaveText(reading);
  await page.getByRole('button', { name: 'Periksa', exact: true }).click();
  await expect(page.getByText('Benar! Gerbang terbuka.')).toBeVisible();
  await page.getByRole('button', { name: 'Lanjutkan mendaki' }).click();
}

test.describe('Misi 4: Lereng Sempurna (rute hitung tanpa aksi)', () => {
  test('Santai: tiga gerbang dengan seked yang benar memberi 2 bintang dan entri Kodeks', async ({
    page,
  }) => {
    await seed(page);
    await openMission(page, 'Santai');

    // gate 1: the model pyramid, 28 x 14 cubits, seked 7 palms
    await openGate(page, 1);
    await expect(page.getByText('Alas 28 hasta, tinggi 14 hasta.')).toBeVisible();
    await expect(gaugeReading(page)).toHaveText('6 telapak');
    // Santai draws the trial face and says how far it misses the corner
    await expect(page.getByText(/terlalu curam/)).toBeVisible();
    await moveGauge(page, 4);
    await expect(page.getByText('Pas! Sisi miring jatuh tepat di sudut alas.')).toBeVisible();
    await page.getByRole('button', { name: 'Periksa', exact: true }).click();
    await expect(page.getByText('Benar! Gerbang terbuka.')).toBeVisible();
    await expect(page.getByText(/tepat 45°/)).toBeVisible();
    await page.getByRole('button', { name: 'Lanjutkan mendaki' }).click();

    // gate 2: Rhind problem 56, 360 x 250 cubits, 5 1/25 palms read as 5 palms
    await openGate(page, 2);
    await expect(page.getByText('Soal Papirus Rhind')).toBeVisible();
    await moveGauge(page, -4);
    await expect(gaugeReading(page)).toHaveText('5 telapak');
    await page.getByRole('button', { name: 'Periksa', exact: true }).click();
    await expect(page.getByText(/5 1\/25 telapak/).first()).toBeVisible();
    await page.getByRole('button', { name: 'Lanjutkan mendaki' }).click();

    // gate 3: the Great Pyramid, 440 x 280 cubits, 5 1/2 palms
    await openGate(page, 3);
    await solve(page, -2, '5 telapak 2 jari');

    // the summit, then the summary: a clean run is the second star, the rods need the climb
    await finishScene(page);
    await expect(page.getByRole('heading', { name: 'Puncak tercapai' })).toBeVisible();
    await expect(page.getByRole('img', { name: '2 dari 3 bintang' })).toBeVisible();
    await expect(page.getByText('Salah coba di gerbang: 0')).toBeVisible();
    await expect(page.getByText('Hitungan bersih: bintang kedua.')).toBeVisible();
    await page.getByRole('button', { name: 'Selesaikan misi' }).click();
    await finishScene(page);

    await expect(page.getByText('Misi selesai')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Entri Kodeks baru' })).toBeVisible();
    for (const title of [/Seked/, /Piramida Agung/, /Hemiunu/, /Piramida Bengkok/]) {
      await expect(page.getByRole('link', { name: title }).first()).toBeVisible();
    }
    // the golden rods belong to the climb: no bonus entry on this route
    await expect(page.getByRole('link', { name: /Tongkat hasta kerajaan/ })).toHaveCount(0);
  });

  test('Santai: petunjuk muncul satu per satu, dan Lihat solusi muncul setelah tiga salah coba', async ({
    page,
  }) => {
    await seed(page);
    await openMission(page, 'Santai');
    await openGate(page, 1);

    await page.getByRole('button', { name: 'Petunjuk' }).click();
    await expect(page.getByText(/Seked adalah berapa telapak sisi bergeser/).first()).toBeVisible();
    await expect(page.getByText(/Pakai setengah alas, yaitu jarak/)).toHaveCount(0);

    await expect(page.getByRole('button', { name: 'Lihat solusi' })).toHaveCount(0);
    for (let i = 0; i < 3; i++) {
      await page.getByRole('button', { name: 'Periksa', exact: true }).click();
    }
    await expect(page.getByText('Belum tepat. Hitung lagi.')).toBeVisible();
    await page.getByRole('button', { name: 'Lihat solusi' }).click();
    await expect(page.getByText('Solusi ditampilkan. Misi ini dihitung 1 bintang.')).toBeVisible();
    await expect(gaugeReading(page)).toHaveText('7 telapak');
    await page.getByRole('button', { name: 'Lanjutkan mendaki' }).click();

    await openGate(page, 2);
    await solve(page, -4, '5 telapak');
    await openGate(page, 3);
    await solve(page, -2, '5 telapak 2 jari');
    await finishScene(page);

    await expect(page.getByRole('img', { name: '1 dari 3 bintang' })).toBeVisible();
    await expect(
      page.getByText('Solusi pernah ditampilkan, jadi misi dihitung 1 bintang.'),
    ).toBeVisible();
  });

  test('Tantangan: tanpa gambar sisi percobaan dan tanpa petunjuk', async ({ page }) => {
    await seed(page, { mode: 'challenge' });
    await openMission(page, 'Tantangan');
    await openGate(page, 1);

    await expect(page.getByRole('button', { name: 'Petunjuk' })).toHaveCount(0);
    await expect(page.getByText(/terlalu curam|terlalu landai/)).toHaveCount(0);
    await page.getByRole('button', { name: 'Periksa', exact: true }).click();
    await expect(page.getByText('Belum tepat. Hitung lagi.')).toBeVisible();
    await moveGauge(page, 4);
    await page.getByRole('button', { name: 'Periksa', exact: true }).click();
    await expect(page.getByText('Benar! Gerbang terbuka.')).toBeVisible();
  });

  test('alat ukur bisa digeser dengan slider dan berhenti di ujungnya', async ({ page }) => {
    await seed(page);
    await openMission(page, 'Santai');
    await openGate(page, 1);

    const slider = page.getByRole('slider', { name: 'Alat ukur seked' });
    await slider.fill('7.25');
    await expect(gaugeReading(page)).toHaveText('7 telapak 1 jari');
    await slider.fill('9');
    await expect(gaugeReading(page)).toHaveText('9 telapak');
    await expect(page.getByRole('button', { name: 'Tambah satu jari' })).toBeDisabled();
    await slider.fill('3');
    await expect(page.getByRole('button', { name: 'Kurangi satu jari' })).toBeDisabled();
  });
});
