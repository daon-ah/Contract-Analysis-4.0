import React, { useState } from 'react';
import { 
  Scale, 
  Check, 
  Sparkles, 
  Edit3, 
  RotateCcw, 
  ShieldCheck, 
  ArrowRight,
  Filter,
  CheckCircle2,
  XCircle,
  MessageSquare
} from 'lucide-react';
import { Contract, Clause, NegotiationStance } from '../../types';

interface Article3NegotiationProps {
  contract: Contract | null;
  onAcceptRewrite: (clauseId: string, rewriteText: string) => void;
  onOpenCounsel: (query?: string) => void;
}

export const Article3Negotiation: React.FC<Article3NegotiationProps> = ({
  contract,
  onAcceptRewrite,
  onOpenCounsel
}) => {
  if (!contract) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[#FAF8F5] flex items-center justify-center p-8 font-serif text-[#6E6D6A]">
        Please upload or select a contract document to begin redline negotiation.
      </div>
    );
  }

  const [activeStance, setActiveStance] = useState<NegotiationStance>('balanced');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  const categories = ['ALL', 'Indemnification', 'Limitation of Liability', 'Payment Terms', 'Termination', 'IP Rights'];

  const filteredClauses = contract.clauses.filter(c => {
    if (filterCategory === 'ALL') return true;
    return c.category === filterCategory;
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#FAF8F5] py-10 px-4 sm:px-6 lg:px-8 font-serif">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Article III Header Document Card */}
        <div className="paper-sheet p-8 sm:p-10 rounded-sm border border-[#E6E2DC] space-y-6">
          <div className="border-b-2 border-[#1C1C1A] pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="text-xs font-mono font-bold tracking-[0.2em] text-[#9E824A] uppercase block mb-1">
                LEGAL REDLINE INSTRUMENT
              </span>
              <h1 className="text-3xl font-serif font-bold text-[#1C1C1A]">
                Redline & Side-by-Side Negotiation
              </h1>
            </div>

            {/* Negotiation Stance Switcher */}
            <div className="flex items-center gap-2 bg-[#F8F5F0] p-1.5 rounded-xs border border-[#E6E2DC] font-sans text-xs">
              <span className="font-mono text-[10px] text-[#6E6D6A] font-bold px-2 uppercase">STANCE:</span>
              {(['protective', 'balanced', 'aggressive'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setActiveStance(s)}
                  className={`px-3 py-1 rounded-xs font-semibold capitalize cursor-pointer transition-all ${
                    activeStance === s
                      ? 'bg-[#2C4235] text-white shadow-xs'
                      : 'text-[#6E6D6A] hover:text-[#1C1C1A]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <p className="text-sm font-serif-editorial italic text-[#6E6D6A] leading-relaxed">
            &quot;Governs the redline comparison between counterparty terms and AI proposed safe alternatives. Strikethrough represents removed risk provisions, and green underline represents newly inserted protective covenants.&quot;
          </p>

          {/* Filter Bar */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar font-sans text-xs border-t border-[#E6E2DC] pt-4">
            <span className="text-[#6E6D6A] font-mono font-bold flex items-center gap-1 mr-2">
              <Filter className="w-3.5 h-3.5" /> Filter Category:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1 rounded-xs font-mono text-[11px] font-bold uppercase transition-colors cursor-pointer ${
                  filterCategory === cat
                    ? 'bg-[#2C4235] text-white'
                    : 'bg-[#F8F5F0] text-[#6E6D6A] hover:bg-[#E6E2DC] hover:text-[#1C1C1A]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Clauses Redline Inventory */}
        <div className="space-y-6">
          {filteredClauses.map((clause) => {
            const isAccepted = clause.acceptedRewrite;
            
            // Choose rewrite text based on active stance
            let currentRewriteText = clause.suggestedRewrite;
            if (activeStance === 'protective') {
              currentRewriteText = clause.buyerRewrite || `[Customer Protective] ${clause.suggestedRewrite.replace(/12 months/gi, "6 months").replace(/CPI/gi, "fixed 2%")}`;
            } else if (activeStance === 'aggressive') {
              currentRewriteText = clause.sellerRewrite || `[Aggressive Pushback] Strike Section ${clause.sectionNumber} in its entirety or substitute mutual capped indemnity.`;
            }

            return (
              <div
                key={clause.id}
                className={`paper-sheet p-6 sm:p-8 rounded-sm border transition-all ${
                  isAccepted
                    ? 'border-[#3B6E52] bg-[#3B6E52]/5'
                    : 'border-[#E6E2DC] bg-white'
                }`}
              >
                {/* Clause Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[#E6E2DC] pb-4 mb-4 font-sans">
                  <div>
                    <span className="font-mono text-xs font-bold text-[#2C4235] mr-2">
                      {clause.sectionNumber}
                    </span>
                    <span className="font-serif text-lg font-bold text-[#1C1C1A]">
                      {clause.title}
                    </span>
                    <span className="ml-2 font-mono text-[10px] text-[#6E6D6A] uppercase">
                      ({clause.category})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      clause.riskLevel === 'HIGH' ? 'bg-[#A83832]/10 text-[#A83832]' : 'bg-[#B87A2B]/10 text-[#B87A2B]'
                    }`}>
                      {clause.riskLevel} RISK
                    </span>
                    {isAccepted && (
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[#3B6E52] text-white flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> ACCEPTED DRAFT
                      </span>
                    )}
                  </div>
                </div>

                {/* Side-by-Side Wording Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Left: Counterparty Original */}
                  <div className="space-y-2">
                    <div className="text-xs font-mono font-bold text-[#A83832] uppercase tracking-wider flex items-center justify-between">
                      <span>ORIGINAL COUNTERPARTY TEXT</span>
                      <span className="text-[10px] text-[#6E6D6A]">PAGE {clause.pageNumber}</span>
                    </div>
                    <div className="p-4 bg-[#F8F5F0] border border-[#E6E2DC] rounded-xs text-xs font-serif leading-relaxed text-[#1C1C1A]">
                      <span className="redline-deleted">
                        {clause.originalText}
                      </span>
                    </div>
                    <p className="text-[11px] font-sans text-[#6E6D6A]">
                      <strong className="text-[#A83832]">Risk:</strong> {clause.riskExplanation}
                    </p>
                  </div>

                  {/* Right: AI Redline Draft */}
                  <div className="space-y-2">
                    <div className="text-xs font-mono font-bold text-[#2C4235] uppercase tracking-wider flex items-center justify-between">
                      <span>AI REDLINED SAFER ALTERNATIVE</span>
                      <span className="text-[10px] text-[#2C4235] font-bold">
                        {clause.confidenceScore}% CONFIDENCE
                      </span>
                    </div>
                    <div className="p-4 bg-[#2C4235]/5 border border-[#2C4235]/30 rounded-xs text-xs font-serif leading-relaxed text-[#1C1C1A]">
                      <span className="redline-added">
                        {clause.customRewrite || currentRewriteText}
                      </span>
                    </div>
                    <p className="text-[11px] font-sans text-[#2C4235]">
                      <strong>Advice:</strong> {clause.negotiationAdvice}
                    </p>
                  </div>

                </div>

                {/* Clause Action Buttons */}
                <div className="mt-6 pt-4 border-t border-[#E6E2DC] flex flex-wrap items-center justify-between gap-3 font-sans text-xs">
                  <button
                    onClick={() => onOpenCounsel(`Explain Section ${clause.sectionNumber} and give negotiation tactics`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF8F5] border border-[#E6E2DC] text-[#1C1C1A] hover:bg-[#F3EFEA] rounded-xs font-semibold cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-[#2C4235]" />
                    <span>Discuss Section with AI Counsel</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onAcceptRewrite(clause.id, currentRewriteText)}
                      className={`px-4 py-2 font-serif font-semibold rounded-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer ${
                        isAccepted
                          ? 'bg-[#3B6E52] text-white hover:bg-[#2C523C]'
                          : 'bg-[#2C4235] text-white hover:bg-[#1E2E25]'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                      <span>{isAccepted ? 'Update Accepted Draft' : 'Accept AI Redline Into Draft'}</span>
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
