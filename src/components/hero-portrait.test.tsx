import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { HeroPortrait } from "./hero-portrait";

afterEach(cleanup);

describe("HeroPortrait", () => {
  it("keeps a fixed portrait box and selects responsive WebP sources", () => {
    render(<HeroPortrait alt="Ka Chong portrait" />);

    const image = screen.getByRole("img", { name: "Ka Chong portrait" });
    expect(image).toHaveAttribute("width", "1122");
    expect(image).toHaveAttribute("height", "1402");
    expect(image).toHaveAttribute("fetchpriority", "high");
    expect(image).toHaveAttribute("data-asset-state", "loading");
    expect(document.querySelectorAll('source[type="image/webp"]')).toHaveLength(3);
  });

  it("switches to the checked-in portrait when the responsive asset fails", () => {
    render(<HeroPortrait alt="Ka Chong portrait" />);

    const image = screen.getByRole("img", { name: "Ka Chong portrait" });
    fireEvent.error(image);

    expect(image).toHaveAttribute(
      "src",
      expect.stringContaining("david-floating-head-fallback-v5.png"),
    );
    expect(image).toHaveAttribute("data-asset-state", "fallback");
    expect(document.querySelectorAll('source[type="image/webp"]')).toHaveLength(0);
  });
});
