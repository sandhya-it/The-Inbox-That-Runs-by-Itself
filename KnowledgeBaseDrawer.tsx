import React from "react";
import { BookOpen, AlertTriangle, HelpCircle, ShieldAlert, Receipt, RefreshCw } from "lucide-react";
import { KNOWLEDGE_BASE } from "../agentEngine";

interface KnowledgeBaseDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function KnowledgeBaseDrawer({ isOpen, onClose }: KnowledgeBaseDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" id="kb-drawer-container">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity" onClick={onClose} />
      
      <div className="absolute inset-y-0 right-0 max-w-lg w-full bg-white shadow-2xl flex flex-col h-full border-l border-gray-100">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900 font-sans tracking-tight">
              Agent Knowledge Base
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 p-1.5 hover:bg-gray-100 rounded-lg transition"
            aria-label="Close"
          >
            <span className="text-xl">&times;</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <p className="text-sm text-gray-500 leading-relaxed">
            These rules are injected inline as system prompt context for both the <strong>Specialist Agent</strong> (for reply drafting) and the <strong>Reviewer Agent</strong> (for draft grading).
          </p>

          <div className="space-y-4">
            {/* Rule 1 */}
            <div className="p-4 border border-indigo-100 bg-indigo-50/50 rounded-xl">
              <div className="flex items-center gap-2 mb-2 text-indigo-950 font-medium text-sm">
                <RefreshCw className="w-4 h-4 text-indigo-600" />
                <span>1. Refund Policy</span>
              </div>
              <ul className="text-xs text-indigo-900/85 space-y-1.5 list-disc pl-4">
                <li>Refunds issued for subscription/license transactions <strong>up to $500</strong> only.</li>
                <li>Refund requests MUST be initiated within <strong>14 days of purchase</strong>.</li>
                <li>Requests exceeding $500 or &gt;14 days ago <strong>must be escalated</strong>.</li>
              </ul>
            </div>

            {/* Rule 2 */}
            <div className="p-4 border border-emerald-100 bg-emerald-50/50 rounded-xl">
              <div className="flex items-center gap-2 mb-2 text-emerald-950 font-medium text-sm">
                <Receipt className="w-4 h-4 text-emerald-600" />
                <span>2. Double Charge Billing</span>
              </div>
              <ul className="text-xs text-emerald-900/85 space-y-1.5 list-disc pl-4">
                <li>Refund the duplicate charge immediately after checking database/Stripe logs.</li>
                <li>Inform them that a refund of the duplicate charge is initiated (takes <strong>3-5 business days</strong> to clear).</li>
              </ul>
            </div>

            {/* Rule 3 */}
            <div className="p-4 border border-amber-100 bg-amber-50/50 rounded-xl">
              <div className="flex items-center gap-2 mb-2 text-amber-950 font-medium text-sm">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>3. Account Lockouts</span>
              </div>
              <ul className="text-xs text-amber-900/85 space-y-1.5 list-disc pl-4">
                <li>No manual security lock overrides without proper verification.</li>
                <li>Instruct them to go to <strong>'Password Reset'</strong> page, request reset link, and wait 5 minutes.</li>
                <li>Do not manually unlock directly in email responses to maintain strict account security.</li>
              </ul>
            </div>

            {/* Rule 4 */}
            <div className="p-4 border border-blue-100 bg-blue-50/50 rounded-xl">
              <div className="flex items-center gap-2 mb-2 text-blue-950 font-medium text-sm">
                <HelpCircle className="w-4 h-4 text-blue-600" />
                <span>4. App Crashes & Glitches</span>
              </div>
              <ul className="text-xs text-blue-900/85 space-y-1.5 list-disc pl-4">
                <li>Standard troubleshooting: (1) Clear browser cookies/cache, (2) Try loading app in Incognito window, (3) Try a different browser.</li>
                <li>If issue persists, ask for their <strong>operating system version</strong> and <strong>browser type/version</strong> for engineering escalation.</li>
              </ul>
            </div>

            {/* Rule 5 */}
            <div className="p-4 border border-violet-100 bg-violet-50/50 rounded-xl">
              <div className="flex items-center gap-2 mb-2 text-violet-950 font-medium text-sm">
                <Receipt className="w-4 h-4 text-violet-600" />
                <span>5. Invoice Requests</span>
              </div>
              <ul className="text-xs text-violet-900/85 space-y-1.5 list-disc pl-4">
                <li>Invoices are self-service under <strong>'Settings' &gt; 'Billing'</strong>.</li>
                <li>If they claim they cannot access it, explain we are generating a PDF invoice and will email it directly.</li>
              </ul>
            </div>

            {/* Rule 6 */}
            <div className="p-4 border border-gray-100 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2 mb-2 text-gray-800 font-medium text-sm">
                <AlertTriangle className="w-4 h-4 text-gray-500" />
                <span>6. Out of Scope Guidelines</span>
              </div>
              <ul className="text-xs text-gray-600 space-y-1.5 list-disc pl-4">
                <li>For any issue not covered above (e.g. partnership deals, customized API tiers, complex legal disputes), the Specialist MUST state that it falls outside self-service guidelines and suggest escalation.</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-5">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Raw Prompt Injected text</h4>
            <pre className="text-[10px] font-mono text-gray-500 bg-gray-50 p-3 rounded-lg overflow-x-auto border border-gray-100 leading-normal max-h-48 overflow-y-auto">
              {KNOWLEDGE_BASE}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-xs hover:bg-gray-50 transition"
          >
            Close KB Reference
          </button>
        </div>
      </div>
    </div>
  );
}
