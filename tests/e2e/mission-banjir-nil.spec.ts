import { expect, type Page, test } from '@playwright/test';
import { finishScene, seed } from './helpers';

const PLOTS = ['Tepi sungai', 'Lahan rendah', 'Lahan tengah', 'Dekat desa'] as const;

/** Opens the mission and plays everything up to the start of the game (Lensa Waktu, story, mode). */
async function openMission(page: Page, mode: 'Santai' | 'Tantangan') {
  await page.goto('/bab/mesir');
  await page.getByRole('link', { name: 'Mainkan' }).first().click();
  await expect(page).toHaveURL(/\/bab\/mesir\/misi\/m1-banjir-nil$/);

  // Lensa Waktu: the year rolls to where the mission happens
  await expect(page.getByText('Lensa Waktu')).toBeVisible();
  await expect(page.getByTestId('year-roller')).toHaveText('± 2500 SM');
  await page.getByRole('button', { name: 'Lanjut' }).click();

  await finishScene(page); // the story before the mission
  await expect(page.getByRole('heading', { name: 'Pilih cara bermain' })).toBeVisible();
  await page.getByRole('radio', { name: new RegExp(mode) }).click();
  await page.getByRole('button', { name: 'Mulai misi' }).click();
}

/** Akhet: the scene, then the reading of the Nilometer at the given mark. */
async function readNilometer(page: Page, mark: number) {
  await finishScene(page);
  await expect(page.getByRole('heading', { name: 'Baca Nilometer' })).toBeVisible();
  await page.getByRole('button', { name: `Tanda ${mark} hasta` }).click();
  await expect(page.getByText(`Tepat! Banjir tahun ini ${mark} hasta.`)).toBeVisible();
  await page.getByRole('button', { name: 'Lanjut' }).click();
}

async function sow(page: Page, plot: string, seeds: number) {
  for (let i = 0; i < seeds; i++) {
    await page.getByRole('button', { name: `Tambah benih di ${plot}` }).click();
  }
}

