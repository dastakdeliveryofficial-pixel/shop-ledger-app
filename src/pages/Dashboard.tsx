import {
  CustomerDialog,
  TransactionDialog,
} from "@/components/ledger/dialogs";
import { LedgerShell } from "@/components/ledger/LedgerShell";
import { WhatsAppDialog } from "@/components/ledger/WhatsAppDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency, sessionIcon } from "@/lib/ledger";
import { useQuery } from "convex/react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Loader2,
  MessageCircle,
  Plus,
  Search,
  Users,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";

const localDayKey = (d = new Date()) => {
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const settings = useQuery(api.transactions.getSettings);
  const stats = useQuery(api.customers.stats);
  const todaysLedger = useQuery(api.transactions.dailyLedger, {
    day: localDayKey(),
  });
  const customers = useQuery(api.customers.list, {
    paginationOpts: { numItems: 500, cursor: null },
  });

  const [search, setSearch] = useState("");
  const [customerDialog, setCustomerDialog] = useState(false);
  const [txDialog, setTxDialog] = useState<null | {
    direction: "credit" | "payment";
  }>(null);
  const [waCustomer, setWaCustomer] = useState<null | {
    id: Id<"customers">;
    name: string;
    phone: string;
    balance: number;
  }>(null);

  const filtered = useMemo(() => {
    const list = customers?.page ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q),
    );
  }, [customers, search]);

  const shopName = settings?.shopName;

  return (
    <LedgerShell shopName={shopName ?? ""}>
      <div className="flex flex-col gap-8">
        {/* Heading + primary actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Daily ledger
            </p>
            <h1 className="mt-1.5 text-2xl font-medium tracking-tight sm:text-3xl">
              {(() => {
                const h = new Date().getHours();
                const part =
                  h < 12 ? "Morning" : h < 17 ? "Afternoon" : "Evening";
                return `${part}, ${user?.name?.split(" ")[0] || "shopkeeper"}`;
              })()}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setTxDialog({ direction: "credit" })}
            >
              <Plus className="size-4" />
              New entry
            </Button>
            <Button onClick={() => setCustomerDialog(true)}>
              <Plus className="size-4" />
              Customer
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border/70 bg-border/70 lg:grid-cols-4">
          <StatTile
            icon={<Wallet className="size-4" />}
            label="Total receivables"
            value={
              stats === undefined ? (
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              ) : (
                formatCurrency(stats.totalReceivable)
              )
            }
            sub={`${stats?.activeCount ?? "–"} accounts with dues`}
          />
          <StatTile
            icon={<Users className="size-4" />}
            label="Customer accounts"
            value={stats === undefined ? "–" : String(stats.customerCount)}
            sub={`${stats?.todayCount ?? 0} entries today`}
          />
          <StatTile
            icon={<ArrowDownRight className="size-4" />}
            label="Cash sales today"
            value={stats === undefined ? "–" : formatCurrency(stats.cashToday)}
            sub="Settled on the spot"
          />
          <StatTile
            icon={<ArrowUpRight className="size-4" />}
            label="Credit today"
            value={
              stats === undefined
                ? "–"
                : formatCurrency(
                    (todaysLedger ?? [])
                      .filter(
                        (t) =>
                          t.direction === "credit" && t.kind === "credit",
                      )
                      .reduce((s, t) => s + t.amount, 0),
                  )
            }
            sub="Added to dues"
          />
        </div>

        {/* Search + customer list */}
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Customers
            </h2>
            <div className="relative w-full sm:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, phone or address…"
                className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none transition-shadow placeholder:text-muted-foreground/70 focus-visible:ring-[3px] focus-visible:ring-ring/30"
              />
            </div>
          </div>

          {customers === undefined ? (
            <div className="flex items-center justify-center rounded-xl border border-dashed py-16 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
              <p className="text-sm font-medium">
                {search ? "No customers match your search" : "No customers yet"}
              </p>
              <p className="max-w-sm text-sm text-muted-foreground">
                {search
                  ? "Try a different name, phone number or address."
                  : "Add your first customer account to start recording credit and cash entries."}
              </p>
              {!search && (
                <Button variant="outline" onClick={() => setCustomerDialog(true)}>
                  <Plus className="size-4" />
                  Add customer
                </Button>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-border/70 overflow-hidden rounded-xl border border-border/70">
              {filtered.map((c) => (
                <li
                  key={c._id}
                  className="group flex cursor-pointer items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/40 sm:px-5"
                  onClick={() => navigate(`/customer/${c._id}`)}
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-background text-sm font-medium">
                    {c.name.trim().charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">{c.name}</p>
                      {c.archived && (
                        <Badge
                          variant="outline"
                          className="text-[10px] uppercase tracking-wide"
                        >
                          Archived
                        </Badge>
                      )}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {c.phone}
                      {c.address ? ` · ${c.address}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium tabular-nums">
                        {formatCurrency(c.balance)}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {c.balance > 0
                          ? "due"
                          : c.balance < 0
                            ? "advance"
                            : "settled"}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      aria-label={`Send WhatsApp reminder to ${c.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setWaCustomer({
                          id: c._id,
                          name: c.name,
                          phone: c.phone,
                          balance: c.balance,
                        });
                      }}
                    >
                      <MessageCircle className="size-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Today's ledger */}
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Today&apos;s entries
          </h2>
          {todaysLedger === undefined ? (
            <div className="flex items-center justify-center rounded-xl border border-dashed py-12 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : todaysLedger.length === 0 ? (
            <div className="rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
              Nothing recorded yet today.
            </div>
          ) : (
            <ul className="divide-y divide-border/70 overflow-hidden rounded-xl border border-border/70">
              {todaysLedger.slice(0, 8).map((t) => (
                <li
                  key={t._id}
                  className="flex items-center gap-3 px-4 py-3 sm:px-5"
                >
                  <span className="w-14 shrink-0 text-xs text-muted-foreground tabular-nums">
                    {new Date(t.occurredAt).toLocaleTimeString(undefined, {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="hidden w-24 shrink-0 text-xs text-muted-foreground sm:block">
                    {sessionIcon(t.session ?? "")} {t.session ?? ""}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm">
                    <span className="font-medium">{t.customerName}</span>
                    {t.collectorName ? (
                      <span className="text-muted-foreground">
                        {" "}
                        · via {t.collectorName}
                        {t.collectorRelation ? ` (${t.collectorRelation})` : ""}
                      </span>
                    ) : null}
                    {t.items ? (
                      <span className="block truncate text-xs text-muted-foreground">
                        {t.items}
                      </span>
                    ) : null}
                  </span>
                  <span className="shrink-0 text-sm font-medium tabular-nums">
                    {t.direction === "credit" ? "+" : "−"}
                    {formatCurrency(t.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <CustomerDialog open={customerDialog} onOpenChange={setCustomerDialog} />
      <TransactionDialog
        open={txDialog !== null}
        onOpenChange={(o) => !o && setTxDialog(null)}
        defaultDirection={txDialog?.direction ?? "credit"}
      />
      <WhatsAppDialog
        open={waCustomer !== null}
        onOpenChange={(o) => !o && setWaCustomer(null)}
        customer={
          waCustomer ?? {
            id: "" as Id<"customers">,
            name: "",
            phone: "",
            balance: 0,
          }
        }
        shopName={shopName}
      />
    </LedgerShell>
  );
}

function StatTile({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: string;
}) {
  return (
    <div className="flex flex-col gap-1 bg-background p-4 sm:p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs uppercase tracking-[0.14em]">{label}</span>
      </div>
      <div className="mt-1 text-xl font-medium tabular-nums tracking-tight sm:text-2xl">
        {value}
      </div>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
