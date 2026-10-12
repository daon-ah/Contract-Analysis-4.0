import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowRight, 
  Upload, 
  ShieldCheck, 
  Scale, 
  Sparkles, 
  CheckCircle2, 
  FileText,
  Sliders,
  FileCheck2,
  BookOpen,
  MessageSquare,
  Zap,
  Lock,
  Award,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  Cpu,
  Layers,
  Check,
  RotateCcw,
  FileSpreadsheet,
  CheckCircle,
  Eye,
  Building
} from 'lucide-react';
import { ArticleView } from '../types';
import { ContractosLogo } from '../components/common/ContractosLogo';

interface PreambleLandingProps {
  onNavigate: (article: ArticleView) => void;
  onOpenUpload: () => void;
}

export const PreambleLanding: React.FC<PreambleLandingProps> = ({
  onNavigate,
  onOpenUpload
}) => {
  const [demoStance, setDemoStance] = useState<'PROTECTIVE' | 'BALANCED' | 'AGGRESSIVE'>('PROTECTIVE');

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full bg-[#FAF9F6] text-[#1C1C1A] font-sans overflow-x-hidden relative select-none">
      
      {/* Background Parchment Grid & Soft Warm Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-[#2C4235]/10 via-[#9E824A]/5 to-transparent blur-3xl opacity-80"></div>
        <div className="absolute top-1/3 -left-40 w-96 h-96 bg-[#9E824A]/10 blur-3xl rounded-full"></div>
        <div className="absolute top-2/3 -right-40 w-96 h-96 bg-[#2C4235]/10 blur-3xl rounded-full"></div>
        
        {/* Subtle Legal Grid Watermark Lines */}
        <div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(to_right,#1C1C1A_1px,transparent_1px),linear-gradient(to_bottom,#1C1C1A_1px,transparent_1px)] bg-[size:32px_32px]"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-20">
        
        {/* HERO SECTION */}
        <div className="relative flex flex-col items-center text-center space-y-8">
          
          {/* Floating AI Legal Badges (Left & Right) */}
          <div className="w-full lg:w-auto flex flex-col sm:flex-row lg:block items-center justify-center gap-3 lg:gap-0">
            <motion.div 
              animate={{ y: [0, -12, 0, -4, 0] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
              whileHover={{ scale: 1.05, y: -15 }}
              onClick={() => onNavigate('art-2-review')}
              className="flex lg:absolute lg:-left-4 lg:top-4 items-center gap-3 px-4 py-3 bg-white/95 backdrop-blur-xl border border-[#DFDACF] rounded-2xl shadow-xl shadow-black/5 hover:border-[#2C4235] transition-shadow cursor-pointer group z-20"
            >
              <div className="w-8 h-8 rounded-xl bg-[#2C4235]/10 border border-[#2C4235]/20 flex items-center justify-center text-[#2C4235] relative shrink-0">
                <ShieldCheck className="w-4 h-4 text-[#2C4235] group-hover:scale-110 transition-transform" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#3B6E52] border-2 border-white animate-ping"></span>
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="text-[#1C1C1A] font-mono text-[11px] font-bold tracking-tight">Indian Contract Standards</span>
                  <span className="px-2 py-0.5 rounded-md bg-[#3B6E52] text-white text-[9px] font-mono font-bold shadow-xs">100% SAFE</span>
                </div>
                <p className="text-[10px] text-[#6E6D6A] font-sans">Section 23 & DPDP Compliant</p>
              </div>
            </motion.div>

            <motion.div 
              animate={{ y: [0, 12, 0, 4, 0] }}
              transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              whileHover={{ scale: 1.05, y: -5 }}
              onClick={() => onNavigate('art-3-negotiation')}
              className="flex lg:absolute lg:-right-4 lg:top-10 items-center gap-3 px-4 py-3 bg-white/95 backdrop-blur-xl border border-[#9E824A]/40 rounded-2xl shadow-xl shadow-black/5 hover:border-[#9E824A] transition-shadow cursor-pointer group z-20"
            >
              <div className="w-8 h-8 rounded-xl bg-[#9E824A]/10 border border-[#9E824A]/30 flex items-center justify-center text-[#9E824A] shrink-0">
                <Sparkles className="w-4 h-4 text-[#9E824A] group-hover:rotate-12 transition-transform animate-pulse" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="text-[#1C1C1A] font-mono text-[11px] font-bold tracking-tight">AI Risk Analyzer</span>
                  <span className="px-2 py-0.5 rounded-md bg-[#9E824A] text-white text-[9px] font-mono font-bold shadow-xs">₹1 Cr Mutual Cap</span>
                </div>
                <p className="text-[10px] text-[#6E6D6A] font-sans">Automated Protective Redlining</p>
              </div>
            </motion.div>
          </div>

          {/* Top Pill Announcement */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F5F2EB] border border-[#E8E5E0] text-xs text-[#1C1C1A] shadow-xs hover:border-[#2C4235] transition-colors cursor-pointer"
            onClick={() => onNavigate('art-2-review')}
          >
            <span className="flex h-2 w-2 rounded-full bg-[#3B6E52]"></span>
            <span className="font-bold text-[#2C4235]">ContractOS v2.6 Enterprise</span>
            <span className="text-[#6E6D6A]">• AI Contract Intelligence Studio</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#6E6D6A]" />
          </motion.div>

          {/* Main Brand Title & Subtitle */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="max-w-3xl space-y-4 mx-auto"
          >
            <div className="flex justify-center mb-3">
              <ContractosLogo variant="full" size="xl" />
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-semibold tracking-tight text-[#1C1C1A] leading-[1.2]">
              Enterprise Contracts, <br />
              <span className="text-[#2C4235] font-serif italic font-medium">
                Audited & Redlined in Seconds
              </span>
            </h1>

            <p className="text-sm sm:text-base text-[#52514E] font-sans max-w-xl mx-auto leading-relaxed pt-1">
              Uncover uncapped financial liabilities, generate protective redlines, and consult with AI Legal Counsel trained on commercial precedent.
            </p>
          </motion.div>

          {/* Primary Call to Action Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center gap-4 pt-2 w-full sm:w-auto"
          >
            <button
              onClick={() => onNavigate('art-2-review')}
              className="w-full sm:w-auto px-8 py-4 bg-[#2C4235] hover:bg-[#1E2E25] text-white text-sm font-bold rounded-full shadow-lg transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2.5 cursor-pointer font-sans"
            >
              <FileText className="w-4 h-4 text-[#9E824A]" />
              <span>Launch Review Studio</span>
              <ArrowRight className="w-4 h-4 text-[#9E824A]" />
            </button>

            <button
              onClick={onOpenUpload}
              className="w-full sm:w-auto px-7 py-4 bg-[#F5F2EB] hover:bg-[#EFECE3] text-[#1C1C1A] border border-[#DFDACF] text-sm font-bold rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Upload className="w-4 h-4 text-[#2C4235]" />
              <span>Upload Agreement (PDF / Word)</span>
            </button>
          </motion.div>

          {/* Quick Demo Pre-Loaded Contracts Pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="pt-2 flex flex-wrap items-center justify-center gap-2 text-xs text-[#6E6D6A]"
          >
            <span className="font-mono text-[10px] text-[#6E6D6A] uppercase tracking-widest mr-1">
              TRY PRE-LOADED VAULT:
            </span>
            <button
              onClick={() => onNavigate('art-2-review')}
              className="px-3 py-1 rounded-full bg-[#F5F2EB] border border-[#DFDACF] hover:border-[#2C4235] text-[#1C1C1A] text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <span className="w-2 h-2 rounded-full bg-[#A83832]"></span>
              <span>SaaS Agreement (Health: 68/100)</span>
            </button>
            <button
              onClick={() => onNavigate('art-2-review')}
              className="px-3 py-1 rounded-full bg-[#F5F2EB] border border-[#DFDACF] hover:border-[#2C4235] text-[#1C1C1A] text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <span className="w-2 h-2 rounded-full bg-[#3B6E52]"></span>
              <span>Mutual NDA (Health: 92/100)</span>
            </button>
          </motion.div>

        </div>

        {/* INFINITE SCROLLING LEGAL SYMBOLS MARQUEE BAR */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="w-full overflow-hidden py-3.5 bg-[#2C4235] text-[#FAF8F5] border-y border-[#9E824A]/40 shadow-md relative"
        >
          {/* Subtle Side Fade Gradients */}
          <div className="absolute top-0 bottom-0 left-0 w-20 bg-gradient-to-r from-[#2C4235] to-transparent z-10 pointer-events-none"></div>
          <div className="absolute top-0 bottom-0 right-0 w-20 bg-gradient-to-l from-[#2C4235] to-transparent z-10 pointer-events-none"></div>

          <div className="animate-marquee flex items-center whitespace-nowrap gap-8">
            {[...Array(2)].map((_, loopIdx) => (
              <div key={loopIdx} className="flex items-center gap-8">
                <span className="flex items-center gap-2 font-mono text-xs text-[#EFECE3]">
                  <span className="text-[#9E824A] font-bold text-sm">§</span>
                  <span className="font-semibold tracking-wider uppercase text-[11px]">Indian Contract Act, 1872 (Section 23)</span>
                </span>
                <span className="text-[#9E824A]/60 font-serif">✦</span>

                <span className="flex items-center gap-2 font-mono text-xs text-[#EFECE3]">
                  <span className="text-[#9E824A] font-bold text-sm">⚖️</span>
                  <span className="font-semibold tracking-wider uppercase text-[11px]">Mutual Limitation of Liability Capped</span>
                </span>
                <span className="text-[#9E824A]/60 font-serif">✦</span>

                <span className="flex items-center gap-2 font-mono text-xs text-[#EFECE3]">
                  <span className="text-[#9E824A] font-bold text-sm">¶</span>
                  <span className="font-semibold tracking-wider uppercase text-[11px]">Uncapped Exposure Detector</span>
                </span>
                <span className="text-[#9E824A]/60 font-serif">✦</span>

                <span className="flex items-center gap-2 font-mono text-xs text-[#EFECE3]">
                  <span className="text-[#9E824A] font-bold text-sm">🛡️</span>
                  <span className="font-semibold tracking-wider uppercase text-[11px]">DPDP Act 2023 & Vault Encryption</span>
                </span>
                <span className="text-[#9E824A]/60 font-serif">✦</span>

                <span className="flex items-center gap-2 font-mono text-xs text-[#EFECE3]">
                  <span className="text-[#9E824A] font-bold text-sm">📜</span>
                  <span className="font-semibold tracking-wider uppercase text-[11px]">Automated Redlines & Strikethroughs</span>
                </span>
                <span className="text-[#9E824A]/60 font-serif">✦</span>

                <span className="flex items-center gap-2 font-mono text-xs text-[#EFECE3]">
                  <span className="text-[#9E824A] font-bold text-sm">🏛️</span>
                  <span className="font-semibold tracking-wider uppercase text-[11px]">Indian High Court Commercial Precedents</span>
                </span>
                <span className="text-[#9E824A]/60 font-serif">✦</span>

                <span className="flex items-center gap-2 font-mono text-xs text-[#EFECE3]">
                  <span className="text-[#9E824A] font-bold text-sm">©</span>
                  <span className="font-semibold tracking-wider uppercase text-[11px]">Intellectual Property & Indemnity Protection</span>
                </span>
                <span className="text-[#9E824A]/60 font-serif">✦</span>

                <span className="flex items-center gap-2 font-mono text-xs text-[#EFECE3]">
                  <span className="text-[#9E824A] font-bold text-sm">⚜️</span>
                  <span className="font-semibold tracking-wider uppercase text-[11px]">AI Legal Counsel Scenario Engine</span>
                </span>
                <span className="text-[#9E824A]/60 font-serif">✦</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* METRICS TICKER BAR */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-[#F5F2EB] border border-[#DFDACF] rounded-2xl shadow-sm"
        >
          <div className="space-y-1 text-center sm:text-left border-r border-[#E8E5E0] pr-2 last:border-none">
            <span className="text-[10px] font-mono uppercase font-bold text-[#2C4235] tracking-wider block">
              Contract Liabilities
            </span>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-[#1C1C1A]">₹4,200 Cr+</div>
            <p className="text-[11px] text-[#6E6D6A]">Financial exposure audited</p>
          </div>

          <div className="space-y-1 text-center sm:text-left border-r border-[#E8E5E0] pr-2 last:border-none">
            <span className="text-[10px] font-mono uppercase font-bold text-[#9E824A] tracking-wider block">
              Analysis Speed
            </span>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-[#1C1C1A]">&lt; 2.8s</div>
            <p className="text-[11px] text-[#6E6D6A]">Full agreement parsing</p>
          </div>

          <div className="space-y-1 text-center sm:text-left border-r border-[#E8E5E0] pr-2 last:border-none">
            <span className="text-[10px] font-mono uppercase font-bold text-[#2C4235] tracking-wider block">
              Accuracy Precedent
            </span>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-[#1C1C1A]">99.4%</div>
            <p className="text-[11px] text-[#6E6D6A]">Indian commercial contract law</p>
          </div>

          <div className="space-y-1 text-center sm:text-left">
            <span className="text-[10px] font-mono uppercase font-bold text-[#9E824A] tracking-wider block">
              Redline Rules
            </span>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-[#1C1C1A]">120+</div>
            <p className="text-[11px] text-[#6E6D6A]">Protective stances pre-configured</p>
          </div>
        </motion.div>

        {/* LIVE INTERACTIVE REDLINE TRANSFORMATION SHOWCASE */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="bg-[#F5F2EB] border border-[#DFDACF] rounded-2xl p-6 sm:p-8 space-y-6 shadow-md relative overflow-hidden"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#E8E5E0] pb-5">
            <div>
              <div className="flex items-center gap-2 text-xs text-[#2C4235] font-mono font-bold uppercase tracking-wider mb-1">
                <Sparkles className="w-4 h-4 text-[#9E824A]" />
                <span>Live Interactive AI Redline Engine Preview</span>
              </div>
              <h2 className="text-2xl font-serif font-bold text-[#1C1C1A]">
                Transform Asymmetric Risk into Protective Terms
              </h2>
            </div>

            {/* Stance Toggle Controls */}
            <div className="flex items-center bg-[#EFECE3] p-1 rounded-xl border border-[#DFDACF]">
              {(['PROTECTIVE', 'BALANCED', 'AGGRESSIVE'] as const).map((stance) => (
                <button
                  key={stance}
                  onClick={() => setDemoStance(stance)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    demoStance === stance
                      ? 'bg-[#2C4235] text-white shadow-xs'
                      : 'text-[#6E6D6A] hover:text-[#1C1C1A]'
                  }`}
                >
                  {stance.charAt(0) + stance.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Clause Comparison Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Original Risky Clause */}
            <div className="p-5 rounded-xl bg-white border border-[#A83832]/30 space-y-3 relative shadow-xs">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded bg-[#A83832]/10 text-[#A83832] text-[10px] font-mono font-bold uppercase flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> HIGH RISK • Section 8.1 Liability
                </span>
                <span className="text-[11px] text-[#6E6D6A] font-mono font-semibold">Uncapped Exposure</span>
              </div>

              <p className="text-xs text-[#1C1C1A] font-serif leading-relaxed italic">
                &quot;In no event shall Provider&apos;s total aggregate liability exceed the total fees paid by Customer in the preceding one (1) month. Customer agrees to indemnify Provider against all third-party claims without limit.&quot;
              </p>

              <div className="pt-2 border-t border-[#E8E5E0] text-[11px] text-[#A83832] font-mono flex items-center gap-1.5 font-medium">
                <span>⚠️ Risk: Severely asymmetric 1-month cap + unlimited customer indemnity.</span>
              </div>
            </div>

            {/* AI Generated Redline Rewrite */}
            <div className="p-5 rounded-xl bg-white border border-[#3B6E52]/40 space-y-3 relative shadow-xs">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded bg-[#3B6E52]/10 text-[#3B6E52] text-[10px] font-mono font-bold uppercase flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> AI {demoStance} REDLINE • REWRITTEN
                </span>
                <span className="text-[11px] text-[#3B6E52] font-mono font-bold">Risk Level: SAFE</span>
              </div>

              <div className="text-xs font-serif leading-relaxed space-y-1">
                <p className="text-[#1C1C1A]">
                  &quot;In no event shall <span className="line-through text-[#A83832] decoration-[#A83832]">Provider&apos;s</span> <strong className="text-[#2C4235]">either party&apos;s</strong> total aggregate liability exceed the total fees paid by Customer in the preceding <span className="line-through text-[#A83832] decoration-[#A83832]">one (1) month</span> <strong className="text-[#2C4235]">twelve (12) months, or ₹1,00,00,000 (₹1 Crore), whichever is greater</strong>.
                  {demoStance === 'PROTECTIVE' && (
                    <span className="text-[#2C4235] block mt-1"> Customer indemnification shall be strictly limited to direct gross negligence or willful misconduct.&quot;</span>
                  )}
                </p>
              </div>

              <div className="pt-2 border-t border-[#E8E5E0] text-[11px] text-[#2C4235] font-mono flex items-center justify-between">
                <span className="font-semibold">✅ Indian Standard Mutual Liability Cap</span>
                <button
                  onClick={() => onNavigate('art-3-negotiation')}
                  className="px-2.5 py-1 bg-[#2C4235] text-white font-bold rounded hover:bg-[#1E2E25] transition-colors cursor-pointer text-[10px]"
                >
                  Apply in Redline Studio →
                </button>
              </div>
            </div>

          </div>
        </motion.div>

        {/* 4-STEP WORKFLOW BENTO GRID */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[#E8E5E0] pb-4">
            <div>
              <span className="text-xs font-mono font-bold text-[#9E824A] uppercase tracking-wider block">
                SYSTEM ARCHITECTURE
              </span>
              <h2 className="text-2xl font-serif font-bold text-[#1C1C1A]">
                The ContractOS 4-Step Legal Workflow
              </h2>
            </div>
            <button
              onClick={() => onNavigate('art-2-review')}
              className="text-xs font-bold text-[#2C4235] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Explore All Modules</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Module 1 */}
            <motion.div
              whileHover={{ y: -6 }}
              onClick={() => onNavigate('art-1-upload')}
              className="bg-[#F5F2EB] p-6 rounded-2xl border border-[#DFDACF] hover:border-[#2C4235] transition-all cursor-pointer group space-y-4 flex flex-col justify-between shadow-xs"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-white text-[#2C4235] flex items-center justify-center font-bold text-sm border border-[#DFDACF] shadow-2xs">
                    01
                  </div>
                  <Upload className="w-5 h-5 text-[#6E6D6A] group-hover:text-[#2C4235] transition-colors" />
                </div>
                <h3 className="text-lg font-serif font-bold text-[#1C1C1A] group-hover:text-[#2C4235] transition-colors">
                  1. Vault Ingestion
                </h3>
                <p className="text-xs text-[#52514E] leading-relaxed font-sans">
                  Upload PDF, DOCX, or text agreements. ContractOS automatically segments section structures, clauses, and party profiles into an encrypted vault.
                </p>
              </div>
              <div className="pt-3 border-t border-[#E8E5E0] text-xs font-bold text-[#2C4235] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>Upload Document</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#9E824A]" />
              </div>
            </motion.div>

            {/* Module 2 */}
            <motion.div
              whileHover={{ y: -6 }}
              onClick={() => onNavigate('art-2-review')}
              className="bg-[#F5F2EB] p-6 rounded-2xl border border-[#DFDACF] hover:border-[#2C4235] transition-all cursor-pointer group space-y-4 flex flex-col justify-between shadow-xs"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-white text-[#9E824A] flex items-center justify-center font-bold text-sm border border-[#DFDACF] shadow-2xs">
                    02
                  </div>
                  <ShieldCheck className="w-5 h-5 text-[#6E6D6A] group-hover:text-[#9E824A] transition-colors" />
                </div>
                <h3 className="text-lg font-serif font-bold text-[#1C1C1A] group-hover:text-[#9E824A] transition-colors">
                  2. Clause Risk Review
                </h3>
                <p className="text-xs text-[#52514E] leading-relaxed font-sans">
                  Color-coded risk classifications (High Risk, Caution, Safe) with overall Contract Health Scores out of 100 to prioritize immediate review items.
                </p>
              </div>
              <div className="pt-3 border-t border-[#E8E5E0] text-xs font-bold text-[#9E824A] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>View Workspace</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#2C4235]" />
              </div>
            </motion.div>

            {/* Module 3 */}
            <motion.div
              whileHover={{ y: -6 }}
              onClick={() => onNavigate('art-3-negotiation')}
              className="bg-[#F5F2EB] p-6 rounded-2xl border border-[#DFDACF] hover:border-[#2C4235] transition-all cursor-pointer group space-y-4 flex flex-col justify-between shadow-xs"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-white text-[#2C4235] flex items-center justify-center font-bold text-sm border border-[#DFDACF] shadow-2xs">
                    03
                  </div>
                  <Scale className="w-5 h-5 text-[#6E6D6A] group-hover:text-[#2C4235] transition-colors" />
                </div>
                <h3 className="text-lg font-serif font-bold text-[#1C1C1A] group-hover:text-[#2C4235] transition-colors">
                  3. One-Click Redlining
                </h3>
                <p className="text-xs text-[#52514E] leading-relaxed font-sans">
                  Select Protective, Balanced, or Aggressive negotiation stances. See instant side-by-side strikethroughs and safer legal insertions.
                </p>
              </div>
              <div className="pt-3 border-t border-[#E8E5E0] text-xs font-bold text-[#2C4235] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>Redline Studio</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#9E824A]" />
              </div>
            </motion.div>

            {/* Module 4 */}
            <motion.div
              whileHover={{ y: -6 }}
              onClick={() => onNavigate('art-4-counsel')}
              className="bg-[#F5F2EB] p-6 rounded-2xl border border-[#DFDACF] hover:border-[#2C4235] transition-all cursor-pointer group space-y-4 flex flex-col justify-between shadow-xs"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-white text-[#9E824A] flex items-center justify-center font-bold text-sm border border-[#DFDACF] shadow-2xs">
                    04
                  </div>
                  <MessageSquare className="w-5 h-5 text-[#6E6D6A] group-hover:text-[#9E824A] transition-colors" />
                </div>
                <h3 className="text-lg font-serif font-bold text-[#1C1C1A] group-hover:text-[#9E824A] transition-colors">
                  4. AI Legal Counsel Chat
                </h3>
                <p className="text-xs text-[#52514E] leading-relaxed font-sans">
                  Ask AI Legal Counsel &quot;Explain like I&apos;m 5&quot;, run worst-case financial scenario simulations, and export C-suite PDF executive reports.
                </p>
              </div>
              <div className="pt-3 border-t border-[#E8E5E0] text-xs font-bold text-[#9E824A] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>Ask AI Counsel</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#2C4235]" />
              </div>
            </motion.div>

          </div>
        </div>

        {/* ENTERPRISE SECURITY & COMPLIANCE SEAL */}
        <div className="p-8 bg-[#F5F2EB] border border-[#DFDACF] rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white border border-[#DFDACF] text-[#2C4235] flex items-center justify-center shrink-0 shadow-2xs">
              <Lock className="w-7 h-7 text-[#9E824A]" />
            </div>
            <div>
              <h3 className="text-lg font-serif font-bold text-[#1C1C1A]">
                Bank-Grade SOC-2 Type II Vault Security
              </h3>
              <p className="text-xs text-[#52514E] mt-0.5">
                Zero data retention for training. Your confidential commercial agreements remain strictly private and encrypted end-to-end.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('art-2-review')}
            className="px-6 py-3 bg-[#2C4235] hover:bg-[#1E2E25] text-white text-xs font-bold rounded-full transition-colors cursor-pointer shrink-0 shadow-xs flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-[#9E824A]" />
            <span>Enter Secure Vault Workspace</span>
          </button>
        </div>

        {/* FOOTER BRAND SEAL */}
        <div className="pt-8 border-t border-[#E8E5E0] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6E6D6A] font-sans">
          <div className="flex items-center gap-2">
            <ContractosLogo variant="horizontal" size="sm" />
            <span>• Enterprise Contract Intelligence Platform</span>
          </div>
          <p>© 2026 ContractOS. Indian Contract Standards Verified.</p>
        </div>

      </div>
    </div>
  );
};
