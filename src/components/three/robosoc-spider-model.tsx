"use client";

import { Line, useGLTF } from "@react-three/drei";
import { useFrame, type ThreeElements } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import {
  ROBOSOC_LEG_NAMES,
  ROBOSOC_SPIDER_MODEL_URL,
  createStableRobosocSpiderPose,
  forwardSpiderLegKinematics,
  getRobosocSpiderJointRotation,
  getSpiderLegMount,
  sampleRobosocSpiderGait,
  type RobosocLegName,
  type RobosocSpiderGaitSample,
  type RobosocSpiderJointRole,
} from "./robosoc-spider-gait";

type JointRole = RobosocSpiderJointRole;

type LegJointMap = Partial<Record<JointRole, THREE.Object3D>>;

type JointMap = Record<RobosocLegName, LegJointMap>;

type JointBaselineMap = Record<
  RobosocLegName,
  Partial<Record<JointRole, number>>
>;

export type RobosocSpiderModelProps = Omit<ThreeElements["group"], "children"> & {
  active?: boolean;
  modelScale?: number;
  reducedMotion?: boolean;
};

const EMPTY_JOINT_MAP = ROBOSOC_LEG_NAMES.reduce((map, leg) => {
  map[leg] = {};
  return map;
}, {} as JointMap);

const JOINT_AXES: Record<JointRole, "x" | "y" | "z"> = {
  coxa: "y",
  femur: "z",
  tibia: "z",
};

function cloneMaterialForDarkStage(material: THREE.Material) {
  const clone = material.clone();

  if (clone instanceof THREE.MeshStandardMaterial) {
    const hsl = clone.color.getHSL({ h: 0, s: 0, l: 0 });
    clone.color.setHSL(hsl.h, Math.min(hsl.s, 0.24), Math.max(hsl.l, 0.34));
    clone.emissive.copy(clone.color).multiplyScalar(0.12);
    clone.emissiveIntensity = 0.32;
    clone.metalness = Math.min(clone.metalness, 0.45);
    clone.roughness = Math.max(clone.roughness, 0.42);
  }

  return clone;
}

function findJoint(model: THREE.Object3D, leg: RobosocLegName, role: JointRole) {
  const candidates = [
    `${leg}_${role}_joint`,
    `${leg}_${role}_solid`,
    `${leg}_${role}_motor`,
  ];

  for (const name of candidates) {
    const joint = model.getObjectByName(name);
    if (joint) return joint;
  }

  return undefined;
}

function setObjectAngle(
  object: THREE.Object3D,
  baseline: number,
  role: JointRole,
  angle: number,
) {
  object.rotation[JOINT_AXES[role]] = getRobosocSpiderJointRotation(
    baseline,
    role,
    angle,
  );
}

function applyPoseToJoints(
  joints: JointMap,
  baselines: JointBaselineMap,
  sample: RobosocSpiderGaitSample,
) {
  for (const leg of ROBOSOC_LEG_NAMES) {
    const legJoints = joints[leg];
    const angles = sample.legs[leg].angles;

    for (const role of ["coxa", "femur", "tibia"] as const) {
      const joint = legJoints[role];
      const baseline = baselines[leg][role];
      if (joint && baseline !== undefined) {
        setObjectAngle(joint, baseline, role, angles[role]);
      }
    }
  }
}

