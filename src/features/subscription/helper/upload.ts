import { randomUUID } from "node:crypto";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { SubscriptionError } from "./http";

/** PRD §9: JPG, JPEG, PNG, PDF; maximum 5 MB. */
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Content type plus magic-byte signature. The declared MIME type comes from the
 * client, so it is only used to pick the extension; the bytes decide acceptance.
 */
const ACCEPTED = [
  {
    mime: "image/jpeg",
    ext: "jpg",
    matches: (b: Buffer) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    mime: "image/png",
    ext: "png",
    matches: (b: Buffer) =>
      b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  },
  {
    mime: "application/pdf",
    ext: "pdf",
    matches: (b: Buffer) =>
      b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46,
  },
] as const;

/** Key prefix inside the bucket, keeping proofs apart from future objects. */
const KEY_PREFIX = "proofs";

/**
 * Lifetime of a served proof link. The bucket is private, so every read is a
 * presigned GET; a short window keeps a leaked link from outliving the review.
 */
const PROOF_URL_TTL_SECONDS = 15 * 60;

type Storage = { bucket: string; client: S3Client };

let cachedStorage: Storage | null = null;

const REQUIRED_ENV = [
  "AWS_ENDPOINT_URL_S3",
  "AWS_REGION",
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "NEON_STORAGE_BUCKET",
] as const;

/**
 * PRD §20: Neon Object Storage — S3-compatible storage scoped to a Neon branch.
 * The bucket stays private and the row keeps only the object key, so a proof is
 * never reachable without the authenticated `/api/payments/:id/proof` route.
 */
function getStorage(): Storage {
  if (cachedStorage) return cachedStorage;

  const missing = REQUIRED_ENV.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new SubscriptionError(
      500,
      "STORAGE_NOT_CONFIGURED",
      `Object storage belum dikonfigurasi: ${missing.join(", ")} belum di-set.`,
    );
  }

  cachedStorage = {
    bucket: process.env.NEON_STORAGE_BUCKET!,
    // Neon serves path-style SigV4 only, so virtual-host addressing stays off.
    client: new S3Client({
      region: process.env.AWS_REGION,
      endpoint: process.env.AWS_ENDPOINT_URL_S3,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: true,
      // The default checksum on PUT is computed from an empty body and is not
      // needed here; asking for it only on demand keeps uploads working.
      requestChecksumCalculation: "WHEN_REQUIRED",
    }),
  };

  return cachedStorage;
}

/**
 * PRD §9: validate the bytes, then write one immutable object. Returns the object
 * key; the caller persists it and `proofDownloadUrl` turns it into a URL later.
 */
export async function storeProof(file: File): Promise<string> {
  if (file.size === 0) {
    throw new SubscriptionError(400, "INVALID_FILE", "File bukti tidak boleh kosong.");
  }
  if (file.size > MAX_BYTES) {
    throw new SubscriptionError(
      413,
      "FILE_TOO_LARGE",
      "Ukuran file maksimal 5 MB.",
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const accepted = ACCEPTED.find((candidate) => candidate.matches(bytes));

  if (!accepted) {
    throw new SubscriptionError(
      415,
      "INVALID_FILE",
      "Format file harus JPG, JPEG, PNG, atau PDF.",
    );
  }

  const key = `${KEY_PREFIX}/${randomUUID()}.${accepted.ext}`;

  try {
    const { bucket, client } = getStorage();
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: bytes,
        ContentType: accepted.mime,
      }),
    );
  } catch (error) {
    console.error("[subscription:storage] PutObject failed", error);
    throw new SubscriptionError(
      502,
      "STORAGE_UNAVAILABLE",
      "Gagal mengunggah bukti transfer. Coba lagi.",
    );
  }

  return key;
}

/** Cleans up an orphaned object when the surrounding transaction fails. */
export async function removeProof(key: string): Promise<void> {
  try {
    const { bucket, client } = getStorage();
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  } catch (error) {
    // The caller is already surfacing a failure; a leaked object deserves a log,
    // not a second exception that would mask the original error.
    console.error("[subscription:storage] orphan cleanup failed", key, error);
  }
}

/** Signs an expiring GET URL for a stored proof. */
export async function proofDownloadUrl(key: string): Promise<string> {
  const { bucket, client } = getStorage();
  const ext = key.split(".").pop()?.toLowerCase();
  const mime = ACCEPTED.find((candidate) => candidate.ext === ext)?.mime;

  return getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      // Signed alongside the key so the browser renders the stored format.
      ResponseContentType: mime,
    }),
    { expiresIn: PROOF_URL_TTL_SECONDS },
  );
}
