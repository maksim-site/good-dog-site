"use client";

import { useEffect } from "react";
import Lenis from "lenis";

declare global {
  interface Window {
    __goodDogLenis?: Lenis;
  }
}

export function SmoothScroll() {
  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    let lenis: Lenis | null = null;
    let bodyObserver: MutationObserver | null = null;

    const syncScrollLock = () => {
      if (!lenis) return;
      const bodyIsLocked =
        window.getComputedStyle(document.body).overflow === "hidden";

      if (bodyIsLocked) {
        lenis.stop();
      } else {
        lenis.start();
      }
    };

    const destroy = () => {
      bodyObserver?.disconnect();
      bodyObserver = null;
      lenis?.destroy();
      lenis = null;
      delete window.__goodDogLenis;
    };

    const create = () => {
      destroy();
      if (reducedMotion.matches) return;

      lenis = new Lenis({
        autoRaf: true,
        anchors: {
          duration: 1.15,
        },
        lerp: 0.085,
        smoothWheel: true,
        wheelMultiplier: 0.88,
        touchMultiplier: 1,
      });
      window.__goodDogLenis = lenis;

      bodyObserver = new MutationObserver(syncScrollLock);
      bodyObserver.observe(document.body, {
        attributes: true,
        attributeFilter: ["style"],
      });
      syncScrollLock();
    };

    const onMotionPreferenceChange = () => create();

    create();
    reducedMotion.addEventListener("change", onMotionPreferenceChange);

    return () => {
      reducedMotion.removeEventListener("change", onMotionPreferenceChange);
      destroy();
    };
  }, []);

  return null;
}
