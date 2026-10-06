# SENANDIKA — Tempat Kata-Kata yang Tak Sempat Terucap

MVP frontend lokal (local-first). Backend Cloudflare Workers + D1 + R2 menyusul di fase berikutnya.

## Jalankan

```bash
npm install
npm run dev
npm run build
```

## Scope MVP ini

- Landing, Dashboard, Senandika, Editor + autosave/draft, Kenangan, Timeline, Favorit, Pencarian, Pengaturan
- Dark mode, responsive mobile-first, autosave indikator Menyimpan… / Tersimpan
- Data tersimpan di `localStorage` (`senandika.v1`). Private by default.
- Export per-tulisan (.md) + backup semua data (.json)

## Berikutnya (belum di MVP ini)

Auth, Cloudflare Workers API, D1, R2 upload foto, full-text search server, PWA, Time Capsule, Memory Book, AI companion.
