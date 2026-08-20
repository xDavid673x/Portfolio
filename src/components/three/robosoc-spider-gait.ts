export const ROBOSOC_SPIDER_MODEL_URL = "/models/robosoc-spider.glb";

export const ROBOSOC_LEG_NAMES = [
  "legi",
  "legj",
  "legk",
  "legl",
  "legm",
  "legn",
] as const;

export type RobosocLegName = (typeof ROBOSOC_LEG_NAMES)[number];

export const ROBOSOC_TRIPOD_A = ["legi", "legk", "legm"] as const;
export const ROBOSOC_TRIPOD_B = ["legj", "legl", "legn"] as const;

export type RobosocTripod = "A" | "B";

export type Vec3Tuple = readonly [x: number, y: number, z: number];

export type RobosocSpiderLegAngles = {
  coxa: number;
  femur: number;
  tibia: number;
};

export type RobosocSpiderJointRole = keyof RobosocSpiderLegAngles;

export type RobosocSpiderLegSample = {
  angles: RobosocSpiderLegAngles;
  foot: Vec3Tuple;
  phase: number;
  planted: boolean;
  tripod: RobosocTripod;
};

export type RobosocSpiderGaitSample = {
  bodyYaw: number;
  bodyX: number;
  bodyZ: number;
  cycleProgress: number;
  legs: Record<RobosocLegName, RobosocSpiderLegSample>;
  patrolProgress: number;
  turnBlend: number;
};

type LegLengths = {
  coxa: number;
  femur: number;
  tibia: number;
};

type JointLimit = readonly [minimum: number, maximum: number];

const SOURCE_LENGTHS_MM = {
  coxa: 42.069923,
  femur: 88.059172,
  tibia: 164.862261,
} as const;

const SOURCE_SCENE_SCALE = 0.01;
const STRIDE_MM = 132;
const WALK_STEP_COUNT = 48;
const BODY_HEIGHT_MM = -118;
const BODY_X_MM = 142;
const LIFT_MM = 28;
const PATROL_PERIOD_SECONDS = 14;
const WALK_CYCLES_PER_PATROL = 18;

export const ROBOSOC_SPIDER_LEG_LENGTHS: LegLengths = {
  coxa: SOURCE_LENGTHS_MM.coxa * SOURCE_SCENE_SCALE,
  femur: SOURCE_LENGTHS_MM.femur * SOURCE_SCENE_SCALE,
  tibia: SOURCE_LENGTHS_MM.tibia * SOURCE_SCENE_SCALE,
};

export const ROBOSOC_SPIDER_STAND_ANGLES: RobosocSpiderLegAngles = {
  coxa: 0,
  femur: degreesToRadians(28),
  tibia: degreesToRadians(115),
};

export const ROBOSOC_SPIDER_JOINT_LIMITS: Record<
  RobosocSpiderJointRole,
  JointLimit
> = {
  coxa: [degreesToRadians(-90), degreesToRadians(90)],
  femur: [degreesToRadians(-90), degreesToRadians(90)],
  tibia: [0, degreesToRadians(130)],
};

export const ROBOSOC_SPIDER_JOINT_SIGNS: Record<
  RobosocSpiderJointRole,
  number
> = {
  coxa: -1,
  femur: 1,
  tibia: -1,
};

export const ROBOSOC_SPIDER_GAIT_COMPENSATION: Record<RobosocLegName, number> = {
  legi: 0,
  legj: Math.PI / 3,
  legk: 2 * Math.PI / 3,
  legl: -Math.PI,
  legm: -2 * Math.PI / 3,
  legn: -Math.PI / 3,
};

const LEG_MOUNT_RADIUS = 0.96;
const LEG_MOUNT_Z = 0.12;
const SOURCE_TARGET_SCALE = SOURCE_SCENE_SCALE;
const STRIDE = STRIDE_MM * SOURCE_TARGET_SCALE;
const BODY_HEIGHT = BODY_HEIGHT_MM * SOURCE_TARGET_SCALE;
const BODY_X = BODY_X_MM * SOURCE_TARGET_SCALE;
const LIFT = LIFT_MM * SOURCE_TARGET_SCALE;
const SHOWCASE_YAW = degreesToRadians(35);

function degreesToRadians(value: number) {
  return value * Math.PI / 180;
}

function clamp(value: number, minimum: number, maximum: number) {
  if (!Number.isFinite(value)) return minimum;
  return Math.min(maximum, Math.max(minimum, value));
}

