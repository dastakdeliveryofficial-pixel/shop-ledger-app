import { formatDate, formatDateTime, sessionIcon } from "@/lib/ledger";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { Trash2 } from "lucide-react";

type Tx = Doc<"transactions">;

/**
 * Shared ledger rendering used by the shop console and the customer portal:
 * groups entries by day, newest first, with session, collector and items.
 */
export function LedgerTimeline({
  txs,
  title = "Ledger history",
  onDelete,
}: {
  txs: Tx[];
  title?: string;
  onDelete?: (id: Id<"transactions">) => void;
}) {
  // Group entries by local day (input is newest-first).
  const groups: { key: string; label: string; entries: Tx[] }[] = [];
  for (const t of txs) {
    const key = new Date(t.occurredAt).toDateString();
    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.entries.push(t);
    } else {
      groups.push({
        key,
        label:
          key === new Date().toDateString()
            ? "Today"
            : formatDate(t.occurredAt),
        entries: [t],
      });
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="label-tech">{title}</h2>
      {groups.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <p className="text-sm font-medium">No entries yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Entries will appear here as soon as purchases or payments are
            recorded on this account.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/70">
          {groups.map((g) => (
            <div key={g.key}>
              <div className="border-b border-border/70 bg-muted/40 px-4 py-2 sm:px-5">
                <span className="label-tech">{g.label}</span>
              </div>
              <ul className="divide-y divide-border/70">
                {g.entries.map((t) => (
                  <li
                    key={t._id}
                    className="group flex items-start gap-3 px-4 py-3.5 sm:px-5"
                  >
                    <div className="w-24 shrink-0">
                      <p className="tnum text-xs text-muted-foreground">
                        {formatDateTime(t.occurredAt)}
                      </p>
                      {t.session ? (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {sessionIcon(t.session)} {t.session}
                        </p>
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        <span className="font-medium">
                          {t.direction === "payment"
                            ? "Payment received"
                            : t.kind === "cash"
                              ? "Cash purchase"
                              : "Credit purchase"}
                        </span>
                        {t.collectorName ? (
                          <span className="text-muted-foreground">
                            {" "}
                            · {t.collectorName}
                            {t.collectorRelation
                              ? ` (${t.collectorRelation})`
                              : ""}
                          </span>
                        ) : null}
                      </p>
                      {t.items ? (
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {t.items}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className={
                          "tnum text-sm font-medium " +
                          (t.direction === "credit"
                            ? "text-foreground"
                            : "text-muted-foreground")
                        }
                      >
                        {t.direction === "credit" ? "+" : "−"}
                        {t.amount.toLocaleString("en-IN", {
                          style: "currency",
                          currency: "INR",
                          maximumFractionDigits: 2,
                        })}
                      </span>
                      {onDelete && (
                        <button
                          type="button"
                          aria-label="Delete entry"
                          onClick={() => onDelete(t._id)}
                          className="rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
