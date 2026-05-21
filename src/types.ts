export interface Siswa {
  id: number;
  nisn: string;
  nama: string;
  kelas: string;
  tglLahir: string; // ISO String
  lulus: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Stats {
  totalSiswa: number;
  totalLulus: number;
  totalTidakLulus: number;
  persentaseKelulusan: number;
}

export type ViewState = 'home' | 'result-lulus' | 'result-tidak' | 'login' | 'admin-dashboard' | 'admin-import';

export interface ColumnMapping {
  nisn: string;
  nama: string;
  kelas: string;
  rombel?: string;
  tglLahir: string;
  lulus: string;
}

export interface ImportPreviewRow {
  [key: string]: any;
}
