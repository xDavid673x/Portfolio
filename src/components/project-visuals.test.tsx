import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { FitnessPlatformVisual } from "./project-visuals";

afterEach(cleanup);

describe("FitnessPlatformVisual", () => {
  it("keeps the local hero image as first paint and defers the hosted page", () => {
    render(<FitnessPlatformVisual />);

    expect(document.querySelector("figure")).toBeInTheDocument();
    expect(screen.queryByTitle("Motiv8 hosted homepage preview")).not.toBeInTheDocument();
    expect(document.querySelector("[data-embed-state='local']")).toBeInTheDocument();
  });

  it("activates the hosted preview only after interaction and keeps the local fallback on error", async () => {
    render(<FitnessPlatformVisual />);

    fireEvent.pointerEnter(document.querySelector("[data-embed-state]")!);
    const iframe = await screen.findByTitle("Motiv8 hosted homepage preview");
    iframe.dispatchEvent(new Event("error"));

    await waitFor(() => {
      expect(document.querySelector("[data-embed-state='fallback']")).toBeInTheDocument();
      expect(screen.queryByTitle("Motiv8 hosted homepage preview")).not.toBeInTheDocument();
      expect(document.querySelector("figure")).toBeInTheDocument();
    });
  });
});
