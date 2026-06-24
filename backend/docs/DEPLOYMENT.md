# Panduan Deployment di Server Ubuntu

Panduan ini menjelaskan langkah demi langkah untuk melakukan *deployment* (perilisan) aplikasi **Inventaris Siber** (FastAPI Backend & React Frontend) ke sebuah Virtual Private Server (VPS) bersistem operasi Ubuntu 20.04 / 22.04 / 24.04.

Arsitektur deployment yang akan kita gunakan:
- **Nginx**: Sebagai *Web Server* untuk menyajikan file statis React dan sebagai *Reverse Proxy* untuk meneruskan trafik API ke backend.
- **Systemd**: Sebagai *Process Manager* untuk memastikan backend FastAPI berjalan terus-menerus di latar belakang (*background*).
- **SQLite**: Database bawaan.

---

## Tahap 1: Persiapan Server

Masuk (*SSH*) ke server Ubuntu Anda dan jalankan pembaruan sistem dasar serta instalasi dependensi utama:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3 python3-pip python3-venv nginx curl git
```

Install Node.js (Versi 20 LTS):
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

---

## Tahap 2: Clone Repository

Salin (*clone*) kode sumber aplikasi ke dalam direktori `/var/www/`.

```bash
cd /var/www
sudo git clone https://github.com/USERNAME_ANDA/asset-management-app.git inventaris-siber
# Berikan hak akses kepada user Anda saat ini (misal: ubuntu)
sudo chown -R $USER:$USER /var/www/inventaris-siber
cd /var/www/inventaris-siber
```

---

## Tahap 3: Setup Backend (FastAPI)

1. **Masuk ke folder backend & Buat Virtual Environment:**
   ```bash
   cd /var/www/inventaris-siber/backend
   python3 -m venv .venv
   source .venv/bin/activate
   ```

2. **Install Dependensi Python:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Konfigurasi Environment:**
   Buat file `.env` untuk production.
   ```bash
   nano .env
   ```
   *Isi dengan:*
   ```env
   APP_NAME=Inventaris Siber
   APP_ENV=production
   DATABASE_URL=sqlite:///./asset_tracking.db
   # Ganti secret key dengan kunci acak yang sangat rahasia!
   PASETO_SECRET_KEY=ganti_dengan_kunci_rahasia_anda_yang_sangat_panjang_sekali
   ACCESS_TOKEN_EXPIRE_MINUTES=60
   ```

4. **Jalankan Seeder Database Pertama Kali:**
   ```bash
   python seed_admin.py
   ```

5. **Membuat Systemd Service untuk Backend:**
   Keluar dari virtual environment (`deactivate`). Kita akan membuat service agar backend tetap hidup meskipun kita menutup terminal.
   ```bash
   sudo nano /etc/systemd/system/fastapi.service
   ```
   *Isi dengan konfigurasi berikut (Ganti `ubuntu` dengan username server Anda jika berbeda):*
   ```ini
   [Unit]
   Description=Gunicorn instance to serve FastAPI
   After=network.target

   [Service]
   User=ubuntu
   Group=www-data
   WorkingDirectory=/var/www/inventaris-siber/backend
   Environment="PATH=/var/www/inventaris-siber/backend/.venv/bin"
   # Menjalankan Uvicorn di port 8000
   ExecStart=/var/www/inventaris-siber/backend/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000

   [Install]
   WantedBy=multi-user.target
   ```

6. **Nyalakan & Jalankan Service Backend:**
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl start fastapi
   sudo systemctl enable fastapi
   ```
   *(Cek statusnya dengan `sudo systemctl status fastapi`)*

---

## Tahap 4: Setup Frontend (React/Vite)

Karena React adalah aplikasi Single Page Application (SPA), kita perlu mem-*build* kodenya menjadi HTML/CSS statis.

1. **Masuk ke folder frontend & Install Dependensi:**
   ```bash
   cd /var/www/inventaris-siber/frontend
   npm install
   ```

