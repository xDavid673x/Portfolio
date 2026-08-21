"use client";

import { Canvas, useThree } from "@react-three/fiber";
import Image from "next/image";
import {
  Component,
  type CSSProperties,
  type ErrorInfo,
  type MutableRefObject,
  type ReactNode,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import * as THREE from "three";

import { assetPath } from "@/lib/asset-path";
import { FloatingHeadModel } from "./floating-head-model";
import styles from "./PortraitScene.module.css";

export type HeroSceneProps = {
  className?: string;
  label?: string;
  style?: CSSProperties;
};

type BoundaryProps = { children: ReactNode; fallback: ReactNode };
type BoundaryState = { failed: boolean };

const FALLBACK_PORTRAIT = assetPath(
  "/images/avatar/david-floating-head-fallback-v5.png",
);

class WebGLBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("The floating-head scene switched to its fallback.", {
        error,
        componentStack: info.componentStack,
      });
    }
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function canRenderWebGL() {
  try {
    const canvas = document.createElement("canvas");
    const attributes: WebGLContextAttributes = {
      failIfMajorPerformanceCaveat: true,
    };
    const context =
      canvas.getContext("webgl2", attributes) ??
      canvas.getContext("webgl", attributes);
    if (!context) return false;
    context.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(true);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return reducedMotion;
}

function CameraRig() {
  const size = useThree((state) => state.size);
  const get = useThree((state) => state.get);
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    const camera = get().camera;
    const cameraZ = size.width < 620 ? 13.8 : size.width < 900 ? 12.5 : 11.7;
    camera.position.set(0, 0.08, cameraZ);
    camera.lookAt(0, 0.12, 0);
    invalidate();
  }, [get, invalidate, size.width]);

  return null;
}

function StudioLighting() {
  const compact = useThree((state) => state.size.width < 620);
  const shadowSize = compact ? 512 : 1024;

  return (
    <>
      <ambientLight color="#9ba3bd" intensity={0.2} />
      <hemisphereLight
        color="#fff1df"
        groundColor="#17131f"
        intensity={compact ? 0.42 : 0.52}
      />
      <spotLight
        castShadow
        position={[-4.5, 5.7, 7]}
        color="#ffe7d1"
        intensity={compact ? 42 : 56}
        distance={22}
        decay={2}
        angle={0.58}
        penumbra={0.92}
        shadow-bias={-0.0002}
        shadow-mapSize-height={shadowSize}
        shadow-mapSize-width={shadowSize}
        shadow-radius={4}
      />
      <pointLight
        position={[4.2, 1.6, 5.5]}
        color="#b8caff"
        intensity={compact ? 13 : 19}
        distance={16}
        decay={2}
      />
      <pointLight
        position={[3.4, 4.2, -3.8]}
        color="#d7b3ff"
        intensity={compact ? 18 : 26}
        distance={14}
        decay={2}
      />
    </>
  );
}

function Scene({
  active,
  onReady,
  pointerTarget,
  reducedMotion,
}: {
  active: boolean;
  onReady: () => void;
  pointerTarget: MutableRefObject<THREE.Vector2>;
  reducedMotion: boolean;
}) {
  return (
    <>
      <CameraRig />
      <StudioLighting />
      <Suspense fallback={null}>
        <FloatingHeadModel
          active={active}
          onReady={onReady}
          pointerTarget={pointerTarget}
          reducedMotion={reducedMotion}
        />
      </Suspense>
    </>
  );
}

export function HeroSceneFallback({
  className,
  label = "A calm, stylized 3D floating head based on David's supplied selfies",
  style,
}: HeroSceneProps) {
  const classes = [styles.shell, styles.fallbackShell, className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} role="img" aria-label={label} style={style}>
      <div className={styles.fallbackHalo} aria-hidden="true" />
      <Image
        alt=""
        aria-hidden="true"
        className={styles.fallbackPortrait}
        height={1254}
        loading="eager"
        priority
        src={FALLBACK_PORTRAIT}
        width={1254}
      />
      <div className={styles.vignette} aria-hidden="true" />
    </div>
  );
}

export function HeroScene({
  className,
  label = "An interactive, true 3D floating-head avatar of David with fixed eyes and subtle head movement",
  style,
}: HeroSceneProps) {
  const [webGLReady, setWebGLReady] = useState<boolean | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isDocumentVisible, setIsDocumentVisible] = useState(true);
  const [modelReady, setModelReady] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const pointerTarget = useRef(new THREE.Vector2());
  const reducedMotion = useReducedMotion();
  const markModelReady = useCallback(() => setModelReady(true), []);
  const active = !reducedMotion && isVisible && isDocumentVisible;

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setWebGLReady(canRenderWebGL());
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const element = root.current;
    if (!element || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { rootMargin: "120px 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [webGLReady]);

  useEffect(() => {
    const update = () => setIsDocumentVisible(!document.hidden);
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  const resetPointer = useCallback(() => pointerTarget.current.set(0, 0), []);

  useEffect(() => {
    if (!active) resetPointer();
  }, [active, resetPointer]);

  const fallback = (
    <HeroSceneFallback className={className} label={label} style={style} />
  );
  if (webGLReady === null || !webGLReady) return fallback;

  const classes = [styles.shell, className].filter(Boolean).join(" ");

  return (
    <WebGLBoundary fallback={fallback}>
      <div
        className={classes}
        ref={root}
        role="img"
        aria-label={label}
        style={style}
        onPointerCancel={resetPointer}
        onPointerLeave={resetPointer}
        onPointerMove={(event) => {
          if (event.pointerType !== "mouse" || reducedMotion) return;
          const bounds = event.currentTarget.getBoundingClientRect();
          const x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
          const y = 1 - ((event.clientY - bounds.top) / bounds.height) * 2;
          pointerTarget.current.set(
            THREE.MathUtils.clamp(x, -1, 1),
            THREE.MathUtils.clamp(y, -1, 1),
          );
        }}
      >
        <div className={styles.halo} aria-hidden="true" />
        <Image
          alt=""
          aria-hidden="true"
          className={`${styles.loadingPortrait} ${modelReady ? styles.loadingPortraitHidden : ""}`}
          height={1254}
          priority
          src={FALLBACK_PORTRAIT}
          width={1254}
        />
        <Canvas
          className={styles.canvas}
          aria-hidden="true"
          camera={{ fov: 29, near: 0.1, far: 40, position: [0, 0.08, 11.7] }}
          dpr={[1, 1.5]}
          frameloop={active ? "always" : "demand"}
          gl={{
            alpha: true,
            antialias: true,
            powerPreference: "high-performance",
          }}
          shadows="soft"
          onCreated={({ gl }) => {
            gl.outputColorSpace = THREE.SRGBColorSpace;
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.05;
            gl.shadowMap.enabled = true;
            gl.shadowMap.type = THREE.PCFSoftShadowMap;
            gl.setClearColor(0x000000, 0);
          }}
        >
          <Scene
            active={active}
            onReady={markModelReady}
            pointerTarget={pointerTarget}
            reducedMotion={reducedMotion}
          />
        </Canvas>
        <div className={styles.vignette} aria-hidden="true" />
      </div>
    </WebGLBoundary>
  );
}

export default HeroScene;
