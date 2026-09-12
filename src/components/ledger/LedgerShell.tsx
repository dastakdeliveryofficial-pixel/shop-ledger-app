import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import { BookOpenText, LogOut } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { ShopNameDialog } from "./dialogs";

export function LedgerShell({
  children,
  shopName,
}: {
  children: ReactNode;
  shopName?: string;
}) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [shopDialog, setShopDialog] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="flex min-w-0 items-center gap-2.5 text-left"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border/70 bg-card">
              <BookOpenText className="size-4" strokeWidth={1.75} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium leading-tight">
                {shopName || "Mahboob Home Mart"}
              </span>
              <span className="label-tech block truncate leading-tight">
                Ledger console
              </span>
            </span>
          </button>
          <div className="flex items-center gap-1">
            {shopName !== undefined && (
              <Button
                variant="ghost"
                size="sm"
                className="hidden text-muted-foreground sm:inline-flex"
                onClick={() => setShopDialog(true)}
              >
                Edit shop name
              </Button>
            )}
            <span className="hidden max-w-40 truncate text-sm text-muted-foreground sm:block">
              {user?.name || user?.email || ""}
            </span>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Sign out"
              onClick={handleSignOut}
              className={cn("text-muted-foreground hover:text-foreground")}
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-8 sm:px-6">
        {children}
      </main>
      <ShopNameDialog
        open={shopDialog}
        onOpenChange={setShopDialog}
        current={shopName}
      />
    </div>
  );
}
