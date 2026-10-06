import { useEffect, useMemo, useRef, useState } from "react";
import {
  ENTRY_TYPES,
  MOODS,
  RECIPIENTS,
  type Entry,
  type EntryType,
  type Memory,
  type Mood,
  type Recipient,
  type View,
} from "./types";
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
  toMarkdownEntry,
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
  const [filterRecipient, setFilterRecipient] = useState<Recipient | "Semua">("Semua");
  const [theme, setThemeState] = useState<"light" | "dark">(getTheme());
  const [admin, setAdmin] = useState(isAdmin());
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
      .filter((e) => (filterRecipient === "Semua" ? true : e.recipient === filterRecipient))
      .filter((e) => {
        if (!q) return true;
        return [e.title, e.content, e.recipient, e.mood, e.tags.join(" ")]
          .join(" ")
          .toLowerCase()
          .includes(q);
      })
      .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
  }, [entries, query, filterRecipient]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { Ayah: 0, Ibu: 0, Diriku: 0 };
    for (const e of entries) {
      if (e.recipient === "Ayah") c.Ayah += 1;
      else if (e.recipient === "Ibu") c.Ibu += 1;
      else if (e.recipient === "Diriku") c.Diriku += 1;
    }
    return c;
  }, [entries]);

  function openNew() {
    if (!admin) return;
    setDraft(emptyDraft());
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

  const nav: { id: View; label: string }[] = [
    { id: "dashboard", label: "Beranda" },
    { id: "senandika", label: "Senandika" },
    { id: "kenangan", label: "Kenangan" },
    { id: "timeline", label: "Timeline" },
  ];

  const favList = filtered.filter((e) => e.isFavorite);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b backdrop-blur" style={{ background: "color-mix(in srgb, var(--bg) 86%, transparent)", borderColor: "color-mix(in srgb, var(--muted) 25%, transparent)" }}>
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <button onClick={() => setView("landing")} className="font-display text-xl font-semibold tracking-tight" aria-label="Senandika beranda">
            Senandika
            <span style={{ color: "var(--accent)" }}>.</span>
          </button>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Navigasi utama">
            {nav.map((n) => (
              <button
                key={n.id}
                onClick={() => setView(n.id)}
                className={`rounded-full px-4 py-2 text-sm ${view === n.id ? "font-semibold underline underline-offset-8" : "opacity-70 hover:opacity-100"}`}
              >
                {n.label}
              </button>
            ))}
            <button onClick={() => setThemeState(theme === "dark" ? "light" : "dark")} className="btn-ghost ml-2 px-4 py-2 text-sm" aria-label="Alih tema">
              {theme === "dark" ? "Terang" : "Gelap"}
            </button>
            {admin && (
              <button onClick={openNew} className="btn-primary ml-2 px-5 py-2 text-sm">
                + Tulis
              </button>
            )}
          </nav>
          {admin ? (
            <button onClick={openNew} className="btn-primary px-4 py-2 text-sm md:hidden">
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
          <section className="fade-in mx-auto max-w-3xl py-10 text-center md:py-16">
            <p className="eyebrow">Ruang personal · privat · tenang</p>
            <h1 className="font-display mt-4 text-4xl font-medium md:text-6xl">
              Ada kata yang belum sempat <span className="accent-word">terucap.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg opacity-80">
              Senandika adalah rumah bagi surat, kenangan, dan doa — ditulis dengan tenang, disimpan dengan kasih.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button onClick={() => setView("senandika")} className="btn-primary">Mulai Membaca</button>
              <button onClick={() => setView("dashboard")} className="btn-ghost">Lihat Isinya</button>
            </div>

            {entries[0] && (
              <button onClick={() => { setActiveId(entries[0].id); setView("baca"); }} className="card card-lift hero-frame mx-auto mt-14 block max-w-xl p-7 text-left">
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

            <div className="stagger mt-14 grid gap-4 text-left sm:grid-cols-2" style={{ ["--i" as string]: 0 }}>
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

            <figure className="mx-auto mt-14 max-w-xl">
              <blockquote className="font-display text-xl italic opacity-80 md:text-2xl">
                “Tidak semua perasaan harus dikirim. Beberapa cukup dituliskan agar tidak hilang.”
              </blockquote>
              <div className="divider-orn mt-6" aria-hidden="true"><span>✦</span></div>
            </figure>
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
            {admin && <button onClick={openNew} className="btn-primary mt-5">+ Tulis Senandika</button>}
            <div className="card card-lift mt-8 p-6">
              <h3 className="eyebrow">Senandika terbaru</h3>
              {entries[0] ? (
                <button
                  className="mt-3 block w-full text-left"
                  onClick={() => { setActiveId(entries[0].id); setView("baca"); }}
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
                <button onClick={openNew} className="btn-primary hidden px-5 py-2 text-sm sm:block">+ Tulis</button>
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
            <div className="mt-3 flex flex-wrap gap-2" role="tablist" aria-label="Filter penerima">
              {(["Semua", ...RECIPIENTS] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setFilterRecipient(r)}
                  className={`rounded-full border px-3 py-1 text-sm ${filterRecipient === r ? "font-semibold underline underline-offset-4" : "opacity-70"}`}
                >
                  {r}
                </button>
              ))}
            </div>
            <div className="stagger mt-6 grid gap-3">
              {(view === "favorit" ? favList : filtered).map((e, i) => (
                <article key={e.id} className="card card-lift p-5" style={{ ["--i" as string]: Math.min(i, 6) }}>
                  <button className="block w-full text-left" onClick={() => { setActiveId(e.id); setView("baca"); }}>
                    <span className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-widest opacity-60">
                      {e.type} · Untuk {e.recipient} <MoodTag mood={e.mood} />
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
                </article>
              ))}
              {(view === "favorit" ? favList : filtered).length === 0 && (
                <div className="card p-8 text-center">
                  <p className="font-display text-xl">Belum ada cerita di sini.</p>
                  <p className="mt-1 text-sm opacity-70">
                    {admin ? "Mungkin ada sesuatu yang ingin kamu tuliskan hari ini." : "Koleksi ini masih disiapkan pemiliknya. Kembali lagi nanti."}
                  </p>
                  {admin && <button onClick={openNew} className="btn-primary mt-4">Mulai Menulis</button>}
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
              placeholder="Tuliskan di sini…"
              value={draft.content}
              onChange={(e) => setDraft({ ...draft, content: e.target.value })}
              aria-label="Isi tulisan"
            />
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
              {active.type} · Untuk {active.recipient} <MoodTag mood={active.mood} />
            </p>
            <h2 className="font-display mt-2 text-4xl font-medium md:text-5xl">{active.title || "Tanpa judul"}</h2>
            <p className="mt-3 text-sm opacity-60">
              {new Date(active.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
              {active.tags.length > 0 && ` · ${active.tags.join(" · ")}`}
            </p>
            <div className="divider-orn my-6" aria-hidden="true"><span>✦</span></div>
            <div className="prose-read dropcap whitespace-pre-wrap">{active.content}</div>
            <div className="mt-8 flex flex-wrap gap-2">
              <button onClick={() => toggleFav(active.id)} className="btn-ghost text-sm">{active.isFavorite ? "★ Favorit" : "☆ Jadikan favorit"}</button>
              {admin && <button onClick={() => openEdit(active)} className="btn-ghost text-sm">Ubah</button>}
              <button onClick={() => download(`${active.title || "senandika"}.md`, toMarkdownEntry(active), "text/markdown")} className="btn-ghost text-sm">Export .md</button>
              {admin && <button onClick={() => removeEntry(active.id)} className="btn-ghost text-sm">Hapus</button>}
            </div>
          </article>
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
            <TimelineList entries={entries} onOpen={(id) => { setActiveId(id); setView("baca"); }} />
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
                  <button onClick={openNew} className="btn-primary px-5 py-2 text-sm">+ Tulis Senandika</button>
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
          ].map((n) => (
            <button
              key={n.id}
              onClick={() => (n.id === "tulis" ? openNew() : setView(n.id as View))}
              className={`py-3 ${view === n.id ? "font-bold" : "opacity-70"}`}
            >
              {n.label}
            </button>
          ))}
        </div>
      </nav>
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
        inputMode="numeric"
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
              <button key={e.id} onClick={() => onOpen(e.id)} className="card card-lift relative block w-full p-4 text-left">
                <span className="timeline-dot" aria-hidden="true" />
                <span className="font-display text-lg">{e.title || "Tanpa judul"}</span>
                <span className="mt-1 flex flex-wrap items-center gap-2 text-xs opacity-60">
                  Untuk {e.recipient} <MoodTag mood={e.mood} />
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
