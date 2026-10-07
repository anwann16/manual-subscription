import { NextResponse } from "next/server";

import { submitPayment } from "@/features/subscription/dal";
import {
  errorResponse,
  requireApiUser,
  SubscriptionError,
} from "@/features/subscription/helper/http";
import { removeProof, storeProof } from "@/features/subscription/helper/upload";

/** S3 uploads need the Node runtime, not the Edge one. */
export const runtime = "nodejs";

/**
 * PRD §9: multipart upload of the transfer proof. The object is written first so
 * the payment row can store a real key; if the database transaction fails the
 * orphaned object is deleted instead of leaking into the bucket.
 */
export async function POST(
  request: Request,
  context: RouteContext<"/api/subscriptions/[id]/payments">,
) {
  let proofKey: string | null = null;

  try {
    const user = await requireApiUser();
    const { id } = await context.params;

    const formData = await request.formData();
    const file = formData.get("proof") ?? formData.get("file");

    if (!(file instanceof File)) {
      throw new SubscriptionError(
        400,
        "INVALID_FILE",
        "File bukti transfer wajib diunggah.",
      );
    }

    proofKey = await storeProof(file);
    const subscription = await submitPayment(user.id, id, proofKey);

    return NextResponse.json({ subscription }, { status: 201 });
  } catch (error) {
    if (proofKey) await removeProof(proofKey);
    return errorResponse(error);
  }
}
