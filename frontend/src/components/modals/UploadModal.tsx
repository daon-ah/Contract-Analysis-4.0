import React, { useState, useCallback } from 'react';
import {
  Upload, X, Sparkles, FileCheck, FileText,
  AlertCircle, Loader2, ScanText, CloudUpload,
} from 'lucide-react';
import { Contract } from '../../types';
import { apiUploadContract, apiAnalyseContract } from '../../api';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called with the full analyse response data so App.tsx can map it */
  onAnalysisComplete: (analyseData: any) => void;
  onSelectSample?: (contract: Contract) => void;
}

type Phase =
  | 'idle'
  | 'uploading'     // sending PDF to Cloudinary via /contract/upload
  | 'analysing'     // calling /contract/analyse
  | 'done'
  | 'error';

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onAnalysisComplete,
}) => {
  const [contractType, setContractType] = useState('SaaS Agreement');
  const [dragOver, setDragOver] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  if (!isOpen) return null;

  const resetState = () => {
    setPhase('idle');
    setErrorMsg('');
    setSelectedFile(null);
  };

  const handleFileChange = (file: File) => {
    setSelectedFile(file);
    setPhase('idle');
    setErrorMsg('');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileChange(file);
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    try {
      // ── Step 1: Upload PDF to Cloudinary via Python backend ────────────────
      setPhase('uploading');
      const uploadResult = await apiUploadContract(selectedFile);

      if (uploadResult.status !== 'success' || !uploadResult.data?.id) {
        throw new Error(
          uploadResult.detail
          || uploadResult.message
          || 'File upload failed. Make sure you are logged in.'
        );
      }

      const documentId: number = uploadResult.data.id;
      console.log(`[Upload] document_id = ${documentId}`);

      // ── Step 2: Trigger AI analysis ────────────────────────────────────────
      setPhase('analysing');
      const analyseResult = await apiAnalyseContract(documentId);

      if (analyseResult.status !== 'success') {
        throw new Error(
          analyseResult.detail
          || analyseResult.message
          || 'Analysis failed. Please retry.'
        );
      }

      setPhase('done');
      // Pass the full analyse response up to App.tsx for mapping
      onAnalysisComplete({ documentId, ...analyseResult });
      onClose();

    } catch (err: any) {
      console.error('[UploadModal] Error:', err);
      setPhase('error');
      setErrorMsg(err.message || 'An unexpected error occurred.');
    }
  }, [selectedFile, onAnalysisComplete, onClose]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const isProcessing = phase === 'uploading' || phase === 'analysing';
  const canSubmit = !!selectedFile && !isProcessing;

  const phaseLabel: Record<Phase, string> = {
    idle: 'Start AI Risk Review',
    uploading: 'Uploading to Cloud…',
    analysing: 'Analysing Contract…',
    done: 'Done!',
    error: 'Retry',
  };

  const phaseIcon = isProcessing
    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
    : <Sparkles className="w-3.5 h-3.5" />;

  const dropZoneBody = () => {
    if (phase === 'uploading') return (
      <div className="flex flex-col items-center gap-2 text-[#244B3C]">
        <CloudUpload className="w-8 h-8 animate-bounce" />
        <p className="text-xs font-semibold">Uploading to Cloudinary…</p>
        <p className="text-[11px] text-[#6A6A6A]">{selectedFile?.name}</p>
      </div>
    );
    if (phase === 'analysing') return (
      <div className="flex flex-col items-center gap-2 text-[#244B3C]">
        <ScanText className="w-8 h-8 animate-pulse" />
        <p className="text-xs font-semibold">Running AI Contract Analysis…</p>
        <p className="text-[11px] text-[#6A6A6A]">Extracting clauses & risk levels — may take ~30 s</p>
      </div>
    );
    if (phase === 'error') return (
      <div className="flex flex-col items-center gap-2">
        <AlertCircle className="w-7 h-7 text-red-500" />
        <p className="text-xs font-semibold text-red-600">Upload or analysis failed</p>
        <p className="text-[11px] text-[#6A6A6A] text-center max-w-xs">{errorMsg}</p>
        <label htmlFor="file-upload-input" className="text-[11px] underline text-[#244B3C] cursor-pointer">
          Try a different file
        </label>
      </div>
    );
    if (selectedFile) return (
      <div className="flex flex-col items-center gap-2">
        <div className="w-10 h-10 rounded-full bg-[#244B3C]/10 flex items-center justify-center">
          <FileCheck className="w-5 h-5 text-[#244B3C]" />
        </div>
        <p className="text-xs font-semibold text-[#244B3C]">{selectedFile.name}</p>
        <p className="text-[11px] text-[#6A6A6A]">
          {(selectedFile.size / 1024).toFixed(0)} KB — ready to analyse
        </p>
        <label htmlFor="file-upload-input"
          className="text-[11px] underline text-[#6A6A6A] cursor-pointer hover:text-[#244B3C]">
          Replace file
        </label>
      </div>
    );
    return (
      <label htmlFor="file-upload-input" className="cursor-pointer space-y-2 block">
        <div className="w-10 h-10 mx-auto rounded-full bg-white border border-[#EAEAEA] flex items-center justify-center text-[#244B3C]">
          <Upload className="w-5 h-5" />
        </div>
        <p className="text-xs font-semibold text-[#181818]">
          Click to browse or drag and drop your contract
        </p>
        <p className="text-[11px] text-[#6A6A6A]">PDF, DOCX, TXT — up to 25 MB</p>
      </label>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="bg-white max-w-2xl w-full rounded-lg border border-[#EAEAEA] shadow-lg overflow-hidden">

        {/* Header */}
        <div className="p-4 bg-[#F8F8F6] border-b border-[#EAEAEA] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-[#244B3C] text-white rounded">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-serif font-semibold text-[#181818]">Ingest New Contract</h3>
              <p className="text-[11px] text-[#6A6A6A]">AI Risk Detection &amp; Intelligence Analysis</p>
            </div>
          </div>
          <button onClick={onClose} disabled={isProcessing}
            className="p-1 text-[#6A6A6A] hover:text-[#181818] rounded hover:bg-[#EAEAEA] cursor-pointer disabled:opacity-40">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="block text-xs font-medium text-[#181818] mb-1">Contract Category</label>
              <select value={contractType} onChange={(e) => setContractType(e.target.value)}
                className="w-full px-3 py-2 border border-[#EAEAEA] rounded text-xs focus:outline-none focus:border-[#244B3C] bg-white">
                <option value="SaaS Agreement">SaaS Agreement</option>
                <option value="Employment">Employment Agreement</option>
                <option value="MSA">Master Services Agreement (MSA)</option>
                <option value="NDA">Non-Disclosure Agreement (NDA)</option>
                <option value="Vendor Contract">Vendor Contract</option>
                <option value="Custom">Custom Commercial Document</option>
              </select>
            </div>

            {/* Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                isProcessing
                  ? 'border-[#244B3C] bg-[#244B3C]/5 cursor-wait'
                  : phase === 'error'
                  ? 'border-red-300 bg-red-50'
                  : dragOver
                  ? 'border-[#244B3C] bg-[#244B3C]/5 cursor-copy'
                  : selectedFile
                  ? 'border-[#244B3C]/40 bg-[#244B3C]/3'
                  : 'border-[#EAEAEA] hover:border-[#5F6F81] bg-[#F8F8F6] cursor-pointer'
              }`}
            >
              <input type="file" accept=".pdf,.txt,.docx,.doc"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileChange(f); }}
                className="hidden" id="file-upload-input" disabled={isProcessing} />
              {dropZoneBody()}
            </div>

            {/* Info note */}
            <p className="text-[11px] text-[#6A6A6A] flex items-center gap-1">
              <FileText className="w-3 h-3 shrink-0" />
              The file is uploaded to Cloudinary and analysed by AI — you must be logged in.
            </p>

            {/* Actions */}
            <div className="pt-1 flex justify-end space-x-2">
              <button type="button" onClick={() => { resetState(); onClose(); }}
                disabled={isProcessing}
                className="px-4 py-2 border border-[#EAEAEA] rounded text-xs text-[#6A6A6A] hover:bg-[#F8F8F6] cursor-pointer disabled:opacity-40">
                Cancel
              </button>
              <button type="submit" disabled={!canSubmit}
                className="px-5 py-2 bg-[#244B3C] text-white text-xs font-medium rounded hover:bg-[#1C3B2F] flex items-center space-x-1.5 shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                {phaseIcon}
                <span>{phaseLabel[phase]}</span>
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};
