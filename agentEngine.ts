import { GoogleGenAI, Type } from "@google/genai";
import { 
  SupportTicket, 
  TicketTrace, 
  TriageOutput, 
  SentimentOutput, 
  DraftOutput, 
  ReviewOutput, 
  RevisionOutput, 
  BatchSummary 
} from "./types";

// Initialize Gemini client with standard environment variables and telemetry user-agent
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY || "dummy_key_for_build";
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
};

export const KNOWLEDGE_BASE = `
1. REFUND POLICY:
- We can issue full refunds only for subscription/license transactions up to $500.
- Refund requests MUST be initiated within 14 days of purchase.
- Any refund requests for purchases exceeding $500, or purchased more than 14 days ago, cannot be auto-processed and MUST be escalated.

2. DOUBLE CHARGE BILLING:
- If a customer claims they were charged twice, we can refund the duplicate charge immediately after checking the logs.
- Instruct them that we have initiated a refund of the second charge, and the funds should appear back in their account within 3 to 5 business days.

3. ACCOUNT LOCKOUTS / ACCESS PROBLEMS:
- For locked accounts, we cannot manually override security locks without verification to prevent hijacking.
- Instruct the user to visit our 'Password Reset' page, enter their email, click the reset link, and wait 5 minutes.
- Let them know that manual lockout releases are not supported directly in draft replies to maintain security.

4. APP CRASHES, WHITE SCREEN, & TECHNICAL GLITCHES:
- The standard troubleshooting procedure is: 
  (1) Clear browser cookies and cache.
  (2) Try loading the app in an Incognito/Private window.
  (3) Try a different browser (Chrome, Safari, or Firefox).
- If none of these steps resolve the issue, the specialist MUST ask them to reply with their operating system version and browser name/version so we can forward it to engineering.

5. INVOICE REQUESTS:
- Customers can view, download, and print all their historical invoices by going to 'Settings' > 'Billing' inside their user dashboard.
- If they are unable to access the billing page, tell them we are generating their invoice PDF and will email it to them shortly.

6. OUT OF SCOPE / GENERAL ENQUIRIES:
- If the ticket query is not covered by any of the rules above (e.g. custom partnership deals, detailed technical feature requests, complex billing disputes), the Specialist MUST state that the request falls outside of self-service policies and suggest escalating it to human specialists. Do not invent rules or policies.
`;

const MODEL_NAME = "gemini-3.5-flash";

/**
 * 1. Triage Agent: Classifies topic and urgency
 */
async function runTriageAgent(ai: GoogleGenAI, ticket: SupportTicket): Promise<TriageOutput> {
  const prompt = `You are a Triage Agent. Analyze this support ticket and classify its topic and urgency.
Ticket Subject: ${ticket.subject}
Ticket Body: ${ticket.body}

Topic taxonomy: 'billing', 'technical', 'refund', 'account', 'other'.
Urgency levels: 'low', 'medium', 'high'.`;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          topic: {
            type: Type.STRING,
            description: "Must be exactly one of: billing, technical, refund, account, other."
          },
          urgency: {
            type: Type.STRING,
            description: "Must be exactly one of: low, medium, high."
          },
          reasoning: {
            type: Type.STRING,
            description: "A very brief, clear explanation for this topic and urgency selection."
          }
        },
        required: ["topic", "urgency", "reasoning"]
      },
      temperature: 0.1
    }
  });

  const data = JSON.parse(response.text || "{}");
  return {
    topic: data.topic as any,
    urgency: data.urgency as any,
    reasoning: data.reasoning || "Triage complete."
  };
}

/**
 * 2. Sentiment/Urgency-Override Agent: Analyzes frustration and contact frequency
 */
