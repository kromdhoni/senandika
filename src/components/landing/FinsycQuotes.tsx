import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Quote } from "lucide-react";
import type { Entry } from "../../types";

export default function FinsycQuotes({
  entries,
  onOpen,
}: {
  entries: Entry[];
  onOpen: (id: string) => void;
}) {
  const poems = entries.filter((e) => e.type === "POEM").slice(0, 8);
  const [idx, setIdx] = useState(0);
  const base = import.meta.env.BASE_URL;

  useEffect(() => {
    if (poems.length < 2) return;
    const t = window.setInterval(() => setIdx((i) => (i + 1) % poems.length), 6000);
    return () => window.clearInterval(t);
  }, [poems.length]);

  if (poems.length === 0) return null;
  const cur = poems[idx % poems.length];
  const excerpt = cur.content.split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 4).join(" / ");

  return (
    <section className="flex w-full justify-center overflow-hidden bg-white py-20 lg:py-28">
      <div className="flex w-full max-w-[1248px] flex-col items-center px-4 sm:px-6">
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#2e86c1]/10 bg-[#2e86c1]/5 px-3 py-1"
        >
          <Quote className="h-3.5 w-3.5 text-[#2e86c1]" />
          <span className="text-[14px] font-medium text-[#2e86c1]">Pilihan larik</span>
        </motion.div>

        <h2 className="font-onest mb-12 max-w-[690px] text-center text-[28px] font-semibold leading-tight tracking-tight text-[#1d1d1f] sm:text-[36px] md:text-[52px]">
          Kata yang <i className="text-black/40">tinggal</i> di kepala
        </h2>

        <div className="relative w-full max-w-[760px]">
          <AnimatePresence mode="wait">
            <motion.button
              key={cur.id}
              onClick={() => onOpen(cur.id)}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.5 }}
              className="relative block w-full overflow-hidden rounded-[30px] text-left"
            >
              {cur.cover && (
                <img src={`${base}${cur.cover}`} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
              )}
              <div className="absolute inset-0 bg-[#0b1520]/72" />
              <div className="relative flex min-h-[320px] flex-col items-center justify-center px-8 py-12 text-center md:min-h-[360px]">
                <p className="font-quote max-w-[560px] text-[22px] italic leading-snug text-white md:text-[28px]">
                  “{excerpt}”
                </p>
                <p className="font-inter mt-6 text-sm font-medium uppercase tracking-[0.2em] text-white/70">
                  {cur.title || "Tanpa judul"}
                </p>
              </div>
            </motion.button>
          </AnimatePresence>
        </div>

        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            onClick={() => setIdx((i) => (i - 1 + poems.length) % poems.length)}
            aria-label="Larik sebelumnya"
            className="flex h-12 w-12 items-center justify-center rounded-full border border-black/10 bg-white transition-colors hover:bg-black/5"
          >
            <ArrowLeft className="h-5 w-5 text-[#1d1d1f]" />
          </button>
          <div className="flex gap-1.5">
            {poems.map((p, i) => (
              <button
                key={p.id}
                onClick={() => setIdx(i)}
                aria-label={`Larik ${i + 1}`}
                className="h-1.5 rounded-full"
                style={{
                  width: i === idx % poems.length ? "20px" : "6px",
                  background: i === idx % poems.length ? "#2e86c1" : "rgba(0,0,0,0.15)",
                }}
              />
            ))}
          </div>
          <button
            onClick={() => setIdx((i) => (i + 1) % poems.length)}
            aria-label="Larik berikutnya"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1d1d1f] transition-colors hover:bg-black"
          >
            <ArrowRight className="h-5 w-5 text-white" />
          </button>
        </div>
      </div>
    </section>
  );
}
