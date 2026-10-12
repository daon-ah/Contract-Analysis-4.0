import React, { useEffect, useState } from 'react';
import { 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  PenTool,
  Bookmark,
  AlertTriangle,
  FileCheck2
} from 'lucide-react';

interface AIReviewOverlayProps {
  contractTitle: string;
  onComplete: () => void;
}

export const AIReviewOverlay: React.FC<AIReviewOverlayProps> = ({ contractTitle, onComplete }) => {
  const steps = [
    { title: 'Unfolding Document onto Workspace Desk', desc: 'Smoothing paper layout, aligning margins and section headers...' },
    { title: 'Fountain Pen & Optical Scan Active', desc: 'Analyzing clause boundaries, party identifiers, and governing state...' },
    { title: 'Highlighting Legal Risks & Liability Caps', desc: 'Coloring high-risk clauses in soft crimson, amber, and green ink...' },
    { title: 'Populating Margin Annotations & Footnotes', desc: 'Attaching senior counsel comments and risk explanation cards...' },
    { title: 'Comparing Against Commercial Standards', desc: 'Evaluating Indian Contract Act 1872 & IT Act legal benchmarks...' },
    { title: 'Finalizing Redline Draft & Executive Opinion', desc: 'Preparing interactive document review sheet...' }
  ];

  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (currentStep < steps.length) {
      const timer = setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
      }, 750);
      return () => clearTimeout(timer);
    } else {
      const finishTimer = setTimeout(() => {
        onComplete();
      }, 500);
      return () => clearTimeout(finishTimer);
    }
  }, [currentStep]);

  return (
    <div className="fixed inset-0 z-50 bg-[#FAF8F5]/95 backdrop-blur-sm flex flex-col justify-center items-center p-6 select-none font-serif">
      
      {/* Paper Desk Card Container */}
      <div className="max-w-xl w-full paper-sheet p-8 sm:p-10 rounded-sm border border-[#E6E2DC] shadow-2xl space-y-8 text-center relative overflow-hidden">
        
        {/* Animated Fountain Pen Indicator */}
        <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-[#2C4235]/10 animate-ping"></div>
          <div className="w-14 h-14 rounded-xs bg-[#2C4235] text-white flex items-center justify-center shadow-md border border-[#9E824A]">
            <PenTool className="w-7 h-7 text-[#9E824A] animate-bounce" />
          </div>
        </div>

        {/* Document Unfolding Animation Preview Box */}
        <div className="bg-[#F8F5F0] border border-[#E6E2DC] p-4 rounded-xs text-left relative overflow-hidden shadow-inner">
          <div className="flex items-center justify-between border-b border-[#E6E2DC] pb-2 mb-2">
            <span className="text-[10px] font-mono uppercase font-bold text-[#9E824A]">
              DESK SCANNER • LINE {Math.min(12, currentStep * 3 + 2)} OF 34
            </span>
            <span className="text-[10px] font-mono text-[#2C4235] font-bold animate-pulse">
              ● SCANNING IN PROGRESS
            </span>
          </div>

          <div className="space-y-2 text-xs font-serif text-[#1C1C1A]">
            <div className="font-bold border-b border-[#E6E2DC] pb-1 truncate">
              {contractTitle || 'Enterprise Commercial Agreement'}
            </div>

            <div className="space-y-1">
              <p className={`p-1.5 rounded transition-all duration-300 ${
                currentStep >= 2 ? 'bg-[#A83832]/10 border-l-2 border-[#A83832] text-[#1C1C1A]' : 'opacity-40'
              }`}>
                <span className="font-bold font-mono text-[9px] text-[#A83832] mr-2">SEC 4.1</span>
                &quot;Payment shall be rendered within 15 days... 12% price escalation&quot;
              </p>

              <p className={`p-1.5 rounded transition-all duration-300 ${
                currentStep >= 3 ? 'bg-[#B87A2B]/10 border-l-2 border-[#B87A2B] text-[#1C1C1A]' : 'opacity-40'
              }`}>
                <span className="font-bold font-mono text-[9px] text-[#B87A2B] mr-2">SEC 7.3</span>
                &quot;Provider liability limited to 3 months fees... Customer uncapped&quot;
              </p>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h3 className="text-2xl font-serif font-bold text-[#1C1C1A]">
            ContractOS Cinematic Analysis
          </h3>
          <p className="text-xs font-mono text-[#6E6D6A] truncate px-4">
            {contractTitle}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[#E6E2DC] h-1.5 rounded-full overflow-hidden">
          <div 
            className="bg-[#2C4235] h-full transition-all duration-500 ease-out"
            style={{ width: `${Math.min(100, Math.round(((currentStep + 1) / steps.length) * 100))}%` }}
          ></div>
        </div>

        {/* Steps Timeline */}
        <div className="space-y-2.5 text-left pt-2 border-t border-[#E6E2DC] font-sans">
          {steps.map((step, idx) => {
            const isCompleted = idx < currentStep;
            const isCurrent = idx === currentStep;

            return (
              <div 
                key={idx}
                className={`flex items-start space-x-3 transition-opacity duration-300 ${
                  isCompleted ? 'opacity-100' : isCurrent ? 'opacity-100 font-semibold' : 'opacity-30'
                }`}
              >
                <div className="mt-0.5">
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-[#2C4235]" />
                  ) : isCurrent ? (
                    <div className="w-4 h-4 rounded-full border-2 border-[#2C4235] border-t-transparent animate-spin"></div>
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-[#E6E2DC]"></div>
                  )}
                </div>
                <div className="text-xs">
                  <p className={isCurrent ? 'text-[#2C4235] font-serif font-bold' : 'text-[#1C1C1A]'}>
                    {step.title}
                  </p>
                  {isCurrent && (
                    <p className="text-[10px] text-[#6E6D6A] mt-0.5 font-serif italic animate-pulse">
                      {step.desc}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-[10px] text-[#6E6D6A] font-mono pt-2 border-t border-[#E6E2DC]">
          ENGINE: Gemini 3.6 Flash • Indian Legal Precedent & Contract Grounding
        </p>

      </div>

    </div>
  );
};

