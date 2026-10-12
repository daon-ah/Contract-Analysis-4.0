import React, { useState, useEffect, useCallback } from 'react';
import { SAMPLE_CONTRACTS } from './data/sampleContracts';
import { Contract, Clause, ArticleView, UserProfile } from './types';
import { apiGetAnalyses, apiGetAnalysis } from './api';
// Layout Components
import { Navbar } from './components/layout/Navbar';
import { LeftSidebar } from './components/layout/LeftSidebar';
import { RightContextPanel } from './components/layout/RightContextPanel';

// Contract Reader Component
import { ContractReader } from './components/contract/ContractReader';

// Pages
import { AuthView } from './pages/AuthPage';
import { ProfileView } from './pages/ProfilePage';
import { PreambleLanding } from './pages/LandingPage';
import { ReportView } from './pages/ReportPage';

// Modals
import { UploadModal } from './components/modals/UploadModal';
import { AIReviewOverlay } from './components/modals/AIReviewOverlay';
import { AILegalCounsel } from './components/modals/AILegalCounsel';
import { NegotiationModal } from './components/modals/NegotiationModal';

// Article Components
import { Article1Submission } from './components/articles/Article1Submission';
import { Article3Negotiation } from './components/articles/Article3Negotiation';
import { Article4Counsel } from './components/articles/Article4Counsel';
import { Article6Execution } from './components/articles/Article6Execution';

