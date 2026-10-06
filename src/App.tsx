import { useEffect, useMemo, useRef, useState } from "react";
import {
  ENTRY_TYPES,
  ENTRY_TYPE_LABELS,
  MOODS,
  RECIPIENTS,
  type Entry,
  type EntryType,
  type Memory,
  type Mood,
  type Recipient,
  type View,
} from "./types";
import { GAYA_PUISI } from "./data/gaya";
import Reveal from "./components/Reveal";
import Waves from "./components/Waves";
import {
  adminLogin,
  adminLogout,
  download,
  getTheme,
  isAdmin,
  load,
  resetToPublished,
  save,
  setTheme,
  toPublishedTs,
  uid,
} from "./lib/store";

const MOOD_COLORS: Record<string, string> = {
  Bahagia: "#D9A441",
  Rindu: "#B88A72",
  Sedih: "#7C8DA6",
  Bersyukur: "#7FB069",
  Tenang: "#8FB8B5",
  Takut: "#9B8AC4",
  Marah: "#C96F5A",
  Haru: "#D48BB0",
  Bingung: "#A9A19C",
  Berharap: "#6FA8DC",
};

const TYPE_COVER: Record<EntryType, string> = {
  LETTER: "linear-gradient(120deg, #7d9069, #b08762)",
  JOURNAL: "linear-gradient(120deg, #b08762, #7d9069)",
  MEMORY: "linear-gradient(120deg, #7d9069, #4c5b43)",
  PRAYER: "linear-gradient(120deg, #b08762, #d9b48f)",
  POEM: "linear-gradient(120deg, #8c7770, #b08762)",
  NOTE: "linear-gradient(120deg, #b4aba0, #7d9069)",
};

