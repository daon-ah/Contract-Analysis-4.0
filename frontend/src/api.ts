/**
 * api.ts — Central API client for the Python FastAPI backend (port 8000)
 * All requests include credentials:include so the jwtSession cookie is sent.
 */

const BASE = 'http://localhost:8000';

function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
}

// ── Auth ────────────────────────────────────────────────────────────────────

export async function apiLogin(email: string, password: string) {
  const res = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

export async function apiSignup(data: {
  name: string; email: string; password: string;
  phone?: string; law_firm?: string; role?: string;
}) {
  const res = await apiFetch('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.json();
}

// ── Profile ─────────────────────────────────────────────────────────────────

export async function apiGetProfile() {
  const res = await apiFetch('/profile/');
  return res.json();
}

export async function apiUpdateProfile(data: Record<string, string>) {
  const res = await apiFetch('/profile/', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return res.json();
}

// ── Contract ─────────────────────────────────────────────────────────────────

/** Step 1: Upload a PDF file — returns { id, url, public_id } */
export async function apiUploadContract(file: File): Promise<{
  status: string;
  data: { id: number; url: string; public_id: string };
}> {
  const form = new FormData();
  form.append('uploaded_file', file);   // FastAPI param name is "uploaded_file"

  const res = await fetch(`${BASE}/contract/upload`, {
    method: 'POST',
    credentials: 'include',
    body: form,
    // Do NOT set Content-Type here — browser sets multipart boundary automatically
  });
  return res.json();
}

/** Step 2: Trigger analysis by document_id */
export async function apiAnalyseContract(document_id: number) {
  const res = await apiFetch('/contract/analyze', {
    method: 'POST',
    body: JSON.stringify({ document_id }),
  });
  return res.json();
}

/** List all analyses for the logged-in user */
export async function apiGetAnalyses() {
  const res = await apiFetch('/contract/analyses');
  return res.json();
}

/** Get full analysis detail including clauses */
export async function apiGetAnalysis(analysis_id: number) {
  const res = await apiFetch(`/contract/analyses/${analysis_id}`);
  return res.json();
}

/** Simulate a clause modification */
export async function apiSimulate(document_id: number, clause_id: number, modified_clause: string) {
  const res = await apiFetch('/contract/simulate', {
    method: 'POST',
    body: JSON.stringify({ document_id, clause_id, modified_clause }),
  });
  return res.json();
}

/** Chatbot query */
export async function apiChatbot(contract_id: number, user_question: string) {
  const res = await apiFetch('/chatbot/chat', {
    method: 'POST',
    body: JSON.stringify({ contract_id, user_question }),
  });
  return res.json();
}
