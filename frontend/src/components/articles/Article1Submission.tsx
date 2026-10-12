import React, { useState, useCallback } from 'react';
import {
  FileUp,
  Sparkles,
  CloudUpload,
  ScanText,
  AlertCircle,
  Loader2,
  FileCheck,
} from 'lucide-react';
import { Contract } from '../../types';
import { apiUploadContract, apiAnalyseContract } from '../../api';

interface Article1SubmissionProps {
  onAnalysisComplete: (payload: any) => void;
}

type Phase = 'idle' | 'uploading' | 'analysing' | 'done' | 'error';

export const Article1Submission: React.FC<Article1SubmissionProps> = ({
  onAnalysisComplete,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [contractType, setContractType] = useState('SaaS Agreement');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else setDragActive(false);
  };

  const setFile = (file: File) => {
    setSelectedFile(file);
    setPhase('idle');
    setErrorMsg('');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) setFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setFile(file);
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    try {
      // Step 1: Upload to Cloudinary via Python backend
      setPhase('uploading');
      const uploadResult = await apiUploadContract(selectedFile);

      if (uploadResult.status !== 'success' || !uploadResult.data?.id) {
        throw new Error(
          uploadResult.detail
          || uploadResult.message
          || 'Upload failed. Make sure you are logged in.'
        );
      }

      const documentId: number = uploadResult.data.id;

      // Step 2: Trigger AI analysis
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
      onAnalysisComplete({ documentId, ...analyseResult });

    } catch (err: any) {
      console.error('[Article1] Error:', err);
      setPhase('error');
      setErrorMsg(err.message || 'An unexpected error occurred.');
    }
  }, [selectedFile, onAnalysisComplete]);

  const isProcessing = phase === 'uploading' || phase === 'analysing';

  const dropZoneContent = () => {
    if (phase === 'uploading') return (
      <div className="flex flex-col items-center gap-3 py-2 text-[#2C4235]">
        <CloudUpload className="w-10 h-10 animate-bounce" />
        <div>
          <span className="text-sm font-bold font-serif block">Uploading to Cloudinary…</span>
          <span className="text-xs text-[#6E6D6A] font-mono block mt-0.5">{selectedFile?.name}</span>
        </div>
      </div>
    );

    if (phase === 'analysing') return (
      <div className="flex flex-col items-center gap-3 py-2 text-[#2C4235]">
        <ScanText className="w-10 h-10 animate-pulse" />
        <div>
          <span className="text-sm font-bold font-serif block">Running AI Contract Analysis…</span>
          <span className="text-xs text-[#6E6D6A] font-mono block mt-0.5">Extracting clauses & risk levels — may take ~30 seconds</span>
        </div>
      </div>
    );

    if (phase === 'error') return (
      <div className="flex flex-col items-center gap-3 py-2">
        <AlertCircle className="w-10 h-10 text-red-500" />
        <div>
          <span className="text-sm font-bold font-serif text-red-600 block">Upload or Analysis Failed</span>
          <span className="text-xs text-[#6E6D6A] font-mono block mt-0.5 max-w-xs">{errorMsg}</span>
        </div>
        <label htmlFor="file-upload-art1"
          className="text-xs font-mono underline text-[#2C4235] cursor-pointer hover:opacity-75">
          Try a different file
        </label>
      </div>
    );

    if (selectedFile) return (
      <div className="flex flex-col items-center gap-3 py-2">
        <div className="w-12 h-12 rounded-full bg-[#2C4235]/10 text-[#2C4235] mx-auto flex items-center justify-center">
          <FileCheck className="w-6 h-6" />
        </div>
        <div>
          <span className="text-sm font-bold text-[#1C1C1A] block font-serif">{selectedFile.name}</span>
          <span className="text-xs text-[#6E6D6A] font-mono block mt-0.5">
            {(selectedFile.size / 1024).toFixed(0)} KB — ready to analyse
          </span>
        </div>
        <label htmlFor="file-upload-art1"
          className="text-xs font-mono underline text-[#6E6D6A] cursor-pointer hover:text-[#2C4235]">
          Replace file
        </label>
      </div>
    );

    return (
      <label htmlFor="file-upload-art1" className="cursor-pointer space-y-3 block">
        <div className="w-12 h-12 rounded-full bg-[#2C4235]/10 text-[#2C4235] mx-auto flex items-center justify-center">
          <FileUp className="w-6 h-6" />
        </div>
        <div>
          <span className="text-sm font-bold text-[#1C1C1A] block font-serif">
            Drag &amp; Drop Contract Document Here
          </span>
          <span className="text-xs text-[#6E6D6A] font-mono block mt-1">Accepts PDF, DOCX, or Plain Text Files</span>
        </div>
        <div className="inline-block px-4 py-1.5 bg-[#2C4235] text-white text-xs font-serif font-semibold rounded-xs hover:bg-[#1E2E25] transition-colors">
          Choose Agreement File
        </div>
      </label>
    );
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#FAF8F5] py-10 px-4 sm:px-6 lg:px-8 font-serif">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Submission Card */}
        <div className="paper-sheet p-8 sm:p-12 rounded-sm border border-[#E6E2DC] space-y-8">

          <div className="border-b-2 border-[#1C1C1A] pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-xs font-mono font-bold tracking-[0.2em] text-[#9E824A] uppercase block mb-1">
                ATTACHMENT VAULT
              </span>
              <h1 className="text-3xl font-serif font-bold text-[#1C1C1A]">
                Submission of Agreement
              </h1>
            </div>
            <span className="px-3 py-1 bg-[#2C4235]/10 text-[#2C4235] text-xs font-mono font-bold uppercase rounded border border-[#2C4235]/20">
              Vault Status: Ready
            </span>
          </div>

          <p className="text-base text-[#6E6D6A] font-serif-editorial italic leading-relaxed">
            &quot;In accordance with Section 1.01, the Reviewing Party hereby attaches and submits the complete
            document file of the contract subject to artificial legal intelligence review.&quot;
          </p>

          <form onSubmit={handleSubmit} className="space-y-6 font-sans">

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#1C1C1A] font-bold mb-1.5">
                Agreement Category
              </label>
              <select
                value={contractType}
                onChange={(e) => setContractType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E6E2DC] rounded-xs text-sm text-[#1C1C1A] focus:outline-none focus:border-[#2C4235] transition-colors"
              >
                <option value="SaaS Agreement">SaaS Agreement</option>
                <option value="Employment">Executive Employment</option>
                <option value="MSA">Master Services Agreement (MSA)</option>
                <option value="NDA">Non-Disclosure Agreement (NDA)</option>
                <option value="Vendor Contract">Vendor &amp; Supplier Agreement</option>
                <option value="Custom">Custom Commercial Contract</option>
              </select>
            </div>

            {/* Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`p-10 border-2 border-dashed rounded-xs text-center transition-all ${
                isProcessing
                  ? 'border-[#2C4235] bg-[#2C4235]/5 cursor-wait'
                  : phase === 'error'
                  ? 'border-red-300 bg-red-50'
                  : dragActive
                  ? 'border-[#2C4235] bg-[#2C4235]/5 cursor-copy'
                  : selectedFile
                  ? 'border-[#2C4235]/40 bg-white'
                  : 'border-[#D8D4CD] bg-[#FAF8F5] hover:border-[#2C4235]/50 cursor-pointer'
              }`}
            >
              <input
                type="file"
                id="file-upload-art1"
                accept=".pdf,.docx,.txt"
                onChange={handleFileChange}
                className="hidden"
                disabled={isProcessing}
              />
              {dropZoneContent()}
            </div>

            <button
              type="submit"
              disabled={!selectedFile || isProcessing}
              className="w-full py-4 bg-[#2C4235] text-white text-base font-serif font-bold rounded-xs shadow-md hover:bg-[#1E2E25] transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing
                ? <Loader2 className="w-5 h-5 animate-spin" />
                : <Sparkles className="w-5 h-5" />}
              <span>
                {phase === 'uploading' ? 'Uploading to Cloud…'
                  : phase === 'analysing' ? 'Running AI Analysis…'
                  : 'Initiate AI Legal Analysis'}
              </span>
            </button>
          </form>
        </div>

        {/* Sample Contracts section removed */}

      </div>
    </div>
  );
};
