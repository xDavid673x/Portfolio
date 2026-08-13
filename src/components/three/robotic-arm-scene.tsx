"use client";

import { RoundedBox } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Component,
  Suspense,
  type CSSProperties,
  type ErrorInfo,
  type RefObject,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";

import styles from "./HeroScene.module.css";
import {
  ROBOT_PICKUP_PROGRESS,
  ROBOT_PLACE_PROGRESS,
  ZeroRoboticArmModel,
} from "./zero-robotic-arm-model";

const ACCENT = "#b8ff4f";
const ACCENT_SOFT = "#77d9c4";
const WORKPIECE = "#f0b96b";

const INPUT_STATION_POSITION: [number, number, number] = [-2.2, -1.62, 0.9];
const OUTPUT_STATION_POSITION: [number, number, number] = [2.2, -1.62, 0.72];
const PICK_AND_PLACE_CYCLE_SECONDS = 10;

export type HeroSceneProps = {
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

class WebGLBoundary extends Component<
  WebGLBoundaryProps,
  WebGLBoundaryState
> {
  state: WebGLBoundaryState = { failed: false };

  static getDerivedStateFromError(): WebGLBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("The portfolio WebGL scene switched to its fallback.", {
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

function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(true);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(query.matches);

    updatePreference();
    query.addEventListener("change", updatePreference);
    return () => query.removeEventListener("change", updatePreference);
  }, []);

  return reducedMotion;
}

function CourseGrid() {
  const geometry = useMemo(() => {
    const vertices: number[] = [];
    const width = 8;
    const depth = 6;
    const divisionsX = 16;
    const divisionsZ = 12;

    for (let index = 0; index <= divisionsX; index += 1) {
      const x = -width / 2 + (index / divisionsX) * width;
      vertices.push(x, -1.705, -depth / 2, x, -1.705, depth / 2);
    }
    for (let index = 0; index <= divisionsZ; index += 1) {
      const z = -depth / 2 + (index / divisionsZ) * depth;
      vertices.push(-width / 2, -1.705, z, width / 2, -1.705, z);
    }

    return new THREE.BufferGeometry().setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3),
    );
  }, []);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <group>
      <lineSegments geometry={geometry}>
        <lineBasicMaterial
          color="#61706f"
          transparent
          opacity={0.18}
          depthWrite={false}
        />
      </lineSegments>
      <mesh position={[0, -1.73, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 6]} />
        <meshStandardMaterial
          color="#0b1011"
          metalness={0.2}
          roughness={0.88}
          transparent
          opacity={0.48}
        />
      </mesh>
    </group>
  );
}

function SensorField({ reducedMotion }: { reducedMotion: boolean }) {
  const cloud = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const count = 220;
    const data = new Float32Array(count * 3);
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));

    for (let index = 0; index < count; index += 1) {
      const radius = 3.7 + ((index * 17) % 31) * 0.025;
      const angle = index * goldenAngle;
      const y = -1.2 + ((index * 29) % count) / count * 4.8;
      data[index * 3] = Math.cos(angle) * radius;
      data[index * 3 + 1] = y;
      data[index * 3 + 2] = Math.sin(angle) * radius - 1.4;
    }

    return data;
  }, []);

  useFrame((state, delta) => {
    if (reducedMotion || !cloud.current) return;
    cloud.current.rotation.y += delta * 0.018;
    cloud.current.position.y = Math.sin(state.clock.getElapsedTime() * 0.2) * 0.08;
  });

  return (
    <points ref={cloud}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#a8ddd3"
        size={0.026}
        sizeAttenuation
        transparent
        opacity={0.42}
        depthWrite={false}
      />
    </points>
  );
}

function Workpiece({ scale = 1 }: { scale?: number }) {
  return (
    <group scale={scale}>
      <RoundedBox args={[0.34, 0.34, 0.34]} radius={0.045} smoothness={4}>
        <meshPhysicalMaterial
          color={WORKPIECE}
          clearcoat={0.35}
          clearcoatRoughness={0.25}
          emissive="#2b1707"
          emissiveIntensity={0.12}
          metalness={0.32}
          roughness={0.36}
        />
      </RoundedBox>
      <mesh position={[0, 0.174, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.065, 6]} />
        <meshBasicMaterial color="#fff5df" toneMapped={false} />
      </mesh>
    </group>
  );
}

