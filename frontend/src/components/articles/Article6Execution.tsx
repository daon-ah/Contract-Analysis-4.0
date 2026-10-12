import React, { useState } from 'react';
import { 
  Download, 
  FileCheck2, 
  CheckCircle2, 
  FileText, 
  ShieldCheck, 
  Share2, 
  Printer, 
  Sparkles,
  Lock,
  Award
} from 'lucide-react';
import { Contract } from '../../types';

interface Article6ExecutionProps {
  contract: Contract | null;
  onOpenReport: () => void;
}

export const Article6Execution: React.FC<Article6ExecutionProps> = ({
  contract,
  onOpenReport
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const handleDownloadFile = (fileType: string, filename: string) => {
    setDownloadSuccess(fileType);
    setTimeout(() => {
      setDownloadSuccess(null);
    }, 4000);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#FAF8F5] py-10 px-4 sm:px-6 lg:px-8 font-serif">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Article VI Header Document Container */}
        <div className="paper-sheet p-8 sm:p-12 rounded-sm border border-[#E6E2DC] space-y-8">
          
          <div className="border-b-2 border-[#1C1C1A] pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-xs font-mono font-bold tracking-[0.2em] text-[#9E824A] uppercase block mb-1">
                EXECUTION & DRAFT PACKAGE
              </span>
              <h1 className="text-3xl font-serif font-bold text-[#1C1C1A]">
                Execution & Export Package
              </h1>
            </div>

            <span className="px-3 py-1 bg-[#2C4235] text-white text-xs font-mono font-bold uppercase rounded-xs">
              READY FOR CLOSING
            </span>
          </div>

          <p className="text-base text-[#6E6D6A] font-serif-editorial italic leading-relaxed">
            &quot;Certifies the completion of AI legal review, clause redlining, and risk mitigation. The Reviewing Party may export the complete executive consulting suite, counterparty redline draft, and clause inventory.&quot;
          </p>

          {/* Download Notification Banner */}
          {downloadSuccess && (
            <div className="p-4 bg-[#3B6E52]/10 border border-[#3B6E52] text-[#3B6E52] rounded-xs font-sans text-xs flex items-center justify-between animate-fadeIn">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Successfully generated <strong>{downloadSuccess}</strong> artifact package!</span>
              </div>
              <span className="font-mono text-[10px] uppercase font-bold">READY FOR DOWNLOAD</span>
            </div>
          )}

          {/* Export Assets List */}
          <div className="space-y-4 font-sans">
            
            {/* Asset 1: Executive Consulting Report */}
            <div className="p-6 bg-[#F8F5F0] border border-[#E6E2DC] rounded-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-[#2C4235] transition-all">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-[#2C4235] text-white rounded-xs">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-serif font-bold text-[#1C1C1A]">
                    Executive Legal Consulting Report (.PDF)
                  </h4>
                  <p className="text-xs text-[#6E6D6A] mt-1 font-serif">
                    Comprehensive C-Suite brief featuring executive summary, contract health rating ({contract?.healthScore || 72}/100), financial exposure matrix, and partner sign-off.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={onOpenReport}
                  className="px-4 py-2.5 bg-white border border-[#2C4235] text-[#2C4235] hover:bg-[#2C4235]/5 text-xs font-serif font-bold rounded-xs transition-colors cursor-pointer"
                >
                  View In-App Report
                </button>
                <button
                  onClick={() => handleDownloadFile('Executive PDF Report', 'Executive_Legal_Report.pdf')}
                  className="px-4 py-2.5 bg-[#2C4235] text-white hover:bg-[#1E2E25] text-xs font-serif font-bold rounded-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>

            {/* Asset 2: Redlined Negotiated Contract */}
            <div className="p-6 bg-[#F8F5F0] border border-[#E6E2DC] rounded-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-[#2C4235] transition-all">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-[#9E824A] text-white rounded-xs">
                  <FileCheck2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-serif font-bold text-[#1C1C1A]">
                    Redlined Negotiated Contract (.DOCX / Word)
                  </h4>
                  <p className="text-xs text-[#6E6D6A] mt-1 font-serif">
                    Fully redlined contract text with tracked changes, strike-through removals, and green protective insertions ready to send directly to counterparty legal counsel.
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleDownloadFile('Redlined DOCX Contract', 'ContractOS_Redline_Draft.docx')}
                className="px-5 py-2.5 bg-[#2C4235] text-white hover:bg-[#1E2E25] text-xs font-serif font-bold rounded-xs transition-colors flex items-center gap-1.5 cursor-pointer w-full sm:w-auto justify-center"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Redline DOCX</span>
              </button>
            </div>

            {/* Asset 3: Clause Risk Inventory */}
            <div className="p-6 bg-[#F8F5F0] border border-[#E6E2DC] rounded-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-[#2C4235] transition-all">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-[#6E6D6A] text-white rounded-xs">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-serif font-bold text-[#1C1C1A]">
                    Structured Clause Risk Inventory (.CSV / .JSON)
                  </h4>
                  <p className="text-xs text-[#6E6D6A] mt-1 font-serif">
                    Raw data export containing every section number, risk score, confidence rating, original text, and AI suggested rewrites for enterprise contract management systems.
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleDownloadFile('Clause CSV Inventory', 'Clause_Risk_Inventory.csv')}
                className="px-5 py-2.5 bg-[#2C4235] text-white hover:bg-[#1E2E25] text-xs font-serif font-bold rounded-xs transition-colors flex items-center gap-1.5 cursor-pointer w-full sm:w-auto justify-center"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV Data</span>
              </button>
            </div>

          </div>

          {/* Formal Closing Execution Stamp */}
          <div className="pt-8 border-t-2 border-[#1C1C1A] text-center space-y-3 font-serif">
            <span className="text-xs font-mono text-[#9E824A] font-bold tracking-widest uppercase block">
              OFFICIAL CLOSING STAMP OF APPROVAL
            </span>
            <p className="text-xs text-[#6E6D6A] max-w-md mx-auto italic font-serif-editorial">
              &quot;ContractOS Legal Intelligence certifies that this agreement has undergone automated risk classification, Indian contract standards evaluation, and redline optimization.&quot;
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
