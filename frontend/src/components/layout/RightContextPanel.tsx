import React from 'react';
import { 
  Sparkles, 
  Check, 
  Edit3, 
  MessageSquare,
  Scale
} from 'lucide-react';
import { Contract, Clause } from '../../types';
import { BackendAIResultCard } from '../common/BackendAIResultCard';

interface RightContextPanelProps {
  contract: Contract;
  selectedClause: Clause | null;
  onAcceptRewrite: (clauseId: string, rewriteText: string) => void;
  onOpenNegotiation: (clause: Clause) => void;
  onOpenCounsel: (query?: string) => void;
}

export const RightContextPanel: React.FC<RightContextPanelProps> = ({
  contract,
  selectedClause,
  onAcceptRewrite,
  onOpenNegotiation,
  onOpenCounsel
}) => {
  if (!selectedClause) {
    // EXECUTIVE SUMMARY VIEW (When no clause is selected)
    const highCount = contract.clauses.filter(c => c.riskLevel === 'HIGH').length;
    const medCount = contract.clauses.filter(c => c.riskLevel === 'MEDIUM').length;
    const safeCount = contract.clauses.filter(c => c.riskLevel === 'LOW' || c.riskLevel === 'SAFE').length;

    return (
      <aside className="w-80 lg:w-96 bg-white border-l border-[#EAEAEA] flex flex-col h-full select-none shrink-0 overflow-y-auto p-4 space-y-6 pb-24">
        
        {/* Panel Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#EAEAEA]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#2C4235]/10 rounded-md text-[#2C4235]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-serif font-semibold text-[#181818]">Executive AI Intelligence</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#6A6A6A]">Overview & Risk Matrix</p>
            </div>
          </div>
        </div>

        {/* Contract Health Score Hero Indicator */}
        <div className="p-5 bg-[#FAF8F5] rounded-xl border border-[#E5E0D5] text-center space-y-3">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#6A6A6A]">
            DOCUMENT HEALTH
          </span>
          <div className="flex items-center justify-center gap-2">
            <span className={`text-4xl font-light font-serif ${
              contract.healthScore < 70 ? 'text-[#A83832]' : contract.healthScore < 85 ? 'text-[#B87A2B]' : 'text-[#2C4235]'
            }`}>
              {contract.healthScore}
            </span>
            <span className="text-sm font-mono text-[#6A6A6A]">/ 100</span>
          </div>
          
          <div className="w-full bg-[#EAE6DC] h-1.5 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                contract.healthScore < 70 ? 'bg-[#A83832]' : contract.healthScore < 85 ? 'bg-[#B87A2B]' : 'bg-[#2C4235]'
              }`}
              style={{ width: `${contract.healthScore}%` }}
            ></div>
          </div>

          <div className="grid grid-cols-3 gap-1 pt-3 text-[10px] font-mono border-t border-[#E8E3D8]">
            <div>
              <span className="text-[#A83832] font-bold">{highCount}</span>
              <p className="text-[#6A6A6A] font-medium uppercase tracking-wider text-[9px]">High Risks</p>
            </div>
            <div>
              <span className="text-[#B87A2B] font-bold">{medCount}</span>
              <p className="text-[#6A6A6A] font-medium uppercase tracking-wider text-[9px]">Medium</p>
            </div>
            <div>
              <span className="text-[#2C4235] font-bold">{safeCount}</span>
              <p className="text-[#6A6A6A] font-medium uppercase tracking-wider text-[9px]">Safe/Low</p>
            </div>
          </div>
        </div>

        {/* Executive Opinion */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-[#EAEAEA] pb-2">
            <h3 className="text-base font-serif font-semibold text-[#181818]">
              Executive Opinion
            </h3>
            <Scale className="w-4 h-4 text-[#2C4235]" />
          </div>
          <div className="space-y-3 text-xs leading-relaxed text-[#181818] p-4 bg-[#FAF8F5] rounded-xl border border-[#E5E0D5]">
            {contract.executiveOpinion.split('. ').map((sentence, sIdx) => sentence.trim() ? (
              <div key={sIdx} className="flex gap-2.5">
                <span className="text-[11px] font-bold text-[#2C4235] min-w-[20px] font-mono">0{sIdx + 1}.</span>
                <span className="leading-relaxed">{sentence.endsWith('.') ? sentence : `${sentence}.`}</span>
              </div>
            ) : null)}
          </div>
        </div>

        {/* Top Critical Risks */}
        <div className="space-y-3">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#6A6A6A] block border-b border-[#EAEAEA] pb-1">
            Top Priority Liabilities
          </span>
          <div className="space-y-2">
            {contract.topRisks.map((risk, idx) => (
              <div 
                key={idx} 
                className="p-3 bg-[#FAF8F5] border-l-2 border-[#A83832] border-y border-r border-[#E5E0D5] rounded-lg text-xs text-[#181818] space-y-1"
              >
                <div className="flex items-center gap-1.5 font-bold text-[#A83832] text-[10px] tracking-wider uppercase font-mono">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#A83832]"></div>
                  <span>High Risk #{idx + 1}</span>
                </div>
                <p className="leading-snug text-xs font-medium text-[#2C2C2A]">{risk}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Governing Metadata */}
        <div className="p-3 bg-[#FAF8F5] rounded-lg border border-[#E5E0D5] space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-[#6A6A6A]">Jurisdiction:</span>
            <span className="font-medium text-[#181818]">{contract.governingLaw}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#6A6A6A]">File Size:</span>
            <span className="font-mono text-[#181818]">{contract.fileSize}</span>
          </div>
        </div>

        {/* Call to Action */}
        <button
          onClick={() => onOpenCounsel('Summarize the top negotiation strategies for this contract')}
          className="w-full py-2.5 px-3 bg-[#2C4235] text-white text-xs font-medium rounded-lg hover:bg-[#1C3B2F] transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-xs"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Ask AI Legal Counsel About Contract</span>
        </button>

      </aside>
    );
  }

  // SELECTED CLAUSE BREAKDOWN VIEW
  return (
    <aside className="w-80 lg:w-96 bg-white border-l border-[#EAEAEA] flex flex-col h-full select-none shrink-0 overflow-y-auto p-4 space-y-4 pb-24">
      
      {/* Header */}
      <div className="pb-3 border-b border-[#EAEAEA] space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-serif italic font-semibold text-[#2C4235]">
            Clause Detail
          </h3>
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
            selectedClause.riskLevel === 'HIGH' ? 'bg-[#A83832]/10 text-[#A83832]' :
            selectedClause.riskLevel === 'MEDIUM' ? 'bg-[#B87A2B]/10 text-[#B87A2B]' : 'bg-[#2C4235]/10 text-[#2C4235]'
          }`}>
            {selectedClause.riskLevel} Risk
          </span>
        </div>
        
        <div className="text-xs font-mono font-bold text-[#181818] truncate">
          {selectedClause.sectionNumber} {selectedClause.title}
        </div>
      </div>

      {/* AI Output Card styled matching theme */}
      <BackendAIResultCard clause={selectedClause} />

      {/* Actions */}
      <div className="pt-2 space-y-2 border-t border-[#EAEAEA]">
        <button
          onClick={() => onAcceptRewrite(selectedClause.id, selectedClause.suggestedRewrite)}
          className="w-full py-2.5 px-3 bg-[#2C4235] text-white text-xs font-semibold rounded-lg hover:bg-[#1C3B2F] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Check className="w-3.5 h-3.5" />
          <span>{selectedClause.acceptedRewrite ? 'Rewrite Applied to Draft' : 'Accept Suggested Rewrite'}</span>
        </button>

        <button
          onClick={() => onOpenNegotiation(selectedClause)}
          className="w-full py-2.5 px-3 border border-[#2C4235] text-[#2C4235] hover:bg-[#2C4235]/5 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Open Side-by-Side Negotiator</span>
        </button>

        <button
          onClick={() => onOpenCounsel(`Explain in depth why Section ${selectedClause.sectionNumber} (${selectedClause.title}) is considered ${selectedClause.riskLevel} risk.`)}
          className="w-full py-2.5 px-3 bg-[#FAF8F5] border border-[#E5E0D5] text-[#181818] hover:bg-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <MessageSquare className="w-3.5 h-3.5 text-[#2C4235]" />
          <span>Consult AI Legal Counsel</span>
        </button>
      </div>

    </aside>
  );
};