function clampUnit(value: number) {
  return clamp(value, -1, 1);
}

function positiveModulo(value: number, modulus: number) {
  return ((value % modulus) + modulus) % modulus;
}

function cosineEase(progress: number) {
  const t = clamp(progress, 0, 1);
  return 0.5 * (1 - Math.cos(Math.PI * t));
}

function quadraticBezier(
  start: number,
  control: number,
  end: number,
  progress: number,
) {
  const inverse = 1 - progress;
  return inverse * inverse * start + 2 * inverse * progress * control + progress * progress * end;
}

function tripodForLeg(legName: RobosocLegName): RobosocTripod {
  return (ROBOSOC_TRIPOD_A as readonly RobosocLegName[]).includes(legName)
    ? "A"
    : "B";
}

function solveSpiderLegIk(
  target: Vec3Tuple,
  lengths = ROBOSOC_SPIDER_LEG_LENGTHS,
): RobosocSpiderLegAngles {
  const [x, y, z] = target;
  const theta1 = Math.atan2(y, x);
  const xCoxa = Math.cos(theta1) * lengths.coxa;
  const yCoxa = Math.sin(theta1) * lengths.coxa;
  const xFemur = x - xCoxa;
  const yFemur = y - yCoxa;
  const planar = Math.hypot(xFemur, yFemur);
  const vertical = Math.abs(z);
  const rawReach = Math.hypot(planar, vertical);
  const reach = clamp(
    rawReach,
    Math.abs(lengths.tibia - lengths.femur) + 1e-5,
    lengths.tibia + lengths.femur - 1e-5,
  );
  const phi3 = Math.asin(clampUnit(vertical / reach));
  const phi2 = Math.acos(clampUnit(
    (lengths.tibia ** 2 + reach ** 2 - lengths.femur ** 2) /
      (2 * lengths.tibia * reach),
  ));
  const phi1 = Math.acos(clampUnit(
    (lengths.femur ** 2 + reach ** 2 - lengths.tibia ** 2) /
      (2 * lengths.femur * reach),
  ));

  return clampSpiderLegAngles({
    coxa: theta1,
    femur: z > 0 ? phi1 + phi3 : phi1 - phi3,
    tibia: phi1 + phi2,
  });
}

export function clampSpiderLegAngles(
  angles: RobosocSpiderLegAngles,
): RobosocSpiderLegAngles {
  return {
    coxa: clamp(
      angles.coxa,
      ROBOSOC_SPIDER_JOINT_LIMITS.coxa[0],
      ROBOSOC_SPIDER_JOINT_LIMITS.coxa[1],
    ),
    femur: clamp(
      angles.femur,
      ROBOSOC_SPIDER_JOINT_LIMITS.femur[0],
      ROBOSOC_SPIDER_JOINT_LIMITS.femur[1],
    ),
    tibia: clamp(
      angles.tibia,
      ROBOSOC_SPIDER_JOINT_LIMITS.tibia[0],
      ROBOSOC_SPIDER_JOINT_LIMITS.tibia[1],
    ),
  };
}

export function getRobosocSpiderJointRotation(
  baseline: number,
  role: RobosocSpiderJointRole,
  commandAngle: number,
) {
  return baseline + commandAngle * ROBOSOC_SPIDER_JOINT_SIGNS[role];
}

export function sampleSpiderLegIk(target: Vec3Tuple): RobosocSpiderLegAngles {
  return solveSpiderLegIk(target);
}

export function forwardSpiderLegKinematics(
  angles: RobosocSpiderLegAngles,
  lengths = ROBOSOC_SPIDER_LEG_LENGTHS,
): Vec3Tuple[] {
  const theta1 = angles.coxa - Math.PI / 2;
  const theta2 = angles.femur - Math.PI / 2;
  const theta3 = angles.tibia;
  const coxaX = lengths.coxa * Math.cos(theta1);
  const coxaY = lengths.coxa * Math.sin(theta1);
  const femurZ = Math.sin(theta2) * lengths.femur;
  const femurPlanar = Math.cos(theta2) * lengths.femur;
  const femurX = Math.cos(theta1) * femurPlanar;
  const femurY = Math.sin(theta1) * femurPlanar;
  const reach = Math.sqrt(
    lengths.femur ** 2 +
      lengths.tibia ** 2 -
      2 * lengths.femur * lengths.tibia * Math.cos(Math.PI - theta3),
  );
  const phi1 = Math.acos(clampUnit(
    (lengths.femur ** 2 + reach ** 2 - lengths.tibia ** 2) /
      (2 * lengths.femur * reach),
  ));
  const phi3 = phi1 - theta2;
  const tibiaPlanar = Math.cos(phi3) * reach;
  const tibiaZ = Math.sin(phi3) * reach * -1;

  return [
    [0, 0, 0],
    [coxaX, coxaY, 0],
    [coxaX + femurX, coxaY + femurY, femurZ],
    [
      coxaX + Math.cos(theta1) * tibiaPlanar,
      coxaY + Math.sin(theta1) * tibiaPlanar,
      tibiaZ,
    ],
  ];
}

