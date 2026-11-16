import { MutationCtx, QueryCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Shared helper for verifying administrator privileges across Convex mutations.
 */
export async function verifyAdmin(
  ctx: {
    auth: { getUserIdentity: () => Promise<{ email?: string | null } | null> };
    db: MutationCtx["db"] | QueryCtx["db"];
  },
  adminUserId?: Id<"UserTable"> | string
) {
  // 1. Check ctx.auth.getUserIdentity() if available
  const identity = await ctx.auth.getUserIdentity();
  if (identity?.email) {
    const caller = await ctx.db
      .query("UserTable")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (caller && caller.role === "admin") {
      return caller;
    }
  }

  // 2. Check adminUserId if provided
  if (adminUserId) {
    const caller = await ctx.db.get(adminUserId as Id<"UserTable">);
    if (caller && caller.role === "admin") {
      // If identity is also present, ensure they match to prevent spoofing
      if (
        identity?.email &&
        caller.email &&
        caller.email.toLowerCase() !== identity.email.toLowerCase()
      ) {
        throw new Error("Forbidden: Session identity does not match admin credentials");
      }
      return caller;
    }
  }

  throw new Error("Forbidden: Administrator privileges required (user.role === 'admin')");
}
