"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Bookmark,
  BriefcaseBusiness,
  CreditCard,
  History,
  KeyRound,
  LogOut,
  ShieldCheck,
  Sparkles,
  UserRound,
  Zap,
} from "lucide-react";
import { useAuth } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type NoticeTone = "success" | "error" | "info";

type InlineNotice = {
  tone: NoticeTone;
  message: string;
};

type BillingStatus = {
  hasPublishableKey: boolean;
  hasSecretKey: boolean;
  hasPriceId: boolean;
  hasWebhookSecret: boolean;
  checkoutReady: boolean;
  billingReady: boolean;
  runtimeAllowed?: boolean;
  runtimeGuardMessage?: string | null;
};

type AccountPageClientProps = {
  billing: BillingStatus;
  billingReady: boolean;
  domain: string;
  managedProviders: string[];
  managedRuntimeGuardMessage?: string | null;
  canAccessOwnerDashboard: boolean;
};

function noticeClasses(tone: NoticeTone) {
  if (tone === "success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }
  if (tone === "error") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-sky-200 bg-sky-50 text-sky-800";
}

async function readErrorMessage(response: Response, fallback: string) {
  const payload = await response.json().catch(() => ({}));
  return typeof payload?.error === "string" ? payload.error : fallback;
}

function PlatformStatusCard({
  billing,
  billingReady,
  domain,
  managedProviders,
  managedRuntimeGuardMessage,
}: Pick<AccountPageClientProps, "billing" | "billingReady" | "domain" | "managedProviders" | "managedRuntimeGuardMessage">) {
  const domainLabel = useMemo(() => {
    try {
      return new URL(domain).host;
    } catch {
      return domain;
    }
  }, [domain]);

  return (
    <Card className="pf-gradient-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-orange-500" /> Platform status
        </CardTitle>
        <CardDescription>Current platform status for your Promptify account.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Managed runtime</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {managedProviders.length > 0 ? "Available" : managedRuntimeGuardMessage ? "Production-only" : "BYOK only"}
            </p>
            <p className="mt-1 text-xs text-slate-600">
              {managedProviders.length > 0
                ? `Connected providers: ${managedProviders.join(", ")}.`
                : managedRuntimeGuardMessage ?? "Managed provider access is not enabled yet."}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Stripe client key</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{billing.hasPublishableKey ? "Present" : "Missing"}</p>
            <p className="mt-1 text-xs text-slate-600">
              Client-facing billing surfaces {billing.hasPublishableKey ? "have" : "do not have"} a publishable key configured.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Billing</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{billingReady ? "Ready" : "Pending configuration"}</p>
            <p className="mt-1 text-xs text-slate-600">
              {billingReady
                ? "Stripe checkout and customer portal routes are available for eligible accounts."
                : billing.runtimeGuardMessage
                  ? billing.runtimeGuardMessage
                : billing.checkoutReady
                  ? "Checkout can be created, but the webhook secret is still missing, so billing stays disabled until subscription sync is safe."
                  : "Upgrade controls stay visible, but checkout will not open until the Stripe secret key, price ID, and webhook secret are added."}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Stripe server state</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {billing.hasSecretKey && billing.hasPriceId ? "Checkout wired" : "Server keys missing"}
            </p>
            <p className="mt-1 text-xs text-slate-600">
              {billing.hasSecretKey && billing.hasPriceId
                ? billing.hasWebhookSecret
                  ? "Secret key, recurring price, and webhook secret are all configured."
                  : "Secret key and recurring price are present, but the webhook secret still needs to be connected."
                : "Stripe still needs the secret key and a live monthly price ID."}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Current domain</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{domainLabel}</p>
            <p className="mt-1 text-xs text-slate-600">
              This card reflects the runtime and host you are currently using.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {(managedProviders.length > 0 ? managedProviders : ["Local engine", "BYOK session keys"]).map((item) => (
            <span
              key={item}
              className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
            >
              {item}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function AccountPageClient({
  billing,
  billingReady,
  domain,
  managedProviders,
  managedRuntimeGuardMessage,
  canAccessOwnerDashboard,
}: AccountPageClientProps) {
  const { user, isLoading, login, logout, refresh, signup } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [globalNotice, setGlobalNotice] = useState<InlineNotice | null>(null);
  const [billingBusy, setBillingBusy] = useState(false);
  const [profileBusy, setProfileBusy] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState({ name: "", email: "", password: "" });
  const [profileForm, setProfileForm] = useState({ name: "" });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [profileNotice, setProfileNotice] = useState<InlineNotice | null>(null);
  const [passwordNotice, setPasswordNotice] = useState<InlineNotice | null>(null);

  const checkoutState = useMemo(() => searchParams.get("checkout"), [searchParams]);
  const upgradeIntent = useMemo(() => searchParams.get("intent") === "upgrade", [searchParams]);
  const restrictedIntent = useMemo(() => searchParams.get("restricted") === "ops", [searchParams]);

  useEffect(() => {
    setProfileForm({ name: user?.name ?? "" });
  }, [user?.name]);

  useEffect(() => {
    setGlobalNotice(null);
    setProfileNotice(null);
    setPasswordNotice(null);
    setLoginForm({ email: "", password: "" });
    setSignupForm({ name: "", email: "", password: "" });
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  }, [user?.id]);

  const submitLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setGlobalNotice(null);
    try {
      await login(loginForm);
      router.refresh();
    } catch (nextError) {
      setGlobalNotice({
        tone: "error",
        message: nextError instanceof Error ? nextError.message : "Login failed.",
      });
    }
  };

  const submitSignup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setGlobalNotice(null);
    try {
      await signup(signupForm);
      router.refresh();
    } catch (nextError) {
      setGlobalNotice({
        tone: "error",
        message: nextError instanceof Error ? nextError.message : "Account creation failed.",
      });
    }
  };

  const openBillingFlow = async (target: "checkout" | "portal") => {
    setGlobalNotice(null);
    setBillingBusy(true);
    try {
      const response = await fetch(target === "checkout" ? "/api/stripe/checkout" : "/api/stripe/portal", {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "Billing action failed."));
      }
      const payload = await response.json().catch(() => ({}));
      if (typeof payload?.url !== "string") {
        throw new Error("Billing action did not return a URL.");
      }
      window.location.href = payload.url;
    } catch (nextError) {
      setGlobalNotice({
        tone: "error",
        message: nextError instanceof Error ? nextError.message : "Billing action failed.",
      });
    } finally {
      setBillingBusy(false);
    }
  };

  const submitProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileBusy(true);
    setProfileNotice(null);

    try {
      const response = await fetch("/api/auth/profile", {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileForm),
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "Unable to update your profile."));
      }

      await refresh();
      setProfileNotice({
        tone: "success",
        message: "Profile updated. Your account name now appears across synced Promptify surfaces.",
      });
    } catch (nextError) {
      setProfileNotice({
        tone: "error",
        message: nextError instanceof Error ? nextError.message : "Unable to update your profile.",
      });
    } finally {
      setProfileBusy(false);
    }
  };

  const submitPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordNotice(null);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordNotice({
        tone: "error",
        message: "New password and confirmation must match.",
      });
      return;
    }

    setPasswordBusy(true);
    try {
      const response = await fetch("/api/auth/password", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "Unable to update your password."));
      }

      router.refresh();
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordNotice({
        tone: "success",
        message: "Password updated. Other active sessions were signed out and this session was rotated.",
      });
    } catch (nextError) {
      setPasswordNotice({
        tone: "error",
        message: nextError instanceof Error ? nextError.message : "Unable to update your password.",
      });
    } finally {
      setPasswordBusy(false);
    }
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 md:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Account access</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">Create an account for synced prompt work.</h1>
          <p className="mt-4 text-base text-slate-600">
            Guest mode still works, but accounts unlock real saved-history sync, billing, and a cleaner path into managed runs.
          </p>
        </div>

        {checkoutState === "success" ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Stripe checkout completed. Sign in and the account panel will reflect the updated billing state after the webhook arrives.
          </div>
        ) : null}

        {globalNotice ? (
          <div className={`mt-6 rounded-2xl border px-4 py-3 text-sm ${noticeClasses(globalNotice.tone)}`}>
            {globalNotice.message}
          </div>
        ) : null}

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserRound className="h-4 w-4" /> Sign in
                </CardTitle>
                <CardDescription>Pick up where you left off and keep saved prompts attached to your account.</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={submitLogin}>
                  <Input
                    type="email"
                    placeholder="Email"
                    autoComplete="email"
                    required
                    value={loginForm.email}
                    onChange={(event) => setLoginForm((state) => ({ ...state, email: event.target.value }))}
                  />
                  <Input
                    type="password"
                    placeholder="Password"
                    autoComplete="current-password"
                    required
                    value={loginForm.password}
                    onChange={(event) => setLoginForm((state) => ({ ...state, password: event.target.value }))}
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign in"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" /> Create account
                </CardTitle>
                <CardDescription>Create a real account for synced prompt history, saved prompts, and billing access.</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={submitSignup}>
                  <Input
                    placeholder="Full name"
                    autoComplete="name"
                    required
                    maxLength={80}
                    value={signupForm.name}
                    onChange={(event) => setSignupForm((state) => ({ ...state, name: event.target.value }))}
                  />
                  <Input
                    type="email"
                    placeholder="Email"
                    autoComplete="email"
                    required
                    value={signupForm.email}
                    onChange={(event) => setSignupForm((state) => ({ ...state, email: event.target.value }))}
                  />
                  <div className="space-y-2">
                    <Input
                      type="password"
                      placeholder="Password"
                      autoComplete="new-password"
                      required
                      minLength={10}
                      maxLength={128}
                      value={signupForm.password}
                      onChange={(event) => setSignupForm((state) => ({ ...state, password: event.target.value }))}
                    />
                    <p className="text-xs text-slate-500">Use at least 10 characters with uppercase, lowercase, and a number.</p>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating..." : "Create account"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <PlatformStatusCard
              billing={billing}
              billingReady={billingReady}
              domain={domain}
              managedProviders={managedProviders}
              managedRuntimeGuardMessage={managedRuntimeGuardMessage}
            />
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" /> Why create an account
                </CardTitle>
                <CardDescription>Promptify stays useful without adding friction, but accounts unlock the durable workflow.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-600">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  Synced saved prompts and history across sessions instead of browser-only storage.
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  Cleaner access to billing, managed runtime status, and future account-level product controls.
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  Session-backed auth with account settings and password management directly inside the product.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 md:px-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Account</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">Manage identity, storage, and billing.</h1>
          <p className="mt-4 text-base text-slate-600">
            Signed in as {user.email}. Saved prompts and prompt history now sync to your account automatically.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            void logout().then(() => router.refresh());
          }}
          disabled={isLoading || profileBusy || passwordBusy}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>

      {upgradeIntent && !billingReady ? (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Billing is not active yet. Contact support if you want Promptify Pro enabled before checkout is turned on here.
        </div>
      ) : null}

      {restrictedIntent ? (
        <div className="mt-6 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
          The owner dashboard is limited to configured owner accounts.
        </div>
      ) : null}

      {checkoutState === "success" ? (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Stripe checkout completed. If the plan status is still catching up, give the webhook a moment and refresh the page.
        </div>
      ) : null}

      {globalNotice ? (
        <div className={`mt-6 rounded-2xl border px-4 py-3 text-sm ${noticeClasses(globalNotice.tone)}`}>
          {globalNotice.message}
        </div>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" /> Account profile
              </CardTitle>
              <CardDescription>Core identity, plan state, and quick access to your synced workspace.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Name</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{user.name}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Email</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{user.email}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Plan</p>
                  <p className="mt-2 text-sm font-semibold capitalize text-slate-900">{user.planTier}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Billing status</p>
                  <p className="mt-2 text-sm font-semibold capitalize text-slate-900">{user.billingStatus}</p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <Button asChild variant="outline">
                  <Link href="/workspace">
                    Open workspace
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <div className={`grid gap-3 ${canAccessOwnerDashboard ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
                  <Button asChild variant="ghost">
                    <Link href="/saved">
                      <Bookmark className="h-4 w-4" />
                      Saved
                    </Link>
                  </Button>
                  <Button asChild variant="ghost">
                    <Link href="/history">
                      <History className="h-4 w-4" />
                      History
                    </Link>
                  </Button>
                  {canAccessOwnerDashboard ? (
                    <Button asChild variant="ghost">
                      <Link href="/ops">
                        <BriefcaseBusiness className="h-4 w-4" />
                        Dashboard
                      </Link>
                    </Button>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserRound className="h-4 w-4" /> Profile settings
              </CardTitle>
              <CardDescription>Keep the account identity clean before you invite billing or managed runtime usage.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form className="space-y-4" onSubmit={submitProfile}>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-800" htmlFor="accountName">
                    Display name
                  </label>
                  <Input
                    id="accountName"
                    autoComplete="name"
                    required
                    maxLength={80}
                    value={profileForm.name}
                    onChange={(event) => setProfileForm({ name: event.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-800" htmlFor="accountEmail">
                    Email
                  </label>
                  <Input id="accountEmail" value={user.email} disabled readOnly />
                  <p className="text-xs text-slate-500">Email changes are not editable yet because billing and sync identity are tied to this address.</p>
                </div>

                {profileNotice ? (
                  <div className={`rounded-2xl border px-4 py-3 text-sm ${noticeClasses(profileNotice.tone)}`}>
                    {profileNotice.message}
                  </div>
                ) : null}

                <Button type="submit" disabled={profileBusy}>
                  {profileBusy ? "Saving..." : "Save profile"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-4 w-4" /> Password and security
              </CardTitle>
              <CardDescription>Keep account access tight with stronger credentials and direct password rotation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form className="space-y-4" onSubmit={submitPassword}>
                <input
                  hidden
                  tabIndex={-1}
                  type="email"
                  autoComplete="username"
                  readOnly
                  value={user.email}
                />
                <Input
                  type="password"
                  autoComplete="current-password"
                  placeholder="Current password"
                  required
                  value={passwordForm.currentPassword}
                  onChange={(event) =>
                    setPasswordForm((state) => ({
                      ...state,
                      currentPassword: event.target.value,
                    }))
                  }
                />
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder="New password"
                  required
                  minLength={10}
                  maxLength={128}
                  value={passwordForm.newPassword}
                  onChange={(event) =>
                    setPasswordForm((state) => ({
                      ...state,
                      newPassword: event.target.value,
                    }))
                  }
                />
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Confirm new password"
                  required
                  minLength={10}
                  maxLength={128}
                  value={passwordForm.confirmPassword}
                  onChange={(event) =>
                    setPasswordForm((state) => ({
                      ...state,
                      confirmPassword: event.target.value,
                    }))
                  }
                />

                <p className="text-xs text-slate-500">
                  Use at least 10 characters with uppercase, lowercase, and a number. Changing your password also signs out your other active sessions.
                </p>

                {passwordNotice ? (
                  <div className={`rounded-2xl border px-4 py-3 text-sm ${noticeClasses(passwordNotice.tone)}`}>
                    {passwordNotice.message}
                  </div>
                ) : null}

                <Button type="submit" disabled={passwordBusy}>
                  {passwordBusy ? "Updating..." : "Update password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <PlatformStatusCard
            billing={billing}
            billingReady={billingReady}
            domain={domain}
            managedProviders={managedProviders}
            managedRuntimeGuardMessage={managedRuntimeGuardMessage}
          />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" /> Billing controls
              </CardTitle>
              <CardDescription>Manage Promptify Pro billing from one place and reopen the customer portal whenever you need it.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                {billingReady
                  ? "Billing is active. Upgrade this account to Pro or open the customer portal."
                  : "Billing is not active yet. When enabled, this account can upgrade to Promptify Pro here."}
              </div>

              <div className="grid gap-3">
                <Button
                  type="button"
                  disabled={billingBusy || !billingReady}
                  onClick={() => void openBillingFlow("checkout")}
                >
                  {billingBusy ? "Opening..." : "Upgrade to Pro"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={billingBusy || !user.stripeCustomerId || !billingReady}
                  onClick={() => void openBillingFlow("portal")}
                >
                  Open billing portal
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
