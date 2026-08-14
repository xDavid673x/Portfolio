import * as THREE from "three";

export const ROBOT_PICKUP_PROGRESS = 0.28;
export const ROBOT_PLACE_PROGRESS = 0.82;
const ROBOT_GRASP_START_PROGRESS = 0.23;
const ROBOT_RELEASE_START_PROGRESS = 0.77;

export type RobotCyclePosture =
  | "home"
  | "pickup-rear"
  | "pickup-above"
  | "pickup"
  | "transit"
  | "place-above"
  | "place";

const APPROACH_PATH: RobotCyclePosture[] = [
  "home",
  "pickup-rear",
  "pickup-above",
  "pickup",
];
const TRANSFER_PATH: RobotCyclePosture[] = [
  "pickup",
  "pickup-above",
  "transit",
  "place-above",
  "place",
];
const RETURN_PATH: RobotCyclePosture[] = ["place", "place-above", "home"];

export type RobotCycleSample = {
  carrying: boolean;
  grip: number;
  postureEnd: RobotCyclePosture;
  postureNext: RobotCyclePosture;
  posturePrevious: RobotCyclePosture;
  postureProgress: number;
  postureStart: RobotCyclePosture;
  target: THREE.Vector3;
};

export type RobotCycleTargets = {
  home: THREE.Vector3;
  pickup: THREE.Vector3;
  place: THREE.Vector3;
};

type JointLimit = readonly [minimum: number, maximum: number];

export type CcdIkOptions = {
  beforeSample?: () => void;
  iterations?: number;
  jointLimits?: readonly JointLimit[];
  joints: readonly THREE.Object3D[];
  root: THREE.Object3D;
  stepLimit?: number;
  targetWorld: THREE.Vector3;
  toolCenter: THREE.Object3D;
};

const jointPosition = new THREE.Vector3();
const toolPosition = new THREE.Vector3();
const jointAxis = new THREE.Vector3();
const toolVector = new THREE.Vector3();
const targetVector = new THREE.Vector3();
const crossVector = new THREE.Vector3();
const jointWorldQuaternion = new THREE.Quaternion();
const resolvedPrevious = new THREE.Vector3();
const resolvedStart = new THREE.Vector3();
const resolvedEnd = new THREE.Vector3();
const resolvedNext = new THREE.Vector3();

function resolveCycleTarget(
  target: RobotCyclePosture,
  targets: RobotCycleTargets,
  out: THREE.Vector3,
) {
  if (target === "home") return out.copy(targets.home);
  if (target === "pickup") return out.copy(targets.pickup);
  if (target === "place") return out.copy(targets.place);

  if (target === "pickup-above") {
    out.copy(targets.pickup);
    out.y += 0.82;
    return out;
  }
  if (target === "pickup-rear") {
    out.copy(targets.pickup);
    out.y += 0.9;
    out.z -= 0.82;
    return out;
  }
  if (target === "place-above") {
    out.copy(targets.place);
    out.y += 0.82;
    return out;
  }

  return out
    .copy(targets.pickup)
    .lerp(targets.place, 0.5)
    .setY(Math.max(targets.pickup.y, targets.place.y) + 2.15);
}

export function interpolateCatmullRom(
  previous: number,
  start: number,
  end: number,
  next: number,
  progress: number,
) {
  const squared = progress * progress;
  const cubed = squared * progress;
  return 0.5 * (
    2 * start +
    (-previous + end) * progress +
    (2 * previous - 5 * start + 4 * end - next) * squared +
    (-previous + 3 * start - 3 * end + next) * cubed
  );
}

function sampleMotionPath(
  path: RobotCyclePosture[],
  progress: number,
  targets: RobotCycleTargets,
  out: RobotCycleSample,
) {
  const scaledProgress = THREE.MathUtils.clamp(progress, 0, 1) * (path.length - 1);
  const startIndex = Math.min(Math.floor(scaledProgress), path.length - 2);
  const localProgress = scaledProgress - startIndex;
  const previous = path[Math.max(0, startIndex - 1)];
  const start = path[startIndex];
  const end = path[startIndex + 1];
  const next = path[Math.min(path.length - 1, startIndex + 2)];

  resolveCycleTarget(previous, targets, resolvedPrevious);
  resolveCycleTarget(start, targets, resolvedStart);
  resolveCycleTarget(end, targets, resolvedEnd);
  resolveCycleTarget(next, targets, resolvedNext);
  out.target.set(
    interpolateCatmullRom(
      resolvedPrevious.x,
      resolvedStart.x,
      resolvedEnd.x,
      resolvedNext.x,
      localProgress,
    ),
    interpolateCatmullRom(
      resolvedPrevious.y,
      resolvedStart.y,
      resolvedEnd.y,
      resolvedNext.y,
      localProgress,
    ),
    interpolateCatmullRom(
      resolvedPrevious.z,
      resolvedStart.z,
      resolvedEnd.z,
      resolvedNext.z,
      localProgress,
    ),
  );
  out.posturePrevious = previous;
  out.postureStart = start;
  out.postureEnd = end;
  out.postureNext = next;
  out.postureProgress = localProgress;
}

