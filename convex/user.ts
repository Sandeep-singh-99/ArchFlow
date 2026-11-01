import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const CreateNewUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    imageUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("UserTable")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      const userData = {
        name: args.name,
        email: args.email,
        imageUrl: args.imageUrl,
        token: 5000,
        role: "user", // Default role set to "user"
      };

      const id = await ctx.db.insert("UserTable", userData);
      return { _id: id, ...userData };
    }

    // Backfill legacy users missing role field to default "user"
    if (!user.role) {
      await ctx.db.patch(user._id, { role: "user" });
      return { ...user, role: "user" };
    }

    return user;
  },
});

export const GetUserByEmail = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("UserTable")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

export const SetUserRole = mutation({
  args: {
    email: v.string(),
    role: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("UserTable")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (user) {
      await ctx.db.patch(user._id, { role: args.role });
      return { success: true, role: args.role };
    }
    return { success: false };
  },
});

export const UpdateUserSubscription = mutation({
  args: {
    email: v.string(),
    subscription: v.string(),
  },
  handler: async (ctx, args) => {
    const users = await ctx.db
      .query("UserTable")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .collect();

    if (users && users.length > 0) {
      await ctx.db.patch(users[0]._id, {
        subscription: args.subscription,
        token: 999999,
      });
      return { success: true };
    }
    return { success: false };
  },
});
