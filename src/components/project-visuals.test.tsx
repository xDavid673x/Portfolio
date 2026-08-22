import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  FitnessPlatformVisual,
  FitnessTrainingVisual,
  ProjectVisual,
} from "./project-visuals";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

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

  it("keeps the hosted hero at a fixed desktop viewport while scaling its frame", async () => {
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(720);
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(450);

    render(<FitnessPlatformVisual />);

    const viewport = document.querySelector<HTMLElement>(
      "[data-virtual-viewport='1440x900']",
    );
    expect(viewport).toHaveStyle({ "--fitness-preview-scale": "0.5" });

    const stage = document.querySelector("[data-embed-state]");
    stage?.dispatchEvent(new Event("pointerenter"));

    const iframe = await screen.findByTitle("Motiv8 hosted homepage preview");
    expect(iframe).toHaveAttribute("width", "1440");
    expect(iframe).toHaveAttribute("height", "900");
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

describe("FitnessTrainingVisual", () => {
  it("uses a gym-session visual instead of the hosted website in project cards", () => {
    render(<ProjectVisual presentation="project-card" type="fitness" />);

    expect(document.querySelector("[data-fitness-visual='training']")).toBeInTheDocument();
    expect(screen.queryByTitle("Motiv8 hosted homepage preview")).not.toBeInTheDocument();
    expect(screen.getByText("BENCH PRESS")).toBeInTheDocument();
    expect(screen.getByText("68 KG")).toBeInTheDocument();
  });

  it("describes the training instrument for assistive technology", () => {
    render(<FitnessTrainingVisual />);

    expect(
      screen.getByRole("img", { name: /loaded barbell.*workout-set telemetry/i }),
    ).toBeInTheDocument();
  });
});
