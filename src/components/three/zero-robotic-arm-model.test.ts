import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const MODEL_DIRECTORY = path.join(
  process.cwd(),
  "public/models/zero-robotic-arm",
);
const MODEL_PATH = path.join(MODEL_DIRECTORY, "zero-robotic-arm.glb");

type GlbManifest = {
  accessors?: Array<{ count: number }>;
  meshes?: Array<{ primitives: Array<{ indices?: number }> }>;
  nodes?: Array<{ name?: string }>;
};

function readManifest(buffer: Buffer) {
  expect(buffer.readUInt32LE(0)).toBe(0x46546c67);
  expect(buffer.readUInt32LE(4)).toBe(2);
  expect(buffer.readUInt32LE(16)).toBe(0x4e4f534a);

  const jsonLength = buffer.readUInt32LE(12);
  return JSON.parse(
    buffer.subarray(20, 20 + jsonLength).toString("utf8").trimEnd(),
  ) as GlbManifest;
}

describe("ZERO robotic arm asset", () => {
  it("ships an optimized, articulated seven-link GLB", () => {
    const model = readFileSync(MODEL_PATH);
    const manifest = readManifest(model);
    const nodeNames = new Set(manifest.nodes?.map((node) => node.name));
    const triangleCount =
      manifest.meshes?.reduce(
        (total, mesh) =>
          total +
          mesh.primitives.reduce((meshTotal, primitive) => {
            if (primitive.indices === undefined) return meshTotal;
            return (
              meshTotal +
              (manifest.accessors?.[primitive.indices]?.count ?? 0) / 3
            );
          }, 0),
        0,
      ) ?? 0;

    expect(model.byteLength).toBeLessThan(1_500_000);
    expect(manifest.meshes).toHaveLength(7);
    expect(triangleCount).toBe(93_645);
    for (let joint = 1; joint <= 6; joint += 1) {
      expect(nodeNames.has(`joint${joint}_axis`)).toBe(true);
    }
  });

  it("retains source and license provenance beside the derived model", () => {
    const source = readFileSync(path.join(MODEL_DIRECTORY, "SOURCE.md"), "utf8");
    const license = readFileSync(path.join(MODEL_DIRECTORY, "LICENSE"), "utf8");

    expect(source).toContain("https://gitee.com/dearxie/zero-robotic-arm");
    expect(source).toContain("99acada813b943d120e756c9bdfea0e95a5b5327");
    expect(license).toContain("GNU GENERAL PUBLIC LICENSE");
  });
});
