import React, { useState } from 'react';
import { Copy, Check, Cpu, AlertTriangle, ShieldCheck, Sparkles } from 'lucide-react';
import { Clause } from '../../types';

interface BackendAIResultCardProps {
  clause: Clause;
  className?: string;
  onCopy?: () => void;
}

export const BackendAIResultCard: React.FC<BackendAIResultCardProps> = ({ clause, className = '', onCopy }) => {
  const [copied, setCopied] = useState(false);

  // Helper to get default possible consequences based on clause category & risk
  const getConsequences = (c: Clause): string[] => {
    if (c.consequences && c.consequences.length > 0) {
      return c.consequences;
    }

    if (c.category === 'Indemnification' || c.title.toLowerCase().includes('indemn')) {
      return ['Uncapped third-party financial exposure', 'Unilateral defense burden on customer', 'Broad legal fee indemnification risks'];
    }
    if (c.category === 'Limitation of Liability' || c.title.toLowerCase().includes('liabil')) {
      return ['Uncapped damages exposure for customer', 'Asymmetric risk allocation between parties', 'Lack of recovery for indirect losses'];
    }
    if (c.category === 'Payment Terms' || c.title.toLowerCase().includes('payment')) {
      return ['Automatic 12% price hike on renewals', 'No prior notice required for rate increases', 'Cash flow strain from tight payment windows'];
    }
    if (c.category === 'Termination' || c.title.toLowerCase().includes('terminat')) {
      return ['Risk of immediate data deletion (14-day window)', 'Loss of operational continuity', 'Vendor lock-in without transition grace period'];
    }
    if (c.category === 'IP Rights') {
      return ['Intellectual property ownership disputes', 'Overly broad usage license scope', 'Risk of patent/copyright claims'];
    }

    if (c.riskLevel === 'HIGH') {
      return ['Uncapped financial liability', 'Legal dispute exposure', 'Unfavorable contract terms'];
    } else if (c.riskLevel === 'MEDIUM') {
      return ['Operational ambiguity', 'Unexpected fee escalations', 'Non-standard procedural terms'];
    } else {
      return ['Standard administrative term', 'Low operational risk'];
    }
  };

  const consequences = getConsequences(clause);

  const formattedRawText = `Clause:
"${clause.originalText}"

Risk Level: ${clause.riskLevel}
AI Confidence: ${clause.confidenceScore}%

Reason:
${clause.riskExplanation}

Possible Consequences:
${consequences.map(item => `• ${item}`).join('\n')}

Suggested Revision:
${clause.suggestedRewrite}`;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(formattedRawText);
    setCopied(true);
    if (onCopy) onCopy();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`bg-[#FAF8F5] border border-[#E5E0D5] rounded-xl p-4 sm:p-5 text-[#1C1C1A] font-sans shadow-xs space-y-4 ${className}`}>
      
      {/* Top Header Badge & Copy Button */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E8E3D8]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#2C4235]/10 rounded-md text-[#2C4235]">
            <Cpu className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-mono tracking-wider text-[#2C4235] font-bold uppercase">
            AI Analysis Matrix
          </span>
        </div>

        <button
          onClick={handleCopy}
          className="px-2.5 py-1 rounded-md bg-white hover:bg-[#F2EFE8] text-[#2C4235] transition-all cursor-pointer flex items-center gap-1.5 text-xs font-mono border border-[#DDD8CB] shadow-2xs"
          title="Copy formatted AI result text"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-[#2C4235]" />
              <span className="text-[#2C4235] text-[11px] font-sans font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-[#6A6A6A]" />
              <span className="text-[#4A4A4A] text-[11px] font-sans font-medium">Copy Result</span>
            </>
          )}
        </button>
      </div>

      {/* Clause Original Text */}
      <div className="space-y-1">
        <span className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#6A6A6A]">
          Clause Passage:
        </span>
        <p className="text-xs sm:text-[13px] font-serif italic text-[#2A2A28] bg-white p-3 rounded-lg border border-[#E2DDD2] leading-relaxed">
          &quot;{clause.originalText}&quot;
        </p>
      </div>

      {/* Risk Level & AI Confidence Badges */}
      <div className="grid grid-cols-2 gap-2.5 pt-1">
        <div className="bg-white p-2.5 rounded-lg border border-[#E2DDD2]">
          <span className="block text-[10px] font-mono uppercase tracking-wider text-[#6A6A6A] mb-1">
            Risk Assessment
          </span>
          <span className={`inline-block font-mono font-bold text-xs px-2 py-0.5 rounded ${
            clause.riskLevel === 'HIGH' 
              ? 'bg-[#A83832]/10 text-[#A83832]' 
              : clause.riskLevel === 'MEDIUM' 
              ? 'bg-[#B87A2B]/10 text-[#B87A2B]' 
              : 'bg-[#2C4235]/10 text-[#2C4235]'
          }`}>
            {clause.riskLevel} RISK
          </span>
        </div>

        <div className="bg-white p-2.5 rounded-lg border border-[#E2DDD2]">
          <span className="block text-[10px] font-mono uppercase tracking-wider text-[#6A6A6A] mb-1">
            AI Confidence
          </span>
          <span className="inline-block font-mono font-bold text-xs text-[#2C4235]">
            {clause.confidenceScore}% Match
          </span>
        </div>
      </div>

      {/* Reason Explanation */}
      <div className="space-y-1">
        <span className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#6A6A6A]">
          Analysis Reason:
        </span>
        <p className="text-xs text-[#1C1C1A] bg-white p-3 rounded-lg border border-[#E2DDD2] leading-relaxed">
          {clause.riskExplanation}
        </p>
      </div>

      {/* Possible Consequences */}
      <div className="space-y-1">
        <span className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#A83832]">
          Possible Consequences:
        </span>
        <div className="bg-white p-3 rounded-lg border border-[#E2DDD2] space-y-1.5">
          {consequences.map((cons, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs text-[#2C2C2A] leading-snug">
              <span className="text-[#A83832] font-bold text-sm leading-none">•</span>
              <span>{cons}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Suggested Revision */}
      <div className="space-y-1">
        <span className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#2C4235]">
          Suggested Revision:
        </span>
        <p className="text-xs font-serif text-[#1C3B2F] bg-[#2C4235]/8 p-3 rounded-lg border border-[#2C4235]/25 leading-relaxed font-medium">
          {clause.suggestedRewrite}
        </p>
      </div>

    </div>
  );
};
