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

import {
  interpolateCatmullRom,
  sampleRobotCycle,
  solveCcdIk,
  type RobotCyclePosture,
  type RobotCycleSample,
  type RobotCycleTargets,
} from "./robotic-arm-kinematics";

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

const IK_JOINT_LIMITS = [
  [-Math.PI, Math.PI],
  [-2.85, 1.45],
  [-2.45, 2.45],
  [-2.85, 2.85],
  [-2.85, 2.85],
] as const;

const PREFERRED_CYCLE_POSES: Record<
  RobotCyclePosture,
  Record<JointName, number>
> = {
  home: HOME_POSE,
  "pickup-rear": {
    joint1_axis: -0.82,
    joint2_axis: 0.2,
    joint3_axis: 1.06,
    joint4_axis: 0.98,
    joint5_axis: -0.42,
    joint6_axis: 0.36,
  },
  "pickup-above": {
    joint1_axis: -0.92,
    joint2_axis: 0.42,
    joint3_axis: 0.93,
    joint4_axis: 0.88,
    joint5_axis: -0.36,
    joint6_axis: 0.37,
  },
  pickup: {
    joint1_axis: -0.986,
    joint2_axis: 1.062,
    joint3_axis: 0.883,
    joint4_axis: 0.722,
    joint5_axis: -0.296,
    joint6_axis: 0.334,
  },
  transit: {
    joint1_axis: 0.16,
    joint2_axis: 0.4,
    joint3_axis: 0.93,
    joint4_axis: 0.83,
    joint5_axis: -0.19,
    joint6_axis: 0.1,
  },
  "place-above": {
    joint1_axis: 1.24,
    joint2_axis: 0.7,
    joint3_axis: 1.08,
    joint4_axis: 1.42,
    joint5_axis: 0.12,
    joint6_axis: -0.28,
  },
  place: {
    joint1_axis: 1.31,
    joint2_axis: 1.18,
    joint3_axis: 1.22,
    joint4_axis: 1.88,
    joint5_axis: -0.09,
    joint6_axis: -0.21,
  },
};

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
  /** Pickup target in the arm parent's coordinate system. */
  pickupTarget?: [number, number, number];
  /** Placement target in the arm parent's coordinate system. */
  placeTarget?: [number, number, number];
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
  pickupTarget = [-2.2, -1.36, 0.9],
  placeTarget = [2.2, -1.36, 0.72],
  reducedMotion = false,
  scrollProgressRef,
  ...groupProps
}: ZeroRoboticArmModelProps) {
  const { scene } = useGLTF(ZERO_ROBOTIC_ARM_MODEL_URL);
  const carriedWorkpiece = useRef<THREE.Group>(null);
  const gripper = useRef<THREE.Group>(null);
  const leftFinger = useRef<THREE.Mesh>(null);
  const presentation = useRef<THREE.Group>(null);
  const rightFinger = useRef<THREE.Mesh>(null);
  const root = useRef<THREE.Group>(null);
  const toolCenter = useRef<THREE.Group>(null);
  const joints = useRef<JointMap>({});
  const ikJoints = useRef<THREE.Object3D[]>([]);
  const homeTargetReady = useRef(false);
  const homeTarget = useRef(new THREE.Vector3());
  const targetWorld = useRef(new THREE.Vector3());
  const gripperParentWorld = useRef(new THREE.Quaternion());
  const cycleTargets = useRef<RobotCycleTargets>({
    home: new THREE.Vector3(),
    pickup: new THREE.Vector3(...pickupTarget),
    place: new THREE.Vector3(...placeTarget),
  });
  const cycleSample = useRef<RobotCycleSample>({
    carrying: false,
    grip: 0,
    postureEnd: "home",
    postureNext: "home",
    posturePrevious: "home",
    postureProgress: 0,
    postureStart: "home",
    target: new THREE.Vector3(),
  });
  const currentJointRotations = useRef(new Float32Array(JOINT_NAMES.length));
  const solvedJointRotations = useRef(new Float32Array(JOINT_NAMES.length));

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
    ikJoints.current = JOINT_NAMES.slice(0, 5).flatMap((name) => {
      const joint = resolvedJoints[name];
      return joint ? [joint] : [];
    });
    setJointPose(joints.current, HOME_POSE);
    homeTargetReady.current = false;

    return () => {
      joints.current = {};
      ikJoints.current = [];
    };
  }, [model]);

  useEffect(() => {
    cycleTargets.current.pickup.set(...pickupTarget);
    cycleTargets.current.place.set(...placeTarget);
  }, [pickupTarget, placeTarget]);

  useLayoutEffect(() => {
    setJointPose(joints.current, HOME_POSE);
    if (presentation.current && (!animate || reducedMotion)) {
      presentation.current.rotation.set(0, 0, 0);
      presentation.current.position.set(0, 0, 0);
    }
  }, [animate, reducedMotion]);

  useFrame((state, delta) => {
    const scrollProgress = scrollProgressRef?.current;
    const armRoot = root.current;

    const alignGripper = () => {
      if (!gripper.current?.parent) return;
      gripper.current.parent.getWorldQuaternion(gripperParentWorld.current);
      gripper.current.quaternion.copy(gripperParentWorld.current).invert();
    };

    if (
      !homeTargetReady.current &&
      armRoot?.parent &&
      toolCenter.current
    ) {
      alignGripper();
      armRoot.updateWorldMatrix(true, true);
      toolCenter.current.getWorldPosition(homeTarget.current);
      armRoot.parent.worldToLocal(homeTarget.current);
      cycleTargets.current.home.copy(homeTarget.current);
      homeTargetReady.current = true;
    }

    if (!animate || reducedMotion) {
      if (carriedWorkpiece.current) carriedWorkpiece.current.visible = false;
      if (leftFinger.current) leftFinger.current.position.x = -0.036;
      if (rightFinger.current) rightFinger.current.position.x = 0.036;
      alignGripper();
      return;
    }

    if (scrollProgress === undefined) {
      if (carriedWorkpiece.current) carriedWorkpiece.current.visible = false;
      if (leftFinger.current) leftFinger.current.position.x = -0.036;
      if (rightFinger.current) rightFinger.current.position.x = 0.036;
      const time = state.clock.getElapsedTime();
      const dampingDelta = Math.min(delta, 0.05);
      const pointerX = state.pointer.x * pointerInfluence;
      const pointerY = state.pointer.y * pointerInfluence;
      const targets: Record<JointName, number> = {
        joint1_axis:
          HOME_POSE.joint1_axis + pointerX + Math.sin(time * 0.42) * 0.05,
        joint2_axis:
          HOME_POSE.joint2_axis +
          pointerY * 0.55 +
          Math.sin(time * 0.51 + 0.8) * 0.035,
        joint3_axis:
          HOME_POSE.joint3_axis -
          pointerY * 0.32 +
          Math.sin(time * 0.46 + 1.7) * 0.04,
        joint4_axis:
          HOME_POSE.joint4_axis -
          pointerX * 0.42 +
          Math.sin(time * 0.58 + 2.1) * 0.045,
        joint5_axis:
          HOME_POSE.joint5_axis +
          pointerY * 0.4 +
          Math.sin(time * 0.48 + 2.9) * 0.03,
        joint6_axis:
          HOME_POSE.joint6_axis + Math.sin(time * 0.67) * 0.06,
      };

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
      alignGripper();
      return;
    }

    const sample = sampleRobotCycle(
      scrollProgress,
      cycleTargets.current,
      cycleSample.current,
    );
    if (carriedWorkpiece.current) {
      carriedWorkpiece.current.visible = sample.carrying;
    }
    const fingerPosition = THREE.MathUtils.lerp(0.036, 0.0215, sample.grip);
    if (leftFinger.current) leftFinger.current.position.x = -fingerPosition;
    if (rightFinger.current) rightFinger.current.position.x = fingerPosition;

    const previousPose = PREFERRED_CYCLE_POSES[sample.posturePrevious];
    const startPose = PREFERRED_CYCLE_POSES[sample.postureStart];
    const endPose = PREFERRED_CYCLE_POSES[sample.postureEnd];
    const nextPose = PREFERRED_CYCLE_POSES[sample.postureNext];
    const dampingDelta = Math.min(delta, 0.05);
    for (const [index, name] of JOINT_NAMES.entries()) {
      const joint = joints.current[name];
      if (!joint) continue;
      currentJointRotations.current[index] = joint.rotation.z;
      const preferredRotation = interpolateCatmullRom(
        previousPose[name],
        startPose[name],
        endPose[name],
        nextPose[name],
        sample.postureProgress,
      );
      joint.rotation.z = THREE.MathUtils.damp(
        joint.rotation.z,
        preferredRotation,
        7.5,
        dampingDelta,
      );
    }

    if (armRoot?.parent && toolCenter.current) {
      targetWorld.current.copy(sample.target);
      armRoot.parent.localToWorld(targetWorld.current);
      solveCcdIk({
        beforeSample: alignGripper,
        iterations: 6,
        jointLimits: IK_JOINT_LIMITS,
        joints: ikJoints.current,
        root: armRoot,
        stepLimit: 0.14,
        targetWorld: targetWorld.current,
        toolCenter: toolCenter.current,
      });
    }

    for (const [index, name] of JOINT_NAMES.entries()) {
      const joint = joints.current[name];
      if (!joint) continue;
      solvedJointRotations.current[index] = joint.rotation.z;
      joint.rotation.z = THREE.MathUtils.damp(
        currentJointRotations.current[index],
        solvedJointRotations.current[index],
        16,
        dampingDelta,
      );
    }
    alignGripper();
  });

  return (
    <group ref={root} {...groupProps}>
      <group ref={presentation}>
        <group rotation={[-Math.PI / 2, 0, 0]} scale={modelScale}>
          <primitive object={model} />
          {endEffector
            ? createPortal(
                <group ref={gripper}>
                  <mesh position={[0, -0.008, 0]} material={materials.accent}>
                    <boxGeometry args={[0.085, 0.02, 0.055]} />
                  </mesh>
                  <mesh
                    ref={leftFinger}
                    position={[-0.036, -0.047, 0]}
                    material={materials.hardware}
                  >
                    <boxGeometry args={[0.011, 0.074, 0.026]} />
                  </mesh>
                  <mesh
                    ref={rightFinger}
                    position={[0.036, -0.047, 0]}
                    material={materials.hardware}
                  >
                    <boxGeometry args={[0.011, 0.074, 0.026]} />
                  </mesh>
                  <group ref={toolCenter} position={[0, -0.052, 0]}>
                    {heldWorkpiece ? (
                      <group ref={carriedWorkpiece} visible={false}>
                        {heldWorkpiece}
                      </group>
                    ) : null}
                  </group>
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
