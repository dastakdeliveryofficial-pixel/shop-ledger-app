import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  ArrowRight,
  BookOpenText,
  Clock3,
  MessageCircle,
  Search,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router";

const features = [
  {
    icon: Users,
    title: "Customer & family accounts",
    body: "One account per family, held under the primary member's name — with a record of exactly who picked up the items each time.",
  },
  {
    icon: Clock3,
    title: "Session-tracked ledger",
    body: "Every credit or cash entry is stamped with the time and the daypart it happened in: morning, afternoon, or evening/night.",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp statements",
    body: "One tap opens WhatsApp with an itemized statement, the outstanding balance, and a polite reminder — ready to send.",
  },
  {
    icon: Search,
    title: "Instant search",
    body: "Pull up any customer's full history and current dues in seconds, by name, phone number, or address.",
  },
];

export default function Landing() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  const primaryAction = () => navigate(isAuthenticated ? "/dashboard" : "/auth");

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-md bg-foreground text-background">
              <BookOpenText className="size-4" strokeWidth={1.75} />
            </span>
            <span className="text-sm font-medium tracking-tight">
              KhataBook Lite
            </span>
          </div>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">
              Features
            </a>
            <a href="#how" className="transition-colors hover:text-foreground">
              How it works
            </a>
          </nav>
          <div className="flex items-center gap-2">
            {!isLoading && isAuthenticated && (
              <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
                Open ledger
              </Button>
            )}
            <Button size="sm" onClick={primaryAction}>
              {isAuthenticated ? "Dashboard" : "Start free"}
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto w-full max-w-5xl px-4 pb-20 pt-20 sm:px-6 sm:pt-28">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            For grocery &amp; convenience shops
          </p>
          <h1 className="mt-5 text-4xl font-medium leading-[1.08] tracking-tight sm:text-6xl">
            The shop's ledger,
            <br />
            <span className="text-muted-foreground">kept perfectly.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Record every udhaar entry under the account holder's name, note
            which family member collected the items, and send a polite WhatsApp
            reminder whenever dues need settling. No spreadsheets. No paper.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Button size="lg" onClick={primaryAction}>
              Open my ledger
              <ArrowRight className="size-4" />
            </Button>
            <p className="text-xs text-muted-foreground">
              Free · works on phone &amp; desktop
            </p>
          </div>
        </div>

        {/* Ledger preview */}
        <div className="mt-16 overflow-hidden rounded-xl border border-border/70 sm:mt-20">
          <div className="grid grid-cols-2 gap-px bg-border/70 sm:grid-cols-4">
            {[
              ["Total receivables", "₹12,480"],
              ["Accounts with dues", "18"],
              ["Entries today", "27"],
              ["Cash today", "₹3,120"],
            ].map(([label, value]) => (
              <div key={label} className="bg-background p-4 sm:p-5">
                <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  {label}
                </p>
                <p className="mt-1.5 text-lg font-medium tabular-nums tracking-tight sm:text-xl">
                  {value}
                </p>
              </div>
            ))}
          </div>
          <div className="divide-y divide-border/70 border-t border-border/70">
            {[
              ["Mahboob", "via Imran (Son) · 2 kg rice, 1 L oil", "+₹420", "Morning"],
              ["Sharma Ji", "via Self · detergent, biscuits", "+₹180", "Afternoon"],
              ["Fatima B.", "Payment received", "−₹1,000", "Evening"],
            ].map(([name, detail, amount, session]) => (
              <div
                key={name}
                className="flex items-center gap-3 bg-background px-4 py-3.5 sm:px-5"
              >
                <span className="flex size-8 items-center justify-center rounded-full border border-border text-xs font-medium">
                  {name.charAt(0)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{name}</p>
                  <p className="truncate text-xs text-muted-foreground">{detail}</p>
                </div>
                <span className="hidden text-xs text-muted-foreground sm:block">
                  {session}
                </span>
                <span className="text-sm font-medium tabular-nums">{amount}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border/70">
        <div className="mx-auto w-full max-w-5xl px-4 py-20 sm:px-6">
          <h2 className="max-w-md text-2xl font-medium tracking-tight sm:text-3xl">
            Everything a neighborhood khata needs. Nothing it doesn't.
          </h2>
          <div className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2">
            {features.map((f) => (
              <div key={f.title} className="flex flex-col gap-3">
                <span className="flex size-9 items-center justify-center rounded-md border border-border">
                  <f.icon className="size-4" strokeWidth={1.75} />
                </span>
                <h3 className="text-base font-medium tracking-tight">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t border-border/70 bg-muted/30">
        <div className="mx-auto w-full max-w-5xl px-4 py-20 sm:px-6">
          <h2 className="text-2xl font-medium tracking-tight sm:text-3xl">
            Three steps, every day
          </h2>
          <div className="mt-12 grid gap-10 sm:grid-cols-3">
            {[
              [
                "01",
                "Record the entry",
                "Choose the account, type the amount and items, and note who collected them. The session is detected automatically.",
              ],
              [
                "02",
                "Watch dues tally up",
                "Balances update live for every account, and the dashboard shows your total receivables at a glance.",
              ],
              [
                "03",
                "Remind over WhatsApp",
                "When it's time to collect, tap one button — WhatsApp opens with the full statement already written.",
              ],
            ].map(([n, title, body]) => (
              <div key={n} className="flex flex-col gap-3">
                <span className="text-xs tabular-nums tracking-[0.2em] text-muted-foreground">
                  {n}
                </span>
                <h3 className="text-base font-medium tracking-tight">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-border/70">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-start gap-6 px-4 py-20 sm:px-6">
          <h2 className="max-w-lg text-2xl font-medium tracking-tight sm:text-3xl">
            Start your digital khata this evening.
          </h2>
          <Button size="lg" onClick={primaryAction}>
            {isAuthenticated ? "Go to dashboard" : "Create your ledger"}
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/70">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-4 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>KhataBook Lite — a calm ledger for busy shops.</span>
          <span>Built with care for local retailers.</span>
        </div>
      </footer>
    </div>
  );
}
