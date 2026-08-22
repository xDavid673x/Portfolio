"use client";

import { useGLTF } from "@react-three/drei";

import { assetPath } from "@/lib/asset-path";

export const ROBOTIC_ARM_SCENE_ASSET_URL = assetPath(
  "/models/zero-robotic-arm/zero-robotic-arm.glb",
);
export const ROBOSOC_SPIDER_SCENE_ASSET_URL = assetPath(
  "/models/robosoc-spider.glb",
);

/** Warm one model at a time so background loading does not compete with the hero. */
export function preloadRoboticArmSceneAsset() {
  useGLTF.preload(ROBOTIC_ARM_SCENE_ASSET_URL);
}

export function preloadRobosocSpiderSceneAsset() {
  useGLTF.preload(ROBOSOC_SPIDER_SCENE_ASSET_URL);
}

