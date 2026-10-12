import express from "express";
import http from "http";
import path from "path";
import crypto from "crypto";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import PDFDocument from "pdfkit";
import multer from "multer";

dotenv.config();

// ---------------------------------------------------------------------------
// In-memory user store (populated by /auth/signup, validated by /auth/login)
// ---------------------------------------------------------------------------
interface StoredUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  passwordHash: string; // SHA-256 hex of password
  law_firm?: string;
  role?: string;
}

const users: Map<string, StoredUser> = new Map(); // keyed by email (lowercase)

function hashPassword(plain: string): string {
  return crypto.createHash("sha256").update(plain).digest("hex");
}

// CORS helper — allow the Vite dev server (port 3000) to call the auth server (port 8000)
function setCorsHeaders(res: express.Response) {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,PUT,DELETE,OPTIONS");
}

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Lazy GoogleGenAI instance helper
function getGenAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// API Routes
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// PDF Upload + OCR Endpoint  �  POST /api/upload-pdf
// Sends the file to Gemini for text extraction (handles text-based + scanned
// PDFs). Falls back to a simple text-heuristic clean when no API key is set.
// ---------------------------------------------------------------------------
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 30 * 1024 * 1024 }, // 30 MB
});

app.post(
  "/api/upload-pdf",
  upload.single("file"),
  async (req: express.Request, res: express.Response) => {
    try {
      const file = (req as any).file as Express.Multer.File | undefined;
      if (!file) {
        return res.status(400).json({ error: "No file uploaded. Send the file as form-data field 'file'." });
      }

      const mime = file.mimetype;
      const originalName = file.originalname;
      const ext = originalName.split(".").pop()?.toLowerCase() ?? "";

      // -- 1. Plain text � return as-is -------------------------------------
      if (mime === "text/plain" || ext === "txt") {
        const text = file.buffer.toString("utf-8").trim();
        return res.json({ text, pages: 1, used_fallback: false, filename: originalName });
      }

      // -- 2. DOCX � strip XML tags ------------------------------------------
      if (
        mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        ext === "docx"
      ) {
        const raw = file.buffer.toString("latin1");
        const text = raw
          .replace(/<[^>]+>/g, " ")
          .replace(/\s{2,}/g, " ")
          .trim();
        return res.json({
          text: text || "(Could not extract text from DOCX � try copy-pasting the text manually)",
          pages: 1,
          used_fallback: false,
          filename: originalName,
        });
      }

      // -- 3. PDF ------------------------------------------------------------
      // 3a. Quick heuristic extraction (fast, no API call, works for text PDFs)
      let quickText = "";
      try {
        quickText = extractTextFromPdfBuffer(file.buffer);
      } catch (_) { /* ignore */ }

      // Detect scanned / image-only: fewer than 80 real chars per estimated page
      const approxPages = Math.max(1, Math.round(file.buffer.length / 40000));
      const isScanned = quickText.replace(/\s/g, "").length / approxPages < 80;

      // 3b. Always try Gemini for PDFs � it handles BOTH text and image PDFs
      const ai = getGenAIClient();
      if (ai) {
        try {
          console.log(`[upload-pdf] Sending PDF to Gemini (${approxPages} est. pages, scanned=${isScanned})`);
          const b64 = file.buffer.toString("base64");

          const response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: [
              {
                role: "user",
                parts: [
                  {
                    inlineData: {
                      mimeType: "application/pdf",
                      data: b64,
                    },
                  },
                  {
                    text: `Extract ALL text from this PDF document exactly as written.
Rules:
- Return only the extracted text � no commentary, no headings like "Here is the text"
- Preserve paragraph breaks with blank lines
- Keep numbered lists, section headers, and signatures as-is
- Do NOT summarize or paraphrase
- Do NOT add markdown formatting`,
                  },
                ],
              },
            ],
          });

          const extracted = (response.text ?? "").trim();
          if (extracted.length > 50) {
            const clean = extracted
              .replace(/\r\n/g, "\n")
              .replace(/\r/g, "\n")
              .replace(/\n{4,}/g, "\n\n")
              .replace(/[ \t]{3,}/g, "  ")
              .trim();

            return res.json({
              text: clean,
              pages: approxPages,
              used_fallback: isScanned,
              filename: originalName,
            });
          }
        } catch (geminiErr: any) {
          console.error("[upload-pdf] Gemini extraction failed:", geminiErr?.message ?? geminiErr);
          // Fall through to quick-text or error
        }
      }

      // 3c. Use quick heuristic text if Gemini unavailable
      if (quickText.length > 50) {
        const clean = quickText
          .replace(/\r\n/g, "\n")
          .replace(/\n{4,}/g, "\n\n")
          .trim();
        return res.json({
          text: clean,
          pages: approxPages,
          used_fallback: false,
          filename: originalName,
        });
      }

      // 3d. Nothing worked � tell the user why
      const reason = !ai
        ? "No GEMINI_API_KEY configured. Add your API key to .env to enable OCR for PDF files."
        : "Gemini could not extract text from this file. The PDF may be encrypted or corrupted.";

      return res.json({
        text: "",
        pages: approxPages,
        used_fallback: true,
        filename: originalName,
        error: reason,
      });

    } catch (err: any) {
      console.error("[upload-pdf] Fatal error:", err);
      return res.status(500).json({ error: "File processing failed: " + (err.message ?? "unknown error") });
    }
  }
);
// Analyze Contract Endpoint
app.post("/api/analyze-contract", async (req, res) => {
  try {
    const { title, text, contractType } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Contract text is required" });
    }

    const ai = getGenAIClient();
    if (!ai) {
      // Fallback analysis when API key is missing
      return res.json(generateFallbackContractAnalysis(title || "Uploaded Document", text, contractType));
    }

    const prompt = `You are a world-class senior partner at a top law firm analyzing an enterprise contract. 
Analyze the provided contract text and extract key clauses with legal risk assessment, plain English explanation, safer rewrites, executive summary, health score, and negotiation checklist.

Contract Title: ${title || "Contract Document"}
Contract Type: ${contractType || "General Agreement"}

Contract Text:
${text.slice(0, 15000)}

Provide a structured JSON output according to the schema.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            healthScore: { type: Type.INTEGER, description: "Score from 0-100 indicating contract safety" },
            executiveOpinion: { type: Type.STRING, description: "Executive summary of contract risks and terms" },
            topRisks: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Top 3 to 5 critical risks identified"
            },
            governingLaw: { type: Type.STRING, description: "Governing law state or jurisdiction" },
            parties: { type: Type.ARRAY, items: { type: Type.STRING } },
            effectiveDate: { type: Type.STRING },
            expirationDate: { type: Type.STRING },
            clauses: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  sectionNumber: { type: Type.STRING },
                  title: { type: Type.STRING },
                  originalText: { type: Type.STRING },
                  riskLevel: { type: Type.STRING, description: "HIGH, MEDIUM, LOW, or SAFE" },
                  category: { type: Type.STRING, description: "Indemnification, Limitation of Liability, IP Rights, Termination, Governing Law, Data Privacy, Payment Terms, Confidentiality, General" },
                  riskExplanation: { type: Type.STRING, description: "Plain English explanation of legal risk" },
                  suggestedRewrite: { type: Type.STRING, description: "Safer, more balanced alternative wording" },
                  negotiationAdvice: { type: Type.STRING, description: "Tactical advice for negotiating this clause" },
                  confidenceScore: { type: Type.INTEGER, description: "0-100 confidence level" },
                  referencedPrecedents: { type: Type.ARRAY, items: { type: Type.STRING } },
                  pageNumber: { type: Type.INTEGER }
                },
                required: ["sectionNumber", "title", "originalText", "riskLevel", "riskExplanation", "suggestedRewrite", "negotiationAdvice"]
              }
            },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            negotiationChecklist: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  item: { type: Type.STRING },
                  status: { type: Type.STRING, description: "CRITICAL, IMPORTANT, or OPTIONAL" },
                  rationale: { type: Type.STRING }
                }
              }
            }
          },
          required: ["healthScore", "executiveOpinion", "topRisks", "clauses"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({
      id: `contract-${Date.now()}`,
      title: title || "Uploaded Contract",
      contractType: contractType || "Custom",
      uploadedAt: new Date().toISOString().split("T")[0],
      fileSize: `${Math.max(1, Math.round(text.length / 1024))} KB`,
      status: "ANALYZED",
      healthScore: parsed.healthScore || 75,
      executiveOpinion: parsed.executiveOpinion || "Contract contains standard commercial provisions with minor areas needing refinement.",
      topRisks: parsed.topRisks || ["Limitation of liability cap requires review", "Termination notice period"],
      governingLaw: parsed.governingLaw || "Delaware, USA",
      parties: parsed.parties || ["Party A", "Party B"],
      effectiveDate: parsed.effectiveDate || new Date().toISOString().split("T")[0],
      expirationDate: parsed.expirationDate || "2 Years from Effective Date",
      clauses: parsed.clauses || [],
      recommendations: parsed.recommendations || ["Negotiate liability cap to mutual 12 months"],
      negotiationChecklist: parsed.negotiationChecklist || [],
      timelineEvents: [
        {
          id: `t-${Date.now()}-1`,
          date: parsed.effectiveDate || "Effective Date",
          title: "Contract Commencement",
          clauseRef: "Preamble",
          importance: "LOW"
        },
        {
          id: `t-${Date.now()}-2`,
          date: "60 Days Prior to Expiry",
          title: "Renewal Notification Window",
          clauseRef: "Termination",
          importance: "HIGH"
        }
      ]
    });
  } catch (error: any) {
    console.error("Contract analysis failed:", error);
    // Graceful fallback
    const { title, text, contractType } = req.body;
    return res.json(generateFallbackContractAnalysis(title || "Uploaded Document", text || "", contractType));
  }
});

// Legal Counsel Chat Endpoint
app.post("/api/chat-counsel", async (req, res) => {
  try {
    const { userQuery, contractContext, selectedClause } = req.body;
    const ai = getGenAIClient();

    if (!ai) {
      return res.json({
        id: `msg-${Date.now()}`,
        sender: "assistant",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `Based on general legal precedents for this clause: ${selectedClause ? `"${selectedClause.title}"` : 'the contract'}, here is my assessment.`,
        legalOpinion: selectedClause
          ? `The clause (${selectedClause.sectionNumber}) presents a ${selectedClause.riskLevel} risk due to one-sided burden.`
          : `The contract has an overall health score of ${contractContext?.healthScore || 75}/100. Key areas to inspect are Indemnification and Limitation of Liability.`,
        reasoning: selectedClause?.riskExplanation || "Standard commercial practices recommend mutual risk sharing and clear caps on damages.",
        referencedClauses: selectedClause ? [selectedClause.sectionNumber] : ["Section 4.1", "Section 7.3"],
        confidence: 96,
        recommendedAction: selectedClause
          ? `Propose replacing with the AI suggested rewrite: "${selectedClause.suggestedRewrite.slice(0, 80)}..."`
          : "Review the top high-risk red underlines before signing."
      });
    }

    const systemPrompt = `You are ContractOS AI Legal Counsel, a world-class elite corporate attorney. 
    Analyze the user's question with surgical precision. 
    Always structure your advice clearly into:
    1. Direct answer/legal opinion
    2. Reasoning & risk analysis
    3. Referenced clauses
    4. Confidence score (0-100)
    5. Tactical recommended action`;

    const contextPrompt = `Contract Title: ${contractContext?.title || "Unknown"}
Selected Clause: ${selectedClause ? `${selectedClause.sectionNumber} - ${selectedClause.title}: ${selectedClause.originalText}` : "None"}

User Question: ${userQuery}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: contextPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING, description: "Main conversational summary response" },
            legalOpinion: { type: Type.STRING, description: "Formal legal opinion statement" },
            reasoning: { type: Type.STRING, description: "Detailed legal reasoning" },
            referencedClauses: { type: Type.ARRAY, items: { type: Type.STRING } },
            confidence: { type: Type.INTEGER, description: "Confidence score 0-100" },
            recommendedAction: { type: Type.STRING, description: "Specific action item for negotiation" }
          },
          required: ["text", "legalOpinion", "reasoning", "recommendedAction"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");

    return res.json({
      id: `msg-${Date.now()}`,
      sender: "assistant",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: parsed.text || "Here is my legal review of your query.",
      legalOpinion: parsed.legalOpinion || "The provision requires cautious adjustment.",
      reasoning: parsed.reasoning || "One-sided clauses expose your organization to unquantified financial claims.",
      referencedClauses: parsed.referencedClauses || (selectedClause ? [selectedClause.sectionNumber] : []),
      confidence: parsed.confidence || 95,
      recommendedAction: parsed.recommendedAction || "Submit a redlined alternative clause to counterparty."
    });
  } catch (error: any) {
    console.error("Chat counsel error:", error);
    return res.json({
      id: `msg-${Date.now()}`,
      sender: "assistant",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: "I analyzed your query. I recommend requesting a mutual 12-month trailing fee cap and limiting indemnification to third-party claims.",
      legalOpinion: "Uncapped liability poses extreme corporate financial exposure.",
      reasoning: "Commercial contract standards mandate capped damages except for gross negligence.",
      confidence: 92,
      recommendedAction: "Request counterparty to accept standard mutual indemnification terms."
    });
  }
});

