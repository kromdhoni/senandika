export type EntryType = "LETTER" | "JOURNAL" | "MEMORY" | "PRAYER" | "NOTE" | "POEM";

export type Mood =
  | "Bahagia"
  | "Rindu"
  | "Sedih"
  | "Bersyukur"
  | "Tenang"
  | "Takut"
  | "Marah"
  | "Haru"
  | "Bingung"
  | "Berharap";

export type Recipient =
  | "Ayah"
  | "Ibu"
  | "Ayah & Ibu"
  | "Diriku"
  | "Keluarga"
  | "Seseorang"
  | "Lainnya";

export interface Entry {
  id: string;
  title: string;
  content: string;
  recipient: Recipient;
  type: EntryType;
  mood: Mood | "";
  tags: string[];
  isFavorite: boolean;
  isPrivate: boolean;
  status: "draft" | "saved";
  createdAt: string;
  updatedAt: string;
}

export interface Memory {
  id: string;
  title: string;
  story: string;
  memoryDate: string;
  location: string;
  createdAt: string;
}

export interface Capsule {
  id: string;
  title: string;
  message: string;
  openDate: string;
  createdAt: string;
}

export type View =
  | "landing"
  | "dashboard"
  | "senandika"
  | "tulis"
  | "baca"
  | "kenangan"
  | "timeline"
  | "favorit"
  | "kapsul"
  | "tentang"
  | "pengaturan";

export const RECIPIENTS: Recipient[] = [
  "Ayah",
  "Ibu",
  "Ayah & Ibu",
  "Diriku",
  "Keluarga",
  "Seseorang",
  "Lainnya",
];

export const MOODS: Mood[] = [
  "Bahagia",
  "Rindu",
  "Sedih",
  "Bersyukur",
  "Tenang",
  "Takut",
  "Marah",
  "Haru",
  "Bingung",
  "Berharap",
];

export const ENTRY_TYPES: { value: EntryType; label: string }[] = [
  { value: "LETTER", label: "Surat" },
  { value: "JOURNAL", label: "Jurnal" },
  { value: "MEMORY", label: "Kenangan" },
  { value: "PRAYER", label: "Doa" },
  { value: "POEM", label: "Puisi" },
  { value: "NOTE", label: "Catatan" },
];

export const ENTRY_TYPE_LABELS: Record<EntryType, string> = {
  LETTER: "Surat",
  JOURNAL: "Jurnal",
  MEMORY: "Kenangan",
  PRAYER: "Doa",
  POEM: "Puisi",
  NOTE: "Catatan",
};
