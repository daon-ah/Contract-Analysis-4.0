import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Check,
  RotateCcw,
  Sparkles,
  Edit2,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Scale,
  Loader2,
  TrendingDown,
  TrendingUp,
  Minus,
} from 'lucide-react';
import { Clause } from '../../types';
import { apiSimulate } from '../../api';

interface SimulationResult {
  original_clause: string;
  modified_clause: string;
  old_risk: string;
  new_risk: string;
  summary: string;
  translation: string | null;
  explanation: any;
}

interface NegotiationModalProps {
  clause: Clause | null;
  isOpen: boolean;
  /** Backend document_id needed for simulate call */
  documentId?: number;
  /** Backend clause_id (integer) needed for simulate call */
  backendClauseId?: number;
  onClose: () => void;
  onAcceptRewrite: (clauseId: string, rewriteText: string) => void;
}

type SimPhase = 'idle' | 'simulating' | 'done' | 'error';

const RISK_COLOUR: Record<string, string> = {
  HIGH: '#A83832',
  MEDIUM: '#B87A2B',
  LOW: '#2C4235',
  SAFE: '#2C4235',
};

export const NegotiationModal: React.FC<NegotiationModalProps> = ({
  clause,
  isOpen,
  documentId,
  backendClauseId,
  onClose,
  onAcceptRewrite,
}) => {
  if (!isOpen || !clause) return null;

  const [editedText, setEditedText] = useState(
    clause.suggestedRewrite || clause.originalText
  );
  const [isEditing, setIsEditing] = useState(false);
  const [simPhase, setSimPhase] = useState<SimPhase>('idle');
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [simError, setSimError] = useState('');

  // Auto-run simulate on open if clause is HIGH risk and we have IDs
  useEffect(() => {
    if (
      clause.riskLevel === 'HIGH' &&
      documentId != null &&
      backendClauseId != null &&
      simPhase === 'idle'
    ) {
      runSimulate(editedText);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runSimulate = useCallback(async (modifiedText: string) => {
    if (documentId == null || backendClauseId == null) return;
    setSimPhase('simulating');
    setSimResult(null);
    setSimError('');
    try {
      const json = await apiSimulate(documentId, backendClauseId, modifiedText);
      if (json.status !== 'success') throw new Error(json.detail || json.message || 'Simulation failed');
      setSimResult(json.data);
      setSimPhase('done');
    } catch (err: any) {
      setSimError(err.message || 'Simulation failed');
      setSimPhase('error');
    }
  }, [documentId, backendClauseId]);

  const handleAccept = () => {
    const finalDraft = editedText;
    onAcceptRewrite(clause.id, finalDraft);
    onClose();
  };

  const riskBadge = (level: string) => {
    const colour = RISK_COLOUR[level?.toUpperCase()] ?? '#6A6A6A';
    return (
      <span
        className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase"
        style={{ background: `${colour}18`, color: colour }}
      >
        {level} RISK
      </span>
    );
  };

  const riskChangeIcon = () => {
    if (!simResult) return null;
    const oldR = simResult.old_risk.toUpperCase();
    const newR = simResult.new_risk.toUpperCase();
    const levels: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1, SAFE: 0 };
    const diff = (levels[oldR] ?? 0) - (levels[newR] ?? 0);
    if (diff > 0)
      return <TrendingDown className="w-4 h-4 text-[#2C4235]" />;
    if (diff < 0)
      return <TrendingUp className="w-4 h-4 text-[#A83832]" />;
    return <Minus className="w-4 h-4 text-[#B87A2B]" />;
  };

  const canSimulate = documentId != null && backendClauseId != null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="bg-white max-w-4xl w-full rounded-lg border border-[#EAEAEA] shadow-xl overflow-hidden flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="p-4 bg-[#F8F8F6] border-b border-[#EAEAEA] flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-[#244B3C] text-white rounded">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-serif font-semibold text-[#181818]">
                Side-by-Side Clause Negotiator
              </h3>
              <p className="text-[11px] text-[#6A6A6A]">
                {clause.sectionNumber} — {clause.title} ({clause.category})
                {canSimulate && (
                  <span className="ml-2 text-[#244B3C] font-mono">· AI Simulate Active</span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#6A6A6A] hover:text-[#181818] rounded hover:bg-[#EAEAEA] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#F8F8F6]">

          {/* ── Side-by-side grid ─────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Left: Original */}
            <div className="bg-white p-5 rounded-lg border border-[#EAEAEA] shadow-xs space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-[#EAEAEA]">
                <span className="text-xs font-mono font-bold text-[#C14F4A] uppercase tracking-wider">
                  Original Counterparty Wording
                </span>
                {riskBadge(simResult?.old_risk ?? clause.riskLevel)}
              </div>

              <div className="text-xs leading-relaxed text-[#181818] bg-[#F8F8F6] p-3 rounded border border-[#EAEAEA] min-h-[140px] font-sans whitespace-pre-wrap">
                {clause.originalText}
              </div>

              {clause.riskExplanation && (
                <div className="text-[11px] text-[#6A6A6A] space-y-0.5 pt-1">
                  <span className="font-semibold text-[#181818] block">Identified Risk:</span>
                  <p className="leading-relaxed">{clause.riskExplanation}</p>
                </div>
              )}
            </div>

            {/* Right: Editable rewrite */}
            <div className="bg-white p-5 rounded-lg border border-[#244B3C] shadow-xs space-y-3 relative">
              <div className="flex justify-between items-center pb-2 border-b border-[#EAEAEA]">
                <div className="flex items-center space-x-1.5 text-[#244B3C]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider">
                    Your Redline Draft
                  </span>
                </div>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-xs text-[#244B3C] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>{isEditing ? 'Preview' : 'Edit Rewrite'}</span>
                </button>
              </div>

              {isEditing ? (
                <textarea
                  rows={7}
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className="w-full p-3 border border-[#244B3C] rounded text-xs font-sans text-[#181818] focus:outline-none resize-none"
                  placeholder="Type your modified clause here…"
                />
              ) : (
                <div className="text-xs leading-relaxed text-[#181818] bg-[#244B3C]/5 p-3 rounded border border-[#244B3C]/30 min-h-[140px] font-sans whitespace-pre-wrap">
                  {editedText || <span className="text-[#6A6A6A] italic">No rewrite yet — click Edit Rewrite to draft one.</span>}
                </div>
              )}

              {canSimulate && (
                <button
                  onClick={() => runSimulate(editedText)}
                  disabled={simPhase === 'simulating' || !editedText.trim()}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-[#244B3C] text-white text-xs font-semibold rounded hover:bg-[#1C3B2F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {simPhase === 'simulating'
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Running AI Simulation…</span></>
                    : <><ShieldCheck className="w-3.5 h-3.5" /><span>Simulate Risk Impact</span></>}
                </button>
              )}
            </div>
          </div>

          {/* ── Simulation Result Panel ───────────────────────────── */}
          {simPhase === 'simulating' && (
            <div className="bg-white border border-[#EAEAEA] rounded-lg p-5 flex items-center gap-3 text-sm text-[#244B3C]">
              <Loader2 className="w-5 h-5 animate-spin shrink-0" />
              <span>AI is evaluating the risk impact of your modified clause…</span>
            </div>
          )}

          {simPhase === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2 text-xs text-red-700">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{simError || 'Simulation failed. Make sure you are logged in and the backend is running.'}</span>
            </div>
          )}

          {simPhase === 'done' && simResult && (
            <div className="bg-white border border-[#244B3C]/20 rounded-lg overflow-hidden">
              {/* Result header */}
              <div className="px-4 py-3 bg-[#244B3C]/5 border-b border-[#244B3C]/15 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#244B3C]" />
                  <span className="text-xs font-mono font-bold text-[#244B3C] uppercase tracking-wider">
                    AI Simulation Result
                  </span>
                </div>
                {/* Risk change indicator */}
                <div className="flex items-center gap-2 text-xs font-mono">
                  {riskBadge(simResult.old_risk)}
                  <div className="flex items-center gap-1 text-[#6A6A6A]">
                    {riskChangeIcon()}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                  {riskBadge(simResult.new_risk)}
                </div>
              </div>

              <div className="p-4 space-y-3">
                {/* Summary */}
                <div>
                  <span className="text-[10px] font-mono font-bold text-[#6A6A6A] uppercase tracking-wider block mb-1">
                    AI Assessment
                  </span>
                  <p className="text-sm text-[#181818] leading-relaxed">{simResult.summary}</p>
                </div>

                {/* Plain-English of modified clause */}
                {simResult.translation && (
                  <div className="pt-2 border-t border-[#EAEAEA]">
                    <span className="text-[10px] font-mono font-bold text-[#6A6A6A] uppercase tracking-wider block mb-1">
                      Plain English (Modified Clause)
                    </span>
                    <p className="text-xs text-[#2C4235] leading-relaxed bg-[#244B3C]/5 p-3 rounded border border-[#244B3C]/15">
                      {simResult.translation}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-[#EAEAEA] flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-[#EAEAEA] text-[#6A6A6A] hover:bg-[#F8F8F6] rounded text-xs font-medium cursor-pointer"
          >
            Reject &amp; Keep Original
          </button>

          <div className="flex items-center space-x-2">
            {canSimulate && (
              <button
                onClick={() => runSimulate(editedText)}
                disabled={simPhase === 'simulating' || !editedText.trim()}
                className="px-3 py-2 border border-[#EAEAEA] text-[#181818] hover:bg-[#F8F8F6] rounded text-xs font-medium flex items-center space-x-1 cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Re-simulate</span>
              </button>
            )}

            <button
              onClick={handleAccept}
              disabled={!editedText.trim()}
              className="px-5 py-2 bg-[#244B3C] text-white rounded text-xs font-medium hover:bg-[#1C3B2F] flex items-center space-x-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>Apply Redline to Contract</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
