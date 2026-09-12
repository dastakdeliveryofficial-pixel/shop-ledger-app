import { getAuthUserId } from "@convex-dev/auth/server";
import {
  mutation,
  query,
  QueryCtx,
  MutationCtx,
} from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";

export function normalizeEmail(raw?: string): string | undefined {
  const email = raw?.trim().toLowerCase();
  return email || undefined;
}

async function requireUser(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    throw new Error("Not authenticated");
  }
  return userId;
}

export const getSessionOfTheDay = (now: number): string => {
  const h = new Date(now).getHours();
  if (h < 12) return "Morning";
  if (h < 17) return "Afternoon";
  return "Evening/Night";
};

// List of customers with derived balance (credit purchases + old dues − payments).
export const list = query({
  args: {
    includeArchived: v.optional(v.boolean()),
    search: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const includeArchived = args.includeArchived ?? false;

    const customers = await ctx.db
      .query("customers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const visible = customers.filter((c) => includeArchived || !c.archived);

    const withDerived = await Promise.all(
      visible.map(async (c) => {
        const txs = await ctx.db
          .query("transactions")
          .withIndex("by_customer", (q) => q.eq("customerId", c._id))
          .collect();
        const lastAt = txs.reduce((m, t) => Math.max(m, t.occurredAt), 0);
        const creditTotal = txs
          .filter((t) => t.direction === "credit")
          .reduce((s, t) => s + t.amount, 0);
        const paidTotal = txs
          .filter((t) => t.direction === "payment")
          .reduce((s, t) => s + t.amount, 0);
        return {
          ...c,
          creditTotal,
          paidTotal,
          balance: Math.round((creditTotal - paidTotal) * 100) / 100,
          lastActivityAt: lastAt || c._creationTime,
        };
      }),
    );

    let filtered = withDerived;
    if (args.search) {
      const q = args.search.trim().toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q) ||
          c.address.toLowerCase().includes(q),
      );
    }

    filtered.sort((a, b) => b.lastActivityAt - a.lastActivityAt);

    const page = filtered.slice(
      args.paginationOpts.cursor
        ? Number(args.paginationOpts.cursor)
        : 0,
    );
    const sliced = page.slice(0, args.paginationOpts.numItems);
    const nextIdx =
      (args.paginationOpts.cursor ? Number(args.paginationOpts.cursor) : 0) +
      sliced.length;
    return {
      page: sliced,
      isDone: nextIdx >= filtered.length,
      continueCursor: String(nextIdx),
    };
  },
});

export const get = query({
  args: { id: v.id("customers") },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const customer = await ctx.db.get(args.id);
    if (!customer || customer.userId !== userId) return null;
    return customer;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.string(),
    address: v.string(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const name = args.name.trim();
    if (!name) throw new Error("Customer name is required");
    const phone = args.phone.replace(/[^\d+]/g, "");
    if (phone.replace(/\D/g, "").length < 7) {
      throw new Error("Enter a valid phone number (at least 7 digits)");
    }
    const email = normalizeEmail(args.email);
    if (email) {
      const existing = await ctx.db
        .query("customers")
        .withIndex("by_email", (q) => q.eq("email", email))
        .first();
      if (existing && existing.userId !== userId) {
        throw new Error(
          "That email is already linked to another shop's account",
        );
      }
    }
    const id = await ctx.db.insert("customers", {
      userId,
      name,
      phone,
      address: args.address.trim(),
      email,
      note: args.note?.trim() || undefined,
    });
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("customers"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const customer = await ctx.db.get(args.id);
    if (!customer || customer.userId !== userId) {
      throw new Error("Customer not found");
    }
    const patch: Partial<{
      name: string;
      email: string | undefined;
      phone: string;
      address: string;
      note: string | undefined;
    }> = {};
    if (args.name !== undefined) {
      const name = args.name.trim();
      if (!name) throw new Error("Customer name is required");
      patch.name = name;
    }
    if (args.phone !== undefined) {
      const phone = args.phone.replace(/[^\d+]/g, "");
      if (phone.replace(/\D/g, "").length < 7) {
        throw new Error("Enter a valid phone number (at least 7 digits)");
      }
      patch.phone = phone;
    }
    if (args.address !== undefined) patch.address = args.address.trim();
    if (args.email !== undefined) {
      const email = normalizeEmail(args.email);
      if (email) {
        const existing = await ctx.db
          .query("customers")
          .withIndex("by_email", (q) => q.eq("email", email))
          .first();
        if (existing && existing._id !== args.id) {
          throw new Error("That email is already linked to another account");
        }
      }
      patch.email = email;
    }
    if (args.note !== undefined) patch.note = args.note.trim() || undefined;
    await ctx.db.patch(args.id, patch);
  },
});

export const archive = mutation({
  args: { id: v.id("customers"), archived: v.boolean() },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const customer = await ctx.db.get(args.id);
    if (!customer || customer.userId !== userId) {
      throw new Error("Customer not found");
    }
    await ctx.db.patch(args.id, { archived: args.archived });
  },
});

