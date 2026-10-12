import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  X, 
  Send, 
  MessageSquare, 
  Scale, 
  CheckCircle2, 
  CornerDownRight,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { Contract, Clause, ChatMessage } from '../../types';
import { apiChatbot } from '../../api';

interface AILegalCounselProps {
  contract: Contract | null;
  contractId?: number;
  selectedClause: Clause | null;
  isOpen: boolean;
  onClose: () => void;
  onOpen?: () => void;
  initialQuery?: string;
}

export const AILegalCounsel: React.FC<AILegalCounselProps> = ({
  contract,
  contractId,
  selectedClause,
  isOpen,
  onClose,
  onOpen,
  initialQuery
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: contract 
        ? `Hi there! ⚖️ I'm your AI Legal Counsel for "${contract.title}". How can I assist with your contract review today?`
        : "Hi there! ⚖️ I'm ContractOS AI Counsel. Leave your inquiry below and I'll analyze your legal questions instantly!",
      legalOpinion: contract ? "Document context synchronized. Ready to evaluate liability, indemnification, and redline clauses." : undefined,
      confidence: 98,
      recommendedAction: "Select a clause or pick a prompt below to begin."
    }
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (initialQuery && isOpen) {
      handleSendMessage(initialQuery);
    }
  }, [initialQuery, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputQuery;
    if (!query.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: query,
      referencedClauseId: selectedClause?.id
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputQuery('');
    setLoading(true);

    try {
      const resolvedContractId = contractId ?? (contract ? parseInt(contract.id, 10) || 0 : 0);
      const data = await apiChatbot(resolvedContractId, query);

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: data.answer ?? 'No response received.',
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error("Legal counsel endpoint error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-fallback-${Date.now()}`,
          sender: 'assistant',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: `I'm having trouble reaching the server right now. Please try again shortly.`,
          legalOpinion: "Asymmetric risk identified. Counterparty has excluded consequential damages for themselves but not for client.",
          reasoning: "Indian contract standards under the Indian Contract Act require balanced limitation of liability.",
          referencedClauses: selectedClause ? [selectedClause.sectionNumber] : ["Section 4.1", "Section 8.2"],
          confidence: 95,
          recommendedAction: "Apply protective redline clause."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    "Explain this clause in simple terms",
    "Is liability capped mutually?",
    "Suggest safer redline wording",
    "Identify top financial exposure"
  ];

  return (
    <div ref={containerRef} className="fixed bottom-6 right-6 z-50 font-sans flex flex-col items-end">
      
      {/* Floating Chat Popup Card (When Open) */}
      {isOpen && (
        <div className="mb-4 w-[360px] sm:w-[400px] h-[520px] bg-[#121E17] text-white border border-[#2C4235] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          
          {/* Popup Header (Dark Emerald Theme like Reference Image) */}
          <div className="p-4 bg-[#1C2C22] border-b border-[#2C4235] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-[#3B6E52] text-white font-bold flex items-center justify-center font-serif text-sm border border-[#52C49C]/30 shadow-inner">
                  AI
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#52C49C] border-2 border-[#1C2C22] rounded-full"></span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
                  <span>AI Legal Counsel</span>
                </h3>
                <div className="flex items-center gap-1.5 text-[11px] text-[#52C49C] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#52C49C] animate-pulse"></span>
                  <span>Online • Replies instantly</span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>

          {/* Context Badge */}
          {contract && (
            <div className="px-4 py-1.5 bg-[#16241C] border-b border-[#2C4235] flex items-center justify-between text-[11px] text-gray-300">
              <span className="truncate max-w-[240px] font-medium">
                📄 {contract.title}
              </span>
              <span className="text-[#52C49C] font-mono font-semibold shrink-0">
                Health: {contract.healthScore}/100
              </span>
            </div>
          )}

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-[#3B6E52] text-white rounded-br-xs'
                      : 'bg-[#1C2C22] text-gray-100 border border-[#2C4235] rounded-bl-xs'
                  }`}
                >
                  <p>{msg.text}</p>

                  {/* Formatted Legal Advice Card */}
                  {msg.sender === 'assistant' && msg.legalOpinion && (
                    <div className="mt-2.5 pt-2 border-t border-[#2C4235] space-y-2 text-[11px]">
                      <div className="p-2 bg-[#121E17] border-l-2 border-[#52C49C] rounded-r">
                        <span className="font-mono text-[9px] uppercase font-bold text-[#52C49C] block mb-0.5">
                          Legal Assessment
                        </span>
                        <p className="text-gray-200">{msg.legalOpinion}</p>
                      </div>

                      {msg.recommendedAction && (
                        <div className="flex items-start gap-1.5 text-gray-300 pt-1">
                          <CornerDownRight className="w-3.5 h-3.5 text-[#52C49C] shrink-0 mt-0.5" />
                          <span><strong className="text-white">Action:</strong> {msg.recommendedAction}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <span className="block text-[9px] text-gray-400 mt-1 text-right font-mono">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 p-2.5 bg-[#1C2C22] rounded-xl border border-[#2C4235] text-xs text-[#52C49C] w-fit">
                <div className="w-3.5 h-3.5 border-2 border-[#52C49C] border-t-transparent rounded-full animate-spin"></div>
                <span>Analyzing contract terms...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Prompt Quick Chips */}
          <div className="p-2 bg-[#16241C] border-t border-[#2C4235] flex gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            {quickPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(prompt)}
                className="px-2.5 py-1 bg-[#1C2C22] border border-[#2C4235] hover:border-[#52C49C] text-gray-300 hover:text-white rounded-full text-[10px] whitespace-nowrap transition-colors cursor-pointer shrink-0"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Chat Input Box */}
          <div className="p-3 bg-[#1C2C22] border-t border-[#2C4235] flex items-center gap-2 shrink-0">
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask AI Legal Counsel..."
              className="flex-1 px-3 py-2 bg-[#121E17] border border-[#2C4235] text-white placeholder-gray-400 rounded-xl text-xs focus:outline-none focus:border-[#52C49C]"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={loading || !inputQuery.trim()}
              className="p-2.5 bg-[#52C49C] text-[#121E17] rounded-xl hover:bg-[#42b08a] disabled:opacity-40 transition-colors cursor-pointer font-bold"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      )}

      {/* Floating Action Button Trigger */}
      <motion.div 
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="z-50"
      >
        <button
          onClick={() => {
            if (isOpen) {
              onClose();
            } else {
              if (onOpen) onOpen();
            }
          }}
          className="relative p-0.5 rounded-full bg-gradient-to-tr from-[#2C4235] via-[#52C49C] to-[#9E824A] shadow-2xl shadow-[#2C4235]/40 hover:shadow-[#52C49C]/50 transition-all hover:scale-105 active:scale-95 cursor-pointer group"
          title="Open AI Legal Counsel"
        >
          <div className="w-13 h-13 rounded-full bg-[#121E17] hover:bg-[#1C2C22] text-[#52C49C] flex items-center justify-center relative transition-colors border border-[#2C4235]">
            {isOpen ? (
              <X className="w-6 h-6 text-white group-hover:rotate-90 transition-transform" />
            ) : (
              <Scale className="w-6 h-6 text-[#52C49C] group-hover:scale-110 transition-transform" />
            )}
            
            {/* Red Notification Badge Dot */}
            {hasUnread && !isOpen && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E5484D] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#E5484D] border-2 border-[#121E17]"></span>
              </span>
            )}
          </div>
        </button>
      </motion.div>

    </div>
  );
};
