import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { SimplifyModifier } from "three/examples/jsm/modifiers/SimplifyModifier.js";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");
const outputDirectory = path.join(repositoryRoot, "public/models");
const outputPath = path.join(outputDirectory, "robosoc-spider.glb");
const provenancePath = path.join(
  outputDirectory,
  "robosoc-spider.provenance.json",
);
const manifestRelativePath = "webots/cad/spider_geometry.v1.json";
const maxGlbBytes = 4 * 1024 * 1024;
const millimetersToMeters = 0.001;

const materialByComponent = new Map(
  [
    ["Hex base-smaller", { color: 0x171a1f, roughness: 0.58, metalness: 0.12 }],
    ["Final leg base", { color: 0x1f2933, roughness: 0.56, metalness: 0.18 }],
    ["Final mid leg", { color: 0x222c36, roughness: 0.58, metalness: 0.16 }],
    ["Final_leg_tip", { color: 0x111827, roughness: 0.65, metalness: 0.08 }],
    ["RSD3230 govde", { color: 0x8d98a7, roughness: 0.38, metalness: 0.36 }],
    ["Servo_support_bracket", { color: 0x2f3945, roughness: 0.5, metalness: 0.24 }],
    ["ara", { color: 0xb7c0ca, roughness: 0.34, metalness: 0.42 }],
  ].map(([name, options]) => [
    name,
    new THREE.MeshStandardMaterial({ name: `${name}Material`, ...options }),
  ]),
);

if (globalThis.FileReader === undefined) {
  globalThis.FileReader = class FileReader {
    result = null;
    onloadend = null;

    async readAsArrayBuffer(blob) {
      this.result = await blob.arrayBuffer();
      this.onloadend?.();
    }

    async readAsDataURL(blob) {
      const buffer = Buffer.from(await blob.arrayBuffer());
      this.result = `data:${blob.type || "application/octet-stream"};base64,${buffer.toString("base64")}`;
      this.onloadend?.();
    }
  };
}

const simplificationTargets = new Map([
  ["300a224a7f01", 7200],
  ["66cb44f892cf", 6400],
  ["5752bcd29cff", 4200],
  ["aa7b2e9fc1ae", 5200],
  ["d3834e3a484c", 3600],
  ["e5a97ae67089", 1300],
]);

function usage() {
  return [
    "Usage: node scripts/build-robosoc-spider.mjs <source-root>",
    "",
    `Expected manifest: <source-root>/${manifestRelativePath}`,
  ].join("\n");
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function assertRelativePath(relativePath, label) {
  if (
    path.isAbsolute(relativePath) ||
    relativePath.split(/[\\/]/).includes("..")
  ) {
    throw new Error(`${label} must be a relative path inside the source root.`);
  }
}

function matrixFromManifest(values) {
  if (!Array.isArray(values) || values.length !== 16) {
    throw new Error("Expected a 4x4 manifest transform.");
  }

  const matrix = new THREE.Matrix4();
  matrix.set(...values);
  matrix.elements[12] *= millimetersToMeters;
  matrix.elements[13] *= millimetersToMeters;
  matrix.elements[14] *= millimetersToMeters;
  return matrix;
}

function setObjectMatrix(object, values) {
  object.matrix.copy(matrixFromManifest(values));
  object.matrix.decompose(object.position, object.quaternion, object.scale);
  object.matrixAutoUpdate = false;
}

function sanitizeName(value) {
  return value.replace(/[^a-zA-Z0-9_+.-]+/g, "_");
}

function orderedObject(value) {
  if (Array.isArray(value)) {
    return value.map(orderedObject);
  }

  if (value && typeof value === "object" && value.constructor === Object) {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, orderedObject(value[key])]),
    );
  }

  return value;
}

function vertexCount(geometry) {
  return geometry.getAttribute("position").count;
}

