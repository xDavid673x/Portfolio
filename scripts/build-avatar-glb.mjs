import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");
const avatarImageDirectory = path.join(
  repositoryRoot,
  "public/images/avatar",
);
const outputDirectory = path.join(repositoryRoot, "public/models/avatar");
const outputPath = path.join(outputDirectory, "david-head-layered-v2.glb");

const sourceLayers = [
  {
    filename: "david-head-rest-v3.png",
    imageName: "DavidHeadRestImage",
    materialName: "HeadRestMaterial",
    meshName: "HeadRestMesh",
    nodeName: "HeadRest",
    opacity: 1,
    role: "rest",
    z: 0,
  },
  {
    filename: "david-head-blink-v3.png",
    imageName: "DavidHeadBlinkImage",
    materialName: "HeadBlinkMaterial",
    meshName: "HeadBlinkMesh",
    nodeName: "HeadBlink",
    opacity: 0,
    role: "blink",
    z: 0.002,
  },
];

const planeSize = 5.82;
const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const eyePatches = [
  {
    inner: { bottom: 645, left: 415, right: 600, top: 560 },
    name: "left",
    outer: { bottom: 665, left: 395, right: 620, top: 535 },
  },
  {
    inner: { bottom: 645, left: 655, right: 840, top: 560 },
    name: "right",
    outer: { bottom: 665, left: 635, right: 860, top: 535 },
  },
];

function padded(buffer, byte = 0) {
  const paddingLength = (4 - (buffer.byteLength % 4)) % 4;
  return paddingLength === 0
    ? buffer
    : Buffer.concat([buffer, Buffer.alloc(paddingLength, byte)]);
}

function float32Buffer(values) {
  const buffer = Buffer.alloc(values.length * Float32Array.BYTES_PER_ELEMENT);
  values.forEach((value, index) => buffer.writeFloatLE(value, index * 4));
  return buffer;
}

function uint16Buffer(values) {
  const buffer = Buffer.alloc(values.length * Uint16Array.BYTES_PER_ELEMENT);
  values.forEach((value, index) => buffer.writeUInt16LE(value, index * 2));
  return buffer;
}

function uint8Buffer(values) {
  return Buffer.from(values);
}

