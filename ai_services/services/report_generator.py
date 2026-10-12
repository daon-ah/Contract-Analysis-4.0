"""
report_generator.py

Collects outputs from OCR, Segmentation, LegalBERT Classifier,
Explainability, Simulator, and Translator modules, generates an
LLM-written executive summary, and exports the Executive Report
in Markdown, PDF, DOCX, and JSON formats.

Does NOT run OCR, segmentation, risk prediction, or model training.
"""

import os
import json
import datetime
import logging
from dataclasses import dataclass, field, asdict
from typing import List, Dict, Optional

from ai_services.services.local_llm_client import LocalLlamaClient

from docx import Document
from docx.shared import RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
)

logger = logging.getLogger("report_generator")
logging.basicConfig(level=logging.INFO)

# ==========================================================
# Config
# ==========================================================

@dataclass
class ReportConfig:
    output_dir: str = "reports"
    risk_weights: Dict[str, int] = field(
        default_factory=lambda: {"low": 1, "medium": 4, "high": 10}
    )
    risk_colors: Dict[str, str] = field(
        default_factory=lambda: {"high": "#D32F2F", "medium": "#F9A825", "low": "#388E3C"}
    )
    low_confidence_threshold: float = 0.60
    use_llm: bool = True
    llm_endpoint: str = "http://localhost:11434"
    llm_model: str = "llama3"


# ==========================================================
# Structured Data Models
# ==========================================================

@dataclass
class ClauseResult:
    index: int
    text: str
    risk: str = "low"
    confidence: float = 0.0
    explainability: str = ""
    simulation: str = ""
    rewrite: str = ""
    category: Optional[str] = None

    @property
    def is_low_confidence(self) -> bool:
        return self.confidence < 0.60


@dataclass
class ReportInputs:
    contract_name: str
    uploaded_file: str
    ocr_text: str
    clauses: List[ClauseResult]
    metadata: Dict = field(default_factory=dict)


# ==========================================================
# LLM Summary Generation (project's LocalLlamaClient)
# ==========================================================

def _fallback_summary() -> str:
    return (
        "Automated summary unavailable. Review the clause-level analysis "
        "below for detailed findings."
    )


def get_llm_client(config: ReportConfig) -> Optional[LocalLlamaClient]:
    if not config.use_llm:
        return None
    try:
        return LocalLlamaClient(endpoint=config.llm_endpoint, model=config.llm_model)
    except Exception as exc:
        logger.warning("Failed to initialize LocalLlamaClient: %s", exc)
        return None


# ==========================================================
# Analytics Engine
# ==========================================================

class AnalyticsEngine:
    def __init__(self, clauses: List[ClauseResult], config: ReportConfig):
        self.clauses = clauses
        self.config = config

    def risk_counts(self) -> Dict[str, int]:
        counts = {"low": 0, "medium": 0, "high": 0}
        for c in self.clauses:
            counts[c.risk.lower()] = counts.get(c.risk.lower(), 0) + 1
        return counts

    def health_score(self) -> float:
        """
        Weighted, confidence-aware health score (0-100, higher = healthier).
        Penalty scales with risk severity AND model confidence, so a
        low-confidence "high risk" call weighs less than a certain one.
        """
        if not self.clauses:
            return 100.0

        weights = self.config.risk_weights
        max_weight = max(weights.values())

        total_penalty = sum(
            weights.get(c.risk.lower(), 0) * max(c.confidence, 0.5)
            for c in self.clauses
        )
        max_penalty = len(self.clauses) * max_weight

        score = 100 - (total_penalty / max_penalty) * 100
        return round(max(0.0, min(100.0, score)), 2)

    def top_risk_clauses(self, n: int = 3) -> List[ClauseResult]:
        order = {"high": 0, "medium": 1, "low": 2}
        ranked = sorted(
            self.clauses,
            key=lambda c: (order.get(c.risk.lower(), 3), -c.confidence),
        )
        return ranked[:n]

    def low_confidence_clauses(self) -> List[ClauseResult]:
        return [c for c in self.clauses if c.is_low_confidence]

    def average_confidence(self) -> float:
        if not self.clauses:
            return 0.0
        return round(sum(c.confidence for c in self.clauses) / len(self.clauses), 4)

    def risk_distribution_pct(self) -> Dict[str, float]:
        counts = self.risk_counts()
        total = sum(counts.values()) or 1
        return {k: round((v / total) * 100, 1) for k, v in counts.items()}

    def build_summary_stats(self) -> Dict:
        return {
            "total_clauses": len(self.clauses),
            "risk_counts": self.risk_counts(),
            "risk_distribution_pct": self.risk_distribution_pct(),
            "average_confidence": self.average_confidence(),
            "low_confidence_count": len(self.low_confidence_clauses()),
            "health_score": self.health_score(),
        }


