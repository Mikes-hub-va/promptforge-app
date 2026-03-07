import { NextResponse } from "next/server";
import Stripe from "stripe";
import { findUserById, findUserByStripeCustomerId, updateUserBilling } from "@/lib/auth/server";
import { getStripe, normalizeBillingStatus } from "@/lib/billing/stripe";
import { getPlatformStatus } from "@/lib/platform/status";

export const runtime = "nodejs";

async function syncSubscription(subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === "string"
    ? subscription.customer
    : subscription.customer.id;
  const userFromCustomer = customerId ? findUserByStripeCustomerId(customerId) : null;
  const metadataUserId = subscription.metadata?.userId;
  const user = userFromCustomer ?? (metadataUserId ? findUserById(metadataUserId) : null);

  if (!user) {
    return;
  }

  const billingStatus = normalizeBillingStatus(subscription.status);
  const isPaid = billingStatus === "active" || billingStatus === "trialing" || billingStatus === "past_due";
  const priceId = subscription.items.data[0]?.price?.id ?? null;
  const periodEnd = subscription.items.data[0]?.current_period_end
    ? new Date(subscription.items.data[0].current_period_end * 1000).toISOString()
    : null;

  updateUserBilling(user.id, {
    planTier: isPaid ? "pro" : "free",
    billingStatus,
    stripeCustomerId: customerId || null,
    stripeSubscriptionId: subscription.id,
    stripePriceId: priceId,
    subscriptionCurrentPeriodEnd: periodEnd,
  });
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const platform = getPlatformStatus();

  if (!platform.billing.runtimeAllowed) {
    return NextResponse.json(
      { error: platform.billing.runtimeGuardMessage ?? "Stripe webhook is disabled in this runtime." },
      { status: 503 },
    );
  }

  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  const body = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook signature failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await syncSubscription(subscription);
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      await syncSubscription(event.data.object as Stripe.Subscription);
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