function readPngDimensions(buffer, filename) {
  if (buffer.byteLength < 24 || !buffer.subarray(0, 8).equals(pngSignature)) {
    throw new Error(`${filename} is not a valid PNG file.`);
  }

  const colorType = buffer.readUInt8(25);
  if (colorType !== 4 && colorType !== 6) {
    throw new Error(`${filename} must retain an alpha channel.`);
  }

  return {
    height: buffer.readUInt32BE(20),
    width: buffer.readUInt32BE(16),
  };
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function normalizePatchBounds(bounds, dimensions) {
  return {
    bottom: bounds.bottom / dimensions.height,
    left: bounds.left / dimensions.width,
    right: bounds.right / dimensions.width,
    top: bounds.top / dimensions.height,
  };
}

function buildBlinkPatchGeometry(dimensions) {
  const positions = [];
  const textureCoordinates = [];
  const colors = [];
  const indices = [];

  for (const patch of eyePatches) {
    const firstVertex = positions.length / 3;
    const xCoordinates = [
      patch.outer.left,
      patch.inner.left,
      patch.inner.right,
      patch.outer.right,
    ];
    const yCoordinates = [
      patch.outer.top,
      patch.inner.top,
      patch.inner.bottom,
      patch.outer.bottom,
    ];

    for (let row = 0; row < yCoordinates.length; row += 1) {
      const pixelY = yCoordinates[row];
      for (let column = 0; column < xCoordinates.length; column += 1) {
        const pixelX = xCoordinates[column];
        const u = pixelX / dimensions.width;
        const v = pixelY / dimensions.height;
        positions.push(u - 0.5, 0.5 - v, 0);
        textureCoordinates.push(u, v);

        const isOpaqueInterior =
          row > 0 && row < yCoordinates.length - 1 &&
          column > 0 && column < xCoordinates.length - 1;
        colors.push(255, 255, 255, isOpaqueInterior ? 255 : 0);
      }
    }

    for (let row = 0; row < 3; row += 1) {
      for (let column = 0; column < 3; column += 1) {
        const topLeft = firstVertex + row * 4 + column;
        const topRight = topLeft + 1;
        const bottomLeft = topLeft + 4;
        const bottomRight = bottomLeft + 1;
        indices.push(
          topLeft,
          bottomLeft,
          bottomRight,
          topLeft,
          bottomRight,
          topRight,
        );
      }
    }
  }

  return { colors, indices, positions, textureCoordinates };
}

async function buildAvatarGlb() {
  const layers = await Promise.all(
    sourceLayers.map(async (layer) => {
      const bytes = await readFile(path.join(avatarImageDirectory, layer.filename));
      return {
        ...layer,
        bytes,
        dimensions: readPngDimensions(bytes, layer.filename),
        sha256: sha256(bytes),
      };
    }),
  );

  const [canonicalDimensions] = layers.map((layer) => layer.dimensions);
  for (const layer of layers) {
    if (
      layer.dimensions.width !== canonicalDimensions.width ||
      layer.dimensions.height !== canonicalDimensions.height
    ) {
      throw new Error(
        `Avatar layers must be aligned, but ${layer.filename} is ` +
          `${layer.dimensions.width}x${layer.dimensions.height}.`,
      );
    }
  }

  const binaryParts = [];
  const bufferViews = [];
  let binaryByteLength = 0;

  function appendBufferView(buffer, properties = {}) {
    const bufferViewIndex = bufferViews.length;
    const paddedBuffer = padded(buffer);
    bufferViews.push({
      buffer: 0,
      byteLength: buffer.byteLength,
      byteOffset: binaryByteLength,
      ...properties,
    });
    binaryParts.push(paddedBuffer);
    binaryByteLength += paddedBuffer.byteLength;
    return bufferViewIndex;
  }

  // The resting portrait uses one full-frame quad. Blink geometry is defined
  // separately below so only the eye regions can ever change on screen.
  const restPositionBufferView = appendBufferView(
    float32Buffer([
      -0.5, -0.5, 0,
      0.5, -0.5, 0,
      0.5, 0.5, 0,
      -0.5, 0.5, 0,
    ]),
    { target: 34962 },
  );
  const restTextureCoordinateBufferView = appendBufferView(
    // glTF texture coordinates use the image's upper-left origin.
    float32Buffer([0, 1, 1, 1, 1, 0, 0, 0]),
    { target: 34962 },
  );
  const restIndexBufferView = appendBufferView(
    uint16Buffer([0, 1, 2, 0, 2, 3]),
    { target: 34963 },
  );

  const blinkGeometry = buildBlinkPatchGeometry(canonicalDimensions);
  const blinkPositionBufferView = appendBufferView(
    float32Buffer(blinkGeometry.positions),
    { target: 34962 },
  );
  const blinkTextureCoordinateBufferView = appendBufferView(
    float32Buffer(blinkGeometry.textureCoordinates),
    { target: 34962 },
  );
  const blinkColorBufferView = appendBufferView(
    uint8Buffer(blinkGeometry.colors),
    { target: 34962 },
  );
  const blinkIndexBufferView = appendBufferView(
    uint16Buffer(blinkGeometry.indices),
    { target: 34963 },
  );

  const images = [];
  const textures = [];
  const materials = [];
  const meshes = [];

  for (const layer of layers) {
    const imageBufferView = appendBufferView(layer.bytes);
    const imageIndex = images.length;
    images.push({
      bufferView: imageBufferView,
      mimeType: "image/png",
      name: layer.imageName,
    });

    const textureIndex = textures.length;
    textures.push({
      name: `${layer.nodeName}Texture`,
      sampler: 0,
      source: imageIndex,
    });

    materials.push({
      alphaMode: "BLEND",
      doubleSided: true,
      extensions: { KHR_materials_unlit: {} },
      extras: {
        initialOpacity: layer.opacity,
        layerRole: layer.role,
      },
      name: layer.materialName,
      pbrMetallicRoughness: {
        baseColorFactor: [1, 1, 1, layer.opacity],
        baseColorTexture: { index: textureIndex },
        metallicFactor: 0,
        roughnessFactor: 1,
      },
    });

  }

  meshes.push(
    {
      name: layers[0].meshName,
      primitives: [
        {
          attributes: { POSITION: 0, TEXCOORD_0: 1 },
          indices: 2,
          material: 0,
        },
      ],
    },
    {
      extras: {
        feathering: "vertex-alpha-four-by-four-grid",
        patches: eyePatches,
      },
      name: layers[1].meshName,
      primitives: [
        {
          attributes: { COLOR_0: 5, POSITION: 3, TEXCOORD_0: 4 },
          indices: 6,
          material: 1,
        },
      ],
    },
  );

  const nodes = [
    {
      children: [1],
      extras: {
        assetInterface: "portfolio-head-avatar-v2",
        assetRole: "temporary-development-avatar",
        geometryClass: "layered-card-not-facial-sculpt",
        identitySource: "selfie-derived-transparent-renders",
      },
      name: "DavidAvatarRoot",
    },
    {
      children: [2, 3],
      extras: {
        animationRole: "head-pivot",
        fixedGaze: true,
      },
      name: "HeadPivot",
    },
    ...layers.map((layer, index) => ({
      extras: {
        animationRole: layer.role,
        initialVisibility: layer.opacity === 0 ? "hidden" : "visible",
        ...(layer.role === "blink"
          ? {
              feathering: "vertex-alpha-four-by-four-grid",
              patchPixelBounds: eyePatches,
            }
          : {}),
        visibilityMechanism: "material-opacity",
      },
      mesh: index,
      name: layer.nodeName,
      scale: [planeSize, planeSize, 1],
      translation: [0, 0, layer.z],
    })),
  ];

  const binaryChunk = Buffer.concat(binaryParts);
  const manifest = {
    accessors: [
      {
        bufferView: restPositionBufferView,
        componentType: 5126,
        count: 4,
        max: [0.5, 0.5, 0],
        min: [-0.5, -0.5, 0],
        type: "VEC3",
      },
      {
        bufferView: restTextureCoordinateBufferView,
        componentType: 5126,
        count: 4,
        max: [1, 1],
        min: [0, 0],
        type: "VEC2",
      },
      {
        bufferView: restIndexBufferView,
        componentType: 5123,
        count: 6,
        max: [3],
        min: [0],
        type: "SCALAR",
      },
      {
        bufferView: blinkPositionBufferView,
        componentType: 5126,
        count: blinkGeometry.positions.length / 3,
        max: [
          Math.max(...blinkGeometry.positions.filter((_, index) => index % 3 === 0)),
          Math.max(...blinkGeometry.positions.filter((_, index) => index % 3 === 1)),
          0,
        ],
        min: [
          Math.min(...blinkGeometry.positions.filter((_, index) => index % 3 === 0)),
          Math.min(...blinkGeometry.positions.filter((_, index) => index % 3 === 1)),
          0,
        ],
        type: "VEC3",
      },
      {
        bufferView: blinkTextureCoordinateBufferView,
        componentType: 5126,
        count: blinkGeometry.textureCoordinates.length / 2,
        max: [
          Math.max(...blinkGeometry.textureCoordinates.filter((_, index) => index % 2 === 0)),
          Math.max(...blinkGeometry.textureCoordinates.filter((_, index) => index % 2 === 1)),
        ],
        min: [
          Math.min(...blinkGeometry.textureCoordinates.filter((_, index) => index % 2 === 0)),
          Math.min(...blinkGeometry.textureCoordinates.filter((_, index) => index % 2 === 1)),
        ],
        type: "VEC2",
      },
      {
        bufferView: blinkColorBufferView,
        componentType: 5121,
        count: blinkGeometry.colors.length / 4,
        normalized: true,
        type: "VEC4",
      },
      {
        bufferView: blinkIndexBufferView,
        componentType: 5123,
        count: blinkGeometry.indices.length,
        max: [Math.max(...blinkGeometry.indices)],
        min: [Math.min(...blinkGeometry.indices)],
        type: "SCALAR",
      },
    ],
    asset: {
      generator: "Portfolio dependency-free layered avatar builder",
      version: "2.0",
    },
    buffers: [{ byteLength: binaryChunk.byteLength }],
    bufferViews,
    extensionsRequired: ["KHR_materials_unlit"],
    extensionsUsed: ["KHR_materials_unlit"],
    extras: {
      assetRole: "temporary-development-avatar",
      eyeBehavior: "fixed-gaze",
      geometryClass: "layered-card-not-facial-sculpt",
      blinkPatches: eyePatches.map((patch) => ({
        innerPixels: patch.inner,
        innerUv: normalizePatchBounds(patch.inner, canonicalDimensions),
        name: patch.name,
        outerPixels: patch.outer,
        outerUv: normalizePatchBounds(patch.outer, canonicalDimensions),
      })),
      sourceLayers: layers.map((layer) => ({
        filename: layer.filename,
        sha256: layer.sha256,
      })),
    },
    images,
    materials,
    meshes,
    nodes,
    samplers: [
      {
        magFilter: 9729,
        minFilter: 9987,
        wrapS: 33071,
        wrapT: 33071,
      },
    ],
    scene: 0,
    scenes: [{ name: "DavidAvatarScene", nodes: [0] }],
    textures,
  };

  const jsonChunk = padded(Buffer.from(JSON.stringify(manifest)), 0x20);
  const headerByteLength = 12;
  const chunkHeaderByteLength = 8;
  const totalByteLength =
    headerByteLength +
    chunkHeaderByteLength +
    jsonChunk.byteLength +
    chunkHeaderByteLength +
    binaryChunk.byteLength;

  const header = Buffer.alloc(headerByteLength);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(totalByteLength, 8);

  const jsonHeader = Buffer.alloc(chunkHeaderByteLength);
  jsonHeader.writeUInt32LE(jsonChunk.byteLength, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);

  const binaryHeader = Buffer.alloc(chunkHeaderByteLength);
  binaryHeader.writeUInt32LE(binaryChunk.byteLength, 0);
  binaryHeader.writeUInt32LE(0x004e4942, 4);

  const glb = Buffer.concat([
    header,
    jsonHeader,
    jsonChunk,
    binaryHeader,
    binaryChunk,
  ]);

  await mkdir(outputDirectory, { recursive: true });
  await writeFile(outputPath, glb);

  console.log(
    JSON.stringify(
      {
        bytes: glb.byteLength,
        dimensions: canonicalDimensions,
        embeddedImages: images.length,
        meshes: meshes.length,
        nodes: nodes.map((node) => node.name),
        output: path.relative(repositoryRoot, outputPath),
        sha256: sha256(glb),
      },
      null,
      2,
    ),
  );
}

await buildAvatarGlb();
