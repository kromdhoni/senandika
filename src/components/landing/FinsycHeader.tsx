import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import NightMedia from "../NightMedia";
import Typewriter from "../Typewriter";
import type { View } from "../../types";

export default function FinsycHeader({
  go,
  lines,
  headLines,
}: {
  go: (v: View) => void;
  lines: string[];
  headLines: string[];
}) {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, ease: "easeOut" as const }}
      className="relative w-full overflow-hidden"
    >
      <div className="absolute inset-0 z-0">
        <NightMedia className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[#0b1520]/72" />
        <div className="aurora-a absolute -left-24 top-1/4 h-96 w-96 rounded-full bg-[#2e86c1]/25 blur-[100px]" aria-hidden="true" />
        <div className="aurora-b absolute -right-24 top-1/2 h-[28rem] w-[28rem] rounded-full bg-[#6bb8e8]/15 blur-[110px]" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b1520]/60 via-transparent to-[var(--bg)]" />
        <span className="twinkle absolute left-[12%] top-[22%] text-xl text-white/70" style={{ animationDelay: "0s" }} aria-hidden="true">✦</span>
        <span className="twinkle absolute right-[14%] top-[32%] text-sm text-white/60" style={{ animationDelay: "1.2s" }} aria-hidden="true">✦</span>
        <span className="twinkle absolute bottom-[28%] left-[22%] text-base text-white/50" style={{ animationDelay: "2.1s" }} aria-hidden="true">✦</span>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8 lg:pt-8">


        <div className="flex flex-col items-center pb-16 pt-14 lg:pt-20">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" as const }}
            className="mb-6 flex flex-row items-center gap-2 whitespace-nowrap rounded-full border border-white/40 bg-white/10 px-3 py-1.5 backdrop-blur-sm sm:px-[14px]"
          >
            <Sparkles className="h-4 w-4 fill-white text-white" />
            <span className="font-inter text-sm font-medium text-white sm:text-base">
              Puisi · Surat · Kenangan · Doa
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
