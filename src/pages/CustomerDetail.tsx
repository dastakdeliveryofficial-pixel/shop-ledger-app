import {
  CustomerDialog,
  TransactionDialog,
} from "@/components/ledger/dialogs";
import { LedgerShell } from "@/components/ledger/LedgerShell";
import { LedgerTimeline } from "@/components/ledger/LedgerTimeline";
import { MessageThread } from "@/components/ledger/MessageThread";
import { WhatsAppDialog } from "@/components/ledger/WhatsAppDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { formatCurrency } from "@/lib/ledger";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowDownToLine,
  Archive,
  ArchiveRestore,
  ChevronLeft,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  NotebookPen,
  Pencil,
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

  if (customer === undefined) {
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
              <p className="tnum mt-1 text-sm text-muted-foreground">
                {customer.phone}
              </p>
              {customer.email ? (
                <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Mail className="size-3.5 shrink-0" />
                  {customer.email}
                </p>
              ) : null}
              {customer.address ? (
                <p className="mt-0.5 flex items-start gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="mt-0.5 size-3.5 shrink-0" />
                  <span className="max-w-md">{customer.address}</span>
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setEditOpen(true)}
              aria-label="Edit customer"
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleArchive}
              aria-label={
                customer.archived ? "Restore account" : "Archive account"
              }
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
          <BalanceTile
            label="Outstanding balance"
            value={formatCurrency(balance)}
            sub={
              balance > 0
                ? "Customer owes the shop"
                : balance < 0
                  ? "Advance with the shop"
                  : "Fully settled"
            }
          />
          <BalanceTile
            label="Total credit taken"
            value={formatCurrency(creditTotal)}
            sub="Lifetime purchases on credit"
          />
          <BalanceTile
            label="Total repaid"
            value={formatCurrency(paidTotal)}
            sub="Payments received so far"
          />
        </div>

        {/* Ledger */}
        <LedgerTimeline
          txs={ledger}
          onDelete={handleDeleteTx}
        />

        {/* Messages */}
        <MessageThread customerId={customer._id} role="shop" />
      </div>

      <CustomerDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        initial={{
          id: customer._id,
          name: customer.name,
          email: customer.email,
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

function BalanceTile({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="bg-card/60 p-5">
      <p className="label-tech">{label}</p>
      <p className="tnum mt-1.5 text-2xl font-medium tracking-tight">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}
