import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";

/** Kepala halaman ala bahasa Finsyc: pil + judul besar + sub. */
export default function PageHero({
  pill,
  title,
  sub,
}: {
  pill: string;
  title: ReactNode;
  sub?: string;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-2 rounded-full border border-[#2e86c1]/15 bg-[#2e86c1]/5 px-4 py-1.5"
      >
        <Sparkles className="h-4 w-4 text-[#2e86c1]" />
        <span className="font-inter text-sm font-normal text-[#2e86c1]">{pill}</span>
      </motion.div>
      <motion.h2
        initial={{ y: 20, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="font-onest mt-4 text-3xl font-semibold tracking-[-1px] md:text-[40px] md:leading-[46px]"
      >
        {title}
      </motion.h2>
      {sub && (
        <motion.p
          initial={{ y: 16, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="font-inter mt-3 max-w-xl text-[15px] leading-relaxed opacity-70 md:text-base"
        >
          {sub}
        </motion.p>
      )}
    </div>
  );
}
