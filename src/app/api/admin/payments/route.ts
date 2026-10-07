import { NextResponse } from "next/server";

import { getWorkspace } from "@/features/subscription/dal";
import {
  errorResponse,
  requireApiAdmin,
} from "@/features/subscription/helper/http";

/**
 * PRD §11: the admin verification queue. The dashboard renders it from its own
 * server read; this endpoint serves API consumers, so a `status` filter is applied
 * to the same queue rather than a second query path.
 */
export async function GET(request: Request) {
  try {
    const admin = await requireApiAdmin();
    const requested = new URL(request.url).searchParams.get("status");
    const { payments } = await getWorkspace({ id: admin.id, role: admin.role });

    return NextResponse.json({
      payments: requested
        ? payments.filter((payment) => payment.status === requested)
        : payments,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
