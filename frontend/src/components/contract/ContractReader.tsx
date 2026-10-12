import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  ZoomIn, 
  ZoomOut, 
  CheckCircle2, 
  Highlighter, 
  ListTree,
  Bookmark,
  RotateCcw,
  Sparkles,
  Download,
  Share2
} from 'lucide-react';
import { Contract, Clause, RiskLevel } from '../../types';

interface ContractReaderProps {
  contract: Contract;
  selectedClauseId: string | null;
  onSelectClause: (clause: Clause | null) => void;
  onOpenNegotiation: (clause: Clause) => void;
}

export const ContractReader: React.FC<ContractReaderProps> = ({
  contract,
  selectedClauseId,
  onSelectClause,
  onOpenNegotiation
}) => {
  const [zoomLevel, setZoomLevel] = useState(100);
  const [showOutline, setShowOutline] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showHighlightsOnly, setShowHighlightsOnly] = useState(false);
  const [bookmarkedClauses, setBookmarkedClauses] = useState<string[]>([]);

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (bookmarkedClauses.includes(id)) {
      setBookmarkedClauses(bookmarkedClauses.filter(b => b !== id));
    } else {
      setBookmarkedClauses([...bookmarkedClauses, id]);
    }
  };

  const filteredClauses = contract.clauses.filter(clause => {
    if (showHighlightsOnly && clause.riskLevel === 'SAFE') return false;
    if (!searchQuery) return true;
    return clause.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
           clause.originalText.toLowerCase().includes(searchQuery.toLowerCase()) ||
           clause.sectionNumber.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex-1 min-w-0 flex flex-col h-full bg-[#F8F8F6] overflow-hidden relative">
      
      {/* Minimal PDF/Doc Toolbar */}
      <div className="h-11 bg-white border-b border-[#EAEAEA] px-4 flex items-center justify-between z-10 shrink-0">
        
        {/* Left Toolbar Controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowOutline(!showOutline)}
            className={`p-1.5 rounded text-xs flex items-center space-x-1 cursor-pointer transition-colors ${
              showOutline ? 'bg-[#244B3C]/10 text-[#244B3C]' : 'text-[#6A6A6A] hover:bg-[#F8F8F6]'
            }`}
            title="Document Outline & Thumbnails"
          >
            <ListTree className="w-4 h-4" />
            <span className="hidden sm:inline font-medium">Outline</span>
          </button>

          <div className="h-4 w-px bg-[#EAEAEA]"></div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2 top-2 text-[#6A6A6A]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Find in document..."
              className="pl-7 pr-2 py-1 bg-[#F8F8F6] border border-[#EAEAEA] rounded text-xs text-[#181818] focus:outline-none focus:border-[#244B3C] w-40 sm:w-52"
            />
          </div>
        </div>

        {/* Center View Options */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowHighlightsOnly(!showHighlightsOnly)}
            className={`px-2.5 py-1 rounded text-xs font-medium flex items-center space-x-1 cursor-pointer transition-colors ${
              showHighlightsOnly ? 'bg-[#A83832]/10 text-[#A83832] border border-[#A83832]/30' : 'bg-[#F8F8F6] text-[#6A6A6A] border border-[#EAEAEA]'
            }`}
          >
            <Highlighter className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Risks Only ({contract.clauses.filter(c => c.riskLevel !== 'SAFE').length})</span>
          </button>

          {/* Zoom Controls */}
          <div className="hidden lg:flex items-center space-x-1 bg-[#F8F8F6] px-2 py-1 rounded border border-[#EAEAEA] text-xs text-[#6A6A6A]">
            <button 
              onClick={() => setZoomLevel(Math.max(75, zoomLevel - 15))}
              className="hover:text-[#181818] cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="w-10 text-center font-mono text-[11px]">{zoomLevel}%</span>
            <button 
              onClick={() => setZoomLevel(Math.min(150, zoomLevel + 15))}
              className="hover:text-[#181818] cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Status */}
        <div className="flex items-center space-x-2 text-xs text-[#6A6A6A]">
          <span className="hidden lg:inline text-[11px] font-mono">
            {contract.clauses.length} Analyzed Clauses
          </span>
          <button
            onClick={() => onSelectClause(null)}
            className="text-xs text-[#244B3C] hover:underline cursor-pointer pl-2 border-l border-[#EAEAEA]"
          >
            Clear Selection
          </button>
        </div>

      </div>

      {/* Main Workspace Canvas */}
      <div className="flex-1 flex overflow-hidden relative min-w-0 max-w-full">
        
        {/* Document Outline Drawer */}
        {showOutline && (
          <div className="w-64 bg-white border-r border-[#EAEAEA] flex flex-col p-3 overflow-y-auto space-y-2 shrink-0 z-10">
            <h4 className="text-xs font-semibold text-[#181818] uppercase tracking-wider mb-2">
              Page & Section Outline
            </h4>
            {contract.clauses.map((clause) => (
              <div
                key={clause.id}
                onClick={() => onSelectClause(clause)}
                className={`p-2 rounded text-xs border cursor-pointer transition-all ${
                  selectedClauseId === clause.id
                    ? 'bg-[#244B3C]/10 border-[#244B3C] font-medium text-[#244B3C]'
                    : 'bg-[#F8F8F6] border-[#EAEAEA] hover:border-[#5F6F81]/30'
                }`}
              >
                <div className="flex justify-between items-center text-[10px] text-[#6A6A6A] font-mono mb-0.5">
                  <span>{clause.sectionNumber}</span>
                  <span>Page {clause.pageNumber}</span>
                </div>
                <div className="truncate text-[#181818] font-sans">{clause.title}</div>
              </div>
            ))}
          </div>
        )}

        {/* Contract Document Canvas */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 md:p-10 bg-[#FAF8F5]">
          
          <div 
            className="max-w-4xl w-full mx-auto my-2 min-h-[calc(100%-1rem)] bg-white border border-[#E2E0D8] shadow-sm rounded-2xl p-6 sm:p-10 md:p-12 space-y-8 box-border min-w-0 transition-all mb-10"
            style={zoomLevel !== 100 ? { transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' } : undefined}
          >
            {/* Document Header */}
            <div className="space-y-4 min-w-0 pb-2 border-b border-[#EAEAEA]">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-semibold text-[#181818] break-words leading-tight">
                {contract.title}
              </h1>
              <div className="text-[11px] tracking-[0.15em] text-[#6A6A6A] font-bold uppercase flex flex-wrap justify-between items-center gap-2 pt-2">
                <span>Effective Date: {contract.effectiveDate}</span>
                <span className="normal-case tracking-normal text-xs text-[#2C4235] font-mono font-medium bg-[#2C4235]/8 px-2.5 py-1 rounded-md">
                  Jurisdiction: {contract.governingLaw}
                </span>
              </div>
            </div>

            {/* Document Body Clauses */}
            <div className="space-y-5 font-serif text-[14px] leading-relaxed text-[#2C2C2A] min-w-0">
              
              {filteredClauses.map((clause) => {
                const isSelected = clause.id === selectedClauseId;
                const isBookmarked = bookmarkedClauses.includes(clause.id);

                return (
                  <div
                    key={clause.id}
                    onClick={() => onSelectClause(clause)}
                    className={`group relative p-5 sm:p-6 rounded-xl transition-all cursor-pointer border-l-4 border-y border-r min-w-0 w-full box-border ${
                      clause.riskLevel === 'HIGH'
                        ? 'border-l-[#A83832] bg-[#FAF8F5]'
                        : clause.riskLevel === 'MEDIUM'
                        ? 'border-l-[#B87A2B] bg-[#FAF8F5]'
                        : 'border-l-[#2C4235] bg-[#FAF8F5]'
                    } ${
                      isSelected
                        ? 'border-t-[#2C4235] border-b-[#2C4235] border-r-[#2C4235] bg-white ring-2 ring-[#2C4235]/15 shadow-xs'
                        : 'border-t-[#E2E0D8] border-b-[#E2E0D8] border-r-[#E2E0D8] hover:bg-white hover:border-t-[#C2C0B8] hover:border-b-[#C2C0B8] hover:border-r-[#C2C0B8]'
                    }`}
                  >
                    {/* Clause Header & Meta */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5 min-w-0">
                        <h2 className="text-base sm:text-lg font-serif font-bold text-[#181818] leading-snug break-words">
                          {clause.sectionNumber} {clause.title}
                        </h2>
                        
                        {/* Risk Badge */}
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider shrink-0 ${
                          clause.riskLevel === 'HIGH'
                            ? 'bg-[#A83832]/12 text-[#A83832]'
                            : clause.riskLevel === 'MEDIUM'
                            ? 'bg-[#B87A2B]/12 text-[#B87A2B]'
                            : 'bg-[#2C4235]/12 text-[#2C4235]'
                        }`}>
                          {clause.riskLevel} Risk
                        </span>

                        {clause.acceptedRewrite && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-[#2C4235] text-white flex items-center space-x-1 shrink-0">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Rewrite Accepted</span>
                          </span>
                        )}
                      </div>

                      {/* Bookmark & Actions */}
                      <div className="flex items-center space-x-2 shrink-0 self-start sm:self-auto">
                        <button
                          onClick={(e) => toggleBookmark(clause.id, e)}
                          className={`p-1.5 rounded-md hover:bg-[#EAE6DC] text-xs transition-colors cursor-pointer ${
                            isBookmarked ? 'text-[#2C4235] bg-[#2C4235]/10' : 'text-[#6A6A6A]'
                          }`}
                          title="Bookmark Clause"
                        >
                          <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenNegotiation(clause);
                          }}
                          className="px-3 py-1.5 rounded-md bg-[#2C4235]/10 hover:bg-[#2C4235]/20 text-[#2C4235] text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                        >
                          Compare & Negotiate
                        </button>
                      </div>
                    </div>

                    {/* Clause Content Body */}
                    <div className="text-[14px] sm:text-[15px] leading-relaxed text-[#2A2A28] font-serif min-w-0 max-w-full overflow-hidden">
                      {clause.acceptedRewrite && clause.customRewrite ? (
                        <div className="p-3.5 bg-[#2C4235]/8 border-l-2 border-[#2C4235] text-[#1C1C1A] rounded-lg text-sm leading-relaxed">
                          <div className="text-[10px] font-mono font-bold text-[#2C4235] uppercase tracking-wider mb-1">
                            Accepted Safer Rewrite (Tracked Draft)
                          </div>
                          <p className="whitespace-pre-wrap break-words overflow-wrap-anywhere">{clause.customRewrite}</p>
                        </div>
                      ) : (
                        <div className={`p-3.5 rounded-lg text-sm leading-relaxed transition-colors cursor-pointer ${
                          clause.riskLevel === 'HIGH'
                            ? 'bg-[#A83832]/8 text-[#2C1818]'
                            : clause.riskLevel === 'MEDIUM'
                            ? 'bg-[#B87A2B]/8 text-[#2C2018]'
                            : 'bg-[#2C4235]/5 text-[#1C2C23]'
                        }`}>
                          <p className="whitespace-pre-wrap break-words" style={{ overflowWrap: 'anywhere' }}>
                            {clause.originalText}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* ── Risk Explanation Panel (translated_text) ─────────── */}
                    {clause.riskExplanation && (
                      <div className={`mt-3 rounded-lg border font-sans text-sm overflow-hidden ${
                        clause.riskLevel === 'HIGH'
                          ? 'border-[#A83832]/25 bg-[#FDF4F4]'
                          : clause.riskLevel === 'MEDIUM'
                          ? 'border-[#B87A2B]/25 bg-[#FDFAF4]'
                          : 'border-[#2C4235]/15 bg-[#F4FDF8]'
                      }`}>
                        {/* Header bar */}
                        <div className={`px-3.5 py-2 flex items-center gap-2 border-b text-[11px] font-mono font-bold uppercase tracking-wider ${
                          clause.riskLevel === 'HIGH'
                            ? 'border-[#A83832]/20 text-[#A83832] bg-[#A83832]/6'
                            : clause.riskLevel === 'MEDIUM'
                            ? 'border-[#B87A2B]/20 text-[#B87A2B] bg-[#B87A2B]/6'
                            : 'border-[#2C4235]/10 text-[#2C4235] bg-[#2C4235]/5'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            clause.riskLevel === 'HIGH' ? 'bg-[#A83832]'
                            : clause.riskLevel === 'MEDIUM' ? 'bg-[#B87A2B]'
                            : 'bg-[#2C4235]'
                          }`} />
                          {clause.riskLevel === 'HIGH'
                            ? '⚠ High Risk — Plain English Analysis'
                            : clause.riskLevel === 'MEDIUM'
                            ? '● Medium Risk — Plain English Analysis'
                            : '✓ Risk Analysis'}
                        </div>
                        {/* Body */}
                        <p className={`px-3.5 py-3 text-[13px] leading-relaxed whitespace-pre-wrap break-words ${
                          clause.riskLevel === 'HIGH'
                            ? 'text-[#5C1A1A]'
                            : clause.riskLevel === 'MEDIUM'
                            ? 'text-[#5C3A0A]'
                            : 'text-[#1A3C2A]'
                        }`}>
                          {clause.riskExplanation}
                        </p>
                      </div>
                    )}

                    {/* Inline Quick Bar when selected */}
                    {isSelected && (
                      <div className="mt-4 pt-3 border-t border-[#E8E3D8] flex flex-wrap items-center justify-between gap-2 text-xs font-sans">
                        <div className="flex items-center space-x-2 text-[#6A6A6A]">
                          <Sparkles className="w-3.5 h-3.5 text-[#2C4235]" />
                          <span className="font-semibold text-[#181818]">{clause.category}</span>
                          <span>•</span>
                          <span className="font-mono text-[#2C4235] font-semibold">{clause.confidenceScore}% AI Confidence</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenNegotiation(clause);
                          }}
                          className="text-xs font-semibold text-[#2C4235] hover:underline flex items-center gap-1"
                        >
                          <span>Open Side-by-Side Negotiator</span>
                          <span>→</span>
                        </button>
                      </div>
                    )}

                  </div>
                );
              })}

            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
