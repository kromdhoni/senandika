/**
 * Latar ombak berlapis yang bergerak pelan — fixed di dasar layar,
 * di belakang konten, tanpa mengganggu keterbacaan.
 * Mati total saat pengguna memakai prefers-reduced-motion (via CSS).
 */
const LAYERS = [
  { opacity: 0.14, duration: "26s", reverse: false, y: "0%" },
  { opacity: 0.09, duration: "40s", reverse: true, y: "3%" },
  { opacity: 0.06, duration: "58s", reverse: false, y: "6%" },
];

export default function Waves() {
  return (
    <div
      aria-hidden="true"
      className="waves-bg pointer-events-none fixed inset-x-0 bottom-0 -z-10 h-[38vh] min-h-[240px] overflow-hidden"
    >
      {LAYERS.map((l, i) => (
        <svg
          key={i}
          className="wave-svg absolute bottom-0 left-0"
          style={{ top: l.y, animationDuration: l.duration, animationDirection: l.reverse ? "reverse" : "normal" }}
          viewBox="0 0 2880 120"
          preserveAspectRatio="none"
        >
          <path
            d="M0,64 C240,96 480,32 720,64 C960,96 1200,32 1440,64 C1680,96 1920,32 2160,64 C2400,96 2640,32 2880,64 L2880,120 L0,120 Z"
            fill="var(--accent)"
            fillOpacity={l.opacity}
          />
        </svg>
      ))}
    </div>
  );
}