export const remove = mutation({
  args: { id: v.id("customers") },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const customer = await ctx.db.get(args.id);
    if (!customer || customer.userId !== userId) {
      throw new Error("Customer not found");
    }
    const txs = await ctx.db
      .query("transactions")
      .withIndex("by_customer", (q) => q.eq("customerId", args.id))
      .collect();
    for (const t of txs) {
      await ctx.db.delete(t._id);
    }
    await ctx.db.delete(args.id);
  },
});

export const stats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const customers = await ctx.db
      .query("customers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const txs = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const creditTotal = txs
      .filter((t) => t.direction === "credit")
      .reduce((s, t) => s + t.amount, 0);
    const paidTotal = txs
      .filter((t) => t.direction === "payment")
      .reduce((s, t) => s + t.amount, 0);
    const cashToday = txs
      .filter(
        (t) =>
          t.direction === "credit" &&
          t.kind === "cash" &&
          new Date(t.occurredAt).toDateString() === new Date().toDateString(),
      )
      .reduce((s, t) => s + t.amount, 0);

    const balances = new Map<string, number>();
    for (const c of customers) {
      const ct = txs.filter(
        (t) => t.customerId === c._id && t.direction === "credit",
      );
      const pt = txs.filter(
        (t) => t.customerId === c._id && t.direction === "payment",
      );
      balances.set(
        c._id,
        ct.reduce((s, t) => s + t.amount, 0) -
          pt.reduce((s, t) => s + t.amount, 0),
      );
    }

    let activeCount = 0;
    for (const b of balances.values()) {
      if (Math.abs(b) >= 0.005) activeCount++;
    }

    return {
      customerCount: customers.length,
      activeCount,
      totalReceivable: Math.round((creditTotal - paidTotal) * 100) / 100,
      cashToday: Math.round(cashToday * 100) / 100,
      todayCount: txs.filter(
        (t) =>
          new Date(t.occurredAt).toDateString() === new Date().toDateString(),
      ).length,
    };
  },
});

// Customer-facing portal lookup: finds the account matching the signed-in
// user's email. Returns null when the signed-in user is not a customer.
export const myAccount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const user = await ctx.db.get(userId);
    const email = user?.email?.trim().toLowerCase();
    if (!email) return null;
    const customer = await ctx.db
      .query("customers")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    if (!customer) return null;
    const txs = await ctx.db
      .query("transactions")
      .withIndex("by_customer", (q) => q.eq("customerId", customer._id))
      .collect();
    const creditTotal = txs
      .filter((t) => t.direction === "credit")
      .reduce((s, t) => s + t.amount, 0);
    const paidTotal = txs
      .filter((t) => t.direction === "payment")
      .reduce((s, t) => s + t.amount, 0);
    const lastAt = txs.reduce((m, t) => Math.max(m, t.occurredAt), 0);
    return {
      customer: { ...customer, email: customer.email ?? null },
      balance: Math.round((creditTotal - paidTotal) * 100) / 100,
      creditTotal,
      paidTotal,
      entryCount: txs.length,
      lastActivityAt: lastAt || null,
    };}
});
