import { PUBLISHED_ENTRIES, PUBLISHED_MEMORIES } from "../data/published";
import type { Entry, Memory } from "../types";

/**
 * PIN admin — gerbang tulisan di situs statis (GitHub Pages).
 * Catatan jujur: PIN ini ada di kode frontend sehingga hanya
 * menghentikan pengunjung biasa, bukan serangan sungguhan.
 * Auth sesungguhnya butuh backend (Workers + D1, lihat PRD).
 * Ganti PIN ini lalu deploy ulang untuk menggantinya.
 */
export const ADMIN_PIN = "Oyisam21";

const KEY = "senandika.v2";
const THEME_KEY = "senandika.theme";
const ADMIN_KEY = "senandika.admin";

interface Persisted {
  entries: Entry[];
  memories: Memory[];
}

function freshCopy(): Persisted {
  return {
    entries: JSON.parse(JSON.stringify(PUBLISHED_ENTRIES)) as Entry[],
    memories: JSON.parse(JSON.stringify(PUBLISHED_MEMORIES)) as Memory[],
  };
}

export function load(): Persisted {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const fresh = freshCopy();
      localStorage.setItem(KEY, JSON.stringify(fresh));
      return fresh;
    }
    return JSON.parse(raw) as Persisted;
  } catch {
    return freshCopy();
  }
}

export function save(data: Persisted) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function resetToPublished(): Persisted {
  const fresh = freshCopy();
  localStorage.setItem(KEY, JSON.stringify(fresh));
  return fresh;
}

export function isAdmin(): boolean {
  try {
    return sessionStorage.getItem(ADMIN_KEY) === "1";
  } catch {
    return false;
  }
}

export function adminLogin(pin: string): boolean {
  if (pin === ADMIN_PIN) {
    try {
      sessionStorage.setItem(ADMIN_KEY, "1");
    } catch {
      /* abaikan */
    }
    return true;
  }
  return false;
}

export function adminLogout() {
  try {
    sessionStorage.removeItem(ADMIN_KEY);
  } catch {
    /* abaikan */
  }
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

/** Hasilkan isi src/data/published.ts agar tulisan admin tampil publik. */
export function toPublishedTs(entries: Entry[], memories: Memory[]) {
  const header = `import type { Entry, Memory } from "../types";\n\n/**\n * Konten publik: inilah yang dibaca semua pengunjung situs.\n * Admin menulis lewat mode admin di browser, lalu mengekspor\n * "file publikasi" dan mengganti file ini agar tulisan tampil\n * untuk semua orang setelah deploy ulang.\n */\n`;
  return (
    header +
    `export const PUBLISHED_ENTRIES: Entry[] = ${JSON.stringify(entries, null, 2)};\n\n` +
    `export const PUBLISHED_MEMORIES: Memory[] = ${JSON.stringify(memories, null, 2)};\n`
  );
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
