# SENANDIKA — Tempat Kata-Kata yang Tak Sempat Terucap

Live: https://kromdhoni.github.io/senandika/

Situs publik read-only + mode admin (PIN) untuk menulis. Backend Cloudflare Workers + D1 + R2 menyusul di fase berikutnya.

## Jalankan

```bash
npm install
npm run dev
npm run build
```

## Mode admin

- Pengunjung hanya bisa **membaca**. Tombol Tulis/Ubah/Hapus muncul hanya setelah masuk sebagai admin.
- Masuk: buka halaman Pengaturan (atau "Masuk admin" di footer) → masukkan PIN.
- PIN diatur di `ADMIN_PIN` pada `src/lib/store.ts` (jangan tulis PIN di file ini karena repo bersifat publik).
- Batasan jujur: situs ini statis (GitHub Pages), jadi PIN hanya menghentikan pengunjung biasa — bukan keamanan tingkat server. Auth sungguhan butuh backend (lihat PRD).

## Menerbitkan tulisan agar dibaca semua orang

Data admin tersimpan di `localStorage` peramban admin. Agar tampil publik:

1. Di mode admin → Pengaturan → **Export file publikasi** (mengunduh `published.ts`).
2. Ganti isi `src/data/published.ts` di repo dengan file itu.
3. Commit + push ke `main` — GitHub Actions otomatis deploy ulang.

## Deploy

Otomatis via `.github/workflows/deploy-pages.yml` setiap push ke `main` (Settings → Pages → Source: GitHub Actions).
