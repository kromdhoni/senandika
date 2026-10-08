import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Check, Headphones, Send, Sparkles, Timer } from "lucide-react";
import { cn } from "../../lib/utils";
import type { View } from "../../types";

interface Step {
  id: number;
  label: string;
  icon: typeof BookOpen;
  heading: string;
  subheading: string;
  list: string[];
  photo: string;
  go: View;
  cta: string;
}

const STEPS: Step[] = [
  {
    id: 1,
    label: "Baca",
    icon: BookOpen,
    heading: "Jelajahi Koleksi",
    subheading: "Puluhan tulisan berfoto menunggumu. Cari, telusuri timeline dan kalender, atau biarkan Kocok memilihkan satu untukmu.",
    list: ["43 tulisan berfoto sampul", "Pencarian, timeline, dan kalender", "Tombol Kocok untuk kejutan"],
    photo: "covers/cinta-1.jpg",
    go: "senandika",
    cta: "Buka Koleksi",
  },
  {
    id: 2,
    label: "Resapi",
    icon: Headphones,
    heading: "Layar penuh dan dengarkan",
    subheading: "Sembunyikan semuanya kecuali kata-katanya. Perbesar huruf, atau biarkan suara membacakannya untukmu.",
    list: ["Mode imersif tanpa gangguan", "Ukuran huruf A- sampai A+", "Audio berbahasa Indonesia"],
    photo: "covers/tenang-2.jpg",
    go: "senandika",
    cta: "Coba membaca",
  },
  {
    id: 3,
    label: "Bagikan",
    icon: Send,
    heading: "Kirim ke yang tersayang",
    subheading: "Setiap tulisan punya tautan sendiri dan kartu gambar cantik. Kirim lewat WhatsApp, Telegram, atau X.",
    list: ["Tautan per tulisan", "Kartu gambar 1080p siap status", "Pratinjau cantik di chat"],
    photo: "covers/harap-6.jpg",
    go: "senandika",
    cta: "Lihat tulisan",
  },
  {
    id: 4,
    label: "Simpan",
    icon: Timer,
    heading: "Kapsul untuk masa depan",
    subheading: "Tulis pesan hari ini, kunci sampai tanggal yang kau tentukan. Akan ada pesan dari masa lalu menunggumu.",
    list: ["Terkunci sampai waktunya tiba", "Hitung mundur hari", "Momen dibuka yang syahdu"],
    photo: "covers/harap-5.jpg",
    go: "kapsul",
    cta: "Buka Kapsul",
  },
];

export default function FinsycHowItWorks({ go }: { go: (v: View) => void }) {
  const [activeTab, setActiveTab] = useState(1);
  const base = import.meta.env.BASE_URL;
  const active = STEPS.find((s) => s.id === activeTab) ?? STEPS[0];

  return (
    <section className="w-full overflow-hidden bg-[#F4F8FC] py-20 lg:py-28">
      <div className="relative mx-auto w-full max-w-[1248px] px-4 md:px-6">
        <div className="flex flex-col items-start gap-12 lg:gap-14">
          <div className="flex flex-col items-start">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              className="mb-6 flex items-center gap-2 whitespace-nowrap rounded-full border border-[#2e86c1]/10 bg-[#2e86c1]/5 px-4 py-1.5"
            >
              <Sparkles className="h-4 w-4 text-[#2e86c1]" strokeWidth={2.5} />
              <span className="font-inter text-center text-base font-normal leading-6 tracking-[-0.3px] text-[#2e86c1]">
                Cara menikmati
              </span>
            </motion.div>

            <motion.h2
              initial={{ x: -30, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="font-onest w-full max-w-[556px] text-left text-[32px] font-semibold leading-tight tracking-[-1.2px] text-[#1d1d1f] sm:text-[44px] lg:text-[52px] lg:leading-[58px]"
            >
              Empat cara <span className="font-playfair font-semibold italic text-black/40">sederhana</span> merasakannya
            </motion.h2>
          </div>

          <div className="flex w-full flex-col gap-6">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="flex w-full items-center gap-2 overflow-x-auto rounded-2xl bg-white p-4 shadow-[0_1px_20px_0_rgba(30,100,160,0.06)] lg:justify-between lg:px-6 lg:py-4"
            >
              {STEPS.map((step) => {
                const isActive = activeTab === step.id;
                return (
                  <button
                    key={step.id}
                    onClick={() => setActiveTab(step.id)}
                    className={cn(
                      "flex shrink-0 items-center gap-3 rounded-xl px-4 py-2.5 transition-all duration-300 sm:px-6",
                      isActive ? "bg-white" : "hover:bg-[#F4F8FC]",
                    )}
                  >
                    <step.icon className={cn("h-[22px] w-[22px]", isActive ? "text-[#2e86c1]" : "text-[#1d1d1f]/60")} strokeWidth={2.5} />
                    <span className={cn(
                      "font-inter whitespace-nowrap text-base leading-[28px] sm:text-[18px]",
                      isActive ? "font-medium text-[#2e86c1]" : "font-normal text-[#1d1d1f]/60",
                    )}>
                      {step.label}
                    </span>
                  </button>
                );
              })}
            </motion.div>

            <div className="w-full">
              <div className="flex w-full flex-col items-center justify-between gap-12 overflow-hidden rounded-[32px] border border-black/[0.04] bg-white p-6 shadow-[0_0_20px_0_rgba(30,100,160,0.05)] lg:flex-row lg:gap-0 lg:p-4 lg:pl-16 lg:pr-4">
                <div className="flex w-full flex-col items-start text-left lg:w-[534px]">
                  <motion.div
                    key={"icon-" + activeTab}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="mb-3 flex h-16 w-16 items-center justify-center rounded-xl border border-black/10 bg-white p-4 shadow-sm"
                  >
                    <active.icon className="h-8 w-8 text-[#2e86c1]" strokeWidth={2.2} />
                  </motion.div>

                  <motion.h3
                    key={"h3-" + activeTab}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="font-onest mb-4 text-[28px] font-semibold leading-tight tracking-[-1px] text-[#1d1d1f] lg:text-[34px] lg:leading-[38px]"
                  >
                    {active.heading}
                  </motion.h3>

                  <motion.p
                    key={"p-" + activeTab}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.3 }}
                    className="font-inter mb-8 text-base font-normal leading-relaxed text-[#1d1d1f]/80 lg:text-[18px] lg:leading-[28px]"
                  >
                    {active.subheading}
                  </motion.p>

                  <div className="mb-12 flex flex-col gap-3">
                    {active.list.map((item, i) => (
                      <motion.div
                        key={"li-" + activeTab + "-" + i}
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.2 + i * 0.1, duration: 0.3 }}
                        className="flex items-center gap-3"
                      >
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#2e86c1]/10">
                          <Check className="h-3 w-3 text-[#2e86c1]" strokeWidth={3} />
                        </div>
                        <span className="font-inter text-base font-medium leading-6 tracking-[-0.3px] text-[#1d1d1f]">
                          {item}
                        </span>
                      </motion.div>
                    ))}
                  </div>

                  <button
                    onClick={() => go(active.go)}
                    className="btn-primary px-7 py-3 text-base"
                  >
                    {active.cta}
                  </button>
                </div>

                <div className="relative h-[320px] w-full overflow-hidden rounded-[24px] sm:h-[420px] lg:h-[520px] lg:w-[480px]">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={"img-" + activeTab}
                      src={`${base}${active.photo}`}
                      alt=""
                      initial={{ scale: 0.94, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 1.04, opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  </AnimatePresence>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0b1520]/55 via-transparent to-transparent" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </section>
    );
}