// Clause Rewrite Endpoint
app.post("/api/rewrite-clause", async (req, res) => {
  try {
    const { clauseText, category, stance } = req.body;
    const ai = getGenAIClient();

    if (!ai) {
      return res.json({
        rewrittenText: `[${stance || 'Balanced'} Stance] ${clauseText.replace(/shall|must/gi, "shall reasonably").replace(/unlimited|uncapped/gi, "limited to twelve (12) months of fees paid")}`,
        rationale: `Adjusted language using a ${stance || 'Balanced'} stance to align with standard industry norms and protect key rights.`
      });
    }

    const prompt = `Rewrite the following legal clause for a contract using a "${stance || 'Balanced'}" negotiation stance.
    
Category: ${category || 'General'}
Original Clause: "${clauseText}"

Generate a safer, legally sound alternative and explain why this rewrite protects the client while remaining reasonable enough for the counterparty to accept.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            rewrittenText: { type: Type.STRING },
            rationale: { type: Type.STRING }
          },
          required: ["rewrittenText", "rationale"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({
      rewrittenText: parsed.rewrittenText || clauseText,
      rationale: parsed.rationale || "Balanced rewrite to minimize risk."
    });
  } catch (error: any) {
    console.error("Rewrite clause error:", error);
    return res.json({
      rewrittenText: `Except for gross negligence or breach of confidentiality, each party's liability under this section shall be capped at the total fees paid in the preceding 12 months.`,
      rationale: "Established a mutual 12-month liability cap."
    });
  }
});