function normalizeGeometryNormals(geometry) {
  const normal = geometry.getAttribute("normal");
  const vector = new THREE.Vector3();

  for (let index = 0; index < normal.count; index += 1) {
    vector.fromBufferAttribute(normal, index);
    if (vector.lengthSq() === 0) {
      vector.set(1, 0, 0);
    } else {
      vector.normalize();
    }
    normal.setXYZ(index, vector.x, vector.y, vector.z);
  }
  normal.needsUpdate = true;
}

function compactGeometry(geometry, assetId) {
  let working = geometry.clone();
  working.scale(millimetersToMeters, millimetersToMeters, millimetersToMeters);
  working.deleteAttribute("normal");
  working = mergeVertices(working, 1e-6);
  working.computeVertexNormals();

  const targetVertices = simplificationTargets.get(assetId);
  if (targetVertices && vertexCount(working) > targetVertices) {
    const removeCount = vertexCount(working) - targetVertices;
    working = new SimplifyModifier().modify(working, removeCount);
    if (!working.getAttribute("position") || vertexCount(working) === 0) {
      throw new Error(`Simplification removed all vertices for asset ${assetId}.`);
    }
    working = mergeVertices(working, 1e-6);
    if (!working.getAttribute("position") || vertexCount(working) === 0) {
      throw new Error(`Compaction removed all vertices for asset ${assetId}.`);
    }
    working.computeVertexNormals();
  }

  normalizeGeometryNormals(working);
  working.name = `RoboSocSpiderGeometry_${assetId}`;
  return working;
}

async function exportGlb(scene) {
  const exporter = new GLTFExporter();
  const result = await exporter.parseAsync(scene, {
    binary: true,
    includeCustomExtensions: false,
    onlyVisible: true,
    trs: true,
  });

  if (!(result instanceof ArrayBuffer)) {
    throw new Error("Expected GLTFExporter to produce a binary GLB ArrayBuffer.");
  }

  return Buffer.from(result);
}

function makeVisualMesh(visual, geometries) {
  const geometry = geometries.get(visual.asset);
  if (!geometry) {
    throw new Error(`Missing geometry for asset ${visual.asset}.`);
  }

  const material = materialByComponent.get(visual.component);
  if (!material) {
    throw new Error(`Missing material for component ${visual.component}.`);
  }

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = sanitizeName(
    `${visual.component}_${visual.body}_${visual.occurrence}`,
  );
  setObjectMatrix(mesh, visual.group_local_transform_mm);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData = {
    asset: visual.asset,
    assetPath: visual.asset_path,
    body: visual.body,
    component: visual.component,
    occurrence: visual.occurrence,
    sourceTransform: "group_local_transform_mm",
    transforms: {
      assemblyTransformBodyMm: visual.assembly_transform_body_mm,
      bodyCenteredTransformMm: visual.body_centered_transform_mm,
      groupLocalTransformMm: visual.group_local_transform_mm,
    },
  };
  return mesh;
}

function makeJointNode(leg, joint) {
  const node = new THREE.Group();
  node.name = `${leg.name}_${joint.role}_joint`;
  setObjectMatrix(node, joint.zero_transform_parent_mm);
  node.userData = {
    anchorBodyMm: joint.anchor_body_mm,
    anchorLegMm: joint.anchor_leg_mm,
    anchorParentMm: joint.anchor_parent_mm,
    anchorRootMm: joint.anchor_root_mm,
    axisLeg: joint.axis_leg,
    cadTransformParentMm: joint.cad_transform_parent_mm,
    childGroup: joint.child_group,
    commandSign: joint.command_sign,
    fusionAxisRoot: joint.fusion_axis_root,
    fusionName: joint.fusion_name,
    fusionResetAngleDeg: joint.fusion_reset_angle_deg,
    limitsDeg: joint.limits_deg,
    parentGroup: joint.parent_group,
    resetAngleDeg: joint.reset_angle_deg,
    role: joint.role,
    webotsAxis: joint.webots_axis,
    webotsResetAngleDeg: joint.webots_reset_angle_deg,
    zeroTransformBodyMm: joint.zero_transform_body_mm,
    zeroTransformParentMm: joint.zero_transform_parent_mm,
  };
  return node;
}

