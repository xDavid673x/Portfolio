import { describe, expect, it } from "vitest";
import * as THREE from "three";

import {
  ROBOT_PICKUP_PROGRESS,
  ROBOT_PLACE_PROGRESS,
  sampleRobotCycle,
  solveCcdIk,
  type RobotCycleSample,
} from "./robotic-arm-kinematics";

const targets = {
  home: new THREE.Vector3(0, 2, 0),
  pickup: new THREE.Vector3(-2, 0, 1),
  place: new THREE.Vector3(2, 0, 1),
};

function createSample(): RobotCycleSample {
  return {
    carrying: false,
    grip: 0,
    postureEnd: "home",
    postureNext: "home",
    posturePrevious: "home",
    postureProgress: 0,
    postureStart: "home",
    target: new THREE.Vector3(),
  };
}

describe("robotic arm cycle", () => {
  it("closes on the pickup before carrying and releases at the place target", () => {
    const pickup = sampleRobotCycle(
      ROBOT_PICKUP_PROGRESS,
      targets,
      createSample(),
    );
    const place = sampleRobotCycle(
      ROBOT_PLACE_PROGRESS,
      targets,
      createSample(),
    );

    expect(pickup.target.distanceTo(targets.pickup)).toBeLessThan(1e-8);
    expect(pickup.grip).toBe(1);
    expect(pickup.carrying).toBe(true);
    expect(pickup.postureStart).toBe("pickup");
    expect(place.target.distanceTo(targets.place)).toBeLessThan(1e-8);
    expect(place.grip).toBe(0);
    expect(place.carrying).toBe(false);
  });

  it("keeps the carried workpiece elevated between stations", () => {
    const transit = sampleRobotCycle(0.525, targets, createSample());

    expect(transit.carrying).toBe(true);
    expect(transit.grip).toBe(1);
    expect(transit.target.x).toBeCloseTo(0);
    expect(transit.target.y).toBeGreaterThan(2);
  });

  it("stages behind the pickup before moving forward over the box", () => {
    const rear = sampleRobotCycle(
      0.1,
      targets,
      createSample(),
    );
    const overBox = sampleRobotCycle(0.14, targets, createSample());

    expect(rear.postureStart).toBe("pickup-rear");
    expect(rear.target.y).toBeGreaterThan(targets.pickup.y);
    expect(rear.target.z).toBeLessThan(targets.pickup.z - 0.7);
    expect(overBox.target.z).toBeGreaterThan(rear.target.z + 0.35);
    expect(overBox.target.y).toBeGreaterThan(targets.pickup.y + 0.45);
  });

  it("passes through the transit waypoint without an unintended stop", () => {
    const before = sampleRobotCycle(0.523, targets, createSample()).target.clone();
    const center = sampleRobotCycle(0.525, targets, createSample()).target.clone();
    const after = sampleRobotCycle(0.527, targets, createSample()).target.clone();
    const incomingDistance = before.distanceTo(center);
    const outgoingDistance = center.distanceTo(after);

    expect(incomingDistance).toBeGreaterThan(0.005);
    expect(outgoingDistance).toBeGreaterThan(0.005);
    expect(incomingDistance / outgoingDistance).toBeGreaterThan(0.8);
    expect(incomingDistance / outgoingDistance).toBeLessThan(1.25);
  });
});

describe("CCD inverse kinematics", () => {
  it("places a two-link tool center on a reachable target", () => {
    const root = new THREE.Group();
    const shoulder = new THREE.Group();
    const elbow = new THREE.Group();
    const toolCenter = new THREE.Group();
    elbow.position.x = 1;
    toolCenter.position.x = 1;
    root.add(shoulder);
    shoulder.add(elbow);
    elbow.add(toolCenter);

    const target = new THREE.Vector3(1.2, 1.35, 0);
    const error = solveCcdIk({
      iterations: 32,
      joints: [shoulder, elbow],
      root,
      targetWorld: target,
      toolCenter,
    });

    expect(error).toBeLessThan(0.001);
    expect(toolCenter.getWorldPosition(new THREE.Vector3()).distanceTo(target)).toBeLessThan(0.001);
  });
});