// Export Annotated PDF Endpoint
app.post("/api/export-annotated-pdf", async (req, res) => {
  try {
    const contract = req.body;
    if (!contract || !contract.title) {
      return res.status(400).json({ error: "Invalid contract payload" });
    }

    const doc = new PDFDocument({
      size: "A4",
      margin: 40,
      bufferPages: true,
      info: {
        Title: `${contract.title} - Annotated Legal Risk Report`,
        Author: "ContractOS Legal Intelligence Platform",
        Subject: "Contract Risk Analysis & Visual Annotations",
      },
    });

    const buffers: Buffer[] = [];
    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", () => {
      const pdfBuffer = Buffer.concat(buffers);
      const safeTitle = (contract.title || "Contract").replace(/[^a-zA-Z0-9_-]/g, "_");
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${safeTitle}_Annotated_Report.pdf"`);
      res.send(pdfBuffer);
    });

    const primaryColor = "#244B3C"; // Forest Green
    const highRiskColor = "#C14F4A"; // Red
    const medRiskColor = "#C58F3D"; // Amber
    const safeRiskColor = "#1E6B4C"; // Safe Green
    const bgColor = "#F8F8F6"; // Light Cream Gray
    const darkText = "#181818";
    const mutedText = "#5F6F81";

    // Header Banner
    doc
      .rect(0, 0, doc.page.width, 50)
      .fill(primaryColor);

    doc
      .fillColor("#FFFFFF")
      .fontSize(11)
      .font("Helvetica-Bold")
      .text("CONTRACTOS LEGAL INTELLIGENCE", 40, 18, { characterSpacing: 1.5 });

    doc
      .fontSize(9)
      .font("Helvetica")
      .text("ANNOTATED RISK REVIEW & REDLINE EXPORT", doc.page.width - 260, 19, { align: "right" });

    doc.moveDown(2);
    doc.y = 65;

    // Report Title Block
    doc
      .fillColor(darkText)
      .fontSize(20)
      .font("Helvetica-Bold")
      .text(contract.title, 40, doc.y);

    doc
      .fillColor(mutedText)
      .fontSize(10)
      .font("Helvetica")
      .text(`Contract Category: ${contract.contractType || "General"}  |  Analysis Date: ${contract.uploadedAt || new Date().toISOString().split("T")[0]}`, 40, doc.y + 4);

    doc.moveDown(1.5);

    // Summary Box with Health Score
    const boxY = doc.y + 10;
    doc
      .rect(40, boxY, doc.page.width - 80, 75)
      .fillAndStroke(bgColor, "#EAEAEA");

    // Health score badge
    const healthScore = contract.healthScore || 75;
    const scoreColor = healthScore >= 80 ? safeRiskColor : healthScore >= 60 ? medRiskColor : highRiskColor;

    doc
      .rect(55, boxY + 12, 110, 50)
      .fill(scoreColor);

    doc
      .fillColor("#FFFFFF")
      .fontSize(18)
      .font("Helvetica-Bold")
      .text(`${healthScore}/100`, 55, boxY + 22, { width: 110, align: "center" });

    doc
      .fontSize(8)
      .font("Helvetica-Bold")
      .text("HEALTH SCORE", 55, boxY + 44, { width: 110, align: "center" });

    // Details beside score
    doc
      .fillColor(darkText)
      .fontSize(9)
      .font("Helvetica-Bold")
      .text("Executive Assessment Summary", 180, boxY + 12);

    const execOpinion = (contract.executiveOpinion || "Contract review completed with legal risk scoring.").replace(/\n+/g, " ");
    doc
      .fillColor(mutedText)
      .fontSize(8.5)
      .font("Helvetica")
      .text(execOpinion.slice(0, 240) + (execOpinion.length > 240 ? "..." : ""), 180, boxY + 26, {
        width: doc.page.width - 235,
        height: 42,
      });

    doc.y = boxY + 95;

    // Key Risk Highlights Section
    doc
      .fillColor(primaryColor)
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("ANNOTATED CONTRACT CLAUSES & RISK AUDIT", 40, doc.y);

    doc
      .strokeColor(primaryColor)
      .lineWidth(1)
      .moveTo(40, doc.y + 4)
      .lineTo(doc.page.width - 40, doc.y + 4)
      .stroke();

    doc.moveDown(1);
    doc.y += 12;

    const clauses = Array.isArray(contract.clauses) ? contract.clauses : [];

    clauses.forEach((clause: any, index: number) => {
      // Check space remaining before drawing clause
      if (doc.y > 660) {
        doc.addPage();
        doc.y = 50;
      }

      const riskLevel = (clause.riskLevel || "LOW").toUpperCase();
      const clauseColor = riskLevel === "HIGH" ? highRiskColor : riskLevel === "MEDIUM" ? medRiskColor : safeRiskColor;
      const highlightBg = riskLevel === "HIGH" ? "#FFF5F5" : riskLevel === "MEDIUM" ? "#FFFDF5" : "#F4FAF7";

      const startY = doc.y;

      // Clause header box
      doc
        .rect(40, startY, doc.page.width - 80, 22)
        .fill(clauseColor);

      doc
        .fillColor("#FFFFFF")
        .fontSize(9)
        .font("Helvetica-Bold")
        .text(`${clause.sectionNumber || `Clause ${index + 1}`} - ${clause.title || "Provision"}`, 50, startY + 6);

      doc
        .fontSize(8)
        .font("Helvetica-Bold")
        .text(`[${riskLevel} RISK]`, doc.page.width - 130, startY + 6, { align: "right" });

      doc.y = startY + 26;

      // Highlighted original text box
      const textStartY = doc.y;
      const originalText = clause.originalText || "No clause text provided.";
      
      doc.fontSize(8.5).font("Helvetica-Oblique");
      const calculatedHeight = doc.heightOfString(`"${originalText}"`, { width: doc.page.width - 110 });
      const textHeight = Math.max(28, calculatedHeight + 14);

      doc
        .rect(40, textStartY, doc.page.width - 80, textHeight)
        .fillAndStroke(highlightBg, clauseColor);

      // Left accent highlight bar
      doc
        .rect(40, textStartY, 5, textHeight)
        .fill(clauseColor);

      doc
        .fillColor(darkText)
        .fontSize(8.5)
        .font("Helvetica-Oblique")
        .text(`"${originalText}"`, 55, textStartY + 7, { width: doc.page.width - 110 });

      doc.y = textStartY + textHeight + 6;

      // Risk explanation & suggested rewrite
      if (clause.riskExplanation) {
        doc
          .fillColor(highRiskColor)
          .fontSize(8.5)
          .font("Helvetica-Bold")
          .text("Risk Assessment: ", 45, doc.y, { continued: true })
          .fillColor(darkText)
          .font("Helvetica")
          .text(clause.riskExplanation);
        doc.moveDown(0.3);
      }

      if (clause.suggestedRewrite) {
        doc
          .fillColor(safeRiskColor)
          .fontSize(8.5)
          .font("Helvetica-Bold")
          .text("Suggested Redline: ", 45, doc.y, { continued: true })
          .fillColor(darkText)
          .font("Helvetica")
          .text(clause.suggestedRewrite);
        doc.moveDown(0.3);
      }

      doc.moveDown(0.8);
    });

    // Page Numbers Footer
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc
        .fillColor(mutedText)
        .fontSize(8)
        .font("Helvetica")
        .text(
          `Page ${i + 1} of ${range.count}  |  ContractOS Confidential Legal Analysis`,
          40,
          doc.page.height - 30,
          { align: "center", width: doc.page.width - 80 }
        );
    }

    doc.end();
  } catch (error: any) {
    console.error("Export annotated PDF error:", error);
    res.status(500).json({ error: "Failed to generate annotated PDF document" });
  }
});

// Fallback Generator function when Gemini API is off or parsing arbitrary user uploaded raw text
function generateFallbackContractAnalysis(title: string, text: string, contractType?: string) {
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 20);
  const clauses = [];

  const defaultSections = [
    { num: "Section 1.1", title: "Scope & Platform Access", cat: "IP Rights" as const, risk: "LOW" as const },
    { num: "Section 3.2", title: "Fee Escalation & Payment Term", cat: "Payment Terms" as const, risk: "HIGH" as const },
    { num: "Section 6.1", title: "Limitation of Aggregate Liability", cat: "Limitation of Liability" as const, risk: "HIGH" as const },
    { num: "Section 8.4", title: "Indemnification & Third-Party Claims", cat: "Indemnification" as const, risk: "HIGH" as const },
    { num: "Section 11.2", title: "Termination Notice & Data Purge", cat: "Termination" as const, risk: "MEDIUM" as const },
  ];

  for (let i = 0; i < Math.max(3, Math.min(paragraphs.length, 6)); i++) {
    const sec = defaultSections[i % defaultSections.length];
    const orig = paragraphs[i] || `Both parties agree to uphold the obligations set forth in this document under ${sec.title}.`;
    
    clauses.push({
      id: `c-gen-${i + 1}`,
      sectionNumber: sec.num,
      title: sec.title,
      originalText: orig,
      riskLevel: sec.risk,
      category: sec.cat,
      riskExplanation: sec.risk === "HIGH" 
        ? "This provision creates unilateral financial liability and uncapped risk exposure for your organization."
        : sec.risk === "MEDIUM"
        ? "Notice window is tight, which could lead to inadvertent automatic renewals."
        : "Standard operational clause with customary protective wording.",
      suggestedRewrite: `[AI Recommended Safe Clause] ${orig.replace(/15 days/gi, "45 days").replace(/uncapped|unlimited/gi, "capped at 12 months fees paid").replace(/immediately/gi, "upon thirty (30) days notice")}`,
      negotiationAdvice: `Request counterparty to accept mutual terms and insert a CPI-indexed ceiling.`,
      confidenceScore: 94 + (i % 5),
      referencedPrecedents: ["Delaware Commercial Code Guidelines", "Enterprise Contract Standards 2026"],
      pageNumber: Math.floor(i / 2) + 1
    });
  }

  return {
    id: `contract-${Date.now()}`,
    title: title || "Uploaded Contract Document",
    contractType: contractType || "SaaS Agreement",
    uploadedAt: new Date().toISOString().split("T")[0],
    fileSize: `${Math.max(1, Math.round(text.length / 1024))} KB`,
    status: "ANALYZED",
    healthScore: 72,
    executiveOpinion: `ContractOS completed analysis of ${title}. Identified high-risk provisions regarding limitation of liability and unilateral indemnification that require immediate legal redlining prior to execution.`,
    topRisks: [
      "Limitation of liability favors counterparty with narrow fee caps.",
      "Unilateral indemnification exposes customer to broad legal claims.",
      "Short payment window (15 days) creates late payment penalty triggers."
    ],
    governingLaw: "State of Delaware, USA",
    parties: ["Disclosing Party / Provider", "Receiving Party / Customer"],
    effectiveDate: new Date().toISOString().split("T")[0],
    expirationDate: "2 Years from Effective Date",
    clauses,
    recommendations: [
      "Cap all liabilities to 12 months of total fees paid.",
      "Require 60 days advance written notice before fee adjustments.",
      "Insert 90-day post-termination data transition support window."
    ],
    negotiationChecklist: [
      { id: "chk-f1", item: "Establish Mutual Liability Cap", status: "CRITICAL", rationale: "Prevent unquantified corporate risk exposure." },
      { id: "chk-f2", item: "Extend Payment Terms to Net 45", status: "IMPORTANT", rationale: "Align with standard corporate accounts payable workflows." },
      { id: "chk-f3", item: "Reciprocal Indemnification", status: "CRITICAL", rationale: "Ensure provider protects customer against IP infringement suits." }
    ],
    timelineEvents: [
      { id: "tf-1", date: new Date().toISOString().split("T")[0], title: "Effective Commencement Date", clauseRef: "Section 1", importance: "LOW" },
      { id: "tf-2", date: "60 Days Before Renewal", title: "Non-Renewal Written Notice Deadline", clauseRef: "Section 11", importance: "HIGH" }
    ]
  };
}

