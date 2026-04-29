import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireUser } from "./auth";

export const list = query({
  args: { token: v.union(v.string(), v.null()) },
  handler: async (ctx, args) => {
    await requireUser(ctx, args.token);
    const users = await ctx.db.query("users").take(1000);
    return users.map((u) => ({ _id: u._id, name: u.name, email: u.email }));
  },
});
