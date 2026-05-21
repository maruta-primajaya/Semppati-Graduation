import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { prisma } from './lib/prisma';
import { createToken, verifyToken } from './lib/auth';
import * as xlsx from 'xlsx';

// Gunakan dotenv untuk development jika tidak ada env yang diinject
import dotenv from 'dotenv';
dotenv.config();

function parseCookies(cookieHeader?: string) {
  const list: Record<string, string> = {};
  if (!cookieHeader) return list;
  cookieHeader.split(';').forEach(cookie => {
    const parts = cookie.split('=');
    const name = parts.shift()?.trim();
    if (name) {
      list[name] = decodeURIComponent(parts.join('='));
    }
  });
  return list;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Batasi ukuran JSON payload agar muat file excel base64 yang besar
  app.use(express.json({ limit: '15mb' }));

  // Middleware Auth Admin
  const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies['admin_session'];
    
    if (!token) {
      res.status(401).json({ error: 'Sesi admin tidak ditemukan. Silakan login kembali.' });
      return;
    }
    
    const session = verifyToken(token);
    if (!session) {
      res.status(401).json({ error: 'Sesi admin tidak valid atau telah kedaluwarsa.' });
      return;
    }
    
    (req as any).admin = session;
    next();
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // API AUTHENTICATION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    
    const adminUser = process.env.ADMIN_USERNAME || 'admin';
    const adminPass = process.env.ADMIN_PASSWORD || 'adminpassword123';
    
    if (username === adminUser && password === adminPass) {
      const token = createToken(username);
      // Set HttpOnly cookie
      res.setHeader('Set-Cookie', `admin_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=7200`); // 2 jam
      res.json({ success: true, username });
    } else {
      res.status(401).json({ error: 'Username atau Password salah.' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    res.setHeader('Set-Cookie', 'admin_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0');
    res.json({ success: true });
  });

  app.get('/api/auth/me', (req, res) => {
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies['admin_session'];
    
    if (!token) {
       res.json({ authenticated: false });
       return;
    }
    
    const session = verifyToken(token);
    if (!session) {
       res.json({ authenticated: false });
       return;
    }
    
    res.json({ authenticated: true, username: session.username });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // API SISWA (PUBLIK)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // Ambil detail siswa berdasarkan pencarian NISN (Cek Kelulusan)
  app.get('/api/siswa/cek', async (req, res) => {
    const { nisn } = req.query;
    if (!nisn || typeof nisn !== 'string') {
      res.status(400).json({ error: 'NISN tidak boleh kosong dan harus berupa karakter.' });
      return;
    }

    try {
      const siswa = await prisma.siswa.findUnique({
        where: { nisn },
      });

      if (!siswa) {
        res.status(404).json({ error: 'Data siswa tidak ditemukan. Pastikan NISN yang dimasukkan benar.' });
        return;
      }

      res.json(siswa);
    } catch (e: any) {
      console.error('Error in GET /api/siswa/cek:', e);
      res.status(500).json({ error: 'Terjadi kesalahan sistem ketika mencari kelulusan.' });
    }
  });

  // Ambil data ringkasan kelulusan untuk counter statistik di homepage
  app.get('/api/siswa/stats', async (req, res) => {
    try {
      const totalSiswa = await prisma.siswa.count();
      const totalLulus = await prisma.siswa.count({
        where: { lulus: true },
      });
      const totalTidakLulus = totalSiswa - totalLulus;
      const persentaseKelulusan = totalSiswa > 0 ? parseFloat(((totalLulus / totalSiswa) * 100).toFixed(2)) : 0;

      res.json({
        totalSiswa,
        totalLulus,
        totalTidakLulus,
        persentaseKelulusan,
      });
    } catch (e: any) {
      console.error('Error in GET /api/admin/statistik:', e);
      res.status(500).json({ error: `Gagal mengambil statistik kelulusan: ${e.message || e}` });
    }
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // API ADMIN - KELOLA SISWA (DILINDUNGI AUTH)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // Ambil semua data siswa (pagination, filter, searching) untuk tabel admin
  app.get('/api/admin/siswa', requireAdmin, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = (req.query.search as string) || '';
      const filterKelas = (req.query.kelas as string) || '';
      const filterStatus = (req.query.status as string) || ''; // 'lulus', 'tidak'
      
      const skip = (page - 1) * limit;

      // Build query condition
      const whereClause: any = {};

      if (search) {
        whereClause.OR = [
          { nama: { contains: search } },
          { nisn: { contains: search } },
        ];
      }

      if (filterKelas) {
        whereClause.kelas = filterKelas;
      }

      if (filterStatus) {
        whereClause.lulus = filterStatus === 'lulus';
      }

      const [siswa, totalCount] = await prisma.$transaction([
        prisma.siswa.findMany({
          where: whereClause,
          orderBy: { nama: 'asc' },
          skip: skip,
          take: limit,
        }),
        prisma.siswa.count({ where: whereClause }),
      ]);

      // Ambil daftar unik kelas untuk dropdown filter
      const semuaSiswa = await prisma.siswa.findMany({
        select: { kelas: true },
        distinct: ['kelas'],
      });
      const daftarKelas = semuaSiswa.map(s => s.kelas).sort();

      res.json({
        data: siswa,
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit),
        },
        daftarKelas,
      });
    } catch (e: any) {
      console.error('Error in GET /api/admin/siswa:', e);
      res.status(500).json({ error: `Gagal mengambil data siswa admin: ${e.message || e}` });
    }
  });

  // Tambah satu data siswa secara manual
  app.post('/api/admin/siswa', requireAdmin, async (req, res) => {
    const { nisn, nama, kelas, tglLahir, lulus } = req.body;

    if (!nisn || !nama || !kelas || !tglLahir) {
      res.status(400).json({ error: 'Harap lengkapi semua field formulir (NISN, Nama, Kelas, Tanggal Lahir).' });
      return;
    }

    if (nisn.length !== 10 || isNaN(Number(nisn))) {
      res.status(400).json({ error: 'NISN harus berisi tepat 10 digit angka.' });
      return;
    }

    try {
      // Ambil format ISO Tanggal Lahir
      const parsedDate = new Date(tglLahir);
      if (isNaN(parsedDate.getTime())) {
        res.status(400).json({ error: 'Format Tanggal Lahir tidak valid.' });
        return;
      }

      // Pastikan NISN unik
      const existingSiswa = await prisma.siswa.findUnique({ where: { nisn } });
      if (existingSiswa) {
        res.status(400).json({ error: `Siswa dengan NISN ${nisn} sudah terdaftar (${existingSiswa.nama}).` });
        return;
      }

      const siswaBaru = await prisma.siswa.create({
        data: {
          nisn,
          nama,
          kelas,
          tglLahir: parsedDate,
          lulus: lulus === true || lulus === 'true',
        },
      });

      res.status(210).json({ success: true, data: siswaBaru });
    } catch (e: any) {
      res.status(500).json({ error: 'Terjadi kesalahan sistem saat menyimpan siswa.' });
    }
  });

  // Hapus satu siswa
  app.delete('/api/admin/siswa/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
      await prisma.siswa.delete({
        where: { id: parseInt(id) },
      });
      res.json({ success: true, message: 'Data siswa berhasil dihapus.' });
    } catch (e: any) {
      res.status(500).json({ error: 'Gagal menghapus data siswa atau data tidak ditemukan.' });
    }
  });

  // Toggle status kelulusan siswa
  app.put('/api/admin/siswa/toggle/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
      const siswa = await prisma.siswa.findUnique({
        where: { id: parseInt(id) },
      });

      if (!siswa) {
        res.status(404).json({ error: 'Data siswa tidak ditemukan.' });
        return;
      }

      const updateSiswa = await prisma.siswa.update({
        where: { id: parseInt(id) },
        data: { lulus: !siswa.lulus },
      });

      res.json({ success: true, data: updateSiswa });
    } catch (e: any) {
      res.status(500).json({ error: 'Gagal mengubah status kelulusan.' });
    }
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // EXPORT EXCEL SISWA (ADMIN)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  app.get('/api/admin/siswa/export', requireAdmin, async (req, res) => {
    try {
      const listSiswa = await prisma.siswa.findMany({
        orderBy: { nama: 'asc' },
      });

      // Map data ke kolom format terbaca
      const dataRows = listSiswa.map((s, idx) => ({
        'No': idx + 1,
        'NISN': s.nisn,
        'Nama Lengkap': s.nama,
        'Kelas': s.kelas,
        'Tanggal Lahir (YYYY-MM-DD)': s.tglLahir.toISOString().split('T')[0],
        'Status Kelulusan (Lulus/Tidak)': s.lulus ? 'Lulus' : 'Tidak Lulus',
      }));

      // Buat workbook & sheet menggunakan xlsx
      const worksheet = xlsx.utils.json_to_sheet(dataRows);
      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, 'Siswa');

      // Tulis sheet ke buffer
      const excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'buffer' });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=data_siswa_kelulusan_2026.xlsx');
      res.send(excelBuffer);
    } catch (e: any) {
      res.status(500).json({ error: 'Gagal mengekspor data ke Excel.' });
    }
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // IMPORT EXCEL SISWA (ADMIN)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  app.post('/api/admin/siswa/import', requireAdmin, async (req, res) => {
    const { fileData, mapping } = req.body;

    if (!fileData) {
      res.status(400).json({ error: 'Data file Excel tidak ditemukan.' });
      return;
    }

    if (!mapping || !mapping.nisn || !mapping.nama || !mapping.kelas) {
      res.status(400).json({ error: 'Konfigurasi penyesuaian (mapping) kolom utama (NISN, Nama_Lengkap, Kelas_Rombel) tidak lengkap.' });
      return;
    }

    try {
      // Decode base64
      const buffer = Buffer.from(fileData, 'base64');
      const workbook = xlsx.read(buffer, { type: 'buffer', cellDates: true });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Ambil rows dalam format array of objects
      const rows = xlsx.utils.sheet_to_json<any>(worksheet, { defval: '' });

      if (rows.length === 0) {
        res.status(400).json({ error: 'File Excel kosong atau tidak memiliki baris data.' });
        return;
      }

      let successCount = 0;
      let failCount = 0;
      const reportFailures: Array<{ row: number; nama: string; reason: string }> = [];

      // Proses sekuensial satu persatu untuk memberikan validasi baris yang rinci
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2; // Mulai baris ke-2 (Baris 1 = Header)

        // Ambil nilai berdasarkan konfigurasi mapping
        const rawNisn = String(row[mapping.nisn] || '').trim();
        const rawNama = String(row[mapping.nama] || '').trim();
        
        let rawKelas = String(row[mapping.kelas] || '').trim();
        if (mapping.rombel && row[mapping.rombel]) {
          const rawRombel = String(row[mapping.rombel]).trim();
          if (rawRombel) {
            rawKelas = `${rawKelas} ${rawRombel}`;
          }
        }

        const rawTglLahir = mapping.tglLahir ? row[mapping.tglLahir] : null;
        const rawLulus = mapping.lulus ? String(row[mapping.lulus] || '').trim().toLowerCase() : 'lulus';

        // VALIDASI UNTUK BARIS INI (Wajib NISN, Nama, dan Kelas)
        if (!rawNisn || !rawNama || !rawKelas) {
          failCount++;
          reportFailures.push({
            row: rowNum,
            nama: rawNama || 'Tanpa Nama',
            reason: 'Nilai NISN, Nama Lengkap, atau Kelas kosong.',
          });
          continue;
        }

        // Validasi format NISN
        let cleanedNisn = rawNisn.replace(/[^0-9]/g, '');
        if (cleanedNisn.length > 0 && cleanedNisn.length < 10) {
          cleanedNisn = cleanedNisn.padStart(10, '0');
        }
        if (cleanedNisn.length !== 10) {
          failCount++;
          reportFailures.push({
            row: rowNum,
            nama: rawNama,
            reason: `NISN "${rawNisn}" tidak valid, harus berisi tepat 10 digit angka.`,
          });
          continue;
        }

        // Tanggal lahir parsing
        let parsedDate: Date;
        if (rawTglLahir) {
          if (rawTglLahir instanceof Date) {
            parsedDate = rawTglLahir;
          } else {
            parsedDate = new Date(rawTglLahir);
          }
          if (isNaN(parsedDate.getTime())) {
            parsedDate = new Date('2011-01-01');
          }
        } else {
          parsedDate = new Date('2011-01-01');
        }

        // Resolusi status Lulus
        let isLulus = true;
        if (rawLulus) {
          if (rawLulus === 'tidak' || rawLulus === 'tidak lulus' || rawLulus === 'false' || rawLulus === '0' || rawLulus === 'tidak_lulus' || rawLulus === 'tidak lulus') {
            isLulus = false;
          }
        }

        try {
          // Upsert data siswa berdasarkan NISN unik
          await prisma.siswa.upsert({
            where: { nisn: cleanedNisn },
            update: {
              nama: rawNama,
              kelas: rawKelas,
              tglLahir: parsedDate,
              lulus: isLulus,
            },
            create: {
              nisn: cleanedNisn,
              nama: rawNama,
              kelas: rawKelas,
              tglLahir: parsedDate,
              lulus: isLulus,
            },
          });
          successCount++;
        } catch (dbError: any) {
          failCount++;
          reportFailures.push({
            row: rowNum,
            nama: rawNama,
            reason: `Database error: ${dbError.message || 'Gagal menyimpan ke database'}`,
          });
        }
      }

      res.json({
        successCount,
        failCount,
        failures: reportFailures,
      });
    } catch (e: any) {
      res.status(500).json({ error: `Gagal memproses file Excel: ${e.message || 'Format tidak dikenali'}` });
    }
  });


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // VITE MIDDLEWARE DAN PRODUCTION STATICS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[School Graduation Announcement Server] Running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
