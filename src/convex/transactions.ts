import { getAuthUserId } from "@convex-dev/auth/server";
import {
  mutation,
  query,
  QueryCtx,
  MutationCtx,
} from "./_generated/server";
import { v } from "convex/values";
import { getSessionOfTheDay } from "./customers";

async function requireUser(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    throw new Error("Not authenticated");
  }
  return userId;
}

// Full ledger for one customer, newest first.
export const listForCustomer = query({
  args: { customerId: v.id("customers") },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const customer = await ctx.db.get(args.customerId);
    if (!customer || customer.userId !== userId) return null;
    const txs = await ctx.db
      .query("transactions")
      .withIndex("by_customer_and_time", (q) =>
        q.eq("customerId", args.customerId),
      )
      .order("desc")
      .collect();
    return txs;
  },
});

// Daily ledger view across the whole shop for a specific day.
export const dailyLedger = query({
  args: { day: v.string() }, // "YYYY-MM-DD" (local)
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const txs = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const dayTxs = txs
      .filter((t) => toLocalDateKey(t.occurredAt) === args.day)
      .sort((a, b) => b.occurredAt - a.occurredAt);

    const customers = await ctx.db
      .query("customers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const nameOf = new Map(customers.map((c) => [c._id, c.name] as const));

    return dayTxs.map((t) => ({ ...t, customerName: nameOf.get(t.customerId) ?? "Unknown" }));
  },
});

function toLocalDateKey(ms: number): string {
  const d = new Date(ms);
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export const add = mutation({
  args: {
    customerId: v.id("customers"),
    direction: v.union(v.literal("credit"), v.literal("payment")),
    kind: v.union(v.literal("credit"), v.literal("cash")),
    amount: v.number(),
    items: v.optional(v.string()),
    collectorName: v.optional(v.string()),
    collectorRelation: v.optional(v.string()),
    session: v.optional(v.string()),
    occurredAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const customer = await ctx.db.get(args.customerId);
    if (!customer || customer.userId !== userId) {
      throw new Error("Customer not found");
    }
    if (!(args.amount > 0)) throw new Error("Amount must be greater than zero");
    const amount = Math.round(args.amount * 100) / 100;
    const occurredAt = args.occurredAt ?? Date.now();
    await ctx.db.insert("transactions", {
      userId,
      customerId: args.customerId,
      direction: args.direction,
      kind: args.kind,
      amount,
      items: args.items?.trim() || undefined,
      collectorName: args.collectorName?.trim() || undefined,
      collectorRelation: args.collectorRelation?.trim() || undefined,
      session: args.session || getSessionOfTheDay(occurredAt),
      occurredAt,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("transactions") },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const tx = await ctx.db.get(args.id);
    if (!tx || tx.userId !== userId) throw new Error("Transaction not found");
    await ctx.db.delete(args.id);
  },
});

// Shop settings (single row per user).
export const getSettings = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    return await ctx.db
      .query("settings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
  },
});

export const saveSettings = mutation({
  args: { shopName: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const shopName = args.shopName.trim() || "My Shop";
    const existing = await ctx.db
      .query("settings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { shopName });
    } else {
      await ctx.db.insert("settings", { userId, shopName });
    }
  },
});
