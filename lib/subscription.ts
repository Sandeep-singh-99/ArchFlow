type Subscription = {
  subscription?: string;
  subscriptionExpiresAt?: number;
};

export function getActiveSubscription(account: Subscription | null | undefined, now = Date.now()): string {
  if (!account || (account.subscriptionExpiresAt !== undefined && account.subscriptionExpiresAt <= now)) {
    return "free";
  }

  const code = account.subscription?.trim().toLowerCase();
  if (code === "active") return "pro";
  if (code === "ai_unlimited") return "ai";
  return code || "free";
}
