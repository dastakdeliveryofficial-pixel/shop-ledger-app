import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { getSessionOfTheDay, SESSIONS, type Direction } from "@/lib/ledger";
import { useMutation, useQuery } from "convex/react";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const labelClass =
  "text-xs uppercase tracking-wide text-muted-foreground font-medium";

// ─── Customer dialog (add / edit) ────────────────────────────────────────────

export function CustomerDialog({
  open,
  onOpenChange,
  initial,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: {
    id: Id<"customers">;
    name: string;
    phone: string;
    address: string;
    note?: string;
  };
  onSaved?: (id: Id<"customers">) => void;
}) {
  const createCustomer = useMutation(api.customers.create);
  const updateCustomer = useMutation(api.customers.update);
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    phone: initial?.phone ?? "",
    address: initial?.address ?? "",
    note: initial?.note ?? "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        name: initial?.name ?? "",
        phone: initial?.phone ?? "",
        address: initial?.address ?? "",
        note: initial?.note ?? "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const save = async () => {
    if (!form.name.trim()) {
      toast.error("Customer name is required");
      return;
    }
    if (form.phone.replace(/\D/g, "").length < 7) {
      toast.error("Enter a valid phone number");
      return;
    }
    setSaving(true);
    try {
      if (initial) {
        await updateCustomer({
          id: initial.id,
          name: form.name,
          phone: form.phone,
          address: form.address,
          note: form.note || undefined,
        });
        toast.success("Customer updated");
        onOpenChange(false);
        onSaved?.(initial.id);
      } else {
        const id = await createCustomer({
          name: form.name,
          phone: form.phone,
          address: form.address,
          note: form.note || undefined,
        });
        toast.success(`${form.name} added to your ledger`);
        onOpenChange(false);
        onSaved?.(id);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-medium tracking-tight">
            {initial ? "Edit customer" : "New customer account"}
          </DialogTitle>
          <DialogDescription>
            The account holder is the person responsible for settling dues.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="cust-name" className={labelClass}>
              Account holder name
            </Label>
            <Input
              id="cust-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Mahboob"
              autoFocus
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="cust-phone" className={labelClass}>
              Primary phone (WhatsApp)
            </Label>
            <Input
              id="cust-phone"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="e.g. 9876543210"
              inputMode="tel"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="cust-address" className={labelClass}>
              Address
            </Label>
            <Textarea
              id="cust-address"
              value={form.address}
              onChange={(e) =>
                setForm((f) => ({ ...f, address: e.target.value }))
              }
              placeholder="House / street / area"
              rows={2}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="cust-note" className={labelClass}>
              Note <span className="normal-case">(optional)</span>
            </Label>
            <Input
              id="cust-note"
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              placeholder="e.g. Settles dues every Sunday"
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="button" onClick={save} disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            {initial ? "Save changes" : "Add customer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Transaction dialog (credit / cash / payment) ────────────────────────────

export function TransactionDialog({
  open,
  onOpenChange,
  customer,
  defaultDirection = "credit",
  presetCustomer = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: { id: Id<"customers">; name: string };
  defaultDirection?: Direction;
  presetCustomer?: boolean;
}) {
  const addTransaction = useMutation(api.transactions.add);
  const customers = useQuery(api.customers.list, {
    paginationOpts: { numItems: 500, cursor: null },
  });
  const [direction, setDirection] = useState<Direction>(defaultDirection);
  const [kind, setKind] = useState<"credit" | "cash">("credit");
  const [selected, setSelected] = useState<string>(customer?.id ?? "");
  const [amount, setAmount] = useState("");
  const [items, setItems] = useState("");
  const [collectorName, setCollectorName] = useState("");
  const [collectorRelation, setCollectorRelation] = useState("");
  const [session, setSession] = useState<string>(getSessionOfTheDay());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setDirection(defaultDirection);
      setKind("credit");
      setSelected(customer?.id ?? "");
      setAmount("");
      setItems("");
      setCollectorName("");
      setCollectorRelation("");
      setSession(getSessionOfTheDay());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, customer?.id, defaultDirection]);

  const options = customers?.page ?? [];
  const chosen = options.find((c) => c._id === selected);

  const save = async () => {
    const value = Number(amount);
    if (!selected) {
      toast.error("Choose a customer account");
      return;
    }
    if (!(value > 0)) {
      toast.error("Enter an amount greater than zero");
      return;
    }
    setSaving(true);
    try {
      await addTransaction({
        customerId: selected as Id<"customers">,
        direction,
        kind,
        amount: value,
        items: items || undefined,
        collectorName: collectorName || undefined,
        collectorRelation: collectorRelation || undefined,
        session,
      });
      toast.success(
        direction === "payment"
          ? "Payment recorded"
          : kind === "cash"
            ? "Cash sale recorded"
            : "Credit entry recorded",
      );
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-medium tracking-tight">
            {direction === "payment" ? "Record payment" : "New ledger entry"}
          </DialogTitle>
          <DialogDescription>
            {direction === "payment"
              ? "Money received against outstanding dues."
              : "Time and session are captured automatically."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {!presetCustomer && (
            <div className="grid gap-1.5">
              <Label className={labelClass}>Account</Label>
              <Select
                value={selected}
                onValueChange={setSelected}
                disabled={!!customer}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {options.map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {chosen && (
                <p className="text-xs text-muted-foreground">{chosen.phone}</p>
              )}
            </div>
          )}

          {direction !== "payment" && (
            <div className="grid gap-1.5">
              <Label className={labelClass}>Payment mode</Label>
              <div className="grid grid-cols-2 gap-2">
                {(["credit", "cash"] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setKind(k)}
                    className={
                      "rounded-md border px-3 py-2 text-sm transition-colors " +
                      (kind === k
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-background text-foreground hover:bg-accent")
                    }
                  >
                    {k === "credit" ? "On credit (udhaar)" : "Paid by cash"}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="tx-amount" className={labelClass}>
                Amount (₹)
              </Label>
              <Input
                id="tx-amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                inputMode="decimal"
                autoFocus
              />
            </div>
            <div className="grid gap-1.5">
              <Label className={labelClass}>Session</Label>
              <Select value={session} onValueChange={setSession}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SESSIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {direction !== "payment" && (
            <div className="grid gap-1.5">
              <Label htmlFor="tx-items" className={labelClass}>
                Items taken <span className="normal-case">(optional)</span>
              </Label>
              <Input
                id="tx-items"
                value={items}
                onChange={(e) => setItems(e.target.value)}
                placeholder="e.g. 2 kg rice, 1 L oil, soap"
              />
            </div>
          )}

          {direction !== "payment" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="tx-collector" className={labelClass}>
                  Collected by
                </Label>
                <Input
                  id="tx-collector"
                  value={collectorName}
                  onChange={(e) => setCollectorName(e.target.value)}
                  placeholder="Family member name"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="tx-relation" className={labelClass}>
                  Relation
                </Label>
                <Input
                  id="tx-relation"
                  value={collectorRelation}
                  onChange={(e) => setCollectorRelation(e.target.value)}
                  placeholder="e.g. Son, Wife"
                  list="relation-suggestions"
                />
                <datalist id="relation-suggestions">
                  <option value="Son" />
                  <option value="Daughter" />
                  <option value="Wife" />
                  <option value="Husband" />
                  <option value="Brother" />
                  <option value="Sister" />
                  <option value="Self" />
                </datalist>
              </div>
            </div>
          )}

          {direction !== "payment" && chosen && (
            <p className="text-xs leading-relaxed text-muted-foreground">
              Will be recorded under{" "}
              <span className="text-foreground">{chosen.name}</span>
              {collectorName ? (
                <>
                  {" "}
                  · collected by{" "}
                  <span className="text-foreground">{collectorName}</span>
                </>
              ) : null}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="button" onClick={save} disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            {direction === "payment" ? "Record payment" : "Save entry"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Shop name dialog ────────────────────────────────────────────────────────

export function ShopNameDialog({
  open,
  onOpenChange,
  current,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  current?: string;
}) {
  const saveSettings = useMutation(api.transactions.saveSettings);
  const [name, setName] = useState(current ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setName(current ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, current]);

  const save = async () => {
    setSaving(true);
    try {
      await saveSettings({ shopName: name || "My Shop" });
      toast.success("Shop name saved");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-medium tracking-tight">
            Shop name
          </DialogTitle>
          <DialogDescription>
            Shown on WhatsApp statements and reminders.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-1.5">
          <Label htmlFor="shop-name" className={labelClass}>
            Name
          </Label>
          <Input
            id="shop-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Krishna General Stores"
            autoFocus
          />
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="button" onClick={save} disabled={saving}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
