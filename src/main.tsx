import '@vly-ai/integrations';
import { Toaster } from "@/components/ui/sonner";
import { RequireAuth } from "@/components/RequireAuth";
import { VlyToolbar } from "../vly-toolbar-readonly.tsx";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import React, { StrictMode, useEffect, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, useLocation } from "react-router";
import "./index.css";

// Lazy load route components for better code splitting
const Landing = lazy(() => import("./pages/Landing.tsx"));
const AuthPage = lazy(() => import("./pages/Auth.tsx"));
const DashboardRouter = lazy(() => import("./pages/DashboardRouter.tsx"));
const CustomerDetail = lazy(() => import("./pages/CustomerDetail.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

// Simple loading fallback for route transitions
function RouteLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  );
}

/** Silent error boundary — if VlyToolbar crashes it renders nothing instead of
 *  crashing the whole app (e.g. hook errors in WebContainer environment). */
class ToolbarErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: Error) {
    console.warn("[VlyToolbar] Caught error, toolbar disabled:", err.message);
  }
  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

/** Hard guard so runtime errors never leave the preview as a blank page. */
class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string; stack: string }
> {
  state = { hasError: false, message: "", stack: "" };
  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      message: error.message || "Unknown runtime error",
      stack: error.stack || "",
    };
  }
  componentDidCatch(err: Error) {
    console.error("[WebContainer preview] Root crash:", err);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
          <div className="max-w-lg text-center">
            <p className="text-sm font-semibold">Preview runtime error</p>
            <p className="mt-2 text-xs text-muted-foreground break-words">
              {this.state.message}
            </p>
            {this.state.stack && (
              <pre className="mt-3 text-left text-[10px] leading-4 text-muted-foreground/80 max-h-40 overflow-auto rounded border border-border/60 p-2">
                {this.state.stack}
              </pre>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Resolve the Convex deployment URL at build time, with an optional runtime
 * override (useful for static hosting where you cannot rebuild:
 * localStorage.setItem("convex-url", "https://…convex.cloud")).
 * Missing URL previously crashed the whole module → white screen.
 */
function resolveConvexUrl(): string | undefined {
  const fromEnv = import.meta.env.VITE_CONVEX_URL as string | undefined;
  let fromRuntime: string | undefined;
  try {
    fromRuntime = window.localStorage.getItem("convex-url") ?? undefined;
  } catch {
    fromRuntime = undefined;
  }
  const url = fromRuntime?.trim() || fromEnv?.trim();
  return url && /^https?:\/\//.test(url) ? url : undefined;
}

const convexUrl = resolveConvexUrl();
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

function ConvexNotConfigured() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center text-foreground">
      <h1 className="text-lg font-medium tracking-tight">Backend not configured</h1>
      <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
        This build was deployed without a Convex URL, so the app cannot load
        data. Rebuild with{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">VITE_CONVEX_URL</code>{" "}
        set to your deployment's <code className="rounded bg-muted px-1.5 py-0.5 text-xs">https://…convex.cloud</code>{" "}
        address — or set it at runtime with{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
          localStorage.setItem("convex-url", "…")
        </code>{" "}
        and reload.
      </p>
    </main>
  );
}



function RouteSyncer() {
  const location = useLocation();
  useEffect(() => {
    window.parent.postMessage(
      { type: "iframe-route-change", path: location.pathname },
      "*",
    );
  }, [location.pathname]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "navigate") {
        if (event.data.direction === "back") window.history.back();
        if (event.data.direction === "forward") window.history.forward();
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return null;
}


const routes = (
  <BrowserRouter>
    <RouteSyncer />
    <Suspense fallback={<RouteLoading />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route
          path="/auth"
          element={<AuthPage redirectAfterAuth="/dashboard" />}
        />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <DashboardRouter />
            </RequireAuth>
          }
        />
        <Route
          path="/customer/:id"
          element={
            <RequireAuth>
              <CustomerDetail />
            </RequireAuth>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  </BrowserRouter>
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootErrorBoundary>
      {!convex ? (
        <ConvexNotConfigured />
      ) : (
        <ConvexAuthProvider client={convex}>
          {routes}
          <Toaster />
        </ConvexAuthProvider>
      )}
    </RootErrorBoundary>
  </StrictMode>,
);
