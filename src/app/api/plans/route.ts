import { NextResponse } from "next/server";

import { listActivePlans } from "@/features/subscription/dal";
import {
  errorResponse,
  requireApiUser,
} from "@/features/subscription/helper/http";

export async function GET() {
  try {
    await requireApiUser();
    return NextResponse.json({ plans: await listActivePlans() });
  } catch (error) {
    return errorResponse(error);
  }
}
