import { NextResponse } from "next/server";

import {
  createSubscription,
  listSubscriptions,
} from "@/features/subscription/dal";
import {
  errorResponse,
  readJsonBody,
  requireApiUser,
  SubscriptionError,
} from "@/features/subscription/helper/http";

export async function GET() {
  try {
    const user = await requireApiUser();
    return NextResponse.json({
      subscriptions: await listSubscriptions(user.id),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

/** PRD §8: the body carries `planId` and nothing else. */
export async function POST(request: Request) {
  try {
    const user = await requireApiUser();
    const body = await readJsonBody(request);
    const planId = typeof body.planId === "string" ? body.planId.trim() : "";

    if (!planId) {
      throw new SubscriptionError(400, "INVALID_PLAN", "planId wajib diisi.");
    }

    const subscription = await createSubscription(user.id, planId);
    return NextResponse.json({ subscription }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