function RobosocSpiderFallbackModel({
  sample,
}: {
  sample: RobosocSpiderGaitSample;
}) {
  return (
    <group>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.88, 0.98, 0.28, 6]} />
        <meshStandardMaterial
          color="#252b2d"
          emissive="#071113"
          emissiveIntensity={0.18}
          metalness={0.54}
          roughness={0.42}
        />
      </mesh>
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.55, 0.72, 0.12, 6]} />
        <meshStandardMaterial
          color="#697579"
          metalness={0.62}
          roughness={0.34}
        />
      </mesh>
      {ROBOSOC_LEG_NAMES.map((leg) => {
        const mount = getSpiderLegMount(leg);
        const heading = Math.atan2(mount[2], mount[0]);
        const points = forwardSpiderLegKinematics(sample.legs[leg].angles);
        const worldPoints = points.map(
          ([x, y, z]) =>
            new THREE.Vector3(
              mount[0] + x * Math.cos(heading) - y * Math.sin(heading),
              mount[1] - z,
              mount[2] + x * Math.sin(heading) + y * Math.cos(heading),
            ),
        );

        return (
          <group key={leg}>
            <Line
              color={sample.legs[leg].planted ? "#8ea09e" : "#b8ff4f"}
              lineWidth={1.5}
              opacity={0.92}
              points={worldPoints}
              transparent
            />
            {worldPoints.map((point, index) => (
              <mesh key={`${leg}-${index}`} position={point}>
                <sphereGeometry args={[index === 3 ? 0.035 : 0.055, 10, 10]} />
                <meshStandardMaterial
                  color={index === 3 ? "#b8ff4f" : "#3a4446"}
                  emissive={index === 3 ? "#23370a" : "#050809"}
                  emissiveIntensity={0.28}
                  metalness={0.4}
                  roughness={0.42}
                />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
}

export function RobosocSpiderModel({
  active = true,
  modelScale = 1,
  reducedMotion = false,
  ...groupProps
}: RobosocSpiderModelProps) {
  const { scene } = useGLTF(ROBOSOC_SPIDER_MODEL_URL);
  const root = useRef<THREE.Group>(null);
  const presentation = useRef<THREE.Group>(null);
  const joints = useRef<JointMap>(EMPTY_JOINT_MAP);
  const jointBaselines = useRef<JointBaselineMap>({} as JointBaselineMap);
  const stablePose = useMemo(() => createStableRobosocSpiderPose(), []);

  const model = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.castShadow = true;
      object.receiveShadow = true;
      const material = object.material;
      if (Array.isArray(material)) {
        object.material = material.map(cloneMaterialForDarkStage);
      } else {
        object.material = cloneMaterialForDarkStage(material);
      }
    });
    return clone;
  }, [scene]);

  const resolvedModelJoints = useMemo(() => {
    const nextJoints = ROBOSOC_LEG_NAMES.reduce((map, leg) => {
      map[leg] = {
        coxa: findJoint(model, leg, "coxa"),
        femur: findJoint(model, leg, "femur"),
        tibia: findJoint(model, leg, "tibia"),
      };
      return map;
    }, {} as JointMap);
    const hasJoints = ROBOSOC_LEG_NAMES.every((leg) =>
        Object.values(nextJoints[leg]).every(Boolean),
      );

    const baselines = ROBOSOC_LEG_NAMES.reduce((map, leg) => {
      map[leg] = {};
      for (const role of ["coxa", "femur", "tibia"] as const) {
        const joint = nextJoints[leg][role];
        if (joint) map[leg][role] = joint.rotation[JOINT_AXES[role]];
      }
      return map;
    }, {} as JointBaselineMap);

    return { baselines, hasJoints, joints: nextJoints };
  }, [model]);

  useEffect(
    () => () => {
      model.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        const materials = Array.isArray(object.material)
          ? object.material
          : [object.material];
        materials.forEach((material) => material.dispose());
      });
    },
    [model],
  );

  useLayoutEffect(() => {
    joints.current = resolvedModelJoints.joints;
    jointBaselines.current = resolvedModelJoints.baselines;
    applyPoseToJoints(
      resolvedModelJoints.joints,
      resolvedModelJoints.baselines,
      stablePose,
    );

    return () => {
      joints.current = EMPTY_JOINT_MAP;
      jointBaselines.current = {} as JointBaselineMap;
    };
  }, [resolvedModelJoints, stablePose]);

  useFrame((state, delta) => {
    const sample = reducedMotion || !active
      ? stablePose
      : sampleRobosocSpiderGait(state.clock.getElapsedTime());
    const dampingDelta = Math.min(delta, 0.05);

    if (presentation.current) {
      presentation.current.position.x = THREE.MathUtils.damp(
        presentation.current.position.x,
        sample.bodyX,
        3.8,
        dampingDelta,
      );
      presentation.current.position.z = THREE.MathUtils.damp(
        presentation.current.position.z,
        sample.bodyZ,
        3.8,
        dampingDelta,
      );
      presentation.current.rotation.y = THREE.MathUtils.damp(
        presentation.current.rotation.y,
        sample.bodyYaw,
        4.2,
        dampingDelta,
      );
    }

    for (const leg of ROBOSOC_LEG_NAMES) {
      const angles = sample.legs[leg].angles;
      const legJoints = joints.current[leg];

      for (const role of ["coxa", "femur", "tibia"] as const) {
        const joint = legJoints[role];
        const baseline = jointBaselines.current[leg]?.[role];
        if (!joint || baseline === undefined) continue;
        const axis = JOINT_AXES[role];
        joint.rotation[axis] = THREE.MathUtils.damp(
          joint.rotation[axis],
          getRobosocSpiderJointRotation(baseline, role, angles[role]),
          10.5,
          dampingDelta,
        );
      }
    }
  });

  return (
    <group ref={root} {...groupProps}>
      <group ref={presentation}>
        <primitive object={model} scale={modelScale} />
        {!resolvedModelJoints.hasJoints && (
          <RobosocSpiderFallbackModel sample={stablePose} />
        )}
      </group>
    </group>
  );
}

useGLTF.preload(ROBOSOC_SPIDER_MODEL_URL);

export default RobosocSpiderModel;
