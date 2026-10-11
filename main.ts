import { Hono } from "hono";
import { serveStatic } from "hono/deno";

const app = new Hono();

// Deno Deploy ya server par sahi path resolve karne ke liye import.meta.url use karein
const rootPath = new URL("./dist", import.meta.url).pathname;

// 1) Assets ke liye route
app.use("/assets/*", serveStatic({ root: rootPath }));

// 2) Dist folder ki baqi files ke liye
app.use("/*", serveStatic({ root: rootPath }));

// 3) SPA Fallback for React Router (agar koi route refresh ho toh index.html de)
app.get("*", serveStatic({
  root: rootPath,
  path: "index.html",
}));

Deno.serve(app.fetch);
