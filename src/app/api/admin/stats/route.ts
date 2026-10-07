import { NextResponse } from "next/server";

import { getPlatformStats } from "@/features/subscription/dal";
import {
  errorResponse,
  requireApiAdmin,
} from "@/features/subscription/helper/http";

/**
 * PRD §11: the two counters the admin summary shows. The dashboard reads them
 * from its own server render; this endpoint serves API consumers.
 */
export async function GET() {
  try {
    await requireApiAdmin();
    return NextResponse.json({ stats: await getPlatformStats() });
  } catch (error) {
    return errorResponse(error);
  }
}
