import type { Entry, Memory } from "../types";

const KEY = "senandika.v1";
const THEME_KEY = "senandika.theme";

interface Persisted {
  entries: Entry[];
  memories: Memory[];
}

const seed: Persisted = {
  entries: [
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
  ],
  memories: [
    {
      id: "mem-1",
      title: "Hari ketika semuanya berubah",
      story: "Hari ketika aku menjadi seorang Ayah.",
      memoryDate: "2022-08-27",
      location: "Rumah",
      createdAt: "2022-08-27T10:00:00.000Z",
    },
  ],
};

export function load(): Persisted {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      localStorage.setItem(KEY, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw) as Persisted;
  } catch {
    return seed;
  }
}

export function save(data: Persisted) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

export function getTheme(): "light" | "dark" {
  const v = localStorage.getItem(THEME_KEY);
  return v === "dark" ? "dark" : "light";
}

export function setTheme(v: "light" | "dark") {
  localStorage.setItem(THEME_KEY, v);
  document.documentElement.classList.toggle("dark", v === "dark");
}

export function toMarkdownEntry(e: Entry) {
  return `# ${e.title}\n\nUntuk: ${e.recipient}\nJenis: ${e.type}\nMood: ${e.mood || "-"}\nTanggal: ${new Date(
    e.createdAt,
  ).toLocaleDateString("id-ID")}\nTag: ${e.tags.join(", ") || "-"}\n\n${e.content}\n`;
}

export function download(filename: string, text: string, mime = "text/plain") {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
