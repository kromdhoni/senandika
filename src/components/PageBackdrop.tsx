/** Latar malam yang sama untuk Koleksi, Kenangan, Timeline, Kapsul. */
export default function PageBackdrop() {
  const base = import.meta.env.BASE_URL;
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
      <img src={`${base}covers/malam.jpg`} alt="" className="h-full w-full object-cover" />
      <div className="absolute inset-0 bg-[#0b1520]/82" />
    </div>
  );
}
