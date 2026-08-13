"use client";

import { useGLTF } from "@react-three/drei";
import { createPortal, useFrame, type ThreeElements } from "@react-three/fiber";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
import * as THREE from "three";

export const ZERO_ROBOTIC_ARM_MODEL_URL =
  "/models/zero-robotic-arm/zero-robotic-arm.glb";

const JOINT_NAMES = [
  "joint1_axis",
  "joint2_axis",
  "joint3_axis",
  "joint4_axis",
  "joint5_axis",
  "joint6_axis",
] as const;

type JointName = (typeof JOINT_NAMES)[number];

const HOME_POSE: Record<JointName, number> = {
  joint1_axis: -0.34,
  joint2_axis: -0.74,
  joint3_axis: 1.38,
  joint4_axis: 0.18,
  joint5_axis: -0.56,
  joint6_axis: 0.12,
};

const PICK_AND_PLACE_POSES: Array<Record<JointName, number>> = [
  HOME_POSE,
  {
    joint1_axis: -0.899,
    joint2_axis: 0.874,
    joint3_axis: 0.728,
    joint4_axis: 0.39,
    joint5_axis: -0.13,
    joint6_axis: 0.324,
  },
  {
    joint1_axis: -0.986,
    joint2_axis: 1.062,
    joint3_axis: 0.883,
    joint4_axis: 0.722,
    joint5_axis: -0.296,
    joint6_axis: 0.334,
  },
  {
    joint1_axis: -0.92,
    joint2_axis: 0.42,
    joint3_axis: 0.93,
    joint4_axis: 0.88,
    joint5_axis: -0.36,
    joint6_axis: 0.37,
  },
  {
    joint1_axis: 0.16,
    joint2_axis: 0.4,
    joint3_axis: 0.93,
    joint4_axis: 0.83,
    joint5_axis: -0.19,
    joint6_axis: 0.1,
  },
  {
    joint1_axis: 1.24,
    joint2_axis: 0.7,
    joint3_axis: 1.08,
    joint4_axis: 1.42,
    joint5_axis: 0.12,
    joint6_axis: -0.28,
  },
  {
    joint1_axis: 1.31,
    joint2_axis: 1.18,
    joint3_axis: 1.22,
    joint4_axis: 1.88,
    joint5_axis: -0.09,
    joint6_axis: -0.21,
  },
  HOME_POSE,
];

export const ROBOT_PICKUP_PROGRESS =
  2 / (PICK_AND_PLACE_POSES.length - 1);
export const ROBOT_PLACE_PROGRESS =
  6 / (PICK_AND_PLACE_POSES.length - 1);

export type ZeroRoboticArmModelProps = Omit<
  ThreeElements["group"],
  "children"
> & {
  /** Disable all time- and pointer-driven motion for reduced-motion contexts. */
  reducedMotion?: boolean;
  /** Master switch for joint and presentation motion. */
  animate?: boolean;
  /** Accent used on the end effector. */
  accentColor?: THREE.ColorRepresentation;
  /** Main 3D-printed shell color. */
  bodyColor?: THREE.ColorRepresentation;
  /** Workpiece rendered in the end effector during the transfer. */
  heldWorkpiece?: ReactNode;
  /** Internal model scale; the source geometry is authored in metres. */
  modelScale?: number;
  /** Maximum pointer contribution to the articulated pose, in radians. */
  pointerInfluence?: number;
  /** Optional normalized workcell-cycle progress used to drive the pick-and-place cycle. */
  scrollProgressRef?: RefObject<number>;
};

type JointMap = Partial<Record<JointName, THREE.Object3D>>;

function setJointPose(joints: JointMap, pose: Record<JointName, number>) {
  for (const name of JOINT_NAMES) {
    const joint = joints[name];
    if (joint) joint.rotation.z = pose[name];
  }
}

