"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";

export const FLOATING_HEAD_MODEL_URL =
  "/models/avatar/david-floating-head-v1.glb";

export type FloatingHeadModelProps = {
  active: boolean;
  onReady: () => void;
  pointerTarget: MutableRefObject<THREE.Vector2>;
  reducedMotion: boolean;
};

function cloneAvatarScene(scene: THREE.Group) {
  const clone = scene.clone(true);

  clone.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;

    object.material = Array.isArray(object.material)
      ? object.material.map((material) => material.clone())
      : object.material.clone();
    object.castShadow = !object.name.toLowerCase().includes("cornea");
    object.receiveShadow = true;
  });

  return clone;
}

export function FloatingHeadModel({
  active,
  onReady,
  pointerTarget,
  reducedMotion,
}: FloatingHeadModelProps) {
  const { scene } = useGLTF(FLOATING_HEAD_MODEL_URL);
  const avatar = useMemo(() => cloneAvatarScene(scene), [scene]);
  const floatingRoot = useRef<THREE.Group>(null);
  const head = useRef<THREE.Object3D | null>(null);
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    head.current =
      avatar.getObjectByName("Head") ??
      avatar.getObjectByName("AvatarRoot") ??
      null;
    onReady();
    invalidate();

    return () => {
      head.current = null;
    };
  }, [avatar, invalidate, onReady]);

  useEffect(() => {
    if (active && !reducedMotion) return;
    floatingRoot.current?.position.set(0, 0, 0);
    floatingRoot.current?.scale.setScalar(1);
    head.current?.rotation.set(0, 0, 0);
    invalidate();
  }, [active, invalidate, reducedMotion]);

  useFrame((state, delta) => {
    if (!active || reducedMotion) return;

    const elapsed = state.clock.getElapsedTime();
    const dampingDelta = Math.min(delta, 0.05);

    if (floatingRoot.current) {
      floatingRoot.current.position.y =
        Math.sin(elapsed * 0.57) * 0.016 +
        Math.sin(elapsed * 0.21 + 1.2) * 0.006;
      const breath = 1 + Math.sin(elapsed * 0.83 + 0.4) * 0.0014;
      floatingRoot.current.scale.setScalar(breath);
    }

    const headNode = head.current;
    if (!headNode) return;

    const idleYaw = Math.sin(elapsed * 0.17 + 0.7) * 0.009;
    const idlePitch = Math.sin(elapsed * 0.23 + 2.1) * 0.006;
    const idleRoll = Math.sin(elapsed * 0.29 + 1.4) * 0.0045;

    headNode.rotation.y = THREE.MathUtils.damp(
      headNode.rotation.y,
      pointerTarget.current.x * 0.045 + idleYaw,
      3.8,
      dampingDelta,
    );
    headNode.rotation.x = THREE.MathUtils.damp(
      headNode.rotation.x,
      -pointerTarget.current.y * 0.031 + idlePitch,
      3.8,
      dampingDelta,
    );
    headNode.rotation.z = THREE.MathUtils.damp(
      headNode.rotation.z,
      -pointerTarget.current.x * 0.006 + idleRoll,
      3.2,
      dampingDelta,
    );
  });

  return (
    <group ref={floatingRoot}>
      <primitive object={avatar} />
    </group>
  );
}

useGLTF.preload(FLOATING_HEAD_MODEL_URL);

export default FloatingHeadModel;