function addLeg(sceneBody, leg, geometries) {
  const legNode = new THREE.Group();
  legNode.name = leg.name;
  setObjectMatrix(legNode, leg.leg_to_body_transform_mm);
  legNode.userData = {
    commandSigns: leg.command_signs,
    footContactBodyMm: leg.foot_contact_body_mm,
    frame: leg.frame,
    gaitCompensationRad: leg.gait_compensation_rad,
    gaitHeadingRad: leg.gait_heading_rad,
    lengthsMm: leg.lengths_mm,
    occurrence: leg.occurrence,
    originBodyMm: leg.origin_body_mm,
    planarFitResidualDeg: leg.planar_fit_residual_deg,
    planarFitResidualMm: leg.planar_fit_residual_mm,
    transformMm: leg.leg_to_body_transform_mm,
  };

  const jointNodes = new Map();
  for (const joint of leg.joints) {
    jointNodes.set(joint.role, makeJointNode(leg, joint));
  }

  legNode.add(jointNodes.get("coxa"));
  jointNodes.get("coxa").add(jointNodes.get("femur"));
  jointNodes.get("femur").add(jointNodes.get("tibia"));

  for (const [groupName, group] of Object.entries(leg.groups)) {
    const parentNode = groupName === "mount" ? legNode : jointNodes.get(groupName);
    if (!parentNode) {
      throw new Error(`Missing ${leg.name} ${groupName} parent node.`);
    }

    const visualGroup = new THREE.Group();
    visualGroup.name = `${leg.name}_${groupName}_visuals`;
    visualGroup.userData = {
      boundsBodyMm: group.bounds_body_mm,
      frameBodyMm: group.frame_body_mm,
      originBodyMm: group.origin_body_mm,
    };

    for (const visual of group.visuals) {
      visualGroup.add(makeVisualMesh(visual, geometries));
    }
    parentNode.add(visualGroup);
  }

  sceneBody.add(legNode);
}

async function loadSource(sourceRoot) {
  const manifestPath = path.join(sourceRoot, manifestRelativePath);
  const manifestBytes = await readFile(manifestPath);
  const manifest = JSON.parse(manifestBytes.toString("utf8"));

  if (manifest.schema_version !== 1) {
    throw new Error(`Unsupported spider geometry schema ${manifest.schema_version}.`);
  }

  const stlLoader = new STLLoader();
  const geometries = new Map();
  const sourceAssets = [];

  for (const asset of manifest.assets) {
    assertRelativePath(asset.path, `Asset ${asset.id}`);
    const assetPath = path.join(sourceRoot, asset.path);
    const bytes = await readFile(assetPath);
    const actualHash = sha256(bytes);
    if (actualHash !== asset.sha256) {
      throw new Error(
        `${asset.path} sha256 mismatch: expected ${asset.sha256}, got ${actualHash}.`,
      );
    }

    const parsed = stlLoader.parse(
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    );
    const geometry = compactGeometry(parsed, asset.id);
    geometries.set(asset.id, geometry);
    sourceAssets.push({
      boundsMm: asset.bounds_mm,
      geometrySha256_0_001mm: asset.geometry_sha256_0_001mm,
      id: asset.id,
      identity: asset.identity,
      path: asset.path,
      sha256: actualHash,
      sourceTriangleCount: asset.triangle_count,
      outputVertexCount: vertexCount(geometry),
    });
  }

  return {
    geometries,
    manifest,
    manifestSha256: sha256(manifestBytes),
    sourceAssets,
  };
}

