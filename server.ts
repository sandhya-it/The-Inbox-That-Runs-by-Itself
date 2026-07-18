import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { DEMO_TICKETS } from "./src/demoData";
import { processTicketThroughPipeline, runSummaryAgent } from "./src/agentEngine";

// Load environment variables
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON request body parser
  app.use(express.json({ limit: "10mb" }));

  // API: Get health status
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // API: Get demo tickets list
  app.get("/api/tickets/demo", (req, res) => {
    try {
      res.json(DEMO_TICKETS);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to load demo tickets" });
    }
  });

  // API: Process single ticket through multi-agent pipeline
  app.post("/api/tickets/process", async (req, res) => {
    try {
      const { ticket } = req.body;
      if (!ticket) {
        res.status(400).json({ error: "Missing required 'ticket' body parameter." });
        return;
      }
      console.log(`[Pipeline] Processing ticket ${ticket.id} (${ticket.customerName})...`);
      const trace = await processTicketThroughPipeline(ticket);
      res.json(trace);
    } catch (error: any) {
      console.error("[Pipeline] Error processing ticket:", error);
      res.status(500).json({ error: error.message || "Internal agent pipeline error" });
    }
  });

  // API: Summary/ROI Agent running once on final state of processed batch
  app.post("/api/tickets/summary", async (req, res) => {
    try {
      const { traces, resolvedCount, escalatedCount, revisedCount, timeSavedMinutes } = req.body;
      if (!Array.isArray(traces)) {
        res.status(400).json({ error: "Missing or invalid 'traces' body parameter. Must be an array." });
        return;
      }
      console.log("[Pipeline] Generating dynamic batch summary report with Summary Agent...");
      const summary = await runSummaryAgent(
        traces,
        resolvedCount || 0,
        escalatedCount || 0,
        revisedCount || 0,
        timeSavedMinutes || 0
      );
      res.json(summary);
    } catch (error: any) {
      console.error("[Pipeline] Error generating batch summary:", error);
      res.status(500).json({ error: error.message || "Failed to generate batch summary" });
    }
  });

  // Mount Vite middleware in development, or serve production assets
  if (process.env.NODE_ENV !== "production") {
    console.log("[Server] Mounting Vite middleware in DEVELOPMENT mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("[Server] Serving static production files from /dist...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] The Inbox That Runs Itself backend listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("[Server] Critical startup error:", err);
  process.exit(1);
});
