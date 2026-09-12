import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove
    }).index("email", ["email"]), // index for the email. do not remove or modify

    // ─── Shop ledger tables ────────────────────────────────────────────────

    // Customer / family accounts of the shop.
    customers: defineTable({
      userId: v.id("users"), // owning shopkeeper account
      name: v.string(), // primary account holder (e.g. "Mahboob")
      phone: v.string(), // primary phone number for WhatsApp reminders
      address: v.string(),
      note: v.optional(v.string()),
      archived: v.optional(v.boolean()),
    })
      .index("by_user", ["userId"])
      .index("by_user_and_archived", ["userId", "archived"]),

    // Every credit / cash entry recorded in the daily ledger.
    transactions: defineTable({
      userId: v.id("users"),
      customerId: v.id("customers"),
      direction: v.union(v.literal("credit"), v.literal("payment")),
      kind: v.union(v.literal("credit"), v.literal("cash")), // "cash" = settled on the spot
      amount: v.number(),
      items: v.optional(v.string()), // itemized description, e.g. "2kg rice, 1L oil"
      collectorName: v.optional(v.string()), // family member who picked up the items
      collectorRelation: v.optional(v.string()), // e.g. "Son", "Daughter", "Neighbour"
      session: v.optional(v.string()), // Morning | Afternoon | Evening/Night
      occurredAt: v.number(), // epoch ms the entry belongs to
    })
      .index("by_user", ["userId"])
      .index("by_customer", ["customerId"])
      .index("by_customer_and_time", ["customerId", "occurredAt"])
      .index("by_user_and_time", ["userId", "occurredAt"]),

    // Single-row-per-user settings (shop name used on statements).
    settings: defineTable({
      userId: v.id("users"),
      shopName: v.string(),
    }).index("by_user", ["userId"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