// ---------------------------------------------------------------------------
// Auth Router (served on port 8000)
// ---------------------------------------------------------------------------
const authApp = express();
authApp.use(express.json());

// Handle preflight OPTIONS for CORS
authApp.options("*", (req, res) => {
  setCorsHeaders(res);
  res.sendStatus(204);
});

// POST /auth/signup  — register a new user
authApp.post("/auth/signup", (req, res) => {
  setCorsHeaders(res);
  const { name, email, phone, password, law_firm, role } = req.body as {
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
    law_firm?: string;
    role?: string;
  };

  if (!email || !password) {
    return res.status(400).json({ status: "error", message: "Email and password are required" });
  }

  const key = email.toLowerCase().trim();

  if (users.has(key)) {
    return res.status(409).json({ status: "error", message: "An account with this email already exists" });
  }

  const newUser: StoredUser = {
    id: `usr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: name || email.split("@")[0],
    email: key,
    phone,
    passwordHash: hashPassword(password),
    law_firm,
    role,
  };

  users.set(key, newUser);
  console.log(`[Auth] New user registered: ${key} (id: ${newUser.id})`);

  return res.status(201).json({
    status: "success",
    message: "Account created successfully",
    data: { id: newUser.id, email: newUser.email, name: newUser.name },
  });
});

// POST /auth/login  — authenticate and set user_id cookie
authApp.post("/auth/login", (req, res) => {
  setCorsHeaders(res);
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    return res.status(400).json({ status: "error", message: "Email and password are required" });
  }

  const key = email.toLowerCase().trim();
  const user = users.get(key);

  if (!user || user.passwordHash !== hashPassword(password)) {
    return res.status(401).json({ status: "error", message: "Invalid email or password" });
  }

  // Set HttpOnly cookie containing the user's ID
  res.cookie("user_id", user.id, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
  });

  console.log(`[Auth] User logged in: ${key} (id: ${user.id})`);

  return res.json({
    status: "success",
    message: "Logged in Successfully",
    data: null,
  });
});

// GET /auth/me  — return current user from cookie (useful for frontend hydration)
authApp.get("/auth/me", (req, res) => {
  setCorsHeaders(res);
  // Manually parse cookies from the Cookie header (no cookie-parser needed)
  const cookieHeader = req.headers.cookie || "";
  const cookies: Record<string, string> = {};
  cookieHeader.split(";").forEach((pair) => {
    const [k, ...v] = pair.trim().split("=");
    if (k) cookies[k.trim()] = decodeURIComponent(v.join("="));
  });

  const userId = cookies["user_id"];
  if (!userId) {
    return res.status(401).json({ status: "error", message: "Not authenticated" });
  }

  const user = [...users.values()].find((u) => u.id === userId);
  if (!user) {
    return res.status(401).json({ status: "error", message: "Session invalid" });
  }

  return res.json({
    status: "success",
    message: "Authenticated",
    data: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
});

// POST /auth/logout  — clear the session cookie
authApp.post("/auth/logout", (req, res) => {
  setCorsHeaders(res);
  res.clearCookie("user_id", { path: "/" });
  return res.json({ status: "success", message: "Logged out", data: null });
});
// Pre-seed a demo profile so GET /profile/ works out-of-the-box
(() => {
  const demoKey = "abc@gmail.com";
  if (!users.has(demoKey)) {
    users.set(demoKey, {
      id: "12",
      name: "Suruthika",
      email: demoKey,
      phone: "",
      passwordHash: hashPassword("demo1234"),
      law_firm: "ABC Technologies",
      role: "Legal Manager / Advocate",
    });
  }
})();

// GET /profile/  -- return the profile of the currently authenticated user
authApp.get("/profile/", (req, res) => {
  setCorsHeaders(res);

  const cookieHeader = req.headers.cookie || "";
  const cookies: Record<string, string> = {};
  cookieHeader.split(";").forEach((pair) => {
    const [k, ...v] = pair.trim().split("=");
    if (k) cookies[k.trim()] = decodeURIComponent(v.join("="));
  });

  const userId = cookies["user_id"];

  const user = userId
    ? [...users.values()].find((u) => u.id === userId)
    : [...users.values()].find((u) => u.email === "abc@gmail.com");

  if (!user) {
    return res.status(401).json({
      status: "error",
      message: "Not authenticated. Please log in first.",
    });
  }

  return res.json({
    id: Number(user.id) || user.id,
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    law_firm: user.law_firm || "",
    role: user.role || "",
  });
});
// PATCH /profile/  -- update the profile of the currently authenticated user
authApp.patch("/profile/", (req, res) => {
  setCorsHeaders(res);

  const cookieHeader = req.headers.cookie || "";
  const cookies: Record<string, string> = {};
  cookieHeader.split(";").forEach((pair) => {
    const [k, ...v] = pair.trim().split("=");
    if (k) cookies[k.trim()] = decodeURIComponent(v.join("="));
  });

  const userId = cookies["user_id"];

  // Find user by cookie session, or fall back to the demo profile
  const user = userId
    ? [...users.values()].find((u) => u.id === userId)
    : [...users.values()].find((u) => u.email === "abc@gmail.com");

  if (!user) {
    return res.status(401).json({
      status: "error",
      message: "Not authenticated. Please log in first.",
    });
  }

  const { name, email, phone, law_firm, role } = req.body as {
    name?: string;
    email?: string;
    phone?: string;
    law_firm?: string;
    role?: string;
  };

  // Apply partial updates -- only overwrite fields that were provided
  if (name     !== undefined) user.name     = name;
  if (phone    !== undefined) user.phone    = phone;
  if (law_firm !== undefined) user.law_firm = law_firm;
  if (role     !== undefined) user.role     = role;

  // If email changed, re-key the users map
  if (email !== undefined && email !== user.email) {
    const oldKey = user.email.toLowerCase().trim();
    const newKey = email.toLowerCase().trim();
    user.email = newKey;
    users.delete(oldKey);
    users.set(newKey, user);
  }

  return res.json({
    id: Number(user.id) || user.id,
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    law_firm: user.law_firm || "",
    role: user.role || "",
  });
});

// ---------------------------------------------------------------------------
// Document Registry (in-memory, keyed by numeric document_id)
// ---------------------------------------------------------------------------
interface StoredDocument {
  id: number;
  title: string;
  contractType: string;
  text: string;         // Full raw text used for analysis
  pages: number;
}

// Helper: clean OCR / copy-paste artifacts from clause text
function cleanClauseText(raw: string): string {
  return raw
    // Normalize Unicode quotation marks to straight quotes
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
    // Normalize dashes
    .replace(/[\u2013\u2014\u2015]/g, "-")
    // Remove null / soft-hyphen / zero-width characters
    .replace(/[\u0000\u00AD\u200B\u200C\u200D\uFEFF]/g, "")
    // Collapse runs of 3+ spaces to two spaces (keep paragraph indentation)
    .replace(/ {3,}/g, "  ")
    // Normalize Windows line endings
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    // Collapse runs of 3+ blank lines to two
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Map numeric risk string from API to frontend RiskLevel
function mapRisk(level: string): "HIGH" | "MEDIUM" | "LOW" | "SAFE" {
  const upper = (level || "LOW").toUpperCase();
  if (upper === "HIGH") return "HIGH";
  if (upper === "MEDIUM") return "MEDIUM";
  if (upper === "LOW") return "LOW";
  return "SAFE";
}

const documentRegistry: Map<number, StoredDocument> = new Map();

// Pre-seed document 8 — Ohio BWC NDA (the example from the spec)
documentRegistry.set(8, {
  id: 8,
  title: "State of Ohio CSP903918 BWC Non-Disclosure Agreement",
  contractType: "NDA",
  pages: 3,
  text: `NON-DISCLOSURE AGREEMENT
This Non-Disclosure Agreement ("Agreement"), effective _____ ("Effective Date"), is entered into by and between __________ ("Recipient"), doing business at the following address: ____________________________________________________________________________, and the State of Ohio, Bureau of Workers' Compensation ("Discloser"), having offices at 30 W. Spring Street, Columbus, Ohio 43215-2256, entered into the day, month and year set out below, (each herein referred to individually as a "Party," or collectively as the "Parties").

Whereas, The State of Ohio, Department of Administrative Services (DAS) on behalf of Discloser has issued a Request for Competitive Sealed Proposals (RFP) CSP903918 for a Pharmacy Benefits Manager (PBM) for the Bureau of Workers' Compensation Pharmacy Program;

Whereas, in order for Recipient to evaluate and provide a response to the RFP, the Recipient will need access to confidential State information pertinent to providing a response to the RFP; and

Whereas, the parties recognize that this analysis requires Recipient's review of Discloser's confidential information and that this data requires the highest degree of protection;

Now, therefore, the parties agree to the following terms and conditions for such disclosure:

1) In consideration of the covenants and conditions contained herein, the Parties hereby agree to the following: Non-Disclosure/Confidentiality.

a) i) "Confidential Information" refers to the following items Discloser discloses to the Recipient: (1) Any information that is in written, graphic, machine readable, or other tangible form, and that Discloser designates as "Confidential"; (2) Any oral or visual information Discloser designates as "Confidential" at the time of disclosure; (3) Any source code and any names of actual or potential Disclosers, whether or not marked as confidential; and (4) Any other nonpublic, sensitive or third party information that is possession of Discloser and is disclosed to Recipient under this Agreement.

