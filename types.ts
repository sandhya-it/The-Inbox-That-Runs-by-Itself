export interface SupportTicket {
  id: string;
  customerName: string;
  email: string;
  subject: string;
  body: string;
  createdAt: string;
  previousContactsCount: number;
}

export type TicketStatus = "idle" | "processing" | "sent" | "revised_then_sent" | "escalated";
export type PipelineStage = "idle" | "triage" | "sentiment" | "draft" | "review" | "done";

export interface TriageOutput {
  topic: "billing" | "technical" | "refund" | "account" | "other";
  urgency: "low" | "medium" | "high";
  reasoning: string;
}

export interface SentimentOutput {
  frustration_level: number; // 0-10
  repeat_contact: boolean;
  urgency_keywords_found: string[];
  is_vip_sender: boolean;
  vip_title_matched: string | null;
  priority: "normal" | "fast-track";
  override_reason: string | null;
  escalatedByOverride: boolean;
  reasoning: string;
}

export interface DraftOutput {
  text: string;
  groundedSourceRules: string[];
  reasoning: string;
  detected_tone?: "formal" | "informal";
}

export interface ReviewOutput {
  confidence: number; // 0-100
  reasons: string[];
  verdict: "send" | "revise" | "escalate";
  reasoning: string;
}

export interface RevisionOutput {
  revisedDraft: string;
  reasoning: string;
}

export interface TicketTrace {
  id: string;
  ticket: SupportTicket;
  status: TicketStatus;
  currentStage: PipelineStage;
  triage: TriageOutput | null;
  sentiment: SentimentOutput | null;
  firstDraft: DraftOutput | null;
  firstReview: ReviewOutput | null;
  revision: RevisionOutput | null;
  secondDraft: DraftOutput | null; // One retry draft if first verdict was "revise"
  secondReview: ReviewOutput | null; // Review for the retry draft
  finalDecision: {
    verdict: "sent" | "revised_then_sent" | "escalated";
    escalationReason: string | null;
    replyText: string | null;
    timestamp: string;
  } | null;
  error?: string;
}

export interface BatchSummary {
  totalTickets: number;
  resolvedCount: number;
  escalatedCount: number;
  revisedCount: number;
  timeSavedMinutes: number; // resolvedCount * 4
  batchAnalysis: string; // Dynamic ROI narrative from the Summary Agent
}
