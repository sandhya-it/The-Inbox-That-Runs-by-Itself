import React, { useState, useEffect } from "react";
import { 
  Play, 
  RotateCcw, 
  Sparkles, 
  BookOpen, 
  TrendingUp, 
  Clock, 
  AlertCircle, 
  HelpCircle, 
  ArrowRight,
  RefreshCw,
  Layers,
  Inbox,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Settings
} from "lucide-react";
import { TicketTrace, SupportTicket, BatchSummary, TicketStatus, PipelineStage } from "./types";
import TicketRow from "./components/TicketRow";
import TicketTracePanel from "./components/TicketTracePanel";
import KnowledgeBaseDrawer from "./components/KnowledgeBaseDrawer";

export default function App() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [traces, setTraces] = useState<TicketTrace[]>([]);
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null);
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [batchSummary, setBatchSummary] = useState<BatchSummary | null>(null);
  const [isKbOpen, setIsKbOpen] = useState(false);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize and load demo tickets
  useEffect(() => {
    fetchDemoTickets();
  }, []);

  const fetchDemoTickets = async () => {
    try {
      setError(null);
      const res = await fetch("/api/tickets/demo");
      if (!res.ok) throw new Error("Failed to fetch demo tickets.");
      const data: SupportTicket[] = await res.json();
      setTickets(data);
      
      // Initialize traces in "idle" state
      const initialTraces: TicketTrace[] = data.map((tkt) => ({
        id: tkt.id,
        ticket: tkt,
        status: "idle",
        currentStage: "idle",
        triage: null,
        sentiment: null,
        firstDraft: null,
        firstReview: null,
        revision: null,
        secondDraft: null,
        secondReview: null,
        finalDecision: null
      }));
      setTraces(initialTraces);
      setBatchSummary(null);
      setSelectedTraceId(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Unable to load demo tickets from the server.");
    }
  };

  // Process the full queue sequentially
  const handleRunBatch = async () => {
    if (isBatchRunning) return;
    setIsBatchRunning(true);
    setBatchSummary(null);
    setError(null);

    // Reset traces before running
    const resetTraces: TicketTrace[] = tickets.map((tkt) => ({
      id: tkt.id,
      ticket: tkt,
      status: "idle",
      currentStage: "idle",
      triage: null,
      sentiment: null,
      firstDraft: null,
      firstReview: null,
      revision: null,
      secondDraft: null,
      secondReview: null,
      finalDecision: null
    }));
    setTraces(resetTraces);

    // Process each ticket sequentially to show a live cascading flow
    for (let i = 0; i < resetTraces.length; i++) {
      const activeTicket = resetTraces[i].ticket;
      
      // 1. Set current ticket status to "processing" and triage stage
      setTraces((prev) => 
        prev.map((tr) => 
          tr.id === activeTicket.id 
            ? { ...tr, status: "processing", currentStage: "triage" } 
            : tr
        )
      );
      setSelectedTraceId(activeTicket.id);

      // 2. Start a mock progress stepper timer to animate the progress dots per row
      // this ensures the user sees the stages lighting up nicely during the LLM calls!
      let currentStageIndex = 0;
      const stages: PipelineStage[] = ["triage", "sentiment", "draft", "review"];
      const stageTimer = setInterval(() => {
        if (currentStageIndex < stages.length - 1) {
          currentStageIndex++;
          const nextStage = stages[currentStageIndex];
          setTraces((prev) => 
            prev.map((tr) => 
              tr.id === activeTicket.id 
                ? { ...tr, currentStage: nextStage } 
                : tr
            )
          );
        }
      }, 700);

      try {
        // 3. Make the API call to the backend to run the real multi-agent chain
        const response = await fetch("/api/tickets/process", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticket: activeTicket })
        });

        clearInterval(stageTimer);

        if (!response.ok) {
          throw new Error(`Agent error: ${response.statusText}`);
        }

        const completedTrace: TicketTrace = await response.json();

        // 4. Update the state with the real trace returned from the server
        setTraces((prev) => 
          prev.map((tr) => 
            tr.id === activeTicket.id ? completedTrace : tr
          )
        );

      } catch (err: any) {
        clearInterval(stageTimer);
        console.error(`Error processing ticket ${activeTicket.id}:`, err);
        
        // On error, default to ESCALATED as requested
        setTraces((prev) => 
          prev.map((tr) => 
            tr.id === activeTicket.id 
              ? {
                  ...tr,
                  status: "escalated",
                  currentStage: "done",
                  finalDecision: {
                    verdict: "escalated",
                    escalationReason: `⚠️ System Pipeline Error: ${err.message || "Agent execution failed. Defaulted to human review."}`,
                    replyText: null,
                    timestamp: new Date().toISOString()
                  }
                }
              : tr
          )
        );
      }

      // Small delay between tickets for demo waterfall visual pacing
      await new Promise((r) => setTimeout(r, 450));
    }

    // 5. Run the Batch Summary/ROI Agent once all tickets are finished
    setTraces((currentTraces) => {
      // Calculate final stats from in-memory traces
      const resolvedCount = currentTraces.filter(t => t.status === "sent").length;
      const revisedCount = currentTraces.filter(t => t.status === "revised_then_sent").length;
      const escalatedCount = currentTraces.filter(t => t.status === "escalated").length;
      const totalResolved = resolvedCount + revisedCount;
      const timeSavedMinutes = totalResolved * 4;

      fetchSummaryAgentReport(currentTraces, resolvedCount, escalatedCount, revisedCount, timeSavedMinutes);
      return currentTraces;
    });

    setIsBatchRunning(false);
  };

  const fetchSummaryAgentReport = async (
    allTraces: TicketTrace[], 
    resolvedCount: number, 
    escalatedCount: number, 
    revisedCount: number, 
    timeSavedMinutes: number
  ) => {
    try {
      const summaryRes = await fetch("/api/tickets/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          traces: allTraces,
          resolvedCount,
          escalatedCount,
          revisedCount,
          timeSavedMinutes
        })
      });

      if (!summaryRes.ok) throw new Error("Failed to fetch Batch Summary report.");
      const summaryData: BatchSummary = await summaryRes.json();
      setBatchSummary(summaryData);
    } catch (err) {
      console.error("Summary Agent failed", err);
      // Fallback local summary
      const totalResolved = resolvedCount + revisedCount;
      setBatchSummary({
        totalTickets: allTraces.length,
        resolvedCount,
        escalatedCount,
        revisedCount,
        timeSavedMinutes,
        batchAnalysis: `${totalResolved} auto-resolved · ${escalatedCount} escalated · ~${timeSavedMinutes} min saved. The Multi-Agent system successfully processed all customer support requests with full reasoning audit logs.`
      });
    }
  };

  const handleResetBatch = () => {
    if (isBatchRunning) return;
    fetchDemoTickets();
  };

  // Compute live active metrics
  const resolvedCount = traces.filter(t => t.status === "sent").length;
  const revisedCount = traces.filter(t => t.status === "revised_then_sent").length;
  const escalatedCount = traces.filter(t => t.status === "escalated").length;
  const processedCount = traces.filter(t => t.status !== "idle" && t.status !== "processing").length;
  const totalResolved = resolvedCount + revisedCount;
  const totalTimeSaved = totalResolved * 4;

  const selectedTrace = traces.find((tr) => tr.id === selectedTraceId) || null;

  // Sort fast-track tickets to the top of the queue
  const sortedTraces = [...traces].sort((a, b) => {
    const aFast = a.sentiment?.priority === "fast-track" ? 1 : 0;
    const bFast = b.sentiment?.priority === "fast-track" ? 1 : 0;
    return bFast - aFast; // 1 (fast-track) comes before 0 (normal)
  });

  return (
    <div className="min-h-screen bg-[#F3F4F6] text-gray-800 flex flex-col font-sans antialiased" id="main-layout">
      
      {/* Top Banner Header */}
      <header className="h-20 bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm flex items-center shrink-0" id="app-header">
        <div className="max-w-7xl w-full mx-auto px-8 flex items-center justify-between gap-4">
          
          {/* Logo & Subtext */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg shadow-sm flex items-center justify-center text-white shrink-0">
              <Layers className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-gray-900 tracking-tight font-display">
                  The Inbox That Runs Itself
                </h1>
                <span className="text-[9px] font-mono bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.2 rounded border border-indigo-100/80">
                  v1.5 LIVE
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Self-operating client support pipeline driven by chained Gemini agents.
              </p>
            </div>
          </div>

          {/* Persistent Summary Agent ROI ticker */}
          <div className="hidden md:flex bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-full items-center gap-3">
            <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
            <span className="text-xs font-medium text-indigo-700 font-display">
              {batchSummary ? (
                `${batchSummary.resolvedCount} auto-resolved · ${batchSummary.escalatedCount} escalated · ~${batchSummary.timeSavedMinutes} min saved`
              ) : isBatchRunning ? (
                "Processing active ticket batches sequentially..."
              ) : (
                `${totalResolved} auto-resolved · ${escalatedCount} escalated · ~${totalTimeSaved} min saved`
              )}
            </span>
          </div>

          {/* Quick Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsKbOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-950 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              id="btn-open-kb"
            >
              <BookOpen className="w-4 h-4 text-gray-400" />
              <span>Rules Knowledge Base</span>
            </button>
          </div>
        </div>
      </header>


      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-8 py-8 flex flex-col gap-6">
        
        {/* Statistics Dashboard Cards & Controls */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6" id="metrics-dashboard">
          
          {/* Card 1: Total Queue */}
          <div className="bg-white rounded-xl border border-gray-200/80 p-6 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
              <Inbox className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">Ticket Queue</span>
              <span className="text-2xl font-bold text-gray-900 font-display tracking-tight">{traces.length} total</span>
              <span className="text-[11px] text-gray-500 block mt-0.5">
                {processedCount} of {traces.length} processed
              </span>
            </div>
          </div>

          {/* Card 2: Auto-Resolved */}
          <div className="bg-white rounded-xl border border-gray-200/80 p-6 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">Auto-Sent</span>
              <span className="text-2xl font-bold text-gray-900 font-display tracking-tight">
                {totalResolved} sent
              </span>
              <span className="text-[11px] text-gray-500 block mt-0.5">
                {revisedCount} with revision retries
              </span>
            </div>
          </div>

          {/* Card 3: Escalated */}
          <div className="bg-white rounded-xl border border-gray-200/80 p-6 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">Escalated</span>
              <span className="text-2xl font-bold text-gray-900 font-display tracking-tight">{escalatedCount} cases</span>
              <span className="text-[11px] text-gray-500 block mt-0.5">
                {traces.filter(t => t.sentiment?.escalatedByOverride).length} by Sentiment Override
              </span>
            </div>
          </div>

          {/* Card 4: ROI Support Time Saved */}
          <div className="bg-white rounded-xl border border-gray-200/80 p-6 shadow-sm flex items-center gap-4 relative">
            <div className="w-12 h-12 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">Support Time Saved</span>
                <button
                  onMouseEnter={() => setIsTooltipVisible(true)}
                  onMouseLeave={() => setIsTooltipVisible(false)}
                  className="text-gray-400 hover:text-gray-600 cursor-help"
                  aria-label="Assumption info"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="text-2xl font-bold text-emerald-600 font-display tracking-tight">~{totalTimeSaved} min</span>
              <span className="text-[11px] text-gray-500 block mt-0.5">
                At 4 mins saved per reply
              </span>
              
              {/* Tooltip text */}
              {isTooltipVisible && (
                <div className="absolute z-50 bg-gray-900 text-white text-[11px] p-3 rounded-lg shadow-xl -top-16 right-4 max-w-xs border border-gray-700 leading-normal">
                  💡 <strong>Assumption metric:</strong> Calculates 4 minutes of manual support rep review and typing saved for every ticket successfully auto-drafted and sent without human intervention.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Bar controls */}
        <div className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs" id="control-bar">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">DEMO PIPELINE STATUS:</span>
            {isBatchRunning ? (
              <span className="flex items-center gap-1.5 text-xs text-indigo-600 font-bold animate-pulse">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600"></span>
                </span>
                <span>Active Agent batch processing sequentially...</span>
              </span>
            ) : (
              <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded font-medium">
                {traces.every(t => t.status === 'idle') ? "Ready to run demo batch" : "Queue audited successfully"}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetBatch}
              disabled={isBatchRunning}
              className={`flex items-center gap-1 px-4 py-2 text-xs font-bold rounded-lg border transition shadow-2xs ${
                isBatchRunning 
                  ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed" 
                  : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              }`}
              id="btn-reset-batch"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo Queue</span>
            </button>

            <button
              onClick={handleRunBatch}
              disabled={isBatchRunning}
              className={`flex items-center gap-2 px-6 py-2 text-xs font-bold text-white rounded-lg transition shadow-md ${
                isBatchRunning
                  ? "bg-indigo-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-indigo-200"
              }`}
              id="btn-run-batch"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run Batch Automation</span>
            </button>
          </div>
        </div>

        {/* Error alerting bar if any */}
        {error && (
          <div className="bg-rose-50 border border-rose-100 text-rose-800 px-4 py-3 rounded-xl flex items-start gap-2.5 text-xs shadow-2xs" id="error-bar">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-950">Initialization Error</p>
              <p className="mt-0.5 text-rose-900">{error}</p>
            </div>
          </div>
        )}

        {/* Main Double Panel Grid: Table vs Inspect Trace Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px]">
          
          {/* Left panel: Ticket queue table */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-gray-200 bg-gray-50/70 flex justify-between items-center">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2 font-display">
                <span>Support Tickets Pipeline Monitor</span>
                <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50/60 border border-indigo-100 px-2 py-0.5 rounded font-semibold">
                  {tickets.length} Standard Cases
                </span>
              </h2>
              <span className="text-xs text-gray-400">Click any row to trace agent reasoning</span>
            </div>

            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left border-collapse" id="queue-table">
                <thead>
                  <tr className="border-b border-gray-200 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/40">
                    <th className="px-6 py-4 font-display">Ticket / Customer Preview</th>
                    <th className="px-6 py-4 font-display">Topic / Category</th>
                    <th className="px-6 py-4 font-display">Frustration</th>
                    <th className="px-6 py-4 font-display">Specialist Draft</th>
                    <th className="px-6 py-4 font-display">Confidence</th>
                    <th className="px-6 py-4 text-right font-display">Status Badge</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTraces.length > 0 ? (
                    sortedTraces.map((tr) => (
                      <TicketRow
                        key={tr.id}
                        trace={tr}
                        isActive={selectedTraceId === tr.id}
                        onSelect={() => setSelectedTraceId(tr.id)}
                      />
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                        <Inbox className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                        <p className="text-xs font-semibold text-gray-500">Demo Queue Empty</p>
                        <p className="text-[11px] text-gray-400 mt-1">Please try resetting or reloading the page.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right panel: Expanded step-by-step reasoning logs */}
          <div className="lg:col-span-5 h-[650px] lg:h-auto">
            <TicketTracePanel
              trace={selectedTrace}
              onClose={() => setSelectedTraceId(null)}
            />
          </div>
        </div>

      </main>

      {/* Rules Knowledge Base Drawer */}
      <KnowledgeBaseDrawer
        isOpen={isKbOpen}
        onClose={() => setIsKbOpen(false)}
      />

      {/* Aesthetic minimalistic footer */}
      <footer className="bg-white border-t border-gray-100 mt-auto py-6" id="app-footer-bar">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between text-[11px] text-gray-400 gap-4">
          <p>© 2026 The Inbox That Runs Itself • Chained Support Multi-Agent System demo.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              <span>Full compliance trace checked</span>
            </span>
            <span className="text-gray-300">|</span>
            <span>Running with gemini-3.5-flash and server-side secret API keys</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