2. **Konfigurasi API URL (axios.ts):**
   Hapus konfigurasi `baseURL` yang *hardcoded* (misal `http://127.0.0.1:8000`) di dalam file `src/api/axios.ts` agar *frontend* secara otomatis mengikuti domain/IP server saat ini (yang akan ditangani oleh Reverse Proxy Nginx).
   ```typescript
   // src/api/axios.ts
   const api = axios.create({
     // baseURL tidak perlu diisi (dihapus)
     headers: { 'Content-Type': 'application/json' },
   });
   ```

3. **Cegah Tabrakan Rute (Route Collision) di vite.config.ts:**
   Secara *default*, Vite menaruh semua Javascript & CSS hasil *build* ke dalam folder `/assets/`. Karena di Nginx kita telah menjadikan `/assets` sebagai rute API Backend, kita wajib mengubah nama folder keluaran Vite (misalnya menjadi `static`) agar tidak tabrakan dan layar tidak menjadi putih polos. Buka `vite.config.ts` dan tambahkan `assetsDir`:
   ```typescript
   export default defineConfig({
     plugins: [react(), tailwindcss()],
     build: {
       assetsDir: 'static', // Ubah dari 'assets' menjadi 'static'
     }
   })
   ```

4. **Build Frontend:**
   Setelah kedua konfigurasi di atas disesuaikan, jalankan perintah kompilasi:
   ```bash
   npm run build
   ```
   *Setelah selesai, folder `dist` akan tercipta.*

---

## Tahap 5: Konfigurasi Web Server (Nginx)

Nginx akan menyajikan file hasil `build` React ke pengguna, dan mengarahkan lalu lintas API (`/api` atau jalur endpoint lainnya) ke Uvicorn (FastAPI) yang berjalan di port 8000.

1. **Buat file konfigurasi Nginx baru:**
   ```bash
   sudo nano /etc/nginx/sites-available/inventaris
   ```

2. **Isi dengan konfigurasi berikut (ganti `domainanda.com` dengan IP Server atau Domain Anda):**
   ```nginx
   server {
       listen 80;
       server_name domainanda.com 123.45.67.89; # Ganti dengan Domain atau IP Server

       # 1. Menyajikan Frontend React
       location / {
           root /var/www/inventaris-siber/frontend/dist;
           index index.html;
           # Penting untuk React Router agar tidak error 404 saat direfresh
           try_files $uri $uri/ /index.html;
       }

       # 2. Reverse Proxy untuk Backend FastAPI
       # Sesuaikan dengan prefix URL API Anda di Backend
       location /users { proxy_pass http://127.0.0.1:8000; }
       location /assets { proxy_pass http://127.0.0.1:8000; }
       location /loans { proxy_pass http://127.0.0.1:8000; }
       location /auth { proxy_pass http://127.0.0.1:8000; }
       location /stats { proxy_pass http://127.0.0.1:8000; }
       
       # (Opsional) Jika semua route backend disatukan menggunakan prefix /api di FastAPI
       # location /api/ {
       #     proxy_pass http://127.0.0.1:8000/;
       # }
   }
   ```

3. **Aktifkan Konfigurasi & Restart Nginx:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/inventaris /etc/nginx/sites-enabled/
   # Hapus konfigurasi default Nginx (opsional tapi disarankan)
   sudo rm /etc/nginx/sites-enabled/default
   
   sudo nginx -t
   sudo systemctl restart nginx
   ```

---

## Tahap 6 (Opsional): Instalasi SSL (HTTPS)

Untuk keamanan ekstra (sangat wajib untuk Cyber Security), instal SSL gratis dari Let's Encrypt menggunakan Certbot:

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d domainanda.com
```

Certbot akan otomatis memodifikasi konfigurasi Nginx Anda untuk menggunakan protokol HTTPS (Port 443).

---

## Selesai! 🎉
Aplikasi Anda sekarang dapat diakses melalui browser dengan mengunjungi IP Server atau nama domain Anda.
