import { useState } from "react";

/** Video langit malam + poster diam (penghemat gerak & data). */
export default function NightMedia({ className = "" }: { className?: string }) {
  const base = import.meta.env.BASE_URL;
  const [still] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  if (still) {
    return (
      <img
        src={`${base}covers/malam.jpg`}
        alt=""
        aria-hidden="true"
        className={className}
      />
    );
  }
  return (
    <video
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      poster={`${base}covers/malam.jpg`}
      aria-hidden="true"
      className={className}
    >
      <source src={`${base}video/night.mp4`} type="video/mp4" />
    </video>
  );
}