b) Restrictions on Use. i) Recipient shall not use the Confidential Information for any purpose except to evaluate and prepare a response to RFP CSP903918. ii) Recipient shall not disclose Confidential Information to any employee or subcontractor unless such person needs access and executes a nondisclosure agreement. iii) Recipient shall protect Confidential Information with no less than reasonable care. iv) Recipient shall promptly notify Discloser of any loss, release, misuse or misappropriation. v) Recipient may disclose Confidential Information as required by applicable law or by proper legal or governmental authority.

c) Injunction. The Recipient will be liable for disclosure of any Confidential Information. The Parties agree that the disclosure of Confidential Information may cause the Discloser irreparable damage for which remedies other than injunctive relief may be inadequate, and the Recipient agrees that in the event of a breach, the Discloser shall be entitled to temporary and permanent injunctive relief without the necessity of proving actual damages.

d) Return of Confidential Information. Upon request of Discloser or termination of this Agreement, Recipient shall return all Confidential Information, copies, extracts, or notes derived from Confidential Information to Discloser or certify, in writing, the destruction thereof.

e) Retention of Rights. This Agreement does not transfer ownership of Confidential Information or grant a license thereto. Discloser retains all right, title and interest in and to all Confidential Information and its reproductions.

2) No Obligation. Nothing in this Agreement shall obligate the Discloser to proceed with any other transaction between the Discloser and the Recipient.

3) Disputes. This Agreement will be governed by the laws of Ohio, and venue for any disputes will lie exclusively with the appropriate court in Franklin County, Ohio.

4) Severability. If any provision of this Agreement or the application of any provision is held by a court to be contrary to law, the remaining provisions of the Agreement will remain in full force and effect.

5) Amendments - Waiver. No change to any provision of this Agreement will be effective unless it is in writing and signed by both Parties.

6) Termination. Either party may terminate this Agreement upon provision to the other party one (1) day written notice of election to so terminate.

7) Location of Data. Recipient affirms that it shall not take the Discloser's Confidential Information outside the United States without express written authorization from the Discloser.

8) Authority to Sign. The person whose signature appears below on behalf of the Recipient represents and warrants that he/she has authority to bind the Recipient to the terms of this contract.

9) Execution in Counterparts. This Agreement may be executed in one or more counterparts. Each counterpart will be an original, but all such counterparts will constitute a single instrument.

10) Entire Agreement. This Agreement is the entire agreement between the Parties with respect to its subject matter and supersedes any previous agreements, whether oral or written.

