-- Proofs moved from local disk (`public/uploads`, stored as a public URL) to Neon
-- Object Storage, where the row keeps only the bucket object key and the file is
-- served through the authenticated `/api/payments/:id/proof` route.
--
-- Old values were `/uploads/<uuid>.<ext>`, which is not a valid object key, so the
-- column is replaced rather than renamed. No production data exists yet.
ALTER TABLE "Payment" DROP COLUMN "proofUrl",
ADD COLUMN     "proofKey" TEXT NOT NULL;
