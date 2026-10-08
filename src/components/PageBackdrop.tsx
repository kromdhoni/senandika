import NightMedia from "./NightMedia";

/** Latar malam bergerak yang sama untuk Koleksi, Kenangan, Timeline, Kapsul. */
export default function PageBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
      <NightMedia className="h-full w-full object-cover" />
      <div className="absolute inset-0 bg-[#0b1520]/72" />
    </div>
  );
}
