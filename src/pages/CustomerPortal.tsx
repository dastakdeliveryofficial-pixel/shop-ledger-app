import { LedgerTimeline } from "@/components/ledger/LedgerTimeline";
import { MessageThread } from "@/components/ledger/MessageThread";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency } from "@/lib/ledger";
import { useQuery } from "convex/react";
import { BookOpenText, LogOut, ShieldCheck } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router";

export default function CustomerPortal() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const account = useQuery(api.customers.myAccount);

  // The ledger lives in the shop's data; reuse listForCustomer once we know
  // the account id. Skip while account is still loading.
  const txs = useQuery(
    api.transactions.listForCustomer,
    account?.customer
      ? { customerId: account.customer._id }
      : "skip",
  );
  const shopSettings = useQuery(api.transactions.getSettings);

  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    navigate("/");
  };

  if (account === undefined) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading your account…</p>
      </main>
    );
  }

  // Signed in, but no customer account is linked to this email yet.
  if (account === null) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <span className="flex size-12 items-center justify-center rounded-md border border-border/70">
          <ShieldCheck className="size-5" />
        </span>
        <h1 className="text-xl font-medium tracking-tight">
          No account linked yet
        </h1>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          This email isn't connected to a customer account at Mahboob Home
          Mart yet. Ask the shop to add{" "}
          <span className="tnum text-foreground">{user?.email}</span> to your
          family account — then sign in again.
        </p>
        <Button variant="outline" onClick={handleSignOut}>
          Sign out
        </Button>
      </main>
    );
  }

  const { customer, balance, creditTotal, paidTotal, entryCount } = account;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-4xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border/70 bg-card">
              <BookOpenText className="size-4" strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {shopSettings?.shopName ?? "Mahboob Home Mart"}
              </p>
              <p className="label-tech truncate leading-tight">
                Customer portal
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="hidden max-w-44 truncate text-sm text-muted-foreground sm:block">
              {customer.name}
            </span>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Sign out"
              onClick={handleSignOut}
              disabled={signingOut}
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-4 pb-24 pt-8 sm:px-6">
        <div className="flex flex-col gap-8">
          {/* Header */}
          <div className="flex flex-col gap-1.5">
            <p className="label-tech">Your account</p>
            <h1 className="text-2xl font-medium tracking-tight sm:text-3xl">
              {customer.name}
            </h1>
            <p className="tnum text-sm text-muted-foreground">
              {customer.phone}
              {customer.address ? ` · ${customer.address}` : ""}
            </p>
          </div>

          {/* Balance tiles */}
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border/70 bg-border/70 sm:grid-cols-3">
            <PortalTile
              label="Outstanding balance"
              value={formatCurrency(balance)}
              sub={
                balance > 0
                  ? "Payable at the counter or via UPI"
                  : balance < 0
                    ? "Advance with the shop"
                    : "Fully settled — thank you"
              }
            />
            <PortalTile
              label="Purchases on credit"
              value={formatCurrency(creditTotal)}
              sub={`${entryCount} ledger entries in total`}
            />
            <PortalTile
              label="Repaid so far"
              value={formatCurrency(paidTotal)}
              sub="Payments recorded by the shop"
            />
          </div>

          {/* Ledger */}
          <LedgerTimeline txs={txs ?? []} title="Your ledger" />

          {/* Messages */}
          <MessageThread customerId={customer._id} role="customer" />

          <p className="text-xs leading-relaxed text-muted-foreground">
            Amounts are maintained by the shop. Spot something that doesn't
            look right? Send a message above and the shop will reconcile it
            with you.
          </p>
        </div>
      </main>
    </div>
  );
}

function PortalTile({
  label,
  value,
  sub,
}: {
  label: string;
  value: ReactNode;
  sub?: string;
}) {
  return (
    <div className="bg-card/60 p-5">
      <p className="label-tech">{label}</p>
      <p className="tnum mt-1.5 text-2xl font-medium tracking-tight">
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
