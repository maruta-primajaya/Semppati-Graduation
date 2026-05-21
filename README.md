# Aplikasi Portal Pengumuman Kelulusan Sekolah Masa Bakti TP 2025/2026

Aplikasi pengumuman kelulusan sekolah modern, aman, dan fully responsive yang didesain khusus untuk **SMP Negeri 43 Surabaya**. Dibangun menggunakan arsitektur full-stack React (Vite) + Express, diintegrasikan dengan **Prisma ORM** + database lokal **SQLite**, serta dilengkapi fitur penarikan berkas **Surat Keterangan Lulus (SKL) PDF** yang digenerate di browser di sisi klien secara formal.

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## FITUR UTAMA & SPESIFIKASI TEKNIS
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 🎓 SISI SISWA (PUBLIK)
1. **Pengecekan NISN Real-Time**: Input 10 digit NISN acak dengan validasi client-side instan dan transisi loading skeleton sebelum respon API.
2. **Halaman Kelulusan Edukatif**:
   - **LULUS**: Menampilkan sebaran efek konfeti canvas dinamik, identitas lengkap siswa, ucapan selamat formal, dan tombol unduh berkas SKL.
   - **BELUM LULUS**: Pesan ketegaran hati, panduan tindak lanjut wali kelas, dan widget interaktif kontak sekolah.
3. **Statistik Homepage**: Widget counters sebaran total siswa terdaftar, total lulus, dan rasio persentase kelulusan ril.

### 🔑 PANEL UTAMA ADMIN
1. **Otorisasi Sesi Aman**: Login menggunakan username dan password yang tersimpan terpusat di `.env` pelindung.
2. **Dashboard Visual**: Analitik total rasio kelulusan yang digambarkan menggunakan visual horizontal bar chart CSS modern.
3. **Siswa Table Manager**:
   - Tabel responsif (Nama, NISN, Kelas, Status, Aksi).
   - Filter dropdown kelas rombel dan searching nama/NISN secara sekuensial.
   - Paging 20 siswa/halaman.
   - Tombol toggle instan status lulus/tidak lulus dan tombol hapus record tunggal.
4. **Alat Impor Massal Excel (SheetJS)**:
   - Fitur unggah file Excel (.xlsx, .xls) atau CSV melalui Drag & Drop.
   - **Interactive Column Mapper**: Pratinjau 10 baris pertama data di layar browser sebelum impor, dan dropdown pemetaan kolom dinamis untuk mencocokkan header kolom Excel Anda dengan field basis data (NISN, Nama, Kelas, Tanggal Lahir, Status).
   - **Detailed Failure Log**: Laporan hasil berupa jumlah sukses vs gagal, lengkap dengan nomor baris dan alasan kegagalan spesifik jika ada format salah.
5. **Ekspor Data**: Penarikan seluruh data siswa terdaftar ke format spreadsheet Excel (.xlsx) murni dalam sekali klik.

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PANDUAN CARA SETUP & SETINGAN (DARI NOL)
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Ikuti langkah demi langkah di bawah ini untuk mengaktifkan portal lokal komputer Anda:

