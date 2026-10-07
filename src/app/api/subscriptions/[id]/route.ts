import { NextResponse } from "next/server";

import { getSubscription } from "@/features/subscription/dal";
import {
  errorResponse,
  requireApiUser,
} from "@/features/subscription/helper/http";

/** PRD §15: scoped by `userId`, so another user's subscription reads as 404. */
export async function GET(
  _request: Request,
  context: RouteContext<"/api/subscriptions/[id]">,
) {
  try {
    const user = await requireApiUser();
    const { id } = await context.params;

    return NextResponse.json({
      subscription: await getSubscription(user.id, id),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
