import React from "react";
import { 
  TicketTrace, 
  TriageOutput, 
  SentimentOutput, 
  DraftOutput, 
  ReviewOutput 
} from "../types";
import { 
  Sparkles, 
  User, 
  Mail, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Clock, 
  RotateCcw, 
  MessageSquare, 
  FileText, 
  ShieldAlert, 
  Award,
  ChevronRight,
  RefreshCcw,
  RefreshCw,
  Plus
} from "lucide-react";

interface TicketTracePanelProps {
  trace: TicketTrace | null;
  onClose: () => void;
}

export default function TicketTracePanel({ trace, onClose }: TicketTracePanelProps) {
  if (!trace) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-[#111827] border border-gray-800 rounded-2xl shadow-xl min-h-[400px]">
        <div className="w-16 h-16 bg-gray-900 border border-gray-800 rounded-full flex items-center justify-center mb-4">
          <MessageSquare className="w-6 h-6 text-indigo-400" />
        </div>
        <h3 className="text-sm font-semibold text-white tracking-tight">No Trace Inspected</h3>
        <p className="mt-2 text-xs text-gray-400 max-w-xs leading-relaxed">
          Click on any support ticket row in the queue table to inspect its active agent pipeline logs, reasoning traces, and audit history.
        </p>
      </div>
    );
  }

  const { ticket, status, currentStage, triage, sentiment, firstDraft, firstReview, revision, secondDraft, secondReview, finalDecision } = trace;

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case "high":
        return "bg-rose-950/50 text-rose-300 border border-rose-900/40";
      case "medium":
        return "bg-amber-950/50 text-amber-300 border border-amber-900/40";
      default:
        return "bg-slate-800 text-slate-300 border border-slate-700";
    }
  };

  const getTopicColor = (topic: string) => {
    switch (topic) {
      case "billing": return "bg-emerald-950/50 text-emerald-300 border border-emerald-900/40";
      case "technical": return "bg-blue-950/50 text-blue-300 border border-blue-900/40";
      case "refund": return "bg-indigo-950/50 text-indigo-300 border border-indigo-900/40";
      case "account": return "bg-violet-950/50 text-violet-300 border border-violet-900/40";
      default: return "bg-slate-800 text-slate-300 border border-slate-700";
    }
  };

  return (
    <div className="bg-[#111827] rounded-2xl border border-gray-800 shadow-xl flex flex-col h-full overflow-hidden text-gray-300" id="trace-panel-container">
      {/* Panel Header */}
      <div className="px-6 py-5 border-b border-gray-800 flex items-center justify-between bg-gray-900/50">
        <div>
          <span className="text-[10px] font-mono uppercase bg-indigo-950/60 text-indigo-300 border border-indigo-900/40 font-semibold px-2 py-0.5 rounded-full">
            Agent Reasoning Audit Log
          </span>
          <h2 className="text-md font-semibold text-white mt-1 flex items-center gap-1.5 font-sans tracking-tight">
            <span>Ticket:</span>
            <span className="text-indigo-400 font-mono text-xs">{ticket.id}</span>
          </h2>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white p-1 hover:bg-gray-800 rounded-lg transition"
        >
          <span className="text-lg font-bold">&times;</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Ticket Details summary card */}
        <div className="bg-gray-800/40 rounded-xl p-4 border border-gray-800/50 space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-0.5">
              <h3 className="font-semibold text-sm text-white leading-tight">
                {ticket.subject}
              </h3>
              <div className="flex flex-wrap items-center gap-1 text-xs text-gray-400">
                <User className="w-3.5 h-3.5" />
                <span>{ticket.customerName}</span>
                <span className="text-gray-600">•</span>
                <Mail className="w-3.5 h-3.5" />
                <span className="truncate max-w-[150px]" title={ticket.email}>{ticket.email}</span>
              </div>
            </div>
            {triage && (
              <span className={`text-[11px] px-2 py-0.5 rounded-md font-medium capitalize ${getUrgencyBadge(triage.urgency)}`}>
                {triage.urgency} Urgency
              </span>
            )}
          </div>

          <div className="text-xs text-gray-300 bg-gray-900/60 p-3 rounded-lg border border-gray-800 max-h-28 overflow-y-auto whitespace-pre-wrap leading-relaxed">
            {ticket.body}
          </div>

          <div className="flex items-center gap-4 text-[11px] text-gray-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-gray-500" />
              <span>Received: <strong className="text-gray-300">{new Date(ticket.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</strong></span>
            </span>
            <span className="flex items-center gap-1">
              <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
              <span>Prior contacts: <strong className="text-gray-300">{ticket.previousContactsCount}</strong></span>
            </span>
          </div>
        </div>

        {/* Timeline of Agent Execution */}
        <div className="space-y-6 relative pl-4 border-l-2 border-gray-800">
          
          {/* Stage 1: Triage */}
          {triage ? (
            <div className="relative space-y-1.5" id="trace-triage-node">
              <div className="absolute -left-[23px] top-0.5 bg-indigo-600 text-white rounded-full p-1 border-4 border-[#111827] shadow-xs">
                <Sparkles className="w-3 h-3" />
              </div>
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-white font-sans">
                  Agent 1: Triage & Classification
                </h4>
                <span className="text-[10px] font-mono text-gray-500">Step 1 • Completed</span>
              </div>
              <div className="bg-gray-800/20 border border-gray-800/80 rounded-xl p-3.5 shadow-xs space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Classified Category:</span>
                  <span className={`text-[11px] font-medium uppercase px-2 py-0.5 rounded-sm border ${getTopicColor(triage.topic)}`}>
                    {triage.topic}
                  </span>
                  <span className="text-xs text-gray-400 ml-1">Urgency:</span>
                  <span className={`text-[11px] font-medium capitalize px-1.5 py-0.5 rounded-sm ${getUrgencyBadge(triage.urgency)}`}>
                    {triage.urgency}
                  </span>
                </div>
                <div className="text-xs text-gray-300 bg-gray-900/50 p-2.5 rounded-lg border-l-2 border-indigo-500 leading-relaxed italic">
                  "{triage.reasoning}"
                </div>
              </div>
            </div>
          ) : (
            currentStage === "triage" && (
              <div className="relative pl-2 py-1" id="trace-triage-active">
                <div className="absolute -left-[23px] top-1.5 bg-indigo-500 animate-ping rounded-full w-3.5 h-3.5 border-4 border-[#111827]" />
                <div className="absolute -left-[23px] top-1.5 bg-indigo-600 rounded-full w-3.5 h-3.5 border-4 border-[#111827]" />
                <span className="text-xs font-medium text-indigo-400 animate-pulse">Agent 1: Triage processing ticket parameters...</span>
              </div>
            )
          )}

          {/* Stage 2: Sentiment Override */}
          {sentiment ? (
            <div className="relative space-y-1.5" id="trace-sentiment-node">
              <div className="absolute -left-[23px] top-0.5 bg-amber-500 text-white rounded-full p-1 border-4 border-[#111827] shadow-xs">
                <AlertTriangle className="w-3 h-3" />
              </div>
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-white font-sans">
                  Agent 2: Sentiment & Escalation Check
                </h4>
                <span className="text-[10px] font-mono text-gray-500">Step 2 • Completed</span>
              </div>
              <div className="bg-gray-800/20 border border-gray-800/80 rounded-xl p-3.5 shadow-xs space-y-2">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-gray-400">Frustration Level:</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-sm ${
                      sentiment.frustration_level >= 7 ? "bg-rose-950/60 text-rose-300 border border-rose-900/30" : "bg-amber-950/60 text-amber-300 border border-amber-900/30"
                    }`}>
                      {sentiment.frustration_level} / 10
                    </span>
                    <span className="text-xs text-gray-600">|</span>
                    <span className="text-xs text-gray-400">Repeat Contact:</span>
                    <span className={`text-xs font-semibold ${sentiment.repeat_contact ? "text-rose-400" : "text-gray-400"}`}>
                      {sentiment.repeat_contact ? "YES (🚩 Trigger)" : "NO"}
                    </span>
                  </div>

                  {sentiment.priority === "fast-track" && (
                    <div className="flex items-center gap-2 pt-1 border-t border-gray-800/50">
                      <span className="text-xs text-gray-400">Priority Route:</span>
                      {sentiment.is_vip_sender ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-900/40">
                          ⭐ VIP SENDER ({sentiment.vip_title_matched})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-900/40">
                          ⚡ URGENCY DETECTED (Keywords: {sentiment.urgency_keywords_found.join(", ")})
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {sentiment.escalatedByOverride && (
                  <div className="flex items-start gap-1.5 bg-rose-950/40 text-rose-200 p-2.5 rounded-lg border border-rose-900/40 text-xs font-medium mt-1">
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-rose-300">🚩 ESCALATION OVERRIDE TRIGGERED</p>
                      <p className="text-[11px] font-normal mt-0.5 text-rose-200">"{sentiment.override_reason}"</p>
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-300 bg-gray-900/50 p-2.5 rounded-lg border-l-2 border-amber-500 leading-relaxed italic">
                  "{sentiment.reasoning}"
                </div>
              </div>
            </div>
          ) : (
            currentStage === "sentiment" && (
              <div className="relative pl-2 py-1" id="trace-sentiment-active">
                <div className="absolute -left-[23px] top-1.5 bg-amber-400 animate-ping rounded-full w-3.5 h-3.5 border-4 border-[#111827]" />
                <div className="absolute -left-[23px] top-1.5 bg-amber-500 rounded-full w-3.5 h-3.5 border-4 border-[#111827]" />
                <span className="text-xs font-medium text-amber-400 animate-pulse">Agent 2: Sentiment Agent scoring customer mood and contact history...</span>
              </div>
            )
          )}

          {/* Stage 3: Specialist Draft 1 */}
          {firstDraft ? (
            <div className="relative space-y-1.5" id="trace-draft-node">
              <div className="absolute -left-[23px] top-0.5 bg-emerald-600 text-white rounded-full p-1 border-4 border-[#111827] shadow-xs">
                <FileText className="w-3 h-3" />
              </div>
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-white font-sans">
                  Agent 3: Specialist Agent Draft Reply
                </h4>
                <span className="text-[10px] font-mono text-gray-500">Step 3 • Completed</span>
              </div>
              <div className="bg-gray-800/20 border border-gray-800/80 rounded-xl p-3.5 shadow-xs space-y-3">
                
                {/* Draft Email layout box */}
                <div className="border border-gray-800 rounded-lg overflow-hidden bg-gray-900">
                  <div className="px-3 py-1.5 bg-gray-900/80 border-b border-gray-850 text-[10px] font-mono text-gray-400 flex justify-between items-center">
                    <span>Draft Reply (Version 1)</span>
                    <span className="text-indigo-400 font-semibold uppercase">
                      {firstDraft.detected_tone ? `${firstDraft.detected_tone} tone matched` : "Empathetic support tone"}
                    </span>
                  </div>
                  <div className="p-3 font-sans text-xs text-gray-300 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto bg-gray-950/40">
                    {firstDraft.text}
                  </div>
                </div>

                {/* Grounding elements */}
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Grounding Source Rules Utilized:</span>
                  <div className="flex flex-wrap gap-1">
                    {firstDraft.groundedSourceRules.length > 0 ? (
                      firstDraft.groundedSourceRules.map((rule, idx) => (
                        <span key={idx} className="bg-emerald-950/60 text-emerald-300 text-[10px] font-medium border border-emerald-900/40 px-1.5 py-0.5 rounded-sm">
                          {rule}
                        </span>
                      ))
                    ) : (
                      <span className="bg-rose-950/60 text-rose-300 text-[10px] font-medium border border-rose-900/40 px-1.5 py-0.5 rounded-sm">
                        No policy match (Admitted Gap)
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-xs text-gray-300 bg-gray-900/50 p-2.5 rounded-lg border-l-2 border-emerald-500 leading-relaxed italic">
                  <strong>Reasoning:</strong> "{firstDraft.reasoning}"
                </div>
              </div>
            </div>
          ) : (
            currentStage === "draft" && !sentiment?.escalatedByOverride && (
              <div className="relative pl-2 py-1" id="trace-draft-active">
                <div className="absolute -left-[23px] top-1.5 bg-emerald-400 animate-ping rounded-full w-3.5 h-3.5 border-4 border-[#111827]" />
                <div className="absolute -left-[23px] top-1.5 bg-emerald-600 rounded-full w-3.5 h-3.5 border-4 border-[#111827]" />
                <span className="text-xs font-medium text-emerald-400 animate-pulse">Agent 3: Specialist drafting reply grounded in Knowledge Base rules...</span>
              </div>
            )
          )}

          {/* Stage 4: Reviewer Quality Check 1 */}
          {firstReview ? (
            <div className="relative space-y-1.5" id="trace-review-node">
              <div className="absolute -left-[23px] top-0.5 bg-blue-600 text-white rounded-full p-1 border-4 border-[#111827] shadow-xs">
                <Award className="w-3 h-3" />
              </div>
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-white font-sans">
                  Agent 4: Reviewer Agent Grade Check
                </h4>
                <span className="text-[10px] font-mono text-gray-500">Step 4 • Completed</span>
              </div>
              <div className="bg-gray-800/20 border border-gray-800/80 rounded-xl p-3.5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Draft Confidence:</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-sm ${
                      firstReview.confidence >= 80 ? "bg-emerald-950/60 text-emerald-300 border border-emerald-900/30" : "bg-amber-950/60 text-amber-300 border border-amber-900/30"
                    }`}>
                      {firstReview.confidence}%
                    </span>
                  </div>
                  <span className={`text-xs font-semibold uppercase px-2.5 py-0.5 rounded-full border ${
                    firstReview.verdict === "send" ? "bg-emerald-950/60 text-emerald-300 border-emerald-900/40" :
                    firstReview.verdict === "revise" ? "bg-amber-950/60 text-amber-300 border border-amber-900/40 animate-pulse" :
                    "bg-rose-950/60 text-rose-300 border border-rose-900/40"
                  }`}>
                    Verdict: {firstReview.verdict}
                  </span>
                </div>

                {/* Reasons checklist */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Reviewer Critique Log:</span>
                  <ul className="text-xs text-gray-300 space-y-1 bg-gray-900/50 p-2.5 rounded-lg border border-gray-800 pl-5 list-disc leading-relaxed">
                    {firstReview.reasons.map((reason, idx) => (
                      <li key={idx} className={firstReview.verdict === "send" ? "text-emerald-200 font-normal" : "text-gray-350"}>
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="text-xs text-gray-300 bg-gray-900/50 p-2.5 rounded-lg border-l-2 border-blue-500 leading-relaxed italic">
                  <strong>Reviewer Logic:</strong> "{firstReview.reasoning}"
                </div>
              </div>
            </div>
          ) : (
            currentStage === "review" && !sentiment?.escalatedByOverride && (
              <div className="relative pl-2 py-1" id="trace-review-active">
                <div className="absolute -left-[23px] top-1.5 bg-blue-400 animate-ping rounded-full w-3.5 h-3.5 border-4 border-[#111827]" />
                <div className="absolute -left-[23px] top-1.5 bg-blue-600 rounded-full w-3.5 h-3.5 border-4 border-[#111827]" />
                <span className="text-xs font-medium text-blue-400 animate-pulse">Agent 4: Reviewer inspecting draft for hallucination and safety guidelines...</span>
              </div>
            )
          )}

          {/* Revision loop / Second Draft */}
          {revision && secondDraft && (
            <div className="relative space-y-1.5 border-l-2 border-dashed border-amber-500/40 pl-4 ml-1 my-3" id="trace-revision-node">
              <div className="absolute -left-[27px] top-0.5 bg-amber-500 text-white rounded-full p-1 border-4 border-[#111827] shadow-xs">
                <RefreshCw className="w-2.5 h-2.5 animate-spin" style={{ animationDuration: "3s" }} />
              </div>
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-amber-400 font-sans flex items-center gap-1">
                  <span>🔄 REVISION RETRY LOOP</span>
                  <span className="text-[10px] font-normal bg-amber-955 text-amber-300 border border-amber-900/40 px-1.5 py-0.2 rounded-full">Attempt 2</span>
                </h4>
                <span className="text-[10px] font-mono text-amber-500">Specialist Revision completed</span>
              </div>
              <div className="bg-amber-950/10 border border-amber-900/30 rounded-xl p-3.5 shadow-xs space-y-3">
                <div className="text-xs text-amber-200 bg-amber-950/30 p-2.5 rounded-lg border-l-2 border-amber-500 leading-relaxed">
                  <strong>Critique Feedback Sent Back:</strong> "{revision.reasoning}"
                </div>

                <div className="border border-amber-900/35 rounded-lg overflow-hidden bg-gray-900">
                  <div className="px-3 py-1.5 bg-amber-950/40 border-b border-amber-900/30 text-[10px] font-mono text-amber-300">
                    Revised Specialist Draft Reply
                  </div>
                  <div className="p-3 font-sans text-xs text-gray-300 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto bg-gray-950/30">
                    {secondDraft.text}
                  </div>
                </div>

                <div className="text-xs text-gray-300 bg-gray-900/50 p-2.5 rounded-lg border-l-2 border-amber-400 leading-relaxed italic">
                  <strong>Specialist Revise Reasoning:</strong> "{secondDraft.reasoning}"
                </div>

                {/* Second Review */}
                {secondReview && (
                  <div className="border border-gray-800 rounded-lg bg-gray-950 p-3 space-y-2 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-300 font-sans">Reviewer Stage 2 Verdict:</span>
                      <span className={`text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full border ${
                        secondReview.verdict === "send" ? "bg-emerald-950/60 text-emerald-300 border border-emerald-900/40" :
                        "bg-rose-950/60 text-rose-300 border border-rose-900/40"
                      }`}>
                        {secondReview.verdict}
                      </span>
                    </div>
                    <ul className="text-xs text-gray-400 space-y-1 list-disc pl-4">
                      {secondReview.reasons.map((reason, idx) => (
                        <li key={idx}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Stage 5: Final Decision */}
          {finalDecision ? (
            <div className="relative space-y-1.5" id="trace-final-decision-node">
              <div className="absolute -left-[23px] top-0.5 bg-gray-900 text-white rounded-full p-1 border-4 border-[#111827] shadow-xs">
                <CheckCircle2 className="w-3 h-3" />
              </div>
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-white font-sans">
                  Pipeline Conclusion & Execution
                </h4>
                <span className="text-[10px] font-mono text-gray-500">Final Step • Complete</span>
              </div>
              <div className="bg-indigo-950/25 text-indigo-100 rounded-xl p-4 shadow-sm space-y-3 border border-indigo-500/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-indigo-300">Final System Status:</span>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md ${
                    finalDecision.verdict === "sent" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" :
                    finalDecision.verdict === "revised_then_sent" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" :
                    "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                  }`}>
                    {finalDecision.verdict === "sent" && "✅ AUTO-SENT (SECURE)"}
                    {finalDecision.verdict === "revised_then_sent" && "🔄 REVISED & AUTO-SENT"}
                    {finalDecision.verdict === "escalated" && "🚩 ESCALATED FOR HUMAN INTERVENTION"}
                  </span>
                </div>

                {finalDecision.replyText ? (
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider block">Sent Email Body:</span>
                    <div className="bg-gray-950 p-3 rounded-lg text-gray-300 font-mono text-[11px] leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap border border-gray-800">
                      {finalDecision.replyText}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-gray-950 rounded-lg border border-gray-800 text-xs space-y-1.5">
                    <div className="flex items-center gap-1.5 text-rose-300 font-semibold text-[11px]">
                      <ShieldAlert className="w-4 h-4 text-rose-400" />
                      <span>ESCALATION REASON DIRECTIVE:</span>
                    </div>
                    <p className="text-gray-350 text-xs leading-relaxed italic bg-rose-950/20 p-2 rounded-md">
                      "{finalDecision.escalationReason}"
                    </p>
                  </div>
                )}

                <div className="text-[10px] text-gray-450 flex justify-between pt-1 border-t border-gray-800">
                  <span>Audited At: {new Date(finalDecision.timestamp).toLocaleTimeString()}</span>
                  <span>Compliance Checked</span>
                </div>
              </div>
            </div>
          ) : (
            currentStage === "done" && (
              <div className="relative pl-2 py-1" id="trace-concluding">
                <span className="text-xs font-medium text-slate-500 animate-pulse">Concluding audit and setting status...</span>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
