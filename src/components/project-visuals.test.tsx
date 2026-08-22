import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { FitnessPlatformVisual } from "./project-visuals";

afterEach(cleanup);

describe("FitnessPlatformVisual", () => {
  it("keeps the local hero image visible while requesting the hosted page immediately", async () => {
    render(<FitnessPlatformVisual />);

    expect(document.querySelector("figure")).toBeInTheDocument();
    expect(await screen.findByTitle("Motiv8 hosted homepage preview")).toBeInTheDocument();
    expect(document.querySelector("[data-embed-state='local']")).toBeInTheDocument();
  });

  it("keeps the local fallback when the immediately requested preview fails", async () => {
    render(<FitnessPlatformVisual />);

    const iframe = await screen.findByTitle("Motiv8 hosted homepage preview");
    iframe.dispatchEvent(new Event("error"));

    await waitFor(() => {
      expect(document.querySelector("[data-embed-state='fallback']")).toBeInTheDocument();
      expect(screen.queryByTitle("Motiv8 hosted homepage preview")).not.toBeInTheDocument();
      expect(document.querySelector("figure")).toBeInTheDocument();
    });
  });
});
