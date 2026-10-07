import { NextResponse } from "next/server";

import { approvePayment } from "@/features/subscription/dal";
import {
  errorResponse,
  requireApiAdmin,
} from "@/features/subscription/helper/http";

/** PRD §12/§13: the period is computed server-side, inside one transaction. */
export async function POST(
  _request: Request,
  context: RouteContext<"/api/admin/payments/[id]/approve">,
) {
  try {
    const admin = await requireApiAdmin();
    const { id } = await context.params;

    return NextResponse.json({ payment: await approvePayment(admin.id, id) });
  } catch (error) {
    return errorResponse(error);
  }
}