function holdPosture(
  posture: RobotCyclePosture,
  targets: RobotCycleTargets,
  out: RobotCycleSample,
) {
  resolveCycleTarget(posture, targets, out.target);
  out.posturePrevious = posture;
  out.postureStart = posture;
  out.postureEnd = posture;
  out.postureNext = posture;
  out.postureProgress = 0;
}

export function sampleRobotCycle(
  progress: number,
  targets: RobotCycleTargets,
  out: RobotCycleSample,
) {
  const normalizedProgress = THREE.MathUtils.clamp(progress, 0, 1);
  if (normalizedProgress < ROBOT_GRASP_START_PROGRESS) {
    const phaseProgress = THREE.MathUtils.smootherstep(
      normalizedProgress / ROBOT_GRASP_START_PROGRESS,
      0,
      1,
    );
    sampleMotionPath(APPROACH_PATH, phaseProgress, targets, out);
    out.grip = 0;
  } else if (normalizedProgress < ROBOT_PICKUP_PROGRESS) {
    holdPosture("pickup", targets, out);
    out.grip = THREE.MathUtils.smootherstep(
      (normalizedProgress - ROBOT_GRASP_START_PROGRESS) /
        (ROBOT_PICKUP_PROGRESS - ROBOT_GRASP_START_PROGRESS),
      0,
      1,
    );
  } else if (normalizedProgress < ROBOT_RELEASE_START_PROGRESS) {
    const phaseProgress = THREE.MathUtils.smootherstep(
      (normalizedProgress - ROBOT_PICKUP_PROGRESS) /
        (ROBOT_RELEASE_START_PROGRESS - ROBOT_PICKUP_PROGRESS),
      0,
      1,
    );
    sampleMotionPath(TRANSFER_PATH, phaseProgress, targets, out);
    out.grip = 1;
  } else if (normalizedProgress < ROBOT_PLACE_PROGRESS) {
    holdPosture("place", targets, out);
    out.grip = 1 - THREE.MathUtils.smootherstep(
      (normalizedProgress - ROBOT_RELEASE_START_PROGRESS) /
        (ROBOT_PLACE_PROGRESS - ROBOT_RELEASE_START_PROGRESS),
      0,
      1,
    );
  } else {
    const phaseProgress = THREE.MathUtils.smootherstep(
      (normalizedProgress - ROBOT_PLACE_PROGRESS) /
        (1 - ROBOT_PLACE_PROGRESS),
      0,
      1,
    );
    sampleMotionPath(RETURN_PATH, phaseProgress, targets, out);
    out.grip = 0;
  }

  out.carrying =
    normalizedProgress >= ROBOT_PICKUP_PROGRESS &&
    normalizedProgress < ROBOT_PLACE_PROGRESS;

  return out;
}

export function solveCcdIk({
  beforeSample,
  iterations = 5,
  jointLimits,
  joints,
  root,
  stepLimit = 0.24,
  targetWorld,
  toolCenter,
}: CcdIkOptions) {
  for (let iteration = 0; iteration < iterations; iteration += 1) {
    for (let index = joints.length - 1; index >= 0; index -= 1) {
      beforeSample?.();
      root.updateWorldMatrix(true, true);

      const joint = joints[index];
      joint.getWorldPosition(jointPosition);
      joint.getWorldQuaternion(jointWorldQuaternion);
      toolCenter.getWorldPosition(toolPosition);
      jointAxis
        .set(0, 0, 1)
        .applyQuaternion(jointWorldQuaternion)
        .normalize();

      toolVector.copy(toolPosition).sub(jointPosition);
      toolVector.addScaledVector(jointAxis, -toolVector.dot(jointAxis));
      targetVector.copy(targetWorld).sub(jointPosition);
      targetVector.addScaledVector(jointAxis, -targetVector.dot(jointAxis));

      if (toolVector.lengthSq() < 1e-10 || targetVector.lengthSq() < 1e-10) {
        continue;
      }

      toolVector.normalize();
      targetVector.normalize();
      const angle = Math.atan2(
        jointAxis.dot(crossVector.crossVectors(toolVector, targetVector)),
        THREE.MathUtils.clamp(toolVector.dot(targetVector), -1, 1),
      );
      const limit = jointLimits?.[index];
      const nextRotation = joint.rotation.z + THREE.MathUtils.clamp(
        angle,
        -stepLimit,
        stepLimit,
      );
      joint.rotation.z = limit
        ? THREE.MathUtils.clamp(nextRotation, limit[0], limit[1])
        : nextRotation;
    }
  }

  beforeSample?.();
  root.updateWorldMatrix(true, true);
  toolCenter.getWorldPosition(toolPosition);
  return toolPosition.distanceTo(targetWorld);
}
