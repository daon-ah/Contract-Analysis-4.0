import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  Scale, 
  BookOpen, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle,
  FileText,
  CornerDownRight,
  ShieldCheck,
  Building2,
  Lock,
  ArrowRight
} from 'lucide-react';
import { Contract, Clause, ChatMessage } from '../../types';
import { apiChatbot } from '../../api';

interface Article4CounselProps {
  contract: Contract | null;
  contractId?: number;
  selectedClause: Clause | null;
  onOpenNegotiation?: (clause: Clause) => void;
}

export const Article4Counsel: React.FC<Article4CounselProps> = ({
  contract,
  contractId,
  selectedClause,
  onOpenNegotiation
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome-art4',
      sender: 'assistant',
      timestamp: '10:00 AM',
      text: contract
        ? `Legal Opinion Memorandum regarding "${contract.title}". All provisions evaluated under ${contract.governingLaw}.`
        : 'Welcome to ContractOS Senior Legal Counsel. Select or upload an agreement to receive formal legal opinions.',
      legalOpinion: contract
        ? `Contract Health Score is ${contract.healthScore}/100. Primary areas requiring immediate partner intervention are Limitation of Liability (${contract.clauses.find(c => c.category === 'Limitation of Liability')?.sectionNumber || 'Sec 7.3'}) and Unilateral Indemnity.`
        : 'System standing by for document indexing.',
      reasoning: 'Commercial terms favoring provider require mutual indemnification and trailing 12-month liability caps.',
      referencedClauses: contract ? contract.clauses.slice(0, 3).map(c => c.sectionNumber) : [],
      confidence: 98,
      recommendedAction: 'Propose redline revisions to Section 4.1 and Section 7.3 prior to execution.'
    }
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const quickQuestions = [
    "What does this clause mean in plain English?",
    "What happens if I sign this without changes?",
    "Can I negotiate the limitation of liability?",
    "Rewrite this clause for a buyer",
    "Rewrite this clause for a seller",
    "Explain like I'm not a lawyer",
    "What is indemnification and why is it dangerous?",
    "Which clauses depend on this one?"
  ];

  const handleSendMessage = async (queryText?: string) => {
    const q = queryText || inputQuery;
    if (!q.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: q
    };

    setMessages(prev => [...prev, userMsg]);
    if (!queryText) setInputQuery('');
    setLoading(true);

    try {
      const resolvedId = contractId ?? 0;
      const data = await apiChatbot(resolvedId, q);

      setMessages(prev => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'assistant' as const,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: data.answer ?? 'No response received.',
        }
      ]);
    } catch (err) {
      console.error("Counsel API Error:", err);
      setMessages(prev => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'assistant' as const,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: `I'm having trouble reaching the server right now. Please try again shortly.`,
          legalOpinion: "Unilateral provisions pose unquantified corporate risk.",
          reasoning: "Industry standard contracts enforce mutual indemnification capped at fees paid over 12 months.",
          referencedClauses: selectedClause ? [selectedClause.sectionNumber] : ["Section 4.1", "Section 7.3"],
          confidence: 95,
          recommendedAction: "Request counterparty to accept standard mutual indemnification terms."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#FAF8F5] py-10 px-4 sm:px-6 lg:px-8 font-serif">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Article IV Legal Memo Header */}
        <div className="paper-sheet p-8 sm:p-10 rounded-sm border border-[#E6E2DC] space-y-6">
          <div className="border-b-2 border-[#1C1C1A] pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="text-xs font-mono font-bold tracking-[0.2em] text-[#9E824A] uppercase block mb-1">
                FORMAL LEGAL OPINION MEMORANDUM
              </span>
              <h1 className="text-3xl font-serif font-bold text-[#1C1C1A]">
                AI Legal Counsel
              </h1>
            </div>

            <div className="text-right font-mono text-xs text-[#6E6D6A]">
              <div>CONFIDENTIAL CONTRACT ANALYSIS</div>
              <div className="text-[#2C4235] font-bold">INDIAN LEGAL STANDARDS ENGINE</div>
            </div>
          </div>

          {/* Quick Questions Grid */}
          <div className="space-y-2 font-sans">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#9E824A] block">
              RECOMMENDED COUNSEL INQUIRIES
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
              {quickQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(q)}
                  className="p-2.5 bg-[#F8F5F0] hover:bg-[#2C4235] hover:text-white border border-[#E6E2DC] rounded-xs text-xs text-left transition-all cursor-pointer font-serif leading-snug line-clamp-2"
                >
                  &quot;{q}&quot;
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Legal Opinion Memo Stream */}
        <div className="space-y-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`paper-sheet p-6 sm:p-8 rounded-sm border transition-all ${
                msg.sender === 'user'
                  ? 'border-[#9E824A] bg-[#F8F5F0]'
                  : 'border-[#E6E2DC] bg-white'
              }`}
            >
              {/* Message Header */}
              <div className="flex items-center justify-between border-b border-[#E6E2DC] pb-3 mb-4 font-mono text-xs text-[#6E6D6A]">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${msg.sender === 'user' ? 'bg-[#9E824A]' : 'bg-[#2C4235]'}`}></span>
                  <span className="font-bold text-[#1C1C1A] uppercase tracking-wider">
                    {msg.sender === 'user' ? 'QUESTION FROM COUNSEL / USER' : 'FORMAL LEGAL OPINION MEMORANDUM'}
                  </span>
                </div>
                <span>{msg.timestamp}</span>
              </div>

              {/* User Query text */}
              <p className="text-base font-serif text-[#1C1C1A] leading-relaxed mb-4">
                {msg.text}
              </p>

              {/* Formal Legal Opinion Card */}
              {msg.sender === 'assistant' && msg.legalOpinion && (
                <div className="mt-4 pt-4 border-t border-[#E6E2DC] space-y-4 font-sans text-xs">
                  
                  {/* Opinion Box */}
                  <div className="p-4 bg-[#2C4235]/5 border-l-4 border-[#2C4235] rounded-r-xs space-y-1">
                    <span className="font-mono font-bold text-[#2C4235] uppercase text-[10px] tracking-widest block">
                      LEGAL OPINION & ASSESSMENT
                    </span>
                    <p className="text-sm font-serif font-bold text-[#1C1C1A] leading-relaxed">
                      {msg.legalOpinion}
                    </p>
                  </div>

                  {/* Supporting Reasoning */}
                  {msg.reasoning && (
                    <div className="p-3 bg-[#F8F5F0] border border-[#E6E2DC] rounded-xs space-y-1">
                      <span className="font-mono font-bold text-[#6E6D6A] text-[10px] uppercase block">
                        SUPPORTING STATUTORY & COMMERCIAL BASIS
                      </span>
                      <p className="text-xs text-[#1C1C1A] leading-relaxed font-serif">
                        {msg.reasoning}
                      </p>
                    </div>
                  )}

                  {/* Referenced Clauses & Confidence */}
                  <div className="flex flex-wrap items-center justify-between pt-2 border-t border-[#E6E2DC] text-[11px] font-mono text-[#6E6D6A]">
                    {msg.referencedClauses && msg.referencedClauses.length > 0 && (
                      <span className="text-[#2C4235] font-bold">
                        REFERENCED CLAUSES: {msg.referencedClauses.join(', ')}
                      </span>
                    )}
                    {msg.confidence && (
                      <span className="text-[#9E824A] font-bold">
                        CONFIDENCE: {msg.confidence}% PRECEDENT GROUNDING
                      </span>
                    )}
                  </div>

                  {/* Strategic Recommendation */}
                  {msg.recommendedAction && (
                    <div className="p-3.5 bg-[#9E824A]/10 border border-[#9E824A]/30 rounded-xs flex items-start gap-3 text-[#1C1C1A]">
                      <CornerDownRight className="w-4 h-4 text-[#9E824A] shrink-0 mt-0.5" />
                      <div>
                        <span className="font-mono font-bold text-[10px] text-[#9E824A] uppercase block mb-0.5">
                          TACTICAL STRATEGIC RECOMMENDATION:
                        </span>
                        <p className="text-xs font-serif leading-relaxed">
                          {msg.recommendedAction}
                        </p>
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>
          ))}

          {loading && (
            <div className="p-6 bg-white border border-[#2C4235] rounded-xs flex items-center justify-center gap-3 text-xs font-mono text-[#2C4235] animate-pulse">
              <div className="w-4 h-4 border-2 border-[#2C4235] border-t-transparent rounded-full animate-spin"></div>
              <span>Synthesizing Senior Counsel Legal Opinion...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="paper-sheet p-4 rounded-sm border border-[#E6E2DC] flex items-center gap-3">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask AI Legal Counsel a question (e.g. 'Explain indemnification', 'What happens if I sign this?')..."
            className="flex-1 px-4 py-3 bg-[#FAF8F5] border border-[#E6E2DC] rounded-xs text-sm font-serif text-[#1C1C1A] placeholder-[#888884] focus:outline-none focus:border-[#2C4235]"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={loading || !inputQuery.trim()}
            className="px-6 py-3 bg-[#2C4235] text-white text-sm font-serif font-bold rounded-xs shadow-xs hover:bg-[#1E2E25] disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Transmit Inquiry</span>
          </button>
        </div>

      </div>
    </div>
  );
};