async function runSentimentAgent(ai: GoogleGenAI, ticket: SupportTicket): Promise<SentimentOutput> {
  const prompt = `You are a Sentiment and Urgency Override Agent. Analyze this support ticket's customer mood, frustration indicators, priority triggers, and repeat contacts.
Customer Name: ${ticket.customerName}
Customer Email: ${ticket.email}
Ticket Subject: ${ticket.subject}
Ticket Body: ${ticket.body}
Previous Contact Count: ${ticket.previousContactsCount}

Evaluation Criteria:
1. Frustration level: score from 0 (completely calm/polite) to 10 (extremely angry, urgent threats, CAPITAL LETTERS, multiple exclamation marks).
2. Repeat contact: boolean. Mark true if previous contact count is > 0 OR if the customer states they have sent multiple emails already.
3. Urgency Keyword Check: Scan the ticket subject and body for urgency keywords: "urgent", "immediately", "asap", "as soon as possible", "right away", "critical", "emergency".
4. VIP Sender Check: Check if the customer's name, email, or a title in the ticket indicates they are a VIP (contains: HR, Chairman, CEO, Manager, Director).
5. Priority: Set to "fast-track" if any urgency keywords are found OR if is_vip_sender is true. Otherwise "normal".
6. Override reason: If frustration_level is >= 7 or repeat_contact is true, explain why. If priority is "fast-track", explain why. Else null.`;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          frustration_level: {
            type: Type.INTEGER,
            description: "Frustration level from 0 to 10."
          },
          repeat_contact: {
            type: Type.BOOLEAN,
            description: "Is this a repeat contact (history > 0 or explicitly claimed in body)?"
          },
          urgency_keywords_found: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "List of found urgency keywords (e.g., 'asap', 'urgent', 'immediately')."
          },
          is_vip_sender: {
            type: Type.BOOLEAN,
            description: "Is the sender a VIP (name, email, or body contains HR, Chairman, CEO, Manager, Director)?"
          },
          vip_title_matched: {
            type: Type.STRING,
            description: "The specific matched VIP title (e.g. 'HR Manager') or null if none."
          },
          priority: {
            type: Type.STRING,
            description: "Must be 'normal' or 'fast-track'."
          },
          override_reason: {
            type: Type.STRING,
            description: "Reason for escalation or fast-track, otherwise null."
          },
          reasoning: {
            type: Type.STRING,
            description: "Detailed analysis of emotional tone and priority cues."
          }
        },
        required: [
          "frustration_level",
          "repeat_contact",
          "urgency_keywords_found",
          "is_vip_sender",
          "vip_title_matched",
          "priority",
          "override_reason",
          "reasoning"
        ]
      },
      temperature: 0.1
    }
  });

  const data = JSON.parse(response.text || "{}");
  
  // Robust backup scanning to ensure nothing is missed
  const textToScan = `${ticket.subject} ${ticket.body}`.toLowerCase();
  const urgencyKeywordsList = ["urgent", "immediately", "asap", "as soon as possible", "right away", "critical", "emergency"];
  const localUrgencyFound = urgencyKeywordsList.filter(kw => textToScan.includes(kw));
  
  const nameEmailToScan = `${ticket.customerName} ${ticket.email}`.toLowerCase();
  const vipKeywordsList = ["hr", "chairman", "ceo", "manager", "director"];
  let localVipFound = false;
  let localVipTitle: string | null = null;
  
  for (const title of vipKeywordsList) {
    if (nameEmailToScan.includes(title)) {
      localVipFound = true;
      if (title === "hr") localVipTitle = "HR Manager";
      else if (title === "ceo") localVipTitle = "CEO";
      else localVipTitle = title.charAt(0).toUpperCase() + title.slice(1);
      break;
    }
  }

  const frustration = Number(data.frustration_level) || 0;
  const isRepeat = !!data.repeat_contact || ticket.previousContactsCount > 0;
  const escalatedByOverride = frustration >= 7 || isRepeat;
  
  const urgencyKeywordsCombined = Array.from(new Set([...(data.urgency_keywords_found || []), ...localUrgencyFound]));
  const isVipCombined = !!data.is_vip_sender || localVipFound;
  const vipTitleMatchedCombined = data.vip_title_matched || localVipTitle;
  const priorityCombined = (urgencyKeywordsCombined.length > 0 || isVipCombined) ? "fast-track" : (data.priority || "normal");

  return {
    frustration_level: frustration,
    repeat_contact: isRepeat,
    urgency_keywords_found: urgencyKeywordsCombined,
    is_vip_sender: isVipCombined,
    vip_title_matched: vipTitleMatchedCombined,
    priority: priorityCombined as "normal" | "fast-track",
    override_reason: data.override_reason || (priorityCombined === "fast-track" ? "Fast-tracked based on urgency or VIP status." : null),
    escalatedByOverride,
    reasoning: data.reasoning || "Sentiment analyzed."
  };
}

/**
 * 3. Specialist Agent: Drafts a reply based strictly on the knowledge base
 */
