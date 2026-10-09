import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import type { View } from "../../types";

export default function FinsycFooter({
  go,
  onAdmin,
}: {
  go: (v: View) => void;
  onAdmin: () => void;
}) {
  const links: { label: string; id: View }[] = [
    { label: "Koleksi", id: "senandika" },
    { label: "Kenangan", id: "kenangan" },
    { label: "Timeline", id: "timeline" },
    { label: "Kapsul", id: "kapsul" },
    { label: "Tentang", id: "tentang" },
  ];

  return (
    <footer className="relative flex w-full flex-col items-center overflow-hidden bg-[#0b1520]">
      <section className="relative z-10 mx-auto flex w-full max-w-[1248px] flex-col items-center px-6 pb-0 pt-[100px]">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="font-onest w-full max-w-[742px] text-center text-[36px] font-semibold leading-[1.1] tracking-tight text-white sm:text-[48px] md:text-[64px]"
        >
          Simpan yang tak ingin <span className="font-playfair font-medium italic text-white/50">dilupakan</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-inter mt-6 w-full max-w-[560px] text-center text-lg leading-relaxed text-white/75"
        >
          Karena beberapa perasaan terlalu berarti untuk dibiarkan hilang bersama waktu.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
        >
          <button
            onClick={() => go("senandika")}
            className="flex h-14 items-center gap-3 rounded-full bg-white py-2 pl-6 pr-2 text-[#0b1520] transition-transform hover:scale-[1.03]"
          >
            <span className="font-inter text-[18px] font-medium leading-[28px]">Jelajahi Koleksi</span>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0b1520]">
              <ArrowUpRight className="h-4 w-4 text-white" />
            </span>
          </button>
          <button
            onClick={() => go("tentang")}
            className="flex h-14 items-center rounded-full border border-white/40 px-8 text-[18px] font-medium text-white transition-colors hover:bg-white/10"
          >
            Tentang Senandika
          </button>
        </motion.div>

        <div className="mt-16 flex w-full flex-col items-start gap-10 border-t border-white/10 pt-12 sm:flex-row sm:justify-between">
          <div className="max-w-[320px]">
            <p className="font-display text-lg font-semibold uppercase tracking-[0.24em] text-white">
              Senandika
            </p>
            <p className="font-inter mt-3 text-[15px] leading-relaxed text-white/60">
              Tempat kata-kata yang tak sempat terucap menemukan rumah.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-10 gap-y-4" aria-label="Navigasi bawah">
            {links.map((l) => (
              <button
                key={l.id}
                onClick={() => go(l.id)}
                className="font-inter text-[16px] text-white/70 transition-colors hover:text-white"
              >
                {l.label}
              </button>
            ))}
            <button
              onClick={onAdmin}
              className="font-inter text-[16px] text-white/70 transition-colors hover:text-white"
            >
              Admin
            </button>
          </nav>
        </div>

        <div className="w-full select-none" aria-hidden="true">
          <motion.div
            initial={{ y: "40%", opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: "easeOut" as const }}
          >
            <svg viewBox="0 0 1000 170" className="block w-full" role="img" aria-label="Senandika">
              <text
                x="500"
                y="132"
                textAnchor="middle"
                fontFamily="'Playfair Display', Georgia, serif"
                fontWeight="700"
                fontSize="148"
                letterSpacing="4"
                textLength="960"
                lengthAdjust="spacingAndGlyphs"
                fill="rgba(255,255,255,0.07)"
              >
                SENANDIKA
              </text>
            </svg>
          </motion.div>
        </div>

        <div className="flex w-full flex-col items-center justify-between gap-3 border-t border-white/10 py-6 sm:flex-row">
          <p className="font-inter text-sm text-white/50">© 2026 Senandika. Tulisan pribadi bukan produk untuk dijual.</p>
          <p className="font-inter text-sm text-white/50">Minimalis · Emosional · Personal</p>
        </div>
      </section>
    </footer>
  );
}
