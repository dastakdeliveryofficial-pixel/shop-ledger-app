import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  buildReminderMessage,
  buildStatementMessage,
  formatCurrency,
  waMeLink,
} from "@/lib/ledger";
import { useQuery } from "convex/react";
import { Loader2, MessageCircle, NotebookPen } from "lucide-react";
import { useMemo, useState } from "react";

/**
 * Opens WhatsApp with a pre-formatted statement or payment reminder.
 * Subscribes live to the customer's ledger so the preview is always current.
 */
export function WhatsAppDialog({
  open,
  onOpenChange,
  customer,
  shopName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: { id: Id<"customers">; name: string; phone: string; balance: number };
  shopName?: string;
}) {
  const [mode, setMode] = useState<"statement" | "reminder">("statement");

  const txs = useQuery(
    api.transactions.listForCustomer,
    open ? { customerId: customer.id } : "skip",
  );

  const message = useMemo(() => {
    if (mode === "reminder") {
      return buildReminderMessage(customer.name, customer.balance, {
        shopName,
      });
    }
    return buildStatementMessage(
      customer.name,
      customer.balance,
      txs ?? [],
      { shopName },
    );
  }, [mode, txs, customer.name, customer.balance, shopName]);

  const href = waMeLink(customer.phone, message);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-medium tracking-tight">
            WhatsApp · {customer.name}
          </DialogTitle>
          <DialogDescription>
            {customer.phone} · balance{" "}
            <span className="font-medium text-foreground">
              {formatCurrency(customer.balance)}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="flex gap-1 rounded-lg border border-border p-1">
            {(
              [
                ["statement", "Full statement", NotebookPen],
                ["reminder", "Short reminder", MessageCircle],
              ] as const
            ).map(([value, label, Icon]) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                className={
                  "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors " +
                  (mode === value
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground")
                }
              >
                <Icon className="size-4" />
                {label}
              </button>
            ))}
          </div>

          <div className="rounded-lg border border-border/70 bg-muted/40 p-4">
            {mode === "statement" && txs === undefined ? (
              <div className="flex items-center justify-center py-6 text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
              </div>
            ) : (
              <pre className="max-h-64 overflow-auto whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {message}
              </pre>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            This opens WhatsApp with the message pre-filled — nothing is sent
            automatically. Review, then press send in WhatsApp.
          </p>
        </div>

        <Button asChild className="w-full">
          <a href={href} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="size-4" />
            Open WhatsApp
          </a>
        </Button>
      </DialogContent>
    </Dialog>
  );
}