async function runSpecialistAgent(
  ai: GoogleGenAI, 
  ticket: SupportTicket, 
  topic: string, 
  criticism: string | null = null,
  previousDraft: string | null = null
): Promise<DraftOutput> {
  let prompt = `You are a Specialist Support Agent. Draft a reply to the customer based STRICTLY on the Knowledge Base rules. Do not invent policy under any circumstances!

First, classify the incoming support ticket's tone as 'formal' or 'informal'.
- formal: proper grammar, professional greeting/sign-off, no slang.
- informal: casual phrasing, contractions, exclamation marks, no formal greeting.

Draft an email response to the customer based STRICTLY on the Knowledge Base rules. Write your response to mirror the detected tone exactly:
- Formal in -> formal out: proper salutation (e.g. "Dear Sarah Jenkins"), complete sentences, professional sign-off (e.g. "Sincerely, Customer Support").
- Informal in -> informal out: friendly casual opener (e.g. "Hi James!"), contractions, friendly tone, no stiff corporate phrasing - but still accurate and grounded in the knowledge base.

=== KNOWLEDGE BASE ===
${KNOWLEDGE_BASE}
======================

=== CUSTOMER TICKET ===
Name: ${ticket.customerName}
Email: ${ticket.email}
Subject: ${ticket.subject}
Body: ${ticket.body}
Assigned Topic Category: ${topic}
=======================
`;

  if (criticism && previousDraft) {
    prompt += `
=== REVISION ASSIGNMENT ===
A previous draft was rejected by the Reviewer Agent. You are allowed ONE retry to improve it.
Previous Draft:
"${previousDraft}"

Reviewer Critique:
"${criticism}"

Please revise the draft to address the reviewer's critiques, making sure to stick strictly to the Knowledge Base rules AND continue mirroring the detected tone of the customer.
==========================
`;
  } else {
    prompt += `
Instructions:
- Write an empathetic email response.
- Rely ONLY on the Knowledge Base. If the Knowledge Base does not cover this issue or the request exceeds thresholds (such as refund over $500), explicitly state that the request falls outside self-service guidelines and will be escalated to a senior team.
- Do NOT make up any policies.
`;
  }

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          detected_tone: {
            type: Type.STRING,
            description: "Must be 'formal' or 'informal' based on classifying the incoming ticket's tone."
          },
          draft: {
            type: Type.STRING,
            description: "The complete draft email to the customer. Written to mirror the detected tone of the ticket (formal -> formal, informal -> informal)."
          },
          groundedSourceRules: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "List the section headers or rules from the Knowledge Base utilized in this draft."
          },
          reasoning: {
            type: Type.STRING,
            description: "Briefly explain how your draft aligns with the Knowledge Base guidelines."
          }
        },
        required: ["detected_tone", "draft", "groundedSourceRules", "reasoning"]
      },
      temperature: 0.2
    }
  });

  const data = JSON.parse(response.text || "{}");
  return {
    text: data.draft || data.text || "No draft generated.",
    groundedSourceRules: data.groundedSourceRules || [],
    reasoning: data.reasoning || "Draft created.",
    detected_tone: (data.detected_tone as "formal" | "informal") || "formal"
  };
}

/**
 * 4. Reviewer Agent: Grades the draft
 */
async function runReviewerAgent(
  ai: GoogleGenAI, 
  ticket: SupportTicket, 
  draft: string
): Promise<ReviewOutput> {
  const prompt = `You are a Quality Control Reviewer Agent. Your job is to grade the specialist's draft reply against the Knowledge Base guidelines and the customer's request.

=== KNOWLEDGE BASE ===
${KNOWLEDGE_BASE}
======================

=== CUSTOMER TICKET ===
Subject: ${ticket.subject}
Body: ${ticket.body}
=======================

=== SPECIALIST DRAFT REPLY ===
"${draft}"
==============================

Tasks:
1. Grade confidence (0 to 100):
   - 100 if perfect, safe, and complies strictly with the knowledge base.
   - Low confidence if there are hallucinated policies, missing required details, or policy gaps.
2. Formulate specific 'reasons' for your verdict. (Be specific and human-readable, e.g. "Refund policy for orders >$500 not found in knowledge base" or "Failed to ask user for operating system and browser type").
3. Determine 'verdict':
   - 'send': If the draft is completely accurate, safe, and resolves the issue according to the Knowledge Base (or correctly states it will escalate due to thresholds).
   - 'revise': If the specialist made minor omissions, forgot standard troubleshooting steps, or could make a much better response *using the current Knowledge Base rules*. (Only trigger 'revise' if a second attempt can actually solve it under the KB).
   - 'escalate': If there is a major policy gap, the draft is wildly unsafe, or the request falls completely out of scope of self-service.`;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          confidence: {
            type: Type.INTEGER,
            description: "Confidence percentage from 0 to 100."
          },
          reasons: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Specific human-readable list of critiques, compliments, or issues found in the draft."
          },
          verdict: {
            type: Type.STRING,
            description: "Must be exactly one of: send, revise, escalate."
          },
          reasoning: {
            type: Type.STRING,
            description: "Detailed quality control checklist and explanation of final grade."
          }
        },
        required: ["confidence", "reasons", "verdict", "reasoning"]
      },
      temperature: 0.1
    }
  });

  const data = JSON.parse(response.text || "{}");
  return {
    confidence: Number(data.confidence) || 0,
    reasons: data.reasons || [],
    verdict: (data.verdict as any) || "escalate",
    reasoning: data.reasoning || "Review completed."
  };
}

