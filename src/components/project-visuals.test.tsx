import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { FitnessPlatformVisual } from "./project-visuals";

afterEach(cleanup);

describe("FitnessPlatformVisual", () => {
  it("keeps the local hero image visible before the hosted page is requested", () => {
    render(<FitnessPlatformVisual />);

    expect(document.querySelector("figure")).toBeInTheDocument();
    expect(screen.queryByTitle("Motiv8 hosted homepage preview")).not.toBeInTheDocument();
    expect(document.querySelector("[data-embed-state='local']")).toBeInTheDocument();
  });

  it("requests the hosted preview after the card enters the viewport", async () => {
    render(<FitnessPlatformVisual />);

    const stage = document.querySelector("[data-embed-state]");
    stage?.dispatchEvent(new Event("pointerenter"));

    expect(await screen.findByTitle("Motiv8 hosted homepage preview")).toBeInTheDocument();
  });

  it("keeps the local fallback when the preview fails", async () => {
    render(<FitnessPlatformVisual />);

    const stage = document.querySelector("[data-embed-state]");
    stage?.dispatchEvent(new Event("pointerenter"));
    const iframe = await screen.findByTitle("Motiv8 hosted homepage preview");
    iframe.dispatchEvent(new Event("error"));

    await waitFor(() => {
      expect(document.querySelector("[data-embed-state='fallback']")).toBeInTheDocument();
      expect(screen.queryByTitle("Motiv8 hosted homepage preview")).not.toBeInTheDocument();
      expect(document.querySelector("figure")).toBeInTheDocument();
    });
  });
});
