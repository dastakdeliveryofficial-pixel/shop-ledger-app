import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  ArrowRight,
  Clock3,
  MessageCircle,
  MessagesSquare,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router";

const features = [
  {
    icon: Users,
    title: "Accounts built around families",
    body: "Credit is held under the account holder's name, while every entry records exactly which family member picked up the items — so nothing is ever ambiguous at settlement time.",
  },
  {
    icon: Clock3,
    title: "Time-stamped by session",
    body: "Each purchase is logged with the precise time and the part of the day it happened: morning, afternoon, or evening and night. Disputes end before they start.",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp statements on demand",
    body: "One tap opens WhatsApp with an itemized statement, the running balance, and a courteous reminder already written. No drafting, no screenshots, no awkward calls.",
  },
  {
    icon: Search,
    title: "Search that answers instantly",
    body: "Pull any family's complete purchase history and current dues by name, phone number, or address — the answer arrives as fast as you can type it.",
  },
];

const portalFeatures = [
  {
    icon: ShieldCheck,
    title: "A private view of your account",
    body: "Sign in with the email the shop has on file and see your outstanding balance, every credit entry, and each payment you've made — no counter visits required.",
  },
  {
    icon: MessagesSquare,
    title: "Message the shop directly",
    body: "Question a line item, ask for your balance, or say when you'll settle up. The thread stays attached to your account, visible to both sides.",
  },
];

export default function Landing() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  const primaryAction = () => navigate(isAuthenticated ? "/dashboard" : "/auth");

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-md border border-border/70 bg-card">
              <span className="text-[13px] font-semibold tracking-tight">M</span>
            </span>
            <span className="text-sm font-medium tracking-tight">
              Mahboob Home Mart
            </span>
          </div>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#console" className="transition-colors hover:text-foreground">
              For the shop
            </a>
            <a href="#portal" className="transition-colors hover:text-foreground">
              For customers
            </a>
          </nav>
          <div className="flex items-center gap-2">
            {!isLoading && isAuthenticated && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/dashboard")}
              >
                Open dashboard
              </Button>
            )}
            <Button size="sm" onClick={primaryAction}>
              {isAuthenticated ? "Dashboard" : "Sign in"}
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/70">
        <div className="bg-blueprint pointer-events-none absolute inset-0" />
        <div className="relative mx-auto w-full max-w-5xl px-4 pb-20 pt-20 sm:px-6 sm:pt-28">
          <div className="max-w-2xl">
            <p className="label-tech">
              Grocery &amp; convenience · Ledger portal
            </p>
            <h1 className="mt-5 text-4xl font-medium leading-[1.08] tracking-tight sm:text-6xl">
              Every rupee on the books.
              <br />
              <span className="text-muted-foreground">
                Every family accounted for.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Mahboob Home Mart runs its daily credit ledger on precise,
              session-tracked records. Families see their balance and full
              history in a private portal, and settle dues with a single
              WhatsApp statement — no notebooks, no guesswork.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Button size="lg" onClick={primaryAction}>
                {isAuthenticated ? "Open your dashboard" : "Sign in to continue"}
                <ArrowRight className="size-4" />
              </Button>
              <p className="text-xs text-muted-foreground">
                Shop console and customer portal in one system.
              </p>
            </div>
          </div>

          {/* Ledger preview */}
          <div className="relative mt-16 overflow-hidden rounded-xl border border-border/70 bg-card/50 backdrop-blur sm:mt-20">
            <div className="grid grid-cols-2 gap-px bg-border/70 sm:grid-cols-4">
              {[
                ["Total receivables", "₹12,480"],
                ["Accounts with dues", "18"],
                ["Entries today", "27"],
                ["Cash today", "₹3,120"],
              ].map(([label, value]) => (
                <div key={label} className="bg-background/80 p-4 sm:p-5">
                  <p className="label-tech">{label}</p>
                  <p className="tnum mt-1.5 text-lg font-medium tracking-tight sm:text-xl">
                    {value}
                  </p>
                </div>
              ))}
            </div>
            <div className="divide-y divide-border/70 border-t border-border/70">
              {[
                [
                  "Mahboob",
                  "via Imran (Son) · 2 kg rice, 1 L oil",
                  "+₹420",
                  "Morning",
                ],
                [
                  "Sharma Ji",
                  "via Self · detergent, biscuits",
                  "+₹180",
                  "Afternoon",
                ],
                ["Fatima B.", "Payment received", "−₹1,000", "Evening"],
              ].map(([name, detail, amount, session]) => (
                <div
                  key={name}
                  className="flex items-center gap-3 bg-background/80 px-4 py-3.5 sm:px-5"
                >
                  <span className="flex size-8 items-center justify-center rounded-full border border-border text-xs font-medium">
                    {name.charAt(0)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {detail}
                    </p>
                  </div>
                  <span className="hidden text-xs text-muted-foreground sm:block">
                    {session}
                  </span>
                  <span className="tnum text-sm font-medium">{amount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Shop console features */}
      <section id="console" className="border-b border-border/70">
        <div className="mx-auto w-full max-w-5xl px-4 py-20 sm:px-6">
          <p className="label-tech">The shop console</p>
          <h2 className="mt-3 max-w-xl text-2xl font-medium tracking-tight sm:text-3xl">
            Built for the pace of a neighborhood store — precise where it
            counts.
          </h2>
          <div className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2">
            {features.map((f) => (
              <div key={f.title} className="flex flex-col gap-3">
                <span className="flex size-9 items-center justify-center rounded-md border border-border">
                  <f.icon className="size-4" strokeWidth={1.75} />
                </span>
                <h3 className="text-base font-medium tracking-tight">
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Customer portal */}
      <section id="portal" className="relative overflow-hidden border-b border-border/70">
        <div className="bg-dots pointer-events-none absolute inset-0" />
        <div className="relative mx-auto w-full max-w-5xl px-4 py-20 sm:px-6">
          <p className="label-tech">The customer portal</p>
          <h2 className="mt-3 max-w-xl text-2xl font-medium tracking-tight sm:text-3xl">
            Your account, visible to you — not just to the counter.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Customers of Mahboob Home Mart get their own sign-in. The balance
            shown is the balance the shop records — same numbers, same entries,
            updated the moment anything changes.
          </p>
          <div className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2">
            {portalFeatures.map((f) => (
              <div key={f.title} className="flex flex-col gap-3">
                <span className="flex size-9 items-center justify-center rounded-md border border-border">
                  <f.icon className="size-4" strokeWidth={1.75} />
                </span>
                <h3 className="text-base font-medium tracking-tight">
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden border-b border-border/70">
        <div className="bg-blueprint pointer-events-none absolute inset-0" />
        <div className="relative mx-auto flex w-full max-w-5xl flex-col items-start gap-6 px-4 py-20 sm:px-6">
          <h2 className="max-w-lg text-2xl font-medium tracking-tight sm:text-3xl">
            One sign-in. Two experiences. A ledger both sides can trust.
          </h2>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            Shop staff land on the ledger console. Customers land on their
            personal dashboard with balance, history, and messaging. The system
            routes each person to the right place automatically.
          </p>
          <Button size="lg" onClick={primaryAction}>
            {isAuthenticated ? "Go to dashboard" : "Sign in"}
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/70">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-4 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>Mahboob Home Mart — Ledger Portal</span>
          <span>Records maintained daily · Statements via WhatsApp</span>
        </div>
      </footer>
    </div>
  );
}