/**
 * Orchestrate a single ticket through the multi-agent pipeline
 */
export async function processTicketThroughPipeline(
  ticket: SupportTicket,
  onStageUpdate?: (stage: string, progressTrace: Partial<TicketTrace>) => void
): Promise<TicketTrace> {
  const ai = getGeminiClient();
  const trace: TicketTrace = {
    id: ticket.id,
    ticket,
    status: "processing",
    currentStage: "triage",
    triage: null,
    sentiment: null,
    firstDraft: null,
    firstReview: null,
    revision: null,
    secondDraft: null,
    secondReview: null,
    finalDecision: null
  };

  const update = (stage: typeof trace.currentStage, data: Partial<TicketTrace>) => {
    trace.currentStage = stage;
    Object.assign(trace, data);
    if (onStageUpdate) {
      onStageUpdate(stage, { ...trace });
    }
  };

  try {
    // Stage 1: Triage
    update("triage", {});
    // Small artificial delay for demo pacing (e.g., 500ms)
    await new Promise((r) => setTimeout(r, 600));
    const triage = await runTriageAgent(ai, ticket);
    update("triage", { triage });

    // Stage 2: Sentiment
    update("sentiment", {});
    await new Promise((r) => setTimeout(r, 600));
    const sentiment = await runSentimentAgent(ai, ticket);
    update("sentiment", { sentiment });

    // Check for auto-override escalation right away
    if (sentiment.escalatedByOverride) {
      // Create final decision immediately as sentiment override escalation
      const finalDecision = {
        verdict: "escalated" as const,
        escalationReason: `🚩 Escalated by Sentiment Agent override: ${sentiment.override_reason || "Extreme customer frustration or high contact frequency."}`,
        replyText: null,
        timestamp: new Date().toISOString()
      };
      
      // Even in override, we can optionally run a Specialist draft just to show the draft trace,
      // but since it's an auto-escalation, the draft isn't sent. Let's create a quick draft so the trace looks super rich!
      try {
        const firstDraft = await runSpecialistAgent(ai, ticket, triage.topic);
        update("done", {
          firstDraft,
          status: "escalated",
          finalDecision
        });
      } catch (err) {
        update("done", {
          status: "escalated",
          finalDecision
        });
      }
      return trace;
    }

    // Stage 3: Specialist First Draft
    update("draft", {});
    await new Promise((r) => setTimeout(r, 600));
    const firstDraft = await runSpecialistAgent(ai, ticket, triage.topic);
    update("draft", { firstDraft });

    // Stage 4: Review First Draft
    update("review", {});
    await new Promise((r) => setTimeout(r, 600));
    const firstReview = await runReviewerAgent(ai, ticket, firstDraft.text);
    update("review", { firstReview });

    if (firstReview.verdict === "send") {
      update("done", {
        status: "sent",
        finalDecision: {
          verdict: "sent",
          escalationReason: null,
          replyText: firstDraft.text,
          timestamp: new Date().toISOString()
        }
      });
      return trace;
    }

    if (firstReview.verdict === "escalate") {
      update("done", {
        status: "escalated",
        finalDecision: {
          verdict: "escalated",
          escalationReason: `Escalated by Reviewer Agent: ${firstReview.reasons.join("; ") || "Draft did not meet quality/policy rules."}`,
          replyText: null,
          timestamp: new Date().toISOString()
        }
      });
      return trace;
    }

    // Revision loop: firstReview.verdict === "revise"
    update("draft", {}); // Specialist gets the ticket back for revision
    await new Promise((r) => setTimeout(r, 600));
    
    const revision: RevisionOutput = {
      revisedDraft: "",
      reasoning: "Reviewer requested revision: " + firstReview.reasons.join(", ")
    };
    
    const secondDraft = await runSpecialistAgent(
      ai, 
      ticket, 
      triage.topic, 
      firstReview.reasons.join(" "), 
      firstDraft.text
    );
    revision.revisedDraft = secondDraft.text;

    update("draft", { revision, secondDraft });

    // Review second draft
    update("review", {});
    await new Promise((r) => setTimeout(r, 600));
    const secondReview = await runReviewerAgent(ai, ticket, secondDraft.text);
    update("review", { secondReview });

    if (secondReview.verdict === "send") {
      update("done", {
        status: "revised_then_sent",
        finalDecision: {
          verdict: "revised_then_sent",
          escalationReason: null,
          replyText: secondDraft.text,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      // Any verdict other than "send" on retry escalates
      update("done", {
        status: "escalated",
        finalDecision: {
          verdict: "escalated",
          escalationReason: `Escalated after unsuccessful revision: ${secondReview.reasons.join("; ") || "Revised draft still did not meet quality standards."}`,
          replyText: null,
          timestamp: new Date().toISOString()
        }
      });
    }

  } catch (error: any) {
    console.error("Pipeline failure for ticket", ticket.id, error);
    update("done", {
      status: "escalated",
      error: error.message || "Unknown error",
      finalDecision: {
        verdict: "escalated",
        escalationReason: `⚠️ Pipeline system error: ${error.message || "Agent execution failed. Escalate for human review."}`,
        replyText: null,
        timestamp: new Date().toISOString()
      }
    });
  }

  return trace;
}

/**
 * 5. Summary/ROI Agent: Analyzes the batch outcomes
 */
export async function runSummaryAgent(
  traces: TicketTrace[], 
  resolvedCount: number, 
  escalatedCount: number, 
  revisedCount: number, 
  timeSavedMinutes: number
): Promise<BatchSummary> {
  const ai = getGeminiClient();
  const summaryInputs = traces.map(t => ({
    id: t.id,
    subject: t.ticket.subject,
    customer: t.ticket.customerName,
    sentimentEscalation: t.sentiment?.escalatedByOverride || false,
    finalVerdict: t.finalDecision?.verdict || "escalated",
    escalationReason: t.finalDecision?.escalationReason || null,
    topic: t.triage?.topic || "other",
    urgency: t.triage?.urgency || "medium"
  }));

  const prompt = `You are a Summary and ROI Agent. Analyze the outcomes of this support ticket automation batch.
Computed statistics:
- Total tickets processed: ${traces.length}
- Auto-resolved and sent successfully: ${resolvedCount + revisedCount} (of which ${revisedCount} required a draft revision loop)
- Escalated to humans: ${escalatedCount}
- Estimated support time saved: ${timeSavedMinutes} minutes (calculated as 4 minutes saved per auto-resolved ticket)

Trace summary of tickets:
${JSON.stringify(summaryInputs, null, 2)}

Task:
Generate a single, extremely professional, inspiring summary narrative that outlines the efficiency gains, highlights key automated actions (especially mentioning the 🚩 Sentiment/Urgency-override or any reviewer-forced revision outcomes), and highlights the ROI.
Format: Return exactly the JSON object containing 'batchAnalysis'. It should be concise (1-2 sentences) and include the final stats (e.g., '6 auto-resolved · 2 escalated · ~24 min saved') at the start.`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            batchAnalysis: {
              type: Type.STRING,
              description: "A professional and punchy ROI summary starting with stats and explaining agent actions."
            }
          },
          required: ["batchAnalysis"]
        },
        temperature: 0.2
      }
    });

    const data = JSON.parse(response.text || "{}");
    return {
      totalTickets: traces.length,
      resolvedCount,
      escalatedCount,
      revisedCount,
      timeSavedMinutes,
      batchAnalysis: data.batchAnalysis || `${resolvedCount + revisedCount} auto-resolved · ${escalatedCount} escalated · ~${timeSavedMinutes} min saved. All ticket traces resolved with fully auditable reasoning.`
    };
  } catch (err) {
    console.error("Summary Agent failed", err);
    return {
      totalTickets: traces.length,
      resolvedCount,
      escalatedCount,
      revisedCount,
      timeSavedMinutes,
      batchAnalysis: `${resolvedCount + revisedCount} auto-resolved · ${escalatedCount} escalated · ~${timeSavedMinutes} min saved · ~${traces.length * 4} min overall potential. Pipeline completed with full transparency.`
    };
  }
}
