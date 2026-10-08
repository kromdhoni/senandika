import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Sparkles } from "lucide-react";
import Typewriter from "../Typewriter";
import type { View } from "../../types";

const NAV: { id: View; label: string }[] = [
  { id: "senandika", label: "Koleksi" },
  { id: "kenangan", label: "Kenangan" },
  { id: "timeline", label: "Timeline" },
  { id: "kapsul", label: "Kapsul" },
];

export default function FinsycHeader({
  go,
  lines,
  headLines,
}: {
  go: (v: View) => void;
  lines: string[];
  headLines: string[];
}) {
  const [ctaHover, setCtaHover] = useState(false);
  const base = import.meta.env.BASE_URL;

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, ease: "easeOut" as const }}
      className="relative w-full overflow-hidden"
    >
      <div className="absolute inset-0 z-0">
        <img
          src={`${base}covers/malam.jpg`}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[#0b1520]/72" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b1520]/60 via-transparent to-[var(--bg)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8 lg:pt-8">
        <motion.nav
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" as const }}
          className="flex items-center justify-between"
          aria-label="Navigasi utama"
        >
          <button
            onClick={() => window.scrollTo({ top: 0 })}
            className="font-display text-lg font-semibold uppercase tracking-[0.24em] text-white"
          >
            Senandika
          </button>

          <ul className="hidden items-center gap-8 lg:flex">
            {NAV.map((n) => (
              <li key={n.id}>
                <button
                  onClick={() => go(n.id)}
                  className="font-inter text-base font-normal leading-6 tracking-[-0.3px] text-white/80 transition-all hover:font-bold hover:opacity-100"
                >
                  {n.label}
                </button>
              </li>
            ))}
          </ul>

          <motion.button
            onMouseEnter={() => setCtaHover(true)}
            onMouseLeave={() => setCtaHover(false)}
            layout
            onClick={() => go("senandika")}
            className={
              "hidden h-11 cursor-pointer items-center gap-3 rounded-full border border-white/40 bg-white/10 py-1.5 backdrop-blur-sm transition-all duration-300 sm:flex " +
              (ctaHover ? "flex-row-reverse pl-1.5 pr-[18px]" : "flex-row pl-[18px] pr-1.5")
            }
          >
            <motion.span layout className="font-inter text-base font-medium leading-6 tracking-[-0.3px] text-white">
              Mulai Membaca
            </motion.span>
            <motion.div layout className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white">
              <motion.div
                animate={{ x: ctaHover ? [-20, 0] : 0, opacity: ctaHover ? [0, 1] : 1 }}
                transition={{ duration: 0.3, delay: ctaHover ? 0.1 : 0 }}
              >
                <ArrowUpRight className="h-3 w-3 text-[#0b1520]" />
              </motion.div>
            </motion.div>
          </motion.button>
        </motion.nav>

        <div className="flex flex-col items-center pb-16 pt-12 lg:pt-[72px]">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" as const }}
            className="mb-6 flex flex-row items-center gap-2 whitespace-nowrap rounded-full border border-white/40 bg-white/10 px-3 py-1.5 backdrop-blur-sm sm:px-[14px]"
          >
            <Sparkles className="h-4 w-4 fill-white text-white" />
            <span className="font-inter text-sm font-medium text-white sm:text-base">
              Ruang personal · privat · tenang
            </span>
          </motion.div>

          <motion.h1
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" as const }}
            className="font-display min-h-[2.6em] w-full max-w-[820px] text-center text-[40px] font-medium leading-tight text-white sm:text-[54px] lg:text-[68px] lg:leading-[74px]"
          >
            <Typewriter lines={headLines} />
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8, ease: "easeOut" as const }}
            className="font-inter mt-5 w-full max-w-[630px] text-center text-lg font-normal leading-relaxed tracking-[-0.4px] text-white/85 lg:text-[20px] lg:leading-[30px]"
          >
            Rumah bagi surat, kenangan, dan doa. Ditulis dengan tenang, disimpan dengan kasih.
          </motion.p>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1, duration: 0.8, ease: "easeOut" as const }}
            className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:mt-10"
          >
            <button
              onClick={() => go("senandika")}
              className="btn-primary px-8 py-3 text-base"
              style={{ background: "#f5f5f7", color: "#0b1520" }}
            >
              Mulai Membaca
            </button>
            <button
              onClick={() => go("tentang")}
              className="rounded-full border border-white/50 px-8 py-3 text-base font-semibold text-white transition-colors hover:bg-white/10"
            >
              Tentang Senandika
            </button>
          </motion.div>
        </div>

        {lines.length > 0 && (
          <div className="marquee pb-10" aria-label="Larik-larik puisi berjalan">
            <div className="marquee-track">
              {[0, 1].map((copy) => (
                <div key={copy} className="flex shrink-0 items-center gap-8 pr-8" aria-hidden={copy === 1}>
                  {lines.map((line) => (
                    <span key={`${copy}-${line}`} className="font-quote flex items-center gap-8 text-lg italic text-white/75">
                      {line} <span className="text-white/50">✦</span>
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.section>
  );
}
