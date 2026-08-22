"use client";

import { useEffect } from "react";

type IdleWindow = Window & {
  requestIdleCallback?: (
    callback: IdleRequestCallback,
    options?: IdleRequestOptions,
  ) => number;
  cancelIdleCallback?: (handle: number) => void;
};

type ConnectionHints = {
  effectiveType?: string;
  saveData?: boolean;
};

export function getSceneWarmupDelay(connection?: ConnectionHints) {
  return connection?.saveData || connection?.effectiveType === "2g"
    ? 4200
    : 1800;
}

function scheduleIdle(callback: () => void, timeout: number) {
  const idleWindow = window as IdleWindow;
  let called = false;
  let idleHandle: number | undefined;
  const timeoutHandle = window.setTimeout(run, timeout);

  function run() {
    if (called) return;
    called = true;
    if (idleHandle !== undefined) {
      idleWindow.cancelIdleCallback?.(idleHandle);
    }
    window.clearTimeout(timeoutHandle);
    callback();
  }

  if (idleWindow.requestIdleCallback) {
    idleHandle = idleWindow.requestIdleCallback(run, { timeout });
  }

  return () => {
    called = true;
    if (idleHandle !== undefined) {
      idleWindow.cancelIdleCallback?.(idleHandle);
    }
    window.clearTimeout(timeoutHandle);
  };
}

function shouldUseLongWarmup() {
  const connection = (navigator as Navigator & { connection?: ConnectionHints })
    .connection;
  return getSceneWarmupDelay(connection) > 1800;
}

/**
 * Starts model preloading only after the hero has had a chance to paint. The
 * dynamic import keeps Drei/R3F out of the critical JavaScript path, while the
 * stagger prevents both GLBs from competing for the first network window.
 */
export function useSceneAssetWarmup() {
  useEffect(() => {
    let cancelled = false;
    let spiderTimer: number | undefined;
    let cancelIdle: (() => void) | undefined;
    let warmupScheduled = false;

    const warmModels = () => {
      if (cancelled) return;

      void import("@/components/three/scene-asset-preload").then(
        ({ preloadRoboticArmSceneAsset, preloadRobosocSpiderSceneAsset }) => {
          if (cancelled) return;

          preloadRoboticArmSceneAsset();
          void import("@/components/three/robotic-arm-scene");
          spiderTimer = window.setTimeout(
            () => {
              if (!cancelled) {
                preloadRobosocSpiderSceneAsset();
                void import("@/components/three/robosoc-spider-scene");
              }
            },
            850,
          );
        },
      );
    };

    const beginWarmup = () => {
      if (warmupScheduled) return;
      warmupScheduled = true;
      cancelIdle?.();
      cancelIdle = scheduleIdle(warmModels, shouldUseLongWarmup() ? 4200 : 1800);
    };

    const warmupOnIntent = () => {
      if (warmupScheduled) return;
      warmupScheduled = true;
      cancelIdle = scheduleIdle(warmModels, shouldUseLongWarmup() ? 900 : 300);
    };

    const intentTargets = [
      ...document.querySelectorAll<HTMLAnchorElement>('a[href="#work"]'),
      ...document.querySelectorAll<HTMLElement>(".bento-card"),
    ];
    intentTargets.forEach((target) => {
      target.addEventListener("pointerenter", warmupOnIntent, { passive: true });
      target.addEventListener("focusin", warmupOnIntent);
    });

    const workSection = document.querySelector<HTMLElement>("#work");
    let workObserver: IntersectionObserver | undefined;
    if (workSection && "IntersectionObserver" in window) {
      workObserver = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting) {
            beginWarmup();
            workObserver?.disconnect();
          }
        },
        { rootMargin: "900px 0px" },
      );
      workObserver.observe(workSection);
    }

    if (document.readyState === "complete") {
      beginWarmup();
    } else {
      window.addEventListener("load", beginWarmup, { once: true });
    }

    return () => {
      cancelled = true;
      cancelIdle?.();
      if (spiderTimer !== undefined) window.clearTimeout(spiderTimer);
      window.removeEventListener("load", beginWarmup);
      workObserver?.disconnect();
      intentTargets.forEach((target) => {
        target.removeEventListener("pointerenter", warmupOnIntent);
        target.removeEventListener("focusin", warmupOnIntent);
      });
    };
  }, []);
}
