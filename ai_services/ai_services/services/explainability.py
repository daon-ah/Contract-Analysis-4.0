import logging
from dataclasses import dataclass
from functools import lru_cache
from typing import List

import numpy as np
import shap

from ai_services.services.classifier import (
    ClauseClassifier,
    RiskLevel,
    get_classifier,
)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------
MAX_EXPLAIN_LENGTH = 1200
EXPLAINABLE_RISK_LEVELS = {
    RiskLevel.MEDIUM,
    RiskLevel.HIGH,
}

TOP_K_FEATURES = 8

KEY_DRIVER_THRESHOLD = 0.05

# ---------------------------------------------------------------------
# Data Models
# ---------------------------------------------------------------------

@dataclass
class ShapFeature:
    token: str
    weight: float
    is_key_driver: bool


@dataclass
class ShapSummary:
    base_value: float
    predicted_value: float
    top_features: List[ShapFeature]
    risk_reasons: List[str]


# ---------------------------------------------------------------------
# SHAP Cache
# ---------------------------------------------------------------------

_explainer_cache: dict[int, shap.Explainer] = {}

# ---------------------------------------------------------------------
# Prediction Function
# ---------------------------------------------------------------------


def _predict_proba_fn(classifier: ClauseClassifier):
    """
    Converts classifier predictions into probability vectors
    suitable for SHAP.

    SHAP's Text masker reconstructs masked variants by rejoining
    word-piece tokens with spaces. That rejoin is not a clean
    round-trip (e.g. "##ing" continuations), so a variant can
    re-expand past the model's token budget even when the original
    clause was truncated up front. Truncation is therefore enforced
    here, on every variant, right before inference.
    """

    def _truncate(text: str) -> str:
        ids = classifier._tokenizer(
            text, truncation=True, max_length=512
        )["input_ids"]
        return classifier._tokenizer.decode(ids, skip_special_tokens=True)

    def _predict(texts: list[str]) -> np.ndarray:

        safe_texts = [_truncate(str(t)) for t in texts]

        results = classifier.classify_batch(safe_texts)

        return np.array(
            [
                [
                    result.raw_scores[RiskLevel.LOW.value],
                    result.raw_scores[RiskLevel.MEDIUM.value],
                    result.raw_scores[RiskLevel.HIGH.value],
                ]
                for result in results
            ]
        )

    return _predict


# ---------------------------------------------------------------------
# SHAP Explainer
# ---------------------------------------------------------------------


def _get_explainer(
    classifier: ClauseClassifier,
) -> shap.Explainer:
    """
    Loads SHAP explainer only once.
    """

    cache_key = id(classifier)

    if cache_key not in _explainer_cache:

        logger.info("Initializing SHAP explainer...")

        masker = shap.maskers.Text(
            tokenizer=classifier._tokenizer.tokenize
        )

        _explainer_cache[cache_key] = shap.Explainer(
            _predict_proba_fn(classifier),
            masker,
        )

    return _explainer_cache[cache_key]


# ---------------------------------------------------------------------
# Explain Clause
# ---------------------------------------------------------------------


def explain_clause(
    clause_text: str,
    risk_level: RiskLevel,
) -> ShapSummary | None:
    """
    Generate SHAP explanation for a clause.

    Low-risk clauses are skipped to reduce
    computational cost.
    """

    if not clause_text.strip():
        raise ValueError("Clause text cannot be empty.")

    if risk_level not in EXPLAINABLE_RISK_LEVELS:
        return None

    classifier = get_classifier()
    
    encoding = classifier._tokenizer(
        clause_text,
        truncation=True,
        max_length=512,
)

    clause_text = classifier._tokenizer.decode(
        encoding["input_ids"],
        skip_special_tokens=True,
)

    explainer = _get_explainer(classifier)

    target_index = [
        RiskLevel.LOW,
        RiskLevel.MEDIUM,
        RiskLevel.HIGH,
    ].index(risk_level)

    try:

        shap_values = explainer(
            [clause_text],
            max_evals=128,
)

    except Exception:

        logger.exception(
            "Unable to compute SHAP explanation."
        )

        return ShapSummary(
            base_value=0.0,
            predicted_value=0.0,
            top_features=[],
            risk_reasons=_generate_risk_reasons(
                clause_text,
                risk_level,
            ),
        )

    tokens = shap_values.data[0]

    values = shap_values.values[0][:, target_index]

    base_value = float(
        shap_values.base_values[0][target_index]
    )

    predicted_value = float(
        base_value + values.sum()
    )

    ranked_features = sorted(
        zip(tokens, values),
        key=lambda item: abs(item[1]),
        reverse=True,
    )[:TOP_K_FEATURES]

    top_features = []

    for token, weight in ranked_features:

        token = str(token).strip()

        if not token:
            continue

        top_features.append(

            ShapFeature(
                token=token,
                weight=round(float(weight), 6),
                is_key_driver=(
                    abs(float(weight))
                    >= KEY_DRIVER_THRESHOLD
                ),
            )

        )

    return ShapSummary(
    base_value=round(base_value, 6),
    predicted_value=round(predicted_value, 6),
    top_features=top_features,
    risk_reasons=_generate_risk_reasons(
        clause_text,
        risk_level,
    ),
)


def _generate_risk_reasons(
    clause_text: str,
    risk_level: RiskLevel,
) -> list[str]:

    text = clause_text.lower()

    reasons = []

    if "indemnify" in text or "hold harmless" in text:
        reasons.append(
            "Unlimited indemnification obligation."
        )

    if "terminate" in text:
        reasons.append(
            "Contract can be terminated by one party."
        )

    if "30 day" in text or "thirty (30)" in text:
        reasons.append(
            "Short termination notice period."
        )

    if "insurance" in text:
        reasons.append(
            "Consultant must maintain insurance coverage."
        )

    if "liability" in text:
        reasons.append(
            "Potential legal liability transferred."
        )

    if "confidential" in text:
        reasons.append(
            "Contains confidentiality obligations."
        )

    if "intellectual property" in text or "copyright" in text:
        reasons.append(
            "Transfers intellectual property rights."
        )

    if "audit" in text:
        reasons.append(
            "Allows audit of contractor records."
        )

    if "payment" in text or "invoice" in text:
        reasons.append(
            "Payment obligations and invoicing requirements."
        )

    if "governing law" in text or "california" in text:
        reasons.append(
            "Governed by a specific jurisdiction."
        )

    return reasons[:5]

# ---------------------------------------------------------------------
# Utility
# ---------------------------------------------------------------------


@lru_cache(maxsize=1)
def get_explainer():
    """
    Returns the cached SHAP explainer.
    """

    classifier = get_classifier()

    return _get_explainer(classifier)


# ---------------------------------------------------------------------
# Example
# ---------------------------------------------------------------------

if __name__ == "__main__":

    classifier = get_classifier()

    clause = """
    The supplier shall indemnify and hold harmless
    the customer against all liabilities,
    claims, losses and damages.
    """

    prediction = classifier.classify(clause)

    explanation = explain_clause(
        clause,
        prediction.risk_level,
    )

    print("\nPrediction")
    print("-------------------------")
    print(prediction.risk_level)

    print("\nExplanation")
    print("-------------------------")

    if explanation:

        print("Base Value :", explanation.base_value)

        print("Prediction :", explanation.predicted_value)

        print("\nTop Features")

        for feature in explanation.top_features:

            print(
                feature.token,
                feature.weight,
                feature.is_key_driver,
            )

    else:

        print("No explanation generated.")