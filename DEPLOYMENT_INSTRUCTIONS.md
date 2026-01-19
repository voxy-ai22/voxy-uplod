
# 🚀 Panduan Deploy LuminaLink ke Vercel

Aplikasi ini menggunakan **Vercel Blob Storage** untuk performa terbaik dan integrasi CDN langsung.

## Langkah-langkah:

### 1. Persiapkan Akun Vercel
Pastikan Anda memiliki akun di [vercel.com](https://vercel.com).

### 2. Inisialisasi Project Next.js / React
Jika Anda mendownload kode ini, pastikan strukturnya sesuai dengan Next.js App Router:
- Letakkan `App.tsx` dan logic lainnya di dalam folder `app/`.
- Letakkan API route di `app/api/upload/route.ts`.

### 3. Setup Vercel Blob Storage
1. Masuk ke **Vercel Dashboard**.
2. Pilih project Anda atau buat project baru.
3. Buka tab **Storage**.
4. Klik **Connect Database** > pilih **Blob**.
5. Ikuti langkahnya sampai Anda mendapatkan `BLOB_READ_WRITE_TOKEN`.
6. Vercel akan otomatis menambahkan Environment Variable ini ke project Anda.

### 4. Install Dependencies
Jalankan perintah berikut di terminal local jika Anda mengembangkan di VS Code:
```bash
npm install @vercel/blob lucide-react framer-motion clsx tailwind-merge
```

### 5. Deploy
Gunakan Vercel CLI atau hubungkan ke GitHub:
```bash
vercel deploy --prod
```

### 6. Catatan Penting
- **Ukuran File**: Limit default Vercel Blob Free Tier adalah 4.5MB per file. Validasi di `App.tsx` sudah diatur ke 5MB, namun pastikan akun Vercel Anda mendukung ukuran tersebut atau sesuaikan variabel `MAX_FILE_SIZE`.
- **Environment Variables**: Pastikan `BLOB_READ_WRITE_TOKEN` ada di tab Settings > Environment Variables di Dashboard Vercel jika belum otomatis terisi.

Aplikasi siap digunakan! 🎉
