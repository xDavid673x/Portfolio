import { describe, expect, it } from "vitest";

import {
  ROBOSOC_LEG_NAMES,
  ROBOSOC_SPIDER_GAIT_COMPENSATION,
  ROBOSOC_SPIDER_JOINT_LIMITS,
  ROBOSOC_SPIDER_LEG_LENGTHS,
  ROBOSOC_TRIPOD_A,
  ROBOSOC_TRIPOD_B,
  clampSpiderLegAngles,
  createStableRobosocSpiderPose,
  getRobosocSpiderJointRotation,
  sampleRobosocSpiderGait,
  sampleSpiderLegIk,
  tripodPhaseDistance,
} from "./robosoc-spider-gait";

describe("RoboSoc spider gait", () => {
  const showcaseYaw = 35 * Math.PI / 180;

  it("uses the Fusion-derived link lengths", () => {
    expect(ROBOSOC_SPIDER_LEG_LENGTHS.coxa).toBeCloseTo(0.042069923, 8);
    expect(ROBOSOC_SPIDER_LEG_LENGTHS.femur).toBeCloseTo(0.088059172, 8);
    expect(ROBOSOC_SPIDER_LEG_LENGTHS.tibia).toBeCloseTo(0.164862261, 8);
  });

  it("uses the six Fusion-derived leg headings", () => {
    expect(ROBOSOC_SPIDER_GAIT_COMPENSATION).toEqual({
      legi: 0,
      legj: Math.PI / 3,
      legk: 2 * Math.PI / 3,
      legl: -Math.PI,
      legm: -2 * Math.PI / 3,
      legn: -Math.PI / 3,
    });
  });

  it("applies commands relative to the Fusion reset rotations", () => {
    expect(getRobosocSpiderJointRotation(0, "coxa", 0)).toBeCloseTo(0);
    expect(
      getRobosocSpiderJointRotation(-28 * Math.PI / 180, "femur", 28 * Math.PI / 180),
    ).toBeCloseTo(0);
    expect(
      getRobosocSpiderJointRotation(115 * Math.PI / 180, "tibia", 115 * Math.PI / 180),
    ).toBeCloseTo(0);
  });

  it("keeps the real tripod groups half a cycle apart", () => {
    for (const time of [0, 0.19, 1.4, 7.2, 13.99]) {
      const sample = sampleRobosocSpiderGait(time);

      for (const leg of ROBOSOC_TRIPOD_A) {
        expect(sample.legs[leg].tripod).toBe("A");
        expect(sample.legs[leg].phase).toBeCloseTo(sample.legs.legi.phase);
      }
      for (const leg of ROBOSOC_TRIPOD_B) {
        expect(sample.legs[leg].tripod).toBe("B");
        expect(sample.legs[leg].phase).toBeCloseTo(sample.legs.legj.phase);
      }
      expect(tripodPhaseDistance(sample)).toBeCloseTo(0.5);
      expect(sample.legs.legi.planted).not.toBe(sample.legs.legj.planted);
    }
  });

  it("returns finite IK angles for all sampled gait targets", () => {
    for (const time of [0, 0.35, 1.2, 4.7, 8.1, 13.4]) {
      const sample = sampleRobosocSpiderGait(time);

      for (const leg of ROBOSOC_LEG_NAMES) {
        const { angles, foot } = sample.legs[leg];
        expect(foot.every(Number.isFinite)).toBe(true);
        expect(Number.isFinite(angles.coxa)).toBe(true);
        expect(Number.isFinite(angles.femur)).toBe(true);
        expect(Number.isFinite(angles.tibia)).toBe(true);
        expect(angles.coxa).toBeGreaterThanOrEqual(ROBOSOC_SPIDER_JOINT_LIMITS.coxa[0]);
        expect(angles.coxa).toBeLessThanOrEqual(ROBOSOC_SPIDER_JOINT_LIMITS.coxa[1]);
        expect(angles.femur).toBeGreaterThanOrEqual(ROBOSOC_SPIDER_JOINT_LIMITS.femur[0]);
        expect(angles.femur).toBeLessThanOrEqual(ROBOSOC_SPIDER_JOINT_LIMITS.femur[1]);
        expect(angles.tibia).toBeGreaterThanOrEqual(ROBOSOC_SPIDER_JOINT_LIMITS.tibia[0]);
        expect(angles.tibia).toBeLessThanOrEqual(ROBOSOC_SPIDER_JOINT_LIMITS.tibia[1]);
      }

      expect(sample.bodyX).toBe(0);
      expect(sample.bodyZ).toBe(0);
      for (const leg of ROBOSOC_LEG_NAMES) {
        expect(sample.legs[leg].angles.coxa).toBeCloseTo(0, 8);
      }
    }
  });

  it("clamps command angles to mechanical limits", () => {
    const clamped = clampSpiderLegAngles({
      coxa: Math.PI,
      femur: -Math.PI,
      tibia: Math.PI,
    });

    expect(clamped.coxa).toBe(ROBOSOC_SPIDER_JOINT_LIMITS.coxa[1]);
    expect(clamped.femur).toBe(ROBOSOC_SPIDER_JOINT_LIMITS.femur[0]);
    expect(clamped.tibia).toBe(ROBOSOC_SPIDER_JOINT_LIMITS.tibia[1]);
  });

  it("keeps unreachable IK targets finite and inside limits", () => {
    const angles = sampleSpiderLegIk([80, -80, -80]);

    expect(Number.isFinite(angles.coxa)).toBe(true);
    expect(Number.isFinite(angles.femur)).toBe(true);
    expect(Number.isFinite(angles.tibia)).toBe(true);
    expect(angles.coxa).toBeGreaterThanOrEqual(ROBOSOC_SPIDER_JOINT_LIMITS.coxa[0]);
    expect(angles.coxa).toBeLessThanOrEqual(ROBOSOC_SPIDER_JOINT_LIMITS.coxa[1]);
    expect(angles.femur).toBeGreaterThanOrEqual(ROBOSOC_SPIDER_JOINT_LIMITS.femur[0]);
    expect(angles.femur).toBeLessThanOrEqual(ROBOSOC_SPIDER_JOINT_LIMITS.femur[1]);
    expect(angles.tibia).toBeGreaterThanOrEqual(ROBOSOC_SPIDER_JOINT_LIMITS.tibia[0]);
    expect(angles.tibia).toBeLessThanOrEqual(ROBOSOC_SPIDER_JOINT_LIMITS.tibia[1]);
  });

  it("loops the centered gait without a position or yaw pop", () => {
    const before = sampleRobosocSpiderGait(13.999);
    const after = sampleRobosocSpiderGait(14.001);

    expect(before.bodyX).toBe(0);
    expect(before.bodyZ).toBe(0);
    expect(after.bodyX).toBe(0);
    expect(after.bodyZ).toBe(0);
    expect(Math.abs(before.bodyYaw - after.bodyYaw)).toBeLessThan(0.002);

    for (const leg of ROBOSOC_LEG_NAMES) {
      for (let axis = 0; axis < 3; axis += 1) {
        expect(
          Math.abs(before.legs[leg].foot[axis] - after.legs[leg].foot[axis]),
        ).toBeLessThan(0.02);
      }
      expect(
        Math.abs(before.legs[leg].angles.coxa - after.legs[leg].angles.coxa),
      ).toBeLessThan(0.02);
      expect(
        Math.abs(before.legs[leg].angles.femur - after.legs[leg].angles.femur),
      ).toBeLessThan(0.02);
      expect(
        Math.abs(before.legs[leg].angles.tibia - after.legs[leg].angles.tibia),
      ).toBeLessThan(0.02);
    }
  });

  it("returns every leg to the same gait state at the patrol boundary", () => {
    const start = sampleRobosocSpiderGait(0);
    const loop = sampleRobosocSpiderGait(14);

    for (const leg of ROBOSOC_LEG_NAMES) {
      expect(loop.legs[leg].phase).toBeCloseTo(start.legs[leg].phase, 10);
      expect(loop.legs[leg].foot).toEqual(start.legs[leg].foot);
      expect(loop.legs[leg].angles.coxa).toBeCloseTo(
        start.legs[leg].angles.coxa,
        10,
      );
      expect(loop.legs[leg].angles.femur).toBeCloseTo(
        start.legs[leg].angles.femur,
        10,
      );
      expect(loop.legs[leg].angles.tibia).toBeCloseTo(
        start.legs[leg].angles.tibia,
        10,
      );
    }
  });

  it("sweeps the body yaw smoothly across the showcase cycle", () => {
    const quarter = sampleRobosocSpiderGait(3.5);
    const half = sampleRobosocSpiderGait(7);
    const threeQuarter = sampleRobosocSpiderGait(10.5);

    expect(quarter.bodyYaw).toBeCloseTo(showcaseYaw, 6);
    expect(half.bodyYaw).toBeCloseTo(0, 6);
    expect(threeQuarter.bodyYaw).toBeCloseTo(-showcaseYaw, 6);
    expect(quarter.bodyX).toBe(0);
    expect(quarter.bodyZ).toBe(0);
    expect(quarter.turnBlend).toBeCloseTo(1, 6);
    expect(threeQuarter.turnBlend).toBeCloseTo(0, 6);
  });

  it("uses a stable planted reduced-motion pose", () => {
    const pose = createStableRobosocSpiderPose();

    for (const leg of ROBOSOC_LEG_NAMES) {
      expect(pose.legs[leg].planted).toBe(true);
      expect(pose.legs[leg].angles.tibia).toBeGreaterThan(0);
    }
  });
});
