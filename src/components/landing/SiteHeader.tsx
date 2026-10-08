import { Moon, PenLine, Sun } from "lucide-react";
import { cn } from "../../lib/utils";
import type { View } from "../../types";

const NAV: { id: View; label: string }[] = [
  { id: "senandika", label: "Koleksi" },
  { id: "kenangan", label: "Kenangan" },
  { id: "timeline", label: "Timeline" },
  { id: "kapsul", label: "Kapsul" },
];

export default function SiteHeader({
  view,
  go,
  theme,
  onTheme,
  admin,
  onWrite,
}: {
  view: View;
  go: (v: View) => void;
  theme: "light" | "dark";
  onTheme: () => void;
  admin: boolean;
  onWrite: () => void;
}) {
  return (
    <header
      className="sticky top-0 z-30 border-b backdrop-blur-md"
      style={{
        background: "color-mix(in srgb, var(--bg) 86%, transparent)",
        borderColor: "color-mix(in srgb, var(--muted) 25%, transparent)",
      }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <button
          onClick={() => go("landing")}
          className="font-display text-lg font-semibold uppercase tracking-[0.24em]"
          aria-label="Senandika beranda"
        >
          Senandika
        </button>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Navigasi utama">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => go(n.id)}
              className={cn(
                "font-onest text-[15px]",
                view === n.id
                  ? "font-semibold underline underline-offset-8"
                  : "opacity-70 hover:opacity-100",
              )}
            >
              {n.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={onTheme}
            aria-label={theme === "dark" ? "Mode terang" : "Mode gelap"}
            title={theme === "dark" ? "Mode terang" : "Mode gelap"}
            className="icon-btn"
          >
            {theme === "dark" ? (
              <Sun className="h-[18px] w-[18px]" />
            ) : (
              <Moon className="h-[18px] w-[18px]" />
            )}
          </button>
          {admin && (
            <>
              <button onClick={onWrite} className="btn-primary hidden px-5 py-2 text-sm md:block">
                + Tulis
              </button>
              <button onClick={onWrite} aria-label="Tulis baru" title="Tulis baru" className="icon-btn md:hidden">
                <PenLine className="h-[18px] w-[18px]" />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
