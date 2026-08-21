import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import * as THREE from "three";
import { describe, expect, it } from "vitest";

import {
  ROBOSOC_LEG_NAMES,
  ROBOSOC_SPIDER_GAIT_COMPENSATION,
} from "./robosoc-spider-gait";

type GlbNode = {
  children?: number[];
  extras?: { gaitCompensationRad?: number };
  mesh?: number;
  name?: string;
};

type GlbDocument = {
  accessors?: Array<{ count: number }>;
  meshes?: Array<{
    primitives: Array<{ attributes: { POSITION: number } }>;
  }>;
  nodes?: GlbNode[];
};

type SpiderProvenance = {
  output: { sha256: string; sizeBytes: number };
  sourceAssets: Array<{ outputVertexCount: number; path: string }>;
  verification: {
    joints: string[];
    legs: string[];
    maxSizeBytes: number;
  };
};

const repositoryRoot = process.cwd();
const modelPath = path.join(repositoryRoot, "public/models/robosoc-spider.glb");
const provenancePath = path.join(
  repositoryRoot,
  "public/models/robosoc-spider.provenance.json",
);

function parseGlbJson(buffer: Buffer): GlbDocument {
  expect(buffer.toString("ascii", 0, 4)).toBe("glTF");
  expect(buffer.readUInt32LE(4)).toBe(2);
  expect(buffer.readUInt32LE(8)).toBe(buffer.byteLength);
  expect(buffer.toString("ascii", 16, 20)).toBe("JSON");

  const jsonLength = buffer.readUInt32LE(12);
  return JSON.parse(buffer.toString("utf8", 20, 20 + jsonLength).trim());
}

describe("committed RoboSoc spider asset", () => {
  it("matches its recorded hash and size budget", async () => {
    const [model, provenanceBytes] = await Promise.all([
      readFile(modelPath),
      readFile(provenancePath),
    ]);
    const provenance = JSON.parse(
      provenanceBytes.toString("utf8"),
    ) as SpiderProvenance;

    expect(createHash("sha256").update(model).digest("hex")).toBe(
      provenance.output.sha256,
    );
    expect(model.byteLength).toBe(provenance.output.sizeBytes);
    expect(model.byteLength).toBeLessThanOrEqual(
      provenance.verification.maxSizeBytes,
    );
    parseGlbJson(model);
  });

  it("contains every leg, joint chain, and nonempty source mesh", async () => {
    const [model, provenanceBytes] = await Promise.all([
      readFile(modelPath),
      readFile(provenancePath),
    ]);
    const document = parseGlbJson(model);
    const provenance = JSON.parse(
      provenanceBytes.toString("utf8"),
    ) as SpiderProvenance;
    const nodes = document.nodes ?? [];
    const nodeIndexByName = new Map(
      nodes.flatMap((node, index) => node.name ? [[node.name, index]] : []),
    );

    expect(provenance.verification.legs).toHaveLength(6);
    expect(provenance.verification.joints).toHaveLength(18);
    for (const leg of provenance.verification.legs) {
      const chain = [
        leg,
        `${leg}_coxa_joint`,
        `${leg}_femur_joint`,
        `${leg}_tibia_joint`,
      ];
      chain.forEach((name) => expect(nodeIndexByName.has(name)).toBe(true));

      for (let index = 0; index < chain.length - 1; index += 1) {
        const parent = nodes[nodeIndexByName.get(chain[index])!];
        const childIndex = nodeIndexByName.get(chain[index + 1])!;
        expect(parent.children).toContain(childIndex);
      }

      const legName = leg as (typeof ROBOSOC_LEG_NAMES)[number];
      expect(ROBOSOC_SPIDER_GAIT_COMPENSATION[legName]).toBeCloseTo(
        nodes[nodeIndexByName.get(leg)!].extras?.gaitCompensationRad ?? NaN,
        8,
      );
    }

    expect(document.meshes).toHaveLength(8);
    const positionCounts = (document.meshes ?? []).flatMap((mesh) =>
      mesh.primitives.map(
        (primitive) =>
          document.accessors?.[primitive.attributes.POSITION]?.count ?? 0,
      ),
    );
    expect(positionCounts).toHaveLength(8);
    expect(positionCounts.every((count) => count > 0)).toBe(true);
    expect(provenance.sourceAssets).toHaveLength(8);
    expect(
      provenance.sourceAssets.every(
        (asset) => asset.outputVertexCount > 0 && !path.isAbsolute(asset.path),
      ),
    ).toBe(true);
  });

  it("reconstructs the upright Fusion reset pose for all six legs", async () => {
    const model = await readFile(modelPath);
    const arrayBuffer = Uint8Array.from(model).buffer;
    const { scene } = await new GLTFLoader().parseAsync(arrayBuffer, "");
    const resetCommands = {
      coxa: 0,
      femur: 28 * Math.PI / 180,
      tibia: 115 * Math.PI / 180,
    } as const;
    const axes = { coxa: "y", femur: "z", tibia: "z" } as const;

    for (const leg of ROBOSOC_LEG_NAMES) {
      for (const role of ["coxa", "femur", "tibia"] as const) {
        const joint = scene.getObjectByName(`${leg}_${role}_joint`);
        expect(joint, `${leg} ${role} joint`).toBeDefined();
        joint!.rotation[axes[role]] +=
          resetCommands[role] * Number(joint!.userData.commandSign);
      }
    }
    scene.updateMatrixWorld(true);

    let bodyVisual: THREE.Object3D | undefined;
    scene.traverse((object) => {
      if (object.userData.component === "Hex base-smaller") {
        bodyVisual = object;
      }
    });
    expect(bodyVisual).toBeDefined();
    const bodyBounds = new THREE.Box3().setFromObject(bodyVisual!);

    for (const leg of ROBOSOC_LEG_NAMES) {
      const tibiaVisuals = scene.getObjectByName(`${leg}_tibia_visuals`);
      expect(tibiaVisuals, `${leg} tibia visuals`).toBeDefined();
      const tibiaBounds = new THREE.Box3().setFromObject(tibiaVisuals!);

      expect(tibiaBounds.min.y).toBeCloseTo(-0.11159125, 6);
      expect(tibiaBounds.min.y).toBeLessThan(bodyBounds.min.y - 0.08);
      expect(tibiaBounds.max.y).toBeGreaterThan(bodyBounds.max.y + 0.04);
    }
  });

  it("keeps provenance free of machine-local paths and credential fields", async () => {
    const provenance = await readFile(provenancePath, "utf8");

    expect(provenance).not.toMatch(/\/Users\//);
    expect(provenance).not.toMatch(/Desktop\/Manchester/);
    expect(provenance).not.toMatch(/(?:token|password|secret|api.?key)/i);
  });
});
