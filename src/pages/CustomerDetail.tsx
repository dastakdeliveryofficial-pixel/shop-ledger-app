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
import {
  formatDate,
  formatCurrency,
  formatDateTime,
  sessionIcon,
} from "@/lib/ledger";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowDownToLine,
  ChevronLeft,
  Loader2,
  MapPin,
  MessageCircle,
  NotebookPen,
  Pencil,
  Trash2,
  Archive,
  ArchiveRestore,
} from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const customerId = id as Id<"customers">;

  const settings = useQuery(api.transactions.getSettings);
  const customer = useQuery(api.customers.get, { id: customerId });
  const txs = useQuery(api.transactions.listForCustomer, { customerId });

  const [editOpen, setEditOpen] = useState(false);
  const [txDialog, setTxDialog] = useState<null | "credit" | "payment">(null);
  const [waOpen, setWaOpen] = useState(false);
  const removeTx = useMutation(api.transactions.remove);
  const archiveCustomer = useMutation(api.customers.archive);

  if (customer === undefined || txs === undefined) {
    return (
      <LedgerShell>
        <div className="flex items-center justify-center py-32 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
        </div>
      </LedgerShell>
    );
  }

  if (customer === null) {
    return (
      <LedgerShell>
        <div className="flex flex-col items-center gap-4 py-32 text-center">
          <p className="text-sm font-medium">Customer not found</p>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            Back to dashboard
          </Button>
        </div>
      </LedgerShell>
    );
  }

  const ledger = txs ?? [];

  const creditTotal = ledger
    .filter((t) => t.direction === "credit")
    .reduce((s, t) => s + t.amount, 0);
  const paidTotal = ledger
    .filter((t) => t.direction === "payment")
    .reduce((s, t) => s + t.amount, 0);
  const balance = Math.round((creditTotal - paidTotal) * 100) / 100;

  // Group ledger entries by local day, newest first (ledger is desc).
  const groups: {
    key: string;
    label: string;
    entries: typeof ledger;
  }[] = [];
  for (const t of ledger) {
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

  const handleDeleteTx = async (txId: Id<"transactions">) => {
    try {
      await removeTx({ id: txId });
      toast.success("Entry removed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not remove entry");
    }
  };

  const handleToggleArchive = async () => {
    try {
      await archiveCustomer({ id: customer._id, archived: !customer.archived });
      toast.success(customer.archived ? "Account restored" : "Account archived");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    }
  };

  return (
    <LedgerShell shopName={settings?.shopName ?? ""}>
      <div className="flex flex-col gap-8">
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          All customers
        </button>

        {/* Customer header */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-full border border-border text-xl font-medium">
              {customer.name.trim().charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-medium tracking-tight">
                  {customer.name}
                </h1>
                {customer.archived && (
                  <Badge
                    variant="outline"
                    className="text-[10px] uppercase tracking-wide"
                  >
                    Archived
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-sm tabular-nums text-muted-foreground">
                {customer.phone}
              </p>
              {customer.address ? (
                <p className="mt-0.5 flex items-start gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="mt-0.5 size-3.5 shrink-0" />
                  <span className="max-w-md">{customer.address}</span>
                </p>
              ) : null}
              {customer.note ? (
                <p className="mt-2 flex items-start gap-1.5 text-sm italic text-muted-foreground">
                  <NotebookPen className="mt-0.5 size-3.5 shrink-0" />
                  {customer.note}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setEditOpen(true)} aria-label="Edit customer">
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleArchive}
              aria-label={customer.archived ? "Restore account" : "Archive account"}
            >
              {customer.archived ? (
                <ArchiveRestore className="size-4" />
              ) : (
                <Archive className="size-4" />
              )}
            </Button>
            <Button variant="outline" onClick={() => setTxDialog("payment")}>
              <ArrowDownToLine className="size-4" />
              Payment
            </Button>
            <Button variant="outline" onClick={() => setTxDialog("credit")}>
              <NotebookPen className="size-4" />
              New entry
            </Button>
            <Button onClick={() => setWaOpen(true)}>
              <MessageCircle className="size-4" />
              Send statement
            </Button>
          </div>
        </div>

        {/* Balance strip */}
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border/70 bg-border/70 sm:grid-cols-3">
          <div className="bg-background p-5">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              Outstanding balance
            </p>
            <p className="mt-1.5 text-2xl font-medium tabular-nums tracking-tight">
              {formatCurrency(balance)}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {balance > 0
                ? "Customer owes the shop"
                : balance < 0
                  ? "Advance with the shop"
                  : "Fully settled"}
            </p>
          </div>
          <div className="bg-background p-5">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              Total credit taken
            </p>
            <p className="mt-1.5 text-2xl font-medium tabular-nums tracking-tight">
              {formatCurrency(creditTotal)}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Lifetime purchases on credit
            </p>
          </div>
          <div className="bg-background p-5">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              Total repaid
            </p>
            <p className="mt-1.5 text-2xl font-medium tabular-nums tracking-tight">
              {formatCurrency(paidTotal)}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Payments received so far
            </p>
          </div>
        </div>

        {/* Ledger */}
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Ledger history
          </h2>
          {groups.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
              <p className="text-sm font-medium">No entries yet</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Record the first credit or cash entry for this account.
              </p>
              <Button variant="outline" onClick={() => setTxDialog("credit")}>
                <NotebookPen className="size-4" />
                New entry
              </Button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border/70">
              {groups.map((g) => (
                <div key={g.key}>
                  <div className="border-b border-border/70 bg-muted/40 px-4 py-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground sm:px-5">
                    {g.label}
                  </div>
                  <ul className="divide-y divide-border/70">
                    {g.entries.map((t) => (
                      <li
                        key={t._id}
                        className="group flex items-start gap-3 px-4 py-3.5 sm:px-5"
                      >
                        <div className="w-24 shrink-0">
                          <p className="text-xs tabular-nums text-muted-foreground">
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
                              "text-sm font-medium tabular-nums " +
                              (t.direction === "credit"
                                ? "text-foreground"
                                : "text-muted-foreground")
                            }
                          >
                            {t.direction === "credit" ? "+" : "−"}
                            {formatCurrency(t.amount)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
                            aria-label="Delete entry"
                            onClick={() => handleDeleteTx(t._id)}
                          >
                            <Trash2 className="size-3.5 text-muted-foreground" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <CustomerDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        initial={{
          id: customer._id,
          name: customer.name,
          phone: customer.phone,
          address: customer.address,
          note: customer.note,
        }}
      />
      <TransactionDialog
        open={txDialog !== null}
        onOpenChange={(o) => !o && setTxDialog(null)}
        customer={{ id: customer._id, name: customer.name }}
        presetCustomer
        defaultDirection={txDialog ?? "credit"}
      />
      <WhatsAppDialog
        open={waOpen}
        onOpenChange={setWaOpen}
        customer={{
          id: customer._id,
          name: customer.name,
          phone: customer.phone,
          balance,
        }}
        shopName={settings?.shopName}
      />
    </LedgerShell>
  );
}
