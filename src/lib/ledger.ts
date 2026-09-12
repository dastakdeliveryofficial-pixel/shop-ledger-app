// Shared helpers for the shop ledger: currency, sessions, dates,
// phone normalization and WhatsApp statement building.

export type Direction = "credit" | "payment";
export type LedgerKind = "credit" | "cash";
export type SessionName = "Morning" | "Afternoon" | "Evening/Night";

export function formatCurrency(amount: number): string {
  const rounded = Math.round(amount * 100) / 100;
  const formatted = rounded.toLocaleString("en-IN", {
    minimumFractionDigits: rounded % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `₹${formatted}`;
}

export function getSessionOfTheDay(now: number = Date.now()): SessionName {
  const h = new Date(now).getHours();
  if (h < 12) return "Morning";
  if (h < 17) return "Afternoon";
  return "Evening/Night";
}

export const SESSIONS: SessionName[] = [
  "Morning",
  "Afternoon",
  "Evening/Night",
];

export function sessionIcon(name: string): string {
  if (name === "Morning") return "☀";
  if (name === "Afternoon") return "🌤";
  return "🌙";
}

export function formatTime(ms: number): string {
  return new Date(ms).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(ms: number): string {
  const sameDay =
    new Date(ms).toDateString() === new Date().toDateString();
  return sameDay
    ? `Today, ${formatTime(ms)}`
    : `${formatDate(ms)}, ${formatTime(ms)}`;
}

/** Strip everything but digits/+, and ensure a wa.me-friendly number. */
export function normalizePhone(raw: string): string {
  let digits = raw.replace(/[^\d+]/g, "").replace(/^\+/, "");
  // Local numbers starting with 0 → assume India (+91) as a sane default.
  if (digits.startsWith("0")) digits = `91${digits.slice(1)}`;
  if (digits.length === 10) digits = `91${digits}`;
  return digits;
}

export function waMeLink(phone: string, message: string): string {
  return `https://wa.me/${normalizePhone(phone)}?text=${encodeURIComponent(message)}`;
}

// ─── WhatsApp messages ────────────────────────────────────────────────────────

export interface StatementTx {
  direction: Direction;
  kind: LedgerKind;
  amount: number;
  items?: string;
  collectorName?: string;
  collectorRelation?: string;
  session?: string;
  occurredAt: number;
}

interface StatementOptions {
  shopName?: string;
  /** Only include credit entries from the last N days. */
  days?: number;
}

export function buildStatementMessage(
  customerName: string,
  balance: number,
  txs: StatementTx[],
  options: StatementOptions = {},
): string {
  const shop = options.shopName?.trim() || "Mahboob Home Mart";
  const days = options.days ?? 14;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

  const creditRows = txs.filter(
    (t) => t.direction === "credit" && t.occurredAt >= cutoff,
  );

  const lines: string[] = [];
  lines.push(`Hello ${customerName},`);
  lines.push("");
  lines.push(`Ledger summary from ${shop}:`);
  lines.push("");

  if (creditRows.length === 0) {
    lines.push("No recent credit purchases in the last period.");
  } else {
    lines.push("Recent purchases:");
    for (const t of creditRows.slice(0, 12)) {
      const items = t.items ? ` — ${t.items}` : "";
      const who = t.collectorName
        ? ` (collected by ${t.collectorName}${t.collectorRelation ? `, ${t.collectorRelation}` : ""})`
        : "";
      lines.push(
        `• ${formatDate(t.occurredAt)}${items}${who} — ${formatCurrency(t.amount)}`,
      );
    }
  }

  lines.push("");
  lines.push(
    `*Current outstanding balance: ${formatCurrency(balance)}*`,
  );
  lines.push("");
  lines.push(
    "Kindly arrange to settle the dues at your convenience. Please ignore this message if you have already paid — thank you! 🙏",
  );
  lines.push("");
  lines.push(`— ${shop}`);

  return lines.join("\n");
}

export function buildReminderMessage(
  customerName: string,
  balance: number,
  options: StatementOptions = {},
): string {
  const shop = options.shopName?.trim() || "Mahboob Home Mart";
  return [
    `Hello ${customerName},`,
    "",
    `This is a gentle payment reminder from ${shop}.`,
    `Your current outstanding balance is *${formatCurrency(balance)}*.`,
    "",
    "Please pay at your convenience. If you have already settled it, kindly ignore this message. Thank you! 🙏",
    "",
    `— ${shop}`,
  ].join("\n");
}
