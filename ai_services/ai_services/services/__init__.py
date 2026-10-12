"""
AI Services Package

Provides OCR, document segmentation, legal clause classification,
SHAP explainability, translation, and simulation services.
"""

# OCR
from .ocr import (
    OCRPage,
    OCRResult,
    OCRExtractionError,
    extract_text,
)

# Segmentation
from .segmentation import (
    Segment,
    segment_document,
)

# Classification
from .classifier import (
    RiskLevel,
    ClassificationResult,
    ClauseClassifier,
    get_classifier,
)

# Explainability
from .explainability import (
    ShapFeature,
    ShapSummary,
    explain_clause,
    get_explainer,
)

# Translation
from .translator import (
    TranslationOutput,
    TranslationError,
    ClauseTranslator,
    get_translator,
)

# Simulation
from .simulator import (
    SimulationResult,
    ClauseSimulator,
    get_simulator,
)

__all__ = [
    # OCR
    "OCRPage",
    "OCRResult",
    "OCRExtractionError",
    "extract_text",

    # Segmentation
    "Segment",
    "segment_document",

    # Classification
    "RiskLevel",
    "ClassificationResult",
    "ClauseClassifier",
    "get_classifier",

    # Explainability
    "ShapFeature",
    "ShapSummary",
    "explain_clause",
    "get_explainer",

    # Translation
    "TranslationOutput",
    "TranslationError",
    "ClauseTranslator",
    "get_translator",

    # Simulation
    "SimulationResult",
    "ClauseSimulator",
    "get_simulator",
]