# ==========================================================
# Executive Summary Builder (LLM-backed)
# ==========================================================

def build_executive_summary_prompt(inputs: ReportInputs, stats: Dict, top_risks: List[ClauseResult]) -> str:
    top_risk_lines = "\n".join(
        f"- [{c.risk.upper()}] {c.text[:200]}" for c in top_risks
    )
    return (
        f"You are a legal risk analyst. Write a concise 150-200 word executive "
        f"summary for the contract '{inputs.contract_name}'.\n\n"
        f"Health Score: {stats['health_score']}/100\n"
        f"Risk Distribution: {stats['risk_distribution_pct']}\n"
        f"Total Clauses Reviewed: {stats['total_clauses']}\n\n"
        f"Top Risk Clauses:\n{top_risk_lines}\n\n"
        f"Summarize overall contract health, the biggest concerns, and a "
        f"recommended next action for a business executive (non-lawyer) audience."
    )


def generate_executive_summary(
    inputs: ReportInputs, stats: Dict, top_risks: List[ClauseResult], llm: Optional[LocalLlamaClient]
) -> str:
    if llm is None:
        return _fallback_summary()

    prompt = build_executive_summary_prompt(inputs, stats, top_risks)
    try:
        return llm.complete(prompt).strip()
    except Exception as exc:
        logger.warning("LocalLlamaClient.complete failed, falling back: %s", exc)
        return _fallback_summary()


# ==========================================================
# Report Data Aggregator
# ==========================================================

class ReportData:
    def __init__(self, inputs: ReportInputs, config: ReportConfig, llm: Optional[LocalLlamaClient]):
        self.inputs = inputs
        self.config = config
        self.generated_at = datetime.datetime.now().isoformat()

        self.analytics = AnalyticsEngine(inputs.clauses, config)
        self.stats = self.analytics.build_summary_stats()
        self.top_risks = self.analytics.top_risk_clauses()
        self.executive_summary = generate_executive_summary(
            inputs, self.stats, self.top_risks, llm
        )

    def to_dict(self) -> Dict:
        return {
            "contract_name": self.inputs.contract_name,
            "uploaded_file": self.inputs.uploaded_file,
            "generated_at": self.generated_at,
            "executive_summary": self.executive_summary,
            "statistics": self.stats,
            "top_risk_clauses": [asdict(c) for c in self.top_risks],
            "ocr_text": self.inputs.ocr_text,
            "clauses": [asdict(c) for c in self.inputs.clauses],
            "metadata": self.inputs.metadata,
        }


# ==========================================================
# Markdown Report
# ==========================================================

def build_markdown(data: ReportData) -> str:
    inputs, stats = data.inputs, data.stats
    lines = [
        f"# Executive Report: {inputs.contract_name}",
        "",
        f"**Generated:** {data.generated_at}",
        f"**Source File:** {inputs.uploaded_file}",
        f"**Health Score:** {stats['health_score']}/100",
        f"**Average Confidence:** {stats['average_confidence']}",
        "",
        "## Executive Summary",
        "",
        data.executive_summary,
        "",
        "## Risk Summary",
        "",
        "| Risk Level | Count | % |",
        "|---|---|---|",
    ]
    for level in ["high", "medium", "low"]:
        lines.append(
            f"| {level.capitalize()} | {stats['risk_counts'].get(level, 0)} "
            f"| {stats['risk_distribution_pct'].get(level, 0)}% |"
        )
    lines.append("")

    lines.append("## Top Risk Clauses")
    lines.append("")
    for c in data.top_risks:
        lines.append(f"- **[{c.risk.upper()}]** {c.text}")
    lines.append("")

    lines.append("## Clause-Level Analysis")
    lines.append("")
    for c in inputs.clauses:
        lines.append(f"### Clause {c.index + 1} — Risk: {c.risk.upper()} (Confidence: {c.confidence})")
        lines.append("")
        lines.append(f"**Original Clause:** {c.text}")
        lines.append("")
        if c.explainability:
            lines.append(f"**Explainability:** {c.explainability}")
            lines.append("")
        if c.simulation:
            lines.append(f"**Simulation Result:** {c.simulation}")
            lines.append("")
        if c.rewrite:
            lines.append(f"**AI Suggested Rewrite:** {c.rewrite}")
            lines.append("")

    lines.append("## Metadata")
    lines.append("")
    for key, value in inputs.metadata.items():
        lines.append(f"- **{key}**: {value}")
    lines.append("")

    return "\n".join(lines)


# ==========================================================
# JSON Report
# ==========================================================

def build_json(data: ReportData) -> str:
    return json.dumps(data.to_dict(), indent=2, ensure_ascii=False)


# ==========================================================
# DOCX Report
# ==========================================================

