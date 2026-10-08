import { motion } from "framer-motion";
import { Feather, HeartHandshake, Hourglass, MailOpen, Sparkles } from "lucide-react";
import type { View } from "../../types";

const CARDS: {
  title: string;
  desc: string;
  icon: typeof MailOpen;
  photo: string;
  go: View;
}[] = [
  {
    title: "Surat",
    desc: "Ditulis untuk seseorang, meskipun tidak pernah dikirim.",
    icon: MailOpen,
    photo: "covers/cinta-4.jpg",
    go: "senandika",
  },
  {
    title: "Puisi",
    desc: "Rangkaian kata yang jujur dan menohok pelan.",
    icon: Feather,
    photo: "covers/malam.jpg",
    go: "senandika",
  },
  {
    title: "Kenangan",
    desc: "Cerita dan momen yang tidak ingin dilupakan.",
    icon: HeartHandshake,
    photo: "covers/rumah.jpg",
    go: "kenangan",
  },
  {
    title: "Kapsul",
    desc: "Pesan terkunci untuk dirimu di masa depan.",
    icon: Hourglass,
    photo: "covers/harap-5.jpg",
    go: "kapsul",
  },
];

export default function FinsycFeatures({ go }: { go: (v: View) => void }) {
  const base = import.meta.env.BASE_URL;
  return (
    <section className="w-full bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-2 whitespace-nowrap rounded-full border border-[#2e86c1]/15 bg-[#2e86c1]/5 px-4 py-1.5"
          >
            <Sparkles className="h-4 w-4 text-[#2e86c1]" />
            <span className="font-inter text-base font-normal leading-6 tracking-[-0.3px] text-[#2e86c1]">
              Isi Senandika
            </span>
          </motion.div>

          <motion.h2
            initial={{ y: 24, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-onest mt-6 w-full max-w-[686px] text-center text-[32px] font-semibold leading-tight tracking-[-1.2px] text-[#1d1d1f] sm:text-[40px] lg:text-[52px] lg:leading-[58px]"
          >
            Semua perasaan punya{" "}
            <span className="font-playfair font-semibold italic text-black/40">rumah</span>
          </motion.h2>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4">
          {CARDS.map((c, idx) => (
            <motion.button
              key={c.title}
              onClick={() => go(c.go)}
              initial={{ y: 40, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.1 + idx * 0.1 }}
              className="group flex flex-col overflow-hidden rounded-[24px] border border-black/5 bg-white text-left shadow-[0_4px_24px_rgba(0,0,0,0.04)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(0,0,0,0.10)]"
            >
              <div className="h-44 w-full overflow-hidden">
                <img
                  src={`${base}${c.photo}`}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-col gap-2 p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#2e86c1]/20 bg-[#2e86c1]/5">
                  <c.icon className="h-5 w-5 text-[#2e86c1]" strokeWidth={2.2} />
                </span>
                <h3 className="font-onest text-xl font-semibold tracking-[-0.8px] text-[#1d1d1f]">
                  {c.title}
                </h3>
                <p className="font-inter text-base font-normal leading-relaxed text-[#1d1d1f]/80">
                  {c.desc}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}
