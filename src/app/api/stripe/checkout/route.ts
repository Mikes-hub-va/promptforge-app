import { NextResponse } from "next/server";
import { getCurrentUser, updateUserBilling } from "@/lib/auth/server";
import { getStripe, getStripeConfigStatus, getStripeProPriceId } from "@/lib/billing/stripe";
import { getPlatformStatus } from "@/lib/platform/status";
import { applyRateLimitHeaders, consumeRateLimit, createRateLimitError } from "@/lib/security/rate-limit";
import { rejectUntrustedOrigin } from "@/lib/security/request-origin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const invalidOrigin = rejectUntrustedOrigin(request, "Untrusted billing request.");
  if (invalidOrigin) {
    return invalidOrigin;
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Create an account or sign in before upgrading." }, { status: 401 });
  }

  const rateLimit = consumeRateLimit(request, {
    bucket: "stripe-checkout",
    limit: 12,
    windowMs: 60 * 60 * 1000,
    identifier: user.id,
  });
  if (!rateLimit.ok) {
    return createRateLimitError(rateLimit, "Too many billing attempts. Please wait before opening checkout again.");
  }

  const stripe = getStripe();
  const priceId = getStripeProPriceId();
  const stripeStatus = getStripeConfigStatus();
  const platform = getPlatformStatus();

  if (!platform.billingReady) {
    const errorMessage = platform.billing.runtimeGuardMessage
      ?? "Stripe checkout is not fully configured yet. Add STRIPE_SECRET_KEY, STRIPE_PRICE_PRO_MONTHLY, and STRIPE_WEBHOOK_SECRET.";
    return applyRateLimitHeaders(
      NextResponse.json({
        error: errorMessage,
      }, { status: 503 }),
      rateLimit,
    );
  }

  if (!stripe || !priceId || !stripeStatus.hasWebhookSecret) {
    return applyRateLimitHeaders(
      NextResponse.json({
        error: "Stripe checkout is not fully configured yet. Add STRIPE_SECRET_KEY, STRIPE_PRICE_PRO_MONTHLY, and STRIPE_WEBHOOK_SECRET.",
      }, { status: 503 }),
      rateLimit,
    );
  }

  const origin = new URL(request.url).origin;
  let customerId = user.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: {
        userId: user.id,
      },
    });
    customerId = customer.id;
    updateUserBilling(user.id, { stripeCustomerId: customer.id });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    allow_promotion_codes: true,
    billing_address_collection: "auto",
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    metadata: {
      userId: user.id,
      planTier: "pro",
    },
    success_url: `${origin}/account?checkout=success`,
    cancel_url: `${origin}/pricing?checkout=cancelled`,
  });

  if (!session.url) {
    return applyRateLimitHeaders(
      NextResponse.json({ error: "Stripe did not return a checkout URL." }, { status: 500 }),
      rateLimit,
    );
  }

  return applyRateLimitHeaders(NextResponse.json({ url: session.url }), rateLimit);
}
