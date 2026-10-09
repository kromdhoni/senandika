import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  BookOpen,
  Feather,
  Flame,
  HeartHandshake,
  Lock,
  MailOpen,
  Search,
  StickyNote,
} from "lucide-react";
import {
  ENTRY_TYPES,
  RECIPIENTS,
  type Capsule,
  type Entry,
  type EntryType,
  type Memory,
  type Recipient,
  type View,
} from "./types";
import { GAYA_PUISI } from "./data/gaya";
import FinsycFeatures from "./components/landing/FinsycFeatures";
import FinsycFooter from "./components/landing/FinsycFooter";
import FinsycHeader from "./components/landing/FinsycHeader";
import FinsycHowItWorks from "./components/landing/FinsycHowItWorks";
import FinsycQuotes from "./components/landing/FinsycQuotes";
import PageBackdrop from "./components/PageBackdrop";
import PageHero from "./components/PageHero";
import SiteHeader from "./components/landing/SiteHeader";
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

const TYPE_ICON = {
  LETTER: MailOpen,
  JOURNAL: BookOpen,
  MEMORY: HeartHandshake,
  PRAYER: Flame,
  POEM: Feather,
  NOTE: StickyNote,
} as const;

const TYPE_COVER: Record<EntryType, string> = {
  LETTER: "linear-gradient(120deg, #2e86c1, #1a5276)",
  JOURNAL: "linear-gradient(120deg, #5dade2, #2e86c1)",
  MEMORY: "linear-gradient(120deg, #1a5276, #0e3a53)",
  PRAYER: "linear-gradient(120deg, #85c1e9, #2e86c1)",
  POEM: "linear-gradient(120deg, #2e86c1, #7fb3d5)",
  NOTE: "linear-gradient(120deg, #a9cce3, #5499c7)",
};

const HERO_LINES = [
  "Ada kata yang belum sempat terucap.",
  "Beberapa cukup dituliskan agar tidak hilang.",
  "Simpan yang tak ingin dilupakan.",
];

function todayLocal() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function isCapsuleOpen(k: Capsule) {
  return new Date(`${k.openDate}T00:00:00`) <= todayLocal();
}

function daysUntilOpen(k: Capsule) {
  return Math.ceil((new Date(`${k.openDate}T00:00:00`).getTime() - todayLocal().getTime()) / 86400000);
}

function formatDateLong(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

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
  const initial = useMemo(load, []);
  const [entries, setEntries] = useState<Entry[]>(initial.entries);
  const [memories, setMemories] = useState<Memory[]>(initial.memories);
  const [capsules, setCapsules] = useState<Capsule[]>(initial.capsules);
  useEffect(() => {
    save({ entries, memories, capsules });
  }, [entries, memories, capsules]);
  return { entries, setEntries, memories, setMemories, capsules, setCapsules };
}

const FONT_KEY = "senandika.fontscale";

function loadFontScale() {
  const v = Number(localStorage.getItem(FONT_KEY));
  return Number.isFinite(v) ? Math.min(2, Math.max(-1, v)) : 0;
}

