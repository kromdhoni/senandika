import { useEffect, useState } from "react";

/** Headline yang mengetik sendiri, bergantian antar baris. */
export default function Typewriter({ lines }: { lines: string[] }) {
  const [text, setText] = useState("");
  const [li, setLi] = useState(0);

  useEffect(() => {
    const line = lines[li % lines.length] ?? "";
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setText(line);
      return;
    }
    let chars = 0;
    let deleting = false;
    let timer = 0;
    function tick() {
      if (!deleting) {
        chars += 1;
        setText(line.slice(0, chars));
        if (chars >= line.length) {
          deleting = true;
          timer = window.setTimeout(tick, 2400);
          return;
        }
        timer = window.setTimeout(tick, 45 + Math.random() * 45);
      } else {
        chars -= 1;
        setText(line.slice(0, chars));
        if (chars <= 0) {
          setLi((v) => (v + 1) % lines.length);
          return;
        }
        timer = window.setTimeout(tick, 16);
      }
    }
    timer = window.setTimeout(tick, 500);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [li]);

  return (
    <span>
      <span aria-hidden="true">{text}</span>
      <span className="caret" aria-hidden="true" />
      <span className="sr-only">{lines[0]}</span>
    </span>
  );
}