function Station({
  accent,
  position,
}: {
  accent: string;
  position: [number, number, number];
}) {
  return (
    <group position={position}>
      <RoundedBox args={[1.1, 0.16, 0.9]} radius={0.08} smoothness={4}>
        <meshStandardMaterial
          color="#151b1d"
          metalness={0.72}
          roughness={0.4}
        />
      </RoundedBox>
      <mesh position={[-0.08, 0.095, 0]}>
        <boxGeometry args={[0.42, 0.026, 0.1]} />
        <meshBasicMaterial color={accent} toneMapped={false} />
      </mesh>
      <mesh position={[0.24, 0.095, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.14, 0.24, 3]} />
        <meshBasicMaterial color={accent} toneMapped={false} />
      </mesh>
      {[-0.42, 0.42].map((x) => (
        <group key={x} position={[x, 0.2, -0.34]}>
          <mesh>
            <cylinderGeometry args={[0.035, 0.045, 0.28, 10]} />
            <meshStandardMaterial
              color="#566164"
              metalness={0.7}
              roughness={0.34}
            />
          </mesh>
          <mesh position={[0, 0.16, 0]}>
            <sphereGeometry args={[0.052, 12, 12]} />
            <meshBasicMaterial color={accent} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function PickAndPlaceCell({
  reducedMotion,
  workCycleRef,
}: {
  reducedMotion: boolean;
  workCycleRef: RefObject<number>;
}) {
  const inputWorkpiece = useRef<THREE.Group>(null);
  const outputWorkpiece = useRef<THREE.Group>(null);

  useFrame(() => {
    const progress = THREE.MathUtils.clamp(workCycleRef.current, 0, 1);

    if (inputWorkpiece.current) {
      inputWorkpiece.current.visible =
        reducedMotion || progress < ROBOT_PICKUP_PROGRESS;
    }
    if (outputWorkpiece.current) {
      outputWorkpiece.current.visible =
        !reducedMotion && progress >= ROBOT_PLACE_PROGRESS;
    }
  });

  return (
    <group>
      <Station accent={ACCENT_SOFT} position={INPUT_STATION_POSITION} />
      <group ref={inputWorkpiece} position={[-2.2, -1.36, 0.9]}>
        <Workpiece />
      </group>

      <Station accent={ACCENT} position={OUTPUT_STATION_POSITION} />
      <group
        ref={outputWorkpiece}
        position={[2.2, -1.36, 0.72]}
        visible={false}
      >
        <Workpiece />
      </group>
    </group>
  );
}

function CameraRig({ reducedMotion }: { reducedMotion: boolean }) {
  const getSceneState = useThree((state) => state.get);
  const size = useThree((state) => state.size);

  useEffect(() => {
    const camera = getSceneState().camera;
    camera.position.set(size.width < 640 ? 6.9 : 6.25, 2.7, size.width < 640 ? 10.8 : 9.25);
    camera.lookAt(0, 0.15, 0);
  }, [getSceneState, size.width]);

  useFrame((state, delta) => {
    if (reducedMotion) return;
    const camera = state.camera;
    const smoothing = Math.min(delta, 0.05);
    camera.position.x = THREE.MathUtils.damp(
      camera.position.x,
      (size.width < 640 ? 6.9 : 6.25) + state.pointer.x * 0.34,
      2.4,
      smoothing,
    );
    camera.position.y = THREE.MathUtils.damp(
      camera.position.y,
      2.7 + state.pointer.y * 0.22,
      2.4,
      smoothing,
    );
    camera.lookAt(0, 0.15, 0);
  });

  return null;
}

function Scene({
  reducedMotion,
  workCycleRef,
}: {
  reducedMotion: boolean;
  workCycleRef: RefObject<number>;
}) {
  const viewport = useThree((state) => state.viewport);
  const invalidate = useThree((state) => state.invalidate);
  const scale = THREE.MathUtils.clamp(viewport.width / 8.8, 0.72, 1);

  useEffect(() => invalidate(), [invalidate, reducedMotion, viewport.width]);

  useFrame((state) => {
    workCycleRef.current = reducedMotion
      ? 0
      : (state.clock.getElapsedTime() % PICK_AND_PLACE_CYCLE_SECONDS) /
        PICK_AND_PLACE_CYCLE_SECONDS;
  });

  return (
    <>
      <fog attach="fog" args={["#070a0c", 8.5, 17]} />
      <ambientLight intensity={0.72} color="#9eb8b4" />
      <hemisphereLight
        color="#dbe8e4"
        groundColor="#050708"
        intensity={1.25}
      />
      <directionalLight
        position={[4.8, 7, 5]}
        intensity={3.4}
        color="#f4ffe8"
      />
      <spotLight
        position={[4.5, 5.5, 7.5]}
        angle={0.58}
        penumbra={0.78}
        intensity={48}
        distance={16}
        color="#f8fff5"
      />
      <pointLight
        position={[-4, 1.5, 2]}
        intensity={21}
        distance={7.5}
        color={ACCENT_SOFT}
      />
      <pointLight
        position={[2.5, 2.8, -2.8]}
        intensity={17}
        distance={6}
        color={ACCENT}
      />

      <CameraRig reducedMotion={reducedMotion} />
      <group scale={scale} position={[0, scale < 0.8 ? -0.22 : 0, 0]}>
        <CourseGrid />
        <SensorField reducedMotion={reducedMotion} />
        <PickAndPlaceCell
          reducedMotion={reducedMotion}
          workCycleRef={workCycleRef}
        />
        <Suspense fallback={null}>
          <ZeroRoboticArmModel
            heldWorkpiece={<Workpiece scale={0.1} />}
            modelScale={scale < 0.8 ? 12 : 10}
            position={[0.1, -1.72, 0]}
            reducedMotion={reducedMotion}
            rotation={[0, -0.42, 0]}
            scrollProgressRef={workCycleRef}
          />
        </Suspense>
      </group>
    </>
  );
}

export function HeroSceneFallback({
  className,
  label = "The ZERO robotic arm transferring a workpiece from the input station to the output station",
  style,
}: HeroSceneProps) {
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
          <linearGradient id="fallback-metal" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#858e91" />
            <stop offset="0.46" stopColor="#242a2d" />
            <stop offset="1" stopColor="#101416" />
          </linearGradient>
          <filter id="fallback-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g>
          <rect
            x="58"
            y="480"
            width="168"
            height="48"
            rx="11"
            fill="#151b1d"
            stroke={ACCENT_SOFT}
            strokeWidth="2"
          />
          <path
            d="M 82 504 H 158 M 143 490 L 163 504 L 143 518"
            fill="none"
            stroke={ACCENT_SOFT}
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect
            x="112"
            y="432"
            width="58"
            height="58"
            rx="8"
            fill={WORKPIECE}
            stroke="#fff1d4"
            strokeWidth="3"
          />
          <circle cx="141" cy="442" r="6" fill="#fff5df" />
          <text
            x="142"
            y="559"
            fill={ACCENT_SOFT}
            fontFamily="monospace"
            fontSize="18"
            fontWeight="700"
            letterSpacing="3"
            textAnchor="middle"
          >
            INPUT
          </text>
        </g>

        <g>
          <rect
            x="576"
            y="480"
            width="168"
            height="48"
            rx="11"
            fill="#151b1d"
            stroke={ACCENT}
            strokeWidth="2"
          />
          <path
            d="M 600 504 H 676 M 661 490 L 681 504 L 661 518"
            fill="none"
            stroke={ACCENT}
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect
            x="631"
            y="432"
            width="58"
            height="58"
            rx="8"
            fill={WORKPIECE}
            stroke="#fff1d4"
            strokeWidth="3"
          />
          <circle cx="660" cy="442" r="6" fill="#fff5df" />
          <text
            x="660"
            y="559"
            fill={ACCENT}
            fontFamily="monospace"
            fontSize="18"
            fontWeight="700"
            letterSpacing="3"
            textAnchor="middle"
          >
            OUTPUT
          </text>
        </g>

        <ellipse cx="395" cy="532" rx="106" ry="25" fill="#050708" opacity="0.75" />
        <path d="M 310 507 L 336 469 L 452 469 L 481 507 Z" fill="url(#fallback-metal)" />
        <rect x="333" y="500" width="145" height="27" rx="12" fill="#1a2022" />
        <path d="M 343 500 H 468" stroke={ACCENT} strokeWidth="4" opacity="0.8" />

        <g className={styles.fallbackArmLinks}>
          <path d="M 394 474 L 482 343" />
          <path d="M 482 343 L 444 220" />
        </g>
        <g className={styles.fallbackArmCore}>
          <path d="M 394 474 L 482 343" />
          <path d="M 482 343 L 444 220" />
        </g>
        <g className={styles.fallbackArmAccent}>
          <path d="M 384 466 L 466 342" />
          <path d="M 492 340 L 456 224" />
        </g>

        {["394 474 30", "482 343 27", "444 220 22"].map((joint) => {
          const [cx, cy, radius] = joint.split(" ");
          return (
            <g key={joint}>
              <circle cx={cx} cy={cy} r={radius} fill="url(#fallback-metal)" stroke="#8d9898" strokeWidth="2" />
              <circle cx={cx} cy={cy} r={Number(radius) * 0.42} fill="#172217" stroke={ACCENT} strokeWidth="4" />
            </g>
          );
        })}

        <path d="M 444 200 L 474 164" stroke="#323a3d" strokeWidth="25" strokeLinecap="round" />
        <path d="M 474 164 L 449 129" stroke={ACCENT} strokeWidth="10" strokeLinecap="round" />
        <path d="M 474 164 L 504 135" stroke={ACCENT} strokeWidth="10" strokeLinecap="round" />
        <circle cx="477" cy="157" r="7" fill="#f2ffe2" filter="url(#fallback-glow)" />
        <rect
          x="460"
          y="92"
          width="36"
          height="36"
          rx="6"
          fill={WORKPIECE}
          stroke="#fff1d4"
          strokeWidth="3"
        />
        <circle cx="478" cy="100" r="4" fill="#fff5df" />
      </svg>
      <div className={styles.fallbackVignette} aria-hidden="true" />
    </div>
  );
}

export function HeroScene({
  className,
  label = "An interactive 3D model of the ZERO robotic arm moving a workpiece from the input station to the output station",
  style,
}: HeroSceneProps) {
  const [webGLReady, setWebGLReady] = useState(false);
  const [isInViewport, setIsInViewport] = useState(true);
  const [isDocumentVisible, setIsDocumentVisible] = useState(true);
  const sceneRoot = useRef<HTMLDivElement>(null);
  const workCycleRef = useRef(0);
  const reducedMotion = useReducedMotion();

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
      ([entry]) => setIsInViewport(entry.isIntersecting),
      { rootMargin: "120px 0px" },
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
    <HeroSceneFallback className={className} label={label} style={style} />
  );

  if (!webGLReady) return fallback;

  const classes = [styles.shell, className].filter(Boolean).join(" ");
  const sceneActive = !reducedMotion && isInViewport && isDocumentVisible;

  return (
    <WebGLBoundary fallback={fallback}>
      <div
        className={classes}
        data-render-mode={sceneActive ? "continuous" : "paused"}
        ref={sceneRoot}
        role="img"
        aria-label={label}
        style={style}
      >
        <Canvas
          className={styles.canvas}
          aria-hidden="true"
          camera={{ fov: 38, near: 0.1, far: 30, position: [6.25, 2.7, 9.25] }}
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
            gl.toneMappingExposure = 1.08;
          }}
        >
          <Scene
            reducedMotion={reducedMotion}
            workCycleRef={workCycleRef}
          />
        </Canvas>
        <div className={styles.fallbackVignette} aria-hidden="true" />
      </div>
    </WebGLBoundary>
  );
}

export default HeroScene;

export const RoboticArmScene = HeroScene;
export const RoboticArmSceneFallback = HeroSceneFallback;
export type RoboticArmSceneProps = HeroSceneProps;