test.describe('Misi 1: Tahun Pertama, Banjir Nil', () => {
  test('Santai: rencana sendiri menghasilkan 3 bintang, bonus kuis, dan entri Kodeks', async ({
    page,
  }) => {
    await seed(page);
    await openMission(page, 'Santai');
    await readNilometer(page, 14);

    // the flood and the plots it reaches
    await expect(page.getByRole('heading', { name: 'Banjir 14 hasta' })).toBeVisible();
    await expect(page.getByText('Tahun ini: Lumayan')).toBeVisible();
    await expect(page.getByText('Banjir 14 hasta menjangkau 3 dari 6 ladang.')).toBeVisible();
    await page.getByRole('button', { name: 'Mulai musim tanam' }).click();

    // Peret: seeds on the four best plots, a channel on the fourth (one hasta short without it)
    await finishScene(page);
    await expect(page.getByRole('heading', { name: 'Rencana tanam' })).toBeVisible();
    await expect(page.getByRole('img', { name: /Penampang ladang/ })).toBeVisible();
    await expect(page.getByText('Perkiraan panen seluruhnya: 0 keranjang')).toBeVisible();
    for (const plot of PLOTS) await sow(page, plot, 3);
    await expect(page.getByText('0 dari 12')).toBeVisible();
    await page.getByRole('button', { name: 'Gali saluran' }).nth(3).click();
    await expect(page.getByText('Perkiraan panen seluruhnya: 66 keranjang')).toBeVisible();
    await page.getByRole('button', { name: 'Mulai musim panen' }).click();

    // Shemu: the accounts add up to the best possible year
    await finishScene(page);
    await expect(page.getByText('Pajaknya 1/4 dari itu: 9 keranjang.')).toBeVisible();
    await expect(page.getByTestId('surplus')).toHaveText('36');
    await expect(page.getByText('Pajak lunas dan keluarga kenyang.')).toBeVisible();
    await expect(page.getByRole('img', { name: '3 dari 3 bintang' })).toBeVisible();
    await page.getByRole('button', { name: 'Selesaikan musim' }).click();

    // the ending, then the bonus quiz
    await finishScene(page);
    await page.getByRole('button', { name: 'Coba bonus' }).click();
    await page.getByRole('button', { name: '365 hari', exact: true }).click();
    await page.getByRole('button', { name: 'Pertanyaan berikutnya' }).click();
    await page.getByRole('button', { name: '1 hari', exact: true }).click();
    await page.getByRole('button', { name: 'Pertanyaan berikutnya' }).click();
    await page.getByRole('button', { name: '1.460 tahun', exact: true }).click();
    await page.getByRole('button', { name: 'Lihat hasil' }).click();
    await expect(page.getByText(/Kamu menjawab 3 dari 3 dengan benar/)).toBeVisible();
    await page.getByRole('button', { name: 'Lanjut' }).click();

    // the result: stars and six new Kodeks entries
    await expect(page.getByText('Misi selesai')).toBeVisible();
    await expect(page.getByRole('img', { name: '3 dari 3 bintang' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Entri Kodeks baru' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Siklus Sothis/ })).toBeVisible();
    await page.getByRole('link', { name: 'Buka Kodeks' }).click();
    await expect(page.getByText(/^6 dari \d+ entri ditemukan$/)).toBeVisible();

    // the progress is saved: the chapter shows the star and the mission can be replayed
    await page.goto('/bab/mesir');
    await expect(page.getByText('1 dari 6 misi selesai')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Main lagi' })).toBeVisible();
  });

  test('Santai: salah baca Nilometer diberi petunjuk, dan rencana otomatis dihitung 1 bintang', async ({
    page,
  }) => {
    await seed(page);
    await openMission(page, 'Santai');
    await finishScene(page);

    await page.getByRole('button', { name: 'Tanda 16 hasta' }).click();
    await expect(page.getByText('Belum tepat.')).toBeVisible();
    await page.getByRole('button', { name: 'Tanda 15 hasta' }).click();
    await expect(page.getByText('Petunjuk Kala: air berhenti di tanda 14 hasta.')).toBeVisible();
    await page.getByRole('button', { name: 'Tanda 14 hasta' }).click();
    await expect(page.getByText('Tepat! Banjir tahun ini 14 hasta.')).toBeVisible();
    await page.getByRole('button', { name: 'Lanjut' }).click();
    await page.getByRole('button', { name: 'Mulai musim tanam' }).click();
    await finishScene(page);

    // Kala fills in the best plan, but only after a warning that it costs stars
    await page.getByRole('button', { name: 'Isi rencana terbaik' }).click();
    await expect(page.getByRole('dialog')).toContainText('Misi ini lalu dihitung 1 bintang.');
    await page.getByRole('button', { name: 'Ya' }).click();
    await expect(page.getByText('Rencana diisi Kala: 1 bintang.')).toBeVisible();
    await page.getByRole('button', { name: 'Mulai musim panen' }).click();

    await finishScene(page);
    await expect(page.getByTestId('surplus')).toHaveText('36'); // the best plan is really the best
    await expect(
      page.getByText('Rencana ini diisi Kala, jadi misi dihitung 1 bintang.'),
    ).toBeVisible();
    await expect(page.getByRole('img', { name: '1 dari 3 bintang' })).toBeVisible();
  });

  test('Tantangan: tanpa petunjuk, tanpa pratinjau, banjir acak', async ({ page }) => {
    await seed(page, { mode: 'challenge' });
    await openMission(page, 'Tantangan');
    await finishScene(page);

    // no hint box, and the flood is found by reading, not by being told
    await expect(page.getByText('Cari angka di sisi kiri')).toHaveCount(0);
    const marks = page.getByRole('group', { name: 'Skala Nilometer' }).getByRole('button');
    const solved = page.getByText(/^Tepat! Banjir tahun ini \d+ hasta\.$/);
    for (let n = 11; n <= 19 && !(await solved.isVisible()); n++) {
      await page.getByRole('button', { name: `Tanda ${n} hasta` }).click();
    }
    await expect(solved).toBeVisible();
    expect(await marks.count()).toBe(9);
    await page.getByRole('button', { name: 'Lanjut' }).click();

    // raw numbers only: no "terairi" labels while the flood is reported
    await expect(page.getByText('Tahun ini:')).toHaveCount(0);
    await expect(page.getByText('Terairi', { exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: 'Mulai musim tanam' }).click();
    await finishScene(page);

    await expect(page.getByRole('heading', { name: 'Rencana tanam' })).toBeVisible();
    await expect(page.getByRole('img', { name: /Penampang ladang/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Isi rencana terbaik' })).toHaveCount(0);
    await expect(page.getByText(/Perkiraan panen/)).toHaveCount(0);
    await expect(page.getByText(/^Tinggi banjir tahun ini: \d+ hasta$/)).toBeVisible();

    // some plan, then the accounts: whatever the flood, the mission can be finished
    await sow(page, 'Tepi sungai', 3);
    await page.getByRole('button', { name: 'Mulai musim panen' }).click();
    await finishScene(page);
    await expect(page.getByTestId('surplus')).toBeVisible();
    await page.getByRole('button', { name: 'Selesaikan musim' }).click();
    await finishScene(page);
    await page.getByRole('button', { name: 'Lewati bonus' }).click();
    await expect(page.getByText('Misi selesai')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Entri Kodeks baru' })).toBeVisible();
  });

  test('keluar dari misi meminta konfirmasi dan tidak menyimpan apa-apa', async ({ page }) => {
    await seed(page);
    await page.goto('/bab/mesir/misi/m1-banjir-nil');

    await page.getByRole('button', { name: 'Keluar' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('Keluar dari misi?');
    await dialog.getByRole('button', { name: 'Lanjut bermain' }).click();
    await expect(dialog).toBeHidden();

    await page.getByRole('button', { name: 'Keluar' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Keluar' }).click();
    await expect(page).toHaveURL(/\/bab\/mesir$/);
    await expect(page.getByText('0 dari 6 misi selesai')).toBeVisible();
  });

  test('misi yang tidak punya berkas menampilkan pesan, bukan layar kosong', async ({ page }) => {
    await seed(page);
    await page.goto('/bab/mesir/misi/tidak-ada');
    await expect(page.getByText('Misi ini belum tersedia.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Kembali ke bab' })).toBeVisible();
  });
});
