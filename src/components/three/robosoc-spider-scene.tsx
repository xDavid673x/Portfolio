"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Component,
  Suspense,
  type CSSProperties,
  type ErrorInfo,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import * as THREE from "three";

import styles from "./HeroScene.module.css";
import { RobosocSpiderModel } from "./robosoc-spider-model";

export type RobosocSpiderSceneProps = {
  className?: string;
  label?: string;
  style?: CSSProperties;
};

type WebGLBoundaryProps = {
  children: ReactNode;
  fallback: ReactNode;
};

type WebGLBoundaryState = {
  failed: boolean;
};

class RobosocSpiderWebGLBoundary extends Component<
  WebGLBoundaryProps,
  WebGLBoundaryState
> {
  state: WebGLBoundaryState = { failed: false };

  static getDerivedStateFromError(): WebGLBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("The RoboSoc spider scene switched to its fallback.", {
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
      alpha: true,
      antialias: false,
      failIfMajorPerformanceCaveat: true,
      powerPreference: "high-performance",
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

function SpiderCourse() {
  return (
    <group>
      <mesh position={[0, -1.18, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6.8, 4.2]} />
        <meshStandardMaterial
          color="#0a0f10"
          metalness={0.18}
          roughness={0.86}
          transparent
          opacity={0.72}
        />
      </mesh>
      <gridHelper args={[6.8, 14, "#314143", "#1a2527"]} position={[0, -1.16, 0]} />
      {[-2.25, 2.25].map((x) => (
        <mesh key={x} position={[x, -1.08, -1.72]}>
          <boxGeometry args={[0.18, 0.1, 0.42]} />
          <meshStandardMaterial
            color="#b8ff4f"
            emissive="#254006"
            emissiveIntensity={0.32}
            metalness={0.34}
            roughness={0.4}
          />
        </mesh>
      ))}
    </group>
  );
}

function CameraRig() {
  const getSceneState = useThree((state) => state.get);
  const size = useThree((state) => state.size);

  useEffect(() => {
    const camera = getSceneState().camera;
    camera.position.set(size.width < 640 ? 4.6 : 4.15, 2.35, size.width < 640 ? 6.4 : 5.65);
    camera.lookAt(0, -0.55, 0);
  }, [getSceneState, size.width]);

  useFrame((state, delta) => {
    const dampingDelta = Math.min(delta, 0.05);
    const targetX = (size.width < 640 ? 4.6 : 4.15) + state.pointer.x * 0.28;
    const targetY = 2.35 + state.pointer.y * 0.18;

    state.camera.position.x = THREE.MathUtils.damp(
      state.camera.position.x,
      targetX,
      2.6,
      dampingDelta,
    );
    state.camera.position.y = THREE.MathUtils.damp(
      state.camera.position.y,
      targetY,
      2.6,
      dampingDelta,
    );
    state.camera.lookAt(0, -0.55, 0);
  });

  return null;
}

function RobosocSpiderWorld({
  active,
}: {
  active: boolean;
}) {
  const viewport = useThree((state) => state.viewport);
  const invalidate = useThree((state) => state.invalidate);
  const scale = THREE.MathUtils.clamp(viewport.width / 7.2, 0.68, 0.96);

  useEffect(() => invalidate(), [invalidate, viewport.width]);

  return (
    <>
      <fog attach="fog" args={["#06090a", 6, 14]} />
      <ambientLight intensity={0.72} color="#9eb8b4" />
      <hemisphereLight
        color="#e8fff7"
        groundColor="#030505"
        intensity={1.2}
      />
      <directionalLight
        position={[3.6, 5.8, 4.2]}
        intensity={4.6}
        color="#f4ffe8"
      />
      <spotLight
        position={[-3.8, 4.2, 3.8]}
        angle={0.54}
        penumbra={0.82}
        intensity={52}
        distance={11}
        color="#a7f5e0"
      />
      <pointLight
        position={[2.8, 1.2, -2.4]}
        intensity={16}
        distance={6}
        color="#b8ff4f"
      />
      <CameraRig />
      <group scale={scale} position={[0, scale < 0.74 ? -0.18 : 0, 0]}>
        <SpiderCourse />
        <Suspense fallback={null}>
          <RobosocSpiderModel
            active={active}
            modelScale={4.25}
            position={[0, -0.98, 0]}
            rotation={[0, -0.24, 0]}
            scale={0.86}
          />
        </Suspense>
      </group>
    </>
  );
}

export function RobosocSpiderSceneFallback({
  className,
  label = "The RoboSoc hexapod spider robot in a stable tripod stance",
  style,
}: RobosocSpiderSceneProps) {
  const classes = [styles.shell, styles.fallbackShell, className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} role="img" aria-label={label} style={style}>
      <div className={styles.fallbackGrid} aria-hidden="true" />
      <svg
        className={styles.fallbackGraphic}
        viewBox="0 0 800 620"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="robosoc-spider-metal" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#879193" />
            <stop offset="0.48" stopColor="#273033" />
            <stop offset="1" stopColor="#0c1112" />
          </linearGradient>
          <filter id="robosoc-spider-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <ellipse cx="400" cy="488" rx="230" ry="42" fill="#030505" opacity="0.7" />
        {[
          "392 318 250 250 142 438",
          "372 340 248 380 118 478",
          "376 365 272 475 172 535",
          "408 318 550 250 658 438",
          "428 340 552 380 682 478",
          "424 365 528 475 628 535",
        ].map((points) => {
          const [x1, y1, x2, y2, x3, y3] = points.split(" ");
          return (
            <polyline
              key={points}
              points={`${x1},${y1} ${x2},${y2} ${x3},${y3}`}
              fill="none"
              stroke="#8ea09e"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="18"
            />
          );
        })}
        <polygon
          points="300,288 400,236 500,288 500,390 400,445 300,390"
          fill="url(#robosoc-spider-metal)"
          stroke="#879193"
          strokeWidth="3"
        />
        <polygon
          points="338,305 400,273 462,305 462,371 400,404 338,371"
          fill="#111819"
          stroke="#b8ff4f"
          strokeWidth="3"
          opacity="0.92"
        />
        <circle
          cx="400"
          cy="340"
          r="18"
          fill="#b8ff4f"
          filter="url(#robosoc-spider-glow)"
        />
        {[
          "250 250",
          "248 380",
          "272 475",
          "550 250",
          "552 380",
          "528 475",
        ].map((joint) => {
          const [cx, cy] = joint.split(" ");
          return (
            <circle
              key={joint}
              cx={cx}
              cy={cy}
              r="17"
              fill="#222b2d"
              stroke="#b8ff4f"
              strokeWidth="3"
            />
          );
        })}
      </svg>
      <div className={styles.fallbackVignette} aria-hidden="true" />
    </div>
  );
}

export function RobosocSpiderScene({
  className,
  label = "An interactive 3D RoboSoc hexapod spider robot walking in alternating tripod gait",
  style,
}: RobosocSpiderSceneProps) {
  const [webGLReady, setWebGLReady] = useState(false);
  const [isInViewport, setIsInViewport] = useState(true);
  const [isDocumentVisible, setIsDocumentVisible] = useState(true);
  const sceneRoot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkFrame = window.requestAnimationFrame(() => {
      setWebGLReady(canRenderWebGL());
    });

    return () => window.cancelAnimationFrame(checkFrame);
  }, []);

  useEffect(() => {
    if (!webGLReady) return;

    const root = sceneRoot.current;
    const updateDocumentVisibility = () =>
      setIsDocumentVisible(document.visibilityState !== "hidden");

    updateDocumentVisibility();
    document.addEventListener("visibilitychange", updateDocumentVisibility);

    if (!root || !("IntersectionObserver" in window)) {
      return () =>
        document.removeEventListener(
          "visibilitychange",
          updateDocumentVisibility,
        );
    }

    const observer = new IntersectionObserver(
      ([entry]) =>
        setIsInViewport(entry.isIntersecting || entry.intersectionRatio > 0),
      { rootMargin: "100% 0px" },
    );
    observer.observe(root);

    return () => {
      observer.disconnect();
      document.removeEventListener(
        "visibilitychange",
        updateDocumentVisibility,
      );
    };
  }, [webGLReady]);

  const fallback = (
    <RobosocSpiderSceneFallback
      className={className}
      label={label}
      style={style}
    />
  );

  if (!webGLReady) return fallback;

  const classes = [styles.shell, className].filter(Boolean).join(" ");
  const sceneActive = isInViewport && isDocumentVisible;

  return (
    <RobosocSpiderWebGLBoundary fallback={fallback}>
      <div
        className={classes}
        data-render-mode={sceneActive ? "continuous" : "paused"}
        data-motion-policy="always"
        ref={sceneRoot}
        role="img"
        aria-label={label}
        style={style}
      >
        <Canvas
          className={styles.canvas}
          aria-hidden="true"
          camera={{ fov: 39, near: 0.1, far: 28, position: [4.15, 2.35, 5.65] }}
          dpr={[1, 1.5]}
          flat
          frameloop={sceneActive ? "always" : "demand"}
          gl={{
            alpha: true,
            antialias: true,
            powerPreference: "high-performance",
          }}
          onCreated={({ gl }) => {
            gl.outputColorSpace = THREE.SRGBColorSpace;
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.04;
          }}
        >
          <RobosocSpiderWorld
            active={sceneActive}
          />
        </Canvas>
        <div className={styles.fallbackVignette} aria-hidden="true" />
      </div>
    </RobosocSpiderWebGLBoundary>
  );
}

export default RobosocSpiderScene;