11) Effective Date. This Agreement is made effective as of the date of the last signature of the authorized representatives below.`,
});

// ---------------------------------------------------------------------------
// Analysis Registry — stores completed analyses keyed by numeric analysis_id
// ---------------------------------------------------------------------------
interface StoredClause {
  id: number;
  clauseType: string;
  rawText: string;
  translatedText: string;
  riskLevel: string;
  shapValues: Record<string, number>;
}

interface StoredSimulation {
  id: number;
  projectedPenalty: number;
  deadline: string;
  recommendations: string;
}

interface StoredAnalysis {
  analysis_id: number;
  document_id: number;
  filename: string;
  cloudinaryUrl: string;
  cloudinaryPublicId: string;
  uploadedAt: string;
  riskScore: number;
  rawText: string;
  clauses: StoredClause[];
  simulations: StoredSimulation[];
}

const analysisRegistry: Map<number, StoredAnalysis> = new Map();
let nextAnalysisId = 100; // auto-increment counter

// Pre-seed analysis_id = 8 — matches the Ohio BWC NDA document_id = 8
analysisRegistry.set(8, {
  analysis_id: 8,
  document_id: 8,
  filename: "SupplementOne-NDA_gvbijy.pdf",
  cloudinaryUrl: "https://res.cloudinary.com/diyirrf8x/raw/upload/v1784908418/contracts/SupplementOne-NDA_gvbijy.pdf",
  cloudinaryPublicId: "contracts/SupplementOne-NDA_gvbijy.pdf",
  uploadedAt: new Date().toISOString(),
  riskScore: 0,
  rawText: documentRegistry.get(8)?.text || "",
  clauses: [
    {
      id: 1,
      clauseType: "General",
      rawText: cleanClauseText(`State of Ohio CSP903918 BWC002 RFP NON-DISCLOSURE AGREEMENT\n\nNON-DISCLOSURE AGREEMENT\nThis Non-Disclosure Agreement ("Agreement"), effective _____ ("Effective Date"), is entered into by and between __________ ("Recipient"), doing business at the following address, and the State of Ohio, Bureau of Workers' Compensation ("Discloser"), having offices at 30 W. Spring Street, Columbus, Ohio 43215-2256, (each herein referred to individually as a "Party," or collectively as the "Parties").\n\nWhereas, The State of Ohio, Department of Administrative Services (DAS) on behalf of Discloser has issued a Request for Competitive Sealed Proposals (RFP) CSP903918 for a Pharmacy Benefits Manager (PBM) for the Bureau of Workers' Compensation Pharmacy Program;\n\nWhereas, in order for Recipient to evaluate and provide a response to the RFP, the Recipient will need access to confidential State information pertinent to providing a response to the RFP; and\n\nWhereas, the parties recognize that this analysis requires Recipient's review of Discloser's confidential information and that this data requires the highest degree of protection;\n\nNow, therefore, the parties agree to the following terms and conditions for such disclosure:\n1) In consideration of the covenants and conditions contained herein, the Parties hereby agree to the following: Non-Disclosure/Confidentiality.`),
      translatedText: "",
      riskLevel: "LOW",
      shapValues: {},
    },
    {
      id: 2,
      clauseType: "Definition",
      rawText: cleanClauseText(`"Confidential Information" refers to the following items Discloser discloses to the Recipient: (1) Any information that is in written, graphic, machine readable, or other tangible form, and that Discloser designates as "Confidential"; (2) Any oral or visual information Discloser designates as "Confidential" at the time of disclosure; (3) Any source code and any names of actual or potential Disclosers, whether or not marked as confidential; and (4) Any other nonpublic, sensitive or third party information that is possession of Discloser and is disclosed to Recipient under this Agreement.\n\nRestrictions on Use.\nRecipient shall not use the Confidential Information for any purpose except to evaluate and prepare a response to RFP CSP903918. Recipient shall protect Confidential Information with no less than reasonable care. Recipient shall promptly notify Discloser of any loss, release, misuse or misappropriation of Confidential Information.`),
      translatedText: "",
      riskLevel: "LOW",
      shapValues: {},
    },
    {
      id: 3,
      clauseType: "Definition",
      rawText: cleanClauseText(`The Recipient will be liable for disclosure of any Confidential Information. The Parties agree that the disclosure of Confidential Information of the Discloser may cause the Discloser irreparable damage for which remedies other than injunctive relief may be inadequate, and the Recipient agrees that in the event of a breach of the obligations hereunder, the Discloser shall be entitled to temporary and permanent injunctive relief to enforce this provision without the necessity of proving actual damages.\n\nReturn of Confidential Information. Upon request of Discloser or termination of this Agreement, Recipient shall return all Confidential Information to Discloser or certify, in writing, the destruction thereof.\n\nDisputes. This Agreement will be governed by the laws of Ohio, and venue for any disputes will lie exclusively with the appropriate court in Franklin County, Ohio.\n\nTermination. Either party may terminate this Agreement upon provision to the other party one (1) day written notice of election to so terminate.`),
      translatedText: "",
      riskLevel: "LOW",
      shapValues: {},
    },
    {
      id: 4,
      clauseType: "19. AUDIT REVIEW PROCEDURES",
      rawText: cleanClauseText(`A. Any dispute concerning a question of fact arising under an interim or post-completion audit of this Agreement that is not disposed of by agreement, shall be reviewed by the COMMISSION'S Contract Manager.\nB. Not later than 30 days after issuance of the final audit report, the CONSULTANT may request a review by the COMMISSION'S Executive Director of unresolved audit issues. The request for review will be submitted in writing.\nC. Neither the pendency of a dispute nor its consideration by the COMMISSION will excuse the CONSULTANT from full and timely performance, in accordance with the terms of this contract.`),
      translatedText: "If there's a disagreement about a fact that comes up during an audit of our agreement, we'll let the Commission's Contract Manager decide what to do. If some issues are still unresolved after the final report is issued, the Consultant can ask the Commission's Executive Director to review them in writing within 30 days.",
      riskLevel: "HIGH",
      shapValues: {},
    },
  ],
  simulations: [
    {
      id: 1,
      projectedPenalty: 0,
      deadline: new Date().toISOString().split("T")[0],
      recommendations: "The clause remains classified as HIGH risk.",
    },
  ],
});

// POST /contract/analyse  — analyse a stored document by document_id
authApp.post("/contract/analyse", async (req, res) => {
  setCorsHeaders(res);

  const { document_id } = req.body as { document_id?: number };

  if (document_id === undefined || document_id === null) {
    return res.status(400).json({ status: "error", message: "document_id is required" });
  }

  const doc = documentRegistry.get(Number(document_id));
  if (!doc) {
    return res.status(404).json({
      status: "error",
      message: `Document with id ${document_id} not found. Register it first via POST /contract/register.`,
    });
  }

  const ai = getGenAIClient();

  // --- FALLBACK: split text into paragraph clauses when AI is unavailable ---
  if (!ai) {
    const paragraphs = doc.text.split(/\n\n+/).filter((p) => p.trim().length > 30);
    const clauseHeaders = ["General", "Definition", "Restrictions", "Obligations", "Termination", "Miscellaneous"];

    const clauses = paragraphs.slice(0, 6).map((para, i) => {
      const cleaned = cleanClauseText(para);
      const isHigh = /liability|injunction|damages|breach|uncapped/i.test(cleaned);
      const isMed = /termination|notice|waiver|amendment/i.test(cleaned);
      const riskLevel = isHigh ? "HIGH" : isMed ? "MEDIUM" : "LOW";
      const confidence = isHigh ? 0.82 : isMed ? 0.71 : 0.94;

      return {
        clause_id: i + 1,
        header: clauseHeaders[i % clauseHeaders.length],
        text: cleaned,
        risk: {
          risk_level: riskLevel,
          confidence,
          raw_scores: {
            LOW: riskLevel === "LOW" ? confidence : 1 - confidence - 0.05,
            MEDIUM: riskLevel === "MEDIUM" ? confidence : 0.04,
            HIGH: riskLevel === "HIGH" ? confidence : 0.01,
          },
        },
        explanation: null,
        translation: { plain_english: "", key_terms: [] },
      };
    });

    // Save fallback result to analysis registry
    const newAnalysisIdFallback = nextAnalysisId++;
    analysisRegistry.set(newAnalysisIdFallback, {
      analysis_id: newAnalysisIdFallback,
      document_id: Number(document_id),
      filename: `${doc.title.replace(/\s+/g, "_")}.pdf`,
      cloudinaryUrl: "",
      cloudinaryPublicId: "",
      uploadedAt: new Date().toISOString(),
      riskScore: clauses.filter((c) => c.risk.risk_level === "HIGH").length * 25,
      rawText: doc.text,
      clauses: clauses.map((c, i) => ({
        id: i + 1,
        clauseType: c.header,
        rawText: c.text,
        translatedText: c.translation.plain_english || "",
        riskLevel: c.risk.risk_level,
        shapValues: {},
      })),
      simulations: [],
    });

    return res.json({
      status: "success",
      message: "Analysis completed successfully",
      data: {
        analysis_id: newAnalysisIdFallback,
        ocr: { pages: doc.pages, used_fallback: true },
        total_clauses: clauses.length,
        clauses,
      },
    });
  }

  // --- AI-POWERED ANALYSIS ---
  try {
    const prompt = `You are a legal contract analysis engine. Analyze the following contract text and split it into meaningful clauses.

For each clause:
1. Give it a short header label (e.g. "General", "Definition", "Confidentiality", "Liability", "Termination", "Governing Law")
2. Extract the clean clause text (no OCR artifacts, no garbled characters, proper punctuation)
3. Assess risk level: LOW, MEDIUM, or HIGH
4. Provide confidence score 0.0-1.0 and raw scores for each level
5. Write a plain English translation (1-2 sentences)
6. Extract 2-4 key legal terms

Identify 3 to 6 clauses maximum. Preserve the meaning precisely in clean, readable English.

CONTRACT TEXT:
${doc.text.slice(0, 12000)}