def build_docx(data: ReportData, output_path: str):
    inputs, stats, config = data.inputs, data.stats, data.config
    doc = Document()

    doc.add_heading(f"Executive Report: {inputs.contract_name}", level=0)

    meta_p = doc.add_paragraph()
    meta_p.add_run(f"Generated: {data.generated_at}\n").italic = True
    meta_p.add_run(f"Source File: {inputs.uploaded_file}\n").italic = True
    meta_p.add_run(f"Health Score: {stats['health_score']}/100  |  "
                    f"Avg Confidence: {stats['average_confidence']}").bold = True

    doc.add_heading("Executive Summary", level=1)
    doc.add_paragraph(data.executive_summary)

    doc.add_heading("Risk Summary", level=1)
    table = doc.add_table(rows=1, cols=3)
    table.style = "Light Grid Accent 1"
    hdr = table.rows[0].cells
    hdr[0].text, hdr[1].text, hdr[2].text = "Risk Level", "Count", "%"
    for level in ["high", "medium", "low"]:
        row = table.add_row().cells
        row[0].text = level.capitalize()
        row[1].text = str(stats["risk_counts"].get(level, 0))
        row[2].text = f"{stats['risk_distribution_pct'].get(level, 0)}%"

    doc.add_heading("Top Risk Clauses", level=1)
    for c in data.top_risks:
        p = doc.add_paragraph(style="List Bullet")
        run = p.add_run(f"[{c.risk.upper()}] ")
        run.bold = True
        run.font.color.rgb = RGBColor.from_string(
            config.risk_colors.get(c.risk.lower(), "#000000").replace("#", "")
        )
        p.add_run(c.text)

    doc.add_heading("Clause-Level Analysis", level=1)
    for c in inputs.clauses:
        heading = doc.add_heading(
            f"Clause {c.index + 1} — Risk: {c.risk.upper()} (Confidence: {c.confidence})", level=2
        )
        color = RGBColor.from_string(config.risk_colors.get(c.risk.lower(), "#000000").replace("#", ""))
        for run in heading.runs:
            run.font.color.rgb = color

        p = doc.add_paragraph()
        p.add_run("Original Clause: ").bold = True
        p.add_run(c.text)

        for label, value in [
            ("Explainability", c.explainability),
            ("Simulation Result", c.simulation),
            ("AI Suggested Rewrite", c.rewrite),
        ]:
            if value:
                p = doc.add_paragraph()
                p.add_run(f"{label}: ").bold = True
                p.add_run(value)

        doc.add_paragraph()

    doc.add_heading("Metadata", level=1)
    for key, value in inputs.metadata.items():
        doc.add_paragraph(f"{key}: {value}", style="List Bullet")

    doc.save(output_path)


# ==========================================================
# PDF Report
# ==========================================================

def build_pdf(data: ReportData, output_path: str):
    inputs, stats, config = data.inputs, data.stats, data.config

    doc = SimpleDocTemplate(output_path, pagesize=LETTER, topMargin=0.75 * inch, bottomMargin=0.75 * inch)
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("TitleStyle", parent=styles["Title"], fontSize=20, spaceAfter=12)
    heading_style = styles["Heading1"]
    subheading_style = styles["Heading2"]
    body_style = styles["BodyText"]
    italic_style = ParagraphStyle("Italic", parent=body_style, fontName="Helvetica-Oblique")

    elements = [
        Paragraph(f"Executive Report: {inputs.contract_name}", title_style),
        Paragraph(f"Generated: {data.generated_at}", italic_style),
        Paragraph(f"Source File: {inputs.uploaded_file}", italic_style),
        Paragraph(
            f"<b>Health Score:</b> {stats['health_score']}/100 &nbsp;|&nbsp; "
            f"<b>Avg Confidence:</b> {stats['average_confidence']}", body_style
        ),
        Spacer(1, 16),
        Paragraph("Executive Summary", heading_style),
        Paragraph(data.executive_summary, body_style),
        Spacer(1, 16),
        Paragraph("Risk Summary", heading_style),
    ]

    table_data = [["Risk Level", "Count", "%"]]
    for level in ["high", "medium", "low"]:
        table_data.append([
            level.capitalize(),
            str(stats["risk_counts"].get(level, 0)),
            f"{stats['risk_distribution_pct'].get(level, 0)}%",
        ])
    risk_table = Table(table_data, colWidths=[2 * inch, 2 * inch, 1.5 * inch])
    risk_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#37474F")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("ALIGN", (1, 0), (2, -1), "CENTER"),
    ]))
    elements.append(risk_table)
    elements.append(Spacer(1, 20))

    elements.append(Paragraph("Top Risk Clauses", heading_style))
    for c in data.top_risks:
        risk_hex = config.risk_colors.get(c.risk.lower(), "#000000")
        elements.append(Paragraph(f'<font color="{risk_hex}"><b>[{c.risk.upper()}]</b></font> {c.text}', body_style))
    elements.append(Spacer(1, 20))

    elements.append(Paragraph("Clause-Level Analysis", heading_style))
    for c in inputs.clauses:
        risk_hex = config.risk_colors.get(c.risk.lower(), "#000000")
        elements.append(Paragraph(
            f'Clause {c.index + 1} — <font color="{risk_hex}">Risk: {c.risk.upper()}</font> '
            f'(Confidence: {c.confidence})', subheading_style,
        ))
        elements.append(Paragraph(f"<b>Original Clause:</b> {c.text}", body_style))
        for label, value in [
            ("Explainability", c.explainability),
            ("Simulation Result", c.simulation),
            ("AI Suggested Rewrite", c.rewrite),
        ]:
            if value:
                elements.append(Paragraph(f"<b>{label}:</b> {value}", body_style))
        elements.append(Spacer(1, 12))

    elements.append(PageBreak())
    elements.append(Paragraph("Metadata", heading_style))
    for key, value in inputs.metadata.items():
        elements.append(Paragraph(f"<b>{key}:</b> {value}", body_style))

    doc.build(elements)


