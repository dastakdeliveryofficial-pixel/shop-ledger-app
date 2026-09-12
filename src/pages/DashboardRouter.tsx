import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "convex/react";
import { Loader2 } from "lucide-react";
import { Suspense, lazy } from "react";

const ShopDashboard = lazy(() => import("./Dashboard"));
const CustomerPortalPage = lazy(() => import("./CustomerPortal"));

/**
 * /dashboard entry point. Signed-in users are routed by identity:
 *  - email matches a customer account → customer portal
 *  - otherwise → shop ledger console
 */
export default function DashboardRouter() {
  const { isLoading, isAuthenticated } = useAuth();
  const account = useQuery(api.customers.myAccount);

  if (isLoading || account === undefined) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </main>
      }
    >
      {account ? <CustomerPortalPage /> : <ShopDashboard />}
    </Suspense>
  );
}
