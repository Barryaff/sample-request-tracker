import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: process.env.S3_REGION || "auto",
  endpoint: process.env.S3_ENDPOINT || undefined,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
  },
  forcePathStyle: !!process.env.S3_ENDPOINT, // Required for R2
});

const BUCKET = process.env.S3_BUCKET_NAME || "";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/heic", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export function validateUpload(contentType: string, size: number, filename: string) {
  if (!ALLOWED_TYPES.includes(contentType)) {
    throw new Error(`File type ${contentType} not allowed. Use JPEG, PNG, HEIC, or WebP.`);
  }
  if (size > MAX_SIZE) {
    throw new Error(`File too large. Maximum size is 5MB.`);
  }
  // Path traversal check
  if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
    throw new Error("Invalid filename");
  }
}

export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(s3, command, { expiresIn: 300 }); // 5 min
}

export async function deleteObject(key: string): Promise<void> {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    }),
  );
}

export function getPublicUrl(key: string): string {
  if (process.env.S3_PUBLIC_URL) {
    return `${process.env.S3_PUBLIC_URL}/${key}`;
  }
  return `https://${BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com/${key}`;
}
