import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DeferredScene } from "./deferred-scene";

type ObserverEntry = { isIntersecting: boolean; intersectionRatio: number };

let intersectionCallback:
  | ((entries: ObserverEntry[]) => void)
  | undefined;

class TestIntersectionObserver {
  constructor(callback: (entries: ObserverEntry[]) => void) {
    intersectionCallback = callback;
  }

  disconnect() {}
  observe() {}
  unobserve() {}
}

afterEach(() => {
  cleanup();
  intersectionCallback = undefined;
  vi.unstubAllGlobals();
  window.history.replaceState({}, "", "/");
});

describe("DeferredScene", () => {
  it("renders its fallback until the viewport observer mounts the scene once", async () => {
    vi.stubGlobal("IntersectionObserver", TestIntersectionObserver);
    const onMount = vi.fn();

    render(
      <DeferredScene
        fallback={<span>static preview</span>}
        onMount={onMount}
      >
        <span>interactive scene</span>
      </DeferredScene>,
    );

    expect(screen.getByText("static preview")).toBeInTheDocument();
    expect(document.querySelector(".deferred-scene")).toHaveAttribute(
      "data-scene-state",
      "deferred",
    );

    await act(async () => {
      intersectionCallback?.([{ isIntersecting: true, intersectionRatio: 1 }]);
    });

    await waitFor(() => {
      expect(screen.getByText("interactive scene")).toBeInTheDocument();
      expect(onMount).toHaveBeenCalledTimes(1);
    });
  });

  it("mounts immediately when the matching case hash is opened", async () => {
    window.history.replaceState({}, "", "/#case-robotic-arm");
    vi.stubGlobal("IntersectionObserver", TestIntersectionObserver);

    render(
      <DeferredScene
        anchorId="case-robotic-arm"
        fallback={<span>static preview</span>}
      >
        <span>interactive scene</span>
      </DeferredScene>,
    );

    await waitFor(() => {
      expect(screen.getByText("interactive scene")).toBeInTheDocument();
    });
  });
});
