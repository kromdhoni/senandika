export type EntryType = "LETTER" | "JOURNAL" | "MEMORY" | "PRAYER" | "NOTE";

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

export type View =
  | "landing"
  | "dashboard"
  | "senandika"
  | "tulis"
  | "baca"
  | "kenangan"
  | "timeline"
  | "favorit"
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
  { value: "NOTE", label: "Catatan" },
];
