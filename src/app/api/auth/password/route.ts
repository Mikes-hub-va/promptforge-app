import { NextResponse } from "next/server";
import { attachSessionCookie, createSession, getCurrentUser, invalidateSessionsForUser, updateUserPassword } from "@/lib/auth/server";
import { applyRateLimitHeaders, consumeRateLimit, createRateLimitError } from "@/lib/security/rate-limit";
import { rejectUntrustedOrigin } from "@/lib/security/request-origin";
import { passwordChangeSchema } from "@/lib/validation/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const invalidOrigin = rejectUntrustedOrigin(request, "Untrusted password update request.");
  if (invalidOrigin) {
    return invalidOrigin;
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimit = consumeRateLimit(request, {
    bucket: "auth-password",
    limit: 10,
    windowMs: 15 * 60 * 1000,
    identifier: user.id,
  });
  if (!rateLimit.ok) {
    return createRateLimitError(rateLimit, "Too many password changes. Please wait before trying again.");
  }

  const parsed = passwordChangeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return applyRateLimitHeaders(
      NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Enter your current password and a stronger new password." },
        { status: 400 },
      ),
      rateLimit,
    );
  }

  const result = updateUserPassword(user.id, parsed.data.currentPassword, parsed.data.newPassword);
  if (!result.ok) {
    return applyRateLimitHeaders(NextResponse.json({ error: result.error }, { status: 400 }), rateLimit);
  }

  invalidateSessionsForUser(user.id);
  const session = createSession(user.id);
  const response = NextResponse.json({ ok: true });
  attachSessionCookie(response, session, request);
  return applyRateLimitHeaders(response, rateLimit);
}
