export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'SAFE';

export interface Clause {
  id: string;
  sectionNumber: string;
  title: string;
  originalText: string;
  riskLevel: RiskLevel;
  category: 'Indemnification' | 'Limitation of Liability' | 'IP Rights' | 'Termination' | 'Governing Law' | 'Data Privacy' | 'Payment Terms' | 'Confidentiality' | 'General';
  riskExplanation: string;
  suggestedRewrite: string;
  negotiationAdvice: string;
  confidenceScore: number;
  referencedPrecedents: string[];
  pageNumber: number;
  acceptedRewrite?: boolean;
  customRewrite?: string;
  buyerRewrite?: string;
  sellerRewrite?: string;
  consequences?: string[];
}

export interface Contract {
  id: string;
  title: string;
  contractType: 'SaaS Agreement' | 'Employment' | 'MSA' | 'NDA' | 'Vendor Contract' | 'Custom';
  uploadedAt: string;
  fileSize: string;
  status: 'ANALYZED' | 'REVIEWING' | 'DRAFT';
  healthScore: number;
  executiveOpinion: string;
  topRisks: string[];
  governingLaw: string;
  parties: string[];
  effectiveDate: string;
  expirationDate: string;
  clauses: Clause[];
  recommendations: string[];
  negotiationChecklist: {
    id: string;
    item: string;
    status: 'CRITICAL' | 'IMPORTANT' | 'OPTIONAL';
    rationale: string;
  }[];
  timelineEvents: {
    id: string;
    date: string;
    title: string;
    clauseRef: string;
    importance: 'HIGH' | 'MEDIUM' | 'LOW';
  }[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  text: string;
  referencedClauseId?: string;
  legalOpinion?: string;
  reasoning?: string;
  referencedClauses?: string[];
  confidence?: number;
  recommendedAction?: string;
}

export type ArticleView = 
  | 'preamble'
  | 'art-1-upload' 
  | 'art-2-review' 
  | 'art-3-negotiation' 
  | 'art-4-counsel' 
  | 'art-6-execution'
  | 'profile'
  | 'auth'
  | 'report';

export type DraftMode = 'original' | 'annotated' | 'negotiated' | 'execution';

export type NegotiationStance = 'protective' | 'balanced' | 'aggressive';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  organization: string;
  role: string;
  phone?: string;
  avatarUrl?: string;
  planTier?: string;
  contractsAnalyzedCount?: number;
  redlinesGeneratedCount?: number;
  apiKey?: string;
  twoFactorEnabled?: boolean;
}