export default function App() {
  const { entries, setEntries, memories, setMemories, capsules, setCapsules } = useSenandika();
  const [view, setView] = useState<View>("landing");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Entry>(emptyDraft);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [query, setQuery] = useState("");
  const [theme, setThemeState] = useState<"light" | "dark">(getTheme());
  const [admin, setAdmin] = useState(isAdmin());
  const [immersive, setImmersive] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [quoteFor, setQuoteFor] = useState<Entry | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [fontScale, setFontScale] = useState(loadFontScale);
  const [preview, setPreview] = useState(false);
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

  const memorySpan = useMemo(() => {
    const years = memories
      .map((m) => new Date(`${m.memoryDate}T00:00:00`).getFullYear())
      .filter((y) => !Number.isNaN(y));
    if (years.length === 0) return "";
    const a = Math.min(...years);
    const b = Math.max(...years);
    return a === b ? ` · sejak ${a}` : ` · ${a}–${b}`;
  }, [memories]);

  const kapsulInfo = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const locked = capsules.filter((k) => new Date(`${k.openDate}T00:00:00`) > today);
    const next = [...locked].sort((a, b) => a.openDate.localeCompare(b.openDate))[0];
    return { locked: locked.length, opened: capsules.length - locked.length, next };
  }, [capsules]);

  function openNew(preset?: EntryType) {
    if (!admin) return;
    if (!preset) {
      setSheetOpen(true);
      return;
    }
    setSheetOpen(false);
    setPreview(false);
    setDraft({ ...emptyDraft(), type: preset });
    setSaveState("idle");
    setView("tulis");
  }

  function openEdit(e: Entry) {
    if (!admin) return;
    setPreview(false);
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

  function shuffle() {
    const pool = view === "favorit" ? favList : filtered;
    if (pool.length === 0) return;
    openEntry(pool[Math.floor(Math.random() * pool.length)].id);
  }

  function handleReset() {
    if (!admin) return;
    if (!window.confirm("Kembalikan ke konten publikasi? Perubahan lokal yang belum dipublikasikan akan hilang.")) return;
    const fresh = resetToPublished();
    setEntries(fresh.entries);
    setMemories(fresh.memories);
    setCapsules(fresh.capsules);
  }

  function entryUrl(id: string) {
    return `${window.location.origin}${import.meta.env.BASE_URL}baca/${id}/`;
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

  function speak(e: Entry) {
    try {
      const synth = window.speechSynthesis;
      if (!synth) return;
      if (speakingId === e.id) {
        synth.cancel();
        setSpeakingId(null);
        return;
      }
      synth.cancel();
      const u = new SpeechSynthesisUtterance(`${e.title}. ${e.content}`);
      u.lang = "id-ID";
      u.rate = 0.95;
      const voice = synth.getVoices().find((x) => x.lang?.toLowerCase().startsWith("id"));
      if (voice) u.voice = voice;
      u.onend = () => setSpeakingId(null);
      u.onerror = () => setSpeakingId(null);
      synth.speak(u);
      setSpeakingId(e.id);
    } catch {
      /* abaikan */
    }
  }

  useEffect(() => {
    try {
      window.speechSynthesis?.cancel();
    } catch {
      /* abaikan */
    }
    setSpeakingId(null);
  }, [view, activeId]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [view]);


  const sortedAll = useMemo(
    () => [...entries].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)),
    [entries],
  );
  const activeIndex = active ? sortedAll.findIndex((e) => e.id === active.id) : -1;
  const newerEntry = activeIndex > 0 ? sortedAll[activeIndex - 1] : null;
  const olderEntry = activeIndex >= 0 && activeIndex < sortedAll.length - 1 ? sortedAll[activeIndex + 1] : null;

  const favList = filtered.filter((e) => e.isFavorite);

  const drafts = useMemo(() => entries.filter((e) => e.status === "draft"), [entries]);

  const draftStats = useMemo(() => {
    const t = draft.content.trim();
    return {
      words: t ? t.split(/\s+/).length : 0,
      lines: draft.content ? draft.content.split("\n").length : 0,
    };
  }, [draft.content]);

  const padaHariIni = useMemo(() => {
    const now = new Date();
    return entries
      .filter((en) => {
        const d = new Date(en.createdAt);
        return (
          d.getMonth() === now.getMonth() &&
          d.getDate() === now.getDate() &&
          d.getFullYear() < now.getFullYear()
        );
      })
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }, [entries]);

  function changeFontScale(d: number) {
    setFontScale((prev) => {
      const next = Math.min(2, Math.max(-1, prev + d));
      try {
        localStorage.setItem(FONT_KEY, String(next));
      } catch {
        /* abaikan */
      }
      return next;
    });
  }

  const proseStyle = { fontSize: `calc(1.075rem + ${fontScale * 0.125}rem)` };

  const marqueeLines = useMemo(
    () => entries.filter((e) => e.type === "POEM").slice(0, 8).map((e) => e.content.split("\n")[0]),
    [entries],
  );

  if (view === "baca" && active && immersive) {
    return (
      <div className="min-h-screen" style={{ background: "var(--bg)" }}>
        <ReadingProgress />
        <div className="no-print mx-auto flex max-w-2xl items-center justify-between gap-2 px-5 py-4">
          <IconBtn label="Kembali" onClick={() => setImmersive(false)}>
            {strokeIcon("M19 12H5M12 19l-7-7 7-7")}
          </IconBtn>
          <span className="flex items-center gap-2" role="group" aria-label="Ukuran huruf">
            <IconBtn label="Perkecil huruf" onClick={() => changeFontScale(-1)}>
              <span className="font-semibold" style={{ fontSize: "11px" }}>A</span>
            </IconBtn>
            <IconBtn label="Perbesar huruf" onClick={() => changeFontScale(1)}>
              <span className="font-semibold" style={{ fontSize: "15px" }}>A</span>
            </IconBtn>
          </span>
          <span className="font-display text-sm opacity-70">
            Senandika<span style={{ color: "var(--accent)" }}>.</span>
          </span>
        </div>
        <article key={active.id} className="fade-in mx-auto max-w-2xl px-5 pb-20 pt-4">
          <h1 className="font-display mt-3 text-center text-4xl font-medium md:text-5xl">
            {active.title || "Tanpa judul"}
          </h1>
          <p className="mt-3 text-center text-sm opacity-60">
            {new Date(active.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
          </p>
          <div className="divider-orn my-8" aria-hidden="true"><span>✦</span></div>
          <div className="prose-read dropcap whitespace-pre-wrap" dir="auto" style={proseStyle}>{active.content}</div>
          <div className="divider-orn my-8" aria-hidden="true"><span>✦</span></div>
          <div className="no-print flex justify-center gap-2">
            <SharePanel entry={active} url={entryUrl(active.id)} icon />
            <IconBtn label="Jadikan gambar" onClick={() => setQuoteFor(active)}>
              {strokeIcon("M3 7h18v12H3zM9 11a1.6 1.6 0 1 0 0 0M3 17l5-4 4 3 4-4 5 5")}
            </IconBtn>
            <IconBtn label={speakingId === active.id ? "Hentikan" : "Dengarkan"} onClick={() => speak(active)}>
              {speakingId === active.id ? (
                <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor" />
                </svg>
              ) : (
                strokeIcon("M11 5L6 9H2v6h4l5 4zM15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14")
              )}
            </IconBtn>
          </div>
          <nav className="no-print mt-10 flex items-center justify-between gap-3 text-sm" aria-label="Tulisan lain">
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
        {quoteFor && <QuoteCardModal entry={quoteFor} onClose={() => setQuoteFor(null)} />}
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {["senandika", "favorit", "kenangan", "timeline", "kapsul"].includes(view) && <PageBackdrop />}
      <SiteHeader
        view={view}
        go={setView}
        theme={theme}
        onTheme={() => setThemeState(theme === "dark" ? "light" : "dark")}
        admin={admin}
        onWrite={() => openNew()}
      />

      {view === "landing" ? (
          <main className="pb-24 md:pb-8">
            <FinsycHeader go={setView} lines={marqueeLines} headLines={HERO_LINES} />
            {padaHariIni.length > 0 && (
              <div className="mx-auto max-w-3xl bg-white px-4 py-14">
                <p className="eyebrow text-center">Pada hari ini</p>
                <h2 className="font-display mt-1 text-center text-2xl font-medium md:text-3xl">
                  Tahun-tahun lalu
                </h2>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {padaHariIni.map((e) => {
                    const years = new Date().getFullYear() - new Date(e.createdAt).getFullYear();
                    return (
                      <button key={e.id} onClick={() => openEntry(e.id)} className="card card-lift flex items-center gap-3 p-3 text-left">
                        {e.cover ? (
                          <img
                            src={`${import.meta.env.BASE_URL}${e.cover}`}
                            alt=""
                            loading="lazy"
                            className="h-14 w-14 flex-none rounded-xl object-cover"
                          />
                        ) : (
                          <span className="mono-thumb" style={{ background: TYPE_COVER[e.type] }} aria-hidden="true">
                            {(e.title || "S").charAt(0)}
                          </span>
                        )}
                        <span>
                          <span className="font-display block leading-snug">{e.title || "Tanpa judul"}</span>
                          <span className="text-xs opacity-60">
                            {years} tahun lalu · {new Date(e.createdAt).getFullYear()}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <FinsycFeatures go={setView} />
            <FinsycHowItWorks go={setView} />
            <FinsycQuotes entries={entries} onOpen={(id) => openEntry(id)} />
            <FinsycFooter go={setView} onAdmin={() => setView("pengaturan")} />
          </main>
        ) : (
          <main className="mx-auto max-w-5xl px-4 pb-28 pt-8 md:pb-16">
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
                  <span className="mt-2 block text-sm opacity-70">
                    {new Date(entries[0].updatedAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
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
              <button onClick={() => setView("kapsul")} className="card card-lift p-6 text-left">
                <h3 className="eyebrow">Kapsul waktu</h3>
                <p className="font-display mt-2 text-2xl">
                  {kapsulInfo.locked > 0
                    ? `${kapsulInfo.locked} pesan terkunci`
                    : "Belum ada pesan untuk masa depan"}
                </p>
                <p className="mt-1 text-sm opacity-70">
                  {kapsulInfo.next
                    ? `Dibuka berikutnya: ${new Date(`${kapsulInfo.next.openDate}T00:00:00`).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`
                    : "Tulis pesan untuk dirimu di masa depan."}
                </p>
              </button>
            </div>
          </section>
        )}

        {(view === "senandika" || view === "favorit") && (
          <>
          <section className="fade-in mx-auto max-w-5xl">
            <PageHero
              tone="dark"
              pill={view === "favorit" ? "Penanda pribadi" : "Senandika"}
              title={
                view === "favorit" ? (
                  <>Favorit <em className="font-playfair italic opacity-60">pilihan</em></>
                ) : (
                  <>Koleksi <em className="font-playfair italic opacity-60">tulisan</em></>
                )
              }
              sub={
                view === "favorit"
                  ? "Tulisan yang kamu tandai di peramban ini."
                  : "Cari cerita, kenangan, atau kata yang pernah tertulis di sini."
              }
            />
            {admin && view !== "favorit" && (
              <div className="mt-4 text-center">
                <button onClick={() => openNew()} className="btn-primary px-5 py-2 text-sm">+ Tulis</button>
              </div>
            )}
            <div className="band mt-6 p-4 sm:p-6">
            <div className="searchbar">
              <Search className="h-5 w-5 flex-none opacity-50" aria-hidden="true" />
              <input
                className="searchinput"
                placeholder='Cari "ibu"'
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Pencarian tulisan"
              />
              <IconBtn label="Kocok: buka tulisan acak" onClick={shuffle}>
                {strokeIcon("M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5")}
              </IconBtn>
            </div>
            <div className="stagger mt-6 grid gap-4 sm:grid-cols-2">
              {(view === "favorit" ? favList : filtered).map((e, i) => {
                const featured = i === 0;
                const limit = featured ? 200 : 120;
                const Icon = TYPE_ICON[e.type];
                return (
                <article key={e.id} className={`card card-lift overflow-hidden${featured ? " sm:col-span-2" : ""}`} style={{ ["--i" as string]: Math.min(i, 6) }}>
                  {e.cover ? (
                    <img
                      src={`${import.meta.env.BASE_URL}${e.cover}`}
                      alt=""
                      loading="lazy"
                      className={featured ? "h-56 w-full object-cover transition-transform duration-700 hover:scale-[1.03] sm:h-72" : "h-36 w-full object-cover transition-transform duration-700 hover:scale-[1.04]"}
                    />
                  ) : (
                    <div className="cover-band" style={{ background: TYPE_COVER[e.type] }} aria-hidden="true" />
                  )}
                  <div className={featured ? "p-6 md:p-8" : "p-5"}>
                  <span className="sheet-icon mb-4" aria-hidden="true">
                    <Icon className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <button className="block w-full text-left" onClick={() => openEntry(e.id)}>
                    <span className={featured ? "font-onest mt-1 block text-2xl font-semibold tracking-[-0.8px] md:text-3xl" : "font-onest mt-1 block text-xl font-semibold tracking-[-0.8px]"}>{e.title || "Tanpa judul"}</span>
                    <span className="mt-1 block text-sm opacity-70">{e.content.slice(0, limit)}{e.content.length > limit ? "…" : ""}</span>
                    {admin && e.status === "draft" && (
                      <span className="chip mt-2">Draft · tersimpan otomatis</span>
                    )}
                  </button>
                  <div className="mt-3 flex gap-2 text-sm">
                    <button onClick={() => toggleFav(e.id)} className="btn-mini" aria-label="Tandai favorit">
                      {e.isFavorite ? "★ Favorit" : "☆ Tandai"}
                    </button>
                    {admin && <button onClick={() => openEdit(e)} className="btn-mini">Ubah</button>}
                  </div>
                  </div>
                </article>
                );
              })}
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
            </div>
          </section>
            <FinsycFooter go={setView} onAdmin={() => setView("pengaturan")} />
            </>
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
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
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
            </div>
            <div className="mt-4 flex items-center justify-between text-sm opacity-70">
              <span>{draftStats.words} kata · {draftStats.lines} baris</span>
              <button onClick={() => setPreview((p) => !p)} className="underline underline-offset-4">
                {preview ? "Lanjut menulis" : "Pratinjau"}
              </button>
            </div>
            {preview ? (
              <div className="card prose-read mt-4 min-h-[320px] whitespace-pre-wrap p-6" dir="auto">
                {draft.title && <p className="font-display mb-4 text-2xl">{draft.title}</p>}
                {draft.content || "Belum ada tulisan."}
              </div>
            ) : (
            <textarea
              className="input prose-read mt-4 min-h-[320px]"
              placeholder={draft.type === "POEM" ? "tulis dengan huruf kecil…\nbiarkan satu kata berat\nberdiri sendiri." : "Tuliskan di sini…"}
              value={draft.content}
              onChange={(e) => setDraft({ ...draft, content: e.target.value })}
              aria-label="Isi tulisan"
            />
            )}
            {draft.type === "POEM" && (
              <details className="card mt-3 p-5 text-sm">
                <summary className="font-display cursor-pointer text-lg">{GAYA_PUISI.judul} · referensi gayamu</summary>
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
            <ReadingProgress />
            <div className="no-print mb-4">
              <IconBtn label="Kembali ke Koleksi" onClick={() => setView("senandika")}>
                {strokeIcon("M19 12H5M12 19l-7-7 7-7")}
              </IconBtn>
            </div>
            <h2 className="font-display mt-2 text-4xl font-medium md:text-5xl">{active.title || "Tanpa judul"}</h2>
            <p className="mt-3 text-sm opacity-60">
              {new Date(active.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
            </p>
            <div className="divider-orn my-6" aria-hidden="true"><span>✦</span></div>
            <div className="prose-read dropcap whitespace-pre-wrap" dir="auto" style={proseStyle}>{active.content}</div>
            <div className="no-print mt-8 flex flex-wrap items-center gap-2">
              <SharePanel entry={active} url={entryUrl(active.id)} icon />
              <IconBtn label="Jadikan gambar" onClick={() => setQuoteFor(active)}>
                {strokeIcon("M3 7h18v12H3zM9 11a1.6 1.6 0 1 0 0 0M3 17l5-4 4 3 4-4 5 5")}
              </IconBtn>
              <IconBtn label={speakingId === active.id ? "Hentikan" : "Dengarkan"} onClick={() => speak(active)}>
                {speakingId === active.id ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor" />
                  </svg>
                ) : (
                  strokeIcon("M11 5L6 9H2v6h4l5 4zM15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14")
                )}
              </IconBtn>
              <IconBtn label="Layar penuh" onClick={() => setImmersive(true)}>
                {strokeIcon("M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7")}
              </IconBtn>
              <IconBtn label="Cetak" onClick={() => window.print()}>
                {strokeIcon("M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z")}
              </IconBtn>
              <span className="flex items-center gap-2" role="group" aria-label="Ukuran huruf">
                <IconBtn label="Perkecil huruf" onClick={() => changeFontScale(-1)}>
                  <span className="font-semibold" style={{ fontSize: "11px" }}>A</span>
                </IconBtn>
                <IconBtn label="Perbesar huruf" onClick={() => changeFontScale(1)}>
                  <span className="font-semibold" style={{ fontSize: "15px" }}>A</span>
                </IconBtn>
              </span>
              <IconBtn
                label={active.isFavorite ? "Hapus dari favorit" : "Jadikan favorit"}
                onClick={() => toggleFav(active.id)}
                active={active.isFavorite}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill={active.isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 3l2.7 5.6 6.1.8-4.5 4.2 1.1 6-5.4-3-5.4 3 1.1-6L3.2 9.4l6.1-.8z" />
                </svg>
              </IconBtn>
              {admin && <button onClick={() => openEdit(active)} className="btn-ghost text-sm">Ubah</button>}
              {admin && <button onClick={() => removeEntry(active.id)} className="btn-ghost text-sm">Hapus</button>}
            </div>
          </article>
        )}

        {view === "baca" && !active && (
          <section className="fade-in mx-auto max-w-xl py-16 text-center">
            <p className="font-display text-2xl">Tulisan tidak ditemukan.</p>
            <p className="mt-2 text-sm opacity-70">Mungkin tautannya sudah berubah. Mari kembali membaca yang lain.</p>
            <button onClick={() => setView("senandika")} className="btn-primary mt-5">Lihat Koleksi</button>
          </section>
        )}

        {view === "kenangan" && (
          <>
          <section className="fade-in mx-auto max-w-5xl">
            <PageHero
              tone="dark"
              pill="Arsip momen"
              title={<>Ruang <em className="font-playfair italic opacity-60">kenangan</em></>}
              sub="Cerita dan momen yang tidak ingin dilupakan."
            />
            <p className="font-quote mt-3 text-center text-xl italic text-white/85">
              “Yang terlupakan, seolah tak pernah terjadi.”
            </p>
            {memories.length > 0 && (
              <p className="mt-2 text-center text-xs uppercase tracking-[0.2em] text-white/60">
                {memories.length} cerita{memorySpan}
              </p>
            )}
            {admin && (
              <div className="mx-auto mt-6 max-w-2xl">
                <MemoryForm onAdd={(m) => setMemories((p) => [m, ...p])} />
              </div>
            )}
            <div className="band mt-6 p-4 sm:p-6">
            <div className="stagger grid gap-4 sm:grid-cols-2">
              {memories.map((m, i) => (
                <div key={m.id} className="card card-lift overflow-hidden" style={{ ["--i" as string]: Math.min(i, 6) }}>
                  {m.photo ? (
                    <img src={m.photo.startsWith("data:") ? m.photo : `${import.meta.env.BASE_URL}${m.photo}`} alt="" loading="lazy" className="h-44 w-full object-cover transition-transform duration-700 hover:scale-[1.03]" />
                  ) : (
                    <div className="h-1.5" style={{ background: "linear-gradient(to right, var(--accent), transparent)" }} />
                  )}
                  <div className="p-5">
                    <p className="text-xs uppercase tracking-widest opacity-60">{m.memoryDate} {m.location ? `· ${m.location}` : ""}</p>
                    <h3 className="font-onest mt-1 text-xl font-semibold tracking-[-0.8px]">{m.title}</h3>
                    <p className="mt-1 text-sm opacity-80">{m.story}</p>
                    {admin && <button onClick={() => setMemories((p) => p.filter((x) => x.id !== m.id))} className="btn-mini mt-3">Hapus</button>}
                  </div>
                </div>
              ))}
              {memories.length === 0 && (
                <p className="opacity-70 sm:col-span-2">
                  {admin ? "Belum ada kenangan. Tambahkan momen pertamamu di atas." : "Belum ada kenangan yang dibagikan."}
                </p>
              )}
            </div>
            </div>
          </section>
            <FinsycFooter go={setView} onAdmin={() => setView("pengaturan")} />
            </>
        )}

        {view === "timeline" && (
          <>
          <section className="fade-in mx-auto max-w-5xl">
            <PageHero
              tone="dark"
              pill="Jejak waktu"
              title={<>Linimasa <em className="font-playfair italic opacity-60">cerita</em></>}
              sub="Perjalanan cerita berdasarkan waktu."
            />
            <div className="band mt-6 p-4 sm:p-6">
            <div className="mx-auto max-w-2xl">
            <TimelineList entries={entries} onOpen={(id) => openEntry(id)} />
            </div>
            </div>
          </section>
            <FinsycFooter go={setView} onAdmin={() => setView("pengaturan")} />
            </>
        )}

        {view === "kapsul" && (
          <>
          <section className="fade-in mx-auto max-w-5xl">
            <PageHero
              tone="dark"
              pill="Kapsul waktu"
              title={<>Surat masa <em className="font-playfair italic opacity-60">depan</em></>}
              sub="Tulis pesan untuk dirimu di masa depan. Dibuka kembali saat waktunya tiba. Kapsul tersimpan di peramban ini saja."
            />
            {admin && (
              <div className="mx-auto mt-6 max-w-2xl">
                <CapsuleForm onAdd={(k) => setCapsules((p) => [k, ...p])} />
              </div>
            )}
            <div className="band mx-auto mt-6 grid max-w-2xl gap-3 p-4 sm:p-6">
              {[...capsules]
                .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                .map((k) =>
                  isCapsuleOpen(k) ? (
                    <article key={k.id} className="card card-lift p-5">
                      <p className="eyebrow">Dibuka {formatDateLong(`${k.openDate}T00:00:00`)}</p>
                      <span className="sheet-icon mb-3 mt-3" aria-hidden="true">
                        <MailOpen className="h-5 w-5" strokeWidth={2} />
                      </span>
                      <h3 className="font-onest mt-1 text-xl font-semibold tracking-[-0.8px]">{k.title}</h3>
                      <p className="prose-read mt-2 whitespace-pre-wrap text-[1rem]" dir="auto">{k.message}</p>
                      {admin && (
                        <button onClick={() => setCapsules((p) => p.filter((x) => x.id !== k.id))} className="btn-mini mt-3">
                          Hapus
                        </button>
                      )}
                    </article>
                  ) : (
                    <div key={k.id} className="card p-5 opacity-90">
                      <p className="flex items-center gap-2 text-xs uppercase tracking-widest opacity-60">
                        <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                        Terkunci · dibuka {formatDateLong(`${k.openDate}T00:00:00`)}
                      </p>
                      <h3 className="font-onest mt-1 text-xl font-semibold tracking-[-0.8px]">{k.title}</h3>
                      <p className="mt-1 text-sm opacity-70">
                        {daysUntilOpen(k) <= 0 ? "Waktunya hampir tiba." : `${daysUntilOpen(k)} hari lagi.`} Ada pesan dari masa lalu menunggumu.
                      </p>
                    </div>
                  ),
                )}
              {capsules.length === 0 && (
                <p className="opacity-70">
                  {admin ? "Belum ada kapsul. Tulis pesan pertamamu untuk masa depan di atas." : "Belum ada kapsul waktu di sini."}
                </p>
              )}
            </div>
          </section>
            <FinsycFooter go={setView} onAdmin={() => setView("pengaturan")} />
            </>
        )}

        {view === "tentang" && (
          <section className="fade-in mx-auto max-w-3xl">
            <p className="eyebrow">Tentang</p>
            <h2 className="font-display mt-1 text-3xl font-medium md:text-4xl">Senandika.</h2>
            <p className="font-quote mt-4 text-2xl italic opacity-90">
              Tempat kata-kata yang tak sempat terucap menemukan rumah.
            </p>
            <div className="prose-read mt-6 space-y-4 text-[1rem] opacity-85">
              <p>
                Senandika adalah ruang personal untuk menulis surat, menyimpan kenangan,
                dan mengabadikan kata-kata yang ingin disampaikan kepada orang-orang tercinta,
                bahkan yang tak sempat dikatakan.
              </p>
              <p>
                Menulis yang tak sempat dikatakan. Menyimpan yang tak ingin dilupakan.
                Karena beberapa perasaan terlalu berarti untuk dibiarkan hilang bersama waktu.
              </p>
            </div>
            <div className="divider-orn my-8" aria-hidden="true"><span>✦</span></div>
            <h3 className="font-display text-2xl">Cara membaca</h3>
            <ol className="mt-3 list-decimal space-y-2 pl-6 text-sm opacity-85">
              <li>Buka <strong>Koleksi</strong> untuk menjelajah semua tulisan, atau <strong>Timeline</strong> untuk menelusuri per waktu.</li>
              <li>Ketuk tulisan untuk membaca dengan tenang. Tombol <strong>Layar penuh</strong> menyembunyikan semuanya kecuali kata-katanya.</li>
              <li>Tombol <strong>Bagikan</strong> menyalin tautan yang langsung membuka tulisan itu.</li>
              <li>Tandai favorit untuk menyimpan yang paling berarti di perambanmu.</li>
            </ol>
            <p className="mt-8 text-xs opacity-50">
              Ditata dengan Playfair Display, Cormorant Garamond, Amiri, dan Inter.
              Foto sampul dari Pixabay. Diterbitkan sebagai situs statis. Tulisan pribadi bukan produk untuk dijual.
            </p>
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
                  setView("senandika");
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
                    onClick={() => download("published.ts", toPublishedTs(entries, memories, capsules), "text/plain")}
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
              <div className="card mt-4 p-6">
                <h3 className="font-display text-xl">Cara menerbitkan</h3>
                <ol className="mt-2 list-decimal space-y-2 pl-6 text-sm opacity-85">
                  <li>Tulis atau ubah seperti biasa. Semuanya tersimpan otomatis di peramban ini.</li>
                  <li>Tekan <strong>Export file publikasi</strong>, ganti isi <code>src/data/published.ts</code> di repo dengan file itu, lalu push. Deploy berjalan otomatis.</li>
                  <li>Untuk tulisan <strong>baru</strong>, beri tahu saya agar dibuatkan kartu share-nya sebelum push.</li>
                  <li>Kapsul dan foto kenangan upload tetap di peramban dan tidak ikut terbit.</li>
                </ol>
              </div>
              {drafts.length > 0 && (
                <div className="card mt-4 p-6">
                  <h3 className="font-display text-xl">Lanjutkan draft ({drafts.length})</h3>
                  <div className="mt-3 space-y-2">
                    {drafts.map((d) => (
                      <button key={d.id} onClick={() => openEdit(d)} className="card card-lift block w-full p-3 text-left">
                        <span className="font-display">{d.title || "Tanpa judul"}</span>
                        <span className="block text-xs opacity-60">{d.content.slice(0, 80)}{d.content.length > 80 ? "…" : ""}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            )}
            <div className="card mt-4 p-6">
              <h3 className="font-semibold">Tema</h3>
              <button onClick={() => setThemeState(theme === "dark" ? "light" : "dark")} className="btn-ghost mt-2 text-sm">
                Saat ini: {theme === "dark" ? "Gelap" : "Terang"} · alihkan
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
                        setEntries([]); setMemories([]); setCapsules([]);
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
      )}

      {["tulis", "baca", "tentang", "pengaturan"].includes(view) && (
      <footer className="mx-auto max-w-5xl px-4 pb-28 md:pb-12">
        <div className="divider-orn" aria-hidden="true"><span>✦</span></div>
        <div className="mt-6 flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
          <div>
            <p className="font-display text-lg">Senandika<span style={{ color: "var(--accent)" }}>.</span></p>
            <p className="text-xs opacity-60">Tempat kata-kata yang tak sempat terucap menemukan rumah.</p>
          </div>
          <div className="flex gap-2 text-sm">
            <button onClick={() => setView("kapsul")} className="underline underline-offset-4 opacity-70">Kapsul</button>
            <button onClick={() => setView("tentang")} className="underline underline-offset-4 opacity-70">Tentang</button>
            <button onClick={() => setView("favorit")} className="underline underline-offset-4 opacity-70">Favorit</button>
            <button onClick={() => setView("pengaturan")} className="underline underline-offset-4 opacity-70">
              {admin ? "Admin" : "Masuk admin"}
            </button>
          </div>
        </div>
      </footer>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-10 border-t md:hidden" style={{ background: "var(--surface)" }} aria-label="Navigasi seluler">
        <div className="grid grid-cols-4 text-xs">
          {[
            { id: "senandika", label: "Koleksi" },
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
      {quoteFor && <QuoteCardModal entry={quoteFor} onClose={() => setQuoteFor(null)} />}
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

function IconBtn({
  label,
  onClick,
  active,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`icon-btn${active ? " active" : ""}`}
    >
      {children}
    </button>
  );
}

function strokeIcon(d: string) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

function ReadingProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setP(max > 0 ? Math.min(1, h.scrollTop / max) : 0);
      raf = 0;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <div className="fixed inset-x-0 top-0 z-50 h-[3px]" aria-hidden="true">
      <div className="h-full" style={{ width: `${p * 100}%`, background: "linear-gradient(to right, var(--accent), #7fb3d5)" }} />
    </div>
  );
}

function SharePanel({ entry, url, icon }: { entry: Entry; url: string; icon?: boolean }) {
  const [showOptions, setShowOptions] = useState(false);
  const [copied, setCopied] = useState(false);
  const title = entry.title || "Tanpa judul";
  const excerpt = entry.content.split("\n").slice(0, 4).join("\n");
  const text = `“${title}” · Senandika\n\n${excerpt}\n\nBaca selengkapnya: ${url}`;

  async function nativeShare() {
    const nav = navigator as Navigator & {
      share?: (d: { title?: string; text?: string; url?: string }) => Promise<void>;
    };
    if (nav.share) {
      try {
        await nav.share({ title: `${title} · Senandika`, text, url });
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
  const tg = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(`“${title}” · Senandika`)}`;
  const x = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`“${title}” · Senandika`)}&url=${encodeURIComponent(url)}`;

  return (
    <div>
      {icon ? (
        <IconBtn label="Bagikan" onClick={nativeShare}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <path d="M8.6 10.5l6.8-4M8.6 13.5l6.8 4" />
          </svg>
        </IconBtn>
      ) : (
        <button onClick={nativeShare} className="btn-primary px-5 py-2 text-sm">
          Bagikan
        </button>
      )}
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

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    const t = window.setTimeout(() => rej(new Error("timeout")), 8000);
    img.onload = () => {
      window.clearTimeout(t);
      res(img);
    };
    img.onerror = () => {
      window.clearTimeout(t);
      rej(new Error("gagal memuat"));
    };
    img.src = src;
  });
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width > maxWidth && line) {
      lines.push(line);
      line = w;
      if (lines.length === maxLines) break;
    } else {
      line = t;
    }
  }
  if (lines.length < maxLines && line) lines.push(line);
  return lines;
}

async function renderQuoteCard(entry: Entry, coverUrl: string | null): Promise<Blob> {
  const W = 1080;
  const H = 1350;
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext("2d");
  if (!ctx) throw new Error("canvas tak didukung");

  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#16283a");
  bg.addColorStop(1, "#0b1520");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  if (coverUrl) {
    try {
      const img = await loadImage(coverUrl);
      const s = Math.max(W / img.width, H / img.height);
      const dw = img.width * s;
      const dh = img.height * s;
      ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
    } catch {
      /* pakai latar gradasi */
    }
  }

  const shade = ctx.createLinearGradient(0, H * 0.2, 0, H);
  shade.addColorStop(0, "rgba(5,10,16,0)");
  shade.addColorStop(1, "rgba(5,10,16,0.88)");
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, W, H);

  try {
    await Promise.race([document.fonts.ready, new Promise((r) => window.setTimeout(r, 1500))]);
  } catch {
    /* lanjut dengan font cadangan */
  }

  const pad = 96;
  ctx.fillStyle = "#ffffff";
  ctx.font = '600 64px "Playfair Display", Georgia, serif';
  const titleLines = wrapLines(ctx, entry.title || "Tanpa judul", W - pad * 2, 3);
  ctx.fillStyle = "rgba(255,255,255,0.94)";
  ctx.font = 'italic 500 46px "Cormorant Garamond", Georgia, serif';
  const excerpt = entry.content.split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 6).join(" / ");
  const exLines = wrapLines(ctx, excerpt, W - pad * 2, 5);

  let y = H - 150 - (titleLines.length * 80 + 24 + exLines.length * 62);
  if (y < 200) y = 200;
  ctx.fillStyle = "#ffffff";
  ctx.font = '600 64px "Playfair Display", Georgia, serif';
  for (const ln of titleLines) {
    y += 80;
    ctx.fillText(ln, pad, y);
  }
  y += 24;
  ctx.fillStyle = "rgba(255,255,255,0.94)";
  ctx.font = 'italic 500 46px "Cormorant Garamond", Georgia, serif';
  for (const ln of exLines) {
    y += 62;
    ctx.fillText(ln, pad, y);
  }

  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = "600 30px Inter, sans-serif";
  ctx.fillText("S E N A N D I K A", pad, H - 96);

  return new Promise((res, rej) => {
    cv.toBlob((b) => (b ? res(b) : rej(new Error("gagal merender"))), "image/png");
  });
}

function QuoteCardModal({ entry, onClose }: { entry: Entry; onClose: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    let obj = "";
    const cover = entry.cover ? new URL(`${import.meta.env.BASE_URL}${entry.cover}`, window.location.href).href : null;
    renderQuoteCard(entry, cover)
      .then((b) => {
        if (!alive) return;
        obj = URL.createObjectURL(b);
        setBlob(b);
        setUrl(obj);
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
      if (obj) URL.revokeObjectURL(obj);
    };
  }, [entry]);

  function downloadPng() {
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = `${entry.title || "senandika"}.png`;
    a.click();
  }

  async function shareImage() {
    if (!blob) return;
    const nav = navigator as Navigator & {
      canShare?: (d: { files?: File[] }) => boolean;
      share?: (d: { files?: File[]; title?: string }) => Promise<void>;
    };
    const file = new File([blob], `${entry.title || "senandika"}.png`, { type: "image/png" });
    if (nav.canShare?.({ files: [file] }) && nav.share) {
      try {
        await nav.share({ files: [file], title: entry.title || "Senandika" });
        return;
      } catch {
        /* lanjut unduh */
      }
    }
    downloadPng();
  }

  return (
    <div className="no-print">
      <button className="sheet-overlay" onClick={onClose} aria-label="Tutup kartu gambar" />
      <div className="sheet p-5 pb-8" role="dialog" aria-modal="true" aria-label="Kartu gambar kutipan">
        <div className="mx-auto mb-4 h-1 w-12 rounded-full" style={{ background: "var(--line)" }} />
        <h3 className="font-display text-xl">Kartu gambar</h3>
        <div className="mt-4 flex justify-center">
          {url ? (
            <img src={url} alt={`Kartu gambar: ${entry.title || "tanpa judul"}`} className="max-h-[46vh] rounded-xl border" style={{ borderColor: "var(--line)" }} />
          ) : (
            <p className="py-10 text-sm opacity-60">{failed ? "Gambar gagal dibuat. Coba lagi." : "Merangkai gambar…"}</p>
          )}
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <button onClick={shareImage} disabled={!blob} className="btn-primary px-5 py-2 text-sm">
            Bagikan gambar
          </button>
          <button onClick={downloadPng} disabled={!blob} className="btn-ghost px-5 py-2 text-sm">
            Unduh PNG
          </button>
          <button onClick={onClose} className="btn-ghost px-5 py-2 text-sm">
            Tutup
          </button>
        </div>
      </div>
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

function CapsuleForm({ onAdd }: { onAdd: (k: Capsule) => void }) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [openDate, setOpenDate] = useState("");
  const todayStr = `${todayLocal().getFullYear()}-${String(todayLocal().getMonth() + 1).padStart(2, "0")}-${String(todayLocal().getDate()).padStart(2, "0")}`;
  return (
    <form
      className="card mt-4 grid gap-3 p-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim() || !message.trim() || !openDate) return;
        onAdd({ id: uid("c"), title: title.trim(), message: message.trim(), openDate, createdAt: new Date().toISOString() });
        setTitle(""); setMessage(""); setOpenDate("");
      }}
    >
      <input className="input" placeholder="Untuk diriku di masa depan…" value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Judul kapsul" />
      <textarea className="input min-h-28" placeholder="Tulis pesan untuk masa depan…" value={message} onChange={(e) => setMessage(e.target.value)} aria-label="Pesan kapsul" />
      <label className="grid max-w-xs gap-1 text-sm">Dibuka pada
        <input className="input" type="date" min={todayStr} value={openDate} onChange={(e) => setOpenDate(e.target.value)} aria-label="Tanggal dibuka" />
      </label>
      <button type="submit" className="btn-primary w-fit px-6 py-2 text-sm">Kunci kapsul</button>
    </form>
  );
}

function fileToPhoto(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const obj = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const max = 1200;
      const s = Math.min(1, max / Math.max(img.width, img.height));
      const cv = document.createElement("canvas");
      cv.width = Math.max(1, Math.round(img.width * s));
      cv.height = Math.max(1, Math.round(img.height * s));
      cv.getContext("2d")?.drawImage(img, 0, 0, cv.width, cv.height);
      URL.revokeObjectURL(obj);
      res(cv.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => {
      URL.revokeObjectURL(obj);
      rej(new Error("gagal membaca gambar"));
    };
    img.src = obj;
  });
}

function MemoryForm({ onAdd }: { onAdd: (m: Memory) => void }) {
  const [title, setTitle] = useState("");
  const [story, setStory] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [photo, setPhoto] = useState("");
  const [photoError, setPhotoError] = useState("");
  return (
    <form
      className="card mt-4 grid gap-3 p-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim()) return;
        onAdd({ id: uid("m"), title: title.trim(), story: story.trim(), memoryDate: date || new Date().toISOString().slice(0, 10), location: location.trim(), photo: photo || undefined, createdAt: new Date().toISOString() });
        setTitle(""); setStory(""); setDate(""); setLocation(""); setPhoto("");
      }}
    >
      <input className="input" placeholder="Judul kenangan…" value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Judul kenangan" />
      <textarea className="input min-h-24" placeholder="Ceritakan momen itu…" value={story} onChange={(e) => setStory(e.target.value)} aria-label="Cerita kenangan" />
      <div className="grid gap-3 sm:grid-cols-2">
        <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Tanggal kenangan" />
        <input className="input" placeholder="Lokasi (opsional)" value={location} onChange={(e) => setLocation(e.target.value)} aria-label="Lokasi" />
      </div>
      <label className="grid gap-1 text-sm">Foto (opsional, tersimpan di peramban ini)
        <input
          className="input"
          type="file"
          accept="image/*"
          aria-label="Foto kenangan"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            setPhotoError("");
            if (f.size > 8 * 1024 * 1024) {
              setPhotoError("Fotonya kebesaran (maks 8MB).");
              return;
            }
            fileToPhoto(f).then(setPhoto).catch(() => setPhotoError("Foto gagal dibaca."));
          }}
        />
      </label>
      {photoError && <p className="text-sm" role="alert" style={{ color: "#C96F5A" }}>{photoError}</p>}
      {photo && (
        <div className="flex items-center gap-3">
          <img src={photo} alt="Pratinjau foto kenangan" className="h-20 w-20 rounded-xl object-cover" />
          <button type="button" onClick={() => setPhoto("")} className="text-sm underline underline-offset-4">Hapus foto</button>
        </div>
      )}
      <button type="submit" className="btn-primary w-fit px-6 py-2 text-sm">Simpan kenangan</button>
    </form>
  );
}

function TimelineList({ entries, onOpen }: { entries: Entry[]; onOpen: (id: string) => void }) {
  const [tab, setTab] = useState<"daftar" | "kalender">("daftar");
  const groups = useMemo(() => {
    const map = new Map<string, Entry[]>();
    for (const e of [...entries].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))) {
      const d = new Date(e.createdAt);
      const key = `${d.toLocaleDateString("id-ID", { month: "long" })} ${d.getFullYear()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)?.push(e);
    }
    return [...map.entries()];
  }, [entries]);
  if (groups.length === 0) return <p className="mt-4 opacity-70">Belum ada cerita di sini.</p>;
  return (
    <div className="mt-6">
      <div className="tabbar" role="tablist" aria-label="Tampilan timeline">
        <button role="tab" aria-selected={tab === "daftar"} onClick={() => setTab("daftar")}
          className={tab === "daftar" ? "active" : ""}>
          Daftar
        </button>
        <button role="tab" aria-selected={tab === "kalender"} onClick={() => setTab("kalender")}
          className={tab === "kalender" ? "active" : ""}>
          Kalender
        </button>
      </div>
      {tab === "daftar" ? (
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
                  <span className="font-onest block text-lg font-semibold tracking-[-0.8px]">{e.title || "Tanpa judul"}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}
      </div>
      ) : (
        <CalendarView entries={entries} onOpen={onOpen} />
      )}
    </div>
  );
}

function CalendarView({ entries, onOpen }: { entries: Entry[]; onOpen: (id: string) => void }) {
  const now = new Date();
  const [cursor, setCursor] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [sel, setSel] = useState<string | null>(null);
  const byDay = useMemo(() => {
    const map = new Map<string, Entry[]>();
    for (const e of entries) {
      const d = new Date(e.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)?.push(e);
    }
    return map;
  }, [entries]);
  const first = new Date(cursor.y, cursor.m, 1);
  const offset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const cells: (string | null)[] = [
    ...Array<string | null>(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => `${cursor.y}-${String(cursor.m + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}` as string | null),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const title = first.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  const isCurrent = cursor.y === now.getFullYear() && cursor.m === now.getMonth();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const selEntries = sel ? (byDay.get(sel) ?? []) : [];
  return (
    <div className="card mt-6 p-5">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCursor((c) => (c.m === 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m: c.m - 1 }))}
          className="icon-btn" aria-label="Bulan sebelumnya" title="Bulan sebelumnya">
          ‹
        </button>
        <h3 className="font-display text-xl capitalize">{title}</h3>
        <button
          onClick={() => setCursor((c) => (c.m === 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m: c.m + 1 }))}
          className="icon-btn" aria-label="Bulan berikutnya" title="Bulan berikutnya">
          ›
        </button>
      </div>
      {!isCurrent && (
        <button onClick={() => setCursor({ y: now.getFullYear(), m: now.getMonth() })} className="mt-1 text-xs underline underline-offset-4 opacity-70">
          Kembali ke bulan ini
        </button>
      )}
      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs opacity-60">
        {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((key, i) =>
          key ? (
            <button
              key={key}
              onClick={() => setSel(key)}
              aria-label={`${Number(key.slice(8))} ${(byDay.get(key)?.length ?? 0)} tulisan`}
              className="flex aspect-square flex-col items-center justify-center rounded-xl text-sm"
              style={
                sel === key
                  ? { background: "color-mix(in srgb, var(--accent) 22%, transparent)", fontWeight: 700 }
                  : key === todayStr
                    ? { border: "1px solid var(--accent)" }
                    : undefined
              }
            >
              <span>{Number(key.slice(8))}</span>
              {(byDay.get(key)?.length ?? 0) > 0 && (
                <span className="mt-0.5 block h-1.5 w-1.5 rounded-full" style={{ background: "var(--accent)" }} />
              )}
            </button>
          ) : (
            <span key={`x${i}`} />
          ),
        )}
      </div>
      {sel && (
        <div className="mt-4 border-t pt-3" style={{ borderColor: "color-mix(in srgb, var(--muted) 25%, transparent)" }}>
          <p className="text-xs uppercase tracking-widest opacity-60">{formatDateLong(`${sel}T00:00:00`)}</p>
          {selEntries.length === 0 ? (
            <p className="mt-1 text-sm opacity-70">Tidak ada tulisan hari itu.</p>
          ) : (
            <div className="mt-2 space-y-2">
              {selEntries.map((e) => (
                <button key={e.id} onClick={() => onOpen(e.id)} className="card card-lift block w-full p-3 text-left">
                  <span className="font-display">{e.title || "Tanpa judul"}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
