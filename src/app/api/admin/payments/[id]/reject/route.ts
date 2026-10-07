import { NextResponse } from "next/server";

import { rejectPayment } from "@/features/subscription/dal";
import {
  errorResponse,
  readJsonBody,
  requireApiAdmin,
} from "@/features/subscription/helper/http";

/** PRD §11: `rejectionReason` is optional and stored verbatim (trimmed). */
export async function POST(
  request: Request,
  context: RouteContext<"/api/admin/payments/[id]/reject">,
) {
  try {
    const admin = await requireApiAdmin();
    const { id } = await context.params;
    const body = await readJsonBody(request);

    const rejectionReason =
      typeof body.rejectionReason === "string"
        ? body.rejectionReason
        : undefined;

    return NextResponse.json({
      payment: await rejectPayment(admin.id, id, rejectionReason),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
