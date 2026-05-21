import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import * as xlsx from 'xlsx';
import { ColumnMapping, ImportPreviewRow } from '../types';
import { Upload, CheckCircle2, AlertTriangle, RefreshCw, ChevronLeft, TableProperties } from 'lucide-react';

interface ImportExcelProps {
  onBack: () => void;
  onImportSuccess: () => void;
}

export default function ImportExcel({ onBack, onImportSuccess }: ImportExcelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [base64File, setBase64File] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<ImportPreviewRow[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({
    nisn: '',
    nama: '',
    kelas: '',
    rombel: '',
    tglLahir: '',
    lulus: '',
  });
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  // Hasil report
  const [importReport, setImportReport] = useState<{
    successCount: number;
    failCount: number;
    failures: Array<{ row: number; nama: string; reason: string }>;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (selectedFile: File) => {
    setFile(selectedFile);
    setImportReport(null);
    const reader = new FileReader();

    reader.onload = (e) => {
      const data = e.target?.result;
      if (!data) return;

      // Untuk base64 upload
      const base64Str = btoa(
        new Uint8Array(data as ArrayBuffer).reduce(
          (binData, byte) => binData + String.fromCharCode(byte),
          ''
        )
      );
      setBase64File(base64Str);

      // Parse XLSX untuk client-side preview & header mapping
      const workbook = xlsx.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      const rows = xlsx.utils.sheet_to_json<ImportPreviewRow>(worksheet, { header: 1 });
      if (rows.length > 0) {
        const fileHeaders = (rows[0] as unknown as string[]).map(h => String(h).trim());
        setHeaders(fileHeaders);

        // Preview baris (maksimal 10 baris pertama)
        const rowObjects = xlsx.utils.sheet_to_json<ImportPreviewRow>(worksheet, { defval: '' });
        setPreviewRows(rowObjects.slice(0, 10));

        // Auto mapping for SMP Negeri 43 Surabaya Excel structure
        const autoMap = { nisn: '', nama: '', kelas: '', rombel: '', tglLahir: '', lulus: '' };
        fileHeaders.forEach(header => {
          const lower = header.toLowerCase();
          if (lower === 'nisn' || lower.includes('nomor induk') || lower.includes('nomer induk')) {
            autoMap.nisn = header;
          } else if (lower === 'nama' || lower === 'nama_lengkap' || lower.includes('nama lengkap') || lower.includes('siswa')) {
            autoMap.nama = header;
          } else if (lower === 'kelas' || lower === 'kelas_rombel') {
            autoMap.kelas = header;
          } else if (lower === 'rombel') {
            autoMap.rombel = header;
          } else if (lower.includes('lahir') || lower.includes('tanggal') || lower.includes('tgl') || lower.includes('date')) {
            autoMap.tglLahir = header;
          } else if (lower === 'lulus' || lower === 'keterangan_lulus' || lower.includes('status') || lower.includes('keterangan') || lower.includes('hasil')) {
            autoMap.lulus = header;
          }
        });

        // Pengisian fallback jika tidak terdeteksi otomatis
        setMapping({
          nisn: autoMap.nisn || fileHeaders.find(h => h.toUpperCase() === 'NISN') || fileHeaders[2] || fileHeaders[0] || '',
          nama: autoMap.nama || fileHeaders.find(h => h.toUpperCase() === 'NAMA') || fileHeaders.find(h => h.toUpperCase() === 'NAMA_LENGKAP') || fileHeaders[3] || fileHeaders[1] || '',
          kelas: autoMap.kelas || fileHeaders.find(h => h.toUpperCase() === 'KELAS') || fileHeaders[4] || fileHeaders[2] || '',
          rombel: autoMap.rombel || fileHeaders.find(h => h.toUpperCase() === 'ROMBEL') || '',
          tglLahir: autoMap.tglLahir || '', // Optional fallback handled server-side
          lulus: autoMap.lulus || '', // Optional fallback handled server-side
        });
      }
    };

    reader.readAsArrayBuffer(selectedFile);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const fileType = e.dataTransfer.files[0].name.split('.').pop()?.toLowerCase();
      if (fileType === 'xlsx' || fileType === 'xls' || fileType === 'csv') {
        processFile(e.dataTransfer.files[0]);
      } else {
        alert('File tidak didukung! Pastikan file berupa .xlsx, .xls, atau .csv');
      }
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleMappingChange = (field: keyof ColumnMapping, val: string) => {
    setMapping(prev => ({ ...prev, [field]: val }));
  };

  const submitImport = async () => {
    if (!base64File) return;
    setLoading(true);

    try {
      const res = await fetch('/api/admin/siswa/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileData: base64File,
          mapping: mapping,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Terjadi kesalahan sistem saat mengimpor.');
      }

      const report = await res.json();
      setImportReport(report);
      onImportSuccess();
    } catch (e: any) {
      alert(e.message || 'Gagal mengimpor file.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6" id="import-excel-container">
      {/* Tombol Kembali */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#0D47A1] font-medium transition-colors"
        >
          <ChevronLeft className="w-5 h-5" /> Kembali Ke Tabel Siswa
        </button>
        <span className="text-xs text-gray-500 font-mono">IMPORT ENGINE V1.0</span>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-[#0D47A1] to-blue-700 p-6 text-white">
          <h2 className="text-xl font-bold font-serif">Impor Siswa massal via Excel</h2>
          <p className="text-xs text-blue-100 mt-1">Mengunggah file .xlsx / .xls untuk data kelulusan massal dengan pencocokan dinamik kolom.</p>
        </div>

        <div className="p-6 space-y-6">
          {/* UPLOAD BOX */}
          {!file && (
            <div
              id="drop-zone"
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-3 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
                dragActive
                  ? 'border-[#FFD54F] bg-amber-50/40 scale-98'
                  : 'border-blue-100 hover:border-blue-300 bg-gray-50/50 hover:bg-gray-50'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx,.xls,.csv"
                className="hidden"
              />
              <div className="p-4 bg-blue-50 text-[#0D47A1] rounded-full mb-4">
                <Upload className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700">Tarik dari folder atau Klik untuk Unggah</h3>
              <p className="text-xs text-gray-400 mt-1 max-w-sm">Mendukung file Excel format (.xlsx, .xls) atau (.csv). Baris pertama harus berisi judul kolom header.</p>
            </div>
          )}

          {/* PARSING AND MAPPING CONTROL */}
          {file && !importReport && (
            <div className="space-y-6 animate-fade-in" id="mapping-panels">
              {/* File Info */}
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-800 text-sm sm:text-base">{file.name}</h4>
                  <p className="text-xs text-gray-400">Ukuran file: {(file.size / 1024).toFixed(2)} KB | Terdeteksi {headers.length} headers</p>
                </div>
                <button
                  onClick={() => { setFile(null); setPreviewRows([]); setHeaders([]); }}
                  className="text-xs text-red-600 hover:text-red-800 font-medium cursor-pointer"
                >
                  Ganti File
                </button>
              </div>

              {/* MAPPING BOX */}
              <div className="border border-amber-200 bg-amber-50/40 rounded-xl p-5 shadow-sm transition-all duration-300 hover:shadow-md" id="mapping-inputs">
                <h3 className="text-sm font-bold text-amber-950 flex items-center gap-2 mb-3">
                  <TableProperties className="w-4 h-4 text-amber-500" />
                  Pencocokan Kolom Berkas Excel (Column Mapping)
                </h3>
                <p className="text-xs text-amber-800 mb-4 leading-relaxed">
                  Sesuaikan kolom dari file Excel Anda (<span className="font-mono bg-amber-100/60 px-1 py-0.5 rounded">[No NIK NISN NAMA KELAS ROMBEL]</span>) ke struktur data di bawah ini. Tanggal_Lahir dan Keterangan_Lulus dapat dialihkan menggunakan nilai default jika kolom tersebut tidak ada dalam file excel Anda.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                  {/* NISN Map */}
                  <div className="flex flex-col justify-between">
                    <label className="block text-xs font-bold text-gray-800 mb-1">
                      NISN (Wajib 10 Angka) <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={mapping.nisn}
                      onChange={(e) => handleMappingChange('nisn', e.target.value)}
                      className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">-- Pilih Kolom --</option>
                      {headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>

                  {/* Nama Map */}
                  <div className="flex flex-col justify-between">
                    <label className="block text-xs font-bold text-gray-800 mb-1">
                      Nama_Lengkap <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={mapping.nama}
                      onChange={(e) => handleMappingChange('nama', e.target.value)}
                      className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">-- Pilih Kolom --</option>
                      {headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>

                  {/* Kelas Map */}
                  <div className="flex flex-col justify-between">
                    <label className="block text-xs font-bold text-gray-800 mb-1">
                      Kelas_Rombel (Utama) <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={mapping.kelas}
                      onChange={(e) => handleMappingChange('kelas', e.target.value)}
                      className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">-- Pilih Kolom --</option>
                      {headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>

                  {/* ROMBEL Map (Opsional) */}
                  <div className="flex flex-col justify-between">
                    <label className="block text-xs font-bold text-gray-800 mb-1">
                      ROMBEL (Tambahan) <span className="text-gray-400 text-xxs font-normal">(Opsional)</span>
                    </label>
                    <select
                      value={mapping.rombel || ''}
                      onChange={(e) => handleMappingChange('rombel', e.target.value)}
                      className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">-- Tanpa Tambahan --</option>
                      {headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>

                  {/* TglLahir Map */}
                  <div className="flex flex-col justify-between">
                    <label className="block text-xs font-bold text-gray-800 mb-1">
                      Tanggal_Lahir <span className="text-gray-400 text-xxs font-normal">(Opsional)</span>
                    </label>
                    <select
                      value={mapping.tglLahir}
                      onChange={(e) => handleMappingChange('tglLahir', e.target.value)}
                      className="w-full text-xs p-2.5 bg-amber-50/50 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Default [2011-01-01]</option>
                      {headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>

                  {/* Lulus Map */}
                  <div className="flex flex-col justify-between">
                    <label className="block text-xs font-bold text-gray-800 mb-1">
                      Keterangan_Lulus <span className="text-gray-400 text-xxs font-normal">(Opsional)</span>
                    </label>
                    <select
                      value={mapping.lulus}
                      onChange={(e) => handleMappingChange('lulus', e.target.value)}
                      className="w-full text-xs p-2.5 bg-amber-50/50 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Default [Lulus]</option>
                      {headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* LIVE EXCEL PREVIEW */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-700">Pratinjau Data (Maks. 10 Baris Pertama)</h4>
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="min-w-full text-xs text-left text-gray-500" id="preview-mapped-table">
                    <thead className="text-xxs uppercase bg-gray-100 text-gray-700">
                      <tr>
                        {headers.map((h, idx) => (
                          <th key={idx} className="px-4 py-3 font-semibold border-b border-gray-200 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {previewRows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-gray-50/50">
                          {headers.map((col, cIdx) => {
                            let val = row[col];
                            if (val instanceof Date) {
                              val = val.toISOString().split('T')[0];
                            }
                            return <td key={cIdx} className="px-4 py-2.5 border-b border-gray-200 truncate max-w-xs">{val !== undefined ? String(val) : ''}</td>;
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SUBMIT BUTTON */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={submitImport}
                  disabled={loading || !mapping.nisn || !mapping.nama || !mapping.kelas}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#0D47A1] text-white hover:bg-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold rounded-lg shadow-sm transition-colors text-sm cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" /> Sedang Mengimpor Data Baru...
                    </>
                  ) : (
                    'Konfirmasi & Jalankan Impor'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* REPORT SUMMARY OUTPUT */}
          {importReport && (
            <div className="space-y-6 animate-fade-in" id="report-output-panel">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 border border-emerald-100 bg-emerald-50 bg-opacity-40 rounded-xl flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-emerald-900 font-bold">Impor Berhasil</h4>
                    <p className="text-3xl font-black text-emerald-700 mt-1">{importReport.successCount}</p>
                    <p className="text-xs text-emerald-600 mt-1 leading-relaxed">
                      Baris data berhasil dipasang/diperbarui di database siswa. Duplikasi NISN secara otomatis diperbarui (upsert).
                    </p>
                  </div>
                </div>

                <div className="p-5 border border-rose-100 bg-rose-50 bg-opacity-40 rounded-xl flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-rose-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-rose-900 font-bold">Impor Gagal</h4>
                    <p className="text-3xl font-black text-rose-700 mt-1">{importReport.failCount}</p>
                    <p className="text-xs text-rose-600 mt-1 leading-relaxed">
                      Baris data dilewati karena kesalahan format pengisian, NISN tidak valid, atau problem database.
                    </p>
                  </div>
                </div>
              </div>

              {/* REPORT FAIL TABLE */}
              {importReport.failures.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-rose-900">Rincian Baris yang Gagal Diimpor:</h4>
                  <div className="max-h-60 overflow-y-auto border border-rose-100 rounded-lg">
                    <table className="min-w-full text-xs text-left text-gray-500" id="report-fail-table">
                      <thead className="bg-rose-50 text-rose-900 font-bold">
                        <tr>
                          <th className="px-4 py-2.5 border-b border-rose-200">Baris Excel</th>
                          <th className="px-4 py-2.5 border-b border-rose-200">Nama Lengkap</th>
                          <th className="px-4 py-2.5 border-b border-rose-200">Alasan Penolakan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-rose-100">
                        {importReport.failures.map((fail, index) => (
                          <tr key={index} className="bg-white hover:bg-rose-50/20">
                            <td className="px-4 py-2.5 border-b border-rose-100 font-mono font-bold text-rose-700">Baris {fail.row}</td>
                            <td className="px-4 py-2.5 border-b border-rose-100 font-medium text-gray-800">{fail.nama}</td>
                            <td className="px-4 py-2.5 border-b border-rose-100 text-rose-600">{fail.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setBase64File('');
                    setHeaders([]);
                    setPreviewRows([]);
                    setImportReport(null);
                  }}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium cursor-pointer"
                >
                  Unggah File Lain
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
