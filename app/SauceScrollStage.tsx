"use client";

import { useEffect, useRef } from "react";

const clamp = (value: number, minimum = 0, maximum = 1) =>
  Math.min(maximum, Math.max(minimum, value));

export function SauceScrollStage() {
  const sectionRef = useRef<HTMLElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const scene = sceneRef.current;
    if (!section || !scene) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    let frame = 0;

    const setProgress = (progress: number) => {
      const easedProgress = progress * progress * (3 - 2 * progress);
      const mask = (1 - easedProgress) * 100;
      const phase =
        progress < 0.2 ? "plain" : progress < 0.78 ? "pour" : "done";

      scene.style.setProperty("--sauce-progress", progress.toFixed(4));
      scene.style.setProperty("--sauce-mask", `${mask.toFixed(3)}%`);
      scene.style.setProperty(
        "--sauce-scale",
        (0.94 + easedProgress * 0.06).toFixed(4),
      );
      scene.style.setProperty(
        "--sauce-rotate",
        `${(-3.5 + easedProgress * 1.5).toFixed(3)}deg`,
      );

      if (scene.dataset.phase !== phase) {
        scene.dataset.phase = phase;
      }
    };

    const update = () => {
      frame = 0;

      if (reducedMotion.matches) {
        setProgress(1);
        return;
      }

      const rect = section.getBoundingClientRect();
      const travel = Math.max(1, section.offsetHeight - window.innerHeight);
      setProgress(clamp(-rect.top / travel));
    };

    const requestUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    reducedMotion.addEventListener("change", requestUpdate);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      reducedMotion.removeEventListener("change", requestUpdate);
    };
  }, []);

  return (
    <section
      id="sauce"
      ref={sectionRef}
      className="sauce-scroll"
      aria-labelledby="sauce-title"
    >
      <div ref={sceneRef} className="sauce-scroll-sticky" data-phase="plain">
        <h2 id="sauce-title" className="sr-only">
          Build the sauce with your scroll
        </h2>

        <div className="sauce-product" aria-hidden="true">
          <img
            className="sauce-frame sauce-frame-plain"
            src="/images/sauce-stage-plain.webp"
            alt=""
          />
          <img
            className="sauce-frame sauce-frame-finished"
            src="/images/sauce-stage-ketchup.webp"
            alt=""
          />
          <div className="sauce-stage-steam">
            <i />
            <i />
          </div>
        </div>

        <div className="sauce-story-copy" aria-hidden="true">
          <p className="eyebrow">THE POUR / 01</p>
          <div className="sauce-story-headline">
            <span data-step="plain">NOTHING YET.</span>
            <span data-step="pour">ONE GOOD LINE.</span>
            <span data-step="done">KETCHUP. ONLY.</span>
          </div>
        </div>

        <div className="sauce-progress" aria-hidden="true">
          <span>PLAIN</span>
          <i>
            <b />
          </i>
          <strong>KETCHUP</strong>
        </div>
      </div>
    </section>
  );
}
