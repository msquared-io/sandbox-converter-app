"use server";

import fs from "fs/promises";
import path from "path";
import { uploadFile } from "./gcs";
import os from "os";
import { exec } from "child_process";
import { promisify } from "util";
import convert from "../converter/main.js";

export async function convertGltfToMml(
  assetId: string,
  gltfUrl: string
): Promise<
  | {
      glbUrl: string;
      mmlUrl: string;
    }
  | {
      error: string;
    }
> {
  try {
    console.log(`Converting GLTF to GLB for asset ${assetId}...`);

    const gltfData = await fetch(gltfUrl);
    if (!gltfData.ok) {
      const errorMessage = `Failed to fetch GLTF for asset ${assetId}: ${gltfData.statusText}`;
      console.error(errorMessage);
      return { error: errorMessage };
    }

    const gltfText = await gltfData.text();

    const tempDir = os.tmpdir();
    const tempGltfPath = path.join(tempDir, `${assetId}.gltf`);
    const tempGlbPath = path.join(tempDir, `${assetId}.glb`);
    const tempMmlPath = path.join(tempDir, `${assetId}.mml`);

    await fs.writeFile(tempGltfPath, gltfText);

    let glbUrl: string;

    try {
      // Try converting GLTF to GLB
      await convertFile({
        file: tempGltfPath,
        output: tempGlbPath,
        merge: true,
      });

      const glbBuffer = await fs.readFile(tempGlbPath);
      console.log("Uploading GLB to Google Cloud Storage...");
      glbUrl = await uploadFile(`${assetId}.glb`, glbBuffer);
    } catch (conversionError) {
      console.error("Error during GLB conversion:", conversionError);
      return { error: "Error during GLB conversion" };
    }

    const mmlContent = `<m-character src="${glbUrl}"></m-character>`;

    await fs.writeFile(tempMmlPath, mmlContent);

    const mmlUrl = await uploadFile(`${assetId}.mml`, Buffer.from(mmlContent));

    // Clean up temporary files
    try {
      await Promise.all([
        fs.unlink(tempGltfPath),
        fs.unlink(tempGlbPath).catch(() => {}), // Might not exist if conversion failed
        fs.unlink(tempMmlPath),
      ]);
    } catch (cleanupError) {
      console.warn("Error cleaning up temporary files:", cleanupError);
    }

    return { glbUrl, mmlUrl };
  } catch (error) {
    const errorMessage = `Error converting GLTF to GLB for asset ${assetId}:`;
    console.error(errorMessage, error);
    return { error: errorMessage };
  }
}

async function convertFile(options: {
  file: string;
  output: string;
  merge: boolean;
}) {
  const absoluteInputPath = path.resolve(options.file);
  const absoluteOutputPath = path.resolve(options.output);

  const converterOptions = {
    file: absoluteInputPath,
    output: absoluteOutputPath,
    merge: options.merge,
  };

  // Create a temporary data directory and download skeleton.glb
  const tempDataDir = path.join(os.tmpdir(), "data");
  const skeletonTemp = path.join(tempDataDir, "skeleton.glb");

  try {
    await fs.mkdir(tempDataDir, { recursive: true });

    const baseUrl = process.env.HOST_DOMAIN ?? "http://localhost:3000";
    const skeletonUrl = `${baseUrl}/data/skeleton.glb`;
    console.log("Fetching skeleton.glb from", skeletonUrl);
    const response = await fetch(skeletonUrl);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch skeleton.glb from ${skeletonUrl}: ${response.statusText}`
      );
    }

    const skeletonBuffer = await response.arrayBuffer();
    await fs.writeFile(skeletonTemp, Buffer.from(skeletonBuffer));

    const originalCwd = process.cwd();
    process.chdir(os.tmpdir());

    try {
      const converted = await convert(converterOptions);
      if (!converted) {
        throw new Error("Failed to convert GLTF to GLB");
      }
    } finally {
      // Always restore the original working directory
      process.chdir(originalCwd);
    }
  } finally {
    try {
      await fs.unlink(skeletonTemp);
      await fs.rmdir(tempDataDir);
    } catch (cleanupError) {
      console.warn("Error cleaning up temp data directory:", cleanupError);
    }
  }
}
