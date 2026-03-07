import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { getStripe } from "@/lib/billing/stripe";
import { getPlatformStatus } from "@/lib/platform/status";
import { applyRateLimitHeaders, consumeRateLimit, createRateLimitError } from "@/lib/security/rate-limit";
import { rejectUntrustedOrigin } from "@/lib/security/request-origin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const invalidOrigin = rejectUntrustedOrigin(request, "Untrusted billing portal request.");
  if (invalidOrigin) {
    return invalidOrigin;
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimit = consumeRateLimit(request, {
    bucket: "stripe-portal",
    limit: 20,
    windowMs: 60 * 60 * 1000,
    identifier: user.id,
  });
  if (!rateLimit.ok) {
    return createRateLimitError(rateLimit, "Too many billing portal requests. Please wait before trying again.");
  }

  const stripe = getStripe();
  const platform = getPlatformStatus();

  if (!platform.billingReady) {
    return applyRateLimitHeaders(
      NextResponse.json(
        { error: platform.billing.runtimeGuardMessage ?? "Billing portal is not available for this account yet." },
        { status: 400 },
      ),
      rateLimit,
    );
  }

  if (!stripe || !user.stripeCustomerId) {
    return applyRateLimitHeaders(
      NextResponse.json({ error: "Billing portal is not available for this account yet." }, { status: 400 }),
      rateLimit,
    );
  }

  const origin = new URL(request.url).origin;
  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${origin}/account`,
  });

  return applyRateLimitHeaders(NextResponse.json({ url: session.url }), rateLimit);
}