### 1. Prasyarat Sistem
Pastikan komputer Anda sudah terinstal **Node.js** (Sangat disarankan versi LTS minimal v18 ke atas) dan npm. Unduh di [nodejs.org](https://nodejs.org/).

### 2. Unduh atau Clone Repositori
Ekstrak berkas zip proyek ini atau jalankan clone perintah:
```bash
git clone <url-repositori-anda>
cd pengumuman-kelulusan
```

### 3. Jalankan Dependensi Instalasi
Pasang seluruh library pendukung frontend dan backend melalui perintah npm:
```bash
npm install
```

### 4. Setup File Environment (`.env`)
Salin file template `.env.example` ke `.env` di folder root utama:
```bash
# Untuk OS Windows (CMD)
copy .env.example .env

# Untuk OS macOS / Linux / Bash
cp .env.example .env
```
Buka file `.env` yang baru saja disalin dan sesuaikan pengaturannya (ganti password rahasia sesuka Anda):
```env
# Database URL menggunakan SQLite lokal (File basis data otomatis tercipta)
DATABASE_URL="file:./dev.db"

# Kredensial untuk masuk ke Panel Kontrol Admin
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="adminpassword123"

# Kunci rahasia sesi (ubah string acak atau kalimat panjang bebas)
SESSION_SECRET="smpn43surabayasupersecretgradkey2026"
```

### 5. Inisialisasi Database SQLite & Prisma Client
Jalankan perintah generate skema basis data di bawah ini untuk membuat file SQLite lokal (`dev.db`) dan men-generate local database client:
```bash
npx prisma db push
```
*Catatan: Perintah di atas secara otomatis membuat tabel `Siswa` dan mengonfigurasinya tanpa membutuhkan server SQL terpisah.*

### 6. Jalankan Server Pengembangan (Development Server)
Jalankan dev server menggunakan perintah:
```bash
npm run dev
```
Setelah berjalan, buka browser kesayangan Anda dan arahkan ke alamat:
👉 **`http://localhost:3000`**

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## STRUKTUR DAN CONTOH DAFTAR EXCEL YANG BENAR
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Saat melakukan Impor Masal via Panel Admin, pastikan file Excel yang Anda siapkan mengikuti kriteria berikut:

### Kriteria Kolom Header Masing-masing
- **Urutan kolom bebas**, karena sistem dilengkapi penyesuaian kolom dinamik (Interactive Column Mapper). Anda dapat memetakan header secara elastis sebelum impor diproses.
- **Isi baris data wajib** memenuhi format:
  1. **NISN**: Berupa tepat 10 digit angka saja (contoh: `0108920431`). Jangan memasukkan karakter spasi atau tanda hubung.
  2. **Nama**: Huruf kapital nama lengkap (contoh: `ADITYA SAPUTRA`).
  3. **Kelas**: Nama kelas rombongan belajar (contoh: `IX-A` atau `9-D`).
  4. **Tanggal Lahir**: Ditulis dalam format tanggal valid Excel (`YYYY-MM-DD` seperti `2011-05-18`).
  5. **Status Kelulusan**: Status kelulusan siswa ditulis berupa string kata kunci pembeda:
     - Dinyatakan **Lulus**: Tulis `Lulus`, `Ya`, `true`, atau `1`.
     - Dinyatakan **Belum Lulus**: Tulis `Tidak Lulus`, `Tidak`, `false`, atau `0`.

### Contoh Format Baris Excel yang Diterima
| NISN | Nama Lengkap | Kelas | Tanggal Lahir | Status Kelulusan |
| :--- | :--- | :--- | :--- | :--- |
| 0108924361 | AHMAD FADILLAH | IX-A | 2011-04-12 | Lulus |
| 0108924362 | BUDI CAHYONO | IX-A | 2011-06-19 | Lulus |
| 0108924363 | CLARA INTANSARI | IX-B | 2011-12-08 | Tidak Lulus |
| 0108924364 | DEWI LESTARI | IX-C | 2011-10-31 | Lulus |

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PANDUAN CARA DEPLOY KE VERCELL / PUBLIC CLOUD
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Untuk mempublikasikan aplikasi ini agar dapat diakses oleh seluruh siswa via internet, ikuti langkah berikut:

### Opsi A: Deploy ke Vercel (dengan SQLite di-mount ke Supabase / Neon PostgreSQL)
Karena platform cloud seperti Vercel menggunakan sistem filesystem Read-Only (Ephemeral), database jenis file SQLite (`dev.db`) tidak disarankan untuk menyimpan data dinamis karena file database Anda akan tereset secara otomatis setiap kali server melakukan redeploy atau mode idle. 

Untuk mensiasati hal ini di Vercel, kita bisa mengubah datasource database ke cloud database **PostgreSQL** gratisan seperti Supabase atau Neon secara instan:

1. **Buat Cloud Database PostgreSQL Gratis**:
   - Pergi ke [neon.tech](https://neon.tech/) atau [supabase.com](https://supabase.com/) dan buat project baru.
   - Dapatkan string koneksi database (database connection string) berupa alamat URL mirip: `postgresql://username:password@ep-xxxx.postgresql.database.azure.com/neondb?sslmode=require`

2. **Ubah Provider Prisma Schema**:
   Buka file `prisma/schema.prisma` dan sesuaikan provider asalnya dari `sqlite` menjadi `postgresql`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

3. **Deploy via Vercel CLI / GitHub**:
   - Daftarkan akun Anda dan hubungkan repositori proyek ke [vercel.com](https://vercel.com/).
   - Pada halaman konfigurasi Environment Variables di dashboard Vercel, daftarkan 4 variabel berikut:
     - `DATABASE_URL` = *(Isi dengan string koneksi cloud PostgreSQL Anda)*
     - `ADMIN_USERNAME` = `admin`
     - `ADMIN_PASSWORD` = `password-rahasia-sekolah-anda`
     - `SESSION_SECRET` = `string-acak-panjang-apa-saja`
   - Klik **Deploy**. Kemampuan auto-installer Vercel akan otomatis men-generate Prisma Client dan menyebarkan tabel ke cloud server database Anda!

### Opsi B: Deploy Menggunakan Container (VPS / Cloud Run / Heroku)
Ini adalah opsi direkomendasikan jika Anda ingin mempertahankan basis data SQLite lokal tanpa merogoh biaya sewa database cloud:

1. **Deploy Menggunakan Docker**:
   Pasang Docker di cloud server (seperti VPS Ubuntu) dan jalankan build container.
2. Anda bisa membatasi server dengan mengikat volume penyimpanan di VPS agar file database SQLite (`dev.db`) tidak hilang ketika container di-restart:
   ```bash
   # Build container image
   docker build -t portal-kelulusan .
   # Jalankan dengan binding volume SQLite agar persisten
   docker run -p 3000:3000 -v /root/data:/app/prisma -d portal-kelulusan
   ```

---
Aplikasi diproduksi dan didesain secara penuh untuk **Sekolah Menengah Pertama Negeri 43 Surabaya**. Semoga bermanfaat bagi kenyamanan para guru dan siswa di masa kelulusan Tahun Pelajaran 2025/2026.
