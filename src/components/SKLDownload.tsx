import { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { Siswa } from '../types';
import { 
  FileDown, 
  FileText, 
  Settings, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Trash2, 
  Sparkles, 
  Info,
  LogOut,
  Chrome
} from 'lucide-react';
import { googleSignIn, initAuth, logoutGoogle, getAccessToken } from '../lib/workspaceAuth';
import { User } from 'firebase/auth';

interface SKLDownloadProps {
  siswa: Siswa;
}

export default function SKLDownload({ siswa }: SKLDownloadProps) {
  const [activeMode, setActiveMode] = useState<'standard' | 'gdocs'>('standard');
  
  // Google Auth states
  const [gUser, setGUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // Google Docs template settings
  const [templateId, setTemplateId] = useState<string>(() => {
    return localStorage.getItem('smpn43_gdocs_template_id') || '';
  });
  const [deleteAfterExport, setDeleteAfterExport] = useState<boolean>(true);

  // Dynamic process tracking states
  const [processing, setProcessing] = useState(false);
  const [processStep, setProcessStep] = useState<string>('');
  const [processError, setProcessError] = useState<string>('');
  const [processProgress, setProcessProgress] = useState<number>(0);

  // Initialize Auth listeners on load
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGUser(user);
        setAccessToken(token);
        setNeedsAuth(false);
      },
      () => {
        setGUser(null);
        setAccessToken(null);
        setNeedsAuth(true);
      }
    );
    return () => unsubscribe();
  }, []);

  // Persist template ID
  useEffect(() => {
    localStorage.setItem('smpn43_gdocs_template_id', templateId);
  }, [templateId]);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setProcessError('');
    try {
      const result = await googleSignIn();
      if (result) {
        setGUser(result.user);
        setAccessToken(result.accessToken);
        setNeedsAuth(false);
      }
    } catch (err: any) {
      console.error('Google authorization failed:', err);
      setProcessError(`Gagal menghubungkan Google: ${err.message || err}`);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogout = async () => {
    try {
      if (window.confirm('Keluar dari integrasi Google Workspace?')) {
        await logoutGoogle();
        setGUser(null);
        setAccessToken(null);
        setNeedsAuth(true);
      }
    } catch (err: any) {
      console.error('Logout failed:', err);
    }
  };

  // --- MODE 1: STANDARD STANDALONE PDF GENERATION (jsPDF) ---
  const generateStandardPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // 1. KOP SURAT (Letterhead)
      doc.setFont('times', 'bold');
      doc.setFontSize(14);
      doc.text('PEMERINTAH KOTA SURABAYA', 105, 18, { align: 'center' });
      doc.setFontSize(15);
      doc.text('DINAS PENDIDIKAN', 105, 24, { align: 'center' });
      doc.setFontSize(16);
      doc.text('SMP NEGERI 43 SURABAYA', 105, 30, { align: 'center' });
      
      // Sub-header (Alamat)
      doc.setFont('times', 'normal');
      doc.setFontSize(9);
      doc.text('Jl. Raden Saleh No. 45, Alun-alun Contong, Kec. Bubutan, Kota Surabaya, Jawa Timur 60174', 105, 35, { align: 'center' });
      doc.text('Telepon: (031) 5345678 | Website: smpn43surabaya.sch.id | Email: info@smpn43surabaya.sch.id', 105, 39, { align: 'center' });

      // Garis Pembatas Kop Surat
      doc.setLineWidth(0.8);
      doc.line(20, 42, 190, 42);
      doc.setLineWidth(0.2);
      doc.line(20, 43, 190, 43);

      // 2. JUDUL SURAT
      doc.setFont('times', 'bold');
      doc.setFontSize(13);
      doc.text('SURAT KETERANGAN LULUS', 105, 54, { align: 'center' });
      
      doc.setFont('times', 'italic');
      doc.setFontSize(11);
      doc.text('Nomor: 422.1 / 185 / 436.7.1.43 / 2026', 105, 59, { align: 'center' });

      // Pengantar
      doc.setFont('times', 'normal');
      doc.setFontSize(11);
      const pengantarText = 'Yang bertanda tangan di bawah ini, Kepala Sekolah SMP Negeri 43 Surabaya, dengan ini menerangkan bahwa:';
      doc.text(pengantarText, 20, 70, { maxWidth: 170 });

      // 3. IDENTITAS SISWA (Table style)
      const alignXLabel = 35;
      const alignXDot = 80;
      const alignXValue = 85;

      doc.setFont('times', 'normal');
      
      doc.text('Nama Lengkap', alignXLabel, 82);
      doc.text(':', alignXDot, 82);
      doc.setFont('times', 'bold');
      doc.text(siswa.nama.toUpperCase(), alignXValue, 82);
      doc.setFont('times', 'normal');

      doc.text('NISN', alignXLabel, 90);
      doc.text(':', alignXDot, 90);
      doc.text(siswa.nisn, alignXValue, 90);

      doc.text('Kelas', alignXLabel, 98);
      doc.text(':', alignXDot, 98);
      doc.text(siswa.kelas, alignXValue, 98);

      doc.text('Tanggal Lahir', alignXLabel, 106);
      doc.text(':', alignXDot, 106);
      
      let formattedDate = '';
      try {
        const d = new Date(siswa.tglLahir);
        const opsi: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
        formattedDate = d.toLocaleDateString('id-ID', opsi);
      } catch (e) {
        formattedDate = siswa.tglLahir.split('T')[0];
      }
      doc.text(formattedDate, alignXValue, 106);

      doc.text('Satuan Pendidikan', alignXLabel, 114);
      doc.text(':', alignXDot, 114);
      doc.text('SMP Negeri 43 Surabaya', alignXValue, 114);

      // 4. PERNYATAAN KELULUSAN
      doc.setFont('times', 'normal');
      const bdsPernyataan = 'Berdasarkan ketetapan kriteria kelulusan dan hasil Rapat Pleno Dewan Pendidik SMP Negeri 43 Surabaya tentang kelulusan peserta didik Tahun Pelajaran 2025/2026 pada tanggal 21 Mei 2026, siswa yang bersangkutan dinyatakan:';
      doc.text(bdsPernyataan, 20, 126, { maxWidth: 170, align: 'justify' });

      // Box Status
      doc.setDrawColor(13, 71, 161);
      doc.setFillColor(240, 244, 255);
      doc.rect(40, 142, 130, 18, 'FD');

      doc.setFont('times', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(13, 71, 161);
      
      const statusText = siswa.lulus ? 'LULUS' : 'TIDAK LULUS';
        
      doc.text(statusText, 105, 153, { align: 'center' });

      // Reset Text Color
      doc.setTextColor(0, 0, 0);

      // Penjelas
      doc.setFont('times', 'normal');
      doc.setFontSize(11);
      const penjelas = 'Surat Keterangan Lulus ini bersifat sementara dan dapat dipergunakan untuk keperluan administrasi pendaftaran ke jenjang pendidikan selanjutnya sampai dikeluarkannya Ijazah asli dari Dinas Pendidikan.';
      doc.text(penjelas, 20, 169, { maxWidth: 170, align: 'justify' });

      // 5. TANDA TANGAN (Signature Area)
      const signAreaX = 120;
      doc.text('Surabaya, 21 Mei 2026', signAreaX, 195);
      doc.text('Kepala Sekolah,', signAreaX, 201);
      
      doc.setFont('times', 'bold');
      doc.text('Dra. Sri Sulaminingsih, M.Si', signAreaX, 226);
      doc.line(signAreaX, 227.5, signAreaX + 50, 227.5);
      
      doc.setFont('times', 'normal');
      doc.text('NIP. 196903042006042010', signAreaX, 232);

      // Footer
      doc.setFontSize(8);
      doc.setFont('times', 'italic');
      doc.text('* Dokumen ini sah dan diterbitkan secara resmi oleh SMP Negeri 43 Surabaya melalui Portal Kelulusan Online.', 20, 275);

      doc.save(`SKL_SMPN43_2026_${siswa.nisn}_${siswa.nama.replace(/\s+/g, '_')}.pdf`);
    } catch (err: any) {
      alert(`Terjadi kesalahan membuat PDF: ${err.message || err}`);
    }
  };

  // --- MODE 2: ADVANCED GOOGLE DOCS AUTOMATED EXPORTER ---
  const generateGDocsPDF = async () => {
    if (!templateId.trim()) {
      setProcessError('Mohon isi Google Docs template ID terlebih dahulu.');
      return;
    }

    const token = accessToken || getAccessToken();
    if (!token) {
      setProcessError('Token Google tidak terdeteksi. Silakan hubungkan kembali akun Google Anda.');
      return;
    }

    setProcessing(true);
    setProcessError('');
    setProcessProgress(10);

    let copiedFileId: string | null = null;

    try {
      // Step 1: Menyalin Templat
      setProcessStep('🔑 Mengakses Drive & menyalin templat Google Doc...');
      setProcessProgress(25);

      const copyRes = await fetch(`https://www.googleapis.com/drive/v3/files/${templateId.trim()}/copy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `SKL_Temp_${siswa.nisn}_${siswa.nama.toUpperCase().replace(/\s+/g, '_')}`,
        }),
      });

      if (!copyRes.ok) {
        const errDetail = await copyRes.json().catch(() => ({}));
        throw new Error(errDetail?.error?.message || `Gagal menyalin templat Google Doc (Kode: ${copyRes.status}). Pastikan ID benar.`);
      }

      const copyData = await copyRes.json();
      copiedFileId = copyData.id;

      if (!copiedFileId) {
        throw new Error('Gagal mendapatkan ID dokumen salinan.');
      }

      // Format Birthdate
      let formattedDate = '';
      try {
        const d = new Date(siswa.tglLahir);
        const opsi: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
        formattedDate = d.toLocaleDateString('id-ID', opsi);
      } catch (e) {
        formattedDate = siswa.tglLahir.split('T')[0];
      }

      const statusText = siswa.lulus ? 'LULUS' : 'TIDAK LULUS';

      // Step 2: Melakukan Replacement Placeholder di Google Docs
      setProcessStep('📝 Memproses penyesuaian data siswa ke lembar dokumen...');
      setProcessProgress(55);

      const updateRes = await fetch(`https://www.googleapis.com/v1/documents/${copiedFileId}:batchUpdate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            { replaceAllText: { containsText: { text: '{{NAMA}}', matchCase: false }, replaceText: siswa.nama.toUpperCase() } },
            { replaceAllText: { containsText: { text: '{{Nama_Lengkap}}', matchCase: false }, replaceText: siswa.nama } },
            { replaceAllText: { containsText: { text: '{{NISN}}', matchCase: false }, replaceText: siswa.nisn } },
            { replaceAllText: { containsText: { text: '{{KELAS}}', matchCase: false }, replaceText: siswa.kelas } },
            { replaceAllText: { containsText: { text: '{{Kelas_Rombel}}', matchCase: false }, replaceText: siswa.kelas } },
            { replaceAllText: { containsText: { text: '{{TANGGAL_LAHIR}}', matchCase: false }, replaceText: formattedDate } },
            { replaceAllText: { containsText: { text: '{{Tanggal_Lahir}}', matchCase: false }, replaceText: formattedDate } },
            { replaceAllText: { containsText: { text: '{{STATUS}}', matchCase: false }, replaceText: statusText } },
            { replaceAllText: { containsText: { text: '{{Keterangan_Lulus}}', matchCase: false }, replaceText: siswa.lulus } },
          ],
        }),
      });

      if (!updateRes.ok) {
        const errDetail = await updateRes.json().catch(() => ({}));
        throw new Error(errDetail?.error?.message || 'Gagal memproses penggantian placeholders di Google Docs.');
      }

      // Step 3: Memanggil Drive Export ke PDF
      setProcessStep('⚙️ Menyiapkan unduhan & merender format PDF...');
      setProcessProgress(80);

      const exportRes = await fetch(`https://www.googleapis.com/drive/v3/files/${copiedFileId}/export?mimeType=application/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!exportRes.ok) {
        const errDetail = await exportRes.json().catch(() => ({}));
        throw new Error(errDetail?.error?.message || 'Gagal mengonversi file Google Docs ke PDF.');
      }

      const blob = await exportRes.blob();
      setProcessProgress(95);

      // Trigger download
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `SKL_Surat_Resmi_${siswa.nisn}_${siswa.nama.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      // Step 4: Menghapus file pendukung (jika disetel)
      if (deleteAfterExport && copiedFileId) {
        setProcessStep('🧹 Membersihkan file salinan sementara di Drive Anda...');
        await fetch(`https://www.googleapis.com/drive/v3/files/${copiedFileId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }

      setProcessProgress(100);
      setProcessStep('🎉 Berhasil diunduh! Berkas PDF Anda siap digunakan.');
      
      // Reset timer
      setTimeout(() => {
        setProcessing(false);
        setProcessProgress(0);
        setProcessStep('');
      }, 4000);

    } catch (err: any) {
      console.error('Export template failed:', err);
      setProcessError(err.message || 'Terjadi kesalahan sistem saat mengekspor templat.');
      setProcessing(false);
      setProcessProgress(0);
      
      // Clean up file if failed but copied
      if (copiedFileId) {
        fetch(`https://www.googleapis.com/drive/v3/files/${copiedFileId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }).catch(() => {});
      }
    }
  };

  return (
    <div className="w-full bg-white border border-gray-150 rounded-2xl shadow-sm p-4 sm:p-6 transition-all duration-200">
      
      {/* MODE TABS CONTAINER */}
      <div className="flex border-b border-gray-100 pb-4 mb-4 justify-between items-center flex-wrap gap-2">
        <h4 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-[#0D47A1]" />
          Metode Pembuatan SKL Siswa
        </h4>
        <div className="flex bg-gray-100/80 p-1 rounded-lg border border-gray-200/50 text-xs">
          <button
            type="button"
            onClick={() => setActiveMode('standard')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
              activeMode === 'standard' 
                ? 'bg-white text-[#0D47A1] shadow-xs' 
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Aplikasi Instan
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('gdocs')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              activeMode === 'gdocs' 
                ? 'bg-[#E3F2FD] text-[#0D47A1] shadow-xs font-bold' 
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Sparkles className="w-3 h-3 text-[#FFD54F] fill-[#FFD54F]" />
            Templat Google Docs
          </button>
        </div>
      </div>

      {/* RENDER - STANDARD INSTANT MODE */}
      {activeMode === 'standard' && (
        <div className="space-y-4">
          <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100/50 text-xs leading-relaxed text-blue-900 flex gap-3">
            <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold mb-1">Unduhan Dokumen Instan Tanpa Server</p>
              Mode ini merekayasa tata letak PDF standar secara otomatis langsung dari browser Anda. Cepat, instan, dan siap pakai dalam hitungan milidetik.
            </div>
          </div>
          <button
            id="btn-download-skl-standard"
            type="button"
            onClick={generateStandardPDF}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#0D47A1] text-white hover:bg-blue-800 focus:ring-4 focus:ring-blue-100 font-bold rounded-xl shadow-md transition-colors duration-200 cursor-pointer text-sm border border-blue-900/30"
          >
            <FileDown className="w-5 h-5 animate-pulse text-[#FFD54F]" />
            Unduh SKL Standar (PDF)
          </button>
        </div>
      )}

      {/* RENDER - GOOGLE DOCS ADVANCED MODE */}
      {activeMode === 'gdocs' && (
        <div className="space-y-4">
          {/* USER AUTH TRACKING SUB-BAR */}
          <div className="flex items-center justify-between border border-emerald-100 bg-emerald-50/20 p-3 rounded-xl flex-wrap gap-2 text-xs">
            {needsAuth ? (
              <>
                <div className="flex items-center gap-2 text-emerald-850">
                  <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-ping"></div>
                  <span>Integrasi Google Drive & Docs belum terhubung.</span>
                </div>
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoggingIn}
                  className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 font-bold text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <Chrome className="w-3.5 h-3.5" />
                  {isLoggingIn ? 'Penghubungan...' : 'Hubungkan Akun Google'}
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
                  <span className="text-gray-700">Terbuka untuk:</span>
                  {gUser?.photoURL ? (
                    <img 
                      src={gUser.photoURL} 
                      alt="Avatar" 
                      className="w-5 h-5 rounded-full border border-gray-300"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xxs font-bold">
                      G
                    </div>
                  )}
                  <span className="font-semibold text-emerald-900 text-xxs sm:text-xs">
                    {gUser?.displayName || gUser?.email}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleGoogleLogout}
                  className="inline-flex items-center gap-1 text-red-650 hover:text-red-800 font-semibold p-1 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                  title="Putuskan Hubungan"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </>
            )}
          </div>

          {/* TEMPLATE PARAMETERS SECTION */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1 flex items-center justify-between">
                <span>Google Docs Template ID atau URL Dokumen <span className="text-red-500">*</span></span>
                <span className="text-xxs font-normal text-gray-500 font-mono">Bisa disunting bebas</span>
              </label>
              <input
                type="text"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                placeholder="Contoh: 1v_Gg9K2fH6H_Z6Z77Y8bJ9K0P1L2M3N"
                className="w-full text-xs p-3 border border-gray-300 bg-white rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-mono"
              />
              <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">
                Buka file template Anda di Google Drive, copy ID dokumen dari URL browser Anda (ID yang berada di antara <code className="bg-gray-100 px-1 py-0.5 rounded">/d/</code> dan <code className="bg-gray-100 px-1 py-0.5 rounded">/edit</code>).
              </p>
            </div>

            {/* MAPPING PLACEHOLDER RULES CHEATSHEET */}
            <div className="bg-amber-50/30 border border-amber-100 p-3.5 rounded-xl">
              <h5 className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5 mb-1.5">
                <Settings className="w-3.5 h-3.5 text-amber-500" />
                Daftar Tag Placeholder yang Didukung untuk Template Docs Anda:
              </h5>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px] text-amber-950 font-mono leading-relaxed">
                <div>• <span className="font-bold">{"{{NAMA}}"}</span> : Nama KAPITAL</div>
                <div>• <span className="font-bold">{"{{Nama_Lengkap}}"}</span> : Nama Asli</div>
                <div>• <span className="font-bold">{"{{NISN}}"}</span> : Kode NISN 10 Digit</div>
                <div>• <span className="font-bold">{"{{KELAS}}"}</span> : Kelas Rombel</div>
                <div>• <span className="font-bold">{"{{Kelas_Rombel}}"}</span> : Kelas Rombel</div>
                <div>• <span className="font-bold">{"{{TANGGAL_LAHIR}}"}</span> : Lahir (id)</div>
                <div>• <span className="font-bold">{"{{STATUS}}"}</span> : LULUS/TIDAK LULUS</div>
              </div>
            </div>

            {/* CLEANUP CONFIG CHECKBOX */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="chk-delete-doc"
                checked={deleteAfterExport}
                onChange={(e) => setDeleteAfterExport(e.target.checked)}
                className="w-3.5 h-3.5 text-blue-650 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="chk-delete-doc" className="text-xs text-gray-600 select-none cursor-pointer">
                Hapus dokumen sementara dari Drive setelah PDF berhasil diunduh (Sangat Direkomendasikan)
              </label>
            </div>
          </div>

          {/* PROCESS ERRORS */}
          {processError && (
            <div className="bg-red-50 border border-red-200 text-red-650 p-3 rounded-lg text-xs leading-relaxed flex gap-2 items-start animate-fade-in">
              <AlertCircle className="w-4.5 h-4.5 flex-shrink-0 mt-0.5 text-red-500" />
              <span>{processError}</span>
            </div>
          )}

          {/* PROCESS STEP TRACKING FOR OAUTH METRIC */}
          {processing && (
            <div className="bg-[#E3F2FD]/40 border border-[#90CAF9]/40 p-4 rounded-xl space-y-2">
              <div className="flex justify-between text-xs font-semibold text-blue-900">
                <span>{processStep || 'Menghubungi Google API...'}</span>
                <span>{processProgress}%</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-[#00E676] h-full transition-all duration-300 rounded-full" 
                  style={{ width: `${processProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* CONTROL ACTION BUTTONS */}
          <button
            type="button"
            onClick={generateGDocsPDF}
            disabled={needsAuth || processing || !templateId.trim()}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#00E676] text-[#004D40] hover:bg-[#00C853] disabled:bg-gray-200 disabled:text-gray-400 font-extrabold rounded-xl shadow-md transition-colors duration-200 cursor-pointer text-sm"
          >
            {processing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-teal-850" />
                Mengekspor & Mengonversi Docs...
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4 text-teal-900" />
                Unduh via Google Docs Template (PDF)
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
