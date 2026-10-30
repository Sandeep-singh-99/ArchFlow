import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const CreateNewUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    imageUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("UserTable")
      .filter((q) => q.eq(q.field("email"), args.email))
      .collect();

    if (user?.length === 0) {
      const userData = {
        name: args.name,
        email: args?.email,
        imageUrl: args.imageUrl,
        token: 5000,
      };

      const result = await ctx.db.insert("UserTable", userData);
      return result;
    }

    return user[0];
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
      .filter((q) => q.eq(q.field("email"), args.email))
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
