import { getAuthUserId } from "@convex-dev/auth/server";
import {
  mutation,
  query,
  QueryCtx,
  MutationCtx,
} from "./_generated/server";
import { v } from "convex/values";

async function requireUser(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    throw new Error("Not authenticated");
  }
  return userId;
}

// Thread between a customer and the shop. Either party reads it:
//  - signed-in shop owner → any of their customers' threads
//  - signed-in customer  → only their own thread (matched by email)
export const list = query({
  args: { customerId: v.id("customers") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const user = await ctx.db.get(userId);

    const customer = await ctx.db.get(args.customerId);
    if (!customer) return null;

    const email = user?.email?.trim().toLowerCase();
    const isShopOwner = customer.userId === userId;
    const isCustomer =
      !!email && !!customer.email && email === customer.email;

    if (!isShopOwner && !isCustomer) return null;

    return await ctx.db
      .query("messages")
      .withIndex("by_customer", (q) => q.eq("customerId", args.customerId))
      .collect();
  },
});

// Customer sends a message on their own thread.
export const sendFromCustomer = mutation({
  args: {
    customerId: v.id("customers"),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const user = await ctx.db.get(userId);

    const customer = await ctx.db.get(args.customerId);
    if (!customer) throw new Error("Account not found");

    const email = user?.email?.trim().toLowerCase();
    if (!email || !customer.email || email !== customer.email) {
      throw new Error("You can only message from your own account");
    }

    const body = args.body.trim();
    if (!body) throw new Error("Message cannot be empty");
    if (body.length > 2000) throw new Error("Message is too long");

    await ctx.db.insert("messages", {
      customerId: args.customerId,
      senderRole: "customer",
      senderName: customer.name,
      body,
    });
  },
});

// Shop replies to a customer's thread.
export const sendFromShop = mutation({
  args: {
    customerId: v.id("customers"),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const customer = await ctx.db.get(args.customerId);
    if (!customer || customer.userId !== userId) {
      throw new Error("Customer not found");
    }
    const body = args.body.trim();
    if (!body) throw new Error("Message cannot be empty");
    if (body.length > 2000) throw new Error("Message is too long");

    const shopkeeper = await ctx.db.get(userId);
    await ctx.db.insert("messages", {
      customerId: args.customerId,
      senderRole: "shop",
      senderName: shopkeeper?.name ?? "Mahboob Home Mart",
      body,
    });
  },
});
