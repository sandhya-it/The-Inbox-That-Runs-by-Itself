import React, { useState } from "react";
import { TicketTrace, TicketStatus, PipelineStage } from "../types";
import { 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  ShieldAlert, 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  Award, 
  Sparkles,
  RefreshCw,
  Mail,
  User,
  ExternalLink
} from "lucide-react";

interface TicketRowProps {
  key?: React.Key;
  trace: TicketTrace;
  isActive: boolean;
  onSelect: () => void;
}

export default function TicketRow({ trace, isActive, onSelect }: TicketRowProps) {
  const [isDraftExpanded, setIsDraftExpanded] = useState(false);
  const [isReviewExpanded, setIsReviewExpanded] = useState(false);

  const { ticket, status, currentStage, triage, sentiment, firstDraft, firstReview, revision, secondDraft, secondReview, finalDecision } = trace;

  // Render final badge status
  const renderStatusBadge = () => {
    switch (status) {
      case "sent":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>SENT</span>
          </span>
        );
      case "revised_then_sent":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
            <RefreshCw className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>REVISED & SENT</span>
          </span>
        );
      case "escalated":
        const isSentimentOverride = sentiment?.escalatedByOverride;
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
            {isSentimentOverride ? (
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0 animate-bounce" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            )}
            <span>{isSentimentOverride ? "🚩 SENTIMENT ESCALATED" : "ESCALATED"}</span>
          </span>
        );
      case "processing":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 animate-pulse">
            <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-ping" />
            <span>PROCESSING...</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
            <span>QUEUED</span>
          </span>
        );
    }
  };

  const getTopicColor = (topic: string) => {
    switch (topic) {
      case "billing": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "technical": return "bg-blue-50 text-blue-700 border-blue-200";
      case "refund": return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "account": return "bg-violet-50 text-violet-700 border-violet-200";
      default: return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case "high":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "medium":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-slate-50 text-slate-700 border border-slate-200";
    }
  };

  // Timeline stage stepper per row
  const renderRowPipelineStepper = () => {
    const stages: { key: PipelineStage; label: string; color: string }[] = [
      { key: "triage", label: "Triage", color: "bg-indigo-500" },
      { key: "sentiment", label: "Sentiment", color: "bg-amber-500" },
      { key: "draft", label: "Drafting", color: "bg-emerald-500" },
      { key: "review", label: "Review", color: "bg-blue-500" },
      { key: "done", label: "Done", color: "bg-slate-800" }
    ];

    const getStageIndex = (stage: PipelineStage) => {
      switch (stage) {
        case "triage": return 0;
        case "sentiment": return 1;
        case "draft": return 2;
        case "review": return 3;
        case "done": return 4;
        default: return -1;
      }
    };

    const currentIdx = getStageIndex(currentStage);

    return (
      <div className="flex items-center gap-1 mt-1.5" id={`stepper-${ticket.id}`}>
        {stages.map((stg, i) => {
          let state = "idle"; // idle, active, completed
          if (status === "idle" || status === "processing" ? false : true) {
            state = "completed";
          } else if (i < currentIdx) {
            state = "completed";
          } else if (i === currentIdx) {
            state = "active";
          }

          // If Sentiment Override caused escalation, later stages (draft, review) are bypassed. Let's make them dotted or skipped.
          const wasOverridden = sentiment?.escalatedByOverride;
          if (wasOverridden && i >= 2 && status === "escalated") {
            state = "skipped";
          }

          return (
            <React.Fragment key={stg.key}>
              <div className="group relative flex items-center">
                <div 
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    state === "completed" ? stg.color : 
                    state === "active" ? `${stg.color} animate-ping absolute scale-110` :
                    state === "skipped" ? "bg-rose-100 border border-rose-300 border-dashed" :
                    "bg-gray-200"
                  }`} 
                />
                {state === "active" && (
                  <div className={`w-2.5 h-2.5 rounded-full ${stg.color}`} />
                )}
                
                {/* Micro tooltip */}
                <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 transition-all rounded bg-gray-900 px-2 py-0.5 text-[9px] font-medium text-white whitespace-nowrap z-10">
                  {stg.label}: {state.toUpperCase()}
                </span>
              </div>
              {i < stages.length - 1 && (
                <div className={`h-0.5 w-4 transition-all duration-300 ${
                  wasOverridden && i >= 1 ? "bg-rose-100 border-dashed" :
                  state === "completed" ? "bg-gray-300" : "bg-gray-100"
                }`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  // Render VIP/Urgency priority badge
  const renderPriorityBadge = () => {
    if (!sentiment) return null;
    
    if (sentiment.priority === "fast-track") {
      if (sentiment.is_vip_sender) {
        return (
          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-sm bg-amber-100 text-amber-800 border border-amber-200" title={`VIP matched: ${sentiment.vip_title_matched || "Yes"}`}>
            ⭐ VIP
          </span>
        );
      } else if (sentiment.urgency_keywords_found && sentiment.urgency_keywords_found.length > 0) {
        return (
          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-sm bg-indigo-100 text-indigo-800 border border-indigo-200" title={`Keywords: ${sentiment.urgency_keywords_found.join(', ')}`}>
            ⚡ FAST-TRACK
          </span>
        );
      }
    }
    return null;
  };

  return (
    <>
      <tr 
        id={`row-${ticket.id}`}
        onClick={onSelect}
        className={`hover:bg-indigo-50/20 cursor-pointer border-b border-gray-200/70 transition duration-150 ${
          isActive ? "bg-indigo-50/30 border-l-4 border-l-indigo-600" : "bg-white"
        }`}
      >
        {/* Ticket Customer & Preview */}
        <td className="px-6 py-4 min-w-[240px]" id={`cell-preview-${ticket.id}`}>
          <div className="flex flex-col">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-semibold text-xs text-gray-900">{ticket.customerName}</span>
              {renderPriorityBadge()}
              <span className="text-gray-300 font-normal">•</span>
              <span className="text-[10px] text-gray-500 font-mono truncate max-w-[120px]" title={ticket.email}>
                {ticket.email}
              </span>
            </div>
            <span className="font-medium text-xs text-indigo-950 mt-1 truncate max-w-[280px] font-display">
              {ticket.subject}
            </span>
            <span className="text-[11px] text-gray-400 truncate max-w-[280px] mt-0.5">
              {ticket.body}
            </span>
            {renderRowPipelineStepper()}
          </div>
        </td>

        {/* Topic & Urgency */}
        <td className="px-6 py-4" id={`cell-topic-${ticket.id}`}>
          {triage ? (
            <div className="flex flex-col gap-1 items-start">
              <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-sm border ${getTopicColor(triage.topic)}`}>
                {triage.topic}
              </span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-sm font-medium capitalize ${getUrgencyBadge(triage.urgency)}`}>
                {triage.urgency}
              </span>
            </div>
          ) : (
            <span className="text-xs text-gray-400 italic">Pending...</span>
          )}
        </td>

        {/* Sentiment Score & Indicators */}
        <td className="px-6 py-4" id={`cell-sentiment-${ticket.id}`}>
          {sentiment ? (
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${
                  sentiment.frustration_level >= 7 ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                }`}>
                  {sentiment.frustration_level}/10
                </span>
                {sentiment.escalatedByOverride && (
                  <span className="text-xs animate-pulse text-rose-600 font-extrabold" title="Sentiment Escalation Triggered">
                    🚩
                  </span>
                )}
              </div>
              <span className="text-[10px] text-gray-400 mt-1 italic leading-tight max-w-[120px] truncate" title={sentiment.override_reason || ""}>
                {sentiment.override_reason || "Calm / normal contact"}
              </span>
            </div>
          ) : (
            <span className="text-xs text-gray-400 italic">Pending...</span>
          )}
        </td>

        {/* Expandable Draft Reply Preview */}
        <td className="px-6 py-4 max-w-[150px]" id={`cell-draft-${ticket.id}`}>
          {firstDraft ? (
            <div className="flex flex-col items-start gap-1" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setIsDraftExpanded(!isDraftExpanded)}
                className="flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-800 hover:underline transition"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{isDraftExpanded ? "Hide Draft" : "View Draft"}</span>
                {isDraftExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              {firstDraft.detected_tone && (
                <span className={`text-[9px] uppercase font-bold px-1 py-0.2 rounded-sm tracking-wider ${
                  firstDraft.detected_tone === "formal" 
                    ? "bg-slate-100 text-slate-700 border border-slate-200" 
                    : "bg-purple-100 text-purple-700 border border-purple-200"
                }`}>
                  {firstDraft.detected_tone}
                </span>
              )}
              {isDraftExpanded && (
                <div className="absolute z-30 mt-14 bg-slate-900 text-slate-100 p-3 rounded-lg shadow-xl text-[11px] font-sans max-w-xs border border-slate-700 whitespace-pre-wrap max-h-48 overflow-y-auto">
                  <p className="font-semibold text-indigo-300 border-b border-slate-800 pb-1 mb-1.5 uppercase text-[9px] tracking-wider">
                    Specialist Reply Draft:
                  </p>
                  {revision?.revisedDraft || firstDraft.text}
                </div>
              )}
            </div>
          ) : (
            <span className="text-xs text-gray-400 italic">Pending...</span>
          )}
        </td>

        {/* Confidence & Reasons */}
        <td className="px-6 py-4 max-w-[150px]" id={`cell-confidence-${ticket.id}`}>
          {firstReview ? (
            <div className="flex flex-col items-start" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                  firstReview.confidence >= 80 ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                }`}>
                  {secondReview?.confidence || firstReview.confidence}%
                </span>
              </div>
              <button
                onClick={() => setIsReviewExpanded(!isReviewExpanded)}
                className="flex items-center gap-0.5 text-[10px] font-medium text-gray-500 hover:text-gray-700 hover:underline transition mt-1.5"
              >
                <Award className="w-3.5 h-3.5 text-gray-400" />
                <span>Details</span>
                {isReviewExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              {isReviewExpanded && (
                <div className="absolute z-30 mt-6 bg-white border border-gray-200 p-3 rounded-lg shadow-xl text-[11px] text-gray-700 max-w-xs font-sans leading-normal">
                  <p className="font-semibold text-gray-500 uppercase text-[9px] tracking-wider mb-1">
                    Reviewer Grading Details:
                  </p>
                  <p className="font-medium text-gray-900 border-b border-gray-100 pb-1 mb-1 capitalize">
                    Verdict: <strong className={firstReview.verdict === 'send' ? 'text-emerald-600':'text-rose-600'}>{secondReview?.verdict || firstReview.verdict}</strong>
                  </p>
                  <ul className="list-disc pl-4 space-y-0.5 mt-1">
                    {(secondReview?.reasons || firstReview.reasons).map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <span className="text-xs text-gray-400 italic">Pending...</span>
          )}
        </td>

        {/* Final Status Badge */}
        <td className="px-6 py-4 text-right" id={`cell-status-${ticket.id}`}>
          <div className="flex flex-col items-end gap-1">
            {renderStatusBadge()}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
              className="text-[10px] text-indigo-500 hover:text-indigo-800 hover:underline flex items-center gap-0.5 mt-1"
            >
              <span>Inspect audit</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </button>
          </div>
        </td>
      </tr>
    </>
  );
}
