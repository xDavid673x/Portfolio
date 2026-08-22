"use client";

import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

export type DeferredSceneProps = {
  anchorId?: string;
  children: ReactNode;
  className?: string;
  fallback: ReactNode;
  /** Mount immediately when the page is ready instead of waiting for scroll. */
  eager?: boolean;
  onMount?: () => void;
  rootMargin?: string;
  style?: CSSProperties;
};

function hashTargetsAnchor(anchorId?: string) {
  if (!anchorId || typeof window === "undefined") return false;
  return window.location.hash.slice(1) === anchorId;
}

/**
 * Keeps expensive scene trees out of the initial render while preserving the
 * scene's layout and allowing direct case-study links to mount immediately.
 * Once mounted, a scene stays mounted so scroll-driven state is continuous.
 */
export function DeferredScene({
  anchorId,
  children,
  className,
  eager = false,
  fallback,
  onMount,
  rootMargin = "600px 0px",
  style,
}: DeferredSceneProps) {
  const root = useRef<HTMLDivElement>(null);
  const onMountRef = useRef(onMount);
  const notifiedRef = useRef(false);
  const [isMounted, setIsMounted] = useState(eager);

  useEffect(() => {
    onMountRef.current = onMount;
  }, [onMount]);

  useEffect(() => {
    const element = root.current;
    if (!element) return;

    let disposed = false;
    let observer: IntersectionObserver | undefined;

    const mount = () => {
      if (disposed) return;
      setIsMounted(true);
    };

    const checkHash = () => {
      if (hashTargetsAnchor(anchorId)) mount();
    };

    checkHash();
    if (eager) mount();
    window.addEventListener("hashchange", checkHash);

    if (!eager && "IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting || (entry?.intersectionRatio ?? 0) > 0) {
            mount();
            observer?.disconnect();
          }
        },
        { rootMargin },
      );
      observer.observe(element);
    } else if (!eager) {
      mount();
    }

    return () => {
      disposed = true;
      observer?.disconnect();
      window.removeEventListener("hashchange", checkHash);
    };
  }, [anchorId, eager, rootMargin]);

  useEffect(() => {
    if (!isMounted || notifiedRef.current) return;

    notifiedRef.current = true;
    const frame = window.requestAnimationFrame(() => onMountRef.current?.());
    return () => window.cancelAnimationFrame(frame);
  }, [isMounted]);

  const classes = ["deferred-scene", className].filter(Boolean).join(" ");

  return (
    <div
      aria-busy={!isMounted}
      className={classes}
      data-scene-state={isMounted ? "mounted" : "deferred"}
      ref={root}
      style={style}
    >
      {isMounted ? children : fallback}
    </div>
  );
}