export function ZeroRoboticArmModel({
  accentColor = "#b8ff4f",
  animate = true,
  bodyColor = "#687276",
  heldWorkpiece,
  modelScale = 10,
  pointerInfluence = 0.1,
  reducedMotion = false,
  scrollProgressRef,
  ...groupProps
}: ZeroRoboticArmModelProps) {
  const { scene } = useGLTF(ZERO_ROBOTIC_ARM_MODEL_URL);
  const carriedWorkpiece = useRef<THREE.Group>(null);
  const presentation = useRef<THREE.Group>(null);
  const joints = useRef<JointMap>({});

  const materials = useMemo(() => {
    const body = new THREE.MeshPhysicalMaterial({
      color: bodyColor,
      clearcoat: 0.32,
      clearcoatRoughness: 0.3,
      emissive: "#101516",
      emissiveIntensity: 0.18,
      flatShading: true,
      metalness: 0.48,
      roughness: 0.34,
    });
    body.name = "portfolio_printed_body";

    const hardware = new THREE.MeshPhysicalMaterial({
      color: "#c3cbcc",
      clearcoat: 0.42,
      clearcoatRoughness: 0.22,
      emissive: "#151a1b",
      emissiveIntensity: 0.12,
      flatShading: true,
      metalness: 0.78,
      roughness: 0.26,
    });
    hardware.name = "portfolio_joint_hardware";

    const accent = new THREE.MeshPhysicalMaterial({
      color: accentColor,
      emissive: new THREE.Color(accentColor).multiplyScalar(0.24),
      emissiveIntensity: 0.75,
      flatShading: true,
      metalness: 0.38,
      roughness: 0.28,
    });
    accent.name = "portfolio_end_effector";

    return { accent, body, hardware };
  }, [accentColor, bodyColor]);

  useEffect(
    () => () => {
      materials.body.dispose();
      materials.hardware.dispose();
      materials.accent.dispose();
    },
    [materials],
  );

  const model = useMemo(() => {
    const clone = scene.clone(true);

    clone.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;

      const linkName = object.name;
      object.material =
        linkName === "ee_link" || linkName === "link3"
          ? materials.accent
          : linkName === "link1" || linkName === "link4"
            ? materials.hardware
            : materials.body;
      object.castShadow = true;
      object.receiveShadow = true;
    });

    return clone;
  }, [materials, scene]);
  const endEffector = useMemo(() => model.getObjectByName("ee_link"), [model]);

  useLayoutEffect(() => {
    const resolvedJoints: JointMap = {};
    for (const name of JOINT_NAMES) {
      const joint = model.getObjectByName(name);
      if (joint) resolvedJoints[name] = joint;
    }
    joints.current = resolvedJoints;
    setJointPose(joints.current, HOME_POSE);

    return () => {
      joints.current = {};
    };
  }, [model]);

  useLayoutEffect(() => {
    setJointPose(joints.current, HOME_POSE);
    if (presentation.current && (!animate || reducedMotion)) {
      presentation.current.rotation.set(0, 0, 0);
      presentation.current.position.set(0, 0, 0);
    }
  }, [animate, reducedMotion]);

  useFrame((state, delta) => {
    const scrollProgress = scrollProgressRef?.current;
    if (carriedWorkpiece.current) {
      carriedWorkpiece.current.visible =
        animate &&
        !reducedMotion &&
        scrollProgress !== undefined &&
        scrollProgress >= ROBOT_PICKUP_PROGRESS &&
        scrollProgress < ROBOT_PLACE_PROGRESS;
    }

    if (!animate || reducedMotion) return;

    const time = state.clock.getElapsedTime();
    const dampingDelta = Math.min(delta, 0.05);
    const pointerX = state.pointer.x * pointerInfluence;
    const pointerY = state.pointer.y * pointerInfluence;
    const targets: Record<JointName, number> = scrollProgress === undefined
      ? {
          joint1_axis: HOME_POSE.joint1_axis + pointerX + Math.sin(time * 0.42) * 0.05,
          joint2_axis: HOME_POSE.joint2_axis + pointerY * 0.55 + Math.sin(time * 0.51 + 0.8) * 0.035,
          joint3_axis: HOME_POSE.joint3_axis - pointerY * 0.32 + Math.sin(time * 0.46 + 1.7) * 0.04,
          joint4_axis: HOME_POSE.joint4_axis - pointerX * 0.42 + Math.sin(time * 0.58 + 2.1) * 0.045,
          joint5_axis: HOME_POSE.joint5_axis + pointerY * 0.4 + Math.sin(time * 0.48 + 2.9) * 0.03,
          joint6_axis: HOME_POSE.joint6_axis + Math.sin(time * 0.67) * 0.06,
        }
      : (() => {
          const scaled =
            THREE.MathUtils.clamp(scrollProgress, 0, 0.9999) *
            (PICK_AND_PLACE_POSES.length - 1);
          const poseIndex = Math.floor(scaled);
          const nextPoseIndex = Math.min(
            poseIndex + 1,
            PICK_AND_PLACE_POSES.length - 1,
          );
          const localProgress = THREE.MathUtils.smoothstep(
            scaled - poseIndex,
            0,
            1,
          );
          const pose = {} as Record<JointName, number>;

          for (const name of JOINT_NAMES) {
            pose[name] = THREE.MathUtils.lerp(
              PICK_AND_PLACE_POSES[poseIndex][name],
              PICK_AND_PLACE_POSES[nextPoseIndex][name],
              localProgress,
            );
          }

          return pose;
        })();

    for (const name of JOINT_NAMES) {
      const joint = joints.current[name];
      if (!joint) continue;
      joint.rotation.z = THREE.MathUtils.damp(
        joint.rotation.z,
        targets[name],
        4.1,
        dampingDelta,
      );
    }

    if (presentation.current) {
      presentation.current.rotation.y = THREE.MathUtils.damp(
        presentation.current.rotation.y,
        scrollProgress === undefined ? state.pointer.x * 0.055 : 0,
        3.2,
        dampingDelta,
      );
      presentation.current.rotation.x = THREE.MathUtils.damp(
        presentation.current.rotation.x,
        scrollProgress === undefined ? -state.pointer.y * 0.025 : 0,
        3.2,
        dampingDelta,
      );
      presentation.current.position.y =
        scrollProgress === undefined ? Math.sin(time * 0.38) * 0.012 : 0;
    }
  });

  return (
    <group {...groupProps}>
      <group ref={presentation}>
        <group rotation={[-Math.PI / 2, 0, 0]} scale={modelScale}>
          <primitive object={model} />
          {heldWorkpiece && endEffector
            ? createPortal(
                <group
                  ref={carriedWorkpiece}
                  position={[0, 0, -0.045]}
                  visible={false}
                >
                  {heldWorkpiece}
                </group>,
                endEffector,
              )
            : null}
        </group>
      </group>
    </group>
  );
}

export default ZeroRoboticArmModel;