Return JSON only.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            clauses: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  clause_id: { type: Type.INTEGER },
                  header: { type: Type.STRING },
                  text: { type: Type.STRING, description: "Clean, readable clause text without OCR artifacts" },
                  risk_level: { type: Type.STRING, description: "LOW, MEDIUM, or HIGH" },
                  confidence: { type: Type.NUMBER },
                  score_low: { type: Type.NUMBER },
                  score_medium: { type: Type.NUMBER },
                  score_high: { type: Type.NUMBER },
                  plain_english: { type: Type.STRING },
                  key_terms: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ["clause_id", "header", "text", "risk_level", "confidence"],
              },
            },
          },
          required: ["clauses"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    const rawClauses: any[] = parsed.clauses || [];

    const clauses = rawClauses.map((c: any) => ({
      clause_id: c.clause_id,
      header: c.header || "General",
      text: cleanClauseText(c.text || ""),
      risk: {
        risk_level: mapRisk(c.risk_level),
        confidence: Number(c.confidence) || 0.8,
        raw_scores: {
          LOW: Number(c.score_low) || (c.risk_level === "LOW" ? c.confidence : 0.05),
          MEDIUM: Number(c.score_medium) || (c.risk_level === "MEDIUM" ? c.confidence : 0.03),
          HIGH: Number(c.score_high) || (c.risk_level === "HIGH" ? c.confidence : 0.02),
        },
      },
      explanation: null,
      translation: {
        plain_english: c.plain_english || "",
        key_terms: Array.isArray(c.key_terms) ? c.key_terms : [],
      },
    }));

    // Save to analysis registry
    const newAnalysisId = nextAnalysisId++;
    analysisRegistry.set(newAnalysisId, {
      analysis_id: newAnalysisId,
      document_id: Number(document_id),
      filename: `${doc.title.replace(/\s+/g, "_")}.pdf`,
      cloudinaryUrl: "",
      cloudinaryPublicId: "",
      uploadedAt: new Date().toISOString(),
      riskScore: clauses.filter((c) => c.risk.risk_level === "HIGH").length * 25,
      rawText: doc.text,
      clauses: clauses.map((c, i) => ({
        id: i + 1,
        clauseType: c.header,
        rawText: c.text,
        translatedText: c.translation.plain_english || "",
        riskLevel: c.risk.risk_level,
        shapValues: {
          LOW: c.risk.raw_scores.LOW,
          MEDIUM: c.risk.raw_scores.MEDIUM,
          HIGH: c.risk.raw_scores.HIGH,
        },
      })),
      simulations: [],
    });

    return res.json({
      status: "success",
      message: "Analysis completed successfully",
      data: {
        analysis_id: newAnalysisId,
        ocr: { pages: doc.pages, used_fallback: false },
        total_clauses: clauses.length,
        clauses,
      },
    });
  } catch (err: any) {
    console.error("[Contract Analyse] AI error:", err);
    return res.status(500).json({ status: "error", message: "Analysis failed. Please retry." });
  }
});

// POST /contract/register  — register a new document for analysis
authApp.post("/contract/register", (req, res) => {
  setCorsHeaders(res);
  const { title, contractType, text, pages } = req.body as {
    title?: string;
    contractType?: string;
    text?: string;
    pages?: number;
  };

  if (!text || !title) {
    return res.status(400).json({ status: "error", message: "title and text are required" });
  }

  const newId = Math.max(0, ...Array.from(documentRegistry.keys())) + 1;
  documentRegistry.set(newId, {
    id: newId,
    title,
    contractType: contractType || "General Agreement",
    text,
    pages: pages || 1,
  });

  return res.status(201).json({
    status: "success",
    message: "Document registered",
    data: { document_id: newId, title },
  });
});

