"use server";

import { Storage } from "@google-cloud/storage";

// Parse credentials from environment variable with better error handling
let credentials;
try {
  const credentialsStr = process.env.GOOGLE_CLOUD_CREDENTIALS;
  if (!credentialsStr) {
    throw new Error("GOOGLE_CLOUD_CREDENTIALS environment variable is not set");
  }

  // Decode base64 credentials string
  const decodedCredentials = Buffer.from(credentialsStr, "base64").toString();
  credentials = JSON.parse(decodedCredentials);
} catch (error) {
  throw new Error(
    `Failed to parse GCS credentials: ${
      error instanceof Error ? error.message : "Unknown error"
    }`
  );
}

// Validate required credential fields
if (!credentials.project_id) {
  throw new Error("GCS credentials missing project_id");
}

const storage = new Storage({
  credentials,
  projectId: credentials.project_id,
});

const bucketName = process.env.GCS_BUCKET_NAME;
if (!bucketName) {
  throw new Error("GCS_BUCKET_NAME environment variable is not set");
}

const bucket = storage.bucket(bucketName);

export async function uploadFile(
  destination: string,
  fileBuffer: Buffer,
  contentType: string = "application/octet-stream"
): Promise<string> {
  try {
    const file = bucket.file(destination);

    // Simple upload using buffer
    await file.save(fileBuffer, {
      contentType,
      metadata: {
        cacheControl: "public, max-age=31536000",
      },
    });

    // Return the public URL
    return `https://storage.googleapis.com/${bucket.name}/${destination}`;
  } catch (error) {
    console.error("Upload error:", error);
    const errorMessage =
      error instanceof Error
        ? `${error.message} ${error.stack || ""}`
        : "Unknown error";
    throw new Error(`Failed to upload file to GCS: ${errorMessage}`);
  }
}
