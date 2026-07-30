"use client";

import { useEffect, useRef, useState } from "react";

type KitchenPhase = "heat" | "bun" | "sauce";

type KitchenCutStageProps = {
  onOrder: () => void;
};

const clamp = (value: number, minimum = 0, maximum = 1) =>
  Math.min(maximum, Math.max(minimum, value));

const phaseCopy: Record<KitchenPhase, string> = {
  heat: "Fire first.",
  bun: "Bun next.",
  sauce: "One good line.",
};

export function KitchenCutStage({ onOrder }: KitchenCutStageProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const phaseRef = useRef<KitchenPhase>("heat");
  const [phase, setPhase] = useState<KitchenPhase>("heat");

  useEffect(() => {
    const section = sectionRef.current;
    const scene = sceneRef.current;
    if (!section || !scene) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    let frame = 0;

    const setScene = (progress: number) => {
      const nextPhase: KitchenPhase =
        progress < 0.31 ? "heat" : progress < 0.66 ? "bun" : "sauce";

      scene.style.setProperty("--cut-progress", progress.toFixed(4));
      scene.style.setProperty(
        "--cut-pan",
        `${(-2 + progress * 4).toFixed(3)}vw`,
      );
      scene.dataset.cut = nextPhase;

      if (phaseRef.current !== nextPhase) {
        phaseRef.current = nextPhase;
        setPhase(nextPhase);
      }
    };

    const update = () => {
      frame = 0;

      if (reducedMotion.matches) {
        setScene(1);
        return;
      }

      const rect = section.getBoundingClientRect();
      const travel = Math.max(1, section.offsetHeight - window.innerHeight);
      setScene(clamp(-rect.top / travel));
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
      id="kitchen-cut"
      ref={sectionRef}
      className="kitchen-cut"
      aria-labelledby="kitchen-cut-title"
    >
      <div
        ref={sceneRef}
        className="kitchen-cut-sticky"
        data-cut="heat"
      >
        <h2 id="kitchen-cut-title" className="sr-only">
          A three-step kitchen cut
        </h2>

        <div className="kitchen-cut-media" aria-hidden="true">
          <div className="kitchen-cut-frame kitchen-cut-heat">
            <img
              src="/images/sauce-stage-plain.webp"
              alt=""
              loading="lazy"
              decoding="async"
            />
            <div className="kitchen-cut-glow" />
          </div>
          <div className="kitchen-cut-frame kitchen-cut-bun">
            <img
              src="/images/sauce-stage-plain.webp"
              alt=""
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="kitchen-cut-frame kitchen-cut-sauce">
            <img
              src="/images/sauce-stage-ketchup.webp"
              alt=""
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="kitchen-cut-steam">
            <i />
            <i />
            <i />
          </div>
        </div>

        <div className="kitchen-cut-copy">
          <p className="eyebrow light">KITCHEN CUT / 01—03</p>
          <div className="kitchen-cut-headlines" aria-hidden="true">
            <span data-cut-copy="heat">FIRE FIRST.</span>
            <span data-cut-copy="bun">BUN NEXT.</span>
            <span data-cut-copy="sauce">ONE GOOD LINE.</span>
          </div>
          <p className="sr-only" aria-live="polite">
            {phaseCopy[phase]}
          </p>
        </div>

        <ol className="kitchen-cut-steps" aria-label="Kitchen cut progress">
          {(
            [
              ["heat", "Heat"],
              ["bun", "Bun"],
              ["sauce", "Ketchup"],
            ] as Array<[KitchenPhase, string]>
          ).map(([id, label], index) => (
            <li key={id} className={phase === id ? "is-active" : ""}>
              <span>0{index + 1}</span>
              <strong>{label}</strong>
            </li>
          ))}
        </ol>

        <button
          className="primary-button cream kitchen-cut-order"
          type="button"
          onClick={onOrder}
          tabIndex={phase === "sauce" ? 0 : -1}
          aria-hidden={phase !== "sauce"}
        >
          <span>ORDER THE CLASSIC — $12</span>
          <span aria-hidden="true">↗</span>
        </button>
      </div>
    </section>
  );
}
