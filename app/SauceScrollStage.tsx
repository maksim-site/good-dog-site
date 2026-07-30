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
      const mask = (1 - progress) * 100;
      const nozzleVisibility =
        clamp((progress - 0.07) * 8) * clamp((0.92 - progress) * 8);
      const phase =
        progress < 0.2 ? "plain" : progress < 0.78 ? "pour" : "done";

      scene.style.setProperty("--sauce-progress", progress.toFixed(4));
      scene.style.setProperty("--sauce-mask", `${mask.toFixed(3)}%`);
      scene.style.setProperty(
        "--sauce-x",
        `${(12 + progress * 70).toFixed(3)}vw`,
      );
      scene.style.setProperty(
        "--sauce-y",
        `${(-32 + Math.sin(progress * Math.PI) * 18).toFixed(3)}px`,
      );
      scene.style.setProperty(
        "--sauce-scale",
        (0.9 + progress * 0.1).toFixed(4),
      );
      scene.style.setProperty(
        "--sauce-rotate",
        `${(-5.5 + progress * 2.5).toFixed(3)}deg`,
      );
      scene.style.setProperty(
        "--sauce-word-shift",
        `${(-4 + progress * 8).toFixed(3)}vw`,
      );
      scene.style.setProperty(
        "--nozzle-opacity",
        nozzleVisibility.toFixed(4),
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

        <p className="sauce-giant-word" aria-hidden="true">
          SAUCED.
        </p>

        <div className="sauce-product" aria-hidden="true">
          <img
            className="sauce-frame sauce-frame-plain"
            src="/images/sauce-stage-plain.webp"
            alt=""
          />
          <img
            className="sauce-frame sauce-frame-finished"
            src="/images/sauce-stage-sauced.webp"
            alt=""
          />
          <div className="sauce-nozzle">
            <span />
            <i />
          </div>
          <div className="sauce-stage-steam">
            <i />
            <i />
          </div>
        </div>

        <div className="sauce-story-copy" aria-hidden="true">
          <p className="eyebrow">SCROLL TO SAUCE</p>
          <div className="sauce-story-headline">
            <span data-step="plain">START CLEAN.</span>
            <span data-step="pour">DRAW THE LINE.</span>
            <span data-step="done">THAT&apos;S A GOOD DOG.</span>
          </div>
          <p className="sauce-story-note">
            One controlled pour. Zero wrong turns.
          </p>
        </div>

        <div className="sauce-progress" aria-hidden="true">
          <span>SAUCE LOAD</span>
          <i>
            <b />
          </i>
          <strong>00 — 100</strong>
        </div>
      </div>
    </section>
  );
}
