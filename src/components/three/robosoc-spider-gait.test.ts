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
  forwardSpiderLegKinematics,
  getRobosocSpiderJointRotation,
  getSpiderLegMount,
  sampleRobosocSpiderGait,
  sampleSpiderLegIk,
  tripodPhaseDistance,
} from "./robosoc-spider-gait";

describe("RoboSoc spider gait", () => {
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

  it("reconstructs the Fusion CAD pose at the documented reset commands", () => {
    expect(getRobosocSpiderJointRotation(0, "coxa", 0)).toBeCloseTo(0);
    expect(
      getRobosocSpiderJointRotation(-28 * Math.PI / 180, "femur", 28 * Math.PI / 180),
    ).toBeCloseTo(0);
    expect(
      getRobosocSpiderJointRotation(115 * Math.PI / 180, "tibia", 115 * Math.PI / 180),
    ).toBeCloseTo(0);
  });

  it("maps positive Fusion headings onto the negative body Z side", () => {
    expect(getSpiderLegMount("legi")[2]).toBeCloseTo(0);
    expect(getSpiderLegMount("legj")[2]).toBeLessThan(0);
    expect(getSpiderLegMount("legk")[2]).toBeLessThan(0);
    expect(getSpiderLegMount("legm")[2]).toBeGreaterThan(0);
    expect(getSpiderLegMount("legn")[2]).toBeGreaterThan(0);
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
        expect(foot[2]).toBeLessThan(-0.1);
      }

      expect(sample.bodyX).toBe(0);
      expect(sample.bodyZ).toBe(0);
    }
  });

  it("tracks every sampled Bezier foot target through IK and FK", () => {
    for (const time of [0, 0.11, 0.23, 0.39, 1.2, 4.7, 8.1, 13.4]) {
      const sample = sampleRobosocSpiderGait(time);

      for (const leg of ROBOSOC_LEG_NAMES) {
        const chain = forwardSpiderLegKinematics(sample.legs[leg].angles);
        const endpoint = chain.at(-1)!;
        const target = sample.legs[leg].foot;
        const residual = Math.hypot(
          endpoint[0] - target[0],
          endpoint[1] - target[1],
          endpoint[2] - target[2],
        );

        expect(residual).toBeLessThan(1e-8);
      }
    }
  });

  it("sweeps tangentially while keeping radial reach fixed", () => {
    const swingStart = sampleRobosocSpiderGait(0).legs.legi.foot;
    const swingEnd = sampleRobosocSpiderGait(14 / 36).legs.legi.foot;

    expect(swingStart[0]).toBeCloseTo(swingEnd[0], 10);
    expect(swingStart[0]).toBeCloseTo(0.13, 10);
    expect(swingStart[1]).toBeCloseTo(-0.06, 10);
    expect(swingEnd[1]).toBeCloseTo(0.06, 10);
    expect(swingStart[2]).toBeCloseTo(swingEnd[2], 10);
    expect(swingStart[2]).toBeCloseTo(-0.125, 10);
  });

  it("lifts only the active tripod above the planted support tripod", () => {
    const midSwing = sampleRobosocSpiderGait(14 / 72);

    for (const leg of ROBOSOC_TRIPOD_A) {
      expect(midSwing.legs[leg].planted).toBe(false);
      expect(midSwing.legs[leg].foot[2]).toBeCloseTo(-0.105, 8);
    }
    for (const leg of ROBOSOC_TRIPOD_B) {
      expect(midSwing.legs[leg].planted).toBe(true);
      expect(midSwing.legs[leg].foot[2]).toBeCloseTo(-0.125, 8);
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

  it("keeps a fixed forward heading throughout the gait", () => {
    for (const time of [0, 1.75, 3.5, 7, 10.5, 13.99, 14]) {
      const sample = sampleRobosocSpiderGait(time);

      expect(sample.bodyYaw).toBe(0);
      expect(sample.bodyX).toBe(0);
      expect(sample.bodyZ).toBe(0);
      expect(sample.turnBlend).toBe(0);
    }
  });

  it("keeps the tripod stance elevated and articulated in 3D", () => {
    const planted = sampleRobosocSpiderGait(14 / 36);
    const swing = sampleRobosocSpiderGait(14 / 72);
    const plantedLegiChain = forwardSpiderLegKinematics(planted.legs.legi.angles);
    const swingLegiChain = forwardSpiderLegKinematics(swing.legs.legi.angles);

    for (const leg of ROBOSOC_LEG_NAMES) {
      const chain = forwardSpiderLegKinematics(planted.legs[leg].angles);
      expect(planted.legs[leg].foot[2]).toBeCloseTo(-0.125, 8);
      expect(chain[3][2]).toBeCloseTo(planted.legs[leg].foot[2], 8);
      expect(chain[2][2]).toBeGreaterThan(chain[3][2]);
      expect(Math.abs(chain[3][2] - chain[2][2])).toBeGreaterThan(0.04);
    }

    expect(swingLegiChain[3][2]).toBeGreaterThan(plantedLegiChain[3][2]);
    expect(swingLegiChain[3][2] - plantedLegiChain[3][2]).toBeCloseTo(0.02, 8);
    expect(planted.legs.legj.foot[2]).toBeCloseTo(-0.125, 8);
  });

  it("uses a stable planted reduced-motion pose", () => {
    const pose = createStableRobosocSpiderPose();

    for (const leg of ROBOSOC_LEG_NAMES) {
      expect(pose.legs[leg].planted).toBe(true);
      expect(pose.legs[leg].angles.tibia).toBeGreaterThan(0);
    }
  });
});