function buildScene({ geometries, manifest }) {
  const scene = new THREE.Scene();
  scene.name = "RoboSocSpider";
  scene.userData = {
    coordinateSystem: manifest.coordinate_system,
    dynamicsEstimates: manifest.dynamics_estimates,
    jointLimitsDeg: manifest.joint_limits_deg,
    mapping: manifest.mapping,
    resetAnglesDeg: manifest.reset_angles_deg,
    schemaVersion: manifest.schema_version,
    tolerances: manifest.tolerances,
    world: manifest.world,
  };

  const body = new THREE.Group();
  body.name = "body";
  body.userData = {
    boundsBodyMm: manifest.body.bounds_body_mm,
    centerRootMm: manifest.body.center_root_mm,
    collisionPrimitive: manifest.body.collision_primitive,
    occurrence: manifest.body.occurrence,
  };
  scene.add(body);

  for (const visual of manifest.body.visuals) {
    body.add(makeVisualMesh(visual, geometries));
  }

  const legOrder = ["legi", "legj", "legk", "legl", "legm", "legn"];
  for (const legName of legOrder) {
    const leg = manifest.legs.find((candidate) => candidate.name === legName);
    if (!leg) {
      throw new Error(`Missing leg ${legName}.`);
    }
    addLeg(body, leg, geometries);
  }

  return scene;
}

async function buildSpiderGlb() {
  const sourceRootArgument = process.argv[2];
  if (!sourceRootArgument) {
    throw new Error(usage());
  }

  const sourceRoot = path.resolve(sourceRootArgument);
  const { geometries, manifest, manifestSha256, sourceAssets } =
    await loadSource(sourceRoot);
  const scene = buildScene({ geometries, manifest });
  const glb = await exportGlb(scene);

  if (glb.subarray(0, 4).toString("ascii") !== "glTF") {
    throw new Error("Generated binary does not have GLB magic.");
  }

  if (glb.byteLength > maxGlbBytes) {
    throw new Error(
      `Generated GLB is ${glb.byteLength} bytes, exceeding ${maxGlbBytes}.`,
    );
  }

  const jointNodes = [];
  const legNodes = [];
  scene.traverse((object) => {
    if (/^leg[ijklmn]$/.test(object.name)) {
      legNodes.push(object.name);
    }
    if (/^leg[ijklmn]_(coxa|femur|tibia)_joint$/.test(object.name)) {
      jointNodes.push(object.name);
    }
  });

  if (legNodes.length !== 6) {
    throw new Error(`Expected 6 leg nodes, found ${legNodes.length}.`);
  }
  if (jointNodes.length !== 18) {
    throw new Error(`Expected 18 joint nodes, found ${jointNodes.length}.`);
  }

  await mkdir(outputDirectory, { recursive: true });
  await writeFile(outputPath, glb);

  const outputHash = sha256(glb);
  const provenance = orderedObject({
    generator: {
      script: "scripts/build-robosoc-spider.mjs",
      threeVersion: THREE.REVISION,
    },
    manifest: {
      path: manifestRelativePath,
      schemaVersion: manifest.schema_version,
      sha256: manifestSha256,
    },
    output: {
      path: "public/models/robosoc-spider.glb",
      sha256: outputHash,
      sizeBytes: glb.byteLength,
    },
    source: {
      archivePath: manifest.source.archive_path,
      archiveSha256: manifest.source.archive_sha256_actual,
      document: manifest.source.document,
      documents: manifest.source.documents,
      fusionBuild: manifest.source.fusion_build,
      lineage: manifest.source.lineage,
      version: manifest.source.version,
    },
    sourceAssets,
    verification: {
      glbMagic: "glTF",
      joints: jointNodes.sort(),
      legs: legNodes.sort(),
      maxSizeBytes: maxGlbBytes,
    },
  });

  await writeFile(provenancePath, `${JSON.stringify(provenance, null, 2)}\n`);
  console.log(
    `Built ${path.relative(repositoryRoot, outputPath)} ` +
      `(${glb.byteLength} bytes, sha256 ${outputHash}).`,
  );
}

buildSpiderGlb().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
