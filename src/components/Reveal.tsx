"use client";
import { useEffect, useRef, type ReactNode } from "react";

// Fait apparaître la section en douceur quand on arrive dessus. Si le navigateur ne sait pas
// le faire (ou si la personne a réduit les animations), le contenu reste simplement visible.
export default function Reveal({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return; // déjà visible : on n'anime pas
    el.classList.add("reveal");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { el.classList.add("reveal-in"); io.disconnect(); }
      });
    }, { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref}>{children}</div>;
}