export function getSpiderLegMount(legName: RobosocLegName): Vec3Tuple {
  const angle = ROBOSOC_SPIDER_GAIT_COMPENSATION[legName];
  return [
    Math.cos(angle) * LEG_MOUNT_RADIUS,
    LEG_MOUNT_Z,
    Math.sin(angle) * LEG_MOUNT_RADIUS,
  ];
}

export function sampleRobosocSpiderGait(
  elapsedSeconds: number,
): RobosocSpiderGaitSample {
  const patrolProgress = positiveModulo(
    elapsedSeconds / PATROL_PERIOD_SECONDS,
    1,
  );
  const cyclePhase = patrolProgress * Math.PI * 2;
  const bodyYaw = Math.sin(cyclePhase) * SHOWCASE_YAW;
  const turnBlend = 0.5 + 0.5 * Math.sin(cyclePhase);
  const cycleProgress = positiveModulo(
    patrolProgress * WALK_CYCLES_PER_PATROL,
    1,
  );
  const legs = {} as Record<RobosocLegName, RobosocSpiderLegSample>;

  for (const legName of ROBOSOC_LEG_NAMES) {
    const tripod = tripodForLeg(legName);
    const phaseOffset = tripod === "A" ? 0 : 0.5;
    const phase = positiveModulo(cycleProgress + phaseOffset, 1);
    const swing = phase < 0.5;
    const localProgress = (phase % 0.5) / 0.5;
    const eased = cosineEase(localProgress);
    const travel = quadraticBezier(-STRIDE / 2, 0, STRIDE / 2, eased);
    const height = swing
      ? quadraticBezier(BODY_HEIGHT, BODY_HEIGHT + 2 * LIFT, BODY_HEIGHT, eased)
      : BODY_HEIGHT;
    const compensation = ROBOSOC_SPIDER_GAIT_COMPENSATION[legName];
    const footTravel = (swing ? 1 : -1) * travel;
    const localX = BODY_X + Math.cos(compensation) * footTravel;
    const localY = Math.sin(compensation) * footTravel;
    const foot: Vec3Tuple = [localX, localY, height];

    legs[legName] = {
      angles: solveSpiderLegIk(foot),
      foot,
      phase,
      planted: !swing,
      tripod,
    };
  }

  return {
    bodyYaw,
    bodyX: 0,
    bodyZ: 0,
    cycleProgress,
    legs,
    patrolProgress,
    turnBlend,
  };
}

export function createStableRobosocSpiderPose(): RobosocSpiderGaitSample {
  const legs = {} as Record<RobosocLegName, RobosocSpiderLegSample>;

  for (const legName of ROBOSOC_LEG_NAMES) {
    const tripod = tripodForLeg(legName);
    const foot: Vec3Tuple = [BODY_X, 0, BODY_HEIGHT];
    legs[legName] = {
      angles: ROBOSOC_SPIDER_STAND_ANGLES,
      foot,
      phase: tripod === "A" ? 0 : 0.5,
      planted: true,
      tripod,
    };
  }

  return {
    bodyYaw: 0,
    bodyX: 0,
    bodyZ: 0,
    cycleProgress: 0,
    legs,
    patrolProgress: 0,
    turnBlend: 0,
  };
}

export function tripodPhaseDistance(sample: RobosocSpiderGaitSample) {
  const legiPhase = sample.legs.legi.phase;
  const legjPhase = sample.legs.legj.phase;
  const distance = Math.abs(legiPhase - legjPhase);
  return Math.min(distance, 1 - distance);
}

export const ROBOSOC_SPIDER_WALK_STEP_COUNT = WALK_STEP_COUNT;
