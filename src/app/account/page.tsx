import { Metadata } from "next";
import { headers } from "next/headers";
import { AccountPageClient } from "@/components/account/account-page-client";
import { canAccessOwnerDashboard } from "@/lib/auth/owners";
import { getCurrentUser } from "@/lib/auth/server";
import { getPlatformStatus } from "@/lib/platform/status";
import { getCurrentSiteUrl, getSiteUrlFromHeaders } from "@/lib/platform/runtime";

export const metadata: Metadata = {
  title: "Account",
  description: "Create an account, manage billing, and sync prompt work across sessions.",
};

export default async function AccountPage() {
  const platform = getPlatformStatus();
  const currentUser = await getCurrentUser();
  const requestHeaders = await headers();
  const currentSiteUrl = getSiteUrlFromHeaders(requestHeaders) ?? getCurrentSiteUrl();

  return (
    <AccountPageClient
      billing={platform.billing}
      billingReady={platform.billingReady}
      domain={currentSiteUrl}
      managedProviders={platform.managedProviders}
      managedRuntimeGuardMessage={platform.managedRuntimeGuardMessage}
      canAccessOwnerDashboard={canAccessOwnerDashboard(currentUser)}
    />
  );
}
