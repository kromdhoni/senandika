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
  download,
  getTheme,
  load,
  save,
  setTheme,
  toMarkdownEntry,
  uid,
} from "./lib/store";

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

export default function App() {
  const { entries, setEntries, memories, setMemories } = useSenandika();
  const [view, setView] = useState<View>("landing");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Entry>(emptyDraft);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [query, setQuery] = useState("");
  const [filterRecipient, setFilterRecipient] = useState<Recipient | "Semua">("Semua");
  const [theme, setThemeState] = useState<"light" | "dark">(getTheme());
  const timer = useRef<number | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    setTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (view !== "tulis") return;
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
  }, [draft, view, setEntries]);

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
    setDraft(emptyDraft());
    setSaveState("idle");
    setView("tulis");
  }

  function openEdit(e: Entry) {
    setDraft({ ...e });
    setSaveState("idle");
    setView("tulis");
  }

  function finishWriting() {
    setEntries((prev) =>
      prev.map((e) =>
        e.id === draft.id ? { ...draft, status: "saved", updatedAt: new Date().toISOString() } : e,
      ),
    );
    setActiveId(draft.id);
    setView("baca");
  }

  function removeEntry(id: string) {
    if (!window.confirm("Hapus tulisan ini?\n\nSetelah dihapus, tulisan ini tidak dapat dikembalikan.")) return;
    setEntries((prev) => prev.filter((e) => e.id !== id));
    if (activeId === id) setActiveId(null);
    setView("senandika");
  }

  function toggleFav(id: string) {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, isFavorite: !e.isFavorite } : e)));
  }

  const nav: { id: View; label: string }[] = [
    { id: "dashboard", label: "Beranda" },
    { id: "senandika", label: "Senandika" },
    { id: "kenangan", label: "Kenangan" },
    { id: "timeline", label: "Timeline" },
  ];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b" style={{ background: "var(--bg)", borderColor: "color-mix(in srgb, var(--muted) 25%, transparent)" }}>
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <button onClick={() => setView("landing")} className="font-display text-xl font-semibold tracking-tight" aria-label="Senandika beranda">
            Senandika
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
            <button onClick={openNew} className="btn-primary ml-2 px-5 py-2 text-sm">
              + Tulis
            </button>
          </nav>
          <button onClick={openNew} className="btn-primary px-4 py-2 text-sm md:hidden">
            + Tulis
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-28 pt-8 md:pb-16">
        {view === "landing" && (
          <section className="fade-in mx-auto max-w-3xl py-10 text-center md:py-20">
            <p className="text-sm uppercase tracking-[0.2em] opacity-60">Ruang personal · privat · tenang</p>
            <h1 className="font-display mt-4 text-4xl font-medium md:text-6xl">Ada kata yang belum sempat terucap.</h1>
            <p className="mx-auto mt-5 max-w-xl text-lg opacity-80">Tuliskan di sini. Simpan sebagai bagian dari perjalanan hidupmu.</p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button onClick={openNew} className="btn-primary">Mulai Menulis</button>
              <button onClick={() => setView("dashboard")} className="btn-ghost">Lihat Cara Kerjanya</button>
            </div>
            <div className="mt-14 grid gap-4 text-left sm:grid-cols-2">
              {[
                ["Tulis", "Tuliskan apa pun yang ingin disampaikan."],
                ["Kenangan", "Simpan cerita dan momen yang tidak ingin dilupakan."],
                ["Surat", "Tuliskan surat untuk seseorang, meskipun tidak pernah dikirim."],
                ["Timeline", "Lihat perjalanan cerita berdasarkan waktu."],
              ].map(([t, d]) => (
                <div key={t} className="card p-5">
                  <h3 className="font-display text-lg font-semibold">{t}</h3>
                  <p className="mt-1 text-sm opacity-75">{d}</p>
                </div>
              ))}
            </div>
            <blockquote className="font-display mx-auto mt-14 max-w-xl text-xl italic opacity-80">
              “Tidak semua perasaan harus dikirim. Beberapa cukup dituliskan agar tidak hilang.”
            </blockquote>
          </section>
        )}

        {view === "dashboard" && (
          <section className="fade-in mx-auto max-w-3xl">
            <h2 className="font-display text-3xl font-medium">Selamat datang kembali.</h2>
            <p className="mt-2 opacity-75">Hari ini, apa yang ingin kamu ceritakan?</p>
            <button onClick={openNew} className="btn-primary mt-5">+ Tulis Senandika</button>
            <div className="card mt-8 p-6">
              <h3 className="text-sm uppercase tracking-widest opacity-60">Senandika terakhir</h3>
              {entries[0] ? (
                <button
                  className="mt-2 block w-full text-left"
                  onClick={() => { setActiveId(entries[0].id); setView("baca"); }}
                >
                  <span className="font-display text-xl">“{entries[0].title || "Tanpa judul"}”</span>
                  <span className="mt-1 block text-sm opacity-60">
                    {new Date(entries[0].updatedAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })} · Untuk {entries[0].recipient}
                  </span>
                </button>
              ) : (
                <p className="mt-2 opacity-70">Belum ada cerita di sini. Mungkin ada sesuatu yang ingin kamu tuliskan hari ini.</p>
              )}
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="card p-6">
                <h3 className="text-sm uppercase tracking-widest opacity-60">Kenangan</h3>
                <p className="font-display mt-2 text-2xl">{memories.length} cerita</p>
              </div>
              <div className="card p-6">
                <h3 className="text-sm uppercase tracking-widest opacity-60">Yang ingin kusampaikan</h3>
                <p className="mt-2 text-sm">Ayah · {counts.Ayah} &nbsp; Ibu · {counts.Ibu} &nbsp; Diriku · {counts.Diriku}</p>
              </div>
            </div>
          </section>
        )}

        {(view === "senandika" || view === "favorit") && (
          <section className="fade-in mx-auto max-w-3xl">
            <h2 className="font-display text-3xl font-medium">{view === "favorit" ? "Favorit" : "Senandika"}</h2>
            <p className="mt-1 text-sm opacity-70">
              {view === "favorit" ? "Tulisan yang paling berarti bagimu." : "Cari cerita, kenangan, atau kata yang pernah kamu tulis."}
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
            <div className="mt-6 grid gap-3">
              {(view === "favorit" ? filtered.filter((e) => e.isFavorite) : filtered).map((e) => (
                <article key={e.id} className="card p-5">
                  <button className="block w-full text-left" onClick={() => { setActiveId(e.id); setView("baca"); }}>
                    <span className="text-xs uppercase tracking-widest opacity-60">{e.type} · Untuk {e.recipient}</span>
                    <span className="font-display mt-1 block text-xl">{e.title || "Tanpa judul"}</span>
                    <span className="mt-1 block text-sm opacity-70">{e.content.slice(0, 120)}{e.content.length > 120 ? "…" : ""}</span>
                  </button>
                  <div className="mt-3 flex gap-2 text-sm">
                    <button onClick={() => toggleFav(e.id)} className="underline underline-offset-4" aria-label="Tandai favorit">
                      {e.isFavorite ? "★ Favorit" : "☆ Tandai"}
                    </button>
                    <button onClick={() => openEdit(e)} className="underline underline-offset-4">Ubah</button>
                  </div>
                </article>
              ))}
              {(view === "favorit" ? filtered.filter((e) => e.isFavorite) : filtered).length === 0 && (
                <div className="card p-8 text-center">
                  <p className="font-display text-xl">Belum ada cerita di sini.</p>
                  <p className="mt-1 text-sm opacity-70">Mungkin ada sesuatu yang ingin kamu tuliskan hari ini.</p>
                  <button onClick={openNew} className="btn-primary mt-4">Mulai Menulis</button>
                </div>
              )}
            </div>
          </section>
        )}

        {view === "tulis" && (
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
            <p className="text-xs uppercase tracking-widest opacity-60">{active.type} · Untuk {active.recipient} · {active.mood || "Tanpa mood"}</p>
            <h2 className="font-display mt-2 text-4xl font-medium">{active.title || "Tanpa judul"}</h2>
            <p className="mt-2 text-sm opacity-60">{new Date(active.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
            <div className="prose-read mt-6 whitespace-pre-wrap">{active.content}</div>
            <div className="mt-8 flex flex-wrap gap-2">
              <button onClick={() => toggleFav(active.id)} className="btn-ghost text-sm">{active.isFavorite ? "★ Favorit" : "☆ Jadikan favorit"}</button>
              <button onClick={() => openEdit(active)} className="btn-ghost text-sm">Ubah</button>
              <button onClick={() => download(`${active.title || "senandika"}.md`, toMarkdownEntry(active), "text/markdown")} className="btn-ghost text-sm">Export .md</button>
              <button onClick={() => removeEntry(active.id)} className="btn-ghost text-sm">Hapus</button>
            </div>
          </article>
        )}

        {view === "kenangan" && (
          <section className="fade-in mx-auto max-w-3xl">
            <h2 className="font-display text-3xl font-medium">Kenangan</h2>
            <p className="mt-1 text-sm opacity-70">Simpan cerita dan momen yang tidak ingin dilupakan.</p>
            <MemoryForm onAdd={(m) => setMemories((p) => [m, ...p])} />
            <div className="mt-6 grid gap-3">
              {memories.map((m) => (
                <div key={m.id} className="card p-5">
                  <p className="text-xs uppercase tracking-widest opacity-60">{m.memoryDate} {m.location ? `· ${m.location}` : ""}</p>
                  <h3 className="font-display mt-1 text-xl">{m.title}</h3>
                  <p className="mt-1 text-sm opacity-80">{m.story}</p>
                  <button onClick={() => setMemories((p) => p.filter((x) => x.id !== m.id))} className="mt-3 text-sm underline underline-offset-4">Hapus</button>
                </div>
              ))}
              {memories.length === 0 && <p className="opacity-70">Belum ada kenangan. Tambahkan momen pertamamu di atas.</p>}
            </div>
          </section>
        )}

        {view === "timeline" && (
          <section className="fade-in mx-auto max-w-3xl">
            <h2 className="font-display text-3xl font-medium">Timeline</h2>
            <p className="mt-1 text-sm opacity-70">Perjalanan ceritamu berdasarkan waktu.</p>
            <TimelineList entries={entries} onOpen={(id) => { setActiveId(id); setView("baca"); }} />
          </section>
        )}

        {view === "pengaturan" && (
          <section className="fade-in mx-auto max-w-3xl">
            <h2 className="font-display text-3xl font-medium">Pengaturan</h2>
            <div className="card mt-4 p-6">
              <h3 className="font-semibold">Tema</h3>
              <button onClick={() => setThemeState(theme === "dark" ? "light" : "dark")} className="btn-ghost mt-2 text-sm">
                Saat ini: {theme === "dark" ? "Gelap" : "Terang"} — alihkan
              </button>
            </div>
            <div className="card mt-4 p-6">
              <h3 className="font-semibold">Data milikmu</h3>
              <p className="mt-1 text-sm opacity-70">Tulisan pribadi pengguna bukan produk untuk dijual. Export kapan pun.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={() => download("senandika-backup.json", JSON.stringify({ entries, memories }, null, 2), "application/json")} className="btn-ghost text-sm">Export JSON</button>
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
              </div>
            </div>
          </section>
        )}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-10 border-t md:hidden" style={{ background: "var(--surface)" }} aria-label="Navigasi seluler">
        <div className="grid grid-cols-5 text-xs">
          {[
            { id: "dashboard", label: "Beranda" },
            { id: "senandika", label: "Senandika" },
            { id: "tulis", label: "+ Tulis" },
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
    <div className="mt-6 space-y-6">
      {groups.map(([label, list]) => (
        <div key={label}>
          <h3 className="text-sm uppercase tracking-widest opacity-60">{label}</h3>
          <div className="mt-2 space-y-2 border-l-2 pl-4" style={{ borderColor: "var(--accent)" }}>
            {list.map((e) => (
              <button key={e.id} onClick={() => onOpen(e.id)} className="card block w-full p-4 text-left">
                <span className="font-display text-lg">{e.title || "Tanpa judul"}</span>
                <span className="block text-xs opacity-60">Untuk {e.recipient}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
