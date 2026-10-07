import { NextResponse } from "next/server";

import { getProofKey } from "@/features/subscription/dal";
import {
  errorResponse,
  requireApiUser,
} from "@/features/subscription/helper/http";
import { proofDownloadUrl } from "@/features/subscription/helper/upload";

/** Presigning is Node-only; `@aws-sdk/*` is not usable on the Edge runtime. */
export const runtime = "nodejs";

/**
 * PRD §11: the bucket is private, so the stored key never leaves the server. This
 * route authorizes the viewer (owner or admin), then hands back a short-lived
 * presigned GET. Redirecting keeps `<img src>` and the review links working
 * without the client holding any storage credential.
 */
export async function GET(
  _request: Request,
  context: RouteContext<"/api/payments/[id]/proof">,
) {
  try {
    const user = await requireApiUser();
    const { id } = await context.params;

    const key = await getProofKey(user, id);
    const response = NextResponse.redirect(await proofDownloadUrl(key));

    // The redirect target expires, so a cached hop would hand the browser a dead
    // link. Image tags re-request the route instead of reusing a stale 307.
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