# ==========================================================
# Main Export Function
# ==========================================================

def generate_report(
    contract_name: str,
    uploaded_file: str,
    ocr_text: str,
    segmented_clauses: List[str],
    risk_predictions: List[Dict],
    confidence_scores: List[float],
    explainability_results: List[str],
    simulation_results: List[str],
    ai_suggested_rewrites: List[str],
    metadata: Optional[Dict] = None,
    config: Optional[ReportConfig] = None,
) -> Dict:
    """
    Main entry point. Aggregates all module outputs, generates an
    LLM executive summary, and exports Executive_Report.{md,json,docx,pdf}.
    Returns dict of output file paths + key stats.
    """

    config = config or ReportConfig()
    os.makedirs(config.output_dir, exist_ok=True)

    clauses = [
        ClauseResult(
            index=i,
            text=text,
            risk=risk_predictions[i].get("risk", "low") if i < len(risk_predictions) else "low",
            confidence=confidence_scores[i] if i < len(confidence_scores) else 0.0,
            explainability=explainability_results[i] if i < len(explainability_results) else "",
            simulation=simulation_results[i] if i < len(simulation_results) else "",
            rewrite=ai_suggested_rewrites[i] if i < len(ai_suggested_rewrites) else "",
        )
        for i, text in enumerate(segmented_clauses)
    ]

    inputs = ReportInputs(
        contract_name=contract_name,
        uploaded_file=uploaded_file,
        ocr_text=ocr_text,
        clauses=clauses,
        metadata=metadata or {},
    )

    llm = get_llm_client(config)
    data = ReportData(inputs, config, llm)

    paths = {
        "markdown": os.path.join(config.output_dir, "Executive_Report.md"),
        "json": os.path.join(config.output_dir, "Executive_Report.json"),
        "docx": os.path.join(config.output_dir, "Executive_Report.docx"),
        "pdf": os.path.join(config.output_dir, "Executive_Report.pdf"),
    }

    with open(paths["markdown"], "w", encoding="utf-8") as f:
        f.write(build_markdown(data))

    with open(paths["json"], "w", encoding="utf-8") as f:
        f.write(build_json(data))

    build_docx(data, paths["docx"])
    build_pdf(data, paths["pdf"])

    return {**paths, "stats": data.stats}


# ==========================================================
# Example Usage
# ==========================================================

if __name__ == "__main__":
    result = generate_report(
        contract_name="Sample Vendor Agreement",
        uploaded_file="sample_vendor_agreement.pdf",
        ocr_text="Full extracted contract text here...",
        segmented_clauses=[
            "The vendor shall indemnify the client against all claims.",
            "Either party may terminate this agreement with 7 days notice.",
        ],
        risk_predictions=[{"risk": "high"}, {"risk": "medium"}],
        confidence_scores=[0.93, 0.81],
        explainability_results=[
            "High risk due to unbounded indemnification scope.",
            "Short termination notice increases operational risk.",
        ],
        simulation_results=[
            "Simulated dispute cost: $120,000 avg.",
            "Simulated disruption: 2 weeks avg.",
        ],
        ai_suggested_rewrites=[
            "The vendor shall indemnify the client for direct damages up to contract value.",
            "Either party may terminate this agreement with 30 days written notice.",
        ],
        metadata={
            "uploaded_by": "user@example.com",
            "jurisdiction": "California, USA",
            "contract_type": "Vendor Agreement",
        },
        config=ReportConfig(use_llm=True),
    )

    print(json.dumps(result, indent=2))