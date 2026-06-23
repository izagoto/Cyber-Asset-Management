# Pusaka Siber (Cyber Asset Management Platform)

**Pusaka Siber** adalah aplikasi manajemen aset dan pelacakan peminjaman barang yang dirancang khusus untuk mencatat aset-aset di lingkungan Divisi Cyber Security serta mendokumentasikan peminjaman barang atau perangkat yang digunakan personel secara teratur, aman, dan efisien.

---

## 🚀 Fitur Utama (Implemented)

1. **Manajemen Inventaris Aset**: CRUD Aset lengkap (Admin) dengan data kategori, deskripsi, nomor seri unik, status dinamis (`AVAILABLE`, `BORROWED`, `MAINTENANCE`, `LOST`), serta ekspor data ke file CSV.
2. **Manajemen Pengguna (User Management)**: CRUD data pengguna (Admin/Supervisor/Staff) untuk Role-Based Access Control lengkap dengan informasi divisi kerja, email, password terenkripsi, dan kontak telepon.
3. **Dashboard Real-time & KPI**: Tampilan ringkasan statistik aset (total aset, peminjaman aktif, antrean persetujuan, overdue) beserta diagram persentase status aset dalam bentuk progress bar modern.
4. **Alur Pengajuan Peminjaman Interaktif**: Wizard multi-step (3 langkah) interaktif untuk memudahkan pengisian data peminjam, pemilihan perangkat yang tersedia, tanggal pinjam & kembali (dilengkapi _custom date picker_), dan review sebelum submit.
5. **Persetujuan & Pengembalian Aset (Admin Board)**: Antrean persetujuan (Approval Queue) bagi Admin untuk memproses pengajuan peminjaman (Approve/Reject), serta tabel peminjaman aktif untuk mencatat pengembalian (_Check-In_) secara instan.
6. **Deteksi & Peringatan Terlambat (Overdue)**: Otomatisasi pendeteksian aset yang terlambat dikembalikan dengan visualisasi kartu peringatan merah menyala pada dashboard Admin.
7. **Sistem Pencarian & Filter Kustom (Premium UI)**: Komponen _custom dropdown_ interaktif dengan filter kategori checkbox, kustomisasi jumlah baris data per halaman (entries limit), dan pencarian instan pada tabel aset, user, dan peminjaman.

---

## 🛠️ Tech Stack & Arsitektur

Sistem ini menggunakan arsitektur **Client-Server** dengan pembagian teknologi berikut:

### Backend

- **Framework**: FastAPI (Python) - Dokumentasi OpenAPI otomatis & performa tinggi.
- **Database**: SQLite3.
- **ORM**: SQLAlchemy 2.0 (Pendekatan `DeclarativeBase` & type-annotated).
- **Autentikasi**: **PASETO V4** (Platform-Agnostic Security Tokens) untuk session token yang lebih aman dari kerentanan JWT klasik.
- **Hashing Password**: Argon2id.
- **Migrasi Database**: Alembic.

### Frontend

- **Core**: React 19 (TypeScript) dengan bundler **Vite 8**.
- **UI & Styling**: Vanilla CSS & Tailwind CSS (v4) untuk desain antarmuka modern, gelap/terang terpadu.
- **Library UI**: Mantine Core (Hooks & Form Helpers), Lucide React (Icons).

---

## ⚙️ Cara Memulai & Menjalankan Proyek

### 1. Prasyarat

Pastikan Anda memiliki hal-hal berikut terinstal di sistem Anda:

- **Python 3.10+** (Direkomendasikan Python 3.12/3.14)
- **Node.js** (v18+) & **npm**

---

### 2. Konfigurasi & Menjalankan Backend

1. **Masuk ke folder backend**:

   ```bash
   cd backend
   ```

2. **Buat & Aktifkan Virtual Environment**:
   - Di macOS/Linux:
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```
   - Di Windows:
     ```bash
     python -m venv .venv
     .venv\Scripts\activate
     ```

3. **Instal Dependensi**:

   ```bash
   pip install -r requirements.txt
   ```

4. **Konfigurasi Environment Variables (`.env`)**:
   Sistem telah menyediakan file `.env` default untuk pengembangan lokal. Isi utama dari `.env` adalah:

   ```env
   APP_NAME=Cyber Asset Tracking
   APP_ENV=development
   DATABASE_URL=sqlite:///./asset_tracking.db
   PASETO_SECRET_KEY=0651bf3134cfa587199323e206c9d552226bff9cfe3ace2eb24da1d7ce583cd7
   ACCESS_TOKEN_EXPIRE_MINUTES=60
   ```

5. **Jalankan Aplikasi Backend**:
   Jalankan server pengembangan FastAPI dengan Uvicorn:

   ```bash
   uvicorn app.main:app --reload
   ```

   - _Catatan_: Saat pertama kali server dijalankan, Lifespan event FastAPI akan otomatis memanggil `seed_admin.py` untuk meregenerasi tabel database dan mengisi data akun Admin awal.

6. **Akses Dokumentasi API (Swagger / OpenAPI)**:
   Buka browser dan akses: `http://127.0.0.1:8000/docs`

#### Data Akun Default (Seeder)

- **Email Admin**: `cyber@local.com`
- **Password**: `bond123!`
- **Role**: `ADMIN`

---

### 3. Konfigurasi & Menjalankan Frontend

1. **Masuk ke folder frontend**:

   ```bash
   cd ../frontend
   ```

2. **Instal Dependensi Node.js**:

   ```bash
   npm install
   ```

3. **Jalankan Server Frontend**:

   ```bash
   npm run dev
   ```

4. **Akses Aplikasi**:
   Buka browser dan buka alamat: `http://localhost:5173`