export default function App() {
  // Current Logged-In User
  const [user, setUser] = useState<UserProfile | null>(null);

  // Active View ('preamble' default landing page)
  const [activeArticle, setActiveArticle] = useState<ArticleView>('preamble');

  // Contracts State
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [activeContractId, setActiveContractId] = useState<string | null>(null);
  const [selectedClauseId, setSelectedClauseId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('ALL');

  // ── Fetch analyses list from backend on mount ─────────────────────────────
  useEffect(() => {
    apiGetAnalyses()
      .then((json) => {
        if (!json || json.status !== 'success') return;
        const backendContracts: Contract[] = (json.data as any[]).map((item) => ({
          id: `backend-analysis-${item.id}`,
          title: item.filename.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
          contractType: 'NDA',
          uploadedAt: item.uploadedAt?.split('T')[0] ?? '',
          fileSize: '',
          status: 'ANALYZED' as const,
          healthScore: Math.max(40, 100 - (item.riskScore ?? 0)),
          executiveOpinion: '',
          topRisks: [],
          governingLaw: '',
          parties: [],
          effectiveDate: '',
          expirationDate: '',
          clauses: [],
          recommendations: [],
          negotiationChecklist: [],
          _backendAnalysisId: item.id,
        } as Contract & { _backendAnalysisId: number }));

        setContracts((prev) => {
          const existingIds = new Set(prev.map((c) => c.id));
          const fresh = backendContracts.filter((c) => !existingIds.has(c.id));
          return [...prev, ...fresh];
        });
      })
      .catch((e) => console.warn('[App] /contract/analyses:', e));
  }, []);

  // Modals & Overlay States
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [isReviewing, setIsReviewing] = useState<boolean>(false);
  const [reviewingTitle, setReviewingTitle] = useState<string>('');
  const [pendingContract, setPendingContract] = useState<Contract | null>(null);

  // AI Counsel Floating Popup State
  const [isCounselOpen, setIsCounselOpen] = useState<boolean>(false);
  const [counselQuery, setCounselQuery] = useState<string | undefined>(undefined);

  // Negotiation Side-by-Side Modal
  const [isNegotiationOpen, setIsNegotiationOpen] = useState<boolean>(false);
  const [negotiationClause, setNegotiationClause] = useState<Clause | null>(null);

  // Active Contract Object
  const currentContract = contracts.find((c) => c.id === activeContractId) || contracts[0] || null;
  const selectedClause = currentContract?.clauses.find((c) => c.id === selectedClauseId) || null;

  // ── Auto-resolve _documentId from GET /contract/analyses/{id} ────────────
  // When a backend contract is active but _documentId hasn't been set yet,
  // fetch its full detail to extract data.document.id (the real document ID
  // the chatbot endpoint expects as contract_id).
  useEffect(() => {
    const c = currentContract as any;
    if (!c?._backendAnalysisId || c?._documentId) return; // already resolved or not a backend contract

    apiGetAnalysis(c._backendAnalysisId)
      .then((json) => {
        if (json?.status !== 'success') return;
        const docId: number | undefined = json.data?.document?.id;
        if (!docId) return;

        setContracts((prev) =>
          prev.map((contract) =>
            contract.id === c.id
              ? { ...contract, _documentId: docId } as any
              : contract
          )
        );
      })
      .catch((e) => console.warn('[App] Failed to resolve _documentId:', e));
  }, [currentContract?.id]); // re-run whenever the active contract changes

  // Handlers
  const handleSelectContract = async (id: string) => {
    setActiveContractId(id);
    setSelectedClauseId(null);

    // If this is a backend-sourced contract, deep-fetch its full analysis
    const contract = contracts.find((c) => c.id === id) as any;
    if (contract?._backendAnalysisId && contract.clauses.length === 0) {
      try {
        const res = await fetch(
          `http://localhost:8000/contract/analyses/${contract._backendAnalysisId}`,
          { credentials: 'include' }
        );
        if (!res.ok) return;
        const json = await res.json();
        if (json.status !== 'success') return;

        const detail = json.data;
        const clauses: any[] = (detail.clauses ?? []).map((c: any, idx: number) => ({
          id: `c-backend-${contract._backendAnalysisId}-${c.id}`,
          sectionNumber: `Clause ${idx + 1}`,
          title: c.clauseType || 'General',
          originalText: (c.rawText || '')
            .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
            .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
            .replace(/[\u2013\u2014]/g, '-')
            .replace(/[\u0000\u00AD\u200B\uFEFF]/g, '')
            .replace(/\r\n/g, '\n').replace(/\r/g, '\n')
            .replace(/\n{3,}/g, '\n\n').trim(),
          riskLevel: (c.riskLevel || 'LOW') as 'HIGH' | 'MEDIUM' | 'LOW' | 'SAFE',
          category: (c.clauseType || 'General') as any,
          riskExplanation: c.translatedText || `${c.riskLevel || 'LOW'} risk clause.`,
          suggestedRewrite: '',
          negotiationAdvice: '',
          confidenceScore: 100,
          referencedPrecedents: [],
          pageNumber: idx + 1,
        }));

        const highCount = clauses.filter((c) => c.riskLevel === 'HIGH').length;
        const medCount = clauses.filter((c) => c.riskLevel === 'MEDIUM').length;
        const healthScore = Math.max(40, 100 - highCount * 18 - medCount * 7);

        setContracts((prev) =>
          prev.map((c) =>
            c.id === id
              ? {
                  ...c,
                  clauses,
                  healthScore,
                  title: (detail.document?.filename ?? c.title).replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
                  topRisks: clauses.filter((cl) => cl.riskLevel === 'HIGH').map((cl) => cl.title),
                  governingLaw: '',
                  parties: [],
                  // Store the real document ID for chatbot use
                  _documentId: detail.document?.id ?? (c as any)._documentId,
                } as any
              : c
          )
        );
      } catch (e) {
        console.warn('[App] Failed to load backend analysis detail:', e);
      }
    }
  };

  const handleSelectClause = (clause: Clause | null) => {
    setSelectedClauseId(clause ? clause.id : null);
  };

  const handleAcceptRewrite = (clauseId: string, rewriteText: string) => {
    if (!activeContractId) return;

    setContracts((prevContracts) =>
      prevContracts.map((contract) => {
        if (contract.id !== activeContractId) return contract;

        const updatedClauses = contract.clauses.map((c) => {
          if (c.id === clauseId) {
            return {
              ...c,
              acceptedRewrite: true,
              customRewrite: rewriteText,
              riskLevel: 'LOW' as const
            };
          }
          return c;
        });

        // Recalculate Contract Health Score
        const highRiskCount = updatedClauses.filter(c => c.riskLevel === 'HIGH' && !c.acceptedRewrite).length;
        const newScore = Math.min(100, Math.max(50, 100 - (highRiskCount * 12)));

        return {
          ...contract,
          clauses: updatedClauses,
          healthScore: newScore
        };
      })
    );
  };

  // ── handleAnalysisComplete ──────────────────────────────────────────
  // Called by UploadModal after both /contract/upload + /contract/analyse succeed
  const handleAnalysisComplete = useCallback((payload: any) => {
    const { documentId, data, message } = payload;
    const apiData = data?.data ?? data ?? {};

    const riskMap: Record<string, 'HIGH' | 'MEDIUM' | 'LOW' | 'SAFE'> = {
      HIGH: 'HIGH', MEDIUM: 'MEDIUM', LOW: 'LOW', SAFE: 'SAFE',
    };

    const clauses: Clause[] = (apiData.clauses ?? []).map((c: any, idx: number) => {
      const rawText = (c.rawText || c.text || '');
      const cleanedOriginal = rawText
        .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
        .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
        .replace(/[\u2013\u2014]/g, '-')
        .replace(/[\u0000\u00AD\u200B\uFEFF]/g, '')
        .replace(/\r\n/g, '\n').replace(/\r/g, '\n')
        .replace(/\n{3,}/g, '\n\n').trim();

      // Collect all candidate explanation strings in priority order:
      // 1. plain_english from the live analyse response translation object
      // 2. translatedText stored in DB (from detail endpoint)
      // Only use it if it's meaningfully different from the original text
      const candidateExplanation =
        c.translation?.plain_english?.trim()       // from /contract/analyze response
        || c.translatedText?.trim()                // from /contract/analyses/{id}
        || '';

      // Don't show the raw clause text as the explanation (happens when translation failed)
      const riskExplanation =
        candidateExplanation && candidateExplanation !== cleanedOriginal
          ? candidateExplanation
          : '';

      return {
        id: `c-analyse-${documentId}-${c.id ?? c.clause_id ?? idx}`,
        sectionNumber: `Clause ${idx + 1}`,
        title: c.clauseType || c.header || 'General',
        originalText: cleanedOriginal,
        riskLevel: riskMap[(c.riskLevel || c.risk?.risk_level || 'LOW').toUpperCase()] ?? 'LOW',
        category: (c.clauseType || c.header || 'General') as any,
        riskExplanation,
        suggestedRewrite: '',
        negotiationAdvice: '',
        confidenceScore: Math.round((c.risk?.confidence ?? 1) * 100) || 100,
        referencedPrecedents: [],
        pageNumber: idx + 1,
      };
    });

    const highCount = clauses.filter((c) => c.riskLevel === 'HIGH').length;
    const medCount  = clauses.filter((c) => c.riskLevel === 'MEDIUM').length;
    const healthScore = Math.max(40, 100 - highCount * 18 - medCount * 7);
    const title = apiData.document?.filename
      ? apiData.document.filename.replace(/\.[^/.]+$/, '').replace(/_/g, ' ')
      : `Contract ${documentId}`;

    const newContract: Contract & { _backendAnalysisId: number } = {
      id: `contract-analyse-${documentId}-${Date.now()}`,
      title,
      contractType: 'NDA',
      uploadedAt: new Date().toISOString().split('T')[0],
      fileSize: '',
      status: 'ANALYZED',
      healthScore,
      executiveOpinion: `Analysis of ${title} complete. ${highCount} high-risk clause(s) identified.`,
      topRisks: clauses.filter((c) => c.riskLevel === 'HIGH').map((c) => c.title),
      governingLaw: '',
      parties: [],
      effectiveDate: '',
      expirationDate: '',
      clauses,
      recommendations: [],
      negotiationChecklist: [],
      _backendAnalysisId: documentId,
      _documentId: documentId,
    };

    setContracts((prev) => [newContract, ...prev]);
    setActiveContractId(newContract.id);
    setSelectedClauseId(null);
    setIsUploadOpen(false);
    // ── Navigate straight to the Review workspace ──────────────────────────
    setActiveArticle('art-2-review');
  }, []);

  // ── Maps POST /contract/analyse response into the app Contract type ──────
  // ── Maps FastAPI /contract/analyse response into the app Contract type ──────
const mapAnalyseResponseToContract = (
  docId: number,
  docTitle: string,
  data: any
): Contract => {
  const apiData = data.data ?? data;

  const riskMap: Record<string, "HIGH" | "MEDIUM" | "LOW" | "SAFE"> = {
    HIGH: "HIGH",
    MEDIUM: "MEDIUM",
    LOW: "LOW",
    SAFE: "SAFE",
  };

  const clauses: Clause[] = (apiData.clauses || []).map(
      (c: any, index: number) => {
      const riskRaw = (c.riskLevel || "LOW").toUpperCase();

      const riskLevel =
        riskMap[riskRaw] || "LOW";

      const cleanText = (c.rawText || "")
        .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
        .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
        .replace(/[\u2013\u2014]/g, "-")
        .replace(/[\u0000\u00AD\u200B\uFEFF]/g, "")
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

      return {
        id: `c-analyse-${docId}-${c.id}`,

        sectionNumber: `Clause ${index + 1}`,

        title: c.clauseType || "General",

        originalText: cleanText,

        riskLevel,

        category: (c.clauseType || "General") as const,

        riskExplanation:
          c.translatedText ||
          `${riskLevel} risk clause.`,

        suggestedRewrite: "",

        negotiationAdvice: "",

        confidenceScore: 100,

        referencedPrecedents: [],

        pageNumber: index + 1,
      };
    }
  );

  const highCount = clauses.filter(
    c => c.riskLevel === "HIGH"
  ).length;

  const medCount = clauses.filter(
    c => c.riskLevel === "MEDIUM"
  ).length;

  const healthScore = Math.max(
    40,
    100 - highCount * 18 - medCount * 7
  );

  return {
    id: `contract-analyse-${docId}-${Date.now()}`,

    title: docTitle,

    contractType: "NDA",

    uploadedAt: new Date()
      .toISOString()
      .split("T")[0],

    fileSize: `${clauses.length} clauses`,

    status: "ANALYZED",

    healthScore,

    executiveOpinion: `AI completed analysis of "${docTitle}". Found ${clauses.length} clauses: ${highCount} high-risk, ${medCount} medium-risk.`,

    topRisks: clauses
      .filter(c => c.riskLevel !== "SAFE")
      .map(c => c.title),

    governingLaw: "See governing law clause",

    parties: ["Discloser", "Recipient"],

    effectiveDate: new Date()
      .toISOString()
      .split("T")[0],

    expirationDate: "Per agreement terms",

    clauses,

    recommendations: [
      "Review high-risk clauses carefully before signing.",
    ],

    negotiationChecklist: [],

    timelineEvents: [],
  };
};

  // ── Calls POST http://localhost:8000/contract/analyse by document ID ──────
 // ── Calls FastAPI POST /contract/analyse by document ID ───────────────
const handleAnalyseByDocumentId = async (
  documentId: number,
  docTitle: string
) => {
  setReviewingTitle(docTitle);
  setIsReviewing(true);

  try {
    const response = await fetch(
      "http://localhost:8000/contract/analyse",
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          document_id: documentId,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Analysis failed with status ${response.status}`
      );
    }

    const json = await response.json();

    console.log("FastAPI Analyse Response:", json);

    if (json.status !== "success") {
      throw new Error(json.message || "Analysis failed");
    }

    // Convert FastAPI response into frontend Contract
    const contract = mapAnalyseResponseToContract(
      documentId,
      docTitle,
      json.data
    );

    setPendingContract(contract);
  } catch (err) {
    console.error("handleAnalyseByDocumentId failed:", err);
    setIsReviewing(false);
  }
};

  const handleReviewComplete = () => {
    setIsReviewing(false);
    if (pendingContract) {
      setContracts((prev) => [pendingContract, ...prev]);
      setActiveContractId(pendingContract.id);
      setSelectedClauseId(null);
      setPendingContract(null);
    }
    setActiveArticle('art-2-review');
  };

  const handleSelectSample = (sampleContract: Contract) => {
    if (!contracts.some(c => c.id === sampleContract.id)) {
      setContracts([sampleContract, ...contracts]);
    }
    setActiveContractId(sampleContract.id);
    setSelectedClauseId(null);
    setActiveArticle('art-2-review');
  };

  const handleOpenCounsel = (query?: string) => {
    setCounselQuery(query);
    setIsCounselOpen(true);
  };

  const handleOpenNegotiation = (clause: Clause) => {
    setNegotiationClause(clause);
    setIsNegotiationOpen(true);
  };

  const handleLogout = () => {
    setUser(null);
    setActiveArticle('auth');
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1C1C1A] flex flex-col font-sans select-none antialiased">
      
      {/* Editorial Legal Navbar */}
      <Navbar
        currentContract={currentContract}
        activeArticle={activeArticle}
        setActiveArticle={setActiveArticle}
        user={user}
        onOpenUpload={() => setIsUploadOpen(true)}
        onLogout={handleLogout}
        onOpenCounsel={() => handleOpenCounsel()}
      />

      {/* Main Content Router */}
      <div className="flex-1 overflow-y-auto">
        {!user || activeArticle === 'auth' ? (
          <AuthView 
            onSuccess={(loggedUser) => {
              setUser(loggedUser);
              setActiveArticle('art-2-review');
            }} 
          />
        ) : activeArticle === 'preamble' ? (
          <PreambleLanding
            onNavigate={(article) => setActiveArticle(article)}
            onOpenUpload={() => setIsUploadOpen(true)}
          />
        ) : activeArticle === 'profile' ? (
          <ProfileView 
            user={user} 
            onUpdateUser={(updated) => setUser(updated)} 
            onOpenUpload={() => setIsUploadOpen(true)} 
          />
        ) : activeArticle === 'art-1-upload' ? (
          <Article1Submission
            onAnalysisComplete={handleAnalysisComplete}
          />
        ) : activeArticle === 'art-2-review' ? (
          /* Article II: In-Depth Interactive Review Workspace */
          <main className="flex overflow-hidden h-[calc(100vh-4rem)] w-full min-w-0">
            <LeftSidebar
              contracts={contracts}
              activeContractId={activeContractId}
              onSelectContract={handleSelectContract}
              onOpenUpload={() => setIsUploadOpen(true)}
              activeFilter={activeFilter}
              setActiveFilter={setActiveFilter}
            />

            {currentContract ? (
              <ContractReader
                contract={currentContract}
                selectedClauseId={selectedClauseId}
                onSelectClause={handleSelectClause}
                onOpenNegotiation={handleOpenNegotiation}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-sm font-sans text-[#6E6D6A]">
                No contract selected. Please select an agreement from the left library.
              </div>
            )}

            {currentContract && (
              <RightContextPanel
                contract={currentContract}
                selectedClause={selectedClause}
                onAcceptRewrite={handleAcceptRewrite}
                onOpenNegotiation={handleOpenNegotiation}
                onOpenCounsel={handleOpenCounsel}
              />
            )}
          </main>
        ) : activeArticle === 'art-3-negotiation' ? (
          <Article3Negotiation
            contract={currentContract}
            onAcceptRewrite={handleAcceptRewrite}
            onOpenCounsel={handleOpenCounsel}
          />
        ) : activeArticle === 'art-4-counsel' ? (
          <Article4Counsel
            contract={currentContract}
            contractId={(currentContract as any)?._documentId ?? (currentContract as any)?._backendAnalysisId}
            selectedClause={selectedClause}
            onOpenNegotiation={handleOpenNegotiation}
          />
        ) : activeArticle === 'art-6-execution' ? (
          <Article6Execution
            contract={currentContract}
            onOpenReport={() => setIsReportOpen(true)}
          />
        ) : null}
      </div>

      {/* Upload Contract Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onAnalysisComplete={handleAnalysisComplete}
      />

      {/* Executive Report Full-Screen View Modal */}
      {isReportOpen && currentContract && (
        <div className="fixed inset-0 z-50 bg-[#FAF9F6] overflow-y-auto">
          <div className="p-4 bg-[#1C1C1A] text-white flex justify-between items-center sticky top-0 z-10 font-sans">
            <span className="font-serif font-bold text-sm">ContractOS Executive Report</span>
            <button
              onClick={() => setIsReportOpen(false)}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-xs cursor-pointer"
            >
              Close Report
            </button>
          </div>
          <ReportView contract={currentContract} onOpenWorkspace={() => setIsReportOpen(false)} />
        </div>
      )}

      {/* AI Review Step-by-Step Animation Overlay */}
      {isReviewing && (
        <AIReviewOverlay
          contractTitle={reviewingTitle}
          onComplete={handleReviewComplete}
        />
      )}

      {/* Floating AI Legal Counsel Button & Popup (Bottom Right) */}
      <AILegalCounsel
        contract={currentContract}
        contractId={(currentContract as any)?._documentId ?? (currentContract as any)?._backendAnalysisId}
        selectedClause={selectedClause}
        isOpen={isCounselOpen}
        onClose={() => setIsCounselOpen(false)}
        onOpen={() => setIsCounselOpen(true)}
        initialQuery={counselQuery}
      />

      {/* Side-by-Side Negotiation Modal */}
      <NegotiationModal
        clause={negotiationClause}
        isOpen={isNegotiationOpen}
        onClose={() => setIsNegotiationOpen(false)}
        onAcceptRewrite={handleAcceptRewrite}
        documentId={(currentContract as any)?._backendAnalysisId}
        backendClauseId={
          // clause ids are formatted as "c-analyse-{docId}-{clauseId}" or "c-backend-{docId}-{clauseId}"
          negotiationClause?.id
            ? parseInt(negotiationClause.id.split('-').pop() ?? '', 10) || undefined
            : undefined
        }
      />

    </div>
  );
}
