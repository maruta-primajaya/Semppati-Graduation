import React, { useState, useEffect } from 'react';
import { Siswa, Stats, ViewState } from './types';
import ConfettiEffect from './components/ConfettiEffect';
import SKLDownload from './components/SKLDownload';
import SiswaTable from './components/SiswaTable';
import ImportExcel from './components/ImportExcel';
import { Toaster, toast } from 'react-hot-toast';
import { 
  GraduationCap, 
  Search, 
  Lock, 
  LogOut, 
  Users, 
  Award, 
  Frown, 
  BarChart3, 
  MapPin, 
  Phone, 
  Globe, 
  Mail, 
  Calendar, 
  CheckCircle, 
  AlertTriangle 
} from 'lucide-react';

export default function App() {
  const [view, setView] = useState<ViewState>('home');
  const [searchNisn, setSearchNisn] = useState('');
  const [selectedSiswa, setSelectedSiswa] = useState<Siswa | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [checking, setChecking] = useState(false);
  const [searchError, setSearchError] = useState('');
  
  // Auth States
  const [adminAuthenticated, setAdminAuthenticated] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [logginIn, setLoggingIn] = useState(false);

  // Triggering tabular rerenders
  const [tableRefresh, setTableRefresh] = useState(0);

  // Load stats and auth on mount
  useEffect(() => {
    fetchStats();
    checkAuthSession();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/siswa/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error('Failed to load stats', e);
    }
  };

  const checkAuthSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          setAdminAuthenticated(true);
          setAdminUsername(data.username);
        }
      }
    } catch (e) {
      console.error('Failed authentication check', e);
    }
  };

  // Form handle checking kelulusan
  const handleCheckKelulusan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError('');
    
    // Client-side Validasi
    const sanitizedNisn = searchNisn.trim();
    if (!sanitizedNisn) {
      setSearchError('NISN tidak boleh kosong.');
      return;
    }

    if (sanitizedNisn.length !== 10 || isNaN(Number(sanitizedNisn))) {
      setSearchError('NISN tidak valid. Harus berisi tepat 10 digit angka.');
      return;
    }

    setChecking(true);

    // Imitasi delay 1.5 detik untuk loading skeleton premium
    setTimeout(async () => {
      try {
        const res = await fetch(`/api/siswa/cek?nisn=${sanitizedNisn}`);
        
        if (res.status === 404) {
          setSearchError('Data siswa tidak ditemukan. Silakan periksa kembali nomor NISN Anda.');
          setChecking(false);
          return;
        }

        if (!res.ok) {
          throw new Error('Gagal menghubungi server.');
        }

        const data: Siswa = await res.json();
        setSelectedSiswa(data);
        
        if (data.lulus) {
          setView('result-lulus');
          toast.success('Selamat! Anda Dinyatakan Lulus.');
        } else {
          setView('result-tidak');
          toast.error('Tetap Semangat! Jangan Putus Asa.');
        }
      } catch (err) {
        setSearchError('Terjadi kegagalan koneksi. Silakan coba beberapa saat lagi.');
      } finally {
        setChecking(false);
      }
    }, 1200);
  };

  // Handle Admin login
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login gagal.');
      }

      setAdminAuthenticated(true);
      setAdminUsername(data.username);
      setView('admin-dashboard');
      toast.success('Pintu login sukses! Selamat datang Admin.');
    } catch (err: any) {
      setLoginError(err.message || 'Kredensial salah.');
    } finally {
      setLoggingIn(false);
    }
  };

  // Handle Admin logout
  const handleAdminLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setAdminAuthenticated(false);
      setAdminUsername('');
      setView('home');
      toast.success('Berhasil keluar dari sesi admin.');
    } catch (e) {
      toast.error('Gagal memproses keluar.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0D47A1] text-white flex flex-col font-sans select-none relative overflow-x-hidden" id="applet-root">
      {/* Background Decor: Faded Year Watermark */}
      <div className="absolute -right-16 sm:-right-24 top-10 select-none pointer-events-none opacity-[0.03] font-serif text-[280px] sm:text-[450px] leading-none z-0">
        2026
      </div>

      {/* Side Color bar styling */}
      <div className="absolute left-0 top-1/3 -translate-y-1/2 w-1.5 h-32 bg-[#FFD54F] z-0 rounded-r-md"></div>

      {/* Decorative vector: dotted circle diagram */}
      <div className="absolute right-6 bottom-40 opacity-[0.05] pointer-events-none select-none z-0">
        <svg width="180" height="180" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="none" stroke="white" strokeWidth="0.5" strokeDasharray="3 5" />
          <circle cx="50" cy="50" r="38" fill="none" stroke="white" strokeWidth="0.5" />
        </svg>
      </div>

      {/* Toaster for premium push notifications */}
      <Toaster position="top-right" reverseOrder={false} />

      {/* HEADER / NAVIGATION BAR */}
      <header className="border-b border-white/10 bg-[#0D47A1]/85 backdrop-blur-md sticky top-0 z-40 shadow-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4" id="header-container-inner">
          <div className="flex items-center gap-4.5 cursor-pointer" onClick={() => setView('home')}>
            <div className="text-left flex flex-col justify-center">
              <h1 className="text-xl sm:text-2xl font-serif tracking-wide text-white leading-tight font-semibold">
                SMP NEGERI 43 SURABAYA
              </h1>
              <p className="text-[10px] sm:text-xs text-[#FFD54F] tracking-[0.14em] sm:tracking-[0.2em] font-semibold uppercase font-display mt-0.5">
                Cerdas, Berakhlak, Berprestasi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 z-10">
            {adminAuthenticated ? (
              <>
                <button
                  onClick={() => setView('admin-dashboard')}
                  className="px-4 py-2 text-xs font-bold bg-[#FFD54F] hover:bg-[#ffe082] text-blue-950 transition-all rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
                >
                  <BarChart3 className="w-3.5 h-3.5" /> Dashboard
                </button>
                <button
                  onClick={handleAdminLogout}
                  className="px-4 py-2 text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all rounded-xl flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
                >
                  <LogOut className="w-3.5 h-3.5" /> Keluar
                </button>
              </>
            ) : (
              view !== 'login' && (
                <button
                  onClick={() => setView('login')}
                  className="px-5 py-2.5 text-xs font-bold bg-white/10 hover:bg-white/20 text-[#FFD54F] border border-white/15 transition-all rounded-xl flex items-center gap-2 cursor-pointer shadow-md uppercase tracking-widest font-display"
                >
                  <Lock className="w-3.5 h-3.5" /> Area Admin
                </button>
              )
            )}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT PORTAL */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-6 py-10 z-10 relative">
        
        {/* 1. VIEW PORTAL UTAMA (PUBLIK) */}
        {view === 'home' && (
          <div className="space-y-14 animate-fade-in" id="public-view-layer">
            
            {/* HERO INTRODUCTION PANEL */}
            <div className="rounded-2xl max-w-4xl mx-auto text-center space-y-8 py-6 z-15 relative" id="hero-banner">
              <div className="space-y-4">
                <span className="inline-flex px-4.5 py-1.5 bg-white/10 text-[#FFD54F] border border-white/10 text-xxs font-black tracking-[0.2em] uppercase rounded-full font-display">
                  PENGUMUMAN RESMI KELULUSAN
                </span>
                
                <h2 className="text-4xl sm:text-6xl font-serif leading-tight font-normal text-white">
                  Pengumuman Kelulusan <br/>
                  <span className="text-[#FFD54F] font-serif italic">Tahun Pelajaran 2025/2026</span>
                </h2>
                
                <p className="text-sm sm:text-base text-white/80 max-w-xl mx-auto leading-relaxed">
                  Masukkan Nomor Induk Siswa Nasional (NISN) Anda untuk melihat status kelulusan resmi. 
                  Hasil yang ditampilkan bersifat final berdasarkan Keputusan Kepala Sekolah <strong>SMP Negeri 43 Surabaya</strong>.
                </p>
              </div>

              {/* FORM PENCARIAN NISN */}
              <form onSubmit={handleCheckKelulusan} className="bg-white p-2 rounded-2xl w-full max-w-lg mx-auto shadow-2xl flex flex-col sm:flex-row items-center gap-2 border border-[#FFD54F]/20" id="search-nisn-form">
                <div className="flex-1 flex items-center w-full px-3 md:px-4">
                  <div className="text-[#0D47A1] mr-3 opacity-50">
                    <Search className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    maxLength={10}
                    required
                    disabled={checking}
                    value={searchNisn}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setSearchNisn(val);
                    }}
                    placeholder="Masukkan 10 digit NISN Anda..."
                    className="w-full bg-transparent border-none-custom focus:outline-none focus:ring-0 text-[#0D47A1] font-semibold text-base sm:text-lg placeholder:text-slate-300 py-3 block border-0"
                    style={{ border: 'none', boxShadow: 'none', background: 'transparent' }}
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={checking || searchNisn.length !== 10}
                  className="w-full sm:w-auto bg-[#0D47A1] hover:bg-[#093170] disabled:bg-slate-200 disabled:text-slate-400 text-[#FFD54F] font-bold text-xs sm:text-sm px-6 sm:px-8 py-3.5 sm:py-4 rounded-[14px] tracking-widest transition-all uppercase whitespace-nowrap cursor-pointer hover:shadow-lg"
                >
                  {checking ? 'Memproses...' : 'PERIKSA HASIL'}
                </button>
              </form>

              {searchError && (
                <div className="max-w-md mx-auto animate-fade-in" id="error-message">
                  <p className="text-xs text-[#FFD54F] font-semibold bg-red-950/45 border border-red-900/50 p-3 rounded-xl">
                    ⚠️ {searchError}
                  </p>
                </div>
              )}
              
              <p className="text-xxs sm:text-xs opacity-50 uppercase tracking-[0.2em] font-display">Pastikan koneksi internet stabil saat pengecekan</p>
            </div>

            {/* SKELETON DISPLAY WHILE CHECKING */}
            {checking && (
              <div className="max-w-2xl mx-auto bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 shadow-2xl space-y-6" id="skeleton-loader">
                <div className="h-6 w-32 bg-white/15 rounded animate-skeleton"></div>
                <div className="space-y-3 pt-2">
                  <div className="h-4 w-full bg-white/15 rounded animate-skeleton"></div>
                  <div className="h-4 w-4/5 bg-white/15 rounded animate-skeleton"></div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="h-16 bg-white/10 rounded-lg animate-skeleton"></div>
                  <div className="h-16 bg-white/10 rounded-lg animate-skeleton"></div>
                </div>
              </div>
            )}

            {/* PUBLIC REAL-TIME STATISTICS COUNTERS */}
            {stats && (
              <div className="max-w-4xl mx-auto space-y-6" id="stats-container">
                <p className="text-[10px] sm:text-xs font-semibold text-white/50 tracking-[0.2em] text-center uppercase font-display">
                  Sistem Real-Time • Ringkasan Statistik Kelulusan Tahun 2026
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 border border-white/15 bg-black/15 backdrop-blur-md rounded-2xl overflow-hidden shadow-xl" id="stats-grid-items">
                  {/* Card Total */}
                  <div className="p-8 border-b sm:border-b-0 sm:border-r border-white/10 flex flex-col items-center justify-center text-center hover:bg-white/5 transition-colors">
                    <span className="text-4xl sm:text-5xl font-serif text-[#FFD54F] mb-1">{stats.totalSiswa}</span>
                    <span className="text-[10px] sm:text-xs uppercase tracking-[0.18em] opacity-70 font-display">Total Siswa</span>
                  </div>

                  {/* Card Lulus */}
                  <div className="p-8 border-b sm:border-b-0 sm:border-r border-white/10 flex flex-col items-center justify-center text-center hover:bg-white/5 transition-colors">
                    <span className="text-4xl sm:text-5xl font-serif text-[#FFD54F] mb-1">{stats.totalLulus}</span>
                    <span className="text-[10px] sm:text-xs uppercase tracking-[0.18em] text-emerald-300 font-display font-medium">Siswa Lulus</span>
                  </div>

                  {/* Card Persentase */}
                  <div className="p-8 flex flex-col items-center justify-center text-center hover:bg-white/5 transition-colors">
                    <span className="text-4xl sm:text-5xl font-serif text-[#FFD54F] mb-1">{stats.persentaseKelulusan}%</span>
                    <span className="text-[10px] sm:text-xs uppercase tracking-[0.18em] opacity-70 font-display">Tingkat Kelulusan</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. HALAMAN HASIL: LULUS */}
        {view === 'result-lulus' && selectedSiswa && (
          <div className="max-w-2xl mx-auto space-y-6 animate-fade-in relative" id="lulus-result-layer">
            <ConfettiEffect />

            <div className="bg-gradient-to-br from-emerald-600 to-teal-800 p-8 rounded-2xl text-white shadow-xl text-center space-y-5 border-4 border-[#FFD54F]/80 relative z-30" id="lulus-banner-card">
              <div className="mx-auto w-16 h-16 bg-white bg-opacity-20 flex items-center justify-center rounded-full border-2 border-[#FFD54F] animate-bounce">
                <Award className="w-9 h-9 text-[#FFD54F]" />
              </div>

              <div className="space-y-1">
                <span className="text-xxs tracking-widest text-[#FFD54F] font-extrabold uppercase">
                  HASIL KELULUSAN RESMI
                </span>
                <h2 className="text-3xl sm:text-4xl font-black font-serif-heading">Dinyatakan: LULUS!</h2>
              </div>

              <p className="text-sm font-medium text-emerald-100 max-w-md mx-auto leading-relaxed">
                "Selamat atas kelulusan Anda! Perjuangan, ketekunan, dan kerja keras Anda selama 3 tahun ini telah membuahkan hasil yang membanggakan."
              </p>
            </div>

            {/* DETAIL SISWA CARD */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden relative z-30" id="detail-siswa-card">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-700 text-sm tracking-wide uppercase">Identitas Lengkap Siswa</h3>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-650" id="student-attributes">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase">Nama Lengkap</p>
                  <p className="text-base font-bold text-gray-800 mt-0.5 uppercase">{selectedSiswa.nama}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase">Nomor NISN</p>
                  <p className="text-base font-mono font-bold text-gray-800 mt-0.5">{selectedSiswa.nisn}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase">Kelas Rombel</p>
                  <p className="text-base font-medium text-gray-700 mt-0.5">{selectedSiswa.kelas}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase">Tahun Pengumuman</p>
                  <p className="text-base font-medium text-gray-700 mt-0.5">2026/2026 (Sekarang)</p>
                </div>
              </div>
            </div>

            {/* DOWNLOAD TRIGGER ACTION */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-30 pt-4">
              <SKLDownload siswa={selectedSiswa} />
              
              <button
                onClick={() => { setSelectedSiswa(null); setView('home'); }}
                className="px-6 py-3 bg-[#FFD54F] hover:bg-[#ffe082] text-slate-900 font-bold rounded-xl text-sm sm:text-base cursor-pointer transition-all uppercase tracking-wide font-display shadow-md shrink-0 focus:outline-none"
              >
                Kembali Ke Homepage
              </button>
            </div>
          </div>
        )}

        {/* 3. HALAMAN HASIL: TIDAK LULUS */}
        {view === 'result-tidak' && selectedSiswa && (
          <div className="max-w-2xl mx-auto space-y-6 animate-fade-in relative z-20 font-sans" id="tidak-lulus-result-layer">
            
            <div className="bg-red-900/90 p-8 rounded-2xl text-white shadow-xl text-center space-y-5 border-4 border-[#FFD54F]/70 relative z-30" id="tidak-lulus-banner-card">
              <div className="mx-auto w-16 h-16 bg-white bg-opacity-10 flex items-center justify-center rounded-full border border-white/25">
                <Frown className="w-9 h-9 text-[#FFD54F]" />
              </div>

              <div className="space-y-1">
                <span className="text-xxs tracking-widest text-[#FFD54F] font-extrabold uppercase">Hasil Kriteria Kelulusan</span>
                <h2 className="text-2xl sm:text-3xl font-bold font-serif text-white">BELUM LULUS</h2>
              </div>

              <p className="text-sm text-red-100/90 leading-relaxed max-w-md mx-auto italic">
                "Jangan berkecil hati. Perjalanan Anda masih panjang, dan cobaan hari ini adalah proses pendewasaan diri untuk sukses yang lebih gemilang di hari esok."
              </p>
            </div>

            {/* DETAILS */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden relative z-30 text-slate-800" id="tidak-detail-siswa">
              <div className="bg-slate-50 px-6 py-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-750 text-xs tracking-wider uppercase font-display">Identitas Lengkap Siswa</h3>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase">Nama Lengkap</p>
                  <p className="text-base font-bold text-gray-800 mt-0.5 uppercase">{selectedSiswa.nama}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase">Nomor NISN</p>
                  <p className="text-base font-mono font-bold text-gray-800 mt-0.5">{selectedSiswa.nisn}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase">Kelas Rombel</p>
                  <p className="text-base font-medium text-gray-700 mt-0.5">{selectedSiswa.kelas}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase">Tahun Pelajaran</p>
                  <p className="text-base font-medium text-gray-700 mt-0.5">2025/2026</p>
                </div>
              </div>
            </div>

            {/* INFO KONTAK SEKOLAH */}
            <div className="bg-white p-6 sm:p-7 rounded-2xl border border-gray-100 shadow-xl space-y-4 text-slate-800 relative z-30" id="school-contact-card">
              <h3 className="font-bold text-[#0D47A1] text-sm tracking-wide uppercase flex items-center gap-2 font-display">
                <AlertTriangle className="w-5 h-5 text-amber-500" /> Layanan Konsultasi & Kontak Sekolah
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                Peserta didik yang dinyatakan Belum Lulus harap segera berkoordinasi dengan Guru Wali Kelas, Guru BK, atau Kepala Sekolah untuk bimbingan lebih lanjut dan pendaftaran program perbaikan atau kesetaraan.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-gray-600 border-t border-gray-100" id="social-school">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#0D47A1]" />
                  <span>Telepon: <strong className="text-gray-800">(031) 5345678</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#0D47A1]" />
                  <span>Email: <strong className="text-gray-800">info@smpn43surabaya.sch.id</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#0D47A1]" />
                  <span>Situs: <strong className="text-gray-800">smpn43surabaya.sch.id</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#0D47A1]" />
                  <span className="truncate">SMPN 43 Surabaya, Kec. Bubutan</span>
                </div>
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex justify-center">
              <button
                onClick={() => { setSelectedSiswa(null); setView('home'); }}
                className="px-6 py-2.5 bg-[#0D47A1] hover:bg-blue-800 text-white font-bold rounded-lg text-sm transition-colors cursor-pointer"
              >
                Kembali Ke Homepage
              </button>
            </div>
          </div>
        )}

        {/* 4. LOGIN FORM VIEW */}
        {view === 'login' && (
          <div className="max-w-md mx-auto py-10 animate-fade-in" id="login-form-container">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-[#0D47A1] p-6 text-center text-white space-y-2">
                <div className="mx-auto w-12 h-12 bg-white bg-opacity-15 flex items-center justify-center rounded-full border border-amber-300">
                  <Lock className="w-5 h-5 text-amber-300" />
                </div>
                <h2 className="text-xl font-bold font-serif">Akses Kontrol Admin</h2>
                <p className="text-xs text-blue-105 opacity-80">Gunakan akun admin terdaftar untuk mengolah database siswa.</p>
              </div>

              <form onSubmit={handleAdminLogin} className="p-6 space-y-4 text-sm text-gray-550" id="login-inputs-form">
                {loginError && (
                  <div className="p-3 bg-red-50 border border-red-100 text-red-700 text-xs font-semibold rounded leading-relaxed">
                    ⚠️ {loginError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Username Admin</label>
                  <input
                    type="text"
                    required
                    placeholder="Masukkan username..."
                    value={loginForm.username}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-lg text-gray-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Password Sesi</label>
                  <input
                    type="password"
                    required
                    placeholder="Masukkan password..."
                    value={loginForm.password}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-lg text-gray-800"
                  />
                </div>

                <div className="pt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setView('home')}
                    className="w-1/2 py-2.5 text-center border border-gray-250 hover:bg-gray-50 rounded-lg font-semibold text-gray-600 transition-colors cursor-pointer"
                  >
                    Kembali
                  </button>
                  <button
                    type="submit"
                    disabled={logginIn}
                    className="w-1/2 py-2.5 text-center bg-[#0D47A1] hover:bg-blue-800 text-white font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
                  >
                    {logginIn ? 'Memproses...' : 'Kunci Masuk'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 5. ADMIN AREA PANEL - DASHBOARD */}
        {view === 'admin-dashboard' && adminAuthenticated && (
          <div className="space-y-6 animate-fade-in" id="admin-panel-container">
            
            {/* ADMIN SUMMARY CARDS GRID & SIMPLE BAR CHART */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* SUB CONTAINER BOX STATS */}
              <div className="lg:col-span-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4" id="admin-stats-box">
                <h3 className="font-bold text-gray-800 text-sm tracking-wide uppercase font-serif border-b border-gray-100 pb-2 flex items-center justify-between">
                  <span>Ringkasan Dashboard</span>
                  <span className="text-xxs px-2 py-0.5 bg-blue-50 text-blue-800 font-sans border border-blue-100 rounded-full">REALTIME</span>
                </h3>

                {stats ? (
                  <div className="space-y-4 text-xs">
                    <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                      <span className="text-gray-500 font-medium">Siswa Terdaftar :</span>
                      <strong className="text-base text-gray-800">{stats.totalSiswa} orang</strong>
                    </div>
                    <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                      <span className="text-gray-500 font-medium">Siswa Lulus :</span>
                      <strong className="text-base text-emerald-700">{stats.totalLulus} orang</strong>
                    </div>
                    <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                      <span className="text-gray-500 font-medium">Siswa Tidak Lulus :</span>
                      <strong className="text-base text-rose-700">{stats.totalTidakLulus} orang</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 font-medium font-bold">Rasio Kelulusan :</span>
                      <strong className="text-[#0D47A1] text-lg font-black">{stats.persentaseKelulusan}%</strong>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">Loading statistik...</p>
                )}
              </div>

              {/* BAR CHART DISPLAY PORT (CSS ONLY) */}
              <div className="lg:col-span-8 bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4" id="bar-chart-visualizer">
                <h3 className="font-bold text-gray-800 text-sm tracking-wide uppercase font-serif border-b border-gray-100 pb-2 flex items-center gap-1.5">
                  <BarChart3 className="w-5 h-5 text-amber-500" />
                  Grafik Visual Pembanding Kelulusan (%)
                </h3>

                {stats ? (
                  <div className="space-y-5 pt-2">
                    {/* Bar LULUS */}
                    <div className="space-y-1.5 text-xs text-gray-600">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold flex items-center gap-1.5 text-emerald-700">
                          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block"></span>
                          Status Lulus
                        </span>
                        <span className="font-mono">{stats.persentaseKelulusan}% ({stats.totalLulus} Siswa)</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-4.5 overflow-hidden border border-gray-250">
                        <div 
                          className="bg-emerald-500 h-full rounded-full transition-all duration-1000 ease-out border-r border-emerald-600"
                          style={{ width: `${stats.persentaseKelulusan}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Bar TIDAK LULUS */}
                    <div className="space-y-1.5 text-xs text-gray-600">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold flex items-center gap-1.5 text-rose-700">
                          <span className="w-2.5 h-2.5 bg-rose-500 rounded-full inline-block"></span>
                          Status Belum Lulus
                        </span>
                        <span className="font-mono">
                          {stats.totalSiswa > 0 
                            ? (100 - stats.persentaseKelulusan).toFixed(2)
                            : 0}% ({stats.totalTidakLulus} Siswa)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-4.5 overflow-hidden border border-gray-250">
                        <div 
                          className="bg-rose-500 h-full rounded-full transition-all duration-1000 ease-out border-r border-rose-600"
                          style={{ 
                            width: `${stats.totalSiswa > 0 
                              ? (100 - stats.persentaseKelulusan) 
                              : 0}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">Loading charts...</p>
                )}
              </div>
            </div>

            {/* TABEL SISWA MANAJEMEN */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <SiswaTable 
                onGoToImport={() => setView('admin-import')} 
                refreshTrigger={tableRefresh}
                onRefreshStats={() => {
                  fetchStats();
                  setTableRefresh(prev => prev + 1);
                }}
              />
            </div>
          </div>
        )}

        {/* 6. ADMIN AREA PANEL - IMPORT EXCEL */}
        {view === 'admin-import' && adminAuthenticated && (
          <div className="max-w-4xl mx-auto animate-fade-in" id="import-excel-layer">
            <ImportExcel 
              onBack={() => setView('admin-dashboard')}
              onImportSuccess={() => {
                fetchStats();
                setTableRefresh(prev => prev + 1);
              }}
            />
          </div>
        )}

      </main>

      {/* PORTAL FOOTER DETAILS */}
      <footer className="grid grid-cols-2 border-t border-white/10 bg-black/15 backdrop-blur-md mt-16 z-10 relative">
        <div className="p-6 sm:p-8 border-r border-white/10 flex flex-col items-center justify-center text-center font-display">
          <span className="text-2xl sm:text-3xl font-serif text-[#FFD54F] mb-1">Mei 2026</span>
          <span className="text-[9px] sm:text-[10px] uppercase tracking-widest opacity-60 font-semibold">Waktu Pengumuman</span>
        </div>
        <div className="p-6 sm:p-8 flex flex-col items-center justify-center text-center font-display">
          <div className="flex items-center gap-2 mb-2 justify-center">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            <span className="text-[9px] sm:text-[10px] uppercase tracking-widest opacity-70 font-semibold text-emerald-400">Server Online</span>
          </div>
          <span className="text-[10px] opacity-45">SMPN 43 Surabaya • Stable Build</span>
        </div>
      </footer>
    </div>
  );
}
