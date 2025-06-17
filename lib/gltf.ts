"use server";

import { uploadFile } from "./gcs";

export async function fetchGltf(
  assetId: string
): Promise<string | { error: string }> {
  try {
    console.log(`Downloading GLTF for asset ${assetId}...`);
    const gltfUrl = `https://public-assets.sandbox.game/assets/${assetId}/gltf`;
    const gltfResponse = await fetch(gltfUrl);
    if (!gltfResponse.ok) {
      const errorMessage = `Failed to fetch GLTF for asset ${assetId}. ${gltfResponse.statusText}`;
      console.error(errorMessage);
      return { error: errorMessage };
    }

    const gltfData = await gltfResponse.text();

    const gcsPath = `${assetId}.gltf`;
    const uploadedUrl = await uploadFile(gcsPath, Buffer.from(gltfData));

    return uploadedUrl;
  } catch (error) {
    console.error(`Failed to reupload GLTF for asset ${assetId} to GCS`, error);
    throw error;
  }
}
