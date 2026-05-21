import React, { useState, useEffect } from 'react';
import { Siswa } from '../types';
import { Search, ToggleLeft, ToggleRight, Trash2, Plus, UserPlus, Filter, RefreshCw, X, Download, Upload } from 'lucide-react';

interface SiswaTableProps {
  onGoToImport: () => void;
  refreshTrigger: number;
  onRefreshStats: () => void;
}

export default function SiswaTable({ onGoToImport, refreshTrigger, onRefreshStats }: SiswaTableProps) {
  const [siswa, setSiswa] = useState<Siswa[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorSiswa, setErrorSiswa] = useState('');
  const [search, setSearch] = useState('');
  const [kelas, setKelas] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [daftarKelas, setDaftarKelas] = useState<string[]>([]);
  const [localRefresh, setLocalRefresh] = useState(0);

  // Form tambah siswa manual modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    nisn: '',
    nama: '',
    kelas: '',
    tglLahir: '',
    lulus: true,
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSiswa();
  }, [page, search, kelas, status, localRefresh, refreshTrigger]);

  const fetchSiswa = async () => {
    setLoading(true);
    setErrorSiswa('');
    try {
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: '20',
        search: search,
        kelas: kelas,
        status: status,
      });

      const res = await fetch(`/api/admin/siswa?${queryParams.toString()}`);
      if (!res.ok) {
        let errorMsg = 'Gagal mengambil data siswa.';
        try {
          const errData = await res.json();
          if (errData && errData.error) {
            errorMsg = errData.error;
          }
        } catch (_) {}
        throw new Error(errorMsg);
      }
      const result = await res.json();
      setSiswa(result.data);
      setTotalPages(result.pagination.totalPages || 1);
      setTotalItems(result.pagination.total || 0);
      setDaftarKelas(result.daftarKelas || []);
    } catch (e: any) {
      console.error(e);
      setErrorSiswa(e.message || 'Gagal mengambil data siswa.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLulus = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/siswa/toggle/${id}`, {
        method: 'PUT',
      });
      if (res.ok) {
        setLocalRefresh(prev => prev + 1);
        onRefreshStats();
      } else {
        alert('Gagal mengubah status kelulusan.');
      }
    } catch (e) {
      alert('Terjadi kesalahan sistem.');
    }
  };

  const handleDeleteSiswa = async (id: number, nama: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus siswa bernama "${nama}"? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/siswa/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setLocalRefresh(prev => prev + 1);
        onRefreshStats();
      } else {
        alert('Gagal menghapus data siswa.');
      }
    } catch (e) {
      alert('Terjadi kesalahan sistem.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddSiswaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    if (!formData.nisn || !formData.nama || !formData.kelas || !formData.tglLahir) {
      setFormError('Harap lengkapi semua bidang formulir.');
      setSubmitting(false);
      return;
    }

    if (formData.nisn.length !== 10 || isNaN(Number(formData.nisn))) {
      setFormError('NISN harus berisi tepat 10 digit angka.');
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/siswa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const responseData = await res.json();
      if (!res.ok) {
        throw new Error(responseData.error || 'Gagal menambahkan data siswa.');
      }

      setShowAddModal(false);
      setFormData({ nisn: '', nama: '', kelas: '', tglLahir: '', lulus: true });
      setLocalRefresh(prev => prev + 1);
      onRefreshStats();
    } catch (e: any) {
      setFormError(e.message || 'Terjadi kesalahan sistem.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4" id="siswa-table-controller-container">
      {/* FILTER & CONTROL PANEL */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <h3 className="font-bold text-gray-800 flex items-center gap-2 font-serif text-base sm:text-lg">
            <Filter className="w-5 h-5 text-[#0D47A1]" />
            Daftar Kontrol Data Siswa ({totalItems} Siswa)
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            {/* Export data */}
            <a
              href="/api/admin/siswa/export"
              target="_blank"
              rel="referrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" /> Export Excel
            </a>
            {/* Import Button */}
            <button
              onClick={onGoToImport}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4" /> Import Excel
            </button>
            {/* Tambah Manual */}
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#0D47A1] hover:bg-blue-800 text-white rounded text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-[#FFD54F]" /> Tambah Manual
            </button>
          </div>
        </div>

        {/* INPUT PENCARIAN & FILTER DROPDOWN */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3" id="filters">
          <div className="sm:col-span-6 relative">
            <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari berdasarkan nama lengkap atau NISN..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 pr-4 py-2 w-full border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-[#0D47A1]"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={kelas}
              onChange={(e) => { setKelas(e.target.value); setPage(1); }}
              className="w-full py-2 px-3 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Semua Kelas</option>
              {daftarKelas.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="w-full py-2 px-3 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Semua Status</option>
              <option value="lulus">Lulus</option>
              <option value="tidak">Tidak Lulus</option>
            </select>
          </div>
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden" id="siswa-data-table">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-left text-sm text-gray-500">
            <thead className="bg-[#0D47A1] text-xs text-[#FFD54F] font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3 border-b border-blue-900 border-opacity-10 w-16">No</th>
                <th className="px-5 py-3 border-b border-blue-900 border-opacity-10">NISN</th>
                <th className="px-5 py-3 border-b border-blue-900 border-opacity-10">Nama Siswa</th>
                <th className="px-5 py-3 border-b border-blue-900 border-opacity-10">Kelas</th>
                <th className="px-5 py-3 border-b border-blue-900 border-opacity-10">Tgl Lahir</th>
                <th className="px-5 py-3 border-b border-blue-900 border-opacity-10 text-center">Status Kelulusan</th>
                <th className="px-5 py-3 border-b border-blue-900 border-opacity-10 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-gray-400 font-medium">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#0D47A1] mb-2" />
                    Sedang menarik data dari database...
                  </td>
                </tr>
              ) : errorSiswa ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-red-500 font-medium bg-red-50/20">
                    <p className="mb-2 font-bold text-red-650 text-sm">⚠️ Gagal menarik data siswa dari server</p>
                    <p className="text-xs text-gray-600 bg-red-100/60 p-3 rounded-lg max-w-lg mx-auto border border-red-200 leading-relaxed font-mono select-all">
                      {errorSiswa}
                    </p>
                    <button
                      type="button"
                      onClick={fetchSiswa}
                      className="block mt-4 text-xs bg-[#0D47A1] font-semibold text-[#FFD54F] px-4 py-2 rounded-lg mx-auto hover:bg-blue-800 transition-colors shadow-sm cursor-pointer"
                    >
                      Segarkan & Coba Lagi
                    </button>
                  </td>
                </tr>
              ) : siswa.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-gray-400 font-medium">
                    Tidak ada data siswa yang cocok dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                siswa.map((item, index) => {
                  const noUrut = (page - 1) * 20 + index + 1;
                  const bdDate = new Date(item.tglLahir);
                  const formattedDate = !isNaN(bdDate.getTime()) 
                    ? bdDate.toISOString().split('T')[0]
                    : item.tglLahir;

                  return (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3.5 border-b border-gray-100 font-mono font-semibold text-gray-700">{noUrut}</td>
                      <td className="px-5 py-3.5 border-b border-gray-100 font-mono text-gray-600">{item.nisn}</td>
                      <td className="px-5 py-3.5 border-b border-gray-100 font-semibold text-gray-800">{item.nama}</td>
                      <td className="px-5 py-3.5 border-b border-gray-100 font-medium text-gray-600">{item.kelas}</td>
                      <td className="px-5 py-3.5 border-b border-gray-100 font-mono text-gray-505 text-xs">{formattedDate}</td>
                      <td className="px-5 py-3.5 border-b border-gray-100 text-center">
                        <button
                          onClick={() => handleToggleLulus(item.id)}
                          className="inline-flex items-center gap-1.5 focus:outline-none focus:ring-0 cursor-pointer"
                          title="Klik untuk mengubah status kelulusan"
                        >
                          {item.lulus ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-full">
                              <ToggleRight className="w-4 h-4 text-emerald-600" />
                              LULUS
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold rounded-full">
                              <ToggleLeft className="w-4 h-4 text-rose-600" />
                              TIDAK LULUS
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="px-5 py-3.5 border-b border-gray-100 text-center">
                        <button
                          onClick={() => handleDeleteSiswa(item.id, item.nama)}
                          className="p-1.5 bg-rose-50 border border-rose-100 hover:bg-rose-100 hover:text-rose-800 text-rose-600 rounded-lg transition-colors cursor-pointer"
                          title="Hapus data siswa"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION footer */}
        {totalPages > 1 && (
          <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between" id="pagination-controls">
            <span className="text-xs text-gray-500">
              Menampilkan halaman <strong className="text-gray-700">{page}</strong> dari <strong className="text-gray-700">{totalPages}</strong> ({totalItems} total siswa)
            </span>
            <div className="inline-flex gap-1">
              <button
                disabled={page === 1}
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                className="px-3 py-1.5 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 text-xs font-medium text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Sebelumnya
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                className="px-3 py-1.5 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 text-xs font-medium text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL MANUAL REGISTER FORM */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-30 backdrop-blur-xxs flex items-center justify-center p-4" id="add-siswa-modal">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-md overflow-hidden animate-fade-in">
            {/* Modal Header */}
            <div className="bg-[#0D47A1] text-white p-4 flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2 font-serif text-sm sm:text-base">
                <Plus className="w-5 h-5 text-[#FFD54F]" />
                Tambah Siswa Manual
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-white hover:text-[#FFD54F] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleAddSiswaSubmit} className="p-5 space-y-4 text-sm text-gray-600">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded text-xs font-medium leading-relaxed">
                  {formError}
                </div>
              )}

              {/* NISN */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  NISN (Wajib 10 Digit Angka) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nisn"
                  required
                  maxLength={10}
                  placeholder="Contoh: 0108924367"
                  value={formData.nisn}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>

              {/* Nama */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nama Lengkap Siswa <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nama"
                  required
                  placeholder="Contoh: ADITYA SAPUTRA"
                  value={formData.nama}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 uppercase"
                />
              </div>

              {/* Kelas */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Kelas Rombel <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="kelas"
                  required
                  placeholder="Contoh: IX-A atau IX-B"
                  value={formData.kelas}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Tanggal Lahir (YYYY-MM-DD or date selector) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Tanggal Lahir <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="tglLahir"
                  required
                  value={formData.tglLahir}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>

              {/* Lulus status checkbox */}
              <div className="flex items-center gap-2 pt-1.5">
                <input
                  type="checkbox"
                  id="modal-lulus"
                  checked={formData.lulus}
                  onChange={(e) => setFormData(prev => ({ ...prev, lulus: e.target.checked }))}
                  className="h-4 w-4 text-[#0D47A1] focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                />
                <label htmlFor="modal-lulus" className="text-xs font-bold text-gray-700 cursor-pointer select-none">
                  Siswa Dinyatakan LULUS
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#0D47A1] hover:bg-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg text-xs cursor-pointer inline-flex items-center gap-1"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Siswa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
