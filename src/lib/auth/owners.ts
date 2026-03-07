import type { AuthUser } from "@/types";

function normalizeEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() || "";
}

export function getOwnerEmails() {
  return (process.env.PROMPTIFY_OWNER_EMAILS ?? "")
    .split(",")
    .map((value) => normalizeEmail(value))
    .filter(Boolean);
}

export function isOwnerEmail(email: string | null | undefined) {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    return false;
  }

  const ownerEmails = getOwnerEmails();
  if (!ownerEmails.length) {
    return true;
  }

  return ownerEmails.includes(normalized);
}

export function canAccessOwnerDashboard(user: Pick<AuthUser, "email"> | null | undefined) {
  if (!user) {
    return false;
  }

  return isOwnerEmail(user.email);
}