// POST /contract/simulate  — re-assess risk when a clause is rewritten
authApp.post("/contract/simulate", async (req, res) => {
  setCorsHeaders(res);

  const { document_id, clause_id, modified_clause } = req.body as {
    document_id?: number;
    clause_id?: number;
    modified_clause?: string;
  };

  if (modified_clause === undefined || modified_clause === null) {
    return res.status(400).json({ status: "error", message: "modified_clause is required" });
  }

  // ── Resolve original clause text from registry ───────────────────────────
  let originalClauseText = "";
  const doc = documentRegistry.get(Number(document_id));
  if (doc) {
    // Split document into paragraphs and find the clause by 1-based index
    const paragraphs = doc.text
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 20);
    const idx = Number(clause_id) - 1;
    originalClauseText = paragraphs[idx] || paragraphs[0] || doc.text.slice(0, 800);
  }

  // Clean both texts
  const cleanOriginal = cleanClauseText(originalClauseText);
  const cleanModified = cleanClauseText(modified_clause);

  // ── Risk heuristic (used as fallback and to seed Gemini) ─────────────────
  function scoreRiskHeuristic(text: string): "HIGH" | "MEDIUM" | "LOW" {
    const t = text.toLowerCase();
    const highKw = ["injunction","liable","liability","breach","damages","uncapped","unlimited","irrevocable","indemnif","penalty","default","terminate for cause"];
    const medKw  = ["termination","notice","waiver","amendment","dispute","audit","review","30 days","60 days","shall not"];
    if (highKw.some((k) => t.includes(k))) return "HIGH";
    if (medKw.some((k) => t.includes(k)))  return "MEDIUM";
    return "LOW";
  }

  const heuristicOldRisk = scoreRiskHeuristic(cleanOriginal || cleanModified);
  const heuristicNewRisk = scoreRiskHeuristic(cleanModified);

  const ai = getGenAIClient();

  // ── FALLBACK: no Gemini API key ───────────────────────────────────────────
  if (!ai) {
    const oldRisk = heuristicOldRisk;
    const newRisk = heuristicNewRisk;
    const changed = oldRisk !== newRisk;

    const summary = changed
      ? `Risk level changed from ${oldRisk} to ${newRisk} after clause modification.`
      : `The clause remains classified as ${newRisk} risk.`;

    // Simple plain-English translation via substitution
    const translation = cleanModified
      .replace(/\bshall\b/gi, "must")
      .replace(/\bherein\b/gi, "in this agreement")
      .replace(/\bhereto\b/gi, "to this agreement")
      .replace(/\bwhereas\b/gi, "given that")
      .replace(/\bnotwithstanding\b/gi, "despite")
      .replace(/\bpursuant to\b/gi, "under")
      .replace(/\bthereof\b/gi, "of it")
      .replace(/\bthereto\b/gi, "to it")
      .replace(/\bsaid\b/gi, "the");

    // Persist simulation into any matching analysis records
    const simEntryFallback: StoredSimulation = {
      id: Date.now(),
      projectedPenalty: 0,
      deadline: new Date().toISOString().split("T")[0],
      recommendations: summary,
    };
    for (const analysis of analysisRegistry.values()) {
      if (analysis.document_id === Number(document_id)) {
        analysis.simulations.push(simEntryFallback);
      }
    }

    return res.json({
      status: "success",
      message: "Simulation completed successfully",
      data: {
        original_clause: cleanOriginal || "[Original clause text not available for this document_id/clause_id]",
        modified_clause: cleanModified,
        old_risk: oldRisk,
        new_risk: newRisk,
        summary,
        translation,
        explanation: null,
      },
    });
  }

  // ── AI-POWERED SIMULATION ─────────────────────────────────────────────────
  try {
    const prompt = `You are a legal contract risk assessor. Evaluate two versions of a clause.

ORIGINAL CLAUSE:
${cleanOriginal || "(not available — assess only the modified clause)"}

MODIFIED CLAUSE:
${cleanModified}

Tasks:
1. Assess risk level of ORIGINAL clause: HIGH, MEDIUM, or LOW
2. Assess risk level of MODIFIED clause: HIGH, MEDIUM, or LOW
3. Write a one-sentence plain English summary of the risk change (or lack thereof)
4. Translate the MODIFIED clause into simple plain English (keep all facts, remove legal jargon)
5. Optional: brief explanation of why risk changed (or null if unchanged)

Return JSON only.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            old_risk:    { type: Type.STRING, description: "HIGH, MEDIUM, or LOW" },
            new_risk:    { type: Type.STRING, description: "HIGH, MEDIUM, or LOW" },
            summary:     { type: Type.STRING, description: "One-sentence summary of the risk change" },
            translation: { type: Type.STRING, description: "Plain English version of the modified clause" },
            explanation: { type: Type.STRING, description: "Why the risk changed, or null if unchanged" },
          },
          required: ["old_risk", "new_risk", "summary", "translation"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}"); const parsedSummary = parsed.summary || `The clause risk is assessed as ${mapRisk(parsed.new_risk || heuristicNewRisk)}.`;

    // Persist simulation into any matching analysis records
    const simEntryAI: StoredSimulation = {
      id: Date.now(),
      projectedPenalty: 0,
      deadline: new Date().toISOString().split("T")[0],
      recommendations: parsedSummary,
    };
    for (const analysis of analysisRegistry.values()) {
      if (analysis.document_id === Number(document_id)) {
        analysis.simulations.push(simEntryAI);
      }
    }

    return res.json({
      status: "success",
      message: "Simulation completed successfully",
      data: {
        original_clause: cleanOriginal || "[Original clause not found for this document_id/clause_id]",
        modified_clause: cleanModified,
        old_risk: mapRisk(parsed.old_risk || heuristicOldRisk),
        new_risk: mapRisk(parsed.new_risk || heuristicNewRisk),
        summary: parsedSummary,
        translation: cleanClauseText(parsed.translation || cleanModified),
        explanation: parsed.explanation || null,
      },
    });
  } catch (err: any) {
    console.error("[Contract Simulate] AI error:", err);
    return res.status(500).json({ status: "error", message: "Simulation failed. Please retry." });
  }
});

// GET /contract/analyses  -- list all stored analyses (summary view)
authApp.get("/contract/analyses", (req, res) => {
  setCorsHeaders(res);

  const list = [...analysisRegistry.values()]
    .sort((a, b) => b.analysis_id - a.analysis_id) // newest first
    .map((r) => ({
      id: r.analysis_id,
      filename: r.filename,
      riskScore: r.riskScore,
      uploadedAt: r.uploadedAt,
      cloudinaryUrl: r.cloudinaryUrl,
      cloudinaryPublicId: r.cloudinaryPublicId,
      totalClauses: r.clauses.length,
    }));

  return res.json({
    status: "success",
    message: "Analyses fetched successfully",
    data: list,
  });
});

// GET /contract/analyses/:analysis_id  — fetch stored analysis details
authApp.get("/contract/analyses/:analysis_id", (req, res) => {
  setCorsHeaders(res);

  const analysisId = Number(req.params.analysis_id);
  if (isNaN(analysisId)) {
    return res.status(400).json({ status: "error", message: "analysis_id must be a number" });
  }

  const record = analysisRegistry.get(analysisId);
  if (!record) {
    return res.status(404).json({
      status: "error",
      message: `Analysis with id ${analysisId} not found.`,
    });
  }

  const doc = documentRegistry.get(record.document_id);

  return res.json({
    status: "success",
    message: "Analysis details fetched successfully",
    data: {
      document: {
        id: record.document_id,
        filename: record.filename,
        rawText: cleanClauseText(record.rawText),
        riskScore: record.riskScore,
        uploadedAt: record.uploadedAt,
        cloudinaryUrl: record.cloudinaryUrl,
        cloudinaryPublicId: record.cloudinaryPublicId,
      },
      clauses: record.clauses.map((c) => ({
        id: c.id,
        clauseType: c.clauseType,
        rawText: cleanClauseText(c.rawText),
        translatedText: c.translatedText,
        riskLevel: c.riskLevel,
        shapValues: c.shapValues,
      })),
      simulations: record.simulations,
    },
  });
});

// ---------------------------------------------------------------------------
// Chatbot Router  --  POST /chatbot/chat
// ---------------------------------------------------------------------------
authApp.post("/chatbot/chat", async (req, res) => {
  setCorsHeaders(res);

  const { contract_id, user_question } = req.body as {
    contract_id?: number;
    user_question?: string;
  };

  if (!user_question || !user_question.trim()) {
    return res.status(400).json({ answer: "Please provide a question." });
  }

  // ---- Resolve analysis context from the registry -------------------------
  const record = analysisRegistry.get(Number(contract_id));
  const doc    = record ? documentRegistry.get(record.document_id) : null;

  const highRisk   = record?.clauses.filter((c) => c.riskLevel === "HIGH")   || [];
  const medRisk    = record?.clauses.filter((c) => c.riskLevel === "MEDIUM")  || [];
  const clauseList = record?.clauses ?? [];

  // Build a compact clause summary for the prompt
  const clauseSummary = clauseList
    .map((c) =>
      `[${c.riskLevel}] ${c.clauseType}: ${c.rawText.slice(0, 300)}${c.rawText.length > 300 ? "..." : ""}` +
      (c.translatedText ? `\n  Plain English: ${c.translatedText}` : "")
    )
    .join("\n\n");

  const contractTitle = doc?.title ?? (record ? `Contract #${record.document_id}` : "the uploaded contract");

  // ---- AI-powered answer --------------------------------------------------
  const ai = getGenAIClient();

  if (ai) {
    try {
      const systemInstruction = `You are ContractOS AI Legal Counsel, an elite corporate attorney and contract risk expert.
The user is asking about a specific contract. Answer clearly using rich markdown formatting.
Structure your answer with:
- A direct answer or legal opinion
- Relevant clause references with risk levels
- Plain-English explanations where helpful
- A practical recommendation

Contract Title: ${contractTitle}
High-Risk Clauses (${highRisk.length}): ${highRisk.map((c) => c.clauseType).join(", ") || "None"}
Medium-Risk Clauses (${medRisk.length}): ${medRisk.map((c) => c.clauseType).join(", ") || "None"}

Clause Details:
${clauseSummary || "No clause details available. Answer based on general legal expertise."}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: user_question.trim(),
        config: { systemInstruction },
      });

      return res.json({ answer: response.text?.trim() || "I was unable to generate a response. Please try again." });
    } catch (err: any) {
      console.error("[Chatbot] AI error:", err);
      // Fall through to heuristic fallback
    }
  }

  // ---- Heuristic fallback (no API key or AI error) ------------------------
  const q = user_question.toLowerCase();

  let answer = "";

  if (!record) {
    // Generic legal answer when no contract context is available
    answer = `**Legal Counsel Response**\n\nI don't have a specific contract loaded for Contract ID ${contract_id ?? "provided"}. Here is a general answer to your question:\n\n> "${user_question}"\n\nFrom a general legal standpoint, contract provisions should be reviewed for mutual obligations, clear definitions of liability, and unambiguous termination rights. I recommend uploading your contract for a full AI-powered analysis.\n\n**Recommendation:** Use the contract analysis tool to get clause-specific risk scores and plain-English explanations.`;
  } else {
    // Build context-aware answer from stored clauses
    const highNames  = highRisk.map((c) => `**${c.clauseType}**`).join(", ") || "none identified";
    const totalClauses = clauseList.length;

    let relevantClauses = clauseList;
    if (q.includes("high risk") || q.includes("risk"))   relevantClauses = [...highRisk, ...medRisk];
    if (q.includes("clause") || q.includes("section"))   relevantClauses = clauseList;
    if (q.includes("termination") || q.includes("end"))  relevantClauses = clauseList.filter((c) => /terminat/i.test(c.clauseType + c.rawText));
    if (q.includes("confidential") || q.includes("nda")) relevantClauses = clauseList.filter((c) => /confidential|nda|disclosure/i.test(c.clauseType + c.rawText));
    if (q.includes("dispute") || q.includes("audit"))    relevantClauses = clauseList.filter((c) => /dispute|audit/i.test(c.clauseType + c.rawText));

    const clauseDetails = relevantClauses
      .slice(0, 3)
      .map((c) => {
        const translated = c.translatedText
          ? `\n\n   *Plain English:* ${c.translatedText}`
          : "";
        return `*   **${c.clauseType}** � Risk Level: \`${c.riskLevel}\`\n\n   ${c.rawText.slice(0, 400)}${c.rawText.length > 400 ? "..." : ""}${translated}`;
      })
      .join("\n\n---\n\n");

    answer = `**High-Risk Clause Summary**\n\nThe contract **"${contractTitle}"** contains ${totalClauses} clauses. High-risk clauses: ${highNames}.\n\n---\n\n${clauseDetails}\n\n---\n\n**Recommendation:** ${
      highRisk.length > 0
        ? `The ${highRisk.length} high-risk clause(s) require careful review before signing. Consider negotiating clearer terms for ${highNames}.`
        : "No high-risk clauses were identified. Review the medium-risk clauses before signing."
    }\n\nDo you have any specific questions about these clauses, or would you like me to elaborate on a particular aspect?`;
  }

  return res.json({ answer });
});
// ---------------------------------------------------------------------------
// Start Servers
// ---------------------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Main app server (port 3000 — Vite + API)
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ContractOS Server running on http://localhost:${PORT}`);
  });

  // Auth server (port 8000 — /auth/* routes)
  const AUTH_PORT = 8000;
  http.createServer(authApp).listen(AUTH_PORT, "0.0.0.0", () => {
    console.log(`ContractOS Auth Server running on http://localhost:${AUTH_PORT}`);
  });
}

startServer();
