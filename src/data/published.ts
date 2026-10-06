import type { Entry, Memory } from "../types";

/**
 * Konten publik: inilah yang dibaca semua pengunjung situs.
 * Admin menulis lewat mode admin di browser, lalu mengekspor
 * "file publikasi" dan mengganti file ini agar tulisan tampil
 * untuk semua orang setelah deploy ulang.
 */
export const PUBLISHED_ENTRIES: Entry[] = [
  {
    id: "seed-1",
    title: "Untuk Ibu, tentang rumah",
    content:
      "Ibu,\n\nTernyata aku baru mengerti betapa berat perjuanganmu. Rumah yang dulu terasa sempit, kini terasa jauh. Aku ingin pulang.\n\nTerima kasih sudah bertahan untukku.",
    recipient: "Ibu",
    type: "LETTER",
    mood: "Rindu",
    tags: ["rumah", "pulang"],
    isFavorite: true,
    isPrivate: true,
    status: "saved",
    createdAt: "2026-10-02T10:00:00.000Z",
    updatedAt: "2026-10-02T10:00:00.000Z",
  },
];

export const PUBLISHED_MEMORIES: Memory[] = [
  {
    id: "mem-1",
    title: "Hari ketika semuanya berubah",
    story: "Hari ketika aku menjadi seorang Ayah.",
    memoryDate: "2022-08-27",
    location: "Rumah",
    createdAt: "2022-08-27T10:00:00.000Z",
  },
];
