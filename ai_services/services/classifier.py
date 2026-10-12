import logging
import threading
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from enum import Enum

import torch
from transformers import (
    AutoModelForSequenceClassification,
    AutoTokenizer,
)

logger = logging.getLogger(__name__)

# -------------------------------------------------------------------
# Configuration
# -------------------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent

MODEL_PATH = BASE_DIR / "models" / "legal_bert"

# -------------------------------------------------------------------
# Risk Levels
# -------------------------------------------------------------------

class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


LABEL_ORDER = [
    RiskLevel.LOW,
    RiskLevel.MEDIUM,
    RiskLevel.HIGH,
]

# -------------------------------------------------------------------
# Thread Lock
# -------------------------------------------------------------------

_model_lock = threading.Lock()

# -------------------------------------------------------------------
# Classification Result
# -------------------------------------------------------------------

@dataclass
class ClassificationResult:
    """
    Stores the output of the classifier.
    """

    risk_level: RiskLevel
    confidence: float
    raw_scores: dict[str, float]


# -------------------------------------------------------------------
# Clause Classifier
# -------------------------------------------------------------------

class ClauseClassifier:
    """
    Singleton Legal-BERT classifier.
    """

    _tokenizer = None
    _model = None

    def __init__(self) -> None:

        self.model_name = str(MODEL_PATH)

        self.device = (
            "cuda"
            if torch.cuda.is_available()
            else "cpu"
        )

        self._ensure_loaded()

    # ---------------------------------------------------------------

    def _ensure_loaded(self) -> None:
        """
        Load tokenizer and model only once.
        """

        if ClauseClassifier._model is not None:
            return

        with _model_lock:

            if ClauseClassifier._model is not None:
                return

            logger.info(
                "Loading Legal-BERT model from %s",
                self.model_name,
            )

            ClauseClassifier._tokenizer = (
                AutoTokenizer.from_pretrained(
                    self.model_name
                )
            )

            ClauseClassifier._model = (
                AutoModelForSequenceClassification
                .from_pretrained(
                    self.model_name
                )
                .to(self.device)
            )

            ClauseClassifier._model.eval()

            logger.info("Classifier loaded successfully.")

    # ---------------------------------------------------------------

    def classify(
        self,
        clause_text: str,
    ) -> ClassificationResult:
        """
        Classify a single legal clause.
        """

        if not clause_text or not clause_text.strip():
            raise ValueError(
                "Clause text cannot be empty."
            )

        tokenizer = ClauseClassifier._tokenizer
        model = ClauseClassifier._model

        inputs = tokenizer(
            clause_text,
            truncation=True,
            max_length=512,
            padding=True,
            return_tensors="pt",
        ).to(self.device)

        with torch.no_grad():

            outputs = model(**inputs)

            probabilities = (
                torch.softmax(
                    outputs.logits,
                    dim=-1,
                )
                .squeeze(0)
                .cpu()
                .tolist()
            )

        raw_scores = {
            label.value: round(score, 6)
            for label, score in zip(
                LABEL_ORDER,
                probabilities,
            )
        }

        best_index = max(
            range(len(probabilities)),
            key=lambda i: probabilities[i],
        )

        return ClassificationResult(
            risk_level=LABEL_ORDER[best_index],
            confidence=round(
                probabilities[best_index],
                6,
            ),
            raw_scores=raw_scores,
        )

    # ---------------------------------------------------------------

    def classify_batch(
        self,
        clauses: list[str],
    ) -> list[ClassificationResult]:
        """
        Classify multiple clauses.
        """

        if not clauses:
            return []

        return [
            self.classify(clause)
            for clause in clauses
        ]


# -------------------------------------------------------------------
# Singleton Factory
# -------------------------------------------------------------------

@lru_cache(maxsize=1)
def get_classifier() -> ClauseClassifier:
    """
    Returns a singleton classifier instance.
    """

    return ClauseClassifier()


# -------------------------------------------------------------------
# Example Usage
# -------------------------------------------------------------------

if __name__ == "__main__":

    classifier = get_classifier()

    clause = """
    The supplier shall indemnify and hold harmless
    the customer against all liabilities,
    claims, damages, and expenses.
    """

    result = classifier.classify(clause)

    print("\nPrediction")
    print("----------------------------")
    print("Risk Level :", result.risk_level.value)
    print("Confidence :", result.confidence)
    print("Raw Scores :", result.raw_scores)