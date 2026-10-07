import { NextResponse } from "next/server";

import { renewSubscription } from "@/features/subscription/dal";
import {
  errorResponse,
  requireApiUser,
} from "@/features/subscription/helper/http";

/**
 * PRD §14: renewal does not compute dates — it reopens the subscription for a
 * new payment, and the period is derived at approval time.
 */
export async function POST(
  _request: Request,
  context: RouteContext<"/api/subscriptions/[id]/renew">,
) {
  try {
    const user = await requireApiUser();
    const { id } = await context.params;

    return NextResponse.json({
      subscription: await renewSubscription(user.id, id),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
