import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import { ArrowUp, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type Message = Doc<"messages">;

/**
 * Two-sided thread between a customer and the shop.
 * The composer's role decides which send mutation is used.
 */
export function MessageThread({
  customerId,
  role,
}: {
  customerId: Id<"customers">;
  role: "customer" | "shop";
}) {
  const messages = useQuery(api.messages.list, { customerId });
  const sendCustomer = useMutation(api.messages.sendFromCustomer);
  const sendShop = useMutation(api.messages.sendFromShop);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const items: Message[] = messages ?? [];

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [items.length]);

  const send = async () => {
    const body = draft.trim();
    if (!body) return;
    setSending(true);
    try {
      if (role === "customer") {
        await sendCustomer({ customerId, body });
      } else {
        await sendShop({ customerId, body });
      }
      setDraft("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col rounded-xl border border-border/70">
      <div className="border-b border-border/70 px-4 py-2.5 sm:px-5">
        <span className="label-tech">
          {role === "customer" ? "Messages with the shop" : "Messages with customer"}
        </span>
      </div>

      <div className="flex max-h-96 min-h-40 flex-col gap-3 overflow-y-auto px-4 py-4 sm:px-5">
        {messages === undefined ? (
          <div className="flex flex-1 items-center justify-center text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <p className="my-auto text-center text-sm text-muted-foreground">
            {role === "customer"
              ? "No messages yet. Ask about your balance, an entry, or anything else — the shop replies here."
              : "No messages from this customer yet."}
          </p>
        ) : (
          items.map((m) => (
            <div
              key={m._id}
              className={cn(
                "flex flex-col gap-1",
                m.senderRole === role ? "items-end" : "items-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-lg border px-3.5 py-2.5 text-sm leading-relaxed",
                  m.senderRole === role
                    ? "border-border bg-secondary text-secondary-foreground"
                    : "border-border/70 bg-background text-foreground",
                )}
              >
                {m.body}
              </div>
              <span className="px-1 text-[11px] text-muted-foreground">
                {m.senderName} ·{" "}
                {new Date(m._creationTime).toLocaleString(undefined, {
                  day: "numeric",
                  month: "short",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>

      <div className="flex items-end gap-2 border-t border-border/70 p-3 sm:p-4">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          rows={2}
          placeholder={
            role === "customer"
              ? "Write to the shop…"
              : "Reply to the customer…"
          }
          className="max-h-32 min-h-[44px] flex-1 resize-y rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none transition-shadow placeholder:text-muted-foreground/70 focus-visible:ring-[3px] focus-visible:ring-ring/30"
        />
        <Button
          size="icon"
          onClick={send}
          disabled={sending || !draft.trim()}
          aria-label="Send message"
        >
          {sending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ArrowUp className="size-4" />
          )}
        </Button>
      </div>
    </div
    >
  );
}