const emptyDraft = (): Entry => ({
  id: uid("e"),
  title: "",
  content: "",
  recipient: "Ibu",
  type: "LETTER",
  mood: "",
  tags: [],
  isFavorite: false,
  isPrivate: true,
  status: "draft",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

function useSenandika() {
  const [entries, setEntries] = useState<Entry[]>(() => load().entries);
  const [memories, setMemories] = useState<Memory[]>(() => load().memories);
  useEffect(() => {
    save({ entries, memories });
  }, [entries, memories]);
  return { entries, setEntries, memories, setMemories };
}

function MoodTag({ mood }: { mood: string }) {
  if (!mood) return null;
  return (
    <span className="chip">
      <span className="mood-dot" style={{ background: MOOD_COLORS[mood] ?? "var(--accent)" }} />
      {mood}
    </span>
  );
}

export default function App() {
  const { entries, setEntries, memories, setMemories } = useSenandika();
  const [view, setView] = useState<View>("landing");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Entry>(emptyDraft);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [query, setQuery] = useState("");
  const [theme, setThemeState] = useState<"light" | "dark">(getTheme());
  const [admin, setAdmin] = useState(isAdmin());
  const [immersive, setImmersive] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    setTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (view !== "tulis" || !admin) return;
    setSaveState("saving");
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setEntries((prev) => {
        const exists = prev.some((e) => e.id === draft.id);
        const next = { ...draft, updatedAt: new Date().toISOString() };
        return exists
          ? prev.map((e) => (e.id === draft.id ? next : e))
          : [next, ...prev];
      });
      setSaveState("saved");
    }, 800);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [draft, view, admin, setEntries]);

  const active = useMemo(
    () => entries.find((e) => e.id === activeId) ?? null,
    [entries, activeId],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries
      .filter((e) => {
        if (!q) return true;
        return [e.title, e.content, e.recipient, e.mood, e.tags.join(" ")]
          .join(" ")
          .toLowerCase()
          .includes(q);
      })
      .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
  }, [entries, query]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { Ayah: 0, Ibu: 0, Diriku: 0 };
    for (const e of entries) {
      if (e.recipient === "Ayah") c.Ayah += 1;
      else if (e.recipient === "Ibu") c.Ibu += 1;
      else if (e.recipient === "Diriku") c.Diriku += 1;
    }
    return c;
  }, [entries]);

  function openNew(preset?: EntryType) {
    if (!admin) return;
    if (!preset) {
      setSheetOpen(true);
      return;
    }
    setSheetOpen(false);
    setDraft({ ...emptyDraft(), type: preset });
    setSaveState("idle");
    setView("tulis");
  }

  function openEdit(e: Entry) {
    if (!admin) return;
    setDraft({ ...e });
    setSaveState("idle");
    setView("tulis");
  }

  function finishWriting() {
    if (!admin) return;
    setEntries((prev) =>
      prev.map((e) =>
        e.id === draft.id ? { ...draft, status: "saved", updatedAt: new Date().toISOString() } : e,
      ),
    );
    setActiveId(draft.id);
    setView("baca");
  }

  function removeEntry(id: string) {
    if (!admin) return;
    if (!window.confirm("Hapus tulisan ini?\n\nSetelah dihapus, tulisan ini tidak dapat dikembalikan.")) return;
    setEntries((prev) => prev.filter((e) => e.id !== id));
    if (activeId === id) setActiveId(null);
    setView("senandika");
  }

  function toggleFav(id: string) {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, isFavorite: !e.isFavorite } : e)));
  }

  function handleReset() {
    if (!admin) return;
    if (!window.confirm("Kembalikan ke konten publikasi? Perubahan lokal yang belum dipublikasikan akan hilang.")) return;
    const fresh = resetToPublished();
    setEntries(fresh.entries);
    setMemories(fresh.memories);
  }

  function entryUrl(id: string) {
    return `${window.location.origin}${window.location.pathname}#/baca/${id}`;
  }

  function openEntry(id: string, full = false) {
    setActiveId(id);
    setView("baca");
    setImmersive(full);
    try {
      window.history.replaceState(null, "", `#/baca/${id}`);
    } catch {
      /* abaikan */
    }
  }

  useEffect(() => {
    const applyHash = () => {
      const m = window.location.hash.match(/^#\/baca\/([\w-]+)/);
      if (!m) return;
      const exists = load().entries.some((e) => e.id === m[1]);
      if (!exists) return;
      setActiveId(m[1]);
      setView("baca");
      setImmersive(true);
    };
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, []);

  useEffect(() => {
    if (view !== "baca") {
      setImmersive(false);
      try {
        if (window.location.hash.startsWith("#/baca/")) {
          window.history.replaceState(null, "", window.location.pathname);
        }
      } catch {
        /* abaikan */
      }
    }
  }, [view]);

  const nav: { id: View; label: string }[] = [
    { id: "dashboard", label: "Beranda" },
    { id: "senandika", label: "Senandika" },
    { id: "kenangan", label: "Kenangan" },
    { id: "timeline", label: "Timeline" },
  ];

  const sortedAll = useMemo(
    () => [...entries].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)),
    [entries],
  );
  const activeIndex = active ? sortedAll.findIndex((e) => e.id === active.id) : -1;
  const newerEntry = activeIndex > 0 ? sortedAll[activeIndex - 1] : null;
  const olderEntry = activeIndex >= 0 && activeIndex < sortedAll.length - 1 ? sortedAll[activeIndex + 1] : null;

  const favList = filtered.filter((e) => e.isFavorite);

  const marqueeLines = useMemo(
    () => entries.filter((e) => e.type === "POEM").slice(0, 8).map((e) => e.content.split("\n")[0]),
    [entries],
  );

  if (view === "baca" && active && immersive) {
    return (
      <div className="min-h-screen">
        <Waves />
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-4">
          <button onClick={() => setImmersive(false)} className="btn-ghost px-4 py-2 text-sm">
            ← Kembali
          </button>
          <span className="font-display text-sm opacity-70">
            Senandika<span style={{ color: "var(--accent)" }}>.</span>
          </span>
        </div>
        <article key={active.id} className="fade-in mx-auto max-w-2xl px-5 pb-20 pt-4">
          <p className="flex flex-wrap items-center justify-center gap-2 text-center text-xs uppercase tracking-widest opacity-60">
            {ENTRY_TYPE_LABELS[active.type]} · Untuk {active.recipient} <MoodTag mood={active.mood} />
          </p>
          <h1 className="font-display mt-3 text-center text-4xl font-medium md:text-5xl">
            {active.title || "Tanpa judul"}
          </h1>
          <p className="mt-3 text-center text-sm opacity-60">
            {new Date(active.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
            {active.tags.length > 0 && ` · ${active.tags.join(" · ")}`}
          </p>
          <div className="divider-orn my-8" aria-hidden="true"><span>✦</span></div>
          <div className="prose-read dropcap whitespace-pre-wrap">{active.content}</div>
          <div className="divider-orn my-8" aria-hidden="true"><span>✦</span></div>
          <div className="flex justify-center">
            <SharePanel entry={active} url={entryUrl(active.id)} />
          </div>
          <nav className="mt-10 flex items-center justify-between gap-3 text-sm" aria-label="Tulisan lain">
            {newerEntry ? (
              <button onClick={() => openEntry(newerEntry.id, true)} className="btn-ghost px-4 py-2">
                ← Lebih baru
              </button>
            ) : <span />}
            {olderEntry ? (
              <button onClick={() => openEntry(olderEntry.id, true)} className="btn-ghost px-4 py-2">
                Lebih lama →
              </button>
            ) : <span />}
          </nav>
        </article>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Waves />
      <header className="sticky top-0 z-10 border-b backdrop-blur" style={{ background: "color-mix(in srgb, var(--bg) 86%, transparent)", borderColor: "color-mix(in srgb, var(--muted) 25%, transparent)" }}>
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <button onClick={() => setView("landing")} className="font-display text-lg font-semibold uppercase tracking-[0.24em]" aria-label="Senandika beranda">
            Senandika
          </button>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Navigasi utama">
            {nav.map((n) => (
              <button
                key={n.id}
                onClick={() => setView(n.id)}
                className={`rounded-full px-4 py-2 text-xs uppercase tracking-[0.18em] ${view === n.id ? "font-semibold underline underline-offset-8" : "opacity-70 hover:opacity-100"}`}
              >
                {n.label}
              </button>
            ))}
            <button onClick={() => setThemeState(theme === "dark" ? "light" : "dark")} className="btn-ghost ml-2 px-4 py-2 text-sm" aria-label="Alih tema">
              {theme === "dark" ? "Terang" : "Gelap"}
            </button>
            {admin && (
              <button onClick={() => openNew()} className="btn-primary ml-2 px-5 py-2 text-sm">
                + Tulis
              </button>
            )}
          </nav>
          {admin ? (
            <button onClick={() => openNew()} className="btn-primary px-4 py-2 text-sm md:hidden">
              + Tulis
            </button>
          ) : (
            <button onClick={() => setView("senandika")} className="btn-ghost px-4 py-2 text-sm md:hidden">
              Baca
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-28 pt-8 md:pb-16">
        {view === "landing" && (
          <section className="fade-in mx-auto max-w-5xl py-10 md:py-16">
            <div className="grid items-center gap-10 md:grid-cols-2">
              <div className="text-center md:text-left">
                <p className="eyebrow">Ruang personal · privat · tenang</p>
                <h1 className="font-display mt-4 text-4xl font-medium md:text-6xl">
                  Ada kata yang belum sempat <span className="accent-word">terucap.</span>
                </h1>
                <p className="mx-auto mt-5 max-w-xl text-lg opacity-80 md:mx-0">
                  Senandika adalah rumah bagi surat, kenangan, dan doa — ditulis dengan tenang, disimpan dengan kasih.
                </p>
                <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row md:justify-start sm:justify-center">
                  <button onClick={() => setView("senandika")} className="btn-primary">Mulai Membaca →</button>
                  <button onClick={() => setView("dashboard")} className="btn-ghost">Lihat Isinya</button>
                </div>
                <p className="mt-8 hidden items-center gap-2 text-xs opacity-50 md:flex" aria-hidden="true">
                  <span className="inline-block h-8 w-5 rounded-full border" style={{ borderColor: "var(--line)" }} />
                  Gulir untuk menjelajah
                </p>
              </div>
              <div className="relative mx-auto w-full max-w-sm px-6 pb-8 pt-4">
                <div className="arch absolute inset-0" aria-hidden="true" />
                <svg className="absolute -left-2 bottom-6 w-24 opacity-80" viewBox="0 0 100 140" fill="none" stroke="var(--leaf)" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M50 130 C50 90 50 50 50 12" />
                  <ellipse cx="34" cy="100" rx="14" ry="6" transform="rotate(-30 34 100)" fill="var(--leaf)" opacity="0.35" stroke="none" />
                  <ellipse cx="66" cy="82" rx="14" ry="6" transform="rotate(30 66 82)" fill="var(--leaf)" opacity="0.35" stroke="none" />
                  <ellipse cx="34" cy="62" rx="14" ry="6" transform="rotate(-30 34 62)" fill="var(--leaf)" opacity="0.35" stroke="none" />
                  <ellipse cx="66" cy="42" rx="12" ry="5" transform="rotate(30 66 42)" fill="var(--leaf)" opacity="0.35" stroke="none" />
                  <circle cx="50" cy="12" r="4" fill="var(--accent)" stroke="none" />
                </svg>
                <div className="polaroid float-soft relative p-6 pt-9">
                  <span className="tape" aria-hidden="true" />
                  <p className="font-quote text-xl italic">
                    “Beberapa hal tidak harus dikatakan, cukup dituliskan.”
                  </p>
                  <p className="mt-3 text-xs uppercase tracking-[0.2em] opacity-50">Senandika · catatan hari ini</p>
                </div>
              </div>
            </div>

            {marqueeLines.length > 0 && (
              <div className="marquee mt-12" aria-label="Larik-larik puisi berjalan">
                <div className="marquee-track">
                  {[0, 1].map((copy) => (
                    <div key={copy} className="flex shrink-0 items-center gap-8 pr-8" aria-hidden={copy === 1}>
                      {marqueeLines.map((line) => (
                        <span key={`${copy}-${line}`} className="font-display flex items-center gap-8 text-lg italic opacity-70">
                          {line} <span style={{ color: "var(--accent)" }}>✦</span>
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {entries[0] && (
              <button onClick={() => openEntry(entries[0].id)} className="card card-lift hero-frame float-soft mx-auto mt-14 block max-w-xl p-7 text-left">
                <span className="quote-mark" aria-hidden="true">“</span>
                <span className="font-display -mt-6 block text-2xl">{entries[0].title || "Tanpa judul"}</span>
                <span className="mt-2 block text-sm opacity-70">
                  {entries[0].content.slice(0, 140)}{entries[0].content.length > 140 ? "…" : ""}
                </span>
                <span className="mt-4 flex items-center gap-2">
                  <MoodTag mood={entries[0].mood} />
                  <span className="text-xs opacity-60">Untuk {entries[0].recipient}</span>
                </span>
              </button>
            )}

            <Reveal className="mt-14">
            <div className="stagger grid gap-4 text-left sm:grid-cols-2" style={{ ["--i" as string]: 0 }}>
              {[
                ["Surat", "Ditulis untuk seseorang, meskipun tidak pernah dikirim."],
                ["Kenangan", "Cerita dan momen yang tidak ingin dilupakan."],
                ["Doa", "Harapan yang dititipkan pada waktu."],
                ["Timeline", "Perjalanan cerita, dirangkai berdasarkan waktu."],
              ].map(([t, d], i) => (
                <div key={t} className="card card-lift p-5" style={{ ["--i" as string]: i }}>
                  <h3 className="font-display text-lg font-semibold">{t}</h3>
                  <p className="mt-1 text-sm opacity-75">{d}</p>
                </div>
              ))}
            </div>
            </Reveal>

            <Reveal>
            <figure className="mx-auto mt-14 max-w-xl">
              <blockquote className="font-display text-xl italic opacity-80 md:text-2xl">
                “Tidak semua perasaan harus dikirim. Beberapa cukup dituliskan agar tidak hilang.”
              </blockquote>
              <div className="divider-orn mt-6" aria-hidden="true"><span>✦</span></div>
            </figure>
            </Reveal>
          </section>
        )}

        {view === "dashboard" && (
          <section className="fade-in mx-auto max-w-3xl">
            <p className="eyebrow">Beranda</p>
            <h2 className="font-display mt-2 text-3xl font-medium md:text-4xl">
              {admin ? "Selamat datang kembali." : "Selamat datang di Senandika."}
            </h2>
            <p className="mt-2 opacity-75">
              {admin ? "Hari ini, apa yang ingin kamu ceritakan?" : "Kumpulan tulisan dan kenangan pilihan pemilik rumah ini."}
            </p>
            {admin && <button onClick={() => openNew()} className="btn-primary mt-5">+ Tulis Senandika</button>}
            <div className="card card-lift mt-8 p-6">
              <h3 className="eyebrow">Senandika terbaru</h3>
              {entries[0] ? (
                <button
                  className="mt-3 block w-full text-left"
                  onClick={() => openEntry(entries[0].id)}
                >
                  <span className="font-display text-2xl">“{entries[0].title || "Tanpa judul"}”</span>
                  <span className="mt-2 flex flex-wrap items-center gap-2 text-sm opacity-70">
                    {new Date(entries[0].updatedAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                    <span>· Untuk {entries[0].recipient}</span>
                    <MoodTag mood={entries[0].mood} />
                  </span>
                </button>
              ) : (
                <p className="mt-2 opacity-70">Belum ada cerita di sini.</p>
              )}
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <button onClick={() => setView("kenangan")} className="card card-lift p-6 text-left">
                <h3 className="eyebrow">Kenangan</h3>
                <p className="font-display mt-2 text-3xl">{memories.length} <span className="text-lg opacity-60">cerita</span></p>
              </button>
              <div className="card p-6">
                <h3 className="eyebrow">Ditujukan kepada</h3>
                <p className="mt-2 flex flex-wrap gap-2 text-sm">
                  <span className="chip">Ayah · {counts.Ayah}</span>
                  <span className="chip">Ibu · {counts.Ibu}</span>
                  <span className="chip">Diriku · {counts.Diriku}</span>
                </p>
              </div>
            </div>
          </section>
        )}

        {(view === "senandika" || view === "favorit") && (
          <section className="fade-in mx-auto max-w-3xl">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="eyebrow">{view === "favorit" ? "Penanda pribadi" : "Koleksi"}</p>
                <h2 className="font-display mt-1 text-3xl font-medium md:text-4xl">{view === "favorit" ? "Favorit" : "Senandika"}</h2>
              </div>
              {admin && (
                <button onClick={() => openNew()} className="btn-primary hidden px-5 py-2 text-sm sm:block">+ Tulis</button>
              )}
            </div>
            <p className="mt-2 text-sm opacity-70">
              {view === "favorit"
                ? "Tulisan yang kamu tandai di peramban ini."
                : admin
                  ? "Cari cerita, kenangan, atau kata yang pernah kamu tulis."
                  : "Cari cerita, kenangan, atau kata yang pernah tertulis di sini."}
            </p>
            <input
              className="input mt-4"
              placeholder='Cari "ibu"'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Pencarian tulisan"
            />
            <div className="stagger mt-6 grid gap-3">
              {(view === "favorit" ? favList : filtered).map((e, i) => (
                <article key={e.id} className="card card-lift overflow-hidden" style={{ ["--i" as string]: Math.min(i, 6) }}>
                  <div className="cover-band" style={{ background: TYPE_COVER[e.type] }} aria-hidden="true" />
                  <div className="p-5">
                  <button className="block w-full text-left" onClick={() => openEntry(e.id)}>
                    <span className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-widest opacity-60">
                      {ENTRY_TYPE_LABELS[e.type]} · Untuk {e.recipient} <MoodTag mood={e.mood} />
                    </span>
                    <span className="font-display mt-1 block text-xl">{e.title || "Tanpa judul"}</span>
                    <span className="mt-1 block text-sm opacity-70">{e.content.slice(0, 120)}{e.content.length > 120 ? "…" : ""}</span>
                  </button>
                  <div className="mt-3 flex gap-3 text-sm">
                    <button onClick={() => toggleFav(e.id)} className="underline underline-offset-4" aria-label="Tandai favorit">
                      {e.isFavorite ? "★ Favorit" : "☆ Tandai"}
                    </button>
                    {admin && <button onClick={() => openEdit(e)} className="underline underline-offset-4">Ubah</button>}
                  </div>
                  </div>
                </article>
              ))}
              {(view === "favorit" ? favList : filtered).length === 0 && (
                <div className="card p-8 text-center">
                  <p className="font-display text-xl">Belum ada cerita di sini.</p>
                  <p className="mt-1 text-sm opacity-70">
                    {admin ? "Mungkin ada sesuatu yang ingin kamu tuliskan hari ini." : "Koleksi ini masih disiapkan pemiliknya. Kembali lagi nanti."}
                  </p>
                  {admin && <button onClick={() => openNew()} className="btn-primary mt-4">Mulai Menulis</button>}
                </div>
              )}
            </div>
          </section>
        )}

        {view === "tulis" && !admin && (
          <section className="fade-in mx-auto max-w-xl text-center">
            <p className="font-display text-2xl">Ruang menulis hanya untuk admin.</p>
            <p className="mt-2 text-sm opacity-70">Masuk sebagai admin untuk menulis di Senandika.</p>
            <button onClick={() => setView("pengaturan")} className="btn-primary mt-5">Ke halaman admin</button>
          </section>
        )}

        {view === "tulis" && admin && (
          <section className="fade-in mx-auto max-w-3xl">
            <p className="text-sm opacity-60" role="status">
              {saveState === "saving" ? "Menyimpan…" : saveState === "saved" ? "Tersimpan. Tulisan ini masih menjadi rahasia kecilmu." : "Tuliskan apa yang ingin kamu katakan."}
            </p>
            <input
              className="font-display input mt-3 !border-0 !bg-transparent px-0 text-3xl font-medium"
              placeholder="Judul tulisan…"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              aria-label="Judul"
            />
            <div className="mt-2 grid gap-3 sm:grid-cols-3">
              <label className="text-sm">Penerima
                <select className="input mt-1" value={draft.recipient} onChange={(e) => setDraft({ ...draft, recipient: e.target.value as Recipient })}>
                  {RECIPIENTS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </label>
              <label className="text-sm">Jenis
                <select className="input mt-1" value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as EntryType })}>
                  {ENTRY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </label>
              <label className="text-sm">Mood
                <select className="input mt-1" value={draft.mood} onChange={(e) => setDraft({ ...draft, mood: e.target.value as Mood | "" })}>
                  <option value="">—</option>
                  {MOODS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </label>
            </div>
            <textarea
              className="input prose-read mt-4 min-h-[320px]"
              placeholder={draft.type === "POEM" ? "tulis dengan huruf kecil…\nbiarkan satu kata berat\nberdiri sendiri." : "Tuliskan di sini…"}
              value={draft.content}
              onChange={(e) => setDraft({ ...draft, content: e.target.value })}
              aria-label="Isi tulisan"
            />
            {draft.type === "POEM" && (
              <details className="card mt-3 p-5 text-sm">
                <summary className="font-display cursor-pointer text-lg">{GAYA_PUISI.judul} — referensi gayamu</summary>
                <p className="mt-2 opacity-75">{GAYA_PUISI.ringkasan}</p>
                <ul className="mt-3 list-disc space-y-1 pl-5 opacity-85">
                  {GAYA_PUISI.ciri.map((c) => <li key={c}>{c}</li>)}
                </ul>
                <p className="mt-3 font-semibold">Anjuran</p>
                <ul className="mt-1 list-disc space-y-1 pl-5 opacity-85">
                  {GAYA_PUISI.anjuran.map((a) => <li key={a}>{a}</li>)}
                </ul>
                <p className="mt-3 font-semibold">Hindari</p>
                <ul className="mt-1 list-disc space-y-1 pl-5 opacity-85">
                  {GAYA_PUISI.hindari.map((h) => <li key={h}>{h}</li>)}
                </ul>
              </details>
            )}
            <input
              className="input mt-3"
              placeholder="Tag, pisahkan dengan koma. Contoh: rumah, rindu"
              value={draft.tags.join(", ")}
              onChange={(e) => setDraft({ ...draft, tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })}
              aria-label="Tag"
            />
            <div className="mt-5 flex flex-wrap gap-3">
              <button onClick={finishWriting} className="btn-primary" disabled={!draft.title.trim() && !draft.content.trim()}>
                Simpan
              </button>
              <button onClick={() => setView("senandika")} className="btn-ghost">Kembali</button>
            </div>
          </section>
        )}

        {view === "baca" && active && (
          <article className="fade-in mx-auto max-w-3xl">
            <p className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-widest opacity-60">
              {ENTRY_TYPE_LABELS[active.type]} · Untuk {active.recipient} <MoodTag mood={active.mood} />
            </p>
            <h2 className="font-display mt-2 text-4xl font-medium md:text-5xl">{active.title || "Tanpa judul"}</h2>
            <p className="mt-3 text-sm opacity-60">
              {new Date(active.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
              {active.tags.length > 0 && ` · ${active.tags.join(" · ")}`}
            </p>
            <div className="divider-orn my-6" aria-hidden="true"><span>✦</span></div>
            <div className="prose-read dropcap whitespace-pre-wrap">{active.content}</div>
            <div className="mt-8 flex flex-wrap items-center gap-2">
              <SharePanel entry={active} url={entryUrl(active.id)} />
              <button onClick={() => setImmersive(true)} className="btn-ghost text-sm">Layar penuh</button>
              <button onClick={() => toggleFav(active.id)} className="btn-ghost text-sm">{active.isFavorite ? "★ Favorit" : "☆ Jadikan favorit"}</button>
              {admin && <button onClick={() => openEdit(active)} className="btn-ghost text-sm">Ubah</button>}
              {admin && <button onClick={() => removeEntry(active.id)} className="btn-ghost text-sm">Hapus</button>}
            </div>
          </article>
        )}

        {view === "baca" && !active && (
          <section className="fade-in mx-auto max-w-xl py-16 text-center">
            <p className="font-display text-2xl">Tulisan tidak ditemukan.</p>
            <p className="mt-2 text-sm opacity-70">Mungkin tautannya sudah berubah. Mari kembali membaca yang lain.</p>
            <button onClick={() => setView("senandika")} className="btn-primary mt-5">Lihat Senandika</button>
          </section>
        )}

        {view === "kenangan" && (
          <section className="fade-in mx-auto max-w-3xl">
            <p className="eyebrow">Arsip momen</p>
            <h2 className="font-display mt-1 text-3xl font-medium md:text-4xl">Kenangan</h2>
            <p className="mt-2 text-sm opacity-70">Cerita dan momen yang tidak ingin dilupakan.</p>
            {admin && <MemoryForm onAdd={(m) => setMemories((p) => [m, ...p])} />}
            <div className="stagger mt-6 grid gap-4 sm:grid-cols-2">
              {memories.map((m, i) => (
                <div key={m.id} className="card card-lift overflow-hidden" style={{ ["--i" as string]: Math.min(i, 6) }}>
                  <div className="h-1.5" style={{ background: "linear-gradient(to right, var(--accent), transparent)" }} />
                  <div className="p-5">
                    <p className="text-xs uppercase tracking-widest opacity-60">{m.memoryDate} {m.location ? `· ${m.location}` : ""}</p>
                    <h3 className="font-display mt-1 text-xl">{m.title}</h3>
                    <p className="mt-1 text-sm opacity-80">{m.story}</p>
                    {admin && <button onClick={() => setMemories((p) => p.filter((x) => x.id !== m.id))} className="mt-3 text-sm underline underline-offset-4">Hapus</button>}
                  </div>
                </div>
              ))}
              {memories.length === 0 && (
                <p className="opacity-70 sm:col-span-2">
                  {admin ? "Belum ada kenangan. Tambahkan momen pertamamu di atas." : "Belum ada kenangan yang dibagikan."}
                </p>
              )}
            </div>
          </section>
        )}

        {view === "timeline" && (
          <section className="fade-in mx-auto max-w-3xl">
            <p className="eyebrow">Jejak waktu</p>
            <h2 className="font-display mt-1 text-3xl font-medium md:text-4xl">Timeline</h2>
            <p className="mt-2 text-sm opacity-70">Perjalanan cerita berdasarkan waktu.</p>
            <TimelineList entries={entries} onOpen={(id) => openEntry(id)} />
          </section>
        )}

        {view === "pengaturan" && (
          <section className="fade-in mx-auto max-w-3xl">
            <p className="eyebrow">Kelola</p>
            <h2 className="font-display mt-1 text-3xl font-medium md:text-4xl">Pengaturan</h2>
            {!admin ? (
              <AdminLogin
                onSuccess={() => {
                  setAdmin(true);
                  setView("dashboard");
                }}
              />
            ) : (
              <div className="card mt-4 border p-6" style={{ borderColor: "color-mix(in srgb, var(--accent) 55%, transparent)" }}>
                <h3 className="font-display text-xl">Mode admin aktif.</h3>
                <p className="mt-1 text-sm opacity-70">
                  Kamu bisa menulis, mengubah, dan menghapus. Agar tulisan tampil untuk semua pengunjung,
                  ekspor file publikasi lalu ganti <code>src/data/published.ts</code> di repo dan push.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={() => openNew()} className="btn-primary px-5 py-2 text-sm">+ Tulis Senandika</button>
                  <button
                    onClick={() => download("published.ts", toPublishedTs(entries, memories), "text/plain")}
                    className="btn-ghost px-5 py-2 text-sm"
                  >
                    Export file publikasi
                  </button>
                  <button onClick={handleReset} className="btn-ghost px-5 py-2 text-sm">Reset ke publikasi</button>
                  <button
                    onClick={() => { adminLogout(); setAdmin(false); setView("landing"); }}
                    className="btn-ghost px-5 py-2 text-sm"
                  >
                    Keluar
                  </button>
                </div>
              </div>
            )}
            <div className="card mt-4 p-6">
              <h3 className="font-semibold">Tema</h3>
              <button onClick={() => setThemeState(theme === "dark" ? "light" : "dark")} className="btn-ghost mt-2 text-sm">
                Saat ini: {theme === "dark" ? "Gelap" : "Terang"} — alihkan
              </button>
            </div>
            <div className="card mt-4 p-6">
              <h3 className="font-semibold">Data</h3>
              <p className="mt-1 text-sm opacity-70">Tulisan pribadi bukan produk untuk dijual. Simpan salinan kapan pun.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={() => download("senandika-backup.json", JSON.stringify({ entries, memories }, null, 2), "application/json")} className="btn-ghost text-sm">Export JSON</button>
                {admin && (
                  <button
                    onClick={() => {
                      if (window.confirm("Hapus seluruh data lokal? Tindakan ini tidak dapat dikembalikan.")) {
                        setEntries([]); setMemories([]);
                      }
                    }}
                    className="btn-ghost text-sm"
                  >
                    Hapus semua data
                  </button>
                )}
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="mx-auto max-w-5xl px-4 pb-28 md:pb-12">
        <div className="divider-orn" aria-hidden="true"><span>✦</span></div>
        <div className="mt-6 flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
          <div>
            <p className="font-display text-lg">Senandika<span style={{ color: "var(--accent)" }}>.</span></p>
            <p className="text-xs opacity-60">Tempat kata-kata yang tak sempat terucap menemukan rumah.</p>
          </div>
          <div className="flex gap-2 text-sm">
            <button onClick={() => setView("favorit")} className="underline underline-offset-4 opacity-70">Favorit</button>
            <button onClick={() => setView("pengaturan")} className="underline underline-offset-4 opacity-70">
              {admin ? "Admin" : "Masuk admin"}
            </button>
          </div>
        </div>
      </footer>

      <nav className="fixed inset-x-0 bottom-0 z-10 border-t md:hidden" style={{ background: "var(--surface)" }} aria-label="Navigasi seluler">
        <div className={`grid text-xs ${admin ? "grid-cols-5" : "grid-cols-5"}`}>
          {[
            { id: "dashboard", label: "Beranda" },
            { id: "senandika", label: "Senandika" },
            ...(admin
              ? [{ id: "tulis", label: "+ Tulis" }]
              : [{ id: "timeline", label: "Timeline" }]),
            { id: "kenangan", label: "Kenangan" },
            { id: "pengaturan", label: "Saya" },
          ].map((n) =>
            n.id === "tulis" ? (
              <button key={n.id} onClick={() => openNew()} className="flex justify-center" aria-label="Tulis baru">
                <span className="fab-center" aria-hidden="true">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M12 5v14 M5 12h14" />
                  </svg>
                </span>
              </button>
            ) : (
              <button
                key={n.id}
                onClick={() => setView(n.id as View)}
                className={`py-3 ${view === n.id ? "font-bold" : "opacity-70"}`}
              >
                {n.label}
              </button>
            ),
          )}
        </div>
      </nav>

      {sheetOpen && admin && (
        <WriteSheet
          onPick={(t) => openNew(t)}
          onMemory={() => {
            setSheetOpen(false);
            setView("kenangan");
          }}
          onClose={() => setSheetOpen(false)}
        />
      )}
    </div>
  );
}

function WriteSheet({
  onPick,
  onMemory,
  onClose,
}: {
  onPick: (t: EntryType) => void;
  onMemory: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [onClose]);

  const icon = (d: string) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );

  const options: { label: string; desc: string; art: string; act: () => void }[] = [
    { label: "Surat", desc: "Tuliskan perasaan terdalam", art: "M3 7h18v10H3z M3 7l9 6 9-6", act: () => onPick("LETTER") },
    { label: "Jurnal", desc: "Catat hari-harimu", art: "M6 3h12v18H6z M9 8h6 M9 12h6 M9 16h4", act: () => onPick("JOURNAL") },
    { label: "Puisi", desc: "Rangkai kata yang puitis", art: "M20 4c-6 0-12 4-14 12l-2 4 4-2C16 16 20 10 20 4z M6 18L16 8", act: () => onPick("POEM") },
    { label: "Doa", desc: "Titipkan harapan dan doa", art: "M12 3c3 4 6 6 6 11a6 6 0 0 1-12 0c0-5 3-7 6-11z", act: () => onPick("PRAYER") },
    { label: "Kenangan", desc: "Simpan momen berharga", art: "M3 7h18v12H3z M9 11a1.6 1.6 0 1 0 0 0 M3 17l5-4 4 3 4-4 5 5", act: onMemory },
    { label: "Catatan", desc: "Hal kecil yang berarti", art: "M5 3h14v18H5z M9 8h6 M9 12h6 M9 16h3", act: () => onPick("NOTE") },
  ];

  return (
    <>
      <button className="sheet-overlay" onClick={onClose} aria-label="Tutup pilihan menulis" />
      <div className="sheet p-5 pb-8" role="dialog" aria-modal="true" aria-label="Apa yang ingin kamu tulis?">
        <div className="mx-auto mb-4 h-1 w-12 rounded-full" style={{ background: "var(--line)" }} />
        <h3 className="font-display text-xl">Apa yang ingin kamu tulis?</h3>
        <div className="mt-4 grid gap-2">
          {options.map((o) => (
            <button key={o.label} onClick={o.act} className="sheet-option">
              <span className="sheet-icon">{icon(o.art)}</span>
              <span>
                <span className="block font-semibold">{o.label}</span>
                <span className="block text-xs opacity-60">{o.desc}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

function SharePanel({ entry, url }: { entry: Entry; url: string }) {
  const [showOptions, setShowOptions] = useState(false);
  const [copied, setCopied] = useState(false);
  const title = entry.title || "Tanpa judul";
  const excerpt = entry.content.split("\n").slice(0, 4).join("\n");
  const text = `“${title}” — Senandika\n\n${excerpt}\n\nBaca selengkapnya: ${url}`;

  async function nativeShare() {
    const nav = navigator as Navigator & {
      share?: (d: { title?: string; text?: string; url?: string }) => Promise<void>;
    };
    if (nav.share) {
      try {
        await nav.share({ title: `${title} — Senandika`, text, url });
        return;
      } catch {
        /* dibatalkan / gagal → tampilkan opsi manual */
      }
    }
    setShowOptions((v) => !v);
  }

  async function copyLink() {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      } else {
        const ta = document.createElement("textarea");
        ta.value = url;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* abaikan */
    }
  }

  const wa = `https://wa.me/?text=${encodeURIComponent(text)}`;
  const tg = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(`“${title}” — Senandika`)}`;
  const x = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`“${title}” — Senandika`)}&url=${encodeURIComponent(url)}`;

  return (
    <div>
      <button onClick={nativeShare} className="btn-primary px-5 py-2 text-sm">
        Bagikan
      </button>
      {showOptions && (
        <div className="card mt-2 flex flex-wrap gap-2 p-3 text-sm">
          <a href={wa} target="_blank" rel="noreferrer" className="btn-ghost px-4 py-2">WhatsApp</a>
          <a href={tg} target="_blank" rel="noreferrer" className="btn-ghost px-4 py-2">Telegram</a>
          <a href={x} target="_blank" rel="noreferrer" className="btn-ghost px-4 py-2">X</a>
          <button onClick={copyLink} className="btn-ghost px-4 py-2">
            {copied ? "Tautan disalin." : "Salin tautan"}
          </button>
        </div>
      )}
    </div>
  );
}

function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  return (
    <form
      className="card mt-4 p-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (adminLogin(pin)) {
          setError("");
          onSuccess();
        } else {
          setError("PIN salah. Coba lagi dengan tenang.");
        }
      }}
    >
      <h3 className="font-display text-xl">Masuk sebagai admin</h3>
      <p className="mt-1 text-sm opacity-70">Hanya admin yang bisa menulis, mengubah, dan menghapus. Pengunjung lain hanya bisa membaca.</p>
      <input
        className="input mt-4 max-w-xs"
        type="password"
        autoComplete="off"
        placeholder="Masukkan PIN admin"
        value={pin}
        onChange={(e) => { setPin(e.target.value); setError(""); }}
        aria-label="PIN admin"
      />
      {error && <p className="mt-2 text-sm" role="alert" style={{ color: "#C96F5A" }}>{error}</p>}
      <button type="submit" className="btn-primary mt-4 px-6 py-2 text-sm">Masuk</button>
    </form>
  );
}

function MemoryForm({ onAdd }: { onAdd: (m: Memory) => void }) {
  const [title, setTitle] = useState("");
  const [story, setStory] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  return (
    <form
      className="card mt-4 grid gap-3 p-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim()) return;
        onAdd({ id: uid("m"), title: title.trim(), story: story.trim(), memoryDate: date || new Date().toISOString().slice(0, 10), location: location.trim(), createdAt: new Date().toISOString() });
        setTitle(""); setStory(""); setDate(""); setLocation("");
      }}
    >
      <input className="input" placeholder="Judul kenangan…" value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Judul kenangan" />
      <textarea className="input min-h-24" placeholder="Ceritakan momen itu…" value={story} onChange={(e) => setStory(e.target.value)} aria-label="Cerita kenangan" />
      <div className="grid gap-3 sm:grid-cols-2">
        <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Tanggal kenangan" />
        <input className="input" placeholder="Lokasi (opsional)" value={location} onChange={(e) => setLocation(e.target.value)} aria-label="Lokasi" />
      </div>
      <button type="submit" className="btn-primary w-fit px-6 py-2 text-sm">Simpan kenangan</button>
    </form>
  );
}

function TimelineList({ entries, onOpen }: { entries: Entry[]; onOpen: (id: string) => void }) {
  const groups = useMemo(() => {
    const map = new Map<string, Entry[]>();
    for (const e of [...entries].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))) {
      const d = new Date(e.createdAt);
      const key = `${d.getFullYear()} — ${d.toLocaleDateString("id-ID", { month: "long" })}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)?.push(e);
    }
    return [...map.entries()];
  }, [entries]);
  if (groups.length === 0) return <p className="mt-4 opacity-70">Belum ada cerita di sini.</p>;
  return (
    <div className="mt-6 space-y-8">
      {groups.map(([label, list]) => (
        <div key={label}>
          <h3 className="eyebrow">{label}</h3>
          <div className="timeline-rail mt-3 space-y-3 border-l-2 pl-6" style={{ borderColor: "color-mix(in srgb, var(--accent) 55%, transparent)" }}>
            {list.map((e) => (
              <button key={e.id} onClick={() => onOpen(e.id)} className="card card-lift relative flex w-full items-center gap-3 p-4 text-left">
                <span className="timeline-dot" aria-hidden="true" />
                <span className="mono-thumb" style={{ background: TYPE_COVER[e.type] }} aria-hidden="true">
                  {(e.title || "S").charAt(0)}
                </span>
                <span>
                  <span className="font-display block text-lg">{e.title || "Tanpa judul"}</span>
                  <span className="mt-1 flex flex-wrap items-center gap-2 text-xs opacity-60">
                    Untuk {e.recipient} <MoodTag mood={e.mood} />
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
