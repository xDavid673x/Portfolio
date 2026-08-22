"use client";

import { useEffect, useRef, useState } from "react";

import { assetPath } from "@/lib/asset-path";

const HERO_PORTRAIT = "/images/avatar/david-hero-portrait-v1.png";
const HERO_FALLBACK = "/images/avatar/david-floating-head-fallback-v5.png";

const responsiveSources = [
  {
    media: "(max-width: 680px)",
    srcSet: assetPath("/images/avatar/david-hero-portrait-v2-640.webp"),
  },
  {
    media: "(max-width: 1100px)",
    srcSet: assetPath("/images/avatar/david-hero-portrait-v2-960.webp"),
  },
  {
    srcSet: assetPath("/images/avatar/david-hero-portrait-v2-1440.webp"),
  },
] as const;

export type HeroPortraitProps = {
  alt: string;
  className?: string;
  sizes?: string;
};

/**
 * A static-hosting-friendly portrait. The picture sources keep the first
 * request small while the original PNG and a known-good local portrait remain
 * available when an encoded asset fails.
 */
export function HeroPortrait({
  alt,
  className,
  sizes = "(max-width: 620px) 96vw, (max-width: 899px) 74vw, 52vw",
}: HeroPortraitProps) {
  const [isFallback, setIsFallback] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const image = imageRef.current;
    if (image?.complete && image.naturalWidth > 0) setIsLoaded(true);
  }, [isFallback]);

  const handleError = () => {
    if (!isFallback) {
      setIsFallback(true);
      setIsLoaded(false);
    }
  };

  return (
    <picture>
      {!isFallback &&
        responsiveSources.map((source) => (
          <source
            key={source.srcSet}
            media={"media" in source ? source.media : undefined}
            srcSet={source.srcSet}
            type="image/webp"
          />
        ))}
      <img
        alt={alt}
        className={className}
        data-asset-state={isFallback ? "fallback" : isLoaded ? "ready" : "loading"}
        decoding="async"
        fetchPriority="high"
        height={1402}
        ref={imageRef}
        loading="eager"
        onError={handleError}
        onLoad={() => setIsLoaded(true)}
        sizes={sizes}
        src={assetPath(isFallback ? HERO_FALLBACK : HERO_PORTRAIT)}
        width={1122}
      />
    </picture>
  );
}
